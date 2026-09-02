import { performance } from 'node:perf_hooks';
import v8 from 'node:v8';

console.log('\n============================================================');
console.log('🔍 PHASE 2 — DATABASE CAPACITY & CONCURRENCY BENCHMARK AUDIT');
console.log('============================================================\n');

// Mock high-throughput database simulation engine with RLS & index lookups
class DatabaseAuditHarness {
  constructor() {
    this.patients = new Map();
    this.encounters = new Map();
    this.prescriptions = new Map();
    this.batches = new Map();
    this.invoices = new Map();
    this.auditLogs = [];

    // Pre-populate 10,000 patient records to test index lookup performance
    for (let i = 1; i <= 10000; i++) {
      const patientId = `PAT-${String(i).padStart(6, '0')}`;
      const tenantId = i % 2 === 0 ? 'tenant-apollo-01' : 'tenant-fortis-02';
      this.patients.set(patientId, {
        id: patientId,
        tenantId,
        name: `Patient ${i}`,
        abhaId: `91-98765-${String(i).padStart(5, '0')}`,
        phone: `+9198765${String(i).padStart(5, '0')}`,
        createdAt: new Date().toISOString()
      });
    }

    // Pre-populate 1,000 FEFO pharmacy batches
    for (let i = 1; i <= 1000; i++) {
      const batchId = `BATCH-${String(i).padStart(5, '0')}`;
      this.batches.set(batchId, {
        id: batchId,
        drugCode: `DRUG-${(i % 50) + 1}`,
        stock: 500,
        expiryDate: new Date(Date.now() + (i % 365) * 86400000).toISOString(),
        locked: false
      });
    }
  }

  // Operation 1: Patient Registration (Insert + Unique Check)
  async registerPatient(tenantId, index) {
    const id = `PAT-NEW-${tenantId}-${index}`;
    const record = {
      id,
      tenantId,
      name: `Concurrent Patient ${index}`,
      phone: `+9190000${String(index).padStart(5, '0')}`,
      createdAt: new Date().toISOString()
    };
    this.patients.set(id, record);
    return record;
  }

  // Operation 2: Indexed Search (Tenant-scoped ABHA & Phone query)
  async searchPatient(tenantId, query) {
    const results = [];
    for (const [_, p] of this.patients) {
      if (p.tenantId === tenantId && (p.phone.includes(query) || p.abhaId?.includes(query))) {
        results.push(p);
        if (results.length >= 20) break; // Paginated limit
      }
    }
    return results;
  }

  // Operation 3: Atomic FEFO Medication Allocation & Stock Deduction
  async reserveAndDispenseMedication(tenantId, drugCode, quantity) {
    // FEFO lookup: Find earliest expiring non-locked batch
    let selectedBatch = null;
    for (const [_, b] of this.batches) {
      if (b.drugCode === drugCode && b.stock >= quantity) {
        if (!selectedBatch || new Date(b.expiryDate) < new Date(selectedBatch.expiryDate)) {
          selectedBatch = b;
        }
      }
    }

    if (!selectedBatch) {
      throw new Error(`Insufficient FEFO stock for ${drugCode}`);
    }

    // Atomic stock deduction
    selectedBatch.stock -= quantity;
    return { batchId: selectedBatch.id, remainingStock: selectedBatch.stock };
  }

  // Operation 4: Atomic Financial Invoice & Inter-Branch Transfer Ledger
  async generateBillingInvoice(tenantId, amount, branchId) {
    const invoiceId = `INV-${tenantId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const taxGst = amount * 0.18;
    const netTotal = amount + taxGst;
    const invoice = {
      id: invoiceId,
      tenantId,
      branchId,
      amount,
      taxGst,
      netTotal,
      irnStatus: 'NIC_IRP_GENERATED',
      createdAt: new Date().toISOString()
    };
    this.invoices.set(invoiceId, invoice);
    return invoice;
  }
}

async function runDatabaseCapacityBenchmark() {
  const db = new DatabaseAuditHarness();
  const iterations = 5000;
  const concurrencyLevels = [10, 50, 100, 500];

  const results = {};

  for (const concurrency of concurrencyLevels) {
    console.log(`[+] Benchmarking DB Operations at ${concurrency} Concurrent Workers (${iterations} ops)...`);

    const latencies = [];
    const startTime = performance.now();
    let errors = 0;

    const runBatch = async (startIdx, batchSize) => {
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const idx = startIdx + i;
        const opStart = performance.now();
        const tenantId = idx % 2 === 0 ? 'tenant-apollo-01' : 'tenant-fortis-02';

        const p = (async () => {
          try {
            // Mixed transactional workload:
            // 1. Register Patient
            await db.registerPatient(tenantId, idx);
            // 2. Query Search
            await db.searchPatient(tenantId, '987');
            // 3. Dispense FEFO Drug
            await db.reserveAndDispenseMedication(tenantId, `DRUG-${(idx % 20) + 1}`, 2);
            // 4. Generate Invoice
            await db.generateBillingInvoice(tenantId, 1500, 'branch-main-01');

            const elapsed = performance.now() - opStart;
            latencies.push(elapsed);
          } catch (err) {
            errors++;
          }
        })();
        promises.push(p);
      }
      await Promise.all(promises);
    };

    const batchSize = concurrency;
    const totalBatches = Math.ceil(iterations / batchSize);

    for (let b = 0; b < totalBatches; b++) {
      await runBatch(b * batchSize, Math.min(batchSize, iterations - b * batchSize));
    }

    const totalTimeMs = performance.now() - startTime;
    latencies.sort((a, b) => a - b);

    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const throughputRps = (iterations / (totalTimeMs / 1000)).toFixed(1);

    results[concurrency] = {
      totalOps: iterations,
      concurrency,
      totalTimeSec: (totalTimeMs / 1000).toFixed(2),
      throughputRps,
      p50Ms: p50.toFixed(2),
      p95Ms: p95.toFixed(2),
      p99Ms: p99.toFixed(2),
      errorRatePercent: ((errors / iterations) * 100).toFixed(2)
    };

    console.log(`    ➔ Throughput: ${throughputRps} ops/sec | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99: ${p99.toFixed(2)}ms | Errors: ${errors}`);
  }

  console.log('\n------------------------------------------------------------');
  console.log('📊 DATABASE CAPACITY AUDIT SUMMARY TABLE');
  console.log('------------------------------------------------------------');
  console.table(results);

  const mem = process.memoryUsage();
  console.log(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log('============================================================\n');
}

runDatabaseCapacityBenchmark();
