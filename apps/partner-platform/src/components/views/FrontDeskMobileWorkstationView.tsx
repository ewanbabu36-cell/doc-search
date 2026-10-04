import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { doctorRosterService } from '../../services/doctor-roster-service.js';
import { apiRequest } from '../../services/api-client.js';

export interface FrontDeskMobileWorkstationViewProps {
  tenantId?: string | undefined;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  actorId?: string | undefined;
  actorRole?: string | undefined;
  staffName?: string | undefined;
  onSwitchToFullDesktop?: (() => void) | undefined;
}

export interface OpdDoctorOption {
  id: string;
  name: string;
  specialty: string;
  chamber: string;
  currentQueueCount: number;
  available: boolean;
  consultationFee: number;
}

export interface OpdQueueItem {
  id: string;
  encounterId?: string;
  patientId?: string;
  name: string;
  mobile: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age: string;
  mrn: string;
  token: string;
  doctor: string;
  doctorId: string;
  room: string;
  status: 'WAITING' | 'IN_TRIAGE' | 'IN_CONSULTATION' | 'COMPLETED';
  visitType: 'WALK_IN' | 'FOLLOW_UP' | 'EMERGENCY';
  complaint: string;
  registeredAt: string;
  consultationFee: number;
  feePaymentMode: 'CASH' | 'UPI_QR' | 'CARD' | 'PAY_LATER';
  feeStatus: 'PAID' | 'PENDING';
  feeReceiptNo: string;
  abhaNumber?: string | undefined;
  abhaAddress?: string | undefined;
}

const DEFAULT_DOCTORS: OpdDoctorOption[] = [];

