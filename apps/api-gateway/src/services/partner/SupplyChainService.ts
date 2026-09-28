import { SupplyChainRepository } from '../../repositories/partner/SupplyChainRepository.js';
import { AppError } from '@docsearch/shared-core';

export interface CreateWarehouseInput {
  code?: string;
  name: string;
  type?: string;
  departmentName: string;
  location?: string;
  isColdChain?: boolean;
  managerName?: string;
  contactNumber?: string;
  branchId?: string;
}

export interface CreateLocationInput {
  code: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  isTemperatureControlled?: boolean;
  minTempCelsius?: string | number;
  maxTempCelsius?: string | number;
}

export interface CreateVendorInput {
  vendorName: string;
  vendorCategory?: string;
  vendorType?: string;
  taxIdGstin?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  riskClassification?: string;
  branchId?: string;
}

export interface CreateItemInput {
  itemName: string;
  category?: string;
  unit?: string;
  standardCost?: string | number;
  reorderLevel?: number;
  safetyStock?: number;
  minStock?: number;
  maxStock?: number;
  isExpiryApplicable?: boolean;
  isBatchApplicable?: boolean;
  isControlled?: boolean;
  sku?: string;
  barcode?: string;
  branchId?: string;
}

export interface CreateRequisitionInput {
  departmentName: string;
  urgency?: string;
  notes?: string;
  branchId?: string;
  items: { procurementItemId: string; requestedQuantity: number; estimatedUnitCost?: string | number }[];
}

export interface CreatePurchaseOrderInput {
  vendorId: string;
  requisitionId?: string;
  deliveryLocation: string;
  expectedDeliveryDate?: string | Date;
  paymentTerms?: string;
  branchId?: string;
  isEmergency?: boolean;
  items: { procurementItemId: string; orderedQuantity: number; unitPrice: string | number }[];
}

export interface CreateGoodsReceiptInput {
  purchaseOrderId: string;
  warehouseId: string;
  receivingDepartment: string;
  storeName?: string;
  receivedBy: string;
  deliveryDocumentNumber?: string;
  branchId?: string;
  items: {
    purchaseOrderItemId: string;
    procurementItemId: string;
    receivedQuantity: number;
    acceptedQuantity?: number;
    rejectedQuantity?: number;
    batchNumber?: string;
    expiryDate?: string | Date;
    mfgDate?: string | Date;
    unitPrice?: string | number;
  }[];
}

export interface RecordConsumptionInput {
  warehouseId: string;
  departmentName: string;
  consumedBy: string;
  patientId?: string;
  encounterId?: string;
  procedureName?: string;
  notes?: string;
  branchId?: string;
  items: {
    procurementItemId: string;
    quantity: number;
    batchId?: string;
  }[];
}

export interface RequestTransferInput {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  requestingDepartment: string;
  requestedBy?: string;
  notes?: string;
  branchId?: string;
  items: { procurementItemId: string; requestedQuantity: number }[];
}

export interface InitiateRecallInput {
  procurementItemId: string;
  batchNumber: string;
  recallClass?: string;
  reason: string;
  initiatedBy?: string;
  dispositionAction?: string;
  branchId?: string;
}

export interface InitiateStockCountInput {
  warehouseId: string;
  countType?: string;
  initiatedBy?: string;
  notes?: string;
  branchId?: string;
}

export interface RecordStockCountInput {
  conductedBy?: string;
  counts: { procurementItemId: string; countedQuantity: number }[];
}

export class SupplyChainService {
  constructor(private readonly repo = new SupplyChainRepository()) {}

  // 1. KPI & Overview Metrics
  async getMetrics(tenantId: string) {
    if (!tenantId) {
      throw new AppError({ message: 'Tenant ID is required', statusCode: 400 });
    }
    return await this.repo.getMetrics(tenantId);
  }

  // 2. Warehouses & Storage Locations
  async getWarehouses(tenantId: string, filters?: { departmentName?: string; type?: string; status?: string }) {
    return await this.repo.getWarehouses(tenantId, filters);
  }

  async getWarehouseById(tenantId: string, id: string) {
    const warehouse = await this.repo.getWarehouseById(tenantId, id);
    if (!warehouse) {
      throw new AppError({ message: 'Warehouse not found', statusCode: 404 });
    }
    return warehouse;
  }

