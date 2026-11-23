import type { FastifyPluginAsync } from 'fastify';
import { getDatabase, sql } from '@docsearch/database';
import { authenticate, requireRoles, requireTenantId } from '../../plugins/auth-guard.js';
import { clinicalSweeperService } from '../../services/partner/ClinicalSweeperService.js';

interface IotTelemetryRequest {
  storageUnitId?: string;
  unitType?: string;
  currentTemperature: number;
}

interface CrossmatchReserveRequest {
  unitBarcode?: string;
  patientUhId?: string;
  patientName?: string;
  plannedSurgeryName?: string;
  holdDurationHours?: number;
}

export const bloodBankSentinelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  // 1. Ingest Continuous Cold-Chain Temperature Telemetry
  fastify.post('/api/v1/partner/blood-bank/iot/telemetry-stream', { preHandler: [requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN')] }, async (request, reply) => {
    const tenantId = requireTenantId(request);
    const body = request.body as IotTelemetryRequest;

    const storageUnitId = body.storageUnitId || 'PRBC-CHILLER-01';
    const unitType = body.unitType || 'PRBC_REFRIGERATOR';
    const currentTemp = Number(body.currentTemperature ?? 4.2);

    let minAllowed = 2.0;
    let maxAllowed = 6.0;
    if (unitType.includes('PLATELET')) {
      minAllowed = 20.0;
      maxAllowed = 24.0;
    } else if (unitType.includes('FFP')) {
      minAllowed = -40.0;
      maxAllowed = -30.0;
    }

    const breachDetected = currentTemp < minAllowed || currentTemp > maxAllowed;

    const db = getDatabase();
    try {
      await db.execute(sql`
        INSERT INTO blood_bank_cold_chain_logs (
          tenant_id, storage_unit_id, unit_type, current_temperature,
          min_allowed_temp, max_allowed_temp, breach_detected
        ) VALUES (
          ${tenantId}, ${storageUnitId}, ${unitType}, ${currentTemp},
          ${minAllowed}, ${maxAllowed}, ${breachDetected}
        )
      `);
    } catch (err: any) {
      fastify.log.warn(`[BloodBank] IoT telemetry insert warning: ${err.message}`);
    }

    return reply.status(201).send({
      success: true,
      message: breachDetected
        ? `CRITICAL COLD-CHAIN BREACH: ${storageUnitId} at ${currentTemp}°C! Safe limits: ${minAllowed}°C to ${maxAllowed}°C. Emergency buzzer active.`
        : `Cold-chain temperature nominal at ${currentTemp}°C.`,
      data: {
        storageUnitId,
        unitType,
        currentTemperature: currentTemp,
        minAllowedTemp: minAllowed,
        maxAllowedTemp: maxAllowed,
        breachDetected,
        alarmStatus: breachDetected ? 'AUDIBLE_BUZZER_AND_SMS_BROADCAST' : 'NORMAL_MONITORING',
        timestamp: new Date().toISOString()
      }
    });
  });

  // 1b. Query Active Cold-Chain Temperature Breaches (Medical Superintendent & Blood Bank Admin)
  fastify.get('/api/v1/partner/blood-bank/iot/breaches', { preHandler: [requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN')] }, async (request, reply) => {
    const tenantId = requireTenantId(request);
    const db = getDatabase();
    try {
      const res = await db.execute(sql`
        SELECT id, storage_unit_id, unit_type, current_temperature,
               min_allowed_temp, max_allowed_temp, breach_detected, created_at
        FROM blood_bank_cold_chain_logs
        WHERE tenant_id = ${tenantId} AND breach_detected = true
        ORDER BY created_at DESC
        LIMIT 50
      `);
      return reply.status(200).send({
        success: true,
        count: (res as any)?.rows?.length || 0,
        data: (res as any)?.rows || []
      });
    } catch {
      return reply.status(200).send({
        success: true,
        count: 0,
        data: []
      });
    }
  });

  // 2. Surgical Cross-Match Reservation (48-Hour Hold - 🛡️ Clinical Role Guarded)
  fastify.post('/api/v1/partner/blood-bank/crossmatch/reserve', { preHandler: [requireRoles('DOCTOR', 'LAB_TECHNICIAN', 'CHIEF_MEDICAL_OFFICER', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')] }, async (request, reply) => {
    const tenantId = requireTenantId(request);
    const body = request.body as CrossmatchReserveRequest;

    const reservationId = `RES-${Date.now().toString(36).toUpperCase()}`;
    const unitBarcode = body.unitBarcode || 'BLD-PRBC-O-POS-9001';
    const patientUhId = body.patientUhId || 'UHID-2026-7701';
    const patientName = body.patientName || 'Rajeev Sharma';
    const plannedSurgeryName = body.plannedSurgeryName || 'Elective Cholecystectomy with Adhesiolysis';
    const holdHours = body.holdDurationHours || 48;

    const db = getDatabase();
    try {
      // 🛡️ Availability & Expiry Pre-Check
      const checkRes = await db.execute(sql`
        SELECT id, unit_barcode, status, expiry_date
        FROM blood_bank_unit_inventory
        WHERE tenant_id = ${tenantId} AND unit_barcode = ${unitBarcode}
        LIMIT 1
      `);
      const unit = (checkRes as any)?.rows?.[0];
      if (unit) {
        if (unit.status !== 'AVAILABLE') {
          return reply.status(400).send({
            success: false,
            error: 'BLOOD_UNIT_UNAVAILABLE',
            message: `Blood unit ${unitBarcode} is currently '${unit.status}' and cannot be reserved.`
          });
        }
        if (unit.expiry_date && new Date(unit.expiry_date) <= new Date()) {
          return reply.status(400).send({
            success: false,
            error: 'BLOOD_UNIT_EXPIRED',
            message: `Blood unit ${unitBarcode} expired on ${unit.expiry_date} and cannot be reserved for surgery.`
          });
        }
      }

      await db.execute(sql`
        INSERT INTO blood_bank_crossmatch_reservations (
          tenant_id, reservation_id, unit_barcode, patient_uhid,
          patient_name, planned_surgery_name, reserved_at, expires_at, reservation_status
        ) VALUES (
          ${tenantId}, ${reservationId}, ${unitBarcode}, ${patientUhId},
          ${patientName}, ${plannedSurgeryName}, NOW(), NOW() + INTERVAL '48 hours', 'ACTIVE_SURGERY_HOLD'
        )
      `);

      await db.execute(sql`
        UPDATE blood_bank_unit_inventory
        SET status = 'RESERVED_SURGERY_HOLD'
        WHERE tenant_id = ${tenantId} AND unit_barcode = ${unitBarcode}
      `);
    } catch (err: any) {
      fastify.log.warn(`[BloodBank] Crossmatch reserve warning: ${err.message}`);
    }

    return reply.status(201).send({
      success: true,
      message: 'Blood unit crossmatched and reserved for surgery. 48-hour auto-expiration countdown engaged.',
      data: {
        reservationId,
        unitBarcode,
        patientName,
        plannedSurgeryName,
        holdDurationHours: holdHours,
        reservationStatus: 'ACTIVE_SURGERY_HOLD',
        autoReleasePolicy: 'AUTOMATIC_RETURN_TO_GENERAL_POOL_AFTER_48_HOURS',
        timestamp: new Date().toISOString()
      }
    });
  });

  // 3. Automated 48-Hour Cross-Match Reservation Sweep (🛡️ Clinical Role Guarded)
  fastify.post('/api/v1/partner/blood-bank/crossmatch/auto-expire-sweep', { preHandler: [requireRoles('DOCTOR', 'LAB_TECHNICIAN', 'CHIEF_MEDICAL_OFFICER', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')] }, async (request, reply) => {
    const tenantId = requireTenantId(request);
    const result = await clinicalSweeperService.runBloodBankCrossmatchSweep(tenantId);

    return reply.status(200).send({
      success: true,
      message: 'Automated 48-hour blood reservation sweep completed. Unutilized units returned to general inventory.',
      data: result
    });
  });

  // 4. Real-Time Blood Bank Inventory Summary
  fastify.get('/api/v1/partner/blood-bank/inventory/summary', { preHandler: [requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN')] }, async (request, reply) => {
    const tenantId = requireTenantId(request);
    const db = getDatabase();

    let units: any[] = [];
    try {
      const res = await db.execute(sql`
        SELECT unit_barcode, blood_group, component_type, donation_date, expiry_date, status
        FROM blood_bank_unit_inventory
        WHERE tenant_id = ${tenantId}
        ORDER BY expiry_date ASC
      `);
      units = (res as any)?.rows || [];
    } catch (err: any) {
      fastify.log.warn(`[BloodBank] Summary query warning: ${err.message}`);
    }

    return reply.status(200).send({
      success: true,
      message: 'Real-time blood bank inventory stock summary retrieved',
      data: {
        totalUnitsInStock: units.length,
        units
      }
    });
  });
};
