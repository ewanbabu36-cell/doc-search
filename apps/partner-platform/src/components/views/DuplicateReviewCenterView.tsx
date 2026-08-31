import React, { useState } from 'react';
import type {
  PatientDuplicateCandidateDto,
  PatientDto,
  ReviewDuplicatePatientRequest,
  MergePatientRequest
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { DuplicateReviewDialog } from '../dialogs/DuplicateReviewDialog.js';
import { MergePatientDialog } from '../dialogs/MergePatientDialog.js';

export interface DuplicateReviewCenterViewProps {
  candidates: PatientDuplicateCandidateDto[];
  patients: PatientDto[];
  actorId: string;
  actorRole: string;
  onReviewCandidate: (req: ReviewDuplicatePatientRequest) => Promise<void>;
  onMergePatients: (req: MergePatientRequest) => Promise<void>;
}

export const DuplicateReviewCenterView: React.FC<DuplicateReviewCenterViewProps> = ({
  candidates,
  patients,
  actorId,
  actorRole,
  onReviewCandidate,
  onMergePatients
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<PatientDuplicateCandidateDto | null>(null);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | undefined>(undefined);

  const handleOpenMergeForCandidate = (c: PatientDuplicateCandidateDto) => {
    setSelectedCandidateId(c.id);
    setIsMergeOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Duplicate Patient Review Queue
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Probabilistic MPI matching candidates requiring human adjudication before record merge or separation
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsMergeOpen(true)}>
          🔀 Merge Duplicate Records
        </Button>
      </div>

      <Alert type="warning" title="No Automatic Record Merging Policy">
        Fuzzy match detections enter this review queue. Automated algorithms never silently merge clinical identities without authorized human review and audit justification.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Confidence</TableHead>
                <TableHead>Source Candidate</TableHead>
                <TableHead>Matched Existing Patient</TableHead>
                <TableHead>Matching Signals</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero duplicate candidates pending review. Master Patient Index is healthy.
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Badge variant={c.confidenceScore >= 90 ? 'danger' : 'warning'}>
                        {c.confidenceScore}% ({c.matchCategory})
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.sourcePatientName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{c.sourceMrn}</code>
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.matchedPatientName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{c.matchedMrn}</code>
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '300px' }}>
                      {c.matchingSignals.join(' · ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.reviewStatus === 'PENDING_REVIEW' ? 'warning' : 'success'}>
                        {c.reviewStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button variant="outline" size="sm" onClick={() => setSelectedCandidate(c)}>
                          Adjudicate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenMergeForCandidate(c)}>
                          Merge
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedCandidate && (
        <DuplicateReviewDialog
          isOpen={Boolean(selectedCandidate)}
          onClose={() => setSelectedCandidate(null)}
          candidate={selectedCandidate}
          actorId={actorId}
          actorRole={actorRole}
          onReviewCandidate={onReviewCandidate}
          onOpenMerge={() => {
            const cand = selectedCandidate;
            setSelectedCandidate(null);
            handleOpenMergeForCandidate(cand);
          }}
        />
      )}

      {isMergeOpen && (
        <MergePatientDialog
          isOpen={isMergeOpen}
          onClose={() => {
            setIsMergeOpen(false);
            setSelectedCandidateId(undefined);
          }}
          patients={patients}
          candidateId={selectedCandidateId}
          actorId={actorId}
          actorRole={actorRole}
          onMergePatients={onMergePatients}
        />
      )}
    </div>
  );
};
