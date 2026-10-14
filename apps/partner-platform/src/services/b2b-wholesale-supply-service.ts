/**
 * ============================================================================
 * DocSearch B2B Healthcare Wholesale Supply Chain & Auto-GRN Engine
 * ============================================================================
 * Enables hospitals, clinics, and labs to procure Bulk Pharmaceuticals,
 * Pathology Lab Chemicals & Reagents, and Medical Equipment at wholesale
 * rates with 1-click automated Goods Receipt Note (GRN) ingestion.
 */

export type SupplyCategory = 'PHARMACEUTICALS' | 'LAB_CHEMICALS' | 'EQUIPMENT_CONSUMABLES';

export interface WholesaleCatalogItem {
  id: string;
  sku: string;
  name: string;
  genericFormula: string;
  category: SupplyCategory;
  manufacturer: string;
  packSize: string;
  moq: number; // Minimum Order Quantity
  mrpInr: number;
  wholesalePriceInr: number;
  sourcingCostInr?: number; // Used in Company Platform for margin tracking
  bulkTiers: {
    minQty: number;
    pricePerUnitInr: number;
    savingsPercent: number;
  }[];
  temperatureControlled: boolean;
  coldChainRange?: string;
  inStockQuantity: number;
  estimatedDeliveryDays: number;
  hsnCode: string;
  gstRate: number; // 5%, 12%, 18%
  badge?: string;
}

export interface InboundPurchaseOrder {
  id: string;
  poNumber: string;
  hospitalId: string;
  hospitalName: string;
  orderDate: string;
  status: 'PENDING_APPROVAL' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED';
  items: {
    itemId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPriceInr: number;
    totalInr: number;
    allocatedBatch?: string | undefined;
    expiryDate?: string | undefined;
    mrpInr?: number | undefined;
  }[];
  subtotalInr: number;
  gstInr: number;
  totalAmountInr: number;
  transporterName?: string | undefined;
  awbTrackingNumber?: string | undefined;
  dispatchedAt?: string | undefined;
  deliveredAt?: string | undefined;
  isAutoGrnApplied?: boolean | undefined;
}

