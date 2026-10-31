import fs from 'node:fs';

const filePath = 'apps/partner-platform/src/components/views/EmergencyCommandCenterView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the three initial mock state arrays with clean dynamic state and useEffect
const oldStateBlock = `  // Pre-Hospital Telemetry State
  const [inboundAmbulances, setInboundAmbulances] = useState<InboundAmbulance[]>([
    {
      id: 'AMB-ALS-04',
      vehicleNumber: 'DL-01-EQ-9921',
      type: 'ALS (Advanced Life Support)',
      patientSummary: '52M, Severe Crushing Chest Pain radiating to left jaw x 45 min',
      acuity: 'CRITICAL_STEMI',
      vitals: { hr: 114, bp: '86/52', spo2: 89, gcs: '15/15', ecg: 'ST-Elevation in II, III, aVF (Inferior Wall MI)' },
      etaMinutes: 6,
      distanceKm: 2.8,
      isPreActivated: false
    },
    {
      id: 'AMB-BLS-09',
      vehicleNumber: 'DL-04-TR-1044',
      type: 'Trauma Resuscitation Unit',
      patientSummary: '28M, High-speed bike collision vs divider. Blunt abdominal injury',
      acuity: 'RED_TRAUMA',
      vitals: { hr: 128, bp: '92/58', spo2: 94, gcs: '11/15', ecg: 'Sinus Tachycardia' },
      etaMinutes: 14,
      distanceKm: 7.4,
      isPreActivated: false
    }
  ]);
  const [selectedEcgAmbulance, setSelectedEcgAmbulance] = useState<InboundAmbulance | null>(null);

  // 1-Click Digital Police Intimation Gateway State
  const [mlcCases, setMlcCases] = useState<MlcIntimationCase[]>([
    {
      id: 'MLC-2026-0894',
      patientName: 'Vikram Singh',
      ageGender: '32M',
      uhid: 'UHID-2026-00912',
      timeOfArrival: '14:45 IST',
      natureOfInjury: 'Alleged RTA • Multiple contusions, compound fracture right tibia, active bleeding',
      broughtBy: 'PCR Van ASI Rajesh Kumar (Belt #4928, South District)',
      jurisdictionPs: 'Police Station Hauz Khas',
      status: 'DISPATCHED',
      dispatchAckNumber: 'POL-HK-4421',
      encryptionHash: 'SHA256:7f9a1c8902b4e81'
    },
    {
      id: 'MLC-2026-0895',
      patientName: 'Amitesh Verma',
      ageGender: '45M',
      uhid: 'UHID-2026-00915',
      timeOfArrival: '15:10 IST',
      natureOfInjury: 'Alleged Physical Assault • Blunt cranial injury, laceration left temporal region',
      broughtBy: 'Bystander Ravi Gupta (Mobile: 98112-XXXXX)',
      jurisdictionPs: 'Police Station Hauz Khas',
      status: 'PENDING_DISPATCH'
    }
  ]);
  const [selectedMlcForSlip, setSelectedMlcForSlip] = useState<MlcIntimationCase | null>(null);
  const [isDispatchingMlc, setIsDispatchingMlc] = useState(false);

  // Crash Cart Auto-Replenishment & Consumption Telemetry State
  const [crashCartStatus, setCrashCartStatus] = useState<'SEALED' | 'UNSEALED_IN_USE' | 'REPLENISHING'>('SEALED');
  const [currentSealNumber, setCurrentSealNumber] = useState('SEAL-9942');
  const [nextSealNumber] = useState('SEAL-9943');
  const [replenishCourierEta] = useState(165); // 2m 45s
  const [crashCartItems, setCrashCartItems] = useState<CrashCartItem[]>([
    { id: 'item-1', name: 'Inj. Adrenaline (Epinephrine) 1mg/1mL', parLevel: 5, usedCount: 2, unit: 'Amps' },
    { id: 'item-2', name: 'Inj. Atropine Sulfate 0.6mg/1mL', parLevel: 5, usedCount: 3, unit: 'Amps' },
    { id: 'item-3', name: 'Inj. Amiodarone Hydrochloride 150mg/3mL', parLevel: 2, usedCount: 1, unit: 'Amps' },
    { id: 'item-4', name: 'Endotracheal Tube (Size 7.5 Cuffed)', parLevel: 2, usedCount: 1, unit: 'Pcs' },
    { id: 'item-5', name: 'Defibrillator Adult Pacing / Shock Pads', parLevel: 2, usedCount: 1, unit: 'Pairs' }
  ]);`;

