import React, { useState, useEffect } from 'react';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import { clinicalInvestigationService, ClinicalCalculators } from '../../services/clinical-investigation-service.js';
import {
  MASTER_CLINICAL_TEST_LIBRARY,
  resolveGenderSpecificParameter
} from '../../services/clinical-test-library.js';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export interface EditableReportParameter {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: InvestigationOrderDto | null;
  onReportSaved?: (updatedOrder: InvestigationOrderDto) => void;
  onSaved?: (updatedOrder: InvestigationOrderDto) => void;
}

export const DynamicReportCustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  onReportSaved,
  onSaved
}) => {
  const profile = getVerifiedRoleProfile();

  // Patient Demographic State
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('38');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [sampleBarcode, setSampleBarcode] = useState('');
  const [patientMrn, setPatientMrn] = useState('');

  // Investigation Metadata
  const [testTitle, setTestTitle] = useState('');
  const [specimenType, setSpecimenType] = useState('');
  const [departmentName, setDepartmentName] = useState('');

  // Parameters Table
  const [parameters, setParameters] = useState<EditableReportParameter[]>([]);

  // Clinical Impression & Signatures
  const [impression, setImpression] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [pathologistName, setPathologistName] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('Routine clinical update / value customization');

  // Lab Header Customization
  const [labName, setLabName] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [nablCertNo, setNablCertNo] = useState('');

  // Populate from order when opened
  useEffect(() => {
    if (!order) return;
    const meta = (order.metadata as any) || {};

    setPatientName(order.patientName || '');
    setPatientAge(String((order as any).patientAge || 38));
    setPatientGender(order.patientGender === 'FEMALE' ? 'Female' : 'Male');
    setPatientPhone(meta.patientPhone || '');
    setPatientAddress(meta.patientAddress || '');
    setReferringDoctor(order.orderingDoctorName || 'Self / Direct Walk-In');
    setSampleBarcode(meta.sampleBarcode || order.orderNumber || '');
    setPatientMrn(order.patientMrn || '');

    setTestTitle(order.report?.reportTitle || order.investigationName || '');
    setSpecimenType(order.specimenType || 'EDTA Whole Blood');
    setDepartmentName(order.investigationCategory || 'Clinical Pathology');

    setImpression(order.report?.impression || 'Diagnostic findings verified by pathologist. Correlate clinically.');
    setTechnicianName(order.report?.reportingClinician || profile.technicianName || 'Medical Lab Technologist');
    setPathologistName(order.report?.verifyingPathologist || profile.pathologistName || 'Consultant Pathologist');

    setLabName((profile.entityLegalName || 'DOC SEARCH CENTRAL PATHOLOGY LABORATORY').toUpperCase());
    setLabAddress(profile.officialAddress || '');
    setNablCertNo(profile.nablCertificateNo || 'MC-10892');

    // Convert results to editable parameters
    if (order.results && order.results.length > 0) {
      setParameters(
        order.results.map((r, idx) => ({
          id: (r as any).parameterCode || r.id || String(idx + 1),
          name: r.parameterName || '',
          value: r.resultValue || '',
          unit: r.unit || '',
          referenceRange: r.referenceRange || '',
          flag: (r.abnormalFlag === 'NORMAL' ? 'NORMAL' : r.abnormalFlag === 'HIGH' ? 'HIGH' : r.abnormalFlag === 'LOW' ? 'LOW' : 'CRITICAL') as any
        }))
      );
    } else {
      setParameters([]);
    }
  }, [order, profile]);

  if (!isOpen || !order) return null;

  // Real-time auto-flagging on value edit
  const handleUpdateParamValue = (index: number, val: string) => {
    setParameters((prev) => {
      const updated = [...prev];
      const target = updated[index];
      if (!target) return prev;

      const item: EditableReportParameter = { ...target, value: val };
      const num = parseFloat(val);
      if (!isNaN(num) && item.referenceRange) {
        const range = item.referenceRange.trim();
        if (range.startsWith('<')) {
          const maxVal = parseFloat(range.replace('<', '').trim());
          if (!isNaN(maxVal)) item.flag = num > maxVal ? 'HIGH' : 'NORMAL';
        } else if (range.startsWith('>')) {
          const minVal = parseFloat(range.replace('>', '').trim());
          if (!isNaN(minVal)) item.flag = num < minVal ? 'LOW' : 'NORMAL';
        } else {
          const match = range.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
          if (match && match[1] && match[2]) {
            const minVal = parseFloat(match[1]);
            const maxVal = parseFloat(match[2]);
            if (!isNaN(minVal) && !isNaN(maxVal)) {
              if (num < minVal) item.flag = 'LOW';
              else if (num > maxVal) item.flag = 'HIGH';
              else item.flag = 'NORMAL';
            }
          }
        }
      }
      updated[index] = item;
      return updated;
    });
  };

  // Gender adaptation
  const handleGenderChange = (newGender: string) => {
    setPatientGender(newGender);
    setParameters((prev) => {
      const activeLib = MASTER_CLINICAL_TEST_LIBRARY[order.investigationCode || 'CBC'];
      return prev.map((param) => {
        const libDef = activeLib?.parameters.find(
          (lp) => lp.id === param.id || lp.name.toLowerCase() === param.name.toLowerCase()
        );
        if (libDef) {
          const resolved = resolveGenderSpecificParameter(libDef, newGender);
          return {
            ...param,
            value: resolved.value,
            referenceRange: resolved.referenceRange,
            flag: resolved.flag
          };
        }
        const mockDef = {
          id: param.id,
          code: param.name.slice(0, 6).toUpperCase(),
          name: param.name,
          unit: param.unit,
          referenceRange: param.referenceRange,
          defaultValue: param.value
        };
        const resolved = resolveGenderSpecificParameter(mockDef, newGender);
        return {
          ...param,
          value: resolved.value,
          referenceRange: resolved.referenceRange,
          flag: resolved.flag
        };
      });
    });
  };

  const handleAddCustomParam = () => {
    setParameters([
      ...parameters,
      {
        id: String(parameters.length + 1),
        name: 'Custom Parameter',
        value: '',
        unit: 'mg/dL',
        referenceRange: '10 - 50',
        flag: 'NORMAL'
      }
    ]);
  };

  const handleRemoveParam = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleAutoCalculate = () => {
    setParameters((prev) => {
      const updated = [...prev];
      const getVal = (keyword: string): number => {
        const found = updated.find((p) => p.name.toLowerCase().includes(keyword.toLowerCase()));
        return found ? parseFloat(found.value) || 0 : 0;
      };

      const upsertParam = (name: string, value: string, unit: string, referenceRange: string) => {
        const idx = updated.findIndex((p) => p.name.toLowerCase().includes(name.toLowerCase()));
        if (idx >= 0 && updated[idx]) {
          const existing = updated[idx]!;
          const num = parseFloat(value);
          let flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' = 'NORMAL';
          const match = referenceRange.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
          if (match && match[1] && match[2] && !isNaN(num)) {
            const min = parseFloat(match[1]);
            const max = parseFloat(match[2]);
            if (num < min) flag = 'LOW';
            else if (num > max) flag = 'HIGH';
          }
          updated[idx] = { ...existing, value, flag };
        } else {
          updated.push({
            id: String(updated.length + 1),
            name,
            value,
            unit,
            referenceRange,
            flag: 'NORMAL'
          });
        }
      };

      // CBC Indices
      const hb = getVal('Hemoglobin') || getVal('Hb');
      const rbc = getVal('RBC') || getVal('Red Blood');
      const pcv = getVal('PCV') || getVal('Hematocrit');
      if (hb > 0 && rbc > 0 && pcv > 0) {
        const indices = ClinicalCalculators.calculateCbcIndices(hb, rbc, pcv);
        if (indices) {
          upsertParam('MCV (Mean Corpuscular Volume)', String(indices.mcv), 'fL', '80.0 - 100.0');
          upsertParam('MCH (Mean Corpuscular Hemoglobin)', String(indices.mch), 'pg', '27.0 - 33.0');
          upsertParam('MCHC (Mean Corpuscular Hb Conc)', String(indices.mchc), 'g/dL', '32.0 - 36.0');
        }
      }

      // Renal eGFR
      const creatinine = getVal('Creatinine');
      const ageNum = parseInt(patientAge, 10) || 40;
      const isFem = patientGender.toLowerCase().includes('fem');
      if (creatinine > 0) {
        const egfr = ClinicalCalculators.calculateEgfr(creatinine, ageNum, isFem);
        if (egfr) {
          upsertParam('eGFR (CKD-EPI Calculated)', String(egfr), 'mL/min/1.73m²', '> 90 (Normal)');
        }
      }

      return updated;
    });
  };

  const handleSaveReport = () => {
    const updatedResults = parameters.map((p, idx) => ({
      id: `res-${order.id}-${idx}`,
      tenantId: order.tenantId,
      partnerId: order.partnerId,
      organizationId: order.organizationId,
      orderId: order.id,
      patientId: order.patientId,
      parameterId: p.id,
      parameterCode: p.name.slice(0, 8).toUpperCase(),
      parameterName: p.name,
      testCategory: departmentName,
      resultValue: p.value,
      numericValue: parseFloat(p.value) || undefined,
      unit: p.unit,
      referenceRange: p.referenceRange,
      abnormalFlag: p.flag as any,
      isCritical: p.flag === 'CRITICAL',
      resultStatus: 'VERIFIED' as const,
      version: ((order.report?.reportVersion || 1) + 1),
      verifiedAt: new Date().toISOString(),
      verifiedBy: pathologistName,
      createdAt: order.createdAt,
      updatedAt: new Date().toISOString()
    }));

    const updatedReport = {
      id: order.report?.id || `rep-${order.id}`,
      tenantId: order.tenantId,
      partnerId: order.partnerId,
      organizationId: order.organizationId,
      orderId: order.id,
      patientId: order.patientId,
      reportNumber: order.report?.reportNumber || order.orderNumber,
      reportTitle: testTitle,
      clinicalFindings: updatedResults.map((r) => `${r.parameterName}: ${r.resultValue} ${r.unit}`).join(' | '),
      impression,
      reportingClinician: technicianName,
      verifyingPathologist: pathologistName,
      reportStatus: 'FINAL' as const,
      reportVersion: ((order.report?.reportVersion || 1) + 1),
      finalizedAt: new Date().toISOString(),
      createdAt: order.report?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedOrder: InvestigationOrderDto = {
      ...order,
      patientName,
      patientGender: patientGender.toUpperCase() as any,
      orderingDoctorName: referringDoctor,
      investigationName: testTitle,
      investigationCategory: departmentName as any,
      specimenType: specimenType as any,
      isAbnormal: updatedResults.some((r) => r.abnormalFlag !== 'NORMAL'),
      isCritical: updatedResults.some((r) => r.isCritical),
      results: updatedResults as any,
      report: updatedReport,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(order.metadata || {}),
        patientAge,
        patientPhone,
        patientAddress,
        sampleBarcode,
        lastAmendedReason: amendmentReason,
        lastAmendedAt: new Date().toISOString(),
        labBranding: {
          labName,
          labAddress,
          nablCertNo
        }
      }
    };

    clinicalInvestigationService.updateDirectWalkInOrder(updatedOrder);
    if (onReportSaved) onReportSaved(updatedOrder);
    if (onSaved) onSaved(updatedOrder);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 12500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          borderRadius: '16px',
          border: '1.5px solid #9333EA',
          width: '98vw',
          maxWidth: '1440px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0B1120',
            borderBottom: '1.5px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(147, 51, 234, 0.2)',
                border: '1px solid #9333EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              ✏️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                  DYNAMIC PATHOLOGY REPORT EDITOR & CUSTOMIZER
                </h2>
                <span style={{ fontSize: '0.6875rem', backgroundColor: '#9333EA', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                  NABL ISO 15189 AMENDMENT
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Modify observed values, reference intervals, flags, add custom parameters, or update clinical impression.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSaveReport}
              style={{
                backgroundColor: '#10B981',
                color: '#064E3B',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '0.85rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              💾 Save & Re-Issue Report →
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Cancel
            </button>
          </div>
        </div>

        {/* Editor Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Section 1: Patient Demographics & Identification */}
          <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>
                👤 Patient Demographics & Sample Details:
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                Report #: <strong style={{ color: '#FFF' }}>{order.report?.reportNumber || order.orderNumber}</strong> (v{order.report?.reportVersion || 1})
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.78rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Patient Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Age & Biological Gender *</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    style={{ width: '40%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 8px', color: '#FFF' }}
                  />
                  <select
                    value={patientGender}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    style={{ width: '60%', backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '6px', padding: '6px 8px', color: '#38BDF8', fontWeight: 800 }}
                  >
                    <option value="Male">♂ Male</option>
                    <option value="Female">♀ Female</option>
                    <option value="Other">⚧ Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Contact Phone</label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Referring Doctor *</label>
                <input
                  type="text"
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Sample Barcode</label>
                <input
                  type="text"
                  value={sampleBarcode}
                  onChange={(e) => setSampleBarcode(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>UHID / MRN</label>
                <input
                  type="text"
                  value={patientMrn}
                  onChange={(e) => setPatientMrn(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Investigation Header Details */}
          <div style={{ backgroundColor: '#1E293B', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#A855F7', display: 'block', marginBottom: '8px' }}>
              🔬 Test Investigation & Specimen Details:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '0.78rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Test Investigation Name</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Department / Specialty</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Specimen / Matrix</label>
                <input
                  type="text"
                  value={specimenType}
                  onChange={(e) => setSpecimenType(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Parameters Table */}
          <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC' }}>
                  🧪 Analyte Results & Custom Reference Ranges:
                </span>
                <span style={{ fontSize: '0.6875rem', backgroundColor: patientGender === 'Female' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: patientGender === 'Female' ? '#F472B6' : '#38BDF8', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                  {patientGender === 'Female' ? '♀ FEMALE NORMS' : '♂ MALE NORMS'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleAutoCalculate}
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    color: '#22D3EE',
                    border: '1px solid #06B6D4',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  title="Auto-calculate derived biomarkers like eGFR, MCV/MCH/MCHC"
                >
                  ⚡ Auto-Calculate
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomParam}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#38BDF8',
                    border: '1px solid #38BDF8',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Add Parameter
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px', width: '35%' }}>PARAMETER NAME</th>
                  <th style={{ padding: '8px', width: '18%' }}>OBSERVED VALUE</th>
                  <th style={{ padding: '8px', width: '12%' }}>UNITS</th>
                  <th style={{ padding: '8px', width: '23%' }}>REFERENCE INTERVAL ({patientGender.toUpperCase()})</th>
                  <th style={{ padding: '8px', width: '8%' }}>FLAG</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>✕</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((p, idx) => (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '6px 8px', color: '#64748B' }}>{idx + 1}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const updated = [...parameters];
                          if (updated[idx]) updated[idx]!.name = e.target.value;
                          setParameters(updated);
                        }}
                        style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#FFF' }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => handleUpdateParamValue(idx, e.target.value)}
                        style={{ width: '100%', backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '4px', padding: '4px 8px', color: '#38BDF8', fontWeight: 800 }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        value={p.unit}
                        onChange={(e) => {
                          const updated = [...parameters];
                          if (updated[idx]) updated[idx]!.unit = e.target.value;
                          setParameters(updated);
                        }}
                        style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#94A3B8' }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        value={p.referenceRange}
                        onChange={(e) => {
                          const updated = [...parameters];
                          if (updated[idx]) updated[idx]!.referenceRange = e.target.value;
                          setParameters(updated);
                        }}
                        style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#94A3B8' }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <select
                        value={p.flag}
                        onChange={(e) => {
                          const updated = [...parameters];
                          if (updated[idx]) updated[idx]!.flag = e.target.value as any;
                          setParameters(updated);
                        }}
                        style={{
                          backgroundColor: p.flag === 'HIGH' ? '#7F1D1D' : p.flag === 'LOW' ? '#831843' : p.flag === 'CRITICAL' ? '#991B1B' : '#0F172A',
                          color: p.flag === 'NORMAL' ? '#34D399' : '#FCA5A5',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          padding: '4px',
                          fontWeight: 700,
                          fontSize: '0.6875rem'
                        }}
                      >
                        <option value="NORMAL">NORMAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="LOW">LOW</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam(idx)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 800 }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Clinical Impression, Remarks & Signatures */}
          <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', display: 'block', marginBottom: '8px' }}>
              📝 Clinical Interpretation, Reason & Signatures:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Pathologist Clinical Impression</label>
                <textarea
                  rows={2}
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Reporting Technologist</label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Verifying Pathologist</label>
                <input
                  type="text"
                  value={pathologistName}
                  onChange={(e) => setPathologistName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.72rem', marginBottom: '3px' }}>
                Amendment / Revision Audit Reason (NABL ISO 15189)
              </label>
              <input
                type="text"
                value={amendmentReason}
                onChange={(e) => setAmendmentReason(e.target.value)}
                placeholder="e.g. Transcription correction, re-run verification, reference interval adjustment"
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF', fontSize: '0.75rem' }}
              />
            </div>

            {/* Laboratory Branding Header Overrides */}
            <div style={{ marginTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A855F7', display: 'block', marginBottom: '6px' }}>
                🏢 Diagnostic Laboratory Branding (On This Report):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.7rem' }}>Lab Legal Name</label>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '4px', padding: '5px 8px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.7rem' }}>Address & Contacts</label>
                  <input
                    type="text"
                    value={labAddress}
                    onChange={(e) => setLabAddress(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '4px', padding: '5px 8px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.7rem' }}>NABL Cert No.</label>
                  <input
                    type="text"
                    value={nablCertNo}
                    onChange={(e) => setNablCertNo(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '4px', padding: '5px 8px', color: '#FFF' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
