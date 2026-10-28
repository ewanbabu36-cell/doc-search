import net from 'net';

function checkPort(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host: '127.0.0.1' }, () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => resolve(false));
  });
}

const [pg, gw] = await Promise.all([checkPort(5432), checkPort(4000)]);
console.log(`STATUS: PostgreSQL: ${pg ? 'UP' : 'DOWN'}, API Gateway: ${gw ? 'UP' : 'DOWN'}`);
