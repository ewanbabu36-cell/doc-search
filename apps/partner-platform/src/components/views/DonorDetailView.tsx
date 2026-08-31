import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { BloodDonorDto, BloodDonorScreeningDto, BloodDonationDto } from '@docsearch/api-contracts';

interface Props {
  donor: BloodDonorDto;
  screenings: BloodDonorScreeningDto[];
  donations: BloodDonationDto[];
}

export const DonorDetailView: React.FC<Props> = ({ donor, screenings, donations }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{donor.fullName}</h2>
          <p className="text-xs text-gray-500">Donor ID: {donor.donorCode} | Phone: {donor.contactNumber}</p>
        </div>
        <Badge variant={donor.eligibilityStatus === 'ELIGIBLE_FOR_DONATION' ? 'success' : 'warning'}>
          {donor.eligibilityStatus.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-3 text-center">
          <span className="text-xs text-gray-500">Blood Group</span>
          <div className="text-xl font-black text-red-600 mt-1">{donor.bloodGroup.replace('_', ' ')}</div>
        </Card>
        <Card className="p-3 text-center">
          <span className="text-xs text-gray-500">Donations Count</span>
          <div className="text-xl font-black text-gray-800 mt-1">{donor.totalDonationsCount}</div>
        </Card>
        <Card className="p-3 text-center">
          <span className="text-xs text-gray-500">Last Donation</span>
          <div className="text-sm font-bold text-gray-800 mt-2">{donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}</div>
        </Card>
        <Card className="p-3 text-center">
          <span className="text-xs text-gray-500">Next Eligible Date</span>
          <div className="text-sm font-bold text-green-700 mt-2">{new Date(donor.nextEligibleDate).toLocaleDateString()}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Screening History</h3>
          <div className="space-y-2">
            {screenings.map((s) => (
              <div key={s.id} className="p-2 border rounded text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold">{s.screeningCode}</span> • Hb: {s.hemoglobinGdl} g/dL • BP: {s.systolicBp}/{s.diastolicBp}
                </div>
                <Badge variant={s.eligibilityDecision === 'ELIGIBLE_FOR_DONATION' ? 'success' : 'warning'}>
                  {s.eligibilityDecision}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Donation Phlebotomy History</h3>
          <div className="space-y-2">
            {donations.map((d) => (
              <div key={d.id} className="p-2 border rounded text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold">{d.donationNumber}</span> • Vol: {d.collectedVolumeMl}ml • {d.bagBarcode}
                </div>
                <Badge variant={d.unitStatus === 'RELEASED_USABLE' ? 'success' : 'neutral'}>
                  {d.unitStatus}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
