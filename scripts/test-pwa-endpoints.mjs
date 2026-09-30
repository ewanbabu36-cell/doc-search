async function testPwaEndpoints() {
  const urls = [
    'http://localhost:5173/',
    'http://localhost:5173/manifest.json',
    'http://localhost:5173/icons/pwa-192x192.png',
    'http://localhost:5173/icons/pwa-512x512.png',
    'http://localhost:5173/icons/apple-touch-icon.png',
    'http://localhost:5175/',
    'http://localhost:5175/manifest.json',
    'http://localhost:5175/icons/pwa-192x192.png'
  ];

  let allPassed = true;
  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(`[STATUS ${res.status}] ${u} - Content-Type: ${res.headers.get('content-type')}`);
      if (res.status !== 200) {
        allPassed = false;
      }
      if (u.includes('manifest.json')) {
        const json = await res.json();
        console.log(`  -> Manifest short_name: "${json.short_name}", display: "${json.display}", icons count: ${json.icons.length}`);
      }
    } catch (e) {
      console.error(`FAILED: ${u} - ${e.message}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n>>> ALL PWA ENDPOINTS VERIFIED WITH STATUS 200 OK! <<<');
  } else {
    console.error('\n>>> SOME PWA ENDPOINTS FAILED! <<<');
    process.exit(1);
  }
}

testPwaEndpoints();
