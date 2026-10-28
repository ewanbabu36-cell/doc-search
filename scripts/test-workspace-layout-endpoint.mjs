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

console.log('Testing PUT /api/v1/partner/workspace/layout with Wallpaper & Desktop Icons...');
const putRes = await request(
  {
    host: '127.0.0.1',
    port: 4000,
    path: '/api/v1/partner/workspace/layout',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': '00000000-0000-0000-0000-000000000001',
      'x-user-id': '00000000-0000-0000-0000-000000000002',
    },
  },
  {
    activePresetId: 'ANDROID_DESKTOP_PRO',
    wallpaperId: 'OLED_COSMIC_BLUE',
    wallpaperBlurPx: 4,
    desktopIcons: [
      { id: 'clinical_opd_queue' },
      { id: 'ipd_bed_census' },
      { id: 'pharmacy_pos_checkout' },
      { id: 'billing_cashier_desk' }
    ],
    dockSlots: [
      { id: 'clinical_opd_queue', label: 'OPD Queue' },
      { id: 'emergency_manchester_triage', label: 'ER Triage' }
    ],
    themeVariant: 'LIQUID_GLASS_DARK',
  }
);

console.log('PUT Status:', putRes.status, 'Preset:', putRes.data?.data?.activePresetId, 'Wallpaper:', putRes.data?.data?.wallpaperId, 'Desktop Icons:', putRes.data?.data?.desktopIcons?.length);

console.log('\nTesting GET /api/v1/partner/workspace/layout ...');
const getRes = await request({
  host: '127.0.0.1',
  port: 4000,
  path: '/api/v1/partner/workspace/layout',
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'x-tenant-id': '00000000-0000-0000-0000-000000000001',
    'x-user-id': '00000000-0000-0000-0000-000000000002',
  },
});
console.log('GET Status:', getRes.status, 'Retrieved Wallpaper:', getRes.data?.data?.wallpaperId, 'Retrieved Blur:', getRes.data?.data?.wallpaperBlurPx, 'Retrieved Desktop Icons:', getRes.data?.data?.desktopIcons?.length);
