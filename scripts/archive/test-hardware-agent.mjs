import http from 'node:http';

const testPost = (path, body) =>
  new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 18080,
        path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(b));
          } catch {
            resolve({ raw: b });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });

const [escpos, zpl, analyzer, biometric] = await Promise.all([
  testPost('/api/v1/hardware/print/escpos', {
    slipData: { tokenNumber: 'A-102', patientName: 'Amit Verma', mrn: 'MRN-9021', doctorName: 'Dr. S. K. Mehta', fee: 500 }
  }),
  testPost('/api/v1/hardware/print/zpl', {
    labelType: 'WRISTBAND',
    data: { patientName: 'Suman Gupta', mrn: 'MRN-IPD-8820', wardName: 'Female Ward', bedCode: '04', bloodGroup: 'B+' }
  }),
  testPost('/api/v1/hardware/analyzer/simulate-feed', {
    analyzerModel: 'Sysmex XN-550',
    orderId: 'ORD-7719',
    simulatePanic: true
  }),
  testPost('/api/v1/hardware/biometric/capture', {})
]);

console.log('--- DOCSEARCH HARDWARE AGENT TEST RESULTS ---');
console.log('1. ESC/POS Thermal Slip     : SUCCESS =', escpos.success, '| JobId =', escpos.jobId);
console.log('2. ZPL Wristband & Barcode  : SUCCESS =', zpl.success, '| JobId =', zpl.jobId);
console.log('3. ASTM E1381 Analyzer Feed : SUCCESS =', analyzer.success, '| Analytes =', analyzer.packet?.analytes?.length, '| Panic =', analyzer.packet?.hasPanic);
console.log('4. UIDAI Biometric Capture  : SUCCESS =', biometric.success, '| Quality =', biometric.qualityScore + '%', '| Source =', biometric.deviceSource);
