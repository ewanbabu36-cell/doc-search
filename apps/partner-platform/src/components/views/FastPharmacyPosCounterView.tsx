import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  playAudioFeedback
} from '@docsearch/ui-kit';
import {
  INDIAN_PHARMACY_FORMULARY,
  type IndianMedicationFormularyItem,
  type ScheduleDrugType
} from '../../services/indian-pharmacy-catalog.js';
import type {
  PharmacyBatchDto,
  PharmacyPrescriptionDto,
  MedicationCatalogDto
} from '@docsearch/api-contracts';
import { PharmacyInvoiceSlipModal, type PharmacyInvoiceData, type PharmacyInvoiceItem } from '../dialogs/PharmacyInvoiceSlipModal.js';
import { PharmacySalesHistoryModal } from '../dialogs/PharmacySalesHistoryModal.js';
import { WebcamSmartCounterModal, type SmartCounterVerificationResult } from '../dialogs/WebcamSmartCounterModal.js';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { ProfileUpdateRequiredAlertModal } from '../common/ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';
import { useHardwareBarcodeScanner, type ScannedBarcodePayload } from '../../services/hardware-barcode-listener.js';
import { GenericSaltSubstituteModal } from '../dialogs/GenericSaltSubstituteModal.js';
import { DoctorPrescriptionQueueImporterModal } from '../dialogs/DoctorPrescriptionQueueImporterModal.js';
import { PrescriptionCameraOcrModal } from '../dialogs/PrescriptionCameraOcrModal.js';
import { fastPharmacySearchIndex } from '../../services/fast-pharmacy-search-index.js';
import {
  cdscoInspectionAuditService,
  type ControlledScheduleCategory
} from '../../services/cdsco-inspection-audit-service.js';
import { MandatoryPrescriberComplianceModal } from '../dialogs/MandatoryPrescriberComplianceModal.js';
import { CdscoDrugInspectorAuditVaultView } from './CdscoDrugInspectorAuditVaultView.js';
import { pharmacyOfflineStorageService } from '../../services/pharmacy-offline-storage-service.js';
import { pharmacySyncEngine, type SyncEngineState } from '../../services/pharmacy-sync-engine.js';
import { PharmacyOfflineSyncModal } from '../dialogs/PharmacyOfflineSyncModal.js';
import { pharmacyRevenueGallaService } from '../../services/pharmacy-revenue-galla-service.js';
import { pharmacyCreditKhataService } from '../../services/pharmacy-credit-khata-service.js';
import { optimisticActionService } from '../../services/optimistic-action-service.js';
import { patientSessionTabService } from '../../services/patient-session-tab-service.js';

export interface FastPharmacyPosCounterViewProps {
  batches: PharmacyBatchDto[];
  prescriptions: PharmacyPrescriptionDto[];
  catalog?: MedicationCatalogDto[];
  currentUser?: HospitalStaffUser | undefined;
  initialBatchToSell?: PharmacyBatchDto | null;
  onClearInitialBatchToSell?: () => void;
  initialPrescriptionId?: string | null;
  onClearInitialPrescriptionId?: () => void;
  onClosePos?: () => void;
  onOpenCdscoVault?: () => void;
  dispensingRecords?: import('@docsearch/api-contracts').PharmacyDispensingDto[];
  onDispenseSubmit: (payload: {
    patientName: string;
    patientPhone: string;
    doctorName?: string | undefined;
    doctorNmcReg?: string | undefined;
    prescriptionId?: string | undefined;
    items: Array<{
      medicationId: string;
      batchId: string;
      quantity: number;
      unitPrice: number;
      dosageInstructions?: string | undefined;
      isLoose?: boolean | undefined;
      packUnits?: number | undefined;
    }>;
  }) => Promise<void>;
}

interface CartItem {
  id: string; // unique item id in cart
  medication: IndianMedicationFormularyItem;
  selectedBatch: PharmacyBatchDto;
  isLoose: boolean; // true if selling loose tablets
  quantity: number; // in strips or loose tabs
  rate: number; // unit price or strip price
  isSubstituted: boolean;
}

