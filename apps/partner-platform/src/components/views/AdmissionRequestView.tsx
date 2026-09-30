import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@docsearch/ui-kit';
import type { InpatientAdmissionRequestDto } from '@docsearch/api-contracts';

export interface AdmissionRequestViewProps {
  requests: InpatientAdmissionRequestDto[];
  onOpenCreateRequest: () => void;
  onOpenApprove: (req: InpatientAdmissionRequestDto) => void;
  onOpenReject: (req: InpatientAdmissionRequestDto) => void;
  onOpenCancel: (req: InpatientAdmissionRequestDto) => void;
}

export const AdmissionRequestView: React.FC<AdmissionRequestViewProps> = ({
  requests = [],
  onOpenCreateRequest,
  onOpenApprove,
  onOpenReject,
  onOpenCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const safeRequests = Array.isArray(requests) ? requests : [];

  const filtered = safeRequests.filter((r) => {
    if (!r) return false;
    const term = (searchTerm || '').toLowerCase();
    const reqNum = (r.requestNumber || '').toLowerCase();
    const name = (r.patientName || '').toLowerCase();
    const mrn = (r.patientMrn || '').toLowerCase();
    const doc = (r.admittingDoctorName || '').toLowerCase();
    return reqNum.includes(term) || name.includes(term) || mrn.includes(term) || doc.includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
            Inpatient Admission Requests & Triage
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Authorizing incoming admissions originating from OPD, Emergency, and External Transfers.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateRequest}>+ New Admission Request</Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by patient, MRN, doctor, or request number..." />
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Request #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient & MRN</th>
                <th style={{ padding: '0.75rem 1rem' }}>Admitting Doctor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Requested Ward / Bed</th>
                <th style={{ padding: '0.75rem 1rem' }}>Diagnosis & Reason</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{req.requestNumber}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{req.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.patientMrn}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{req.admittingDoctorName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{req.requestedWardType} ({req.requestedBedClass})</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569', maxWidth: '280px' }}>{req.provisionalDiagnosis}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={req.status === 'APPROVED' || req.status === 'ADMITTED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'}>
                      {req.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={activeActionId === req.id}
                          isLoading={activeActionId === req.id}
                          onClick={() => {
                            setActiveActionId(req.id);
                            onOpenApprove(req);
                            setTimeout(() => setActiveActionId(null), 1000);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={activeActionId === req.id}
                          onClick={() => {
                            setActiveActionId(req.id);
                            onOpenReject(req);
                            setTimeout(() => setActiveActionId(null), 1000);
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={activeActionId === req.id}
                          onClick={() => {
                            setActiveActionId(req.id);
                            onOpenCancel(req);
                            setTimeout(() => setActiveActionId(null), 1000);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Processed</span>
                    )}
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