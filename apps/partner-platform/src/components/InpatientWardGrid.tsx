import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { InpatientBedDto, InpatientWardDto } from '@docsearch/api-contracts';

export interface InpatientWardGridProps {
  beds: InpatientBedDto[];
  wards?: InpatientWardDto[];
  onSelectBed?: (bed: InpatientBedDto) => void;
  onAdmitPatient?: (bed: InpatientBedDto) => void;
  onReleaseBed?: (bed: InpatientBedDto) => void;
  onCleanBed?: (bed: InpatientBedDto) => void;
  onReserveBed?: (bed: InpatientBedDto) => void;
  onBlockBed?: (bed: InpatientBedDto) => void;
}

/**
 * InpatientWardGrid: Visual Ward & Bed Grid component with safe visual truncation (BUG-M04)
 * Ensures excessively long patient names or bed codes never break or overflow the card header.
 * Full patient name is always accessible via native tooltip / title attribute.
 */
export const InpatientWardGrid: React.FC<InpatientWardGridProps> = ({
  beds = [],
  wards = [],
  onSelectBed,
  onAdmitPatient,
  onReleaseBed,
  onCleanBed,
  onReserveBed,
  onBlockBed
}) => {
  const safeBeds = Array.isArray(beds) ? beds : [];
  const wardMap = new Map((wards || []).map((w) => [w.id, w.wardName]));

  if (safeBeds.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        No beds configured in this ward.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '1rem'
      }}
    >
      {safeBeds.map((bed) => {
        const patientName = bed.currentPatientName || 'Patient Admitted';
        return (
          <Card
            key={bed.id}
            style={{
              padding: '1rem',
              borderTop: `4px solid ${
                bed.status === 'AVAILABLE'
                  ? '#16a34a'
                  : bed.status === 'OCCUPIED'
                  ? '#2563eb'
                  : bed.status === 'CLEANING'
                  ? '#ca8a04'
                  : '#dc2626'
              }`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}
          >
            {/* Bed Card Header with safe visual truncation */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                gap: '8px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: 0,
                  flex: 1
                }}
              >
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🛏️</span>
                <strong
                  className="truncate"
                  style={{
                    fontSize: '1.15rem',
                    color: '#0f172a',
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
              <Badge
                variant={
                  bed.status === 'AVAILABLE'
                    ? 'success'
                    : bed.status === 'OCCUPIED'
                    ? 'neutral'
                    : bed.status === 'CLEANING'
                    ? 'warning'
                    : 'danger'
                }
              >
                {bed.status === 'AVAILABLE'
                  ? 'Available'
                  : bed.status === 'OCCUPIED'
                  ? 'Occupied'
                  : bed.status === 'CLEANING'
                  ? 'Cleaning'
                  : 'Blocked'}
              </Badge>
            </div>

            {/* Ward and Bed Class */}
            <div
              className="truncate"
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
              title={`${bed.wardName || (bed.wardId ? wardMap.get(bed.wardId) : undefined) || 'Ward'} • ${bed.bedClass || 'Standard'}`}
            >
              {bed.wardName || (bed.wardId ? wardMap.get(bed.wardId) : undefined) || 'Ward'} • {bed.bedClass || 'Standard'}
            </div>

            {/* Patient Name Section with safe visual truncation & tooltip (BUG-M04) */}
            <div style={{ margin: '0.6rem 0', fontSize: '0.85rem', minHeight: '36px' }}>
              {bed.status === 'OCCUPIED' && (
                <div
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    className="truncate"
                    style={{
                      color: '#1E40AF',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      display: 'block'
                    }}
                    title={patientName}
                  >
                    👤 {patientName}
                  </div>
                  <div
                    className="truncate"
                    style={{
                      fontSize: '0.75rem',
                      color: '#3B82F6',
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
                <div
                  style={{
                    color: '#16a34a',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>✅</span> Ready for new admission (₹{bed.dailyChargeRate || 1800}/day)
                </div>
              )}
              {bed.status === 'CLEANING' && (
                <div
                  style={{
                    color: '#b45309',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>🧹</span> Sanitization & linen change in progress
                </div>
              )}
              {bed.status === 'BLOCKED' && (
                <div
                  className="truncate"
                  style={{
                    color: '#dc2626',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={bed.notes || 'Maintenance / Isolation Block'}
                >
                  ⚠️ {bed.notes || 'Maintenance / Isolation Block'}
                </div>
              )}
            </div>

            {/* Bed Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {bed.status === 'AVAILABLE' && onAdmitPatient && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAdmitPatient(bed)}
                  style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 }}
                >
                  + Admit Patient
                </Button>
              )}
              {bed.status === 'AVAILABLE' && onReserveBed && (
                <Button variant="outline" size="sm" onClick={() => onReserveBed(bed)}>
                  Reserve
                </Button>
              )}
              {bed.status === 'AVAILABLE' && onBlockBed && (
                <Button variant="outline" size="sm" onClick={() => onBlockBed(bed)}>
                  Block
                </Button>
              )}
              {bed.status === 'OCCUPIED' && onReleaseBed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReleaseBed(bed)}
                  style={{ borderColor: '#EF4444', color: '#DC2626', fontWeight: 600 }}
                >
                  🚪 Release Bed
                </Button>
              )}
              {bed.status === 'CLEANING' && onCleanBed && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onCleanBed(bed)}
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontWeight: 700 }}
                >
                  ✅ Sanitized & Ready
                </Button>
              )}
              {onSelectBed && (
                <Button variant="outline" size="sm" onClick={() => onSelectBed(bed)}>
                  Details
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
