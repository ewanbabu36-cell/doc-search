import React, { useState } from 'react';
import { Card, Button } from '@docsearch/ui-kit';

export const EmergencyControlCenterView: React.FC = () => {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  const protocols = [
    { title: 'Mass Casualty Triage Protocol', desc: 'Pre-configured rapid disaster sorting algorithm with temporary anonymous tagging' },
    { title: 'Level 1 Trauma Alert Escalation Policy', desc: 'Automatic activation criteria for severe penetrating trauma, shock, and airway emergencies' },
    { title: 'Emergency Medico-Legal Intimation Guidelines', desc: 'Statutory legal notification procedures for vehicular accidents and non-accidental trauma' },
    { title: 'Crash Cart Inspection & Defibrillator Maintenance', desc: 'Daily shift checklists and inventory expiry verification protocols' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Department Operations Control</h1>
        <p className="text-sm text-gray-500">Departmental clinical protocols, statutory intimation guidelines, and quality standards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protocols.map((p) => (
          <Card key={p.title} className="p-5 flex flex-col justify-between space-y-3">
            <div>
              <h2 className="font-bold text-base text-gray-900">{p.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProtocol(selectedProtocol === p.title ? null : p.title)}
              >
                {selectedProtocol === p.title ? 'Hide SOP Directives' : 'View SOP Guidelines'}
              </Button>
            </div>
            {selectedProtocol === p.title && (
              <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.75rem', color: '#991b1b' }}>
                <strong>Active Emergency SOP Directive:</strong> Shift-in-charge notification mandatory upon protocol trigger. Verify immediate airway, oxygenation, and crash cart readiness within 90 seconds. Document all actions in emergency clinical log.
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
