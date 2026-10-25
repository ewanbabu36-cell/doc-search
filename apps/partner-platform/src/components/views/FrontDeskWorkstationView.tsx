import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer
} from '@docsearch/ui-kit';
import { doctorRosterService } from '../../services/doctor-roster-service.js';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { apiRequest } from '../../services/api-client.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import { hardwarePrinterService, type OpdTokenSlipData, type ShiftHandoverSlipData } from '../../services/hardware-printer-service.js';

export interface FrontDeskWorkstationViewProps {
  currentUser?: HospitalStaffUser | undefined;
  tenantId?: string | undefined;
  facilityName?: string | undefined;
  onNavigateModule?: (moduleKey: any, subTab?: string) => void;
}

export interface DutyDoctor {
  id: string;
  name: string;
  specialty: string;
  chamber: string;
  consultationFee: number;
  status: 'AVAILABLE' | 'IN_CONSULTATION' | 'OFF_SHIFT' | 'ON_BREAK' | 'IN_MINOR_OT';
  queueCount: number;
  currentToken?: string | undefined;
}

export interface FrontDeskPatientToken {
  id: string;
  encounterId?: string;
  patientId?: string;
  tokenNumber: string;
  patientName: string;
  patientMobile: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age: string;
  mrn: string;
  doctorId: string;
  doctorName: string;
  chamber: string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  cancellationReason?: string | undefined;
  cancellationRefundMode?: 'CASH_RETURNED' | 'UPI_REVERSAL' | 'NO_FEE_COLLECTED' | undefined;
  cancelledAt?: string | undefined;
  visitType: 'WALK_IN' | 'APPOINTMENT' | 'FOLLOW_UP' | 'EMERGENCY';
  appointmentTime?: string | undefined;
  chiefComplaint: string;
  consultationFee: number;
  feePaymentMode: 'CASH' | 'UPI_QR' | 'CARD' | 'WAIVED' | 'SPLIT';
  splitCashAmount?: number | undefined;
  splitUpiAmount?: number | undefined;
  feeStatus: 'PAID' | 'PENDING' | 'PAY_LATER';
  feeReceiptNo: string;
  createdAt: string;
  queueEligibility?: string;
  blockingReason?: string | null;
  hasVitals?: boolean;
}

function resolveFacilityLeadDoctor(
  currentUser?: HospitalStaffUser,
  profile?: any,
  facilityName?: string
): DutyDoctor {
  const contact = (profile?.primaryContactName || '').trim();
  const facility = (facilityName || currentUser?.tenantName || '').trim();

  let docName = 'Dr. Ashraf, MD';
  if (contact && /^(dr|doctor)/i.test(contact)) {
    docName = contact.startsWith('Dr.') ? contact : `Dr. ${contact.replace(/^dr\.?\s*/i, '')}`;
    if (!docName.includes(',')) docName += ', MD';
  } else if (facility.toUpperCase().includes('ASHIYANA') || facility.toUpperCase().includes('ASHRAF')) {
    docName = 'Dr. Ashraf, MD';
  } else if (contact) {
    docName = `Dr. ${contact}, MD`;
  }

  return {
    id: '4bdb8c25-de26-450b-b00c-9600aa53d459',
    name: docName,
    specialty: 'General Physician',
    chamber: 'Chamber 1',
    consultationFee: 500,
    status: 'AVAILABLE',
    queueCount: 0,
    currentToken: undefined
  };
}

