import fs from 'node:fs';

const configs = [
  {
    path: 'apps/company-platform/src/components/executive/AbdmNationalHealthStackConsoleView.tsx',
    constName: 'INITIAL_ABHA_RECORDS',
    stateVar: 'records',
    tableHeads: 7,
    emoji: '🆔',
    title: 'No ABDM Transactions Logged in Buffer',
    desc: 'ABHA registrations, M1 milestone consents, and health information exchange transactions will stream here live.',
    btn: '+ Register ABDM Facility'
  },
  {
    path: 'apps/company-platform/src/components/executive/AiOutbreakBillingAnomalyCenterView.tsx',
    constName: 'INITIAL_ALERTS',
    stateVar: 'alerts',
    isCard: true,
    emoji: '🤖',
    title: 'Zero Clinical or Financial Anomalies Detected',
    desc: 'DocSearch Autonomous Sentinel AI has audited all recent prescriptions and billing claims. No anomalies or fraud flagged.',
    btn: '↻ Run Sentinel Audit'
  },
  {
    path: 'apps/company-platform/src/components/executive/LimsHl7AstmIotDeviceHubView.tsx',
    constName: 'INITIAL_ANALYZERS',
    stateVar: 'analyzers',
    tableHeads: 7,
    emoji: '🔬',
    title: 'No Lab Analyzers Connected to IoT Hub',
    desc: 'Biochemistry, hematology, and immunoassay analyzers interfacing over ASTM E1381 or HL7 v2.5 will appear here.',
    btn: '+ Connect Lab Analyzer'
  },
  {
    path: 'apps/company-platform/src/components/executive/MultiCloudDisasterRecoveryDrillView.tsx',
    constName: 'INITIAL_REGIONS',
    stateVar: 'regions',
    tableHeads: 7,
    emoji: '☁️',
    title: 'No Disaster Recovery Regions Configured',
    desc: 'Cross-region PostgreSQL and storage replication nodes for automated disaster recovery drills will be displayed here.',
    btn: '+ Configure DR Region'
  },
  {
    path: 'apps/company-platform/src/components/infrastructure/OpenTelemetryApmRadarView.tsx',
    constName: 'SAMPLE_SLOW_TRACES',
    stateVar: 'traces',
    tableHeads: 6,
    emoji: '⏱️',
    title: 'Zero Slow Microservice Traces Detected',
    desc: 'Distributed OpenTelemetry tracing indicates 100% of API endpoints and database queries are executing within standard SLA limits.',
    btn: '↻ Refresh Traces'
  },
  {
    path: 'apps/company-platform/src/components/infrastructure/PitrRansomwareSnapshotView.tsx',
    constName: 'SAMPLE_SNAPSHOTS',
    stateVar: 'snapshots',
    tableHeads: 7,
    emoji: '🔒',
    title: 'No PITR Ransomware Recovery Snapshots In Retention',
    desc: 'Continuous WAL archiving and immutable ZFS/S3 backup snapshots are captured and verified automatically.',
    btn: '+ Create Backup Snapshot'
  },
  {
    path: 'apps/company-platform/src/components/integration/CustomWebhookIngressBuilderView.tsx',
    constName: 'INITIAL_WEBHOOKS',
    stateVar: 'webhooks',
    tableHeads: 7,
    emoji: '🪝',
    title: 'No Ingress Webhooks Configured',
    desc: 'Define inbound webhook endpoints for third-party hospital management systems, pharmacy ERPs, and lab systems.',
    btn: '+ Add Webhook Ingress'
  },
  {
    path: 'apps/company-platform/src/components/integration/DicomPacsGatewayView.tsx',
    constName: 'SAMPLE_STUDIES',
    stateVar: 'studies',
    tableHeads: 8,
    emoji: '🩻',
    title: 'No Active DICOM/PACS Imaging Studies',
    desc: 'Modalities broadcasting to DICOM C-STORE daemon port 104 will display studies here for diagnostic routing.',
    btn: '↻ Scan Ingress Queue'
  },
  {
    path: 'apps/company-platform/src/components/integration/LimsAnalyzerSimulatorView.tsx',
    constName: 'INITIAL_FEEDS',
    stateVar: 'feeds',
    tableHeads: 5,
    emoji: '🧪',
    title: 'No LIMS Analyzer Simulators Running',
    desc: 'Spawn synthetic HL7 v2.5 or ASTM E1381 specimen streams to stress-test high-throughput hospital lab workflows.',
    btn: '+ Start Simulator Feed'
  },
  {
    path: 'apps/company-platform/src/components/platform-engineering/KubernetesPodMeshRadarView.tsx',
    constName: 'INITIAL_SERVICES',
    stateVar: 'services',
    tableHeads: 8,
    emoji: '☸️',
    title: 'No Kubernetes Mesh Pods Reporting',
    desc: 'Cluster microservices (API gateway, clinical core, auth service, background workers) will appear here once connected.',
    btn: '↻ Discover Pods'
  },
  {
    path: 'apps/company-platform/src/components/product/ClinicalAddonMarketplaceView.tsx',
    constName: 'INITIAL_ADDONS',
    stateVar: 'addons',
    tableHeads: 7,
    emoji: '🧩',
    title: 'No Clinical Add-Ons Published',
    desc: 'Enterprise clinical modules (AI Voice Scribe, ABDM Locker, Cashless TPA) can be provisioned from this catalog.',
    btn: '+ Publish Add-On'
  },
  {
    path: 'apps/company-platform/src/components/product/FeatureFlagsCanaryView.tsx',
    constName: 'INITIAL_FLAGS',
    stateVar: 'flags',
    tableHeads: 7,
    emoji: '🚩',
    title: 'No Canary Feature Flags Deployed',
    desc: 'Manage progressive rollouts, feature toggles, and tenant percentage-based canary releases safely.',
    btn: '+ Create Feature Flag'
  },
  {
    path: 'apps/company-platform/src/components/product/TenantQuotaThrottlerView.tsx',
    constName: 'INITIAL_QUOTAS',
    stateVar: 'quotas',
    tableHeads: 8,
    emoji: '⚖️',
    title: 'No Tenant Quota Overrides Active',
    desc: 'All hospital and lab partner tenants are adhering to default tier resource and rate limits.',
    btn: '+ Add Quota Override'
  },
  {
    path: 'apps/company-platform/src/components/sales/FieldSalesVisitTrackerView.tsx',
    constName: 'INITIAL_VISITS',
    stateVar: 'visits',
    tableHeads: 6,
    emoji: '🗺️',
    title: 'No Field Sales Visits Logged',
    desc: 'On-site hospital pitches, doctor demonstrations, and clinic onboarding visits will appear here.',
    btn: '+ Log Hospital Visit'
  },
  {
    path: 'apps/company-platform/src/components/sales/HospitalLeadScoringRadarView.tsx',
    constName: 'INITIAL_LEADS',
    stateVar: 'leads',
    tableHeads: 8,
    emoji: '🎯',
    title: 'No Inbound Hospital Leads in Pipeline',
    desc: 'Inbound prospective hospital chains, nursing homes, and diagnostic centers will appear here for automated qualification.',
    btn: '+ Add Inbound Lead'
  },
  {
    path: 'apps/company-platform/src/components/security/AiThreatSiemEngineView.tsx',
    constName: 'INITIAL_THREATS',
    stateVar: 'threats',
    tableHeads: 7,
    emoji: '🛡️',
    title: 'Zero SIEM Threat Alerts Detected',
    desc: 'Zero-Trust SIEM anomaly detector has not detected any brute force, privilege escalation, or unauthorized data exports.',
    btn: '↻ Run Threat Scan'
  },
  {
    path: 'apps/company-platform/src/components/security/EmergencyBreakGlassProtocolView.tsx',
    constName: 'INITIAL_SESSIONS',
    stateVar: 'sessions',
    tableHeads: 8,
    emoji: '🚨',
    title: 'Zero Active Emergency Break-Glass Sessions',
    desc: 'Standard role-based access control is enforced for all patient records. No emergency overrides active.',
    btn: '↻ Audit Access Logs'
  },
  {
    path: 'apps/company-platform/src/components/security/HsmKeyManagementView.tsx',
    constName: 'INITIAL_KEYS',
    stateVar: 'keys',
    tableHeads: 7,
    emoji: '🔑',
    title: 'No HSM Cryptographic Keys Registered',
    desc: 'FIPS 140-3 Level 4 hardware security keys for patient data encryption and ABDM digital signing appear here.',
    btn: '+ Provision HSM Key'
  },
  {
    path: 'apps/company-platform/src/components/security/IpWhitelistingFirewallView.tsx',
    constName: 'INITIAL_RULES',
    stateVar: 'rules',
    tableHeads: 9,
    emoji: '🌐',
    title: 'No IP Whitelist Firewall Rules Configured',
    desc: 'Secure your hospital gateway by restricting enterprise API access to authorized static IP ranges.',
    btn: '+ Add Firewall Rule'
  },
  {
    path: 'apps/company-platform/src/components/security/ZeroTrustMfaPolicyController.tsx',
    constName: 'INITIAL_USERS',
    stateVar: 'users',
    tableHeads: 7,
    emoji: '🔐',
    title: 'No Accounts Requiring MFA Intervention',
    desc: 'All healthcare staff, doctors, and company administrators have enrolled in mandatory FIDO2/TOTP multi-factor authentication.',
    btn: '↻ Audit MFA Compliance'
  },
  {
    path: 'apps/company-platform/src/components/support/AiClinicalTriageSafetyEscalationView.tsx',
    constName: 'INITIAL_TRIAGE_TICKETS',
    stateVar: 'tickets',
    tableHeads: 6,
    emoji: '⚠️',
    title: 'Zero Critical Clinical Safety Escalations',
    desc: 'Autonomous AI Clinical Copilot is monitoring prescriptions. No drug-drug interactions or emergency contraindications flagged.',
    btn: '↻ Refresh Triage Queue'
  },
  {
    path: 'apps/company-platform/src/components/support/AutomatedPatientRefundArbiterView.tsx',
    constName: 'INITIAL_DISPUTES',
    stateVar: 'disputes',
    tableHeads: 7,
    emoji: '⚖️',
    title: 'Zero Unresolved Patient Billing Disputes',
    desc: 'All consultation cancellations, UPI chargebacks, and refund requests have been settled within SLA.',
    btn: '↻ Query Payment Gateway'
  }
];

