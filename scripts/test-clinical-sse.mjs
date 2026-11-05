import http from 'node:http';
import { signJwt } from '../packages/auth/dist/index.js';

const API_BASE = 'http://127.0.0.1:4000';

const authToken = signJwt({
  sub: 'usr-nurse-001',
  userId: 'usr-nurse-001',
  tenantId: '6855be07-5298-4148-a571-c51ac49ac7f3',
  roles: ['NURSE', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
  permissions: ['*'],
  email: 'icu-nurse@docsearch.health'
}, {
  secret: process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade',
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresInSeconds: 3600
});

async function main() {
  console.log('--- PB-01 CLINICAL SAFETY: REAL-TIME SSE CODE BLUE SOS VERIFICATION ---');

  let sseConnected = false;
  let sseEventReceived = null;

  // 1. Establish real HTTP SSE connection to /api/v1/emergency/code-blue/stream
  const req = http.get(`${API_BASE}/api/v1/emergency/code-blue/stream`, (res) => {
    console.log(`[SSE Stream] Response Status: ${res.statusCode}, Headers:`, res.headers['content-type']);

    if (res.headers['content-type']?.includes('text/event-stream')) {
      sseConnected = true;
      console.log('[\x1b[32m✔\x1b[0m] SSE connection established with text/event-stream protocol.');
    }

    let buffer = '';
    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        const dataLine = block.split('\n').find(l => l.startsWith('data: '));
        if (dataLine) {
          try {
            const parsed = JSON.parse(dataLine.replace('data: ', '').trim());
            console.log('[SSE Event Received]:', parsed);
            if (parsed.type === 'EMERGENCY_BROADCAST') {
              sseEventReceived = parsed;
            }
          } catch {}
        }
      }
    });
  });

  req.on('error', (err) => {
    console.error('SSE connection error:', err);
  });

  // Give 500ms for SSE stream to establish
  await new Promise(r => setTimeout(r, 600));

  // 2. Trigger Code Blue SOS via POST /api/v1/emergency/code-blue
  console.log('\n[Triggering Code Blue SOS Broadcast]');
  const triggerRes = await fetch(`${API_BASE}/api/v1/emergency/code-blue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      codeType: 'CODE_BLUE',
      location: 'ICU Bed 4 (Coronary Care Unit)',
      wardOrDepartment: 'Intensive Cardiac Care Unit (ICCU)',
      bedNumber: 'ICU-B04',
      notes: 'Ventricular fibrillation arrest observed on telemetry. STAT CPR team required.'
    })
  });

  const triggerData = await triggerRes.json();
  console.log('Trigger Response HTTP Status:', triggerRes.status);
  console.log('Trigger Response Data:', triggerData);

  // 3. Wait up to 2 seconds for SSE subscriber delivery
  for (let i = 0; i < 20; i++) {
    if (sseEventReceived) break;
    await new Promise(r => setTimeout(r, 100));
  }

  // Close SSE connection
  req.destroy();

  console.log('\n--- VERIFICATION OF CLINICAL CODE BLUE BROADCAST ---');
  console.log(`1. Trigger HTTP Status 200: ${triggerRes.status === 200 ? 'PASS' : 'FAIL'}`);
  console.log(`2. Resuscitation Team Dispatched: ${triggerData.data?.event?.resuscitationTeamDispatched ? 'PASS' : 'FAIL'}`);
  console.log(`3. SSE Real-Time Event Delivered: ${sseEventReceived ? 'PASS' : 'FAIL'}`);
  if (sseEventReceived) {
    console.log(`   - Received Code Type: ${sseEventReceived.event?.codeType}`);
    console.log(`   - Received Location: ${sseEventReceived.event?.location}`);
  }

  if (triggerRes.status === 200 && sseEventReceived && sseEventReceived.event?.codeType === 'CODE_BLUE') {
    console.log('\n🏆 PB-01 CLINICAL CODE BLUE SOS SSE BROADCAST AUDIT PASSED!');
    process.exit(0);
  } else {
    console.error('\n❌ PB-01 CLINICAL CODE BLUE SOS AUDIT FAILED!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in clinical SSE test:', err);
  process.exit(1);
});
