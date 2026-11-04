import React, { useEffect } from 'react';

export interface ZeroMouseHotkeysCallbacks {
  onNewPatient?: (() => void) | undefined;
  onCallNextToken?: (() => void) | undefined;
  onQuickBill?: (() => void) | undefined;
  onOpenVitals?: (() => void) | undefined;
  onEmergencyBedAdmit?: (() => void) | undefined;
  onPrintThermalSlip?: (() => void) | undefined;
  onTogglePiP?: (() => void) | undefined;
}

export interface ZeroMouseClinicalHotkeysProps extends ZeroMouseHotkeysCallbacks {
  showFloatingBar?: boolean | undefined;
}

export const ZeroMouseClinicalHotkeys: React.FC<ZeroMouseClinicalHotkeysProps> = ({
  onNewPatient,
  onCallNextToken,
  onQuickBill,
  onOpenVitals,
  onEmergencyBedAdmit,
  onPrintThermalSlip,
  onTogglePiP,
  showFloatingBar = true
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is actively typing inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // F2: New Patient Intake
      if (e.key === 'F2') {
        e.preventDefault();
        if (onNewPatient) onNewPatient();
        return;
      }

      // F3: Call Next Token
      if (e.key === 'F3') {
        e.preventDefault();
        if (onCallNextToken) onCallNextToken();
        return;
      }

      // F4: Quick Billing & UPI QR
      if (e.key === 'F4') {
        e.preventDefault();
        if (onQuickBill) onQuickBill();
        return;
      }

      // F8: Bedside Vitals Input
      if (e.key === 'F8') {
        e.preventDefault();
        if (onOpenVitals) onOpenVitals();
        return;
      }

      // F9: Emergency Bed Admit
      if (e.key === 'F9') {
        e.preventDefault();
        if (onEmergencyBedAdmit) onEmergencyBedAdmit();
        return;
      }

      // Ctrl+P / Cmd+P: Thermal Slip Print (only if in clinical view)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        if (!isInput && onPrintThermalSlip) {
          e.preventDefault();
          onPrintThermalSlip();
          return;
        }
      }

      // Escape: Minimize to PiP tray if not inside input
      if (e.key === 'Escape' && !isInput && onTogglePiP) {
        e.preventDefault();
        onTogglePiP();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onNewPatient,
    onCallNextToken,
    onQuickBill,
    onOpenVitals,
    onEmergencyBedAdmit,
    onPrintThermalSlip,
    onTogglePiP
  ]);

  if (!showFloatingBar) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        backgroundColor: '#090D16',
        border: '1px solid #1E293B',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        borderRadius: '30px',
        padding: '4px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backdropFilter: 'blur(10px)',
        fontSize: '0.72rem',
        color: '#94A3B8'
      }}
    >
      <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 900, marginRight: '4px' }}>
        ⚡ ZERO-MOUSE:
      </span>

      {/* F2 Button */}
      <button
        type="button"
        onClick={onNewPatient}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#F8FAFC',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}
      >
        <kbd style={{ backgroundColor: '#1E293B', color: '#38BDF8', padding: '1px 5px', borderRadius: '3px', fontWeight: 900 }}>F2</kbd>
        <span>New Patient</span>
      </button>

      <span style={{ color: '#334155' }}>|</span>

      {/* F3 Button */}
      <button
        type="button"
        onClick={onCallNextToken}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#F8FAFC',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}
      >
        <kbd style={{ backgroundColor: '#1E293B', color: '#34D399', padding: '1px 5px', borderRadius: '3px', fontWeight: 900 }}>F3</kbd>
        <span>Call Token</span>
      </button>

      <span style={{ color: '#334155' }}>|</span>

      {/* F4 Button */}
      <button
        type="button"
        onClick={onQuickBill}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#F8FAFC',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}
      >
        <kbd style={{ backgroundColor: '#1E293B', color: '#FCD34D', padding: '1px 5px', borderRadius: '3px', fontWeight: 900 }}>F4</kbd>
        <span>Quick Bill</span>
      </button>

      <span style={{ color: '#334155' }}>|</span>

      {/* F8 Button */}
      <button
        type="button"
        onClick={onOpenVitals}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#F8FAFC',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}
      >
        <kbd style={{ backgroundColor: '#1E293B', color: '#6EE7B7', padding: '1px 5px', borderRadius: '3px', fontWeight: 900 }}>F8</kbd>
        <span>Vitals</span>
      </button>

      <span style={{ color: '#334155' }}>|</span>

      {/* F9 Button */}
      <button
        type="button"
        onClick={onEmergencyBedAdmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#F8FAFC',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}
      >
        <kbd style={{ backgroundColor: '#1E293B', color: '#F87171', padding: '1px 5px', borderRadius: '3px', fontWeight: 900 }}>F9</kbd>
        <span>Bed Admit</span>
      </button>

      <span style={{ color: '#334155' }}>|</span>

      {/* Ctrl+P Print */}
      <button
        type="button"
        onClick={onPrintThermalSlip}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#F8FAFC',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}
      >
        <kbd style={{ backgroundColor: '#1E293B', color: '#38BDF8', padding: '1px 5px', borderRadius: '3px', fontWeight: 900 }}>Ctrl+P</kbd>
        <span>Print 80mm</span>
      </button>
    </div>
  );
};
