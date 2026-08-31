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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crash Cart Readiness & Inventory Audits</h1>
        <p className="text-sm text-gray-500">Tamper-evident seal verification, defibrillator battery status, oxygen cylinder pressure, and drug expiries</p>
      </div>

      <Card className="p-4">
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Cart Code</th>
              <th className="py-2">Location</th>
              <th className="py-2">Seal #</th>
              <th className="py-2">Defib Battery</th>
              <th className="py-2">O2 Pressure</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {carts.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-bold text-gray-900">{c.cartCode}</td>
                <td className="py-2">{c.locationZone}</td>
                <td className="py-2 text-xs font-mono">{c.sealNumber}</td>
                <td className="py-2 font-medium">{c.defibrillatorBatteryPercent}%</td>
                <td className="py-2 font-medium">{c.oxygenCylinderPressurePsi} PSI</td>
                <td className="py-2"><Badge variant={c.status === 'READY' ? 'success' : 'danger'}>{c.status}</Badge></td>
                <td className="py-2 text-right">
                  <Button variant="outline" onClick={() => onCheckCart(c)}>Verify & Check</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
