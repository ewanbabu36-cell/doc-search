import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export class ChromeRunner {
  constructor(options = {}) {
    this.port = options.port || 9222;
    this.userDataDir = options.userDataDir || `C:\\Users\\alamr\\AppData\\Local\\Temp\\chrome_${Date.now()}`;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.child = null;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async start() {
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }

    const args = [
      this.headless ? '--headless=new' : '',
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.userDataDir}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      'about:blank'
    ].filter(Boolean);

    this.child = spawn(CHROME_PATH, args, { stdio: 'ignore' });

    // Connect to browser target
    const versionInfo = await this._waitForHttp(`http://127.0.0.1:${this.port}/json/version`);
    this.browserWsUrl = versionInfo.webSocketDebuggerUrl;

    // Get a page target
    const targets = await this._waitForHttp(`http://127.0.0.1:${this.port}/json/list`);
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      this.ws.onopen = async () => {
        await this.send('Page.enable');
        await this.send('Runtime.enable');
        resolve();
      };
      this.ws.onerror = reject;
      this.ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async navigate(url) {
    const res = await this.send('Page.navigate', { url });
    // Wait for DOM load
    await new Promise((r) => setTimeout(r, 2000));
    return res;
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async stop() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
    if (this.child) {
      try { this.child.kill('SIGKILL'); } catch {}
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  async _waitForHttp(url, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await new Promise((resolve, reject) => {
          const req = http.get(url, (r) => {
            let body = '';
            r.on('data', (c) => body += c);
            r.on('end', () => {
              try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
          });
          req.on('error', reject);
        });
        if (res) return res;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Timeout waiting for ${url}`);
  }
}
