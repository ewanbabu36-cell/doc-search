import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

console.log('Testing GET /api/v1/partner/workspace/layout ...');
const getRes = await request({
  host: '127.0.0.1',
  port: 4000,
  path: '/api/v1/partner/workspace/layout',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'x-tenant-id': '00000000-0000-0000-0000-000000000001',
    'x-user-id': '00000000-0000-0000-0000-000000000002'
  }
});
console.log('GET Status:', getRes.status, 'Preset:', getRes.data?.data?.activePresetId, 'Dock Slots:', getRes.data?.data?.dockSlots?.length);

console.log('\nTesting PUT /api/v1/partner/workspace/layout ...');
const putRes = await request({
  host: '127.0.0.1',
  port: 4000,
  path: '/api/v1/partner/workspace/layout',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': '00000000-0000-0000-0000-000000000001',
    'x-user-id': '00000000-0000-0000-0000-000000000002'
  }
}, {
  activePresetId: 'DOCTOR_OPD_CUSTOM',
  dockSlots: [
    { id: 'clinical_opd_queue', label: 'OPD Queue' },
    { id: 'clinical_rx_pad', label: 'Rx Pad' }
  ],
  headerSlots: [{ id: 'global_search', label: 'Search' }],
  themeVariant: 'LIQUID_GLASS_DARK'
});
console.log('PUT Status:', putRes.status, 'Saved Preset:', putRes.data?.data?.activePresetId);
