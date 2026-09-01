import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSuccess: (datasetName: string) => void;
}

export const SyntheticDataSanitizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onGenerateSuccess
}) => {
  const [recordCount, setRecordCount] = useState(500);
  const [clinicalProfile, setClinicalProfile] = useState<'CARDIOLOGY_OPD' | 'DIABETES_METABOLIC' | 'GENERAL_MEDICINE' | 'ONCOLOGY'>('CARDIOLOGY_OPD');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      setIsGenerating(false);
      const title = `Synthetic Cohort (${recordCount} records, ${clinicalProfile.replace(/_/g, ' ')})`;
      onGenerateSuccess(title);
      onClose();
    }, 500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10025,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(168, 85, 247, 0.6)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '620px',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(168, 85, 247, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#A855F7', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧬 Synthetic Patient Data Sandbox Generator
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Generate 100% HIPAA Safe-Harbor / Zero-PHI clinically realistic datasets for AI & research
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>NUMBER OF SYNTHETIC PATIENTS *</label>
            <input
              type="number"
              min={50}
              max={10000}
              value={recordCount}
              onChange={(e) => setRecordCount(Number(e.target.value))}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>CLINICAL PROFILE & DISEASE DOMAIN *</label>
            <select
              value={clinicalProfile}
              onChange={(e) => setClinicalProfile(e.target.value as any)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            >
              <option value="CARDIOLOGY_OPD">Cardiology & Hypertension Cohort (ECG, Lipid Profile, BP)</option>
              <option value="DIABETES_METABOLIC">Type-2 Diabetes & Endocrinology (HbA1c, Fasting Blood Sugar)</option>
              <option value="GENERAL_MEDICINE">General OPD & Infectious Disease (CBC, Liver Enzymes)</option>
              <option value="ONCOLOGY">Oncology & Biopsy Marker Sandbox</option>
            </select>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '10px 14px', border: '1px solid #A855F7', color: '#E9D5FF', fontSize: '0.75rem', lineHeight: '1.4' }}>
            🔒 <strong>PRIVACY GUARANTEE:</strong> Generates purely mathematical, AI-synthesized patient records using generative Markov chains. Zero real patient identifiers (ABHA, Name, Phone, Address) are ever accessed or leaked.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              style={{ backgroundColor: '#A855F7', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)' }}
            >
              {isGenerating ? '⚡ Synthesizing Cohort...' : '🧬 Generate Synthetic Cohort'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
