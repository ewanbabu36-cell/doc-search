import http from 'node:http';

const BASE_URL = 'http://127.0.0.1:4000';

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: 'GET',
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- Step 1: Login as Receptionist Tohid ---');
  const tohidLogin = await post('/api/v1/auth/login', {
    email: 'tohid@doc.in',
    password: '123456'
  });
  console.log('Tohid Login Response Status:', tohidLogin.status);
  const tohidToken = tohidLogin.data?.data?.accessToken || tohidLogin.data?.accessToken;
  const tohidHeaders = { Authorization: `Bearer ${tohidToken}` };
  console.log('Tohid Auth Token acquired:', !!tohidToken);

  console.log('\n--- Step 2: Register Patient "Aqsa" (Single Name) ---');
  const patRes = await post(
    '/api/v1/partner/clinical/patients',
    {
      firstName: 'Aqsa',
      lastName: '',
      gender: 'FEMALE',
      mobileNumber: '9876501234',
      dateOfBirth: '1998-05-15'
    },
    tohidHeaders
  );
  console.log('Patient Registration Status:', patRes.status);
  console.log('Patient Registration Data:', JSON.stringify(patRes.data, null, 2));

  const patientId = patRes.data?.data?.id || patRes.data?.id;
  if (!patientId) {
    console.error('FAILED to register Aqsa:', patRes);
    return;
  }

  console.log('\n--- Step 3: Check-in Aqsa for Dr. Ashraf ---');
  const checkInRes = await post(
    '/api/v1/partner/clinical/encounters/check-in',
    {
      patientId,
      doctorId: '4bdb8c25-de26-450b-b00c-9600aa53d459', // Dr. Ashraf's doctorProfileId
      encounterType: 'WALK_IN',
      chiefComplaint: 'Fever and throat pain',
      status: 'WAITING',
      metadata: {
        feePaymentMode: 'UPI_QR',
        feeStatus: 'PAID',
        consultationFee: 500,
        patientName: 'Aqsa',
        patientPhone: '9876501234',
        age: '26',
        gender: 'FEMALE',
        chamber: 'Chamber 1'
      }
    },
    tohidHeaders
  );
  console.log('Check-in Status:', checkInRes.status);
  console.log('Check-in Data:', JSON.stringify(checkInRes.data, null, 2));

  const encounterId = checkInRes.data?.data?.id || checkInRes.data?.id;
  const tokenNumber = checkInRes.data?.data?.queueToken?.tokenNumber || checkInRes.data?.queueToken?.tokenNumber || checkInRes.data?.data?.tokenNumber;

  console.log(`\n>>> Token Allocated for Aqsa: ${tokenNumber} (Encounter: ${encounterId}) <<<`);

  console.log('\n--- Step 4: Login as Dr. Ashraf ---');
  const ashrafLogin = await post('/api/v1/auth/login', {
    email: 'ashraf@doc.in',
    password: '123456'
  });
  console.log('Ashraf Login Response Status:', ashrafLogin.status);
  const ashrafToken = ashrafLogin.data?.data?.accessToken || ashrafLogin.data?.accessToken;
  const ashrafHeaders = { Authorization: `Bearer ${ashrafToken}` };

  console.log('\n--- Step 5: Query Dr. Ashraf Worklist Encounters ---');
  const encRes = await get('/api/v1/partner/encounters', ashrafHeaders);
  console.log('Encounters Status:', encRes.status);
  const encounters = encRes.data?.data || encRes.data || [];
  console.log(`Total encounters returned: ${encounters.length}`);

  const aqsaEnc = encounters.find((e) => e.id === encounterId || e.patientId === patientId || (e.patientName && e.patientName.includes('Aqsa')));
  if (aqsaEnc) {
    console.log('✅ SUCCESS! Found Aqsa in Dr. Ashraf encounters list:');
    console.log(JSON.stringify(aqsaEnc, null, 2));
  } else {
    console.log('❌ Aqsa NOT found in encounters list. Dumping list:');
    console.log(JSON.stringify(encounters, null, 2));
  }

  console.log('\n--- Step 6: Query Dr. Ashraf Queue ---');
  const qRes = await get('/api/v1/partner/clinical/queues?doctorId=4bdb8c25-de26-450b-b00c-9600aa53d459', ashrafHeaders);
  console.log('Queue Status:', qRes.status);
  const queues = qRes.data?.data || qRes.data || [];
  console.log(`Queue items returned: ${queues.length}`);
  const aqsaQ = queues.find((q) => q.encounterId === encounterId || q.patientId === patientId || (q.patientName && q.patientName.includes('Aqsa')));
  if (aqsaQ) {
    console.log('✅ SUCCESS! Found Aqsa in Dr. Ashraf queue:');
    console.log(JSON.stringify(aqsaQ, null, 2));
  } else {
    console.log('Queue items:', JSON.stringify(queues, null, 2));
  }
}

run().catch(console.error);
