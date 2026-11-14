import { NhaAbdmClient } from '../apps/api-gateway/dist/services/partner/NhaAbdmClient.js';
import { MetaWhatsAppClient } from '../apps/api-gateway/dist/services/partner/MetaWhatsAppClient.js';

async function main() {
  console.log('--- Testing NhaAbdmClient ---');
  const nha = new NhaAbdmClient();
  console.log('NHA isConfigured:', nha.isConfigured());
  const nhaHealth = await nha.checkGatewayHealth();
  console.log('NHA Health Mode:', nhaHealth.mode);
  console.log('NHA Configured:', nhaHealth.configured);

  console.log('\n--- Testing MetaWhatsAppClient ---');
  const wa = new MetaWhatsAppClient();
  console.log('WA isConfigured:', wa.isConfigured());
  const waStatus = wa.getGatewayStatus();
  console.log('WA Status Mode:', waStatus.mode);
  console.log('WA Configured:', waStatus.configured);

  const sendResult = await wa.sendTextMessage('9876543210', 'Test message from DocSearch verification engine');
  console.log('WA Send Fallback:', sendResult.success, 'Mode:', sendResult.mode, 'MsgId:', sendResult.messageId);
}

main().catch(err => {
  console.error('GATEWAY VERIFICATION ERROR:', err);
  process.exit(1);
});
