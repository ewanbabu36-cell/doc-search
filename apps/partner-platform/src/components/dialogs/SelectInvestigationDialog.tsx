import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type { InvestigationCatalogDto } from '@docsearch/api-contracts';

export interface SelectInvestigationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (investigation: InvestigationCatalogDto) => void;
  catalog: InvestigationCatalogDto[];
}

export const SelectInvestigationDialog: React.FC<SelectInvestigationDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  catalog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filtered = catalog.filter((inv) => {
    if (selectedCategory !== 'ALL' && inv.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        inv.testCode.toLowerCase().includes(q) ||
        inv.testName.toLowerCase().includes(q) ||
        (inv.shortName && inv.shortName.toLowerCase().includes(q)) ||
        inv.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 Search & Select Diagnostic Investigation"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, test name, or department..."
          />
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { label: 'All Categories', value: 'ALL' },
              { label: 'Hematology', value: 'HEMATOLOGY' },
              { label: 'Biochemistry', value: 'BIOCHEMISTRY' },
              { label: 'Endocrinology', value: 'ENDOCRINOLOGY' },
              { label: 'Microbiology', value: 'MICROBIOLOGY' },
              { label: 'Immunology', value: 'IMMUNOLOGY' },
              { label: 'Pathology', value: 'PATHOLOGY' },
              { label: 'Radiology', value: 'RADIOLOGY' },
              { label: 'Cardiology', value: 'CARDIOLOGY' }
            ]}
          />
        </div>

        <TableContainer style={{ maxHeight: '360px', overflowY: 'auto' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Code</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Specimen</TableHead>
                <TableHead>Target TAT</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--ds-color-text-muted)' }}>
                    No investigations match current filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.testCode}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{inv.testName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{inv.department}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{inv.category}</Badge>
                    </TableCell>
                    <TableCell>{inv.specimenType}</TableCell>
                    <TableCell>{inv.turnaroundTargetHours} hrs</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          onSelect(inv);
                          onClose();
                        }}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Dialog>
  );
};
