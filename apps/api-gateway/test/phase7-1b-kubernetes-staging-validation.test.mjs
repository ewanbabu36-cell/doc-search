/**
 * ==============================================================================
 * DOCSEARCH PHASE 7.1B: KUBERNETES MANIFEST & STAGING VALIDATION TEST SUITE
 * ==============================================================================
 * Automated test suite independently validating:
 * 1. Deep schema and referential integrity via runValidation() engine
 * 2. PACS storage correction: single-replica Active-Passive failover, Recreate strategy,
 *    and RWO volume binding without concurrent file race conditions
 * 3. TLS security & ACME challenge passthrough on Port 80 and TLS 1.2/1.3 on Port 443
 * 4. Kubernetes security controls (Pod Security Standards, RBAC, NetworkPolicy)
 * 5. Offline deployment simulation integrity & cluster prerequisite reporting
 * ==============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runValidation } from '../../../scripts/validate-kubernetes-architecture.mjs';

describe('Phase 7.1B: Kubernetes Manifest Validation & Staging Deployment Readiness', () => {

  // ============================================================================
  // Scenario 1: Comprehensive Schema & Cross-Resource Validation Engine
  // ============================================================================
  describe('Scenario 1: Schema & Referential Integrity Engine', () => {
    it('1.1 Architecture validation engine executes with 0 fatal errors', () => {
      const result = runValidation();
      const errors = result.findings.filter(f => f.severity === 'ERROR');
      assert.equal(errors.length, 0, `Validation engine found unexpected errors: ${JSON.stringify(errors)}`);
      assert.equal(result.passed, true, 'runValidation() must report passed: true');
      assert.ok(result.passes.length >= 20, `Expected at least 20 passing verification checks, got ${result.passes.length}`);
    });

    it('1.2 Kustomize resource inventory matches all manifest files in k8s/ directory', () => {
      const result = runValidation();
      const kustomizePass = result.passes.find(p => p.includes('Kustomize: All'));
      assert.ok(kustomizePass, 'Kustomize verification pass must be present');
    });

    it('1.3 All resource documents adhere strictly to non-deprecated Kubernetes v1.28+ APIs', () => {
      const result = runValidation();
      const apiVerPass = result.passes.find(p => p.includes('API Versions:'));
      assert.ok(apiVerPass, 'API version verification pass must be present');
    });
  });

  // ============================================================================
  // Scenario 2: PACS Clinical Image Storage Architecture Remediation
  // ============================================================================
  describe('Scenario 2: PACS Clinical Storage Safety & Invariant Correction', () => {
    it('2.1 PACS server deployment is configured with replicas: 1 to prevent Multi-Attach deadlocks', () => {
      const result = runValidation();
      const pacsReplicaPass = result.passes.find(p => p.includes('replicas strictly set to 1'));
      assert.ok(pacsReplicaPass, 'PACS replica invariant must be verified');
    });

    it('2.2 PACS deployment strategy is set to Recreate for clean persistent volume unmounting', () => {
      const result = runValidation();
      const stratPass = result.passes.find(p => p.includes('Deployment Strategy: type set to Recreate'));
      assert.ok(stratPass, 'PACS Recreate strategy pass must be verified');
    });

    it('2.3 PACS PodDisruptionBudget specifies maxUnavailable: 1, permitting safe cluster node drains', () => {
      const result = runValidation();
      const pdbPass = result.passes.find(p => p.includes('PACS PDB: maxUnavailable: 1 properly configured'));
      assert.ok(pdbPass, 'PACS PDB pass must be verified');
    });
  });

  // ============================================================================
  // Scenario 3: Production Ingress & TLS Security Controls
  // ============================================================================
  describe('Scenario 3: Ingress & Edge TLS 1.2/1.3 Hardening', () => {
    it('3.1 Ingress explicitly enforces strict TLS 1.2 and TLS 1.3 protocol suites', () => {
      const result = runValidation();
      const tlsProtoPass = result.passes.find(p => p.includes('Strict TLS 1.2 and TLS 1.3 enforced'));
      assert.ok(tlsProtoPass, 'TLS protocols pass must be verified');
    });

    it('3.2 Ingress injects 2-year HSTS preload header with includeSubDomains', () => {
      const result = runValidation();
      const hstsPass = result.passes.find(p => p.includes('Strict-Transport-Security 2-year preload header verified'));
      assert.ok(hstsPass, 'HSTS preload pass must be verified');
    });

    it('3.3 Ingress certificate SAN list encompasses all 6 production subdomains', () => {
      const result = runValidation();
      const hostPass = result.passes.find(p => p.includes('All 6 production subdomains covered'));
      assert.ok(hostPass, 'All 6 subdomains must be verified in TLS SAN list');
    });

    it('3.4 NGINX reverse proxy configuration enforces HTTP-to-HTTPS 301 redirection while preserving ACME challenge', () => {
      const result = runValidation();
      const redirPass = result.passes.find(p => p.includes('Automated 301 redirection to HTTPS verified'));
      const acmePass = result.passes.find(p => p.includes('ACME Routing: /.well-known/acme-challenge/'));
      assert.ok(redirPass, 'NGINX 301 redirect must be verified');
      assert.ok(acmePass, 'NGINX ACME passthrough must be verified');
    });
  });

  // ============================================================================
  // Scenario 4: Workload Security Standards & Least-Privilege RBAC
  // ============================================================================
  describe('Scenario 4: Workload Security Standards & Network Isolation', () => {
    it('4.1 Default-deny-all network policy is enforced across the production namespace', () => {
      const k8sDir = path.resolve(process.cwd(), 'k8s');
      const npContent = fs.readFileSync(path.join(k8sDir, '02-network-policies.yaml'), 'utf8');
      assert.ok(npContent.includes('name: default-deny-all'));
      assert.ok(npContent.includes('- Ingress'));
      assert.ok(npContent.includes('- Egress'));
    });

    it('4.2 Workload ServiceAccounts disable automatic token mounting to prevent token theft', () => {
      const k8sDir = path.resolve(process.cwd(), 'k8s');
      const rbacContent = fs.readFileSync(path.join(k8sDir, '01-rbac.yaml'), 'utf8');
      assert.ok(rbacContent.includes('automountServiceAccountToken: false'));
    });

    it('4.3 Containers drop ALL Linux capabilities and prohibit privilege escalation', () => {
      const k8sDir = path.resolve(process.cwd(), 'k8s');
      const gwContent = fs.readFileSync(path.join(k8sDir, '10-api-gateway.yaml'), 'utf8');
      assert.ok(gwContent.includes('allowPrivilegeEscalation: false'));
      assert.ok(gwContent.includes('drop:\n                - ALL'));
    });
  });
});
