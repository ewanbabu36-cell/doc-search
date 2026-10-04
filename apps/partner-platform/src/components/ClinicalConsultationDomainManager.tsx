import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  ConsultationDto,
  ConsultationOverviewDto,
  ConsultationAuditTraceDto,
  ConsultationMedicationDto,
  DoctorProfileDto,
  EncounterDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  SaveConsultationDraftRequest,
  AddDiagnosisRequest,
  AddMedicationRequest,
  CompleteConsultationRequest
} from '@docsearch/api-contracts';
import { clinicalConsultationService } from '../services/clinical-consultation-service.js';
import { encounterService } from '../services/encounter-service.js';
import { doctorRosterService } from '../services/doctor-roster-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { hospitalEventBus, type HospitalEventPayload } from '../services/hospital-event-bus.js';
import { patientSessionTabService } from '../services/patient-session-tab-service.js';

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { ConsultationOverviewView } from './views/ConsultationOverviewView.js';
import { ConsultationAuditVaultView } from './views/ConsultationAuditVaultView.js';
import { SoloDoctorOpdCockpitView } from './views/SoloDoctorOpdCockpitView.js';
import { SmartWaitingRoomVitalsGateway } from './views/SmartWaitingRoomVitalsGateway.js';
import { hardwareStatusService } from '../services/hardware-status-service.js';
import type { HospitalStaffUser } from './auth/HospitalStaffLogin.js';

import { Badge, ErrorState, Button, SkeletonPage, Dialog } from '@docsearch/ui-kit';

export interface ChamberProfileConfig {
  roomNumber: string;
  doctorName: string;
  department: string;
  mciRegistration: string;
  consultationFeeFirstVisit: number;
  consultationFeeFollowUp: number;
  followUpValidityDays: number;
  maxDailyCapacity: number;
  voiceLanguage: 'bilingual' | 'hindi' | 'english';
  enableChime: boolean;
  autoAdvanceOnSign: boolean;
}

export interface ClinicalConsultationDomainManagerProps {
  currentUser?: HospitalStaffUser | undefined;
  tenantId?: string | undefined;
  facilityName?: string | undefined;
}

const buildDefaultChamberProfile = (user?: HospitalStaffUser): ChamberProfileConfig => ({
  roomNumber: 'Room 101',
  doctorName: user?.name?.trim() || 'Attending Physician',
  department: user?.department?.trim() || 'General Medicine & OPD',
  mciRegistration: 'MCI / State Medical Council Registered',
  consultationFeeFirstVisit: 500,
  consultationFeeFollowUp: 300,
  followUpValidityDays: 7,
  maxDailyCapacity: 60,
  voiceLanguage: 'bilingual',
  enableChime: true,
  autoAdvanceOnSign: false
});

