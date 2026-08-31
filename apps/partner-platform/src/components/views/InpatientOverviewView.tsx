import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientOverviewMetricsDto, InpatientAdmissionDto, InpatientAdmissionRequestDto } from '@docsearch/api-contracts';

export interface InpatientOverviewViewProps {
  metrics: InpatientOverviewMetricsDto;
  admissions: InpatientAdmissionDto[];
  requests: InpatientAdmissionRequestDto[];
  onOpenCreateRequest: () => void;
  onOpenBedBoard: () => void;
  onOpenNursingStation: () => void;
  onSelectAdmission: (id: string) => void;
}

export const InpatientOverviewView: React.FC<InpatientOverviewViewProps> = ({
  metrics,
  admissions,
  requests,
  onOpenCreateRequest,
  onOpenBedBoard,
  onOpenNursingStation,
  onSelectAdmission
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Inpatient (IPD) & ADT Command Center
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Real-time inpatient census, bed capacity, admission triage, and patient flow monitoring.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onOpenNursingStation}>🩺 Nursing Station</Button>
          <Button variant="outline" onClick={onOpenBedBoard}>🛏️ Live Bed Board</Button>
          <Button variant="primary" onClick={onOpenCreateRequest}>+ Request Inpatient Admission</Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL ACTIVE INPATIENTS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0' }}>{metrics.totalInpatients}</div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{metrics.admissionsToday} admitted today</div>
        </Card>
        <Card style={{ padding: '1rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>BED OCCUPANCY RATE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', margin: '0.25rem 0' }}>{metrics.occupancyRatePercentage}%</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{metrics.availableBeds} beds available</div>
        </Card>
        <Card style={{ padding: '1rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ICU OCCUPANCY RATE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', margin: '0.25rem 0' }}>{metrics.icuOccupancyRatePercentage}%</div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Level 3 Critical Care</div>
        </Card>
        <Card style={{ padding: '1rem', borderLeft: '4px solid #ca8a04' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PENDING ADMISSIONS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ca8a04', margin: '0.25rem 0' }}>{metrics.pendingAdmissions}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Triage in progress</div>
        </Card>
        <Card style={{ padding: '1rem', borderLeft: '4px solid #9333ea' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>AVERAGE LENGTH OF STAY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#9333ea', margin: '0.25rem 0' }}>{metrics.averageLengthOfStayDays} Days</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{metrics.dischargesToday} discharged today</div>
        </Card>
      </div>

      {/* Active Patients Table */}
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Inpatient Admissions ({admissions.length})</span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Pending Requests: {requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Admission #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient & MRN</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ward & Bed</th>
                <th style={{ padding: '0.75rem 1rem' }}>Attending Consultant</th>
                <th style={{ padding: '0.75rem 1rem' }}>Primary Diagnosis</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((adm) => (
                <tr key={adm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{adm.admissionNumber}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{adm.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{adm.patientMrn} • {adm.patientAge}y {adm.patientGender}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{adm.wardName}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>Bed: {adm.bedCode}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{adm.attendingConsultantName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569', maxWidth: '300px' }}>{adm.primaryDiagnosis}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={adm.status === 'ADMITTED' ? 'success' : adm.status === 'DISCHARGE_PLANNED' ? 'warning' : 'neutral'}>
                      {adm.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Button variant="outline" size="sm" onClick={() => onSelectAdmission(adm.id)}>View Chart</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};