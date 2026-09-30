import React, { useState, useMemo } from 'react';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';
import { ProfileUpdateRequiredAlertModal } from '../common/ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import { clinicalInvestigationService, ClinicalCalculators } from '../../services/clinical-investigation-service.js';
import {
  MASTER_CLINICAL_TEST_LIBRARY,
  CLINICAL_DEPARTMENTS,
  resolveGenderSpecificParameter,
  getMergedClinicalTestLibrary,
  type ClinicalTestProfileDef
} from '../../services/clinical-test-library.js';
import { ClinicalTestLibraryDropdown } from '../common/ClinicalTestLibraryDropdown.js';
import { ClinicalTestLibraryExplorerModal } from './ClinicalTestLibraryExplorerModal.js';

export interface TestParameterItem {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
}

export interface PresetTestCatalog {
  name: string;
  specimen: string;
  department: string;
  parameters: TestParameterItem[];
}

const PRESET_TESTS: Record<string, PresetTestCatalog> = {
  CBC: {
    name: 'COMPLETE BLOOD COUNT (CBC WITH 5-PART DIFF)',
    specimen: 'EDTA Whole Blood (2 ml)',
    department: 'Hematology & Clinical Pathology',
    parameters: [
      { id: '1', name: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', flag: 'NORMAL' },
      { id: '2', name: 'Total Leukocyte Count (WBC)', value: '7,800', unit: '/cumm', referenceRange: '4,000 - 11,000', flag: 'NORMAL' },
      { id: '3', name: 'Platelet Count', value: '2.6', unit: 'Lakhs/cumm', referenceRange: '1.5 - 4.5', flag: 'NORMAL' },
      { id: '4', name: 'Red Blood Cell (RBC) Count', value: '4.9', unit: 'million/uL', referenceRange: '4.5 - 5.5', flag: 'NORMAL' },
      { id: '5', name: 'Packed Cell Volume (PCV/Hematocrit)', value: '42.5', unit: '%', referenceRange: '40.0 - 50.0', flag: 'NORMAL' },
      { id: '6', name: 'Neutrophils', value: '64', unit: '%', referenceRange: '40 - 75', flag: 'NORMAL' },
      { id: '7', name: 'Lymphocytes', value: '28', unit: '%', referenceRange: '20 - 45', flag: 'NORMAL' },
      { id: '8', name: 'Eosinophils', value: '04', unit: '%', referenceRange: '01 - 06', flag: 'NORMAL' }
    ]
  },
  LIPID: {
    name: 'LIPID PROFILE COMPREHENSIVE',
    specimen: 'Serum Fasting (3 ml)',
    department: 'Clinical Biochemistry',
    parameters: [
      { id: '1', name: 'Total Cholesterol', value: '175', unit: 'mg/dL', referenceRange: '< 200 (Desirable)', flag: 'NORMAL' },
      { id: '2', name: 'Triglycerides', value: '135', unit: 'mg/dL', referenceRange: '< 150 (Normal)', flag: 'NORMAL' },
      { id: '3', name: 'HDL Cholesterol (Good)', value: '48', unit: 'mg/dL', referenceRange: '> 40 (Optimal)', flag: 'NORMAL' },
      { id: '4', name: 'LDL Cholesterol (Bad)', value: '100', unit: 'mg/dL', referenceRange: '< 100 (Optimal)', flag: 'NORMAL' },
      { id: '5', name: 'VLDL Cholesterol', value: '27', unit: 'mg/dL', referenceRange: '< 30', flag: 'NORMAL' }
    ]
  },
  GLUCOSE: {
    name: 'DIABETIC PROFILE (FASTING & POST PRANDIAL SUGAR + HbA1c)',
    specimen: 'Fluoride Plasma & Whole Blood',
    department: 'Clinical Biochemistry',
    parameters: [
      { id: '1', name: 'Fasting Blood Glucose (FBS)', value: '92', unit: 'mg/dL', referenceRange: '70 - 99 (Normal)', flag: 'NORMAL' },
      { id: '2', name: 'Post-Prandial Glucose (PPBS - 2 hrs)', value: '128', unit: 'mg/dL', referenceRange: '< 140 (Normal)', flag: 'NORMAL' },
      { id: '3', name: 'HbA1c (Glycated Hemoglobin)', value: '5.6', unit: '%', referenceRange: '< 5.7 (Normal)', flag: 'NORMAL' },
      { id: '4', name: 'Estimated Average Glucose (eAG)', value: '114', unit: 'mg/dL', referenceRange: '90 - 120', flag: 'NORMAL' }
    ]
  },
  LFT: {
    name: 'LIVER FUNCTION TEST (LFT)',
    specimen: 'Serum (2 ml)',
    department: 'Clinical Biochemistry',
    parameters: [
      { id: '1', name: 'Bilirubin Total', value: '0.8', unit: 'mg/dL', referenceRange: '0.2 - 1.2', flag: 'NORMAL' },
      { id: '2', name: 'Bilirubin Direct', value: '0.2', unit: 'mg/dL', referenceRange: '0.0 - 0.3', flag: 'NORMAL' },
      { id: '3', name: 'SGOT / AST', value: '28', unit: 'U/L', referenceRange: '10 - 40', flag: 'NORMAL' },
      { id: '4', name: 'SGPT / ALT', value: '32', unit: 'U/L', referenceRange: '10 - 45', flag: 'NORMAL' },
      { id: '5', name: 'Alkaline Phosphatase (ALP)', value: '85', unit: 'U/L', referenceRange: '40 - 129', flag: 'NORMAL' },
      { id: '6', name: 'Total Protein', value: '7.2', unit: 'g/dL', referenceRange: '6.4 - 8.3', flag: 'NORMAL' },
      { id: '7', name: 'Serum Albumin', value: '4.4', unit: 'g/dL', referenceRange: '3.5 - 5.2', flag: 'NORMAL' }
    ]
  },
  KFT: {
    name: 'KIDNEY / RENAL FUNCTION TEST (KFT / RFT)',
    specimen: 'Serum (2 ml)',
    department: 'Clinical Biochemistry',
    parameters: [
      { id: '1', name: 'Blood Urea Nitrogen (BUN)', value: '14.5', unit: 'mg/dL', referenceRange: '7.0 - 20.0', flag: 'NORMAL' },
      { id: '2', name: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.7 - 1.3', flag: 'NORMAL' },
      { id: '3', name: 'Serum Uric Acid', value: '5.2', unit: 'mg/dL', referenceRange: '3.5 - 7.2', flag: 'NORMAL' },
      { id: '4', name: 'eGFR (Calculated)', value: '105', unit: 'mL/min/1.73m²', referenceRange: '> 90 (Normal)', flag: 'NORMAL' }
    ]
  },
  THYROID: {
    name: 'THYROID PROFILE TOTAL (T3, T4, TSH)',
    specimen: 'Serum (2 ml)',
    department: 'Immunology & Endocrinology',
    parameters: [
      { id: '1', name: 'Triiodothyronine (Total T3)', value: '1.25', unit: 'ng/mL', referenceRange: '0.80 - 2.00', flag: 'NORMAL' },
      { id: '2', name: 'Thyroxine (Total T4)', value: '8.4', unit: 'ug/dL', referenceRange: '5.1 - 14.1', flag: 'NORMAL' },
      { id: '3', name: 'Thyroid Stimulating Hormone (TSH Ultrasensitive)', value: '2.45', unit: 'uIU/mL', referenceRange: '0.35 - 4.94', flag: 'NORMAL' }
    ]
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectLabWalkInReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const profile = getVerifiedRoleProfile();

  // Step state: 'INPUT' or 'PRINT_PREVIEW'
  const [activeStep, setActiveStep] = useState<'INPUT' | 'PRINT_PREVIEW'>('INPUT');

  // Patient Demographic Form State
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [referringDoctor, setReferringDoctor] = useState(profile.doctorName ? `${profile.doctorName}` : 'Self / Direct Walk-In');
  const [sampleBarcode, setSampleBarcode] = useState(`SMP-${Math.floor(100000 + Math.random() * 900000)}`);
  const [patientMrn, setPatientMrn] = useState(`MRN-${Math.floor(10000 + Math.random() * 90000)}`);
  const [orderId] = useState(() => `walkin-${Date.now()}`);
  const [reportId] = useState(() => `rep-walkin-${Date.now()}`);
  const [orderNumber] = useState(() => `ORD-WALK-${Date.now().toString().slice(-6)}`);
  const [reportNumber] = useState(() => `REP-WALK-${Date.now().toString().slice(-6)}`);

  // Selected Test & Parameters
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('CBC');
  const [testTitle, setTestTitle] = useState(PRESET_TESTS['CBC']?.name || 'COMPLETE BLOOD COUNT');
  const [specimenType, setSpecimenType] = useState(PRESET_TESTS['CBC']?.specimen || 'EDTA Blood');
  const [departmentName, setDepartmentName] = useState(PRESET_TESTS['CBC']?.department || 'Hematology');
  const [parameters, setParameters] = useState<TestParameterItem[]>(() => {
    const cbc = MASTER_CLINICAL_TEST_LIBRARY['CBC'];
    if (cbc) {
      return cbc.parameters.map((p) => {
        const resolved = resolveGenderSpecificParameter(p, 'Male');
        return {
          id: p.id,
          name: p.name,
          value: resolved.value,
          unit: p.unit,
          referenceRange: resolved.referenceRange,
          flag: resolved.flag
        };
      });
    }
    return PRESET_TESTS['CBC']?.parameters || [];
  });

  // Lab Header Config
  const labName = (profile.entityLegalName || 'DOC SEARCH CENTRAL PATHOLOGY LABORATORY').toUpperCase();
  const labTagline = profile.facilityTagline;
  const labAddress = profile.officialAddress;
  const nablCertNo = profile.nablCertificateNo;
  const pathologistName = profile.pathologistName;
  const pathologistRegNo = profile.pathologistRegNo;
  const technicianName = profile.technicianName || 'Authorized Medical Lab Technologist';
  const [isLibraryExplorerOpen, setIsLibraryExplorerOpen] = useState(false);
  const [shortcutCategory, setShortcutCategory] = useState<string>('ALL');

  const mergedLibrary = useMemo(() => getMergedClinicalTestLibrary(), [isLibraryExplorerOpen]);

  const visibleShortcuts = useMemo(() => {
    if (shortcutCategory === 'ALL') {
      return [
        'CBC',
        'CBC_ESR',
        'LIPID',
        'GLUCOSE_PROFILE',
        'LFT',
        'KFT',
        'THYROID_TOTAL',
        'CARDIAC_MARKERS',
        'ELECTROLYTES',
        'VITAMIN_D_B12',
        'IRON_PROFILE',
        'FEVER_PANEL',
        'DENGUE_SEROLOGY',
        'TYPHOID_WIDAL',
        'ARTHRITIS_PANEL',
        'TUMOR_MALE',
        'TUMOR_FEMALE',
        'URINE_ROUTINE',
        ...Object.keys(mergedLibrary).filter((k) => !MASTER_CLINICAL_TEST_LIBRARY[k])
      ];
    }
    return Object.keys(mergedLibrary).filter(
      (k) => mergedLibrary[k]?.category === shortcutCategory
    );
  }, [shortcutCategory, mergedLibrary]);

  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);

  if (!isOpen) return null;

  const handleSelectLibraryProfile = (profile: ClinicalTestProfileDef, currentGender?: string) => {
    setSelectedPresetKey(profile.key);
    setTestTitle(profile.name);
    setSpecimenType(profile.specimen);
    setDepartmentName(profile.department);
    const effGender = currentGender || patientGender;
    setParameters(profile.parameters.map((p) => {
      const resolved = resolveGenderSpecificParameter(p, effGender);
      return {
        id: p.id,
        name: p.name,
        value: resolved.value,
        unit: p.unit,
        referenceRange: resolved.referenceRange,
        flag: resolved.flag
      };
    }));
  };

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    const libProfile = mergedLibrary[key];
    if (libProfile) {
      handleSelectLibraryProfile(libProfile, patientGender);
      return;
    }
    const preset = PRESET_TESTS[key];
    if (preset) {
      setTestTitle(preset.name);
      setSpecimenType(preset.specimen);
      setDepartmentName(preset.department);
      setParameters(preset.parameters.map((p) => {
        const mockDef = {
          id: p.id,
          code: p.name.slice(0, 6).toUpperCase(),
          name: p.name,
          unit: p.unit,
          referenceRange: p.referenceRange,
          defaultValue: p.value
        };
        const resolved = resolveGenderSpecificParameter(mockDef, patientGender);
        return {
          id: p.id,
          name: p.name,
          value: resolved.value,
          unit: p.unit,
          referenceRange: resolved.referenceRange,
          flag: resolved.flag
        };
      }));
    }
  };

  const handleGenderChange = (newGender: string) => {
    setPatientGender(newGender);
    setParameters((prev) => {
      const activeLib = MASTER_CLINICAL_TEST_LIBRARY[selectedPresetKey];
      const updated = prev.map((param) => {
        const libDef = activeLib?.parameters.find(
          (lp) => lp.id === param.id || lp.name.toLowerCase() === param.name.toLowerCase() || lp.code.toLowerCase() === param.name.slice(0, 8).toLowerCase()
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

      // Recalculate derived biomarkers if Creatinine exists
      const creatinineParam = updated.find(p => p.name.toLowerCase().includes('creatinine'));
      const egfrIndex = updated.findIndex(p => p.name.toLowerCase().includes('egfr'));
      if (creatinineParam && egfrIndex >= 0) {
        const crVal = parseFloat(creatinineParam.value);
        const ageNum = parseInt(patientAge, 10) || 40;
        const isFem = newGender.toLowerCase().includes('fem');
        if (crVal > 0) {
          const egfr = ClinicalCalculators.calculateEgfr(crVal, ageNum, isFem);
          if (egfr && updated[egfrIndex]) {
            updated[egfrIndex] = {
              ...updated[egfrIndex]!,
              value: String(egfr),
              flag: egfr >= 90 ? 'NORMAL' : egfr >= 60 ? 'LOW' : 'CRITICAL'
            };
          }
        }
      }

      return updated;
    });
  };

  const handleUpdateParamValue = (index: number, val: string) => {
    setParameters((prev) => {
      const updated = [...prev];
      const target = updated[index];
      if (!target) return prev;

      const item: TestParameterItem = { ...target, value: val };
      const num = parseFloat(val);
      if (!isNaN(num) && item.referenceRange) {
        const range = item.referenceRange.trim();
        if (range.startsWith('<')) {
          const maxVal = parseFloat(range.replace('<', '').trim());
          if (!isNaN(maxVal)) {
            item.flag = num > maxVal ? 'HIGH' : 'NORMAL';
          }
        } else if (range.startsWith('>')) {
          const minVal = parseFloat(range.replace('>', '').trim());
          if (!isNaN(minVal)) {
            item.flag = num < minVal ? 'LOW' : 'NORMAL';
          }
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

  const handleAddCustomParam = () => {
    const newId = String(parameters.length + 1);
    setParameters([
      ...parameters,
      { id: newId, name: 'New Parameter', value: '', unit: 'mg/dL', referenceRange: '10 - 50', flag: 'NORMAL' }
    ]);
  };

  const handleRemoveParam = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleAutoCalculate = () => {
    setParameters((prev) => {
      const updated = [...prev];

      const getVal = (keyword: string): number => {
        const found = updated.find(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
        return found ? parseFloat(found.value) || 0 : 0;
      };

      const upsertParam = (name: string, value: string, unit: string, referenceRange: string) => {
        const idx = updated.findIndex(p => p.name.toLowerCase().includes(name.toLowerCase()));
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

      // 1. CBC Indices (MCV, MCH, MCHC)
      const hb = getVal('Hemoglobin') || getVal('Hb');
      const rbc = getVal('RBC') || getVal('Red Blood');
      const pcv = getVal('PCV') || getVal('Hematocrit');
      if (hb > 0 && rbc > 0 && pcv > 0) {
        const cbcIndices = ClinicalCalculators.calculateCbcIndices(hb, rbc, pcv);
        if (cbcIndices) {
          upsertParam('MCV (Mean Corpuscular Volume)', String(cbcIndices.mcv), 'fL', '80.0 - 100.0');
          upsertParam('MCH (Mean Corpuscular Hemoglobin)', String(cbcIndices.mch), 'pg', '27.0 - 33.0');
          upsertParam('MCHC (Mean Corpuscular Hb Conc)', String(cbcIndices.mchc), 'g/dL', '32.0 - 36.0');
        }
      }

      // 2. Lipid Profile Fractions (VLDL & LDL via Friedewald)
      const totalChol = getVal('Total Cholesterol') || getVal('Cholesterol');
      const trig = getVal('Triglycerides') || getVal('Trig');
      const hdl = getVal('HDL');
      if (totalChol > 0 && trig > 0 && hdl > 0) {
        const lipidFractions = ClinicalCalculators.calculateLipidFractions(totalChol, trig, hdl);
        if (lipidFractions) {
          upsertParam('VLDL Cholesterol', String(lipidFractions.vldl), 'mg/dL', '< 30');
          upsertParam('LDL Cholesterol (Calculated)', String(lipidFractions.ldl), 'mg/dL', '< 100 (Optimal)');
        }
      }

      // 3. Diabetes: Estimated Average Glucose (eAG) from HbA1c
      const hba1c = getVal('HbA1c') || getVal('Glycated');
      if (hba1c > 0) {
        const eag = ClinicalCalculators.calculateEag(hba1c);
        if (eag) {
          upsertParam('Estimated Average Glucose (eAG)', String(eag), 'mg/dL', '90 - 120');
        }
      }

      // 4. Renal: eGFR from Creatinine & Age
      const creatinine = getVal('Creatinine');
      const ageNum = parseInt(patientAge, 10) || 40;
      const isFemale = patientGender.toLowerCase().includes('fem');
      if (creatinine > 0) {
        const egfr = ClinicalCalculators.calculateEgfr(creatinine, ageNum, isFemale);
        if (egfr) {
          upsertParam('eGFR (CKD-EPI / Cockcroft-Gault)', String(egfr), 'mL/min/1.73m²', '> 90 (Normal)');
        }
      }

      return updated;
    });
  };

  const handleWhatsAppDispatch = () => {
    persistWalkInReport();
    const rawPhone = patientPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const abnormalItems = parameters.filter(p => p.flag !== 'NORMAL');
    const abnormalSummary = abnormalItems.length > 0 
      ? `⚠️ Clinical Findings: ${abnormalItems.map(p => `${p.name}: ${p.value} ${p.unit} (${p.flag})`).join(', ')}`
      : '✅ All investigation parameters within normal biological reference ranges.';

    const message = encodeURIComponent(
      `*${labName} - DIAGNOSTIC REPORT ALERT*\n\n` +
      `Dear *${patientName}*,\n` +
      `Your lab investigation for *${testTitle}* has been verified and released.\n\n` +
      `📋 *Report ID:* ${reportNumber}\n` +
      `🔬 *Sample Barcode:* ${sampleBarcode}\n` +
      `👨‍⚕️ *Consultant Pathologist:* ${pathologistName}\n` +
      `${abnormalSummary}\n\n` +
      `🔒 *NABL ISO 15189:2022 Digital Verification Link:*\n` +
      `${window.location.origin}/api/v1/partner/lab/verify-report/${reportNumber}\n\n` +
      `_This is an authentic verified laboratory document._`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${message}`, '_blank');
  };

  const persistWalkInReport = () => {
    try {
      const results = parameters.map((p, idx) => ({
        id: `res-${orderId}-${idx}`,
        tenantId: '22222222-2222-4222-8222-222222222222',
        partnerId: '00000000-0000-0000-0000-000000000001',
        organizationId: '00000000-0000-0000-0000-000000000001',
        orderId,
        patientId: patientMrn || `pat-${Date.now()}`,
        parameterId: p.id,
        parameterCode: p.name.slice(0, 8).toUpperCase(),
        parameterName: p.name,
        testCategory: departmentName || 'CLINICAL_CHEMISTRY',
        resultValue: p.value,
        numericValue: parseFloat(p.value) || undefined,
        unit: p.unit,
        referenceRange: p.referenceRange,
        abnormalFlag: (p.flag === 'NORMAL' ? 'NORMAL' : p.flag === 'HIGH' ? 'HIGH' : p.flag === 'LOW' ? 'LOW' : 'CRITICAL') as any,
        isCritical: p.flag === 'CRITICAL',
        resultStatus: 'VERIFIED' as const,
        version: 1,
        verifiedAt: new Date().toISOString(),
        verifiedBy: pathologistName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const report = {
        id: reportId,
        tenantId: '22222222-2222-4222-8222-222222222222',
        partnerId: '00000000-0000-0000-0000-000000000001',
        organizationId: '00000000-0000-0000-0000-000000000001',
        orderId,
        patientId: patientMrn || `pat-${Date.now()}`,
        reportNumber,
        reportTitle: `Diagnostic Report: ${testTitle}`,
        clinicalFindings: results.map((r) => `${r.parameterName}: ${r.resultValue} ${r.unit}`).join(' | '),
        impression: 'Diagnostic findings verified by pathologist. Correlate clinically.',
        reportingClinician: technicianName,
        verifyingPathologist: pathologistName,
        reportStatus: 'FINAL' as const,
        reportVersion: 1,
        finalizedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newOrder = {
        id: orderId,
        tenantId: '22222222-2222-4222-8222-222222222222',
        partnerId: '00000000-0000-0000-0000-000000000001',
        organizationId: '00000000-0000-0000-0000-000000000001',
        organizationName: labName,
        orderNumber,
        patientId: patientMrn || `pat-${Date.now()}`,
        patientName,
        patientMrn: patientMrn || `UHID-${Date.now().toString().slice(-6)}`,
        patientDob: '1990-01-01',
        patientGender: patientGender.toUpperCase() as any,
        encounterId: '00000000-0000-0000-0000-000000000001',
        encounterNumber: `ENC-WALK-${Date.now().toString().slice(-4)}`,
        orderingDoctorId: '00000000-0000-0000-0000-000000000001',
        orderingDoctorName: referringDoctor || 'Self / Direct Walk-In',
        orderingDoctorSpecialty: 'Outpatient Diagnostic',
        investigationId: selectedPresetKey ? `inv-${selectedPresetKey}` : 'inv-walkin',
        investigationCode: selectedPresetKey || 'WALK-IN-TEST',
        investigationName: testTitle,
        investigationCategory: departmentName || 'CLINICAL_CHEMISTRY',
        priority: 'ROUTINE' as const,
        clinicalIndication: `Direct Lab Walk-In: ${testTitle}`,
        specimenType: specimenType || 'WHOLE_BLOOD',
        fastingConfirmed: true,
        status: 'VERIFIED' as const,
        isAbnormal: results.some((r) => r.abnormalFlag !== 'NORMAL'),
        isCritical: results.some((r) => r.isCritical),
        specimens: [],
        results: results as any,
        report,
        orderedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { sampleBarcode, patientPhone, patientAddress }
      };

      clinicalInvestigationService.registerDirectWalkInOrder(newOrder as any);
    } catch (err) {
      console.error('Failed to persist walk-in report:', err);
    }
  };



  const handlePrint = () => {
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }
    persistWalkInReport();
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0A0F1D',
      zIndex: 11000,
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      margin: 0,
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pathology-sheet, #printable-pathology-sheet * {
            visibility: visible !important;
          }
          #printable-pathology-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
      <div style={{
        backgroundColor: '#0A0F1D',
        color: '#F8FAFC',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none',
        overflow: 'hidden'
      }}>
        {/* Full-Page Workstation Header Bar */}
        <div style={{
          backgroundColor: '#0B132B',
          padding: '12px 24px',
          borderBottom: '1.5px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              🩸
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                  Walk-In Diagnostic & Blood Test Workstation
                </h3>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: activeStep === 'INPUT' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: activeStep === 'INPUT' ? '#38BDF8' : '#34D399',
                  border: activeStep === 'INPUT' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {activeStep === 'INPUT' ? '📝 Step 1: Result Entry' : '🖨️ Step 2: NABL Print Preview'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span>Sample Barcode: <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{sampleBarcode}</strong></span>
                <span>•</span>
                <span>Active Specimen: <strong style={{ color: '#E2E8F0' }}>{specimenType}</strong></span>
                <span>•</span>
                <span>Department: <strong style={{ color: '#A5B4FC' }}>{departmentName}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeStep === 'INPUT' ? (
              <button
                type="button"
                onClick={() => {
                  persistWalkInReport();
                  setActiveStep('PRINT_PREVIEW');
                }}
                className="ds-spring-press"
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369A1')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284C7')}
              >
                <span>👁️ Generate & Print Report →</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveStep('INPUT')}
                  className="ds-spring-press"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  ← Edit Values
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="ds-spring-press"
                  style={{
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <span>🖨️ Print Lab Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppDispatch}
                  className="ds-spring-press"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
                  }}
                  title="Share digital report & verification link directly via WhatsApp"
                >
                  <span>💬 WhatsApp</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ds-spring-press"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.borderColor = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* STEP 1: PATIENT DEMOGRAPHICS & RESULT ENTRY FORM */}
        {activeStep === 'INPUT' && (
          <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1, backgroundColor: '#0B1120' }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Quick Test Presets & Master Library Dropdown Selector */}
            <div style={{ marginBottom: '16px', backgroundColor: '#1E293B', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚡ SELECT TEST INVESTIGATION FROM CLINICAL LIBRARY:
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsLibraryExplorerOpen(true)}
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8',
                      border: '1px solid #0284C7',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Open full repository of 55+ clinical blood tests, biological reference intervals and critical panic values"
                  >
                    📖 Browse Full Test Library & Parameters
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoCalculate}
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      color: '#22D3EE',
                      border: '1px solid #06B6D4',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Auto-calculate derived clinical parameters (MCV/MCH/MCHC for CBC, VLDL/LDL for Lipid, eAG for Diabetes, eGFR for Renal)"
                  >
                    ⚡ Auto-Calculate Derived Biomarkers
                  </button>
                </div>
              </div>

              {/* Master Categorized Dropdown Selector */}
              <div style={{ marginBottom: '12px' }}>
                <ClinicalTestLibraryDropdown
                  selectedKey={selectedPresetKey}
                  onSelectTest={handleSelectLibraryProfile}
                />
              </div>

              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
                {CLINICAL_DEPARTMENTS.map((dept) => {
                  const isSelected = shortcutCategory === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setShortcutCategory(dept.id)}
                      style={{
                        whiteSpace: 'nowrap',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                        color: isSelected ? '#38BDF8' : '#94A3B8',
                        border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        padding: '3px 10px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {dept.label}
                    </button>
                  );
                })}
              </div>

              {/* Quick Preset Shortcut Pills for Selected Category */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700, marginRight: '2px' }}>
                  {shortcutCategory === 'ALL' ? 'Popular Blood Tests:' : 'Category Tests:'}
                </span>
                {visibleShortcuts.map((k) => {
                  const testDef = MASTER_CLINICAL_TEST_LIBRARY[k];
                  if (!testDef) return null;
                  const label = testDef.shortName;
                  const tubeIcon = testDef.tubeLabel.split(' ')[0];
                  const isCurrent = selectedPresetKey === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleSelectPreset(k)}
                      style={{
                        backgroundColor: isCurrent ? '#06B6D4' : 'rgba(255,255,255,0.06)',
                        color: isCurrent ? '#070C16' : '#E2E8F0',
                        border: isCurrent ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontWeight: 700,
                        fontSize: '0.6875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                      title={`${testDef.name} (${testDef.parameters.length} Parameters) - ${testDef.specimen}`}
                    >
                      <span>{tubeIcon}</span>
                      <span>{label}</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.75 }}>({testDef.parameters.length}p)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient & Referring Doctor Form */}
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', display: 'block', marginBottom: '12px' }}>
                👤 Patient Demographics & Sample Details:
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Patient Full Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter Patient Full Name (e.g. Rameshwar Kumar)"
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Age & Gender *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Age (Yrs)"
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
                  <div style={{ fontSize: '0.6875rem', color: '#38BDF8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚡</span>
                    <span>Auto-adapts values & ranges for <strong>{patientGender}</strong></span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Contact Phone</label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+91 Mobile Number"
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Referring Doctor *</label>
                  <input
                    type="text"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar / Self"
                    style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px' }}>Patient UHID / MRN</label>
                  <input
                    type="text"
                    value={patientMrn}
                    onChange={(e) => setPatientMrn(e.target.value)}
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
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', marginBottom: '3px' }}>Patient Address / City</label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF', fontSize: '0.75rem' }}
                />
              </div>
            </div>

            {/* Test Results Parameter Entry Table */}
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC' }}>
                    🧪 Parameter Results & Biological Reference Ranges:
                  </span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    backgroundColor: patientGender === 'Female' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: patientGender === 'Female' ? '#F472B6' : '#38BDF8',
                    border: `1px solid ${patientGender === 'Female' ? '#EC4899' : '#0284C7'}`,
                    borderRadius: '4px',
                    padding: '2px 8px'
                  }}>
                    {patientGender === 'Female' ? '♀ FEMALE NORMS ACTIVE' : '♂ MALE NORMS ACTIVE'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomParam}
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#38BDF8', border: '1px solid #38BDF8', borderRadius: '6px', padding: '4px 10px', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add Parameter
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>#</th>
                    <th style={{ padding: '8px', width: '35%' }}>PARAMETER NAME</th>
                    <th style={{ padding: '8px', width: '18%' }}>OBSERVED VALUE</th>
                    <th style={{ padding: '8px', width: '12%' }}>UNITS</th>
                    <th style={{ padding: '8px', width: '23%' }}>NORMAL RANGE ({patientGender.toUpperCase()})</th>
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
                            setParameters((prev) => {
                              const updated = [...prev];
                              const cur = updated[idx];
                              if (cur) updated[idx] = { ...cur, name: e.target.value };
                              return updated;
                            });
                          }}
                          style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#FFF' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => handleUpdateParamValue(idx, e.target.value)}
                          placeholder="Value"
                          style={{ width: '100%', backgroundColor: '#0F172A', border: '1.5px solid #06B6D4', borderRadius: '4px', padding: '4px 8px', color: '#38BDF8', fontWeight: 800 }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={p.unit}
                          onChange={(e) => {
                            setParameters((prev) => {
                              const updated = [...prev];
                              const cur = updated[idx];
                              if (cur) updated[idx] = { ...cur, unit: e.target.value };
                              return updated;
                            });
                          }}
                          style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#94A3B8' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={p.referenceRange}
                          onChange={(e) => {
                            setParameters((prev) => {
                              const updated = [...prev];
                              const cur = updated[idx];
                              if (cur) updated[idx] = { ...cur, referenceRange: e.target.value };
                              return updated;
                            });
                          }}
                          style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#94A3B8' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <select
                          value={p.flag}
                          onChange={(e) => {
                            setParameters((prev) => {
                              const updated = [...prev];
                              const cur = updated[idx];
                              if (cur) updated[idx] = { ...cur, flag: e.target.value as any };
                              return updated;
                            });
                          }}
                          style={{
                            backgroundColor: p.flag === 'HIGH' ? '#7F1D1D' : p.flag === 'LOW' ? '#831843' : '#0F172A',
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
            </div>
          </div>
        )}

        {/* STEP 2: PRINTABLE OFFICIAL NABL REPORT VIEW */}
        {activeStep === 'PRINT_PREVIEW' && (
          <div style={{ padding: '36px 20px', overflowY: 'auto', flex: 1, backgroundColor: '#070C16', display: 'flex', justifyContent: 'center' }}>
            <div id="printable-pathology-sheet" style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '40px 48px',
              borderRadius: '8px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.65)',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              width: '100%',
              maxWidth: '920px',
              minHeight: '1050px',
              boxSizing: 'border-box'
            }}>
              {/* Lab Header & Accreditation */}
              <div style={{ borderBottom: '2.5px solid #0284C7', paddingBottom: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 900, color: '#0369A1', textTransform: 'uppercase' }}>
                    {labName}
                  </h1>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>
                    {labTagline}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                    {labAddress} • 📞 {profile.contactPhone}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '220px' }}>
                  <div style={{ border: '1.5px solid #0284C7', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F0F9FF' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#0369A1', display: 'block' }}>NABL CERTIFICATE NO.</span>
                    <strong style={{ fontSize: '0.75rem', color: '#0C4A6E' }}>{nablCertNo}</strong>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#16A34A', fontWeight: 800, marginTop: '3px', display: 'block' }}>
                    ✓ ABDM 2.0 CONNECTED LAB
                  </span>
                </div>
              </div>

              {/* Patient Demographics & Sample Barcode Grid */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
                <div>
                  <div><span style={{ color: '#64748B' }}>Patient Name:</span> <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>{patientName}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Age / Gender:</span> <strong>{patientAge} Yrs / {patientGender}</strong></div>
                  <div><span style={{ color: '#64748B' }}>UHID / MRN:</span> <strong style={{ fontFamily: 'monospace' }}>{patientMrn}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Phone / Address:</span> <span>{patientPhone} | {patientAddress}</span></div>
                </div>

                <div>
                  <div><span style={{ color: '#64748B' }}>Report ID:</span> <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{reportNumber}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Sample Barcode:</span> <strong style={{ fontFamily: 'monospace', color: '#0369A1' }}>{sampleBarcode}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Referring Doctor:</span> <strong>{referringDoctor}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Specimen / Matrix:</span> <strong>{specimenType}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Department:</span> <strong>{departmentName}</strong></div>
                </div>

                <div>
                  <div><span style={{ color: '#64748B' }}>Collected:</span> <strong>{new Date().toLocaleDateString('en-IN')} 08:30 AM</strong></div>
                  <div><span style={{ color: '#64748B' }}>Received:</span> <strong>{new Date().toLocaleDateString('en-IN')} 09:15 AM</strong></div>
                  <div><span style={{ color: '#64748B' }}>Reported:</span> <strong>{new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Status:</span> <span style={{ color: '#16A34A', fontWeight: 900 }}>✓ FINAL NABL APPROVED</span></div>
                </div>
              </div>

              {/* Test Name Header */}
              <div style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '6px 12px', borderRadius: '4px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                  {testTitle}
                </span>
                <span style={{ fontSize: '0.6875rem' }}>Analyzed on Fully Automated Clinical Chemistry / Hematology Analyzer</span>
              </div>

              {/* Test Results Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '20px', border: '1px solid #CBD5E1' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1.5px solid #94A3B8', textAlign: 'left', color: '#1E293B' }}>
                    <th style={{ padding: '8px 10px' }}>TEST PARAMETER</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>OBSERVED VALUE</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>UNITS</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>BIOLOGICAL REFERENCE INTERVAL ({patientGender.toUpperCase()})</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>FLAG</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((r, i) => {
                    const isAbnormal = r.flag === 'HIGH' || r.flag === 'LOW' || r.flag === 'CRITICAL';
                    return (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: isAbnormal ? '#FEF2F2' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>{r.name}</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 900, color: isAbnormal ? '#DC2626' : '#0F172A', fontSize: '0.8125rem' }}>
                          {r.value}
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', color: '#64748B' }}>{r.unit}</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', color: '#334155' }}>{r.referenceRange}</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                          {isAbnormal ? (
                            <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 900, fontSize: '0.6875rem' }}>
                              ⚠️ {r.flag}
                            </span>
                          ) : (
                            <span style={{ color: '#16A34A', fontWeight: 700 }}>Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* End of Report Bar */}
              <div style={{ textAlign: 'center', borderTop: '1px dashed #CBD5E1', borderBottom: '1px dashed #CBD5E1', padding: '4px 0', margin: '14px 0', fontSize: '0.6875rem', color: '#64748B', letterSpacing: '0.1em' }}>
                *** END OF DIAGNOSTIC REPORT ***
              </div>

              {/* Signatures & Accreditation Footer */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px' }}>
                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#475569', marginBottom: '2px' }}>
                    {technicianName.split(' ')[0]}
                  </div>
                  <div style={{ borderTop: '1px solid #0F172A', paddingTop: '2px' }}>
                    <strong style={{ fontSize: '0.75rem', color: '#0F172A', display: 'block' }}>{technicianName}</strong>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Medical Lab Technologist</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', maxWidth: '280px' }}>
                  <div style={{ fontSize: '0.625rem', color: '#64748B' }}>
                    QR Tamper Seal (SHA-256): <span style={{ fontFamily: 'monospace' }}>{profile.sha256Hash.substring(0, 16)}...</span>
                  </div>
                  <div style={{ fontSize: '0.625rem', color: '#0284C7', marginTop: '2px', fontWeight: 600 }}>
                    Verify at: /verify-report/{reportNumber}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                    ✓ Authenticated Clinical Pathology Finding
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: '220px' }}>
                  <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', color: '#0369A1', marginBottom: '2px' }}>
                    {pathologistName}
                  </div>
                  <div style={{ borderTop: '1px solid #0F172A', paddingTop: '2px' }}>
                    <strong style={{ fontSize: '0.75rem', color: '#0F172A', display: 'block' }}>{pathologistName}</strong>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Consultant Pathologist & Lab Director</span>
                    <span style={{ fontSize: '0.6875rem', color: '#0284C7', fontWeight: 700 }}>Reg: {pathologistRegNo}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Full Clinical Test Repository Explorer Modal */}
      {isLibraryExplorerOpen && (
        <ClinicalTestLibraryExplorerModal
          isOpen={isLibraryExplorerOpen}
          onClose={() => setIsLibraryExplorerOpen(false)}
          onSelectForWalkIn={handleSelectLibraryProfile}
        />
      )}

      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName="Walk-in Diagnostic Report Print"
        missingFields={profileMissingFields}
      />
    </div>
  );
};
