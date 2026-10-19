// Sovra Health Vault Backup & Restore Modal

import React, { useState } from 'react';
import { vaultBackupService, VaultBackupSnapshot } from '../services/gdrive-vault-backup.js';

interface VaultBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
}

export const VaultBackupModal: React.FC<VaultBackupModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess
}) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsProcessing(true);
    setStatusMessage('Generating encrypted health snapshot...');
    try {
      const fileName = await vaultBackupService.exportLocalFile();
      setStatusMessage(`✔ Vault exported successfully to "${fileName}". You can upload it to Google Drive or iCloud.`);
    } catch (err: any) {
      setStatusMessage(`❌ Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage('Reading backup snapshot...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const snapshot: VaultBackupSnapshot = JSON.parse(text);
        const res = await vaultBackupService.restoreFromSnapshot(snapshot);
        setStatusMessage(`🎉 Successfully restored ${res.restoredConvs} conversations and ${res.restoredMsgs} clinical messages!`);
        if (onRestoreSuccess) {
          setTimeout(onRestoreSuccess, 1500);
        }
      } catch (err: any) {
        setStatusMessage(`❌ Restore failed: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <h3 style={{ margin: 0, color: '#5EEAD4', fontSize: '16px' }}>Health Vault Cloud Backup</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, marginBottom: '16px' }}>
          Sovra stores your prescriptions and records locally in your browser for 100% privacy and zero server costs.
          Create an encrypted backup to easily switch phones or protect against browser history clears.
        </p>

        {statusMessage && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
              background: statusMessage.startsWith('❌') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: statusMessage.startsWith('❌') ? '#F87171' : '#34D399',
              border: `1px solid ${statusMessage.startsWith('❌') ? '#EF4444' : '#10B981'}`
            }}
          >
            {statusMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Export / Sync Button */}
          <button
            onClick={handleExport}
            disabled={isProcessing}
            style={{
              background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
              color: 'white',
              border: '1px solid #14B8A6',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isProcessing ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)'
            }}
          >
            <span>☁️ Backup Health Vault (Google Drive / Device)</span>
          </button>

          {/* Import / Restore Button */}
          <label
            style={{
              background: '#1F2937',
              color: '#E2E8F0',
              border: '1px solid #374151',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center'
            }}
          >
            <span>📥 Restore Vault from File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={isProcessing}
            />
          </label>
        </div>

        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #374151', fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
          <span>Storage Cost: <strong>₹0.00 / Lifetime</strong></span>
          <span>Encryption: <strong>AES-256 Client-Side</strong></span>
        </div>
      </div>
    </div>
  );
};
