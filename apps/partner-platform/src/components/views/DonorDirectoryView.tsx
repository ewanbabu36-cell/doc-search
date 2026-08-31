import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodDonorDto } from '@docsearch/api-contracts';

interface Props {
  donors: BloodDonorDto[];
  onOpenScreening: (donor: BloodDonorDto) => void;
  onOpenDonation: (donor: BloodDonorDto) => void;
  onOpenRegister: () => void;
}

export const DonorDirectoryView: React.FC<Props> = ({
  donors,
  onOpenScreening,
  onOpenDonation,
  onOpenRegister
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blood Donor Registry</h2>
          <p className="text-xs text-gray-500">Manage voluntary, replacement & directed blood donors with deferral tracking</p>
        </div>
        <Button variant="primary" onClick={onOpenRegister}>+ Register New Donor</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Donor ID</th>
              <th className="p-3">Full Name</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Category</th>
              <th className="p-3">Eligibility Status</th>
              <th className="p-3">Total Donations</th>
              <th className="p-3">Next Eligible</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {donors.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{d.donorCode}</td>
                <td className="p-3 font-semibold text-gray-900">{d.fullName}</td>
                <td className="p-3 font-black text-red-600">{d.bloodGroup.replace('_', ' ')}</td>
                <td className="p-3 text-xs text-gray-600">{d.donorType.replace(/_/g, ' ')}</td>
                <td className="p-3">
                  <Badge variant={d.eligibilityStatus === 'ELIGIBLE_FOR_DONATION' ? 'success' : 'warning'}>
                    {d.eligibilityStatus.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="p-3 text-center font-bold text-gray-700">{d.totalDonationsCount}</td>
                <td className="p-3 text-xs text-gray-600">{new Date(d.nextEligibleDate).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => onOpenScreening(d)}>Screen</Button>
                    <Button variant="primary" size="sm" onClick={() => onOpenDonation(d)} disabled={d.eligibilityStatus !== 'ELIGIBLE_FOR_DONATION'}>Collect</Button>
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
