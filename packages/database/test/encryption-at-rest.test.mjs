import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('Host Storage Encryption at Rest & Cryptographic Vault Verification Gate', () => {
  const keyPath = path.resolve('backups/keys/master_dr.key');
  const vaultDir = path.resolve('backups/encrypted_vault');

  test('1. Master encryption key exists with exactly 256 bits (32 bytes) of cryptographic entropy', () => {
    assert.ok(fs.existsSync(keyPath), `Master key must exist at ${keyPath}`);
    const hexKey = fs.readFileSync(keyPath, 'utf-8').trim();
    assert.strictEqual(hexKey.length, 64, 'Master key hex string must be exactly 64 characters (256 bits)');
    
    const keyBytes = Buffer.from(hexKey, 'hex');
    assert.strictEqual(keyBytes.length, 32, 'Master key binary buffer must be exactly 32 bytes (256 bits)');
    
    // Ensure key is not all zeros or trivial pattern
    const isTrivial = keyBytes.every(b => b === 0) || keyBytes.every(b => b === 255);
    assert.strictEqual(isTrivial, false, 'Master key must have high entropy and not be trivial');
  });

  test('2. Encrypted vault directory exists and contains valid AES-256-GCM backup artifacts', () => {
    assert.ok(fs.existsSync(vaultDir), `Vault directory must exist at ${vaultDir}`);
    const files = fs.readdirSync(vaultDir).filter(f => f.endsWith('.enc.json'));
    assert.ok(files.length > 0, 'Encrypted vault must contain at least one backup artifact');

    const latestFile = files[files.length - 1];
    const raw = fs.readFileSync(path.join(vaultDir, latestFile), 'utf-8');
    const artifact = JSON.parse(raw);

    assert.ok(artifact.header, 'Artifact must contain header');
    assert.strictEqual(artifact.header.algorithm, 'AES-256-GCM', 'Encryption algorithm must be AES-256-GCM');
    assert.ok(artifact.header.iv, 'Artifact must include initialization vector (IV)');
    assert.ok(artifact.header.authTag, 'Artifact must include GCM authentication tag');
    assert.ok(artifact.header.sha256Checksum, 'Artifact must include plaintext SHA-256 integrity hash');
    assert.ok(artifact.ciphertext, 'Artifact must include ciphertext');
    assert.ok(artifact.header.totalRows > 0, 'Total rows in backup must be greater than 0');
  });

  test('3. Authenticated decryption fails if ciphertext is tampered with', () => {
    const hexKey = fs.readFileSync(keyPath, 'utf-8').trim();
    const key = Buffer.from(hexKey, 'hex');
    const files = fs.readdirSync(vaultDir).filter(f => f.endsWith('.enc.json'));
    const raw = fs.readFileSync(path.join(vaultDir, files[0]), 'utf-8');
    const artifact = JSON.parse(raw);

    // Tamper with ciphertext by flipping one hex character
    const tamperedHex = artifact.ciphertext.slice(0, 10) + (artifact.ciphertext[10] === 'a' ? 'b' : 'a') + artifact.ciphertext.slice(11);

    let threw = false;
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(artifact.header.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(artifact.header.authTag, 'hex'));
      decipher.update(Buffer.from(tamperedHex, 'hex'));
      decipher.final();
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('Unsupported state') || err.message.includes('auth') || err.message.includes('tag'), `Expected tag verification failure: ${err.message}`);
    }

    assert.strictEqual(threw, true, 'Tampered ciphertext must cause authenticated decryption failure');
  });

  test('4. Authenticated decryption fails if authentication tag is tampered with', () => {
    const hexKey = fs.readFileSync(keyPath, 'utf-8').trim();
    const key = Buffer.from(hexKey, 'hex');
    const files = fs.readdirSync(vaultDir).filter(f => f.endsWith('.enc.json'));
    const raw = fs.readFileSync(path.join(vaultDir, files[0]), 'utf-8');
    const artifact = JSON.parse(raw);

    // Tamper with authTag
    const tamperedTag = (artifact.header.authTag[0] === '0' ? '1' : '0') + artifact.header.authTag.slice(1);

    let threw = false;
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(artifact.header.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(tamperedTag, 'hex'));
      decipher.update(Buffer.from(artifact.ciphertext, 'hex'));
      decipher.final();
    } catch (err) {
      threw = true;
    }

    assert.strictEqual(threw, true, 'Tampered authentication tag must cause decryption failure');
  });
});
