-- ==============================================================================
-- DOC SEARCH ENTERPRISE HIGH-THROUGHPUT DATABASE ARCHITECTURE
-- Scalability Target: 10,000,000 (1 Crore) Daily Transactions & 100k Partners
-- Declarative Monthly Range Partitioning DDL for PostgreSQL 14+ / 16+
-- ==============================================================================

-- 1. Enable Row-Level Security extensions and optimization settings
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Declaratively Partitioned Appointments Table (1M+ daily rows)
CREATE TABLE IF NOT EXISTS clinical.appointments_partitioned (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    department VARCHAR(100),
    slot_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'CONSULTATION',
    queue_token VARCHAR(50),
    consultation_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_appointments_partitioned PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Indexes on partitioned appointments
CREATE INDEX IF NOT EXISTS idx_apt_tenant_created ON clinical.appointments_partitioned (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apt_doctor_slot ON clinical.appointments_partitioned (doctor_id, slot_time) WHERE status != 'CANCELLED';
CREATE INDEX IF NOT EXISTS idx_apt_patient ON clinical.appointments_partitioned (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apt_status ON clinical.appointments_partitioned (tenant_id, status);

-- 3. Declaratively Partitioned Invoices Table (10M+ daily transactions)
CREATE TABLE IF NOT EXISTS clinical.billing_invoices_partitioned (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    patient_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    subtotal_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_mode VARCHAR(50),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    idempotency_key VARCHAR(128),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_billing_invoices_partitioned PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- High-Speed Indexes for Financial Invoices
CREATE INDEX IF NOT EXISTS idx_inv_tenant_created ON clinical.billing_invoices_partitioned (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_number ON clinical.billing_invoices_partitioned (tenant_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_inv_idempotency ON clinical.billing_invoices_partitioned (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inv_patient ON clinical.billing_invoices_partitioned (patient_id, created_at DESC);

-- 4. Declaratively Partitioned Financial Transactions Table
CREATE TABLE IF NOT EXISTS clinical.financial_transactions_partitioned (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_id UUID,
    transaction_type VARCHAR(50) NOT NULL, -- 'PAYMENT', 'REFUND', 'PAYOUT', 'COMMISSION'
    gateway_provider VARCHAR(50) NOT NULL, -- 'RAZORPAY', 'CASH', 'UPI', 'CARD'
    gateway_ref_id VARCHAR(255),
    amount NUMERIC(14, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    reconciliation_status VARCHAR(50) NOT NULL DEFAULT 'SETTLED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_fin_transactions_partitioned PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_fin_tenant_created ON clinical.financial_transactions_partitioned (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fin_gateway_ref ON clinical.financial_transactions_partitioned (gateway_ref_id);

-- 5. Declaratively Partitioned Audit Events Table (Full Compliance & Forensics)
CREATE TABLE IF NOT EXISTS core.audit_events_partitioned (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    event_action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    actor_ip VARCHAR(50),
    user_agent TEXT,
    prev_state JSONB,
    new_state JSONB,
    hmac_signature VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_audit_events_partitioned PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON core.audit_events_partitioned (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON core.audit_events_partitioned (tenant_id, entity_type, entity_id);

-- ==============================================================================
-- AUTOMATIC PARTITION MAINTENANCE FUNCTION
-- Generates partitions ahead for current and upcoming months
-- ==============================================================================
CREATE OR REPLACE FUNCTION maintain_monthly_partitions(
    target_year INTEGER,
    target_month INTEGER
) RETURNS VOID AS $$
DECLARE
    start_date TEXT;
    end_date TEXT;
    suffix TEXT;
    sql_stmt TEXT;
    next_year INTEGER;
    next_month INTEGER;
BEGIN
    suffix := LPAD(target_year::TEXT, 4, '0') || '_' || LPAD(target_month::TEXT, 2, '0');
    start_date := target_year::TEXT || '-' || LPAD(target_month::TEXT, 2, '0') || '-01 00:00:00+00';
    
    IF target_month = 12 THEN
        next_month := 1;
        next_year := target_year + 1;
    ELSE
        next_month := target_month + 1;
        next_year := target_year;
    END IF;
    
    end_date := next_year::TEXT || '-' || LPAD(next_month::TEXT, 2, '0') || '-01 00:00:00+00';

    -- 1. Create Appointments Partition
    sql_stmt := format(
        'CREATE TABLE IF NOT EXISTS clinical.appointments_y%s PARTITION OF clinical.appointments_partitioned ' ||
        'FOR VALUES FROM (%L) TO (%L);',
        suffix, start_date, end_date
    );
    EXECUTE sql_stmt;

    -- 2. Create Billing Invoices Partition
    sql_stmt := format(
        'CREATE TABLE IF NOT EXISTS clinical.invoices_y%s PARTITION OF clinical.billing_invoices_partitioned ' ||
        'FOR VALUES FROM (%L) TO (%L);',
        suffix, start_date, end_date
    );
    EXECUTE sql_stmt;

    -- 3. Create Financial Transactions Partition
    sql_stmt := format(
        'CREATE TABLE IF NOT EXISTS clinical.fin_trans_y%s PARTITION OF clinical.financial_transactions_partitioned ' ||
        'FOR VALUES FROM (%L) TO (%L);',
        suffix, start_date, end_date
    );
    EXECUTE sql_stmt;

    -- 4. Create Audit Events Partition
    sql_stmt := format(
        'CREATE TABLE IF NOT EXISTS core.audit_y%s PARTITION OF core.audit_events_partitioned ' ||
        'FOR VALUES FROM (%L) TO (%L);',
        suffix, start_date, end_date
    );
    EXECUTE sql_stmt;

    RAISE NOTICE 'Successfully verified/created partitions for %', suffix;
END;
$$ LANGUAGE plpgsql;

-- Pre-create partitions for 2026 Q3 and Q4
SELECT maintain_monthly_partitions(2026, 9);
SELECT maintain_monthly_partitions(2026, 10);
SELECT maintain_monthly_partitions(2026, 11);
SELECT maintain_monthly_partitions(2026, 12);
SELECT maintain_monthly_partitions(2027, 1);
