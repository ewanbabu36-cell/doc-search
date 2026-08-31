import React, { useState } from 'react';
import { Card, Badge, Button, Input } from '@docsearch/ui-kit';
import type { HospitalIncidentDto } from '@docsearch/api-contracts';

interface Props {
  incidents: HospitalIncidentDto[];
  onReport: () => void;
  onTriage: (inc: HospitalIncidentDto) => void;
  onRca: (inc: HospitalIncidentDto) => void;
  onSelect: (inc: HospitalIncidentDto) => void;
}

export const IncidentManagementView: React.FC<Props> = ({ incidents, onReport, onTriage, onRca, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filtered = incidents.filter((i) => {
    const matchSearch = i.incidentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.briefSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'ALL' || i.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hospital Clinical Incident & Safety Event Register</h2>
          <p className="text-xs text-gray-500">Non-punitive safety reporting, SAC matrix scoring, RCA initiation & investigation</p>
        </div>
        <Button variant="danger" onClick={onReport}>🚨 Report New Incident</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Search incidents, MRN, staff, department..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 bg-white"
        >
          <option value="ALL">All Incident Categories</option>
          <option value="MEDICATION_ERROR">Medication Error</option>
          <option value="PATIENT_FALL">Patient Fall</option>
          <option value="SURGICAL_COMPLICATION_NEVER_EVENT">Surgical Never Event</option>
          <option value="NEEDLE_STICK_SHARPS">Needle Stick / Sharps</option>
          <option value="HEALTHCARE_ASSOCIATED_INFECTION">HAI Infection</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100 border-b font-semibold text-gray-700">
            <tr>
              <th className="p-3">Incident #</th>
              <th className="p-3">Category & Summary</th>
              <th className="p-3">SAC Score</th>
              <th className="p-3">Department & Location</th>
              <th className="p-3">Status</th>
              <th className="p-3">Harm Level</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((inc) => (
              <tr key={inc.id} className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">{inc.incidentNumber}</td>
                <td className="p-3">
                  <p className="font-semibold text-gray-800">{inc.briefSummary}</p>
                  <p className="text-gray-500">{inc.category} | {inc.incidentDateTime.split('T')[0]}</p>
                </td>
                <td className="p-3">
                  <Badge variant={inc.sacScore === 'SAC_1_EXTREME_SENTINEL' ? 'danger' : inc.sacScore === 'SAC_2_MAJOR' ? 'warning' : 'neutral'}>
                    {inc.sacScore}
                  </Badge>
                </td>
                <td className="p-3">
                  <p className="font-medium text-gray-800">{inc.departmentName}</p>
                  <p className="text-gray-500">{inc.locationDetail}</p>
                </td>
                <td className="p-3">
                  <Badge variant={inc.status === 'CLOSED' ? 'success' : 'danger'}>{inc.status}</Badge>
                </td>
                <td className="p-3 text-gray-600">{inc.patientHarmLevel}</td>
                <td className="p-3 text-right space-x-1">
                  <Button variant="outline" size="sm" onClick={() => onSelect(inc)}>Details</Button>
                  {inc.status === 'REPORTED' && (
                    <Button variant="primary" size="sm" onClick={() => onTriage(inc)}>Triage</Button>
                  )}
                  {inc.status === 'RCA_IN_PROGRESS' && (
                    <Button variant="danger" size="sm" onClick={() => onRca(inc)}>RCA</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