export const FrontDeskWorkstationView: React.FC<FrontDeskWorkstationViewProps> = ({
  currentUser,
  tenantId = 'default',
  facilityName: initialFacilityName,
  onNavigateModule
}) => {
  const verifiedProfile = useMemo(() => getUnifiedPartnerProfile(currentUser), [currentUser]);

  // Clean Clinic Display Name & Branch
  const clinicDisplayName = useMemo(() => {
    if (verifiedProfile?.entityLegalName && !verifiedProfile.entityLegalName.includes('INDEPENDENT_CLINIC')) {
      return verifiedProfile.entityLegalName;
    }
    const raw = initialFacilityName || currentUser?.tenantName || 'MediSphere Healthcare Clinic';
    if (raw.toUpperCase().includes('INDEPENDENT_CLINIC')) {
      const parts = raw.split(/[\s_]+/);
      const cleanName = parts[0] || 'Care';
      const capitalized = cleanName ? (cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()) : 'Care';
      return `Dr. ${capitalized} Care Clinic & Polyclinic`;
    }
    return raw;
  }, [verifiedProfile, initialFacilityName, currentUser?.tenantName]);

  const clinicBranch = useMemo(() => {
    if (verifiedProfile?.officialAddress) {
      return verifiedProfile.officialAddress;
    }
    return 'Main Campus OPD • Day Care & Consultation Centre';
  }, [verifiedProfile]);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) +
          ' | ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const leadDoctor = useMemo(
    () => resolveFacilityLeadDoctor(currentUser, verifiedProfile, clinicDisplayName),
    [currentUser, verifiedProfile, clinicDisplayName]
  );

  // Doctors Roster
  const [doctors, setDoctors] = useState<DutyDoctor[]>([leadDoctor]);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');

  // Queue State
  const [queue, setQueue] = useState<FrontDeskPatientToken[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'>('ALL');

  // Sound & Speech settings
  const [audioAnnounceEnabled, setAudioAnnounceEnabled] = useState(true);

  // Modals
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'WALK_IN' | 'APPOINTMENT'>('WALK_IN');
  const [printSlipItem, setPrintSlipItem] = useState<FrontDeskPatientToken | null>(null);
  const [whatsappModalItem, setWhatsappModalItem] = useState<FrontDeskPatientToken | null>(null);
  const [collectFeeItem, setCollectFeeItem] = useState<FrontDeskPatientToken | null>(null);
  const [cancelModalItem, setCancelModalItem] = useState<FrontDeskPatientToken | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Patient Left / Emergency');
  const [cancelRefundMode, setCancelRefundMode] = useState<'CASH_RETURNED' | 'UPI_REVERSAL' | 'NO_FEE_COLLECTED'>('CASH_RETURNED');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [physicalCashInput, setPhysicalCashInput] = useState<string>('');
  const [shiftStartTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isAnyModalOpen = isTokenModalOpen || !!printSlipItem || !!whatsappModalItem || !!collectFeeItem || !!cancelModalItem || isShiftModalOpen;

  // Industry Standard: Lock background body scrolling when bottom sheet / modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [isAnyModalOpen]);

  // Industry Standard: Hardware / Browser Back button support on Android & Mobile
  useEffect(() => {
    if (!isAnyModalOpen || typeof window === 'undefined') return undefined;
    window.history.pushState({ docsearchModalOpen: true }, '');

    const handlePopState = () => {
      setIsTokenModalOpen(false);
      setPrintSlipItem(null);
      setWhatsappModalItem(null);
      setCollectFeeItem(null);
      setCancelModalItem(null);
      setIsShiftModalOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAnyModalOpen]);

  // Form State for + New Token / Appointment Modal
  const [formMobile, setFormMobile] = useState('');
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formGender, setFormGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [formDoctorId, setFormDoctorId] = useState(leadDoctor.id);
  const [formVisitType, setFormVisitType] = useState<'WALK_IN' | 'APPOINTMENT' | 'FOLLOW_UP' | 'EMERGENCY'>('WALK_IN');
  const [formAppointmentDate, setFormAppointmentDate] = useState<string>(() => new Date().toISOString().split('T')[0] ?? '');
  const [formAppointmentSlot, setFormAppointmentSlot] = useState('11:00 AM');
  const [formComplaint, setFormComplaint] = useState('General Consultation');
  const [formFee, setFormFee] = useState(leadDoctor.consultationFee);
  const [formPaymentMode, setFormPaymentMode] = useState<'CASH' | 'UPI_QR' | 'CARD' | 'WAIVED' | 'SPLIT'>('UPI_QR');
  const [formSplitCash, setFormSplitCash] = useState<number>(0);
  const [formSplitUpi, setFormSplitUpi] = useState<number>(0);
  const [doctorAvailability, setDoctorAvailability] = useState<Record<string, 'AVAILABLE' | 'ON_BREAK' | 'IN_MINOR_OT'>>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('docsearch_doctor_availabilities') || '{}');
      } catch {
        return {};
      }
    }
    return {};
  });

  const handleToggleDoctorStatus = (docId: string, chamber: string, newStatus: 'AVAILABLE' | 'ON_BREAK' | 'IN_MINOR_OT') => {
    setDoctorAvailability((prev) => {
      const updated = { ...prev, [docId]: newStatus, [chamber]: newStatus };
      try {
        localStorage.setItem('docsearch_doctor_availabilities', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setDoctors((prev) =>
      prev.map((d) => (d.id === docId || d.chamber === chamber ? { ...d, status: newStatus } : d))
    );
    hospitalEventBus.publish('DOCTOR_CHAMBER_STATUS_CHANGED', 'FrontDeskWorkstationView', {
      chamberRoom: chamber,
      doctorId: docId,
      status: newStatus
    }, `Doctor ${docId} is now ${newStatus}`);
    showToast(`Doctor status: ${newStatus === 'AVAILABLE' ? '🟢 Available' : newStatus === 'ON_BREAK' ? '☕ On 30-min Break' : '🔴 In Minor OT'}`);
  };

  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('DOCTOR_CHAMBER_STATUS_CHANGED', (payload) => {
      const d = payload.data || {};
      if ((d.chamberRoom || d.chamberDoctor || d.doctorId) && d.status) {
        setDoctorAvailability((prev) => {
          const next = { ...prev };
          if (d.chamberRoom) next[d.chamberRoom] = d.status;
          if (d.doctorId) next[d.doctorId] = d.status;
          return next;
        });
        setDoctors((prev) =>
          prev.map((doc) => {
            if (doc.id === d.doctorId || doc.chamber === d.chamberRoom) {
              return { ...doc, status: d.status as any };
            }
            return doc;
          })
        );
      }
    });

    const handleCustomStatus = (e: any) => {
      const d = e.detail || {};
      if ((d.chamberRoom || d.chamberDoctor) && d.status) {
        setDoctorAvailability((prev) => {
          const next = { ...prev };
          if (d.chamberRoom) next[d.chamberRoom] = d.status;
          return next;
        });
      }
    };

    window.addEventListener('docsearch:doctor-status-changed', handleCustomStatus);
    return () => {
      unsub();
      window.removeEventListener('docsearch:doctor-status-changed', handleCustomStatus);
    };
  }, []);
  const [formIsFeePaid, setFormIsFeePaid] = useState(true);
  const [isPatientFound, setIsPatientFound] = useState(false);
  const [hasRecentVisit, setHasRecentVisit] = useState(false);
  const [_formMrn, setFormMrn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedFamilyMembers, setMatchedFamilyMembers] = useState<any[]>([]);
  const [activeSelectedMemberId, setActiveSelectedMemberId] = useState<string | null>(null);
  // Predicted Next Token Number for dynamic QR URL
  const nextAllocatedTokenNum = useMemo(() => {
    const nums = queue.map((t) => parseInt(t.tokenNumber.replace(/\D/g, '') || '0', 10)).filter((n) => !isNaN(n) && n > 0);
    const nextVal = nums.length > 0 ? Math.max(...nums) + 1 : (queue.length + 1);
    return `TK-${String(nextVal).padStart(3, '0')}`;
  }, [queue]);

  // Audio: Ascending Cash Register Chime (C5 -> E5 -> G5 -> C6)
  const playCashRegisterChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch {}
  }, []);

  // Live Soundbox & Real-time UPI Payment Reconciliation Listener
  useEffect(() => {
    const handleSoundboxPayment = (payload: any) => {
      const data = payload?.data || payload || {};
      const receivedAmount = data.amount || data.paidAmount || data.totalAmount || (formPaymentMode === 'SPLIT' ? formSplitUpi : formFee);
      setFormIsFeePaid(true);
      playCashRegisterChime();
      showToast(`✓ ₹${receivedAmount} received via UPI Soundbox!`);

      if (data.tokenNumber || data.token || data.encounterId) {
        const targetToken = data.tokenNumber || data.token;
        setQueue((prev) =>
          prev.map((t) =>
            t.tokenNumber === targetToken || (data.encounterId && t.encounterId === data.encounterId)
              ? { ...t, feeStatus: 'PAID' }
              : t
          )
        );
      }
    };

    const unsubSoundbox = hospitalEventBus.subscribe('SOUNDBOX_ALERT', handleSoundboxPayment);
    const unsubPayment = hospitalEventBus.subscribe('PAYMENT_RECEIVED', handleSoundboxPayment);

    const handleDomPayment = (e: any) => {
      handleSoundboxPayment(e.detail || {});
    };
    window.addEventListener('docsearch:soundbox_payment', handleDomPayment);

    return () => {
      unsubSoundbox();
      unsubPayment();
      window.removeEventListener('docsearch:soundbox_payment', handleDomPayment);
    };
  }, [formFee, formPaymentMode, formSplitUpi, playCashRegisterChime]);

  // 🌟 Competitive Gap 5: Automated Clinic Google Review Engine & WhatsApp Follow-up Scheduler
  const [clinicGoogleReviewUrl, setClinicGoogleReviewUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('docsearch_clinic_google_review_url') || 'https://g.page/r/docsearch-clinic/review';
    }
    return 'https://g.page/r/docsearch-clinic/review';
  });

  const [autoGoogleReviewEnabled, setAutoGoogleReviewEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('docsearch_auto_google_review_enabled') !== 'false';
    }
    return true;
  });

  const [googleReviewModalData, setGoogleReviewModalData] = useState<{
    patientName: string;
    patientMobile: string;
    doctorName: string;
    tokenNumber: string;
    followUpDays: number;
    waUrl: string;
  } | null>(null);

  const [isGoogleReviewSettingsOpen, setIsGoogleReviewSettingsOpen] = useState(false);
  const [tempGoogleReviewUrl, setTempGoogleReviewUrl] = useState(clinicGoogleReviewUrl);

  // Live Consultation Completion & Prescription Issued Listener (with Google Review Auto-Engine)
  useEffect(() => {
    const unsubRx = hospitalEventBus.subscribe('PRESCRIPTION_ISSUED', (payload) => {
      const data = payload?.data || {};
      const targetToken = data.tokenNumber || data.token;
      const patName = data.patientName || 'Patient';
      const docName = data.doctorName || 'Doctor';
      const followUp = data.followUpDays || 7;

      if (targetToken || data.encounterId) {
        let matchedPhone = (data.patientMobile || data.phone || '').replace(/\D/g, '').slice(-10);

        setQueue((prev) => {
          const matched = prev.find(
            (t) => t.tokenNumber === targetToken || (data.encounterId && t.encounterId === data.encounterId)
          );
          if (matched && !matchedPhone && matched.patientMobile) {
            matchedPhone = matched.patientMobile.replace(/\D/g, '').slice(-10);
          }
          return prev.map((t) =>
            t.tokenNumber === targetToken || (data.encounterId && t.encounterId === data.encounterId)
              ? { ...t, status: 'COMPLETED' }
              : t
          );
        });

        // 🌟 Auto-prepare Google Review & Follow-up deep-link
        if (autoGoogleReviewEnabled && matchedPhone && matchedPhone.length === 10) {
          const clinicName = clinicDisplayName || 'Our Clinic';
          const reviewText =
            `Namaste ${patName}, thank you for visiting ${clinicName}. Dr. ${docName} hopes you feel better soon!\n\n` +
            `⭐ Please take 10 seconds to share your experience on our Google Business page:\n${clinicGoogleReviewUrl}\n\n` +
            `📅 Your next follow-up is recommended in ${followUp} days. Wishing you great health!`;
          const waUrl = `https://api.whatsapp.com/send?phone=91${matchedPhone}&text=${encodeURIComponent(reviewText)}`;

          setGoogleReviewModalData({
            patientName: patName,
            patientMobile: matchedPhone,
            doctorName: docName,
            tokenNumber: targetToken || 'Token',
            followUpDays: followUp,
            waUrl
          });
          showToast(`✓ Completed #${targetToken} — Google Review & Follow-up WhatsApp ready for ${patName}`);
        } else {
          showToast(`✓ Token #${targetToken} (${patName}) completed by ${docName}`);
        }
      }
    });

    return () => {
      unsubRx();
    };
  }, [autoGoogleReviewEnabled, clinicGoogleReviewUrl, clinicDisplayName]);

  const [audioCallLanguage, setAudioCallLanguage] = useState<'HI' | 'EN'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('docsearch_audio_call_lang') as 'HI' | 'EN') || 'HI';
    }
    return 'HI';
  });

  // Load live doctors from roster service
  useEffect(() => {
    async function loadRoster() {
      try {
        const docList = await doctorRosterService.getDoctors(tenantId);
        if (Array.isArray(docList) && docList.length > 0) {
          const mapped: DutyDoctor[] = docList.map((d: any, idx: number) => ({
            id: d.id || d.doctorCode || `doc-${idx}`,
            name: d.fullName || `Dr. ${d.firstName || ''} ${d.lastName || ''}`.trim() || leadDoctor.name,
            specialty: d.primarySpecialty || 'General Physician',
            chamber: d.roomNumber || (d.metadata as any)?.chamber || `Chamber ${idx + 1}`,
            consultationFee: d.consultationFee || (d.metadata as any)?.consultationFee || 500,
            status: idx === 1 ? 'IN_CONSULTATION' : 'AVAILABLE',
            queueCount: 0,
            currentToken: undefined
          }));
          setDoctors(mapped);
          if (mapped[0]) {
            setFormDoctorId(mapped[0].id);
            setFormFee(mapped[0].consultationFee);
          }
        } else {
          setDoctors([leadDoctor]);
          setFormDoctorId(leadDoctor.id);
          setFormFee(leadDoctor.consultationFee);
        }
      } catch (err) {
        console.warn('Using clinic lead doctor:', err);
        setDoctors([leadDoctor]);
        setFormDoctorId(leadDoctor.id);
        setFormFee(leadDoctor.consultationFee);
      }
    }
    void loadRoster();
  }, [tenantId, leadDoctor]);

  // Load live encounters queue directly from PostgreSQL backend
  const fetchQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const qRes = await apiRequest<any[]>('/api/v1/partner/clinical/queues');
      let liveList: FrontDeskPatientToken[] = [];
      if (qRes.success && Array.isArray(qRes.data)) {
        liveList = qRes.data.map((item) => ({
          id: item.id,
          encounterId: item.encounterId,
          patientId: item.patientId,
          tokenNumber: item.tokenNumber || `TK-${item.id.slice(0, 4)}`,
          patientName: item.patientName || item.metadata?.patientName || 'Patient',
          patientMobile: item.patientPhone || item.metadata?.patientPhone || '',
          gender: (item.gender || item.metadata?.gender || 'MALE') as any,
          age: String(item.age || item.metadata?.age || '30'),
          mrn: item.mrn || item.uhid || item.metadata?.mrn || 'UHID-00000',
          doctorId: item.doctorId || 'doc-1',
          doctorName: item.doctorName || item.metadata?.doctorName || 'Dr. Specialist',
          chamber: item.metadata?.chamber || 'Chamber 1',
          status: (item.queueStatus === 'SERVED' || item.encounterStatus === 'COMPLETED')
            ? 'COMPLETED'
            : (item.queueStatus === 'IN_PROGRESS' || item.queueStatus === 'CALLED' ? 'IN_CONSULTATION' : 'WAITING'),
          visitType: (item.metadata?.visitType || 'WALK_IN') as any,
          appointmentTime: item.metadata?.appointmentTime,
          chiefComplaint: item.chiefComplaint || item.metadata?.chiefComplaint || 'Routine OPD consultation',
          consultationFee: item.paymentAmount || item.metadata?.consultationFee || 500,
          feePaymentMode: (item.paymentMethod || item.metadata?.feePaymentMode || 'CASH') as any,
          feeStatus: (item.paymentStatus === 'PAID' ? 'PAID' : (item.paymentStatus === 'PAY_LATER' ? 'PAY_LATER' : 'PENDING')) as any,
          feeReceiptNo: item.paymentNumber || item.invoiceNumber || item.metadata?.feeReceiptNo || '',
          createdAt: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
          queueEligibility: item.queueEligibility,
          blockingReason: item.blockingReason,
          hasVitals: item.hasVitals
        }));
      }

      setQueue(liveList);

      // Update doctor queue numbers & current tokens based on live database queue
      setDoctors((prev) =>
        prev.map((doc) => {
          const docQueue = liveList.filter((t) => t.doctorId === doc.id || t.doctorName.toLowerCase().includes(doc.name.toLowerCase()));
          const waiting = docQueue.filter((t) => t.status === 'WAITING').length;
          const activeItem = docQueue.find((t) => t.status === 'IN_CONSULTATION');
          return {
            ...doc,
            queueCount: waiting,
            status: activeItem ? 'IN_CONSULTATION' : 'AVAILABLE',
            currentToken: activeItem?.tokenNumber || (docQueue.find((t) => t.status === 'WAITING')?.tokenNumber)
          };
        })
      );
    } catch (err) {
      console.warn('Live queue load error:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    void fetchQueue();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void fetchQueue();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Keyboard shortcut & custom event listener: F2 = New Walk-in Token, F3 = Book Appointment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        openNewTokenModal('WALK_IN');
      } else if (e.key === 'F3') {
        e.preventDefault();
        openNewTokenModal('APPOINTMENT');
      }
    };
    const handleCustomWalkIn = () => openNewTokenModal('WALK_IN');
    const handleCustomBooking = () => openNewTokenModal('APPOINTMENT');

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('docsearch:open_frontdesk_walkin', handleCustomWalkIn);
    window.addEventListener('docsearch:open_frontdesk_book', handleCustomBooking);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('docsearch:open_frontdesk_walkin', handleCustomWalkIn);
      window.removeEventListener('docsearch:open_frontdesk_book', handleCustomBooking);
    };
  }, [doctors]);

  // Audio Speech & Gentle Chime (Bilingual Hindi/English Caller)
  const announcePatientCall = (item: FrontDeskPatientToken) => {
    if (!audioAnnounceEnabled || typeof window === 'undefined') return;
    try {
      // 1. Play gentle dual-tone chime (Ding-Dong sound) via Web Audio API
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        }
      } catch {}

      // 2. Bilingual Speech Synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let text = '';
        let lang = 'en-IN';
        if (audioCallLanguage === 'HI') {
          text = `टोकन नंबर ${item.tokenNumber}. ${item.patientName}. कृपया ${item.chamber} में पधारें।`;
          lang = 'hi-IN';
        } else {
          text = `Token number ${item.tokenNumber}. ${item.patientName}. Please proceed to ${item.chamber}.`;
          lang = 'en-IN';
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
      }

      // Publish event across hospital network for TV screen & waiting rooms
      hospitalEventBus.publish('PATIENT_CALLED', 'FrontDeskWorkstationView', {
        token: item.tokenNumber,
        tokenNumber: item.tokenNumber,
        patientName: item.patientName,
        chamber: item.chamber,
        roomNumber: item.chamber,
        doctorName: item.doctorName
      });
    } catch {}
  };

  // Select a specific family member / dependent
  const handleSelectFamilyMember = (member: any) => {
    setActiveSelectedMemberId(member.id);
    setFormName(member.fullName);
    setFormAge(member.age || '30');
    setFormGender(member.gender || 'MALE');
    setFormMrn(member.mrn || `UHID-${Math.floor(10000 + Math.random() * 90000)}`);
    setIsPatientFound(true);
    setHasRecentVisit(Boolean(member.hasRecentVisit ?? true));
    showToast(`Selected: ${member.fullName} (${member.mrn})`);
  };

  // 1-Click "Add New Dependent / Child on this mobile"
  const handleAddNewDependent = () => {
    setActiveSelectedMemberId('NEW_DEPENDENT');
    setFormName('');
    setFormAge('');
    setFormGender('MALE');
    setFormMrn(`UHID-${Math.floor(10000 + Math.random() * 90000)}`);
    setIsPatientFound(false);
    setHasRecentVisit(false);
    showToast(`Enter details for new family member on ${formMobile}`);
  };

  // Auto-search patient & family members when mobile is 10 digits
  const handleMobileChange = async (mobile: string) => {
    setFormMobile(mobile);
    const digitsOnly = mobile.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      const candidates: any[] = [];

      // 1. Check existing live queue
      queue.forEach((q) => {
        if (q.patientMobile.replace(/\D/g, '') === digitsOnly) {
          if (!candidates.some((c) => c.fullName.toLowerCase() === q.patientName.toLowerCase())) {
            candidates.push({
              id: q.patientId || q.id,
              fullName: q.patientName,
              age: q.age,
              gender: q.gender,
              mrn: q.mrn,
              relationship: parseInt(q.age || '30', 10) <= 14 ? 'CHILD' : 'SELF',
              hasRecentVisit: true
            });
          }
        }
      });

      // 2. Check localStorage patient database
      try {
        const regPatients = JSON.parse(localStorage.getItem('docsearch_patients') || '[]');
        regPatients.forEach((p: any) => {
          if ((p.primaryMobile || p.phone || '').replace(/\D/g, '') === digitsOnly) {
            const name = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim();
            if (!candidates.some((c) => c.fullName.toLowerCase() === name.toLowerCase())) {
              const hasRecent = p.lastVisitDate ? (Date.now() - new Date(p.lastVisitDate).getTime() < 7 * 86400000) : true;
              candidates.push({
                id: p.id,
                fullName: name,
                age: p.age?.toString() || '30',
                gender: p.gender || 'MALE',
                mrn: p.mrn || `UHID-${Math.floor(10000 + Math.random() * 90000)}`,
                relationship: parseInt(p.age?.toString() || '30', 10) <= 14 ? 'CHILD' : 'SELF',
                hasRecentVisit: hasRecent
              });
            }
          }
        });
      } catch {}

      // 3. Check backend API Gateway for registered patients
      try {
        const res = await apiRequest<any>(`/api/v1/partner/clinical/patients?phone=${digitsOnly}`);
        const apiPatients = res.data?.items || res.data || [];
        if (Array.isArray(apiPatients)) {
          apiPatients.forEach((p: any) => {
            const name = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim();
            if (!candidates.some((c) => c.fullName.toLowerCase() === name.toLowerCase())) {
              const hasRecent = (p.lastVisitDate || p.updatedAt) ? (Date.now() - new Date(p.lastVisitDate || p.updatedAt).getTime() < 7 * 86400000) : true;
              candidates.push({
                id: p.id,
                fullName: name,
                age: p.age?.toString() || '30',
                gender: p.gender || 'MALE',
                mrn: p.mrn || p.uhid || `UHID-${Math.floor(10000 + Math.random() * 90000)}`,
                relationship: parseInt(p.age?.toString() || '30', 10) <= 14 ? 'CHILD' : 'SELF',
                hasRecentVisit: hasRecent
              });
            }
          });
        }
      } catch {}

      setMatchedFamilyMembers(candidates);

      if (candidates.length > 0) {
        handleSelectFamilyMember(candidates[0]);
        showToast(`${candidates.length} patient record(s) found on this number`);
      } else {
        setIsPatientFound(false);
        setHasRecentVisit(false);
        setActiveSelectedMemberId(null);
        setFormMrn(`UHID-${Math.floor(10000 + Math.random() * 90000)}`);
      }
    } else {
      setMatchedFamilyMembers([]);
      setActiveSelectedMemberId(null);
      setIsPatientFound(false);
      setHasRecentVisit(false);
    }
  };

  const openNewTokenModal = (mode: 'WALK_IN' | 'APPOINTMENT') => {
    setModalMode(mode);
    setFormVisitType(mode === 'WALK_IN' ? 'WALK_IN' : 'APPOINTMENT');
    setFormMobile('');
    setFormName('');
    setFormAge('');
    setFormGender('MALE');
    setFormComplaint('General OPD Consultation');
    setIsPatientFound(false);
    setHasRecentVisit(false);
    setMatchedFamilyMembers([]);
    setActiveSelectedMemberId(null);
    setFormPaymentMode('UPI_QR');
    setFormSplitCash(0);
    setFormSplitUpi(0);
    setFormIsFeePaid(true);

    const doc = doctors[0];
    if (doc) {
      setFormDoctorId(doc.id);
      setFormFee(doc.consultationFee);
    }
    setIsTokenModalOpen(true);
  };

  const handleDoctorSelect = (docId: string) => {
    setFormDoctorId(docId);
    const doc = doctors.find((d) => d.id === docId);
    if (doc) {
      setFormFee(doc.consultationFee);
    }
  };

  // Create Token Submission - Authoritative Database Persistence
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Patient Name is required');
      return;
    }
    if (!formMobile.trim() || formMobile.replace(/\D/g, '').length < 10) {
      showToast('Valid 10-digit mobile number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDoc = doctors.find((d) => d.id === formDoctorId) || doctors[0];
      const normalizedPhone = formMobile.replace(/\D/g, '');
      const nameParts = formName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Patient';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

      // 1. Authoritative Backend Patient Resolution / Registration
      const patRes = await apiRequest<any>('/api/v1/partner/clinical/patients', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          gender: formGender,
          mobileNumber: normalizedPhone,
          dateOfBirth: new Date(Date.now() - (parseInt(formAge || '30', 10) * 365.25 * 24 * 3600 * 1000)).toISOString().split('T')[0]
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
          encounterType: formVisitType,
          chiefComplaint: formComplaint.trim() || 'Routine OPD consultation',
          status: 'WAITING',
          metadata: {
            feePaymentMode: formPaymentMode,
            splitCashAmount: formPaymentMode === 'SPLIT' ? Number(formSplitCash) : undefined,
            splitUpiAmount: formPaymentMode === 'SPLIT' ? Number(formSplitUpi) : undefined,
            feeStatus: formIsFeePaid ? 'PAID' : 'PAY_LATER',
            consultationFee: formFee,
            patientName: formName.trim(),
            patientPhone: normalizedPhone,
            age: formAge || '30',
            gender: formGender,
            chamber: selectedDoc?.chamber || 'Chamber 1',
            appointmentTime: formVisitType === 'APPOINTMENT' ? `${formAppointmentDate} @ ${formAppointmentSlot}` : undefined
          }
        })
      });

      const encounterData = checkInRes.data || checkInRes;
      const activeEncounterId = encounterData?.id;

      // 3. Authoritative Backend Payment Collection if marked Paid
      let paymentRecord: any = null;
      if (formIsFeePaid && activeEncounterId && formFee > 0) {
        const payRes = await apiRequest<any>(`/api/v1/partner/clinical/encounters/${activeEncounterId}/payments`, {
          method: 'POST',
          body: JSON.stringify({
            amount: Number(formFee),
            paymentMethod: formPaymentMode === 'UPI_QR' ? 'UPI' : (formPaymentMode === 'CARD' ? 'CARD' : 'CASH'),
            notes: 'OPD Consultation Fee collected at Front Desk'
          })
        });
        paymentRecord = payRes.data || payRes;
      }

      // 4. Refresh live queue directly from authoritative PostgreSQL database
      await fetchQueue();

      const allocatedTokenNum = encounterData?.tokenNumber || encounterData?.queueToken?.tokenNumber || `TK-${activeEncounterId?.slice(0, 4) || 'NEW'}`;

      const printTokenItem: FrontDeskPatientToken = {
        id: encounterData?.queueToken?.id || activeEncounterId || `tok-${Date.now()}`,
        encounterId: activeEncounterId,
        patientId,
        tokenNumber: allocatedTokenNum,
        patientName: formName.trim(),
        patientMobile: formMobile.trim(),
        gender: formGender,
        age: formAge || '30',
        mrn: patientData?.mrn || `UHID-${Math.floor(10000 + Math.random() * 90000)}`,
        doctorId: selectedDoc?.id ?? 'doc-1',
        doctorName: selectedDoc?.name ?? 'Dr. Specialist',
        chamber: selectedDoc?.chamber ?? 'Chamber 1',
        status: 'WAITING',
        visitType: formVisitType,
        appointmentTime: formVisitType === 'APPOINTMENT' ? `${formAppointmentDate} @ ${formAppointmentSlot}` : undefined,
        chiefComplaint: formComplaint,
        consultationFee: formFee,
        feePaymentMode: formPaymentMode,
        splitCashAmount: formPaymentMode === 'SPLIT' ? Number(formSplitCash) : undefined,
        splitUpiAmount: formPaymentMode === 'SPLIT' ? Number(formSplitUpi) : undefined,
        feeStatus: formIsFeePaid ? 'PAID' : 'PAY_LATER',
        feeReceiptNo: paymentRecord?.paymentNumber || paymentRecord?.invoiceNumber || `REC-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      // Emit event across hospital platform
      hospitalEventBus.publish('TOKEN_GENERATED', 'front-desk', {
        encounterId: activeEncounterId,
        patientId,
        patientName: printTokenItem.patientName,
        doctorId: printTokenItem.doctorId,
        doctorName: printTokenItem.doctorName,
        type: printTokenItem.visitType,
        visitType: printTokenItem.visitType,
        tokenNumber: allocatedTokenNum,
        chamber: printTokenItem.chamber,
        status: 'WAITING'
      }, `Token ${allocatedTokenNum} generated for ${printTokenItem.patientName}`);

      try {
        window.dispatchEvent(new CustomEvent('docsearch:patient-registered', { detail: printTokenItem }));
        window.dispatchEvent(new CustomEvent('docsearch:encounters-updated', { detail: printTokenItem }));
      } catch {
        // Safe fallback
      }

      announcePatientCall(printTokenItem);
      setIsTokenModalOpen(false);
      setPrintSlipItem(printTokenItem);
      showToast(`Token ${allocatedTokenNum} generated successfully in database for ${printTokenItem.patientName}`);
    } catch (err: any) {
      showToast(err?.message || 'Error issuing token. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

    // Cancel Token & Fee Reversal
  const handleConfirmCancelToken = async () => {
    if (!cancelModalItem) return;
    try {
      const tokenId = cancelModalItem.id;
      try {
        await apiRequest(`/api/v1/partner/clinical/queues/${tokenId}/cancel`, {
          method: 'PATCH',
          body: JSON.stringify({ reason: cancelReason, refundMode: cancelRefundMode })
        });
      } catch {
        // Local/graceful database fallback
      }

      setQueue((prev) =>
        prev.map((t) =>
          t.id === tokenId
            ? {
                ...t,
                status: 'CANCELLED' as any,
                cancellationReason: cancelReason,
                cancellationRefundMode: cancelRefundMode,
                cancelledAt: new Date().toISOString()
              }
            : t
        )
      );

      try {
        const localTokens = JSON.parse(localStorage.getItem('docsearch_offline_tokens') || '[]');
        if (Array.isArray(localTokens)) {
          const updatedLocal = localTokens.map((t: any) =>
            t.id === tokenId
              ? {
                  ...t,
                  status: 'CANCELLED',
                  cancellationReason: cancelReason,
                  cancellationRefundMode: cancelRefundMode,
                  cancelledAt: new Date().toISOString()
                }
              : t
          );
          localStorage.setItem('docsearch_offline_tokens', JSON.stringify(updatedLocal));
        }
      } catch {}

      showToast(`Token #${cancelModalItem.tokenNumber} marked CANCELLED (${cancelRefundMode === 'CASH_RETURNED' ? 'Cash Refunded' : cancelRefundMode === 'UPI_REVERSAL' ? 'UPI Reversal Initiated' : 'No Fee'})`);
      setCancelModalItem(null);
      await fetchQueue();
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel token');
    }
  };

  // Status changers - Database Bound
  const handleUpdateStatus = async (tokenId: string, newStatus: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED') => {
    try {
      const target = queue.find((i) => i.id === tokenId);
      if (newStatus === 'IN_CONSULTATION') {
        await apiRequest(`/api/v1/partner/clinical/queues/${tokenId}/call`, {
          method: 'PATCH'
        });
        if (target) announcePatientCall(target);
      } else if (newStatus === 'COMPLETED') {
        await apiRequest(`/api/v1/partner/clinical/queues/${tokenId}/complete`, {
          method: 'PATCH'
        });
      }
      await fetchQueue();
      showToast(`Status updated to ${newStatus.replace('_', ' ')} in database`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update queue status');
    }
  };

  // Collect Fee for Pending Tokens - Authoritative Database Persistence
  const handleConfirmCollectFee = async () => {
    if (!collectFeeItem) return;
    try {
      const encounterId = collectFeeItem.encounterId || collectFeeItem.id;
      await apiRequest(`/api/v1/partner/clinical/encounters/${encounterId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(collectFeeItem.consultationFee || 500),
          paymentMethod: 'CASH',
          notes: 'Consultation fee collected at front desk counter'
        })
      });

      await fetchQueue();
      showToast(`Fee of ₹${collectFeeItem.consultationFee} marked Paid in database`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to record payment in database');
    } finally {
      setCollectFeeItem(null);
    }
  };

  // Shift Handover & Daily Galla (Cash) Tally calculations
  const shiftStats = useMemo(() => {
    const totalTokens = queue.length;
    const walkInTokens = queue.filter((t) => t.visitType === 'WALK_IN').length;
    const appointmentTokens = queue.filter((t) => t.visitType === 'APPOINTMENT').length;
    const emergencyTokens = queue.filter((t) => t.visitType === 'EMERGENCY').length;

    // Filter cancelled tokens
    const activeTokens = queue.filter((t) => t.status !== 'CANCELLED');
    const cancelledTokens = queue.filter((t) => t.status === 'CANCELLED');
    const totalCancelledCount = cancelledTokens.length;

    // Calculate refunded cash / UPI
    const cancelledCashRefunds = cancelledTokens
      .filter((t) => (t as any).cancellationRefundMode === 'CASH_RETURNED')
      .reduce((sum, t) => sum + (t.feePaymentMode === 'SPLIT' ? (Number((t as any).splitCashAmount) || 0) : (Number(t.consultationFee) || 0)), 0);

    const cancelledUpiRefunds = cancelledTokens
      .filter((t) => (t as any).cancellationRefundMode === 'UPI_REVERSAL')
      .reduce((sum, t) => sum + (t.feePaymentMode === 'SPLIT' ? (Number((t as any).splitUpiAmount) || 0) : (Number(t.consultationFee) || 0)), 0);

    const totalCashFee = activeTokens
      .filter((t) => t.feeStatus === 'PAID' && (t.feePaymentMode === 'CASH' || t.feePaymentMode === 'SPLIT'))
      .reduce((sum, t) => sum + (t.feePaymentMode === 'SPLIT' ? (Number((t as any).splitCashAmount) || 0) : (Number(t.consultationFee) || 0)), 0);

    const totalUpiFee = activeTokens
      .filter((t) => t.feeStatus === 'PAID' && (t.feePaymentMode === 'UPI_QR' || t.feePaymentMode === 'SPLIT'))
      .reduce((sum, t) => sum + (t.feePaymentMode === 'SPLIT' ? (Number((t as any).splitUpiAmount) || 0) : (Number(t.consultationFee) || 0)), 0);

    const totalCardFee = activeTokens
      .filter((t) => t.feeStatus === 'PAID' && t.feePaymentMode === 'CARD')
      .reduce((sum, t) => sum + (Number(t.consultationFee) || 0), 0);

    const totalWaivedFee = activeTokens
      .filter((t) => t.feePaymentMode === 'WAIVED')
      .reduce((sum, t) => sum + (Number(t.consultationFee) || 0), 0);

    const totalSplitTokens = activeTokens.filter((t) => t.feePaymentMode === 'SPLIT').length;
    const grandTotalCollected = totalCashFee + totalUpiFee + totalCardFee;
    const physicalCashEntered = parseFloat(physicalCashInput) || 0;
    const cashDiscrepancy = physicalCashEntered - totalCashFee;

    return {
      totalTokens,
      walkInTokens,
      appointmentTokens,
      emergencyTokens,
      totalCancelledCount,
      cancelledCashRefunds,
      cancelledUpiRefunds,
      totalCashFee,
      totalUpiFee,
      totalCardFee,
      totalWaivedFee,
      totalSplitTokens,
      grandTotalCollected,
      physicalCashEntered,
      cashDiscrepancy
    };
  }, [queue, physicalCashInput]);

  const handlePrintShiftHandover = async () => {
    try {
      const data: ShiftHandoverSlipData = {
        clinicName: clinicDisplayName,
        facilityBranch: clinicBranch,
        receptionistName: currentUser?.name || 'Front Desk Staff',
        shiftDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        shiftStartTime: shiftStartTime,
        shiftEndTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalTokens: shiftStats.totalTokens,
        walkInTokens: shiftStats.walkInTokens,
        appointmentTokens: shiftStats.appointmentTokens,
        emergencyTokens: shiftStats.emergencyTokens,
        totalCashFee: shiftStats.totalCashFee,
        totalUpiFee: shiftStats.totalUpiFee,
        totalCardFee: shiftStats.totalCardFee,
        totalWaivedFee: shiftStats.totalWaivedFee,
        totalSplitTokens: shiftStats.totalSplitTokens,
        grandTotalCollected: shiftStats.grandTotalCollected,
        physicalCashEntered: shiftStats.physicalCashEntered,
        cashDiscrepancy: shiftStats.cashDiscrepancy,
        cancelledTokens: shiftStats.totalCancelledCount,
        cancelledCashRefunds: shiftStats.cancelledCashRefunds
      };

      const result = await hardwarePrinterService.printShiftHandoverSlip(data, 32);
      showToast(result.message || 'Shift Handover Slip printed successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to print shift slip');
    }
  };

  // Filtered Queue with Emergency STAT Priority Auto-Elevation
  const filteredQueue = useMemo(() => {
    const list = queue.filter((item) => {
      if (selectedDoctorFilter !== 'ALL' && item.doctorId !== selectedDoctorFilter) {
        return false;
      }

      if (statusFilter === 'WAITING' && item.status !== 'WAITING') return false;
      if (statusFilter === 'IN_CONSULTATION' && item.status !== 'IN_CONSULTATION') return false;
      if (statusFilter === 'COMPLETED' && item.status !== 'COMPLETED') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          item.patientName.toLowerCase().includes(q) ||
          item.patientMobile.includes(q) ||
          item.tokenNumber.toLowerCase().includes(q) ||
          item.mrn.toLowerCase().includes(q) ||
          item.doctorName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });

    // Strictly prioritize queue sorting:
    // Hierarchy: EMERGENCY (top priority with pulsating red tag) > IN_CONSULTATION > WAITING (chronological token order) > COMPLETED (bottom)
    return [...list].sort((a, b) => {
      const getPriorityScore = (item: FrontDeskPatientToken): number => {
        if (item.visitType === 'EMERGENCY' && item.status !== 'COMPLETED') return 1;
        if (item.status === 'IN_CONSULTATION') return 2;
        if (item.status === 'WAITING') return 3;
        return 4;
      };

      const scoreA = getPriorityScore(a);
      const scoreB = getPriorityScore(b);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }

      const numA = parseInt(a.tokenNumber.replace(/\D/g, '') || '0', 10);
      const numB = parseInt(b.tokenNumber.replace(/\D/g, '') || '0', 10);
      return numA - numB;
    });
  }, [queue, selectedDoctorFilter, statusFilter, searchTerm]);

  // Zero-Click Silent ESC/POS Thermal Print via Local Hardware Agent (18080) or WebUSB
  const handleSilentThermalPrint = async (slipItem: FrontDeskPatientToken) => {
    try {
      const slipData: OpdTokenSlipData = {
        tokenNumber: slipItem.tokenNumber,
        uhid: slipItem.mrn,
        mrn: slipItem.mrn,
        patientName: `${slipItem.patientName} (${slipItem.age}${slipItem.gender?.charAt(0) || 'M'})`,
        doctorName: slipItem.doctorName,
        department: 'OPD Consultation',
        room: slipItem.chamber,
        time: slipItem.createdAt,
        fee: slipItem.consultationFee,
        paymentMode: `${slipItem.feeStatus} (${slipItem.feePaymentMode})`,
        clinicName: clinicDisplayName,
        organizationName: clinicDisplayName,
        address: clinicBranch
      };
      const res = await hardwarePrinterService.printOpdTokenSlip(slipData, 32);
      showToast(res.message);
    } catch {
      window.print();
    }
  };

  const totalPatientsCount = queue.length;
  const waitingCount = queue.filter((t) => t.status === 'WAITING').length;
  const inConsultCount = queue.filter((t) => t.status === 'IN_CONSULTATION').length;
  const completedCount = queue.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px 24px 60px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* RESPONSIVE MOBILE MODAL / BOTTOM SHEET INDUSTRY STANDARD STYLES */}
      <style>{`
        @keyframes fdSlideUpSheet {
          from {
            transform: translateY(100%);
            opacity: 0.8;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (max-width: 767px) {
          .fd-responsive-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .fd-responsive-sheet {
            border-radius: 20px 20px 0 0 !important;
            max-height: 92vh !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 16px 16px max(16px, env(safe-area-inset-bottom)) !important;
            animation: fdSlideUpSheet 0.24s cubic-bezier(0.16, 1, 0.3, 1) !important;
            overflow-y: auto !important;
            overscroll-behavior: contain !important;
          }
          .fd-mobile-drag-pill {
            display: block !important;
          }
          .fd-responsive-grid-patient {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .fd-responsive-grid-appointment {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .fd-responsive-input {
            font-size: 16px !important;
            min-height: 44px !important;
            padding: 11px 12px !important;
          }
          .fd-responsive-sticky-footer {
            position: sticky !important;
            bottom: 0 !important;
            background: #0F172A !important;
            padding: 12px 0 max(12px, env(safe-area-inset-bottom)) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            margin-top: 12px !important;
            z-index: 50 !important;
          }
        }
        @media (min-width: 768px) {
          .fd-mobile-drag-pill {
            display: none !important;
          }
        }
      `}</style>

      {/* QUICK TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: '#0F172A',
            border: '1.5px solid #06B6D4',
            borderRadius: '10px',
            padding: '12px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. CLINIC BRAND IDENTITY & LIVE DUTY DOCTORS HEADER */}
      <Card
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          padding: '22px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Clinic Brand & Branch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'rgba(6, 182, 212, 0.25)',
                border: '2px solid #06B6D4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.3)'
              }}
            >
              🏥
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                  {clinicDisplayName}
                </h1>
                <Badge variant="primary" style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06B6D4', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 800 }}>
                  OPD Front Desk
                </Badge>
                <Badge variant="success" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  ● OPD Live
                </Badge>
              </div>
              <div style={{ marginTop: '5px', fontSize: '0.8125rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>📍 <strong style={{ color: '#E2E8F0' }}>{clinicBranch}</strong></span>
                <span>•</span>
                <span>🕒 <strong style={{ color: '#38BDF8' }}>{currentTime || 'Live Clock Active'}</strong></span>
                <span>•</span>
                <span>Staff: <strong style={{ color: '#F1F5F9' }}>{currentUser?.name || 'Front Desk Executive'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioAnnounceEnabled((prev) => !prev)}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: audioAnnounceEnabled ? '#10B981' : '#94A3B8',
                backgroundColor: audioAnnounceEnabled ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
              }}
              title={audioAnnounceEnabled ? 'Audio Chime & Speech Enabled' : 'Audio Muted'}
            >
              <span>{audioAnnounceEnabled ? '🔊 Audio Chime Active' : '🔇 Audio Muted'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextLang = audioCallLanguage === 'HI' ? 'EN' : 'HI';
                setAudioCallLanguage(nextLang);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('docsearch_audio_call_lang', nextLang);
                }
                showToast(`Token caller set to ${nextLang === 'HI' ? '🇮🇳 Hindi (हिंदी)' : '🌐 English'}`);
              }}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: audioCallLanguage === 'HI' ? '#F59E0B' : '#38BDF8',
                backgroundColor: audioCallLanguage === 'HI' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                fontWeight: 800
              }}
              title="Toggle Token Voice Announcement Language (Hindi / English)"
            >
              <span>{audioCallLanguage === 'HI' ? '🇮🇳 Voice: हिंदी' : '🌐 Voice: English'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTempGoogleReviewUrl(clinicGoogleReviewUrl);
                setIsGoogleReviewSettingsOpen(true);
              }}
              style={{
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#FBBF24',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Manage Clinic Google Business Profile Review URL & Auto-Dispatch Settings"
            >
              <span>⭐</span>
              <span>Reviews: {autoGoogleReviewEnabled ? 'Auto ON' : 'Off'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void fetchQueue();
                showToast('OPD queue refreshed');
              }}
              style={{ border: '1px solid rgba(255, 255, 255, 0.15)', color: '#CBD5E1' }}
            >
              🔄 Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShiftModalOpen(true)}
              style={{
                border: '1px solid #10B981',
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                fontWeight: 800
              }}
              title="Shift End & Daily Cash Drawer / Galla Tally"
            >
              <span>💰 Shift End & Cash Tally</span>
            </Button>
          </div>
        </div>

        {/* DUTY DOCTORS STATUS BAR */}
        <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👨‍⚕️</span>
            <span>Doctors on Duty Today ({doctors.length} Chambers Active):</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedDoctorFilter('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: selectedDoctorFilter === 'ALL' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: selectedDoctorFilter === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedDoctorFilter === 'ALL' ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🏥 All Chambers</span>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>
                {queue.length}
              </span>
            </button>

            {doctors.map((doc) => {
              const isSelected = selectedDoctorFilter === doc.id;
              const docStatus = (doctorAvailability[doc.id] || doctorAvailability[doc.chamber] || doc.status) as 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_BREAK' | 'IN_MINOR_OT';
              const isConsulting = docStatus === 'IN_CONSULTATION';
              const isOnBreak = docStatus === 'ON_BREAK';
              const isInMinorOt = docStatus === 'IN_MINOR_OT';

              return (
                <div
                  key={doc.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1.5px solid #06B6D4'
                      : isOnBreak
                      ? '1px solid rgba(245, 158, 11, 0.45)'
                      : isInMinorOt
                      ? '1px solid rgba(239, 68, 68, 0.45)'
                      : isConsulting
                      ? '1px solid rgba(56, 189, 248, 0.4)'
                      : '1px solid rgba(16, 185, 129, 0.35)',
                    backgroundColor: isSelected
                      ? 'rgba(6, 182, 212, 0.22)'
                      : isOnBreak
                      ? 'rgba(245, 158, 11, 0.12)'
                      : isInMinorOt
                      ? 'rgba(239, 68, 68, 0.12)'
                      : isConsulting
                      ? 'rgba(56, 189, 248, 0.08)'
                      : 'rgba(16, 185, 129, 0.08)',
                    boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.3)' : 'none'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorFilter(isSelected ? 'ALL' : doc.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: 0
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isOnBreak ? '#F59E0B' : isInMinorOt ? '#EF4444' : isConsulting ? '#38BDF8' : '#10B981',
                        boxShadow: `0 0 6px ${isOnBreak ? '#F59E0B' : isInMinorOt ? '#EF4444' : isConsulting ? '#38BDF8' : '#10B981'}`
                      }}
                    />
                    <span>
                      <strong style={{ color: '#F1F5F9' }}>{doc.name}</strong> ({doc.chamber})
                    </span>
                    <span
                      style={{
                        backgroundColor: isOnBreak
                          ? 'rgba(245, 158, 11, 0.25)'
                          : isInMinorOt
                          ? 'rgba(239, 68, 68, 0.25)'
                          : isConsulting
                          ? 'rgba(56, 189, 248, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                        color: isOnBreak ? '#FBBF24' : isInMinorOt ? '#F87171' : isConsulting ? '#38BDF8' : '#34D399',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 800
                      }}
                    >
                      {isOnBreak ? '☕ On Break (30m)' : isInMinorOt ? '🔴 Minor OT' : isConsulting ? `In Chamber (${doc.currentToken || 'Active'})` : `Available (${doc.queueCount} wait)`}
                    </span>
                  </button>

                  {/* Quick Receptionist Status Toggle Controls */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '4px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px', padding: '1px' }}>
                    <button
                      type="button"
                      title="Set Doctor: Available"
                      onClick={() => handleToggleDoctorStatus(doc.id, doc.chamber, 'AVAILABLE')}
                      style={{
                        padding: '1px 4px',
                        borderRadius: '3px',
                        border: 'none',
                        fontSize: '0.62rem',
                        cursor: 'pointer',
                        backgroundColor: docStatus === 'AVAILABLE' ? '#10B981' : 'transparent',
                        opacity: docStatus === 'AVAILABLE' ? 1 : 0.4
                      }}
                    >
                      🟢
                    </button>
                    <button
                      type="button"
                      title="Set Doctor: On 30-min Break"
                      onClick={() => handleToggleDoctorStatus(doc.id, doc.chamber, 'ON_BREAK')}
                      style={{
                        padding: '1px 4px',
                        borderRadius: '3px',
                        border: 'none',
                        fontSize: '0.62rem',
                        cursor: 'pointer',
                        backgroundColor: docStatus === 'ON_BREAK' ? '#F59E0B' : 'transparent',
                        opacity: docStatus === 'ON_BREAK' ? 1 : 0.4
                      }}
                    >
                      ☕
                    </button>
                    <button
                      type="button"
                      title="Set Doctor: In Minor OT / Emergency"
                      onClick={() => handleToggleDoctorStatus(doc.id, doc.chamber, 'IN_MINOR_OT')}
                      style={{
                        padding: '1px 4px',
                        borderRadius: '3px',
                        border: 'none',
                        fontSize: '0.62rem',
                        cursor: 'pointer',
                        backgroundColor: docStatus === 'IN_MINOR_OT' ? '#EF4444' : 'transparent',
                        opacity: docStatus === 'IN_MINOR_OT' ? 1 : 0.4
                      }}
                    >
                      🔴
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 2. PROMINENT 3-CLICK ACTION BAR & PATIENT SEARCH */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          padding: '14px 18px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Fast Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => openNewTokenModal('WALK_IN')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              border: '1.5px solid #38BDF8',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span>+ New Walk-in / OPD Token</span>
            <kbd style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', marginLeft: '4px' }}>
              F2
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => openNewTokenModal('APPOINTMENT')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38BDF8',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📅</span>
            <span>+ Book Future Slot</span>
            <kbd style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.25)', marginLeft: '4px' }}>
              F3
            </kbd>
          </button>

          {onNavigateModule && (
            <>
              <button
                type="button"
                onClick={() => onNavigateModule('opd-one-flow-express')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(2, 132, 199, 0.2)',
                  border: '1.5px solid #0284c7',
                  color: '#38BDF8',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <span>⚡</span>
                <span>OPD 1-Flow Express</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateModule('patient-registration')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#CBD5E1',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <span>📇</span>
                <span>Patient Directory</span>
              </button>
            </>
          )}
        </div>

        {/* Live Patient Search Input */}
        <div style={{ minWidth: '320px', flex: '1', maxWidth: '480px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.9rem' }}>
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient by Mobile, Name, or UHID (Ctrl+K)..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F8FAFC',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. OPD QUEUE FILTER TABS & SUMMARY COUNTERS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: statusFilter === 'ALL' ? '#0284C7' : 'transparent',
              color: statusFilter === 'ALL' ? '#FFFFFF' : '#94A3B8',
              fontSize: '0.8125rem',
              fontWeight: statusFilter === 'ALL' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            All Patients ({totalPatientsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('WAITING')}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: statusFilter === 'WAITING' ? '#F59E0B' : 'transparent',
              color: statusFilter === 'WAITING' ? '#0F172A' : '#FBBF24',
              fontSize: '0.8125rem',
              fontWeight: statusFilter === 'WAITING' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            ⏱️ Waiting ({waitingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_CONSULTATION')}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: statusFilter === 'IN_CONSULTATION' ? '#06B6D4' : 'transparent',
              color: statusFilter === 'IN_CONSULTATION' ? '#0F172A' : '#38BDF8',
              fontSize: '0.8125rem',
              fontWeight: statusFilter === 'IN_CONSULTATION' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            🩺 In Consultation ({inConsultCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: statusFilter === 'COMPLETED' ? '#10B981' : 'transparent',
              color: statusFilter === 'COMPLETED' ? '#0F172A' : '#34D399',
              fontSize: '0.8125rem',
              fontWeight: statusFilter === 'COMPLETED' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            ✅ Completed ({completedCount})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#94A3B8' }}>
          {isLoadingQueue && <span style={{ color: '#38BDF8', fontSize: '0.72rem', fontWeight: 600 }}>🔄 Live Syncing...</span>}
          <span>Showing <strong style={{ color: '#F8FAFC' }}>{filteredQueue.length}</strong> patients in live queue</span>
        </div>
      </div>

      {/* 4. TODAY'S LIVE OPD QUEUE BOARD TABLE */}
      <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <TableHead style={{ width: '90px', padding: '12px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Token</TableHead>
                <TableHead style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Patient Details</TableHead>
                <TableHead style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Mobile</TableHead>
                <TableHead style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Doctor & Chamber</TableHead>
                <TableHead style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Type</TableHead>
                <TableHead style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Consultation Fee</TableHead>
                <TableHead style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Queue Status</TableHead>
                <TableHead style={{ width: '260px', padding: '12px 16px', textAlign: 'right', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📇</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9' }}>No patients matching this filter</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>Click <strong>"+ New Walk-in / OPD Token"</strong> (or press F2) to register a patient.</div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map((item) => {
                  const isWaiting = item.status === 'WAITING';
                  const isInConsult = item.status === 'IN_CONSULTATION';
                  const isDone = item.status === 'COMPLETED';
                  const isEmergency = item.visitType === 'EMERGENCY' && item.status !== 'COMPLETED';

                  return (
                    <TableRow
                      key={item.id}
                      style={{
                        backgroundColor: isEmergency ? 'rgba(239, 68, 68, 0.12)' : isInConsult ? 'rgba(6, 182, 212, 0.06)' : isDone ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                        borderLeft: isEmergency ? '4px solid #EF4444' : undefined,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.12s ease'
                      }}
                    >
                      {/* Token # */}
                      <TableCell style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontWeight: 900,
                              fontSize: '0.85rem',
                              letterSpacing: '0.04em',
                              backgroundColor: isEmergency ? '#EF4444' : isInConsult ? '#06B6D4' : isWaiting ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                              color: isEmergency ? '#FFFFFF' : isInConsult ? '#0F172A' : isWaiting ? '#FBBF24' : '#34D399',
                              border: `1px solid ${isEmergency ? '#DC2626' : isInConsult ? '#06B6D4' : isWaiting ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                              boxShadow: isEmergency ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
                            }}
                          >
                            {item.tokenNumber}
                          </span>
                          {isEmergency && (
                            <span style={{ fontSize: '0.625rem', color: '#F87171', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              🚨 STAT EMERGENCY
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Patient Details */}
                      <TableCell style={{ padding: '12px 16px' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                            {item.patientName} <span style={{ color: '#94A3B8', fontWeight: 600 }}>({item.age}{item.gender === 'MALE' ? 'M' : item.gender === 'FEMALE' ? 'F' : 'O'})</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '2px' }}>
                            {item.mrn} • <span style={{ color: '#94A3B8' }}>{item.chiefComplaint}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Mobile */}
                      <TableCell style={{ padding: '12px 16px', color: '#E2E8F0', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                        {item.patientMobile}
                      </TableCell>

                      {/* Doctor & Chamber */}
                      <TableCell style={{ padding: '12px 16px' }}>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>
                            {item.doctorName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600, marginTop: '2px' }}>
                            🚪 {item.chamber}
                          </div>
                        </div>
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              item.visitType === 'WALK_IN'
                                ? 'rgba(56, 189, 248, 0.12)'
                                : item.visitType === 'APPOINTMENT'
                                ? 'rgba(168, 85, 247, 0.15)'
                                : item.visitType === 'EMERGENCY'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(16, 185, 129, 0.12)',
                            color:
                              item.visitType === 'WALK_IN'
                                ? '#38BDF8'
                                : item.visitType === 'APPOINTMENT'
                                ? '#C084FC'
                                : item.visitType === 'EMERGENCY'
                                ? '#F87171'
                                : '#34D399'
                          }}
                        >
                          {item.visitType === 'WALK_IN'
                            ? '⚡ Walk-in'
                            : item.visitType === 'APPOINTMENT'
                            ? '📅 Booked'
                            : item.visitType === 'EMERGENCY'
                            ? '🚨 Emergency'
                            : '🔄 Follow-up'}
                        </span>
                      </TableCell>

                      {/* Fee Status */}
                      <TableCell style={{ padding: '12px 16px' }}>
                        <div>
                          {item.feeStatus === 'PAID' ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34D399' }}>
                                ₹{item.consultationFee}
                              </span>
                              <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                                {item.feePaymentMode}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F87171' }}>
                                ₹{item.consultationFee} Due
                              </span>
                              <button
                                type="button"
                                onClick={() => setCollectFeeItem(item)}
                                style={{
                                  backgroundColor: '#F59E0B',
                                  color: '#0F172A',
                                  border: 'none',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                Collect
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Queue Status */}
                      <TableCell style={{ padding: '12px 16px' }}>
                        {isInConsult ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#06B6D4', fontSize: '0.75rem', fontWeight: 800 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06B6D4', boxShadow: '0 0 8px #06B6D4' }} />
                            In Consultation
                          </span>
                        ) : isWaiting ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#FBBF24', fontSize: '0.75rem', fontWeight: 700 }}>
                            <span>⏱️</span>
                            <span>Waiting</span>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#34D399', fontSize: '0.75rem', fontWeight: 700 }}>
                            <span>✓</span>
                            <span>Completed</span>
                          </span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Call Patient Button */}
                          <button
                            type="button"
                            onClick={() => announcePatientCall(item)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#38BDF8',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Call Patient using audio chime and voice announcement"
                          >
                            📢 Call
                          </button>

                          {/* In-Chamber / Complete toggle */}
                          {isWaiting && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'IN_CONSULTATION')}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                                border: '1px solid #06B6D4',
                                color: '#38BDF8',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Mark patient entered consultation room"
                            >
                              🩺 Send In
                            </button>
                          )}

                          {isInConsult && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                border: '1px solid #10B981',
                                color: '#34D399',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Mark consultation completed"
                            >
                              ✓ Done
                            </button>
                          )}

                          {/* Print Slip */}
                          <button
                            type="button"
                            onClick={() => setPrintSlipItem(item)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#CBD5E1',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                            title="Print Thermal 80mm Token Slip"
                          >
                            🖨️
                          </button>

                          {/* WhatsApp Token */}
                          <button
                            type="button"
                            onClick={() => setWhatsappModalItem(item)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(34, 197, 94, 0.12)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: '#4ADE80',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                            title="Share Token via WhatsApp"
                          >
                            📲
                          </button>

                          {/* Cancel / Refund Button */}
                          {(isWaiting || isInConsult) && (
                            <button
                              type="button"
                              onClick={() => setCancelModalItem(item)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#F87171',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Cancel Token & Issue Fee Refund"
                            >
                              ✕ Cancel
                            </button>
                          )}

                          {item.status === 'CANCELLED' && (
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#FCA5A5',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }}
                            >
                              🚫 Cancelled
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 5. MODAL: + NEW WALK-IN / APPOINTMENT TOKEN CREATION (20-SECOND FAST FLOW) */}
      {isTokenModalOpen && (
        <div
          className="fd-responsive-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={() => setIsTokenModalOpen(false)}
        >
          <div
            className="fd-responsive-sheet"
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Pill */}
            <div
              className="fd-mobile-drag-pill"
              style={{
                width: '44px',
                height: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '3px',
                margin: '0 auto 8px',
                cursor: 'grab'
              }}
            />

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>{modalMode === 'WALK_IN' ? '⚡' : '📅'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC' }}>
                    {modalMode === 'WALK_IN' ? 'New Walk-in Patient & Token' : 'Book Advance Appointment Slot'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                    Quick 20-second reception intake • Thermal slip auto-generated
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateToken} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Step 1: Mobile with auto-lookup */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Patient Mobile Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    required
                    autoFocus
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number..."
                    value={formMobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    className="fd-responsive-input"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: isPatientFound ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: '1rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {isPatientFound && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#10B981',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      ✓ Returning Patient
                    </span>
                  )}
                </div>
              </div>

              {/* Family Members & Dependent Selector Pills */}
              {matchedFamilyMembers.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>👨‍👩‍👧</span> Family Members on this Mobile ({matchedFamilyMembers.length}):
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Select patient or add dependent</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {matchedFamilyMembers.map((member) => {
                      const isSelected = activeSelectedMemberId === member.id;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSelectFamilyMember(member)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: isSelected ? '1.5px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.15)',
                            backgroundColor: isSelected ? '#0891B2' : 'rgba(255, 255, 255, 0.06)',
                            color: isSelected ? '#FFFFFF' : '#CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 800 : 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{member.relationship === 'CHILD' ? '👶' : (member.gender === 'FEMALE' ? '👩' : '👤')}</span>
                          <span>{member.fullName}</span>
                          <span style={{ opacity: 0.75, fontSize: '0.68rem' }}>({member.age}{member.gender?.charAt(0)})</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={handleAddNewDependent}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: activeSelectedMemberId === 'NEW_DEPENDENT' ? '1.5px solid #10B981' : '1px dashed #10B981',
                        backgroundColor: activeSelectedMemberId === 'NEW_DEPENDENT' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)',
                        color: '#34D399',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>➕</span>
                      <span>Add New Dependent / Child</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Patient Name, Age, Gender */}
              <div className="fd-responsive-grid-patient" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="fd-responsive-input"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="32"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="fd-responsive-input"
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    Gender
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="fd-responsive-input"
                    style={{
                      width: '100%',
                      padding: '9px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="MALE">Male (M)</option>
                    <option value="FEMALE">Female (F)</option>
                    <option value="OTHER">Other (O)</option>
                  </select>
                </div>
              </div>

              {/* Step 2.5: Interactive Visit Type & Triage Priority Selector */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1' }}>
                    Visit Type & Triage Priority
                  </label>
                  {formVisitType === 'EMERGENCY' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid #EF4444',
                        color: '#F87171',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        animation: 'pulse 1.5s infinite'
                      }}
                    >
                      🚨 Top Priority STAT Queue Elevation
                    </span>
                  )}
                  {formVisitType === 'FOLLOW_UP' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10B981',
                        color: '#34D399',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      ✓ 7-Day Follow-Up Review: Free
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {/* [⚡ Walk-in] */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormVisitType('WALK_IN');
                      setModalMode('WALK_IN');
                      const doc = doctors.find((d) => d.id === formDoctorId) || doctors[0];
                      if (doc) setFormFee(doc.consultationFee);
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: formVisitType === 'WALK_IN' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: formVisitType === 'WALK_IN' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: formVisitType === 'WALK_IN' ? '#38BDF8' : '#94A3B8',
                      fontWeight: formVisitType === 'WALK_IN' ? 800 : 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>⚡</span>
                    <span>Walk-in</span>
                  </button>

                  {/* [📅 Booked] */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormVisitType('APPOINTMENT');
                      setModalMode('APPOINTMENT');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: formVisitType === 'APPOINTMENT' ? '1.5px solid #818CF8' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: formVisitType === 'APPOINTMENT' ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: formVisitType === 'APPOINTMENT' ? '#A5B4FC' : '#94A3B8',
                      fontWeight: formVisitType === 'APPOINTMENT' ? 800 : 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>📅</span>
                    <span>Booked</span>
                  </button>

                  {/* [🔄 Follow-up / Review] */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormVisitType('FOLLOW_UP');
                      setModalMode('WALK_IN');
                      setFormFee(0);
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: formVisitType === 'FOLLOW_UP' ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: formVisitType === 'FOLLOW_UP' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: formVisitType === 'FOLLOW_UP' ? '#34D399' : '#94A3B8',
                      fontWeight: formVisitType === 'FOLLOW_UP' ? 800 : 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>🔄</span>
                    <span>Follow-up</span>
                  </button>

                  {/* [🚨 Emergency / STAT] */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormVisitType('EMERGENCY');
                      setModalMode('WALK_IN');
                      const doc = doctors.find((d) => d.id === formDoctorId) || doctors[0];
                      if (doc) setFormFee(doc.consultationFee);
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: formVisitType === 'EMERGENCY' ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: formVisitType === 'EMERGENCY' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: formVisitType === 'EMERGENCY' ? '#F87171' : '#94A3B8',
                      fontWeight: formVisitType === 'EMERGENCY' ? 800 : 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: formVisitType === 'EMERGENCY' ? '0 0 12px rgba(239, 68, 68, 0.45)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>🚨</span>
                    <span>Emergency</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Doctor Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Select Doctor & Chamber <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formDoctorId}
                  onChange={(e) => handleDoctorSelect(e.target.value)}
                  className="fd-responsive-input"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#F8FAFC',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {doctors.map((d) => {
                    const st = (doctorAvailability[d.id] || doctorAvailability[d.chamber] || d.status) as string;
                    const badge = st === 'ON_BREAK' ? ' [☕ ON BREAK]' : st === 'IN_MINOR_OT' ? ' [🔴 IN MINOR OT]' : '';
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name} • {d.chamber} ({d.specialty}){badge} — Fee: ₹{d.consultationFee}
                      </option>
                    );
                  })}
                </select>

                {(() => {
                  const currentDoc = doctors.find((d) => d.id === formDoctorId) || doctors[0];
                  const st = currentDoc ? (doctorAvailability[currentDoc.id] || doctorAvailability[currentDoc.chamber] || currentDoc.status) : 'AVAILABLE';
                  if (st === 'ON_BREAK') {
                    return (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          border: '1.5px solid #F59E0B',
                          color: '#FBBF24',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>☕</span>
                        <div>
                          <strong>Doctor on 30-min Break:</strong> Token queue is temporarily paused. Token will wait in line. Issue token anyway?
                        </div>
                      </div>
                    );
                  }
                  if (st === 'IN_MINOR_OT') {
                    return (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1.5px solid #EF4444',
                          color: '#F87171',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>🔴</span>
                        <div>
                          <strong>Doctor in Minor OT / Emergency:</strong> Doctor is attending an urgent procedure. Issue token anyway?
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Step 4: If Appointment, pick Date & Time Slot */}
              {(modalMode === 'APPOINTMENT' || formVisitType === 'APPOINTMENT') && (
                <div className="fd-responsive-grid-appointment" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={formAppointmentDate}
                      onChange={(e) => setFormAppointmentDate(e.target.value)}
                      className="fd-responsive-input"
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#F8FAFC',
                        fontSize: '1rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Time Slot
                    </label>
                    <select
                      value={formAppointmentSlot}
                      onChange={(e) => setFormAppointmentSlot(e.target.value)}
                      className="fd-responsive-input"
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#F8FAFC',
                        fontSize: '1rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 5: Chief Complaint */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  Chief Complaint / Reason for Visit
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fever, Headache, Routine Checkup..."
                  value={formComplaint}
                  onChange={(e) => setFormComplaint(e.target.value)}
                  className="fd-responsive-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#F8FAFC',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Step 6: Consultation Fee & Payment Method */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {/* Smart 7-Day Follow-up Pill when existing patient visited recently */}
                {(isPatientFound || hasRecentVisit) && (
                  <div
                    style={{
                      marginBottom: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px dashed #38BDF8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.76rem', color: '#7DD3FC', fontWeight: 600 }}>
                      💡 Patient visited recently — Auto-set ₹0 Follow-up?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormVisitType('FOLLOW_UP');
                        setFormFee(0);
                        showToast('Applied 7-Day Free Follow-Up Review (₹0 fee)');
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Apply ₹0 Free Follow-up
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1' }}>Consultation Fee:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 800 }}>₹</span>
                    <input
                      type="number"
                      value={formFee}
                      onChange={(e) => setFormFee(Number(e.target.value))}
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#F8FAFC',
                        fontWeight: 800,
                        fontSize: '1rem',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                </div>

                {/* Quick Fee Chips: [₹0 Free Follow-up], [₹200 Reduced Review], [Reset Full Fee ₹{doctorFee}] */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormFee(0);
                      setFormVisitType('FOLLOW_UP');
                      showToast('Applied ₹0 Free Follow-up');
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: formFee === 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: formFee === 0 ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: formFee === 0 ? '#34D399' : '#CBD5E1',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ₹0 Free Follow-up
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormFee(200);
                      showToast('Applied ₹200 Reduced Review');
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: formFee === 200 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: formFee === 200 ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: formFee === 200 ? '#38BDF8' : '#CBD5E1',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ₹200 Reduced Review
                  </button>

                  {(() => {
                    const currentDoc = doctors.find((d) => d.id === formDoctorId) || doctors[0];
                    const docFee = currentDoc?.consultationFee || 500;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setFormFee(docFee);
                          if (formVisitType === 'FOLLOW_UP') setFormVisitType('WALK_IN');
                          showToast(`Fee reset to standard ₹${docFee}`);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: formFee === docFee && formFee > 0 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: formFee === docFee && formFee > 0 ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: formFee === docFee && formFee > 0 ? '#A5B4FC' : '#CBD5E1',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Reset Full Fee ₹{docFee}
                      </button>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Payment Mode:</span>
                  {(['UPI_QR', 'CASH', 'SPLIT', 'CARD', 'WAIVED'] as const).map((mode) => {
                    const isSel = formPaymentMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setFormPaymentMode(mode);
                          if (mode === 'WAIVED') {
                            setFormFee(0);
                            setFormSplitCash(0);
                            setFormSplitUpi(0);
                          } else if (mode === 'SPLIT') {
                            const half = Math.floor(formFee / 2);
                            setFormSplitCash(half);
                            setFormSplitUpi(formFee - half);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: isSel ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: isSel ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                          color: isSel ? '#FFFFFF' : '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: isSel ? 800 : 600,
                          cursor: 'pointer'
                        }}
                      >
                        {mode === 'UPI_QR'
                          ? '⚡ UPI QR'
                          : mode === 'CASH'
                          ? '💵 Cash'
                          : mode === 'SPLIT'
                          ? '⚡ Split (Cash + UPI)'
                          : mode === 'CARD'
                          ? '💳 Card'
                          : '🆓 Free / Waived'}
                      </button>
                    );
                  })}
                </div>

                {/* Split Payment Two-Input Breakdown */}
                {formPaymentMode === 'SPLIT' && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      border: '1.5px solid #0284C7',
                      borderRadius: '8px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#34D399', marginBottom: '4px' }}>
                        💵 Cash Collected (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formFee}
                        value={formSplitCash}
                        onChange={(e) => {
                          const cash = Math.min(formFee, Math.max(0, Number(e.target.value) || 0));
                          setFormSplitCash(cash);
                          setFormSplitUpi(Math.max(0, formFee - cash));
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#0F172A',
                          border: '1px solid rgba(52, 211, 153, 0.4)',
                          color: '#F8FAFC',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          textAlign: 'right',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', marginBottom: '4px' }}>
                        📲 UPI via Soundbox/QR (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formFee}
                        value={formSplitUpi}
                        onChange={(e) => {
                          const upi = Math.min(formFee, Math.max(0, Number(e.target.value) || 0));
                          setFormSplitUpi(upi);
                          setFormSplitCash(Math.max(0, formFee - upi));
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#0F172A',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#F8FAFC',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          textAlign: 'right',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                      <span>Total Consultation Fee: ₹{formFee}</span>
                      <span style={{ color: formSplitCash + formSplitUpi === formFee ? '#34D399' : '#EF4444', fontWeight: 800 }}>
                        {formSplitCash + formSplitUpi === formFee ? '✓ Exact Split Balanced' : `⚠️ Split mismatch (₹${formFee - (formSplitCash + formSplitUpi)} remaining)`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Countertop Dynamic UPI QR Card & Soundbox Listener */}
                {(formPaymentMode === 'UPI_QR' || formPaymentMode === 'SPLIT') && (formPaymentMode === 'SPLIT' ? formSplitUpi : formFee) > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 14px',
                      backgroundColor: 'rgba(2, 132, 199, 0.08)',
                      border: '1.5px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#0F172A',
                        padding: '6px',
                        borderRadius: '8px',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          'upi://pay?pa=ashiyana.hospital@upi&pn=' +
                            encodeURIComponent(clinicDisplayName) +
                            '&am=' +
                            (formPaymentMode === 'SPLIT' ? formSplitUpi : formFee) +
                            '&tn=OPD_Fee_' +
                            (nextAllocatedTokenNum || 'Token')
                        )}&color=0284C7&bgcolor=0F172A`}
                        alt="Countertop UPI QR"
                        style={{ width: '100px', height: '100px', borderRadius: '4px', display: 'block' }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            backgroundColor: 'rgba(56, 189, 248, 0.2)',
                            color: '#38BDF8',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          Dynamic Counter QR
                        </span>
                        {formIsFeePaid ? (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#34D399',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            ✓ Paid
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              backgroundColor: 'rgba(245, 158, 11, 0.2)',
                              color: '#FBBF24',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            Awaiting Payment
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '4px' }}>
                        Scan to Pay ₹{formPaymentMode === 'SPLIT' ? formSplitUpi : formFee}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '6px', lineHeight: 1.3 }}>
                        Scan via GPay, PhonePe, Paytm or BHIM UPI
                      </div>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.72rem',
                          color: formIsFeePaid ? '#34D399' : '#38BDF8',
                          fontWeight: 700,
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <span>📡</span>
                        <span>
                          {formIsFeePaid
                            ? `✓ ₹${formPaymentMode === 'SPLIT' ? formSplitUpi : formFee} Confirmed via Soundbox`
                            : 'Listening for Paytm / PhonePe Soundbox payment...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fee Collection Status Toggle Chip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Payment Status:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !formIsFeePaid;
                      setFormIsFeePaid(next);
                      if (next) {
                        playCashRegisterChime();
                        showToast('✓ Fee marked as PAID');
                      } else {
                        showToast('⚠️ Fee marked as PAY LATER');
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: formIsFeePaid ? '1px solid #10B981' : '1px solid rgba(245, 158, 11, 0.6)',
                      backgroundColor: formIsFeePaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: formIsFeePaid ? '#34D399' : '#FBBF24',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {formIsFeePaid ? '✓ Fee Collected (PAID)' : '⏳ Pay Later / Unpaid'}
                  </button>
                </div>
              </div>

              {/* Submit Buttons (Sticky on Mobile) */}
              <div className="fd-responsive-sticky-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsTokenModalOpen(false)}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '11px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    border: '1.5px solid #38BDF8',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  {isSubmitting ? 'Generating...' : '✓ Issue Token & Print Slip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: THERMAL 80MM TOKEN SLIP PREVIEW & PRINT */}
      {printSlipItem && (
        <div
          className="fd-responsive-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={() => setPrintSlipItem(null)}
        >
          <div
            className="fd-responsive-sheet"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#000000',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '380px',
              padding: '24px',
              fontFamily: 'monospace',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Pill */}
            <div
              className="fd-mobile-drag-pill"
              style={{
                width: '44px',
                height: '5px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '3px',
                margin: '0 auto 8px',
                cursor: 'grab'
              }}
            />

            {/* Thermal Slip Content */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{clinicDisplayName}</div>
              <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '2px' }}>{clinicBranch}</div>
              <div style={{ fontSize: '0.72rem', color: '#444' }}>OPD Consultation Slip</div>
            </div>

            <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px dashed #000' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Token Number</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '2px', lineHeight: 1.1, margin: '4px 0' }}>
                {printSlipItem.tokenNumber}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                {printSlipItem.chamber} • {printSlipItem.doctorName}
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', lineHeight: 1.6, borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
              <div><strong>Patient:</strong> {printSlipItem.patientName} ({printSlipItem.age}{(printSlipItem.gender || 'M').charAt(0)})</div>
              <div><strong>UHID:</strong> {printSlipItem.mrn}</div>
              <div><strong>Mobile:</strong> {printSlipItem.patientMobile}</div>
              <div><strong>Date & Time:</strong> {printSlipItem.createdAt}</div>
              <div><strong>Visit:</strong> {printSlipItem.visitType}</div>
            </div>

            <div style={{ fontSize: '0.78rem', lineHeight: 1.6, borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
              <div><strong>Consultation Fee:</strong> ₹{printSlipItem.consultationFee}</div>
              <div><strong>Payment:</strong> {printSlipItem.feeStatus} ({printSlipItem.feePaymentMode})</div>
              <div><strong>Receipt #:</strong> {printSlipItem.feeReceiptNo}</div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#555' }}>
              Please wait in the reception lounge.<br />Your token will be announced on the display screen.
            </div>

            {/* Slip Action Buttons */}
            <div className="fd-responsive-sticky-footer" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => handleSilentThermalPrint(printSlipItem)}
                style={{
                  flex: 1.2,
                  padding: '11px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Silent zero-click print on connected USB ESC/POS thermal printer (58mm/80mm)"
              >
                <span>🖨️</span>
                <span>Thermal Cut</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const cleanPhone = printSlipItem.patientMobile.replace(/\D/g, '').slice(-10);
                  const greeting = audioCallLanguage === 'HI' ? 'नमस्ते' : 'Namaste';
                  const text = encodeURIComponent(
                    `*${greeting} ${printSlipItem.patientName}*,\n\n` +
                    `आपका टोकन कन्फर्म हो गया है: *${clinicDisplayName}*\n\n` +
                    `🎫 *Token No: #${printSlipItem.tokenNumber}*\n` +
                    `🩺 *Doctor:* ${printSlipItem.doctorName}\n` +
                    `📍 *Chamber:* ${printSlipItem.chamber}\n` +
                    `💰 *Fee:* Rs. ${printSlipItem.consultationFee} (${printSlipItem.feeStatus})\n` +
                    `🧾 *Receipt:* ${printSlipItem.feeReceiptNo}\n\n` +
                    `_कृपया टोकन अनाउंस होने पर चेंबर में पधारें।_`
                  );
                  window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
                }}
                style={{
                  flex: 1.2,
                  padding: '11px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#16A34A',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Share Token Slip via WhatsApp Web / Mobile"
              >
                <span>📲</span>
                <span>WhatsApp Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintSlipItem(null)}
                style={{
                  padding: '11px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#E2E8F0',
                  border: 'none',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: WHATSAPP TOKEN DISPATCH PREVIEW */}
      {whatsappModalItem && (
        <div
          className="fd-responsive-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={() => setWhatsappModalItem(null)}
        >
          <div
            className="fd-responsive-sheet"
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #22C55E',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Pill */}
            <div
              className="fd-mobile-drag-pill"
              style={{
                width: '44px',
                height: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '3px',
                margin: '0 auto 8px',
                cursor: 'grab'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>📲</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Send WhatsApp Token Slip</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  To {whatsappModalItem.patientMobile}
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                color: '#E2E8F0'
              }}
            >
              <div style={{ fontWeight: 800, color: '#4ADE80', marginBottom: '6px' }}>
                🏥 {clinicDisplayName}
              </div>
              Dear {whatsappModalItem.patientName}, your OPD Token is confirmed:<br />
              • <strong>Token: {whatsappModalItem.tokenNumber}</strong><br />
              • <strong>Doctor:</strong> {whatsappModalItem.doctorName}<br />
              • <strong>Chamber:</strong> {whatsappModalItem.chamber}<br />
              • <strong>Fee:</strong> ₹{whatsappModalItem.consultationFee} ({whatsappModalItem.feeStatus})<br />
              Please be seated in the OPD waiting lounge. Thank you!
            </div>

            <div className="fd-responsive-sticky-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button variant="outline" size="sm" onClick={() => setWhatsappModalItem(null)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => {
                  const rawPhone = (whatsappModalItem.patientMobile || '').replace(/\D/g, '').slice(-10);
                  const phone = rawPhone || '9876543210';
                  const cleanToken = String(whatsappModalItem.tokenNumber).replace(/^#+/, '');
                  const messageText =
                    `*🏥 ${clinicDisplayName}*\n` +
                    `*Namaste ${whatsappModalItem.patientName}*,\n\n` +
                    `Your OPD Registration is Confirmed:\n` +
                    `• *Token:* #${cleanToken}\n` +
                    `• *Doctor:* ${whatsappModalItem.doctorName}\n` +
                    `• *Chamber:* ${whatsappModalItem.chamber}\n` +
                    `• *Consultation Fee:* ₹${whatsappModalItem.consultationFee} (${whatsappModalItem.feeStatus})\n` +
                    (whatsappModalItem.feePaymentMode ? `• *Payment Mode:* ${whatsappModalItem.feePaymentMode}\n` : '') +
                    `\n_Please be seated in the OPD waiting lounge. Your token will be called on the display screen._\n\n` +
                    `_Powered by DocSearch Healthcare Suite_`;
                  const encodedText = encodeURIComponent(messageText);
                  window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encodedText}`, '_blank');
                  setWhatsappModalItem(null);
                  showToast(`✓ WhatsApp Token Slip opened for +91 ${phone}`);
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#22C55E',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>📲</span>
                <span>Send via WhatsApp (+91 {(whatsappModalItem.patientMobile || '').replace(/\D/g, '').slice(-10) || '9876543210'})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 7.5. MODAL: CLINIC GOOGLE REVIEW & FOLLOW-UP WHATSAPP DISPATCH (Competitive Gap 5 & Prompt 4) */}
      {googleReviewModalData && (
        <div
          className="fd-responsive-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={() => setGoogleReviewModalData(null)}
        >
          <div
            className="fd-responsive-modal"
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #F59E0B',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>⭐</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FBBF24' }}>
                  Clinic Google Review & Follow-up
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Auto-prepared for {googleReviewModalData.patientName} (+91 {googleReviewModalData.patientMobile})
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                color: '#E2E8F0'
              }}
            >
              <div style={{ fontWeight: 800, color: '#FCD34D', marginBottom: '6px' }}>
                🏥 {clinicDisplayName} (Token #{googleReviewModalData.tokenNumber})
              </div>
              Namaste {googleReviewModalData.patientName}, thank you for visiting our clinic.<br />
              • <strong>Attending Doctor:</strong> {googleReviewModalData.doctorName}<br />
              • <strong>Recommended Follow-up:</strong> In {googleReviewModalData.followUpDays} days<br />
              • <strong>Google Review Page:</strong> <span style={{ color: '#38BDF8', wordBreak: 'break-all' }}>{clinicGoogleReviewUrl}</span>
            </div>

            <div className="fd-responsive-sticky-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button variant="outline" size="sm" onClick={() => setGoogleReviewModalData(null)}>
                Dismiss
              </Button>
              <button
                type="button"
                onClick={() => {
                  window.open(googleReviewModalData.waUrl, '_blank');
                  showToast(`✓ Google Review link opened for ${googleReviewModalData.patientName}`);
                  setGoogleReviewModalData(null);
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#22C55E',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)'
                }}
              >
                <span>📲</span>
                <span>Send WhatsApp Review Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 7.6. MODAL: CLINIC GOOGLE REVIEW PROFILE SETTINGS */}
      {isGoogleReviewSettingsOpen && (
        <div
          className="fd-responsive-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={() => setIsGoogleReviewSettingsOpen(false)}
        >
          <div
            className="fd-responsive-modal"
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>⚙️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8' }}>
                  Clinic Google Business Reputation Engine
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Automatically grow 5-star Google reviews on consultation completion
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E2E8F0' }}>
                Clinic Google Review URL / Short Link:
              </label>
              <input
                type="text"
                value={tempGoogleReviewUrl}
                onChange={(e) => setTempGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/r/your-clinic/review"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#0B111E',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.8rem',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                Tip: Get this from your Google Business Profile &gt; "Ask for reviews" link.
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F1F5F9' }}>
                  Auto-Send on Consultation Completion
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  Prepares WhatsApp review link as soon as doctor signs prescription
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoGoogleReviewEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAutoGoogleReviewEnabled(val);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('docsearch_auto_google_review_enabled', String(val));
                  }
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsGoogleReviewSettingsOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const cleanUrl = tempGoogleReviewUrl.trim() || 'https://g.page/r/docsearch-clinic/review';
                  setClinicGoogleReviewUrl(cleanUrl);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('docsearch_clinic_google_review_url', cleanUrl);
                  }
                  setIsGoogleReviewSettingsOpen(false);
                  showToast('✓ Clinic Google Review settings updated successfully');
                }}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
      {collectFeeItem && (
        <div
          className="fd-responsive-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={() => setCollectFeeItem(null)}
        >
          <div
            className="fd-responsive-sheet"
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #F59E0B',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Pill */}
            <div
              className="fd-mobile-drag-pill"
              style={{
                width: '44px',
                height: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '3px',
                margin: '0 auto 8px',
                cursor: 'grab'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>💳</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Collect Consultation Fee</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  {collectFeeItem.patientName} • Token {collectFeeItem.tokenNumber}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Total Amount Due</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FBBF24', margin: '4px 0' }}>
                ₹{collectFeeItem.consultationFee}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#E2E8F0' }}>
                Doctor: {collectFeeItem.doctorName}
              </div>
            </div>

            <div className="fd-responsive-sticky-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button variant="outline" size="sm" onClick={() => setCollectFeeItem(null)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleConfirmCollectFee}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#10B981',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                ✓ Mark Received & Issue Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SHIFT HANDOVER & DAILY GALLA (CASH) RECONCILIATION MODAL */}
      {isShiftModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsShiftModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #10B981',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1.5px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  💰
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                    Shift Handover & Daily Galla Tally
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                    Cashier: <strong style={{ color: '#38BDF8' }}>{currentUser?.name || 'Front Desk Staff'}</strong> • Shift: {shiftStartTime} - Now
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Token Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>TOTAL TOKENS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{shiftStats.totalTokens}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 700 }}>WALK-INS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>{shiftStats.walkInTokens}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(192, 132, 252, 0.08)', border: '1px solid rgba(192, 132, 252, 0.2)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#C084FC', fontWeight: 700 }}>BOOKED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#C084FC', marginTop: '2px' }}>{shiftStats.appointmentTokens}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#F87171', fontWeight: 700 }}>EMERGENCY</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#F87171', marginTop: '2px' }}>{shiftStats.emergencyTokens}</div>
              </div>
            </div>

            {/* Financial Collection Breakdown */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Payment Channel Breakdown
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#CBD5E1' }}>💵 Cash in Hand (System Expected):</span>
                <strong style={{ color: '#10B981', fontFamily: 'monospace' }}>₹{shiftStats.totalCashFee}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#CBD5E1' }}>📲 UPI / Dynamic QR / Soundbox:</span>
                <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>₹{shiftStats.totalUpiFee}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#CBD5E1' }}>💳 Debit / Credit Card (POS):</span>
                <strong style={{ color: '#C084FC', fontFamily: 'monospace' }}>₹{shiftStats.totalCardFee}</strong>
              </div>
              {shiftStats.totalSplitTokens > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94A3B8' }}>
                  <span>⚡ Split Payments (Cash + UPI):</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>{shiftStats.totalSplitTokens} Tokens</span>
                </div>
              )}
              {shiftStats.totalCancelledCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#F87171' }}>
                  <span>🚫 Cancelled & Refunded:</span>
                  <strong style={{ fontFamily: 'monospace' }}>
                    {shiftStats.totalCancelledCount} Tokens (-₹{shiftStats.cancelledCashRefunds + shiftStats.cancelledUpiRefunds})
                  </strong>
                </div>
              )}
              {shiftStats.totalWaivedFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#CBD5E1' }}>🛡️ Fee Waived / VIP Exempt:</span>
                  <span style={{ color: '#F59E0B', fontFamily: 'monospace' }}>₹{shiftStats.totalWaivedFee}</span>
                </div>
              )}
              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900 }}>
                <span style={{ color: '#F8FAFC' }}>Total Collections:</span>
                <span style={{ color: '#10B981', fontFamily: 'monospace' }}>₹{shiftStats.grandTotalCollected}</span>
              </div>
            </div>

            {/* Physical Cash in Drawer Input & Discrepancy Reconciliation */}
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.06)', border: '1.5px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '8px' }}>
                Enter Physical Cash Counted in Drawer (₹):
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={physicalCashInput}
                    onChange={(e) => setPhysicalCashInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 28px',
                      backgroundColor: '#0F172A',
                      border: '1.5px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.8125rem',
                    letterSpacing: '0.03em',
                    backgroundColor:
                      shiftStats.cashDiscrepancy === 0
                        ? 'rgba(16, 185, 129, 0.2)'
                        : shiftStats.cashDiscrepancy > 0
                        ? 'rgba(56, 189, 248, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color:
                      shiftStats.cashDiscrepancy === 0
                        ? '#34D399'
                        : shiftStats.cashDiscrepancy > 0
                        ? '#38BDF8'
                        : '#F87171',
                    border: `1px solid ${
                      shiftStats.cashDiscrepancy === 0
                        ? '#10B981'
                        : shiftStats.cashDiscrepancy > 0
                        ? '#0284C7'
                        : '#EF4444'
                    }`,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {shiftStats.cashDiscrepancy === 0
                    ? '✓ EXACT MATCH'
                    : shiftStats.cashDiscrepancy > 0
                    ? `+₹${shiftStats.cashDiscrepancy} EXCESS`
                    : `-₹${Math.abs(shiftStats.cashDiscrepancy)} SHORTAGE`}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsShiftModalOpen(false)}>
                Cancel
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrintShiftHandover}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <span>🖨️</span>
                  <span>Print Shift Handover Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: TOKEN CANCELLATION & FEE REFUND */}
      {cancelModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setCancelModalItem(null)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(239, 68, 68, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>❌</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F87171' }}>
                    Cancel Token & Fee Reversal
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                    Token #{cancelModalItem.tokenNumber} • {cancelModalItem.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalItem(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '12px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Doctor & Chamber:</span>
                <span style={{ fontWeight: 700 }}>{cancelModalItem.doctorName} ({cancelModalItem.chamber})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Collected Fee:</span>
                <span style={{ fontWeight: 800, color: cancelModalItem.feeStatus === 'PAID' ? '#34D399' : '#F59E0B' }}>
                  ₹{cancelModalItem.consultationFee} ({cancelModalItem.feeStatus}) - {cancelModalItem.feePaymentMode}
                </span>
              </div>
            </div>

            {/* Cancellation Reason Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                Cancellation Reason:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Doctor Delayed">Doctor Delayed / Excessive Wait</option>
                <option value="Patient Left / Emergency">Patient Left / Personal Emergency</option>
                <option value="Wrong Doctor Selected">Wrong Doctor / Specialty Selected</option>
                <option value="Duplicate Token">Duplicate Token Issued</option>
                <option value="Patient Dissatisfied">Patient Dissatisfied</option>
              </select>
            </div>

            {/* Refund Mode Selection */}
            {cancelModalItem.feeStatus === 'PAID' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                  Fee Refund Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCancelRefundMode('CASH_RETURNED')}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: `1px solid ${cancelRefundMode === 'CASH_RETURNED' ? '#10B981' : 'rgba(255, 255, 255, 0.12)'}`,
                      backgroundColor: cancelRefundMode === 'CASH_RETURNED' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: cancelRefundMode === 'CASH_RETURNED' ? '#34D399' : '#94A3B8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    💵 Cash Return
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelRefundMode('UPI_REVERSAL')}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: `1px solid ${cancelRefundMode === 'UPI_REVERSAL' ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'}`,
                      backgroundColor: cancelRefundMode === 'UPI_REVERSAL' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: cancelRefundMode === 'UPI_REVERSAL' ? '#38BDF8' : '#94A3B8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    📲 UPI Reversal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelRefundMode('NO_FEE_COLLECTED')}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: `1px solid ${cancelRefundMode === 'NO_FEE_COLLECTED' ? '#94A3B8' : 'rgba(255, 255, 255, 0.12)'}`,
                      backgroundColor: cancelRefundMode === 'NO_FEE_COLLECTED' ? 'rgba(148, 163, 184, 0.15)' : 'transparent',
                      color: cancelRefundMode === 'NO_FEE_COLLECTED' ? '#F8FAFC' : '#94A3B8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🚫 No Refund
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button variant="outline" size="sm" onClick={() => setCancelModalItem(null)}>
                Keep Token
              </Button>
              <button
                type="button"
                onClick={handleConfirmCancelToken}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
