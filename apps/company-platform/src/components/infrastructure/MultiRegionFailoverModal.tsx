import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFailoverSuccess: (regionTarget: string) => void;
}

export const MultiRegionFailoverModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onFailoverSuccess
}) => {
  const [targetRegion, setTargetRegion] = useState('AWS_HYDERABAD_AP_SOUTH_2');
  const [confirmCode, setConfirmCode] = useState('');
  const [reason, setReason] = useState('AWS Mumbai (ap-south-1) simulated data center network severance');
  const [isFailingOver, setIsFailingOver] = useState(false);
  const [failoverStep, setFailoverStep] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteFailover = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmCode !== 'FAILOVER-CONFIRM') {
      alert('Please enter FAILOVER-CONFIRM to authorize emergency traffic diversion.');
      return;
    }

    setIsFailingOver(true);
    setFailoverStep('1/4: Freezing write locks on Mumbai Primary Node...');

    setTimeout(() => {
      setFailoverStep('2/4: Promoting Hyderabad Secondary Replica to Primary Master...');
      setTimeout(() => {
        setFailoverStep('3/4: Repointing AWS Route 53 Weighted DNS Ingress Records...');
        setTimeout(() => {
          setFailoverStep('4/4: Validating 100% microservices health in Hyderabad...');
          setTimeout(() => {
            setIsFailingOver(false);
            onFailoverSuccess(targetRegion === 'AWS_HYDERABAD_AP_SOUTH_2' ? 'AWS Hyderabad (ap-south-2)' : 'GCP Mumbai (asia-south1)');
            onClose();
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.92)',
      backdropFilter: 'blur(8px)',
      zIndex: 10015,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '2px solid #EF4444',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '640px',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(239, 68, 68, 0.35)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ 1-Click Multi-Region Disaster Recovery Failover
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Emergency DNS Route 53 & Database Primary Master failover protocol
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleExecuteFailover} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', padding: '10px 14px', color: '#FCA5A5' }}>
            ⚠️ <strong>CRITICAL DIRECTIVE:</strong> This action will divert 100% of nationwide hospital traffic away from Mumbai (ap-south-1) to the designated secondary region. Target RTO: &lt;45 seconds.
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>TARGET DISASTER RECOVERY REGION *</label>
            <select
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            >
              <option value="AWS_HYDERABAD_AP_SOUTH_2">AWS Hyderabad (ap-south-2) - Primary Hot Standby (0.18s lag)</option>
              <option value="GCP_MUMBAI_ASIA_SOUTH1">Google Cloud (asia-south1) - Cross-Cloud Redundant Node</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>INCIDENT / DR REASON *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>
              TYPE <span style={{ color: '#EF4444', fontFamily: 'monospace' }}>FAILOVER-CONFIRM</span> TO AUTHORIZE *
            </label>
            <input
              type="text"
              required
              placeholder="FAILOVER-CONFIRM"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #EF4444', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace', fontWeight: 700 }}
            />
          </div>

          {failoverStep && (
            <div style={{ backgroundColor: '#020617', border: '1px solid #38BDF8', borderRadius: '8px', padding: '10px 14px', color: '#38BDF8', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              ⏳ {failoverStep}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFailingOver}
              style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
            >
              {isFailingOver ? '⚡ Executing Failover...' : '🚨 EXECUTE EMERGENCY FAILOVER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
