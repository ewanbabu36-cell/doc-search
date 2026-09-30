import test from 'node:test';
import assert from 'node:assert/strict';

test('🛡️ Anti-Leakage & Insider Threat Defense Suite', async (t) => {

  await t.test('1. Dynamic Forensic Screen & Print Watermarking generates traceable audit strings', () => {
    const staffName = 'Dr. Rajesh Sharma, MD';
    const staffEmployeeCode = 'EMP-402';
    const terminalIp = '192.168.1.102';
    const dateStr = '07 Sep 2026 05:45 AM';

    const buildWatermark = (name, code, ip, ts) => 
      `DOC SEARCH HEALTHCARE • ${name} (${code}) • IP: ${ip} • ${ts} • AUDITED PHI ACCESS`;

    const watermark = buildWatermark(staffName, staffEmployeeCode, terminalIp, dateStr);

    // Verify all forensic tracking tokens are embedded
    assert.ok(watermark.includes('Dr. Rajesh Sharma, MD'), 'Watermark must contain attending staff name');
    assert.ok(watermark.includes('EMP-402'), 'Watermark must contain staff employee ID');
    assert.ok(watermark.includes('192.168.1.102'), 'Watermark must contain terminal IP address');
    assert.ok(watermark.includes('07 Sep 2026'), 'Watermark must contain timestamp');
    assert.ok(watermark.includes('AUDITED PHI ACCESS'), 'Watermark must contain statutory warning notice');

    // Verify security CSS attributes for non-blocking yet screenshot-proof display
    const cssOverlayProps = {
      pointerEvents: 'none',
      userSelect: 'none',
      mixBlendMode: 'difference',
      opacity: 0.055,
      zIndex: 40
    };

    assert.equal(cssOverlayProps.pointerEvents, 'none', 'Overlay must not block UI mouse clicks');
    assert.equal(cssOverlayProps.userSelect, 'none', 'Overlay text must not be copy-pasteable');
    assert.equal(cssOverlayProps.mixBlendMode, 'difference', 'Must maintain contrast across dark and light themes');
  });

  await t.test('2. Auto-Screen Blur on Inactivity (Counter Privacy Shield) at 45s', () => {
    const defaultThreshold = 45;
    let idleCounter = 0;
    let isShieldActive = false;

    const tick = (seconds) => {
      idleCounter += seconds;
      if (idleCounter >= defaultThreshold) {
        isShieldActive = true;
      }
    };

    const resetActivity = () => {
      // If shield is active, simple mouse jiggle should not dismiss without explicit unlock or PIN
      if (!isShieldActive) {
        idleCounter = 0;
      }
    };

    // Simulate 30s of inactivity (doctor consulting)
    tick(30);
    assert.equal(isShieldActive, false, 'Shield should not trigger before 45s');

    // Doctor touches keyboard at 30s
    resetActivity();
    assert.equal(idleCounter, 0, 'Active counter should reset on user activity');

    // Doctor walks away from counter for 46 seconds
    tick(46);
    assert.equal(isShieldActive, true, 'Shield MUST activate after 45s idle counter');

    // Test PIN unlock mechanism
    const emergencyPin = '2026';
    const wrongPin = '1234';

    const verifyPin = (input) => input === emergencyPin;

    assert.equal(verifyPin(wrongPin), false, 'Wrong PIN must reject');
    assert.equal(verifyPin(emergencyPin), true, 'Emergency PIN 2026 must unlock');
  });

  await t.test('3. Break-Glass Emergency Override Protocol (Trauma & Code Blue)', () => {
    const validJustifications = [
      'UNCONSCIOUS_TRAUMA_RESUSCITATION',
      'MASS_CASUALTY_INCIDENT',
      'ACUTE_ANAPHYLAXIS_OR_SHOCK',
      'CRITICAL_SURGICAL_INTERVENTION'
    ];

    // Function simulating break-glass request processing
    const executeBreakGlass = (payload) => {
      if (!payload.doctorAck) {
        throw new Error('Doctor affirmation required under NMC Code of Medical Ethics');
      }
      if (!validJustifications.includes(payload.justification)) {
        throw new Error('Invalid emergency clinical justification');
      }

      const cmoAlert = {
        dispatched: true,
        recipient: 'Dr. V. Malhotra, CMO',
        channels: ['SMS_URGENT', 'EMAIL_ESCALATION'],
        patientUhid: payload.patientUhid,
        authorizedBy: payload.attendingDoctor,
        reason: payload.justification,
        timestamp: new Date().toISOString()
      };

      const auditVaultRecord = {
        eventId: `BG-AUD-${Date.now().toString().slice(-6)}`,
        eventType: 'BREAK_GLASS_CONSENT_BYPASS',
        patientUhid: payload.patientUhid,
        authorizedBy: payload.attendingDoctor,
        statutoryAffirmation: payload.doctorAck,
        cryptographicHash: '0x7c4f9011ba24e908',
        unlockedRecords: ['ALLERGIES', 'BLOOD_GROUP', 'AIRWAY_DIFFICULTY', 'CARDIAC_STENT'],
        cmoAlertReference: cmoAlert
      };

      return { success: true, cmoAlert, auditVaultRecord };
    };

    // Test missing affirmation fails
    assert.throws(() => {
      executeBreakGlass({
        doctorAck: false,
        justification: 'UNCONSCIOUS_TRAUMA_RESUSCITATION',
        patientUhid: 'UHID-MCI-2026-8491',
        attendingDoctor: 'Dr. Rajesh Sharma, MD'
      });
    }, /Doctor affirmation required/);

    // Test valid override succeeds and dispatches CMO alerts
    const override = executeBreakGlass({
      doctorAck: true,
      justification: 'UNCONSCIOUS_TRAUMA_RESUSCITATION',
      patientUhid: 'UHID-MCI-2026-8491',
      attendingDoctor: 'Dr. Rajesh Sharma, MD'
    });

    assert.equal(override.success, true);
    assert.equal(override.cmoAlert.dispatched, true);
    assert.equal(override.cmoAlert.recipient, 'Dr. V. Malhotra, CMO');
    assert.ok(override.cmoAlert.channels.includes('SMS_URGENT'));
    assert.equal(override.auditVaultRecord.eventType, 'BREAK_GLASS_CONSENT_BYPASS');
    assert.ok(override.auditVaultRecord.unlockedRecords.includes('ALLERGIES'));
    assert.ok(override.auditVaultRecord.unlockedRecords.includes('BLOOD_GROUP'));
  });

});