export const INITIAL_WHOLESALE_CATALOG: WholesaleCatalogItem[] = [
  // 1. Bulk Pharmaceuticals & IV Fluids
  {
    id: 'sku-pharma-001',
    sku: 'MED-CFT-1G-INJ',
    name: 'Ceftriaxone 1g Injection IP (Dry Powder + WFI)',
    genericFormula: 'Ceftriaxone Sodium 1000mg',
    category: 'PHARMACEUTICALS',
    manufacturer: 'Alkem Health Direct',
    packSize: 'Pack of 50 Vials',
    moq: 2,
    mrpInr: 165,
    wholesalePriceInr: 54,
    sourcingCostInr: 41,
    bulkTiers: [
      { minQty: 2, pricePerUnitInr: 54, savingsPercent: 67 },
      { minQty: 10, pricePerUnitInr: 49, savingsPercent: 70 },
      { minQty: 25, pricePerUnitInr: 45, savingsPercent: 72 }
    ],
    temperatureControlled: false,
    inStockQuantity: 12500,
    estimatedDeliveryDays: 1,
    hsnCode: '30042010',
    gstRate: 12,
    badge: '🔥 Top Inpatient Antibiotic'
  },
  {
    id: 'sku-pharma-002',
    sku: 'MED-PCM-100ML-IV',
    name: 'Paracetamol IV Infusion 1000mg / 100ml BFS',
    genericFormula: 'Paracetamol 10mg/ml',
    category: 'PHARMACEUTICALS',
    manufacturer: 'Cipla Critical Care',
    packSize: 'Box of 24 Bottles',
    moq: 2,
    mrpInr: 320,
    wholesalePriceInr: 88,
    sourcingCostInr: 68,
    bulkTiers: [
      { minQty: 2, pricePerUnitInr: 88, savingsPercent: 72 },
      { minQty: 10, pricePerUnitInr: 79, savingsPercent: 75 },
      { minQty: 50, pricePerUnitInr: 72, savingsPercent: 77 }
    ],
    temperatureControlled: false,
    inStockQuantity: 8400,
    estimatedDeliveryDays: 1,
    hsnCode: '30049060',
    gstRate: 12,
    badge: '⚡ 24h Post-Op High Demand'
  },
  {
    id: 'sku-pharma-003',
    sku: 'MED-NS-500ML-IV',
    name: 'Normal Saline (0.9% NaCl) 500ml Euro-Head Bottle',
    genericFormula: 'Sodium Chloride 0.9% w/v',
    category: 'PHARMACEUTICALS',
    manufacturer: 'Baxter / Otsuka Direct',
    packSize: 'Crate of 30 Bottles',
    moq: 5,
    mrpInr: 68,
    wholesalePriceInr: 22,
    sourcingCostInr: 16.5,
    bulkTiers: [
      { minQty: 5, pricePerUnitInr: 22, savingsPercent: 67 },
      { minQty: 20, pricePerUnitInr: 19.5, savingsPercent: 71 },
      { minQty: 50, pricePerUnitInr: 17.8, savingsPercent: 73 }
    ],
    temperatureControlled: false,
    inStockQuantity: 42000,
    estimatedDeliveryDays: 1,
    hsnCode: '30049021',
    gstRate: 12,
    badge: '💧 Primary Inpatient Fluid'
  },
  {
    id: 'sku-pharma-004',
    sku: 'MED-RL-500ML-IV',
    name: 'Ringer Lactate Infusion (Hartmann Solution) 500ml',
    genericFormula: 'Compound Sodium Lactate IP',
    category: 'PHARMACEUTICALS',
    manufacturer: 'Baxter / Otsuka Direct',
    packSize: 'Crate of 30 Bottles',
    moq: 5,
    mrpInr: 72,
    wholesalePriceInr: 24,
    sourcingCostInr: 18,
    bulkTiers: [
      { minQty: 5, pricePerUnitInr: 24, savingsPercent: 66 },
      { minQty: 20, pricePerUnitInr: 21.5, savingsPercent: 70 },
      { minQty: 50, pricePerUnitInr: 19.2, savingsPercent: 73 }
    ],
    temperatureControlled: false,
    inStockQuantity: 36000,
    estimatedDeliveryDays: 1,
    hsnCode: '30049021',
    gstRate: 12,
    badge: '🏥 OT & Trauma Fluid'
  },
  {
    id: 'sku-pharma-005',
    sku: 'MED-PAN-40MG-INJ',
    name: 'Pantoprazole 40mg IV Injection with Solvent',
    genericFormula: 'Pantoprazole Sodium 40mg',
    category: 'PHARMACEUTICALS',
    manufacturer: 'Sun Pharma Direct',
    packSize: 'Pack of 50 Vials',
    moq: 2,
    mrpInr: 58,
    wholesalePriceInr: 18.5,
    sourcingCostInr: 13.8,
    bulkTiers: [
      { minQty: 2, pricePerUnitInr: 18.5, savingsPercent: 68 },
      { minQty: 10, pricePerUnitInr: 16.5, savingsPercent: 71 },
      { minQty: 30, pricePerUnitInr: 15.0, savingsPercent: 74 }
    ],
    temperatureControlled: false,
    inStockQuantity: 18000,
    estimatedDeliveryDays: 1,
    hsnCode: '30049039',
    gstRate: 12,
    badge: '💊 ICU Prophylaxis'
  },
  {
    id: 'sku-pharma-006',
    sku: 'MED-INS-GLARGINE',
    name: 'Insulin Glargine 100 IU/ml Cartridge (Cold-Chain 2-8°C)',
    genericFormula: 'Recombinant Human Insulin Glargine',
    category: 'PHARMACEUTICALS',
    manufacturer: 'Biocon Biologics',
    packSize: 'Box of 5 Cartridges (3ml)',
    moq: 2,
    mrpInr: 720,
    wholesalePriceInr: 340,
    sourcingCostInr: 285,
    bulkTiers: [
      { minQty: 2, pricePerUnitInr: 340, savingsPercent: 52 },
      { minQty: 10, pricePerUnitInr: 315, savingsPercent: 56 },
      { minQty: 25, pricePerUnitInr: 298, savingsPercent: 58 }
    ],
    temperatureControlled: true,
    coldChainRange: '2°C to 8°C (Monitored Temp Logger)',
    inStockQuantity: 3200,
    estimatedDeliveryDays: 1,
    hsnCode: '30043110',
    gstRate: 5,
    badge: '❄️ Cold-Chain Certified'
  },

  // 2. Pathology Lab Reagents & Chemicals
  {
    id: 'sku-chem-001',
    sku: 'LAB-CBC-DILUENT-20L',
    name: 'Hematology Diluent (Sysmex / Mindray 3-Part Compatible) 20L',
    genericFormula: 'Buffered Isotonic Electrolyte Solution',
    category: 'LAB_CHEMICALS',
    manufacturer: 'Transasia Bio-Medicals',
    packSize: '20 Litre Drum',
    moq: 1,
    mrpInr: 3800,
    wholesalePriceInr: 1650,
    sourcingCostInr: 1150,
    bulkTiers: [
      { minQty: 1, pricePerUnitInr: 1650, savingsPercent: 56 },
      { minQty: 5, pricePerUnitInr: 1480, savingsPercent: 61 },
      { minQty: 10, pricePerUnitInr: 1350, savingsPercent: 64 }
    ],
    temperatureControlled: false,
    inStockQuantity: 840,
    estimatedDeliveryDays: 1,
    hsnCode: '38220090',
    gstRate: 18,
    badge: '🧪 High-Volume CBC Essential'
  },
  {
    id: 'sku-chem-002',
    sku: 'LAB-CBC-LYSE-500ML',
    name: 'WBC Hemoglobin Lysis Reagent (Cyanide-Free) 500ml',
    genericFormula: 'Quaternary Ammonium Surfactant Buffer',
    category: 'LAB_CHEMICALS',
    manufacturer: 'Transasia Bio-Medicals',
    packSize: '500ml Sealed Bottle',
    moq: 2,
    mrpInr: 2400,
    wholesalePriceInr: 980,
    sourcingCostInr: 680,
    bulkTiers: [
      { minQty: 2, pricePerUnitInr: 980, savingsPercent: 59 },
      { minQty: 6, pricePerUnitInr: 890, savingsPercent: 62 },
      { minQty: 15, pricePerUnitInr: 810, savingsPercent: 66 }
    ],
    temperatureControlled: false,
    inStockQuantity: 1200,
    estimatedDeliveryDays: 1,
    hsnCode: '38220090',
    gstRate: 18,
    badge: '🔬 High-Accuracy Differential'
  },
  {
    id: 'sku-chem-003',
    sku: 'LAB-BIOCHEM-LFT-KIT',
    name: 'Liver Function Test Reagents Kit (SGOT, SGPT, Bilirubin, Alk Phos)',
    genericFormula: 'IFCC UV Kinetic Substrates & Diazo Reagents',
    category: 'LAB_CHEMICALS',
    manufacturer: 'Erba Mannheim Direct',
    packSize: 'Combo Kit (4 x 50ml)',
    moq: 1,
    mrpInr: 4600,
    wholesalePriceInr: 1890,
    sourcingCostInr: 1320,
    bulkTiers: [
      { minQty: 1, pricePerUnitInr: 1890, savingsPercent: 58 },
      { minQty: 4, pricePerUnitInr: 1720, savingsPercent: 62 },
      { minQty: 10, pricePerUnitInr: 1590, savingsPercent: 65 }
    ],
    temperatureControlled: true,
    coldChainRange: '2°C to 8°C',
    inStockQuantity: 650,
    estimatedDeliveryDays: 1,
    hsnCode: '38220090',
    gstRate: 18,
    badge: '⭐ 500 Tests Per Kit'
  },
  {
    id: 'sku-chem-004',
    sku: 'LAB-DENGUE-COMBO-CARD',
    name: 'Dengue Day-1 NS1 Antigen + IgM/IgG Antibody Combo Test Cards',
    genericFormula: 'Rapid Immunochromatographic Gold Conjugate',
    category: 'LAB_CHEMICALS',
    manufacturer: 'J. Mitra & Co. Diagnostic',
    packSize: 'Box of 25 Rapid Test Cards',
    moq: 2,
    mrpInr: 3250,
    wholesalePriceInr: 1350,
    sourcingCostInr: 990,
    bulkTiers: [
      { minQty: 2, pricePerUnitInr: 1350, savingsPercent: 58 },
      { minQty: 10, pricePerUnitInr: 1220, savingsPercent: 62 },
      { minQty: 30, pricePerUnitInr: 1100, savingsPercent: 66 }
    ],
    temperatureControlled: false,
    inStockQuantity: 4500,
    estimatedDeliveryDays: 1,
    hsnCode: '38220019',
    gstRate: 12,
    badge: '🦟 Monsoon Outbreak Essential'
  },
  {
    id: 'sku-chem-005',
    sku: 'LAB-DISINF-GLUTARAL',
    name: 'Glutaraldehyde 2.45% Hospital Cold Sterilization Solution 5L',
    genericFormula: 'Dialdehyde Disinfectant with Activator Salt',
    category: 'LAB_CHEMICALS',
    manufacturer: 'Raman & Weil Hospital Clean',
    packSize: '5 Litre Canister + Activator',
    moq: 1,
    mrpInr: 1850,
    wholesalePriceInr: 790,
    sourcingCostInr: 540,
    bulkTiers: [
      { minQty: 1, pricePerUnitInr: 790, savingsPercent: 57 },
      { minQty: 4, pricePerUnitInr: 710, savingsPercent: 61 },
      { minQty: 10, pricePerUnitInr: 640, savingsPercent: 65 }
    ],
    temperatureControlled: false,
    inStockQuantity: 1850,
    estimatedDeliveryDays: 1,
    hsnCode: '38089400',
    gstRate: 18,
    badge: '🛡️ Endoscope & OT Sterilant'
  },

  // 3. Medical Consumables & Equipment
  {
    id: 'sku-eq-001',
    sku: 'CON-CANNULA-20G',
    name: 'IV Cannula with Injection Port & Wings 20G (Pink)',
    genericFormula: 'PTFE Radiopaque Catheter with Japanese Needle',
    category: 'EQUIPMENT_CONSUMABLES',
    manufacturer: 'Becton Dickinson (BD) / Polymed',
    packSize: 'Box of 100 Sterile Units',
    moq: 2,
    mrpInr: 1200,
    wholesalePriceInr: 480,
    sourcingCostInr: 330,
    bulkTiers: [
      { minQty: 2, pricePerUnitInr: 480, savingsPercent: 60 },
      { minQty: 10, pricePerUnitInr: 420, savingsPercent: 65 },
      { minQty: 50, pricePerUnitInr: 380, savingsPercent: 68 }
    ],
    temperatureControlled: false,
    inStockQuantity: 16000,
    estimatedDeliveryDays: 1,
    hsnCode: '90183900',
    gstRate: 12,
    badge: '💉 Adult Standard Inpatient'
  },
  {
    id: 'sku-eq-002',
    sku: 'CON-SYRINGE-5ML',
    name: 'DispoVan 3-Part Luer Mount Syringe 5ml with 24G Needle',
    genericFormula: 'Medical Grade Polypropylene Non-Pyrogenic',
    category: 'EQUIPMENT_CONSUMABLES',
    manufacturer: 'HMD DispoVan Direct',
    packSize: 'Box of 100 Pieces',
    moq: 3,
    mrpInr: 750,
    wholesalePriceInr: 290,
    sourcingCostInr: 215,
    bulkTiers: [
      { minQty: 3, pricePerUnitInr: 290, savingsPercent: 61 },
      { minQty: 15, pricePerUnitInr: 260, savingsPercent: 65 },
      { minQty: 50, pricePerUnitInr: 235, savingsPercent: 68 }
    ],
    temperatureControlled: false,
    inStockQuantity: 34000,
    estimatedDeliveryDays: 1,
    hsnCode: '90183100',
    gstRate: 12,
    badge: '⚡ Universal Nursing SKU'
  },
  {
    id: 'sku-eq-003',
    sku: 'CON-NITRILE-GLOVES',
    name: 'Nitrile Examination Gloves Powder-Free (Blue, Medium)',
    genericFormula: 'Acrylonitrile Butadiene Polymeric Latex-Free',
    category: 'EQUIPMENT_CONSUMABLES',
    manufacturer: 'Kimberly-Clark / CareShield',
    packSize: 'Box of 100 Gloves (50 Pairs)',
    moq: 4,
    mrpInr: 650,
    wholesalePriceInr: 265,
    sourcingCostInr: 185,
    bulkTiers: [
      { minQty: 4, pricePerUnitInr: 265, savingsPercent: 59 },
      { minQty: 20, pricePerUnitInr: 235, savingsPercent: 63 },
      { minQty: 60, pricePerUnitInr: 210, savingsPercent: 67 }
    ],
    temperatureControlled: false,
    inStockQuantity: 28000,
    estimatedDeliveryDays: 1,
    hsnCode: '40151900',
    gstRate: 12,
    badge: '🧤 Barrier Protection ISO'
  },
  {
    id: 'sku-eq-004',
    sku: 'EQ-SYRINGE-PUMP-DUAL',
    name: 'DocSearch Precision Micro-Infusion Syringe Pump (Dual Channel)',
    genericFormula: 'Microprocessor Controlled 0.1-1500 ml/hr with Bolus & KVO',
    category: 'EQUIPMENT_CONSUMABLES',
    manufacturer: 'DocSearch Medical Devices',
    packSize: '1 Complete Unit with Calibrated Clamp & Power Cable',
    moq: 1,
    mrpInr: 45000,
    wholesalePriceInr: 24500,
    sourcingCostInr: 18200,
    bulkTiers: [
      { minQty: 1, pricePerUnitInr: 24500, savingsPercent: 45 },
      { minQty: 3, pricePerUnitInr: 22800, savingsPercent: 49 },
      { minQty: 8, pricePerUnitInr: 21200, savingsPercent: 52 }
    ],
    temperatureControlled: false,
    inStockQuantity: 120,
    estimatedDeliveryDays: 2,
    hsnCode: '90189099',
    gstRate: 18,
    badge: '🏥 ICU / NICU Gold Standard'
  },
  {
    id: 'sku-eq-005',
    sku: 'EQ-MULTIPARA-MONITOR-12',
    name: 'DocSearch 12.1" Color TFT Multi-Para Patient Monitor',
    genericFormula: '5-Parameter: ECG (7 Lead), SpO2, NIBP, Respiration, Dual Temp',
    category: 'EQUIPMENT_CONSUMABLES',
    manufacturer: 'DocSearch Medical Devices',
    packSize: '1 Complete Unit with Cables, Sensors & Adult/Pedia Cuffs',
    moq: 1,
    mrpInr: 68000,
    wholesalePriceInr: 38900,
    sourcingCostInr: 29500,
    bulkTiers: [
      { minQty: 1, pricePerUnitInr: 38900, savingsPercent: 42 },
      { minQty: 2, pricePerUnitInr: 36500, savingsPercent: 46 },
      { minQty: 5, pricePerUnitInr: 34200, savingsPercent: 49 }
    ],
    temperatureControlled: false,
    inStockQuantity: 85,
    estimatedDeliveryDays: 2,
    hsnCode: '90181990',
    gstRate: 18,
    badge: '🩺 2-Year Direct Warranty'
  }
];