  async createWarehouse(tenantId: string, payload: CreateWarehouseInput) {
    if (!payload.name) {
      throw new AppError({ message: 'Warehouse name is required', statusCode: 400 });
    }
    if (!payload.departmentName) {
      throw new AppError({ message: 'Department name is required', statusCode: 400 });
    }
    const code = payload.code || `WH-${Date.now().toString().slice(-4)}`;
    return await this.repo.createWarehouse(tenantId, {
      code,
      name: payload.name,
      type: payload.type,
      departmentName: payload.departmentName,
      location: payload.location,
      isColdChain: payload.isColdChain,
      managerName: payload.managerName,
      contactNumber: payload.contactNumber,
      branchId: payload.branchId
    });
  }

  async getLocations(tenantId: string, warehouseId: string) {
    return await this.repo.getLocations(tenantId, warehouseId);
  }

  async createLocation(tenantId: string, warehouseId: string, payload: CreateLocationInput) {
    if (!payload.code) {
      throw new AppError({ message: 'Location code is required', statusCode: 400 });
    }
    return await this.repo.createLocation(tenantId, warehouseId, {
      code: payload.code,
      zone: payload.zone,
      aisle: payload.aisle,
      rack: payload.rack,
      shelf: payload.shelf,
      bin: payload.bin,
      isTemperatureControlled: payload.isTemperatureControlled,
      minTempCelsius: payload.minTempCelsius,
      maxTempCelsius: payload.maxTempCelsius
    });
  }

  // 3. Vendors & Item Master
  async getVendors(tenantId: string) {
    return await this.repo.getVendors(tenantId);
  }

  async createVendor(tenantId: string, payload: CreateVendorInput) {
    if (!payload.vendorName) {
      throw new AppError({ message: 'Vendor name is required', statusCode: 400 });
    }
    return await this.repo.createVendor(tenantId, {
      vendorName: payload.vendorName,
      vendorCategory: payload.vendorCategory,
      vendorType: payload.vendorType,
      taxIdGstin: payload.taxIdGstin,
      contactPerson: payload.contactPerson,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      riskClassification: payload.riskClassification,
      branchId: payload.branchId
    });
  }

  async getItems(tenantId: string, category?: string) {
    return await this.repo.getItems(tenantId, category);
  }

  async getItemById(tenantId: string, id: string) {
    const item = await this.repo.getItemById(tenantId, id);
    if (!item) {
      throw new AppError({ message: 'Item not found', statusCode: 404 });
    }
    return item;
  }

  async createItem(tenantId: string, payload: CreateItemInput) {
    if (!payload.itemName) {
      throw new AppError({ message: 'Item name is required', statusCode: 400 });
    }
    return await this.repo.createItem(tenantId, {
      itemName: payload.itemName,
      category: payload.category,
      unit: payload.unit,
      standardCost: payload.standardCost,
      reorderLevel: payload.reorderLevel,
      safetyStock: payload.safetyStock,
      minStock: payload.minStock,
      maxStock: payload.maxStock,
      isExpiryApplicable: payload.isExpiryApplicable,
      isBatchApplicable: payload.isBatchApplicable,
      isControlled: payload.isControlled,
      sku: payload.sku,
      barcode: payload.barcode,
      branchId: payload.branchId
    });
  }

  // 4. Requisitions & Purchase Orders
  async getRequisitions(tenantId: string) {
    return await this.repo.getRequisitions(tenantId);
  }

