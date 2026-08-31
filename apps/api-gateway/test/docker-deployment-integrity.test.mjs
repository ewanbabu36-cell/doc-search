import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Docker & CI/CD Deployment Architecture Integrity Test Suite', () => {
  const rootDir = path.resolve(process.cwd());

  it('TEST 01: docker/Dockerfile.api-gateway exists with multi-stage build & non-root user', () => {
    const dockerfilePath = path.join(rootDir, 'docker/Dockerfile.api-gateway');
    assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile.api-gateway must exist');

    const content = fs.readFileSync(dockerfilePath, 'utf8');
    assert.ok(content.includes('FROM node:20-alpine AS builder'), 'Must contain builder stage');
    assert.ok(content.includes('FROM node:20-alpine AS runner'), 'Must contain runner stage');
    assert.ok(content.includes('USER docsearch'), 'Must run as unprivileged docsearch user');
    assert.ok(content.includes('HEALTHCHECK'), 'Must define Docker HEALTHCHECK instruction');
    assert.ok(content.includes('dumb-init'), 'Must use dumb-init for proper signal handling');
  });

  it('TEST 02: docker/Dockerfile.web-app exists with parameterized build & NGINX runner', () => {
    const dockerfilePath = path.join(rootDir, 'docker/Dockerfile.web-app');
    assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile.web-app must exist');

    const content = fs.readFileSync(dockerfilePath, 'utf8');
    assert.ok(content.includes('ARG APP_NAME'), 'Must support parameterized APP_NAME argument');
    assert.ok(content.includes('FROM nginx:1.27-alpine AS runner'), 'Must use minimal NGINX alpine runner');
    assert.ok(content.includes('HEALTHCHECK'), 'Must define container healthcheck probe');
  });

  it('TEST 03: docker/nginx/nginx.conf specifies production tuning & compression', () => {
    const nginxConfPath = path.join(rootDir, 'docker/nginx/nginx.conf');
    assert.ok(fs.existsSync(nginxConfPath), 'nginx.conf must exist');

    const content = fs.readFileSync(nginxConfPath, 'utf8');
    assert.ok(content.includes('gzip on;'), 'Must enable gzip compression');
    assert.ok(content.includes('worker_connections 2048;'), 'Must configure connection pooling');
    assert.ok(content.includes('server_tokens off;'), 'Must conceal server version tokens');
  });

  it('TEST 04: docker/nginx/default.conf includes strict security headers & SPA routing fallback', () => {
    const defaultConfPath = path.join(rootDir, 'docker/nginx/default.conf');
    assert.ok(fs.existsSync(defaultConfPath), 'default.conf must exist');

    const content = fs.readFileSync(defaultConfPath, 'utf8');
    assert.ok(content.includes('try_files $uri $uri/ /index.html;'), 'Must have SPA routing fallback');
    assert.ok(content.includes('X-Frame-Options "DENY"'), 'Must set anti-clickjacking frame deny header');
    assert.ok(content.includes('X-Content-Type-Options "nosniff"'), 'Must set nosniff header');
    assert.ok(content.includes('location = /health'), 'Must include dedicated /health endpoint');
  });

  it('TEST 05: docker-compose.yml defines full local microservices stack with healthchecks', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml');
    assert.ok(fs.existsSync(composePath), 'docker-compose.yml must exist');

    const content = fs.readFileSync(composePath, 'utf8');
    assert.ok(content.includes('postgres:16-alpine'), 'Must include PostgreSQL 16');
    assert.ok(content.includes('redis:7-alpine'), 'Must include Redis 7');
    assert.ok(content.includes('api-gateway:'), 'Must include API Gateway service');
    assert.ok(content.includes('partner-platform:'), 'Must include Partner Platform frontend');
    assert.ok(content.includes('company-platform:'), 'Must include Company Platform frontend');
    assert.ok(content.includes('landing-page:'), 'Must include Landing Page frontend');
    assert.ok(content.includes('condition: service_healthy'), 'Must enforce service health dependencies');
  });

  it('TEST 06: docker-compose.prod.yml defines resource limits & logging constraints', () => {
    const composeProdPath = path.join(rootDir, 'docker-compose.prod.yml');
    assert.ok(fs.existsSync(composeProdPath), 'docker-compose.prod.yml must exist');

    const content = fs.readFileSync(composeProdPath, 'utf8');
    assert.ok(content.includes('limits:'), 'Must configure resource limits');
    assert.ok(content.includes('driver: "json-file"'), 'Must configure production logging driver');
    assert.ok(content.includes('max-size:'), 'Must configure log rotation max-size');
  });

  it('TEST 07: .env.docker.example contains complete environment specification', () => {
    const envPath = path.join(rootDir, '.env.docker.example');
    assert.ok(fs.existsSync(envPath), '.env.docker.example must exist');

    const content = fs.readFileSync(envPath, 'utf8');
    assert.ok(content.includes('POSTGRES_USER='), 'Must define database credentials');
    assert.ok(content.includes('JWT_SECRET='), 'Must define JWT cryptographic secret');
    assert.ok(content.includes('REDIS_URL='), 'Must define Redis caching URL');
  });

  it('TEST 08: .github/workflows/docker-publish.yml contains multi-arch build and Trivy vulnerability scan', () => {
    const workflowPath = path.join(rootDir, '.github/workflows/docker-publish.yml');
    assert.ok(fs.existsSync(workflowPath), 'docker-publish.yml must exist');

    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('docker/setup-buildx-action'), 'Must configure Docker Buildx');
    assert.ok(content.includes('aquasecurity/trivy-action'), 'Must run Trivy security scanner');
    assert.ok(content.includes('matrix:'), 'Must define build matrix for all 4 microservices');
  });

  it('TEST 09: .github/workflows/deploy.yml contains zero-downtime deployment pipeline', () => {
    const workflowPath = path.join(rootDir, '.github/workflows/deploy.yml');
    assert.ok(fs.existsSync(workflowPath), 'deploy.yml must exist');

    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('migrate'), 'Must include automated database migration step');
    assert.ok(content.includes('Smoke Tests'), 'Must include post-deployment smoke tests');
  });

  it('TEST 10: API Gateway exposes /health & /ready probes compatible with Docker and Kubernetes', async () => {
    process.env.NODE_ENV = 'test';
    const { buildApp } = await import('../dist/app.js');
    const app = await buildApp();
    await app.ready();

    const healthRes = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(healthRes.statusCode, 200);
    const healthBody = JSON.parse(healthRes.body);
    assert.equal(healthBody.status, 'healthy');

    const readyRes = await app.inject({ method: 'GET', url: '/ready' });
    assert.equal(readyRes.statusCode, 200);
    const readyBody = JSON.parse(readyRes.body);
    assert.equal(readyBody.status, 'ready');

    await app.close();
  });
});
