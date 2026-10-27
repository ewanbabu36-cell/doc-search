import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  BillingServiceCatalogDto,
  BillingPriceListDto
} from '@docsearch/api-contracts';
import { apiRequest } from '../../services/api-client.js';

export interface PricingCatalogViewProps {
  services: BillingServiceCatalogDto[];
  priceLists: BillingPriceListDto[];
  onOpenCreateService: () => void;
  onOpenCreatePriceList: () => void;
}

interface DoctorFeeMatrixItem {
  id: string;
  doctorName: string;
  specialty: string;
  seniority: 'HOD' | 'SENIOR_CONSULTANT' | 'CONSULTANT' | 'JUNIOR_RESIDENT';
  chamber: string;
  baseFee: number;
  followUpDays: number;
  isEmergencySurchargeActive: boolean;
  emergencyFee: number;
}

interface SurgeryPackageBundle {
  packageCode: string;
  packageName: string;
  specialty: string;
  totalPackagePrice: number;
  otAnesthesiaComponent: number;
  surgeonFeeComponent: number;
  consumablesCap: number;
  includedBedDays: number;
  bedType: string;
  extraDayBedRate: number;
  isActive: boolean;
}

export const PricingCatalogView: React.FC<PricingCatalogViewProps> = ({
  services,
  priceLists: initialPriceLists,
  onOpenCreateService,
  onOpenCreatePriceList
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'TARIFF_SCHEDULES' | 'DOCTOR_FEE_MATRIX' | 'SURGICAL_PACKAGES' | 'MASTER_CATALOG'>('TARIFF_SCHEDULES');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Live Multi-Payer Schedules
  const [priceLists, setPriceLists] = useState<BillingPriceListDto[]>(initialPriceLists);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [multiplierInput, setMultiplierInput] = useState<string>('15');
  const [multiplierReason] = useState<string>('Annual corporate TPA tariff revision');
  const [isApplyingMultiplier, setIsApplyingMultiplier] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Doctor OPD Fee Matrix State
  const [doctorFees, setDoctorFees] = useState<DoctorFeeMatrixItem[]>([
    {
      id: 'doc-fee-01',
      doctorName: 'Dr. Ewan Babu',
      specialty: 'Internal Medicine',
      seniority: 'HOD',
      chamber: 'Chamber 1',
      baseFee: 1000,
      followUpDays: 14,
      isEmergencySurchargeActive: true,
      emergencyFee: 1500
    },
    {
      id: 'doc-fee-02',
      doctorName: 'Dr. Sarah Mukherjee',
      specialty: 'Cardiology',
      seniority: 'SENIOR_CONSULTANT',
      chamber: 'Chamber 4 (Cath-Lab Wing)',
      baseFee: 1200,
      followUpDays: 14,
      isEmergencySurchargeActive: true,
      emergencyFee: 1800
    },
    {
      id: 'doc-fee-03',
      doctorName: 'Dr. Rajesh Nair',
      specialty: 'General Surgery & Laparoscopy',
      seniority: 'SENIOR_CONSULTANT',
      chamber: 'Chamber 2',
      baseFee: 800,
      followUpDays: 10,
      isEmergencySurchargeActive: true,
      emergencyFee: 1200
    },
    {
      id: 'doc-fee-04',
      doctorName: 'Dr. Ananya Sharma',
      specialty: 'Pediatrics & Neonatology',
      seniority: 'CONSULTANT',
      chamber: 'Chamber 6 (NICU Care)',
      baseFee: 600,
      followUpDays: 7,
      isEmergencySurchargeActive: false,
      emergencyFee: 600
    },
    {
      id: 'doc-fee-05',
      doctorName: 'Dr. Vikram Sethi',
      specialty: 'Orthopedics & Joint Care',
      seniority: 'CONSULTANT',
      chamber: 'Chamber 3',
      baseFee: 700,
      followUpDays: 14,
      isEmergencySurchargeActive: true,
      emergencyFee: 1050
    },
    {
      id: 'doc-fee-06',
      doctorName: 'Dr. Farhan Ali',
      specialty: 'Emergency Medicine',
      seniority: 'JUNIOR_RESIDENT',
      chamber: 'Triage Desk',
      baseFee: 400,
      followUpDays: 5,
      isEmergencySurchargeActive: true,
      emergencyFee: 600
    }
  ]);

  // Surgical Package Bundles
  const [surgicalPackages] = useState<SurgeryPackageBundle[]>([
    {
      packageCode: 'PKG-LAP-CHOLE',
      packageName: 'Laparoscopic Cholecystectomy (Gallbladder)',
      specialty: 'General Surgery',
      totalPackagePrice: 48000,
      otAnesthesiaComponent: 18000,
      surgeonFeeComponent: 16000,
      consumablesCap: 8000,
      includedBedDays: 2,
      bedType: 'DELUXE_TWIN',
      extraDayBedRate: 3500,
      isActive: true
    },
    {
      packageCode: 'PKG-TKR-UNI',
      packageName: 'Total Knee Replacement (Unilateral TKR)',
      specialty: 'Orthopedics',
      totalPackagePrice: 165000,
      otAnesthesiaComponent: 45000,
      surgeonFeeComponent: 55000,
      consumablesCap: 40000,
      includedBedDays: 4,
      bedType: 'ICU_STEPDOWN',
      extraDayBedRate: 5000,
      isActive: true
    },
    {
      packageCode: 'PKG-LSCS-DELIV',
      packageName: 'Lower Segment Cesarean Section (LSCS Delivery)',
      specialty: 'Obstetrics & Gynecology',
      totalPackagePrice: 42000,
      otAnesthesiaComponent: 14000,
      surgeonFeeComponent: 16000,
      consumablesCap: 6000,
      includedBedDays: 3,
      bedType: 'MATERNITY_SUITE',
      extraDayBedRate: 3000,
      isActive: true
    },
    {
      packageCode: 'PKG-COR-ANGIO',
      packageName: 'Coronary Angiography (Daycare Radial/Femoral)',
      specialty: 'Interventional Cardiology',
      totalPackagePrice: 18500,
      otAnesthesiaComponent: 9500,
      surgeonFeeComponent: 6000,
      consumablesCap: 3000,
      includedBedDays: 1,
      bedType: 'DAYCARE_CATHLAB',
      extraDayBedRate: 4000,
      isActive: true
    }
  ]);

  // Load live multi-payer tariff schedules from API
  useEffect(() => {
    let isMounted = true;
    const fetchSchedules = async () => {
      try {
        const res = await apiRequest<BillingPriceListDto[]>('/api/v1/partner/billing/price-lists');
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setPriceLists(res.data);
          setSelectedScheduleId(res.data[0]?.id || '');
        }
      } catch (err) {
        // Retain initial price lists
      }
    };
    void fetchSchedules();
    return () => { isMounted = false; };
  }, []);

  // Handle Multiplier Application
  const handleApplyMultiplier = async () => {
    if (!selectedScheduleId) return;
    setIsApplyingMultiplier(true);
    setStatusMessage(null);
    try {
      const multVal = parseFloat(multiplierInput);
      if (isNaN(multVal)) throw new Error('Invalid percentage multiplier value');

      const res = await apiRequest<BillingPriceListDto>(
        `/api/v1/partner/billing/price-lists/${selectedScheduleId}/multiplier`,
        {
          method: 'POST',
          body: JSON.stringify({
            multiplierPct: multVal,
            reason: multiplierReason
          })
        }
      );

      if (res.success && res.data) {
        setPriceLists((prev) => prev.map((pl) => (pl.id === selectedScheduleId ? ({ ...(pl as any), metadata: ((res.data as any) || {}).metadata } as any) : pl)));
        setStatusMessage({
          text: `Successfully updated tariff multiplier to ${multVal > 0 ? '+' : ''}${multVal}% for schedule: ${(res.data as any)?.name || 'TPA'}`,
          type: 'success'
        });
      } else {
        throw new Error('Server returned unacknowledged multiplier status');
      }
    } catch (err: any) {
      setStatusMessage({
        text: err?.message || 'Failed to update tariff multiplier in PostgreSQL',
        type: 'error'
      });
    } finally {
      setIsApplyingMultiplier(false);
    }
  };

  // Toggle Doctor Emergency Night Surcharge
  const handleToggleEmergencySurge = async (docId: string) => {
    setDoctorFees((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const nextSurge = !d.isEmergencySurchargeActive;
          return {
            ...d,
            isEmergencySurchargeActive: nextSurge,
            emergencyFee: nextSurge ? Math.round(d.baseFee * 1.5) : d.baseFee
          };
        }
        return d;
      })
    );

    const doc = doctorFees.find((d) => d.id === docId);
    if (doc) {
      try {
        await apiRequest('/api/v1/partner/billing/fee-matrix', {
          method: 'POST',
          body: JSON.stringify({
            doctorId: doc.id,
            doctorName: doc.doctorName,
            specialtyCode: doc.specialty,
            seniorityLevel: doc.seniority,
            baseFeeAmount: doc.baseFee,
            isEmergencySurchargeActive: !doc.isEmergencySurchargeActive,
            followUpValidityDays: doc.followUpDays
          })
        });
      } catch {}
    }
  };

  const filteredServices = services.filter((s) => {
    if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchCode = s.serviceCode.toLowerCase().includes(lower);
      const matchName = s.serviceName.toLowerCase().includes(lower);
      const matchDept = s.department && s.department.toLowerCase().includes(lower);
      if (!matchCode && !matchName && !matchDept) return false;
    }
    return true;
  });

  const selectedSchedule = priceLists.find((pl) => pl.id === selectedScheduleId) || priceLists[0];
  const activeMultiplier = Number(((selectedSchedule as any)?.metadata as any)?.multiplierPct || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header and Sub-Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏛️</span>
            <span>Enterprise Tariff Master & Hospital Charge Engine</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.8125rem' }}>
            Multi-payer rate schedules (Cash vs TPA vs Ayushman), doctor-wise OPD fee matrix & surgical package unbundling
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={onOpenCreatePriceList}>
            + New Payer Tariff Schedule
          </Button>
          <Button variant="primary" size="sm" onClick={onOpenCreateService}>
            + Add Billable Service
          </Button>
        </div>
      </div>

      {/* Sub-Tab Navigation Strip */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('TARIFF_SCHEDULES')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeSubTab === 'TARIFF_SCHEDULES' ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'TARIFF_SCHEDULES' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🏢</span>
          <span>Multi-Payer Tariff Schedules ({priceLists.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('DOCTOR_FEE_MATRIX')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeSubTab === 'DOCTOR_FEE_MATRIX' ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'DOCTOR_FEE_MATRIX' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🩺</span>
          <span>Doctor OPD Fee Matrix ({doctorFees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SURGICAL_PACKAGES')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeSubTab === 'SURGICAL_PACKAGES' ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'SURGICAL_PACKAGES' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🏥</span>
          <span>Surgical Package Bundles ({surgicalPackages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('MASTER_CATALOG')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeSubTab === 'MASTER_CATALOG' ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
            color: activeSubTab === 'MASTER_CATALOG' ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📋</span>
          <span>Master Billable Catalog ({filteredServices.length})</span>
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMessage.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: statusMessage.type === 'success' ? '#34D399' : '#FCA5A5',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{statusMessage.type === 'success' ? '✔' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MULTI-PAYER TARIFF SCHEDULES */}
      {/* ========================================================================= */}
      {activeSubTab === 'TARIFF_SCHEDULES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Multiplier Adjustment Cockpit */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span>
                  <span>1-Click Bulk Multiplier & Tier Override Tool</span>
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#94A3B8', fontSize: '0.75rem' }}>
                  Apply negotiated markup (+15% for TPA) or statutory cap (-20% for Ayushman PMJAY) across billable tariffs
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '220px' }}>
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#F8FAFC',
                      fontSize: '0.8125rem'
                    }}
                  >
                    {priceLists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} ({pl.priceListCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    value={multiplierInput}
                    onChange={(e) => setMultiplierInput(e.target.value)}
                    placeholder="% (+15 or -20)"
                    style={{
                      width: '90px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid #38BDF8',
                      color: '#38BDF8',
                      fontWeight: 800,
                      fontSize: '0.875rem'
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700 }}>%</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyMultiplier}
                  isLoading={isApplyingMultiplier}
                  disabled={isApplyingMultiplier}
                >
                  Apply Tariff Multiplier
                </Button>
              </div>
            </div>

            {/* Live Tariff Comparison Preview Matrix */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Live Rate Simulation for Selected Schedule: <strong style={{ color: '#38BDF8' }}>{selectedSchedule?.name}</strong> (Multiplier: {activeMultiplier > 0 ? `+${activeMultiplier}%` : `${activeMultiplier}%`})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {[
                  { name: 'OPD Doctor Consultation', base: 500 },
                  { name: 'ICU Critical Bed (Per Day)', base: 6500 },
                  { name: 'CBC Automated Hemogram', base: 450 },
                  { name: 'CT Brain Plain Scan', base: 2800 },
                  { name: 'Normal Vaginal Delivery', base: 25000 }
                ].map((item, idx) => {
                  const computed = Math.round(item.base * (1 + activeMultiplier / 100));
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', textDecoration: 'line-through' }}>₹{item.base}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: computed > item.base ? '#38BDF8' : '#34D399' }}>
                          ₹{computed.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Configured Fee Schedules Table */}
          <Card>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC' }}>
              Active Multi-Payer Tariff Master ({priceLists.length})
            </h3>
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payer Category</TableHead>
                    <TableHead>Schedule Name</TableHead>
                    <TableHead>Multiplier Policy</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Effective Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceLists.map((pl) => {
                    const mult = Number(((pl as any)?.metadata as any)?.multiplierPct || 0);
                    const payerCat = String(((pl as any)?.metadata as any)?.payerCategory || 'CASH_WALKIN');
                    return (
                      <TableRow key={pl.id}>
                        <TableCell>
                          <Badge variant={payerCat.includes('GOV') ? 'warning' : payerCat.includes('TPA') ? 'primary' : 'neutral'}>
                            {payerCat.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{pl.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{pl.priceListCode}</div>
                        </TableCell>
                        <TableCell>
                          <span
                            style={{
                              fontWeight: 800,
                              color: mult > 0 ? '#38BDF8' : mult < 0 ? '#34D399' : '#94A3B8',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: mult > 0 ? 'rgba(56, 189, 248, 0.1)' : mult < 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            {mult > 0 ? `+${mult}% TPA Markup` : mult < 0 ? `${mult}% Statutory Ceiling` : 'Standard Baseline (0%)'}
                          </span>
                        </TableCell>
                        <TableCell>{pl.currency}</TableCell>
                        <TableCell>
                          <Badge variant={pl.status === 'ACTIVE' ? 'success' : 'neutral'}>{pl.status}</Badge>
                        </TableCell>
                        <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                          {new Date(pl.effectiveFrom).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DOCTOR-WISE OPD CONSULTATION FEE MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === 'DOCTOR_FEE_MATRIX' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC' }}>
                Doctor-Wise OPD Consultation Fee Schedules & Surge Rules
              </h3>
              <p style={{ margin: '2px 0 0 0', color: '#94A3B8', fontSize: '0.75rem' }}>
                Seniority fee tiers, follow-up free validity periods & Night / Emergency Duty +50% surge surcharges
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                ⚡ Emergency Night Surge (+50%) Active on Emergency Rosters
              </span>
            </div>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinician / Doctor</TableHead>
                  <TableHead>Department & Chamber</TableHead>
                  <TableHead>Seniority Tier</TableHead>
                  <TableHead>Base OPD Fee</TableHead>
                  <TableHead>Follow-up Free Days</TableHead>
                  <TableHead>Night / Emergency Surge (+50%)</TableHead>
                  <TableHead>Emergency Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorFees.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{doc.doctorName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>{doc.specialty}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{doc.chamber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.seniority === 'HOD' ? 'danger' : doc.seniority === 'SENIOR_CONSULTANT' ? 'primary' : 'neutral'}>
                        {doc.seniority.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, color: '#F8FAFC' }}>
                      ₹{doc.baseFee.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 700 }}>
                        {doc.followUpDays} Days
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleEmergencySurge(doc.id)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: doc.isEmergencySurchargeActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          color: doc.isEmergencySurchargeActive ? '#EF4444' : '#94A3B8',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {doc.isEmergencySurchargeActive ? '⚡ Surge ON (+50%)' : 'Surge OFF'}
                      </button>
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, color: doc.isEmergencySurchargeActive ? '#EF4444' : '#94A3B8' }}>
                      ₹{doc.emergencyFee.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SURGICAL PACKAGE BUNDLING & UNBUNDLING */}
      {/* ========================================================================= */}
      {activeSubTab === 'SURGICAL_PACKAGES' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC' }}>
                Surgical Procedure Package Bundling & Extra-Day Bed Overrides
              </h3>
              <p style={{ margin: '2px 0 0 0', color: '#94A3B8', fontSize: '0.75rem' }}>
                Component unbundling (OT, Anesthesia, Surgeon fee, Bed days) with automated daily room charge overrides on extra stays
              </p>
            </div>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Code & Procedure</TableHead>
                  <TableHead>Total Package Price</TableHead>
                  <TableHead>OT Suite & Anesthesia</TableHead>
                  <TableHead>Surgeon & Team Fee</TableHead>
                  <TableHead>Consumables Cap</TableHead>
                  <TableHead>Pre-Included Bed Days</TableHead>
                  <TableHead>Extra-Day Stay Override</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surgicalPackages.map((pkg) => (
                  <TableRow key={pkg.packageCode}>
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{pkg.packageName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>
                        {pkg.packageCode} • {pkg.specialty}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38BDF8' }}>
                      ₹{pkg.totalPackagePrice.toLocaleString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                      ₹{pkg.otAnesthesiaComponent.toLocaleString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                      ₹{pkg.surgeonFeeComponent.toLocaleString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                      ₹{pkg.consumablesCap.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 700, fontSize: '0.75rem' }}>
                        {pkg.includedBedDays} Days ({pkg.bedType.replace(/_/g, ' ')})
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.78rem', color: '#FCD34D', fontWeight: 700 }}>
                        +₹{pkg.extraDayBedRate.toLocaleString()}/day
                      </span>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>After Day {pkg.includedBedDays}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MASTER BILLABLE SERVICE CATALOG */}
      {/* ========================================================================= */}
      {activeSubTab === 'MASTER_CATALOG' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filter Toolbar */}
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#CBD5E1' }}>
                  Search Billable Catalog
                </label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code, procedure name, department..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#CBD5E1' }}>
                  Service Category
                </label>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    { value: 'CONSULTATION', label: 'Consultation' },
                    { value: 'INVESTIGATION', label: 'Investigation / Lab' },
                    { value: 'PHARMACY', label: 'Pharmacy' },
                    { value: 'PROCEDURE', label: 'Procedure' },
                    { value: 'EMERGENCY', label: 'Emergency' }
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Master Service Catalog Table */}
          <Card>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC' }}>
              Master Service Catalog ({filteredServices.length})
            </h3>
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Code</TableHead>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead>Tax Status</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell style={{ fontWeight: 600 }}>{s.serviceCode}</TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 500 }}>{s.serviceName}</div>
                        {s.description && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{s.category}</Badge>
                      </TableCell>
                      <TableCell>{s.department || 'General'}</TableCell>
                      <TableCell style={{ fontWeight: 700, color: '#f8fafc' }}>
                        ₹{s.basePrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {s.taxable ? <Badge variant="warning">TAXABLE</Badge> : <Badge variant="neutral">EXEMPT</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.active ? 'success' : 'neutral'}>
                          {s.active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>
      )}
    </div>
  );
};
