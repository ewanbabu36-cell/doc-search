import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await c.connect();

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const PARTNER_ID = '00000000-0000-4000-8000-000000000001';
const ORG_ID = '00000000-0000-4000-8000-000000000002';
const BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const invRes = await c.query(`SELECT id, patient_id, invoice_number, total_amount FROM clinical.billing_invoices WHERE tenant_id = $1 LIMIT 4`, [TENANT_ID]);
const invoices = invRes.rows;

if (invoices.length > 0) {
  const inv1 = invoices[0];
  const inv2 = invoices[1] || invoices[0];

  // 1. billing_credit_notes
  await c.query(`
    INSERT INTO clinical.billing_credit_notes (
      id, tenant_id, partner_id, organization_id, branch_id,
      invoice_id, patient_id, credit_note_number, amount, reason, status, approved_by, metadata, created_at, updated_at
    ) VALUES 
    (
      'c1000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      $5, $6, 'CN-2026-001', 250.00, 'Duplicate consultation fee waiver post-senior consultant approval',
      'APPROVED', 'Medical Superintendent Dr. Sharma', '{"source": "MANUAL_RECONCILIATION"}'::jsonb, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
    ),
    (
      'c1000000-0000-4000-8000-000000000002', $1, $2, $3, $4,
      $7, $8, 'CN-2026-002', 400.00, 'Ayushman Bharat PMJAY scheme co-payment refund adjustment',
      'APPROVED', 'Billing Incharge Priya Nair', '{"source": "TPA_RECONCILIATION"}'::jsonb, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
    )
    ON CONFLICT (id) DO NOTHING;
  `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, inv1.id, inv1.patient_id, inv2.id, inv2.patient_id]);
  console.log('✓ Seeded clinical.billing_credit_notes');

  // 2. billing_debit_adjustments
  await c.query(`
    INSERT INTO clinical.billing_debit_adjustments (
      id, tenant_id, partner_id, organization_id, branch_id,
      invoice_id, patient_id, adjustment_number, amount, reason, status, approved_by, metadata, created_at, updated_at
    ) VALUES 
    (
      'd1000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      $5, $6, 'DA-2026-001', 150.00, 'Unbilled emergency dressing supplies post-op recovery room',
      'APPLIED', 'Billing Supervisor Anil Verma', '{"dept": "OT_RECOVERY"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO NOTHING;
  `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, inv1.id, inv1.patient_id]);
  console.log('✓ Seeded clinical.billing_debit_adjustments');

  // 3. billing_discounts
  await c.query(`
    INSERT INTO clinical.billing_discounts (
      id, tenant_id, partner_id, organization_id, branch_id,
      invoice_id, discount_type, discount_value, discount_amount, reason, approved_by, created_by, metadata, created_at
    ) VALUES 
    (
      'e1000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      $5, 'SENIOR_CITIZEN', 10.00, 130.00, 'Hospital policy senior citizen 10% outpatient discount',
      'Medical Superintendent Dr. Sharma', 'usr_cashier_01', '{"scheme": "SENIOR_CARE_PRIVILEGE"}'::jsonb, NOW() - INTERVAL '4 days'
    ),
    (
      'e1000000-0000-4000-8000-000000000002', $1, $2, $3, $4,
      $6, 'STAFF_BENEFIT', 15.00, 225.00, 'Hospital clinical staff family discount policy',
      'HR Director Sunita Roy', 'usr_cashier_02', '{"employeeId": "EMP-2026-041"}'::jsonb, NOW() - INTERVAL '2 days'
    )
    ON CONFLICT (id) DO NOTHING;
  `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, inv1.id, inv2.id]);
  console.log('✓ Seeded clinical.billing_discounts');

  // 4. billing_financial_transactions
  await c.query(`
    INSERT INTO clinical.billing_financial_transactions (
      id, tenant_id, partner_id, organization_id, branch_id,
      transaction_number, transaction_type, reference_type, reference_id, patient_id,
      debit, credit, balance_impact, currency, actor_id, occurred_at, notes, metadata, created_at
    ) VALUES 
    (
      'f1000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      'TXN-2026-001', 'INVOICE_GENERATION', 'INVOICE', $5, $6,
      1300.00, 0.00, 1300.00, 'INR', 'usr_cashier_01', NOW() - INTERVAL '4 days',
      'Initial billing settlement ledger entry for OPD visit', '{"method": "CASH"}'::jsonb, NOW() - INTERVAL '4 days'
    ),
    (
      'f1000000-0000-4000-8000-000000000002', $1, $2, $3, $4,
      'TXN-2026-002', 'CREDIT_NOTE_ADJUSTMENT', 'CREDIT_NOTE', 'c1000000-0000-4000-8000-000000000001', $6,
      0.00, 250.00, -250.00, 'INR', 'usr_billing_head', NOW() - INTERVAL '2 days',
      'Credit note waiver applied against ledger balance', '{"source": "CREDIT_NOTE"}'::jsonb, NOW() - INTERVAL '2 days'
    )
    ON CONFLICT (id) DO NOTHING;
  `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, inv1.id, inv1.patient_id]);
  console.log('✓ Seeded clinical.billing_financial_transactions');
}

await c.end();
console.log('✅ Billing Adjustments & Financial Transactions Seeded Successfully');