export const FastPharmacyPosCounterView: React.FC<FastPharmacyPosCounterViewProps> = ({
  batches,
  prescriptions,
  catalog = [],
  currentUser,
  initialBatchToSell,
  onClearInitialBatchToSell,
  initialPrescriptionId,
  onClearInitialPrescriptionId,
  onClosePos,
  dispensingRecords = [],
  onDispenseSubmit
}) => {
  // Mode: Full Page / Fullscreen POS Mode (default false to flow naturally within shell without header overlap)
  const [isFullPage, setIsFullPage] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isClinicalToolsOpen, setIsClinicalToolsOpen] = useState(false);

  // Mode: Walk-In vs Hospital Prescription
  const [billingMode, setBillingMode] = useState<'WALK_IN' | 'HOSPITAL_RX'>('WALK_IN');
  const [selectedRxId, setSelectedRxId] = useState<string>('');
  const partnerProfile = useMemo(() => getUnifiedPartnerProfile(currentUser), [currentUser]);
  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);

  // Customer Details
  const [patientName, setPatientName] = useState('Walk-in Customer');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorNmcReg, setDoctorNmcReg] = useState('');

  // Cart & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI_QR' | 'CARD' | 'CREDIT_KHATA'>('UPI_QR');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [medicinesTakenBy, setMedicinesTakenBy] = useState<string>('');
  const [khataOverrideApproved, setKhataOverrideApproved] = useState<boolean>(false);
  const [qtyInputMap, setQtyInputMap] = useState<Record<string, string>>({});

  // UI Dialog State
  const [completedInvoice, setCompletedInvoice] = useState<PharmacyInvoiceData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [autoPrintInvoice, setAutoPrintInvoice] = useState(false);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [isSmartCounterOpen, setIsSmartCounterOpen] = useState(false);
  const [smartCounterTargetMed, setSmartCounterTargetMed] = useState<IndianMedicationFormularyItem | null>(null);

  // 🧬 Generic Salt / Molecule Search & Doctor e-Rx Importer State
  const [isSaltSubstituteModalOpen, setIsSaltSubstituteModalOpen] = useState(false);
  const [isDoctorRxModalOpen, setIsDoctorRxModalOpen] = useState(false);
  const [isCameraOcrModalOpen, setIsCameraOcrModalOpen] = useState(false);
  const [pendingDoctorRxCount, setPendingDoctorRxCount] = useState<number>(0);

  // ⚖️ CDSCO Mandatory Prescriber & Drug Inspector Audit Vault State
  const [isPrescriberPromptOpen, setIsPrescriberPromptOpen] = useState(false);
  const [prescriberTriggerDrug, setPrescriberTriggerDrug] = useState<string>('Controlled Medication');
  const [prescriberTriggerSchedule, setPrescriberTriggerSchedule] = useState<ControlledScheduleCategory>('SCHEDULE_H1');
  const [isCdscoAuditVaultModalOpen, setIsCdscoAuditVaultModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // 📡 Offline-First PWA & Background Sync State
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => pharmacyOfflineStorageService.isOffline());
  const [pendingOfflineBillsCount, setPendingOfflineBillsCount] = useState<number>(0);
  const [syncEngineState, setSyncEngineState] = useState<SyncEngineState>('IDLE');
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);

  useEffect(() => {
    const unsubStatus = pharmacyOfflineStorageService.subscribeStatus((offline) => {
      setIsOfflineMode(offline);
      void pharmacyOfflineStorageService.getPendingSyncCount().then(setPendingOfflineBillsCount);
    });

    const unsubSync = pharmacySyncEngine.subscribe((state) => {
      setSyncEngineState(state);
      void pharmacyOfflineStorageService.getPendingSyncCount().then(setPendingOfflineBillsCount);
    });

    void pharmacyOfflineStorageService.getPendingSyncCount().then(setPendingOfflineBillsCount);

    return () => {
      unsubStatus();
      unsubSync();
    };
  }, []);

  // 🗂️ Browser-Style Multi-Patient Session Tabs Integration
  useEffect(() => {
    const draft = patientSessionTabService.getDraft('pharmacy-pos');
    if (draft && draft.cart && draft.cart.length > 0) {
      setCart(draft.cart);
      if (draft.patientName) setPatientName(draft.patientName);
      if (draft.patientPhone) setPatientPhone(draft.patientPhone);
      if (draft.doctorName) setDoctorName(draft.doctorName);
      if (typeof draft.discountPercent === 'number') setDiscountPercent(draft.discountPercent);
      if (draft.paymentMode) setPaymentMode(draft.paymentMode);
    }
  }, []);

  useEffect(() => {
    const tabId = 'pharmacy-pos';
    patientSessionTabService.openTab({
      id: tabId,
      title: patientName && patientName !== 'Walk-in Customer' ? `POS: ${patientName}` : 'Pharmacy POS',
      subtitle: cart.length > 0 ? `${cart.length} item${cart.length > 1 ? 's' : ''}` : 'Counter Bill',
      type: 'POS',
      patientName: patientName || 'Walk-in Customer',
      module: 'pharmacy-medication',
      subTab: 'pos'
    });

    if (cart.length > 0) {
      patientSessionTabService.setTabDirty(tabId, true);
      patientSessionTabService.saveDraft(tabId, {
        patientName,
        patientPhone,
        doctorName,
        cart,
        discountPercent,
        paymentMode
      });
    } else {
      patientSessionTabService.setTabDirty(tabId, false);
    }
  }, [patientName, cart, doctorName, patientPhone, discountPercent, paymentMode]);

  useEffect(() => {
    const handleTabClosed = (e: any) => {
      const closed = e.detail;
      if (closed && closed.id === 'pharmacy-pos') {
        setCart([]);
        setPatientName('Walk-in Customer');
        setPatientPhone('');
      }
    };
    window.addEventListener('docsearch:session_tab_closed' as any, handleTabClosed);
    return () => window.removeEventListener('docsearch:session_tab_closed' as any, handleTabClosed);
  }, []);

  // Synchronize live count of pending doctor prescriptions from server domain queue
  useEffect(() => {
    const updateCount = () => {
      const domainPending = (prescriptions || []).filter(
        (p) => p.status === 'CREATED' || p.status === 'VERIFIED' || p.status === 'READY_FOR_DISPENSING'
      ).length;
      setPendingDoctorRxCount(domainPending);
    };

    updateCount();
    const unsub = hospitalEventBus.subscribe('PRESCRIPTION_ISSUED', (payload) => {
      updateCount();
      setNotification({
        type: 'success',
        message: `⚡ New doctor prescription received: ${payload.data?.patientName || 'Patient'}!`
      });
    });

    return () => {
      unsub();
    };
  }, []);

  // Handle 1-Click Import of Doctor's e-Prescription
  const handleImportDoctorPrescription = (payload: {
    patientName: string;
    patientPhone: string;
    doctorName: string;
    prescriptionId: string;
    cartItems: Array<{
      medication: IndianMedicationFormularyItem;
      selectedBatch: PharmacyBatchDto;
      quantity: number;
      rate: number;
    }>;
  }) => {
    setPatientName(payload.patientName);
    setPatientPhone(payload.patientPhone);
    setDoctorName(payload.doctorName);
    setBillingMode('HOSPITAL_RX');
    setSelectedRxId(payload.prescriptionId);

    // Transform into CartItems
    const newCartItems: CartItem[] = payload.cartItems.map((item, idx) => ({
      id: `cart-rx-${payload.prescriptionId}-${idx}-${Date.now()}`,
      medication: item.medication,
      selectedBatch: item.selectedBatch,
      isLoose: false,
      quantity: item.quantity,
      rate: item.rate,
      isSubstituted: false
    }));

    setCart(newCartItems);
    setNotification({
      type: 'success',
      message: `⚡ Imported ${newCartItems.length} prescribed items from ${payload.doctorName} for ${payload.patientName}!`
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle 1-Click Import of Doctor's Handwriting from Camera / WhatsApp Vision OCR
  const handleImportOcrPrescription = (payload: {
    patientName: string;
    patientPhone: string;
    doctorName: string;
    doctorNmcReg: string;
    prescriptionId: string;
    cartItems: Array<{
      medication: IndianMedicationFormularyItem;
      selectedBatch: PharmacyBatchDto;
      isLoose: boolean;
      quantity: number;
      rate: number;
      dosageInstructions: string;
    }>;
  }) => {
    setPatientName(payload.patientName);
    setPatientPhone(payload.patientPhone);
    setDoctorName(payload.doctorName);
    setDoctorNmcReg(payload.doctorNmcReg);
    setBillingMode('HOSPITAL_RX');
    setSelectedRxId(payload.prescriptionId);

    const newCartItems: CartItem[] = payload.cartItems.map((item, idx) => ({
      id: `cart-ocr-${payload.prescriptionId}-${idx}-${Date.now()}`,
      medication: item.medication,
      selectedBatch: item.selectedBatch,
      isLoose: item.isLoose,
      quantity: item.quantity,
      rate: item.rate,
      isSubstituted: item.medication.brandType === 'GENERIC' || !!item.medication.janAushadhiEquivalent
    }));

    setCart(newCartItems);
    if (newCartItems.length > 0) {
      setActiveCartItemId(newCartItems[0]!.id);
    }

    setNotification({
      type: 'success',
      message: `⚡ Vision OCR imported ${newCartItems.length} items from Dr. ${payload.doctorName} for ${payload.patientName}! Press Enter to print tax invoice.`
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle Select Generic Salt / Molecule Substitute
  const handleSelectSaltSubstitute = (med: IndianMedicationFormularyItem, batch: PharmacyBatchDto) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((c) => c.selectedBatch.batchNumber === batch.batchNumber);
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-sub-${batch.id}-${Date.now()}`,
          medication: med,
          selectedBatch: batch,
          isLoose: false,
          quantity: 1,
          rate: med.mrp,
          isSubstituted: med.brandType === 'GENERIC' || !!med.janAushadhiEquivalent
        }
      ];
    });

    setNotification({
      type: 'success',
      message: `🧬 Added ${med.brandName} (${med.genericName}) to POS Cart!`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Dynamic Sales History State: loaded from localStorage without static dummy records
  const [salesHistory, setSalesHistory] = useState<PharmacyInvoiceData[]>(() => {
    try {
      const saved = localStorage.getItem('docsearch_pharmacy_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (it) => it && it.invoiceNumber && !it.invoiceNumber.includes('894210') && !it.invoiceNumber.includes('783109')
          );
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Dynamically sync any dispensing records from parent / backend into salesHistory
  useEffect(() => {
    if (dispensingRecords && dispensingRecords.length > 0) {
      setSalesHistory((prev) => {
        const existingNumbers = new Set(prev.map((p) => p.invoiceNumber));
        const newFromDispensing: PharmacyInvoiceData[] = [];

        for (const d of dispensingRecords) {
          const invNum = d.dispensingNumber.replace('DSP-', 'INV-');
          if (!existingNumbers.has(invNum) && !existingNumbers.has(d.dispensingNumber)) {
            const items: PharmacyInvoiceItem[] = d.items.map((it) => {
              const med = catalog.find((m) => m.id === it.medicationId);
              const unitRate = 15.0;
              return {
                medicationName: it.medicationName,
                genericName: med?.genericName || 'Standard Formulation',
                batchNumber: it.batchNumber,
                expiryDate: '12/26',
                quantity: it.quantity,
                unit: it.unit || 'Strip',
                mrp: unitRate,
                rate: unitRate,
                gstRate: 12,
                hsnCode: '30049099',
                total: Math.round(it.quantity * unitRate * 100) / 100
              };
            });

            const sub = items.reduce((acc, i) => acc + i.total, 0);
            const taxable = Math.round((sub / 1.12) * 100) / 100;
            const gst = Math.round((sub - taxable) * 100) / 100;

            newFromDispensing.push({
              invoiceNumber: invNum,
              invoiceDate: new Date(d.dispensedAt || d.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
              tenantName: partnerProfile.entityLegalName || currentUser?.tenantName || 'DocSearch Pharmacy & Chemist',
              drugLicenseNo: partnerProfile.pharmacyDrugLicense20B ? `DL: ${partnerProfile.pharmacyDrugLicense20B}${partnerProfile.pharmacyDrugLicense21B ? ' / ' + partnerProfile.pharmacyDrugLicense21B : ''}` : 'FORM 20B/21B',
              gstin: partnerProfile.gstin || 'GST NOT REGISTERED',
              pharmacistName: d.pharmacistName || partnerProfile.pharmacistName || currentUser?.name || 'Registered Pharmacist',
              pharmacistRegNo: partnerProfile.pharmacistRegNo ? `Reg # ${partnerProfile.pharmacistRegNo}` : 'Reg # Pending',
              patientName: d.patientName,
              patientPhone: (d.patientMrn || '').replace('TEL-', '') || '9876543210',
              paymentMode: 'CASH',
              items,
              subtotal: Math.round(sub * 100) / 100,
              discountPercent: 0,
              discountAmount: 0,
              taxableAmount: taxable,
              cgstAmount: Math.round((gst / 2) * 100) / 100,
              sgstAmount: Math.round((gst / 2) * 100) / 100,
              grandTotal: Math.round(sub * 100) / 100
            });
          }
        }

        if (newFromDispensing.length > 0) {
          const combined = [...newFromDispensing, ...prev];
          try {
            localStorage.setItem('docsearch_pharmacy_invoices', JSON.stringify(combined));
          } catch {
            // ignore
          }
          return combined;
        }

        return prev;
      });
    }
  }, [dispensingRecords, catalog, currentUser]);

  // Auto-add preselected batch from Inventory Table 🛒 POS Action
  useEffect(() => {
    if (initialBatchToSell) {
      const b = initialBatchToSell;
      const bBrand = b.medicationName.split('(')[0]?.trim() || b.medicationName;
      const bGen = b.medicationName.includes('(') ? b.medicationName.split('(')[1]?.replace(')', '').trim() : '';

      const match = INDIAN_PHARMACY_FORMULARY.find(
        (m) =>
          m.id === b.medicationId ||
          m.medicationCode === b.medicationCode ||
          m.brandName.toLowerCase().includes(bBrand.toLowerCase()) ||
          (bGen && m.genericName.toLowerCase().includes(bGen.toLowerCase()))
      );

      const unitCostVal = parseFloat(b.unitCost || '15');
      const medItem: IndianMedicationFormularyItem = match || {
        id: b.medicationId || `med-custom-${b.id}`,
        medicationCode: b.medicationCode || `MED-${b.batchNumber}`,
        brandName: bBrand,
        genericName: bGen || b.medicationName,
        strength: 'Standard',
        dosageForm: 'TABLET',
        packConfiguration: 'Pack of 10',
        packUnits: 10,
        unitOfMeasure: 'PACK',
        manufacturer: b.manufacturer || 'Pharma Stockist',
        mrp: Math.round(unitCostVal * 1.5 * 100) / 100,
        costPrice: unitCostVal,
        unitPrice: Math.round((unitCostVal * 1.5 / 10) * 100) / 100,
        gstRate: 12,
        hsnCode: '30049060',
        category: 'GENERAL',
        scheduleType: 'OTC',
        barcode: b.batchNumber,
        brandType: 'ETHICAL'
      };

      setCart((prev) => {
        const existingIdx = prev.findIndex((c) => c.selectedBatch.batchNumber === b.batchNumber);
        if (existingIdx >= 0) {
          return prev.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [
          ...prev,
          {
            id: `cart-pos-${b.id}-${Date.now()}`,
            medication: medItem,
            selectedBatch: b,
            isLoose: false,
            quantity: 1,
            rate: medItem.mrp,
            isSubstituted: false
          }
        ];
      });

      setNotification({
        type: 'success',
        message: `🛒 ${medItem.brandName} (Batch ${b.batchNumber}) added to POS cart! Select quantity and payment mode to generate invoice.`
      });

      onClearInitialBatchToSell?.();
      setTimeout(() => setNotification(null), 4500);
    }
  }, [initialBatchToSell, onClearInitialBatchToSell]);

  // Auto-preload prescription into POS cart when initialPrescriptionId is provided
  useEffect(() => {
    if (!initialPrescriptionId) return;

    let targetRx: any = null;

    // Load prescription from server domain queue
    if (prescriptions) {
      targetRx = prescriptions.find((p) => p.id === initialPrescriptionId || p.prescriptionNumber === initialPrescriptionId);
    }

    if (targetRx) {
      const pName = targetRx.patientName || 'Hospital Patient';
      const pPhone = targetRx.patientPhone || targetRx.patientMrn || '9876543210';
      const docName = targetRx.doctorName || targetRx.prescribingDoctorName || 'Dr. Attending Physician';

      setPatientName(pName);
      setPatientPhone(pPhone);
      setDoctorName(docName);
      setBillingMode('HOSPITAL_RX');
      setSelectedRxId(initialPrescriptionId);

      const itemsList = targetRx.items || [];
      const newCartItems: CartItem[] = [];

      itemsList.forEach((it: any, idx: number) => {
        const medName = (it.medicationName || '').toLowerCase();
        const med =
          INDIAN_PHARMACY_FORMULARY.find(
            (m) =>
              medName.includes(m.brandName.toLowerCase()) ||
              medName.includes(m.genericName.toLowerCase()) ||
              m.genericName.toLowerCase().includes(medName) ||
              m.brandName.toLowerCase().includes(medName)
          ) || INDIAN_PHARMACY_FORMULARY[0]!;

        // Pick matching batch or FEFO batch
        const batch =
          batches.find((b) => b.medicationId === med.id && b.availableQuantity > 0) ||
          batches.find((b) => b.availableQuantity > 0) || {
            id: `batch-${Date.now()}-${idx}`,
            tenantId: 'tenant-default',
            partnerId: 'partner-default',
            organizationId: 'org-default',
            branchId: 'branch-default',
            medicationId: med.id,
            medicationCode: med.medicationCode,
            medicationName: med.brandName,
            batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
            manufacturer: med.manufacturer,
            manufacturingDate: '2024-01-01',
            expiryDate: '2026-12-31',
            receivedQuantity: 100,
            availableQuantity: 95,
            reservedQuantity: 0,
            daysToExpiry: 450,
            costPrice: med.mrp * 0.7,
            sellingPrice: med.mrp,
            mrp: med.mrp,
            taxRatePercent: 12,
            hsnCode: med.hsnCode,
            storageLocation: 'Shelf A-1',
            status: 'ACTIVE' as const,
            complianceSchedule: med.scheduleType as any,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

        newCartItems.push({
          id: `cart-rx-${initialPrescriptionId}-${idx}-${Date.now()}`,
          medication: med,
          selectedBatch: batch as PharmacyBatchDto,
          isLoose: false,
          quantity: it.duration ? Math.min(Math.max(1, Math.ceil(it.duration / 5)), 5) : 1,
          rate: med.mrp,
          isSubstituted: false
        });
      });

      if (newCartItems.length > 0) {
        setCart(newCartItems);
        setActiveCartItemId(newCartItems[0]!.id);
        setNotification({
          type: 'success',
          message: `⚡ Loaded ${newCartItems.length} prescribed medications from ${docName} for ${pName}! Ready for fast checkout.`
        });
        setTimeout(() => setNotification(null), 5000);
      }

      onClearInitialPrescriptionId?.();
    }
  }, [initialPrescriptionId, onClearInitialPrescriptionId, prescriptions, batches]);

  // Commit verified count and batch from AI Smart Counter
  const handleCommitSmartCounter = (res: SmartCounterVerificationResult) => {
    const med = INDIAN_PHARMACY_FORMULARY.find((m) => m.id === res.medicationId) || smartCounterTargetMed || INDIAN_PHARMACY_FORMULARY[0]!;
    let batch = batches.find((b) => b.batchNumber === res.batchNumber);
    if (!batch) {
      batch = {
        id: `batch-${res.batchNumber}`,
        tenantId: 'tenant-default',
        partnerId: 'partner-default',
        organizationId: 'org-default',
        branchId: 'branch-default',
        medicationId: med.id,
        medicationCode: med.medicationCode,
        medicationName: med.brandName,
        batchNumber: res.batchNumber,
        manufacturer: med.manufacturer || 'Pharma Co',
        manufacturingDate: '2024-01-01',
        expiryDate: res.expiryDate,
        receivedQuantity: 500,
        availableQuantity: 500,
        reservedQuantity: 0,
        daysToExpiry: 365,
        unitCost: String(med.unitPrice),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const rate = res.isLoose ? med.unitPrice : med.mrp;
    const existingIdx = cart.findIndex((c) => c.medication.id === med.id && c.isLoose === res.isLoose);

    if (existingIdx >= 0) {
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIdx
            ? {
                ...item,
                quantity: res.detectedCount,
                selectedBatch: batch!,
                rate
              }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: `cart-smart-${Date.now()}`,
          medication: med,
          selectedBatch: batch!,
          isLoose: res.isLoose,
          quantity: res.detectedCount,
          rate,
          isSubstituted: false
        }
      ]);
    }

    setNotification({
      type: 'success',
      message: `✓ Computer Vision Counted ${res.detectedCount} ${res.isLoose ? 'Loose Tabs' : 'Strip'} for ${med.brandName} (Batch: ${res.batchNumber}) with Zero Human Error!`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);

  // Auto focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Update high-performance client search index when shelf batches or master catalog change
  useEffect(() => {
    fastPharmacySearchIndex.updateContext(batches, catalog);
  }, [batches, catalog]);

  // Unified Fullscreen Toggle (manages both browser HTML5 fullscreen and fullpage overlay)
  const handleToggleFullscreen = async () => {
    try {
      if (!isBrowserFullscreen && !isFullPage) {
        setIsFullPage(true);
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullPage(false);
      }
    } catch {
      setIsFullPage((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsBrowserFullscreen(isFs);
      if (isFs) {
        setIsFullPage(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Helper to parse trailing loose quantity shortcuts:
  // e.g. "DOLO 650 4/10", "PCM 650 4/15", "AUG 625 3/6", "PCM 650 1/2", "DOLO 650 0.4", "DOLO 650 .4", "AUG 625 3T", "PAN 40 5 goli", "DOLO 650/2"
  const parsedSearchShorthand = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return {
        cleanTerm: '',
        looseQty: null as number | null,
        fractionNum: null as number | null,
        fractionDen: null as number | null,
        decimalFraction: null as number | null,
        isFraction: false,
        rawShorthand: null as string | null
      };
    }

    // 1. Explicit Blister Pack Fraction: e.g. "DOLO 650 4/10", "PCM 650 4/15", "AUG 625 3/6", "PCM 650 1/2"
    const fracMatch = trimmed.match(/(?:^|\s+)(\d+)\s*\/\s*(\d+)$/);
    if (fracMatch) {
      const num = parseInt(fracMatch[1]!, 10);
      const den = parseInt(fracMatch[2]!, 10);
      if (!isNaN(num) && !isNaN(den) && den > 0 && num > 0) {
        const clean = trimmed.replace(/(?:^|\s+)(\d+)\s*\/\s*(\d+)$/, '').trim();
        return {
          cleanTerm: clean,
          looseQty: num <= den ? num : Math.round((num / den) * 10),
          fractionNum: num,
          fractionDen: den,
          decimalFraction: null,
          isFraction: true,
          rawShorthand: `${num}/${den}`
        };
      }
    }

    // 2. Decimal Fraction: e.g. "DOLO 650 0.4", "DOLO 650 .4"
    const decMatch = trimmed.match(/(?:^|\s+)(0?\.\d+)$/);
    if (decMatch) {
      const dec = parseFloat(decMatch[1]!);
      if (!isNaN(dec) && dec > 0 && dec < 1) {
        const clean = trimmed.replace(/(?:^|\s+)(0?\.\d+)$/, '').trim();
        return {
          cleanTerm: clean,
          looseQty: Math.max(1, Math.round(dec * 10)),
          fractionNum: null,
          fractionDen: null,
          decimalFraction: dec,
          isFraction: true,
          rawShorthand: `${dec}`
        };
      }
    }

    // 3. Trailing Loose Tablet Shortcut: e.g. "AUG 625 3T", "PAN 40 4 goli", "PCM 650 4 tabs", "CALPOL 2L"
    const tabMatch = trimmed.match(/(?:^|\s+)(\d+)\s*(?:[tTlL]|tabs?|goli)$/i);
    if (tabMatch) {
      const qty = parseInt(tabMatch[1]!, 10);
      if (!isNaN(qty) && qty > 0) {
        const clean = trimmed.replace(/(?:^|\s+)(\d+)\s*(?:[tTlL]|tabs?|goli)$/i, '').trim();
        return {
          cleanTerm: clean,
          looseQty: qty,
          fractionNum: null,
          fractionDen: null,
          decimalFraction: null,
          isFraction: true,
          rawShorthand: `${qty}t`
        };
      }
    }

    // 4. Trailing Slash or Asterisk Loose Count: e.g. "DOLO 650/4", "DOLO 650 / 4", "PCM 650*4"
    const slashMatch = trimmed.match(/(?:\s*[/|*]\s*(\d+))$/);
    if (slashMatch) {
      const qty = parseInt(slashMatch[1]!, 10);
      if (!isNaN(qty) && qty > 0) {
        const clean = trimmed.replace(/(?:\s*[/|*]\s*(\d+))$/, '').trim();
        return {
          cleanTerm: clean,
          looseQty: qty,
          fractionNum: null,
          fractionDen: null,
          decimalFraction: null,
          isFraction: true,
          rawShorthand: `/${qty}`
        };
      }
    }

    const interimClean = trimmed.replace(/[/|*]$/, '').trim();
    return {
      cleanTerm: interimClean || trimmed,
      looseQty: null,
      fractionNum: null,
      fractionDen: null,
      decimalFraction: null,
      isFraction: false,
      rawShorthand: null
    };
  }, [searchQuery]);

  // Sub-2ms Client-Side Fuzzy & Acronym Search Index (PCM 650, DOLO, AUG 625, PAN 40, etc.)
  const searchResults = useMemo(() => {
    if (!parsedSearchShorthand.cleanTerm) return [];
    return fastPharmacySearchIndex.search(parsedSearchShorthand.cleanTerm, 12);
  }, [parsedSearchShorthand.cleanTerm]);

  // Find best FEFO batch for a medication (prioritizing non-blocked, non-expired, available stock)
  const getFefoBatch = (medId: string): PharmacyBatchDto => {
    const medCodeClean = medId.replace('med-in-', '').toUpperCase();
    const matchingValid = batches.filter(
      (b) =>
        (b.medicationId === medId || b.id === medId || b.medicationCode?.toUpperCase().includes(medCodeClean) || b.medicationName?.toLowerCase().includes(medId.toLowerCase())) &&
        b.status !== 'BLOCKED' &&
        b.status !== 'EXPIRED' &&
        b.availableQuantity > 0
    );
    if (matchingValid.length > 0) {
      // Sort by days to expiry asc (FEFO)
      return matchingValid.sort((a, b) => (a.daysToExpiry ?? 999) - (b.daysToExpiry ?? 999))[0]!;
    }

    // Secondary: any matching batch that is NOT BLOCKED or EXPIRED even if low or zero stock
    const matchingAnyActive = batches.filter(
      (b) =>
        (b.medicationId === medId || b.id === medId || b.medicationCode?.toUpperCase().includes(medCodeClean) || b.medicationName?.toLowerCase().includes(medId.toLowerCase())) &&
        b.status !== 'BLOCKED' &&
        b.status !== 'EXPIRED'
    );
    if (matchingAnyActive.length > 0) {
      return matchingAnyActive.sort((a, b) => (a.daysToExpiry ?? 999) - (b.daysToExpiry ?? 999))[0]!;
    }

    // Tertiary: any batch matching that isn't blocked
    const matchingNonBlocked = batches.filter(
      (b) =>
        (b.medicationId === medId || b.id === medId || b.medicationCode?.toUpperCase().includes(medCodeClean) || b.medicationName?.toLowerCase().includes(medId.toLowerCase())) &&
        b.status !== 'BLOCKED'
    );
    if (matchingNonBlocked.length > 0) {
      return matchingNonBlocked.sort((a, b) => (a.daysToExpiry ?? 999) - (b.daysToExpiry ?? 999))[0]!;
    }

    // Fallback batch
    const now = new Date();
    const medInfo = INDIAN_PHARMACY_FORMULARY.find((m) => m.id === medId);
    return {
      id: `batch-auto-${medId}-${Date.now()}`,
      tenantId: batches[0]?.tenantId || currentUser?.tenantId || 'tenant-default',
      partnerId: batches[0]?.partnerId || 'partner-default',
      organizationId: batches[0]?.organizationId || 'org-default',
      branchId: batches[0]?.branchId || 'branch-default',
      medicationId: medId,
      medicationCode: medInfo?.medicationCode || 'MED-AUTO',
      medicationName: medInfo?.brandName || 'Standard Stock',
      batchNumber: `BTH-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      manufacturer: medInfo?.manufacturer || 'Authorized Manufacturer',
      manufacturingDate: `${now.getFullYear()}-01-01`,
      expiryDate: `${now.getFullYear() + 2}-12-31`,
      receivedQuantity: 100,
      availableQuantity: 100,
      reservedQuantity: 0,
      unitCost: String(medInfo?.costPrice || 15.0),
      status: 'ACTIVE',
      daysToExpiry: 700,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  };

  // Add Item to Cart (Supports Full Strip or Loose Tablets from keyboard shorthand like PCM 650 4/15 or DOLO 650 4/10)
  const handleAddToCart = (
    med: IndianMedicationFormularyItem,
    explicitQty?: number,
    explicitLoose?: boolean
  ) => {
    // Automatic CDSCO Mandate: Check if Schedule H, H1, or X
    const detectedSched = cdscoInspectionAuditService.detectScheduleType(med);
    if (
      (detectedSched === 'SCHEDULE_H1' || detectedSched === 'SCHEDULE_X' || detectedSched === 'SCHEDULE_H') &&
      (!doctorName.trim() || !doctorNmcReg.trim())
    ) {
      setPrescriberTriggerDrug(med.brandName);
      setPrescriberTriggerSchedule(detectedSched);
      setIsPrescriberPromptOpen(true);
    }

    const batch = getFefoBatch(med.id);
    const isLooseItem = explicitLoose ?? (parsedSearchShorthand.looseQty !== null || parsedSearchShorthand.isFraction);
    const packUnits = med.packUnits || 10;
    const unitRate = med.unitPrice || Math.round((med.mrp / packUnits) * 100) / 100;

    let addQty = 1;
    if (explicitQty !== undefined) {
      addQty = explicitQty;
    } else if (parsedSearchShorthand.fractionNum && parsedSearchShorthand.fractionDen) {
      if (parsedSearchShorthand.fractionDen === packUnits) {
        addQty = parsedSearchShorthand.fractionNum;
      } else {
        addQty = Math.max(1, Math.round((parsedSearchShorthand.fractionNum / parsedSearchShorthand.fractionDen) * packUnits));
      }
    } else if (parsedSearchShorthand.decimalFraction) {
      addQty = Math.max(1, Math.round(parsedSearchShorthand.decimalFraction * packUnits));
    } else if (parsedSearchShorthand.looseQty) {
      addQty = parsedSearchShorthand.looseQty;
    }

    const rateToUse = isLooseItem ? unitRate : med.mrp;

    const existingIndex = cart.findIndex(
      (c) => c.medication.id === med.id && c.selectedBatch.batchNumber === batch.batchNumber && c.isLoose === isLooseItem
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex]!.quantity += addQty;
      setCart(updated);
      setActiveCartItemId(updated[existingIndex]!.id);
    } else {
      const newCartId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      setCart([
        ...cart,
        {
          id: newCartId,
          medication: med,
          selectedBatch: batch,
          isLoose: isLooseItem,
          quantity: addQty,
          rate: rateToUse,
          isSubstituted: false
        }
      ]);
      setActiveCartItemId(newCartId);
    }

    if (isLooseItem) {
      setNotification({
        type: 'success',
        message: `⚡ Loose Fraction Calculator: Added ${addQty} Tabs of ${med.brandName} @ ₹${unitRate.toFixed(2)}/tab (Total ₹${(unitRate * addQty).toFixed(2)})`
      });
      setTimeout(() => setNotification(null), 3000);
    }

    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Hardware Barcode & 2D DataMatrix Scanner Listener (DS-HW-902)
  const handleBarcodeScan = useCallback(
    (scan: ScannedBarcodePayload) => {
      const cleanRaw = scan.raw.trim().toLowerCase();
      const gtinTrim = scan.gtin ? scan.gtin.replace(/^0+/, '') : '';

      let matchedMed: IndianMedicationFormularyItem | undefined = undefined;

      // 1. Match against master formulary
      matchedMed = INDIAN_PHARMACY_FORMULARY.find((m) => {
        if (scan.gtin && (m.barcode.includes(scan.gtin) || (gtinTrim && m.barcode.includes(gtinTrim)))) return true;
        if (m.barcode.toLowerCase() === cleanRaw) return true;
        if (m.medicationCode.toLowerCase() === cleanRaw) return true;
        return false;
      });

      // 2. Match against dynamic live catalog
      if (!matchedMed && catalog && catalog.length > 0) {
        const catMatch = catalog.find((c) => {
          if (scan.gtin && (c.medicationCode.includes(scan.gtin) || (gtinTrim && c.medicationCode.includes(gtinTrim)))) return true;
          if (c.medicationCode.toLowerCase() === cleanRaw) return true;
          return false;
        });
        if (catMatch) {
          matchedMed = {
            id: catMatch.id,
            medicationCode: catMatch.medicationCode,
            genericName: catMatch.genericName,
            brandName: catMatch.brandName,
            strength: catMatch.strength || 'Standard',
            dosageForm: (catMatch.dosageForm as any) || 'TABLET',
            packConfiguration: `${catMatch.packSize || 10} Units`,
            packUnits: catMatch.packSize || 10,
            unitOfMeasure: catMatch.unitOfMeasure || 'PACK',
            manufacturer: catMatch.manufacturer || 'Standard Manufacturer',
            mrp: 120,
            costPrice: 85,
            unitPrice: 12,
            gstRate: 12,
            hsnCode: '30049099',
            category: (catMatch.category as any) || 'GENERAL',
            scheduleType: catMatch.controlledMedication ? 'SCHEDULE_H' : 'OTC',
            barcode: catMatch.medicationCode,
            brandType: 'ETHICAL'
          };
        }
      }

      // 3. Match against inventory batches
      let matchedBatch: PharmacyBatchDto | undefined = undefined;
      if (scan.batchNumber) {
        matchedBatch = batches.find(
          (b) => b.batchNumber.toLowerCase() === scan.batchNumber!.toLowerCase() && b.status !== 'BLOCKED'
        );
      }

      if (!matchedMed && !matchedBatch) {
        matchedBatch = batches.find(
          (b) => b.batchNumber.toLowerCase() === cleanRaw && b.status !== 'BLOCKED'
        );
      }

      if (!matchedMed && matchedBatch) {
        const bBrand = matchedBatch.medicationName.split('(')[0]?.trim() || matchedBatch.medicationName;
        const bGen = matchedBatch.medicationName.includes('(') ? matchedBatch.medicationName.split('(')[1]?.replace(')', '').trim() : '';
        matchedMed = INDIAN_PHARMACY_FORMULARY.find(
          (m) => m.brandName.toLowerCase().includes(bBrand.toLowerCase()) || (bGen && m.genericName.toLowerCase().includes(bGen.toLowerCase()))
        ) || {
          id: matchedBatch.medicationId || `med-scanned-${matchedBatch.id}`,
          medicationCode: matchedBatch.medicationCode || `MED-${matchedBatch.batchNumber}`,
          brandName: bBrand,
          genericName: bGen || matchedBatch.medicationName,
          strength: 'Standard',
          dosageForm: 'TABLET',
          packConfiguration: 'Pack of 10',
          packUnits: 10,
          unitOfMeasure: 'PACK',
          manufacturer: matchedBatch.manufacturer || 'Pharma Stockist',
          mrp: Math.round(parseFloat(matchedBatch.unitCost || '15') * 1.5 * 100) / 100,
          costPrice: parseFloat(matchedBatch.unitCost || '15'),
          unitPrice: Math.round((parseFloat(matchedBatch.unitCost || '15') * 1.5 / 10) * 100) / 100,
          gstRate: 12,
          hsnCode: '30049060',
          category: 'GENERAL',
          scheduleType: 'OTC',
          barcode: matchedBatch.batchNumber,
          brandType: 'ETHICAL'
        };
      }

      if (!matchedMed) {
        playAudioFeedback('thud');
        setNotification({
          type: 'warning',
          message: `Hardware scanner detected: [${scan.raw}] (${scan.symbology}), but no matching drug was found in catalog.`
        });
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      // 4. Auto-select FEFO batch or specific GS1 batch
      const targetBatch: PharmacyBatchDto = matchedBatch || (scan.batchNumber ? {
        id: `batch-${scan.batchNumber}`,
        tenantId: 'tenant-default',
        partnerId: 'partner-default',
        organizationId: 'org-default',
        branchId: 'branch-default',
        medicationId: matchedMed.id,
        medicationCode: matchedMed.medicationCode,
        medicationName: matchedMed.brandName,
        batchNumber: scan.batchNumber,
        manufacturer: matchedMed.manufacturer,
        manufacturingDate: '2024-01-01',
        expiryDate: scan.expiryDate || '2027-12-31',
        receivedQuantity: 500,
        availableQuantity: 500,
        reservedQuantity: 0,
        daysToExpiry: 365,
        unitCost: String(matchedMed.unitPrice),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : getFefoBatch(matchedMed.id));

      // 5. Automatic CDSCO Mandate for scanned item
      const detectedSched = cdscoInspectionAuditService.detectScheduleType(matchedMed);
      if (
        (detectedSched === 'SCHEDULE_H1' || detectedSched === 'SCHEDULE_X' || detectedSched === 'SCHEDULE_H') &&
        (!doctorName.trim() || !doctorNmcReg.trim())
      ) {
        setPrescriberTriggerDrug(matchedMed.brandName);
        setPrescriberTriggerSchedule(detectedSched);
        setIsPrescriberPromptOpen(true);
      }

      // 6. Add to POS cart or increment quantity
      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (c) => c.medication.id === matchedMed!.id && c.selectedBatch.batchNumber === targetBatch.batchNumber
        );
        if (existingIdx >= 0) {
          return prev.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [
          ...prev,
          {
            id: `cart-scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            medication: matchedMed!,
            selectedBatch: targetBatch,
            isLoose: false,
            quantity: 1,
            rate: matchedMed!.mrp,
            isSubstituted: false
          }
        ];
      });
      playAudioFeedback('chime');

      setNotification({
        type: 'success',
        message: `⚡ Hardware Scanned: ${matchedMed.brandName} (Batch: ${targetBatch.batchNumber}) added to POS cart!`
      });
      setTimeout(() => setNotification(null), 4000);

      // Clear search query if scanner typed into search field
      setSearchQuery('');
    },
    [batches, catalog, getFefoBatch]
  );

  useHardwareBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: true
  });

  // Listen for Universal Command Palette "Paracet" dispensing & Keyboard Hotkeys (Alt+P, Ctrl+Enter)
  useEffect(() => {
    const handleAddPosItem = (e: Event) => {
      const custom = e as CustomEvent<any>;
      const d = custom.detail;
      if (!d) return;

      const searchName = (d.name || d.brandName || 'Paracetamol').toLowerCase();
      const matchedMed =
        INDIAN_PHARMACY_FORMULARY.find((m) =>
          m.brandName.toLowerCase().includes(searchName) ||
          m.genericName.toLowerCase().includes(searchName)
        ) || INDIAN_PHARMACY_FORMULARY[0]!;

      const targetBatch = getFefoBatch(matchedMed.id);

      setCart((prev) => {
        const existingIdx = prev.findIndex((c) => c.medication.id === matchedMed.id);
        if (existingIdx >= 0) {
          return prev.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + (d.quantity || 1) } : item
          );
        }
        return [
          ...prev,
          {
            id: `cart-cmd-${Date.now()}`,
            medication: matchedMed,
            selectedBatch: targetBatch,
            isLoose: false,
            quantity: d.quantity || 1,
            rate: d.price || matchedMed.mrp,
            isSubstituted: false
          }
        ];
      });

      window.dispatchEvent(
        new CustomEvent('docsearch:optimistic_action', {
          detail: {
            actionName: `POS: Added ${matchedMed.brandName}`,
            entity: 'Pharmacy POS'
          }
        })
      );

      setNotification({
        type: 'success',
        message: `💊 Dispensed & Added to POS Cart: ${matchedMed.brandName} (${targetBatch.batchNumber})!`
      });
      setTimeout(() => setNotification(null), 3500);
    };

    const handleInstantPrint = () => {
      if (cart.length > 0) {
        setIsInvoiceModalOpen(true);
      }
    };

    const handleQuickCommit = () => {
      if (cart.length > 0) {
        void handleCompleteSale();
      }
    };

    window.addEventListener('docsearch:add_pos_item', handleAddPosItem);
    window.addEventListener('docsearch:instant_print', handleInstantPrint);
    window.addEventListener('docsearch:quick_commit', handleQuickCommit);

    return () => {
      window.removeEventListener('docsearch:add_pos_item', handleAddPosItem);
      window.removeEventListener('docsearch:instant_print', handleInstantPrint);
      window.removeEventListener('docsearch:quick_commit', handleQuickCommit);
    };
  }, [cart, getFefoBatch]);

  // Switch to Jan Aushadhi generic equivalent
  const handleSwitchToJanAushadhi = (cartItemId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId && item.medication.janAushadhiEquivalent) {
          const ja = item.medication.janAushadhiEquivalent;
          const newRate = item.isLoose ? ja.unitPrice : ja.mrp;
          return {
            ...item,
            isSubstituted: true,
            rate: newRate
          };
        }
        return item;
      })
    );
    setNotification({
      type: 'success',
      message: 'Swapped to PMBJP Jan Aushadhi Generic formulation. Significant cost saved!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Set Pack Mode: Full Strip vs Loose Tablets (with instant autofocus on quantity input)
  const handleSetPackMode = (cartItemId: string, toLoose: boolean) => {
    setQtyInputMap((prev) => {
      const next = { ...prev };
      delete next[cartItemId];
      return next;
    });

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          if (item.isLoose === toLoose) return item;
          const packUnits = item.medication.packUnits || 10;
          const unitRate = item.isSubstituted && item.medication.janAushadhiEquivalent
            ? item.medication.janAushadhiEquivalent.unitPrice
            : (item.medication.unitPrice || Math.round((item.medication.mrp / packUnits) * 100) / 100);
          const stripRate = item.isSubstituted && item.medication.janAushadhiEquivalent
            ? item.medication.janAushadhiEquivalent.mrp
            : item.medication.mrp;

          return {
            ...item,
            isLoose: toLoose,
            rate: toLoose ? unitRate : stripRate,
            quantity: 1 // Default to 1 unit, ready for keyboard typing!
          };
        }
        return item;
      })
    );

    // Auto-focus and highlight the quantity input so chemist can type directly on their keyboard!
    setTimeout(() => {
      const qtyEl = document.getElementById(`qty-input-${cartItemId}`) as HTMLInputElement | null;
      if (qtyEl) {
        qtyEl.focus();
        qtyEl.select();
      }
    }, 50);
  };

  // Instant Blister Cut Studio Quantity Setter: switches to loose tablets if < packUnits, or full strip if >= packUnits
  const handleSetFractionQty = (cartItemId: string, tabs: number) => {
    setQtyInputMap((prev) => {
      const next = { ...prev };
      delete next[cartItemId];
      return next;
    });

    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;
        const packUnits = item.medication.packUnits || 10;
        const unitRate = item.isSubstituted && item.medication.janAushadhiEquivalent
          ? item.medication.janAushadhiEquivalent.unitPrice
          : (item.medication.unitPrice || Math.round((item.medication.mrp / packUnits) * 100) / 100);
        const stripRate = item.isSubstituted && item.medication.janAushadhiEquivalent
          ? item.medication.janAushadhiEquivalent.mrp
          : item.medication.mrp;

        if (tabs >= packUnits) {
          // Full strip mode
          return {
            ...item,
            isLoose: false,
            rate: stripRate,
            quantity: Math.max(1, Math.floor(tabs / packUnits))
          };
        }

        // Fractional loose cut mode
        return {
          ...item,
          isLoose: true,
          rate: unitRate,
          quantity: Math.max(1, tabs)
        };
      })
    );
  };

  const handleUpdateQty = (cartItemId: string, newQty: number) => {
    setQtyInputMap((prev) => {
      const next = { ...prev };
      delete next[cartItemId];
      return next;
    });

    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== cartItemId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === cartItemId ? { ...i, quantity: newQty } : i))
      );
    }
  };

  // Smart Quantity Input Parser: supports fractions ("4/10", "1/2"), decimals (".4", "0.4"), trailing loose units ("4t", "4 goli"), and integers
  const handleSmartQtyChange = (cartItemId: string, rawInput: string) => {
    setQtyInputMap((prev) => ({ ...prev, [cartItemId]: rawInput }));
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;

        const packUnits = item.medication.packUnits || 10;
        const unitRate = item.isSubstituted && item.medication.janAushadhiEquivalent
          ? item.medication.janAushadhiEquivalent.unitPrice
          : (item.medication.unitPrice || Math.round((item.medication.mrp / packUnits) * 100) / 100);

        // Pattern 1: Fraction like "4/10", "1/2", "3/15", "6/10"
        if (trimmed.includes('/')) {
          const parts = trimmed.split('/');
          const num = parseFloat(parts[0] || '0');
          const den = parseFloat(parts[1] || '0');
          if (!isNaN(num) && !isNaN(den) && den > 0 && num > 0) {
            const tabs = Math.max(1, Math.round((num / den) * packUnits));
            return {
              ...item,
              isLoose: true,
              rate: unitRate,
              quantity: tabs
            };
          }
        }

        // Pattern 2: Decimal like ".4" or "0.4"
        if (trimmed.startsWith('.') || (trimmed.includes('.') && parseFloat(trimmed) < 1 && parseFloat(trimmed) > 0)) {
          const dec = parseFloat(trimmed);
          if (!isNaN(dec) && dec > 0) {
            const tabs = Math.max(1, Math.round(dec * packUnits));
            return {
              ...item,
              isLoose: true,
              rate: unitRate,
              quantity: tabs
            };
          }
        }

        // Pattern 3: Trailing t / tabs / goli like "4t", "4 tabs", "4 goli"
        const trailingTabMatch = trimmed.match(/^(\d+)\s*(?:[tTlL]|tabs?|goli)$/i);
        if (trailingTabMatch) {
          const tabs = parseInt(trailingTabMatch[1]!, 10);
          if (!isNaN(tabs) && tabs > 0) {
            return {
              ...item,
              isLoose: true,
              rate: unitRate,
              quantity: tabs
            };
          }
        }

        // Pattern 4: Standard integer number
        const val = parseInt(trimmed, 10);
        if (!isNaN(val) && val > 0) {
          return {
            ...item,
            quantity: val
          };
        }

        return item;
      })
    );
  };

  // 1-Click Load Hospital E-Prescription
  const handleLoadPrescription = (rxId: string) => {
    setSelectedRxId(rxId);
    const rx = prescriptions.find((p) => p.id === rxId);
    if (!rx) return;

    setPatientName(rx.patientName || 'Hospital Inpatient');
    setPatientPhone(rx.patientMrn || '');
    setDoctorName(rx.prescribingDoctorName || partnerProfile.doctorName || '');
    setDoctorNmcReg(partnerProfile.doctorRegNo || '');

    // Auto-map prescription items to Indian formulary
    const mappedItems: CartItem[] = [];
    for (const rxItem of rx.items) {
      const match = INDIAN_PHARMACY_FORMULARY.find(
        (m) =>
          m.brandName.toLowerCase().includes(rxItem.medicationName.toLowerCase()) ||
          m.genericName.toLowerCase().includes(rxItem.medicationName.toLowerCase())
      ) || INDIAN_PHARMACY_FORMULARY[0]!;

      const batch = getFefoBatch(match.id);
      mappedItems.push({
        id: `cart-rx-${rxItem.id}`,
        medication: match,
        selectedBatch: batch,
        isLoose: false,
        quantity: Math.max(1, Math.ceil(rxItem.prescribedQuantity / (match.packUnits || 10))),
        rate: match.mrp,
        isSubstituted: false
      });
    }

    setCart(mappedItems);
    setNotification({
      type: 'success',
      message: `Loaded prescription ${rx.prescriptionNumber} for ${rx.patientName} (${mappedItems.length} items).`
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Auto-load prescription handoff from Dispensing Workbench
  useEffect(() => {
    if (initialPrescriptionId) {
      setBillingMode('HOSPITAL_RX');
      handleLoadPrescription(initialPrescriptionId);
      onClearInitialPrescriptionId?.();
    }
  }, [initialPrescriptionId]);

  // Check if any Schedule H/H1/X controlled medicine is in cart
  const containsControlledSchedule = useMemo(() => {
    return cart.some((c) => {
      const s = cdscoInspectionAuditService.detectScheduleType(c.medication);
      return s === 'SCHEDULE_H1' || s === 'SCHEDULE_X' || s === 'SCHEDULE_H';
    });
  }, [cart]);

  const containsScheduleH = useMemo(() => {
    return cart.some(
      (c) => cdscoInspectionAuditService.detectScheduleType(c.medication) === 'SCHEDULE_H'
    );
  }, [cart]);

  const containsScheduleH1 = useMemo(() => {
    return cart.some(
      (c) => cdscoInspectionAuditService.detectScheduleType(c.medication) === 'SCHEDULE_H1'
    );
  }, [cart]);

  const containsScheduleX = useMemo(() => {
    return cart.some(
      (c) => cdscoInspectionAuditService.detectScheduleType(c.medication) === 'SCHEDULE_X'
    );
  }, [cart]);

  // Tax and Financial Calculations (Indian Pharma GST - MRP Inclusive)
  const calculations = useMemo(() => {
    let subtotal = 0;
    for (const item of cart) {
      subtotal += item.rate * item.quantity;
    }
    const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
    const grandTotal = Math.round((subtotal - discountAmount) * 100) / 100;
    // Reverse calculate Taxable Base & GST (Standard Indian Pharma GST: 12% inclusive)
    const taxableAmount = Math.round((grandTotal / 1.12) * 100) / 100;
    const totalGst = Math.round((grandTotal - taxableAmount) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = Math.round((totalGst - cgst) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      grandTotal
    };
  }, [cart, discountPercent]);

  // Clinical Safety & DDI Conflict Shield
  const clinicalAdvisories = useMemo(() => {
    const alerts: Array<{ id: string; type: 'DDI' | 'DUPLICATE_THERAPY'; title: string; message: string }> = [];

    // Duplicate Therapy Check
    const categoryCounts: Record<string, number> = {};
    for (const it of cart) {
      categoryCounts[it.medication.category] = (categoryCounts[it.medication.category] || 0) + 1;
    }

    if ((categoryCounts['ANALGESIC'] || 0) > 1) {
      alerts.push({
        id: 'dup-analgesic',
        type: 'DUPLICATE_THERAPY',
        title: '⚠️ Duplicate Analgesic / NSAID Therapy',
        message: 'Multiple painkillers/NSAIDs in cart. Confirm cumulative Paracetamol dose <4g/day to prevent hepatotoxicity.'
      });
    }

    if ((categoryCounts['ANTIBIOTIC'] || 0) > 1) {
      alerts.push({
        id: 'dup-antibiotic',
        type: 'DUPLICATE_THERAPY',
        title: '⚠️ Dual Antibiotic Regimen',
        message: 'Multiple systemic antimicrobials detected. Verify doctor-prescribed dual coverage indication.'
      });
    }

    // Drug Interaction Pairs
    const hasAntibiotic = cart.some((c) => c.medication.category === 'ANTIBIOTIC');
    const hasAntacid = cart.some((c) => c.medication.category === 'GASTROINTESTINAL');
    if (hasAntibiotic && hasAntacid) {
      alerts.push({
        id: 'ddi-antacid-abx',
        type: 'DDI',
        title: '⚡ Drug Absorption Interaction (Antibiotic + PPI/Antacid)',
        message: 'Antacids/PPIs reduce absorption of fluoroquinolones and cephalosporins. Advise patient to separate by at least 2 hours.'
      });
    }

    const hasCardio = cart.some((c) => c.medication.category === 'CARDIOVASCULAR');
    const hasNsaid = cart.some((c) => c.medication.category === 'ANALGESIC');
    if (hasCardio && hasNsaid) {
      alerts.push({
        id: 'ddi-cvd-nsaid',
        type: 'DDI',
        title: '⚡ Antihypertensive Attenuation Warning',
        message: 'Co-administration of NSAIDs with Telmisartan/Amlodipine may attenuate antihypertensive efficacy and elevate renal stress.'
      });
    }

    return alerts;
  }, [cart]);

  // Cash change calculator
  const changeToReturn = useMemo(() => {
    const paid = parseFloat(cashReceived);
    if (isNaN(paid) || paid < calculations.grandTotal) return 0;
    return Math.round((paid - calculations.grandTotal) * 100) / 100;
  }, [cashReceived, calculations.grandTotal]);

  // Complete Sale & Trigger Invoicing
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      playAudioFeedback('thud');
      setNotification({ type: 'warning', message: 'Cart is empty. Please add medicines before checkout.' });
      return;
    }

    // Statutory Profile Guard: Prevent sale & billing dispatch if partner profile is incomplete
    const guardStatus = checkPartnerProfileStatus(currentUser?.email);
    if (!guardStatus.isUpdated) {
      playAudioFeedback('thud');
      setProfileMissingFields(guardStatus.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }

    if (patientPhone && (patientPhone.trim().length !== 10 || !/^[6-9]/.test(patientPhone.trim()))) {
      playAudioFeedback('thud');
      setNotification({
        type: 'error',
        message: 'Kripya valid 10-digit Indian mobile number enter karein (starts with 6, 7, 8, or 9).'
      });
      return;
    }

    if (containsControlledSchedule && (!doctorName.trim() || !doctorNmcReg.trim())) {
      const firstControlled = cart.find((c) => {
        const s = cdscoInspectionAuditService.detectScheduleType(c.medication);
        return s === 'SCHEDULE_H1' || s === 'SCHEDULE_X' || s === 'SCHEDULE_H';
      });
      setPrescriberTriggerDrug(firstControlled?.medication.brandName || 'Controlled Medicine');
      setPrescriberTriggerSchedule(firstControlled ? cdscoInspectionAuditService.detectScheduleType(firstControlled.medication) : 'SCHEDULE_H1');
      setIsPrescriberPromptOpen(true);
      setNotification({
        type: 'error',
        message: 'Statutory Compliance Alert: Schedule H, H1 & X medicines require Prescribing Doctor Name & NMC Reg #'
      });
      return;
    }

    // Validate Khata Account if paymentMode is CREDIT_KHATA
    if (paymentMode === 'CREDIT_KHATA') {
      const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10);
      if (!cleanPhone) {
        setNotification({
          type: 'error',
          message: 'Khata Alert: Customer 10-digit mobile number is mandatory for Credit / Udhaar billing!'
        });
        return;
      }

      const khataAcc = pharmacyCreditKhataService.getAccountByPhone(cleanPhone);
      const currentDue = khataAcc?.currentBalance || 0;
      const limit = khataAcc?.creditLimit || 5000;
      const projectedTotal = currentDue + calculations.grandTotal;

      if (limit > 0 && projectedTotal > limit && !khataOverrideApproved) {
        setNotification({
          type: 'error',
          message: `Credit Limit Exceeded: Bill will bring due to ₹${projectedTotal.toFixed(2)}, exceeding limit of ₹${limit.toFixed(2)}. Check 'Chemist Authorization' to approve extension.`
        });
        return;
      }
    }

    setIsSubmitting(true);
    const isCurrentlyOffline = isOfflineMode || pharmacyOfflineStorageService.isOffline();
    const invoiceNum = isCurrentlyOffline
      ? `OFF-INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      : `INV-PHARM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    let isOfflineFallback = isCurrentlyOffline;

    try {
      if (!isCurrentlyOffline) {
        try {
          // 1. Submit through backend dispensing service
          await onDispenseSubmit({
            patientName,
            patientPhone,
            doctorName: doctorName || undefined,
            doctorNmcReg: doctorNmcReg || undefined,
            prescriptionId: billingMode === 'HOSPITAL_RX' ? selectedRxId : undefined,
            items: cart.map((c) => ({
              medicationId: c.medication.id,
              batchId: c.selectedBatch.id,
              quantity: c.quantity,
              unitPrice: c.rate,
              dosageInstructions: c.isLoose ? 'Loose Tablets' : 'Full Strip Pack',
              isLoose: c.isLoose,
              packUnits: c.medication.packUnits || 10
            }))
          });
        } catch (networkErr) {
          console.warn('[POS Counter] Network drop during dispense submit. Falling back to local offline IndexedDB billing.', networkErr);
          isOfflineFallback = true;
        }
      }

      // 2. Prepare Formatted Invoice Slip
      const invoiceItems: PharmacyInvoiceItem[] = cart.map((c) => ({
        medicationName: c.isSubstituted && c.medication.janAushadhiEquivalent
          ? c.medication.janAushadhiEquivalent.genericTitle
          : c.medication.brandName,
        genericName: c.medication.genericName,
        batchNumber: c.selectedBatch.batchNumber,
        expiryDate: c.selectedBatch.expiryDate,
        quantity: c.quantity,
        unit: c.isLoose ? 'Tabs' : 'Strip',
        mrp: c.isSubstituted && c.medication.janAushadhiEquivalent ? c.medication.janAushadhiEquivalent.mrp : c.medication.mrp,
        rate: c.rate,
        gstRate: c.medication.gstRate,
        hsnCode: c.medication.hsnCode,
        isSubstituted: c.isSubstituted,
        total: Math.round(c.rate * c.quantity * 100) / 100
      }));

      const invoice: PharmacyInvoiceData = {
        invoiceNumber: invoiceNum,
        invoiceDate: nowStr,
        tenantName: partnerProfile.entityLegalName || currentUser?.tenantName || 'DocSearch Pharmacy & Chemist',
        drugLicenseNo: partnerProfile.pharmacyDrugLicense20B ? `DL: ${partnerProfile.pharmacyDrugLicense20B}${partnerProfile.pharmacyDrugLicense21B ? ' / ' + partnerProfile.pharmacyDrugLicense21B : ''}` : 'FORM 20B/21B',
        gstin: partnerProfile.gstin || 'GST NOT REGISTERED',
        pharmacistName: partnerProfile.pharmacistName || currentUser?.name || 'Registered Pharmacist',
        pharmacistRegNo: partnerProfile.pharmacistRegNo ? `Reg # ${partnerProfile.pharmacistRegNo}` : 'Reg # Pending',
        patientName,
        patientPhone,
        doctorName: doctorName || undefined,
        doctorNmcReg: doctorNmcReg || undefined,
        paymentMode,
        items: invoiceItems,
        subtotal: calculations.subtotal,
        discountPercent: discountPercent,
        discountAmount: calculations.discountAmount,
        taxableAmount: calculations.taxableAmount,
        cgstAmount: calculations.cgst,
        sgstAmount: calculations.sgst,
        grandTotal: calculations.grandTotal,
        containsScheduleH: containsScheduleH || containsControlledSchedule,
        isOffline: isOfflineFallback
      };

      if (isOfflineFallback) {
        // Record in local IndexedDB storage and decrement local batch stock
        const clientInvId = `offline-client-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await pharmacyOfflineStorageService.recordOfflineSale({
          invoiceNumber: invoiceNum,
          clientInvoiceId: clientInvId,
          createdAt: new Date().toISOString(),
          patientName,
          patientPhone: patientPhone || undefined,
          patientUhid: `UHID-RX-${invoiceNum.slice(-4)}`,
          doctorName: doctorName || partnerProfile.doctorName || undefined,
          doctorNmcReg: doctorNmcReg || partnerProfile.doctorRegNo || undefined,
          paymentMode,
          subtotal: calculations.subtotal,
          discountPercent,
          discountAmount: calculations.discountAmount,
          taxableAmount: calculations.taxableAmount,
          cgstAmount: calculations.cgst,
          sgstAmount: calculations.sgst,
          grandTotal: calculations.grandTotal,
          containsScheduleH: containsScheduleH || containsControlledSchedule,
          items: cart.map((c) => ({
            medicationId: c.medication.id,
            drugName: c.medication.brandName,
            batchId: c.selectedBatch.id,
            batchNumber: c.selectedBatch.batchNumber,
            expiryDate: c.selectedBatch.expiryDate,
            quantity: c.quantity,
            rate: c.rate,
            amount: Math.round(c.rate * c.quantity * 100) / 100,
            isLoose: c.isLoose,
            packUnits: c.medication.packUnits || 10,
            dosageSchedule: c.isLoose ? 'Loose Tablets' : 'Full Strip Pack'
          }))
        });

        // Decrement in-memory batch state immediately with micro-deductions for continuous fast counter sales
        for (const item of cart) {
          const packUnits = item.medication.packUnits || 10;
          const deductQty = item.isLoose ? (item.quantity / packUnits) : item.quantity;
          item.selectedBatch.availableQuantity = Math.max(0, Math.round((item.selectedBatch.availableQuantity - deductQty) * 100) / 100);
        }

        const pendingCount = await pharmacyOfflineStorageService.getPendingSyncCount();
        setPendingOfflineBillsCount(pendingCount);
      }

      setCompletedInvoice(invoice);
      setAutoPrintInvoice(true);

      // Record in pharmacy revenue & galla shift reconciliation ledger
      try {
        pharmacyRevenueGallaService.recordInvoice(invoice);
      } catch (gallaErr) {
        console.warn('[POS] Could not register sale in Galla ledger:', gallaErr);
      }

      // Record in customer Credit Khata ledger
      if (paymentMode === 'CREDIT_KHATA') {
        try {
          pharmacyCreditKhataService.recordInvoiceDebit(invoice, medicinesTakenBy.trim() || undefined);
        } catch (khataErr) {
          console.warn('[POS] Could not record Khata debit:', khataErr);
        }
      }

      setSalesHistory((prev) => {
        const next = [invoice, ...prev];
        try {
          localStorage.setItem('docsearch_pharmacy_invoices', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setIsInvoiceModalOpen(true);
      playAudioFeedback('chime');

      // If Schedule H1 medicines are in the cart, automatically record in the CDSCO Register
      const h1Items = cart.filter((c) => c.medication.scheduleType === 'SCHEDULE_H1');
      if (h1Items.length > 0) {
        try {
          const storedH1 = localStorage.getItem('docsearch_schedule_h1_records');
          const existingH1 = storedH1 ? JSON.parse(storedH1) : [];
          for (const item of h1Items) {
            existingH1.unshift({
              id: `H1-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
              dispenseDate: nowStr.split(',')[0] || new Date().toISOString().split('T')[0],
              patientName,
              patientUhid: `UHID-RX-${invoiceNum.slice(-4)}`,
              patientAddress: 'Hospital OPD Patient',
              patientPhone: patientPhone || 'Not Provided',
              doctorName: doctorName || partnerProfile.doctorName || 'Consulting Physician',
              doctorRegNumber: doctorNmcReg || partnerProfile.doctorRegNo || 'Reg # Pending',
              hospitalName: partnerProfile.entityLegalName || currentUser?.tenantName || 'Pharmacy Dispensing Counter',
              drugName: `${item.medication.brandName} (${item.medication.genericName})`,
              batchNumber: item.selectedBatch.batchNumber,
              expiryDate: item.selectedBatch.expiryDate,
              quantityDispensed: `${item.quantity} ${item.isLoose ? 'Tabs' : 'Strips'}`,
              pharmacistLicense: partnerProfile.pharmacyDrugLicense20B || 'FORM 20B/21B'
            });
          }
          localStorage.setItem('docsearch_schedule_h1_records', JSON.stringify(existingH1));
        } catch {
          // ignore
        }

        hospitalEventBus.publish('PRESCRIPTION_DISPENSED', 'FastPharmacyPosCounterView', {
          invoiceNumber: invoiceNum,
          patientName,
          h1Count: h1Items.length
        });
      }

      // Statutory CDSCO Audit Vault: Record all controlled substances (H1, X, H)
      for (const item of cart) {
        const sched = cdscoInspectionAuditService.detectScheduleType(item.medication);
        if (sched === 'SCHEDULE_H1' || sched === 'SCHEDULE_X' || sched === 'SCHEDULE_H') {
          cdscoInspectionAuditService.recordDispensation({
            dispenseDate: nowStr.split(',')[0] || new Date().toISOString().split('T')[0]!,
            invoiceNumber: invoiceNum,
            patientName,
            patientAddress: 'Counter Walk-in / Hospital Patient',
            patientPhone: patientPhone || 'Not Provided',
            patientUhid: `UHID-RX-${invoiceNum.slice(-4)}`,
            doctorName: doctorName || partnerProfile.doctorName || 'Consulting Physician',
            doctorNmcReg: doctorNmcReg || partnerProfile.doctorRegNo || 'Reg # Pending',
            doctorClinicAddress: partnerProfile.officialAddress || 'Consulting Clinic',
            drugName: item.medication.brandName,
            genericSalt: item.medication.genericName,
            scheduleCategory: sched,
            dosageForm: item.medication.dosageForm,
            batchNumber: item.selectedBatch.batchNumber,
            expiryDate: item.selectedBatch.expiryDate,
            manufacturer: item.medication.manufacturer || 'Authorized Manufacturer',
            quantityDispensed: item.quantity,
            unitType: item.isLoose ? 'Tabs' : 'Strip',
            unitPrice: item.rate,
            totalAmount: Math.round(item.rate * item.quantity * 100) / 100,
            pharmacistName: partnerProfile.pharmacistName || currentUser?.name || 'Registered Pharmacist',
            pharmacistRegNo: partnerProfile.pharmacistRegNo || '',
            pharmacyLicense20B: partnerProfile.pharmacyDrugLicense20B || '',
            pharmacyLicense21B: partnerProfile.pharmacyDrugLicense21B || '',
            isInspected: false
          });
        }
      }

      const previousCart = [...cart];
      const previousCash = cashReceived;
      const previousInvoiceNum = invoiceNum;

      setIsInvoiceModalOpen(true);
      setCart([]);
      setCashReceived('');

      // Sub-10ms Optimistic UI + 5-Second Undo Toast (Ctrl+Z)
      optimisticActionService.dispatch({
        title: `Dispensed to ${patientName || 'Walk-in'} (₹${calculations.grandTotal.toFixed(2)})`,
        category: 'PHARMACY_DISPENSE',
        countdownSeconds: 5,
        onCommit: async () => {
          // Permanently committed in pharmacy transaction journal
        },
        onUndo: () => {
          setCart(previousCart);
          setCashReceived(previousCash);
          setIsInvoiceModalOpen(false);
          setSalesHistory((prev) => prev.filter((inv) => inv.invoiceNumber !== previousInvoiceNum));
          setNotification({
            type: 'warning',
            message: `↩️ Dispense #${previousInvoiceNum} undone (Cart restored)`
          });
        }
      });

      if (isOfflineFallback) {
        setNotification({
          type: 'success',
          message: `✓ OFFLINE INVOICE #${invoiceNum} (₹${calculations.grandTotal.toFixed(2)}) RECORDED IN LOCAL INDEXEDDB! Thermal bill printed. Will auto-sync when online.`
        });
      } else {
        setNotification({
          type: 'success',
          message: `✓ Invoice #${invoiceNum} (₹${calculations.grandTotal.toFixed(2)}) created and recorded in pharmacy ledger!`
        });
      }
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Transaction failed. Check inventory balances.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⌨️ 100% Keyboard-Only POS Suite (F1-F8, Enter, Esc) - Sub-5 Second Checkout for Indian Chemists
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. [F1] Focus Search / Scan Barcode (Zero mouse clicks)
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // 2. [F2] Toggle Loose Tablets (1-2 goli) vs Full Strip Pack
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length === 0) {
          setNotification({ type: 'warning', message: 'Cart is empty. Add medicine first to toggle Loose vs Strip [F2].' });
          setTimeout(() => setNotification(null), 3000);
          return;
        }
        const targetItem =
          (activeCartItemId ? cart.find((c) => c.id === activeCartItemId) : null) ||
          cart[cart.length - 1];

        if (targetItem) {
          const newLooseMode = !targetItem.isLoose;
          handleSetPackMode(targetItem.id, newLooseMode);
          setNotification({
            type: 'success',
            message: `⚡ Switched ${targetItem.medication.brandName} to ${newLooseMode ? '💊 Loose Tablets' : '📦 Full Strip'} [F2]! Type quantity directly on keyboard.`
          });
          setTimeout(() => setNotification(null), 3500);
        }
        return;
      }

      // 3. [F3] Generic Salt & PMBJP Jan Aushadhi Substitute Window
      if (e.key === 'F3') {
        e.preventDefault();
        setIsSaltSubstituteModalOpen(true);
        return;
      }

      // 4. [F4] Focus Discount (%) Input
      if (e.key === 'F4') {
        e.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      }

      // 5. [F5] OPD Doctor e-Prescriptions Importer
      if (e.key === 'F5') {
        e.preventDefault();
        setIsDoctorRxModalOpen((prev) => !prev);
        return;
      }

      // 6. [F6] AI Camera & WhatsApp Doctor Prescription OCR (Gemini Vision)
      if (e.key === 'F6') {
        e.preventDefault();
        setIsCameraOcrModalOpen((prev) => !prev);
        return;
      }

      // 7. [F7] Drug Inspector (CDSCO / FDA) 1-Click Audit Vault
      if (e.key === 'F7') {
        e.preventDefault();
        setIsCdscoAuditVaultModalOpen((prev) => !prev);
        return;
      }

      // 8. [F8] Payment Mode (Cash / UPI / Card / Khata)
      if (e.key === 'F8') {
        e.preventDefault();
        const paymentModes: Array<'CASH' | 'UPI_QR' | 'CARD' | 'CREDIT_KHATA'> = [
          'CASH',
          'UPI_QR',
          'CARD',
          'CREDIT_KHATA'
        ];
        setPaymentMode((currentMode) => {
          const nextIndex = (paymentModes.indexOf(currentMode) + 1) % paymentModes.length;
          const nextMode = paymentModes[nextIndex]!;
          const modeLabels: Record<string, string> = {
            CASH: '💵 Cash Counter',
            UPI_QR: '📱 UPI QR Code (GPay/PhonePe)',
            CARD: '💳 POS Card Terminal',
            CREDIT_KHATA: '📒 Credit / Udhaar Khata'
          };
          setNotification({
            type: 'success',
            message: `Payment Mode: ${modeLabels[nextMode]} [F8]`
          });
          setTimeout(() => setNotification(null), 2500);
          return nextMode;
        });
        return;
      }

      // 8. [F9] Bill & Sales History
      if (e.key === 'F9') {
        e.preventDefault();
        setIsSalesHistoryOpen((prev) => !prev);
        return;
      }

      // 9. [F10] Offline PWA & Background Sync Vault
      if (e.key === 'F10') {
        e.preventDefault();
        setIsOfflineSyncModalOpen((prev) => !prev);
        return;
      }

      // Quick +/- adjustments on active cart item when not typing inside an input
      const targetTag = (document.activeElement as HTMLElement)?.tagName;
      const isInputActive = targetTag === 'INPUT' || targetTag === 'TEXTAREA';
      const isSearchActiveAndEmpty = document.activeElement === searchInputRef.current && !searchQuery;

      if ((!isInputActive || isSearchActiveAndEmpty) && cart.length > 0) {
        const targetItem =
          (activeCartItemId ? cart.find((c) => c.id === activeCartItemId) : null) ||
          cart[cart.length - 1];

        if (targetItem) {
          if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            handleUpdateQty(targetItem.id, targetItem.quantity + 1);
            return;
          }
          if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            handleUpdateQty(targetItem.id, Math.max(1, targetItem.quantity - 1));
            return;
          }
        }
      }

      // 9. [Enter] Print 80mm Thermal Slip & Auto-Cut
      if (e.key === 'Enter') {
        const isSearchInput = document.activeElement === searchInputRef.current;
        const activeElemId = (document.activeElement as HTMLElement)?.id || '';

        // If typing in loose quantity or rate input, pressing Enter returns focus to Search for next medicine
        if (activeElemId.startsWith('qty-input-') || activeElemId.startsWith('rate-input-')) {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
          return;
        }

        // If inside search input with active suggestions, let searchInput onKeyDown select the drug
        if (isSearchInput && searchResults.length > 0 && searchQuery.trim().length > 0) {
          return;
        }

        // When ready to checkout (empty search bar or outside search input) and cart has items
        if (cart.length > 0 && !isSubmitting) {
          e.preventDefault();
          handleCompleteSale();
        }
        return;
      }

      // 8. [Esc] Close Popups, Clear Search, or Clear Cart
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isCameraOcrModalOpen) {
          setIsCameraOcrModalOpen(false);
          return;
        }
        if (isInvoiceModalOpen) {
          setIsInvoiceModalOpen(false);
          return;
        }
        if (isSaltSubstituteModalOpen) {
          setIsSaltSubstituteModalOpen(false);
          return;
        }
        if (isDoctorRxModalOpen) {
          setIsDoctorRxModalOpen(false);
          return;
        }
        if (isSalesHistoryOpen) {
          setIsSalesHistoryOpen(false);
          return;
        }
        if (isSmartCounterOpen) {
          setIsSmartCounterOpen(false);
          return;
        }
        if (searchQuery.trim().length > 0) {
          e.preventDefault();
          setSearchQuery('');
          searchInputRef.current?.focus();
          return;
        }
        if (cart.length > 0) {
          e.preventDefault();
          setCart([]);
          setNotification({
            type: 'warning',
            message: '🗑️ Cart cleared [Esc]. Ready for new customer.'
          });
          setTimeout(() => setNotification(null), 3000);
          searchInputRef.current?.focus();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cart,
    activeCartItemId,
    calculations,
    patientName,
    patientPhone,
    doctorName,
    doctorNmcReg,
    paymentMode,
    isSubmitting,
    searchQuery,
    searchResults,
    isInvoiceModalOpen,
    isSaltSubstituteModalOpen,
    isDoctorRxModalOpen,
    isSalesHistoryOpen,
    isSmartCounterOpen,
    isCameraOcrModalOpen,
    isShortcutsOpen,
    handleCompleteSale,
    handleSetPackMode,
    handleUpdateQty
  ]);

  const getScheduleBadge = (type: ScheduleDrugType) => {
    switch (type) {
      case 'SCHEDULE_H1':
        return <Badge variant="danger">⚠️ SCH-H1</Badge>;
      case 'SCHEDULE_H':
        return <Badge variant="warning">SCH-H</Badge>;
      case 'OTC':
        return <Badge variant="success">OTC</Badge>;
      default:
        return <Badge variant="neutral">GENERAL</Badge>;
    }
  };

  return (
    <div
      style={
        isFullPage
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 10005,
              backgroundColor: 'var(--ds-color-bg)',
              padding: '12px 18px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxSizing: 'border-box',
              overflowX: 'hidden'
            }
          : {
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxSizing: 'border-box',
              overflowX: 'hidden'
            }
      }
    >
      {/* Notifications Toast */}
      {notification && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor:
              notification.type === 'success'
                ? 'rgba(34, 197, 94, 0.15)'
                : notification.type === 'warning'
                ? 'rgba(234, 179, 8, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${
              notification.type === 'success' ? 'var(--ds-color-success)' : notification.type === 'warning' ? 'var(--ds-color-warning)' : 'var(--ds-color-danger)'
            }`,
            color:
              notification.type === 'success' ? 'var(--ds-color-success)' : notification.type === 'warning' ? 'var(--ds-color-warning)' : 'var(--ds-color-danger)',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Backdrop to dismiss open popovers */}
      {(isClinicalToolsOpen || isShortcutsOpen) && (
        <div
          onClick={() => {
            setIsClinicalToolsOpen(false);
            setIsShortcutsOpen(false);
          }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
        />
      )}

      {/* Top Chemist Command Ribbon — Sleek Single-Row Ergonomic POS Terminal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 14px',
          backgroundColor: 'var(--ds-color-surface)',
          border: '1.5px solid var(--ds-color-border)',
          borderRadius: '10px',
          color: 'var(--ds-color-text-primary)',
          position: 'relative',
          zIndex: 1000
        }}
      >
        {/* Left Zone: Counter Identity & Dispenser Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '7px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid var(--ds-color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem'
            }}
          >
            🛒
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ds-color-text-primary)' }}>
                Retail POS Counter
              </h2>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--ds-color-success)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '1px 6px',
                  borderRadius: '8px'
                }}
              >
                ● LIVE
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--ds-color-text-muted)' }}>
              <span>👨‍⚕️ {partnerProfile.pharmacistName || currentUser?.name || 'Staff Dispenser'}</span>
              <span style={{ color: 'var(--ds-color-border)' }}>•</span>
              <span>📜 DL: {partnerProfile.pharmacyDrugLicense20B || 'FORM 20B/21B'}</span>
              {partnerProfile.gstin && (
                <>
                  <span style={{ color: 'var(--ds-color-border)' }}>•</span>
                  <span>🏛️ {partnerProfile.gstin}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center Zone: Mode Segmented Pill, Clinical Tools Dropdown & Bill History */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Segmented Mode Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--ds-color-surface-subtle)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '7px',
              padding: '2px',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setBillingMode('WALK_IN')}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: billingMode === 'WALK_IN' ? 'var(--ds-color-primary, #10B981)' : 'transparent',
                color: billingMode === 'WALK_IN' ? '#ffffff' : 'var(--ds-color-text-secondary)',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🚶</span>
              <span>Walk-in (OTC)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBillingMode('HOSPITAL_RX');
                setIsDoctorRxModalOpen(true);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: billingMode === 'HOSPITAL_RX' ? 'var(--ds-color-primary, #10B981)' : 'transparent',
                color: billingMode === 'HOSPITAL_RX' ? '#ffffff' : 'var(--ds-color-text-secondary)',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
              title="Switch to Doctor Rx mode & import OPD prescriptions [F5]"
            >
              <span>📋</span>
              <span>Doctor Rx [F5]</span>
              {pendingDoctorRxCount > 0 && (
                <span
                  style={{
                    backgroundColor: billingMode === 'HOSPITAL_RX' ? 'rgba(0,0,0,0.3)' : '#16A34A',
                    color: 'white',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: '8px'
                  }}
                >
                  {pendingDoctorRxCount}
                </span>
              )}
            </button>
          </div>

          {/* ⚡ Consolidated Clinical Tools Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsClinicalToolsOpen(!isClinicalToolsOpen)}
              style={{
                backgroundColor: isClinicalToolsOpen ? 'rgba(168, 85, 247, 0.2)' : 'var(--ds-color-surface-subtle)',
                border: `1px solid ${isClinicalToolsOpen ? '#A855F7' : 'var(--ds-color-border)'}`,
                color: isClinicalToolsOpen ? '#C084FC' : 'var(--ds-color-text-primary)',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 800,
                minHeight: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Clinical tools: Salt substitute [F3], Rx OCR [F6], CDSCO Vault [F7], Pill Counter"
            >
              <span>⚡</span>
              <span>Clinical Tools</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▾</span>
            </button>

            {isClinicalToolsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 1002,
                  backgroundColor: '#0F172A',
                  border: '1.5px solid #334155',
                  borderRadius: '8px',
                  padding: '6px',
                  minWidth: '245px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}
              >
                {/* Item 1: Salt Substitute [F3] */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSaltSubstituteModalOpen(true);
                    setIsClinicalToolsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '0.76rem',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🧬</span>
                    <span>Salt Substitute</span>
                  </span>
                  <kbd style={{ backgroundColor: '#1E293B', color: '#38BDF8', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155', fontSize: '0.68rem', fontWeight: 800 }}>F3</kbd>
                </button>

                {/* Item 2: Rx Vision OCR [F6] */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCameraOcrModalOpen(true);
                    setIsClinicalToolsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '0.76rem',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📷</span>
                    <span>Rx OCR / WhatsApp</span>
                  </span>
                  <kbd style={{ backgroundColor: '#1E293B', color: '#C084FC', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155', fontSize: '0.68rem', fontWeight: 800 }}>F6</kbd>
                </button>

                {/* Item 3: CDSCO Vault [F7] */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCdscoAuditVaultModalOpen(true);
                    setIsClinicalToolsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '0.76rem',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚖️</span>
                    <span>CDSCO Vault (20B/21B)</span>
                  </span>
                  <kbd style={{ backgroundColor: '#1E293B', color: '#FCA5A5', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155', fontSize: '0.68rem', fontWeight: 800 }}>F7</kbd>
                </button>

                {/* Item 4: AI Pill Counter */}
                <button
                  type="button"
                  onClick={() => {
                    setSmartCounterTargetMed(null);
                    setIsSmartCounterOpen(true);
                    setIsClinicalToolsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '0.76rem',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🤖</span>
                    <span>AI Camera Pill Counter</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 📜 Bill & Sales History Button */}
          <button
            type="button"
            onClick={() => setIsSalesHistoryOpen(true)}
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#A5B4FC',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              minHeight: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
            title="View, search and reprint previous sales invoices [F9]"
          >
            <span>📜</span>
            <span>History [F9]</span>
            {salesHistory.length > 0 && (
              <span
                style={{
                  backgroundColor: '#6366F1',
                  color: 'white',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: '8px'
                }}
              >
                {salesHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Zone: Combined Telemetry Pill, Shortcuts Popover & POS Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Combined Scanner & Offline-First Telemetry Pill */}
          <button
            type="button"
            onClick={() => setIsOfflineSyncModalOpen(true)}
            style={{
              backgroundColor: isOfflineMode
                ? 'rgba(239, 68, 68, 0.15)'
                : syncEngineState === 'SYNCING'
                ? 'rgba(56, 189, 248, 0.15)'
                : pendingOfflineBillsCount > 0
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${
                isOfflineMode
                  ? '#EF4444'
                  : syncEngineState === 'SYNCING'
                  ? '#38BDF8'
                  : pendingOfflineBillsCount > 0
                  ? '#F59E0B'
                  : 'rgba(16, 185, 129, 0.4)'
              }`,
              color: isOfflineMode
                ? '#FCA5A5'
                : syncEngineState === 'SYNCING'
                ? '#7DD3FC'
                : pendingOfflineBillsCount > 0
                ? '#FCD34D'
                : '#6EE7B7',
              borderRadius: '6px',
              padding: '4px 9px',
              fontSize: '0.72rem',
              fontWeight: 800,
              minHeight: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Universal Barcode Wedge Armed • Offline PWA Sync Status [F10]"
          >
            <span>{isOfflineMode ? '🔴' : syncEngineState === 'SYNCING' ? '🔄' : '🟢'}</span>
            <span>
              {isOfflineMode
                ? `Offline (${pendingOfflineBillsCount})`
                : pendingOfflineBillsCount > 0
                ? `Sync (${pendingOfflineBillsCount})`
                : 'Online [F10]'}
            </span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span style={{ color: '#34D399', fontSize: '0.7rem' }}>⚡ Scanner</span>
          </button>

          {/* ⌨️ 100% Keyboard POS Shortcuts Popover */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
              style={{
                backgroundColor: isShortcutsOpen ? 'rgba(56, 189, 248, 0.25)' : 'var(--ds-color-surface-subtle)',
                border: '1px solid var(--ds-color-border)',
                color: '#38BDF8',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                minHeight: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: isShortcutsOpen ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none'
              }}
              title="Keyboard Shortcuts Quick Reference Matrix [F1-F10]"
            >
              <span>⌨️</span>
              <span>Keys</span>
            </button>

            {isShortcutsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  zIndex: 1002,
                  backgroundColor: '#0F172A',
                  border: '1.5px solid #38BDF8',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  width: '310px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.8rem' }}>⚡ 100% Keyboard POS Shortcuts</span>
                  <button
                    type="button"
                    onClick={() => setIsShortcutsOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.73rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#334155', padding: '2px 5px', borderRadius: '4px', border: '1px solid #64748B', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>F1</kbd>
                    <span style={{ color: '#CBD5E1' }}>Focus Search</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#334155', padding: '2px 5px', borderRadius: '4px', border: '1px solid #64748B', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>F2</kbd>
                    <span style={{ color: '#CBD5E1' }}>Loose / Strip</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#334155', padding: '2px 5px', borderRadius: '4px', border: '1px solid #64748B', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>F3</kbd>
                    <span style={{ color: '#CBD5E1' }}>Salt Substitute</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#334155', padding: '2px 5px', borderRadius: '4px', border: '1px solid #64748B', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>F4</kbd>
                    <span style={{ color: '#CBD5E1' }}>Discount %</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#334155', padding: '2px 5px', borderRadius: '4px', border: '1px solid #64748B', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>F5</kbd>
                    <span style={{ color: '#CBD5E1' }}>OPD Doctor Rx</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#9333EA', color: 'white', padding: '2px 5px', borderRadius: '4px', fontWeight: 900, minWidth: '24px', textAlign: 'center' }}>F6</kbd>
                    <span style={{ color: '#CBD5E1' }}>Rx Vision OCR</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#EF4444', color: 'white', padding: '2px 5px', borderRadius: '4px', fontWeight: 900, minWidth: '24px', textAlign: 'center' }}>F7</kbd>
                    <span style={{ color: '#CBD5E1' }}>CDSCO Vault</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#334155', padding: '2px 5px', borderRadius: '4px', border: '1px solid #64748B', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>F8</kbd>
                    <span style={{ color: '#CBD5E1' }}>Payment Mode</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#334155', padding: '2px 5px', borderRadius: '4px', border: '1px solid #64748B', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>F9</kbd>
                    <span style={{ color: '#CBD5E1' }}>Bill History</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#334155', padding: '2px 5px', borderRadius: '4px', border: '1px solid #64748B', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>F10</kbd>
                    <span style={{ color: '#CBD5E1' }}>Offline Sync</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#16A34A', color: 'white', padding: '2px 5px', borderRadius: '4px', fontWeight: 900, minWidth: '24px', textAlign: 'center' }}>Enter</kbd>
                    <span style={{ color: '#CBD5E1' }}>Complete Bill</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ backgroundColor: '#DC2626', color: 'white', padding: '2px 5px', borderRadius: '4px', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>Esc</kbd>
                    <span style={{ color: '#CBD5E1' }}>Clear / Close</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Unified Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            style={{
              backgroundColor: isBrowserFullscreen || isFullPage ? 'rgba(14, 165, 233, 0.2)' : 'var(--ds-color-surface-subtle)',
              border: isBrowserFullscreen || isFullPage ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid var(--ds-color-border)',
              color: isBrowserFullscreen || isFullPage ? '#38BDF8' : 'var(--ds-color-text-secondary)',
              padding: '5px 9px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 800,
              minHeight: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
              boxShadow: isBrowserFullscreen ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none'
            }}
            title={isBrowserFullscreen || isFullPage ? 'Exit fullscreen layout' : 'Enter full screen billing mode'}
          >
            <span>{isBrowserFullscreen || isFullPage ? '↙ Normal' : '⛶ Full'}</span>
          </button>

          {onClosePos && (
            <button
              type="button"
              onClick={onClosePos}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--ds-color-danger)',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                minHeight: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Exit to Pharmacy Hub"
            >
              <span>✕ Exit</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer / Patient Metadata Bar */}
      <Card padding="sm">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {billingMode === 'HOSPITAL_RX' ? (
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', alignItems: 'flex-end', backgroundColor: 'var(--ds-color-surface)', padding: '10px 12px', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--ds-color-accent)' }}>
                  Select Doctor E-Prescription
                </label>
                <Select
                  value={selectedRxId}
                  onChange={(e) => handleLoadPrescription(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Patient Order to Dispense --' },
                    ...prescriptions.map((p) => ({
                      value: p.id,
                      label: `${p.prescriptionNumber} — ${p.patientName} (${p.items.length} meds) • Priority: ${p.priority}`
                    }))
                  ]}
                />
              </div>
            </div>
          ) : null}

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--ds-color-text-muted)' }}>
              Patient / Customer Name *
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--ds-color-text-muted)' }}>
              Mobile Number (10-Digit Mobile for WhatsApp Bill) *
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={patientPhone}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '');
                if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                setPatientPhone(digits.slice(0, 10));
              }}
              placeholder="98765 43210"
              leftElement={<span style={{ fontWeight: 800, color: 'var(--ds-color-primary, #38BDF8)', fontSize: '0.75rem' }}>+91</span>}
              style={{ paddingLeft: '44px', fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 600, color: containsControlledSchedule ? '#EF4444' : 'var(--ds-color-text-muted)' }}>
                Doctor Name {containsControlledSchedule && '⚠️ [Mandatory CDSCO]'}
              </label>
              {containsControlledSchedule && (
                <button
                  type="button"
                  onClick={() => setIsPrescriberPromptOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  ⚡ Pick Prescriber
                </button>
              )}
            </div>
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Dr. S. K. Gupta, MD"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: containsControlledSchedule ? '#EF4444' : 'var(--ds-color-text-muted)' }}>
              Doctor NMC Reg No. {containsControlledSchedule && '⚠️ [Mandatory CDSCO]'}
            </label>
            <Input
              value={doctorNmcReg}
              onChange={(e) => setDoctorNmcReg(e.target.value)}
              placeholder="e.g. NMC-84920-MAH"
            />
          </div>
        </div>
      </Card>

      {/* Fast Search & Auto-Add Bar */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 [F1] Fast Search / Loose Shorthand (e.g. PCM 650/2, DOLO*3, AUG 625 2T, PAN 40): Sub-2ms Acronym & FEFO Auto-Select..."
              style={{
                fontSize: '0.95rem',
                padding: '10px 14px',
                borderColor: (parsedSearchShorthand.looseQty !== null || parsedSearchShorthand.isFraction) ? 'var(--ds-color-accent, #38BDF8)' : 'var(--ds-color-primary)',
                boxShadow: (parsedSearchShorthand.looseQty !== null || parsedSearchShorthand.isFraction) ? '0 0 14px rgba(56, 189, 248, 0.4)' : '0 0 12px rgba(2, 132, 199, 0.25)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(0, searchResults.length - 1)));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchResults.length > 0 && searchQuery.trim().length > 0) {
                    const selected = searchResults[highlightedIndex] || searchResults[0]!;
                    const packUnits = selected.packUnits || 10;
                    const isFractionShorthand = parsedSearchShorthand.looseQty !== null || parsedSearchShorthand.isFraction;
                    let looseQty = 1;
                    if (parsedSearchShorthand.fractionNum && parsedSearchShorthand.fractionDen) {
                      looseQty = parsedSearchShorthand.fractionDen === packUnits
                        ? parsedSearchShorthand.fractionNum
                        : Math.max(1, Math.round((parsedSearchShorthand.fractionNum / parsedSearchShorthand.fractionDen) * packUnits));
                    } else if (parsedSearchShorthand.decimalFraction) {
                      looseQty = Math.max(1, Math.round(parsedSearchShorthand.decimalFraction * packUnits));
                    } else if (parsedSearchShorthand.looseQty) {
                      looseQty = parsedSearchShorthand.looseQty;
                    }
                    handleAddToCart(
                      selected,
                      isFractionShorthand ? looseQty : undefined,
                      isFractionShorthand
                    );
                  } else if (cart.length > 0) {
                    handleCompleteSale();
                  }
                }
              }}
            />

            {/* Dynamic Blister Pack Fraction Shorthand Indicator */}
            {(parsedSearchShorthand.looseQty !== null || parsedSearchShorthand.isFraction) && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  color: 'var(--ds-color-text-primary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.9rem' }}>✂️</span>
                  <span>
                    <strong>Blister Fraction Active:</strong> Dispensing{' '}
                    <strong style={{ color: '#38BDF8', textDecoration: 'underline' }}>
                      {parsedSearchShorthand.rawShorthand || `${parsedSearchShorthand.looseQty} Tabs`}
                    </strong>{' '}
                    for <em>"{parsedSearchShorthand.cleanTerm}"</em> (Auto Unit Rate & Micro-Stock Cut)
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-primary, #38BDF8)', fontWeight: 800 }}>
                  ↵ Press Enter to Dispense Fraction
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Search Suggestions Dropdown */}
        {searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 100,
              backgroundColor: 'var(--ds-color-surface)',
              border: '1.5px solid var(--ds-color-primary)',
              borderRadius: '8px',
              marginTop: '4px',
              maxHeight: '340px',
              overflowY: 'auto',
              boxShadow: '0 12px 36px rgba(0,0,0,0.7)'
            }}
          >
            {searchResults.map((med, idx) => {
              const bestBatch = getFefoBatch(med.id);
              const isSelected = idx === highlightedIndex;
              const isFractionShorthand = parsedSearchShorthand.looseQty !== null || parsedSearchShorthand.isFraction;
              const packUnits = med.packUnits || 10;
              const unitRate = med.unitPrice || Math.round((med.mrp / packUnits) * 100) / 100;

              let looseQty = 1;
              if (parsedSearchShorthand.fractionNum && parsedSearchShorthand.fractionDen) {
                looseQty = parsedSearchShorthand.fractionDen === packUnits
                  ? parsedSearchShorthand.fractionNum
                  : Math.max(1, Math.round((parsedSearchShorthand.fractionNum / parsedSearchShorthand.fractionDen) * packUnits));
              } else if (parsedSearchShorthand.decimalFraction) {
                looseQty = Math.max(1, Math.round(parsedSearchShorthand.decimalFraction * packUnits));
              } else if (parsedSearchShorthand.looseQty) {
                looseQty = parsedSearchShorthand.looseQty;
              }
              const looseTotal = Math.round(unitRate * looseQty * 100) / 100;

              return (
                <div
                  key={med.id}
                  onClick={() =>
                    handleAddToCart(
                      med,
                      isFractionShorthand ? looseQty : undefined,
                      isFractionShorthand
                    )
                  }
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--ds-color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--ds-color-surface-hover)' : 'transparent',
                    borderLeft: isSelected ? '4px solid var(--ds-color-primary)' : '4px solid transparent',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)', fontSize: '0.95rem' }}>{med.brandName}</strong>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: med.brandType === 'GENERIC' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                          color: med.brandType === 'GENERIC' ? 'var(--ds-color-success)' : 'var(--ds-color-accent)',
                          border: med.brandType === 'GENERIC' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)'
                        }}
                      >
                        {med.brandType === 'GENERIC' ? '🌿 Generic' : '🏛️ Ethical'}
                      </span>
                      {getScheduleBadge(med.scheduleType)}
                      <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', backgroundColor: 'var(--ds-color-surface)', padding: '2px 6px', borderRadius: '4px' }}>
                        {med.packConfiguration}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                      {med.genericName} • {med.manufacturer}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {isFractionShorthand ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', padding: '1px 6px', fontWeight: 800 }}>
                            ✂️ {looseQty}/{packUnits} Tabs ({parsedSearchShorthand.rawShorthand || `${looseQty} tabs`})
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ds-color-success, #34D399)' }}>
                            ₹{looseTotal.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                          ₹{unitRate.toFixed(2)}/tab • Full Strip ₹{med.mrp.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ds-color-accent)' }}>
                        ₹{med.mrp.toFixed(2)}
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: (bestBatch.daysToExpiry ?? 999) < 60 ? 'var(--ds-color-danger)' : 'var(--ds-color-success)', fontWeight: 700 }}>
                      Batch: {bestBatch.batchNumber} • Stock: {bestBatch.availableQuantity}
                    </div>
                    {isSelected && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--ds-color-primary, #38BDF8)', fontWeight: 800, marginTop: '2px' }}>
                        ↵ Press Enter to {isFractionShorthand ? `Cut & Dispense ${looseQty} Tabs` : 'Add to Cart'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Billing Cart & Payment Terminal Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isFullPage ? '2.4fr 1.1fr' : '2.2fr 1fr',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        {/* Left: Cart Items Table */}
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                🛒 Cart Items ({cart.length})
              </h3>
              {cart.length > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--ds-color-success)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 800
                  }}
                >
                  Total {cart.reduce((s, c) => s + c.quantity, 0)} {cart.some((c) => c.isLoose) ? 'Items/Units' : 'Strips'}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                style={{ background: 'none', border: 'none', color: 'var(--ds-color-danger)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🗑️ Clear Cart
              </button>
            )}
          </div>

          {/* Clinical Decision Support / DDI Advisory Alert Box */}
          {clinicalAdvisories.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid var(--ds-color-warning)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px'
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--ds-color-warning)', fontSize: '0.82rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🛡️ Clinical Safety & DDI Conflict Shield ({clinicalAdvisories.length} Advisory Detected)
              </div>
              {clinicalAdvisories.map((adv) => (
                <div key={adv.id} style={{ fontSize: '0.75rem', color: 'var(--ds-color-warning)', marginTop: '3px' }}>
                  <strong>{adv.title}:</strong> {adv.message}
                </div>
              ))}
            </div>
          )}

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--ds-color-text-muted)' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>💊</div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ds-color-text-muted)' }}>
                Cart is Empty
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--ds-color-text-muted)' }}>
                Search medicine above (F2), scan barcode, or select from inventory.
              </p>
            </div>
          ) : (
            <>
              <div
                className="pharmacy-table-scroll"
                style={{
                  maxHeight: isFullPage ? 'calc(100vh - 410px)' : '480px',
                  minHeight: isFullPage ? '260px' : 'auto',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  border: '1px solid var(--ds-color-border)',
                  borderRadius: '8px'
                }}
              >
                <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--ds-color-surface-subtle)' }}>
                    <tr style={{ borderBottom: '1.5px solid var(--ds-color-border)', color: 'var(--ds-color-text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 6px', width: '32px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '10px 8px' }}>Medicine & Generic Name</th>
                      <th style={{ padding: '10px 8px' }}>FEFO Batch & Expiry</th>
                      <th style={{ padding: '10px 8px' }}>Packaging</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }}>Quantity</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Total (₹)</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => {
                      const isActive = item.id === activeCartItemId;
                      const packUnits = item.medication.packUnits || 10;
                      return (
                      <React.Fragment key={item.id}>
                      <tr
                        onClick={() => setActiveCartItemId(item.id)}
                        style={{
                          borderBottom: (isActive || item.isLoose) ? 'none' : '1px solid var(--ds-color-border)',
                          backgroundColor: isActive ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                          borderLeft: isActive ? '3px solid var(--ds-color-primary, #38BDF8)' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s ease'
                        }}
                      >
                        <td style={{ padding: '10px 6px', verticalAlign: 'top', textAlign: 'center', color: 'var(--ds-color-text-muted)', fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                              {item.isSubstituted && item.medication.janAushadhiEquivalent
                                ? item.medication.janAushadhiEquivalent.genericTitle
                                : item.medication.brandName}
                            </strong>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: (item.isSubstituted || item.medication.brandType === 'GENERIC') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                color: (item.isSubstituted || item.medication.brandType === 'GENERIC') ? 'var(--ds-color-success)' : 'var(--ds-color-accent)'
                              }}
                            >
                              {item.isSubstituted ? '🌿 Jan Aushadhi' : (item.medication.brandType === 'GENERIC' ? '🌿 Generic' : '🏛️ Ethical')}
                            </span>
                            {getScheduleBadge(item.medication.scheduleType)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                            {item.medication.genericName}
                          </div>

                          {/* Jan Aushadhi Switcher Button */}
                          {!item.isSubstituted && item.medication.janAushadhiEquivalent && (
                            <div style={{ marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleSwitchToJanAushadhi(item.id)}
                                style={{
                                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                  border: '1px solid var(--ds-color-success)',
                                  color: 'var(--ds-color-success)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>💡 Jan Aushadhi: Save {item.medication.janAushadhiEquivalent.savingsPercent}%</span>
                                <span style={{ textDecoration: 'underline' }}>Switch</span>
                              </button>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                          {(() => {
                            const medCodeClean = item.medication.id.replace('med-in-', '').toUpperCase();
                            const availableBatches = batches.filter(
                              (b) =>
                                (b.medicationId === item.medication.id ||
                                  b.medicationCode?.toUpperCase().includes(medCodeClean)) &&
                                b.status !== 'BLOCKED'
                            );
                            const isLowOrExceeded = item.selectedBatch.availableQuantity < item.quantity;

                            if (availableBatches.length > 1) {
                              return (
                                <div>
                                  <select
                                    value={item.selectedBatch.id}
                                    onChange={(e) => {
                                      const chosen = availableBatches.find((b) => b.id === e.target.value);
                                      if (chosen) {
                                        setCart((prev) =>
                                          prev.map((ci) => (ci.id === item.id ? { ...ci, selectedBatch: chosen } : ci))
                                        );
                                      }
                                    }}
                                    style={{
                                      backgroundColor: 'var(--ds-color-surface)',
                                      color: 'var(--ds-color-text-primary)',
                                      border: '1px solid var(--ds-color-border)',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      padding: '2px 4px',
                                      maxWidth: '120px'
                                    }}
                                  >
                                    {availableBatches.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.batchNumber} (Stock: {b.availableQuantity})
                                      </option>
                                    ))}
                                  </select>
                                  <div style={{ fontSize: '0.68rem', color: (item.selectedBatch.daysToExpiry ?? 999) < 60 ? 'var(--ds-color-danger)' : 'var(--ds-color-success)', marginTop: '2px' }}>
                                    Exp: {item.selectedBatch.expiryDate}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: isLowOrExceeded ? 'var(--ds-color-danger)' : 'var(--ds-color-accent)', fontWeight: isLowOrExceeded ? 700 : 400 }}>
                                    Avail: {item.selectedBatch.availableQuantity} {isLowOrExceeded ? '⚠️ Low' : ''}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--ds-color-text-secondary)', fontWeight: 600 }}>
                                  {item.selectedBatch.batchNumber}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: (item.selectedBatch.daysToExpiry ?? 999) < 60 ? 'var(--ds-color-danger)' : 'var(--ds-color-success)' }}>
                                  Exp: {item.selectedBatch.expiryDate}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: isLowOrExceeded ? 'var(--ds-color-danger)' : 'var(--ds-color-accent)', fontWeight: isLowOrExceeded ? 700 : 400 }}>
                                  Avail: {item.selectedBatch.availableQuantity} {isLowOrExceeded ? '⚠️ Insufficient' : ''}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        <td style={{ padding: '8px 6px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--ds-color-border)' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetPackMode(item.id, false);
                                }}
                                style={{
                                  padding: '6px 9px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  minHeight: '32px',
                                  border: 'none',
                                  backgroundColor: !item.isLoose ? 'var(--ds-color-success)' : 'var(--ds-color-surface-subtle)',
                                  color: !item.isLoose ? 'white' : 'var(--ds-color-text-muted)',
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease'
                                }}
                                title="Sell full strip pack [F2]"
                              >
                                📦 Strip
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetPackMode(item.id, true);
                                }}
                                style={{
                                  padding: '6px 9px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  minHeight: '32px',
                                  border: 'none',
                                  backgroundColor: item.isLoose ? 'var(--ds-color-primary)' : 'var(--ds-color-surface-subtle)',
                                  color: item.isLoose ? 'white' : 'var(--ds-color-text-muted)',
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease'
                                }}
                                title="Sell loose tablets - enter quantity and unit rate [F2]"
                              >
                                💊 Loose
                              </button>
                            </div>
                            <div style={{ fontSize: '0.66rem', color: 'var(--ds-color-text-muted)', textAlign: 'center' }}>
                              {item.medication.packUnits ? `1 Strip = ${item.medication.packUnits} Tabs` : item.medication.packConfiguration}
                              <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--ds-color-primary, #38BDF8)' }}>
                                [F2] toggle
                              </span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '8px 6px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateQty(item.id, Math.max(1, item.quantity - 1));
                                }}
                                style={{
                                  width: '28px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--ds-color-surface-hover)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 800,
                                  fontSize: '0.85rem'
                                }}
                                title="Decrease quantity (-)"
                              >
                                -
                              </button>
                              <input
                                id={`qty-input-${item.id}`}
                                type="text"
                                inputMode="decimal"
                                value={qtyInputMap[item.id] !== undefined ? qtyInputMap[item.id] : String(item.quantity)}
                                placeholder={item.isLoose ? "e.g. 4/10 or .4" : "e.g. 1 or 4/10"}
                                onFocus={(e) => e.target.select()}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleSmartQtyChange(item.id, e.target.value)}
                                onBlur={() => {
                                  setQtyInputMap((prev) => {
                                    const next = { ...prev };
                                    delete next[item.id];
                                    return next;
                                  });
                                }}
                                style={{
                                  width: '64px',
                                  height: '32px',
                                  padding: '2px 4px',
                                  fontSize: '0.88rem',
                                  fontWeight: 900,
                                  backgroundColor: 'var(--ds-color-surface)',
                                  color: item.isLoose ? 'var(--ds-color-accent)' : 'var(--ds-color-text-primary)',
                                  border: item.isLoose ? '1.5px solid var(--ds-color-accent)' : '1px solid var(--ds-color-border)',
                                  borderRadius: '4px',
                                  textAlign: 'center',
                                  boxShadow: item.isLoose ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none'
                                }}
                                title={item.isLoose ? "Enter loose count or fraction shortcut (e.g. 4/10, .4, 4t, 2, 5)" : "Enter strip count or fraction shortcut (e.g. 4/10, .4, 1)"}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateQty(item.id, item.quantity + 1);
                                }}
                                style={{
                                  width: '28px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--ds-color-surface-hover)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 800,
                                  fontSize: '0.85rem'
                                }}
                                title="Increase quantity (+)"
                              >
                                +
                              </button>
                            </div>

                            {/* Ultra-Fast Loose, Strip & Fraction Preset Pills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px', justifyContent: 'center', maxWidth: '140px' }}>
                              {/* Dedicated Blister Fraction Quick Pills */}
                              {(() => {
                                const pack = packUnits;
                                const fractionPresets = pack === 15
                                  ? [{ label: '3/15', tabs: 3 }, { label: '4/15', tabs: 4 }, { label: '5/15', tabs: 5 }]
                                  : pack === 6
                                  ? [{ label: '2/6', tabs: 2 }, { label: '3/6', tabs: 3 }, { label: '4/6', tabs: 4 }]
                                  : [{ label: '2/10', tabs: 2 }, { label: '4/10', tabs: 4 }, { label: '5/10', tabs: 5 }];

                                return fractionPresets.map((fp) => (
                                  <button
                                    key={fp.label}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetFractionQty(item.id, fp.tabs);
                                    }}
                                    style={{
                                      padding: '1px 5px',
                                      fontSize: '0.62rem',
                                      fontWeight: 800,
                                      borderRadius: '3px',
                                      border: (item.isLoose && item.quantity === fp.tabs) ? '1.5px solid #10B981' : '1px solid var(--ds-color-accent, #38BDF8)',
                                      backgroundColor: (item.isLoose && item.quantity === fp.tabs) ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.12)',
                                      color: (item.isLoose && item.quantity === fp.tabs) ? '#34D399' : 'var(--ds-color-accent, #38BDF8)',
                                      cursor: 'pointer'
                                    }}
                                    title={`Blister Fraction: ${fp.tabs} tabs of ${pack}`}
                                  >
                                    {fp.label}
                                  </button>
                                ));
                              })()}

                              {/* ½ Strip Shortcut */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetFractionQty(item.id, Math.max(1, Math.round(packUnits / 2)));
                                }}
                                style={{
                                  padding: '1px 5px',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  borderRadius: '3px',
                                  border: '1px solid var(--ds-color-accent, #38BDF8)',
                                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                  color: 'var(--ds-color-accent, #38BDF8)',
                                  cursor: 'pointer'
                                }}
                                title={`Fraction Shortcut: Half strip (${Math.round(packUnits / 2)} tabs)`}
                              >
                                ½s
                              </button>

                              {item.isLoose ? (
                                <>
                                  {[1, 2, 3, 5, 10].map((q) => (
                                    <button
                                      key={q}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateQty(item.id, q);
                                      }}
                                      style={{
                                        padding: '1px 5px',
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        borderRadius: '3px',
                                        border: item.quantity === q ? '1px solid var(--ds-color-primary, #38BDF8)' : '1px solid var(--ds-color-border)',
                                        backgroundColor: item.quantity === q ? 'var(--ds-color-primary, #38BDF8)' : 'var(--ds-color-surface-hover)',
                                        color: item.quantity === q ? '#0f172a' : 'var(--ds-color-text-secondary)',
                                        cursor: 'pointer'
                                      }}
                                      title={`Set ${q} loose tablets`}
                                    >
                                      {q}t
                                    </button>
                                  ))}
                                </>
                              ) : (
                                <>
                                  {[1, 2, 5].map((q) => (
                                    <button
                                      key={q}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateQty(item.id, q);
                                      }}
                                      style={{
                                        padding: '1px 5px',
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        borderRadius: '3px',
                                        border: item.quantity === q ? '1px solid var(--ds-color-success)' : '1px solid var(--ds-color-border)',
                                        backgroundColor: item.quantity === q ? 'var(--ds-color-success)' : 'var(--ds-color-surface-hover)',
                                        color: item.quantity === q ? 'white' : 'var(--ds-color-text-secondary)',
                                        cursor: 'pointer'
                                      }}
                                      title={`Set ${q} strips`}
                                    >
                                      {q}s
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>

                            <div style={{ fontSize: '0.66rem', color: item.isLoose ? 'var(--ds-color-accent)' : 'var(--ds-color-text-muted)', fontWeight: 700, textAlign: 'center' }}>
                              {item.isLoose ? (
                                <>
                                  <span>💊 {item.quantity} Loose Tabs</span>
                                  <span style={{ display: 'block', fontSize: '0.6rem', color: '#94A3B8' }}>
                                    Micro-stock: {(item.quantity / (item.medication.packUnits || 10)).toFixed(2)} strip
                                  </span>
                                </>
                              ) : (
                                <span>📦 {item.quantity} Strip{item.quantity > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '8px 6px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700 }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>₹</span>
                              <input
                                id={`rate-input-${item.id}`}
                                type="number"
                                min="0"
                                step={item.isLoose ? "0.1" : "0.5"}
                                value={item.rate}
                                onFocus={(e) => e.target.select()}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newRate = Math.max(0, parseFloat(e.target.value) || 0);
                                  setCart((prev) =>
                                    prev.map((ci) => (ci.id === item.id ? { ...ci, rate: newRate } : ci))
                                  );
                                }}
                                style={{
                                  width: '72px',
                                  height: '26px',
                                  padding: '2px 4px',
                                  fontSize: '0.85rem',
                                  backgroundColor: 'var(--ds-color-surface)',
                                  color: 'var(--ds-color-success)',
                                  border: item.isLoose ? '1.5px solid var(--ds-color-success)' : '1px solid var(--ds-color-border)',
                                  borderRadius: '4px',
                                  textAlign: 'right',
                                  fontWeight: 900
                                }}
                                title={item.isLoose ? `Enter loose tablet rate (₹/tab). Printed MRP: ₹${(item.isSubstituted && item.medication.janAushadhiEquivalent ? item.medication.janAushadhiEquivalent.unitPrice : item.medication.unitPrice).toFixed(2)}` : `Enter strip rate (₹/strip). Printed MRP: ₹${(item.isSubstituted && item.medication.janAushadhiEquivalent ? item.medication.janAushadhiEquivalent.mrp : item.medication.mrp).toFixed(2)}`}
                              />
                            </div>
                            <div style={{ fontSize: '0.66rem', color: 'var(--ds-color-text-muted)' }}>
                              {item.isLoose ? (
                                <span>
                                  ₹{(item.isSubstituted && item.medication.janAushadhiEquivalent ? item.medication.janAushadhiEquivalent.unitPrice : item.medication.unitPrice).toFixed(2)}/tab
                                  <span style={{ display: 'block', fontSize: '0.61rem', color: 'var(--ds-color-accent)' }}>
                                    Pack ₹{(item.isSubstituted && item.medication.janAushadhiEquivalent ? item.medication.janAushadhiEquivalent.mrp : item.medication.mrp).toFixed(2)} ÷ {item.medication.packUnits || 10}
                                  </span>
                                </span>
                              ) : (
                                <span>MRP: ₹{(item.isSubstituted && item.medication.janAushadhiEquivalent ? item.medication.janAushadhiEquivalent.mrp : item.medication.mrp).toFixed(2)}/strip</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '8px 6px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 800, color: 'var(--ds-color-accent)', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.95rem' }}>
                            ₹{(item.rate * item.quantity).toFixed(2)}
                          </div>
                          {item.isLoose && (
                            <div style={{ fontSize: '0.66rem', color: 'var(--ds-color-text-muted)' }}>
                              ({item.quantity} tabs × ₹{item.rate.toFixed(2)})
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCartItemId(item.id);
                              }}
                              title="Open Blister Cut Studio"
                              style={{
                                backgroundColor: (isActive || item.isLoose) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.12)',
                                border: (isActive || item.isLoose) ? '1px solid #10B981' : '1px solid var(--ds-color-border)',
                                color: (isActive || item.isLoose) ? '#34D399' : 'var(--ds-color-text-muted)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                padding: '3px 6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <span>✂️</span>
                              <span>Cut Studio</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSmartCounterTargetMed(item.medication);
                                setIsSmartCounterOpen(true);
                              }}
                              title="Visual Pill Count & Batch Scan with AI Camera"
                              style={{
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid var(--ds-color-primary)',
                                color: 'var(--ds-color-accent)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                padding: '3px 6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <span>📷</span>
                              <span>AI Count</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateQty(item.id, 0);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--ds-color-text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Interactive Visual Blister Cut & Strip Studio */}
                      {(isActive || item.isLoose) && (
                        <tr
                          key={`blister-studio-${item.id}`}
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            borderBottom: '2px solid rgba(56, 189, 248, 0.3)',
                            borderLeft: '3px solid var(--ds-color-primary, #38BDF8)'
                          }}
                        >
                          <td colSpan={8} style={{ padding: '8px 16px 12px 38px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* Header & Math Calculation */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1rem' }}>✂️</span>
                                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#F8FAFC' }}>
                                    Blister Pack Cut Studio:
                                  </span>
                                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                                    {item.medication.brandName} ({packUnits} Tabs/Strip)
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: item.isLoose ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                      color: item.isLoose ? '#38BDF8' : '#34D399',
                                      border: item.isLoose ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
                                    }}
                                  >
                                    {item.isLoose ? `✂️ Loose Cut: ${item.quantity}/${packUnits} Tabs` : '📦 Full Sealed Strip'}
                                  </span>
                                </div>

                                {/* Exact Pricing Calculation Math */}
                                <div style={{ fontSize: '0.76rem', color: '#E2E8F0', backgroundColor: '#1E293B', padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
                                  {item.isLoose ? (
                                    <span>
                                      Exact Math: <strong style={{ color: '#38BDF8' }}>{item.quantity} Tabs</strong> @ ₹{item.rate.toFixed(2)}/tab = <strong style={{ color: '#34D399' }}>₹{(item.rate * item.quantity).toFixed(2)}</strong> <span style={{ color: '#94A3B8' }}>(from ₹{item.medication.mrp.toFixed(2)}/strip of {packUnits})</span>
                                    </span>
                                  ) : (
                                    <span>
                                      Exact Math: <strong style={{ color: '#34D399' }}>{item.quantity} Strip{item.quantity > 1 ? 's' : ''}</strong> @ ₹{item.rate.toFixed(2)}/strip = <strong style={{ color: '#34D399' }}>₹{(item.rate * item.quantity).toFixed(2)}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Interactive Blister Bubble Grid & Quick Cut Pills */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                {/* Quick Fraction Pills */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>Quick Cuts:</span>
                                  {(() => {
                                    const pack = packUnits;
                                    const fractions = pack === 15
                                      ? [
                                          { label: '3/15 (3 tabs)', tabs: 3 },
                                          { label: '4/15 (4 tabs)', tabs: 4 },
                                          { label: '5/15 (⅓ strip)', tabs: 5 },
                                          { label: '10/15 (⅔ strip)', tabs: 10 },
                                          { label: 'Full Strip (15)', tabs: 15, isFull: true }
                                        ]
                                      : pack === 6
                                      ? [
                                          { label: '2/6 (2 tabs)', tabs: 2 },
                                          { label: '3/6 (½ strip)', tabs: 3 },
                                          { label: '4/6 (4 tabs)', tabs: 4 },
                                          { label: 'Full Strip (6)', tabs: 6, isFull: true }
                                        ]
                                      : [
                                          { label: '2/10 (2 tabs)', tabs: 2 },
                                          { label: '4/10 (4 tabs)', tabs: 4 },
                                          { label: '5/10 (½ strip)', tabs: 5 },
                                          { label: '7/10 (7 tabs)', tabs: 7 },
                                          { label: 'Full Strip (10)', tabs: 10, isFull: true }
                                        ];

                                    return fractions.map((frac) => {
                                      const isCurrent = (frac.isFull && !item.isLoose) || (!frac.isFull && item.isLoose && item.quantity === frac.tabs);
                                      return (
                                        <button
                                          key={frac.label}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (frac.isFull) {
                                              handleSetPackMode(item.id, false);
                                            } else {
                                              handleSetFractionQty(item.id, frac.tabs);
                                            }
                                          }}
                                          style={{
                                            padding: '3px 8px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            borderRadius: '5px',
                                            border: isCurrent ? '1.5px solid #10B981' : '1px solid #334155',
                                            backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.25)' : '#1E293B',
                                            color: isCurrent ? '#34D399' : '#CBD5E1',
                                            cursor: 'pointer',
                                            transition: 'all 0.12s ease'
                                          }}
                                        >
                                          {frac.label}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>

                                {/* Interactive Visual Blister Cut Strip */}
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 10px',
                                    backgroundColor: '#0B132B',
                                    borderRadius: '8px',
                                    border: '1.5px solid #334155',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)'
                                  }}
                                >
                                  <span style={{ fontSize: '0.68rem', color: '#94A3B8', marginRight: '4px', fontWeight: 700 }}>
                                    Blister Bubbles (Click Tab to Cut):
                                  </span>
                                  {(() => {
                                    const pack = packUnits;
                                    const activeCount = item.isLoose ? Math.min(item.quantity, pack) : pack;
                                    const bubbles = [];

                                    for (let i = 0; i < pack; i++) {
                                      const isSelected = i < activeCount;
                                      const isCutPoint = item.isLoose && i === activeCount - 1 && activeCount < pack;

                                      bubbles.push(
                                        <React.Fragment key={i}>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSetFractionQty(item.id, i + 1);
                                            }}
                                            title={`Tab #${i + 1} (${isSelected ? 'Dispensing' : 'Remaining'}). Click to cut at ${i + 1} tabs.`}
                                            style={{
                                              width: '24px',
                                              height: '24px',
                                              borderRadius: '50%',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: '0.62rem',
                                              fontWeight: 900,
                                              cursor: 'pointer',
                                              transition: 'all 0.1s ease',
                                              border: isSelected ? '1.5px solid #10B981' : '1px dashed #475569',
                                              backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(30, 41, 59, 0.5)',
                                              color: isSelected ? '#34D399' : '#64748B',
                                              boxShadow: isSelected ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none'
                                            }}
                                          >
                                            {i + 1}
                                          </button>
                                          {isCutPoint && (
                                            <div
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                margin: '0 3px',
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                                border: '1px dashed #EF4444'
                                              }}
                                              title="Physical Cut Line"
                                            >
                                              <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>✂️</span>
                                              <span style={{ fontSize: '0.6rem', color: '#F87171', fontWeight: 800, marginLeft: '2px' }}>CUT</span>
                                            </div>
                                          )}
                                        </React.Fragment>
                                      );
                                    }
                                    return bubbles;
                                  })()}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cart Summary Footer Ribbon */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--ds-color-surface)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: 'var(--ds-color-text-muted)'
                }}
              >
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span>📋 Meds: <strong style={{ color: 'var(--ds-color-text-primary)' }}>{cart.length}</strong></span>
                  <span>📦 Strips: <strong style={{ color: 'var(--ds-color-success)' }}>{cart.filter((c) => !c.isLoose).reduce((s, c) => s + c.quantity, 0)}</strong></span>
                  <span>💊 Loose Tabs: <strong style={{ color: 'var(--ds-color-accent)' }}>{cart.filter((c) => c.isLoose).reduce((s, c) => s + c.quantity, 0)}</strong></span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                  ⌨️ [F1] Search | [F2] Loose/Strip | [F4] Disc% | [F8] Mode | [Enter] Bill | [Esc] Clear
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Right: Payment, Tax Breakdown & Quick-Settle Terminal */}
        <div
          style={{
            position: isFullPage ? 'sticky' : 'relative',
            top: isFullPage ? '10px' : 'auto'
          }}
        >
          <Card padding="md">
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800 }}>
              💳 Payment & GST Settlement
            </h3>

            {/* Controlled Schedule Caution & Compliance Banner */}
            {containsControlledSchedule && (
              <div
                style={{
                  backgroundColor: containsScheduleX ? 'rgba(168, 85, 247, 0.15)' : containsScheduleH1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: `1px solid ${containsScheduleX ? '#A855F7' : containsScheduleH1 ? '#EF4444' : '#F59E0B'}`,
                  color: containsScheduleX ? '#D8B4FE' : containsScheduleH1 ? '#FCA5A5' : '#FCD34D',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>
                  {containsScheduleX ? '🔒 SCHEDULE X IN CART' : containsScheduleH1 ? '⚠️ SCHEDULE H1 IN CART' : '📋 SCHEDULE H IN CART'}: {doctorNmcReg ? `Dr. Reg #${doctorNmcReg} Verified` : 'Prescriber Required'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPrescriberPromptOpen(true)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    border: '1px solid currentColor',
                    color: 'inherit',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {doctorNmcReg ? 'Edit' : 'Set Dr.'}
                </button>
              </div>
            )}

            {/* Financial Breakdown */}
            <div style={{ backgroundColor: 'var(--ds-color-surface)', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--ds-color-text-muted)' }}>
                <span>Gross Subtotal:</span>
                <span>₹{calculations.subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Discount (%): [F4]</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    ref={discountInputRef}
                    type="number"
                    min="0"
                    max="50"
                    value={discountPercent}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDiscountPercent(Math.max(0, Math.min(50, Number(e.target.value))))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (cart.length > 0) {
                          handleCompleteSale();
                        } else {
                          searchInputRef.current?.focus();
                        }
                      }
                    }}
                    style={{ width: '52px', padding: '2px 4px', fontSize: '0.78rem', backgroundColor: 'var(--ds-color-surface-subtle)', color: 'white', border: '1px solid var(--ds-color-primary)', borderRadius: '4px', textAlign: 'right', fontWeight: 800 }}
                    title="Press F4 to focus discount input directly"
                  />
                  <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>%</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>
                <span>CGST (6% Inclusive):</span>
                <span>₹{calculations.cgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>
                <span>SGST (6% Inclusive):</span>
                <span>₹{calculations.sgst.toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '2px solid var(--ds-color-border)',
                  paddingTop: '8px',
                  marginTop: '4px'
                }}
              >
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ds-color-text-secondary)' }}>Net Payable:</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--ds-color-accent)', letterSpacing: '-0.02em' }}>
                  ₹{calculations.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ds-color-text-muted)' }}>
                Select Payment Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <Button
                  variant={paymentMode === 'UPI_QR' ? 'primary' : 'outline'}
                  onClick={() => setPaymentMode('UPI_QR')}
                  style={{ fontSize: '0.75rem', padding: '6px', minHeight: '36px' }}
                >
                  📱 UPI QR Code
                </Button>
                <Button
                  variant={paymentMode === 'CASH' ? 'primary' : 'outline'}
                  onClick={() => setPaymentMode('CASH')}
                  style={{ fontSize: '0.75rem', padding: '6px', minHeight: '36px' }}
                >
                  💵 Cash
                </Button>
                <Button
                  variant={paymentMode === 'CARD' ? 'primary' : 'outline'}
                  onClick={() => setPaymentMode('CARD')}
                  style={{ fontSize: '0.75rem', padding: '6px', minHeight: '36px' }}
                >
                  💳 Card
                </Button>
                <Button
                  variant={paymentMode === 'CREDIT_KHATA' ? 'primary' : 'outline'}
                  onClick={() => setPaymentMode('CREDIT_KHATA')}
                  style={{ fontSize: '0.75rem', padding: '6px', minHeight: '36px' }}
                >
                  📒 Credit / Ledger
                </Button>
              </div>
            </div>

            {/* Interactive Payment Mode Widgets */}
            {paymentMode === 'UPI_QR' && (
              <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '12px', borderRadius: '8px', marginBottom: '14px', color: 'black' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Scan to Pay with Any UPI App
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ds-color-primary)', marginBottom: '6px' }}>
                  ₹{calculations.grandTotal.toFixed(2)}
                </div>
                {/* Dynamic Authentic Indian UPI QR Code */}
                {(() => {
                  const dynamicUpiId = (partnerProfile?.upiId || '').trim() || (partnerProfile?.contactPhone ? `${partnerProfile.contactPhone.replace(/\D/g, '')}@upi` : 'counter@upi');
                  const dynamicMerchantName = (partnerProfile?.entityLegalName || currentUser?.tenantName || 'Pharmacy Counter').trim();
                  return (
                    <>
                      <div
                        style={{
                          width: '140px',
                          height: '140px',
                          margin: '0 auto',
                          border: '2px solid black',
                          padding: '6px',
                          backgroundColor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                            `upi://pay?pa=${dynamicUpiId}&pn=${encodeURIComponent(dynamicMerchantName)}&am=${calculations.grandTotal.toFixed(2)}&cu=INR`
                          )}`}
                          alt="UPI QR Code"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1E293B', marginTop: '6px' }}>
                        UPI ID: <span style={{ fontFamily: 'monospace' }}>{dynamicUpiId}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                        GPay • PhonePe • Paytm • BHIM
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {paymentMode === 'CASH' && (
              <div style={{ backgroundColor: 'var(--ds-color-surface)', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.78rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--ds-color-text-muted)' }}>Cash Tendered by Customer:</label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="e.g. 500 or 1000"
                />
                {changeToReturn > 0 && (
                  <div style={{ marginTop: '8px', padding: '6px', backgroundColor: 'var(--ds-color-success-subtle, rgba(34, 197, 94, 0.15))', borderRadius: '4px', color: 'var(--ds-color-success)', fontWeight: 800 }}>
                    💵 Return Change: ₹{changeToReturn.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {paymentMode === 'CREDIT_KHATA' && (() => {
              const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10);
              const khataAcc = cleanPhone ? pharmacyCreditKhataService.getAccountByPhone(cleanPhone) : undefined;
              const currentDue = khataAcc?.currentBalance || 0;
              const limit = khataAcc?.creditLimit || 5000;
              const projectedTotal = currentDue + calculations.grandTotal;
              const isLimitExceeded = limit > 0 && projectedTotal > limit;

              return (
                <div
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1.5px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '14px',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      📒 Customer Credit Khata (उधार खाता)
                    </span>
                    {khataAcc ? (
                      <Badge variant={khataAcc.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {khataAcc.status}
                      </Badge>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>New Khata Account</span>
                    )}
                  </div>

                  {!cleanPhone ? (
                    <div style={{ color: '#EF4444', fontWeight: 700, padding: '6px 8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', marginBottom: '8px' }}>
                      ⚠️ Customer Mobile Number is required for Khata billing! Please enter mobile number in customer details above.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ backgroundColor: '#1E293B', padding: '6px 8px', borderRadius: '4px' }}>
                        <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Current Due:</span>
                        <div style={{ fontWeight: 800, color: currentDue > 0 ? '#F59E0B' : '#10B981', fontSize: '0.9rem' }}>
                          ₹{currentDue.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#1E293B', padding: '6px 8px', borderRadius: '4px' }}>
                        <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Credit Limit:</span>
                        <div style={{ fontWeight: 800, color: '#E2E8F0', fontSize: '0.9rem' }}>
                          ₹{limit.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}

                  {cleanPhone && isLimitExceeded && (
                    <div
                      style={{
                        padding: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #EF4444',
                        borderRadius: '6px',
                        color: '#FCA5A5',
                        marginBottom: '8px',
                        fontSize: '0.75rem'
                      }}
                    >
                      <strong>⚠️ Credit Limit Breach:</strong> Projected total (₹{projectedTotal.toFixed(2)}) exceeds limit of ₹{limit.toFixed(2)} by ₹{(projectedTotal - limit).toFixed(2)}.
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', cursor: 'pointer', color: '#FEF08A' }}>
                        <input
                          type="checkbox"
                          checked={khataOverrideApproved}
                          onChange={(e) => setKhataOverrideApproved(e.target.checked)}
                        />
                        <span>Chemist Authorization: Approve Credit Extension</span>
                      </label>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.72rem', marginBottom: '3px' }}>
                      Medicines Taken By (वैकल्पिक - दवा लेने कौन आया):
                    </label>
                    <Input
                      value={medicinesTakenBy}
                      onChange={(e) => setMedicinesTakenBy(e.target.value)}
                      placeholder="e.g. Self, Son Rahul, Driver"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Settle / Complete Sale Button */}
            <Button
              variant="primary"
              onClick={handleCompleteSale}
              disabled={isSubmitting || cart.length === 0}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: 900,
                minHeight: '44px',
                backgroundColor: 'var(--ds-color-primary)',
                borderColor: 'var(--ds-color-accent)',
                boxShadow: '0 4px 18px rgba(2, 132, 199, 0.5)',
                cursor: isSubmitting || cart.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Generating Invoice...' : `⚡ Complete Sale & Print (₹${calculations.grandTotal.toFixed(2)}) [F9]`}
            </Button>
          </Card>
        </div>
      </div>

      {/* Invoice & Thermal Slip Modal */}
      <PharmacyInvoiceSlipModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setAutoPrintInvoice(false);
        }}
        invoiceData={completedInvoice}
        autoPrint={autoPrintInvoice}
        onNewSale={() => {
          setCart([]);
          setCashReceived('');
          setAutoPrintInvoice(false);
          searchInputRef.current?.focus();
        }}
      />

      {/* Dynamic Bill & Sales History Modal */}
      <PharmacySalesHistoryModal
        isOpen={isSalesHistoryOpen}
        onClose={() => setIsSalesHistoryOpen(false)}
        invoices={salesHistory}
        onSelectInvoice={(inv) => {
          setCompletedInvoice(inv);
          setAutoPrintInvoice(true);
          setIsInvoiceModalOpen(true);
          setIsSalesHistoryOpen(false);
        }}
        onDeleteInvoice={(invNum) => {
          setSalesHistory((prev) => {
            const filtered = prev.filter((p) => p.invoiceNumber !== invNum);
            try {
              localStorage.setItem('docsearch_pharmacy_invoices', JSON.stringify(filtered));
            } catch {
              // ignore
            }
            return filtered;
          });
        }}
        onClearHistory={() => {
          setSalesHistory([]);
          try {
            localStorage.removeItem('docsearch_pharmacy_invoices');
          } catch {
            // ignore
          }
        }}
      />

      {/* Webcam Blister & Pill Counting AI Smart Counter Modal */}
      <WebcamSmartCounterModal
        isOpen={isSmartCounterOpen}
        onClose={() => {
          setIsSmartCounterOpen(false);
          setSmartCounterTargetMed(null);
        }}
        targetMedication={smartCounterTargetMed}
        onCommitCount={handleCommitSmartCounter}
      />

      {/* 🧬 Generic Salt & Molecule Substitute Search Modal */}
      <GenericSaltSubstituteModal
        isOpen={isSaltSubstituteModalOpen}
        onClose={() => setIsSaltSubstituteModalOpen(false)}
        batches={batches}
        onSelectSubstitute={handleSelectSaltSubstitute}
      />

      {/* ⚡ Doctor e-Prescription Queue Live Importer Modal */}
      <DoctorPrescriptionQueueImporterModal
        isOpen={isDoctorRxModalOpen}
        onClose={() => setIsDoctorRxModalOpen(false)}
        batches={batches}
        availablePrescriptions={prescriptions}
        onImportPrescription={handleImportDoctorPrescription}
      />

      {/* 📷 AI Camera & WhatsApp Doctor Prescription OCR Modal (Gemini Vision) */}
      <PrescriptionCameraOcrModal
        isOpen={isCameraOcrModalOpen}
        onClose={() => setIsCameraOcrModalOpen(false)}
        batches={batches}
        onImportPrescription={handleImportOcrPrescription}
      />

      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName="Pharmacy Sale & Tax Invoice Dispatch"
        missingFields={profileMissingFields}
      />

      {/* ⚖️ Mandatory Prescriber Compliance Dialog (CDSCO & Rule 65) */}
      <MandatoryPrescriberComplianceModal
        isOpen={isPrescriberPromptOpen}
        onClose={() => setIsPrescriberPromptOpen(false)}
        triggerDrugName={prescriberTriggerDrug}
        triggerSchedule={prescriberTriggerSchedule}
        initialDoctorName={doctorName}
        initialDoctorNmcReg={doctorNmcReg}
        onConfirmPrescriber={(dName, dNmc) => {
          setDoctorName(dName);
          setDoctorNmcReg(dNmc);
          setNotification({
            type: 'success',
            message: `✓ Prescriber Verified: ${dName} (${dNmc}) - CDSCO compliant!`
          });
          setTimeout(() => setNotification(null), 4000);
        }}
      />

      {/* ⚖️ Drug Inspector (CDSCO / FDA) 1-Click Audit Vault Modal (F7) */}
      {isCdscoAuditVaultModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(5px)',
            zIndex: 10007,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '1300px',
              maxWidth: '100%',
              height: '94vh',
              backgroundColor: '#0F172A',
              border: '1.5px solid #10B981',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
            }}
          >
            <div
              style={{
                padding: '10px 20px',
                backgroundColor: '#1E293B',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>⚖️</span>
                <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>
                  Drug Inspector (CDSCO / FDA) Statutory Audit Vault [F7]
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setIsCdscoAuditVaultModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                ✕ Close Vault
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <CdscoDrugInspectorAuditVaultView currentUser={currentUser} />
            </div>
          </div>
        </div>
      )}

      {/* 📡 Offline-First PWA & Background Sync Vault Modal */}
      <PharmacyOfflineSyncModal
        isOpen={isOfflineSyncModalOpen}
        onClose={() => setIsOfflineSyncModalOpen(false)}
      />
    </div>
  );
};
