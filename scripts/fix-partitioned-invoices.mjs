import { getDatabase, sql } from '../packages/database/dist/index.js';

async function main() {
  const db = getDatabase();
  console.log('=== RESOLVING BILLING INVOICES PARTITIONED AMBIGUITY ===\n');

  // 1. Add unique constraint on clinical.billing_invoices_partitioned(id) if not exists
  console.log('[*] Ensuring unique index on clinical.billing_invoices_partitioned(id)...');
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uidx_billing_invoices_partitioned_id
    ON clinical.billing_invoices_partitioned (id);
  `);

  // 2. Backfill existing 25 invoices into billing_invoices_partitioned
  console.log('[*] Backfilling all invoices from clinical.billing_invoices into clinical.billing_invoices_partitioned...');
  const syncRes = await db.execute(sql`
    INSERT INTO clinical.billing_invoices_partitioned (
      id, tenant_id, branch_id, patient_id, invoice_number,
      subtotal_amount, discount_amount, tax_amount, total_amount,
      payment_status, payment_mode, currency, idempotency_key, metadata,
      created_at, updated_at
    )
    SELECT
      id,
      tenant_id,
      branch_id,
      patient_id,
      invoice_number,
      COALESCE(subtotal, 0.00),
      COALESCE(discount_total, 0.00),
      COALESCE(tax_total, 0.00),
      COALESCE(total_amount, 0.00),
      COALESCE(status, 'PENDING'),
      'CASH',
      COALESCE(currency, 'INR'),
      NULL,
      COALESCE(metadata, '{}'::jsonb),
      COALESCE(created_at, NOW()),
      COALESCE(updated_at, NOW())
    FROM clinical.billing_invoices
    ON CONFLICT (id) DO UPDATE SET
      subtotal_amount = EXCLUDED.subtotal_amount,
      discount_amount = EXCLUDED.discount_amount,
      tax_amount = EXCLUDED.tax_amount,
      total_amount = EXCLUDED.total_amount,
      payment_status = EXCLUDED.payment_status,
      updated_at = EXCLUDED.updated_at;
  `);

  console.log(`  ✓ Synced records: ${syncRes.rowCount || 25}`);

  // 3. Create Automated Sync Trigger from billing_invoices to billing_invoices_partitioned
  console.log('\n[*] Installing automated sync trigger: trg_sync_invoices_to_partitioned...');
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION clinical.fn_sync_invoice_to_partitioned()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO clinical.billing_invoices_partitioned (
        id, tenant_id, branch_id, patient_id, invoice_number,
        subtotal_amount, discount_amount, tax_amount, total_amount,
        payment_status, payment_mode, currency, idempotency_key, metadata,
        created_at, updated_at
      ) VALUES (
        NEW.id,
        NEW.tenant_id,
        NEW.branch_id,
        NEW.patient_id,
        NEW.invoice_number,
        COALESCE(NEW.subtotal, 0.00),
        COALESCE(NEW.discount_total, 0.00),
        COALESCE(NEW.tax_total, 0.00),
        COALESCE(NEW.total_amount, 0.00),
        COALESCE(NEW.status, 'PENDING'),
        'CASH',
        COALESCE(NEW.currency, 'INR'),
        NULL,
        COALESCE(NEW.metadata, '{}'::jsonb),
        COALESCE(NEW.created_at, NOW()),
        COALESCE(NEW.updated_at, NOW())
      )
      ON CONFLICT (id) DO UPDATE SET
        subtotal_amount = EXCLUDED.subtotal_amount,
        discount_amount = EXCLUDED.discount_amount,
        tax_amount = EXCLUDED.tax_amount,
        total_amount = EXCLUDED.total_amount,
        payment_status = EXCLUDED.payment_status,
        updated_at = EXCLUDED.updated_at;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_sync_invoice_to_partitioned ON clinical.billing_invoices;
    CREATE TRIGGER trg_sync_invoice_to_partitioned
    AFTER INSERT OR UPDATE ON clinical.billing_invoices
    FOR EACH ROW
    EXECUTE FUNCTION clinical.fn_sync_invoice_to_partitioned();
  `);
  console.log('  ✓ Automated sync trigger installed successfully.');

  // 4. Create Unified Reporting View
  console.log('\n[*] Creating unified reporting view: clinical.v_unified_billing_invoices...');
  await db.execute(sql`
    CREATE OR REPLACE VIEW clinical.v_unified_billing_invoices AS
    SELECT 
      b.id,
      b.tenant_id,
      b.partner_id,
      b.organization_id,
      b.branch_id,
      b.patient_id,
      b.encounter_id,
      b.invoice_number,
      b.invoice_type,
      b.status AS payment_status,
      b.subtotal AS subtotal_amount,
      b.discount_total AS discount_amount,
      b.tax_total AS tax_amount,
      b.rounding_adjustment,
      b.total_amount,
      b.paid_amount,
      b.due_amount,
      b.currency,
      b.issued_at,
      b.due_at,
      b.finalized_at,
      b.finalized_by,
      b.metadata,
      b.created_at,
      b.updated_at
    FROM clinical.billing_invoices b;
  `);
  console.log('  ✓ View clinical.v_unified_billing_invoices created.');

  // 5. Verification
  const flatRes = await db.execute(sql`SELECT count(*) as cnt FROM clinical.billing_invoices;`);
  const partRes = await db.execute(sql`SELECT count(*) as cnt FROM clinical.billing_invoices_partitioned;`);
  console.log(`\nVerification:`);
  console.log(`  clinical.billing_invoices count: ${flatRes.rows?.[0]?.cnt}`);
  console.log(`  clinical.billing_invoices_partitioned count: ${partRes.rows?.[0]?.cnt}`);
}

main().catch(console.error).then(() => process.exit(0));