const newStateBlock = `  // Pre-Hospital Telemetry State (Dynamic from Database API)
  const [inboundAmbulances, setInboundAmbulances] = useState<InboundAmbulance[]>([]);
  const [selectedEcgAmbulance, setSelectedEcgAmbulance] = useState<InboundAmbulance | null>(null);

  // 1-Click Digital Police Intimation Gateway State (Dynamic from Database API)
  const [mlcCases, setMlcCases] = useState<MlcIntimationCase[]>([]);
  const [selectedMlcForSlip, setSelectedMlcForSlip] = useState<MlcIntimationCase | null>(null);
  const [isDispatchingMlc, setIsDispatchingMlc] = useState(false);

  // Crash Cart Auto-Replenishment & Consumption Telemetry State (Dynamic from Database API)
  const [crashCartStatus, setCrashCartStatus] = useState<'SEALED' | 'UNSEALED_IN_USE' | 'REPLENISHING'>('SEALED');
  const [currentSealNumber, setCurrentSealNumber] = useState('SEAL-9942');
  const [nextSealNumber] = useState('SEAL-9943');
  const [replenishCourierEta] = useState(165); // 2m 45s
  const [crashCartItems, setCrashCartItems] = useState<CrashCartItem[]>([]);

  React.useEffect(() => {
    fetch('/api/v1/emergency/command-center/inbound-ambulances')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setInboundAmbulances(res.data);
        }
      })
      .catch((err) => console.warn('Failed to load inbound ambulances:', err));

    fetch('/api/v1/emergency/command-center/mlc-cases')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setMlcCases(res.data);
        }
      })
      .catch((err) => console.warn('Failed to load MLC cases:', err));

    fetch('/api/v1/emergency/command-center/crash-carts')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCrashCartItems(res.data);
        }
      })
      .catch((err) => console.warn('Failed to load crash cart:', err));
  }, []);`;

if (content.includes(oldStateBlock)) {
  content = content.replace(oldStateBlock, newStateBlock);
  console.log('Replaced emergency command center states');
} else {
  console.log('oldStateBlock exact match failed');
}

// Add clean empty state for Inbound Ambulances
const oldAmbGrid = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inboundAmbulances.map((amb) => (`;

const newAmbGrid = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inboundAmbulances.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
              <span className="text-2xl block mb-2">🚑</span>
              <p className="font-semibold text-sm text-slate-300">No Inbound Ambulances En-Route</p>
              <p className="text-xs text-slate-500 mt-1">Pre-hospital telemetry queue is clear. Trauma bay standby is disengaged.</p>
            </div>
          ) : inboundAmbulances.map((amb) => (`;

if (content.includes(oldAmbGrid)) {
  content = content.replace(oldAmbGrid, newAmbGrid);
  console.log('Added empty state to inbound ambulances');
}

// Add clean empty state for MLC cases
const oldMlcTable = `<tbody>
              {mlcCases.map((mlc) => (`;

const newMlcTable = `<tbody>
              {mlcCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    <span className="text-xl block mb-1">⚖️</span>
                    No pending Medico-Legal Cases. All emergency arrivals cleared.
                  </td>
                </tr>
              ) : mlcCases.map((mlc) => (`;

if (content.includes(oldMlcTable)) {
  content = content.replace(oldMlcTable, newMlcTable);
  console.log('Added empty state to MLC cases table');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('EmergencyCommandCenterView.tsx updated successfully.');
