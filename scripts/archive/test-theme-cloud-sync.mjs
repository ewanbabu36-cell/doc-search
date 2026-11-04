async function verifyThemeCloudSync() {
  console.log('--- STEP 1: Logging in as Partner (Browser A: Chrome) ---');
  const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'labtech@metropolis.com', password: '123456' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }

  const tokenA = loginData.data.accessToken;
  const partnerId = loginData.data.user.partnerId;
  console.log('[OK] Browser A logged in. Partner ID:', partnerId);

  console.log('\n--- STEP 2: Fetching Current Theme Preference (Browser A) ---');
  const getPrefResA = await fetch('http://127.0.0.1:4000/api/v1/partner/account/preferences', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const prefDataA = await getPrefResA.json();
  console.log('Initial Preferences in Browser A:', prefDataA);

  console.log('\n--- STEP 3: Changing Theme to "theme-swiss-clinical" (Browser A) ---');
  const patchPrefResA = await fetch('http://127.0.0.1:4000/api/v1/partner/account/preferences', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      themePreference: 'theme-swiss-clinical',
      theme: 'theme-swiss-clinical'
    })
  });
  const patchedA = await patchPrefResA.json();
  console.log('Patch response:', patchedA);
  if (!patchPrefResA.ok || !patchedA.success) {
    throw new Error('Failed to patch preferences: ' + JSON.stringify(patchedA));
  }

  console.log('\n--- STEP 4: Simulating Browser B (Edge) Opening / Window Focus ---');
  // Browser B makes the exact call that setupCrossBrowserThemeSync makes on window 'focus'
  const getPrefResB = await fetch('http://127.0.0.1:4000/api/v1/partner/account/preferences', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const prefDataB = await getPrefResB.json();
  console.log('Preferences retrieved by Browser B on focus:', prefDataB);

  const syncedThemeB = prefDataB.data?.themePreference || prefDataB.data?.theme;
  if (syncedThemeB === 'theme-swiss-clinical') {
    console.log('[SUCCESS] Browser B successfully received "theme-swiss-clinical" from PostgreSQL!');
  } else {
    throw new Error(`Theme mismatch! Expected "theme-swiss-clinical" but got "${syncedThemeB}"`);
  }

  console.log('\n--- STEP 5: Browser B changes theme to "theme-advance-pro" ---');
  const patchPrefResB = await fetch('http://127.0.0.1:4000/api/v1/partner/account/preferences', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      themePreference: 'theme-advance-pro',
      theme: 'theme-advance-pro'
    })
  });
  const patchedB = await patchPrefResB.json();
  console.log('Browser B patch response:', patchedB);

  console.log('\n--- STEP 6: Browser A window focus / poll check ---');
  const recheckResA = await fetch('http://127.0.0.1:4000/api/v1/partner/account/preferences', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const recheckedDataA = await recheckResA.json();
  console.log('Browser A preferences after Browser B update:', recheckedDataA);
  const syncedThemeA = recheckedDataA.data?.themePreference || recheckedDataA.data?.theme;
  if (syncedThemeA === 'theme-advance-pro') {
    console.log('[SUCCESS] Browser A successfully synced back to "theme-advance-pro"!');
  } else {
    throw new Error(`Theme mismatch! Expected "theme-advance-pro" but got "${syncedThemeA}"`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL CROSS-BROWSER THEME CLOUD SYNC TESTS PASSED! 🎉');
  console.log('======================================================');
}

verifyThemeCloudSync().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
