import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyCrashCartDto } from '@docsearch/api-contracts';

interface Props {
  carts: EmergencyCrashCartDto[];
  onCheckCart: (cart: EmergencyCrashCartDto) => void;
}

export const CrashCartView: React.FC<Props> = ({ carts, onCheckCart }) => {
  return (
    <div className="space-y-6">
      <div style={{ backgroundColor: '#0F172A', border: '1.5px solid rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            🚨 Crash Cart Readiness & Closed-Loop Replenishment
          </h1>
          <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Tamper-evident seal telemetry • Central Pharmacy auto-replenish pipeline • Defibrillator battery & O2 verification
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#34D399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
            Pharmacy Vault Telemetry Active
          </span>
        </div>
      </div>

      <div style={{ backgroundColor: '#070C16', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#93C5FD' }}>
        <span style={{ fontSize: '1.2rem' }}>🛡️</span>
        <div>
          <strong>Tamper-Evident Security Protocol:</strong> Crash carts remain sealed with registered tamper-evident tags (e.g. <code>SEAL-XXXX-GREEN</code>). Unsealing during resuscitation automatically triggers an Emergency Immediate Replenish Indent to Central Pharmacy and requests a new numbered seal.
        </div>
      </div>

      <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 border-b border-gray-700">
              <th className="py-2">Cart Code</th>
              <th className="py-2">Location Zone</th>
              <th className="py-2">Tamper Seal #</th>
              <th className="py-2">Defib Battery</th>
              <th className="py-2">O2 Pressure</th>
              <th className="py-2">Readiness Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {carts.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-bold" style={{ color: '#F8FAFC' }}>{c.cartCode}</td>
                <td className="py-2" style={{ color: '#CBD5E1' }}>{c.locationZone}</td>
                <td className="py-2 text-xs font-mono">
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: '#FBBF24' }}>
                    🔒 {c.sealNumber}
                  </span>
                </td>
                <td className="py-2 font-medium" style={{ color: c.defibrillatorBatteryPercent > 80 ? '#34D399' : '#EF4444' }}>
                  ⚡ {c.defibrillatorBatteryPercent}%
                </td>
                <td className="py-2 font-medium" style={{ color: c.oxygenCylinderPressurePsi > 1000 ? '#38BDF8' : '#EF4444' }}>
                  💨 {c.oxygenCylinderPressurePsi} PSI
                </td>
                <td className="py-2">
                  <Badge variant={c.status === 'READY' ? 'success' : 'danger'}>
                    {c.status === 'READY' ? '✓ READY & SEALED' : '🚨 UNSEALED / REPLENISHING'}
                  </Badge>
                </td>
                <td className="py-2 text-right">
                  <Button variant="outline" onClick={() => onCheckCart(c)} style={{ fontSize: '0.78rem' }}>
                    🔍 Resuscitation Audit & Unseal
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
