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
  status: 'AVAILABLE' | 'IN_CONSULTATION' | 'OFF_SHIFT';
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
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
  visitType: 'WALK_IN' | 'APPOINTMENT' | 'FOLLOW_UP' | 'EMERGENCY';
  appointmentTime?: string | undefined;
  chiefComplaint: string;
  consultationFee: number;
  feePaymentMode: 'CASH' | 'UPI_QR' | 'CARD' | 'WAIVED';
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isAnyModalOpen = isTokenModalOpen || !!printSlipItem || !!whatsappModalItem || !!collectFeeItem;

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
  const [formPaymentMode, setFormPaymentMode] = useState<'CASH' | 'UPI_QR' | 'CARD' | 'WAIVED'>('UPI_QR');
  const [formIsFeePaid, setFormIsFeePaid] = useState(true);
  const [isPatientFound, setIsPatientFound] = useState(false);
  const [_formMrn, setFormMrn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Audio Speech & Chime
  const announcePatientCall = (item: FrontDeskPatientToken) => {
    if (!audioAnnounceEnabled || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = `Token ${item.tokenNumber}. ${item.patientName}. Please proceed to ${item.chamber}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch {}
  };

  // Auto-search patient when mobile is 10 digits
  const handleMobileChange = (mobile: string) => {
    setFormMobile(mobile);
    const digitsOnly = mobile.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      // Check existing queue or local patients
      const foundInQueue = queue.find((q) => q.patientMobile.replace(/\D/g, '') === digitsOnly);
      if (foundInQueue) {
        setFormName(foundInQueue.patientName);
        setFormAge(foundInQueue.age);
        setFormGender(foundInQueue.gender);
        setFormMrn(foundInQueue.mrn);
        setIsPatientFound(true);
        showToast(`Returning patient detected: ${foundInQueue.patientName} (${foundInQueue.mrn})`);
        return;
      }

      // Check localStorage patient database
      try {
        const regPatients = JSON.parse(localStorage.getItem('docsearch_patients') || '[]');
        const found = regPatients.find((p: any) => (p.primaryMobile || p.phone || '').replace(/\D/g, '') === digitsOnly);
        if (found) {
          setFormName(found.fullName || `${found.firstName || ''} ${found.lastName || ''}`.trim());
          setFormAge(found.age?.toString() || '30');
          setFormGender(found.gender || 'MALE');
          setFormMrn(found.mrn || `UHID-${Math.floor(10000 + Math.random() * 90000)}`);
          setIsPatientFound(true);
          showToast(`Patient found in records: ${found.fullName}`);
          return;
        }
      } catch {}

      setIsPatientFound(false);
      setFormMrn(`UHID-${Math.floor(10000 + Math.random() * 90000)}`);
    } else {
      setIsPatientFound(false);
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
    setFormPaymentMode('UPI_QR');
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

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
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
  }, [queue, selectedDoctorFilter, statusFilter, searchTerm]);

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
                void fetchQueue();
                showToast('OPD queue refreshed');
              }}
              style={{ border: '1px solid rgba(255, 255, 255, 0.15)', color: '#CBD5E1' }}
            >
              🔄 Refresh
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
              const isConsulting = doc.status === 'IN_CONSULTATION';
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoctorFilter(isSelected ? 'ALL' : doc.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1.5px solid #06B6D4'
                      : isConsulting
                      ? '1px solid rgba(245, 158, 11, 0.4)'
                      : '1px solid rgba(16, 185, 129, 0.35)',
                    backgroundColor: isSelected
                      ? 'rgba(6, 182, 212, 0.22)'
                      : isConsulting
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(16, 185, 129, 0.08)',
                    color: '#F8FAFC',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.3)' : 'none'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isConsulting ? '#F59E0B' : '#10B981', boxShadow: `0 0 6px ${isConsulting ? '#F59E0B' : '#10B981'}` }} />
                  <span>
                    <strong style={{ color: '#F1F5F9' }}>{doc.name}</strong> ({doc.chamber})
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>• {doc.specialty}</span>
                  <span
                    style={{
                      backgroundColor: isConsulting ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isConsulting ? '#FBBF24' : '#34D399',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 800
                    }}
                  >
                    {isConsulting ? `In Chamber (${doc.currentToken || 'Active'})` : `Available (${doc.queueCount} wait)`}
                  </span>
                </button>
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

                  return (
                    <TableRow
                      key={item.id}
                      style={{
                        backgroundColor: isInConsult ? 'rgba(6, 182, 212, 0.06)' : isDone ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.12s ease'
                      }}
                    >
                      {/* Token # */}
                      <TableCell style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            letterSpacing: '0.04em',
                            backgroundColor: isInConsult ? '#06B6D4' : isWaiting ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                            color: isInConsult ? '#0F172A' : isWaiting ? '#FBBF24' : '#34D399',
                            border: `1px solid ${isInConsult ? '#06B6D4' : isWaiting ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}
                        >
                          {item.tokenNumber}
                        </span>
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
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} • {d.chamber} ({d.specialty}) — Fee: ₹{d.consultationFee}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: If Appointment, pick Date & Time Slot */}
              {modalMode === 'APPOINTMENT' && (
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Payment Mode:</span>
                  {(['UPI_QR', 'CASH', 'CARD', 'WAIVED'] as const).map((mode) => {
                    const isSel = formPaymentMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setFormPaymentMode(mode);
                          if (mode === 'WAIVED') setFormFee(0);
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
                        {mode === 'UPI_QR' ? '⚡ UPI QR' : mode === 'CASH' ? '💵 Cash' : mode === 'CARD' ? '💳 Card' : '🆓 Free / Waived'}
                      </button>
                    );
                  })}
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
            <div className="fd-responsive-sticky-footer" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🖨️ Thermal Print
              </button>
              <button
                type="button"
                onClick={() => setPrintSlipItem(null)}
                style={{
                  padding: '11px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#E2E8F0',
                  border: 'none',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.9rem',
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
                  setWhatsappModalItem(null);
                  showToast(`WhatsApp message dispatched to ${whatsappModalItem.patientMobile}`);
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#22C55E',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                ✓ Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: QUICK CONSULTATION FEE COLLECTION */}
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
    </div>
  );
};
