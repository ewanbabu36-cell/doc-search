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

const ports = [4000, 5173, 5174, 5177, 5432];
for (const p of ports) {
  const active = await checkPort(p);
  console.log(`Port ${p}: ${active ? 'ACTIVE' : 'IDLE'}`);
}