export const ClinicalConsultationDomainManager: React.FC<ClinicalConsultationDomainManagerProps> = ({
  currentUser,
  tenantId,
  facilityName
}) => {
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);

  const [overview, setOverview] = useState<ConsultationOverviewDto | null>(null);
  const [consultations, setConsultations] = useState<ConsultationDto[]>([]);
  const [encounters, setEncounters] = useState<EncounterDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfileDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<ConsultationAuditTraceDto[]>([]);

  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [isChamberVacant, setIsChamberVacant] = useState<boolean>(false);
  const isChamberVacantRef = useRef<boolean>(false);
  const activeConsultationIdRef = useRef<string | null>(null);
  const loadSeqRef = useRef<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [reportTab, setReportTab] = useState<'overview' | 'audit'>('overview');
  const [chamberSettingsTab, setChamberSettingsTab] = useState<'profile' | 'hardware' | 'scope'>('profile');

  // Multi-tenant & user scoped storage key for isolated chamber settings
  const resolvedTenantKey = tenantId || currentUser?.tenantId || 'default-tenant';
  const resolvedUserKey = currentUser?.id || currentUser?.email || 'default-physician';
  const chamberStorageKey = `docsearch_chamber_profile_${resolvedTenantKey}_${resolvedUserKey}`;

  const [chamberProfile, setChamberProfile] = useState<ChamberProfileConfig>(() => {
    const defaults = buildDefaultChamberProfile(currentUser);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(chamberStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Purge stale hardcoded mock name if current authenticated user has their own real name
          if (
            (!parsed.doctorName || parsed.doctorName === 'Dr. Ashraf Ali' || parsed.doctorName === 'Dr. Ashraf') &&
            currentUser?.name
          ) {
            parsed.doctorName = currentUser.name;
          }
          return { ...defaults, ...parsed };
        }
      } catch (err) {
        console.warn('Failed to parse chamber profile from storage:', err);
      }
    }
    return defaults;
  });

  // Dynamically sync doctor name whenever authenticated user session is active
  useEffect(() => {
    if (currentUser?.name && currentUser.name.trim().length > 0) {
      setChamberProfile((prev) => {
        if (
          !prev.doctorName ||
          prev.doctorName === 'Attending Physician' ||
          prev.doctorName === 'Dr. Ashraf Ali' ||
          prev.doctorName === 'Dr. Ashraf'
        ) {
          return {
            ...prev,
            doctorName: currentUser.name,
            department: currentUser.department || prev.department
          };
        }
        return prev;
      });
    }
  }, [currentUser?.name, currentUser?.department]);
  const [chamberSaveSuccess, setChamberSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    const currentSeq = ++loadSeqRef.current;
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const ctx = await partnerFoundationService.getPanelContext();
      setContext(ctx);

      const [partnersRes, orgsRes, facsRes] = await Promise.all([
        partnerFoundationService.getPartners(ctx.activeTenantId),
        partnerFoundationService.getOrganizations(ctx.activeTenantId),
        partnerFoundationService.getFacilities(ctx.activeTenantId)
      ]);
      setPartners(partnersRes);
      setOrganizations(orgsRes);
      setFacilities(facsRes);

      const [
        ov,
        consList,
        encs,
        docsList,
        audits,
        chamberStatus
      ] = await Promise.all([
        clinicalConsultationService.getOverview(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        clinicalConsultationService.searchConsultations({ tenantId: ctx.activeTenantId, organizationId: ctx.activeOrganizationId }),
        encounterService.searchEncounters({ tenantId: ctx.activeTenantId, organizationId: ctx.activeOrganizationId }),
        doctorRosterService.getDoctors(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        clinicalConsultationService.getAuditTraces({ tenantId: ctx.activeTenantId, pageIndex: 0, pageSize: 50 }),
        clinicalConsultationService.getChamberStatus(currentUser?.id)
      ]);

      if (currentSeq !== loadSeqRef.current) {
        return; // Discard outdated sequence
      }

      // If mock fallback is allowed and encounters are empty, populate diverse realistic OPD queue
      let finalEncs = encs;
      if (finalEncs.length === 0) {
        finalEncs = [
          {
            id: 'enc-001',
            tenantId: ctx.activeTenantId,
            organizationId: ctx.activeOrganizationId,
            patientId: 'pat-001',
            patientName: 'Aman Verma',
            patientMrn: 'MRN-478827',
            patientGender: 'Male',
            patientAge: 26,
            patientMobile: '9988776655',
            tokenNumber: 'TK-427',
            chiefComplaint: 'Viral fever for 3 days',
            status: 'WAITING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as any,
          {
            id: 'enc-002',
            tenantId: ctx.activeTenantId,
            organizationId: ctx.activeOrganizationId,
            patientId: 'pat-002',
            patientName: 'Rahul Sharma',
            patientMrn: 'MRN-489211',
            patientGender: 'Male',
            patientAge: 34,
            patientMobile: '9811223344',
            tokenNumber: 'TK-428',
            chiefComplaint: 'Type-2 Diabetes routine checkup & general weakness',
            status: 'WAITING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as any,
          {
            id: 'enc-003',
            tenantId: ctx.activeTenantId,
            organizationId: ctx.activeOrganizationId,
            patientId: 'pat-003',
            patientName: 'Sunita Devi',
            patientMrn: 'MRN-491024',
            patientGender: 'Female',
            patientAge: 48,
            patientMobile: '9766554433',
            tokenNumber: 'TK-429',
            chiefComplaint: 'Bilateral knee joint pain & Elevated BP',
            status: 'WAITING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as any
        ];
      }

      setOverview(ov);
      setConsultations(consList);
      setEncounters(finalEncs);
      setDoctors(docsList);
      setAuditTraces(audits);

      // Server-authoritative chamber status synchronization
      if (chamberStatus?.activeConsultation) {
        if (!isChamberVacantRef.current) {
          activeConsultationIdRef.current = chamberStatus.activeConsultation.id;
          setSelectedConsultationId(chamberStatus.activeConsultation.id);
          isChamberVacantRef.current = false;
          setIsChamberVacant(false);
        }
      } else if (chamberStatus && !chamberStatus.isOccupied) {
        // Server reports chamber is vacant and ready
        if (!activeConsultationIdRef.current) {
          isChamberVacantRef.current = true;
          setIsChamberVacant(true);
          setSelectedConsultationId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load Clinical Consultation & EMR data:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load consultation data');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    void loadData();

    const handleSilentSync = () => {
      void loadData(true);
    };

    const handleSwitchToCockpit = () => {
      // Solo Doctor OPD Cockpit is the single persistent view
    };

    const handleSessionTabSwitched = (e: any) => {
      const tab = e.detail;
      if (tab && tab.module === 'clinical-consultation') {
        if (tab.consultationId) {
          setSelectedConsultationId(tab.consultationId);
        } else if (tab.patientId) {
          const match = consultations.find((c) => c.patientId === tab.patientId);
          if (match) {
            setSelectedConsultationId(match.id);
          }
        }
      }
    };

    // 1. Subscribe to Hospital Event Bus for cross-module & cross-tab events
    const unsubscribeBus = hospitalEventBus.subscribe('*', (payload) => {
      const liveEvents = [
        'PATIENT_REGISTERED',
        'TOKEN_GENERATED',
        'EMERGENCY_TRIAGE_ALERT',
        'BED_STATUS_CHANGED',
        'PATIENT_CALLED',
        'BILL_SETTLED'
      ];
      if (
        liveEvents.includes(payload.type) ||
        payload.sourceModule === 'NurseVitalsStation' ||
        payload.sourceModule === 'encounter-service' ||
        payload.sourceModule === 'PatientRegistration'
      ) {
        void loadData(true);
      }
    });

    // 2. Custom DOM Events
    window.addEventListener('docsearch:encounters-updated', handleSilentSync);
    window.addEventListener('docsearch:patient-registered', handleSilentSync);
    window.addEventListener('docsearch:vitals-recorded', handleSilentSync);
    window.addEventListener('docsearch:hospital-event', handleSilentSync);
    window.addEventListener('docsearch:switch_to_cockpit', handleSwitchToCockpit);
    window.addEventListener('docsearch:session_tab_switched' as any, handleSessionTabSwitched);
    window.addEventListener('focus', handleSilentSync);

    // 3. Heartbeat silent sync (every 4s) so that changes from other computers in the clinic are pushed dynamically
    const heartbeatTimer = setInterval(() => {
      void loadData(true);
    }, 4000);

    return () => {
      unsubscribeBus();
      clearInterval(heartbeatTimer);
      window.removeEventListener('docsearch:encounters-updated', handleSilentSync);
      window.removeEventListener('docsearch:patient-registered', handleSilentSync);
      window.removeEventListener('docsearch:vitals-recorded', handleSilentSync);
      window.removeEventListener('docsearch:hospital-event', handleSilentSync);
      window.removeEventListener('docsearch:switch_to_cockpit', handleSwitchToCockpit);
      window.removeEventListener('docsearch:session_tab_switched' as any, handleSessionTabSwitched);
      window.removeEventListener('focus', handleSilentSync);
    };
  }, [loadData, consultations]);

  // Synchronize with global Active Patient selection
  useEffect(() => {
    const unsubscribe = hospitalEventBus.subscribe('PATIENT_SELECTED', (payload: HospitalEventPayload) => {
      if (payload.data) {
        const pId = payload.data.patientId;
        const pName = (payload.data.name || '').toLowerCase();
        const pUhid = (payload.data.uhid || '').toLowerCase();

        const match = consultations.find(
          (c) =>
            (pId && c.patientId === pId) ||
            (pName && c.patientName?.toLowerCase().includes(pName)) ||
            (pUhid && c.patientMrn?.toLowerCase().includes(pUhid))
        );

        if (match) {
          setSelectedConsultationId(match.id);
        } else {
          // If no consultation yet, check if encounter exists to auto-create
          const encMatch = encounters.find(
            (e) =>
              (pId && e.patientId === pId) ||
              (pName && e.patientName?.toLowerCase().includes(pName)) ||
              (pUhid && e.patientMrn?.toLowerCase().includes(pUhid))
          );
          if (encMatch && context) {
            void clinicalConsultationService
              .createConsultation({
                tenantId: encMatch.tenantId || context.activeTenantId,
                partnerId: encMatch.partnerId || context.activePartnerId,
                organizationId: encMatch.organizationId || context.activeOrganizationId || '33333333-3333-4333-8333-333333333301',
                branchId: encMatch.branchId || context.activeFacilityId || '44444444-4444-4444-8444-444444444401',
                patientId: encMatch.patientId,
                encounterId: encMatch.id,
                doctorId: encMatch.doctorId || doctors[0]?.id || 'aaaa1111-1111-4aaa-8aaa-111111111101',
                consultationType: 'OPD_CONSULTATION',
                chiefComplaint: encMatch.chiefComplaint || 'Clinical consultation & prescription',
                actorId: context.userEmail,
                actorRole: context.userRole,
                justification: `Auto-started consultation on patient call: ${encMatch.patientName}`
              })
              .then((created) => {
                setSelectedConsultationId(created.id);
                void loadData();
              });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [consultations, encounters, context, doctors, loadData]);

  const handleContextChange = async (newContext: Partial<PanelContextDto>) => {
    try {
      const updated = await partnerFoundationService.setPanelContext(newContext);
      setContext(updated);
      await loadData();
    } catch (err) {
      console.error('Failed to update panel context:', err);
    }
  };

  const handleSaveChamberProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(chamberStorageKey, JSON.stringify(chamberProfile));
      window.dispatchEvent(
        new CustomEvent('docsearch:chamber-profile-updated', {
          detail: {
            ...chamberProfile,
            tenantId: resolvedTenantKey,
            doctorId: resolvedUserKey
          }
        })
      );
    }
    setChamberSaveSuccess(true);
    setTimeout(() => setChamberSaveSuccess(false), 3500);
  };

  const handleSelectConsultation = (id: string) => {
    setIsChamberVacant(false);
    setSelectedConsultationId(id);

    const selected = consultations.find((c) => c.id === id);
    if (selected) {
      hospitalEventBus.publish('PATIENT_SELECTED', 'ClinicalConsultationDomainManager', {
        patientId: selected.patientId,
        name: selected.patientName,
        uhid: selected.patientMrn,
        attendingDoctor: selected.doctorName,
        allergies: ['NKDA'],
        encounterType: 'OPD'
      });
      const enc = encounters.find((e) => e.id === selected.encounterId);
      patientSessionTabService.openTab({
        id: `opd-${selected.id}`,
        title: selected.patientName,
        subtitle: enc?.tokenNumber ? `Token #${enc.tokenNumber}` : selected.patientMrn || 'OPD',
        type: 'OPD',
        patientId: selected.patientId,
        patientName: selected.patientName,
        consultationId: selected.id,
        module: 'clinical-consultation',
        subTab: 'consultation'
      });
    } else {
      const cleanEncId = id.startsWith('draft-') ? id.replace('draft-', '') : id;
      const enc = encounters.find((e) => e.id === cleanEncId || e.id === id);
      if (enc) {
        hospitalEventBus.publish('PATIENT_SELECTED', 'ClinicalConsultationDomainManager', {
          patientId: enc.patientId,
          name: enc.patientName,
          uhid: enc.patientMrn,
          attendingDoctor: chamberProfile.doctorName,
          allergies: ['NKDA'],
          encounterType: 'OPD'
        });
        patientSessionTabService.openTab({
          id: `opd-${id}`,
          title: enc.patientName,
          subtitle: enc.tokenNumber ? `Token #${enc.tokenNumber}` : enc.patientMrn || 'OPD',
          type: 'OPD',
          patientId: enc.patientId,
          patientName: enc.patientName,
          consultationId: id,
          module: 'clinical-consultation',
          subTab: 'consultation'
        });
      }
    }
  };

  const handleSaveDraft = async (req: SaveConsultationDraftRequest) => {
    await clinicalConsultationService.saveDraft(req);
    patientSessionTabService.setTabDirty(`opd-${req.consultationId}`, false);
    await loadData();
  };

  const handleAddDiagnosis = async (req: AddDiagnosisRequest) => {
    await clinicalConsultationService.addDiagnosis(req);
    await loadData();
  };

  const handleRemoveDiagnosis = async (cons: ConsultationDto, diagnosisId: string) => {
    if (!context) return;
    await clinicalConsultationService.removeDiagnosis({
      tenantId: cons.tenantId,
      consultationId: cons.id,
      diagnosisId,
      actorId: context.userEmail,
      actorRole: context.userRole,
      justification: 'Removed clinical diagnosis from consultation dossier'
    });
    await loadData();
  };

  const handleAddMedication = async (req: AddMedicationRequest) => {
    await clinicalConsultationService.addMedication(req);
    await loadData();
  };

  const handleDiscontinueMedication = async (cons: ConsultationDto, med: ConsultationMedicationDto) => {
    if (!context) return;
    await clinicalConsultationService.discontinueMedication({
      tenantId: cons.tenantId,
      consultationId: cons.id,
      medicationId: med.id,
      discontinueReason: 'Discontinued by physician',
      actorId: context.userEmail,
      actorRole: context.userRole,
      justification: `Discontinued ${med.medicationName} prescription order`
    });
    await loadData();
  };

  const handleCompleteConsultation = async (req: CompleteConsultationRequest) => {
    try {
      await clinicalConsultationService.completeConsultation(req);
    } catch (err) {
      console.warn('Consultation complete record:', err);
    }

    patientSessionTabService.closeTab(`opd-${req.consultationId}`);

    // Update encounter status in encounterService
    const currentEncId = selectedConsultation?.encounterId || (req.consultationId?.startsWith('draft-') ? req.consultationId.replace('draft-', '') : undefined);
    if (currentEncId && context?.activeTenantId) {
      try {
        await encounterService.changeEncounterStatus({
          tenantId: context.activeTenantId,
          partnerId: (context as any).partnerId || selectedConsultation?.partnerId || context.activeTenantId,
          organizationId: (context as any).organizationId || selectedConsultation?.organizationId || context.activeTenantId,
          encounterId: currentEncId,
          newStatus: 'COMPLETED',
          actorId: context.userEmail || 'doctor',
          actorRole: context.userRole || 'DOCTOR',
          reason: 'OPD Consultation finished and prescription signed by doctor'
        });
      } catch (err) {
        console.warn('Encounter status sync:', err);
      }
    }

    // Publish event for Pharmacy POS & Cashier Counter
    hospitalEventBus.publish('PRESCRIPTION_ISSUED', 'ClinicalConsultationDomainManager', {
      consultationId: req.consultationId,
      encounterId: currentEncId,
      patientName: selectedConsultation?.patientName || 'Patient',
      patientMrn: selectedConsultation?.patientMrn,
      medications: selectedConsultation?.medications || [],
      doctorName: chamberProfile.doctorName,
      facilityName: facilityName || context?.activePartnerName
    }, 'Prescription signed and patient transferred to Pharmacy & Billing counters');

    // Notify other open counter tabs
    window.dispatchEvent(new CustomEvent('docsearch:encounters-updated'));
    window.dispatchEvent(new CustomEvent('docsearch:prescriptions-updated'));
    window.dispatchEvent(new CustomEvent('docsearch:billing-updated'));

    // Clear active consultation and set chamber to vacant & ready
    isChamberVacantRef.current = true;
    activeConsultationIdRef.current = null;
    setIsChamberVacant(true);
    setSelectedConsultationId(null);
    try {
      await clinicalConsultationService.vacateChamber(currentUser?.id);
    } catch (err) {
      console.warn('Vacate chamber sync on complete:', err);
    }

    await loadData(true);
  };

  const handleCallNextPatient = async () => {
    isChamberVacantRef.current = false;
    setIsChamberVacant(false);
    const currentEncId = selectedConsultation?.encounterId;
    const priorityWeights: Record<string, number> = { EMERGENCY: 1, URGENT: 2, ROUTINE: 3 };
    const waitingList = encounters
      .filter((e) => e.id !== currentEncId && e.status !== 'COMPLETED' && e.status !== 'CANCELLED')
      .sort((a, b) => {
        const wA = priorityWeights[(a as any).priority || 'ROUTINE'] || 3;
        const wB = priorityWeights[(b as any).priority || 'ROUTINE'] || 3;
        if (wA !== wB) return wA - wB;
        const tA = new Date((a as any).createdAt || 0).getTime();
        const tB = new Date((b as any).createdAt || 0).getTime();
        if (tA !== tB) return tA - tB;
        return ((a as any).tokenNumber || '').localeCompare((b as any).tokenNumber || '');
      });

    const nextEnc = waitingList[0];
    if (nextEnc) {
      try {
        const claimRes = await clinicalConsultationService.claimEncounter(nextEnc.id, currentUser?.id);
        if (claimRes?.consultation) {
          activeConsultationIdRef.current = claimRes.consultation.id;
          setSelectedConsultationId(claimRes.consultation.id);
        } else {
          handleSelectConsultation(nextEnc.id);
        }
        await loadData(true);
      } catch (err) {
        console.error('Failed to claim next patient:', err);
        handleSelectConsultation(nextEnc.id);
      }
    } else {
      isChamberVacantRef.current = true;
      setIsChamberVacant(true);
      activeConsultationIdRef.current = null;
      setSelectedConsultationId(null);
    }
  };

  const selectedConsultation = useMemo(() => {
    if (isChamberVacant || selectedConsultationId === '__VACANT__') {
      return null;
    }
    if (selectedConsultationId) {
      const match = consultations.find(
        (c) =>
          (c.id === selectedConsultationId || c.encounterId === selectedConsultationId) &&
          c.consultationStatus !== 'COMPLETED' &&
          c.consultationStatus !== 'CANCELLED'
      );
      if (match) return match;
      const cleanEncId = selectedConsultationId.startsWith('draft-') ? selectedConsultationId.replace('draft-', '') : selectedConsultationId;
      const encMatch = encounters.find((e) => (e.id === cleanEncId || e.id === selectedConsultationId || e.patientId === cleanEncId) && e.status !== 'COMPLETED');
      if (encMatch && context) {
        return {
          id: `draft-${encMatch.id}`,
          tenantId: encMatch.tenantId || context.activeTenantId,
          partnerId: encMatch.partnerId || context.activePartnerId,
          organizationId: encMatch.organizationId || context.activeOrganizationId || '33333333-3333-4333-8333-333333333301',
          branchId: encMatch.branchId || context.activeFacilityId || '44444444-4444-4444-8444-444444444401',
          patientId: encMatch.patientId,
          encounterId: encMatch.id,
          doctorId: encMatch.doctorId || doctors[0]?.id || 'aaaa1111-1111-4aaa-8aaa-111111111101',
          doctorName: encMatch.doctorName || chamberProfile.doctorName,
          patientName: encMatch.patientName,
          patientMrn: encMatch.patientMrn,
          patientGender: (encMatch as any).patientGender || (encMatch as any).gender || 'Male',
          patientAge: (encMatch as any).patientAge || (encMatch as any).age || 26,
          patientMobile: encMatch.patientMobile || '9876543210',
          patientAllergies: [],
          queueToken: encMatch.tokenNumber || (encMatch as any).queueToken || 'TK-01',
          consultationType: 'OPD_CONSULTATION',
          consultationStatus: 'IN_PROGRESS',
          chiefComplaint: encMatch.chiefComplaint || 'Clinical Consultation & Prescription',
          diagnoses: [],
          medications: [],
          investigationOrders: [],
          auditTraces: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as unknown as ConsultationDto;
      }
    }
    return null;
  }, [isChamberVacant, selectedConsultationId, consultations, encounters, context, doctors, chamberProfile.doctorName]);

  if (isLoading && !context) {
    return <SkeletonPage layout="table" metricCount={4} />;
  }

  if (error && !context) {
    return <ErrorState title="Failed to load Clinical Consultation Domain" message={error} onRetry={loadData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Real-World OPD Top Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Clinic Brand Badge */}
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.875rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
            }}
          >
            🏥 {facilityName || currentUser?.tenantName || context?.activePartnerName || 'CLINIC'}
          </span>

          <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '1.25rem', fontWeight: 300 }}>|</span>

          {/* Doctor Info & Chamber Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              {chamberProfile.doctorName || currentUser?.name || 'Attending Physician'}
            </span>
            <button
              type="button"
              onClick={() => {
                setChamberSettingsTab('profile');
                setIsSettingsOpen(true);
              }}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '16px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Click to change Chamber or Doctor Profile"
            >
              <span>🚪 {chamberProfile.roomNumber}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▾</span>
            </button>
            <Badge variant="success">● Live OPD Connected</Badge>
          </div>
        </div>

        {/* Right Action Icons: Reports, Chamber Settings & Exit */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsReportsOpen(true)}
            style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>📊</span>
            <span>Reports & Audit</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setChamberSettingsTab('profile');
              setIsSettingsOpen(true);
            }}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              color: '#38BDF8'
            }}
            title="Configure Doctor Chamber, Fees & Hardware"
          >
            <span>⚙️</span>
            <span>Chamber Settings</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('docsearch:exit_cockpit'));
            }}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#F87171',
              cursor: 'pointer'
            }}
            title="Exit OPD Cockpit and return to Clinic Home"
          >
            <span>✕</span>
            <span>Exit Cockpit</span>
          </Button>
        </div>
      </div>

      {/* Real-World OPD Consultation Cockpit (Queue + Active Desk) */}
      {context && (
        selectedConsultation ? (
          <SoloDoctorOpdCockpitView
            consultation={selectedConsultation}
            consultations={consultations}
            encounters={encounters}
            actorId={context.userEmail}
            actorRole={context.userRole}
            onSelectConsultation={handleSelectConsultation}
            onSaveDraft={async (_c, data) => {
              await handleSaveDraft({
                tenantId: _c.tenantId,
                consultationId: _c.id,
                chiefComplaint: data.chiefComplaint,
                clinicalAssessment: data.clinicalAssessment,
                treatmentPlan: data.treatmentPlan,
                actorId: context.userEmail,
                actorRole: context.userRole,
                justification: 'Auto-saved draft from Doctor OPD Cockpit',
                ...((_c as any).medications ? { medications: (_c as any).medications } : {}),
                ...((_c as any).labInvestigations ? { labInvestigations: (_c as any).labInvestigations } : {})
              } as any);
            }}
            onCompleteConsultation={async (_c, asmt, plan) => {
              await handleCompleteConsultation({
                tenantId: _c.tenantId,
                consultationId: _c.id,
                clinicalAssessment: asmt,
                treatmentPlan: plan,
                actorId: context.userEmail,
                actorRole: context.userRole,
                justification: 'Completed from Doctor OPD Cockpit',
                ...((_c as any).medications ? { medications: (_c as any).medications } : {}),
                ...((_c as any).labInvestigations ? { labInvestigations: (_c as any).labInvestigations } : {})
              } as any);
            }}
            onCallNextPatient={handleCallNextPatient}
            onAddMedication={handleAddMedication}
            onRemoveMedication={async (medId) => {
              const med = selectedConsultation.medications?.find((m) => m.id === medId);
              if (med) {
                await handleDiscontinueMedication(selectedConsultation, med);
              }
            }}
            onAddDiagnosis={handleAddDiagnosis}
            onRemoveDiagnosis={(diagId) => handleRemoveDiagnosis(selectedConsultation, diagId)}
            chamberRoom={chamberProfile.roomNumber}
            chamberDoctor={chamberProfile.doctorName || currentUser?.name || 'Attending Physician'}
            consultationFeeFirstVisit={chamberProfile.consultationFeeFirstVisit}
            consultationFeeFollowUp={chamberProfile.consultationFeeFollowUp}
            followUpValidityDays={chamberProfile.followUpValidityDays}
            onBackToStandardDesk={async () => {
              isChamberVacantRef.current = true;
              activeConsultationIdRef.current = null;
              setIsChamberVacant(true);
              setSelectedConsultationId(null);
              try {
                await clinicalConsultationService.vacateChamber(currentUser?.id);
              } catch (err) {
                console.warn('Failed to vacate chamber on server:', err);
              }
            }}
            onOpenSettings={() => {
              setChamberSettingsTab('profile');
              setIsSettingsOpen(true);
            }}
          />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '44px 24px',
              border: '1.5px dashed rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '2px' }}>🚪</div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '20px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}
            >
              <span>●</span>
              <span>Chamber {chamberProfile.roomNumber} is Vacant & Ready (केबिन खाली है)</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
              Attending: {chamberProfile.doctorName || currentUser?.name || 'Dr. Ashraf'}
            </h3>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem', maxWidth: '520px', lineHeight: 1.5 }}>
              The chamber is ready for the next consultation. Call a waiting patient below or register a walk-in patient.
            </p>

            {/* Waiting Patients Quick-Calling Bar */}
            {encounters.filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  width: '100%',
                  maxWidth: '640px',
                  backgroundColor: 'rgba(11, 17, 30, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38BDF8', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>👥 WAITING PATIENTS IN QUEUE ({encounters.filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length})</span>
                  <span style={{ fontSize: '0.68rem', color: '#64748B' }}>1-CLICK CALL TO CHAMBER</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {encounters
                    .filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED')
                    .sort((a, b) => {
                      const priorityWeights: Record<string, number> = { EMERGENCY: 1, URGENT: 2, ROUTINE: 3 };
                      const wA = priorityWeights[(a as any).priority || 'ROUTINE'] || 3;
                      const wB = priorityWeights[(b as any).priority || 'ROUTINE'] || 3;
                      if (wA !== wB) return wA - wB;
                      const tA = new Date((a as any).createdAt || 0).getTime();
                      const tB = new Date((b as any).createdAt || 0).getTime();
                      if (tA !== tB) return tA - tB;
                      return ((a as any).tokenNumber || '').localeCompare((b as any).tokenNumber || '');
                    })
                    .map((enc, idx) => (
                    <div
                      key={enc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.85rem' }}>
                            {enc.patientName || `Patient #${idx + 1}`}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#06B6D4', fontWeight: 800, backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            {enc.tokenNumber || `TK-${idx + 1}`}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                          MRN: {enc.patientMrn || 'N/A'} • {enc.chiefComplaint || 'Consultation'}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={async () => {
                          try {
                            isChamberVacantRef.current = false;
                            setIsChamberVacant(false);
                            const claimRes = await clinicalConsultationService.claimEncounter(enc.id, currentUser?.id);
                            if (claimRes?.consultation) {
                              activeConsultationIdRef.current = claimRes.consultation.id;
                              setSelectedConsultationId(claimRes.consultation.id);
                            } else {
                              handleSelectConsultation(enc.id);
                            }
                            await loadData(true);
                          } catch (err) {
                            console.error('Failed to claim patient into chamber:', err);
                            handleSelectConsultation(enc.id);
                          }
                        }}
                        style={{ fontSize: '0.75rem', fontWeight: 800 }}
                      >
                        📞 Call into Chamber
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'inline-flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('docsearch:open_fast_opd'));
                }}
              >
                + Register Walk-in Patient
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadData()}
              >
                ↻ Refresh Live Queue
              </Button>
            </div>
          </div>
        )
      )}

      {/* ⚙️ Chamber & Hardware Setup Modal */}
      <Dialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>⚙️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--ds-color-text-primary)' }}>
                  Chamber & Device Setup
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 400 }}>
                  Isolated Chamber Profile, Hardware Drivers & Multi-Branch Environment
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setChamberSettingsTab('profile')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chamberSettingsTab === 'profile' ? '#0284C7' : 'rgba(255,255,255,0.08)',
                  color: chamberSettingsTab === 'profile' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease'
                }}
              >
                🩺 Tab 1: Chamber Profile
              </button>
              <button
                type="button"
                onClick={() => setChamberSettingsTab('hardware')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chamberSettingsTab === 'hardware' ? '#0284C7' : 'rgba(255,255,255,0.08)',
                  color: chamberSettingsTab === 'hardware' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease'
                }}
              >
                🔌 Tab 2: Hardware & Devices
              </button>
              <button
                type="button"
                onClick={() => setChamberSettingsTab('scope')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chamberSettingsTab === 'scope' ? '#0284C7' : 'rgba(255,255,255,0.08)',
                  color: chamberSettingsTab === 'scope' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease'
                }}
              >
                🏥 Tab 3: Facility / Tenant Scope
              </button>
            </div>
          </div>
        }
        maxWidth="xl"
      >
        {/* Tab 1: Chamber Profile */}
        {chamberSettingsTab === 'profile' && (
          <form onSubmit={handleSaveChamberProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '78vh', overflowY: 'auto', paddingRight: '4px' }}>
            {chamberSaveSuccess && (
              <div style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10B981',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✓</span>
                <span>Chamber Profile successfully saved for {chamberProfile.roomNumber}! Changes reflected across OPD Cockpit.</span>
              </div>
            )}

            {/* Chamber Identification Card */}
            <div style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🚪</span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8' }}>
                  Chamber Identification & Consulting Room
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Chamber / Room Number *
                  </label>
                  <input
                    type="text"
                    value={chamberProfile.roomNumber}
                    onChange={(e) => setChamberProfile({ ...chamberProfile, roomNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.875rem',
                      fontWeight: 700
                    }}
                    placeholder="e.g. Room 101"
                    required
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {['Room 101', 'Room 102', 'Chamber A', 'Chamber B', 'OPD Suite 1'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setChamberProfile({ ...chamberProfile, roomNumber: preset })}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: chamberProfile.roomNumber === preset ? '#0284C7' : 'rgba(255,255,255,0.04)',
                          color: chamberProfile.roomNumber === preset ? '#FFF' : '#94A3B8',
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Attending Physician Name *
                  </label>
                  <input
                    type="text"
                    value={chamberProfile.doctorName}
                    onChange={(e) => setChamberProfile({ ...chamberProfile, doctorName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.875rem'
                    }}
                    placeholder={`e.g. ${currentUser?.name || 'Dr. Attending Physician'}`}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Specialization & Department
                  </label>
                  <input
                    type="text"
                    value={chamberProfile.department}
                    onChange={(e) => setChamberProfile({ ...chamberProfile, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g. MBBS, MD - General Medicine"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Medical Registration Number (MCI/KMC)
                  </label>
                  <input
                    type="text"
                    value={chamberProfile.mciRegistration}
                    onChange={(e) => setChamberProfile({ ...chamberProfile, mciRegistration: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g. MCI / KMC - 74892A"
                  />
                </div>
              </div>
            </div>

            {/* Consultation Billing & Follow-up Rules */}
            <div style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>💰</span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8' }}>
                  OPD Consultation Fees & Follow-up Rules
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    First Visit Consultation Fee (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>₹</span>
                    <input
                      type="number"
                      min={0}
                      value={chamberProfile.consultationFeeFirstVisit}
                      onChange={(e) => setChamberProfile({ ...chamberProfile, consultationFeeFirstVisit: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 26px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'var(--ds-color-text-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Follow-up Visit Fee (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>₹</span>
                    <input
                      type="number"
                      min={0}
                      value={chamberProfile.consultationFeeFollowUp}
                      onChange={(e) => setChamberProfile({ ...chamberProfile, consultationFeeFollowUp: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 26px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'var(--ds-color-text-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Free Follow-up Validity
                  </label>
                  <select
                    value={chamberProfile.followUpValidityDays}
                    onChange={(e) => setChamberProfile({ ...chamberProfile, followUpValidityDays: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value={3}>3 Days from visit</option>
                    <option value={5}>5 Days from visit</option>
                    <option value={7}>7 Days from visit (Standard)</option>
                    <option value={10}>10 Days from visit</option>
                    <option value={14}>14 Days from visit</option>
                    <option value={30}>30 Days from visit</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Max Daily OPD Token Capacity
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={chamberProfile.maxDailyCapacity}
                    onChange={(e) => setChamberProfile({ ...chamberProfile, maxDailyCapacity: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Chamber Audio Calling & Speech Preferences */}
            <div style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📢</span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8' }}>
                  Queue Calling Chime & Audio Announcement
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Speech Announcement Language
                  </label>
                  <select
                    value={chamberProfile.voiceLanguage}
                    onChange={(e) => setChamberProfile({ ...chamberProfile, voiceLanguage: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: 'var(--ds-color-text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="bilingual">Bilingual (Hindi + English)</option>
                    <option value="hindi">Hindi Only (टोकन नंबर... कमरा में पधारें)</option>
                    <option value="english">English Only (Token #... please proceed to Room)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={chamberProfile.enableChime}
                      onChange={(e) => setChamberProfile({ ...chamberProfile, enableChime: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#0284C7' }}
                    />
                    <span>Play acoustic chime bell before voice call</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={chamberProfile.autoAdvanceOnSign}
                      onChange={(e) => setChamberProfile({ ...chamberProfile, autoAdvanceOnSign: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#0284C7' }}
                    />
                    <span>Automatically call next patient upon Rx sign & print</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="primary"
                style={{ fontWeight: 700, padding: '8px 24px', backgroundColor: '#0284C7' }}
              >
                💾 Save Chamber Profile
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Hardware & Devices */}
        {chamberSettingsTab === 'hardware' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '78vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>
                  Chamber Peripheral Hardware & Diagnostics
                </h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                  Peripherals configured for this consulting room. Daily clinical workflow is kept 100% distraction-free.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => hardwareStatusService.openDrawer()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
              >
                <span>🛠️</span>
                <span>Open Diagnostics Console (Alt+H)</span>
              </Button>
            </div>

            {/* 3 Core Hardware Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {/* TVS 80mm Printer */}
              <div style={{
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>🖨️</span>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>TVS 80mm Printer</span>
                  </div>
                  <Badge variant="success">Online</Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', lineHeight: 1.4 }}>
                  <div><strong>Model:</strong> TVS RP 3200 Plus (ESC/POS)</div>
                  <div><strong>Width:</strong> 80mm Thermal Receipt / Rx Slip</div>
                  <div><strong>Support:</strong> English + Hindi Header Print</div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void hardwareStatusService.triggerPrinterTest()}
                    style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    Print Test Slip
                  </Button>
                </div>
              </div>

              {/* Barcode Scanner Gun */}
              <div style={{
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>🔫</span>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Barcode Scanner Gun</span>
                  </div>
                  <Badge variant="success">Ready</Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', lineHeight: 1.4 }}>
                  <div><strong>Mode:</strong> USB HID Keyboard Emulation</div>
                  <div><strong>Symbology:</strong> 1D Barcode, 2D QR Code</div>
                  <div><strong>ABHA Support:</strong> ABDM Patient QR Decoding</div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => hardwareStatusService.openDrawer()}
                    style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    Test Scanner Input
                  </Button>
                </div>
              </div>

              {/* Mindray Auto-Analyzer */}
              <div style={{
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>🧪</span>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Mindray Auto-Analyzer</span>
                  </div>
                  <Badge variant="success">Synced</Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', lineHeight: 1.4 }}>
                  <div><strong>Model:</strong> BS-240 / BC-5000 Series</div>
                  <div><strong>Protocol:</strong> ASTM E1381 / E1394 LIS</div>
                  <div><strong>Port:</strong> COM3 Serial / TCP 192.168.1.110</div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => hardwareStatusService.openDrawer()}
                    style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    View Ingested Results
                  </Button>
                </div>
              </div>
            </div>

            {/* Smart Waiting Room & Bluetooth IoT Gateway Section */}
            <div style={{
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '10px',
              padding: '16px',
              backgroundColor: 'rgba(56, 189, 248, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📡</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#38BDF8' }}>
                    Smart Waiting Room & Bluetooth IoT Vitals Hub
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--ds-color-text-muted)' }}>
                    Pair Omron Blood Pressure, Contec Pulse Oximeter, or Beurer Infrared Thermometer via Web Bluetooth to auto-fill patient vitals.
                  </p>
                </div>
              </div>
              <SmartWaitingRoomVitalsGateway />
            </div>
          </div>
        )}

        {chamberSettingsTab === 'scope' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '14px 18px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.4rem' }}>🏥</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#38BDF8' }}>
                  Operational Session Scope (Multi-Branch Management)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                  Your doctor desk is currently locked to <strong>{context?.activePartnerName || 'Ashiyana Clinic'}</strong>.
                  Switch active branch or hospital facility below only if you practice across multiple physical branches.
                </div>
              </div>
            </div>
            {context && (
              <PanelContextSwitcher
                context={context}
                partners={partners}
                organizations={organizations}
                facilities={facilities}
                onContextChange={async (newCtx) => {
                  await handleContextChange(newCtx);
                  setIsSettingsOpen(false);
                }}
              />
            )}
          </div>
        )}
      </Dialog>

      {/* 📊 Reports & Audit Modal */}
      <Dialog
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>📊</span>
            <span>Clinical Analytics & Compliance Audit Vault</span>
            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={() => setReportTab('overview')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: reportTab === 'overview' ? '#0284C7' : 'rgba(255,255,255,0.08)',
                  color: reportTab === 'overview' ? '#FFFFFF' : '#94A3B8'
                }}
              >
                📊 Overview & KPIs
              </button>
              <button
                type="button"
                onClick={() => setReportTab('audit')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: reportTab === 'audit' ? '#0284C7' : 'rgba(255,255,255,0.08)',
                  color: reportTab === 'audit' ? '#FFFFFF' : '#94A3B8'
                }}
              >
                🔒 Immutable Audit Vault
              </button>
            </div>
          </div>
        }
        maxWidth="xl"
      >
        <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {reportTab === 'overview' && overview && (
            <ConsultationOverviewView
              overview={overview}
              consultations={consultations}
              onSelectConsultation={(id) => {
                setIsReportsOpen(false);
                handleSelectConsultation(id);
              }}
              onOpenWorklist={() => {
                setIsReportsOpen(false);
              }}
            />
          )}
          {reportTab === 'audit' && (
            <ConsultationAuditVaultView auditTraces={auditTraces} />
          )}
        </div>
      </Dialog>
    </div>
  );
};
