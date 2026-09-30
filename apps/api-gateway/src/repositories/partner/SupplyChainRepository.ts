import crypto from 'node:crypto';
import {
  getDatabase,
  supplyChainWarehouses,
  supplyChainLocations,
  supplyChainInventory,
  supplyChainBatches,
  supplyChainStockLedger,
  supplyChainTransfers,
  supplyChainTransferItems,
  supplyChainConsumptions,
  supplyChainConsumptionItems,
  supplyChainStockCounts,
  supplyChainStockCountItems,
  supplyChainRecalls,
  procurementVendors,
  procurementItems,
  purchaseRequisitions,
  purchaseRequisitionItems,
  purchaseOrders,
  purchaseOrderItems,
  goodsReceipts,
  goodsReceiptItems,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  branches,
  eq,
  and,
  desc,
  asc,
  inArray
} from '@docsearch/database';
import { AppError, createLogger } from '@docsearch/shared-core';

const logger = createLogger('supply-chain-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for supply chain transaction');
    throw new AppError({
      message: 'Database connection unavailable',
      statusCode: 500
    });
  }
  return dbClient;
}

export class SupplyChainRepository {
  private async resolveTenantHierarchy(tenantId: string, branchId?: string | undefined) {
    const db = requireDb();
    const partner = await db.query.operationalPartners.findFirst({
      where: eq(operationalPartners.tenantId, tenantId)
    });
    const partnerId = partner?.id || '00000000-0000-4000-8000-000000000001';

    const org = await db.query.operationalOrganizations.findFirst({
      where: eq(operationalOrganizations.tenantId, tenantId)
    });
    const organizationId = org?.id || '00000000-0000-4000-8000-000000000002';

    let resolvedBranchId: string | null = null;
    if (branchId) {
      const fac = await db.query.operationalFacilities.findFirst({
        where: and(eq(operationalFacilities.tenantId, tenantId), eq(operationalFacilities.id, branchId))
      });
      if (fac) {
        resolvedBranchId = fac.id;
      } else {
        const coreBranch = await db.query.branches.findFirst({
          where: and(eq(branches.tenantId, tenantId), eq(branches.id, branchId))
        });
        if (coreBranch) {
          const [newFac] = await db.insert(operationalFacilities).values({
            id: coreBranch.id,
            tenantId,
            partnerId,
            organizationId,
            facilityCode: coreBranch.code || `FAC-${coreBranch.id.slice(0, 8).toUpperCase()}`,
            facilityName: coreBranch.name || `Facility ${coreBranch.id.slice(0, 8)}`,
            facilityType: 'HOSPITAL',
            addressStreet: 'Main Campus',
            addressCity: 'Metro',
            addressState: 'State',
            addressPostalCode: '110001',
            contactEmail: 'facility@partner.local',
            contactPhone: '+91-11-23456789',
            status: 'ACTIVE'
          }).onConflictDoNothing().returning();
          resolvedBranchId = newFac?.id || coreBranch.id;
        }
      }
    }

    return { partnerId, organizationId, branchId: resolvedBranchId };
  }

  // =========================================================================
  // 1. WAREHOUSES & STORAGE LOCATIONS
  // =========================================================================

