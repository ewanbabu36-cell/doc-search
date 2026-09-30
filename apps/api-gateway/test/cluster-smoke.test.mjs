import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clusterScript = path.resolve(__dirname, '../dist/server-cluster.js');

test('API Gateway Cluster: master forks workers and logs startup', async () => {
  const child = fork(clusterScript, [], {
    env: {
      ...process.env,
      CLUSTER_WORKERS: '2',
      PORT: '4099',
      NODE_ENV: 'test'
    },
    stdio: 'pipe'
  });

  let output = '';
  child.stdout?.on('data', (d) => {
    output += d.toString();
  });
  child.stderr?.on('data', (d) => {
    output += d.toString();
  });

  // Give cluster 3 seconds to fork workers and print banner
  await new Promise((resolve) => setTimeout(resolve, 3500));

  child.kill('SIGTERM');

  assert.ok(
    output.includes('HIGH-CONCURRENCY MULTI-CORE CLUSTER MANAGER') ||
    output.includes('Active Worker Instances Forking: 2') ||
    output.includes('[CLUSTER] Forked worker process'),
    `Expected cluster manager banner in output, got: ${output.slice(0, 500)}`
  );
});
