export interface ParameterTemplate {
  parameterCode: string;
  parameterName: string;
  unit: string;
  maleRange: string;
  femaleRange: string;
  maleMin: number;
  maleMax: number;
  femaleMin: number;
  femaleMax: number;
  criticalMin?: number;
  criticalMax?: number;
  defaultMaleValue: string;
  defaultFemaleValue: string;
}

export interface TestCatalogTemplate {
  testCode: string;
  testName: string;
  category: string;
  specimenType: string;
  parameters: ParameterTemplate[];
}

export const MULTI_TEST_KNOWLEDGE_BASE: Record<string, TestCatalogTemplate> = {
  CBC: {
    testCode: 'LAB-HEM-CBC',
    testName: 'Complete Blood Count (CBC) with Differential',
    category: 'HEMATOLOGY',
    specimenType: 'WHOLE_BLOOD (EDTA)',
    parameters: [
      {
        parameterCode: 'HGB',
        parameterName: 'Hemoglobin (Hb)',
        unit: 'g/dL',
        maleRange: '13.5 - 17.5',
        femaleRange: '12.0 - 15.5',
        maleMin: 13.5,
        maleMax: 17.5,
        femaleMin: 12.0,
        femaleMax: 15.5,
        criticalMin: 7.0,
        criticalMax: 20.0,
        defaultMaleValue: '14.8',
        defaultFemaleValue: '13.2'
      },
      {
        parameterCode: 'RBC',
        parameterName: 'Red Blood Cell (RBC) Count',
        unit: 'million/uL',
        maleRange: '4.5 - 5.9',
        femaleRange: '4.1 - 5.1',
        maleMin: 4.5,
        maleMax: 5.9,
        femaleMin: 4.1,
        femaleMax: 5.1,
        criticalMin: 2.5,
        criticalMax: 7.0,
        defaultMaleValue: '5.1',
        defaultFemaleValue: '4.5'
      },
      {
        parameterCode: 'WBC',
        parameterName: 'Total Leukocyte Count (WBC)',
        unit: 'x10^3/uL',
        maleRange: '4.5 - 11.0',
        femaleRange: '4.5 - 11.0',
        maleMin: 4.5,
        maleMax: 11.0,
        femaleMin: 4.5,
        femaleMax: 11.0,
        criticalMin: 2.0,
        criticalMax: 30.0,
        defaultMaleValue: '7.4',
        defaultFemaleValue: '6.8'
      },
      {
        parameterCode: 'PLT',
        parameterName: 'Platelet Count',
        unit: 'x10^3/uL',
        maleRange: '150 - 450',
        femaleRange: '150 - 450',
        maleMin: 150,
        maleMax: 450,
        femaleMin: 150,
        femaleMax: 450,
        criticalMin: 20,
        criticalMax: 1000,
        defaultMaleValue: '260',
        defaultFemaleValue: '280'
      },
      {
        parameterCode: 'HCT',
        parameterName: 'Hematocrit (PCV)',
        unit: '%',
        maleRange: '41.0 - 50.0',
        femaleRange: '36.0 - 46.0',
        maleMin: 41.0,
        maleMax: 50.0,
        femaleMin: 36.0,
        femaleMax: 46.0,
        defaultMaleValue: '44.5',
        defaultFemaleValue: '40.2'
      },
      {
        parameterCode: 'MCV',
        parameterName: 'Mean Corpuscular Volume (MCV)',
        unit: 'fL',
        maleRange: '80.0 - 100.0',
        femaleRange: '80.0 - 100.0',
        maleMin: 80.0,
        maleMax: 100.0,
        femaleMin: 80.0,
        femaleMax: 100.0,
        defaultMaleValue: '88.0',
        defaultFemaleValue: '89.0'
      },
      {
        parameterCode: 'MCH',
        parameterName: 'Mean Corpuscular Hemoglobin (MCH)',
        unit: 'pg',
        maleRange: '27.0 - 33.0',
        femaleRange: '27.0 - 33.0',
        maleMin: 27.0,
        maleMax: 33.0,
        femaleMin: 27.0,
        femaleMax: 33.0,
        defaultMaleValue: '29.5',
        defaultFemaleValue: '29.0'
      },
      {
        parameterCode: 'MCHC',
        parameterName: 'Mean Corpuscular Hb Conc (MCHC)',
        unit: 'g/dL',
        maleRange: '32.0 - 36.0',
        femaleRange: '32.0 - 36.0',
        maleMin: 32.0,
        maleMax: 36.0,
        femaleMin: 32.0,
        femaleMax: 36.0,
        defaultMaleValue: '33.8',
        defaultFemaleValue: '33.5'
      },
      {
        parameterCode: 'RDW',
        parameterName: 'Red Cell Distribution Width (RDW)',
        unit: '%',
        maleRange: '11.5 - 14.5',
        femaleRange: '11.5 - 14.5',
        maleMin: 11.5,
        maleMax: 14.5,
        femaleMin: 11.5,
        femaleMax: 14.5,
        defaultMaleValue: '12.8',
        defaultFemaleValue: '12.6'
      },
      {
        parameterCode: 'NEUT',
        parameterName: 'Neutrophils',
        unit: '%',
        maleRange: '40.0 - 75.0',
        femaleRange: '40.0 - 75.0',
        maleMin: 40.0,
        maleMax: 75.0,
        femaleMin: 40.0,
        femaleMax: 75.0,
        defaultMaleValue: '62.0',
        defaultFemaleValue: '60.0'
      },
      {
        parameterCode: 'LYMPH',
        parameterName: 'Lymphocytes',
        unit: '%',
        maleRange: '20.0 - 45.0',
        femaleRange: '20.0 - 45.0',
        maleMin: 20.0,
        maleMax: 45.0,
        femaleMin: 20.0,
        femaleMax: 45.0,
        defaultMaleValue: '30.0',
        defaultFemaleValue: '32.0'
      },
      {
        parameterCode: 'MONO',
        parameterName: 'Monocytes',
        unit: '%',
        maleRange: '2.0 - 10.0',
        femaleRange: '2.0 - 10.0',
        maleMin: 2.0,
        maleMax: 10.0,
        femaleMin: 2.0,
        femaleMax: 10.0,
        defaultMaleValue: '5.2',
        defaultFemaleValue: '5.0'
      },
      {
        parameterCode: 'EOS',
        parameterName: 'Eosinophils',
        unit: '%',
        maleRange: '1.0 - 6.0',
        femaleRange: '1.0 - 6.0',
        maleMin: 1.0,
        maleMax: 6.0,
        femaleMin: 1.0,
        femaleMax: 6.0,
        defaultMaleValue: '2.4',
        defaultFemaleValue: '2.2'
      },
      {
        parameterCode: 'BASO',
        parameterName: 'Basophils',
        unit: '%',
        maleRange: '0.0 - 2.0',
        femaleRange: '0.0 - 2.0',
        maleMin: 0.0,
        maleMax: 2.0,
        femaleMin: 0.0,
        femaleMax: 2.0,
        defaultMaleValue: '0.4',
        defaultFemaleValue: '0.4'
      }
    ]
  },
  LFT: {
    testCode: 'LAB-BIO-LFT',
    testName: 'Liver Function Test (LFT) Panel',
    category: 'BIOCHEMISTRY',
    specimenType: 'SERUM',
    parameters: [
      {
        parameterCode: 'BIL_T',
        parameterName: 'Total Bilirubin',
        unit: 'mg/dL',
        maleRange: '0.2 - 1.2',
        femaleRange: '0.2 - 1.2',
        maleMin: 0.2,
        maleMax: 1.2,
        femaleMin: 0.2,
        femaleMax: 1.2,
        criticalMax: 5.0,
        defaultMaleValue: '0.8',
        defaultFemaleValue: '0.7'
      },
      {
        parameterCode: 'BIL_D',
        parameterName: 'Direct Bilirubin (Conjugated)',
        unit: 'mg/dL',
        maleRange: '0.0 - 0.3',
        femaleRange: '0.0 - 0.3',
        maleMin: 0.0,
        maleMax: 0.3,
        femaleMin: 0.0,
        femaleMax: 0.3,
        defaultMaleValue: '0.2',
        defaultFemaleValue: '0.15'
      },
      {
        parameterCode: 'SGPT',
        parameterName: 'SGPT / ALT (Alanine Aminotransferase)',
        unit: 'U/L',
        maleRange: '10.0 - 50.0',
        femaleRange: '10.0 - 35.0',
        maleMin: 10.0,
        maleMax: 50.0,
        femaleMin: 10.0,
        femaleMax: 35.0,
        criticalMax: 300.0,
        defaultMaleValue: '28.0',
        defaultFemaleValue: '22.0'
      },
      {
        parameterCode: 'SGOT',
        parameterName: 'SGOT / AST (Aspartate Aminotransferase)',
        unit: 'U/L',
        maleRange: '10.0 - 45.0',
        femaleRange: '10.0 - 35.0',
        maleMin: 10.0,
        maleMax: 45.0,
        femaleMin: 10.0,
        femaleMax: 35.0,
        criticalMax: 300.0,
        defaultMaleValue: '24.0',
        defaultFemaleValue: '20.0'
      },
      {
        parameterCode: 'ALP',
        parameterName: 'Alkaline Phosphatase (ALP)',
        unit: 'U/L',
        maleRange: '44.0 - 147.0',
        femaleRange: '44.0 - 147.0',
        maleMin: 44.0,
        maleMax: 147.0,
        femaleMin: 44.0,
        femaleMax: 147.0,
        defaultMaleValue: '78.0',
        defaultFemaleValue: '72.0'
      },
      {
        parameterCode: 'PROT_T',
        parameterName: 'Total Serum Protein',
        unit: 'g/dL',
        maleRange: '6.0 - 8.3',
        femaleRange: '6.0 - 8.3',
        maleMin: 6.0,
        maleMax: 8.3,
        femaleMin: 6.0,
        femaleMax: 8.3,
        defaultMaleValue: '7.2',
        defaultFemaleValue: '7.1'
      },
      {
        parameterCode: 'ALB',
        parameterName: 'Serum Albumin',
        unit: 'g/dL',
        maleRange: '3.5 - 5.0',
        femaleRange: '3.5 - 5.0',
        maleMin: 3.5,
        maleMax: 5.0,
        femaleMin: 3.5,
        femaleMax: 5.0,
        defaultMaleValue: '4.4',
        defaultFemaleValue: '4.3'
      },
      {
        parameterCode: 'GLOB',
        parameterName: 'Serum Globulin',
        unit: 'g/dL',
        maleRange: '2.0 - 3.5',
        femaleRange: '2.0 - 3.5',
        maleMin: 2.0,
        maleMax: 3.5,
        femaleMin: 2.0,
        femaleMax: 3.5,
        defaultMaleValue: '2.8',
        defaultFemaleValue: '2.8'
      }
    ]
  },
  KFT: {
    testCode: 'LAB-BIO-KFT',
    testName: 'Kidney Function Test / Renal Profile (KFT)',
    category: 'BIOCHEMISTRY',
    specimenType: 'SERUM',
    parameters: [
      {
        parameterCode: 'CREAT',
        parameterName: 'Serum Creatinine',
        unit: 'mg/dL',
        maleRange: '0.7 - 1.3',
        femaleRange: '0.5 - 1.1',
        maleMin: 0.7,
        maleMax: 1.3,
        femaleMin: 0.5,
        femaleMax: 1.1,
        criticalMin: 0.3,
        criticalMax: 4.0,
        defaultMaleValue: '0.9',
        defaultFemaleValue: '0.8'
      },
      {
        parameterCode: 'BUN',
        parameterName: 'Blood Urea Nitrogen (BUN)',
        unit: 'mg/dL',
        maleRange: '7.0 - 20.0',
        femaleRange: '7.0 - 20.0',
        maleMin: 7.0,
        maleMax: 20.0,
        femaleMin: 7.0,
        femaleMax: 20.0,
        criticalMax: 80.0,
        defaultMaleValue: '14.0',
        defaultFemaleValue: '12.0'
      },
      {
        parameterCode: 'URIC',
        parameterName: 'Serum Uric Acid',
        unit: 'mg/dL',
        maleRange: '3.5 - 7.2',
        femaleRange: '2.6 - 6.0',
        maleMin: 3.5,
        maleMax: 7.2,
        femaleMin: 2.6,
        femaleMax: 6.0,
        criticalMax: 12.0,
        defaultMaleValue: '5.2',
        defaultFemaleValue: '4.1'
      },
      {
        parameterCode: 'CALC',
        parameterName: 'Serum Calcium',
        unit: 'mg/dL',
        maleRange: '8.5 - 10.5',
        femaleRange: '8.5 - 10.5',
        maleMin: 8.5,
        maleMax: 10.5,
        femaleMin: 8.5,
        femaleMax: 10.5,
        criticalMin: 6.5,
        criticalMax: 13.0,
        defaultMaleValue: '9.4',
        defaultFemaleValue: '9.2'
      },
      {
        parameterCode: 'PHOS',
        parameterName: 'Serum Inorganic Phosphorus',
        unit: 'mg/dL',
        maleRange: '2.5 - 4.5',
        femaleRange: '2.5 - 4.5',
        maleMin: 2.5,
        maleMax: 4.5,
        femaleMin: 2.5,
        femaleMax: 4.5,
        defaultMaleValue: '3.4',
        defaultFemaleValue: '3.3'
      },
      {
        parameterCode: 'EGFR',
        parameterName: 'Estimated GFR (eGFR)',
        unit: 'mL/min/1.73m2',
        maleRange: '> 90.0',
        femaleRange: '> 90.0',
        maleMin: 90.0,
        maleMax: 160.0,
        femaleMin: 90.0,
        femaleMax: 160.0,
        criticalMin: 15.0,
        defaultMaleValue: '105.0',
        defaultFemaleValue: '102.0'
      }
    ]
  },
  LIPID: {
    testCode: 'LAB-BIO-LIPID',
    testName: 'Comprehensive Lipid Profile Panel',
    category: 'BIOCHEMISTRY',
    specimenType: 'SERUM (Fasting 12h)',
    parameters: [
      {
        parameterCode: 'CHOL',
        parameterName: 'Total Cholesterol',
        unit: 'mg/dL',
        maleRange: '< 200.0',
        femaleRange: '< 200.0',
        maleMin: 0,
        maleMax: 200.0,
        femaleMin: 0,
        femaleMax: 200.0,
        criticalMax: 350.0,
        defaultMaleValue: '178.0',
        defaultFemaleValue: '165.0'
      },
      {
        parameterCode: 'TRIG',
        parameterName: 'Triglycerides',
        unit: 'mg/dL',
        maleRange: '< 150.0',
        femaleRange: '< 150.0',
        maleMin: 0,
        maleMax: 150.0,
        femaleMin: 0,
        femaleMax: 150.0,
        criticalMax: 500.0,
        defaultMaleValue: '135.0',
        defaultFemaleValue: '120.0'
      },
      {
        parameterCode: 'HDL',
        parameterName: 'HDL (Good Cholesterol)',
        unit: 'mg/dL',
        maleRange: '> 40.0',
        femaleRange: '> 50.0',
        maleMin: 40.0,
        maleMax: 100.0,
        femaleMin: 50.0,
        femaleMax: 100.0,
        criticalMin: 20.0,
        defaultMaleValue: '48.0',
        defaultFemaleValue: '58.0'
      },
      {
        parameterCode: 'LDL',
        parameterName: 'LDL (Bad Cholesterol)',
        unit: 'mg/dL',
        maleRange: '< 100.0',
        femaleRange: '< 100.0',
        maleMin: 0,
        maleMax: 100.0,
        femaleMin: 0,
        femaleMax: 100.0,
        criticalMax: 220.0,
        defaultMaleValue: '92.0',
        defaultFemaleValue: '85.0'
      },
      {
        parameterCode: 'VLDL',
        parameterName: 'VLDL Cholesterol',
        unit: 'mg/dL',
        maleRange: '5.0 - 30.0',
        femaleRange: '5.0 - 30.0',
        maleMin: 5.0,
        maleMax: 30.0,
        femaleMin: 5.0,
        femaleMax: 30.0,
        defaultMaleValue: '22.0',
        defaultFemaleValue: '18.0'
      }
    ]
  }
};

/**
 * Automatically computes clinical flag based on patient gender and normal range
 */
export function computeAutoClinicalFlag(
  numericValue: number,
  isFemale: boolean,
  param: ParameterTemplate
): { flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW'; isCritical: boolean } {
  const min = isFemale ? param.femaleMin : param.maleMin;
  const max = isFemale ? param.femaleMax : param.maleMax;

  if (param.criticalMin !== undefined && numericValue < param.criticalMin) {
    return { flag: 'CRITICAL_LOW', isCritical: true };
  }
  if (param.criticalMax !== undefined && numericValue > param.criticalMax) {
    return { flag: 'CRITICAL_HIGH', isCritical: true };
  }
  if (numericValue < min) {
    return { flag: 'LOW', isCritical: false };
  }
  if (numericValue > max) {
    return { flag: 'HIGH', isCritical: false };
  }
  return { flag: 'NORMAL', isCritical: false };
}
