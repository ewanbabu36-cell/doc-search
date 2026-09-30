import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '@docsearch/ui-kit';
import type { InpatientBedDto, InpatientWardDto } from '@docsearch/api-contracts';

export interface BedManagementViewProps {
  beds: InpatientBedDto[];
  wards: InpatientWardDto[];
  onOpenCreateBed: () => void;
  onOpenEditBed: (bed: InpatientBedDto) => void;
  onOpenBlockBed: (bed: InpatientBedDto) => void;
  onOpenReserveBed: (bed: InpatientBedDto) => void;
  onOpenReleaseBed: (bed: InpatientBedDto) => void;
  onOpenQuickAdmit?: (bed: InpatientBedDto) => void;
  onCompleteCleaning?: (bed: InpatientBedDto) => void;
  onSelectBed?: (bed: InpatientBedDto) => void;
}

export const BedManagementView: React.FC<BedManagementViewProps> = ({
  beds = [],
  wards = [],
  onOpenCreateBed,
  onOpenEditBed,
  onOpenBlockBed,
  onOpenReserveBed,
  onOpenReleaseBed,
  onOpenQuickAdmit,
  onCompleteCleaning,
  onSelectBed
}) => {
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const safeBeds = Array.isArray(beds) ? beds : [];
  const safeWards = Array.isArray(wards) ? wards : [];

  const filtered = safeBeds.filter((b) => {
    if (!b) return false;
    const matchWard = selectedWard === 'ALL' || b.wardId === selectedWard;
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const bedCodeStr = (b.bedCode || '').toLowerCase();
    const patientNameStr = (b.currentPatientName || '').toLowerCase();
    const searchLower = (searchTerm || '').toLowerCase();
    const matchSearch = bedCodeStr.includes(searchLower) || patientNameStr.includes(searchLower);
    return matchWard && matchStatus && matchSearch;
  });

  const availableCount = safeBeds.filter((b) => b?.status === 'AVAILABLE').length;
  const occupiedCount = safeBeds.filter((b) => b?.status === 'OCCUPIED').length;
  const cleaningCount = safeBeds.filter((b) => b?.status === 'CLEANING').length;
  const blockedCount = safeBeds.filter((b) => b?.status === 'BLOCKED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #f8fafc)' }}>
              Visual Ward & Bed Master Board
            </h2>
            <span style={{ backgroundColor: '#10B981', color: '#064E3B', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
              1-CLICK ACTIONS
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Directly admit patients to available beds, release beds upon discharge, and complete sanitization in 1-click.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateBed}>+ Register Bed</Button>
      </div>

      {/* Quick Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setStatusFilter('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'ALL' ? '2px solid #0284C7' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'ALL' ? '#E0F2FE' : '#FFFFFF',
            color: statusFilter === 'ALL' ? '#0369A1' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          All Beds ({safeBeds.length})
        </button>
        <button
          onClick={() => setStatusFilter('AVAILABLE')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'AVAILABLE' ? '2px solid #16A34A' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'AVAILABLE' ? '#DCFCE7' : '#FFFFFF',
            color: statusFilter === 'AVAILABLE' ? '#15803D' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          ✅ Available ({availableCount})
        </button>
        <button
          onClick={() => setStatusFilter('OCCUPIED')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'OCCUPIED' ? '2px solid #2563EB' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'OCCUPIED' ? '#DBEAFE' : '#FFFFFF',
            color: statusFilter === 'OCCUPIED' ? '#1D4ED8' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          👤 Occupied ({occupiedCount})
        </button>
        <button
          onClick={() => setStatusFilter('CLEANING')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'CLEANING' ? '2px solid #D97706' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'CLEANING' ? '#FEF3C7' : '#FFFFFF',
            color: statusFilter === 'CLEANING' ? '#B45309' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          🧹 Cleaning ({cleaningCount})
        </button>
        <button
          onClick={() => setStatusFilter('BLOCKED')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: statusFilter === 'BLOCKED' ? '2px solid #DC2626' : '1px solid #CBD5E1',
            backgroundColor: statusFilter === 'BLOCKED' ? '#FEE2E2' : '#FFFFFF',
            color: statusFilter === 'BLOCKED' ? '#B91C1C' : '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          ⚠️ Maintenance Block ({blockedCount})
        </button>
      </div>

      <Card style={{ padding: '0.85rem 1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px' }}>
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="🔍 Search bed code or patient name..." />
        </div>
        <div style={{ width: '220px' }}>
          <Select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            options={[{ value: 'ALL', label: 'All Wards' }, ...safeWards.map((w) => ({ value: w?.id || '', label: w?.wardName || 'Ward' }))]}
          />
        </div>
      </Card>

      {/* Bed Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
        {filtered.map((bed) => (
          <Card
            key={bed.id}
            style={{
              padding: '1rem',
              borderTop: `4px solid ${
                bed.status === 'AVAILABLE' ? '#16a34a' :
                bed.status === 'OCCUPIED' ? '#2563eb' :
                bed.status === 'CLEANING' ? '#ca8a04' : '#dc2626'
              }`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🛏️</span>
                <strong
                  className="truncate"
                  style={{
                    fontSize: '1.15rem',
                    color: 'var(--ds-color-text-primary, #f8fafc)',
                    fontWeight: 800,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                  title={bed.bedCode}
                >
                  {bed.bedCode}
                </strong>
              </div>
              <Badge variant={bed.status === 'AVAILABLE' ? 'success' : bed.status === 'OCCUPIED' ? 'neutral' : bed.status === 'CLEANING' ? 'warning' : 'danger'}>
                {bed.status === 'AVAILABLE' ? 'Available' : bed.status === 'OCCUPIED' ? 'Occupied' : bed.status === 'CLEANING' ? 'Cleaning' : 'Blocked'}
              </Badge>
            </div>

            <div
              className="truncate"
              style={{
                fontSize: '0.8rem',
                color: 'var(--ds-color-text-muted, #94a3b8)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
              title={`${bed.wardName || 'Ward'} • ${bed.bedClass || 'Standard'}`}
            >
              {bed.wardName} • {bed.bedClass}
            </div>

            <div style={{ margin: '0.6rem 0', fontSize: '0.85rem', minHeight: '36px' }}>
              {bed.status === 'OCCUPIED' && (
                <div style={{ backgroundColor: 'var(--ds-color-surface-subtle, #182234)', border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))', borderRadius: '6px', padding: '6px 10px', minWidth: 0, overflow: 'hidden' }}>
                  <div
                    className="truncate"
                    style={{
                      color: 'var(--ds-color-accent, #38bdf8)',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      display: 'block'
                    }}
                    title={bed.currentPatientName || 'Patient Admitted'}
                  >
                    👤 {bed.currentPatientName || 'Patient Admitted'}
                  </div>
                  <div
                    className="truncate"
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--ds-color-text-secondary, #cbd5e1)',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    MRN: {bed.currentPatientMrn || 'N/A'}
                  </div>
                </div>
              )}
              {bed.status === 'AVAILABLE' && (
                <div style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>✅</span> Ready for new admission (₹{bed.dailyChargeRate || 1800}/day)
                </div>
              )}
              {bed.status === 'CLEANING' && (
                <div style={{ color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🧹</span> Sanitization & linen change in progress
                </div>
              )}
              {bed.status === 'BLOCKED' && (
                <div style={{ color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {bed.notes || 'Maintenance / Isolation Block'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {/* AVAILABLE BED: Direct Quick Admit button */}
              {bed.status === 'AVAILABLE' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenQuickAdmit ? onOpenQuickAdmit(bed) : onOpenReserveBed(bed)}
                    style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 }}
                  >
                    + Admit Patient
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenReserveBed(bed)}>Reserve</Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenBlockBed(bed)}>Block</Button>
                </>
              )}

              {/* OCCUPIED BED: 1-Click Release Bed */}
              {bed.status === 'OCCUPIED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenReleaseBed(bed)}
                  style={{ borderColor: '#EF4444', color: '#DC2626', fontWeight: 600 }}
                >
                  🚪 Release Bed
                </Button>
              )}

              {/* CLEANING BED: 1-Click Mark Cleaned */}
              {bed.status === 'CLEANING' && onCompleteCleaning && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onCompleteCleaning(bed)}
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontWeight: 700 }}
                >
                  ✅ Sanitized & Ready
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={() => onOpenEditBed(bed)}>Edit</Button>
              {onSelectBed && (
                <Button variant="outline" size="sm" onClick={() => onSelectBed(bed)}>Details</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};