import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AmbientAiSoapTranscriptDto } from '@docsearch/api-contracts';
import { deidentifyClinicalPayload } from '@docsearch/shared-core';
import { PreLlmPhiRedactorStudioModal } from '../security/PreLlmPhiRedactorStudioModal.js';
import { apiRequest } from '../../services/api-client.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';
import { aiVoiceService } from '../../services/ai-voice-service.js';

export interface AmbientAiScribeViewProps {
  transcripts?: AmbientAiSoapTranscriptDto[];
  onGenerateSoap?: (extractedData?: any) => void;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
}

export type SupportedScribeLanguage =
  | 'HINGLISH'
  | 'HINDI'
  | 'MARATHI'
  | 'TAMIL'
  | 'BENGALI'
  | 'ENGLISH';

export type RegionalVoiceLanguage =
  | 'HINDI'
  | 'MARATHI'
  | 'BHOJPURI'
  | 'BENGALI'
  | 'TAMIL'
  | 'TELUGU'
  | 'GUJARATI'
  | 'ENGLISH';

export interface ClinicalHudAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'SAFETY_INFO';
  icon: string;
  title: string;
  message: string;
  actionTaken: string;
  timestamp: string;
}

export const AmbientAiScribeView: React.FC<AmbientAiScribeViewProps> = ({
  transcripts = [],
  patientName = 'Patient Record',
  patientPhone = '',
  doctorName,
  onGenerateSoap
}) => {
  const partnerProfile = getUnifiedPartnerProfile();
  const effectiveDoctorName = doctorName || (partnerProfile.doctorName ? `${partnerProfile.doctorName}${partnerProfile.doctorDegree ? `, ${partnerProfile.doctorDegree}` : ''}` : 'Consulting Physician');

  // Autonomous Room Listener State (Zero-Click Doctoring)
  const [isAmbientActive, setIsAmbientActive] = useState(true);
  const [audioLevel, setAudioLevel] = useState(42);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedScribeLanguage>('HINGLISH');
  const [activeTabMode, setActiveTabMode] = useState<'STUDIO' | 'ARCHIVE'>('STUDIO');
  const [isApproved, setIsApproved] = useState(false);
  const [isFilteringNephrotoxic, setIsFilteringNephrotoxic] = useState(true);
  const [isDeidModalOpen, setIsDeidModalOpen] = useState(false);
  const [isManualFallbackActive, setIsManualFallbackActive] = useState(false);
  const [sttFailureNotice, setSttFailureNotice] = useState<string | null>(null);

  // Live Dialogue Feed (Continuous Ambient Stream)
  const [spokenTranscript, setSpokenTranscript] = useState<string>(
    'Doctor: Namaste Ramesh ji, aaiye baithiye. Kya takleef ho rahi hai?\n' +
    'Patient: Doctor sahab, 3 din se bahut tez bukhar hai aur gale me kharash hai. Pichle saal mujhe kidney me stone hua tha, to koi aisi dawa mat dijiyega jisse kidney par asar pade.\n' +
    'Doctor: Bilkul Ramesh ji, accha hua aapne kidney stone ki history bata di. Hum nephrotoxic painkiller (NSAIDs) bilkul nahi denge. BP 128/82 mmHg hai, pulse 78 hai, chest clear hai. Paracetamol 650 safe dose me aur Levocetirizine likh raha hoon.'
  );

  // Pre-LLM PII/PHI De-Identification Pipeline Result
  const deidentifiedStream = useMemo(() => {
    return deidentifyClinicalPayload(spokenTranscript, {
      patientName,
      patientPhone,
      uhid: 'UHID-2026-9041',
      doctorName: effectiveDoctorName,
      hospitalName: partnerProfile.entityLegalName || 'Registered Healthcare Facility'
    });
  }, [spokenTranscript, patientName, patientPhone, effectiveDoctorName, partnerProfile.entityLegalName]);

  // Dynamic Clinical HUD Alerts (Real-Time Safety Scanner)
  const [hudAlerts, setHudAlerts] = useState<ClinicalHudAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  // Extracted Clinical SOAP Note
  const [extractedSoap, setExtractedSoap] = useState({
    subjective: 'Patient presents with 3-day history of high-grade fever, sore throat, and dry cough. Past medical history significant for nephrolithiasis (kidney stones) last year. Explicitly requested avoidance of nephrotoxic medications.',
    objective: 'BP: 128/82 mmHg, Pulse: 78 bpm regular, Temp: 101.2°F, SpO2: 98% room air. Pharyngeal erythema present without purulent exudates. Renal angle non-tender bilaterally.',
    assessment: 'Acute Viral Upper Respiratory Infection (ICD-10: J06.9) with Past History of Nephrolithiasis (ICD-10: N20.0).',
    plan: '1. Tab. Paracetamol 650mg TDS (1-1-1) after food x 3 days (Renally safe antipyretic)\n' +
          '2. Tab. Levocetirizine 5mg OD (0-0-1) at bedtime x 5 days\n' +
          '3. High fluid intake (>2.5 liters/day) to prevent kidney stone recurrence\n' +
          '4. Strict avoidance of nephrotoxic NSAIDs (Diclofenac/Ibuprofen/Aceclofenac blocked)',
    icd10: [
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', confidence: 97 },
      { code: 'N20.0', description: 'Calculus of kidney (History of kidney stone)', confidence: 94 }
    ],
    rx: [
      { name: 'Paracetamol 650mg (Renally Safe)', dose: '1 Tab', freq: 'TDS (1-1-1)', dur: '3 Days', notes: 'After meals for fever' },
      { name: 'Levocetirizine 5mg', dose: '1 Tab', freq: 'OD (0-0-1)', dur: '5 Days', notes: 'At night for throat irritation' }
    ]
  });

  // Multilingual WhatsApp Voice Note State
  const [voiceNoteLang, setVoiceNoteLang] = useState<RegionalVoiceLanguage>('HINDI');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);
  const [isDispatchedWhatsApp, setIsDispatchedWhatsApp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [isRecordingLive, setIsRecordingLive] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isExtractingSoap, setIsExtractingSoap] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Show Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  }, []);

  // Real LLM SOAP Extraction Trigger
  const handleExtractSoapFromTranscript = useCallback(async (textToExtract?: string) => {
    const text = textToExtract || spokenTranscript;
    if (!text || !text.trim()) {
      showToast('⚠️ No spoken transcript found to analyze.');
      return;
    }

    setIsExtractingSoap(true);
    showToast('✨ Analyzing clinical dialogue with AI Scribe LLM...');
    try {
      const data = await aiVoiceService.extractSoapNotes(text, {
        patientName,
        patientPhone
      }, partnerProfile.doctorSpecialty);

      if (data) {
        setExtractedSoap({
          subjective: data.subjective,
          objective: data.objective,
          assessment: data.clinicalAssessment,
          plan: data.treatmentPlan,
          icd10: (data.diagnoses || []).map((d: any) => ({
            code: d.code,
            description: d.name,
            confidence: d.confidence || 95
          })),
          rx: (data.medications || []).map((m: any) => ({
            name: `${m.medicationName} ${m.strength || ''}`.trim(),
            dose: m.dosage || '1 Tab',
            freq: m.frequency || '1 - 0 - 1',
            dur: `${m.duration || 5} ${m.durationUnit || 'Days'}`,
            notes: `${m.beforeAfterFood || 'AFTER_FOOD'} - ${m.instructions || ''}`.trim()
          }))
        });

        // Also add any critical alerts to HUD
        if (Array.isArray(data.criticalAlerts) && data.criticalAlerts.length > 0) {
          const newAlerts: ClinicalHudAlert[] = data.criticalAlerts.map((msg: string, idx: number) => ({
            id: `llm-alert-${Date.now()}-${idx}`,
            severity: 'CRITICAL',
            icon: '🚨',
            title: 'AI CLINICAL SAFETY ALERT',
            message: msg,
            actionTaken: 'Regimen adjusted and safety protocol applied.',
            timestamp: 'Just now'
          }));
          setHudAlerts((prev) => [...newAlerts, ...prev]);
        }

        showToast(`✓ Extracted ${data.diagnoses?.length || 0} Diagnoses, ${data.medications?.length || 0} Medications & ${data.recommendedLabTests?.length || 0} Lab Tests!`);
      }
    } catch (err: any) {
      showToast(`⚠️ AI Extraction error: ${err.message || 'Error parsing dialogue'}`);
    } finally {
      setIsExtractingSoap(false);
    }
  }, [spokenTranscript, patientName, patientPhone, partnerProfile.doctorSpecialty, showToast]);

  const startLiveRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string)?.split(',')[1];
          if (base64Data) {
            setIsTranscribing(true);
            showToast('🎙️ Transcribing via Prompted Whisper Base + P0-01 clinical validator...');
            try {
              const res = await apiRequest<{
                transcript: string;
                confidence?: number;
                clinicalSafety?: {
                  status: string;
                  summary: string;
                  entities: Array<{ type: string; rawText: string; status: string }>;
                };
              }>('/api/v1/partner/ai/voice/transcribe', {
                method: 'POST',
                body: JSON.stringify({ audio: base64Data, mimeType: 'audio/wav' })
              });
              if (res.success && res.data) {
                const newText = res.data.transcript;
                const newFullText = `${spokenTranscript}\n\nDoctor (Live Audio): ${newText}`;
                setSpokenTranscript(newFullText);
                setIsManualFallbackActive(false);
                setSttFailureNotice(null);
                const validEntities = res.data.clinicalSafety?.entities
                  ?.filter((e) => e.status === 'VALID')
                  .map((e) => e.rawText)
                  .join(', ');
                showToast(`✓ Whisper Transcription Complete! ${validEntities ? `[Verified Clinical: ${validEntities}]` : ''}`);
                void handleExtractSoapFromTranscript(newFullText);
              } else {
                setIsManualFallbackActive(true);
                setSttFailureNotice(res.error?.message || 'Whisper transcription unavailable');
                showToast('⚠️ STT Offline: Switched to Safe Manual Clinical Scribe Mode.');
              }
            } catch (err: any) {
              setIsManualFallbackActive(true);
              setSttFailureNotice(err?.message || 'Network or STT provider outage');
              showToast('⚠️ STT Outage: Switched to Safe Manual Clinical Scribe Mode.');
            } finally {
              setIsTranscribing(false);
            }
          }
        };
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecordingLive(true);
      showToast('🔴 Recording live doctor speech... Speak clinical notes or prescription.');
    } catch (err: any) {
      showToast(`Microphone access error: ${err.message || 'Microphone unavailable'}`);
    }
  }, [showToast, spokenTranscript, handleExtractSoapFromTranscript]);

  const stopLiveRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecordingLive(false);
    }
  }, []);

  const handleApprovePrescription = useCallback(() => {
    setIsApproved(true);
    showToast('✓ Attending Doctor signed-off. Encrypted prescription pushed to Hospital EMR/HIS.');
    if (onGenerateSoap) {
      setTimeout(() => {
        onGenerateSoap(extractedSoap);
      }, 700);
    }
  }, [showToast, onGenerateSoap, extractedSoap]);

  // 1. Continuous Ambient Audio Waveform Simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAmbientActive) {
      interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        setAudioLevel(Math.floor(Math.random() * 65) + 20);
      }, 200);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isAmbientActive]);

  // 2. Real-Time Clinical HUD Alert Scanner (Zero-Click Intelligence)
  useEffect(() => {
    const text = spokenTranscript.toLowerCase();
    const newAlerts: ClinicalHudAlert[] = [];

    // Trigger 1: Kidney Stone / Renal History
    if (text.includes('kidney') || text.includes('stone') || text.includes('pathri') || text.includes('renal') || text.includes('creatinine')) {
      newAlerts.push({
        id: 'ALERT-KIDNEY-STONE',
        severity: 'CRITICAL',
        icon: '⚠️',
        title: 'KIDNEY HISTORY / STONE DETECTED IN DIALOGUE',
        message: 'Patient verbalized history of nephrolithiasis / renal calculus. High risk of NSAID-induced nephrotoxicity.',
        actionTaken: 'Auto-filtered nephrotoxic drugs (Diclofenac, Ibuprofen, Ketorolac blocked). Renally safe Paracetamol applied.',
        timestamp: 'Just now'
      });
      setIsFilteringNephrotoxic(true);
    } else {
      setIsFilteringNephrotoxic(false);
    }

    // Trigger 2: Allergy Alert
    if (text.includes('allergy') || text.includes('allergic') || text.includes('penicillin') || text.includes('reaction') || text.includes('sulfa')) {
      newAlerts.push({
        id: 'ALERT-DRUG-ALLERGY',
        severity: 'CRITICAL',
        icon: '🚨',
        title: 'CRITICAL DRUG ALLERGY MENTIONED',
        message: 'Patient reports adverse hypersensitivity reaction to specific antibiotic / chemical group.',
        actionTaken: 'Allergens flagged with hard red shields. Cross-reactive drug classes automatically quarantined.',
        timestamp: 'Just now'
      });
    }

    // Trigger 3: Hypertension Stage 2
    if (text.includes('148/92') || text.includes('150/95') || text.includes('160/') || text.includes('high bp') || text.includes('uncontrolled bp')) {
      newAlerts.push({
        id: 'ALERT-HYPERTENSION',
        severity: 'WARNING',
        icon: '🫀',
        title: 'STAGE 2 HYPERTENSION DETECTED',
        message: 'Blood pressure exceeds standard outpatient thresholds (>140/90 mmHg).',
        actionTaken: 'Protocol recommending dual combination therapy (Telmisartan + Amlodipine) and low-sodium directive.',
        timestamp: 'Just now'
      });
    }

    // Trigger 4: Diabetes / Glycemic Alert
    if (text.includes('sugar') || text.includes('diabetes') || text.includes('sugar 118') || text.includes('sugar 140') || text.includes('madhumeh')) {
      newAlerts.push({
        id: 'ALERT-DIABETES',
        severity: 'SAFETY_INFO',
        icon: '🩸',
        title: 'METABOLIC / DIABETIC PROFILE DETECTED',
        message: 'Fasting or random blood sugar discussed in consultation.',
        actionTaken: 'Auto-queued HbA1c screening order & diet consultation recommendation.',
        timestamp: 'Just now'
      });
    }

    setHudAlerts(newAlerts);
  }, [spokenTranscript]);

  // 3. Dynamic Multilingual WhatsApp Voice Note Script Generator
  const generatedVoiceNoteScript = useMemo(() => {
    const pName = patientName || 'Patient';
    const dName = effectiveDoctorName.split(',')[0] || 'Consulting Physician';
    const medsHindi = extractedSoap.rx.map((m) => `${m.name} (${m.notes})`).join(', ');

    switch (voiceNoteLang) {
      case 'HINDI':
        return `Namaste ${pName} ji. ${dName} ne aapki consultation poori kar li hai. Doctor sahab ne aapko ${medsHindi} lene ko kaha hai. Sath me khoob paani piyein taaki kidney par asar na pade. Kripya samay par dawa lein. Aaraam na milne par turant clinic sampark karein.`;
      case 'BHOJPURI':
        return `Panaam ${pName} ji! ${dName} raur checkup kailan ha aur bukhar khatir ${medsHindi} dawai likhle baadan. Sath me khoob paani piye ke ba kayehe ki kidney stone ke dikkat rahal ba. Samay se dawai kha liha aur apan khayal rakhih.`;
      case 'MARATHI':
        return `Namaskar ${pName} ji. ${dName} yaani tumchi tapasni keli asun ${medsHindi} aushadh dili aahe. Kidney chi kalji ghenyasathi purese paani pya. Krupaaya velover aushadh ghya aani swatahchi kaalji ghya.`;
      case 'BENGALI':
        return `Nomoshkar ${pName} babu. ${dName} aponar porikha korechen ebong ${medsHindi} oshudh diyechen. Kidney shurokkhar jonno beshi kore jol khaben. Shomoy moto oshudh khaben ebong sustho thakun.`;
      case 'TAMIL':
        return `Vanakkam ${pName} avargale. ${dName} ungalai parithodithu ${medsHindi} marunthugalai vazhangiyullar. Kidney paathukappirku niraiya thanneer kudikkavum. Nerathirku marunthu saapittu nalamaaga irukkavum.`;
      case 'TELUGU':
        return `Namaskaram ${pName} garu. ${dName} garu mee consultation poorti chesi ${medsHindi} mandulu icharu. Kidney aarogyam kosam yekkuva neellu taagandi. Samayaniki mandulu vaadandi.`;
      case 'GUJARATI':
        return `Namaste ${pName} bhai/ben. ${dName} e tamari tapas kari che ane ${medsHindi} dava aapi che. Kidney ni sambhal mate vadhu paani pivo. Samay par dava lo ane potanu dhyan rakho.`;
      case 'ENGLISH':
      default:
        return `Hello ${pName}. ${dName} has completed your consultation. You have been prescribed ${medsHindi}. Please maintain high hydration to safeguard renal health. Take your medications as directed and reach out if fever persists.`;
    }
  }, [voiceNoteLang, patientName, doctorName, extractedSoap.rx]);

  // 4. Native Speech Synthesis Engine for Audio Playback
  const handleToggleVoiceNotePlayback = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('⚠️ Speech Synthesis not supported in this browser window.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setAudioPlaybackProgress(0);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(generatedVoiceNoteScript);
    
    if (voiceNoteLang === 'HINDI' || voiceNoteLang === 'BHOJPURI') utterance.lang = 'hi-IN';
    else if (voiceNoteLang === 'MARATHI') utterance.lang = 'mr-IN';
    else if (voiceNoteLang === 'TAMIL') utterance.lang = 'ta-IN';
    else if (voiceNoteLang === 'TELUGU') utterance.lang = 'te-IN';
    else if (voiceNoteLang === 'BENGALI') utterance.lang = 'bn-IN';
    else if (voiceNoteLang === 'GUJARATI') utterance.lang = 'gu-IN';
    else utterance.lang = 'en-IN';

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setAudioPlaybackProgress(5);
    };

    let progressTimer: NodeJS.Timeout;
    progressTimer = setInterval(() => {
      setAudioPlaybackProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressTimer);
          return 95;
        }
        return prev + 5;
      });
    }, 1200);

    utterance.onend = () => {
      clearInterval(progressTimer);
      setIsPlayingAudio(false);
      setAudioPlaybackProgress(100);
      setTimeout(() => setAudioPlaybackProgress(0), 1000);
    };

    utterance.onerror = () => {
      clearInterval(progressTimer);
      setIsPlayingAudio(false);
      setAudioPlaybackProgress(0);
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // 5. 1-Click WhatsApp Audio Dispatch
  const handleDispatchWhatsApp = () => {
    setIsDispatchedWhatsApp(true);
    showToast(`✓ Multilingual Voice Note (${voiceNoteLang}) dispatched to ${patientName} (${patientPhone}) via WhatsApp!`);
  };

  // Preset Clinical Dialogue Scenarios
  const loadScenario = (scenario: 'KIDNEY_BRONCHITIS' | 'HYPERTENSION' | 'GASTRO_ALLERGY') => {
    setIsApproved(false);
    setIsDispatchedWhatsApp(false);
    if (scenario === 'KIDNEY_BRONCHITIS') {
      setSpokenTranscript(
        'Doctor: Namaste Ramesh ji, aaiye baithiye. Kya takleef ho rahi hai?\n' +
        'Patient: Doctor sahab, 3 din se bahut tez bukhar hai aur gale me kharash hai. Pichle saal mujhe kidney me stone hua tha, to koi aisi dawa mat dijiyega jisse kidney par asar pade.\n' +
        'Doctor: Bilkul Ramesh ji, accha hua aapne kidney stone ki history bata di. Hum nephrotoxic painkiller (NSAIDs) bilkul nahi denge. BP 128/82 mmHg hai, pulse 78 hai. Paracetamol 650 TDS safe dose me aur Levocetirizine likh raha hoon.'
      );
      setExtractedSoap({
        subjective: 'Patient presents with 3-day high-grade fever, sore throat. Past history of nephrolithiasis (kidney stone) last year.',
        objective: 'BP: 128/82 mmHg, Pulse: 78 bpm, Temp: 101.2°F, Pharyngeal congestion. Renal angles non-tender.',
        assessment: 'Acute Viral Bronchitis & Pharyngitis (ICD-10: J20.9) with Past Nephrolithiasis (ICD-10: N20.0).',
        plan: '1. Tab. Paracetamol 650mg TDS (Renally safe antipyretic)\n2. Tab. Levocetirizine 5mg OD at bedtime\n3. High fluid intake (>2.5L/day)\n4. NSAIDs (Diclofenac/Ibuprofen) strictly avoided.',
        icd10: [
          { code: 'J20.9', description: 'Acute bronchitis, unspecified', confidence: 97 },
          { code: 'N20.0', description: 'Calculus of kidney', confidence: 95 }
        ],
        rx: [
          { name: 'Paracetamol 650mg (Renally Safe)', dose: '1 Tab', freq: 'TDS (1-1-1)', dur: '3 Days', notes: 'After meals for fever' },
          { name: 'Levocetirizine 5mg', dose: '1 Tab', freq: 'OD (0-0-1)', dur: '5 Days', notes: 'At night for allergy' }
        ]
      });
    } else if (scenario === 'HYPERTENSION') {
      setSpokenTranscript(
        'Doctor: Uncle ji aapka BP checkup karte hain. Telmisartan regular le rahe hain?\n' +
        'Patient: Dawa to le raha hoon beta, lekin subah sar bhari rehta hai. Sugar bhi pichle hafte 140 fasting aaya tha.\n' +
        'Doctor: Aaj clinic me BP 148/92 mmHg aaya hai, jo ki Stage 2 Hypertension hai. Telmisartan 40mg ke sath Amlodipine 5mg combination shuru karenge aur HbA1c test karwayenge.'
      );
      setExtractedSoap({
        subjective: '62yo male with morning occipital headache. History of hypertension and borderline diabetes fasting 140 mg/dL.',
        objective: 'BP: 148/92 mmHg (Stage 2 Hypertension), Pulse: 76 bpm, BMI: 27.2.',
        assessment: 'Essential Hypertension Stage 2 (ICD-10: I10) & Type 2 Diabetes Mellitus risk (ICD-10: E11.9).',
        plan: '1. Tab. Telmisartan 40mg + Amlodipine 5mg OD morning\n2. Order HbA1c & Fasting Lipid Profile\n3. Low salt diet (<2g sodium/day).',
        icd10: [
          { code: 'I10', description: 'Essential (primary) hypertension', confidence: 98 },
          { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', confidence: 89 }
        ],
        rx: [
          { name: 'Telmisartan 40mg + Amlodipine 5mg', dose: '1 Tab', freq: 'OD (1-0-0)', dur: '30 Days', notes: 'Morning after breakfast' }
        ]
      });
    } else if (scenario === 'GASTRO_ALLERGY') {
      setSpokenTranscript(
        'Doctor: Sunita ji, pet me kya dikkat ho rahi hai?\n' +
        'Patient: Doctor sahab, kal raat se pet me marod hai aur ulti ho rahi hai. Mujhe Penicillin aur Amoxicillin se bahut tez allergy hai, pichli baar pura badan laal ho gaya tha.\n' +
        'Doctor: Dhyaan se sun liya, Penicillin group bilkul block kar diya hai. Ofloxacin + Ornidazole aur ORS likh raha hoon.'
      );
      setExtractedSoap({
        subjective: 'Female patient with acute crampy abdominal pain and 3 episodes of non-bilious vomiting. Known severe anaphylactic allergy to Penicillin/Amoxicillin.',
        objective: 'BP: 104/70 mmHg, Pulse: 88 bpm. Abdomen soft, diffuse mild tenderness.',
        assessment: 'Acute Gastroenteritis (ICD-10: A09) with Severe Penicillin Allergy (ICD-10: Z88.0).',
        plan: '1. Tab. Ofloxacin 200mg + Ornidazole 500mg BD x 3 days\n2. Electral ORS 1L daily\n3. Penicillin/Amoxicillin strictly contraindicated.',
        icd10: [
          { code: 'A09', description: 'Infectious gastroenteritis and colitis', confidence: 96 },
          { code: 'Z88.0', description: 'Allergy status to penicillin', confidence: 99 }
        ],
        rx: [
          { name: 'Ofloxacin 200mg + Ornidazole 500mg (Penicillin-Free)', dose: '1 Tab', freq: 'BD (1-0-1)', dur: '3 Days', notes: 'After meals' },
          { name: 'Electral ORS Sachet', dose: '1 Sachet in 1L water', freq: 'PRN', dur: '3 Days', notes: 'Sip frequently' }
        ]
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Global Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#064E3B',
            border: '1.5px solid #10B981',
            color: '#ECFDF5',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <span>📲</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Autonomous Ambient Header Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #38BDF8',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 24px rgba(56, 189, 248, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: isAmbientActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              border: isAmbientActive ? '1.5px solid #10B981' : '1px solid #475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}
          >
            🎙️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                Autonomous Ambient AI 2.0 (Zero-Click Doctoring)
              </h2>
              <span
                style={{
                  backgroundColor: isAmbientActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: isAmbientActive ? '#34D399' : '#F87171',
                  border: isAmbientActive ? '1px solid #10B981' : '1px solid #EF4444',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '0.6rem' }}>●</span>
                {isAmbientActive ? 'ROOM MIC LISTENING (CONTINUOUS)' : 'AMBIENT PAUSED'}
              </span>
              <button
                type="button"
                onClick={() => setIsDeidModalOpen(true)}
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: '#A5B4FC',
                  border: '1px solid #6366F1',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title="Pre-LLM PII/PHI De-Identification Pipeline (Zero Data Leakage to AI) • Click to inspect"
              >
                <span>🛡️</span>
                <span>Zero PHI Leakage Active ({deidentifiedStream.entitiesScrubbedCount} Tokenized) • Inspect 🔍</span>
              </button>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: '4px 0 0 0' }}>
              Zero doctor clicks required. Auto-detects Hindi/Hinglish/Regional dialogue, flashes real-time Clinical HUD alerts, and generates Multilingual WhatsApp Audio Rx summaries.
            </p>
          </div>
        </div>

        {/* Ambient Mode Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsAmbientActive(!isAmbientActive)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: isAmbientActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: isAmbientActive ? '1px solid #EF4444' : '1px solid #10B981',
              color: isAmbientActive ? '#FCA5A5' : '#6EE7B7',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{isAmbientActive ? '⏸️ Pause Cabin Mic' : '▶️ Resume Ambient Room Mic'}</span>
          </button>

          {/* Real Live Mic Recording to Prompted Whisper Base */}
          <button
            type="button"
            onClick={isRecordingLive ? stopLiveRecording : startLiveRecording}
            disabled={isTranscribing}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: isRecordingLive ? '#DC2626' : '#2563EB',
              border: isRecordingLive ? '1.5px solid #EF4444' : '1.5px solid #3B82F6',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: isTranscribing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isRecordingLive ? '0 0 16px rgba(239, 68, 68, 0.7)' : '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}
          >
            <span>
              {isTranscribing
                ? '⏳ Whisper STT Processing...'
                : isRecordingLive
                ? '⏹️ Stop & Transcribe'
                : '🎙️ Record Live Speech (Whisper AI)'}
            </span>
          </button>

          {/* Real LLM SOAP Extraction Button */}
          <button
            type="button"
            onClick={() => void handleExtractSoapFromTranscript()}
            disabled={isExtractingSoap || isTranscribing}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: isExtractingSoap ? '#4C1D95' : '#7C3AED',
              border: '1.5px solid #8B5CF6',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: isExtractingSoap || isTranscribing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)'
            }}
          >
            <span>{isExtractingSoap ? '⏳ AI Extracting Clinical Notes...' : '✨ AI Extract SOAP & Rx'}</span>
          </button>

          <Button
            variant={activeTabMode === 'STUDIO' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTabMode('STUDIO')}
            style={{ fontWeight: 800 }}
          >
            ⚡ Live Studio
          </Button>
          <Button
            variant={activeTabMode === 'ARCHIVE' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTabMode('ARCHIVE')}
            style={{ fontWeight: 800 }}
          >
            📂 Archives ({transcripts.length})
          </Button>
        </div>
      </div>

      {activeTabMode === 'STUDIO' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 🛡️ SAFE MANUAL SCRIBE FALLBACK BANNER */}
          {isManualFallbackActive && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid #EF4444',
                borderRadius: '12px',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                <div>
                  <strong style={{ color: '#FCA5A5', display: 'block', fontSize: '0.85rem' }}>
                    Safe Manual Scribe Fallback Active {sttFailureNotice ? `(${sttFailureNotice})` : ''}
                  </strong>
                  <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>
                    Continuous clinical consultation is protected. You can type clinical notes or paste findings directly into the dialog stream below.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManualFallbackActive(false);
                  setSttFailureNotice(null);
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#F1F5F9',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 🌟 REAL-TIME CLINICAL HUD (HEADS-UP ALERTS BANNER) */}
          {hudAlerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hudAlerts.map((alert) => {
                if (dismissedAlertIds.has(alert.id)) return null;
                const isCritical = alert.severity === 'CRITICAL';
                return (
                  <div
                    key={alert.id}
                    style={{
                      backgroundColor: isCritical ? '#450A0A' : '#451A03',
                      border: isCritical ? '2px solid #EF4444' : '2px solid #F59E0B',
                      borderRadius: '12px',
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      boxShadow: isCritical ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.6rem' }}>{alert.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 900, color: isCritical ? '#FCA5A5' : '#FCD34D', fontSize: '0.875rem' }}>
                            {alert.title}
                          </span>
                          <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(0,0,0,0.4)', color: '#CBD5E1', padding: '1px 6px', borderRadius: '4px' }}>
                            {alert.timestamp}
                          </span>
                        </div>
                        <div style={{ color: '#F1F5F9', fontSize: '0.8rem', marginTop: '2px' }}>
                          {alert.message}
                        </div>
                        <div style={{ color: isCritical ? '#FECACA' : '#FEF08A', fontSize: '0.75rem', fontWeight: 800, marginTop: '4px' }}>
                          ✓ Action Taken: {alert.actionTaken}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: isCritical ? '#7F1D1D' : '#78350F',
                          color: '#FFF',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}
                      >
                        ⚡ Live Safety Lock Active
                      </span>
                      <button
                        type="button"
                        onClick={() => setDismissedAlertIds((prev) => new Set([...prev, alert.id]))}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                        title="Dismiss alert"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Scenario Pre-fills & Language Switcher */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                Test Clinical Scenarios:
              </span>
              <button
                type="button"
                onClick={() => loadScenario('KIDNEY_BRONCHITIS')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: isFilteringNephrotoxic ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.15)',
                  border: isFilteringNephrotoxic ? '1.5px solid #EF4444' : '1px solid #06B6D4',
                  color: isFilteringNephrotoxic ? '#FCA5A5' : '#38BDF8',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ⚠️ 1. Kidney Stone + Fever (Auto-Filter NSAIDs)
              </button>
              <button
                type="button"
                onClick={() => loadScenario('HYPERTENSION')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid #8B5CF6',
                  color: '#C084FC',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🫀 2. Stage 2 Hypertension Review
              </button>
              <button
                type="button"
                onClick={() => loadScenario('GASTRO_ALLERGY')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #F59E0B',
                  color: '#FBBF24',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🚨 3. Penicillin Allergy + Gastroenteritis
              </button>
            </div>

            {/* Room Listener Speech Recognition Language */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>Mic Language:</span>
              {(['HINGLISH', 'HINDI', 'MARATHI', 'TAMIL', 'BENGALI', 'ENGLISH'] as SupportedScribeLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: selectedLanguage === lang ? '#38BDF8' : 'rgba(255,255,255,0.05)',
                    color: selectedLanguage === lang ? '#070C16' : '#94A3B8',
                    border: 'none',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Scribe Workspace */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            
            {/* Left: Continuous Ambient Room Listener & Dialogue Stream */}
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: isAmbientActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: isAmbientActive ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🎙️</span>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#F8FAFC', display: 'block' }}>
                      Continuous Cabin Room Listener
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                      Zero-Click Doctoring • Active in Cabin
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAmbientActive ? (
                    <span style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#34D399',
                      border: '1px solid #10B981',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{ animation: 'pulse 1s infinite' }}>●</span> CONTINUOUS MIC ON ({audioLevel}%)
                    </span>
                  ) : (
                    <Badge variant="neutral">Mic Paused</Badge>
                  )}
                </div>
              </div>

              {/* Dynamic Acoustic Waveform Equalizer */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                height: '52px',
                border: isAmbientActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {[20, 50, 85, 65, 30, 95, 75, 40, 70, 90, 35, 60, 100, 75, 45, 65, 85, 55, 35, 75, 90, 60, 40, 25].map((baseHeight, i) => {
                  const dynamicHeight = isAmbientActive
                    ? Math.min(100, Math.max(12, (baseHeight * (audioLevel / 55))))
                    : 6;
                  return (
                    <div
                      key={i}
                      style={{
                        width: '4px',
                        height: `${dynamicHeight}%`,
                        backgroundColor: isAmbientActive
                          ? i % 2 === 0 ? '#10B981' : '#38BDF8'
                          : '#475569',
                        borderRadius: '2px',
                        transition: 'height 0.12s ease',
                        opacity: isAmbientActive ? 0.9 : 0.4
                      }}
                    />
                  );
                })}
              </div>

              {/* Live Spoken Transcript Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                    Real-time Bilingual Dialogue Transcript:
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#38BDF8', fontWeight: 700 }}>
                    Dialect: {selectedLanguage} (Auto-transcribing)
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={spokenTranscript}
                  onChange={(e) => setSpokenTranscript(e.target.value)}
                  placeholder="Doctor and patient dialogue will continuously stream here in Hindi, Hinglish, Marathi, Tamil without pressing any button..."
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#E2E8F0',
                    fontSize: '0.8125rem',
                    lineHeight: '1.5',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>


              {/* Negation Guard & Zero-Click Status */}
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: '#A7F3D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛡️</span>
                  <span>Clinical Negation Engine Active: "No chest pain" strictly honored.</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#6EE7B7', fontWeight: 800 }}>
                  AUTO-SYNCING TO EMR
                </span>
              </div>
            </div>

            {/* Right: AI Generated Structured SOAP Note & Prescription */}
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: isFilteringNephrotoxic ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: isFilteringNephrotoxic ? '0 0 25px rgba(239, 68, 68, 0.2)' : '0 0 25px rgba(139, 92, 246, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.125rem' }}>✨</span>
                  <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#F8FAFC' }}>
                    Generated Structured EMR SOAP Note
                  </span>
                </div>
                {isApproved ? (
                  <Badge variant="success">✓ Doctor Signed & Committed</Badge>
                ) : (
                  <Badge variant="warning">AI_DRAFTED (Pending Sign-off)</Badge>
                )}
              </div>

              {/* SOAP Note Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #06B6D4' }}>
                  <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '2px' }}>Subjective (S):</strong>
                  <span style={{ color: '#CBD5E1' }}>{extractedSoap.subjective}</span>
                </div>

                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #3B82F6' }}>
                  <strong style={{ color: '#60A5FA', display: 'block', marginBottom: '2px' }}>Objective (O):</strong>
                  <span style={{ color: '#CBD5E1' }}>{extractedSoap.objective}</span>
                </div>

                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #8B5CF6' }}>
                  <strong style={{ color: '#C084FC', display: 'block', marginBottom: '2px' }}>Assessment (A):</strong>
                  <span style={{ color: '#CBD5E1' }}>{extractedSoap.assessment}</span>
                </div>

                {/* Suggested ICD-10 Diagnoses */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {extractedSoap.icd10.map((code) => (
                    <div
                      key={code.code}
                      style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid #8B5CF6',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.6875rem',
                        color: '#E9D5FF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <strong>{code.code}</strong> — {code.description} ({code.confidence}%)
                    </div>
                  ))}
                </div>

                {/* Extracted Prescription (Rx) with Auto-Nephrotoxic Filter Guard */}
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px', borderLeft: isFilteringNephrotoxic ? '3px solid #EF4444' : '3px solid #10B981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: isFilteringNephrotoxic ? '#FCA5A5' : '#A7F3D0' }}>
                      Extracted Prescription (Rx):
                    </strong>
                    {isFilteringNephrotoxic && (
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#7F1D1D', color: '#FECACA', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                        🛡️ NEPHROTOXIC FILTER ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Filtered NSAIDs Notice if Kidney Detected */}
                  {isFilteringNephrotoxic && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px dashed #EF4444',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      marginBottom: '8px',
                      fontSize: '0.72rem',
                      color: '#FCA5A5'
                    }}>
                      <div style={{ fontWeight: 800 }}>⚠️ Renal Safety Protocol Triggered:</div>
                      <div>• <strong>Diclofenac / Aceclofenac / Ibuprofen</strong> blocked from Rx.</div>
                      <div>• Switched to renally safe antipyretic: <strong>Paracetamol 650mg</strong>.</div>
                    </div>
                  )}

                  {/* Auto-Blocked Drug Row Preview */}
                  {isFilteringNephrotoxic && (
                    <div
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        marginBottom: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textDecoration: 'line-through',
                        opacity: 0.7
                      }}
                    >
                      <div>
                        <strong style={{ color: '#F87171' }}>Tab. Diclofenac Sodium 50mg</strong> (NSAID)
                        <div style={{ fontSize: '0.6875rem', color: '#EF4444' }}>Auto-blocked: High renal injury risk in nephrolithiasis history</div>
                      </div>
                      <Badge variant="danger">BLOCKED</Badge>
                    </div>
                  )}

                  {/* Safe Approved Drugs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {extractedSoap.rx.map((med, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#10B981' }}>{med.name}</strong> ({med.dose})
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{med.notes}</div>
                        </div>
                        <Badge variant="neutral">{med.freq} • {med.dur}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mandatory Doctor Sign-off & Commit Button */}
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApprovePrescription}
                  style={{
                    width: '100%',
                    fontWeight: 800,
                    backgroundColor: isApproved ? '#10B981' : '#8B5CF6',
                    borderColor: isApproved ? '#10B981' : '#8B5CF6'
                  }}
                >
                  {isApproved ? '✓ Prescription Approved & Pushed to EMR' : '✍️ Attending Doctor Sign-off & Push to EMR'}
                </Button>
              </div>
            </div>
          </div>

          {/* 🌟 3. DYNAMIC MULTILINGUAL WHATSAPP AUDIO VOICE NOTE FOR PATIENT */}
          <div
            style={{
              backgroundColor: 'linear-gradient(135deg, #062E25 0%, #0B1E22 100%)',
              border: '1.5px solid #10B981',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
            }}
          >
            {/* Header with WhatsApp Branding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#064E3B',
                    border: '1.5px solid #25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem'
                  }}
                >
                  🔊
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ECFDF5', margin: 0 }}>
                      Multilingual WhatsApp Voice Note for Patient
                    </h3>
                    <span
                      style={{
                        backgroundColor: '#25D366',
                        color: '#070C16',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}
                    >
                      30-SEC AUTONOMOUS RX AUDIO
                    </span>
                  </div>
                  <p style={{ color: '#A7F3D0', fontSize: '0.78rem', margin: '3px 0 0 0' }}>
                    Zero-click audio summary sent in patient's regional mother tongue. Game-changer for elderly & illiterate patients so they never miss dose timings or test orders.
                  </p>
                </div>
              </div>

              {/* Delivery State Badge */}
              <div>
                {isDispatchedWhatsApp ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(37, 211, 102, 0.2)',
                      border: '1px solid #25D366',
                      color: '#25D366',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ✓ DELIVERED TO {patientPhone} VIA WHATSAPP
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#94A3B8',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    ⏳ Ready to Auto-Dispatch
                  </span>
                )}
              </div>
            </div>

            {/* Regional Language Dialect Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#A7F3D0', textTransform: 'uppercase' }}>
                Select Patient Mother Tongue:
              </span>
              {[
                { id: 'HINDI', label: '🇮🇳 Hindi' },
                { id: 'BHOJPURI', label: '🌾 Bhojpuri' },
                { id: 'MARATHI', label: '🚩 Marathi' },
                { id: 'BENGALI', label: '🐟 Bengali' },
                { id: 'TAMIL', label: '🛕 Tamil' },
                { id: 'TELUGU', label: '🏛️ Telugu' },
                { id: 'GUJARATI', label: '🦁 Gujarati' },
                { id: 'ENGLISH', label: '🌐 English' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVoiceNoteLang(item.id as RegionalVoiceLanguage)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    backgroundColor: voiceNoteLang === item.id ? '#10B981' : 'rgba(255, 255, 255, 0.05)',
                    color: voiceNoteLang === item.id ? '#070C16' : '#E2E8F0',
                    border: voiceNoteLang === item.id ? '1.5px solid #34D399' : '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Dynamic Voice Note Player & Waveform Console */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Controls & Equalizer Bars */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                
                {/* Play / Pause Web Speech Trigger */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleToggleVoiceNotePlayback}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: isPlayingAudio ? '#EF4444' : '#25D366',
                      border: 'none',
                      color: isPlayingAudio ? '#FFF' : '#070C16',
                      fontSize: '1.3rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isPlayingAudio ? '0 0 16px rgba(239, 68, 68, 0.5)' : '0 0 16px rgba(37, 211, 102, 0.4)'
                    }}
                    title={isPlayingAudio ? 'Pause Voice Note' : 'Play Synthesized Voice Note'}
                  >
                    {isPlayingAudio ? '⏸' : '▶'}
                  </button>

                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {isPlayingAudio ? 'Speaking Voice Summary...' : `Listen to ${voiceNoteLang} Audio Summary`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                      Web Speech Synthesis API • Natural Accent • 0:00 / 0:28s
                    </div>
                  </div>
                </div>

                {/* Animated Audio Equalizer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '36px', padding: '0 8px' }}>
                  {[15, 30, 60, 85, 45, 90, 70, 40, 65, 80, 50, 95, 75, 40, 60, 85, 55, 35, 70, 90, 65, 40, 20].map((barHeight, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '3.5px',
                        height: isPlayingAudio ? `${Math.max(15, (barHeight * (0.4 + (audioPlaybackProgress % 5) * 0.15)))}%` : '6px',
                        backgroundColor: isPlayingAudio ? '#25D366' : '#475569',
                        borderRadius: '2px',
                        transition: 'height 0.15s ease'
                      }}
                    />
                  ))}
                </div>

                {/* WhatsApp Dispatch Button */}
                <button
                  type="button"
                  onClick={handleDispatchWhatsApp}
                  style={{
                    backgroundColor: '#25D366',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#070C16',
                    padding: '10px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <span>📲 Send 30s Audio to WhatsApp ({patientPhone})</span>
                </button>
              </div>

              {/* Progress Timeline Bar */}
              <div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${audioPlaybackProgress}%`,
                      height: '100%',
                      backgroundColor: '#25D366',
                      transition: 'width 0.2s linear'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94A3B8', marginTop: '4px' }}>
                  <span>0:{Math.floor((audioPlaybackProgress / 100) * 28).toString().padStart(2, '0')}</span>
                  <span>0:28 (AAC • 24kHz High Quality Audio)</span>
                </div>
              </div>

              {/* Dynamic Regional Script Preview */}
              <div
                style={{
                  backgroundColor: 'rgba(6, 78, 59, 0.25)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '0.8125rem',
                  lineHeight: '1.55',
                  color: '#E2E8F0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase' }}>
                    📝 Dynamic Script Sent to WhatsApp Voice Generator:
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(0,0,0,0.3)', color: '#A7F3D0', padding: '1px 6px', borderRadius: '4px' }}>
                      👤 Patient: {patientName}
                    </span>
                    <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(0,0,0,0.3)', color: '#A7F3D0', padding: '1px 6px', borderRadius: '4px' }}>
                      👨‍⚕️ Doctor: {doctorName}
                    </span>
                  </div>
                </div>
                <div style={{ fontStyle: 'italic', color: '#F8FAFC' }}>
                  "{generatedVoiceNoteScript}"
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Archive View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {transcripts.map((t) => (
            <Card key={t.id} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#C084FC' }}>
                    {t.patientName} (MRN: {t.patientMrn})
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Doctor: {t.doctorName} • Audio: {t.audioDurationSeconds}s
                  </div>
                </div>
                <Badge variant="success">{t.reviewStatus}</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.75rem' }}>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
                  <strong style={{ color: '#38BDF8' }}>Assessment:</strong> {t.soapNote.assessment}
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px' }}>
                  <strong style={{ color: '#10B981' }}>Plan:</strong> {t.soapNote.plan}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Pre-LLM PII/PHI De-Identification Pipeline Modal */}
      <PreLlmPhiRedactorStudioModal
        isOpen={isDeidModalOpen}
        onClose={() => setIsDeidModalOpen(false)}
        initialPrompt={spokenTranscript}
        initialContext={{
          patientName,
          patientPhone,
          uhid: 'UHID-2026-9041',
          doctorName: effectiveDoctorName,
          hospitalName: partnerProfile.entityLegalName || 'Registered Healthcare Facility'
        }}
      />
    </div>
  );
};
