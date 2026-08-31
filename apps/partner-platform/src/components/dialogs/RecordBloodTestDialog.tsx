import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { BloodDonationDto, RecordBloodTestRequest, ABOGroup, RhFactor } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  donation: BloodDonationDto | null;
  onSubmit: (req: RecordBloodTestRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RecordBloodTestDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  donation,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [abo, setAbo] = useState<ABOGroup>('O');
  const [rh, setRh] = useState<RhFactor>('POSITIVE');
  const [antibody, setAntibody] = useState<'NEGATIVE' | 'POSITIVE_UNIDENTIFIED_ANTIBODIES'>('NEGATIVE');
  const [hiv, setHiv] = useState<'NON_REACTIVE' | 'REACTIVE'>('NON_REACTIVE');
  const [hbsag, setHbsag] = useState<'NON_REACTIVE' | 'REACTIVE'>('NON_REACTIVE');
  const [hcv, setHcv] = useState<'NON_REACTIVE' | 'REACTIVE'>('NON_REACTIVE');
  const [syphilis, setSyphilis] = useState<'NON_REACTIVE' | 'REACTIVE'>('NON_REACTIVE');
  const [malaria, setMalaria] = useState<'NEGATIVE' | 'POSITIVE'>('NEGATIVE');
  const [tech, setTech] = useState('Samantha Ray, SBB');
  const [pathologist, setPathologist] = useState('Dr. Alistair Vance, MD');
  const [passed, setPassed] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !donation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        donationId: donation.id,
        unitBarcode: donation.bagBarcode,
        aboGroupingResult: abo,
        rhFactorResult: rh,
        antibodyScreen: antibody,
        hivResult: hiv,
        hBsAgResult: hbsag,
        hcvResult: hcv,
        syphilisVDRLResult: syphilis,
        malariaResult: malaria,
        testingTechnicianName: tech,
        pathologistSignOffName: pathologist,
        isPassedForRelease: passed
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Infectious Disease & Immunohematology Testing</h2>
        <p className="text-xs text-gray-500 mb-4">{donation.donationNumber} — Bag: {donation.bagBarcode}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ABO Forward & Reverse</label>
              <select value={abo} onChange={(e) => setAbo(e.target.value as ABOGroup)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
                <option value="O">O</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rh Factor (D Antigen)</label>
              <select value={rh} onChange={(e) => setRh(e.target.value as RhFactor)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
                <option value="POSITIVE">Rh Positive (D+)</option>
                <option value="NEGATIVE">Rh Negative (D-)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Antibody Screen</label>
              <select value={antibody} onChange={(e) => setAntibody(e.target.value as 'NEGATIVE' | 'POSITIVE_UNIDENTIFIED_ANTIBODIES')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="NEGATIVE">Negative</option>
                <option value="POSITIVE_UNIDENTIFIED_ANTIBODIES">Positive (Unidentified)</option>
              </select>
            </div>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/40 p-3">
            <h3 className="text-xs font-bold text-red-900 mb-2">Transfusion-Transmissible Infections (TTI) Screen</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">HIV-1/2 NAT</label>
                <select value={hiv} onChange={(e) => setHiv(e.target.value as 'NON_REACTIVE' | 'REACTIVE')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                  <option value="NON_REACTIVE">Non-Reactive</option>
                  <option value="REACTIVE">Reactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">HBsAg (Hepatitis B)</label>
                <select value={hbsag} onChange={(e) => setHbsag(e.target.value as 'NON_REACTIVE' | 'REACTIVE')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                  <option value="NON_REACTIVE">Non-Reactive</option>
                  <option value="REACTIVE">Reactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">HCV Antibody</label>
                <select value={hcv} onChange={(e) => setHcv(e.target.value as 'NON_REACTIVE' | 'REACTIVE')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                  <option value="NON_REACTIVE">Non-Reactive</option>
                  <option value="REACTIVE">Reactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Syphilis (VDRL / RPR)</label>
                <select value={syphilis} onChange={(e) => setSyphilis(e.target.value as 'NON_REACTIVE' | 'REACTIVE')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                  <option value="NON_REACTIVE">Non-Reactive</option>
                  <option value="REACTIVE">Reactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Malaria Parasite Screen</label>
                <select value={malaria} onChange={(e) => setMalaria(e.target.value as 'NEGATIVE' | 'POSITIVE')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                  <option value="NEGATIVE">Negative</option>
                  <option value="POSITIVE">Positive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Testing Technologist</label>
              <Input value={tech} onChange={(e) => setTech(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pathologist Sign-off</label>
              <Input value={pathologist} onChange={(e) => setPathologist(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-green-900">
              <input type="checkbox" checked={passed} onChange={(e) => setPassed(e.target.checked)} className="rounded" />
              Passed all infectious and immunohematology checks for clinical release
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Sign & Record Results'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
