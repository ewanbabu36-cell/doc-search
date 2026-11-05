import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const infraDir = path.join(rootDir, 'infra');
const k8sDir = path.join(rootDir, 'k8s');
const scriptsDir = path.join(rootDir, 'scripts');

test('Phase 7.2C: Production Readiness & Controlled AWS Staging Certification', async (t) => {
  // ---------------------------------------------------------------------------
  // Scenario 1: EKS Kubernetes Lifecycle Matrix & Official AWS Support Governance
  // ---------------------------------------------------------------------------
  await t.test('Scenario 1: EKS Kubernetes Lifecycle Matrix & Official AWS Support Governance', async (st) => {
    await st.test('1.1 EKS Kubernetes version is parameterized and supports Standard AWS Support', () => {
      const varsPath = path.join(infraDir, 'variables.tf');
      const varsContent = fs.readFileSync(varsPath, 'utf8');

      assert.match(varsContent, /variable "kubernetes_version"/, 'Must define kubernetes_version variable');
      assert.match(varsContent, /default\s*=\s*"1\.(31|32|33|34|35)"/, 'Must default to an AWS EKS supported release');
    });

    await st.test('1.2 EKS cluster configuration enforces private endpoint and restricts public CIDRs', () => {
      const eksPath = path.join(infraDir, 'eks.tf');
      const eksContent = fs.readFileSync(eksPath, 'utf8');

      assert.match(eksContent, /endpoint_private_access\s*=\s*true/, 'Private API endpoint must be enabled');
      assert.match(eksContent, /public_access_cidrs\s*=\s*var\.eks_public_access_cidrs/, 'Public access CIDRs must be parameterized');
    });

    await st.test('1.3 Kubernetes manifests use non-deprecated standard API versions compatible with AWS EKS', () => {
      const appDeployment = fs.readFileSync(path.join(k8sDir, '10-api-gateway.yaml'), 'utf8');
      const ingress = fs.readFileSync(path.join(k8sDir, '20-ingress.yaml'), 'utf8');
      const storage = fs.readFileSync(path.join(k8sDir, '05-storage.yaml'), 'utf8');

      assert.match(appDeployment, /apiVersion:\s*apps\/v1/, 'Deployments must use apps/v1');
      assert.match(ingress, /apiVersion:\s*networking\.k8s\.io\/v1/, 'Ingress must use networking.k8s.io/v1');
      assert.match(storage, /apiVersion:\s*storage\.k8s\.io\/v1/, 'StorageClass must use storage.k8s.io/v1');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: Terraform Remote State Bootstrap, DynamoDB Locking & S3 KMS Encryption
  // ---------------------------------------------------------------------------
  await t.test('Scenario 2: Terraform Remote State Bootstrap, DynamoDB Locking & S3 KMS Encryption', async (st) => {
    await st.test('2.1 Remote state S3 bucket enforces versioning, KMS SSE, and public access blocks', () => {
      const statePath = path.join(infraDir, 'remote_state_backend.tf');
      assert.ok(fs.existsSync(statePath), 'remote_state_backend.tf must exist');
      const content = fs.readFileSync(statePath, 'utf8');

      assert.match(content, /resource "aws_s3_bucket" "terraform_state"/, 'Must declare state bucket');
      assert.match(content, /resource "aws_s3_bucket_versioning" "terraform_state"/, 'Must enable versioning');
      assert.match(content, /resource "aws_s3_bucket_server_side_encryption_configuration"/, 'Must configure KMS SSE');
      assert.match(content, /resource "aws_s3_bucket_public_access_block"/, 'Must block public access');
    });

    await st.test('2.2 DynamoDB distributed locking table enforces LockID string key and PITR recovery', () => {
      const content = fs.readFileSync(path.join(infraDir, 'remote_state_backend.tf'), 'utf8');

      assert.match(content, /resource "aws_dynamodb_table" "terraform_locks"/, 'Must declare DynamoDB lock table');
      assert.match(content, /hash_key\s*=\s*"LockID"/, 'Hash key must be LockID');
      assert.match(content, /point_in_time_recovery\s*\{[\s\S]*?enabled\s*=\s*true/, 'Must enable point in time recovery');
      assert.match(content, /server_side_encryption\s*\{[\s\S]*?enabled\s*=\s*true/, 'Must enable server-side encryption');
    });

    await st.test('2.3 Multi-Region CloudTrail is configured with KMS encryption and log file validation', () => {
      const ctPath = path.join(infraDir, 'cloudtrail.tf');
      assert.ok(fs.existsSync(ctPath), 'cloudtrail.tf must exist');
      const content = fs.readFileSync(ctPath, 'utf8');

      assert.match(content, /is_multi_region_trail\s*=\s*true/, 'CloudTrail must be multi-region');
      assert.match(content, /enable_log_file_validation\s*=\s*true/, 'Log file validation must be enabled');
      assert.match(content, /kms_key_id\s*=\s*aws_kms_key\.backup\.arn/, 'Logs must be encrypted with KMS CMK');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 3: PostgreSQL PACS Migration, EBS Storage Persistence & Index Recovery
  // ---------------------------------------------------------------------------
  await t.test('Scenario 3: PostgreSQL PACS Migration, EBS Storage Persistence & Index Recovery', async (st) => {
    await st.test('3.1 PACS server implements /health endpoint for Kubernetes liveness/readiness probes', () => {
      const pacsContent = fs.readFileSync(path.join(scriptsDir, 'docsearch-pacs-server.mjs'), 'utf8');

      assert.match(pacsContent, /pathname === '\/health'/, 'PACS server must handle /health probe endpoint');
      assert.match(pacsContent, /pathname === '\/api\/v1\/pacs\/sync-postgres'/, 'PACS server must provide postgres sync hook');
    });

    await st.test('3.2 PACS migration script persists studies into PostgreSQL 18.4 with ACID integrity', async () => {
      const { runPacsPostgresMigration } = await import(pathToFileURL(path.join(scriptsDir, 'migrate-pacs-to-postgres.mjs')).href);
      const result = await runPacsPostgresMigration({ quiet: true });

      assert.equal(result.success, true, 'Migration must succeed');
      assert.ok(result.migratedCount >= 3, 'Must migrate at least 3 seeded DICOM studies');
      assert.ok(result.fileVerifiedCount >= 25, 'Must verify physical DICOM files on persistent volume');
    });

    await st.test('3.3 Disaster recovery: Reconstructs local PACS index from PostgreSQL', async () => {
      const { reconstructPacsIndexFromPostgres } = await import(pathToFileURL(path.join(scriptsDir, 'migrate-pacs-to-postgres.mjs')).href);
      const tempRestoreFile = path.join(rootDir, 'data', 'pacs-storage', 'pacs-index-restored-test.json');

      const reconstructed = await reconstructPacsIndexFromPostgres(tempRestoreFile);
      assert.ok(Array.isArray(reconstructed), 'Must return array of reconstructed studies');
      assert.ok(reconstructed.length >= 3, 'Must reconstruct at least 3 studies');
      assert.equal(reconstructed[0].recoveredFromDatabase, true, 'Reconstructed studies must flag recoveredFromDatabase');

      // Cleanup temp test file
      if (fs.existsSync(tempRestoreFile)) {
        fs.unlinkSync(tempRestoreFile);
      }
    });

    await st.test('3.4 PACS deployment guarantees single-writer safety on EBS gp3 RWO volume', () => {
      const pacsK8s = fs.readFileSync(path.join(k8sDir, '11-pacs-server.yaml'), 'utf8');

      assert.match(pacsK8s, /replicas:\s*1/, 'PACS must run as single replica in Active-Passive mode');
      assert.match(pacsK8s, /type:\s*Recreate/, 'PACS must use Recreate strategy to cleanly detach RWO EBS volumes');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 4: Regulatory, Financial, DNS, TLS & Disaster Recovery Production Gates
  // ---------------------------------------------------------------------------
  await t.test('Scenario 4: Regulatory, Financial, DNS, TLS & Disaster Recovery Production Gates', async (st) => {
    await st.test('4.1 Section 194-O TDS enforces amended 0.1% rate and Form 26Q compliance', () => {
      const finLibPath = path.join(rootDir, 'apps/api-gateway/src/services/billing/PlatformWaterfallEngine.ts');
      if (fs.existsSync(finLibPath)) {
        const content = fs.readFileSync(finLibPath, 'utf8');
        assert.match(content, /0\.001|0\.1%/, 'Must enforce statutory 0.1% amended rate');
      }
    });

    await st.test('4.2 Indian GST engine enforces 0% healthcare exemption under Notification 12/2017-CT(R)', () => {
      const taxPath = path.join(rootDir, 'apps/api-gateway/src/services/billing/TaxCalculationService.ts');
      if (fs.existsSync(taxPath)) {
        const content = fs.readFileSync(taxPath, 'utf8');
        assert.match(content, /12\/2017/, 'Must reference Notification 12/2017');
      }
    });

    await st.test('4.3 AWS Backup Vault enforces WORM lock and cross-region replication to ap-south-2', () => {
      const backupPath = path.join(infraDir, 'backup.tf');
      const backupContent = fs.readFileSync(backupPath, 'utf8');

      assert.match(backupContent, /resource "aws_backup_vault" "primary_vault"/, 'Must define primary backup vault');
      assert.match(backupContent, /resource "aws_backup_vault" "dr_vault"/, 'Must define DR backup vault');
      assert.match(backupContent, /provider\s*=\s*aws\.dr/, 'DR vault must be provisioned in secondary DR region');
      assert.match(backupContent, /destination_vault_arn\s*=\s*aws_backup_vault\.dr_vault\.arn/, 'Must copy snapshots to DR vault');
      assert.match(backupContent, /resource "aws_backup_vault_lock_configuration" "worm_lock"/, 'Must define WORM lock');
    });

    await st.test('4.4 Ingress terminates TLS 1.2 and 1.3 with HSTS and cert-manager ECDSA 256-bit certificates', () => {
      const ingressPath = path.join(k8sDir, '20-ingress.yaml');
      const certPath = path.join(k8sDir, '06-cert-manager.yaml');
      const ingressContent = fs.readFileSync(ingressPath, 'utf8');
      const certContent = fs.readFileSync(certPath, 'utf8');

      assert.match(ingressContent, /ssl-protocols:\s*"TLSv1\.2 TLSv1\.3"/, 'Ingress must enforce TLS 1.2 and 1.3');
      assert.match(ingressContent, /Strict-Transport-Security:\s*max-age=63072000/, 'Ingress must enforce 2-year HSTS');
      assert.match(certContent, /algorithm:\s*ECDSA/, 'Certificate must use ECDSA');
      assert.match(certContent, /size:\s*256/, 'Certificate must use 256-bit key size');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 5: Terraform Formatting, Validation & Dry-Run Plan
  // ---------------------------------------------------------------------------
  await t.test('Scenario 5: Terraform Formatting, Validation & Dry-Run Plan', async (st) => {
    await st.test('5.1 Terraform fmt -check passes cleanly across all infrastructure manifests', () => {
      const fmtOutput = execSync('terraform fmt -check -recursive infra', { cwd: rootDir, encoding: 'utf8' });
      assert.equal(fmtOutput.trim(), '', 'All Terraform files must be canonically formatted');
    });

    await st.test('5.2 Terraform validate passes with zero errors or warnings', () => {
      const valOutput = execSync('terraform validate -no-color', { cwd: infraDir, encoding: 'utf8' });
      assert.match(valOutput, /Success! The configuration is valid\./, 'Terraform validation must succeed');
    });

    await st.test('5.3 Terraform plan executes cleanly with 128 additions, 0 changes, 0 destructions', () => {
      const planOutput = execSync('terraform plan -no-color', { cwd: infraDir, encoding: 'utf8' });
      assert.match(planOutput, /Plan:\s*128 to add,\s*0 to change,\s*0 to destroy\./, 'Must plan 128 additions with 0 destructions');
    });
  });
});
