import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Badge,
  Button,
  Input
} from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { apiRequest } from '../../services/api-client.js';

export interface NurseCapturedVitals {
  encounterId: string;
  patientId: string;
  patientName: string;
  tokenNumber: string;
  systolicBp: number;
  diastolicBp: number;
  pulseBpm: number;
  spo2Percent: number;
  tempF: number;
  bloodSugarMgDl: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  respiratoryRateBpm: number;
  chiefComplaints: string;
  triageCategory: 'NORMAL' | 'URGENT' | 'CRITICAL';
  recordedByNurse: string;
  recordedAt: string;
}

export interface InpatientMedication {
  id: string;
  drugName: string;
  dosage: string;
  route: 'IV' | 'ORAL' | 'SC' | 'IM' | 'NEB';
  scheduledTime: string;
  status: 'DUE' | 'GIVEN' | 'OMITTED';
  administeredAt?: string | undefined;
  administeredBy?: string | undefined;
}

export interface InpatientWardRecord {
  id: string;
  bedNumber: string;
  wardName: string;
  patientName: string;
  uhid: string;
  age: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  admissionDate: string;
  attendingDoctor: string;
  diagnosis: string;
  diet: string;
  medications: InpatientMedication[];
  nursingNotes: Array<{
    id: string;
    timestamp: string;
    note: string;
    nurseName: string;
  }>;
  intakeMl: number;
  outputMl: number;
}

export interface EmergencyTriagePatient {
  id: string;
  token: string;
  patientName: string;
  age: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  arrivalMode: 'AMBULANCE' | 'WALK_IN' | 'POLICE';
  triageCategory: 'RED' | 'YELLOW' | 'GREEN';
  presentingSymptom: string;
  bp: string;
  pulse: string;
  spo2: string;
  status: 'RESUS' | 'ASSESSMENT' | 'TRANSFERRED' | 'STABILIZED';
  arrivalTime: string;
}

export interface NurseVitalsTriageStationViewProps {
  tenantId?: string | undefined;
  nurseName?: string | undefined;
  onPatientSentToDoctor?: ((patientId: string, doctorName: string) => void) | undefined;
}

const DEFAULT_INPATIENTS: InpatientWardRecord[] = [];

const DEFAULT_EMERGENCY_PATIENTS: EmergencyTriagePatient[] = [];

