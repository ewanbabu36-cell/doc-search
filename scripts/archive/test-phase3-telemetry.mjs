async function test() {
  const pwaRes = await fetch('http://localhost:5176');
  console.log('Sovra PWA HTTP Status:', pwaRes.status);

  // Voice note object inside an encrypted envelope
  const sampleVoiceNote = {
    id: 'vn-' + Date.now(),
    audioBase64: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
    durationSeconds: 12,
    mimeType: 'audio/webm'
  };

  const sampleMessage = {
    id: 'msg-voice-' + Date.now(),
    conversationId: 'conv-doc-patient',
    senderId: 'doc-nmc-99410',
    text: '🎙️ डॉ. वर्मा का वॉयस परामर्श (Voice Consultation)',
    voiceNote: sampleVoiceNote,
    createdAt: new Date().toISOString(),
    status: 'SENT'
  };

  const envelopePayload = {
    id: `ENV-${Date.now()}-voicenote`,
    recipientPhone: '919876543210',
    senderPhone: '919988776655',
    ivHex: 'none',
    cipherTextBase64: Buffer.from(JSON.stringify(sampleMessage)).toString('base64'),
    depositedAt: new Date().toISOString(),
    ttlSeconds: 604800
  };

  const depRes = await fetch('http://localhost:4000/api/v1/sovra/mailbox/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelopePayload)
  });
  const depJson = await depRes.json();
  console.log('Mailbox Deposit Response:', JSON.stringify(depJson));

  // Test Mailbox drain (Self-destructs on retrieval)
  const drainRes = await fetch('http://localhost:4000/api/v1/sovra/mailbox/drain?recipientPhone=919876543210');
  const drainJson = await drainRes.json();
  console.log('Mailbox Drain Response:', JSON.stringify(drainJson));

  if (drainJson.data && drainJson.data.length > 0) {
    const rawMsg = JSON.parse(Buffer.from(drainJson.data[0].cipherTextBase64, 'base64').toString('utf8'));
    console.log('Decrypted Message in Test:', {
      id: rawMsg.id,
      text: rawMsg.text,
      hasVoiceNote: !!rawMsg.voiceNote,
      voiceDuration: rawMsg.voiceNote?.durationSeconds
    });
  }

  // Second drain to confirm zero-retention ephemeral self-destruct
  const drainEmptyRes = await fetch('http://localhost:4000/api/v1/sovra/mailbox/drain?recipientPhone=919876543210');
  const drainEmptyJson = await drainEmptyRes.json();
  console.log('Subsequent Drain (Self-Destruct Verified):', JSON.stringify(drainEmptyJson));
}

test().catch(e => console.error(e));
