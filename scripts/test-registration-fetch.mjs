async function test() {
  console.log('[*] Testing self-register endpoint...');
  try {
    const res = await fetch('http://127.0.0.1:4000/api/v1/auth/self-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner: {
          id: 'test-123',
          name: 'DR EWAN',
          email: 'ewan@docsearch.health',
          tenantName: 'EWAN HOSPITAL',
          organizationType: 'HOSPITAL',
          role: 'HOSPITAL_DIRECTOR',
          roleTitle: 'Medical Director',
          department: 'Administration',
          allowedWorkspaces: ['HOSPITAL'],
          defaultModule: 'clinical-consultation',
          planTier: 'Foundation Free OPD Core'
        },
        verificationItem: {
          id: 'KYC-test-123',
          partnerName: 'EWAN HOSPITAL',
          partnerType: 'HOSPITAL',
          submittedBy: 'DR EWAN',
          details: {
            'Facility Name': 'EWAN HOSPITAL',
            'Owner / Lead Doctor': 'DR EWAN',
            'Registered Email': 'ewan@docsearch.health',
            'Phone / Mobile': '8756567879'
          }
        }
      })
    });
    console.log('Status 4000:', res.status);
    const json = await res.json();
    console.log('Response 4000:', json);
  } catch (err) {
    console.error('Fetch error 4000:', err);
  }

  try {
    const res5173 = await fetch('http://127.0.0.1:5173/api/v1/auth/self-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner: {
          id: 'test-456',
          name: 'DR EWAN',
          email: 'ewan2@docsearch.health',
          tenantName: 'EWAN HOSPITAL',
          organizationType: 'HOSPITAL',
          role: 'HOSPITAL_DIRECTOR',
          roleTitle: 'Medical Director',
          department: 'Administration',
          allowedWorkspaces: ['HOSPITAL'],
          defaultModule: 'clinical-consultation',
          planTier: 'Foundation Free OPD Core'
        },
        verificationItem: {
          id: 'KYC-test-456',
          partnerName: 'EWAN HOSPITAL',
          partnerType: 'HOSPITAL',
          submittedBy: 'DR EWAN',
          details: {
            'Facility Name': 'EWAN HOSPITAL',
            'Owner / Lead Doctor': 'DR EWAN',
            'Registered Email': 'ewan2@docsearch.health',
            'Phone / Mobile': '8756567879'
          }
        }
      })
    });
    console.log('Status 5173:', res5173.status);
    const json5173 = await res5173.json();
    console.log('Response 5173:', json5173);
  } catch (err) {
    console.error('Fetch error 5173:', err);
  }
}

test();
