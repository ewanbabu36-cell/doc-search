import assert from 'node:assert';
import { partnerFoundationService } from '../apps/partner-platform/dist/services/partner-foundation-service.js';
import { hospitalEventBus } from '../apps/partner-platform/dist/services/hospital-event-bus.js';

console.log('🧪 Starting Partner Mutual Handshake Protocol Verification...');

// 1. Check initial incoming invitations
const pharmacyInvites = partnerFoundationService.getIncomingClinicInvitations('PHARMACY');
assert(Array.isArray(pharmacyInvites), 'Pharmacy invitations should be an array');
assert(pharmacyInvites.length > 0, 'Should have at least 1 default invitation');
const sharmaInvite = pharmacyInvites[0];
assert.strictEqual(sharmaInvite.clinicCode, 'CLINIC-SHARMA-2026', 'Default invite should be CLINIC-SHARMA-2026');
console.log('  ✓ Verified default incoming invitation: Dr. Sharma Clinic (CLINIC-SHARMA-2026)');

// 2. Track Event Bus for Handshake
let receivedEvent = null;
const unsub = hospitalEventBus.subscribe('PARTNER_INVITATION_ACCEPTED', (payload) => {
  receivedEvent = payload;
});

// 3. Accept Pharmacy Invitation
const acceptRes = partnerFoundationService.acceptClinicInvitation(sharmaInvite.invitationId, 'PHARMACY', {
  partnerId: 'pharm-partner-01',
  partnerName: 'City Medicos & Chemist POS',
  partnerCode: 'PHARM-CITY-MED-01'
});
assert(acceptRes.success, 'Accept invitation should succeed');
assert(receivedEvent !== null, 'hospitalEventBus should have received PARTNER_INVITATION_ACCEPTED');
assert.strictEqual(receivedEvent.data.clinicId, 'clinic-sharma', 'Event payload should contain clinic-sharma');
console.log('  ✓ Verified 1-Click Accept for Pharmacy & EventBus publication');

// 4. Verify Linked Clinics
const linkedPharms = partnerFoundationService.getLinkedClinics('PHARMACY');
assert(linkedPharms.length > 0, 'Should have at least 1 linked clinic');
assert.strictEqual(linkedPharms[0].status, 'ACCEPTED', 'Status should be ACCEPTED');
console.log('  ✓ Verified getLinkedClinics reflects active link');

// 5. Test Manual Code Link for Pathology
const manualLabRes = partnerFoundationService.acceptClinicInvitation('CLINIC-SHARMA-2026', 'PATHOLOGY', {
  partnerId: 'lab-partner-01',
  partnerName: 'Shree Ram Diagnostics & Pathology',
  partnerCode: 'LAB-SHREE-RAM-01'
});
assert(manualLabRes.success, 'Manual code pairing should succeed');
const linkedLabs = partnerFoundationService.getLinkedClinics('PATHOLOGY');
assert(linkedLabs.length > 0, 'Pathology should now have linked clinics');
console.log('  ✓ Verified Manual Code Pairing for Pathology (CLINIC-SHARMA-2026)');

// 6. Test Pause / Resume Toggle
const pauseRes = partnerFoundationService.togglePartnerConnectionStatus('clinic-sharma', 'PHARMACY', true);
assert(pauseRes === true, 'togglePartnerConnectionStatus should return true');
const pausedList = partnerFoundationService.getIncomingClinicInvitations('PHARMACY');
const target = pausedList.find((i) => i.clinicId === 'clinic-sharma');
assert.strictEqual(target?.isPaused, true, 'Clinic should now be paused');
console.log('  ✓ Verified Pause / Resume Toggle');

unsub();
console.log('🎉 All Partner Mutual Handshake Protocol Verifications Passed Cleanly!');