export const INITIAL_INBOUND_POS: InboundPurchaseOrder[] = [
  {
    id: 'po-10928',
    poNumber: 'PO-DS-2026-0081',
    hospitalId: 'hosp-delhi-apollo',
    hospitalName: 'Apollo Cradle & Children Hospital (Delhi Central)',
    orderDate: '2026-10-14 09:15 AM',
    status: 'PROCESSING',
    items: [
      {
        itemId: 'sku-pharma-001',
        name: 'Ceftriaxone 1g Injection IP (Dry Powder + WFI)',
        sku: 'MED-CFT-1G-INJ',
        quantity: 15,
        unitPriceInr: 45,
        totalInr: 33750,
        allocatedBatch: 'BATCH-CFT-26-K08',
        expiryDate: '2028-11',
        mrpInr: 165
      },
      {
        itemId: 'sku-pharma-002',
        name: 'Paracetamol IV Infusion 1000mg / 100ml BFS',
        sku: 'MED-PCM-100ML-IV',
        quantity: 12,
        unitPriceInr: 72,
        totalInr: 20736,
        allocatedBatch: 'BATCH-PCM-26-M41',
        expiryDate: '2028-08',
        mrpInr: 320
      },
      {
        itemId: 'sku-eq-001',
        name: 'IV Cannula with Injection Port & Wings 20G (Pink)',
        sku: 'CON-CANNULA-20G',
        quantity: 8,
        unitPriceInr: 420,
        totalInr: 33600,
        allocatedBatch: 'BATCH-CAN-26-X12',
        expiryDate: '2029-05',
        mrpInr: 1200
      }
    ],
    subtotalInr: 88086,
    gstInr: 10570,
    totalAmountInr: 98656,
    transporterName: 'Delhivery Healthcare Express Fleet',
    awbTrackingNumber: 'DEL-HC-881940182IN',
    dispatchedAt: '2026-10-14 11:30 AM'
  },
  {
    id: 'po-10929',
    poNumber: 'PO-DS-2026-0082',
    hospitalId: 'hosp-patna-metro',
    hospitalName: 'Metro Multispecialty Hospital & Trauma Center (Patna)',
    orderDate: '2026-10-14 10:20 AM',
    status: 'DELIVERED',
    items: [
      {
        itemId: 'sku-chem-001',
        name: 'Hematology Diluent (Sysmex / Mindray 3-Part Compatible) 20L',
        sku: 'LAB-CBC-DILUENT-20L',
        quantity: 4,
        unitPriceInr: 1480,
        totalInr: 5920,
        allocatedBatch: 'BATCH-DIL-26-P09',
        expiryDate: '2027-10',
        mrpInr: 3800
      },
      {
        itemId: 'sku-chem-004',
        name: 'Dengue Day-1 NS1 Antigen + IgM/IgG Antibody Combo Test Cards',
        sku: 'LAB-DENGUE-COMBO-CARD',
        quantity: 10,
        unitPriceInr: 1220,
        totalInr: 12200,
        allocatedBatch: 'BATCH-DNG-26-W33',
        expiryDate: '2027-12',
        mrpInr: 3250
      },
      {
        itemId: 'sku-eq-004',
        name: 'DocSearch Precision Micro-Infusion Syringe Pump (Dual Channel)',
        sku: 'EQ-SYRINGE-PUMP-DUAL',
        quantity: 2,
        unitPriceInr: 24500,
        totalInr: 49000,
        allocatedBatch: 'BATCH-PUMP-26-SER09',
        expiryDate: '2036-01',
        mrpInr: 45000
      }
    ],
    subtotalInr: 67120,
    gstInr: 11281,
    totalAmountInr: 78401,
    transporterName: 'BlueDart MedTransit Express',
    awbTrackingNumber: 'BLU-MED-994018821',
    dispatchedAt: '2026-10-13 04:00 PM',
    deliveredAt: '2026-10-14 11:15 AM',
    isAutoGrnApplied: true
  }
];

