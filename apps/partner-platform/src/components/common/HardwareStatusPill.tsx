import React, { useState, useEffect } from 'react';
import {
  hardwareStatusService,
  type HardwarePeripheralOverview
} from '../../services/hardware-status-service.js';
import { HardwareDiagnosticsDrawer } from '../dialogs/HardwareDiagnosticsDrawer.js';

export const HardwareStatusPill: React.FC = () => {
  const [status, setStatus] = useState<HardwarePeripheralOverview>(() => hardwareStatusService.getStatus());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDrawerTab, setSelectedDrawerTab] = useState<'BARCODE' | 'PRINTER' | 'ANALYZER'>('BARCODE');

  useEffect(() => {
    const unsubStatus = hardwareStatusService.subscribe(setStatus);
    const unsubDrawer = hardwareStatusService.subscribeDrawer(setIsDrawerOpen);
    return () => {
      unsubStatus();
      unsubDrawer();
    };
  }, []);

  const openDrawerWithTab = (tab: 'BARCODE' | 'PRINTER' | 'ANALYZER') => {
    setSelectedDrawerTab(tab);
    hardwareStatusService.openDrawer();
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'READY':
      case 'ONLINE':
      case 'SYNCED':
        return '#10B981';
      case 'SCANNING':
      case 'PRINTING':
      case 'RECEIVING':
        return '#38BDF8';
      default:
        return '#EF4444';
    }
  };

  return (
    <>
      {/* Floating Hardware Capsule Dock */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 8999,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: 'rgba(15, 23, 42, 0.90)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '100px',
          boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.1)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          userSelect: 'none',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Label / Launcher Button */}
        <button
          type="button"
          onClick={() => openDrawerWithTab('BARCODE')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '100px',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            color: '#E2E8F0',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
          title="Hardware Peripherals & Diagnostics (Alt + H)"
        >
          <span>🔌</span>
          <span style={{ color: '#94A3B8' }}>Hardware:</span>
          <kbd
            style={{
              fontSize: '0.6rem',
              padding: '1px 4px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#94A3B8'
            }}
          >
            Alt+H
          </kbd>
        </button>

        {/* 1. Barcode Gun Chip */}
        <button
          type="button"
          onClick={() => openDrawerWithTab('BARCODE')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '100px',
            border: 'none',
            backgroundColor:
              status.barcodeGun.status === 'SCANNING'
                ? 'rgba(56, 189, 248, 0.2)'
                : 'rgba(255, 255, 255, 0.04)',
            color: '#F1F5F9',
            fontSize: '0.72rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              status.barcodeGun.status === 'SCANNING' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)')
          }
          title={`Barcode Scanner: ${status.barcodeGun.model} • Status: ${status.barcodeGun.status}`}
        >
          <span>🔫</span>
          <span style={{ fontWeight: 600 }}>Barcode Gun:</span>
          <span style={{ color: getStatusColor(status.barcodeGun.status), fontWeight: 700 }}>
            {status.barcodeGun.status === 'READY' ? 'Ready' : status.barcodeGun.status}
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(status.barcodeGun.status),
              boxShadow: `0 0 8px ${getStatusColor(status.barcodeGun.status)}`
            }}
          />
        </button>

        {/* 2. Thermal Printer Chip */}
        <button
          type="button"
          onClick={() => openDrawerWithTab('PRINTER')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '100px',
            border: 'none',
            backgroundColor:
              status.thermalPrinter.status === 'PRINTING'
                ? 'rgba(56, 189, 248, 0.2)'
                : 'rgba(255, 255, 255, 0.04)',
            color: '#F1F5F9',
            fontSize: '0.72rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              status.thermalPrinter.status === 'PRINTING'
                ? 'rgba(56, 189, 248, 0.2)'
                : 'rgba(255, 255, 255, 0.04)')
          }
          title={`Thermal Printer: ${status.thermalPrinter.model} • Status: ${status.thermalPrinter.status}`}
        >
          <span>🖨️</span>
          <span style={{ fontWeight: 600 }}>TVS 80mm:</span>
          <span style={{ color: getStatusColor(status.thermalPrinter.status), fontWeight: 700 }}>
            {status.thermalPrinter.status === 'ONLINE' ? 'Online' : status.thermalPrinter.status}
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(status.thermalPrinter.status),
              boxShadow: `0 0 8px ${getStatusColor(status.thermalPrinter.status)}`
            }}
          />
        </button>

        {/* 3. ASTM Analyzer Chip */}
        <button
          type="button"
          onClick={() => openDrawerWithTab('ANALYZER')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '100px',
            border: 'none',
            backgroundColor:
              status.astmAnalyzer.status === 'RECEIVING'
                ? 'rgba(167, 139, 250, 0.2)'
                : 'rgba(255, 255, 255, 0.04)',
            color: '#F1F5F9',
            fontSize: '0.72rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              status.astmAnalyzer.status === 'RECEIVING'
                ? 'rgba(167, 139, 250, 0.2)'
                : 'rgba(255, 255, 255, 0.04)')
          }
          title={`Laboratory Analyzer: ${status.astmAnalyzer.model} • Protocol: ${status.astmAnalyzer.protocol}`}
        >
          <span>🧪</span>
          <span style={{ fontWeight: 600 }}>Mindray:</span>
          <span style={{ color: getStatusColor(status.astmAnalyzer.status), fontWeight: 700 }}>
            {status.astmAnalyzer.status === 'SYNCED' ? 'Synced' : status.astmAnalyzer.status}
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(status.astmAnalyzer.status),
              boxShadow: `0 0 8px ${getStatusColor(status.astmAnalyzer.status)}`
            }}
          />
        </button>
      </div>

      {/* Slide-Over Diagnostics Drawer */}
      <HardwareDiagnosticsDrawer
        isOpen={isDrawerOpen}
        onClose={() => hardwareStatusService.closeDrawer()}
        defaultTab={selectedDrawerTab}
      />
    </>
  );
};
