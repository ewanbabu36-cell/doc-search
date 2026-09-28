import {
  getDatabase,
  billingPackages,
  billingPackageItems,
  patientPackages,
  patientPackageConsumptions,
  eq,
  and,
  desc
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { AppError } from '@docsearch/shared-core';
import crypto from 'node:crypto';

export interface CreatePackageInput {
  packageCode?: string | undefined;
  packageName: string;
  description?: string | undefined;
  category?: string | undefined;
  totalPrice: number;
  validityDays?: number | undefined;
  items: Array<{
    serviceCatalogId?: string | undefined;
    serviceCode: string;
    serviceName: string;
    quantityIncluded: number;
    unitPrice?: number | undefined;
  }>;
}

export interface PurchasePackageInput {
  patientId: string;
  packageId: string;
  invoiceId?: string | undefined;
  notes?: string | undefined;
}

export interface ConsumePackageServiceInput {
  patientPackageId: string;
  serviceCode: string;
  serviceName?: string | undefined;
  quantityConsumed?: number | undefined;
  encounterId?: string | undefined;
  notes?: string | undefined;
}

export class PackageBillingService {
  async createPackage(input: CreatePackageInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const packageCode = (input.packageCode || `PKG-${Date.now().toString(36).toUpperCase()}`).trim();

    const [pkg] = await tx
      .insert(billingPackages)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId: scope.tenantId,
        organizationId: scope.tenantId,
        branchId: scope.branchId,
        packageCode,
        packageName: input.packageName.trim(),
        description: input.description,
        category: (input.category || 'GENERAL').toUpperCase(),
        totalPrice: String(input.totalPrice),
        validityDays: input.validityDays || 365,
        isActive: true
      })
      .returning();

    const createdItems = [];
    for (const item of input.items || []) {
      const [pItem] = await tx
        .insert(billingPackageItems)
        .values({
          id: crypto.randomUUID(),
          tenantId: scope.tenantId,
          packageId: pkg.id,
          serviceCatalogId: item.serviceCatalogId,
          serviceCode: item.serviceCode.trim(),
          serviceName: item.serviceName.trim(),
          quantityIncluded: Math.max(1, item.quantityIncluded || 1),
          unitPrice: String(item.unitPrice || 0)
        })
        .returning();
      createdItems.push(pItem);
    }

    await auditRepository.recordEvent({
      eventType: 'PACKAGE_CREATED',
      resourceType: 'billing_package',
      resourceId: pkg.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: { packageCode: pkg.packageCode, packageName: pkg.packageName, totalPrice: pkg.totalPrice }
    }, session, tx);

    return { ...pkg, items: createdItems };
  }

  async getPackages(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const pkgs = await tx
      .select()
      .from(billingPackages)
      .where(and(eq(billingPackages.tenantId, scope.tenantId), eq(billingPackages.isActive, true)))
      .orderBy(desc(billingPackages.createdAt));

    const result = [];
    for (const pkg of pkgs) {
      const items = await tx
        .select()
        .from(billingPackageItems)
        .where(eq(billingPackageItems.packageId, pkg.id));
      result.push({ ...pkg, items });
    }
    return result;
  }

  async getPackageById(packageId: string, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const [pkg] = await tx
      .select()
      .from(billingPackages)
      .where(and(eq(billingPackages.id, packageId), eq(billingPackages.tenantId, scope.tenantId)))
      .limit(1);

    if (!pkg) {
      throw AppError.notFound('Package not found');
    }

    const items = await tx
      .select()
      .from(billingPackageItems)
      .where(eq(billingPackageItems.packageId, pkg.id));

    return { ...pkg, items };
  }

  async purchasePackage(input: PurchasePackageInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const pkg = await this.getPackageById(input.packageId, session, tx);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (pkg.validityDays || 365) * 24 * 60 * 60 * 1000);
    const packageNumber = `PAT-PKG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const [purchased] = await tx
      .insert(patientPackages)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        partnerId: scope.tenantId,
        organizationId: scope.tenantId,
        branchId: scope.branchId,
        patientId: input.patientId,
        packageId: pkg.id,
        invoiceId: input.invoiceId,
        packageNumber,
        purchasedAt: now,
        expiresAt,
        status: 'ACTIVE',
        totalPrice: String(pkg.totalPrice),
        notes: input.notes
      })
      .returning();

    await auditRepository.recordEvent({
      eventType: 'PATIENT_PACKAGE_PURCHASED',
      resourceType: 'patient_package',
      resourceId: purchased.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        patientId: input.patientId,
        packageNumber,
        packageName: pkg.packageName,
        expiresAt: expiresAt.toISOString()
      }
    }, session, tx);

    return { ...purchased, package: pkg };
  }

  async consumePackageService(input: ConsumePackageServiceInput, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const [patientPkg] = await tx
      .select()
      .from(patientPackages)
      .where(and(eq(patientPackages.id, input.patientPackageId), eq(patientPackages.tenantId, scope.tenantId)))
      .limit(1);

    if (!patientPkg) {
      throw AppError.notFound('Patient package not found or does not belong to this tenant');
    }

    if (patientPkg.status !== 'ACTIVE') {
      throw AppError.badRequest(`Package is ${patientPkg.status} and cannot be consumed`);
    }

    if (new Date(patientPkg.expiresAt) < new Date()) {
      await tx
        .update(patientPackages)
        .set({ status: 'EXPIRED' })
        .where(eq(patientPackages.id, patientPkg.id));
      throw AppError.badRequest('Package has expired');
    }

    // Lookup package item rule
    const [pkgItem] = await tx
      .select()
      .from(billingPackageItems)
      .where(and(eq(billingPackageItems.packageId, patientPkg.packageId), eq(billingPackageItems.serviceCode, input.serviceCode)))
      .limit(1);

    if (!pkgItem) {
      throw AppError.badRequest(`Service code ${input.serviceCode} is not included in this package`);
    }

    // Sum previous consumptions
    const previousConsumptions = await tx
      .select()
      .from(patientPackageConsumptions)
      .where(and(
        eq(patientPackageConsumptions.patientPackageId, patientPkg.id),
        eq(patientPackageConsumptions.serviceCode, input.serviceCode)
      ));

    const totalConsumed = previousConsumptions.reduce((acc: number, c: any) => acc + (c.quantityConsumed || 1), 0);
    const requestedQty = Math.max(1, input.quantityConsumed || 1);
    const availableQty = pkgItem.quantityIncluded - totalConsumed;

    if (availableQty < requestedQty) {
      throw AppError.badRequest(
        `Insufficient package balance for service '${pkgItem.serviceName}'. Available: ${availableQty}, Requested: ${requestedQty}`
      );
    }

    const [consumption] = await tx
      .insert(patientPackageConsumptions)
      .values({
        id: crypto.randomUUID(),
        tenantId: scope.tenantId,
        patientPackageId: patientPkg.id,
        packageItemId: pkgItem.id,
        encounterId: input.encounterId,
        serviceCode: pkgItem.serviceCode,
        serviceName: pkgItem.serviceName,
        quantityConsumed: requestedQty,
        recordedBy: session.userId || 'STAFF',
        notes: input.notes
      })
      .returning();

    const remainingQty = availableQty - requestedQty;

    await auditRepository.recordEvent({
      eventType: 'PACKAGE_SERVICE_CONSUMED',
      resourceType: 'package_consumption',
      resourceId: consumption.id,
      tenantId: scope.tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        packageNumber: patientPkg.packageNumber,
        serviceCode: pkgItem.serviceCode,
        quantityConsumed: requestedQty,
        remainingBalance: remainingQty
      }
    }, session, tx);

    return {
      consumption,
      serviceName: pkgItem.serviceName,
      quantityConsumed: requestedQty,
      remainingBalance: remainingQty
    };
  }

  async getPatientPackages(patientId: string, session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const pkgs = await tx
      .select()
      .from(patientPackages)
      .where(and(eq(patientPackages.patientId, patientId), eq(patientPackages.tenantId, scope.tenantId)))
      .orderBy(desc(patientPackages.purchasedAt));

    const result = [];
    for (const pp of pkgs) {
      const packageDefinition = await this.getPackageById(pp.packageId, session, tx);
      const consumptions = await tx
        .select()
        .from(patientPackageConsumptions)
        .where(eq(patientPackageConsumptions.patientPackageId, pp.id));

      const balanceItems = (packageDefinition.items || []).map((it: any) => {
        const consumed = consumptions
          .filter((c: any) => c.serviceCode === it.serviceCode)
          .reduce((sum: number, c: any) => sum + (c.quantityConsumed || 1), 0);
        return {
          serviceCode: it.serviceCode,
          serviceName: it.serviceName,
          quantityIncluded: it.quantityIncluded,
          quantityConsumed: consumed,
          remainingBalance: Math.max(0, it.quantityIncluded - consumed)
        };
      });

      result.push({
        ...pp,
        packageDefinition,
        balanceItems,
        consumptions
      });
    }
    return result;
  }
}

export const packageBillingService = new PackageBillingService();
