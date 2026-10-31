async function test() {
  try {
    const r1 = await fetch('http://127.0.0.1:5173');
    console.log('✓ Partner Platform on port 5173:', r1.status, r1.statusText);
  } catch (e) {
    console.log('✗ Partner Platform (5173) error:', e.message);
  }

  try {
    const r2 = await fetch('http://127.0.0.1:5174');
    console.log('✓ Patient App on port 5174:', r2.status, r2.statusText);
  } catch (e) {
    console.log('✗ Patient App (5174) error:', e.message);
  }

  try {
    const r3 = await fetch('http://127.0.0.1:5177');
    console.log('✓ Company Platform on port 5177:', r3.status, r3.statusText);
  } catch (e) {
    console.log('✗ Company Platform (5177) error:', e.message);
  }
}

test();
