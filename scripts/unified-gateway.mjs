import http from 'node:http';
import net from 'node:net';

const GATEWAY_PORT = 3000;

// Upstream port map
const SERVICES = {
  landing: { port: 5175, name: 'Landing & Public Booking', icon: '🌐', path: '/' },
  partner: { port: 5173, name: 'Partner Platform (ERP)', icon: '🏥', path: '/partner/' },
  company: { port: 5177, name: 'Company Platform (Admin)', icon: '🏢', path: '/hq/' },
  pwa:     { port: 5176, name: 'Sovra Healthcare PWA', icon: '📱', path: '/pwa/' },
  patient: { port: 5174, name: 'Patient Mobile App', icon: '📲', path: '/patient/' },
  api:     { port: 4000, name: 'API Gateway', icon: '⚡', path: '/api/' },
  pacs:    { port: 8042, name: 'Radiology PACS Viewer', icon: '🩻', path: '/pacs/' },
  hardware:{ port: 18080, name: 'Hardware Agent (LHA)', icon: '🖨️', path: '/hardware/' }
};

/**
 * Resolve target port based on Host header or URL path
 */
function resolveUpstream(req) {
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  const url = req.url || '/';

  // 1. Subdomain resolution (e.g. partner.localhost, partner.127.0.0.1.nip.io, partner.docsearch.local)
  if (host.startsWith('partner.')) return { port: SERVICES.partner.port, service: SERVICES.partner.name };
  if (host.startsWith('admin.') || host.startsWith('hq.') || host.startsWith('company.')) return { port: SERVICES.company.port, service: SERVICES.company.name };
  if (host.startsWith('pwa.')) return { port: SERVICES.pwa.port, service: SERVICES.pwa.name };
  if (host.startsWith('patient.')) return { port: SERVICES.patient.port, service: SERVICES.patient.name };
  if (host.startsWith('api.')) return { port: SERVICES.api.port, service: SERVICES.api.name };
  if (host.startsWith('pacs.')) return { port: SERVICES.pacs.port, service: SERVICES.pacs.name };
  if (host.startsWith('landing.') || host.startsWith('booking.')) return { port: SERVICES.landing.port, service: SERVICES.landing.name };

  // 2. Direct API / PACS / Hardware prefix proxies on localhost:3000
  if (url.startsWith('/api/') || url === '/api') return { port: SERVICES.api.port, service: SERVICES.api.name };
  if (url.startsWith('/pacs/') || url === '/pacs') return { port: SERVICES.pacs.port, service: SERVICES.pacs.name };
  if (url.startsWith('/hardware/') || url === '/hardware') return { port: SERVICES.hardware.port, service: SERVICES.hardware.name };

  return null;
}

/**
 * Modern HTML Command Center & App Switcher Hub UI
 */
