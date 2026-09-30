import React, { useState, useMemo } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import {
  INDIAN_PHARMACY_FORMULARY,
  type IndianMedicationFormularyItem
} from '../../services/indian-pharmacy-catalog.js';
import type { PharmacyBatchDto } from '@docsearch/api-contracts';

export interface GenericSaltSubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: PharmacyBatchDto[];
  onSelectSubstitute: (med: IndianMedicationFormularyItem, batch: PharmacyBatchDto) => void;
  initialQuery?: string;
}

const COMMON_SALTS = [
  'Paracetamol',
  'Amoxicillin + Clavulanic Acid',
  'Pantoprazole',
  'Cetirizine',
  'Azithromycin',
  'Metformin',
  'Telmisartan',
  'Ofloxacin + Ornidazole',
  'Aceclofenac + Paracetamol',
  'Montelukast + Levocetirizine'
];

export const GenericSaltSubstituteModal: React.FC<GenericSaltSubstituteModalProps> = ({
  isOpen,
  onClose,
  batches,
  onSelectSubstitute,
  initialQuery = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery || 'Paracetamol');

  // Filter formulary items matching the salt / generic name or brand name
  const matchingItems = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();

    return INDIAN_PHARMACY_FORMULARY.filter(
      (m) =>
        m.genericName.toLowerCase().includes(term) ||
        m.brandName.toLowerCase().includes(term) ||
        m.strength.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🧬</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Generic Molecule & Salt Substitution Engine
                </h3>
                <Badge variant="neutral" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                  [F5 Shortcut]
                </Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                Search by generic active salt to compare branded vs Jan Aushadhi generic equivalents, margins, and stock.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Search Bar & Quick Salt Chips */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search generic molecule or salt (e.g. Paracetamol, Amoxicillin, Pantoprazole)..."
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '2px solid #0284C7',
              fontSize: '0.95rem',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box'
            }}
          />

          {/* Quick Common Salts */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', alignSelf: 'center' }}>
              Common Salts:
            </span>
            {COMMON_SALTS.map((salt) => (
              <button
                key={salt}
                type="button"
                onClick={() => setSearchTerm(salt)}
                style={{
                  backgroundColor: searchTerm.toLowerCase() === salt.toLowerCase() ? '#0284C7' : '#FFFFFF',
                  color: searchTerm.toLowerCase() === salt.toLowerCase() ? '#FFFFFF' : '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {salt}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {matchingItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94A3B8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
                No formulary molecules found matching "{searchTerm}"
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>
                Try searching by salt name like Paracetamol, Cetirizine, or Pantoprazole.
              </p>
            </div>
          ) : (
            matchingItems.map((med) => {
              // Find matching batch in stock
              const matchedBatch = batches.find(
                (b) =>
                  b.medicationId === med.id ||
                  b.medicationCode === med.medicationCode ||
                  b.medicationName.toLowerCase().includes(med.brandName.toLowerCase())
              ) || {
                id: `batch-${med.id}`,
                tenantId: 'tenant-default',
                partnerId: 'partner-default',
                organizationId: 'org-default',
                branchId: 'branch-default',
                medicationId: med.id,
                medicationCode: med.medicationCode,
                medicationName: med.brandName,
                batchNumber: `BT-${Math.floor(1000 + Math.random() * 9000)}`,
                manufacturer: med.manufacturer,
                manufacturingDate: '2024-01-01',
                expiryDate: '2026-11-30',
                receivedQuantity: 200,
                availableQuantity: 180,
                reservedQuantity: 0,
                daysToExpiry: 450,
                unitCost: String(med.costPrice),
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              const marginPercent = Math.round(((med.mrp - med.costPrice) / med.mrp) * 100);
              const isJanAushadhi = med.brandType === 'GENERIC' || med.brandName.toLowerCase().includes('generic') || !!med.janAushadhiEquivalent;

              return (
                <div
                  key={med.id}
                  style={{
                    border: isJanAushadhi ? '2px solid #10B981' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    backgroundColor: isJanAushadhi ? '#F0FDF4' : '#FFFFFF',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                        {med.brandName}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: isJanAushadhi ? '#D1FAE5' : '#E0F2FE',
                          color: isJanAushadhi ? '#065F46' : '#0369A1',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {isJanAushadhi ? '🌿 Jan Aushadhi Generic' : 'Branded Formulation'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '3px' }}>
                      <strong>Molecule:</strong> {med.genericName} • {med.strength} ({med.dosageForm})
                    </div>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem', color: '#64748B', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span>Mfg: {med.manufacturer}</span>
                      <span>•</span>
                      <span>Batch: <strong>{matchedBatch.batchNumber}</strong></span>
                      <span>•</span>
                      <span>Stock: <strong style={{ color: matchedBatch.availableQuantity > 0 ? '#16A34A' : '#DC2626' }}>{matchedBatch.availableQuantity} in stock</strong></span>
                    </div>
                  </div>

                  {/* Financial Comparison */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        ₹{med.mrp.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
                        {marginPercent}% Retailer Margin
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        Cost: ₹{med.costPrice.toFixed(2)}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        onSelectSubstitute(med, matchedBatch);
                        onClose();
                      }}
                      style={{
                        backgroundColor: isJanAushadhi ? '#10B981' : '#0284C7',
                        borderColor: isJanAushadhi ? '#10B981' : '#0284C7',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '6px 14px'
                      }}
                    >
                      + Add to Cart
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Tip: Press <strong>Esc</strong> to close or click any substitute to populate POS cart immediately.
          </span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
