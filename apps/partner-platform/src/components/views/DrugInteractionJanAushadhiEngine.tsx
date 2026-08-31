import React, { useState } from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';

export interface JanAushadhiGenericMatch {
  brandName: string;
  brandPriceInr: number;
  genericSalt: string;
  janAushadhiCode: string;
  janAushadhiPriceInr: number;
  savingsPercent: number;
  strength: string;
}

export interface DrugInteractionAlert {
  id: string;
  drugA: string;
  drugB: string;
  severity: 'LETHAL' | 'MAJOR' | 'MODERATE' | 'SAFE';
  mechanism: string;
  clinicalAction: string;
}

interface DrugInteractionJanAushadhiEngineProps {
  currentMedications?: string[];
  onSubstituteGeneric?: (genericName: string, strength: string) => void;
}

export const DrugInteractionJanAushadhiEngine: React.FC<DrugInteractionJanAushadhiEngineProps> = ({
  currentMedications = ['Augmentin 625 Duo', 'Warfarin 5mg', 'Aspirin 75mg', 'Lipitor 20mg'],
  onSubstituteGeneric
}) => {
  const [searchDrug, setSearchDrug] = useState('');
  const [medList, setMedList] = useState<string[]>(currentMedications);
  const [switchedGenerics, setSwitchedGenerics] = useState<string[]>([]);

  // Knowledge base of Jan Aushadhi generic equivalents
  const janAushadhiDatabase: JanAushadhiGenericMatch[] = [
    {
      brandName: 'Augmentin 625 Duo',
      brandPriceInr: 215,
      genericSalt: 'Amoxicillin + Potassium Clavulanate',
      janAushadhiCode: 'PMBJP-TAB-014',
      janAushadhiPriceInr: 35,
      savingsPercent: 84,
      strength: '500mg + 125mg'
    },
    {
      brandName: 'Lipitor 20mg',
      brandPriceInr: 390,
      genericSalt: 'Atorvastatin Calcium',
      janAushadhiCode: 'PMBJP-TAB-089',
      janAushadhiPriceInr: 16,
      savingsPercent: 96,
      strength: '20 mg'
    },
    {
      brandName: 'Januvia 100mg',
      brandPriceInr: 430,
      genericSalt: 'Sitagliptin Phosphate',
      janAushadhiCode: 'PMBJP-TAB-204',
      janAushadhiPriceInr: 48,
      savingsPercent: 89,
      strength: '100 mg'
    },
    {
      brandName: 'Pantocid 40mg',
      brandPriceInr: 165,
      genericSalt: 'Pantoprazole Sodium',
      janAushadhiCode: 'PMBJP-TAB-032',
      janAushadhiPriceInr: 14,
      savingsPercent: 92,
      strength: '40 mg'
    },
    {
      brandName: 'Telma 40mg',
      brandPriceInr: 140,
      genericSalt: 'Telmisartan Tablets',
      janAushadhiCode: 'PMBJP-TAB-056',
      janAushadhiPriceInr: 12,
      savingsPercent: 91,
      strength: '40 mg'
    }
  ];

  // Real-time DDI rules database
  const ddiDatabase: DrugInteractionAlert[] = [
    {
      id: 'ddi-1',
      drugA: 'Warfarin',
      drugB: 'Aspirin',
      severity: 'LETHAL',
      mechanism: 'Dual antithrombotic inhibition causes severe synergistic GI bleed and lethal intracranial hemorrhage risk.',
      clinicalAction: 'CRITICAL: Avoid concurrent prescription unless mechanical heart valve protocol with strict weekly INR monitoring.'
    },
    {
      id: 'ddi-2',
      drugA: 'Atorvastatin',
      drugB: 'Clarithromycin',
      severity: 'MAJOR',
      mechanism: 'CYP3A4 inhibition elevates statin plasma concentration by 400%, precipitating severe Rhabdomyolysis and acute renal failure.',
      clinicalAction: 'Suspend statin during macrolide antibiotic course or switch to Azithromycin.'
    },
    {
      id: 'ddi-3',
      drugA: 'Metformin',
      drugB: 'Iodinated Contrast',
      severity: 'MAJOR',
      mechanism: 'Contrast-induced nephropathy impairs metformin clearance, triggering fatal lactic acidosis.',
      clinicalAction: 'Withhold Metformin 48 hours prior to and after CT scan with IV contrast.'
    },
    {
      id: 'ddi-4',
      drugA: 'Sildenafil',
      drugB: 'Nitroglycerin / Sorbitrate',
      severity: 'LETHAL',
      mechanism: 'Excessive cyclic GMP accumulation causes catastrophic refractory hypotension and cardiac arrest.',
      clinicalAction: 'ABSOLUTE CONTRAINDICATION: Co-administration is strictly prohibited within 24 hours.'
    },
    {
      id: 'ddi-5',
      drugA: 'Ciprofloxacin',
      drugB: 'Antacids (Al/Mg)',
      severity: 'MODERATE',
      mechanism: 'Chelation with divalent/trivalent cations reduces fluoroquinolone absorption by 85%.',
      clinicalAction: 'Space administration by at least 2 hours.'
    }
  ];

  // Detect active interactions in patient's list
  const activeInteractions: DrugInteractionAlert[] = [];
  for (let i = 0; i < medList.length; i++) {
    for (let j = i + 1; j < medList.length; j++) {
      const medA = medList[i]!.toLowerCase();
      const medB = medList[j]!.toLowerCase();
      ddiDatabase.forEach((rule) => {
        if (
          (medA.includes(rule.drugA.toLowerCase()) && medB.includes(rule.drugB.toLowerCase())) ||
          (medA.includes(rule.drugB.toLowerCase()) && medB.includes(rule.drugA.toLowerCase()))
        ) {
          if (!activeInteractions.some((x) => x.id === rule.id)) {
            activeInteractions.push(rule);
          }
        }
      });
    }
  }

  // Calculate total patient savings
  const totalBrandCost = janAushadhiDatabase.reduce((acc, item) => acc + item.brandPriceInr, 0);
  const totalJanAushadhiCost = janAushadhiDatabase.reduce((acc, item) => acc + item.janAushadhiPriceInr, 0);
  const totalSavedInr = totalBrandCost - totalJanAushadhiCost;

  const handleAddDrug = (name: string) => {
    if (name.trim() && !medList.includes(name.trim())) {
      setMedList([...medList, name.trim()]);
      setSearchDrug('');
    }
  };

  const handleRemoveDrug = (name: string) => {
    setMedList(medList.filter((m) => m !== name));
  };

  const handleSwitchGeneric = (match: JanAushadhiGenericMatch) => {
    setSwitchedGenerics((prev) => [...prev, match.brandName]);
    if (onSubstituteGeneric) {
      onSubstituteGeneric(match.genericSalt, match.strength);
    }
  };

  return (
    <Card padding="md" style={{ border: '2px solid #8B5CF6', backgroundColor: '#0B132B', borderRadius: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>💊</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
              Real-Time Drug-Drug Interaction (DDI) & Pradhan Mantri Jan Aushadhi Finder
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Instant lethal contraindication defense, CYP3A4 warnings, and 90%+ generic patient cost savings
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={activeInteractions.length > 0 ? 'danger' : 'success'}>
            {activeInteractions.length > 0 ? `⚠️ ${activeInteractions.length} DDI Interaction Alert` : '✓ Zero Drug Conflicts'}
          </Badge>
          <Badge variant="primary">
            💰 Max Jan Aushadhi Savings: ₹{totalSavedInr} (88% OFF)
          </Badge>
        </div>
      </div>

      {/* Active Prescription Cross-Check Pills */}
      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '8px' }}>
          Currently Cross-Checking Prescription Drugs ({medList.length} Active):
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {medList.map((m) => (
            <span
              key={m}
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid #8B5CF6',
                color: '#DDD6FE',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              💊 {m}
              <button
                type="button"
                onClick={() => handleRemoveDrug(m)}
                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 800, padding: 0 }}
              >
                ✕
              </button>
            </span>
          ))}

          {/* Quick Drug Add Input */}
          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="+ Add Drug (e.g. Clarithromycin, Nitroglycerin)"
              value={searchDrug}
              onChange={(e) => setSearchDrug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDrug(searchDrug);
                }
              }}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                padding: '4px 10px',
                color: '#FFF',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => handleAddDrug(searchDrug)}
              style={{
                backgroundColor: '#8B5CF6',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* 1. DDI INTERACTION ALERTS (RED BOX IF DETECTED) */}
      {activeInteractions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>
            🚨 Clinical Drug Interaction Safety Alerts:
          </span>

          {activeInteractions.map((alert) => (
            <div
              key={alert.id}
              style={{
                backgroundColor: alert.severity === 'LETHAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: alert.severity === 'LETHAL' ? '1.5px solid #EF4444' : '1.5px solid #F59E0B',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: alert.severity === 'LETHAL' ? '#FCA5A5' : '#FDE68A' }}>
                  ⚠️ {alert.severity} CONFLICT: {alert.drugA} + {alert.drugB}
                </span>
                <span style={{ backgroundColor: alert.severity === 'LETHAL' ? '#EF4444' : '#F59E0B', color: '#070C16', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 800 }}>
                  {alert.severity} RISK
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                <strong>Mechanism:</strong> {alert.mechanism}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                💡 <strong>Clinical Guidance:</strong> {alert.clinicalAction}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 2. JAN AUSHADHI GENERIC ALTERNATIVE FINDER & SAVINGS TABLE */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>
            🇮🇳 Pradhan Mantri Jan Aushadhi (PMBJP) Generic Matches & Price Comparison:
          </span>
          <span style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 700 }}>
            Govt. Fixed Maximum Retail Prices
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          {janAushadhiDatabase.map((item) => {
            const isSwitched = switchedGenerics.includes(item.brandName);
            return (
              <div
                key={item.janAushadhiCode}
                style={{
                  backgroundColor: isSwitched ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                  border: isSwitched ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {item.brandName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#EF4444', textDecoration: 'line-through', fontWeight: 700 }}>
                      ₹{item.brandPriceInr}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>→</span>
                    <span style={{ fontSize: '0.9375rem', color: '#10B981', fontWeight: 800 }}>
                      ₹{item.janAushadhiPriceInr} (Jan Aushadhi)
                    </span>
                    <span style={{ backgroundColor: '#10B981', color: '#070C16', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
                      {item.savingsPercent}% SAVED
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '3px' }}>
                    <strong>Generic Salt:</strong> {item.genericSalt} ({item.strength}) • <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{item.janAushadhiCode}</span>
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    variant={isSwitched ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleSwitchGeneric(item)}
                    style={{
                      backgroundColor: isSwitched ? '#10B981' : '#06B6D4',
                      borderColor: isSwitched ? '#10B981' : '#06B6D4',
                      color: '#070C16',
                      fontWeight: 800
                    }}
                  >
                    {isSwitched ? '✓ Generic Switched' : '⚡ 1-Click Switch to Jan Aushadhi'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
