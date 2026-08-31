import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AbhaAccountDto } from '@docsearch/api-contracts';

interface Props {
  accounts: AbhaAccountDto[];
  onCreateAbha: () => void;
}

export const AbhaManagementView: React.FC<Props> = ({ accounts, onCreateAbha }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">ABHA (Ayushman Bharat Health Account) Master Registry</h2>
          <p className="text-xs text-gray-500">14-Digit ABHA Numbers, ABHA Addresses (@abdm), KYC verification status, and MPI mappings</p>
        </div>
        <Button variant="primary" onClick={onCreateAbha}>+ Create / Link ABHA ID</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className="p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-sm font-bold text-blue-900">{acc.abhaAddress}</span>
                <span className="text-xs text-gray-500 block font-mono">ABHA: {acc.abhaNumber}</span>
              </div>
              <Badge variant="success">{acc.kycStatus}</Badge>
            </div>
            <div className="text-xs space-y-1 text-gray-700">
              <p>Patient Name: <strong className="text-gray-900">{acc.patientName}</strong> (MRN: {acc.patientMrn})</p>
              <p>Mobile: {acc.mobileNumber} | DOB: {acc.dateOfBirth} ({acc.gender})</p>
              <p className="text-gray-500 truncate" title={acc.address}>{acc.address}</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t text-xs">
              <span className="text-indigo-700 font-semibold">{acc.linkedCareContextsCount} Care Contexts Linked</span>
              <span className="text-gray-400">{acc.createdAt.substring(0, 10)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
