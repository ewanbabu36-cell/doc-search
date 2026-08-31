import React, { useState } from 'react';
import {
  Card,
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
import type {
  InvestigationCatalogDto,
  InvestigationPanelDto
} from '@docsearch/api-contracts';

export interface InvestigationCatalogViewProps {
  catalog: InvestigationCatalogDto[];
  panels: InvestigationPanelDto[];
  onOpenCreateInvestigation: () => void;
  onOpenCreatePanel: () => void;
}

export const InvestigationCatalogView: React.FC<InvestigationCatalogViewProps> = ({
  catalog,
  panels,
  onOpenCreateInvestigation,
  onOpenCreatePanel
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tests' | 'panels'>('tests');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredTests = catalog.filter((inv) => {
    if (categoryFilter !== 'ALL' && inv.category !== categoryFilter) return false;
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

  const filteredPanels = panels.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.panelCode.toLowerCase().includes(q) ||
        p.panelName.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
            📚 Master Investigation Catalog & Diagnostic Panels
          </h3>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Comprehensive laboratory tests, specimen matrices, reference turn-around targets, and clinical panels.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={onOpenCreatePanel}>
            📑 Add Diagnostic Panel
          </Button>
          <Button variant="primary" onClick={onOpenCreateInvestigation}>
            ➕ Add Investigation Test
          </Button>
        </div>
      </div>

      {/* Sub-tabs switch */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--ds-color-border-subtle, #e2e8f0)', paddingBottom: '8px' }}>
        <Button
          size="sm"
          variant={activeSubTab === 'tests' ? 'primary' : 'outline'}
          onClick={() => setActiveSubTab('tests')}
        >
          🔬 Individual Investigation Tests ({catalog.length})
        </Button>
        <Button
          size="sm"
          variant={activeSubTab === 'panels' ? 'primary' : 'outline'}
          onClick={() => setActiveSubTab('panels')}
        >
          📑 Reusable Diagnostic Panels ({panels.length})
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by test code, title, department, or clinical keywords..."
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { label: 'All Categories', value: 'ALL' },
            { label: 'Hematology', value: 'HEMATOLOGY' },
            { label: 'Biochemistry', value: 'BIOCHEMISTRY' },
            { label: 'Endocrinology', value: 'ENDOCRINOLOGY' },
            { label: 'Microbiology', value: 'MICROBIOLOGY' },
            { label: 'Immunology', value: 'IMMUNOLOGY' },
            { label: 'Pathology', value: 'PATHOLOGY' },
            { label: 'Radiology', value: 'RADIOLOGY' },
            { label: 'Cardiology', value: 'CARDIOLOGY' },
            { label: 'General Screening', value: 'GENERAL' }
          ]}
        />
      </div>

      {activeSubTab === 'tests' ? (
        <Card title={`Master Test Catalog (${filteredTests.length})`} padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Code</TableHead>
                  <TableHead>Investigation Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Specimen Matrix</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Fasting / Prep</TableHead>
                  <TableHead>Target TAT</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.testCode}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{inv.testName}</div>
                      {inv.clinicalDescription && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                          {inv.clinicalDescription}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{inv.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div><strong>{inv.specimenType}</strong></div>
                      {inv.sampleVolume && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                          {inv.sampleVolume}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{inv.department}</TableCell>
                    <TableCell>
                      {inv.fastingRequired ? (
                        <Badge variant="warning">Fasting Required</Badge>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)' }}>Routine</span>
                      )}
                    </TableCell>
                    <TableCell>{inv.turnaroundTargetHours} hrs</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'ACTIVE' ? 'success' : 'neutral'}>{inv.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Card title={`Diagnostic Panels (${filteredPanels.length})`} padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Panel Code</TableHead>
                  <TableHead>Panel Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Included Test Count</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPanels.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.panelCode}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{p.panelName}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{p.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{p.items.length} Tests Included</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted, #64748b)' }}>
                      {p.description || 'Standard diagnostic test bundle.'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