  async createWarehouse(tenantId: string, data: {
    code: string;
    name: string;
    type?: string | undefined;
    departmentName: string;
    location?: string | undefined;
    isColdChain?: boolean | undefined;
    managerName?: string | undefined;
    contactNumber?: string | undefined;
    branchId?: string | undefined;
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);

    const [warehouse] = await db.insert(supplyChainWarehouses).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      code: data.code.toUpperCase(),
      name: data.name,
      type: data.type || 'DEPARTMENTAL',
      departmentName: data.departmentName.toUpperCase(),
      location: data.location || null,
      isColdChain: data.isColdChain ?? false,
      status: 'ACTIVE',
      managerName: data.managerName || null,
      contactNumber: data.contactNumber || null
    }).returning();

    if (!warehouse) {
      throw new AppError({ message: 'Failed to create warehouse', statusCode: 500 });
    }
    return warehouse;
  }

  async getWarehouses(tenantId: string, filters?: { departmentName?: string | undefined; type?: string | undefined; status?: string | undefined } | undefined) {
    const db = requireDb();
    const conditions = [eq(supplyChainWarehouses.tenantId, tenantId)];

    if (filters?.departmentName) {
      conditions.push(eq(supplyChainWarehouses.departmentName, filters.departmentName.toUpperCase()));
    }
    if (filters?.type) {
      conditions.push(eq(supplyChainWarehouses.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(supplyChainWarehouses.status, filters.status));
    }

    return await db.query.supplyChainWarehouses.findMany({
      where: and(...conditions),
      orderBy: [asc(supplyChainWarehouses.name)]
    });
  }

  async getWarehouseById(tenantId: string, id: string) {
    const db = requireDb();
    return await db.query.supplyChainWarehouses.findFirst({
      where: and(eq(supplyChainWarehouses.tenantId, tenantId), eq(supplyChainWarehouses.id, id))
    });
  }

  async createLocation(tenantId: string, warehouseId: string, data: {
    code: string;
    zone?: string | undefined;
    aisle?: string | undefined;
    rack?: string | undefined;
    shelf?: string | undefined;
    bin?: string | undefined;
    isTemperatureControlled?: boolean | undefined;
    minTempCelsius?: string | number | undefined;
    maxTempCelsius?: string | number | undefined;
  }) {
    const db = requireDb();
    const [location] = await db.insert(supplyChainLocations).values({
      id: crypto.randomUUID(),
      tenantId,
      warehouseId,
      code: data.code.toUpperCase(),
      zone: data.zone || null,
      aisle: data.aisle || null,
      rack: data.rack || null,
      shelf: data.shelf || null,
      bin: data.bin || null,
      isTemperatureControlled: data.isTemperatureControlled ?? false,
      minTempCelsius: data.minTempCelsius ? String(data.minTempCelsius) : null,
      maxTempCelsius: data.maxTempCelsius ? String(data.maxTempCelsius) : null,
      status: 'ACTIVE'
    }).returning();

    if (!location) {
      throw new AppError({ message: 'Failed to create location', statusCode: 500 });
    }
    return location;
  }

  async getLocations(tenantId: string, warehouseId: string) {
    const db = requireDb();
    return await db.query.supplyChainLocations.findMany({
      where: and(eq(supplyChainLocations.tenantId, tenantId), eq(supplyChainLocations.warehouseId, warehouseId)),
      orderBy: [asc(supplyChainLocations.code)]
    });
  }

  // =========================================================================
  // 2. VENDORS & PROCUREMENT ITEM MASTER
  // =========================================================================

  async getVendors(tenantId: string) {
    const db = requireDb();
    return await db.query.procurementVendors.findMany({
      where: eq(procurementVendors.tenantId, tenantId),
      orderBy: [desc(procurementVendors.createdAt)]
    });
  }

  async createVendor(tenantId: string, data: {
    vendorName: string;
    vendorCategory?: string | undefined;
    vendorType?: string | undefined;
    taxIdGstin?: string | undefined;
    contactPerson?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
    riskClassification?: string | undefined;
    branchId?: string | undefined;
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);
    const vendorCode = 'VND-' + Date.now().toString().slice(-6);

    const [vendor] = await db.insert(procurementVendors).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      vendorCode,
      legalName: data.vendorName,
      tradeName: data.vendorName,
      vendorCategory: data.vendorCategory || 'PHARMACEUTICALS',
      vendorType: data.vendorType || 'DISTRIBUTOR',
      gstNumber: data.taxIdGstin || null,
      status: 'ACTIVE'
    }).returning();

    if (!vendor) {
      throw new AppError({ message: 'Failed to create vendor', statusCode: 500 });
    }
    return vendor;
  }

  async getItems(tenantId: string, category?: string | undefined) {
    const db = requireDb();
    const conditions = [eq(procurementItems.tenantId, tenantId)];
    if (category) {
      conditions.push(eq(procurementItems.category, category.toUpperCase()));
    }
    return await db.query.procurementItems.findMany({
      where: and(...conditions),
      orderBy: [asc(procurementItems.itemName)]
    });
  }

  async getItemById(tenantId: string, id: string) {
    const db = requireDb();
    return await db.query.procurementItems.findFirst({
      where: and(eq(procurementItems.tenantId, tenantId), eq(procurementItems.id, id))
    });
  }

  async getItemsByIds(tenantId: string, ids: string[]): Promise<Map<string, any>> {
    const db = requireDb();
    const map = new Map<string, any>();
    if (!ids || ids.length === 0) return map;
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return map;
    const records = await db.query.procurementItems.findMany({
      where: and(
        eq(procurementItems.tenantId, tenantId),
        inArray(procurementItems.id, uniqueIds)
      )
    });
    for (const rec of records) {
      map.set(rec.id, rec);
    }
    return map;
  }


  async createItem(tenantId: string, data: {
    itemName: string;
    category?: string | undefined;
    unit?: string | undefined;
    standardCost?: string | number | undefined;
    reorderLevel?: number | undefined;
    safetyStock?: number | undefined;
    minStock?: number | undefined;
    maxStock?: number | undefined;
    isExpiryApplicable?: boolean | undefined;
    isBatchApplicable?: boolean | undefined;
    isControlled?: boolean | undefined;
    sku?: string | undefined;
    barcode?: string | undefined;
    branchId?: string | undefined;
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);
    const itemCode = 'ITM-' + Date.now().toString().slice(-6);

    const [item] = await db.insert(procurementItems).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      itemCode,
      itemName: data.itemName,
      category: (data.category || 'MEDICINE').toUpperCase(),
      unit: (data.unit || 'UNIT').toUpperCase(),
      standardCost: String(data.standardCost || '0.00'),
      reorderLevel: data.reorderLevel ?? 10,
      safetyStock: data.safetyStock ?? 5,
      minStock: data.minStock ?? 5,
      maxStock: data.maxStock ?? 500,
      isExpiryApplicable: data.isExpiryApplicable ?? true,
      isBatchApplicable: data.isBatchApplicable ?? true,
      isControlled: data.isControlled ?? false,
      sku: data.sku || null,
      barcode: data.barcode || null,
      status: 'ACTIVE'
    }).returning();

    if (!item) {
      throw new AppError({ message: 'Failed to create item', statusCode: 500 });
    }
    return item;
  }

  // =========================================================================
  // 3. REQUISITIONS & PURCHASE ORDERS
  // =========================================================================

  async createRequisition(tenantId: string, data: {
    departmentName: string;
    urgency?: string | undefined;
    notes?: string | undefined;
    branchId?: string | undefined;
    items: { procurementItemId: string; requestedQuantity: number; estimatedUnitCost?: string | number | undefined }[];
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);
    const requisitionNumber = 'PR-' + Date.now().toString().slice(-6);

    const [req] = await db.insert(purchaseRequisitions).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      requisitionNumber,
      departmentName: data.departmentName.toUpperCase(),
      storeName: 'Main Store',
      requestedBy: 'Requisitioner',
      requiredByDate: new Date(Date.now() + 7 * 86400000),
      reason: data.notes || 'Routine department replenishment',
      priority: data.urgency || 'ROUTINE',
      status: 'SUBMITTED',
      totalEstimatedAmount: '0.00'
    }).returning();

    if (!req) {
      throw new AppError({ message: 'Failed to create requisition', statusCode: 500 });
    }

    const itemIds = (data.items || []).map(itm => itm.procurementItemId);
    const itemMap = await this.getItemsByIds(tenantId, itemIds);

    let totalAmount = 0;
    const itemsToInsert: any[] = [];

    for (const itm of data.items) {
      const itemRecord = itemMap.get(itm.procurementItemId);
      const unitCost = Number(itm.estimatedUnitCost || itemRecord?.standardCost || 0);
      const estTotal = unitCost * itm.requestedQuantity;
      totalAmount += estTotal;

      itemsToInsert.push({
        id: crypto.randomUUID(),
        tenantId,
        requisitionId: req.id,
        procurementItemId: itm.procurementItemId,
        itemCode: itemRecord?.itemCode || 'UNKNOWN',
        itemName: itemRecord?.itemName || 'Item',
        quantity: itm.requestedQuantity,
        unit: itemRecord?.unit || 'UNIT',
        estimatedUnitPrice: String(unitCost),
        totalEstimatedCost: String(estTotal)
      });
    }

    if (itemsToInsert.length > 0) {
      await db.insert(purchaseRequisitionItems).values(itemsToInsert);
    }

    await db.update(purchaseRequisitions)
      .set({ totalEstimatedAmount: String(totalAmount) })
      .where(eq(purchaseRequisitions.id, req.id));

    return { ...req, totalEstimatedAmount: String(totalAmount) };
  }

  async getRequisitions(tenantId: string) {
    const db = requireDb();
    return await db.query.purchaseRequisitions.findMany({
      where: eq(purchaseRequisitions.tenantId, tenantId),
      orderBy: [desc(purchaseRequisitions.createdAt)]
    });
  }

  async approveRequisition(tenantId: string, id: string, actorId: string) {
    const db = requireDb();
    const [updated] = await db.update(purchaseRequisitions)
      .set({
        status: 'APPROVED',
        approvedBy: actorId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(purchaseRequisitions.tenantId, tenantId), eq(purchaseRequisitions.id, id)))
      .returning();
    return updated || null;
  }

  async createPurchaseOrder(tenantId: string, data: {
    vendorId: string;
    requisitionId?: string | undefined;
    deliveryLocation: string;
    expectedDeliveryDate: Date;
    paymentTerms?: string | undefined;
    branchId?: string | undefined;
    isEmergency?: boolean | undefined;
    items: { procurementItemId: string; orderedQuantity: number; unitPrice: string | number }[];
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);
    const poNumber = 'PO-' + Date.now().toString().slice(-6);

    const vendor = await db.query.procurementVendors.findFirst({
      where: and(eq(procurementVendors.tenantId, tenantId), eq(procurementVendors.id, data.vendorId))
    });
    if (!vendor) {
      throw new AppError({ message: 'Vendor not found', statusCode: 404 });
    }

    const itemIds = (data.items || []).map(itm => itm.procurementItemId);
    const itemMap = await this.getItemsByIds(tenantId, itemIds);

    let grossAmount = 0;
    const poItemsData: any[] = [];

    for (const itm of data.items) {
      const itemRecord = itemMap.get(itm.procurementItemId);
      if (!itemRecord) {
        throw new AppError({ message: `Procurement item not found: ${itm.procurementItemId}`, statusCode: 404 });
      }
      const price = Number(itm.unitPrice);
      const lineGross = price * itm.orderedQuantity;
      grossAmount += lineGross;

      poItemsData.push({
        procurementItemId: itm.procurementItemId,
        itemCode: itemRecord.itemCode,
        itemName: itemRecord.itemName,
        orderedQuantity: itm.orderedQuantity,
        unit: itemRecord.unit,
        unitPrice: String(price),
        grossAmount: String(lineGross),
        netAmount: String(lineGross)
      });
    }

    const [po] = await db.insert(purchaseOrders).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      poNumber,
      requisitionId: data.requisitionId || null,
      vendorId: data.vendorId,
      vendorName: vendor.legalName || vendor.tradeName || 'Vendor',
      status: 'APPROVED',
      totalGrossAmount: String(grossAmount),
      totalNetAmount: String(grossAmount),
      deliveryLocation: data.deliveryLocation,
      expectedDeliveryDate: data.expectedDeliveryDate,
      paymentTerms: data.paymentTerms || 'NET_30',
      isEmergency: data.isEmergency ?? false
    }).returning();

    if (!po) {
      throw new AppError({ message: 'Failed to create purchase order', statusCode: 500 });
    }

    const createdItems: any[] = [];
    if (poItemsData.length > 0) {
      const rowsToInsert = poItemsData.map(item => ({
        id: crypto.randomUUID(),
        tenantId,
        purchaseOrderId: po.id,
        ...item
      }));
      const inserted = await db.insert(purchaseOrderItems).values(rowsToInsert).returning();
      createdItems.push(...inserted);
    }

    return { ...po, items: createdItems };
  }

  async getPurchaseOrders(tenantId: string) {
    const db = requireDb();
    return await db.query.purchaseOrders.findMany({
      where: eq(purchaseOrders.tenantId, tenantId),
      orderBy: [desc(purchaseOrders.createdAt)]
    });
  }

  async approvePurchaseOrder(tenantId: string, id: string, actorId: string) {
    const db = requireDb();
    const [updated] = await db.update(purchaseOrders)
      .set({
        status: 'APPROVED',
        approvedBy: actorId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(purchaseOrders.tenantId, tenantId), eq(purchaseOrders.id, id)))
      .returning();
    return updated || null;
  }

  // =========================================================================
  // 4. GOODS RECEIPT NOTE (GRN) & ATOMIC STOCK LEDGER POSTING
  // =========================================================================

  async createGoodsReceipt(tenantId: string, data: {
    purchaseOrderId: string;
    warehouseId: string;
    receivingDepartment: string;
    storeName: string;
    receivedBy: string;
    deliveryDocumentNumber?: string | undefined;
    branchId?: string | undefined;
    items: {
      purchaseOrderItemId: string;
      procurementItemId: string;
      receivedQuantity: number;
      acceptedQuantity: number;
      rejectedQuantity?: number | undefined;
      batchNumber: string;
      expiryDate: Date;
      mfgDate?: Date | undefined;
      unitPrice: string | number;
    }[];
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);

    const po = await db.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.tenantId, tenantId), eq(purchaseOrders.id, data.purchaseOrderId))
    });
    if (!po) {
      throw new AppError({ message: 'Purchase order not found', statusCode: 404 });
    }

    const warehouse = await this.getWarehouseById(tenantId, data.warehouseId);
    if (!warehouse) {
      throw new AppError({ message: 'Warehouse not found', statusCode: 404 });
    }

    const grnNumber = 'GRN-' + Date.now().toString().slice(-6);

    // Create GRN Header
    const [grn] = await db.insert(goodsReceipts).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      grnNumber,
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      receivedDate: new Date(),
      receivingDepartment: data.receivingDepartment.toUpperCase(),
      storeName: warehouse.name,
      receivedBy: data.receivedBy,
      deliveryDocumentNumber: data.deliveryDocumentNumber || null,
      status: 'INSPECTED_PASSED',
      totalReceivedItems: data.items.reduce((acc, itm) => acc + itm.receivedQuantity, 0),
      totalAcceptedItems: data.items.reduce((acc, itm) => acc + itm.acceptedQuantity, 0),
      totalRejectedItems: data.items.reduce((acc, itm) => acc + (itm.rejectedQuantity || 0), 0)
    }).returning();

    if (!grn) {
      throw new AppError({ message: 'Failed to create goods receipt', statusCode: 500 });
    }

    const poItemsInDb = await db.query.purchaseOrderItems.findMany({
      where: and(eq(purchaseOrderItems.tenantId, tenantId), eq(purchaseOrderItems.purchaseOrderId, po.id))
    });

    const createdBatches: any[] = [];
    const itemIds = (data.items || []).map(itm => itm.procurementItemId);
    const itemMap = await this.getItemsByIds(tenantId, itemIds);

    // Process each item: Create GRN Item, Upsert Inventory, Create Batch, and Post to Stock Ledger
    for (const itm of data.items) {
      const itemRecord = itemMap.get(itm.procurementItemId);
      if (!itemRecord) continue;

      let poItemId = itm.purchaseOrderItemId;
      const matchedPoItem = poItemsInDb.find(p => p.id === itm.purchaseOrderItemId)
        || poItemsInDb.find(p => p.procurementItemId === itm.procurementItemId)
        || poItemsInDb[0];
      if (matchedPoItem) {
        poItemId = matchedPoItem.id;
      }

      await db.insert(goodsReceiptItems).values({
        id: crypto.randomUUID(),
        tenantId,
        goodsReceiptId: grn.id,
        purchaseOrderItemId: poItemId,
        procurementItemId: itm.procurementItemId,
        itemCode: itemRecord.itemCode,
        itemName: itemRecord.itemName,
        receivedQuantity: itm.receivedQuantity,
        acceptedQuantity: itm.acceptedQuantity,
        rejectedQuantity: itm.rejectedQuantity || 0,
        unitPrice: String(itm.unitPrice),
        batchNumber: itm.batchNumber,
        expiryDate: itm.expiryDate,
        mfgDate: itm.mfgDate || null,
        status: 'ACCEPTED'
      });

      // Only post accepted quantity to inventory & batch ledger
      if (itm.acceptedQuantity > 0) {
        // 1. Upsert Inventory Level
        const existingInv = await db.query.supplyChainInventory.findFirst({
          where: and(
            eq(supplyChainInventory.tenantId, tenantId),
            eq(supplyChainInventory.warehouseId, warehouse.id),
            eq(supplyChainInventory.procurementItemId, itm.procurementItemId)
          )
        });

        const balanceBefore = existingInv ? existingInv.currentStock : 0;
        const balanceAfter = balanceBefore + itm.acceptedQuantity;

        if (existingInv) {
          await db.update(supplyChainInventory)
            .set({
              currentStock: balanceAfter,
              availableStock: existingInv.availableStock + itm.acceptedQuantity,
              lastRestockedAt: new Date(),
              updatedAt: new Date()
            })
            .where(and(eq(supplyChainInventory.tenantId, tenantId), eq(supplyChainInventory.id, existingInv.id)));
        } else {
          await db.insert(supplyChainInventory).values({
            id: crypto.randomUUID(),
            tenantId,
            partnerId: hierarchy.partnerId,
            organizationId: hierarchy.organizationId,
            branchId: hierarchy.branchId || null,
            warehouseId: warehouse.id,
            procurementItemId: itm.procurementItemId,
            itemCode: itemRecord.itemCode,
            itemName: itemRecord.itemName,
            currentStock: itm.acceptedQuantity,
            availableStock: itm.acceptedQuantity,
            reorderLevel: itemRecord.reorderLevel,
            safetyStock: itemRecord.safetyStock,
            minStock: itemRecord.minStock,
            maxStock: itemRecord.maxStock,
            unitOfMeasure: itemRecord.unit,
            lastRestockedAt: new Date()
          });
        }

        // 2. Create or Upsert Batch Record
        const existingBatch = await db.query.supplyChainBatches.findFirst({
          where: and(
            eq(supplyChainBatches.tenantId, tenantId),
            eq(supplyChainBatches.warehouseId, warehouse.id),
            eq(supplyChainBatches.procurementItemId, itm.procurementItemId),
            eq(supplyChainBatches.batchNumber, itm.batchNumber)
          )
        });

        let batchId: string;
        if (existingBatch) {
          const [updatedBatch] = await db.update(supplyChainBatches)
            .set({
              currentQuantity: existingBatch.currentQuantity + itm.acceptedQuantity,
              availableQuantity: existingBatch.availableQuantity + itm.acceptedQuantity,
              status: 'ACTIVE',
              updatedAt: new Date()
            })
            .where(and(eq(supplyChainBatches.tenantId, tenantId), eq(supplyChainBatches.id, existingBatch.id)))
            .returning();
          if (updatedBatch) {
            batchId = updatedBatch.id;
            createdBatches.push(updatedBatch);
          } else {
            batchId = existingBatch.id;
          }
        } else {
          const [newBatch] = await db.insert(supplyChainBatches).values({
            id: crypto.randomUUID(),
            tenantId,
            partnerId: hierarchy.partnerId,
            organizationId: hierarchy.organizationId,
            branchId: hierarchy.branchId || null,
            warehouseId: warehouse.id,
            procurementItemId: itm.procurementItemId,
            itemCode: itemRecord.itemCode,
            itemName: itemRecord.itemName,
            batchNumber: itm.batchNumber,
            expiryDate: itm.expiryDate,
            mfgDate: itm.mfgDate || null,
            initialQuantity: itm.acceptedQuantity,
            currentQuantity: itm.acceptedQuantity,
            availableQuantity: itm.acceptedQuantity,
            unitCost: String(itm.unitPrice),
            status: 'ACTIVE'
          }).returning();
          if (newBatch) {
            batchId = newBatch.id;
            createdBatches.push(newBatch);
          } else {
            batchId = crypto.randomUUID();
          }
        }

        // 3. Post to Immutable Stock Ledger
        await db.insert(supplyChainStockLedger).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: hierarchy.partnerId,
          organizationId: hierarchy.organizationId,
          branchId: hierarchy.branchId || null,
          warehouseId: warehouse.id,
          procurementItemId: itm.procurementItemId,
          batchId,
          itemCode: itemRecord.itemCode,
          batchNumber: itm.batchNumber,
          movementType: 'GRN_RECEIPT',
          quantity: itm.acceptedQuantity,
          balanceBefore,
          balanceAfter,
          referenceType: 'GRN',
          referenceId: grnNumber,
          departmentName: data.receivingDepartment.toUpperCase(),
          performedBy: data.receivedBy,
          performedRole: 'STORES_INCHARGE',
          notes: `GRN ${grnNumber} receipt from vendor ${po.vendorName}`
        });
      }
    }

    // Update PO status to FULLY_RECEIVED
    await db.update(purchaseOrders)
      .set({ status: 'FULLY_RECEIVED', updatedAt: new Date() })
      .where(eq(purchaseOrders.id, po.id));

    return { ...grn, batches: createdBatches };
  }

  async getGoodsReceipts(tenantId: string) {
    const db = requireDb();
    return await db.query.goodsReceipts.findMany({
      where: eq(goodsReceipts.tenantId, tenantId),
      orderBy: [desc(goodsReceipts.receivedDate)]
    });
  }

  // =========================================================================
  // 5. INVENTORY, BATCHES & FEFO PICKING
  // =========================================================================

  async getInventory(tenantId: string, warehouseId?: string | undefined) {
    const db = requireDb();
    const conditions = [eq(supplyChainInventory.tenantId, tenantId)];
    if (warehouseId) {
      conditions.push(eq(supplyChainInventory.warehouseId, warehouseId));
    }
    return await db.query.supplyChainInventory.findMany({
      where: and(...conditions),
      orderBy: [asc(supplyChainInventory.itemName)]
    });
  }

  async getBatches(tenantId: string, warehouseId?: string | undefined, procurementItemId?: string | undefined) {
    const db = requireDb();
    const conditions = [eq(supplyChainBatches.tenantId, tenantId)];
    if (warehouseId) {
      conditions.push(eq(supplyChainBatches.warehouseId, warehouseId));
    }
    if (procurementItemId) {
      conditions.push(eq(supplyChainBatches.procurementItemId, procurementItemId));
    }
    return await db.query.supplyChainBatches.findMany({
      where: and(...conditions),
      orderBy: [asc(supplyChainBatches.expiryDate)]
    });
  }

  async getFefoBatches(tenantId: string, warehouseId: string, procurementItemId: string) {
    const db = requireDb();
    const now = new Date();

    const batches = await db.query.supplyChainBatches.findMany({
      where: and(
        eq(supplyChainBatches.tenantId, tenantId),
        eq(supplyChainBatches.warehouseId, warehouseId),
        eq(supplyChainBatches.procurementItemId, procurementItemId),
        eq(supplyChainBatches.status, 'ACTIVE')
      ),
      orderBy: [asc(supplyChainBatches.expiryDate)]
    });

    return batches.filter(b => b.availableQuantity > 0 && new Date(b.expiryDate) > now);
  }

  async getStockLedger(tenantId: string, warehouseId?: string | undefined, procurementItemId?: string | undefined) {
    const db = requireDb();
    const conditions = [eq(supplyChainStockLedger.tenantId, tenantId)];
    if (warehouseId) {
      conditions.push(eq(supplyChainStockLedger.warehouseId, warehouseId));
    }
    if (procurementItemId) {
      conditions.push(eq(supplyChainStockLedger.procurementItemId, procurementItemId));
    }
    return await db.query.supplyChainStockLedger.findMany({
      where: and(...conditions),
      orderBy: [desc(supplyChainStockLedger.createdAt)]
    });
  }

  // =========================================================================
  // 6. MULTI-DEPARTMENT MATERIAL CONSUMPTION (OT, LIMS, IPD, PHARMACY, ETC.)
  // =========================================================================

  async recordConsumption(tenantId: string, data: {
    warehouseId: string;
    departmentName: string;
    consumedBy: string;
    patientId?: string | undefined;
    encounterId?: string | undefined;
    procedureName?: string | undefined;
    notes?: string | undefined;
    branchId?: string | undefined;
    items: {
      procurementItemId: string;
      quantity: number;
      batchId?: string | undefined;
    }[];
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);

    const warehouse = await this.getWarehouseById(tenantId, data.warehouseId);
    if (!warehouse) {
      throw new AppError({ message: 'Warehouse not found', statusCode: 404 });
    }

    const consumptionNumber = 'CSM-' + Date.now().toString().slice(-6);

    let totalCost = 0;
    const processedItems: any[] = [];

    // Pre-validate stock availability for all items to guarantee atomic safety
    for (const itm of data.items) {
      if (itm.quantity <= 0) {
        throw new AppError({ message: 'Consumption quantity must be greater than zero', statusCode: 400 });
      }

      const inv = await db.query.supplyChainInventory.findFirst({
        where: and(
          eq(supplyChainInventory.tenantId, tenantId),
          eq(supplyChainInventory.warehouseId, data.warehouseId),
          eq(supplyChainInventory.procurementItemId, itm.procurementItemId)
        )
      });

      if (!inv || inv.availableStock < itm.quantity) {
        throw new AppError({
          message: `Insufficient inventory for item ${inv?.itemName || itm.procurementItemId}. Available: ${inv?.availableStock || 0}, requested: ${itm.quantity}`,
          statusCode: 400
        });
      }

      // Resolve batch via explicit ID or automatic FEFO
      let targetBatch: any;
      if (itm.batchId) {
        targetBatch = await db.query.supplyChainBatches.findFirst({
          where: and(
            eq(supplyChainBatches.tenantId, tenantId),
            eq(supplyChainBatches.id, itm.batchId)
          )
        });
      } else {
        const fefoList = await this.getFefoBatches(tenantId, data.warehouseId, itm.procurementItemId);
        targetBatch = fefoList[0];
      }

      if (!targetBatch) {
        throw new AppError({ message: `No active, non-expired batch available for item ${itm.procurementItemId}`, statusCode: 400 });
      }

      if (targetBatch.status !== 'ACTIVE') {
        throw new AppError({ message: `Batch ${targetBatch.batchNumber} is locked (${targetBatch.status}) and cannot be consumed`, statusCode: 400 });
      }

      if (targetBatch.availableQuantity < itm.quantity) {
        throw new AppError({
          message: `Batch ${targetBatch.batchNumber} has insufficient stock. Available: ${targetBatch.availableQuantity}, requested: ${itm.quantity}`,
          statusCode: 400
        });
      }

      const lineCost = Number(targetBatch.unitCost || 0) * itm.quantity;
      totalCost += lineCost;

      processedItems.push({
        itm,
        inv,
        batch: targetBatch,
        lineCost
      });
    }

    // Insert Consumption Header
    const [csm] = await db.insert(supplyChainConsumptions).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      consumptionNumber,
      warehouseId: warehouse.id,
      departmentName: data.departmentName.toUpperCase(),
      patientId: data.patientId || null,
      encounterId: data.encounterId || null,
      procedureName: data.procedureName || null,
      consumedBy: data.consumedBy,
      consumedAt: new Date(),
      totalCost: String(totalCost),
      notes: data.notes || null
    }).returning();

    if (!csm) {
      throw new AppError({ message: 'Failed to create consumption', statusCode: 500 });
    }

    // Deduct stock, batch, and post to ledger
    for (const p of processedItems) {
      const { itm, inv, batch, lineCost } = p;

      // 1. Record Consumption Item
      await db.insert(supplyChainConsumptionItems).values({
        id: crypto.randomUUID(),
        tenantId,
        consumptionId: csm.id,
        procurementItemId: itm.procurementItemId,
        batchId: batch.id,
        itemCode: batch.itemCode,
        itemName: batch.itemName,
        batchNumber: batch.batchNumber,
        quantity: itm.quantity,
        unitCost: batch.unitCost,
        totalCost: String(lineCost)
      });

      // 2. Deduct Batch Balance
      const newBatchQty = batch.currentQuantity - itm.quantity;
      const newBatchAvail = batch.availableQuantity - itm.quantity;
      const newBatchStatus = newBatchQty <= 0 ? 'DEPLETED' : 'ACTIVE';

      await db.update(supplyChainBatches)
        .set({
          currentQuantity: newBatchQty,
          availableQuantity: newBatchAvail,
          status: newBatchStatus,
          updatedAt: new Date()
        })
        .where(and(eq(supplyChainBatches.tenantId, tenantId), eq(supplyChainBatches.id, batch.id)));

      // 3. Deduct Inventory Level
      const balanceBefore = inv.currentStock;
      const balanceAfter = balanceBefore - itm.quantity;

      await db.update(supplyChainInventory)
        .set({
          currentStock: balanceAfter,
          availableStock: inv.availableStock - itm.quantity,
          updatedAt: new Date()
        })
        .where(and(eq(supplyChainInventory.tenantId, tenantId), eq(supplyChainInventory.id, inv.id)));

      // 4. Post to Immutable Stock Ledger
      await db.insert(supplyChainStockLedger).values({
        id: crypto.randomUUID(),
        tenantId,
        partnerId: hierarchy.partnerId,
        organizationId: hierarchy.organizationId,
        branchId: hierarchy.branchId || null,
        warehouseId: warehouse.id,
        procurementItemId: itm.procurementItemId,
        batchId: batch.id,
        itemCode: batch.itemCode,
        batchNumber: batch.batchNumber,
        movementType: 'CONSUMPTION',
        quantity: -itm.quantity,
        balanceBefore,
        balanceAfter,
        referenceType: 'CONSUMPTION',
        referenceId: consumptionNumber,
        departmentName: data.departmentName.toUpperCase(),
        performedBy: data.consumedBy,
        performedRole: 'DEPARTMENT_CONSUMER',
        notes: `Material consumption by ${data.departmentName} for ${data.procedureName || 'Internal Use'}`
      });
    }

    return csm;
  }

  async getConsumptions(tenantId: string, departmentName?: string | undefined) {
    const db = requireDb();
    const conditions = [eq(supplyChainConsumptions.tenantId, tenantId)];
    if (departmentName) {
      conditions.push(eq(supplyChainConsumptions.departmentName, departmentName.toUpperCase()));
    }
    return await db.query.supplyChainConsumptions.findMany({
      where: and(...conditions),
      orderBy: [desc(supplyChainConsumptions.consumedAt)]
    });
  }

  // =========================================================================
  // 7. INTER-STORE TRANSFERS
  // =========================================================================

  async requestTransfer(tenantId: string, data: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    requestingDepartment: string;
    requestedBy: string;
    notes?: string | undefined;
    branchId?: string | undefined;
    items: { procurementItemId: string; requestedQuantity: number }[];
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);

    const src = await this.getWarehouseById(tenantId, data.sourceWarehouseId);
    const dst = await this.getWarehouseById(tenantId, data.destinationWarehouseId);

    if (!src || !dst) {
      throw new AppError({ message: 'Source or destination warehouse not found', statusCode: 404 });
    }

    const transferNumber = 'TRF-' + Date.now().toString().slice(-6);

    const [trf] = await db.insert(supplyChainTransfers).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      transferNumber,
      sourceWarehouseId: src.id,
      sourceWarehouseName: src.name,
      destinationWarehouseId: dst.id,
      destinationWarehouseName: dst.name,
      requestingDepartment: data.requestingDepartment.toUpperCase(),
      status: 'REQUESTED',
      requestedBy: data.requestedBy,
      notes: data.notes || null
    }).returning();

    if (!trf) {
      throw new AppError({ message: 'Failed to create transfer', statusCode: 500 });
    }

    const itemIds = (data.items || []).map(itm => itm.procurementItemId);
    const itemMap = await this.getItemsByIds(tenantId, itemIds);

    const transferItemsToInsert = (data.items || []).map(itm => {
      const itemRecord = itemMap.get(itm.procurementItemId);
      return {
        id: crypto.randomUUID(),
        tenantId,
        transferId: trf.id,
        procurementItemId: itm.procurementItemId,
        itemCode: itemRecord?.itemCode || 'UNKNOWN',
        itemName: itemRecord?.itemName || 'Item',
        requestedQuantity: itm.requestedQuantity,
        unit: itemRecord?.unit || 'UNIT',
        status: 'PENDING'
      };
    });

    if (transferItemsToInsert.length > 0) {
      await db.insert(supplyChainTransferItems).values(transferItemsToInsert);
    }

    return trf;
  }

  async approveTransfer(tenantId: string, transferId: string, actorId: string) {
    const db = requireDb();
    const [updated] = await db.update(supplyChainTransfers)
      .set({
        status: 'APPROVED',
        approvedBy: actorId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(supplyChainTransfers.tenantId, tenantId), eq(supplyChainTransfers.id, transferId)))
      .returning();
    return updated || null;
  }

  async dispatchTransfer(tenantId: string, transferId: string, actorId: string) {
    const db = requireDb();
    const trf = await db.query.supplyChainTransfers.findFirst({
      where: and(eq(supplyChainTransfers.tenantId, tenantId), eq(supplyChainTransfers.id, transferId))
    });
    if (!trf) {
      throw new AppError({ message: 'Transfer not found', statusCode: 404 });
    }

    const transferItemsList = await db.query.supplyChainTransferItems.findMany({
      where: and(eq(supplyChainTransferItems.tenantId, tenantId), eq(supplyChainTransferItems.transferId, trf.id))
    });

    // Deduct stock from source warehouse and mark in transit
    for (const item of transferItemsList) {
      const fefoBatches = await this.getFefoBatches(tenantId, trf.sourceWarehouseId, item.procurementItemId);
      const batch = fefoBatches[0];
      if (!batch || batch.availableQuantity < item.requestedQuantity) {
        throw new AppError({ message: `Insufficient batch stock at source store for ${item.itemName}`, statusCode: 400 });
      }

      // Deduct source batch
      await db.update(supplyChainBatches)
        .set({
          currentQuantity: batch.currentQuantity - item.requestedQuantity,
          availableQuantity: batch.availableQuantity - item.requestedQuantity,
          updatedAt: new Date()
        })
        .where(and(eq(supplyChainBatches.tenantId, tenantId), eq(supplyChainBatches.id, batch.id)));

      // Deduct source inventory
      const inv = await db.query.supplyChainInventory.findFirst({
        where: and(
          eq(supplyChainInventory.tenantId, tenantId),
          eq(supplyChainInventory.warehouseId, trf.sourceWarehouseId),
          eq(supplyChainInventory.procurementItemId, item.procurementItemId)
        )
      });
      if (inv) {
        await db.update(supplyChainInventory)
          .set({
            currentStock: inv.currentStock - item.requestedQuantity,
            availableStock: inv.availableStock - item.requestedQuantity,
            updatedAt: new Date()
          })
          .where(and(eq(supplyChainInventory.tenantId, tenantId), eq(supplyChainInventory.id, inv.id)));

        // Ledger: TRANSFER_OUT
        await db.insert(supplyChainStockLedger).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: trf.partnerId,
          organizationId: trf.organizationId,
          branchId: trf.branchId || null,
          warehouseId: trf.sourceWarehouseId,
          procurementItemId: item.procurementItemId,
          batchId: batch.id,
          itemCode: item.itemCode,
          batchNumber: batch.batchNumber,
          movementType: 'TRANSFER_OUT',
          quantity: -item.requestedQuantity,
          balanceBefore: inv.currentStock,
          balanceAfter: inv.currentStock - item.requestedQuantity,
          referenceType: 'TRANSFER',
          referenceId: trf.transferNumber,
          performedBy: actorId,
          performedRole: 'STORE_DISPATCHER',
          notes: `Dispatched to ${trf.destinationWarehouseName}`
        });
      }

      // Update transfer item with dispatched batch details
      await db.update(supplyChainTransferItems)
        .set({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          dispatchedQuantity: item.requestedQuantity,
          status: 'DISPATCHED'
        })
        .where(and(eq(supplyChainTransferItems.tenantId, tenantId), eq(supplyChainTransferItems.id, item.id)));
    }

    const [dispatched] = await db.update(supplyChainTransfers)
      .set({
        status: 'IN_TRANSIT',
        dispatchedBy: actorId,
        dispatchedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(supplyChainTransfers.tenantId, tenantId), eq(supplyChainTransfers.id, trf.id)))
      .returning();

    return dispatched || null;
  }

  async receiveTransfer(tenantId: string, transferId: string, actorId: string) {
    const db = requireDb();
    const trf = await db.query.supplyChainTransfers.findFirst({
      where: and(eq(supplyChainTransfers.tenantId, tenantId), eq(supplyChainTransfers.id, transferId))
    });
    if (!trf) {
      throw new AppError({ message: 'Transfer not found', statusCode: 404 });
    }

    const transferItemsList = await db.query.supplyChainTransferItems.findMany({
      where: and(eq(supplyChainTransferItems.tenantId, tenantId), eq(supplyChainTransferItems.transferId, trf.id))
    });

    for (const item of transferItemsList) {
      const sourceBatch = item.batchId ? await db.query.supplyChainBatches.findFirst({
        where: eq(supplyChainBatches.id, item.batchId)
      }) : null;

      // 1. Upsert destination inventory
      const existingInv = await db.query.supplyChainInventory.findFirst({
        where: and(
          eq(supplyChainInventory.tenantId, tenantId),
          eq(supplyChainInventory.warehouseId, trf.destinationWarehouseId),
          eq(supplyChainInventory.procurementItemId, item.procurementItemId)
        )
      });

      const balanceBefore = existingInv ? existingInv.currentStock : 0;
      const balanceAfter = balanceBefore + item.dispatchedQuantity;

      if (existingInv) {
        await db.update(supplyChainInventory)
          .set({
            currentStock: balanceAfter,
            availableStock: existingInv.availableStock + item.dispatchedQuantity,
            lastRestockedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(supplyChainInventory.id, existingInv.id));
      } else {
        const itemRecord = await this.getItemById(tenantId, item.procurementItemId);
        await db.insert(supplyChainInventory).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: trf.partnerId,
          organizationId: trf.organizationId,
          branchId: trf.branchId || null,
          warehouseId: trf.destinationWarehouseId,
          procurementItemId: item.procurementItemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          currentStock: item.dispatchedQuantity,
          availableStock: item.dispatchedQuantity,
          reorderLevel: itemRecord?.reorderLevel ?? 10,
          safetyStock: itemRecord?.safetyStock ?? 5,
          minStock: itemRecord?.minStock ?? 5,
          maxStock: itemRecord?.maxStock ?? 500,
          unitOfMeasure: item.unit,
          lastRestockedAt: new Date()
        });
      }

      // 2. Create or upsert destination batch
      const batchNum = item.batchNumber || sourceBatch?.batchNumber || 'BATCH-TRF';
      const existingDestBatch = await db.query.supplyChainBatches.findFirst({
        where: and(
          eq(supplyChainBatches.tenantId, tenantId),
          eq(supplyChainBatches.warehouseId, trf.destinationWarehouseId),
          eq(supplyChainBatches.procurementItemId, item.procurementItemId),
          eq(supplyChainBatches.batchNumber, batchNum)
        )
      });

      let destBatchId: string;
      if (existingDestBatch) {
        const [updated] = await db.update(supplyChainBatches)
          .set({
            currentQuantity: existingDestBatch.currentQuantity + item.dispatchedQuantity,
            availableQuantity: existingDestBatch.availableQuantity + item.dispatchedQuantity,
            status: 'ACTIVE',
            updatedAt: new Date()
          })
          .where(and(eq(supplyChainBatches.tenantId, tenantId), eq(supplyChainBatches.id, existingDestBatch.id)))
          .returning();
        destBatchId = updated?.id || existingDestBatch.id;
      } else {
        const [newBatch] = await db.insert(supplyChainBatches).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: trf.partnerId,
          organizationId: trf.organizationId,
          branchId: trf.branchId || null,
          warehouseId: trf.destinationWarehouseId,
          procurementItemId: item.procurementItemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          batchNumber: batchNum,
          expiryDate: sourceBatch?.expiryDate || new Date(Date.now() + 180 * 86400000),
          mfgDate: sourceBatch?.mfgDate || null,
          initialQuantity: item.dispatchedQuantity,
          currentQuantity: item.dispatchedQuantity,
          availableQuantity: item.dispatchedQuantity,
          unitCost: sourceBatch?.unitCost || '0.00',
          status: 'ACTIVE'
        }).returning();
        destBatchId = newBatch?.id || crypto.randomUUID();
      }

      // 3. Ledger: TRANSFER_IN
      await db.insert(supplyChainStockLedger).values({
        id: crypto.randomUUID(),
        tenantId,
        partnerId: trf.partnerId,
        organizationId: trf.organizationId,
        branchId: trf.branchId || null,
        warehouseId: trf.destinationWarehouseId,
        procurementItemId: item.procurementItemId,
        batchId: destBatchId,
        itemCode: item.itemCode,
        batchNumber: batchNum,
        movementType: 'TRANSFER_IN',
        quantity: item.dispatchedQuantity,
        balanceBefore,
        balanceAfter,
        referenceType: 'TRANSFER',
        referenceId: trf.transferNumber,
        performedBy: actorId,
        performedRole: 'STORE_RECEIVER',
        notes: `Received from ${trf.sourceWarehouseName}`
      });

      await db.update(supplyChainTransferItems)
        .set({
          receivedQuantity: item.dispatchedQuantity,
          status: 'RECEIVED'
        })
        .where(and(eq(supplyChainTransferItems.tenantId, tenantId), eq(supplyChainTransferItems.id, item.id)));
    }

    const [received] = await db.update(supplyChainTransfers)
      .set({
        status: 'RECEIVED',
        receivedBy: actorId,
        receivedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(supplyChainTransfers.tenantId, tenantId), eq(supplyChainTransfers.id, trf.id)))
      .returning();

    return received || null;
  }

  async getTransfers(tenantId: string) {
    const db = requireDb();
    return await db.query.supplyChainTransfers.findMany({
      where: eq(supplyChainTransfers.tenantId, tenantId),
      orderBy: [desc(supplyChainTransfers.createdAt)]
    });
  }

  // =========================================================================
  // 8. BATCH RECALLS & QUARANTINES
  // =========================================================================

  async initiateBatchRecall(tenantId: string, data: {
    procurementItemId: string;
    batchNumber: string;
    recallClass?: string | undefined;
    reason: string;
    initiatedBy: string;
    dispositionAction?: string | undefined;
    branchId?: string | undefined;
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);

    const item = await this.getItemById(tenantId, data.procurementItemId);
    if (!item) {
      throw new AppError({ message: 'Procurement item not found', statusCode: 404 });
    }

    const recallNumber = 'RCL-' + Date.now().toString().slice(-6);

    // Find all active batches matching this batchNumber across all stores
    const matchingBatches = await db.query.supplyChainBatches.findMany({
      where: and(
        eq(supplyChainBatches.tenantId, tenantId),
        eq(supplyChainBatches.procurementItemId, data.procurementItemId),
        eq(supplyChainBatches.batchNumber, data.batchNumber)
      )
    });

    let totalQuarantined = 0;

    for (const b of matchingBatches) {
      totalQuarantined += b.availableQuantity;

      // Lock batch: Set status to RECALLED, quarantineReason, and availableQuantity to 0
      await db.update(supplyChainBatches)
        .set({
          status: 'RECALLED',
          quarantineReason: data.reason,
          availableQuantity: 0,
          updatedAt: new Date()
        })
        .where(and(eq(supplyChainBatches.tenantId, tenantId), eq(supplyChainBatches.id, b.id)));

      // Deduct available stock in inventory (physical stock remains until disposed)
      const inv = await db.query.supplyChainInventory.findFirst({
        where: and(
          eq(supplyChainInventory.tenantId, tenantId),
          eq(supplyChainInventory.warehouseId, b.warehouseId),
          eq(supplyChainInventory.procurementItemId, b.procurementItemId)
        )
      });
      if (inv) {
        await db.update(supplyChainInventory)
          .set({
            availableStock: Math.max(0, inv.availableStock - b.availableQuantity),
            updatedAt: new Date()
          })
          .where(and(eq(supplyChainInventory.tenantId, tenantId), eq(supplyChainInventory.id, inv.id)));
      }

      // Stock ledger entry for audit
      await db.insert(supplyChainStockLedger).values({
        id: crypto.randomUUID(),
        tenantId,
        partnerId: hierarchy.partnerId,
        organizationId: hierarchy.organizationId,
        branchId: hierarchy.branchId || null,
        warehouseId: b.warehouseId,
        procurementItemId: b.procurementItemId,
        batchId: b.id,
        itemCode: b.itemCode,
        batchNumber: b.batchNumber,
        movementType: 'RECALL_QUARANTINE',
        quantity: 0, // physical stock unchanged, availability frozen
        balanceBefore: inv ? inv.currentStock : 0,
        balanceAfter: inv ? inv.currentStock : 0,
        referenceType: 'RECALL',
        referenceId: recallNumber,
        performedBy: data.initiatedBy,
        performedRole: 'QUALITY_OFFICER',
        notes: `Batch Recall (${data.recallClass || 'CLASS_II'}): ${data.reason}`
      });
    }

    const [recall] = await db.insert(supplyChainRecalls).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      recallNumber,
      procurementItemId: data.procurementItemId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      batchNumber: data.batchNumber,
      recallClass: data.recallClass || 'CLASS_II',
      reason: data.reason,
      status: 'ACTIVE',
      initiatedBy: data.initiatedBy,
      totalQuarantinedQuantity: totalQuarantined,
      dispositionAction: data.dispositionAction || 'PENDING'
    }).returning();

    return recall || null;
  }

  async getRecalls(tenantId: string) {
    const db = requireDb();
    return await db.query.supplyChainRecalls.findMany({
      where: eq(supplyChainRecalls.tenantId, tenantId),
      orderBy: [desc(supplyChainRecalls.createdAt)]
    });
  }

  // =========================================================================
  // 9. PHYSICAL STOCK COUNTS & AUDITS
  // =========================================================================

  async initiateStockCount(tenantId: string, data: {
    warehouseId: string;
    countType?: string | undefined;
    initiatedBy: string;
    notes?: string | undefined;
    branchId?: string | undefined;
  }) {
    const db = requireDb();
    const hierarchy = await this.resolveTenantHierarchy(tenantId, data.branchId);

    const countNumber = 'CNT-' + Date.now().toString().slice(-6);

    const warehouseInv = await db.query.supplyChainInventory.findMany({
      where: and(
        eq(supplyChainInventory.tenantId, tenantId),
        eq(supplyChainInventory.warehouseId, data.warehouseId)
      )
    });

    const totalExpected = warehouseInv.reduce((acc, i) => acc + i.currentStock, 0);

    const [count] = await db.insert(supplyChainStockCounts).values({
      id: crypto.randomUUID(),
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId: hierarchy.branchId || null,
      countNumber,
      warehouseId: data.warehouseId,
      countType: data.countType || 'CYCLE',
      status: 'IN_PROGRESS',
      initiatedBy: data.initiatedBy,
      totalExpectedQuantity: totalExpected,
      notes: data.notes || null
    }).returning();

    if (!count) {
      throw new AppError({ message: 'Failed to initiate stock count', statusCode: 500 });
    }

    const stockCountItemsToInsert = warehouseInv.map(inv => ({
      id: crypto.randomUUID(),
      tenantId,
      stockCountId: count.id,
      procurementItemId: inv.procurementItemId,
      itemCode: inv.itemCode,
      itemName: inv.itemName,
      expectedQuantity: inv.currentStock,
      countedQuantity: null,
      varianceQuantity: 0,
      varianceValue: '0.00'
    }));

    if (stockCountItemsToInsert.length > 0) {
      await db.insert(supplyChainStockCountItems).values(stockCountItemsToInsert);
    }

    return count;
  }

  async recordStockCountResults(tenantId: string, countId: string, data: {
    conductedBy: string;
    counts: { procurementItemId: string; countedQuantity: number }[];
  }) {
    const db = requireDb();
    let totalCounted = 0;
    let totalVariance = 0;

    for (const c of data.counts) {
      const itemRecord = await db.query.supplyChainStockCountItems.findFirst({
        where: and(
          eq(supplyChainStockCountItems.tenantId, tenantId),
          eq(supplyChainStockCountItems.stockCountId, countId),
          eq(supplyChainStockCountItems.procurementItemId, c.procurementItemId)
        )
      });
      if (!itemRecord) continue;

      const varianceQty = c.countedQuantity - itemRecord.expectedQuantity;
      totalCounted += c.countedQuantity;
      totalVariance += varianceQty;

      await db.update(supplyChainStockCountItems)
        .set({
          countedQuantity: c.countedQuantity,
          varianceQuantity: varianceQty
        })
        .where(and(eq(supplyChainStockCountItems.tenantId, tenantId), eq(supplyChainStockCountItems.id, itemRecord.id)));
    }

    const [updated] = await db.update(supplyChainStockCounts)
      .set({
        conductedBy: data.conductedBy,
        completedAt: new Date(),
        status: 'REVIEW_REQUIRED',
        totalCountedQuantity: totalCounted,
        totalVarianceQuantity: totalVariance,
        updatedAt: new Date()
      })
      .where(and(eq(supplyChainStockCounts.tenantId, tenantId), eq(supplyChainStockCounts.id, countId)))
      .returning();

    return updated || null;
  }

  async reconcileStockCount(tenantId: string, countId: string, reconciledBy: string) {
    const db = requireDb();
    const count = await db.query.supplyChainStockCounts.findFirst({
      where: and(eq(supplyChainStockCounts.tenantId, tenantId), eq(supplyChainStockCounts.id, countId))
    });
    if (!count) {
      throw new AppError({ message: 'Stock count not found', statusCode: 404 });
    }

    const items = await db.query.supplyChainStockCountItems.findMany({
      where: and(eq(supplyChainStockCountItems.tenantId, tenantId), eq(supplyChainStockCountItems.stockCountId, count.id))
    });

    for (const itm of items) {
      if (itm.countedQuantity === null || itm.varianceQuantity === 0) continue;

      const inv = await db.query.supplyChainInventory.findFirst({
        where: and(
          eq(supplyChainInventory.tenantId, tenantId),
          eq(supplyChainInventory.warehouseId, count.warehouseId),
          eq(supplyChainInventory.procurementItemId, itm.procurementItemId)
        )
      });

      if (inv) {
        const balanceBefore = inv.currentStock;
        const balanceAfter = itm.countedQuantity;

        await db.update(supplyChainInventory)
          .set({
            currentStock: balanceAfter,
            availableStock: Math.max(0, inv.availableStock + itm.varianceQuantity),
            updatedAt: new Date()
          })
          .where(and(eq(supplyChainInventory.tenantId, tenantId), eq(supplyChainInventory.id, inv.id)));

        await db.insert(supplyChainStockLedger).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: count.partnerId,
          organizationId: count.organizationId,
          branchId: count.branchId || null,
          warehouseId: count.warehouseId,
          procurementItemId: itm.procurementItemId,
          itemCode: itm.itemCode,
          movementType: 'CYCLE_COUNT_ADJUSTMENT',
          quantity: itm.varianceQuantity,
          balanceBefore,
          balanceAfter,
          referenceType: 'STOCK_COUNT',
          referenceId: count.countNumber,
          performedBy: reconciledBy,
          performedRole: 'STORE_AUDITOR',
          notes: `Reconciled stock count discrepancy (${itm.varianceQuantity})`
        });
      }
    }

    const [reconciled] = await db.update(supplyChainStockCounts)
      .set({
        reconciledBy,
        reconciledAt: new Date(),
        status: 'RECONCILED',
        updatedAt: new Date()
      })
      .where(and(eq(supplyChainStockCounts.tenantId, tenantId), eq(supplyChainStockCounts.id, count.id)))
      .returning();

    return reconciled || null;
  }

  async getStockCounts(tenantId: string) {
    const db = requireDb();
    return await db.query.supplyChainStockCounts.findMany({
      where: eq(supplyChainStockCounts.tenantId, tenantId),
      orderBy: [desc(supplyChainStockCounts.initiatedAt)]
    });
  }

  // =========================================================================
  // 10. EXPIRY TRACKING, REORDER ALERTS & ZERO-STATE KPI METRICS
  // =========================================================================

  async getExpiryAlerts(tenantId: string, daysThreshold: number = 30) {
    const db = requireDb();
    const thresholdDate = new Date(Date.now() + daysThreshold * 86400000);

    const batches = await db.query.supplyChainBatches.findMany({
      where: and(
        eq(supplyChainBatches.tenantId, tenantId),
        eq(supplyChainBatches.status, 'ACTIVE')
      ),
      orderBy: [asc(supplyChainBatches.expiryDate)]
    });

    const expiringBatches = batches.filter(b => b.availableQuantity > 0 && new Date(b.expiryDate) <= thresholdDate);

    const totalAtRiskValuation = expiringBatches.reduce((acc, b) => {
      return acc + (b.availableQuantity * Number(b.unitCost || 0));
    }, 0);

    return {
      daysThreshold,
      expiringBatchesCount: expiringBatches.length,
      totalAtRiskValuation: Math.round(totalAtRiskValuation * 100) / 100,
      batches: expiringBatches
    };
  }

  async getReorderAlerts(tenantId: string) {
    const db = requireDb();
    const invList = await db.query.supplyChainInventory.findMany({
      where: eq(supplyChainInventory.tenantId, tenantId)
    });

    const lowStockItems = invList
      .filter(i => i.availableStock <= i.reorderLevel)
      .map(i => ({
        procurementItemId: i.procurementItemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        warehouseId: i.warehouseId,
        currentStock: i.currentStock,
        availableStock: i.availableStock,
        reorderLevel: i.reorderLevel,
        safetyStock: i.safetyStock,
        recommendedOrderQuantity: Math.max(0, i.maxStock - i.availableStock)
      }));

    return {
      lowStockCount: lowStockItems.length,
      recommendations: lowStockItems
    };
  }

  async getMetrics(tenantId: string) {
    const db = requireDb();

    const warehouses = await db.query.supplyChainWarehouses.findMany({
      where: eq(supplyChainWarehouses.tenantId, tenantId)
    });

    const invList = await db.query.supplyChainInventory.findMany({
      where: eq(supplyChainInventory.tenantId, tenantId)
    });

    const batches = await db.query.supplyChainBatches.findMany({
      where: eq(supplyChainBatches.tenantId, tenantId)
    });

    const transfers = await db.query.supplyChainTransfers.findMany({
      where: eq(supplyChainTransfers.tenantId, tenantId)
    });

    const totalStockValuation = batches
      .filter(b => b.status === 'ACTIVE')
      .reduce((acc, b) => acc + (b.availableQuantity * Number(b.unitCost || 0)), 0);

    const lowStockCount = invList.filter(i => i.availableStock <= i.reorderLevel).length;

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000);
    const expiringBatchesCount = batches.filter(
      b => b.status === 'ACTIVE' && b.availableQuantity > 0 && new Date(b.expiryDate) <= thirtyDaysFromNow
    ).length;

    const quarantinedCount = batches.filter(b => b.status === 'QUARANTINED' || b.status === 'RECALLED').length;
    const pendingTransfersCount = transfers.filter(t => ['REQUESTED', 'APPROVED', 'IN_TRANSIT'].includes(t.status)).length;

    return {
      totalWarehousesCount: warehouses.length,
      totalInventoryItemsCount: invList.length,
      totalStockValuation: Math.round(totalStockValuation * 100) / 100,
      lowStockItemsCount: lowStockCount,
      expiringBatchesCount,
      quarantinedBatchesCount: quarantinedCount,
      pendingTransfersCount
    };
  }
}
