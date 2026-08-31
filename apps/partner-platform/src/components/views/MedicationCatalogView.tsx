import React, { useState } from 'react';
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
  MedicationCatalogDto
} from '@docsearch/api-contracts';

export interface MedicationCatalogViewProps {
  catalog: MedicationCatalogDto[];
  onOpenCreateMedication: () => void;
  onSelectMedication?: (medication: MedicationCatalogDto) => void;
}

export const MedicationCatalogView: React.FC<MedicationCatalogViewProps> = ({
  catalog,
  onOpenCreateMedication
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredCatalog = catalog.filter((med) => {
    const matchesCategory = categoryFilter === 'ALL' || med.category === categoryFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.medicationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>
            📚 Master Medication Formulary & Catalog
          </h2>
          <p style={{ margin: 0, color: 'var(--ds-color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            Generic-to-brand mapping, route configuration, dosage packaging, and controlled substance classification.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateMedication}>
          ➕ Register New Medication
        </Button>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Catalog
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by generic name, brand, code, manufacturer..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Category
            </label>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Therapeutic Categories' },
                { value: 'ANTIBIOTIC', label: 'Antibiotic' },
                { value: 'ANALGESIC', label: 'Analgesic / Pain' },
                { value: 'CARDIOVASCULAR', label: 'Cardiovascular' },
                { value: 'ANTIDIABETIC', label: 'Antidiabetic' },
                { value: 'RESPIRATORY', label: 'Respiratory' },
                { value: 'GASTROINTESTINAL', label: 'Gastrointestinal' },
                { value: 'CONTROLLED_SUBSTANCE', label: 'Controlled Substances' }
              ]}
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Generic / Brand Name</TableHead>
                <TableHead>Strength & Form</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Controlled / Rx</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCatalog.map((med) => (
                <TableRow key={med.id}>
                  <TableCell style={{ fontWeight: 600, color: '#0369a1' }}>{med.medicationCode}</TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 600 }}>{med.genericName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Brand: {med.brandName}</div>
                  </TableCell>
                  <TableCell>
                    <div>{med.strength}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{med.dosageForm}</div>
                  </TableCell>
                  <TableCell>{med.route}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{med.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {med.controlledMedication && (
                        <Badge variant="danger">Schedule II-V</Badge>
                      )}
                      {med.prescriptionRequired ? (
                        <Badge variant="warning">Rx Only</Badge>
                      ) : (
                        <Badge variant="success">OTC</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.85rem' }}>{med.manufacturer}</TableCell>
                  <TableCell>
                    <Badge variant={med.status === 'ACTIVE' ? 'success' : 'neutral'}>{med.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