export const FrontDeskMobileWorkstationView: React.FC<FrontDeskMobileWorkstationViewProps> = ({
  tenantId = 'default',
  staffName = 'Front Desk Receptionist',
  onSwitchToFullDesktop
}) => {
  // 4 Core Front Desk Pillars
  const [activeTab, setActiveTab] = useState<'NEW_TOKEN' | 'COLLECT_FEE' | 'LIVE_QUEUE' | 'ABHA_SCAN'>('NEW_TOKEN');
  
  // Doctor options (Dynamically loaded)
  const [doctors, setDoctors] = useState<OpdDoctorOption[]>(DEFAULT_DOCTORS);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  // 1. OPD Token & Intake State
  const [patientName, setPatientName] = useState('');
  const [patientMobile, setPatientMobile] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [visitType, setVisitType] = useState<'WALK_IN' | 'FOLLOW_UP' | 'EMERGENCY'>('WALK_IN');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // 2. Consultation Fee State (embedded in Token creation & Fee tab)
  const [consultationFee, setConsultationFee] = useState<number>(300);

  useEffect(() => {
    async function loadDoctors() {
      try {
        const docList = await doctorRosterService.getDoctors(tenantId);
        if (Array.isArray(docList) && docList.length > 0) {
          const mapped: OpdDoctorOption[] = docList.map((d: any) => ({
            id: d.id || d.doctorCode || 'doc-1',
            name: d.fullName || `Dr. ${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Dr. Physician',
            specialty: d.primarySpecialty || 'General Medicine',
            chamber: d.roomNumber || 'Room 101',
            currentQueueCount: 0,
            available: true,
            consultationFee: d.consultationFee || 300
          }));
          setDoctors(mapped);
          if (mapped[0]) {
            setSelectedDoctorId(mapped[0].id);
            setConsultationFee(mapped[0].consultationFee);
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic doctors:', err);
      }
    }
    loadDoctors();
  }, [tenantId]);
  const [feePaymentMode, setFeePaymentMode] = useState<'CASH' | 'UPI_QR' | 'CARD' | 'PAY_LATER'>('UPI_QR');
  const [isFeePaid, setIsFeePaid] = useState<boolean>(true);

  // 4. ABDM ABHA Verification State
  const [abhaNumber, setAbhaNumber] = useState('');
  const [abhaAddress, setAbhaAddress] = useState('');
  const [abhaTabMode, setAbhaTabMode] = useState<'SCAN_SHARE' | 'CREATE_ABHA'>('SCAN_SHARE');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifyingAbha, setIsVerifyingAbha] = useState(false);
  const [verifiedAbhaProfile, setVerifiedAbhaProfile] = useState<{
    abhaNumber: string;
    abhaAddress: string;
    name: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    age: string;
    mobile: string;
  } | null>(null);

  // Active Queue
  const [queue, setQueue] = useState<OpdQueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [queueDoctorFilter, setQueueDoctorFilter] = useState<string>('ALL');
  const [feeFilter, setFeeFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  // Quick Fee Collection Modal for Pending Tokens
  const [collectingItem, setCollectingItem] = useState<OpdQueueItem | null>(null);
  const [collectPaymentMode, setCollectPaymentMode] = useState<'CASH' | 'UPI_QR' | 'CARD'>('UPI_QR');

  // Success Token Modal / Slip
  const [issuedToken, setIssuedToken] = useState<{
    tokenNumber: string;
    patientName: string;
    patientMobile: string;
    doctorName: string;
    chamber: string;
    mrn: string;
    time: string;
    consultationFee: number;
    feePaymentMode: string;
    feeStatus: 'PAID' | 'PENDING';
    feeReceiptNo: string;
    rawItem?: OpdQueueItem;
  } | null>(null);

  // Toast / Alert
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync consultation fee when selected doctor changes
  useEffect(() => {
    const selectedDoc = doctors.find((d) => d.id === selectedDoctorId);
    if (selectedDoc) {
      setConsultationFee(selectedDoc.consultationFee);
    }
  }, [selectedDoctorId, doctors]);

  // Adjust payment status if Pay Later is chosen
  useEffect(() => {
    if (feePaymentMode === 'PAY_LATER') {
      setIsFeePaid(false);
    } else {
      setIsFeePaid(true);
    }
  }, [feePaymentMode]);

  // Play audio chime and speak token
  const announceToken = (token: string, docChamber: string, patientName?: string) => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        const text = patientName 
          ? `Token ${token}. ${patientName}. Please proceed to ${docChamber}.`
          : `Token ${token}. Please proceed to ${docChamber}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Audio fallback
    }
  };

  // Load live encounters queue directly from backend API
  const loadLiveQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const qRes = await apiRequest<any[]>('/api/v1/partner/clinical/queues');
      let liveList: OpdQueueItem[] = [];
      if (qRes.success && Array.isArray(qRes.data)) {
        liveList = qRes.data.map((item) => ({
          id: item.id,
          encounterId: item.encounterId,
          patientId: item.patientId,
          token: item.tokenNumber || `TK-${item.id.slice(0, 4)}`,
          name: item.patientName || item.metadata?.patientName || 'Patient',
          mobile: item.patientPhone || item.metadata?.patientPhone || '',
          gender: (item.gender || item.metadata?.gender || 'MALE') as any,
          age: String(item.age || item.metadata?.age || '30'),
          mrn: item.mrn || item.uhid || item.metadata?.mrn || 'UHID-00000',
          doctor: item.doctorName || item.metadata?.doctorName || 'Consultant Physician',
          doctorId: item.doctorId || 'doc-1',
          room: item.metadata?.chamber || 'Room 101',
          status: (item.queueStatus === 'SERVED' || item.encounterStatus === 'COMPLETED')
            ? 'COMPLETED'
            : (item.queueStatus === 'IN_PROGRESS' || item.queueStatus === 'CALLED' ? 'IN_CONSULTATION' : 'WAITING'),
          visitType: (item.metadata?.visitType || 'WALK_IN') as any,
          complaint: item.chiefComplaint || item.metadata?.chiefComplaint || 'OPD Consultation',
          registeredAt: item.createdAt || new Date().toISOString(),
          consultationFee: item.paymentAmount || item.metadata?.consultationFee || 500,
          feePaymentMode: (item.paymentMethod || item.metadata?.feePaymentMode || 'CASH') as any,
          feeStatus: (item.paymentStatus === 'PAID' ? 'PAID' : (item.paymentStatus === 'PAY_LATER' ? 'PAY_LATER' : 'PENDING')) as any,
          feeReceiptNo: item.paymentNumber || item.invoiceNumber || item.metadata?.feeReceiptNo || ''
        }));
      }

      setQueue(liveList);

      // Update doctor queue counts
      setDoctors((prev) =>
        prev.map((doc) => ({
          ...doc,
          currentQueueCount: liveList.filter((e) => (e.doctor === doc.name || e.doctorId === doc.id) && e.status === 'WAITING').length
        }))
      );
    } catch (err) {
      console.warn('Mobile queue load error:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    void loadLiveQueue();
    const handleRegistered = () => void loadLiveQueue();
    window.addEventListener('docsearch:patient-registered', handleRegistered);
    window.addEventListener('docsearch:encounters-updated', handleRegistered);
    return () => {
      window.removeEventListener('docsearch:patient-registered', handleRegistered);
      window.removeEventListener('docsearch:encounters-updated', handleRegistered);
    };
  }, [loadLiveQueue]);

  // Handle instant token issuance with integrated Consultation Fee
  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const name = patientName.trim();
    const mobile = patientMobile.trim();
    if (!name || name.length < 2) {
      showToast('Please enter patient full name.', 'error');
      return;
    }
    if (!mobile || mobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    const selectedDoc = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
    const docName = selectedDoc?.name || 'Consultant Doctor';
    const chamber = selectedDoc?.chamber || 'Room 101';
    const normalizedPhone = mobile.replace(/\D/g, '');
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Patient';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

    setIsSubmitting(true);
    try {
      // 1. Authoritative Backend Patient Registration
      const patRes = await apiRequest<any>('/api/v1/partner/clinical/patients', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          gender: patientGender,
          mobileNumber: normalizedPhone,
          dateOfBirth: new Date(Date.now() - (parseInt(patientAge || '30', 10) * 365.25 * 24 * 3600 * 1000)).toISOString().split('T')[0]
        })
      });

      const patientData = patRes.data || patRes;
      const patientId = patientData?.id;
      if (!patientId) {
        throw new Error('Failed to resolve patient identity from database');
      }

      // 2. Authoritative Backend Encounter Check-In & Token Allocation
      const checkInRes = await apiRequest<any>('/api/v1/partner/clinical/encounters/check-in', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          doctorId: selectedDoc?.id,
          encounterType: visitType,
          chiefComplaint: chiefComplaint || 'General OPD Consultation',
          status: 'WAITING',
          metadata: {
            feePaymentMode,
            feeStatus: isFeePaid ? 'PAID' : 'PAY_LATER',
            consultationFee,
            patientName: name,
            patientPhone: normalizedPhone,
            age: patientAge || '30',
            gender: patientGender,
            chamber,
            visitType,
            abhaNumber: abhaNumber || undefined,
            abhaAddress: abhaAddress || undefined
          }
        })
      });

      const encounterData = checkInRes.data || checkInRes;
      const activeEncounterId = encounterData?.id;

      // 3. Authoritative Backend Payment Collection if marked Paid
      let paymentRecord: any = null;
      if (isFeePaid && activeEncounterId && consultationFee > 0) {
        const payRes = await apiRequest<any>(`/api/v1/partner/clinical/encounters/${activeEncounterId}/payments`, {
          method: 'POST',
          body: JSON.stringify({
            amount: Number(consultationFee),
            paymentMethod: feePaymentMode === 'PAY_LATER' ? 'CASH' : feePaymentMode,
            notes: 'OPD Consultation Fee collected at Mobile Workstation'
          })
        });
        paymentRecord = payRes.data || payRes;
      }

      const tokenNumber = encounterData?.metadata?.tokenNumber || (encounterData?.encounterNumber ? `TK-${encounterData.encounterNumber.slice(-3)}` : `TK-${Math.floor(10 + Math.random() * 90)}`);
      const mrn = patientData?.mrn || patientData?.uhid || `UHID-${patientId.slice(0, 8)}`;
      const feeReceiptNo = paymentRecord?.paymentNumber || `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const newQueueItem: OpdQueueItem = {
        id: activeEncounterId || patientId,
        encounterId: activeEncounterId,
        patientId,
        name,
        mobile,
        gender: patientGender,
        age: patientAge || '30',
        mrn,
        token: tokenNumber,
        doctor: docName,
        doctorId: selectedDoc?.id || 'doc-1',
        room: chamber,
        status: 'WAITING',
        visitType,
        complaint: chiefComplaint || 'General OPD Consultation',
        registeredAt: new Date().toISOString(),
        consultationFee,
        feePaymentMode,
        feeStatus: isFeePaid ? 'PAID' : 'PENDING',
        feeReceiptNo,
        abhaNumber: abhaNumber || undefined,
        abhaAddress: abhaAddress || undefined
      };

      // Broadcast system events for instant multi-station interoperability
      window.dispatchEvent(new CustomEvent('docsearch:patient-registered', { detail: newQueueItem }));
      hospitalEventBus.publish(
        'PATIENT_SELECTED',
        'FrontDeskMobile',
        {
          id: newQueueItem.id,
          uhid: mrn,
          name,
          age: parseInt(patientAge, 10) || 30,
          gender: patientGender,
          phone: mobile,
          opdToken: parseInt(tokenNumber.replace(/\D/g, ''), 10) || 1,
          doctorName: docName,
          consultationFee,
          feeStatus: isFeePaid ? 'PAID' : 'PENDING',
          feeReceiptNo
        },
        `OPD Token ${tokenNumber} issued for ${name} (Fee: ₹${consultationFee} ${isFeePaid ? 'PAID' : 'PENDING'})`
      );

      // Announce audio
      announceToken(tokenNumber, chamber, name);

      // Set issued token slip
      setIssuedToken({
        tokenNumber,
        patientName: name,
        patientMobile: mobile,
        doctorName: docName,
        chamber,
        mrn,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        consultationFee,
        feePaymentMode,
        feeStatus: isFeePaid ? 'PAID' : 'PENDING',
        feeReceiptNo,
        rawItem: newQueueItem
      });

      // Clear form
      setPatientName('');
      setPatientMobile('');
      setPatientAge('');
      setChiefComplaint('');
      setAbhaNumber('');
      setAbhaAddress('');

      showToast(`Token ${tokenNumber} issued! Fee: ₹${consultationFee} (${isFeePaid ? 'PAID' : 'PENDING'})`);
      void loadLiveQueue();
    } catch (err: any) {
      console.error('Failed to issue token:', err);
      showToast(err?.message || 'Failed to issue token. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. OPD Queue Dispatch Actions
  const handleCallPatient = (token: string, patient: string, chamber: string) => {
    announceToken(token, chamber, patient);
    showToast(`📢 Calling Token ${token} (${patient}) to ${chamber}`);
  };

  const handleDispatchToNurse = async (item: OpdQueueItem) => {
    if (item.id) {
      try {
        await apiRequest(`/api/v1/partner/clinical/queues/${item.id}/call`, { method: 'PATCH' });
      } catch (err) {
        console.warn('Queue call API warning:', err);
      }
    }
    showToast(`👩‍⚕️ ${item.name} (${item.token}) dispatched to Nurse Vitals Triage!`);
    hospitalEventBus.publish(
      'PATIENT_SELECTED',
      'FrontDeskMobile',
      {
        id: item.id,
        uhid: item.mrn,
        name: item.name,
        age: parseInt(item.age, 10) || 30,
        gender: item.gender,
        phone: item.mobile,
        opdToken: parseInt(item.token.replace(/\D/g, ''), 10) || 1,
        doctorName: item.doctor,
        stage: 'IN_TRIAGE'
      },
      `Token ${item.token} routed to Nurse Vitals Triage Station`
    );
    void loadLiveQueue();
  };

  const handleDispatchToDoctor = async (item: OpdQueueItem) => {
    if (item.id) {
      try {
        await apiRequest(`/api/v1/partner/clinical/queues/${item.id}/call`, { method: 'PATCH' });
      } catch (err) {
        console.warn('Queue call API warning:', err);
      }
    }
    announceToken(item.token, item.room, item.name);
    showToast(`👨‍⚕️ ${item.name} (${item.token}) dispatched to ${item.doctor} (${item.room})!`);
    hospitalEventBus.publish(
      'PATIENT_SELECTED',
      'FrontDeskMobile',
      {
        id: item.id,
        uhid: item.mrn,
        name: item.name,
        age: parseInt(item.age, 10) || 30,
        gender: item.gender,
        phone: item.mobile,
        opdToken: parseInt(item.token.replace(/\D/g, ''), 10) || 1,
        doctorName: item.doctor,
        stage: 'IN_CONSULTATION'
      },
      `Token ${item.token} dispatched into Doctor Chamber ${item.room}`
    );
    void loadLiveQueue();
  };

  const handleMarkComplete = async (item: OpdQueueItem) => {
    try {
      if (item.id) {
        await apiRequest(`/api/v1/partner/clinical/queues/${item.id}/complete`, { method: 'PATCH' });
      } else if (item.encounterId) {
        await apiRequest(`/api/v1/partner/clinical/encounters/${item.encounterId}/checkout`, { method: 'POST' });
      }
      showToast(`✅ ${item.name} (${item.token}) consultation completed.`);
      void loadLiveQueue();
    } catch (err) {
      console.warn('Complete queue warning:', err);
      showToast(`✅ ${item.name} (${item.token}) consultation marked completed.`);
      void loadLiveQueue();
    }
  };

  // 2. Fee Collection Actions
  const handleSettleFee = async (item: OpdQueueItem, mode: 'CASH' | 'UPI_QR' | 'CARD') => {
    try {
      if (item.encounterId) {
        await apiRequest(`/api/v1/partner/clinical/encounters/${item.encounterId}/payments`, {
          method: 'POST',
          body: JSON.stringify({
            amount: Number(item.consultationFee),
            paymentMethod: mode === 'UPI_QR' ? 'UPI' : mode,
            notes: 'Fee settled at mobile front desk'
          })
        });
      }
      setCollectingItem(null);
      showToast(`⚡ ₹${item.consultationFee} collected for ${item.name} via ${mode}! Receipt generated.`);
      void loadLiveQueue();
    } catch (err: any) {
      console.error('Fee settlement error:', err);
      showToast(err?.message || 'Failed to settle fee', 'error');
    }
  };

  // Fee Analytics
  const feeStats = useMemo(() => {
    let totalCollected = 0;
    let cashCollected = 0;
    let upiCollected = 0;
    let pendingAmount = 0;
    let pendingCount = 0;

    for (const item of queue) {
      const fee = Number(item.consultationFee) || 0;
      if (item.feeStatus === 'PAID') {
        totalCollected += fee;
        if (item.feePaymentMode === 'CASH') {
          cashCollected += fee;
        } else {
          upiCollected += fee;
        }
      } else {
        pendingAmount += fee;
        pendingCount += 1;
      }
    }

    return { totalCollected, cashCollected, upiCollected, pendingAmount, pendingCount };
  }, [queue]);

  // Filtered Queue for Dispatch Tab
  const filteredQueue = useMemo(() => {
    return queue.filter((q) => {
      // Doctor filter
      if (queueDoctorFilter !== 'ALL' && q.doctorId !== queueDoctorFilter) {
        return false;
      }
      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        q.name.toLowerCase().includes(term) ||
        q.token.toLowerCase().includes(term) ||
        q.mobile.includes(term) ||
        q.mrn.toLowerCase().includes(term)
      );
    });
  }, [queue, queueDoctorFilter, searchTerm]);

  // Filtered Items for Fee Tab
  const filteredFeeItems = useMemo(() => {
    return queue.filter((item) => {
      if (feeFilter === 'PENDING' && item.feeStatus !== 'PENDING') return false;
      if (feeFilter === 'PAID' && item.feeStatus !== 'PAID') return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.token.toLowerCase().includes(term) ||
        item.mobile.includes(term) ||
        item.feeReceiptNo?.toLowerCase().includes(term)
      );
    });
  }, [queue, feeFilter, searchTerm]);

  // 4. ABDM ABHA Verification Simulators
  const handleSimulateScanAndShare = () => {
    showToast('ABHA Counter QR scanned by patient via Aarogya Setu app...', 'info');
    setTimeout(() => {
      const mockAbha = {
        abhaNumber: '91-4829-1029-3819',
        abhaAddress: 'ananya.sharma@abdm',
        name: 'Ananya Sharma',
        gender: 'FEMALE' as const,
        age: '28',
        mobile: '9876501234'
      };
      setVerifiedAbhaProfile(mockAbha);
      showToast('🇮🇳 ABDM Profile Received: Ananya Sharma (ABHA: 91-4829-1029-3819)');
    }, 1200);
  };

  const handleSendAadhaarOtp = () => {
    if (aadhaarInput.replace(/\D/g, '').length < 12) {
      showToast('Please enter valid 12-digit Aadhaar Number', 'error');
      return;
    }
    setIsVerifyingAbha(true);
    setTimeout(() => {
      setIsVerifyingAbha(false);
      setIsOtpSent(true);
      showToast('OTP sent to Aadhaar-linked mobile number (XX-XXXX-3210)');
    }, 1000);
  };

  const handleVerifyOtpAndGenerateAbha = () => {
    if (otpInput.trim().length < 4) {
      showToast('Please enter 4 or 6-digit OTP received', 'error');
      return;
    }
    setIsVerifyingAbha(true);
    setTimeout(() => {
      setIsVerifyingAbha(false);
      const generated = {
        abhaNumber: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        abhaAddress: `${(patientName || 'patient').toLowerCase().replace(/\s+/g, '')}${Math.floor(10 + Math.random() * 90)}@abdm`,
        name: patientName || 'Aadhaar Verified Patient',
        gender: patientGender,
        age: patientAge || '32',
        mobile: patientMobile || '9876543210'
      };
      setVerifiedAbhaProfile(generated);
      showToast('🇮🇳 ABHA ID Created Successfully!');
    }, 1200);
  };

  const handleApplyAbhaToTokenForm = () => {
    if (!verifiedAbhaProfile) return;
    setPatientName(verifiedAbhaProfile.name);
    setPatientMobile(verifiedAbhaProfile.mobile);
    setPatientAge(verifiedAbhaProfile.age);
    setPatientGender(verifiedAbhaProfile.gender);
    setAbhaNumber(verifiedAbhaProfile.abhaNumber);
    setAbhaAddress(verifiedAbhaProfile.abhaAddress);
    setActiveTab('NEW_TOKEN');
    showToast('ABHA profile applied to Token & Intake form!');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '8px 12px 60px'
      }}
    >
      {/* TOAST ALERT */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: toast.type === 'error' ? '#EF4444' : '#0F172A',
            border: `1.5px solid ${toast.type === 'error' ? '#F87171' : '#10B981'}`,
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#F8FAFC',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            fontSize: '0.875rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '90%',
            maxWidth: '480px'
          }}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1.5px solid rgba(13, 148, 136, 0.4)',
          borderRadius: '16px',
          padding: '14px 18px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(13, 148, 136, 0.2)',
              border: '1.5px solid #0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}
          >
            📇
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                Front Desk Workstation
              </h2>
              <Badge variant="success" style={{ fontSize: '0.6875rem', fontWeight: 800 }}>
                ● Online
              </Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Staff: <strong style={{ color: '#2DD4BF' }}>{staffName}</strong> • Fast OPD Desk
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            style={{
              background: audioEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
              border: audioEnabled ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: audioEnabled ? '#34D399' : '#94A3B8',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
            title="Toggle speech announcements"
          >
            {audioEnabled ? '🔔 Chime On' : '🔕 Mute'}
          </button>

          {onSwitchToFullDesktop && (
            <button
              type="button"
              onClick={onSwitchToFullDesktop}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#38BDF8',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              🖥️ Full Desktop
            </button>
          )}
        </div>
      </div>

      {/* 4 CORE FRONT DESK PILLARS TABS */}
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
          onClick={() => setActiveTab('NEW_TOKEN')}
          style={{
            padding: '10px 4px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'NEW_TOKEN' ? '#0d9488' : 'transparent',
            color: activeTab === 'NEW_TOKEN' ? '#FFFFFF' : '#94A3B8',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📇</span>
          <span>OPD Token</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COLLECT_FEE')}
          style={{
            padding: '10px 4px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'COLLECT_FEE' ? '#0d9488' : 'transparent',
            color: activeTab === 'COLLECT_FEE' ? '#FFFFFF' : '#94A3B8',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transition: 'all 0.15s ease',
            position: 'relative'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <span>Collect Fee</span>
          {feeStats.pendingCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '1px 5px',
                fontSize: '0.625rem',
                fontWeight: 900
              }}
            >
              {feeStats.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LIVE_QUEUE')}
          style={{
            padding: '10px 4px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'LIVE_QUEUE' ? '#0d9488' : 'transparent',
            color: activeTab === 'LIVE_QUEUE' ? '#FFFFFF' : '#94A3B8',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>⏱️</span>
          <span>Queue Dispatch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ABHA_SCAN')}
          style={{
            padding: '10px 4px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'ABHA_SCAN' ? '#0d9488' : 'transparent',
            color: activeTab === 'ABHA_SCAN' ? '#FFFFFF' : '#94A3B8',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🇮🇳</span>
          <span>ABDM ABHA</span>
        </button>
      </div>

      {/* TAB 1: OPD TOKEN & INTAKE (PATIENT REGISTRATION & TOKEN GENERATION) */}
      {activeTab === 'NEW_TOKEN' && (
        <Card
          style={{
            backgroundColor: 'rgba(18, 24, 38, 0.9)',
            border: '1px solid rgba(13, 148, 136, 0.3)',
            borderRadius: '16px',
            padding: '18px'
          }}
        >
          <form onSubmit={handleIssueToken} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Step 1: Doctor Selection */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#2DD4BF' }}>
                1. SELECT CONSULTING DOCTOR
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                Live Queue & Fees
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                      border: isSelected ? '2px solid #0d9488' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}>👨‍⚕️</span>
                        <strong style={{ fontSize: '0.875rem', color: isSelected ? '#5EEAD4' : '#F8FAFC' }}>
                          {doc.name}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginLeft: '24px' }}>
                        {doc.specialty} • {doc.chamber}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(13, 148, 136, 0.25)',
                          color: '#2DD4BF',
                          border: '1px solid #0d9488',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}
                      >
                        ₹{doc.consultationFee} Fee
                      </span>
                      <span
                        style={{
                          backgroundColor: doc.currentQueueCount > 3 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: doc.currentQueueCount > 3 ? '#FCA5A5' : '#6EE7B7',
                          border: `1px solid ${doc.currentQueueCount > 3 ? '#EF4444' : '#10B981'}`,
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '0.625rem',
                          fontWeight: 800
                        }}
                      >
                        {doc.currentQueueCount} Waiting
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 2: Patient Demographics */}
            <div style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#2DD4BF' }}>
                  2. PATIENT DEMOGRAPHICS
                </span>
                {abhaNumber && (
                  <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>
                    🇮🇳 ABHA: {abhaNumber}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Patient Full Name *
                  </label>
                  <Input
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    style={{ fontSize: '0.9375rem', padding: '12px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Mobile Number (10 Digits) *
                    </label>
                    <Input
                      type="tel"
                      required
                      maxLength={10}
                      value={patientMobile}
                      onChange={(e) => setPatientMobile(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="9876543210"
                      style={{ fontSize: '0.9375rem', padding: '12px', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Age (Yrs)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="e.g. 35"
                      style={{ fontSize: '0.9375rem', padding: '12px' }}
                    />
                  </div>
                </div>

                {/* Gender Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Gender
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPatientGender(g)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: patientGender === g ? '1.5px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: patientGender === g ? 'rgba(13, 148, 136, 0.2)' : '#0F172A',
                          color: patientGender === g ? '#5EEAD4' : '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {g === 'MALE' ? '👨 Male' : g === 'FEMALE' ? '👩 Female' : '⚧ Other'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visit Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Visit Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {(['WALK_IN', 'FOLLOW_UP', 'EMERGENCY'] as const).map((vt) => (
                      <button
                        key={vt}
                        type="button"
                        onClick={() => setVisitType(vt)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border:
                            visitType === vt
                              ? vt === 'EMERGENCY'
                                ? '1.5px solid #EF4444'
                                : '1.5px solid #0d9488'
                              : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor:
                            visitType === vt
                              ? vt === 'EMERGENCY'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(13, 148, 136, 0.2)'
                              : '#0F172A',
                          color:
                            visitType === vt
                              ? vt === 'EMERGENCY'
                                ? '#FCA5A5'
                                : '#5EEAD4'
                              : '#94A3B8',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {vt === 'WALK_IN' ? '🚶 Walk-In' : vt === 'FOLLOW_UP' ? '🔄 Follow Up' : '🚨 Priority/SOS'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Chief Complaint / Symptoms
                  </label>
                  <Input
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="e.g. Fever since 2 days, headache, mild cough"
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Integrated Consultation Fee Collection */}
            <div
              style={{
                marginTop: '6px',
                padding: '14px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '12px',
                border: '1px solid rgba(13, 148, 136, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#2DD4BF' }}>
                  ⚡ 3. COLLECT CONSULTATION FEE
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#5EEAD4' }}>
                  ₹{consultationFee}
                </span>
              </div>

              {/* Payment Mode Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                {[
                  { mode: 'UPI_QR' as const, label: '📱 UPI QR' },
                  { mode: 'CASH' as const, label: '💵 Cash' },
                  { mode: 'CARD' as const, label: '💳 Card' },
                  { mode: 'PAY_LATER' as const, label: '⏱️ Pay Later' }
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFeePaymentMode(mode)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: feePaymentMode === mode ? '1.5px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: feePaymentMode === mode ? 'rgba(13, 148, 136, 0.25)' : '#0F172A',
                      color: feePaymentMode === mode ? '#5EEAD4' : '#94A3B8',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Dynamic UPI QR Code Preview if UPI selected */}
              {feePaymentMode === 'UPI_QR' && (
                <div
                  style={{
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    border: '1px dashed #0d9488',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="56" height="56" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="#ffffff" />
                      <rect x="10" y="10" width="28" height="28" fill="#0f172a" />
                      <rect x="16" y="16" width="16" height="16" fill="#ffffff" />
                      <rect x="20" y="20" width="8" height="8" fill="#0f172a" />
                      <rect x="62" y="10" width="28" height="28" fill="#0f172a" />
                      <rect x="68" y="16" width="16" height="16" fill="#ffffff" />
                      <rect x="72" y="20" width="8" height="8" fill="#0f172a" />
                      <rect x="10" y="62" width="28" height="28" fill="#0f172a" />
                      <rect x="16" y="68" width="16" height="16" fill="#ffffff" />
                      <rect x="20" y="72" width="8" height="8" fill="#0f172a" />
                      <circle cx="50" cy="50" r="10" fill="#0d9488" />
                    </svg>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.8125rem', color: '#F8FAFC', display: 'block' }}>
                      Scan & Pay ₹{consultationFee}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                      GPay / PhonePe / Paytm / BHIM
                    </span>
                    <div style={{ marginTop: '4px' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#34D399',
                          border: '1px solid #10B981',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          fontSize: '0.625rem',
                          fontWeight: 800
                        }}
                      >
                        Auto-Verified upon token print
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fee Amount adjustment (if authorized) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Fee Amount (INR):
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[400, 500, 600, 0].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setConsultationFee(amt)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: consultationFee === amt ? '1px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: consultationFee === amt ? 'rgba(13, 148, 136, 0.3)' : 'transparent',
                        color: consultationFee === amt ? '#5EEAD4' : '#94A3B8',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {amt === 0 ? 'Free' : `₹${amt}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BIG ACTION BUTTON */}
            <Button
              variant="primary"
              size="lg"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              style={{
                marginTop: '8px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: '#0d9488',
                color: '#FFFFFF',
                fontSize: '1.05rem',
                fontWeight: 900,
                boxShadow: '0 6px 24px rgba(13, 148, 136, 0.4)',
                width: '100%'
              }}
            >
              📇 Issue OPD Token & Collect ₹{consultationFee}
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 2: COLLECT CONSULTATION FEE (STANDALONE DESK) */}
      {activeTab === 'COLLECT_FEE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Revenue Analytics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <Card style={{ backgroundColor: 'rgba(18, 24, 38, 0.9)', padding: '14px', borderRadius: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Total Collected Today</span>
              <strong style={{ fontSize: '1.4rem', color: '#34D399', fontWeight: 900 }}>
                ₹{feeStats.totalCollected}
              </strong>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '4px' }}>
                <span>💵 Cash: ₹{feeStats.cashCollected}</span>
                <span>📱 UPI: ₹{feeStats.upiCollected}</span>
              </div>
            </Card>

            <Card style={{ backgroundColor: 'rgba(18, 24, 38, 0.9)', padding: '14px', borderRadius: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Pending Collection</span>
              <strong style={{ fontSize: '1.4rem', color: feeStats.pendingCount > 0 ? '#F87171' : '#10B981', fontWeight: 900 }}>
                ₹{feeStats.pendingAmount}
              </strong>
              <span style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>
                {feeStats.pendingCount} patients awaiting fee clearance
              </span>
            </Card>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, token, receipt..."
                style={{ padding: '10px 12px', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'PENDING', 'PAID'] as const).map((flt) => (
                <button
                  key={flt}
                  type="button"
                  onClick={() => setFeeFilter(flt)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: feeFilter === flt ? '1.5px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: feeFilter === flt ? 'rgba(13, 148, 136, 0.25)' : '#0F172A',
                    color: feeFilter === flt ? '#5EEAD4' : '#94A3B8',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {flt}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Item List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFeeItems.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>💰</span>
                <strong style={{ color: '#F8FAFC' }}>No fee records found</strong>
                <p style={{ fontSize: '0.75rem', margin: '4px 0 0' }}>
                  Walk-in consultation tokens will appear here for fee tracking.
                </p>
              </Card>
            ) : (
              filteredFeeItems.map((item) => (
                <Card
                  key={item.id}
                  style={{
                    backgroundColor: 'rgba(18, 24, 38, 0.85)',
                    border: item.feeStatus === 'PENDING' ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          backgroundColor: '#0d9488',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          padding: '6px 10px',
                          borderRadius: '8px'
                        }}
                      >
                        {item.token}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9375rem', color: '#F8FAFC', display: 'block' }}>
                          {item.name}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          {item.mobile} • {item.doctor}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          backgroundColor: item.feeStatus === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: item.feeStatus === 'PAID' ? '#34D399' : '#FCA5A5',
                          border: `1px solid ${item.feeStatus === 'PAID' ? '#10B981' : '#EF4444'}`,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-block'
                        }}
                      >
                        {item.feeStatus === 'PAID' ? `PAID ₹${item.consultationFee}` : `DUE ₹${item.consultationFee}`}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#94A3B8', marginTop: '2px' }}>
                        {item.feePaymentMode} • {item.feeReceiptNo}
                      </span>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {item.feeStatus === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setCollectingItem(item);
                          setCollectPaymentMode('UPI_QR');
                        }}
                        style={{
                          backgroundColor: '#0d9488',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '6px 14px'
                        }}
                      >
                        ⚡ Settle ₹{item.consultationFee} Now
                      </Button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`https://wa.me/91${item.mobile}?text=${encodeURIComponent(
                            `*CONSULTATION FEE RECEIPT*\nPatient: ${item.name}\nToken: ${item.token}\nDoctor: ${item.doctor}\nAmount Paid: ₹${item.consultationFee}\nMode: ${item.feePaymentMode}\nReceipt No: ${item.feeReceiptNo}\n\nThank you for visiting DOC SEARCH Clinic.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'rgba(37, 211, 102, 0.15)',
                            color: '#25D366',
                            border: '1px solid #25D366',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}
                        >
                          📲 WhatsApp Receipt
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            window.print();
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#CBD5E1',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🖨️ Print
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: OPD QUEUE DISPATCH (DOCTOR CHAMBER & NURSE TRIAGE QUEUE DISPATCH) */}
      {activeTab === 'LIVE_QUEUE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
              Waiting in OPD Queue ({filteredQueue.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadLiveQueue()}
              isLoading={isLoadingQueue}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              🔄 Refresh Queue
            </Button>
          </div>

          {/* Doctor Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              type="button"
              onClick={() => setQueueDoctorFilter('ALL')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: queueDoctorFilter === 'ALL' ? '1.5px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: queueDoctorFilter === 'ALL' ? 'rgba(13, 148, 136, 0.25)' : '#0F172A',
                color: queueDoctorFilter === 'ALL' ? '#5EEAD4' : '#94A3B8',
                fontSize: '0.72rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              All Chambers
            </button>
            {doctors.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setQueueDoctorFilter(d.id)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: queueDoctorFilter === d.id ? '1.5px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: queueDoctorFilter === d.id ? 'rgba(13, 148, 136, 0.25)' : '#0F172A',
                  color: queueDoctorFilter === d.id ? '#5EEAD4' : '#94A3B8',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {d.chamber} ({d.name.split(' ')[1] || d.name})
              </button>
            ))}
          </div>

          {/* Search box inside Queue */}
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queue by patient name, token, or mobile..."
            style={{ padding: '10px 12px', fontSize: '0.875rem' }}
          />

          {filteredQueue.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📭</span>
              <strong style={{ color: '#F8FAFC' }}>No patients in this chamber queue</strong>
              <p style={{ fontSize: '0.75rem', margin: '4px 0 12px' }}>
                Tap "📇 OPD Token" to register walk-in patients.
              </p>
              <Button size="sm" variant="primary" onClick={() => setActiveTab('NEW_TOKEN')}>
                Issue New Token
              </Button>
            </Card>
          ) : (
            filteredQueue.map((item, idx) => (
              <Card
                key={item.id || idx}
                style={{
                  backgroundColor: 'rgba(18, 24, 38, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        backgroundColor: '#0d9488',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '1.05rem',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {item.token}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.9375rem', color: '#F8FAFC', display: 'block' }}>
                        {item.name}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        {item.gender} • {item.age}y • {item.mobile} • {item.mrn}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <Badge variant={item.visitType === 'EMERGENCY' ? 'danger' : 'neutral'}>
                      {item.visitType || 'WALK_IN'}
                    </Badge>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: item.feeStatus === 'PAID' ? '#34D399' : '#F87171'
                      }}
                    >
                      {item.feeStatus === 'PAID' ? `✓ Fee Paid (₹${item.consultationFee})` : `⚠️ Fee Due (₹${item.consultationFee})`}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    margin: '10px 0',
                    padding: '8px 10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#CBD5E1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>👨‍⚕️ Assigned: <strong>{item.doctor}</strong></span>
                  <span style={{ color: '#2DD4BF', fontWeight: 700 }}>Chamber: {item.room}</span>
                </div>

                {/* 4 DISPATCH ACTIONS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {/* Action 1: Call Chime */}
                  <button
                    type="button"
                    onClick={() => handleCallPatient(item.token, item.name, item.room)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38BDF8',
                      color: '#38BDF8',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Announce patient token over audio system"
                  >
                    <span>📢</span>
                    <span>Call Out</span>
                  </button>

                  {/* Action 2: Dispatch to Nurse Triage */}
                  <button
                    type="button"
                    onClick={() => handleDispatchToNurse(item)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      backgroundColor: item.status === 'IN_TRIAGE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Send patient to nurse station for vitals test"
                  >
                    <span>👩‍⚕️</span>
                    <span>{item.status === 'IN_TRIAGE' ? 'In Triage' : 'To Nurse'}</span>
                  </button>

                  {/* Action 3: Dispatch to Doctor Chamber */}
                  <button
                    type="button"
                    onClick={() => handleDispatchToDoctor(item)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      backgroundColor: item.status === 'IN_CONSULTATION' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid #F59E0B',
                      color: '#FBBF24',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Direct patient into Doctor Chamber"
                  >
                    <span>🚪</span>
                    <span>{item.status === 'IN_CONSULTATION' ? 'Consulting' : 'To Chamber'}</span>
                  </button>

                  {/* Action 4: Complete */}
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(item)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#CBD5E1',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span>✓</span>
                    <span>Done</span>
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 4: ABDM ABHA VERIFICATION (AYUSHMAN BHARAT QR SCAN & CREATION) */}
      {activeTab === 'ABHA_SCAN' && (
        <Card
          style={{
            backgroundColor: 'rgba(18, 24, 38, 0.9)',
            border: '1px solid rgba(13, 148, 136, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Sub-Tabs: Scan & Share vs Instant ABHA Create */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: '#0F172A',
              padding: '4px',
              borderRadius: '10px'
            }}
          >
            <button
              type="button"
              onClick={() => setAbhaTabMode('SCAN_SHARE')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: abhaTabMode === 'SCAN_SHARE' ? '#0d9488' : 'transparent',
                color: abhaTabMode === 'SCAN_SHARE' ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📷 Scan & Share Counter
            </button>
            <button
              type="button"
              onClick={() => setAbhaTabMode('CREATE_ABHA')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: abhaTabMode === 'CREATE_ABHA' ? '#0d9488' : 'transparent',
                color: abhaTabMode === 'CREATE_ABHA' ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚡ Create / Verify ABHA
            </button>
          </div>

          {abhaTabMode === 'SCAN_SHARE' ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                  ABDM Scan & Share Check-in Counter
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Ask patient to scan this QR with Aarogya Setu / ABHA App for instant digital intake
                </p>
              </div>

              {/* Dynamic QR Code Canvas */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  margin: '4px 0'
                }}
              >
                <svg width="180" height="180" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                  <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="18" width="9" height="9" fill="#0f172a" />
                  <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                  <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="73" y="18" width="9" height="9" fill="#0f172a" />
                  <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                  <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="73" width="9" height="9" fill="#0f172a" />
                  <circle cx="50" cy="50" r="12" fill="#0d9488" />
                  <rect x="42" y="15" width="6" height="15" fill="#0f172a" />
                  <rect x="42" y="70" width="6" height="15" fill="#0f172a" />
                  <rect x="15" y="42" width="15" height="6" fill="#0f172a" />
                  <rect x="70" y="42" width="15" height="6" fill="#0f172a" />
                </svg>
              </div>

              <Badge variant="success" style={{ fontSize: '0.8125rem', padding: '6px 14px' }}>
                🇮🇳 ABDM M1/M2 Certified Counter #01 • Facility ID: IN-29181
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateScanAndShare}
                style={{ marginTop: '6px' }}
              >
                📷 Simulate Patient App Scan
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Instant ABHA Creation via Aadhaar OTP
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Creates 14-digit Ayushman Bharat Health Account with government registry
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Aadhaar Number (12 Digits)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    maxLength={12}
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1234 5678 9012"
                    style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '1px' }}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSendAadhaarOtp}
                    isLoading={isVerifyingAbha && !isOtpSent}
                    disabled={isVerifyingAbha}
                    style={{ backgroundColor: '#0d9488' }}
                  >
                    Send OTP
                  </Button>
                </div>
              </div>

              {isOtpSent && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Enter Aadhaar OTP
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Input
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="6-digit OTP"
                      style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '2px' }}
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleVerifyOtpAndGenerateAbha}
                      isLoading={isVerifyingAbha}
                      disabled={isVerifyingAbha}
                      style={{ backgroundColor: '#10B981' }}
                    >
                      Verify & Issue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Display Verified ABHA Card if received */}
          {verifiedAbhaProfile && (
            <div
              style={{
                backgroundColor: 'rgba(13, 148, 136, 0.15)',
                border: '1.5px solid #0d9488',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🇮🇳</span>
                  <strong style={{ color: '#5EEAD4', fontSize: '0.875rem' }}>Verified ABHA Card</strong>
                </div>
                <Badge variant="success">ABDM Verified</Badge>
              </div>

              <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Patient:</span>
                  <strong style={{ color: '#F8FAFC' }}>{verifiedAbhaProfile.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>ABHA Number:</span>
                  <span style={{ color: '#5EEAD4', fontFamily: 'monospace', fontWeight: 800 }}>
                    {verifiedAbhaProfile.abhaNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>ABHA Address:</span>
                  <span style={{ color: '#CBD5E1' }}>{verifiedAbhaProfile.abhaAddress}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Demographics:</span>
                  <span style={{ color: '#CBD5E1' }}>{verifiedAbhaProfile.gender} • {verifiedAbhaProfile.age}y • {verifiedAbhaProfile.mobile}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleApplyAbhaToTokenForm}
                style={{
                  backgroundColor: '#0d9488',
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  marginTop: '4px'
                }}
              >
                ➡️ Auto-Fill in OPD Token Form & Issue
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* QUICK SETTLE FEE MODAL (FROM COLLECT FEE TAB) */}
      {collectingItem && (
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
              border: '2px solid #0d9488',
              borderRadius: '18px',
              maxWidth: '380px',
              width: '100%',
              padding: '20px',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1rem', color: '#5EEAD4' }}>Collect Consultation Fee</strong>
              <button
                type="button"
                onClick={() => setCollectingItem(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', fontSize: '0.8125rem' }}>
              <div>Patient: <strong>{collectingItem.name}</strong></div>
              <div>Token: <strong style={{ color: '#2DD4BF' }}>{collectingItem.token}</strong></div>
              <div>Doctor: {collectingItem.doctor}</div>
              <div style={{ marginTop: '6px', fontSize: '1.1rem', fontWeight: 900, color: '#34D399' }}>
                Amount Due: ₹{collectingItem.consultationFee}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {(['UPI_QR', 'CASH', 'CARD'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCollectPaymentMode(m)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: collectPaymentMode === m ? '1.5px solid #0d9488' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: collectPaymentMode === m ? 'rgba(13, 148, 136, 0.25)' : '#0F172A',
                    color: collectPaymentMode === m ? '#5EEAD4' : '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {m === 'UPI_QR' ? '📱 UPI' : m === 'CASH' ? '💵 Cash' : '💳 Card'}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleSettleFee(collectingItem, collectPaymentMode)}
              style={{ backgroundColor: '#0d9488', fontWeight: 900 }}
            >
              ✓ Confirm Receipt & Mark Paid
            </Button>
          </div>
        </div>
      )}

      {/* ISSUED TOKEN SUCCESS MODAL & RECEIPT SLIP */}
      {issuedToken && (
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
              border: '2px solid #0d9488',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              color: '#F8FAFC',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '2.2rem' }}>🎟️</span>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2DD4BF', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
              OPD Walk-In Token Issued
            </div>

            {/* Giant Token Badge */}
            <div
              style={{
                backgroundColor: 'rgba(13, 148, 136, 0.25)',
                border: '2px dashed #0d9488',
                borderRadius: '16px',
                padding: '14px',
                margin: '14px 0'
              }}
            >
              <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#5EEAD4', letterSpacing: '2px', display: 'block' }}>
                {issuedToken.tokenNumber}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 700 }}>
                {issuedToken.chamber} • {issuedToken.doctorName}
              </span>
            </div>

            {/* Slip Details & Consultation Fee */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'left',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Patient:</span>
                <strong style={{ color: '#F8FAFC' }}>{issuedToken.patientName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Phone / MRN:</span>
                <span style={{ color: '#CBD5E1' }}>{issuedToken.patientMobile} • {issuedToken.mrn}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Check-in Time:</span>
                <span style={{ color: '#CBD5E1' }}>{issuedToken.time}</span>
              </div>
              <div
                style={{
                  borderTop: '1px dashed rgba(255,255,255,0.15)',
                  paddingTop: '6px',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: '#94A3B8' }}>Consultation Fee:</span>
                <strong style={{ color: issuedToken.feeStatus === 'PAID' ? '#34D399' : '#F87171' }}>
                  ₹{issuedToken.consultationFee} ({issuedToken.feeStatus} - {issuedToken.feePaymentMode})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <span style={{ color: '#94A3B8' }}>Receipt No:</span>
                <span style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{issuedToken.feeReceiptNo}</span>
              </div>
            </div>

            {/* Action Buttons: Dispatch Actions + Share / Print */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Direct Quick Dispatch from Slip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (issuedToken.rawItem) {
                      handleDispatchToNurse(issuedToken.rawItem);
                    }
                    setIssuedToken(null);
                  }}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1.5px solid #10B981',
                    color: '#34D399',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  👩‍⚕️ Dispatch to Nurse Triage
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (issuedToken.rawItem) {
                      handleDispatchToDoctor(issuedToken.rawItem);
                    }
                    setIssuedToken(null);
                  }}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    border: '1.5px solid #F59E0B',
                    color: '#FBBF24',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🚪 Dispatch to Doctor
                </button>
              </div>

              <a
                href={`https://wa.me/91${issuedToken.patientMobile}?text=${encodeURIComponent(
                  `*DOC SEARCH OPD APPOINTMENT TOKEN & FEE RECEIPT*\nPatient: ${issuedToken.patientName}\nToken: ${issuedToken.tokenNumber}\nDoctor: ${issuedToken.doctorName}\nChamber: ${issuedToken.chamber}\nConsultation Fee: ₹${issuedToken.consultationFee} (${issuedToken.feeStatus} - ${issuedToken.feePaymentMode})\nReceipt No: ${issuedToken.feeReceiptNo}\nTime: ${issuedToken.time}\n\nPlease proceed when your token is announced.`
                )}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  padding: '10px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.8125rem'
                }}
              >
                <span>📲 Share Slip & Receipt on WhatsApp</span>
              </a>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC' }}
                >
                  🖨️ Thermal Print
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIssuedToken(null)}
                  style={{ backgroundColor: '#0d9488' }}
                >
                  Next Patient
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
