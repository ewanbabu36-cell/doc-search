import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface IpRule {
  id: string;
  partnerName: string;
  cidrBlock: string;
  description: string;
  status: 'ALLOWED' | 'BLOCKED' | 'RATE_LIMITED';
  geoRegion: string;
  lastTraffic: string;
}

const INITIAL_RULES: IpRule[] = [
  { id: 'IPR-1', partnerName: 'Apex Multi-Specialty Hospital', cidrBlock: '103.24.120.0/24', description: 'Main Hospital Campus Static Gateway', status: 'ALLOWED', geoRegion: 'Mumbai, IN', lastTraffic: '2 mins ago' },
  { id: 'IPR-2', partnerName: 'Metropolis Bio-Pathology Diagnostics', cidrBlock: '49.207.54.12/32', description: 'Central LIMS Lab Interface IP', status: 'ALLOWED', geoRegion: 'Delhi NCR, IN', lastTraffic: 'Just now' },
  { id: 'IPR-3', partnerName: 'CarePlus Surgical Center', cidrBlock: '182.73.19.45/32', description: 'OPD Terminal Static Lease', status: 'ALLOWED', geoRegion: 'Bengaluru, IN', lastTraffic: '15 mins ago' },
  { id: 'IPR-4', partnerName: 'Global Threat Watchlist', cidrBlock: '185.220.101.0/24', description: 'Tor Exit Nodes / Malicious Scanners', status: 'BLOCKED', geoRegion: 'International (Blocked)', lastTraffic: '1 hr ago (DDoS Drop)' }
];

export const IpWhitelistingFirewallView: React.FC = () => {
  const [rules, setRules] = useState<IpRule[]>(INITIAL_RULES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [geoFencingIndiaOnly, setGeoFencingIndiaOnly] = useState(true);
  const [ddosProtectionEnabled, setDdosProtectionEnabled] = useState(true);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form State
  const [newPartner, setNewPartner] = useState('Apollo Cradle Hospital');
  const [newCidr, setNewCidr] = useState('115.110.224.50/32');
  const [newDesc, setNewDesc] = useState('Primary EMR Gateway Router');
  const [newRegion, setNewRegion] = useState('Hyderabad, IN');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const created: IpRule = {
      id: `IPR-${rules.length + 1}`,
      partnerName: newPartner,
      cidrBlock: newCidr,
      description: newDesc,
      status: 'ALLOWED',
      geoRegion: newRegion,
      lastTraffic: 'Configured (Active)'
    };
    setRules([created, ...rules]);
    setIsAddModalOpen(false);
    setSuccessBanner(`Firewall Rule added: IP ${newCidr} whitelisted for "${newPartner}"!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleToggleBlock = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, status: r.status === 'ALLOWED' ? 'BLOCKED' : 'ALLOWED' } : r)));
    setSuccessBanner('Firewall rule status updated immediately across edge gateways!');
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🌐 Hospital IP Whitelisting & Geo-Fencing Firewall Center
            </h2>
            <Badge variant="primary">WAF Active (Layer 7)</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Restrict hospital EMR and billing access to authorized static IP ranges with automatic DDoS rate-limiting
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)} style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
          + Add Whitelist IP Rule
        </Button>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Firewall Controls */}
      <Card title="Edge Security & Threat Mitigation Controls" padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <input
              type="checkbox"
              id="geo-fence"
              checked={geoFencingIndiaOnly}
              onChange={(e) => setGeoFencingIndiaOnly(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px' }}
            />
            <div>
              <label htmlFor="geo-fence" style={{ fontWeight: 800, color: '#F8FAFC', cursor: 'pointer', display: 'block' }}>
                Strict National Geo-Fencing (India Only)
              </label>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                Automatically drops traffic originating from non-Indian IP blocks unless explicitly whitelisted via VPN CIDR.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
            <input
              type="checkbox"
              id="ddos-shield"
              checked={ddosProtectionEnabled}
              onChange={(e) => setDdosProtectionEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px' }}
            />
            <div>
              <label htmlFor="ddos-shield" style={{ fontWeight: 800, color: '#F8FAFC', cursor: 'pointer', display: 'block' }}>
                Automated DDoS & Brute-Force Rate Limiter
              </label>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                Temporarily bans IPs exceeding 100 requests/second or 5 consecutive failed login attempts.
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Rules Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule ID</TableHead>
                <TableHead>Partner Facility</TableHead>
                <TableHead>CIDR / IP Address</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Geo Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{r.id}</strong>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.partnerName}</strong>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace', color: '#10B981', fontWeight: 700 }}>{r.cidrBlock}</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{r.description}</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem' }}>{r.geoRegion}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'ALLOWED' ? 'success' : 'danger'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{r.lastTraffic}</span>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button variant="outline" size="sm" onClick={() => handleToggleBlock(r.id)}>
                      {r.status === 'ALLOWED' ? '🛑 Block' : '✓ Unblock'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Rule Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
                🌐 Add Hospital IP Whitelist Rule
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.125rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>PARTNER FACILITY *</label>
                <input
                  type="text"
                  required
                  value={newPartner}
                  onChange={(e) => setNewPartner(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>CIDR / IP ADDRESS *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 103.24.120.0/24 or 49.207.54.12/32"
                  value={newCidr}
                  onChange={(e) => setNewCidr(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>DESCRIPTION *</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>GEO REGION / CITY *</label>
                <input
                  type="text"
                  required
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ✓ Apply Firewall Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
