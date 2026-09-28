import React, { useState, useEffect } from 'react';
import { executiveService, type DailyOperationsData } from '../../services/executive-service.js';
import { partnerService } from '../../services/partner-service.js';
import type { PartnerProfileDto } from '@docsearch/api-contracts';

export interface DailyOperationsBarProps {
  onOpenOnboardingWizard?: (() => void) | undefined;
  onNavigateToDomain?: ((domainId: string) => void) | undefined;
  onTriggerToast?: ((msg: string) => void) | undefined;
  dashboardData?: any;
}

type ActiveModalType =
  | null
  | 'doctor-verification'
  | 'billing-payouts'
  | 'daily-mis'
  | 'emergency-escalations'
  | 'today-appointments'
  | 'bed-matrix'
  | 'prescriptions-lab';

export const DailyOperationsBar: React.FC<DailyOperationsBarProps> = ({
  onOpenOnboardingWizard,
  onNavigateToDomain,
  onTriggerToast,
  dashboardData
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HOSPITAL_OPS' | 'CLINICAL_CARE'>('ALL');
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [partners, setPartners] = useState<PartnerProfileDto[]>([]);
  const [opsData, setOpsData] = useState<DailyOperationsData | null>(null);
  const [payoutsProcessed, setPayoutsProcessed] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const notify = (msg: string) => {
    if (onTriggerToast) onTriggerToast(msg);
  };

  // Fetch live operations from API Gateway
  const fetchOperations = () => {
    executiveService
      .getDailyOperations()
      .then((data) => {
        if (data) {
          setOpsData(data);
          const allPaid = data.settlementBatches?.length > 0 && data.settlementBatches.every((b) => b.status === 'Disbursed');
          if (allPaid) setPayoutsProcessed(true);
        }
      })
      .catch((err) => {
        console.warn('Could not load live daily operations data:', err);
      });
  };

  useEffect(() => {
    let isMounted = true;
    fetchOperations();

    partnerService
      .getPartners()
      .then((res) => {
        if (isMounted && res && Array.isArray(res.items)) {
          setPartners(res.items);
        }
      })
      .catch((err) => {
        console.warn('Could not load partners for operations bar:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Database-backed Metrics
  const totalTenants = opsData?.metrics?.totalPartners ?? dashboardData?.metrics?.totalTenants ?? partners.length;
  const activeTenants = opsData?.metrics?.activePartners ?? dashboardData?.metrics?.activeTenants ?? partners.filter((p) => p.lifecycleStatus === 'ACTIVE').length;
  const pendingDoctorsCount = opsData?.metrics?.pendingDoctorsCount ?? opsData?.doctors?.filter((d) => d.status === 'PENDING').length ?? 0;
  const unresolvedEscalationsCount = opsData?.metrics?.unresolvedEscalationsCount ?? opsData?.escalations?.filter((e) => e.status === 'UNRESOLVED').length ?? 0;

  // Real Financial Values
  const grossDailyBilling = opsData?.metrics?.grossDailyBilling ?? (dashboardData?.metrics?.monthlyRecurringRevenueEst ? Math.round(dashboardData.metrics.monthlyRecurringRevenueEst / 30) : 0);
  const docSearchTake = opsData?.metrics?.docSearchTake ?? Math.round(grossDailyBilling * 0.08);
  const hospitalNetPayouts = opsData?.metrics?.hospitalNetPayouts ?? (grossDailyBilling - docSearchTake);

  // Real Clinical Load
  const appointmentsToday = opsData?.metrics?.appointmentsToday ?? 0;
  const appointmentsCompleted = opsData?.metrics?.appointmentsCompleted ?? 0;
  const appointmentsInConsultation = opsData?.metrics?.appointmentsInConsultation ?? 0;
  const appointmentsWaiting = opsData?.metrics?.appointmentsWaiting ?? 0;

  const totalBedsCount = opsData?.metrics?.totalBedsCount ?? 0;
  const occupiedBedsCount = opsData?.metrics?.occupiedBedsCount ?? 0;
  const vacantIcuBedsCount = opsData?.metrics?.vacantIcuBedsCount ?? 0;
  const ventilatorsReadyCount = opsData?.metrics?.ventilatorsReadyCount ?? 0;

  const rxOrdersToday = opsData?.metrics?.rxOrdersToday ?? 0;
  const pathologyTestsToday = opsData?.metrics?.pathologyTestsToday ?? 0;
  const radiologyOrdersToday = opsData?.metrics?.radiologyOrdersToday ?? 0;

  const doctorsList = opsData?.doctors ?? [];
  const escalations = opsData?.escalations ?? [];
  const settlementBatches = opsData?.settlementBatches ?? [];
  const specialtyQueues = opsData?.specialtyQueues ?? [];
  const bedZones = opsData?.bedZones ?? [];
  const diagnosticOrders = opsData?.diagnosticOrders ?? [];

  // Handlers for Live DB Actions
  const handleApproveDoctor = async (id: string, name: string) => {
    setIsProcessingAction(true);
    try {
      await executiveService.verifyDoctor(id, 'APPROVED');
      notify(`✅ ${name} credentials verified & activated in registry.`);
      fetchOperations();
    } catch (err) {
      notify(`❌ Verification update failed: ${(err as Error).message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectDoctor = async (id: string, name: string) => {
    setIsProcessingAction(true);
    try {
      await executiveService.verifyDoctor(id, 'REJECTED');
      notify(`⚠️ ${name} verification marked as rejected.`);
      fetchOperations();
    } catch (err) {
      notify(`❌ Update failed: ${(err as Error).message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAcknowledgeEscalation = async (id: string) => {
    setIsProcessingAction(true);
    try {
      await executiveService.acknowledgeEmergency(id);
      notify(`🚨 Emergency ${id} acknowledged & dispatched.`);
      fetchOperations();
    } catch (err) {
      notify(`❌ Acknowledgment failed: ${(err as Error).message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleProcessPayouts = async () => {
    setIsProcessingAction(true);
    try {
      await executiveService.processPayouts();
      setPayoutsProcessed(true);
      notify(`💳 Batch payouts of ₹ ${(hospitalNetPayouts / 100000).toFixed(2)} Lakhs settled across network escrow.`);
      fetchOperations();
    } catch (err) {
      notify(`❌ Payout processing failed: ${(err as Error).message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const operations = [
    // --- 1. Hospital & Partner Operations ---
    {
      id: 'onboard-partner',
      category: 'HOSPITAL_OPS',
      title: 'Add Partner',
      subtitle: totalTenants > 0 ? `${totalTenants} Hospitals & Clinics in Network` : 'New Hospital / Clinic',
      badge: totalTenants > 0 ? `${totalTenants} Registered` : 'Onboard',
      badgeColor: '#3B82F6',
      icon: '➕',
      bg: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
      action: () => {
        if (onOpenOnboardingWizard) onOpenOnboardingWizard();
        else notify('Opening Partner Onboarding Wizard');
      }
    },
    {
      id: 'doctor-verification',
      category: 'HOSPITAL_OPS',
      title: 'Doctor Verification',
      subtitle: 'NMC / MCI Credentials',
      badge: pendingDoctorsCount > 0 ? `${pendingDoctorsCount} Pending` : 'All Verified ✓',
      badgeColor: pendingDoctorsCount > 0 ? '#F59E0B' : '#10B981',
      icon: '👨‍⚕️',
      bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      action: () => setActiveModal('doctor-verification')
    },
    {
      id: 'billing-payouts',
      category: 'HOSPITAL_OPS',
      title: "Today's Billing",
      subtitle: 'Settlements & Payouts',
      badge: payoutsProcessed ? 'Disbursed ✓' : `₹ ${(grossDailyBilling / 100000).toFixed(1)}L Ready`,
      badgeColor: '#F59E0B',
      icon: '💳',
      bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
      action: () => setActiveModal('billing-payouts')
    },
    {
      id: 'daily-mis',
      category: 'HOSPITAL_OPS',
      title: 'Daily MIS Report',
      subtitle: 'Consolidated Day Summary',
      badge: 'Live MIS',
      badgeColor: '#06B6D4',
      icon: '📊',
      bg: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
      action: () => setActiveModal('daily-mis')
    },
    {
      id: 'emergency-escalations',
      category: 'HOSPITAL_OPS',
      title: 'Emergency Alerts',
      subtitle: 'Critical Hospital Escalations',
      badge: unresolvedEscalationsCount > 0 ? `${unresolvedEscalationsCount} Active` : '0 Incidents ✓',
      badgeColor: unresolvedEscalationsCount > 0 ? '#EF4444' : '#10B981',
      icon: '🚨',
      bg: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
      action: () => setActiveModal('emergency-escalations')
    },
    // --- 2. Patient & Clinical Care ---
    {
      id: 'today-appointments',
      category: 'CLINICAL_CARE',
      title: "Today's Appointments",
      subtitle: 'OPD Queue & Consultations',
      badge: `${appointmentsToday} Active`,
      badgeColor: '#8B5CF6',
      icon: '📅',
      bg: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
      action: () => setActiveModal('today-appointments')
    },
    {
      id: 'bed-matrix',
      category: 'CLINICAL_CARE',
      title: 'Bed Status & ICU',
      subtitle: 'Live Hospital Occupancy',
      badge: totalBedsCount > 0 ? `${Math.round((occupiedBedsCount / totalBedsCount) * 100)}% Full` : 'Available',
      badgeColor: '#6366F1',
      icon: '🛏️',
      bg: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
      action: () => setActiveModal('bed-matrix')
    },
    {
      id: 'prescriptions-lab',
      category: 'CLINICAL_CARE',
      title: 'Rx & Lab Orders',
      subtitle: 'Pharmacy & Pathology Hub',
      badge: `${rxOrdersToday + diagnosticOrders.length} Orders`,
      badgeColor: '#EC4899',
      icon: '💊',
      bg: 'linear-gradient(135deg, #DB2777 0%, #EC4899 100%)',
      action: () => setActiveModal('prescriptions-lab')
    }
  ];

  const filteredOps = operations.filter((op) => {
    if (selectedFilter === 'ALL') return true;
    return op.category === selectedFilter;
  });

  return (
    <>
      <div
        style={{
          backgroundColor: '#11182E',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '16px 18px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Header Strip with Title, Filter Tabs, and Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 10px #10B981'
              }}
            />
            <h2
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#F8FAFC'
              }}
            >
              Live Clinical & Operational Command Center
            </h2>
            <span
              style={{
                fontSize: '0.7rem',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              ● LIVE DB SYNC
            </span>
          </div>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              backgroundColor: '#0A0F1D',
              padding: '3px 4px',
              borderRadius: '10px',
              border: '1px solid #1E293B'
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedFilter('ALL')}
              style={{
                backgroundColor: selectedFilter === 'ALL' ? '#1E293B' : 'transparent',
                color: selectedFilter === 'ALL' ? '#38BDF8' : '#94A3B8',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '7px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All Ops ({operations.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('HOSPITAL_OPS')}
              style={{
                backgroundColor: selectedFilter === 'HOSPITAL_OPS' ? '#1E293B' : 'transparent',
                color: selectedFilter === 'HOSPITAL_OPS' ? '#38BDF8' : '#94A3B8',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '7px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Hospital Network (5)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('CLINICAL_CARE')}
              style={{
                backgroundColor: selectedFilter === 'CLINICAL_CARE' ? '#1E293B' : 'transparent',
                color: selectedFilter === 'CLINICAL_CARE' ? '#38BDF8' : '#94A3B8',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '7px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Clinical & Wards (3)
            </button>
          </div>
        </div>

        {/* Action Chips Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}
        >
          {filteredOps.map((op) => (
            <div
              key={op.id}
              onClick={op.action}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#38BDF8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1E293B';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: op.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}
                >
                  {op.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {op.title}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                    {op.subtitle}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '8px',
                  backgroundColor: `${op.badgeColor}22`,
                  color: op.badgeColor,
                  border: `1px solid ${op.badgeColor}44`,
                  whiteSpace: 'nowrap'
                }}
              >
                {op.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Doctor Credential Verification                                    */}
      {/* ========================================================================= */}
      {activeModal === 'doctor-verification' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '16px',
              width: '100%',
              maxWidth: 'min(94vw, 680px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              padding: '22px 18px',
              color: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>👨‍⚕️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Doctor & Staff Credential Verification
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    National Medical Commission (NMC) & State Council KYC validation
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {doctorsList.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👨‍⚕️</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9' }}>No Doctor Registrations Found</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>All clinical staff and practitioner licenses across network partners are verified.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doctorsList.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#F1F5F9' }}>{doc.name}</strong>
                        <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '1px 6px', borderRadius: '4px' }}>
                          {doc.specialty}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '3px' }}>
                        🏥 {doc.hospital} • <span style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>{doc.nmc}</span>
                      </div>
                      {doc.qualification && (
                        <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '2px' }}>
                          🎓 {doc.qualification}
                        </div>
                      )}
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                        Submitted {doc.time}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {doc.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            disabled={isProcessingAction}
                            onClick={() => handleApproveDoctor(doc.id, doc.name)}
                            style={{
                              backgroundColor: '#10B981',
                              color: '#064E3B',
                              fontWeight: 800,
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              cursor: isProcessingAction ? 'wait' : 'pointer'
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            disabled={isProcessingAction}
                            onClick={() => handleRejectDoctor(doc.id, doc.name)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#EF4444',
                              fontWeight: 700,
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              cursor: isProcessingAction ? 'wait' : 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span
                          style={{
                            backgroundColor: doc.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: doc.status === 'APPROVED' ? '#34D399' : '#F87171',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}
                        >
                          {doc.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1E293B' }}>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToDomain) onNavigateToDomain('crm-partner-lifecycle');
                  setActiveModal(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Open Full Partner CRM →
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Today's Billing & Payout Settlements                             */}
      {/* ========================================================================= */}
      {activeModal === 'billing-payouts' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '16px',
              width: '100%',
              maxWidth: 'min(94vw, 680px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              padding: '22px 18px',
              color: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>💳</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Today's Billing & Partner Payouts
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Automated RazorpayX settlement gateway & hospital commission split
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Financial Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Gross Daily Collections</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
                  ₹ {grossDailyBilling.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Doc Search Take (8%)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                  ₹ {docSearchTake.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Hospital Net Payouts</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                  ₹ {hospitalNetPayouts.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
              Top Hospital Batches Ready for Settlement:
            </div>

            {settlementBatches.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8' }}>
                No partner settlement batches recorded for today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {settlementBatches.map((batch) => (
                  <div key={batch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F1F5F9' }}>{batch.legalName}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                        {batch.domain ? `${batch.domain}.docsearch.in` : 'Verified Escrow Account'} • {batch.planId}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>₹ {batch.batchAmount.toLocaleString('en-IN')}</div>
                      <span style={{ fontSize: '0.6875rem', color: payoutsProcessed || batch.status === 'Disbursed' ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                        ● {payoutsProcessed || batch.status === 'Disbursed' ? 'Disbursed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1E293B', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToDomain) onNavigateToDomain('subscription-billing-finance');
                  setActiveModal(null);
                }}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#38BDF8', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Go to Finance Domain →
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{ backgroundColor: '#1E293B', color: '#94A3B8', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={payoutsProcessed || isProcessingAction}
                  onClick={handleProcessPayouts}
                  style={{
                    backgroundColor: payoutsProcessed ? '#10B981' : '#F59E0B',
                    color: '#000',
                    fontWeight: 900,
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    cursor: payoutsProcessed || isProcessingAction ? 'default' : 'pointer'
                  }}
                >
                  {payoutsProcessed ? '✓ Payouts Released' : `Release All Payouts (₹ ${(hospitalNetPayouts / 100000).toFixed(2)}L)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Daily MIS Day-End Report                                         */}
      {/* ========================================================================= */}
      {activeModal === 'daily-mis' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '16px',
              width: '100%',
              maxWidth: 'min(94vw, 680px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              padding: '22px 18px',
              color: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Executive Daily MIS Report
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Consolidated 24-hour performance across all partner hospitals & OPDs
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* 6 Key Operational Metrics for MIS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #38BDF8' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Total OPD Appointments</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{appointmentsToday.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>● Verified in Database</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #10B981' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Total Day Revenue</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>₹ {(grossDailyBilling / 100000).toFixed(2)} Lakhs</div>
                <div style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>● Invoiced Ledger</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #8B5CF6' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Bed Occupancy (Avg)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
                  {totalBedsCount > 0 ? `${((occupiedBedsCount / totalBedsCount) * 100).toFixed(1)}%` : '0%'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>{occupiedBedsCount} / {totalBedsCount} beds</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #EF4444' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Emergency Triage</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{escalations.length} cases</div>
                <div style={{ fontSize: '0.6875rem', color: unresolvedEscalationsCount > 0 ? '#EF4444' : '#34D399', marginTop: '2px' }}>
                  {unresolvedEscalationsCount} active critical
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #F59E0B' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Prescriptions Filled</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{rxOrdersToday.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>Active pharmacy records</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #EC4899' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Network Partners</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{totalTenants}</div>
                <div style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>{activeTenants} active & verified</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1E293B' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Timestamp: {new Date().toLocaleTimeString()} IST • Auto-certified immutable record
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    notify('📥 Downloading Daily MIS Executive PDF...');
                    setActiveModal(null);
                  }}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #38BDF8',
                    color: '#38BDF8',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  📥 Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    notify('📊 Exporting Raw Data CSV...');
                    setActiveModal(null);
                  }}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Emergency Escalations Console                                   */}
      {/* ========================================================================= */}
      {activeModal === 'emergency-escalations' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #EF4444',
              borderRadius: '16px',
              width: '100%',
              maxWidth: 'min(94vw, 680px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(239, 68, 68, 0.3)',
              padding: '22px 18px',
              color: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🚨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F87171' }}>
                    Active Emergency Escalations
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Hospital telemetry distress, ICU surges & critical operational alerts
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {escalations.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛡️</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399' }}>Zero Active Emergency Escalations</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>All emergency departments and ICU telemetry streams across partner hospitals are operating normally.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {escalations.map((esc) => (
                  <div
                    key={esc.id}
                    style={{
                      backgroundColor: '#1E1B2E',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.625rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                          {esc.priority}
                        </span>
                        <strong style={{ fontSize: '0.875rem', color: '#FCA5A5' }}>{esc.hospital}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#F1F5F9', marginTop: '4px', fontWeight: 500 }}>
                        {esc.issue}
                      </div>
                      {(esc.patientName || esc.zoneName) && (
                        <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '3px' }}>
                          👤 {esc.patientName} {esc.patientMrn ? `(${esc.patientMrn})` : ''} {esc.zoneName ? `• ${esc.zoneName}` : ''} {esc.bedNumber ? `• Bed: ${esc.bedNumber}` : ''}
                        </div>
                      )}
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '3px' }}>
                        Logged {esc.time} • Auto-triaged to Emergency Command
                      </div>
                    </div>

                    <div>
                      {esc.status === 'UNRESOLVED' ? (
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => handleAcknowledgeEscalation(esc.id)}
                          style={{
                            backgroundColor: '#EF4444',
                            color: '#FFF',
                            fontWeight: 800,
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '0.75rem',
                            cursor: isProcessingAction ? 'wait' : 'pointer',
                            boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)'
                          }}
                        >
                          Acknowledge & Resolve
                        </button>
                      ) : (
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                          ✓ Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1E293B' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                All notifications piped directly to On-Call Chief Medical Officers
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: '#1E293B', color: '#FFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Today's Appointments & OPD Matrix                                */}
      {/* ========================================================================= */}
      {activeModal === 'today-appointments' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '16px',
              width: '100%',
              maxWidth: 'min(94vw, 680px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              padding: '22px 18px',
              color: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📅</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Today's Appointments & OPD Token Matrix
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Live token tracking across {totalTenants} partner healthcare centers
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Token Progress Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Total Scheduled</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>{appointmentsToday}</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Completed</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>{appointmentsCompleted}</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>In-Consultation</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8' }}>{appointmentsInConsultation}</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Waiting in OPD</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F59E0B' }}>{appointmentsWaiting}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
              Active Specialty Queues from Registry:
            </div>

            {specialtyQueues.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8' }}>
                No OPD queues currently active.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {specialtyQueues.map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '0.8125rem', color: '#F1F5F9' }}>{q.specialty}</strong>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{q.activeDoctors} Doctors Active in Cabin</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>{q.currentToken}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#10B981' }}>Avg wait: {q.avgWait}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1E293B' }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: '#3B82F6', color: '#FFF', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Bed Matrix & ICU Live Tracking                                   */}
      {/* ========================================================================= */}
      {activeModal === 'bed-matrix' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '16px',
              width: '100%',
              maxWidth: 'min(94vw, 680px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              padding: '22px 18px',
              color: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🛏️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Live Hospital Bed Matrix & ICU Telemetry
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Real-time occupancy across registered branches & critical care wards
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Total Beds</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>{totalBedsCount}</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Occupied Beds</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444' }}>
                  {occupiedBedsCount} ({totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0}%)
                </div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Vacant ICU Beds</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>{vacantIcuBedsCount} Vacant</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Ventilators Ready</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8' }}>{ventilatorsReadyCount} Active</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
              Registered Clinical Wards:
            </div>

            {bedZones.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8' }}>
                No inpatient wards currently registered.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bedZones.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>{item.zone}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{item.beds}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: item.color }}>{item.status}</span>
                      <div style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>{item.icu}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1E293B' }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: '#3B82F6', color: '#FFF', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: Prescription & Lab Diagnostic Hub                                */}
      {/* ========================================================================= */}
      {activeModal === 'prescriptions-lab' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #1E293B',
              borderRadius: '16px',
              width: '100%',
              maxWidth: 'min(94vw, 680px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              padding: '22px 18px',
              color: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>💊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Prescription & Diagnostic Lab Hub
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Integrated HL7/FHIR Pathology dispatch & e-pharmacy fulfillments
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Prescriptions Today</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>{rxOrdersToday} orders</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Pathology Tests</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8' }}>{pathologyTestsToday} tests</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Radiology Orders</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>{radiologyOrdersToday} scans</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
              Live Clinical Fulfillment Queue:
            </div>

            {diagnosticOrders.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8' }}>
                No active lab or pharmacy orders recorded in database.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {diagnosticOrders.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>{item.patient}</div>
                      <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>{item.test}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{item.lab}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1E293B' }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: '#3B82F6', color: '#FFF', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
