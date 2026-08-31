import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodDonationDto } from '@docsearch/api-contracts';

interface Props {
  donations: BloodDonationDto[];
  onOpenTest: (d: BloodDonationDto) => void;
  onOpenSeparate: (d: BloodDonationDto) => void;
}

export const DonationCollectionView: React.FC<Props> = ({ donations, onOpenTest, onOpenSeparate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blood Collection & Phlebotomy Units</h2>
          <p className="text-xs text-gray-500">Traceable collected units in anticoagulant bags pending testing & separation</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Donation No.</th>
              <th className="p-3">Donor Name</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Collected Vol</th>
              <th className="p-3">Anticoagulant</th>
              <th className="p-3">Status</th>
              <th className="p-3">Bag Barcode</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{d.donationNumber}</td>
                <td className="p-3 font-semibold text-gray-900">{d.donorName}</td>
                <td className="p-3 font-black text-red-600">{d.bloodGroup.replace('_', ' ')}</td>
                <td className="p-3 text-gray-700">{d.collectedVolumeMl} mL</td>
                <td className="p-3 text-xs text-gray-600">{d.anticoagulantType}</td>
                <td className="p-3">
                  <Badge variant={d.unitStatus === 'RELEASED_USABLE' ? 'success' : d.unitStatus === 'QUARANTINED' ? 'warning' : 'neutral'}>
                    {d.unitStatus.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="p-3 font-mono text-xs text-gray-600">{d.bagBarcode}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => onOpenTest(d)}>Test Serology</Button>
                    <Button variant="primary" size="sm" onClick={() => onOpenSeparate(d)}>Separate Components</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
