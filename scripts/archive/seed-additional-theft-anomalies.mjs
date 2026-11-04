import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT = '6855be07-5298-4148-a571-c51ac49ac7f3';

async function seedMoreAnomalies() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  await client.query(`
    INSERT INTO company_forensic_theft_radar (
      tenant_id, tenant_name, staff_id, staff_name, staff_role,
      anomaly_type, detected_cash_leakage, confidence_score, severity,
      details, auto_action_taken
    ) VALUES 
    (
      $1, 'Apollo City Multi-Specialty Hospital', 'STAFF-CSH-004', 'Rajesh K. Verma', 'NIGHT_SHIFT_CASHIER',
      'BLIND_DROP_DEFICIT', 26500.00, 99, 'CRITICAL',
      'Midnight blind-drop envelope variance: Cash in vault ₹48,500 vs system terminal gross total ₹75,000 (shortfall ₹26,500). Cash drawer unsealed before supervisor arrival.',
      'CASH_VAULT_DROP_SUSPENDED'
    ),
    (
      $1, 'Apollo City Multi-Specialty Hospital', 'STAFF-OT-012', 'Suresh G. Patil', 'OT_STORE_INCHARGE',
      'UNBILLED_SURGICAL_IMPLANTS', 85000.00, 92, 'HIGH',
      'Orthopedic implant kit (Stryker Triathlon Knee System) logged checked out of central vault; zero corresponding billing ledger entry found in patient final discharge bill.',
      'INVENTORY_AUDIT_HOLD'
    ),
    (
      $1, 'Apollo City Multi-Specialty Hospital', 'STAFF-REC-008', 'Priya M. Sharma', 'FRONT_DESK_RECEPTIONIST',
      'EXCESSIVE_FEE_WAIVERS', 9800.00, 88, 'MEDIUM',
      'Senior Doctor Consultation emergency fee manually overridden to ₹0 ("Doctor Discretion Waiver") 14 times without attending consultant biometric sign-off.',
      'FEE_WAIVER_PRIVILEGE_REVOKED'
    )
    ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  console.log('Successfully seeded additional forensic theft radar anomalies.');
  await client.end();
}

seedMoreAnomalies().catch(console.error);
