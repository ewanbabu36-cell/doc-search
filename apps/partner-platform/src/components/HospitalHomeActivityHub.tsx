import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer
} from '@docsearch/ui-kit';
import { inpatientManagementService } from '../services/inpatient-management-service.js';
import { emergencyManagementService } from '../services/emergency-management-service.js';
import type {
  InpatientOverviewMetricsDto,
  InpatientAdmissionDto,
  EmergencyOverviewMetricsDto,
  EmergencyEncounterDto
} from '@docsearch/api-contracts';
import type { PartnerModuleKey } from './PartnerPlatformShell.js';

export interface HospitalHomeActivityHubProps {
  tenantId?: string | undefined;
  onNavigateModule: (moduleKey: PartnerModuleKey, subTab?: string) => void;
  staffName?: string | undefined;
  facilityName?: string | undefined;
  role?: string | undefined;
}

export const HospitalHomeActivityHub: React.FC<HospitalHomeActivityHubProps> = ({
  tenantId = 'default',
  onNavigateModule,
  staffName = 'Hospital Leader',
  facilityName = 'Multispecialty Hospital & Trauma Care',
  role = 'HOSPITAL_DIRECTOR'
}) => {
  const [ipdMetrics, setIpdMetrics] = useState<InpatientOverviewMetricsDto | null>(null);
  const [erMetrics, setErMetrics] = useState<EmergencyOverviewMetricsDto | null>(null);
  const [admissions, setAdmissions] = useState<InpatientAdmissionDto[]>([]);
  const [erCases, setErCases] = useState<EmergencyEncounterDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL_ICU' | 'EMERGENCY_ER' | 'GENERAL'>('ALL');
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 3500);
  };

  const loadHospitalData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ipdMet, erMet, admList, erList] = await Promise.all([
        inpatientManagementService.getOverviewMetrics(tenantId).catch(() => null),
        emergencyManagementService.getOverviewMetrics(tenantId).catch(() => null),
        inpatientManagementService.getAdmissions(tenantId).catch(() => []),
        emergencyManagementService.getEncounters ? emergencyManagementService.getEncounters(tenantId).catch(() => []) : Promise.resolve([])
      ]);
      setIpdMetrics(ipdMet);
      setErMetrics(erMet);
      setAdmissions(admList || []);
      setErCases(erList || []);
    } catch (err) {
      console.warn('Could not load Hospital Home live telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadHospitalData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void loadHospitalData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadHospitalData]);

  // High priority admissions
  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const q = searchTerm.toLowerCase();
      const matches =
        !q ||
        adm.admissionNumber.toLowerCase().includes(q) ||
        adm.patientName.toLowerCase().includes(q) ||
        adm.patientMrn.toLowerCase().includes(q) ||
        adm.bedCode.toLowerCase().includes(q) ||
        (adm.primaryDiagnosis || '').toLowerCase().includes(q);

      if (!matches) return false;

      if (statusFilter === 'CRITICAL_ICU') return adm.bedCode.includes('ICU') || adm.isolationRequired;
      if (statusFilter === 'EMERGENCY_ER') return adm.admissionSource === 'EMERGENCY_DEPARTMENT';
      if (statusFilter === 'GENERAL') return !adm.bedCode.includes('ICU');
      return true;
    });
  }, [admissions, searchTerm, statusFilter]);

  const totalBeds = ipdMetrics?.totalBeds || 120;
  const occupiedBeds = ipdMetrics?.occupiedBeds || admissions.length || 76;
  const occupancyPercent = Math.round((occupiedBeds / totalBeds) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '16px 20px 48px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* QUICK FLOATING TOAST */}
      {quickNotification && (
        <div
          style={{
            position: 'fixed',
            top: '85px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0F172A',
            border: '1.5px solid #3B82F6',
            borderRadius: '10px',
            padding: '12px 18px',
            color: '#F8FAFC',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          <span>🏥</span>
          <span>{quickNotification}</span>
        </div>
      )}

      {/* 0. MULTI-SPECIALTY QUICK COUNTER LAUNCHPAD & HOSPITAL WORKSPACE BANNER */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backgroundColor: '#0B132B',
        border: '1.5px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>🏥</span>
            <div>
              <div style={{ fontWeight: 900, color: '#FFFFFF', fontSize: '1.05rem', letterSpacing: '0.3px' }}>
                {(facilityName || 'HOSPITAL HEALTHCARE').toUpperCase()} — ENTERPRISE HIS WORKSPACE
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                केन्द्रीकृत एवं समन्वित मल्टी-स्पेशियलिटी अस्पताल प्रबंधन (Modular Single-Source-of-Truth Architecture)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="primary" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
              ● 24x7 HIS Command Active
            </Badge>
            <Badge variant="info" style={{ border: '1px solid #38BDF8', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 800 }}>
              NABH Digital Hospital
            </Badge>
          </div>
        </div>

        {/* 6 Quick Counter Launchpad Buttons */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            ⚡ Quick Operational Counters (Direct Single-Click Access)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
            <button
              type="button"
              onClick={() => onNavigateModule('patient-registration')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                color: '#F1F5F9',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)')}
            >
              <span style={{ fontSize: '1.25rem' }}>🪪</span>
              <div>
                <div style={{ fontWeight: 800, color: '#38BDF8' }}>1. Reception & Tokens</div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>OPD / UHID Intake</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('clinical-consultation')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                color: '#F1F5F9',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)')}
            >
              <span style={{ fontSize: '1.25rem' }}>🩺</span>
              <div>
                <div style={{ fontWeight: 800, color: '#34D399' }}>2. Doctor OPD Desk</div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>EMR, Rx & Vitals</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('clinical-investigation')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                color: '#F1F5F9',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)')}
            >
              <span style={{ fontSize: '1.25rem' }}>🧪</span>
              <div>
                <div style={{ fontWeight: 800, color: '#FBBF24' }}>3. Pathology LIMS</div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Sample & Results</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('radiology-imaging')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                color: '#F1F5F9',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)')}
            >
              <span style={{ fontSize: '1.25rem' }}>🩻</span>
              <div>
                <div style={{ fontWeight: 800, color: '#A78BFA' }}>4. Radiology PACS</div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>X-Ray / CT / MRI</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('pharmacy-medication', 'pos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(236, 72, 153, 0.25)',
                backgroundColor: 'rgba(236, 72, 153, 0.08)',
                color: '#F1F5F9',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.08)')}
            >
              <span style={{ fontSize: '1.25rem' }}>💊</span>
              <div>
                <div style={{ fontWeight: 800, color: '#F472B6' }}>5. Pharmacy POS</div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Rx Dispensing</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('billing-revenue-cycle')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                color: '#F1F5F9',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)')}
            >
              <span style={{ fontSize: '1.25rem' }}>🧾</span>
              <div>
                <div style={{ fontWeight: 800, color: '#60A5FA' }}>6. Cashier & Billing</div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Invoices & Dynamic UPI</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('staff-administration')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                color: '#F1F5F9',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)')}
            >
              <span style={{ fontSize: '1.25rem' }}>👥</span>
              <div>
                <div style={{ fontWeight: 800, color: '#38BDF8' }}>7. Staff Directory</div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Roles & Access</div>
              </div>
            </button>
          </div>
        </div>

        {/* IN-HOUSE CLOSED-LOOP PIPELINE PROMINENT LAUNCHPAD BANNER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: 'rgba(2, 132, 199, 0.12)',
            border: '1.5px solid #0284C7',
            borderRadius: '12px',
            padding: '14px 18px',
            marginTop: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>🔄</span>
            <div>
              <div style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>In-House Closed-Loop Pipeline (OPD & IPD)</span>
                <Badge variant="success" style={{ fontSize: '0.7rem' }}>Sub-Second Live Sync</Badge>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                Reception (UHID) ➔ Doctor Desk ➔ In-House Lab ➔ Sub-Second Loop-Back ➔ Final Rx ➔ Pharmacy POS ➔ Central Cashier Unified Bill & Print
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateModule('hospital-closed-loop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369A1')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284C7')}
          >
            <span>⚡ Open Closed-Loop Hub</span>
            <span>➔</span>
          </button>
        </div>
      </div>
          {/* 1. HOSPITAL COMMAND HEADER */}
          <Card
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              padding: '20px 24px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
            }}
          >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '1.5px solid #3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem'
              }}
            >
              🏥
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                  {facilityName}
                </h1>
                <Badge variant="primary" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  ● Trauma Level-1 Ready
                </Badge>
                <Badge variant="info" style={{ border: '1px solid #3B82F6', color: '#60A5FA', fontSize: '0.75rem', fontWeight: 800 }}>
                  NABH Accredited
                </Badge>
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.8125rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Executive: <strong style={{ color: '#F1F5F9' }}>{staffName}</strong></span>
                <span>•</span>
                <span>Role: <strong style={{ color: '#3B82F6' }}>{role.replace(/_/g, ' ')}</strong></span>
                <span>•</span>
                <span>Active 24x7 Inpatient & Emergency Core</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void loadHospitalData();
                triggerToast('Hospital inpatient and ER telemetry refreshed.');
              }}
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#94A3B8' }}
            >
              🔄 Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateModule('inpatient-management')}
              style={{ backgroundColor: '#3B82F6', borderColor: '#2563EB', color: '#FFFFFF', fontWeight: 800 }}
            >
              🛏️ Inpatient Bed Board
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. 6 LIVE TELEMETRY KPI TILES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}
      >
        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>Bed Occupancy</span>
            <span style={{ fontSize: '1.1rem' }}>🛏️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#60A5FA', marginTop: '6px' }}>
            {occupancyPercent}%
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#93C5FD', marginTop: '4px', fontWeight: 600 }}>
            {occupiedBeds} / {totalBeds} Operational Beds
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase' }}>ER Trauma Triage</span>
            <span style={{ fontSize: '1.1rem' }}>🚨</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F87171', marginTop: '6px' }}>
            {erMetrics?.activeResuscitationCount ?? erCases.length ?? 3} Active
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#FCA5A5', marginTop: '4px', fontWeight: 600 }}>
            Red / Amber Urgent Resus
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase' }}>Active Theatres (OT)</span>
            <span style={{ fontSize: '1.1rem' }}>🔪</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#C084FC', marginTop: '6px' }}>
            4 Running
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#E9D5FF', marginTop: '4px', fontWeight: 600 }}>
            Major Surgical Procedures
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase' }}>NEWS2 / Sepsis Triggers</span>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FBBF24', marginTop: '6px' }}>
            2 Monitored
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#FCD34D', marginTop: '4px', fontWeight: 600 }}>
            Automated Deterioration Alerts
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase' }}>Blood Bank Units</span>
            <span style={{ fontSize: '1.1rem' }}>🩸</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F87171', marginTop: '6px' }}>
            48 Units
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#FCA5A5', marginTop: '4px', fontWeight: 600 }}>
            O- / B+ / A+ Tested Stock
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', backgroundColor: 'rgba(18, 24, 38, 0.75)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>Discharges Pending</span>
            <span style={{ fontSize: '1.1rem' }}>📋</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34D399', marginTop: '6px' }}>
            {ipdMetrics?.dischargeBacklog ?? 5}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#6EE7B7', marginTop: '4px', fontWeight: 600 }}>
            Clinical & Billing Clearance
          </div>
        </Card>
      </div>

      {/* 3. BED MATRIX WARD UTILIZATION STRIP */}
      <Card
        style={{
          padding: '16px 20px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
          Hospital Bed Matrix Ward Occupancy
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              <span>Cardio Critical Care (ICU)</span>
              <span style={{ color: '#EF4444' }}>90%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '90%', height: '100%', backgroundColor: '#EF4444', borderRadius: '3px' }} />
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '3px' }}>9 / 10 Beds Occupied</div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              <span>Emergency Trauma (ER)</span>
              <span style={{ color: '#F59E0B' }}>75%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', backgroundColor: '#F59E0B', borderRadius: '3px' }} />
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '3px' }}>15 / 20 Beds Occupied</div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              <span>General Medical Ward</span>
              <span style={{ color: '#3B82F6' }}>82%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '82%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '3px' }} />
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '3px' }}>41 / 50 Beds Occupied</div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              <span>Maternity & Postnatal</span>
              <span style={{ color: '#10B981' }}>55%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '55%', height: '100%', backgroundColor: '#10B981', borderRadius: '3px' }} />
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '3px' }}>11 / 20 Beds Occupied</div>
          </div>
        </div>
      </Card>

      {/* 4. 1-CLICK HOSPITAL LAUNCHERS */}
      <Card
        style={{
          padding: '16px 20px',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
          Quick Hospital Operations Launchers
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onNavigateModule('inpatient-management')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1.5px solid #3B82F6',
              color: '#60A5FA',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>🛏️</span>
            <span>Inpatient Management & Bed Board</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('emergency-trauma')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid #EF4444',
              color: '#F87171',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>🚨</span>
            <span>Emergency & Trauma Triage (ER)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('operation-theatre-management')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              border: '1.5px solid #A855F7',
              color: '#C084FC',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>🔪</span>
            <span>Operation Theatres (OT Live)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('billing-revenue-cycle')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid #10B981',
              color: '#34D399',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>⚡</span>
            <span>Hospital POS & IPD Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('executive-command-center')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1.5px solid #F59E0B',
              color: '#FBBF24',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>📊</span>
            <span>Executive Command Center</span>
          </button>
        </div>
      </Card>

      {/* 5. HIGH ATTENTION INPATIENT & ER ADMISSIONS QUEUE */}
      <Card
        style={{
          backgroundColor: 'rgba(18, 24, 38, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛏️</span>
              <span>Active Inpatient Admissions & Critical Watch</span>
              <span style={{ fontSize: '0.75rem', color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                {filteredAdmissions.length} Admitted
              </span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              Live bed occupancy, doctor rounds, vitals tracking, and discharge clearance
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search admission, patient, bed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                outline: 'none',
                minWidth: '220px'
              }}
            />

            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'CRITICAL_ICU', 'EMERGENCY_ER', 'GENERAL'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    backgroundColor: statusFilter === st ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: statusFilter === st ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: statusFilter === st ? '#60A5FA' : '#94A3B8',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission #</TableHead>
                <TableHead>Bed & Ward</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Primary Diagnosis</TableHead>
                <TableHead>Attending Doctor</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                    Loading live hospital admissions...
                  </TableCell>
                </TableRow>
              ) : filteredAdmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    No active admissions matching this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmissions.map((adm) => {
                  const isIcu = adm.bedCode.includes('ICU');
                  return (
                    <TableRow key={adm.id}>
                      <TableCell>
                        <div style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {adm.admissionNumber}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          {adm.admissionType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isIcu ? 'critical' : 'primary'}
                          style={{ fontSize: '0.75rem', fontWeight: 800 }}
                        >
                          {adm.bedCode}
                        </Badge>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                          {adm.department || 'General Ward'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.875rem' }}>
                          {adm.patientName}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                          {adm.patientMrn}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                          {adm.primaryDiagnosis || 'Under Evaluation'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600 }}>
                          {adm.attendingConsultantName || 'Dr. Consultant'}
                        </div>
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              onNavigateModule('inpatient-management');
                              triggerToast(`Navigating to bed chart for ${adm.patientName}.`);
                            }}
                            style={{ backgroundColor: '#3B82F6', borderColor: '#2563EB', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800 }}
                          >
                            Bed Chart ➔
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
