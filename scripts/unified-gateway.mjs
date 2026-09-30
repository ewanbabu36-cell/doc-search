import http from 'node:http';
import net from 'node:net';

const GATEWAY_PORT = 3000;

const ROUTE_TARGETS = {
  api: 4000,
  partner: 5173,
  hq: 5174,
  landing: 5175
};

function resolveTarget(url) {
  if (url.startsWith('/api/') || url === '/api') {
    return { port: ROUTE_TARGETS.api, service: 'API Gateway' };
  }
  if (url.startsWith('/partner/') || url === '/partner') {
    return { port: ROUTE_TARGETS.partner, service: 'Partner Platform' };
  }
  if (url.startsWith('/hq/') || url === '/hq') {
    return { port: ROUTE_TARGETS.hq, service: 'Company Platform' };
  }
  return { port: ROUTE_TARGETS.landing, service: 'Landing Page' };
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // Normalize /partner -> /partner/ and /hq -> /hq/ for SPA route consistency
  if (url === '/partner') {
    res.writeHead(302, { Location: '/partner/' });
    res.end();
    return;
  }
  if (url === '/hq') {
    res.writeHead(302, { Location: '/hq/' });
    res.end();
    return;
  }

  const { port: targetPort, service } = resolveTarget(url);

  const headers = { ...req.headers };
  headers['host'] = `127.0.0.1:${targetPort}`;
  headers['x-forwarded-host'] = req.headers.host || `localhost:${GATEWAY_PORT}`;
  headers['x-forwarded-proto'] = 'http';
  headers['x-forwarded-for'] = req.socket.remoteAddress || '127.0.0.1';

  const proxyReq = http.request(
    {
      host: '127.0.0.1',
      port: targetPort,
      path: url,
      method: req.method,
      headers
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`[Gateway Proxy Error -> ${service}:${targetPort}]`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>DocSearch Gateway • Service Starting</title>
            <style>
              body { background: #070B14; color: #F8FAFC; font-family: Inter, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #0F172A; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
              h2 { color: #38BDF8; margin-top: 0; }
              p { color: #94A3B8; font-size: 0.875rem; line-height: 1.5; }
              .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(239, 68, 68, 0.2); color: #F87171; font-weight: 700; font-size: 0.75rem; margin-bottom: 12px; }
              button { margin-top: 16px; background: #0284C7; color: #FFF; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 700; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">HTTP 502 • SERVICE WARMING UP</div>
              <h2>${service} is Initializing</h2>
              <p>The unified gateway attempted to connect to <strong>${service}</strong> on port <strong>${targetPort}</strong>, but the service is still compiling or starting up.</p>
              <button onclick="window.location.reload()">🔄 Retry Connection</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  req.pipe(proxyReq);
});

// Proxy WebSocket upgrades (Essential for Vite HMR)
server.on('upgrade', (req, socket, head) => {
  const url = req.url || '/';
  const { port: targetPort, service } = resolveTarget(url);

  const targetSocket = net.connect(targetPort, '127.0.0.1', () => {
    let rawHeaders = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const key = req.rawHeaders[i];
      const val = key.toLowerCase() === 'host' ? `127.0.0.1:${targetPort}` : req.rawHeaders[i + 1];
      rawHeaders += `${key}: ${val}\r\n`;
    }
    rawHeaders += '\r\n';

    targetSocket.write(rawHeaders);
    if (head && head.length > 0) {
      targetSocket.write(head);
    }
    targetSocket.pipe(socket);
    socket.pipe(targetSocket);
  });

  targetSocket.on('error', (err) => {
    console.error(`[Gateway WebSocket Error -> ${service}:${targetPort}]`, err.message);
    socket.destroy();
  });

  socket.on('error', () => {
    targetSocket.destroy();
  });
});

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log('\n============================================================');
  console.log(`🌐 DOC SEARCH MASTER UNIFIED GATEWAY IS ONLINE!`);
  console.log(`🚀 Access Everything At: http://localhost:${GATEWAY_PORT}`);
  console.log(`   ├─ Landing Page:     http://localhost:${GATEWAY_PORT}/`);
  console.log(`   ├─ Partner Platform: http://localhost:${GATEWAY_PORT}/partner/`);
  console.log(`   ├─ Company Platform: http://localhost:${GATEWAY_PORT}/hq/`);
  console.log(`   └─ API Gateway:      http://localhost:${GATEWAY_PORT}/api/`);
  console.log('============================================================\n');
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