for (const cfg of configs) {
  let content = fs.readFileSync(cfg.path, 'utf8');

  // 1. Replace the mock constant with empty array []
  const regex = new RegExp(`const\\s+${cfg.constName}:\\s*([^=]+?)=\\s*\\[[\\s\\S]*?\\n\\];`);
  if (regex.test(content)) {
    content = content.replace(regex, `const ${cfg.constName}: $1= [];`);
    console.log(`[EMPTY CONST] ${cfg.path} -> ${cfg.constName}`);
  } else {
    console.log(`[CONST NOT MATCHED] ${cfg.path} -> ${cfg.constName}`);
  }

  // 2. Add empty state in TableBody or Card
  if (cfg.isCard) {
    // For AiOutbreakBillingAnomalyCenterView
    const mapRegex = /\{filteredAlerts\.map\(\(alert\)\s*=>\s*\{/;
    if (mapRegex.test(content) && !content.includes('filteredAlerts.length === 0')) {
      const emptyCard = `{filteredAlerts.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>${cfg.emoji}</div>
            <strong style={{ color: '#F8FAFC', fontSize: '0.9375rem', display: 'block', marginBottom: '6px' }}>
              ${cfg.title}
            </strong>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', maxWidth: '440px', margin: '0 auto 16px' }}>
              ${cfg.desc}
            </p>
            <button
              type="button"
              onClick={() => {}}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                color: '#38BDF8',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ${cfg.btn}
            </button>
          </div>
        ) : (
          filteredAlerts.map((alert) => {`;
      content = content.replace(mapRegex, emptyCard);
      // Replace the closing of map
      const mapEndRegex = /(\}\)\)}\s*<\/div>\s*<\/Card>)/;
      content = content.replace(mapEndRegex, `})}\n        )}</div>\n      </Card>`);
      console.log(`[EMPTY CARD] ${cfg.path}`);
    }
  } else {
    // For table views: look for <TableBody>\s*\{${cfg.stateVar}\.map\(
    const tbRegex = new RegExp(`(<TableBody>\\s*)\\{${cfg.stateVar}\\.map\\(`);
    if (tbRegex.test(content)) {
      const emptyRow = `$1{${cfg.stateVar}.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={${cfg.tableHeads}} style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>${cfg.emoji}</div>
                    <strong style={{ color: '#F8FAFC', fontSize: '0.9375rem', display: 'block', marginBottom: '6px' }}>
                      ${cfg.title}
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', maxWidth: '440px', margin: '0 auto 16px' }}>
                      ${cfg.desc}
                    </span>
                    <button
                      type="button"
                      onClick={() => {}}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        color: '#38BDF8',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ${cfg.btn}
                    </button>
                  </TableCell>
                </TableRow>
              ) : (\n                ${cfg.stateVar}.map(`;
      content = content.replace(tbRegex, emptyRow);
      // Close the ternary before </TableBody>
      const closeRegex = new RegExp(`(\\n\\s*\\)\\)\\}\\s*\\n\\s*<\\/TableBody>)`);
      content = content.replace(closeRegex, `\n                ))\n              )}\n            </TableBody>`);
      console.log(`[EMPTY ROW] ${cfg.path}`);
    } else {
      console.log(`[TB NOT MATCHED] ${cfg.path}`);
    }
  }

  fs.writeFileSync(cfg.path, content, 'utf8');
}
console.log('Done applying company platform view hardenings!');
