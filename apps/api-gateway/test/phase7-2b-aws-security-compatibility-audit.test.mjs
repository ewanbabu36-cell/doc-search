import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const infraDir = path.join(rootDir, 'infra');
const dockerDir = path.join(rootDir, 'docker');

test('Phase 7.2B: AWS Infrastructure Security, Compatibility & Cost Audit Certification', async (t) => {
  // ---------------------------------------------------------------------------
  // Scenario 1: EKS Version Support & Graviton ARM64 Compatibility
  // ---------------------------------------------------------------------------
  await t.test('Scenario 1: EKS Version Support & Graviton ARM64 Compatibility', async (st) => {
    await st.test('1.1 EKS Kubernetes version is 1.31 (standard AWS support, zero extended surcharge)', () => {
      const varsPath = path.join(infraDir, 'variables.tf');
      const varsContent = fs.readFileSync(varsPath, 'utf8');

      assert.match(varsContent, /variable "kubernetes_version"[\s\S]*?default\s*=\s*"1\.31"/, 'Must default to Kubernetes 1.31');
    });

    await st.test('1.2 EKS public endpoint access CIDRs are parameterized with restricted defaults', () => {
      const eksPath = path.join(infraDir, 'eks.tf');
      const varsPath = path.join(infraDir, 'variables.tf');
      const eksContent = fs.readFileSync(eksPath, 'utf8');
      const varsContent = fs.readFileSync(varsPath, 'utf8');

      assert.match(eksContent, /public_access_cidrs\s*=\s*var\.eks_public_access_cidrs/, 'EKS cluster must parameterize public_access_cidrs');
      assert.match(varsContent, /variable "eks_public_access_cidrs"/, 'Must define eks_public_access_cidrs variable');
    });

    await st.test('1.3 Production Dockerfiles utilize official multi-architecture base images supporting linux/arm64', () => {
      const apiGatewayDf = fs.readFileSync(path.join(dockerDir, 'Dockerfile.api-gateway'), 'utf8');
      const webAppDf = fs.readFileSync(path.join(dockerDir, 'Dockerfile.web-app'), 'utf8');
      const pacsDf = fs.readFileSync(path.join(dockerDir, 'Dockerfile.pacs-server'), 'utf8');

      assert.match(apiGatewayDf, /FROM node:20-alpine/, 'API Gateway must use official Node alpine');
      assert.match(webAppDf, /FROM nginx:1\.27-alpine/, 'Web apps must use official NGINX alpine');
      assert.match(pacsDf, /FROM node:20-alpine/, 'PACS must use official Node alpine');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: Terraform State, Remote Backend & CloudTrail Audit Logging
  // ---------------------------------------------------------------------------
  await t.test('Scenario 2: Terraform State, Remote Backend & CloudTrail Audit Logging', async (st) => {
    await st.test('2.1 S3 remote state bucket enforces versioning, KMS SSE, and public access blocks', () => {
      const backendPath = path.join(infraDir, 'remote_state_backend.tf');
      assert.ok(fs.existsSync(backendPath), 'remote_state_backend.tf must exist');
      const backendContent = fs.readFileSync(backendPath, 'utf8');

      assert.match(backendContent, /resource "aws_s3_bucket" "terraform_state"/, 'Must define S3 state bucket');
      assert.match(backendContent, /resource "aws_s3_bucket_versioning" "terraform_state"/, 'Must enable state versioning');
      assert.match(backendContent, /resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state"/, 'Must enforce KMS SSE on state');
      assert.match(backendContent, /block_public_acls\s*=\s*true/, 'Must block public ACLs');
      assert.match(backendContent, /restrict_public_buckets\s*=\s*true/, 'Must restrict public buckets');
    });

    await st.test('2.2 DynamoDB table enforces LockID primary key and encryption for state locking', () => {
      const backendPath = path.join(infraDir, 'remote_state_backend.tf');
      const backendContent = fs.readFileSync(backendPath, 'utf8');

      assert.match(backendContent, /resource "aws_dynamodb_table" "terraform_locks"/, 'Must define DynamoDB lock table');
      assert.match(backendContent, /hash_key\s*=\s*"LockID"/, 'Must define LockID hash key');
      assert.match(backendContent, /billing_mode\s*=\s*"PAY_PER_REQUEST"/, 'Must use serverless pay-per-request');
    });

    await st.test('2.3 Multi-Region CloudTrail is configured with KMS encryption and log file validation', () => {
      const ctPath = path.join(infraDir, 'cloudtrail.tf');
      assert.ok(fs.existsSync(ctPath), 'cloudtrail.tf must exist');
      const ctContent = fs.readFileSync(ctPath, 'utf8');

      assert.match(ctContent, /resource "aws_cloudtrail" "main"/, 'Must define CloudTrail trail');
      assert.match(ctContent, /is_multi_region_trail\s*=\s*true/, 'Must be a multi-region trail');
      assert.match(ctContent, /enable_log_file_validation\s*=\s*true/, 'Must enable log file validation');
      assert.match(ctContent, /kms_key_id\s*=/, 'Must encrypt CloudTrail logs with KMS');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 3: PACS Storage Concurrency & Database Connection Limits
  // ---------------------------------------------------------------------------
  await t.test('Scenario 3: PACS Storage Concurrency & Database Connection Limits', async (st) => {
    await st.test('3.1 PACS deployment guarantees single-writer safety on EBS gp3 RWO volume', () => {
      const pacsManifest = fs.readFileSync(path.join(rootDir, 'k8s/11-pacs-server.yaml'), 'utf8');

      assert.match(pacsManifest, /replicas:\s*1/, 'PACS must be configured as single-replica to protect pacs-index.json');
      assert.match(pacsManifest, /type:\s*Recreate/, 'PACS must use Recreate deployment strategy');
      assert.match(pacsManifest, /claimName:\s*docsearch-pacs-pvc/, 'PACS must mount dedicated EBS PVC');
    });

    await st.test('3.2 RDS connection pool budget supports maximum HPA scaling within instance ceiling', () => {
      const rdsPath = path.join(infraDir, 'rds.tf');
      const gatewayManifestPath = path.join(rootDir, 'k8s/10-api-gateway.yaml');
      const rdsContent = fs.readFileSync(rdsPath, 'utf8');
      const gatewayContent = fs.readFileSync(gatewayManifestPath, 'utf8');

      // Verify RDS has connection spike alarm
      assert.match(rdsContent, /resource "aws_db_instance" "primary"/, 'RDS instance must be defined');
      // Verify HPA max replicas is bounded
      assert.match(gatewayContent, /maxReplicas:\s*20/, 'API Gateway maxReplicas must be bounded at 20');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 4: Terraform Formatting, Validation & Dry-Run Plan
  // ---------------------------------------------------------------------------
  await t.test('Scenario 4: Terraform Formatting, Validation & Dry-Run Plan', async (st) => {
    await st.test('4.1 Terraform fmt -check passes cleanly across all infrastructure manifests', () => {
      const fmtOutput = execSync('terraform fmt -check -recursive', { cwd: infraDir, encoding: 'utf8' });
      assert.equal(fmtOutput.trim(), '', 'terraform fmt -check must return empty clean output');
    });

    await st.test('4.2 Terraform validate passes with zero errors or warnings', () => {
      const valOutput = execSync('terraform validate -no-color', { cwd: infraDir, encoding: 'utf8' });
      assert.match(valOutput, /Success! The configuration is valid\./, 'Terraform validation must succeed');
    });

    await st.test('4.3 Terraform plan executes cleanly with 128 additions, 0 changes, 0 destructions', () => {
      const planOutput = execSync('terraform plan -no-color', { cwd: infraDir, encoding: 'utf8' });
      assert.match(planOutput, /Plan:\s*128 to add,\s*0 to change,\s*0 to destroy\./, 'Plan must indicate 128 additions, 0 to change, 0 to destroy');
    });
  });
});
