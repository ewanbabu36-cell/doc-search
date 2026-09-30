async function test() {
  try {
    const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'founder.alok@docsearch.health', password: 'FounderPass123!' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    const tenantId = loginData.data?.tenantId;
    console.log('Logged in. Tenant ID:', tenantId);

    const res = await fetch('http://127.0.0.1:4000/api/v1/compliance/documents/requirements?role=DOCTOR', {
      headers: {
        authorization: 'Bearer ' + token,
        'x-tenant-id': tenantId || '00000000-0000-0000-0000-000000000001'
      }
    });
    console.log('Requirements Status:', res.status);

    const uploadRes = await fetch('http://127.0.0.1:4000/api/v1/compliance/documents/upload', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + token,
        'x-tenant-id': tenantId || '00000000-0000-0000-0000-000000000001'
      },
      body: JSON.stringify({
        documentTypeCode: 'DOC_DEGREE_MBBS_MD',
        ownerEntityId: '00000000-0000-0000-0000-000000000001',
        ownerEntityType: 'USER',
        fileName: 'mbbs_degree.pdf',
        fileBase64: Buffer.from('%PDF-1.4 dummy pdf content for audit').toString('base64')
      })
    });
    console.log('Upload Status:', uploadRes.statusCode || uploadRes.status, 'Response:', await uploadRes.text());
  } catch (err) {
    console.error('Test error:', err);
  }
}
test();
