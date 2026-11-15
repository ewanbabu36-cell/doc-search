/**
 * Deep Clinical Accounting, Cashiering & Procurement 3-Way Match Seeder
 * Populates zero-row accounting tables for DocSearch HealthOS under canonical tenant:
 * 11111111-1111-4111-8111-111111111111
 */

import pg from 'pg';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const PARTNER_ID = '00000000-0000-4000-8000-000000000001';
const ORG_ID = '00000000-0000-4000-8000-000000000002';
const BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
  });
  await client.connect();

  console.log('================================================================');
  console.log('🌱 SEEDING DEEP ACCOUNTING, CASHIERING & 3-WAY MATCHING');
  console.log('================================================================\n');

  // Reference lookups
  const poRes = await client.query(`SELECT id, po_number, vendor_id, vendor_name FROM clinical.purchase_orders WHERE tenant_id = $1 LIMIT 1`, [TENANT_ID]);
  const po = poRes.rows[0];

  const procItemRes = await client.query(`SELECT id, item_code, item_name, standard_cost FROM clinical.procurement_items WHERE tenant_id = $1 LIMIT 2`, [TENANT_ID]);
  const item1 = procItemRes.rows[0];
  const item2 = procItemRes.rows[1] || item1;

  const invRes = await client.query(`SELECT id, patient_id, invoice_number, total_amount FROM clinical.billing_invoices WHERE tenant_id = $1 LIMIT 2`, [TENANT_ID]);
  const inv1 = invRes.rows[0];

  const payRes = await client.query(`SELECT id, patient_id, invoice_id, amount FROM clinical.billing_payments WHERE tenant_id = $1 LIMIT 2`, [TENANT_ID]);
  const pay1 = payRes.rows[0];

  const sessRes = await client.query(`SELECT id, cashier_id FROM clinical.billing_cashier_sessions WHERE tenant_id = $1 LIMIT 1`, [TENANT_ID]);
  const session1 = sessRes.rows[0];

  const priceListRes = await client.query(`SELECT id, name FROM clinical.billing_price_lists WHERE tenant_id = $1`, [TENANT_ID]);
  const priceLists = priceListRes.rows;

  const servRes = await client.query(`SELECT id, service_code, service_name, base_price FROM clinical.billing_service_catalog WHERE tenant_id = $1 LIMIT 3`, [TENANT_ID]);
  const services = servRes.rows;

  // 1. PO Items
  const poi1Id = 'e0010000-0000-4000-8000-000000000001';
  const poi2Id = 'e0010000-0000-4000-8000-000000000002';
  if (po && item1) {
    await client.query(`
      INSERT INTO clinical.purchase_order_items (
        id, tenant_id, purchase_order_id, procurement_item_id, item_code, item_name,
        ordered_quantity, received_quantity, unit, unit_price, gross_amount, discount_amount, tax_amount, net_amount, status, created_at
      ) VALUES
      (
        $1, $2, $3, $4, $5, $6,
        100, 100, 'VIAL', 34.50, 3450.00, 0.00, 414.00, 3864.00, 'RECEIVED', NOW() - INTERVAL '5 days'
      ),
      (
        $7, $2, $3, $8, $9, $10,
        20, 20, 'INJ', 480.00, 9600.00, 0.00, 1152.00, 10752.00, 'RECEIVED', NOW() - INTERVAL '5 days'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [poi1Id, TENANT_ID, po.id, item1.id, item1.item_code, item1.item_name, poi2Id, item2.id, item2.item_code, item2.item_name]);
    console.log('✓ Seeded clinical.purchase_order_items');
  }

  // 2. Goods Receipt (GRN)
  const grnId = 'e0020000-0000-4000-8000-000000000001';
  if (po) {
    await client.query(`
      INSERT INTO clinical.goods_receipts (
        id, tenant_id, partner_id, organization_id, branch_id,
        grn_number, purchase_order_id, po_number, vendor_id, vendor_name,
        delivery_document_number, invoice_reference_number, received_date,
        receiving_department, store_name, received_by, status,
        total_received_items, total_accepted_items, total_rejected_items, remarks, created_at, updated_at
      ) VALUES
      (
        $1, $2, $3, $4, $5,
        'GRN-2026-0089', $6, $7, $8, $9,
        'DC-SUN-99011', 'VINV-2026-SUN-0091', NOW() - INTERVAL '4 days',
        'CENTRAL_PHARMACY_STORE', 'Central Medical Depot Vault A', 'Store Incharge Sunil Kumar', 'VERIFIED_ACCEPTED',
        120, 120, 0, 'Inspected and temperature data logger verified within 2C - 8C range.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [grnId, TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, po.id, po.po_number, po.vendor_id, po.vendor_name]);
    console.log('✓ Seeded clinical.goods_receipts');

    // 2b. Goods Receipt Items
    await client.query(`
      INSERT INTO clinical.goods_receipt_items (
        id, tenant_id, goods_receipt_id, purchase_order_item_id, procurement_item_id,
        item_code, item_name, received_quantity, accepted_quantity, rejected_quantity,
        unit_price, batch_number, expiry_date, status, created_at
      ) VALUES
      (
        'e0020000-0000-4000-8000-000000000002', $1, $2, $3, $4,
        $5, $6, 100, 100, 0, 34.50, 'BAT-PCM-2026-11', NOW() + INTERVAL '540 days', 'ACCEPTED', NOW() - INTERVAL '4 days'
      ),
      (
        'e0020000-0000-4000-8000-000000000003', $1, $2, $7, $8,
        $9, $10, 20, 20, 0, 480.00, 'BAT-MRP-2026-09', NOW() + INTERVAL '720 days', 'ACCEPTED', NOW() - INTERVAL '4 days'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [TENANT_ID, grnId, poi1Id, item1.id, item1.item_code, item1.item_name, poi2Id, item2.id, item2.item_code, item2.item_name]);
    console.log('✓ Seeded clinical.goods_receipt_items');
  }

  // 3. Purchase Invoices (Vendor Invoices)
  const pinvId = 'e0030000-0000-4000-8000-000000000001';
  if (po) {
    await client.query(`
      INSERT INTO clinical.purchase_invoices (
        id, tenant_id, partner_id, organization_id, branch_id,
        invoice_number, vendor_invoice_number, vendor_id, vendor_name,
        purchase_order_id, po_number, goods_receipt_id, grn_number,
        invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, outstanding_amount,
        matching_status, payment_status, created_at, updated_at
      ) VALUES
      (
        $1, $2, $3, $4, $5,
        'PINV-2026-0044', 'VINV-2026-SUN-0091', $6, $7,
        $8, $9, $10, 'GRN-2026-0089',
        NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', 13050.00, 1566.00, 0.00, 14616.00, 14616.00, 0.00,
        'MATCHED', 'PAID', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [pinvId, TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, po.vendor_id, po.vendor_name, po.id, po.po_number, grnId]);
    console.log('✓ Seeded clinical.purchase_invoices');

    // 4. Purchase Invoice 3-Way Match Record
    await client.query(`
      INSERT INTO clinical.purchase_invoice_matches (
        id, tenant_id, purchase_invoice_id, purchase_order_id, goods_receipt_id,
        matching_type, status, po_amount, grn_amount, invoice_amount,
        quantity_variance, price_variance, tax_variance, total_variance,
        discrepancy_details, matched_by, matched_at, created_at
      ) VALUES
      (
        'e0040000-0000-4000-8000-000000000001', $1, $2, $3, $4,
        '3_WAY_PO_GRN_INVOICE', 'PERFECT_MATCH_ZERO_VARIANCE', 14616.00, 14616.00, 14616.00,
        0, 0.00, 0.00, 0.00,
        'Quantity and unit rates matched 100% against PO-2026-0089 and GRN-2026-0089 with 0 tax variance.',
        'Chief Accounts Officer Anil Saxena', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [TENANT_ID, pinvId, po.id, grnId]);
    console.log('✓ Seeded clinical.purchase_invoice_matches');

    // 5. Purchase Invoice Payments
    await client.query(`
      INSERT INTO clinical.purchase_invoice_payments (
        id, tenant_id, partner_id, organization_id, branch_id,
        purchase_invoice_id, payment_number, amount, payment_method, reference_number,
        paid_at, paid_by, notes, created_at
      ) VALUES
      (
        'e0050000-0000-4000-8000-000000000001', $1, $2, $3, $4,
        $5, 'V-PAY-2026-0045', 14616.00, 'NEFT_BANK_TRANSFER', 'UTR-HDFC-992019481',
        NOW() - INTERVAL '1 day', 'Finance Controller Kavita Joshi', 'Full settlement of vendor invoice VINV-2026-SUN-0091', NOW() - INTERVAL '1 day'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, pinvId]);
    console.log('✓ Seeded clinical.purchase_invoice_payments');
  }

  // 6. Cashier EOD Closings
  await client.query(`
    INSERT INTO clinical.billing_eod_closings (
      id, tenant_id, partner_id, organization_id, branch_id,
      closing_date, gross_billing, discount_total, tax_total, net_billing,
      total_collected, cash_collected, digital_collected, total_refunded, credit_issued,
      ar_collected, ap_paid, department_breakdown, variance_total, exceptions_count,
      status, closed_by, closed_at, notes, metadata, created_at
    ) VALUES
    (
      'e0060000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      '2026-11-14', 184500.00, 9200.00, 18450.00, 193750.00,
      193750.00, 68000.00, 125750.00, 1200.00, 250.00,
      45000.00, 14616.00, '{"OPD": 68000, "IPD": 85000, "PHARMACY": 28500, "RADIOLOGY": 12250}'::jsonb,
      0.00, 0, 'AUDITED_AND_LOCKED', 'Head Cashier Sunil Rao', NOW() - INTERVAL '1 day',
      'Daily financial close balanced to penny. Cash vault count physically reconciled.', '{"cashDrawerId": "DRAWER-OPD-01"}'::jsonb, NOW() - INTERVAL '1 day'
    )
    ON CONFLICT (id) DO NOTHING;
  `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID]);
  console.log('✓ Seeded clinical.billing_eod_closings');

  // 7. Cashier Session Reconciliations
  if (session1) {
    await client.query(`
      INSERT INTO clinical.billing_reconciliations (
        id, tenant_id, partner_id, organization_id, branch_id,
        cashier_session_id, expected_amount, actual_amount, variance,
        status, reconciled_by, reconciled_at, remarks, metadata, created_at, updated_at
      ) VALUES
      (
        'e0070000-0000-4000-8000-000000000001', $1, $2, $3, $4,
        $5, 45200.00, 45200.00, 0.00,
        'RECONCILED_BALANCED', 'Supervisor Meenakshi Sundaram', NOW() - INTERVAL '1 day',
        'Shift 1 cashier drawer balanced without overage or shortage.', '{"shift": "MORNING_0800_1600"}'::jsonb, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, session1.id]);
    console.log('✓ Seeded clinical.billing_reconciliations');
  }

  // 8. Patient Refunds
  if (pay1 && inv1) {
    await client.query(`
      INSERT INTO clinical.billing_refunds (
        id, tenant_id, partner_id, organization_id, branch_id,
        payment_id, invoice_id, patient_id, refund_number, amount,
        reason, status, approved_by, processed_by, processed_at, notes, metadata, created_at, updated_at
      ) VALUES
      (
        'e0080000-0000-4000-8000-000000000001', $1, $2, $3, $4,
        $5, $6, $7, 'REF-2026-001', 200.00,
        'Patient discharge balance credit refund via UPI reversal',
        'COMPLETED', 'Medical Superintendent Dr. Sharma', 'Chief Cashier R. Gupta', NOW() - INTERVAL '2 days',
        'Discharged post-cholecystectomy; unused dressing consumables deducted and refunded',
        '{"paymentGatewayRef": "UPI-REV-99201"}'::jsonb, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, pay1.id, inv1.id, pay1.patient_id]);
    console.log('✓ Seeded clinical.billing_refunds');
  }

  // 9. Billing Payment Allocations
  if (pay1 && inv1) {
    await client.query(`
      INSERT INTO clinical.billing_payment_allocations (
        id, tenant_id, payment_id, invoice_id, allocated_amount, metadata, created_at
      ) VALUES
      (
        'e0090000-0000-4000-8000-000000000001', $1, $2, $3, $4,
        '{"allocationType": "AUTO_FIFO_CLEARING"}'::jsonb, NOW() - INTERVAL '3 days'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [TENANT_ID, pay1.id, inv1.id, pay1.amount]);
    console.log('✓ Seeded clinical.billing_payment_allocations');
  }

  // 10. Billing Receipts
  if (pay1 && inv1) {
    await client.query(`
      INSERT INTO clinical.billing_receipts (
        id, tenant_id, partner_id, organization_id, branch_id,
        payment_id, invoice_id, patient_id, receipt_number, amount,
        payment_method, issued_by, issued_at, status, metadata, created_at
      ) VALUES
      (
        'e0100000-0000-4000-8000-000000000001', $1, $2, $3, $4,
        $5, $6, $7, 'RCP-2026-00891', $8,
        'UPI_QR_CODE', 'Senior Cashier P. Nair', NOW() - INTERVAL '3 days',
        'ISSUED_DELIVERED', '{"smsReceiptDispatched": true, "whatsappPdfSent": true}'::jsonb, NOW() - INTERVAL '3 days'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, pay1.id, inv1.id, pay1.patient_id, pay1.amount]);
    console.log('✓ Seeded clinical.billing_receipts');
  }

  // 11. Custom Price List Items
  if (priceLists.length > 0 && services.length > 0) {
    const pl1 = priceLists[0];
    const pl2 = priceLists[1] || pl1;
    const pl3 = priceLists[2] || pl1;

    for (const [idx, s] of services.entries()) {
      await client.query(`
        INSERT INTO clinical.billing_price_list_items (
          id, tenant_id, price_list_id, service_catalog_id, unit_price,
          discount_allowed, effective_from, effective_to, created_at, updated_at
        ) VALUES
        (
          $1, $2, $3, $4, $5,
          true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
        ),
        (
          $6, $2, $7, $4, $8,
          true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
        ),
        (
          $9, $2, $10, $4, $11,
          false, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
        )
        ON CONFLICT (id) DO NOTHING;
      `, [
        `e0110000-0000-4000-8000-00000000000${idx * 3 + 1}`, TENANT_ID, pl1.id, s.id, Number(s.base_price),
        `e0110000-0000-4000-8000-00000000000${idx * 3 + 2}`, pl2.id, Number(s.base_price) * 0.85,
        `e0110000-0000-4000-8000-00000000000${idx * 3 + 3}`, pl3.id, Number(s.base_price) * 0.70
      ]);
    }
    console.log('✓ Seeded clinical.billing_price_list_items for all tariff schedules');
  }

  await client.end();
  console.log('\n================================================================');
  console.log('✅ ALL DEEP ACCOUNTING, CASHIERING & 3-WAY MATCHING SEEDED!');
  console.log('================================================================');
}

main().catch(console.error).then(() => process.exit(0));
