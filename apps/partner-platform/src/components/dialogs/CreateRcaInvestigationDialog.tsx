import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { HospitalIncidentDto, CreateIncidentRcaRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  incident: HospitalIncidentDto;
  onClose: () => void;
  onSubmit: (data: CreateIncidentRcaRequest) => Promise<void>;
}

export const CreateRcaInvestigationDialog: React.FC<Props> = ({ isOpen, incident, onClose, onSubmit }) => {
  const [leadInvestigator, setLeadInvestigator] = useState('Dr. Radhika Sharma (Quality Chair)');
  const [investigationTeamInput, setInvestigationTeamInput] = useState('Dr. Radhika Sharma, Pharm. Sunita Patil, Sister Sarala Devi');
  
  // 5-Whys
  const [why1Q, setWhy1Q] = useState('Why did the error occur?');
  const [why1A, setWhy1A] = useState('Look-alike medication administered without noticing label difference');
  const [why2Q, setWhy2Q] = useState('Why was the label misidentified?');
  const [why2A, setWhy2A] = useState('Packaging and vial color geometry were identical');
  const [why3Q, setWhy3Q] = useState('Why were vials stored together?');
  const [why3A, setWhy3A] = useState('No physical divider or tall-man lettering on ward shelf bin');
  const [why4Q, setWhy4Q] = useState('Why was dual signoff bypassed?');
  const [why4A, setWhy4A] = useState('Second nurse occupied in adjacent code yellow emergency');
  const [why5Q, setWhy5Q] = useState('Why was barcode scanning skipped?');
  const [why5A, setWhy5A] = useState('Bedside scanner battery was docked for recharging');

  const [peopleInput, setPeopleInput] = useState('Fatigued nurse during peak rush, second nurse in code');
  const [processInput, setProcessInput] = useState('Bypassed dual signoff, unsegregated LASA drawer');
  const [equipmentInput, setEquipmentInput] = useState('Docked barcode scanner');
  const [environmentInput, setEnvironmentInput] = useState('Shift changeover distraction');
  const [managementInput, setManagementInput] = useState('Lack of tall-man bin dividers');

  const [rootCauseStatement, setRootCauseStatement] = useState('Systemic failure in LASA physical segregation at ward level combined with unavailability of bedside barcode scanning.');
  const [contributingFactors, setContributingFactors] = useState('Packaging similarity, concurrent code yellow, and shift handover rush.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        incidentId: incident.id,
        leadInvestigator,
        investigationTeam: investigationTeamInput.split(',').map((t) => t.trim()),
        fiveWhysAnalysis: [
          { step: 1, whyQuestion: why1Q, becauseAnswer: why1A },
          { step: 2, whyQuestion: why2Q, becauseAnswer: why2A },
          { step: 3, whyQuestion: why3Q, becauseAnswer: why3A },
          { step: 4, whyQuestion: why4Q, becauseAnswer: why4A },
          { step: 5, whyQuestion: why5Q, becauseAnswer: why5A }
        ],
        fishboneCategories: {
          people: peopleInput.split(',').map((p) => p.trim()),
          process: processInput.split(',').map((p) => p.trim()),
          equipment: equipmentInput.split(',').map((p) => p.trim()),
          environment: environmentInput.split(',').map((p) => p.trim()),
          management: managementInput.split(',').map((p) => p.trim())
        },
        rootCauseStatement,
        contributingFactors
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Conduct Root Cause Analysis (RCA & 5-Whys) — {incident.incidentNumber}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Investigator</label>
              <Input value={leadInvestigator} onChange={(e) => setLeadInvestigator(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Team Members (comma separated)</label>
              <Input value={investigationTeamInput} onChange={(e) => setInvestigationTeamInput(e.target.value)} required />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <h3 className="text-xs font-bold text-blue-900 uppercase">5-Whys Analytical Drill-Down</h3>
            <div className="space-y-1 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Input value={why1Q} onChange={(e) => setWhy1Q(e.target.value)} placeholder="Why 1 Question" />
                <Input value={why1A} onChange={(e) => setWhy1A(e.target.value)} placeholder="Because 1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={why2Q} onChange={(e) => setWhy2Q(e.target.value)} placeholder="Why 2 Question" />
                <Input value={why2A} onChange={(e) => setWhy2A(e.target.value)} placeholder="Because 2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={why3Q} onChange={(e) => setWhy3Q(e.target.value)} placeholder="Why 3 Question" />
                <Input value={why3A} onChange={(e) => setWhy3A(e.target.value)} placeholder="Because 3" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={why4Q} onChange={(e) => setWhy4Q(e.target.value)} placeholder="Why 4 Question" />
                <Input value={why4A} onChange={(e) => setWhy4A(e.target.value)} placeholder="Because 4" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={why5Q} onChange={(e) => setWhy5Q(e.target.value)} placeholder="Why 5 Question" />
                <Input value={why5A} onChange={(e) => setWhy5A(e.target.value)} placeholder="Because 5" />
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border rounded-lg space-y-2">
            <h3 className="text-xs font-bold text-gray-800 uppercase">Ishikawa / Fishbone Factors</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600">People</label>
                <Input value={peopleInput} onChange={(e) => setPeopleInput(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600">Process</label>
                <Input value={processInput} onChange={(e) => setProcessInput(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600">Equipment</label>
                <Input value={equipmentInput} onChange={(e) => setEquipmentInput(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600">Environment</label>
                <Input value={environmentInput} onChange={(e) => setEnvironmentInput(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-gray-600">Management & Systemic</label>
                <Input value={managementInput} onChange={(e) => setManagementInput(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Final Root Cause Statement</label>
            <Input value={rootCauseStatement} onChange={(e) => setRootCauseStatement(e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contributing Factors</label>
            <Input value={contributingFactors} onChange={(e) => setContributingFactors(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Finalizing...' : 'Submit RCA to Committee'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