  async createRequisition(tenantId: string, payload: CreateRequisitionInput) {
    if (!payload.departmentName) {
      throw new AppError({ message: 'Department name is required', statusCode: 400 });
    }
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new AppError({ message: 'Requisition must include at least one item', statusCode: 400 });
    }
    return await this.repo.createRequisition(tenantId, {
      departmentName: payload.departmentName,
      urgency: payload.urgency,
      notes: payload.notes,
      branchId: payload.branchId,
      items: payload.items
    });
  }

  async approveRequisition(tenantId: string, id: string, actorId: string) {
    const updated = await this.repo.approveRequisition(tenantId, id, actorId);
    if (!updated) {
      throw new AppError({ message: 'Requisition not found or could not be approved', statusCode: 404 });
    }
    return updated;
  }

  async getPurchaseOrders(tenantId: string) {
    return await this.repo.getPurchaseOrders(tenantId);
  }

  async createPurchaseOrder(tenantId: string, payload: CreatePurchaseOrderInput) {
    if (!payload.vendorId) {
      throw new AppError({ message: 'Vendor ID is required', statusCode: 400 });
    }
    if (!payload.deliveryLocation) {
      throw new AppError({ message: 'Delivery location is required', statusCode: 400 });
    }
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new AppError({ message: 'Purchase order must have items', statusCode: 400 });
    }
    return await this.repo.createPurchaseOrder(tenantId, {
      vendorId: payload.vendorId,
      requisitionId: payload.requisitionId,
      deliveryLocation: payload.deliveryLocation,
      expectedDeliveryDate: new Date(payload.expectedDeliveryDate || (Date.now() + 7 * 86400000)),
      paymentTerms: payload.paymentTerms,
      branchId: payload.branchId,
      isEmergency: payload.isEmergency,
      items: payload.items
    });
  }

  async approvePurchaseOrder(tenantId: string, id: string, actorId: string) {
    const updated = await this.repo.approvePurchaseOrder(tenantId, id, actorId);
    if (!updated) {
      throw new AppError({ message: 'Purchase order not found or could not be approved', statusCode: 404 });
    }
    return updated;
  }

  // 5. Goods Receipt Note (GRN)
  async getGoodsReceipts(tenantId: string) {
    return await this.repo.getGoodsReceipts(tenantId);
  }

  async createGoodsReceipt(tenantId: string, payload: CreateGoodsReceiptInput) {
    if (!payload.purchaseOrderId) {
      throw new AppError({ message: 'Purchase order ID is required', statusCode: 400 });
    }
    if (!payload.warehouseId) {
      throw new AppError({ message: 'Target warehouse ID is required', statusCode: 400 });
    }
    if (!payload.receivingDepartment) {
      throw new AppError({ message: 'Receiving department is required', statusCode: 400 });
    }
    if (!payload.receivedBy) {
      throw new AppError({ message: 'Received by username/id is required', statusCode: 400 });
    }
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new AppError({ message: 'GRN must contain items', statusCode: 400 });
    }

    const items = payload.items.map((i) => ({
      purchaseOrderItemId: i.purchaseOrderItemId,
      procurementItemId: i.procurementItemId,
      receivedQuantity: Number(i.receivedQuantity || 0),
      acceptedQuantity: Number(i.acceptedQuantity ?? i.receivedQuantity ?? 0),
      rejectedQuantity: Number(i.rejectedQuantity || 0),
      batchNumber: String(i.batchNumber || `BAT-${Date.now().toString().slice(-4)}`),
      expiryDate: new Date(i.expiryDate || (Date.now() + 365 * 86400000)),
      mfgDate: i.mfgDate ? new Date(i.mfgDate) : undefined,
      unitPrice: String(i.unitPrice || '0.00')
    }));

    return await this.repo.createGoodsReceipt(tenantId, {
      purchaseOrderId: payload.purchaseOrderId,
      warehouseId: payload.warehouseId,
      receivingDepartment: payload.receivingDepartment,
      storeName: payload.storeName || 'Main Store',
      receivedBy: payload.receivedBy,
      deliveryDocumentNumber: payload.deliveryDocumentNumber,
      branchId: payload.branchId,
      items
    });
  }

  // 6. Unified Inventory, Batches & FEFO Picking
  async getInventory(tenantId: string, warehouseId?: string) {
    return await this.repo.getInventory(tenantId, warehouseId);
  }

  async getBatches(tenantId: string, warehouseId?: string, procurementItemId?: string) {
    return await this.repo.getBatches(tenantId, warehouseId, procurementItemId);
  }

  async getFefoBatches(tenantId: string, warehouseId: string, procurementItemId: string) {
    if (!warehouseId || !procurementItemId) {
      throw new AppError({ message: 'Warehouse ID and Procurement Item ID are required', statusCode: 400 });
    }
    return await this.repo.getFefoBatches(tenantId, warehouseId, procurementItemId);
  }

  async getStockLedger(tenantId: string, warehouseId?: string, procurementItemId?: string) {
    return await this.repo.getStockLedger(tenantId, warehouseId, procurementItemId);
  }

  // 7. Multi-Department Material Consumption
  async recordConsumption(tenantId: string, payload: RecordConsumptionInput) {
    if (!payload.warehouseId) {
      throw new AppError({ message: 'Warehouse ID is required', statusCode: 400 });
    }
    if (!payload.departmentName) {
      throw new AppError({ message: 'Department name is required', statusCode: 400 });
    }
    if (!payload.consumedBy) {
      throw new AppError({ message: 'Consumed by is required', statusCode: 400 });
    }
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new AppError({ message: 'Consumption must include at least one item', statusCode: 400 });
    }

    return await this.repo.recordConsumption(tenantId, {
      warehouseId: payload.warehouseId,
      departmentName: payload.departmentName,
      consumedBy: payload.consumedBy,
      patientId: payload.patientId,
      encounterId: payload.encounterId,
      procedureName: payload.procedureName,
      notes: payload.notes,
      branchId: payload.branchId,
      items: payload.items
    });
  }

  async getConsumptions(tenantId: string, departmentName?: string) {
    return await this.repo.getConsumptions(tenantId, departmentName);
  }

  // 8. Inter-Store Transfers
  async requestTransfer(tenantId: string, payload: RequestTransferInput) {
    if (!payload.sourceWarehouseId || !payload.destinationWarehouseId) {
      throw new AppError({ message: 'Source and destination warehouses are required', statusCode: 400 });
    }
    if (payload.sourceWarehouseId === payload.destinationWarehouseId) {
      throw new AppError({ message: 'Source and destination warehouses cannot be the same', statusCode: 400 });
    }
    if (!payload.requestingDepartment) {
      throw new AppError({ message: 'Requesting department is required', statusCode: 400 });
    }
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new AppError({ message: 'Transfer items are required', statusCode: 400 });
    }
    return await this.repo.requestTransfer(tenantId, {
      sourceWarehouseId: payload.sourceWarehouseId,
      destinationWarehouseId: payload.destinationWarehouseId,
      requestingDepartment: payload.requestingDepartment,
      requestedBy: payload.requestedBy || 'Store Staff',
      notes: payload.notes,
      branchId: payload.branchId,
      items: payload.items
    });
  }

  async approveTransfer(tenantId: string, id: string, actorId: string) {
    const updated = await this.repo.approveTransfer(tenantId, id, actorId);
    if (!updated) {
      throw new AppError({ message: 'Transfer not found or cannot be approved', statusCode: 404 });
    }
    return updated;
  }

  async dispatchTransfer(tenantId: string, id: string, actorId: string) {
    return await this.repo.dispatchTransfer(tenantId, id, actorId);
  }

  async receiveTransfer(tenantId: string, id: string, actorId: string) {
    return await this.repo.receiveTransfer(tenantId, id, actorId);
  }

  async getTransfers(tenantId: string) {
    return await this.repo.getTransfers(tenantId);
  }

  // 9. Batch Recalls & Quarantines
  async initiateBatchRecall(tenantId: string, payload: InitiateRecallInput) {
    if (!payload.procurementItemId) {
      throw new AppError({ message: 'Procurement item ID is required', statusCode: 400 });
    }
    if (!payload.batchNumber) {
      throw new AppError({ message: 'Batch number is required', statusCode: 400 });
    }
    if (!payload.reason) {
      throw new AppError({ message: 'Recall reason is required', statusCode: 400 });
    }
    return await this.repo.initiateBatchRecall(tenantId, {
      procurementItemId: payload.procurementItemId,
      batchNumber: payload.batchNumber,
      recallClass: payload.recallClass,
      reason: payload.reason,
      initiatedBy: payload.initiatedBy || 'Safety Officer',
      dispositionAction: payload.dispositionAction,
      branchId: payload.branchId
    });
  }

  async getRecalls(tenantId: string) {
    return await this.repo.getRecalls(tenantId);
  }

  // 10. Physical Stock Counts & Reconciliations
  async initiateStockCount(tenantId: string, payload: InitiateStockCountInput) {
    if (!payload.warehouseId) {
      throw new AppError({ message: 'Warehouse ID is required', statusCode: 400 });
    }
    return await this.repo.initiateStockCount(tenantId, {
      warehouseId: payload.warehouseId,
      countType: payload.countType,
      initiatedBy: payload.initiatedBy || 'Auditor',
      notes: payload.notes,
      branchId: payload.branchId
    });
  }

  async recordStockCountResults(tenantId: string, id: string, payload: RecordStockCountInput) {
    if (!payload.counts || !Array.isArray(payload.counts)) {
      throw new AppError({ message: 'Counts array is required', statusCode: 400 });
    }
    return await this.repo.recordStockCountResults(tenantId, id, {
      conductedBy: payload.conductedBy || 'Counting Team',
      counts: payload.counts
    });
  }

  async reconcileStockCount(tenantId: string, id: string, actorId: string) {
    return await this.repo.reconcileStockCount(tenantId, id, actorId);
  }

  async getStockCounts(tenantId: string) {
    return await this.repo.getStockCounts(tenantId);
  }

  // 11. Expiry & Reorder Dashboards
  async getExpiryAlerts(tenantId: string, daysThreshold?: number) {
    return await this.repo.getExpiryAlerts(tenantId, daysThreshold || 30);
  }

  async getReorderAlerts(tenantId: string) {
    return await this.repo.getReorderAlerts(tenantId);
  }
}
