import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';

export const NabhChapterComplianceView: React.FC = () => {
  const chapters = [
    { code: 'AAC', title: 'Access, Assessment & Continuity of Care', score: '98.5%' },
    { code: 'COP', title: 'Care of Patients (ICU, Vulnerable, Restraints)', score: '96.0%' },
    { code: 'MOM', title: 'Management of Medication & High-Alert LASA', score: '94.2%' },
    { code: 'PRE', title: 'Patient Rights & Education', score: '99.0%' },
    { code: 'HIC', title: 'Hospital Infection Control & Surveillance', score: '99.0%' },
    { code: 'PSQ', title: 'Patient Safety & Quality Improvement', score: '97.5%' },
    { code: 'ROM', title: 'Responsibilities of Management', score: '100.0%' },
    { code: 'FMS', title: 'Facility Management & Safety', score: '98.0%' },
    { code: 'HRM', title: 'Human Resource Management & Staff Credentials', score: '97.0%' },
    { code: 'IMS', title: 'Information Management System & Medical Records', score: '99.2%' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">NABH 5th Edition Chapter Compliance Radar</h2>
        <p className="text-xs text-gray-500">10 accreditation chapters, clinical standards adherence & continuous audit scores</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {chapters.map((ch) => (
          <Card key={ch.code} className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-700">{ch.code}</span>
              <p className="text-xs font-semibold text-gray-800">{ch.title}</p>
            </div>
            <Badge variant="success" >{ch.score}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};
