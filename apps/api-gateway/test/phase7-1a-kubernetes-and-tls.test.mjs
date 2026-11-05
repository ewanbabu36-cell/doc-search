/**
 * ==============================================================================
 * DOCSEARCH PHASE 7.1A: KUBERNETES ORCHESTRATION & PRODUCTION TLS VALIDATION
 * ==============================================================================
 * Comprehensive automated verification suite validating:
 * 1. Syntax, schema validity and structure across all Kubernetes manifests
 * 2. Enterprise securityContext (non-root, drop capabilities, privilege escalation)
 * 3. Probes (startup, liveness, readiness) on all pods
 * 4. Resource bounds (requests & limits for CPU and Memory)
 * 5. Horizontal Pod Autoscaler (HPA) and Pod Disruption Budget (PDB) HA resilience
 * 6. Network Policy least-privilege egress & ingress boundaries
 * 7. Ingress HTTPS Port 443, TLS 1.2/1.3, cert-manager ClusterIssuer & HSTS headers
 * 8. Parity between Docker Compose services and Kubernetes manifests
 * ==============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load YAML parser from local node_modules
const YAML = require(path.resolve(__dirname, '../../../node_modules/.pnpm/node_modules/yaml'));

const K8S_DIR = path.resolve(__dirname, '../../../k8s');
const DOCKER_NGINX_CONF = path.resolve(__dirname, '../../../docker/nginx/nginx-production-ingress.conf');
const DOCKER_COMPOSE_FILE = path.resolve(__dirname, '../../../docker-compose.yml');

describe('Phase 7.1A: Kubernetes Orchestration & Production TLS Hardening', () => {

  // ============================================================================
  // Scenario 1: Kubernetes Manifest Files & YAML Syntax Integrity
  // ============================================================================
  describe('Scenario 1: Manifest Files & YAML Syntax Integrity', () => {
    const expectedManifests = [
      '00-namespace.yaml',
      '01-rbac.yaml',
      '02-network-policies.yaml',
      '03-configmaps.yaml',
      '04-secrets.yaml',
      '05-storage.yaml',
      '06-cert-manager.yaml',
      '10-api-gateway.yaml',
      '11-pacs-server.yaml',
      '12-web-apps.yaml',
      '20-ingress.yaml',
      'kustomization.yaml'
    ];

    it('1.1 All required Phase 7.1A Kubernetes manifests exist in k8s/', () => {
      assert.ok(fs.existsSync(K8S_DIR), `k8s directory must exist at ${K8S_DIR}`);
      for (const manifest of expectedManifests) {
        const fullPath = path.join(K8S_DIR, manifest);
        assert.ok(fs.existsSync(fullPath), `Manifest ${manifest} must exist on disk`);
      }
    });

    it('1.2 Every manifest parses into valid Kubernetes YAML documents without syntax errors', () => {
      for (const manifest of expectedManifests) {
        const fullPath = path.join(K8S_DIR, manifest);
        const content = fs.readFileSync(fullPath, 'utf8');
        const docs = YAML.parseAllDocuments(content);
        assert.ok(docs.length > 0, `Manifest ${manifest} must yield at least one valid document`);
        for (const doc of docs) {
          assert.equal(doc.errors.length, 0, `YAML syntax error in ${manifest}: ${doc.errors}`);
          const json = doc.toJSON();
          assert.ok(json, `Document in ${manifest} must produce a valid JSON object`);
          assert.ok(json.kind || json.resources, `Document in ${manifest} must have kind or resources`);
        }
      }
    });

    it('1.3 Namespace is defined as docsearch-production with Pod Security Standards', () => {
      const nsContent = fs.readFileSync(path.join(K8S_DIR, '00-namespace.yaml'), 'utf8');
      const nsDoc = YAML.parse(nsContent);
      assert.equal(nsDoc.kind, 'Namespace');
      assert.equal(nsDoc.metadata.name, 'docsearch-production');
      assert.equal(nsDoc.metadata.labels['pod-security.kubernetes.io/enforce'], 'baseline');
      assert.equal(nsDoc.metadata.labels['pod-security.kubernetes.io/audit'], 'restricted');
    });
  });

  // ============================================================================
  // Scenario 2: Workload SecurityContext & Probe Validation
  // ============================================================================
  describe('Scenario 2: Workload SecurityContext & Probe Validation', () => {
    it('2.1 API Gateway Deployment enforces unprivileged non-root execution and capability dropping', () => {
      const gwContent = fs.readFileSync(path.join(K8S_DIR, '10-api-gateway.yaml'), 'utf8');
      const docs = YAML.parseAllDocuments(gwContent).map(d => d.toJSON());
      const deployment = docs.find(d => d.kind === 'Deployment' && d.metadata.name === 'docsearch-api-gateway');
      
      assert.ok(deployment, 'docsearch-api-gateway Deployment must exist');
      const podSec = deployment.spec.template.spec.securityContext;
      assert.equal(podSec.runAsNonRoot, true, 'Pod must enforce runAsNonRoot: true');
      assert.equal(podSec.runAsUser, 1001, 'Pod must run as uid 1001');

      const container = deployment.spec.template.spec.containers.find(c => c.name === 'api-gateway');
      assert.ok(container, 'api-gateway container must exist');
      assert.equal(container.securityContext.allowPrivilegeEscalation, false, 'Privilege escalation must be blocked');
      assert.deepEqual(container.securityContext.capabilities.drop, ['ALL'], 'All Linux capabilities must be dropped');
    });

    it('2.2 API Gateway Deployment configures startup, liveness, and readiness probes on port 4000', () => {
      const gwContent = fs.readFileSync(path.join(K8S_DIR, '10-api-gateway.yaml'), 'utf8');
      const docs = YAML.parseAllDocuments(gwContent).map(d => d.toJSON());
      const deployment = docs.find(d => d.kind === 'Deployment');
      const container = deployment.spec.template.spec.containers[0];

      assert.ok(container.startupProbe, 'startupProbe must be defined');
      assert.equal(container.startupProbe.httpGet.path, '/livez');
      
      assert.ok(container.livenessProbe, 'livenessProbe must be defined');
      assert.equal(container.livenessProbe.httpGet.path, '/livez');

      assert.ok(container.readinessProbe, 'readinessProbe must be defined');
      assert.equal(container.readinessProbe.httpGet.path, '/readyz');
    });

    it('2.3 Workloads enforce explicit CPU and Memory resource requests and limits', () => {
      const gwContent = fs.readFileSync(path.join(K8S_DIR, '10-api-gateway.yaml'), 'utf8');
      const docs = YAML.parseAllDocuments(gwContent).map(d => d.toJSON());
      const deployment = docs.find(d => d.kind === 'Deployment');
      const container = deployment.spec.template.spec.containers[0];

      assert.ok(container.resources.requests.cpu, 'CPU request must be set');
      assert.ok(container.resources.requests.memory, 'Memory request must be set');
      assert.ok(container.resources.limits.cpu, 'CPU limit must be set');
      assert.ok(container.resources.limits.memory, 'Memory limit must be set');
      assert.equal(container.resources.requests.cpu, '500m');
      assert.equal(container.resources.limits.cpu, '2000m');
    });
  });

  // ============================================================================
  // Scenario 3: High Availability, Autoscaling & Disruption Budgets
  // ============================================================================
  describe('Scenario 3: High Availability, Autoscaling & Disruption Budgets', () => {
    it('3.1 API Gateway HorizontalPodAutoscaler scales between 3 and 20 replicas', () => {
      const gwContent = fs.readFileSync(path.join(K8S_DIR, '10-api-gateway.yaml'), 'utf8');
      const docs = YAML.parseAllDocuments(gwContent).map(d => d.toJSON());
      const hpa = docs.find(d => d.kind === 'HorizontalPodAutoscaler');

      assert.ok(hpa, 'HPA must exist');
      assert.equal(hpa.spec.minReplicas, 3);
      assert.equal(hpa.spec.maxReplicas, 20);
      assert.equal(hpa.spec.scaleTargetRef.name, 'docsearch-api-gateway');

      const cpuMetric = hpa.spec.metrics.find(m => m.resource?.name === 'cpu');
      assert.ok(cpuMetric, 'CPU utilization metric must be configured');
      assert.equal(cpuMetric.resource.target.averageUtilization, 65);
    });

    it('3.2 PodDisruptionBudget protects API Gateway with minAvailable: 2 during cluster maintenance', () => {
      const gwContent = fs.readFileSync(path.join(K8S_DIR, '10-api-gateway.yaml'), 'utf8');
      const docs = YAML.parseAllDocuments(gwContent).map(d => d.toJSON());
      const pdb = docs.find(d => d.kind === 'PodDisruptionBudget');

      assert.ok(pdb, 'PDB must exist');
      assert.equal(pdb.spec.minAvailable, 2);
    });
  });

  // ============================================================================
  // Scenario 4: Network Isolation & Least-Privilege Network Policies
  // ============================================================================
  describe('Scenario 4: Network Isolation & Least-Privilege Network Policies', () => {
    it('4.1 Default deny-all policy is enforced across the production namespace', () => {
      const npContent = fs.readFileSync(path.join(K8S_DIR, '02-network-policies.yaml'), 'utf8');
      const docs = YAML.parseAllDocuments(npContent).map(d => d.toJSON());
      const defaultDeny = docs.find(d => d.metadata.name === 'default-deny-all');

      assert.ok(defaultDeny, 'default-deny-all policy must exist');
      assert.deepEqual(defaultDeny.spec.policyTypes, ['Ingress', 'Egress']);
      assert.deepEqual(defaultDeny.spec.podSelector, {});
    });

    it('4.2 API Gateway egress is explicitly whitelisted to CoreDNS, RDS, Redis, and External HTTPS', () => {
      const npContent = fs.readFileSync(path.join(K8S_DIR, '02-network-policies.yaml'), 'utf8');
      const docs = YAML.parseAllDocuments(npContent).map(d => d.toJSON());
      const egressPolicy = docs.find(d => d.metadata.name === 'api-gateway-egress-policy');

      assert.ok(egressPolicy, 'api-gateway-egress-policy must exist');
      const allowedPorts = egressPolicy.spec.egress.flatMap(e => e.ports?.map(p => p.port) || []);
      
      assert.ok(allowedPorts.includes(5432), 'PostgreSQL port 5432 must be allowed in egress');
      assert.ok(allowedPorts.includes(6379), 'Redis port 6379 must be allowed in egress');
      assert.ok(allowedPorts.includes(443), 'External HTTPS port 443 must be allowed in egress');
    });
  });

  // ============================================================================
  // Scenario 5: Production Ingress, TLS 1.2/1.3 & Cert-Manager Integration
  // ============================================================================
  describe('Scenario 5: Production Ingress, TLS 1.2/1.3 & Cert-Manager Integration', () => {
    it('5.1 Kubernetes Ingress specifies TLS with cert-manager ClusterIssuer letsencrypt-production', () => {
      const ingContent = fs.readFileSync(path.join(K8S_DIR, '20-ingress.yaml'), 'utf8');
      const ingDoc = YAML.parse(ingContent);

      assert.equal(ingDoc.kind, 'Ingress');
      assert.equal(ingDoc.spec.ingressClassName, 'nginx');
      assert.equal(ingDoc.metadata.annotations['cert-manager.io/cluster-issuer'], 'letsencrypt-production');
      assert.equal(ingDoc.metadata.annotations['nginx.ingress.kubernetes.io/ssl-redirect'], 'true');
      assert.equal(ingDoc.metadata.annotations['nginx.ingress.kubernetes.io/ssl-protocols'], 'TLSv1.2 TLSv1.3');

      assert.ok(ingDoc.spec.tls.length > 0, 'TLS configuration must be defined');
      assert.equal(ingDoc.spec.tls[0].secretName, 'docsearch-production-tls');
    });

    it('5.2 Ingress configuration enforces strict HSTS and security response headers', () => {
      const ingContent = fs.readFileSync(path.join(K8S_DIR, '20-ingress.yaml'), 'utf8');
      const ingDoc = YAML.parse(ingContent);
      const snippet = ingDoc.metadata.annotations['nginx.ingress.kubernetes.io/configuration-snippet'];

      assert.ok(snippet.includes('Strict-Transport-Security'), 'HSTS header must be configured');
      assert.ok(snippet.includes('max-age=63072000'), 'HSTS max-age must be at least 2 years');
      assert.ok(snippet.includes('includeSubDomains'), 'HSTS includeSubDomains must be active');
      assert.ok(snippet.includes('X-Frame-Options'), 'X-Frame-Options must be configured');
      assert.ok(snippet.includes('X-Content-Type-Options: nosniff'), 'nosniff must be active');
    });

    it('5.3 Cert-manager Certificate CRD specifies ECDSA 256-bit key with 90-day validity', () => {
      const certContent = fs.readFileSync(path.join(K8S_DIR, '06-cert-manager.yaml'), 'utf8');
      const docs = YAML.parseAllDocuments(certContent).map(d => d.toJSON());
      const cert = docs.find(d => d.kind === 'Certificate');

      assert.ok(cert, 'Certificate CRD must exist');
      assert.equal(cert.spec.secretName, 'docsearch-production-tls');
      assert.equal(cert.spec.privateKey.algorithm, 'ECDSA');
      assert.equal(cert.spec.privateKey.size, 256);
      assert.equal(cert.spec.duration, '2160h');
      assert.equal(cert.spec.renewBefore, '720h');
    });
  });

  // ============================================================================
  // Scenario 6: Docker Compose NGINX TLS Ingress Hardening & Health Parity
  // ============================================================================
  describe('Scenario 6: Docker Compose NGINX Ingress Hardening & Parity', () => {
    it('6.1 NGINX production ingress config enforces HTTP-to-HTTPS redirection on Port 80', () => {
      const nginxConf = fs.readFileSync(DOCKER_NGINX_CONF, 'utf8');
      assert.ok(nginxConf.includes('listen 80;'), 'Port 80 listener must exist');
      assert.ok(nginxConf.includes('return 301 https://$host$request_uri;'), 'Port 80 must enforce 301 redirect to https');
      assert.ok(nginxConf.includes('/.well-known/acme-challenge/'), 'Port 80 must preserve ACME webroot challenge for cert renewal');
      assert.ok(nginxConf.includes('location = /health'), 'Port 80 must preserve unencrypted local healthcheck');
    });

    it('6.2 NGINX production ingress config terminates TLS 1.2 and 1.3 on Port 443 with HSTS', () => {
      const nginxConf = fs.readFileSync(DOCKER_NGINX_CONF, 'utf8');
      assert.ok(nginxConf.includes('listen 443 ssl;'), 'Port 443 SSL listener must exist');
      assert.ok(nginxConf.includes('ssl_protocols TLSv1.2 TLSv1.3;'), 'Strict TLS 1.2 and 1.3 must be specified');
      assert.ok(nginxConf.includes('Strict-Transport-Security'), 'HSTS header must be added on HTTPS');
      assert.ok(nginxConf.includes('proxy_set_header X-Forwarded-Proto https;'), 'Reverse proxy must pass X-Forwarded-Proto https');
    });

    it('6.3 Service parity: Every Docker Compose application service has a matching Kubernetes Deployment', () => {
      const composeContent = fs.readFileSync(DOCKER_COMPOSE_FILE, 'utf8');
      const compose = YAML.parse(composeContent);
      const composeServices = Object.keys(compose.services).filter(s => s !== 'postgres' && s !== 'redis' && s !== 'nginx-ingress');

      // Load all k8s deployments
      const k8sDeployments = [];
      const k8sFiles = fs.readdirSync(K8S_DIR).filter(f => f.endsWith('.yaml'));
      for (const file of k8sFiles) {
        const content = fs.readFileSync(path.join(K8S_DIR, file), 'utf8');
        const docs = YAML.parseAllDocuments(content).map(d => d.toJSON());
        for (const doc of docs) {
          if (doc && doc.kind === 'Deployment') {
            k8sDeployments.push(doc.metadata.name.replace('docsearch-', ''));
          }
        }
      }

      for (const service of composeServices) {
        assert.ok(
          k8sDeployments.includes(service),
          `Docker compose service '${service}' must have a corresponding Kubernetes Deployment in k8s/`
        );
      }
    });
  });
});
