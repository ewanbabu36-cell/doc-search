import { AppError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';

export interface AllergyCheckParams {
  patientAllergies: string[];
  itemIngredients: string[];
  containsGluten?: boolean;
}

export interface NpoCheckParams {
  isNpoActive: boolean;
  orderType: string;
}

export interface DietRestrictionParams {
  patientTherapeuticDiets: string[];
  mealDietCategory: string;
}

export class ClinicalSafetyService {
  static checkAllergy(params: AllergyCheckParams): void {
    const { patientAllergies, itemIngredients, containsGluten } = params;

    if (containsGluten && patientAllergies.map(a => a.toUpperCase()).includes('GLUTEN')) {
      throw new AppError({
        message: 'Clinical Safety Violation: Patient is allergic to GLUTEN. Meal contains gluten-based ingredients.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    for (const allergy of patientAllergies) {
      if (itemIngredients.map(i => i.toLowerCase()).includes(allergy.toLowerCase())) {
        throw new AppError({
          message: `Clinical Safety Violation: Incompatible allergen detected (${allergy}) for patient.`,
          code: ErrorCode.BAD_REQUEST,
          statusCode: 400
        });
      }
    }
  }

  static checkNPO(params: NpoCheckParams): void {
    if (params.isNpoActive) {
      throw new AppError({
        message: 'Clinical Safety Violation: Patient is currently on active NPO (Nil Per Os - Nothing by mouth). Oral meal dispatch is strictly prohibited.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
  }

  static checkDietRestriction(params: DietRestrictionParams): void {
    if (params.patientTherapeuticDiets.includes('RENAL_LOW_SODIUM') && params.mealDietCategory === 'HIGH_SODIUM_REGULAR') {
      throw new AppError({
        message: 'Clinical Safety Violation: Patient therapeutic diet requires RENAL_LOW_SODIUM; meal does not meet therapeutic specifications.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
  }

  static checkClinicalContraindication(condition: string, procedureName: string): void {
    if (condition.toUpperCase().includes('PREGNANCY') && procedureName.toUpperCase().includes('CT_PELVIS_IONIZING')) {
      throw new AppError({
        message: 'Clinical Safety Alert: Ionizing radiation CT procedure is contraindicated in active pregnancy without explicit emergency override.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
  }

  static checkDuplicateOrder(existingOrderNumbers: string[], requestedOrderNumber: string): void {
    if (existingOrderNumbers.includes(requestedOrderNumber)) {
      throw new AppError({
        message: `Duplicate order violation: Clinical order ${requestedOrderNumber} already exists in active workflow.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 409
      });
    }
  }
}
