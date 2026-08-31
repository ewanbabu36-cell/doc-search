import React, { useState } from 'react';
import type { SavedReportDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert
} from '@docsearch/ui-kit';

export interface SavedReportListViewProps {
  reports: SavedReportDto[];
  onGenerateReport: (reportId: string, dateRange: string) => Promise<void>;
}

export const SavedReportListView: React.FC<SavedReportListViewProps> = ({
  reports,
  onGenerateReport
}) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleGenerate = async (id: string) => {
    setGeneratingId(id);
    setStatusNotice(null);
    try {
      await onGenerateReport(id, 'Last 30 Days (Sample Preview Range)');
      setStatusNotice('Report snapshot compiled and stored in audit vault.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {statusNotice && (
        <Alert type="success" title="Report Generation Successful">
          {statusNotice}
        </Alert>
      )}

      <Card
        title="Saved Report Definitions & Scheduled Compilations"
        subtitle="Configured business intelligence reports, export format blueprints, and scheduled aggregation jobs"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name & Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Schedule Frequency</TableHead>
                <TableHead>Output Format</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No saved report definitions registered.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.reportName}</strong>
                      <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                        {r.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{r.category}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{r.scheduleFrequency}</TableCell>
                    <TableCell>
                      <Badge variant="primary">{r.outputFormat}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {r.createdByEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {r.lastGeneratedAt ? new Date(r.lastGeneratedAt).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={generatingId === r.id}
                        onClick={() => handleGenerate(r.id)}
                      >
                        Compile Snapshot
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
