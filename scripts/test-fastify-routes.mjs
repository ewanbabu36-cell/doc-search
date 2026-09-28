import { buildApp } from '../apps/api-gateway/dist/app.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runOnRouteAudit() {
  console.log('=== EXTRACTING AUTHORITATIVE ROUTES VIA FASTIFY onRoute HOOK ===');
  const routes = [];

  // We can pass an instance or configure Fastify
  // In Fastify, plugin onRoute hook can be added to the app before routes are registered,
  // OR we can inspect the fastify instance after buildApp().
  const app = await buildApp();

  // Fastify stores routes in app[Symbol('fastify.routes')] or we can hook before app.ready()
  // But let's check what app has:
  // Fastify 5 exposes app.routes or radix router
  // Let's print routes using app.printRoutes({ commonPrefix: false }) with full paths
  // Or let's see how printRoutes prints full paths:
  // Actually, Fastify's app.printRoutes({ commonPrefix: false }) prints radix tree.
  // But let's check if we can inspect app.routes:
  
  // Let's inspect all route definitions from Fastify's router:
  const routeEntries = [];
  
  // Let's add onRoute hook by building app with hook or wrapping Fastify
  // We can re-build or check:
  console.log('Fastify instance loaded. Checking router structure...');
  
  // In Fastify 5, the router is accessible via app.routing or we can iterate
  // Let's test what properties app has:
  console.log('App methods/symbols:', Object.getOwnPropertySymbols(app).map(s => s.toString()));
  
  await app.ready();
  console.log('Fastify app ready.');
  
  await app.close();
}

runOnRouteAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
