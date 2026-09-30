import React from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export type AIOperationStage =
  | 'AI_READY'
  | 'REQUEST_RECEIVED'
  | 'PERMISSION_VERIFIED'
  | 'CONTEXT_LOADED'
  | 'PROCESSING'
  | 'RESPONSE_READY'
  | 'ERROR';

export interface AIOperationalPipelineProps {
  currentStage: AIOperationStage;
  requestId?: string | undefined;
  userRole?: string | undefined;
  tenantSlug?: string | undefined;
  errorMessage?: string | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
}

interface StageStepConfig {
  stage: AIOperationStage;
  label: string;
  stepNumber: number;
  icon: string;
  description: string;
}

const STAGES: StageStepConfig[] = [
  {
    stage: 'AI_READY',
    label: 'AI READY',
    stepNumber: 1,
    icon: '⚡',
    description: 'Models initialized & standby'
  },
  {
    stage: 'REQUEST_RECEIVED',
    label: 'REQUEST RECEIVED',
    stepNumber: 2,
    icon: '📥',
    description: 'Query ingested & sanitized'
  },
  {
    stage: 'PERMISSION_VERIFIED',
    label: 'PERMISSION VERIFIED',
    stepNumber: 3,
    icon: '🛡️',
    description: 'RBAC & Tenant isolation verified'
  },
  {
    stage: 'CONTEXT_LOADED',
    label: 'CONTEXT LOADED',
    stepNumber: 4,
    icon: '📁',
    description: 'PHI redacted clinical context bound'
  },
  {
    stage: 'PROCESSING',
    label: 'PROCESSING',
    stepNumber: 5,
    icon: '🧠',
    description: 'Clinical reasoning & synthesis'
  },
  {
    stage: 'RESPONSE_READY',
    label: 'RESPONSE READY',
    stepNumber: 6,
    icon: '✅',
    description: 'Output verified & ready for clinician'
  }
];

export const AIOperationalPipeline: React.FC<AIOperationalPipelineProps> = ({
  currentStage,
  requestId,
  userRole,
  tenantSlug,
  errorMessage,
  className = '',
  compact = false
}) => {
  const { prefersReducedMotion } = useEffectIntensity();

  const currentStageIndex = STAGES.findIndex((s) => s.stage === currentStage);
  const isError = currentStage === 'ERROR';

  if (compact) {
    const activeStep = STAGES[currentStageIndex] || {
      label: isError ? 'SUBSYSTEM ALERT' : currentStage,
      icon: isError ? '⚠️' : '⚡',
      description: errorMessage || 'Operational State'
    };

    return (
      <div
        className={`ds-ai-pipeline-compact ds-glass-subtle ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '9999px',
          border: isError ? '1px solid #EF4444' : '1px solid rgba(14, 165, 233, 0.3)',
          backgroundColor: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(14, 165, 233, 0.08)',
          fontSize: '0.75rem',
          fontFamily: 'monospace'
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isError ? '#EF4444' : currentStage === 'PROCESSING' ? '#0EA5E9' : '#10B981',
            boxShadow: isError
              ? '0 0 8px #EF4444'
              : currentStage === 'PROCESSING'
              ? '0 0 8px #0EA5E9'
              : '0 0 6px #10B981',
            animation: !prefersReducedMotion && currentStage === 'PROCESSING' ? 'ds-pulse-dot 1.2s infinite ease-in-out' : 'none'
          }}
        />
        <span style={{ fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
          {activeStep.icon} {activeStep.label}
        </span>
        {requestId && (
          <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.6875rem' }}>
            [{requestId.slice(0, 8)}]
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`ds-ai-pipeline-full ds-glass-panel ${className}`}
      style={{
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header telemetry line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--ds-color-text-muted)',
          borderBottom: '1px solid var(--ds-color-border-subtle)',
          paddingBottom: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--ds-color-primary)', fontWeight: 700 }}>AI OPERATIONAL PIPELINE</span>
          {requestId && <span>Trace: <code>{requestId}</code></span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {tenantSlug && <span>Tenant: <strong>{tenantSlug}</strong></span>}
          {userRole && <span>Role: <strong>{userRole}</strong></span>}
        </div>
      </div>

      {/* 6-Stage Visual Stepper */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px'
        }}
      >
        {STAGES.map((step, idx) => {
          const isPassed = !isError && currentStageIndex > idx;
          const isCurrent = !isError && currentStageIndex === idx;

          let borderColor = 'var(--ds-color-border)';
          let bgColor = 'var(--ds-color-surface-subtle)';
          let textColor = 'var(--ds-color-text-muted)';

          if (isPassed) {
            borderColor = '#10B981';
            bgColor = 'rgba(16, 185, 129, 0.1)';
            textColor = '#10B981';
          } else if (isCurrent) {
            borderColor = '#0EA5E9';
            bgColor = 'rgba(14, 165, 233, 0.15)';
            textColor = '#0EA5E9';
          } else if (isError) {
            borderColor = '#EF4444';
            bgColor = 'rgba(239, 68, 68, 0.1)';
            textColor = '#EF4444';
          }

          return (
            <div
              key={step.stage}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                backgroundColor: bgColor,
                transition: 'all 200ms ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem' }}>{step.icon}</span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: isPassed ? '#10B981' : isCurrent ? '#0EA5E9' : 'rgba(255, 255, 255, 0.1)',
                    color: isPassed || isCurrent ? '#FFFFFF' : 'var(--ds-color-text-muted)'
                  }}
                >
                  0{step.stepNumber}
                </span>
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: textColor }}>
                {step.label}
              </span>
              <span style={{ fontSize: '0.625rem', color: 'var(--ds-color-text-secondary)', lineHeight: 1.2 }}>
                {step.description}
              </span>
            </div>
          );
        })}
      </div>

      {isError && errorMessage && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          🚨 Pipeline Interrupted: {errorMessage}
        </div>
      )}
    </div>
  );
};
