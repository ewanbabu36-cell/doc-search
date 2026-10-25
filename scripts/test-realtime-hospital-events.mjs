/**
 * Comprehensive Verification Suite for Real-Time Hospital Event Bus,
 * BroadcastChannel Tab Mirroring, and API Gateway SSE Stream
 */

import Fastify from '../apps/api-gateway/node_modules/fastify/fastify.js';
import http from 'node:http';
import { hospitalEventsRoutes, broadcastHospitalEvent } from '../apps/api-gateway/dist/routes/partner/hospital-events.routes.js';

console.log('='.repeat(70));
console.log('🏥 DOCSEARCH REAL-TIME HOSPITAL EVENT BUS & SSE BRIDGE TEST');
console.log('='.repeat(70));

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  // -------------------------------------------------------------------------
  // TEST 1: Native BroadcastChannel Cross-Tab Synchronization (<10ms)
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Testing Native BroadcastChannel (docsearch_hospital_events) ---');

  if (typeof BroadcastChannel === 'undefined') {
    console.warn('⚠️ Node environment lacks global BroadcastChannel; skipping test 1');
  } else {
    const channelDoctor = new BroadcastChannel('docsearch_hospital_events');
    const channelFrontDesk = new BroadcastChannel('docsearch_hospital_events');
    const channelTvDisplay = new BroadcastChannel('docsearch_hospital_events');

    let frontDeskReceived = null;
    let tvDisplayReceived = null;
    let deliveryTime = 0;
    const startCallTime = performance.now();

    channelFrontDesk.onmessage = (event) => {
      if (!deliveryTime) deliveryTime = performance.now() - startCallTime;
      frontDeskReceived = event.data;
    };

    channelTvDisplay.onmessage = (event) => {
      tvDisplayReceived = event.data;
    };

    // Doctor Cockpit Tab calls Patient #14
    const patientCalledPayload = {
      id: `evt-${Date.now()}-doc01`,
      type: 'PATIENT_CALLED',
      timestamp: new Date().toLocaleTimeString(),
      sourceModule: 'SoloDoctorOpdCockpitView',
      data: {
        token: '#14',
        tokenNumber: '#14',
        patientName: 'Ramesh Kumar',
        chamber: 'ROOM 101',
        roomNumber: 'ROOM 101',
        doctorName: 'Dr. Vikram Malhotra'
      },
      summaryText: '📢 Called #14 (Ramesh Kumar) to ROOM 101',
      senderId: 'tab-doctor-cockpit'
    };

    channelDoctor.postMessage(patientCalledPayload);

    // Wait for delivery
    await new Promise((r) => setTimeout(r, 25));
    const elapsedCall = deliveryTime || (performance.now() - startCallTime);

    assert(frontDeskReceived !== null, 'Front Desk Tab 2 received PATIENT_CALLED event');
    assert(frontDeskReceived?.data?.tokenNumber === '#14', 'Front Desk received correct token (#14)');
    assert(tvDisplayReceived !== null, 'TV Display Tab 3 received PATIENT_CALLED event');
    assert(tvDisplayReceived?.data?.patientName === 'Ramesh Kumar', 'TV Display received patient name (Ramesh Kumar)');
    assert(elapsedCall < 100, `Cross-tab broadcast latency is < 100ms (measured: ${elapsedCall.toFixed(2)}ms)`);

    // Doctor completes token
    let frontDeskCompleted = null;
    let tvDisplayCompleted = null;

    channelFrontDesk.onmessage = (event) => {
      if (event.data?.type === 'TOKEN_COMPLETED') frontDeskCompleted = event.data;
    };
    channelTvDisplay.onmessage = (event) => {
      if (event.data?.type === 'TOKEN_COMPLETED') tvDisplayCompleted = event.data;
    };

    const tokenCompletedPayload = {
      id: `evt-${Date.now()}-doc02`,
      type: 'TOKEN_COMPLETED',
      timestamp: new Date().toLocaleTimeString(),
      sourceModule: 'ClinicalConsultationDomainManager',
      data: {
        tokenNumber: '#14',
        token: '#14',
        patientName: 'Ramesh Kumar',
        doctorName: 'Dr. Vikram Malhotra'
      },
      summaryText: 'Token #14 completed by Dr. Vikram Malhotra',
      senderId: 'tab-doctor-cockpit'
    };

    channelDoctor.postMessage(tokenCompletedPayload);
    await new Promise((r) => setTimeout(r, 25));

    assert(frontDeskCompleted !== null, 'Front Desk Tab 2 received TOKEN_COMPLETED event');
    assert(tvDisplayCompleted !== null, 'TV Display Tab 3 received TOKEN_COMPLETED event');

    channelDoctor.close();
    channelFrontDesk.close();
    channelTvDisplay.close();
  }

  // -------------------------------------------------------------------------
  // TEST 2: API Gateway Server-Sent Events (SSE) Stream & Publishing
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing API Gateway SSE Endpoint (/api/v1/partner/events/stream) ---');

  const app = Fastify({ logger: false });
  await app.register(hospitalEventsRoutes);

  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Fastify test server listening on ${baseUrl}`);

  // 2.1 Connect client via SSE HTTP stream
  let handshakeReceived = false;
  let receivedSseEvents = [];

  const sseReq = http.request(`${baseUrl}/api/v1/partner/events/stream?clientId=test-tv-display-client`, (res) => {
    assert(res.statusCode === 200, `SSE HTTP response status is 200 (received: ${res.statusCode})`);
    assert(res.headers['content-type'] === 'text/event-stream', `SSE Content-Type is text/event-stream`);

    let buffer = '';
    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split('\n');
        let eventName = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) eventName = line.slice(7).trim();
          else if (line.startsWith('data: ')) data = line.slice(6).trim();
        }

        if (eventName === 'connected') {
          handshakeReceived = true;
        } else if (data) {
          try {
            receivedSseEvents.push({ eventName, payload: JSON.parse(data) });
          } catch {}
        }
      }
    });
  });

  sseReq.end();

  // Wait 100ms for SSE connection and handshake
  await new Promise((r) => setTimeout(r, 100));
  assert(handshakeReceived, 'SSE client successfully connected and received "connected" handshake');

  // 2.2 Check Status Diagnostic Endpoint
  const statusRes = await fetch(`${baseUrl}/api/v1/partner/events/status`);
  const statusData = await statusRes.json();
  assert(statusData.status === 'OK', 'Status endpoint returns OK');
  assert(statusData.activeSubscribers >= 1, `Status endpoint reports active subscriber count >= 1 (count: ${statusData.activeSubscribers})`);

  // 2.3 Publish Event to Gateway (e.g. from Doctor PC)
  const publishStartTime = performance.now();
  const publishRes = await fetch(`${baseUrl}/api/v1/partner/events/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'PATIENT_CALLED',
      sourceModule: 'DoctorChamberPC',
      data: {
        tokenNumber: '#25',
        patientName: 'Sunita Sharma',
        roomNumber: 'ROOM 102',
        doctorName: 'Dr. Ananya Sharma'
      },
      summaryText: 'Token #25 called to ROOM 102'
    })
  });

  const publishResult = await publishRes.json();
  assert(publishResult.success === true, 'POST /api/v1/partner/events/publish returned success');
  assert(publishResult.broadcastCount >= 1, `Broadcast count is >= 1 (sent to ${publishResult.broadcastCount} SSE clients)`);

  // Wait 50ms for SSE delivery
  await new Promise((r) => setTimeout(r, 50));
  const publishLatency = performance.now() - publishStartTime;

  const calledEvent = receivedSseEvents.find((e) => e.payload?.data?.tokenNumber === '#25');
  assert(calledEvent !== undefined, 'SSE stream received the PATIENT_CALLED event in real-time');
  assert(calledEvent?.payload?.data?.patientName === 'Sunita Sharma', 'SSE event data matches published payload (Sunita Sharma)');
  assert(publishLatency < 100, `End-to-end publish-to-stream latency is < 100ms (measured: ${publishLatency.toFixed(2)}ms)`);

  // 2.4 Publish PRESCRIPTION_ISSUED
  const rxRes = await fetch(`${baseUrl}/api/v1/partner/events/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'PRESCRIPTION_ISSUED',
      sourceModule: 'ClinicalConsultationDomainManager',
      data: {
        tokenNumber: '#25',
        patientName: 'Sunita Sharma',
        doctorName: 'Dr. Ananya Sharma',
        medications: [{ name: 'Paracetamol 650mg' }]
      },
      summaryText: 'Prescription signed for Sunita Sharma'
    })
  });
  const rxResult = await rxRes.json();
  assert(rxResult.success === true, 'POST /api/v1/partner/events/publish for PRESCRIPTION_ISSUED returned success');

  await new Promise((r) => setTimeout(r, 50));
  const rxEvent = receivedSseEvents.find((e) => e.payload?.type === 'PRESCRIPTION_ISSUED');
  assert(rxEvent !== undefined, 'SSE stream received PRESCRIPTION_ISSUED event across device bridge');

  // Disconnect SSE client
  sseReq.destroy();
  await new Promise((r) => setTimeout(r, 50));

  await app.close();
  console.log('Fastify test server closed successfully');

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  if (failures === 0) {
    console.log('🎉 ALL REAL-TIME EVENT BUS & SSE STREAM TESTS PASSED PERFECTLY!');
    console.log('='.repeat(70));
    process.exit(0);
  } else {
    console.error(`💥 TEST SUITE FAILED WITH ${failures} ERROR(S)`);
    console.log('='.repeat(70));
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
