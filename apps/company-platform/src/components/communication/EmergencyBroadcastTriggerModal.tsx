import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSuccess: (broadcastTitle: string) => void;
}

export const EmergencyBroadcastTriggerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onBroadcastSuccess
}) => {
  const [severity, setSeverity] = useState<'CRITICAL_ALPHA' | 'INFRA_MAINTENANCE' | 'EPIDEMIC_SURGE' | 'WEATHER_WARNING'>('CRITICAL_ALPHA');
  const [title, setTitle] = useState('CRITICAL: Immediate Blood Group O-Negative Shortage Alert');
  const [geoScope, setGeoScope] = useState('ALL_DELHI_NCR');
  const [message, setMessage] = useState('EMERGENCY: Trauma Center requires 10 units of O-Negative blood immediately. Contact Blood Bank Lead at +91 98765 00000 or dispatch via DocSearch emergency protocol.');
  const [channels, setChannels] = useState({
    sms: true,
    whatsapp: true,
    inAppBanner: true,
    doctorVoiceIvr: false
  });
  const [isTriggering, setIsTriggering] = useState(false);

  if (!isOpen) return null;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTriggering(true);
    setTimeout(() => {
      setIsTriggering(false);
      onBroadcastSuccess(title);
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.92)',
      backdropFilter: 'blur(10px)',
      zIndex: 10003,
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
        maxWidth: '620px',
        padding: '24px',
        boxShadow: '0 25px 80px rgba(239, 68, 68, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 900, color: '#EF4444' }}>
                Emergency Hospital Mass-Broadcast Protocol
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                High-priority flash notification across partner hospitals, doctors, and clinical desks
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', color: '#EF4444', marginBottom: '3px', fontWeight: 800 }}>SEVERITY LEVEL *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1.5px solid #EF4444', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontWeight: 700 }}
              >
                <option value="CRITICAL_ALPHA">🚨 CRITICAL ALPHA (Immediate Flash)</option>
                <option value="EPIDEMIC_SURGE">⚠️ EPIDEMIC VECTOR SURGE</option>
                <option value="INFRA_MAINTENANCE">⚡ INFRASTRUCTURE DOWNTIME</option>
                <option value="WEATHER_WARNING">🌧️ SEVERE WEATHER DISRUPTION</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>GEO / TARGET REGION *</label>
              <select
                value={geoScope}
                onChange={(e) => setGeoScope(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="ALL_DELHI_NCR">Delhi NCR Regional Network (34 Facilities)</option>
                <option value="NATIONAL_ALL_INDIA">National Network (All 182 Hospitals & Labs)</option>
                <option value="METROPOLIS_ONLY">Metropolis Diagnostics Labs Only</option>
                <option value="APOLLO_NETWORK">Apollo Hospitals Chain Only</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>EMERGENCY ALERT HEADLINE *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>BROADCAST PAYLOAD MESSAGE *</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FCA5A5', lineHeight: '1.4' }}
            />
          </div>

          {/* Channels checklist */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '12px', border: '1px solid #334155' }}>
            <span style={{ display: 'block', color: '#38BDF8', fontWeight: 800, fontSize: '0.6875rem', textTransform: 'uppercase', marginBottom: '8px' }}>
              Simultaneous Emergency Dispatch Channels:
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={channels.sms} onChange={(e) => setChannels({ ...channels, sms: e.target.checked })} />
                <span>📱 Priority SMS (Telecom DLT Fast-Track)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={channels.whatsapp} onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })} />
                <span>💬 WhatsApp High-Priority Blast</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={channels.inAppBanner} onChange={(e) => setChannels({ ...channels, inAppBanner: e.target.checked })} />
                <span>🚨 Doctor EMR In-App Flash Banner</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={channels.doctorVoiceIvr} onChange={(e) => setChannels({ ...channels, doctorVoiceIvr: e.target.checked })} />
                <span>📞 Automated Doctor IVR Voice Call</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTriggering}
              style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 24px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 18px rgba(239, 68, 68, 0.5)' }}
            >
              {isTriggering ? '⚡ DISPATCHING MASS FLASH...' : '🚨 DISPATCH EMERGENCY BROADCAST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