function renderHubHtml(activeApp = 'partner') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DocSearch Unified Command Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070B14;
      --card-bg: rgba(15, 23, 42, 0.85);
      --border: rgba(56, 189, 248, 0.2);
      --accent: #0284C7;
      --accent-glow: #38BDF8;
      --text: #F8FAFC;
      --muted: #94A3B8;
      --success: #10B981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    /* Top Master Control Header */
    header {
      background: rgba(10, 16, 31, 0.95);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      z-index: 50;
      flex-shrink: 0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text);
    }
    .brand-logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #0284C7, #06B6D4);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      color: white;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
    }
    .brand-text {
      font-weight: 800;
      font-size: 15px;
      letter-spacing: -0.3px;
    }
    .brand-badge {
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-glow);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    /* App Navigation Tabs */
    .app-tabs {
      display: flex;
      gap: 6px;
      align-items: center;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .app-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      text-decoration: none;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      white-space: nowrap;
      cursor: pointer;
      background: transparent;
    }
    .app-tab:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.05);
    }
    .app-tab.active {
      color: #FFF;
      background: rgba(2, 132, 199, 0.25);
      border-color: rgba(56, 189, 248, 0.4);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
    }
    .app-tab .icon { font-size: 15px; }
    /* Header Right Utilities */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .health-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34D399;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      font-family: 'JetBrains Mono', monospace;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10B981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .action-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--text);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }
    /* Main Viewport Container */
    #viewport-container {
      flex: 1;
      width: 100%;
      height: calc(100vh - 54px);
      position: relative;
      background: #0B0F19;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    /* Quick Drawer Modal */
    #switcher-modal {
      position: fixed;
      top: 60px;
      right: 16px;
      width: 380px;
      background: #0F172A;
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.8);
      z-index: 100;
      padding: 16px;
      display: none;
      backdrop-filter: blur(20px);
    }
    #switcher-modal.open { display: block; }
    .drawer-title { font-size: 14px; font-weight: 700; color: #FFF; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .grid-links { display: grid; grid-template-columns: 1fr; gap: 8px; }
    .grid-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      text-decoration: none;
      color: var(--text);
      transition: background 0.15s ease;
    }
    .grid-item:hover {
      background: rgba(2, 132, 199, 0.15);
      border-color: rgba(56, 189, 248, 0.3);
    }
    .item-meta { display: flex; align-items: center; gap: 10px; }
    .item-meta span { font-size: 13px; font-weight: 600; }
    .item-port { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <header>
    <a href="/" class="brand">
      <div class="brand-logo">DS</div>
      <div class="brand-text">DocSearch</div>
      <span class="brand-badge">UNIFIED HUB</span>
    </a>

    <!-- Universal App Navigation Tabs -->
    <nav class="app-tabs">
      <button class="app-tab ${activeApp === 'partner' ? 'active' : ''}" onclick="switchApp('partner', 'http://127.0.0.1:5173')">
        <span class="icon">🏥</span> Partner Platform (ERP)
      </button>
      <button class="app-tab ${activeApp === 'landing' ? 'active' : ''}" onclick="switchApp('landing', 'http://127.0.0.1:5175')">
        <span class="icon">🌐</span> Public Booking & Web
      </button>
      <button class="app-tab ${activeApp === 'company' ? 'active' : ''}" onclick="switchApp('company', 'http://127.0.0.1:5177')">
        <span class="icon">🏢</span> Company Platform (Admin)
      </button>
      <button class="app-tab ${activeApp === 'pwa' ? 'active' : ''}" onclick="switchApp('pwa', 'http://127.0.0.1:5176')">
        <span class="icon">📱</span> Sovra Patient PWA
      </button>
      <button class="app-tab ${activeApp === 'pacs' ? 'active' : ''}" onclick="switchApp('pacs', 'http://127.0.0.1:8042/dicom-web/studies')">
        <span class="icon">🩻</span> PACS Server
      </button>
      <button class="app-tab ${activeApp === 'api' ? 'active' : ''}" onclick="switchApp('api', 'http://127.0.0.1:4000/api/v1/health')">
        <span class="icon">⚡</span> API Gateway
      </button>
    </nav>

    <div class="header-actions">
      <div class="health-pill">
        <div class="pulse-dot"></div>
        <span>ALL ACTIVE</span>
      </div>
      <button class="action-btn" onclick="toggleSwitcher()">
        <span>🎛️ App Switcher</span>
      </button>
      <a href="javascript:void(0)" onclick="openExternal()" class="action-btn" title="Open active view in separate tab">
        <span>↗ Pop-out</span>
      </a>
    </div>
  </header>

  <!-- Full Height Seamless Viewport -->
  <main id="viewport-container">
    <iframe id="main-frame" src="http://127.0.0.1:5173" allow="clipboard-read; clipboard-write; camera; microphone"></iframe>
  </main>

  <!-- Quick App Switcher Modal -->
  <div id="switcher-modal">
    <div class="drawer-title">
      <span>🚀 Master Microservice Switcher</span>
      <button onclick="toggleSwitcher()" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:16px;">✕</button>
    </div>
    <div class="grid-links">
      <a href="javascript:void(0)" onclick="switchApp('partner', 'http://127.0.0.1:5173')" class="grid-item">
        <div class="item-meta"><span>🏥 Partner Platform</span></div>
        <span class="item-port">:5173</span>
      </a>
      <a href="javascript:void(0)" onclick="switchApp('landing', 'http://127.0.0.1:5175')" class="grid-item">
        <div class="item-meta"><span>🌐 Public Booking & Web</span></div>
        <span class="item-port">:5175</span>
      </a>
      <a href="javascript:void(0)" onclick="switchApp('company', 'http://127.0.0.1:5177')" class="grid-item">
        <div class="item-meta"><span>🏢 Company Admin Console</span></div>
        <span class="item-port">:5177</span>
      </a>
      <a href="javascript:void(0)" onclick="switchApp('pwa', 'http://127.0.0.1:5176')" class="grid-item">
        <div class="item-meta"><span>📱 Sovra Healthcare PWA</span></div>
        <span class="item-port">:5176</span>
      </a>
      <a href="javascript:void(0)" onclick="switchApp('patient', 'http://127.0.0.1:5174')" class="grid-item">
        <div class="item-meta"><span>📲 Patient Mobile App</span></div>
        <span class="item-port">:5174</span>
      </a>
      <a href="javascript:void(0)" onclick="switchApp('pacs', 'http://127.0.0.1:8042/dicom-web/studies')" class="grid-item">
        <div class="item-meta"><span>🩻 Radiology DICOM PACS</span></div>
        <span class="item-port">:8042</span>
      </a>
      <a href="javascript:void(0)" onclick="switchApp('hardware', 'http://127.0.0.1:18080/api/v1/hardware')" class="grid-item">
        <div class="item-meta"><span>🖨️ Hardware Thermal Agent</span></div>
        <span class="item-port">:18080</span>
      </a>
      <a href="javascript:void(0)" onclick="switchApp('api', 'http://127.0.0.1:4000/api/v1/health')" class="grid-item">
        <div class="item-meta"><span>⚡ API Gateway Health</span></div>
        <span class="item-port">:4000</span>
      </a>
    </div>
  </div>

  <script>
    let currentUrl = 'http://127.0.0.1:5173';

    function switchApp(appKey, url) {
      currentUrl = url;
      document.getElementById('main-frame').src = url;
      document.querySelectorAll('.app-tab').forEach(t => t.classList.remove('active'));
      event.currentTarget.classList.add('active');
      document.getElementById('switcher-modal').classList.remove('open');
    }

    function toggleSwitcher() {
      document.getElementById('switcher-modal').classList.toggle('open');
    }

    function openExternal() {
      window.open(currentUrl, '_blank');
    }

    // Keyboard shortcut (Alt + S or Ctrl + K) to toggle switcher
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSwitcher();
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Master Gateway Server
 */
const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const upstream = resolveUpstream(req);

  // If no upstream is resolved and request is on root of localhost:3000, serve Master Hub
  if (!upstream) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store'
    });
    res.end(renderHubHtml());
    return;
  }

  // Otherwise, proxy request directly to the target upstream service
  const targetPort = upstream.port;
  const service = upstream.service;

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
            <title>DocSearch Gateway • Service Initializing</title>
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
  const upstream = resolveUpstream(req);
  const targetPort = upstream ? upstream.port : SERVICES.partner.port;
  const service = upstream ? upstream.service : SERVICES.partner.name;

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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[!] Gateway port ${GATEWAY_PORT} is already bound (e.g. by IDE/Forwarder). Retrying gracefully on 3001...`);
    try {
      server.listen(3001, '0.0.0.0', () => {
        console.log(`[✔] Unified Gateway listening on fallback port 3001 (http://localhost:3001/)`);
      });
    } catch {}
  } else {
    console.error('[Gateway Server Error]', err.message);
  }
});

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log('\n============================================================');
  console.log(`🌐 DOC SEARCH MASTER UNIFIED GATEWAY IS ONLINE!`);
  console.log(`🚀 Access Everything From ONE Single URL:`);
  console.log(`   👉 http://localhost:${GATEWAY_PORT}/`);
  console.log(`============================================================\n`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
