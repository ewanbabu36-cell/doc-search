import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateDonorRequest, TransfusionBloodGroup, DonorType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateDonorRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateDonorDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('1995-04-12');
  const [bloodGroup, setBloodGroup] = useState<TransfusionBloodGroup>('O_POSITIVE');
  const [contact, setContact] = useState('+1 (555) 019-2834');
  const [email, setEmail] = useState('');
  const [donorType, setDonorType] = useState<DonorType>('VOLUNTARY_NON_REMUNERATED');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        fullName: name,
        gender,
        dateOfBirth: new Date(dob).toISOString(),
        bloodGroup,
        contactNumber: contact,
        email: email || undefined,
        donorType
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Register Blood Donor</h2>
        <p className="text-xs text-gray-500 mb-4">Capture donor demographic, blood group & voluntary consent</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Legal Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Jonathan Smith" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as TransfusionBloodGroup)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="O_POSITIVE">O Positive (O+)</option>
                <option value="O_NEGATIVE">O Negative (O-)</option>
                <option value="A_POSITIVE">A Positive (A+)</option>
                <option value="A_NEGATIVE">A Negative (A-)</option>
                <option value="B_POSITIVE">B Positive (B+)</option>
                <option value="B_NEGATIVE">B Negative (B-)</option>
                <option value="AB_POSITIVE">AB Positive (AB+)</option>
                <option value="AB_NEGATIVE">AB Negative (AB-)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Donor Category</label>
              <select value={donorType} onChange={(e) => setDonorType(e.target.value as DonorType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="VOLUNTARY_NON_REMUNERATED">Voluntary Non-Remunerated</option>
                <option value="REPLACEMENT_FAMILY">Replacement Family</option>
                <option value="DIRECTED_PATIENT_SPECIFIC">Directed Patient Specific</option>
                <option value="AUTOLOGOUS_PRE_OP">Autologous Pre-Op</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address (Optional)</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="donor@example.com" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Donor'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
