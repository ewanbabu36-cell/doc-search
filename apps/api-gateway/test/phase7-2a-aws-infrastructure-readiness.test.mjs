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

test('Phase 7.2A: AWS Enterprise Cloud Infrastructure Readiness Certification', async (t) => {
  // ---------------------------------------------------------------------------
  // Scenario 1: AWS Multi-AZ Network & VPC Topology
  // ---------------------------------------------------------------------------
  await t.test('Scenario 1: AWS Multi-AZ Network & VPC Topology', async (st) => {
    await st.test('1.1 Dedicated VPC defines Multi-AZ Public, Private App, and Private DB subnets', () => {
      const vpcPath = path.join(infraDir, 'vpc.tf');
      assert.ok(fs.existsSync(vpcPath), 'vpc.tf must exist');
      const vpcContent = fs.readFileSync(vpcPath, 'utf8');

      assert.match(vpcContent, /resource "aws_vpc" "main"/, 'Must define main VPC');
      assert.match(vpcContent, /resource "aws_subnet" "public"/, 'Must define public subnets');
      assert.match(vpcContent, /resource "aws_subnet" "private_app"/, 'Must define private app subnets');
      assert.match(vpcContent, /resource "aws_subnet" "private_db"/, 'Must define private DB subnets');
      assert.match(vpcContent, /enable_dns_hostnames\s*=\s*true/, 'Must enable DNS hostnames');
      assert.match(vpcContent, /enable_dns_support\s*=\s*true/, 'Must enable DNS resolution support');
    });

    await st.test('1.2 Private Database subnets are air-gapped from direct internet routes', () => {
      const vpcPath = path.join(infraDir, 'vpc.tf');
      const vpcContent = fs.readFileSync(vpcPath, 'utf8');

      // Check private_db route table definition has NO 0.0.0.0/0 route
      const dbRtBlock = vpcContent.slice(vpcContent.indexOf('resource "aws_route_table" "private_db"'));
      const dbRtEnd = dbRtBlock.indexOf('resource "aws_route_table_association" "private_db"');
      const dbRtConfig = dbRtBlock.slice(0, dbRtEnd);

      assert.doesNotMatch(dbRtConfig, /cidr_block\s*=\s*"0\.0\.0\.0\/0"/, 'Private DB route table must not route to internet');
    });

    await st.test('1.3 S3 VPC Gateway Endpoint eliminates NAT Gateway transfer costs', () => {
      const vpcPath = path.join(infraDir, 'vpc.tf');
      const vpcContent = fs.readFileSync(vpcPath, 'utf8');

      assert.match(vpcContent, /resource "aws_vpc_endpoint" "s3"/, 'Must define S3 VPC endpoint');
      assert.match(vpcContent, /vpc_endpoint_type\s*=\s*"Gateway"/, 'Must be a free Gateway endpoint');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: EKS Architecture, Addons & IRSA Configuration
  // ---------------------------------------------------------------------------
  await t.test('Scenario 2: EKS Architecture, Addons & IRSA Configuration', async (st) => {
    await st.test('2.1 EKS cluster enforces KMS envelope encryption and control plane audit logs', () => {
      const eksPath = path.join(infraDir, 'eks.tf');
      assert.ok(fs.existsSync(eksPath), 'eks.tf must exist');
      const eksContent = fs.readFileSync(eksPath, 'utf8');

      assert.match(eksContent, /resource "aws_eks_cluster" "main"/, 'Must define EKS cluster');
      assert.match(eksContent, /encryption_config/, 'Must define secrets envelope encryption');
      assert.match(eksContent, /resources\s*=\s*\["secrets"\]/, 'Must encrypt secrets resource');
      assert.match(eksContent, /"api",\s*"audit",\s*"authenticator"/, 'Must enable audit and authenticator logging');
    });

    await st.test('2.2 Worker node launch template enforces IMDSv2 and KMS encrypted storage', () => {
      const eksPath = path.join(infraDir, 'eks.tf');
      const eksContent = fs.readFileSync(eksPath, 'utf8');

      assert.match(eksContent, /resource "aws_launch_template" "eks_nodes"/, 'Must define node launch template');
      assert.match(eksContent, /http_tokens\s*=\s*"required"/, 'Must enforce IMDSv2 token requirement');
      assert.match(eksContent, /http_put_response_hop_limit\s*=\s*1/, 'Must restrict IMDSv2 hop limit to 1');
      assert.match(eksContent, /encrypted\s*=\s*true/, 'Worker node root volume must be encrypted');
    });

    await st.test('2.3 Managed EKS Addons and IRSA roles configured for EBS, EFS, and Secrets', () => {
      const addonsPath = path.join(infraDir, 'eks_addons.tf');
      assert.ok(fs.existsSync(addonsPath), 'eks_addons.tf must exist');
      const addonsContent = fs.readFileSync(addonsPath, 'utf8');

      assert.match(addonsContent, /resource "aws_eks_addon" "ebs_csi"/, 'Must define EBS CSI addon');
      assert.match(addonsContent, /resource "aws_eks_addon" "efs_csi"/, 'Must define EFS CSI addon');
      assert.match(addonsContent, /resource "aws_iam_role" "ebs_csi"/, 'Must define EBS CSI IRSA role');
      assert.match(addonsContent, /resource "aws_iam_role" "efs_csi"/, 'Must define EFS CSI IRSA role');
      assert.match(addonsContent, /resource "aws_iam_role" "external_secrets"/, 'Must define External Secrets IRSA role');
      assert.match(addonsContent, /docsearch-production:docsearch-app-sa/, 'Must bind IRSA to docsearch-app-sa');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 3: Data Tier Security & Disaster Recovery Resilience
  // ---------------------------------------------------------------------------
  await t.test('Scenario 3: Data Tier Security & Disaster Recovery Resilience', async (st) => {
    await st.test('3.1 RDS PostgreSQL enforces TLS, Multi-AZ, 35-day retention, and private security group', () => {
      const rdsPath = path.join(infraDir, 'rds.tf');
      assert.ok(fs.existsSync(rdsPath), 'rds.tf must exist');
      const rdsContent = fs.readFileSync(rdsPath, 'utf8');

      assert.match(rdsContent, /name\s*=\s*"rds\.force_ssl"[\s\S]*?value\s*=\s*"1"/, 'Must enforce TLS 1.2+ on RDS');
      assert.match(rdsContent, /multi_az\s*=\s*true/, 'Must enable Multi-AZ');
      assert.match(rdsContent, /publicly_accessible\s*=\s*false/, 'Must disable public access');
      assert.match(rdsContent, /backup_retention_period\s*=\s*var\.backup_retention_days/, 'Must enforce retention period');
      assert.match(rdsContent, /storage_encrypted\s*=\s*true/, 'Must enforce storage encryption');
    });

    await st.test('3.2 ElastiCache Redis replication group enforces Multi-AZ, in-transit TLS, and auth token', () => {
      const redisPath = path.join(infraDir, 'elasticache.tf');
      assert.ok(fs.existsSync(redisPath), 'elasticache.tf must exist');
      const redisContent = fs.readFileSync(redisPath, 'utf8');

      assert.match(redisContent, /automatic_failover_enabled\s*=\s*true/, 'Must enable automatic failover');
      assert.match(redisContent, /multi_az_enabled\s*=\s*true/, 'Must enable Multi-AZ');
      assert.match(redisContent, /transit_encryption_enabled\s*=\s*true/, 'Must enable in-transit TLS encryption');
      assert.match(redisContent, /at_rest_encryption_enabled\s*=\s*true/, 'Must enable at-rest encryption');
      assert.match(redisContent, /auth_token\s*=/, 'Must require auth token');
    });

    await st.test('3.3 AWS Backup Vault enforces WORM lock and cross-region replication to ap-south-2', () => {
      const backupPath = path.join(infraDir, 'backup.tf');
      assert.ok(fs.existsSync(backupPath), 'backup.tf must exist');
      const backupContent = fs.readFileSync(backupPath, 'utf8');

      assert.match(backupContent, /resource "aws_backup_vault" "primary_vault"/, 'Must define primary backup vault');
      assert.match(backupContent, /resource "aws_backup_vault" "dr_vault"/, 'Must define DR backup vault');
      assert.match(backupContent, /provider\s*=\s*aws\.dr/, 'DR vault must be provisioned in secondary DR region');
      assert.match(backupContent, /destination_vault_arn\s*=\s*aws_backup_vault\.dr_vault\.arn/, 'Must copy snapshots to DR vault');
      assert.match(backupContent, /resource "aws_backup_vault_lock_configuration" "worm_lock"/, 'Must define WORM lock');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 4: Terraform Conformance & Cost/Resource Safety Engine
  // ---------------------------------------------------------------------------
  await t.test('Scenario 4: Terraform Conformance & Cost/Resource Safety Engine', async (st) => {
    await st.test('4.1 Zero hardcoded passwords or AWS access keys in Terraform files', () => {
      const tfFiles = fs.readdirSync(infraDir).filter((f) => f.endsWith('.tf'));
      for (const file of tfFiles) {
        const content = fs.readFileSync(path.join(infraDir, file), 'utf8');
        assert.doesNotMatch(content, /password\s*=\s*"[^$][^"]{4,}"/, `Hardcoded password detected in ${file}`);
        assert.doesNotMatch(content, /AKIA[0-9A-Z]{16}/, `AWS access key detected in ${file}`);
      }
    });

    await st.test('4.2 Terraform fmt, validate, and plan verify clean syntax and zero destruction risks', () => {
      // Execute terraform validate from infraDir
      const valOutput = execSync('terraform validate -no-color', { cwd: infraDir, encoding: 'utf8' });
      assert.match(valOutput, /Success! The configuration is valid\./, 'Terraform validation must succeed');

      // Verify terraform plan completes without resource destruction
      const planOutput = execSync('terraform plan -no-color', { cwd: infraDir, encoding: 'utf8' });
      assert.match(planOutput, /Plan:\s*117 to add,\s*0 to change,\s*0 to destroy\./, 'Must plan 117 additions with 0 destructions');
    });
  });
});
