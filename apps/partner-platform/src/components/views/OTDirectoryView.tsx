import React, { useState } from 'react';
import { Card, Table, Badge, Button, Input } from '@docsearch/ui-kit';
import type { OperationTheatreComplexDto } from '@docsearch/api-contracts';

interface Props {
  complexes: OperationTheatreComplexDto[];
  onAddComplex: () => void;
  onEditComplex: (complex: OperationTheatreComplexDto) => void;
}

export const OTDirectoryView: React.FC<Props> = ({
  complexes,
  onAddComplex,
  onEditComplex
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = complexes.filter(
    (c) =>
      c.complexName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complexCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.building.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OT Complex Directory</h1>
          <p className="text-sm text-gray-500">Facility wings, central sterile facilities, and surgical suites</p>
        </div>
        <Button variant="primary" onClick={onAddComplex}>+ Register OT Complex</Button>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search complex code, name or building..."
          />
        </div>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Code</th>
              <th className="py-2">Complex Name</th>
              <th className="py-2">Location</th>
              <th className="py-2">Rooms</th>
              <th className="py-2">Laminar Airflow</th>
              <th className="py-2">CSSD Integrated</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="py-2 font-semibold text-gray-900">{c.complexCode}</td>
                <td className="py-2">{c.complexName}</td>
                <td className="py-2 text-gray-500">{c.building}, {c.floor}</td>
                <td className="py-2">{c.activeRooms} / {c.totalRooms}</td>
                <td className="py-2"><Badge variant={c.hasLaminarAirflow ? 'success' : 'neutral'}>{c.hasLaminarAirflow ? 'Certified' : 'Standard'}</Badge></td>
                <td className="py-2"><Badge variant={c.hasCentralSterileSupply ? 'primary' : 'neutral'}>{c.hasCentralSterileSupply ? 'Connected' : 'Standalone'}</Badge></td>
                <td className="py-2 text-right">
                  <Button variant="outline" onClick={() => onEditComplex(c)}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
