import React, { useState } from 'react';
import { type ActivePatientTab, type SlideOverTrayType } from './health-os-types.js';
import './health-os.css';

export interface PersistentPatientStoryboardProps {
  patient: ActivePatientTab | null;
  onOpenTray?: (tray: SlideOverTrayType) => void;
}

export const PersistentPatientStoryboard: React.FC<PersistentPatientStoryboardProps> = ({
  patient,
  onOpenTray,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (!patient) {
    return (
      <aside className={`hos-storyboard ${isCollapsed ? 'hos-storyboard-collapsed' : ''}`}>
        <div className="hos-storyboard-empty">
          <span style={{ fontSize: '1.75rem' }}>🩺</span>
          {!isCollapsed && (
            <>
              <span className="hos-sb-empty-title">No Patient Selected</span>
              <span className="hos-sb-empty-desc">
                Select an encounter tab or press <code>Ctrl+K</code> to load patient chart.
              </span>
            </>
          )}
        </div>
      </aside>
    );
  }

  const news2 = patient.vitals?.news2Score ?? patient.vitals?.news2 ?? 0;
  const isHighAcuity = news2 >= 5 || patient.acuity === 'EMERGENCY';
  const isModerateAcuity = (news2 >= 3 && news2 < 5) || patient.acuity === 'URGENT';

  const news2Color = isHighAcuity ? '#ef4444' : isModerateAcuity ? '#f59e0b' : '#10b981';
  const news2Label = isHighAcuity ? 'High Clinical Risk' : isModerateAcuity ? 'Medium Alert' : 'Low Risk';

  return (
    <aside className={`hos-storyboard ${isCollapsed ? 'hos-storyboard-collapsed' : ''}`} aria-label="Patient Storyboard">
      {/* 1. Header with Collapse Toggle & Photo */}
      <div className="hos-sb-header">
        <div className="hos-sb-patient-avatar">
          {patient.gender === 'FEMALE' ? '👩' : '👨'}
        </div>

        {!isCollapsed && (
          <div className="hos-sb-patient-identity">
            <h3 className="hos-sb-patient-name" title={patient.patientName}>
              {patient.patientName}
            </h3>
            <div className="hos-sb-patient-sub">
              <span>{patient.ageGender || `${patient.age || '32'}y / ${patient.gender || 'M'}`}</span>
              <span className="hos-sb-dot">•</span>
              <span className="hos-sb-mrn">{patient.mrn}</span>
            </div>
            {patient.abhaId && (
              <div className="hos-sb-abha-badge" title={`ABDM ABHA Number: ${patient.abhaId}`}>
                <span style={{ color: '#10b981' }}>✔</span>
                <span>ABHA Verified</span>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="hos-sb-toggle-btn"
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? 'Expand Patient Storyboard' : 'Collapse Storyboard'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="hos-sb-scroll-body">
          {/* 2. Critical Allergy & Caution Banner */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="hos-sb-allergy-banner" role="alert">
              <div className="hos-sb-allergy-title">
                <span>⚠️</span>
                <span>DOCUMENTED ALLERGIES</span>
              </div>
              <div className="hos-sb-allergy-tags">
                {patient.allergies.map((allergy, i) => (
                  <span key={i} className="hos-sb-allergy-chip">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. NEWS2 Acuity & Live Vitals Sparkboard */}
          <div className="hos-sb-vitals-card">
            <div className="hos-sb-card-header">
              <span className="hos-sb-section-label">LIVE CLINICAL VITALS</span>
              <span
                className="hos-sb-news2-badge"
                style={{
                  backgroundColor: `${news2Color}22`,
                  color: news2Color,
                  borderColor: `${news2Color}55`,
                }}
              >
                NEWS2: {news2} • {news2Label}
              </span>
            </div>

            <div className="hos-sb-vitals-grid">
              <div className="hos-sb-vital-box">
                <span className="hos-vital-metric-label">Blood Pressure</span>
                <span className="hos-vital-metric-val">{patient.vitals?.bp || '120/80'}</span>
                <span className="hos-vital-metric-unit">mmHg</span>
              </div>

              <div className="hos-sb-vital-box">
                <span className="hos-vital-metric-label">Pulse / HR</span>
                <span className="hos-vital-metric-val">{patient.vitals?.pulse || patient.vitals?.pulseBpm || 72}</span>
                <span className="hos-vital-metric-unit">bpm</span>
              </div>

              <div className="hos-sb-vital-box">
                <span className="hos-vital-metric-label">SpO2 Oxygen</span>
                <span className="hos-vital-metric-val" style={{ color: (patient.vitals?.spo2 || 98) < 94 ? '#ef4444' : '#10b981' }}>
                  {patient.vitals?.spo2 || patient.vitals?.spo2Percentage || 98}%
                </span>
                <span className="hos-vital-metric-unit">Room Air</span>
              </div>

              <div className="hos-sb-vital-box">
                <span className="hos-vital-metric-label">Temperature</span>
                <span className="hos-vital-metric-val">{patient.vitals?.temp || '98.6'}</span>
                <span className="hos-vital-metric-unit">°F</span>
              </div>
            </div>
          </div>

          {/* 4. Active Chronic Diagnoses & ICD-10 Chips */}
          <div className="hos-sb-conditions-card">
            <span className="hos-sb-section-label">CHRONIC CONDITIONS & PROBLEMS</span>
            <div className="hos-sb-conditions-list">
              {(patient.chronicConditions && patient.chronicConditions.length > 0) ? (
                patient.chronicConditions.map((cond, i) => (
                  <span key={i} className="hos-sb-condition-chip">
                    {cond}
                  </span>
                ))
              ) : (
                <span className="hos-sb-no-conditions">No chronic comorbidities registered</span>
              )}
            </div>
          </div>

          {/* 5. Location & Attending Team */}
          <div className="hos-sb-location-box">
            <div className="hos-sb-loc-row">
              <span className="hos-sb-loc-label">Location / Bed:</span>
              <span className="hos-sb-loc-val">{patient.bedNumber || 'OPD Waiting Room'}</span>
            </div>
            {patient.attendingDoctor && (
              <div className="hos-sb-loc-row">
                <span className="hos-sb-loc-label">Attending:</span>
                <span className="hos-sb-loc-val">{patient.attendingDoctor}</span>
              </div>
            )}
            {patient.chiefComplaint && (
              <div className="hos-sb-loc-row" style={{ marginTop: '4px' }}>
                <span className="hos-sb-loc-label">Complaint:</span>
                <span className="hos-sb-complaint-text">{patient.chiefComplaint}</span>
              </div>
            )}
          </div>

          {/* 6. Instant Micro-Action Trays Launchers */}
          <div className="hos-sb-quick-actions">
            <span className="hos-sb-section-label">QUICK CONTEXT ACTIONS</span>
            <div className="hos-sb-action-grid">
              <button
                type="button"
                className="hos-sb-action-btn hos-sb-btn-rx"
                onClick={() => onOpenTray?.('QUICK_RX')}
                title="Prescribe medication without leaving page"
              >
                <span>💊</span>
                <span>Quick Rx</span>
              </button>

              <button
                type="button"
                className="hos-sb-action-btn hos-sb-btn-lab"
                onClick={() => onOpenTray?.('QUICK_LAB')}
                title="Order diagnostic tests without leaving page"
              >
                <span>🧪</span>
                <span>Order Lab</span>
              </button>

              <button
                type="button"
                className="hos-sb-action-btn hos-sb-btn-vitals"
                onClick={() => onOpenTray?.('QUICK_VITALS')}
                title="Record triage vitals"
              >
                <span>❤️</span>
                <span>Record Vitals</span>
              </button>

              <button
                type="button"
                className="hos-sb-action-btn hos-sb-btn-settle"
                onClick={() => onOpenTray?.('INSTANT_SETTLE')}
                title="Instant cashier settlement and thermal receipt"
              >
                <span>💳</span>
                <span>Settle Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