class B2BWholesaleSupplyService {
  private catalogKey = 'docsearch_b2b_wholesale_catalog';
  private posKey = 'docsearch_b2b_inbound_pos';

  getCatalog(): WholesaleCatalogItem[] {
    try {
      const stored = localStorage.getItem(this.catalogKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_WHOLESALE_CATALOG;
  }

  saveCatalog(items: WholesaleCatalogItem[]): void {
    try {
      localStorage.setItem(this.catalogKey, JSON.stringify(items));
    } catch {}
  }

  getPurchaseOrders(): InboundPurchaseOrder[] {
    try {
      const stored = localStorage.getItem(this.posKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_INBOUND_POS;
  }

  savePurchaseOrders(pos: InboundPurchaseOrder[]): void {
    try {
      localStorage.setItem(this.posKey, JSON.stringify(pos));
    } catch {}
  }

  createPurchaseOrder(order: Omit<InboundPurchaseOrder, 'id' | 'poNumber' | 'orderDate' | 'status'>): InboundPurchaseOrder {
    const pos = this.getPurchaseOrders();
    const newPo: InboundPurchaseOrder = {
      ...order,
      id: `po-${Date.now()}`,
      poNumber: `PO-DS-2026-${String(pos.length + 83).padStart(4, '0')}`,
      orderDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      status: 'PENDING_APPROVAL'
    };
    const updated = [newPo, ...pos];
    this.savePurchaseOrders(updated);
    return newPo;
  }

  updateOrderStatus(
    poId: string,
    status: InboundPurchaseOrder['status'],
    details?: { transporterName?: string; awbTrackingNumber?: string }
  ): InboundPurchaseOrder | null {
    const pos = this.getPurchaseOrders();
    const idx = pos.findIndex(p => p.id === poId);
    if (idx === -1) return null;

    const existing = pos[idx]!;
    const updated: InboundPurchaseOrder = {
      id: existing.id,
      poNumber: existing.poNumber,
      hospitalId: existing.hospitalId,
      hospitalName: existing.hospitalName,
      orderDate: existing.orderDate,
      status,
      items: existing.items,
      subtotalInr: existing.subtotalInr,
      gstInr: existing.gstInr,
      totalAmountInr: existing.totalAmountInr,
      transporterName: details?.transporterName ?? existing.transporterName,
      awbTrackingNumber: details?.awbTrackingNumber ?? existing.awbTrackingNumber,
      dispatchedAt: status === 'DISPATCHED' ? new Date().toLocaleString('en-IN') : existing.dispatchedAt,
      deliveredAt: status === 'DELIVERED' ? new Date().toLocaleString('en-IN') : existing.deliveredAt,
      isAutoGrnApplied: status === 'DELIVERED' ? true : existing.isAutoGrnApplied
    };

    pos[idx] = updated;
    this.savePurchaseOrders(pos);
    return updated;
  }
}

export const b2bWholesaleSupplyService = new B2BWholesaleSupplyService();
