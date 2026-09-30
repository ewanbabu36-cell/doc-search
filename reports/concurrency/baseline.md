# DOC SEARCH — CATEGORY 18 CONCURRENCY & TRANSACTION AUDIT BASELINE

**Execution Date:** 2026-09-29T06:31:17.462Z
**Overall Status:** ✅ PASSED — BASELINE VERIFIED

## 1. PostgreSQL Settings & Concurrency Configuration

| Parameter | Value | Description |
|---|---|---|
| `default_transaction_isolation` | `read committed` | Default database transaction isolation level |
| `deadlock_timeout` | `1000 ms` | Timeout before checking for deadlocks |
| `lock_timeout` | `0 ms` | Abort statement if lock not acquired |
| `statement_timeout` | `0 ms` | Abort statement exceeding timeout |
| `max_connections` | `100` | Maximum concurrent client connections |

## 2. Concurrency & Transaction Test Results

| ID | Test Name | Status | Details |
|---|---|---|---|
| TX-CFG-001 | PostgreSQL Isolation Level Confirmed | ✅ PASS | Default isolation is read committed |
| TX-CFG-002 | Database Unique Constraints Inventory | ✅ PASS | 121 unique constraint bindings active |
| TX-RACE-001 | Appointment Exclusive Slot Double-Booking Prevention | ✅ PASS | Session A: 409, Session B: 201, DB Rows: 1 |
| TX-RACE-002 | Pharmacy Stock Race / Over-Dispensing Prevention | ✅ PASS | Dispense A: 201, Dispense B: 409, Final Stock: 3 (expected: 3) |
| TX-RACE-003 | Queue Token Generation Concurrency & Non-Duplication | ✅ PASS | Generated 5 unique tokens with zero duplicates (TKN-002, TKN-001, TKN-003, TKN-004, TKN-005) |
| TX-ATOM-001 | Transaction Atomicity & Zero-Orphan Rollback | ✅ PASS | Rollback executed on failure, zero dirty/orphan records persisted in PostgreSQL |
| TX-TENANT-001 | Cross-Tenant Concurrency & Deadlock Safety | ✅ PASS | Both tenant queries completed with 200 OK without lock contention |

## 3. Transaction Boundary & Concurrency Model Inventory

1. **Appointment Exclusive Slot Double-Booking Prevention (`TX-RACE-001`):**
   - Protected by `SlotLockManager.acquireDatabaseSlotLock` using transaction-scoped PostgreSQL advisory locks (`pg_try_advisory_xact_lock`).
   - Verified: Simultaneous booking attempts for the same exclusive slot result in 1 success and 1 HTTP 409 Conflict. Exactly 1 row persisted in `clinical.appointments_partitioned`.

2. **Pharmacy Stock Race / Over-Dispensing Prevention (`TX-RACE-002`):**
   - Protected by pessimistic row-level locking (`SELECT ... FOR UPDATE`) in `PharmacyManagementRepository.ts`.
   - Verified: Concurrent dispensing exceeding batch capacity (14 requested vs 10 available) results in 1 success and 1 HTTP 409 Insufficient Stock. Final inventory is exactly 3 units, never negative.

3. **Queue Token Concurrency (`TX-RACE-003`):**
   - Protected by transactional slot locks and queue counters.
   - Verified: Multi-client token generation produces strictly unique sequential tokens with zero duplicate tokens.

4. **Transaction Atomicity & Rollback Integrity (`TX-ATOM-001`):**
   - Verified: Multi-step transaction rolls back 100% on failure without persisting dirty or orphan records in PostgreSQL.

5. **Cross-Tenant Concurrency & Isolation (`TX-TENANT-001`):**
   - Verified: Independent tenants operate concurrently without lock contention or cross-tenant data leakage.
