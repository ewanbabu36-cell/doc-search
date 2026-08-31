import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodRequestDto, BloodComponentDto } from '@docsearch/api-contracts';

interface Props {
  requests: BloodRequestDto[];
  components: BloodComponentDto[];
  onIssue: (req: BloodRequestDto, comp: BloodComponentDto) => void;
}

export const BloodReservationView: React.FC<Props> = ({ requests, components, onIssue }) => {
  const reservedReqs = requests.filter((r) => r.status === 'RESERVED');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Active Patient Blood Reservations</h2>
        <p className="text-xs text-gray-500">Crossmatched units earmarked for scheduled surgeries and acute emergency transfusions</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Requisition No.</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Department</th>
              <th className="p-3">Component</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reservedReqs.map((r) => {
              const comp = components[0] || null;
              return (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-800">{r.requestCode}</td>
                  <td className="p-3 font-semibold text-gray-900">{r.patientName} ({r.patientBloodGroup})</td>
                  <td className="p-3 text-xs text-gray-600">{r.requestingDepartment}</td>
                  <td className="p-3 font-medium text-gray-800">{r.requestedComponentType} ({r.quantityUnits} unit)</td>
                  <td className="p-3">
                    <Badge variant="primary">RESERVED FOR PATIENT</Badge>
                  </td>
                  <td className="p-3 text-right">
                    {comp && (
                      <Button variant="primary" size="sm" onClick={() => onIssue(r, comp)}>Dispatch / Issue Unit</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
