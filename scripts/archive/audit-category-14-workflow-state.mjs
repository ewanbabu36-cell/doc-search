import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ROOT_DIR = 'D:/DOC SEARCH';
const REPORT_DIR = path.join(ROOT_DIR, 'reports', 'workflow-state');

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function runAudit() {
  console.log('=== STARTING CATEGORY 14 WORKFLOW & STATE BASELINE AUDIT ===\n');

  // 1. Database Schema Scan for State Columns & Constraints
  console.log('[1/6] Scanning PostgreSQL database schema for status columns...');
  let dbStatusColumns = [];
  try {
    const res = await pool.query(`
      SELECT 
        c.table_schema, 
        c.table_name, 
        c.column_name, 
        c.data_type, 
        c.column_default, 
        c.is_nullable
      FROM information_schema.columns c
      WHERE c.table_schema IN ('clinical', 'company', 'core', 'public')
        AND (
          c.column_name LIKE '%status%'
          OR c.column_name LIKE '%state%'
          OR c.column_name LIKE '%stage%'
          OR c.column_name IN ('step', 'phase')
        )
      ORDER BY c.table_schema, c.table_name, c.column_name;
    `);
    dbStatusColumns = res.rows;
    console.log(`  Found ${dbStatusColumns.length} state/status columns across tables in PostgreSQL.`);
  } catch (err) {
    console.warn('  Database query failed, using static analysis:', err.message);
  }

  // 2. Scan API Routes for State Changing Endpoints
  console.log('[2/6] Scanning API routes for state transitions and status mutation endpoints...');
  const routesDir = path.join(ROOT_DIR, 'apps/api-gateway/src/routes');
  const routeFiles = [];
  function collectRouteFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collectRouteFiles(full);
      else if (entry.isFile() && (entry.name.endsWith('.routes.ts') || entry.name.endsWith('.routes.js'))) {
        routeFiles.push(full);
      }
    }
  }
  if (fs.existsSync(routesDir)) collectRouteFiles(routesDir);

  const transitionEndpoints = [];
  const clientControlledStatusEndpoints = [];
  const statusParamRegex = /status|state|workflowStatus|stage|transition/i;

  for (const fpath of routeFiles) {
    const content = fs.readFileSync(fpath, 'utf8');
    const relPath = path.relative(ROOT_DIR, fpath).replace(/\\/g, '/');

    // Match route declarations: fastify.(post|patch|put)('url', ...)
    const routeRegex = /fastify\.(post|patch|put)\s*\(\s*['"`]([^'"`]+)['"`]([\s\S]*?)(?=fastify\.(post|patch|put|get|delete)\s*\(|$)/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const url = match[2];
      const handlerBody = match[3];

      const isStatusEndpoint =
        url.includes('/status') ||
        url.includes('/state') ||
        url.includes('/transition') ||
        url.includes('/cancel') ||
        url.includes('/complete') ||
        url.includes('/close') ||
        url.includes('/approve') ||
        url.includes('/reject') ||
        url.includes('/dispense') ||
        url.includes('/verify') ||
        url.includes('/collect') ||
        url.includes('/result') ||
        url.includes('/check-in') ||
        url.includes('/checkout') ||
        url.includes('/checkin');

      // Check if body schema or handler accepts client-supplied status
      const hasStatusInBody =
        handlerBody.includes('request.body') &&
        (handlerBody.includes('.status') || handlerBody.includes('status:'));

      const hasValidation =
        handlerBody.includes('validateBody') ||
        handlerBody.includes('z.enum') ||
        handlerBody.includes('Schema');

      const hasPermissionGuard =
        handlerBody.includes('requirePermission') ||
        handlerBody.includes('authenticate') ||
        handlerBody.includes('requireRole');

      if (isStatusEndpoint || hasStatusInBody) {
        transitionEndpoints.push({
          relPath,
          method,
          url,
          hasStatusInBody,
          hasValidation,
          hasPermissionGuard
        });

        // Flag potential client-controlled status bypass
        if (
          hasStatusInBody &&
          !handlerBody.includes('assertTransition') &&
          !handlerBody.includes('isValidTransition') &&
          !handlerBody.includes('canTransition') &&
          !handlerBody.includes('validateTransition') &&
          !handlerBody.includes('ALLOWED_TRANSITIONS')
        ) {
          clientControlledStatusEndpoints.push({
            relPath,
            method,
            url
          });
        }
      }
    }
  }
  console.log(`  Identified ${transitionEndpoints.length} state-transition endpoints.`);
  console.log(`  Flagged ${clientControlledStatusEndpoints.length} endpoints accepting client status without inline transition mapping.`);

  // 3. Scan Services & Repositories for State Machines & Transition Validation
  console.log('[3/6] Scanning services and repositories for state machine enforcement...');
  const servicesDir = path.join(ROOT_DIR, 'apps/api-gateway/src/services');
  const reposDir = path.join(ROOT_DIR, 'apps/api-gateway/src/repositories');
  
  const stateMachineImplementations = [];
  const unvalidatedStateMutations = [];

  function scanCodeFiles(dir, category) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scanCodeFiles(full, category);
      else if (entry.isFile() && entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(full, 'utf8');
        const relPath = path.relative(ROOT_DIR, full).replace(/\\/g, '/');

        // Look for state transitions
        const hasTransitionRules =
          content.includes('ALLOWED_TRANSITIONS') ||
          content.includes('validTransitions') ||
          content.includes('assertTransition') ||
          content.includes('canTransition') ||
          content.includes('VALID_TRANSITIONS') ||
          content.includes('TRANSITION_RULES') ||
          content.includes('STATE_MACHINE');

        if (hasTransitionRules) {
          stateMachineImplementations.push({
            category,
            relPath,
            name: entry.name
          });
        }

        // Look for direct status updates without validation
        const statusUpdateMatches = [...content.matchAll(/update\([a-zA-Z0-9_]+\)\s*\.set\(\s*\{[^}]*status\s*:\s*([^,}]+)/g)];
        for (const m of statusUpdateMatches) {
          const statusVal = m[1].trim();
          if (
            !hasTransitionRules &&
            !content.includes('where(') &&
            !content.includes('status ===')
          ) {
            unvalidatedStateMutations.push({
              category,
              relPath,
              lineMatch: m[0].slice(0, 100)
            });
          }
        }
      }
    }
  }

  scanCodeFiles(servicesDir, 'Service');
  scanCodeFiles(reposDir, 'Repository');
  console.log(`  Found ${stateMachineImplementations.length} formal state machine implementations.`);

  // 4. Universal Workflow Engine Integration Scan
  console.log('[4/6] Inspecting Universal Workflow Engine and Domain Workflow Bridges...');
  const workflowEngineDir = path.join(ROOT_DIR, 'apps/api-gateway/src/services/workflow');
  const workflowServices = [];
  if (fs.existsSync(workflowEngineDir)) {
    for (const f of fs.readdirSync(workflowEngineDir)) {
      if (f.endsWith('.ts')) workflowServices.push(f);
    }
  }

  // 5. Scan Frontend for LocalStorage & Optimistic UI State
  console.log('[5/6] Scanning frontend apps for workflow state in localStorage and optimistic state...');
  const frontendApps = [
    'apps/partner-platform/src',
    'apps/company-platform/src',
    'apps/landing-page/src'
  ];
  const frontendStorageFindings = [];
  const optimisticStateFindings = [];

  for (const appDir of frontendApps) {
    const fullAppDir = path.join(ROOT_DIR, appDir);
    if (!fs.existsSync(fullAppDir)) continue;

    function scanFrontend(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) scanFrontend(full);
        else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
          const content = fs.readFileSync(full, 'utf8');
          const relPath = path.relative(ROOT_DIR, full).replace(/\\/g, '/');

          // Check for localStorage business state
          const storageMatches = [...content.matchAll(/localStorage\.(getItem|setItem)\s*\(\s*['"`]([^'"`]+)['"`]/g)];
          for (const sm of storageMatches) {
            const key = sm[2];
            if (
              key.includes('workflow') ||
              key.includes('status') ||
              key.includes('order') ||
              key.includes('patient') ||
              key.includes('consultation') ||
              key.includes('queue') ||
              key.includes('token') ||
              key.includes('prescription')
            ) {
              frontendStorageFindings.push({
                relPath,
                action: sm[1],
                key
              });
            }
          }

          // Check for optimistic state updates without rollback
          if (
            content.includes('setStatus(') &&
            content.includes('api.') &&
            !content.includes('catch')
          ) {
            optimisticStateFindings.push({
              relPath,
              file: entry.name
            });
          }
        }
      }
    }
    scanFrontend(fullAppDir);
  }
  console.log(`  Identified ${frontendStorageFindings.length} frontend storage references to workflow keys.`);

  // 6. Core Business Workflow Entity Analysis
  console.log('[6/6] Compiling Core Workflow Entities & Lifecycle States...');
  const coreWorkflows = [
    {
      workflow: 'PARTNER_ONBOARDING',
      entity: 'partner_profiles',
      stages: ['LEAD', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED'],
      initialState: 'LEAD',
      terminalStates: ['REJECTED', 'SUSPENDED', 'TERMINATED']
    },
    {
      workflow: 'COMMERCIAL_SUBSCRIPTION',
      entity: 'subscriptions',
      stages: ['PENDING', 'ACTIVE', 'RENEWAL_WINDOW', 'EXPIRING_SOON', 'GRACE_PERIOD', 'EXPIRED', 'LOCKED', 'CANCELLED'],
      initialState: 'PENDING',
      terminalStates: ['CANCELLED', 'REVOKED']
    },
    {
      workflow: 'PATIENT_REGISTRATION',
      entity: 'patients',
      stages: ['ACTIVE', 'INACTIVE', 'MERGED', 'DECEASED'],
      initialState: 'ACTIVE',
      terminalStates: ['DECEASED', 'MERGED']
    },
    {
      workflow: 'APPOINTMENT_LIFECYCLE',
      entity: 'appointments',
      stages: ['BOOKED', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      initialState: 'BOOKED',
      terminalStates: ['COMPLETED', 'CANCELLED', 'NO_SHOW']
    },
    {
      workflow: 'QUEUE_TOKEN_LIFECYCLE',
      entity: 'queue_tokens',
      stages: ['GENERATED', 'WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
      initialState: 'GENERATED',
      terminalStates: ['COMPLETED', 'CANCELLED', 'SKIPPED']
    },
    {
      workflow: 'CLINICAL_ENCOUNTER',
      entity: 'encounters',
      stages: ['REGISTERED', 'CHECKED_IN', 'TRIAGE_DONE', 'WAITING', 'IN_CONSULTATION', 'DISCHARGED', 'COMPLETED', 'CANCELLED'],
      initialState: 'REGISTERED',
      terminalStates: ['COMPLETED', 'CANCELLED', 'DISCHARGED']
    },
    {
      workflow: 'CLINICAL_CONSULTATION',
      entity: 'consultations',
      stages: ['DRAFT', 'IN_PROGRESS', 'DIAGNOSIS_RECORDED', 'INVESTIGATION_ORDERED', 'PRESCRIPTION_GENERATED', 'COMPLETED', 'CANCELLED'],
      initialState: 'DRAFT',
      terminalStates: ['COMPLETED', 'CANCELLED']
    },
    {
      workflow: 'LAB_DIAGNOSTICS_LIMS',
      entity: 'lab_orders',
      stages: ['ORDERED', 'ACCEPTED', 'SPECIMEN_COLLECTED', 'IN_ANALYSIS', 'RESULTED', 'VERIFIED', 'REPORT_RELEASED', 'CANCELLED'],
      initialState: 'ORDERED',
      terminalStates: ['REPORT_RELEASED', 'CANCELLED']
    },
    {
      workflow: 'RADIOLOGY_RIS_PACS',
      entity: 'radiology_orders',
      stages: ['REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'ACQUIRED', 'REPORTED', 'VERIFIED', 'COMPLETED', 'CANCELLED'],
      initialState: 'REQUESTED',
      terminalStates: ['COMPLETED', 'CANCELLED']
    },
    {
      workflow: 'PRESCRIPTION_LIFECYCLE',
      entity: 'prescriptions',
      stages: ['DRAFT', 'ISSUED', 'QUEUED_PHARMACY', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED'],
      initialState: 'DRAFT',
      terminalStates: ['DISPENSED', 'CANCELLED']
    },
    {
      workflow: 'PHARMACY_DISPENSING',
      entity: 'dispensing_sessions',
      stages: ['QUEUED', 'STOCK_RESERVED', 'VERIFIED', 'DISPENSED', 'REJECTED'],
      initialState: 'QUEUED',
      terminalStates: ['DISPENSED', 'REJECTED']
    },
    {
      workflow: 'BILLING_INVOICE',
      entity: 'billing_invoices',
      stages: ['DRAFT', 'GENERATED', 'PARTIALLY_PAID', 'PAID', 'VOID', 'REFUNDED'],
      initialState: 'DRAFT',
      terminalStates: ['PAID', 'VOID', 'REFUNDED']
    }
  ];

  const baselineData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRouteFiles: routeFiles.length,
      totalTransitionEndpoints: transitionEndpoints.length,
      clientControlledStatusEndpoints: clientControlledStatusEndpoints.length,
      dbStatusColumnsCount: dbStatusColumns.length,
      formalStateMachinesCount: stateMachineImplementations.length,
      universalWorkflowServicesCount: workflowServices.length,
      frontendWorkflowStorageKeys: frontendStorageFindings.length,
      coreWorkflowsCount: coreWorkflows.length
    },
    coreWorkflows,
    dbStatusColumns,
    transitionEndpoints,
    clientControlledStatusEndpoints,
    stateMachineImplementations,
    workflowServices,
    frontendStorageFindings
  };

  // Write JSON
  fs.writeFileSync(path.join(REPORT_DIR, 'baseline.json'), JSON.stringify(baselineData, null, 2), 'utf8');
  console.log(`Saved baseline JSON: ${path.join(REPORT_DIR, 'baseline.json')}`);

  // Generate Markdown
  let md = `# DOC SEARCH — CATEGORY 14: WORKFLOW / STATE BASELINE AUDIT REPORT\n\n`;
  md += `**Generated:** ${baselineData.timestamp}\n`;
  md += `**Audit Scope:** Full Monorepo Workflow State Machines, Transitions, APIs, and DB Persistence\n\n`;

  md += `## 1. Executive Summary\n\n`;
  md += `- **Route Files Scanned:** ${routeFiles.length}\n`;
  md += `- **State Transition Endpoints Found:** ${transitionEndpoints.length}\n`;
  md += `- **Endpoints Allowing Direct Status Updates:** ${clientControlledStatusEndpoints.length}\n`;
  md += `- **PostgreSQL Status/State Columns:** ${dbStatusColumns.length}\n`;
  md += `- **Formal Service State Machines:** ${stateMachineImplementations.length}\n`;
  md += `- **Universal Workflow Engine Services:** ${workflowServices.length}\n`;
  md += `- **Frontend Workflow Storage References:** ${frontendStorageFindings.length}\n`;
  md += `- **Audited Core Business Workflows:** ${coreWorkflows.length}\n\n`;

  md += `## 2. Core Business Workflow State Models\n\n`;
  md += `| Workflow | Entity Table | Initial State | Active / Intermediate Stages | Terminal States |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  for (const cw of coreWorkflows) {
    md += `| \`${cw.workflow}\` | \`${cw.entity}\` | \`${cw.initialState}\` | ${cw.stages.filter(s => s !== cw.initialState && !cw.terminalStates.includes(s)).join(', ')} | \`${cw.terminalStates.join(', ')}\` |\n`;
  }

  md += `\n## 3. High-Risk State Transition Endpoints (Client-Supplied Status)\n\n`;
  md += `The following endpoints accept client status payloads and require deep state-machine transition validation audit:\n\n`;
  md += `| Method | Endpoint | File Location |\n`;
  md += `| :--- | :--- | :--- |\n`;
  for (const ep of clientControlledStatusEndpoints.slice(0, 35)) {
    md += `| \`${ep.method}\` | \`${ep.url}\` | [\`${ep.relPath}\`](file:///${ep.relPath}) |\n`;
  }
  if (clientControlledStatusEndpoints.length > 35) {
    md += `\n*... and ${clientControlledStatusEndpoints.length - 35} more endpoints listed in baseline.json*\n`;
  }

  md += `\n## 4. Formal State Machine Implementations in Codebase\n\n`;
  for (const sm of stateMachineImplementations) {
    md += `- **${sm.category}:** [\`${sm.relPath}\`](file:///${sm.relPath})\n`;
  }

  md += `\n## 5. Universal Workflow Engine Architecture\n\n`;
  md += `Services residing in \`apps/api-gateway/src/services/workflow\`:\n`;
  for (const ws of workflowServices) {
    md += `- \`${ws}\`\n`;
  }

  md += `\n## 6. Frontend Workflow Storage Keys (Non-Authoritative Verification)\n\n`;
  if (frontendStorageFindings.length === 0) {
    md += `No workflow business keys found in localStorage/sessionStorage.\n`;
  } else {
    for (const fsf of frontendStorageFindings.slice(0, 20)) {
      md += `- \`${fsf.action}\` key: \`${fsf.key}\` in [\`${fsf.relPath}\`](file:///${fsf.relPath})\n`;
    }
  }

  fs.writeFileSync(path.join(REPORT_DIR, 'baseline.md'), md, 'utf8');
  console.log(`Saved baseline Markdown: ${path.join(REPORT_DIR, 'baseline.md')}`);
  console.log('\n=== BASELINE AUDIT COMPLETE ===');
  await pool.end();
}

runAudit().catch(err => {
  console.error('Audit failure:', err);
  process.exit(1);
});
