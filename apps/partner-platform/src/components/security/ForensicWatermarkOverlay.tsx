import React, { useMemo } from 'react';

export interface ForensicWatermarkProps {
  staffName?: string;
  staffEmployeeCode?: string;
  terminalIp?: string;
  traceId?: string;
  enabled?: boolean;
}

export const ForensicWatermarkOverlay: React.FC<ForensicWatermarkProps> = ({
  staffName = 'Authorized Healthcare Staff',
  staffEmployeeCode = 'EMP-AUTH',
  terminalIp = '127.0.0.1',
  traceId = 'TRC-DOCSEARCH-SECURE',
  enabled = true
}) => {
  const currentTimestamp = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const watermarkString = useMemo(() => {
    return `DOC SEARCH HEALTHCARE • ${staffName} (${staffEmployeeCode}) • IP: ${terminalIp} • ${currentTimestamp} • ${traceId} • AUDITED PHI ACCESS`;
  }, [staffName, staffEmployeeCode, terminalIp, currentTimestamp, traceId]);

  if (!enabled) return null;

  return (
    <>
      {/* Dynamic Screen Forensic Watermark Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 40,
          pointerEvents: 'none',
          overflow: 'hidden',
          userSelect: 'none',
          opacity: 0.058,
          mixBlendMode: 'difference'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '80px 60px',
            width: '160vw',
            height: '160vh',
            transform: 'rotate(-24deg) translate(-20vw, -20vh)',
            transformOrigin: 'top left',
            pointerEvents: 'none'
          }}
        >
          {Array.from({ length: 54 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 900,
                color: '#64748B',
                whiteSpace: 'nowrap',
                letterSpacing: '1px',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {watermarkString}
            </div>
          ))}
        </div>
      </div>

      {/* Print & PDF Spooler Multi-Tier Forensic Injection */}
      <style>{`
        @media print {
          body::before {
            content: "${watermarkString} \\A ${watermarkString} \\A ${watermarkString}";
            white-space: pre-wrap;
            position: fixed;
            top: 25%;
            left: 2%;
            width: 96%;
            text-align: center;
            line-height: 4.5rem;
            font-size: 13pt;
            font-weight: 900;
            font-family: monospace;
            color: rgba(100, 116, 139, 0.16);
            transform: rotate(-30deg);
            pointer-events: none;
            z-index: 999999;
          }
          body::after {
            content: "LEGAL PHI NOTICE: This printed document is dynamically forensically traced to Staff: ${staffName} (${staffEmployeeCode}) | IP: ${terminalIp} | Session: ${currentTimestamp} | Audit Trace: ${traceId}. Unauthorized photography or duplication is punishable under Section 33 DPDP Act 2023 & NMC Regulations.";
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 7pt;
            font-family: monospace;
            text-align: center;
            background: #f1f5f9;
            color: #475569;
            padding: 3px 6px;
            border-top: 1px solid #cbd5e1;
            z-index: 999999;
          }
        }
      `}</style>
    </>
  );
};