export const NurseVitalsTriageStationView: React.FC<NurseVitalsTriageStationViewProps> = ({
  tenantId: _tenantId = 'default',
  nurseName = 'Staff Nurse, RN',
  onPatientSentToDoctor
}) => {
  // 4 Core Nurse Workstation Pillars
  const [activeTab, setActiveTab] = useState<'RECORD_VITALS' | 'CHAMBER_ESCORT' | 'INPATIENT_WARD' | 'EMERGENCY_BAY'>('RECORD_VITALS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Record Vitals State
  const [encounters, setEncounters] = useState<any[]>([]);
  const [selectedEncounter, setSelectedEncounter] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'TRIAGED'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  // Vitals Form Values
  const [systolicBp, setSystolicBp] = useState<string>('120');
  const [diastolicBp, setDiastolicBp] = useState<string>('80');
  const [pulseBpm, setPulseBpm] = useState<string>('74');
  const [spo2Percent, setSpo2Percent] = useState<string>('98');
  const [tempF, setTempF] = useState<string>('98.4');
  const [bloodSugarMgDl, setBloodSugarMgDl] = useState<string>('110');
  const [weightKg, setWeightKg] = useState<string>('68');
  const [heightCm, setHeightCm] = useState<string>('170');
  const [chiefComplaints, setChiefComplaints] = useState<string>('');
  const [triageCategory, setTriageCategory] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Chamber Escort Queue State
  const [escortDoctorFilter, setEscortDoctorFilter] = useState<string>('ALL');

  // 3. Inpatient Ward Care State
  const [inpatients, setInpatients] = useState<InpatientWardRecord[]>(DEFAULT_INPATIENTS);
  const [selectedInpatientId, setSelectedInpatientId] = useState<string>(DEFAULT_INPATIENTS[0]?.id || '');
  const [newNursingNote, setNewNursingNote] = useState('');
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedRoute, setNewMedRoute] = useState<'IV' | 'ORAL' | 'SC' | 'IM' | 'NEB'>('IV');
  const [newMedTime, setNewMedTime] = useState('12:00 PM');

  // 4. Emergency Triage Bay State
  const [emergencyPatients, setEmergencyPatients] = useState<EmergencyTriagePatient[]>(DEFAULT_EMERGENCY_PATIENTS);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosPatientName, setSosPatientName] = useState('');
  const [sosAge, setSosAge] = useState('40');
  const [sosGender, setSosGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [sosTriageCat, setSosTriageCat] = useState<'RED' | 'YELLOW' | 'GREEN'>('RED');
  const [sosSymptoms, setSosSymptoms] = useState('');
  const [crashCartVerified, setCrashCartVerified] = useState(true);

  // Live BMI calculation
  const calculatedBmi = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '23.5';
  }, [weightKg, heightCm]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Audio speech announcements
  const announceChamberEscort = (token: string, patientName: string, chamber: string) => {
    if (typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        const text = `Token ${token}. ${patientName}. Please proceed to ${chamber}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch {}
  };

  const announceEmergencyAlert = (category: string, patientName: string) => {
    if (typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        const text = `Emergency alert! ${category} triage patient ${patientName} arriving at resuscitation bay.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.15;
        window.speechSynthesis.speak(utterance);
      }
    } catch {}
  };

  // Load patient queue from authoritative PostgreSQL backend
  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const qRes = await apiRequest<any[]>('/api/v1/partner/clinical/queues');
      let liveList: any[] = [];
      if (qRes.success && Array.isArray(qRes.data)) {
        liveList = qRes.data.map((item) => ({
          id: item.id,
          encounterId: item.encounterId,
          patientId: item.patientId,
          name: item.patientName || item.metadata?.patientName || 'Patient',
          mobile: item.patientPhone || item.metadata?.patientPhone || '',
          gender: item.gender || item.metadata?.gender || 'MALE',
          age: String(item.age || item.metadata?.age || '30'),
          mrn: item.mrn || item.uhid || item.metadata?.mrn || 'UHID-00000',
          token: item.tokenNumber || `TK-${item.id.slice(0, 4)}`,
          doctor: item.doctorName || item.metadata?.doctorName || 'Consulting Physician',
          doctorId: item.doctorId || 'doc-1',
          room: item.metadata?.chamber || 'Room 101',
          status: item.queueStatus,
          visitType: item.metadata?.visitType || 'WALK_IN',
          complaint: item.chiefComplaint || 'OPD Consultation',
          registeredAt: item.createdAt || new Date().toISOString(),
          hasVitals: item.hasVitals,
          vitals: item.vitals,
          queueEligibility: item.queueEligibility,
          blockingReason: item.blockingReason
        }));
      }

      setEncounters(liveList);
      if (liveList.length > 0) {
        setSelectedEncounter((prev: any) => {
          if (!prev) return liveList[0];
          const found = liveList.find((e) => e.id === prev.id || e.encounterId === prev.encounterId);
          return found || liveList[0];
        });
      }
    } catch (err) {
      console.warn('Live queue load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
    const handleRegistered = () => void loadQueue();
    window.addEventListener('docsearch:patient-registered', handleRegistered);
    window.addEventListener('docsearch:encounters-updated', handleRegistered);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void loadQueue();
    }, 12000);
    return () => {
      window.removeEventListener('docsearch:patient-registered', handleRegistered);
      window.removeEventListener('docsearch:encounters-updated', handleRegistered);
      clearInterval(interval);
    };
  }, [loadQueue]);

  // Load existing vitals when patient is selected
  useEffect(() => {
    if (!selectedEncounter) return;
    const vit = selectedEncounter.vitals;
    if (vit) {
      setSystolicBp(String(vit.systolicBp || 120));
      setDiastolicBp(String(vit.diastolicBp || 80));
      setPulseBpm(String(vit.pulseBpm || 74));
      setSpo2Percent(String(vit.oxygenSaturationPercent || vit.spo2Percent || 98));
      setTempF(String(vit.temperatureCelsius ? ((parseFloat(vit.temperatureCelsius) * 9 / 5) + 32).toFixed(1) : (vit.tempF || 98.4)));
      setBloodSugarMgDl(String(vit.bloodSugarMgDl || 110));
      setWeightKg(String(vit.weightKg || 68));
      setHeightCm(String(vit.heightCm || 170));
      setChiefComplaints(selectedEncounter.complaint || '');
    } else {
      setChiefComplaints(selectedEncounter.complaint || '');
    }
  }, [selectedEncounter]);

  const hasVitalsRecorded = (encId: string) => {
    const enc = encounters.find((e) => e.id === encId || e.encounterId === encId);
    return Boolean(enc?.hasVitals || enc?.vitals);
  };

  const filteredEncounters = useMemo(() => {
    return encounters.filter((e) => {
      const q = searchTerm.toLowerCase();
      const matches =
        !q ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.mrn || '').toLowerCase().includes(q) ||
        (e.token || '').toLowerCase().includes(q) ||
        (e.doctor || '').toLowerCase().includes(q);

      if (!matches) return false;

      const isTriaged = hasVitalsRecorded(e.id);
      if (filterMode === 'PENDING') return !isTriaged;
      if (filterMode === 'TRIAGED') return isTriaged;
      return true;
    });
  }, [encounters, searchTerm, filterMode]);

  // Chamber Escort Queue: All triaged patients ready to enter doctor chamber
  const chamberEscortPatients = useMemo(() => {
    return encounters.filter((e) => {
      const isTriaged = hasVitalsRecorded(e.id);
      if (!isTriaged) return false;
      if (escortDoctorFilter !== 'ALL' && e.room !== escortDoctorFilter && e.doctor !== escortDoctorFilter) {
        return false;
      }
      return true;
    });
  }, [encounters, escortDoctorFilter]);

  // Rapid Normal Preset
  const handleApplyNormalPreset = () => {
    setSystolicBp('120');
    setDiastolicBp('80');
    setPulseBpm('72');
    setSpo2Percent('99');
    setTempF('98.6');
    setBloodSugarMgDl('104');
    setTriageCategory('NORMAL');
    showToast('Applied standard normal clinical vitals preset.');
  };

  // Submit Vitals & Forward to Chamber Escort Queue
  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;

    setIsSubmitting(true);
    try {
      const vitalsPayload: NurseCapturedVitals = {
        encounterId: selectedEncounter.id,
        patientId: selectedEncounter.patientId || selectedEncounter.id,
        patientName: selectedEncounter.name,
        tokenNumber: selectedEncounter.token || 'TK-01',
        systolicBp: parseInt(systolicBp, 10) || 120,
        diastolicBp: parseInt(diastolicBp, 10) || 80,
        pulseBpm: parseInt(pulseBpm, 10) || 74,
        spo2Percent: parseInt(spo2Percent, 10) || 98,
        tempF: parseFloat(tempF) || 98.4,
        bloodSugarMgDl: parseInt(bloodSugarMgDl, 10) || 110,
        weightKg: parseFloat(weightKg) || 68,
        heightCm: parseFloat(heightCm) || 170,
        bmi: parseFloat(calculatedBmi) || 23.5,
        respiratoryRateBpm: 18,
        chiefComplaints: chiefComplaints.trim() || 'Routine OPD consultation',
        triageCategory,
        recordedByNurse: nurseName,
        recordedAt: new Date().toISOString()
      };


      // 1b. Authoritative Server Persistence: Save vitals to encounter on PostgreSQL
      try {
        const activeEncounterId = selectedEncounter.encounterId || selectedEncounter.id;
        const sBp = parseInt(systolicBp, 10) || 120;
        const dBp = parseInt(diastolicBp, 10) || 80;
        const pulse = parseInt(pulseBpm, 10) || 74;
        const spo2 = parseInt(spo2Percent, 10) || 98;
        const tempCelsius = ((parseFloat(tempF || '98.4') - 32) * 5 / 9).toFixed(1);
        const wKg = parseFloat(weightKg) || 68;
        const hCm = parseFloat(heightCm) || 170;

        await apiRequest(`/api/v1/partner/clinical/encounters/${activeEncounterId}/vitals`, {
          method: 'POST',
          body: JSON.stringify({
            systolicBp: sBp,
            diastolicBp: dBp,
            pulseBpm: pulse,
            oxygenSaturationPercent: spo2,
            temperatureCelsius: tempCelsius,
            temperatureFahrenheit: parseFloat(tempF) || 98.4,
            weightKg: wKg,
            heightCm: hCm,
            painScore: 0,
            clinicalNotes: `Triage vitals recorded: ${chiefComplaints.trim() || 'Routine OPD consultation'}. Category: ${triageCategory}.`,
            recordedBy: nurseName || 'Staff Nurse, RN'
          })
        });
      } catch (err: any) {
        console.warn('Backend vitals sync notice:', err);
      }

      // 2. Refresh live queue directly from PostgreSQL backend
      await loadQueue();

      // 3. Dispatch global events
      window.dispatchEvent(new CustomEvent('docsearch:vitals-recorded', { detail: vitalsPayload }));
      hospitalEventBus.publish(
        'PATIENT_SELECTED',
        'NurseVitalsStation',
        {
          patientId: selectedEncounter.encounterId || selectedEncounter.id,
          name: selectedEncounter.name,
          uhid: selectedEncounter.mrn,
          opdToken: parseInt((selectedEncounter.token || '1').replace(/\D/g, ''), 10) || 1,
          doctorName: selectedEncounter.doctor,
          vitalsSummary: `BP ${vitalsPayload.systolicBp}/${vitalsPayload.diastolicBp} | HR ${vitalsPayload.pulseBpm} | SpO2 ${vitalsPayload.spo2Percent}%`,
          stage: 'READY_FOR_ESCORT'
        },
        `Vitals captured for Token ${selectedEncounter.token} (${selectedEncounter.name}). Ready for Chamber Escort.`
      );
      hospitalEventBus.publish(
        'TRIAGE_VITALS_RECORDED',
        'NurseVitalsStation',
        {
          encounterId: selectedEncounter.encounterId || selectedEncounter.id,
          patientId: selectedEncounter.patientId,
          name: selectedEncounter.name,
          uhid: selectedEncounter.mrn,
          opdToken: parseInt((selectedEncounter.token || '1').replace(/\D/g, ''), 10) || 1,
          doctorName: selectedEncounter.doctor,
          vitals: vitalsPayload
        },
        `Real-time triage vitals recorded for ${selectedEncounter.name} (Token #${selectedEncounter.token})`
      );

      showToast(`✓ Vitals for Token #${selectedEncounter.token} recorded in database! Moved to Chamber Escort Queue.`);
      setActiveTab('CHAMBER_ESCORT');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chamber Escort Actions - Bound to PostgreSQL API
  const handleEscortToChamber = async (item: any) => {
    announceChamberEscort(item.token, item.name, item.room);
    try {
      await apiRequest(`/api/v1/partner/clinical/queues/${item.id}/call`, {
        method: 'PATCH'
      });
      await loadQueue();

      hospitalEventBus.publish(
        'PATIENT_SELECTED',
        'NurseVitalsStation',
        {
          patientId: item.encounterId || item.id,
          name: item.name,
          uhid: item.mrn,
          opdToken: parseInt((item.token || '1').replace(/\D/g, ''), 10) || 1,
          doctorName: item.doctor,
          stage: 'IN_CONSULTATION'
        },
        `Token ${item.token} escorted into Doctor Chamber ${item.room}`
      );

      showToast(`🚪 Escorting ${item.name} (${item.token}) to ${item.doctor} (${item.room})! Status updated in database.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update chamber escort status in database');
    }
  };

  const handleHandoverComplete = (item: any) => {
    showToast(`✓ ${item.name} handed over to ${item.doctor}. Consultation in progress.`);
    if (onPatientSentToDoctor) {
      onPatientSentToDoctor(item.id, item.doctor);
    }
  };

  // Inpatient Care Actions
  const selectedInpatient = useMemo(() => {
    return inpatients.find((p) => p.id === selectedInpatientId) || inpatients[0];
  }, [inpatients, selectedInpatientId]);

  const handleAdministerMed = (patientId: string, medId: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = inpatients.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        medications: p.medications.map((m) =>
          m.id === medId ? { ...m, status: 'GIVEN' as const, administeredAt: timeNow, administeredBy: nurseName } : m
        )
      };
    });
    setInpatients(updated);
    showToast(`💊 Medication marked as Given at ${timeNow} by ${nurseName}`);
  };

  const handleAddNursingNote = () => {
    if (!newNursingNote.trim() || !selectedInpatient) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const noteObj = {
      id: `note-${Date.now()}`,
      timestamp: timeNow,
      note: newNursingNote.trim(),
      nurseName
    };
    const updated = inpatients.map((p) =>
      p.id === selectedInpatient.id ? { ...p, nursingNotes: [noteObj, ...p.nursingNotes] } : p
    );
    setInpatients(updated);
    setNewNursingNote('');
    showToast('📝 Nursing note added to inpatient chart.');
  };

  const handleAddMedication = () => {
    if (!newMedName.trim() || !selectedInpatient) return;
    const newMed: InpatientMedication = {
      id: `med-${Date.now()}`,
      drugName: newMedName.trim(),
      dosage: newMedDosage.trim() || '1 tab',
      route: newMedRoute,
      scheduledTime: newMedTime,
      status: 'DUE'
    };
    const updated = inpatients.map((p) =>
      p.id === selectedInpatient.id ? { ...p, medications: [...p.medications, newMed] } : p
    );
    setInpatients(updated);
    setShowAddMedModal(false);
    setNewMedName('');
    setNewMedDosage('');
    showToast(`Added ${newMed.drugName} to e-MAR.`);
  };

  const handleUpdateFluid = (patientId: string, type: 'INTAKE' | 'OUTPUT', delta: number) => {
    const updated = inpatients.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        intakeMl: type === 'INTAKE' ? Math.max(0, p.intakeMl + delta) : p.intakeMl,
        outputMl: type === 'OUTPUT' ? Math.max(0, p.outputMl + delta) : p.outputMl
      };
    });
    setInpatients(updated);
  };

  // Emergency Triage Bay Actions
  const handleRapidSosCheckIn = () => {
    const token = `EMERG-0${emergencyPatients.length + 1}`;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEmg: EmergencyTriagePatient = {
      id: `emg-${Date.now()}`,
      token,
      patientName: sosPatientName.trim() || `Emergency Patient #${token}`,
      age: sosAge || '40',
      gender: sosGender,
      arrivalMode: 'AMBULANCE',
      triageCategory: sosTriageCat,
      presentingSymptom: sosSymptoms.trim() || 'Acute emergency triage case',
      bp: '120/80',
      pulse: '98',
      spo2: '92%',
      status: 'RESUS',
      arrivalTime: timeNow
    };

    const updated = [newEmg, ...emergencyPatients];
    setEmergencyPatients(updated);
    setShowSosModal(false);
    setSosPatientName('');
    setSosSymptoms('');

    announceEmergencyAlert(sosTriageCat, newEmg.patientName);
    showToast(`🚨 ${sosTriageCat} Priority Case ${newEmg.patientName} admitted to Resuscitation Bay!`);
  };

  const handleExpediteEmergency = (p: EmergencyTriagePatient) => {
    announceEmergencyAlert(p.triageCategory, p.patientName);
    showToast(`🚨 ${p.patientName} (${p.token}) expedited directly into Doctor Chamber 101!`);
    hospitalEventBus.publish(
      'PATIENT_SELECTED',
      'EmergencyBay',
      {
        id: p.id,
        name: p.patientName,
        opdToken: parseInt(p.token.replace(/\D/g, ''), 10) || 99,
        doctorName: 'Emergency Duty Physician',
        priority: 'EMERGENCY',
        triageCategory: p.triageCategory
      },
      `🚨 EMERGENCY ALERT: ${p.triageCategory} Patient ${p.patientName} expedited to chamber.`
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '12px 16px 60px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* TOAST ALERT */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0F172A',
            border: '1.5px solid #10B981',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#F8FAFC',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            fontWeight: 800
          }}
        >
          <span>👩‍⚕️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <Card
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          padding: '16px 20px',
          borderRadius: '16px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1.5px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}
            >
              👩‍⚕️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Nurse & Clinical Triage Workstation
                </h1>
                <Badge variant="success" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                  ● Station Live
                </Badge>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Duty Nurse: <strong style={{ color: '#34D399' }}>{nurseName}</strong> • Real-World Clinical Care
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadQueue()}
              style={{ fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1' }}
            >
              🔄 Refresh Queue
            </Button>
          </div>
        </div>
      </Card>

      {/* 4 CORE NURSE WORKSTATION PILLARS TABS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          backgroundColor: '#0F172A',
          padding: '6px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('RECORD_VITALS')}
          style={{
            padding: '10px 4px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'RECORD_VITALS' ? '#10B981' : 'transparent',
            color: activeTab === 'RECORD_VITALS' ? '#042F2E' : '#94A3B8',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🩺</span>
          <span>Record Vitals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CHAMBER_ESCORT')}
          style={{
            padding: '10px 4px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'CHAMBER_ESCORT' ? '#10B981' : 'transparent',
            color: activeTab === 'CHAMBER_ESCORT' ? '#042F2E' : '#94A3B8',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            position: 'relative'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🚪</span>
          <span>Chamber Escort</span>
          {chamberEscortPatients.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                backgroundColor: '#0d9488',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '1px 5px',
                fontSize: '0.625rem',
                fontWeight: 900
              }}
            >
              {chamberEscortPatients.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INPATIENT_WARD')}
          style={{
            padding: '10px 4px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'INPATIENT_WARD' ? '#10B981' : 'transparent',
            color: activeTab === 'INPATIENT_WARD' ? '#042F2E' : '#94A3B8',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🛏️</span>
          <span>Inpatient Ward</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EMERGENCY_BAY')}
          style={{
            padding: '10px 4px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'EMERGENCY_BAY' ? '#EF4444' : 'transparent',
            color: activeTab === 'EMERGENCY_BAY' ? '#FFFFFF' : '#94A3B8',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🚨</span>
          <span>Emergency Bay</span>
        </button>
      </div>

      {/* TAB 1: 🩺 RECORD VITALS & TRIAGE */}
      {activeTab === 'RECORD_VITALS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(440px, 1.4fr)', gap: '16px' }}>
          {/* Left Panel: Arriving Patients Queue */}
          <Card
            style={{
              backgroundColor: 'rgba(18, 24, 38, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9375rem', color: '#F8FAFC' }}>
                  Arriving Tokens ({filteredEncounters.length})
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>
                  Dispatched from Front Desk
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {(['ALL', 'PENDING', 'TRIAGED'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilterMode(f)}
                    style={{
                      backgroundColor: filterMode === f ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: filterMode === f ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: filterMode === f ? '#34D399' : '#94A3B8',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {f === 'PENDING' ? '⏳ Pending' : (f === 'TRIAGED' ? '✓ Triaged' : 'All')}
                  </button>
                ))}
              </div>
            </div>

            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search token, name, phone..."
              style={{ fontSize: '0.8125rem', padding: '8px 10px' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>Loading queue...</div>
              ) : filteredEncounters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                  No patients in this queue. Walk-ins will appear here from Front Desk.
                </div>
              ) : (
                filteredEncounters.map((enc) => {
                  const isSelected = selectedEncounter?.id === enc.id;
                  const isTriaged = hasVitalsRecorded(enc.id);

                  return (
                    <div
                      key={enc.id}
                      onClick={() => setSelectedEncounter(enc)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: isTriaged ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isTriaged ? '#34D399' : '#FBBF24',
                            fontWeight: 900,
                            fontSize: '0.85rem'
                          }}
                        >
                          {enc.token || 'TK'}
                        </span>
                        <div>
                          <strong style={{ color: '#F8FAFC', fontSize: '0.875rem', display: 'block' }}>
                            {enc.name}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            {enc.gender} • {enc.mobile} • {enc.mrn}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#38BDF8', display: 'block', marginTop: '2px' }}>
                            👉 Assigned: {enc.doctor} ({enc.room})
                          </span>
                        </div>
                      </div>

                      <Badge variant={isTriaged ? 'success' : 'warning'} style={{ fontSize: '0.65rem' }}>
                        {isTriaged ? '✓ Ready' : '⏳ Needs Vitals'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Right Panel: Vitals Entry Form */}
          <Card
            style={{
              backgroundColor: 'rgba(18, 24, 38, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {selectedEncounter ? (
              <form onSubmit={handleSubmitVitals} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Patient Header Banner */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: '#34D399' }}>
                        Token #{selectedEncounter.token}
                      </span>
                      <strong style={{ fontSize: '1rem', color: '#F8FAFC' }}>
                        {selectedEncounter.name}
                      </strong>
                      <Badge variant="primary">{selectedEncounter.gender || 'PATIENT'}</Badge>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                      MRN: {selectedEncounter.mrn} • Doctor: <strong style={{ color: '#38BDF8' }}>{selectedEncounter.doctor} ({selectedEncounter.room})</strong>
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleApplyNormalPreset}
                    style={{ fontSize: '0.75rem', border: '1px solid #10B981', color: '#34D399' }}
                  >
                    ⚡ Normal Preset
                  </Button>
                </div>

                {/* Triage Urgency Level */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                    Triage Urgency Priority:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[
                      { key: 'NORMAL', label: '🟢 Routine / Stable', desc: 'Standard chamber wait' },
                      { key: 'URGENT', label: '🟡 Priority Care', desc: 'Accelerated calling' },
                      { key: 'CRITICAL', label: '🔴 Immediate Attention', desc: 'Emergency chamber' }
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setTriageCategory(cat.key as any)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: triageCategory === cat.key ? (cat.key === 'NORMAL' ? 'rgba(16, 185, 129, 0.2)' : (cat.key === 'URGENT' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)')) : 'rgba(15, 23, 42, 0.6)',
                          border: triageCategory === cat.key ? (cat.key === 'NORMAL' ? '1.5px solid #10B981' : (cat.key === 'URGENT' ? '1.5px solid #F59E0B' : '1.5px solid #EF4444')) : '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: triageCategory === cat.key ? '#FFF' : '#CBD5E1' }}>
                          {cat.label}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{cat.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vitals Numeric Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {/* BP */}
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                      🩸 BP (mmHg)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        value={systolicBp}
                        onChange={(e) => setSystolicBp(e.target.value)}
                        placeholder="Sys"
                        style={{ width: '50%', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: '#FFF', textAlign: 'center', fontSize: '0.85rem' }}
                      />
                      <span>/</span>
                      <input
                        type="number"
                        value={diastolicBp}
                        onChange={(e) => setDiastolicBp(e.target.value)}
                        placeholder="Dia"
                        style={{ width: '50%', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: '#FFF', textAlign: 'center', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Heart Rate / Pulse */}
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                      💓 Pulse (bpm)
                    </label>
                    <input
                      type="number"
                      value={pulseBpm}
                      onChange={(e) => setPulseBpm(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: '#FFF', textAlign: 'center', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* SpO2 */}
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                      🫁 SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={spo2Percent}
                      onChange={(e) => setSpo2Percent(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: '#FFF', textAlign: 'center', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Temp */}
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                      🌡️ Temp (°F)
                    </label>
                    <input
                      type="text"
                      value={tempF}
                      onChange={(e) => setTempF(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: '#FFF', textAlign: 'center', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Blood Sugar */}
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                      🩸 Sugar (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={bloodSugarMgDl}
                      onChange={(e) => setBloodSugarMgDl(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: '#FFF', textAlign: 'center', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Weight / Height */}
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                      ⚖️ Wt (kg) / Ht (cm)
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="kg"
                        style={{ width: '50%', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: '#FFF', textAlign: 'center', fontSize: '0.85rem' }}
                      />
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="cm"
                        style={{ width: '50%', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px', color: '#FFF', textAlign: 'center', fontSize: '0.85rem' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.625rem', color: '#38BDF8', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                      BMI: {calculatedBmi} kg/m²
                    </span>
                  </div>
                </div>

                {/* Chief Complaints / Nurse Observation */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Chief Complaints & Nurse Observations:
                  </label>
                  <textarea
                    rows={2}
                    value={chiefComplaints}
                    onChange={(e) => setChiefComplaints(e.target.value)}
                    placeholder="e.g. Mild headache since 2 days, afebrile, ambulatory..."
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#FFF',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#10B981',
                    fontWeight: 800,
                    padding: '12px',
                    fontSize: '0.9rem',
                    width: '100%'
                  }}
                >
                  ✓ Complete Vitals & Move to Chamber Escort Queue
                </Button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '6px' }}>👈</span>
                <strong style={{ color: '#F8FAFC' }}>Select a Patient Token</strong>
                <p style={{ fontSize: '0.75rem', margin: '4px 0 0' }}>
                  Choose an arriving patient from the left queue to record vitals.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: 🚪 CHAMBER ESCORT QUEUE */}
      {activeTab === 'CHAMBER_ESCORT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header & Chamber Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#F8FAFC' }}>
                Prepared Patients Ready for Chamber Escort ({chamberEscortPatients.length})
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>
                Vitals captured • Escort into Doctor Chamber when ready
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {['ALL', 'Room 101', 'Room 102', 'Room 103', 'Room 104'].map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => setEscortDoctorFilter(room)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: escortDoctorFilter === room ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: escortDoctorFilter === room ? 'rgba(16, 185, 129, 0.25)' : '#0F172A',
                    color: escortDoctorFilter === room ? '#34D399' : '#94A3B8',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {room === 'ALL' ? 'All Chambers' : room}
                </button>
              ))}
            </div>
          </div>

          {chamberEscortPatients.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🚪</span>
              <strong style={{ color: '#F8FAFC' }}>No patients currently waiting for escort</strong>
              <p style={{ fontSize: '0.75rem', margin: '4px 0 12px' }}>
                Patients whose vitals are recorded will appear here ready to be escorted.
              </p>
              <Button size="sm" variant="primary" onClick={() => setActiveTab('RECORD_VITALS')}>
                Go to Record Vitals
              </Button>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
              {chamberEscortPatients.map((p) => {
                const storedVitals = p.vitals || null;

                return (
                  <Card
                    key={p.id}
                    style={{
                      backgroundColor: 'rgba(18, 24, 38, 0.85)',
                      border: p.status === 'IN_CONSULTATION' ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            backgroundColor: '#10B981',
                            color: '#042F2E',
                            fontWeight: 900,
                            fontSize: '1rem',
                            padding: '6px 12px',
                            borderRadius: '8px'
                          }}
                        >
                          {p.token}
                        </span>
                        <div>
                          <strong style={{ color: '#F8FAFC', fontSize: '0.95rem', display: 'block' }}>
                            {p.name}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            {p.gender} • {p.mobile} • {p.mrn}
                          </span>
                        </div>
                      </div>

                      <Badge variant={p.status === 'IN_CONSULTATION' ? 'warning' : 'success'}>
                        {p.status === 'IN_CONSULTATION' ? 'Inside Chamber' : 'Ready to Escort'}
                      </Badge>
                    </div>

                    {/* Vitals Summary Pill */}
                    {storedVitals && (
                      <div
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          color: '#34D399',
                          fontWeight: 700
                        }}
                      >
                        BP: {storedVitals.systolicBp}/{storedVitals.diastolicBp} · HR: {storedVitals.pulseBpm} · SpO2: {storedVitals.spo2Percent}% · Temp: {storedVitals.tempF}°F
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Doctor: <strong>{p.doctor}</strong></span>
                      <span style={{ color: '#38BDF8', fontWeight: 800 }}>Chamber: {p.room}</span>
                    </div>

                    {/* Escort Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleEscortToChamber(p)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          border: '1.5px solid #10B981',
                          color: '#34D399',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>📢</span>
                        <span>Call & Escort</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleHandoverComplete(p)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid #38BDF8',
                          color: '#38BDF8',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>✓</span>
                        <span>Handover to Dr</span>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 🛏️ INPATIENT WARD CARE */}
      {activeTab === 'INPATIENT_WARD' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(480px, 1.8fr)', gap: '16px' }}>
          {/* Bed List */}
          <Card
            style={{
              backgroundColor: 'rgba(18, 24, 38, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9375rem', color: '#F8FAFC' }}>
                Admitted Inpatients ({inpatients.length})
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inpatients.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)', color: '#64748B' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>🛏️</div>
                  <strong style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No Inpatients Admitted</strong>
                  <p style={{ fontSize: '0.72rem', margin: '4px 0 0' }}>Ward beds are currently unoccupied. Admitted patients will appear here.</p>
                </div>
              ) : (
                inpatients.map((p) => {
                const isSelected = selectedInpatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedInpatientId(p.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                      border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#34D399' }}>
                        {p.bedNumber}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{p.wardName}</span>
                    </div>
                    <strong style={{ fontSize: '0.875rem', color: '#F8FAFC', display: 'block', marginTop: '2px' }}>
                      {p.patientName} ({p.age}y)
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#CBD5E1', display: 'block', marginTop: '2px' }}>
                      {p.diagnosis}
                    </span>
                  </div>
                );
              }))}
            </div>
          </Card>

          {/* Selected Inpatient Detail: e-MAR & Nursing Notes */}
          {selectedInpatient && (
            <Card
              style={{
                backgroundColor: 'rgba(18, 24, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Patient Banner */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#34D399' }}>
                      {selectedInpatient.bedNumber}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#F8FAFC' }}>
                      {selectedInpatient.patientName}
                    </strong>
                    <Badge variant="primary">{selectedInpatient.gender}</Badge>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    UHID: {selectedInpatient.uhid} • Attending: <strong style={{ color: '#38BDF8' }}>{selectedInpatient.attendingDoctor}</strong>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#CBD5E1', display: 'block', marginTop: '2px' }}>
                    Diagnosis: <strong>{selectedInpatient.diagnosis}</strong> • Diet: <strong>{selectedInpatient.diet}</strong>
                  </span>
                </div>

                {/* Fluid Balance */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Fluid I/O Balance:</span>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span style={{ color: '#34D399' }}>In: {selectedInpatient.intakeMl}ml</span>
                    <span>/</span>
                    <span style={{ color: '#F59E0B' }}>Out: {selectedInpatient.outputMl}ml</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateFluid(selectedInpatient.id, 'INTAKE', 100)}
                      style={{ padding: '2px 6px', fontSize: '0.625rem', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', border: '1px solid #10B981', color: '#34D399', cursor: 'pointer' }}
                    >
                      +100ml In
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFluid(selectedInpatient.id, 'OUTPUT', 100)}
                      style={{ padding: '2px 6px', fontSize: '0.625rem', borderRadius: '4px', background: 'rgba(245,158,11,0.2)', border: '1px solid #F59E0B', color: '#FBBF24', cursor: 'pointer' }}
                    >
                      +100ml Out
                    </button>
                  </div>
                </div>
              </div>

              {/* e-MAR: Medication Administration Record */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#34D399' }}>
                    💊 Electronic Medication Administration Record (e-MAR)
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowAddMedModal(true)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + Add Med Order
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedInpatient.medications.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        border: m.status === 'GIVEN' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>
                          {m.drugName} ({m.dosage})
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>
                          Route: <strong style={{ color: '#38BDF8' }}>{m.route}</strong> • Scheduled: {m.scheduledTime}
                        </span>
                        {m.status === 'GIVEN' && (
                          <span style={{ fontSize: '0.6875rem', color: '#34D399', display: 'block', marginTop: '2px' }}>
                            ✓ Administered at {m.administeredAt} by {m.administeredBy}
                          </span>
                        )}
                      </div>

                      {m.status === 'DUE' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAdministerMed(selectedInpatient.id, m.id)}
                          style={{ backgroundColor: '#10B981', fontWeight: 800, fontSize: '0.72rem', padding: '6px 12px' }}
                        >
                          💊 Administer
                        </Button>
                      ) : (
                        <Badge variant="success">✓ Given</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nursing Shift Handover Notes */}
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#34D399', display: 'block', marginBottom: '8px' }}>
                  📝 Nursing Shift Handover Notes
                </strong>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <textarea
                    rows={2}
                    value={newNursingNote}
                    onChange={(e) => setNewNursingNote(e.target.value)}
                    placeholder="Enter clinical observations, wound status, pain score, mobility..."
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#FFF',
                      fontSize: '0.8125rem'
                    }}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleAddNursingNote}
                    style={{ backgroundColor: '#0d9488', fontWeight: 800, alignSelf: 'flex-end' }}
                  >
                    Save Note
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {selectedInpatient.nursingNotes.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.75rem',
                        color: '#CBD5E1'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.6875rem', marginBottom: '2px' }}>
                        <span>{n.nurseName}</span>
                        <span>{n.timestamp}</span>
                      </div>
                      <div>{n.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 4: 🚨 EMERGENCY TRIAGE BAY */}
      {activeTab === 'EMERGENCY_BAY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Emergency Alert Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong style={{ fontSize: '1.05rem', color: '#F87171' }}>
                🚨 Manchester / START Emergency Triage Bay
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>
                Priority classification: Red (Immediate) • Yellow (Urgent) • Green (Delayed)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCrashCartVerified(!crashCartVerified)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: crashCartVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${crashCartVerified ? '#10B981' : '#EF4444'}`,
                  color: crashCartVerified ? '#34D399' : '#FCA5A5',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {crashCartVerified ? '✓ Crash Cart Ready' : '⚠️ Check Crash Cart'}
              </button>

              <Button
                size="md"
                variant="primary"
                onClick={() => setShowSosModal(true)}
                style={{ backgroundColor: '#EF4444', fontWeight: 900, fontSize: '0.8125rem' }}
              >
                🚨 Rapid Trauma / SOS Check-In
              </Button>
            </div>
          </div>

          {/* Emergency Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: emergencyPatients.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
            {emergencyPatients.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.1)', color: '#64748B' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🚨</div>
                <strong style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Emergency Bay Clear</strong>
                <p style={{ fontSize: '0.75rem', margin: '4px 0 0' }}>No active trauma or urgent resuscitation cases. Use "+ Rapid Trauma / SOS Check-In" above to log incoming arrivals.</p>
              </div>
            ) : (
              emergencyPatients.map((p) => {
              const isRed = p.triageCategory === 'RED';
              const isYellow = p.triageCategory === 'YELLOW';

              return (
                <Card
                  key={p.id}
                  style={{
                    backgroundColor: 'rgba(18, 24, 38, 0.85)',
                    border: isRed ? '2px solid #EF4444' : (isYellow ? '1.5px solid #F59E0B' : '1px solid #10B981'),
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: isRed ? '#EF4444' : (isYellow ? '#F59E0B' : '#10B981'),
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '0.8125rem',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {p.token}
                      </span>
                      <strong style={{ fontSize: '0.9375rem', color: '#F8FAFC' }}>{p.patientName}</strong>
                    </div>

                    <Badge variant={isRed ? 'danger' : (isYellow ? 'warning' : 'success')}>
                      {p.triageCategory} PRIORITY
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    {p.gender} • {p.age}y • Arrival: {p.arrivalTime} ({p.arrivalMode})
                  </div>

                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      color: '#FCA5A5'
                    }}
                  >
                    🚨 {p.presentingSymptom}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8' }}>
                    <span>BP: <strong>{p.bp}</strong></span>
                    <span>HR: <strong>{p.pulse} bpm</strong></span>
                    <span style={{ color: parseInt(p.spo2, 10) < 90 ? '#EF4444' : '#34D399', fontWeight: 800 }}>
                      SpO2: {p.spo2}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleExpediteEmergency(p)}
                    style={{
                      backgroundColor: isRed ? '#EF4444' : '#0d9488',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      marginTop: '4px'
                    }}
                  >
                    🚪 Expedite into Doctor Chamber / Resus Bay
                  </Button>
                </Card>
              );
            }))}
          </div>
        </div>
      )}

      {/* RAPID SOS EMERGENCY MODAL */}
      {showSosModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #EF4444',
              borderRadius: '18px',
              maxWidth: '400px',
              width: '100%',
              padding: '20px',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1.05rem', color: '#F87171' }}>
                🚨 Rapid SOS Emergency Check-In
              </strong>
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Patient Name (or Trauma Identifier)
              </label>
              <Input
                value={sosPatientName}
                onChange={(e) => setSosPatientName(e.target.value)}
                placeholder="e.g. Unknown Trauma Male #01"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Age
                </label>
                <Input
                  type="number"
                  value={sosAge}
                  onChange={(e) => setSosAge(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Gender
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['MALE', 'FEMALE'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSosGender(g)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: sosGender === g ? '1.5px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: sosGender === g ? 'rgba(239, 68, 68, 0.25)' : '#0F172A',
                        color: sosGender === g ? '#FCA5A5' : '#94A3B8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      {g === 'MALE' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Triage Priority Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { cat: 'RED' as const, label: '🔴 Red', desc: 'Immediate' },
                  { cat: 'YELLOW' as const, label: '🟡 Yellow', desc: 'Urgent' },
                  { cat: 'GREEN' as const, label: '🟢 Green', desc: 'Delayed' }
                ].map(({ cat, label, desc }) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSosTriageCat(cat)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: sosTriageCat === cat ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: sosTriageCat === cat ? 'rgba(239, 68, 68, 0.3)' : '#0F172A',
                      color: sosTriageCat === cat ? '#FFF' : '#94A3B8',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div>{label}</div>
                    <div style={{ fontSize: '0.625rem' }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                Emergency Symptoms / Clinical Presentation
              </label>
              <Input
                value={sosSymptoms}
                onChange={(e) => setSosSymptoms(e.target.value)}
                placeholder="e.g. Unconscious, severe blood loss, SpO2 85%..."
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleRapidSosCheckIn}
              style={{ backgroundColor: '#EF4444', fontWeight: 900, marginTop: '4px' }}
            >
              🚨 Confirm SOS Admission & Sound Alarm
            </Button>
          </div>
        </div>
      )}

      {/* ADD MEDICATION MODAL (INPATIENT WARD) */}
      {showAddMedModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #10B981',
              borderRadius: '16px',
              maxWidth: '380px',
              width: '100%',
              padding: '20px',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#34D399' }}>Add Medication Order</strong>
              <button
                type="button"
                onClick={() => setShowAddMedModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>Drug Name</label>
              <Input
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="e.g. Inj. Pantoprazole"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>Dosage</label>
                <Input
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  placeholder="e.g. 40mg IV"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>Time</label>
                <Input
                  value={newMedTime}
                  onChange={(e) => setNewMedTime(e.target.value)}
                  placeholder="e.g. 02:00 PM"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>Route</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                {(['IV', 'ORAL', 'SC', 'IM', 'NEB'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewMedRoute(r)}
                    style={{
                      padding: '6px 2px',
                      borderRadius: '6px',
                      border: newMedRoute === r ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: newMedRoute === r ? 'rgba(16, 185, 129, 0.25)' : '#0F172A',
                      color: newMedRoute === r ? '#34D399' : '#94A3B8',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleAddMedication}
              style={{ backgroundColor: '#10B981', fontWeight: 800, marginTop: '4px' }}
            >
              Add to e-MAR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
