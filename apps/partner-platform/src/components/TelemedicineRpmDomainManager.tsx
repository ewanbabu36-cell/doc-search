import React, { useState, useEffect, useCallback } from 'react';
import type {
  TelemedicineOverviewMetricsDto,
  TeleconsultationSessionDto,
  WaitingRoomQueueItemDto,
  IotConnectedDeviceDto,
  RpmTelemetryObservationDto,
  RpmVitalBreachAlertDto,
  TelehealthAuditTraceDto,
  ScheduleTeleconsultationRequest,
  RegisterIotDeviceRequest,
  EnrollRpmPatientRequest,
  AcknowledgeVitalBreachRequest
} from '@docsearch/api-contracts';

import { telemedicineRpmService } from '../services/telemedicine-rpm-service.js';

// Views
import { TelemedicineOverviewView } from './views/TelemedicineOverviewView.js';
import { VirtualConsultationRoomView } from './views/VirtualConsultationRoomView.js';
import { VirtualWaitingRoomView } from './views/VirtualWaitingRoomView.js';
import { IotDeviceTelemetryView } from './views/IotDeviceTelemetryView.js';
import { RpmCareCohortManagementView } from './views/RpmCareCohortManagementView.js';
import { VitalBreachEscalationView } from './views/VitalBreachEscalationView.js';
import { TelehealthAuditVaultView } from './views/TelehealthAuditVaultView.js';

// Dialogs
import { ScheduleTeleconsultationDialog } from './dialogs/ScheduleTeleconsultationDialog.js';
import { RegisterIotDeviceDialog } from './dialogs/RegisterIotDeviceDialog.js';
import { EnrollRpmPatientDialog } from './dialogs/EnrollRpmPatientDialog.js';
import { AcknowledgeVitalBreachDialog } from './dialogs/AcknowledgeVitalBreachDialog.js';

type TelemedicineTab =
  | 'OVERVIEW'
  | 'ACTIVE_VIDEO_ROOM'
  | 'WAITING_ROOM_QUEUE'
  | 'IOT_TELEMETRY'
  | 'CARE_COHORTS'
  | 'VITAL_BREACHES'
  | 'AUDIT_VAULT';

interface Props {
  tenantId: string;
}

export const TelemedicineRpmDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<TelemedicineTab>('OVERVIEW');

  // Active target for modal
  const [targetBreachAlert, setTargetBreachAlert] = useState<RpmVitalBreachAlertDto | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<TelemedicineOverviewMetricsDto | null>(null);
  const [sessions, setSessions] = useState<TeleconsultationSessionDto[]>([]);
  const [waitingQueue, setWaitingQueue] = useState<WaitingRoomQueueItemDto[]>([]);
  const [devices, setDevices] = useState<IotConnectedDeviceDto[]>([]);
  const [telemetry, setTelemetry] = useState<RpmTelemetryObservationDto[]>([]);
  const [breachAlerts, setBreachAlerts] = useState<RpmVitalBreachAlertDto[]>([]);
  const [traces, setTraces] = useState<TelehealthAuditTraceDto[]>([]);

  // Dialog toggles
  const [showScheduleSession, setShowScheduleSession] = useState(false);
  const [showRegisterDevice, setShowRegisterDevice] = useState(false);
  const [showEnrollRpm, setShowEnrollRpm] = useState(false);

  const loadData = useCallback(async () => {
    const [
      m,
      sess,
      queue,
      dev,
      tel,
      alerts,
      tr
    ] = await Promise.all([
      telemedicineRpmService.getOverviewMetrics(tenantId),
      telemedicineRpmService.getSessions(tenantId),
      telemedicineRpmService.getWaitingRoomQueue(tenantId),
      telemedicineRpmService.getIotDevices(tenantId),
      telemedicineRpmService.getTelemetryObservations(tenantId),
      telemedicineRpmService.getVitalBreachAlerts(tenantId),
      telemedicineRpmService.getAuditTraces(tenantId)
    ]);

    setMetrics(m);
    setSessions(sess);
    setWaitingQueue(queue);
    setDevices(dev);
    setTelemetry(tel);
    setBreachAlerts(alerts);
    setTraces(tr);
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-gray-500">Initializing Telemedicine & RPM Gateway...</div>;
  }

  // Handlers
  const handleScheduleSession = async (data: ScheduleTeleconsultationRequest) => {
    await telemedicineRpmService.scheduleSession(tenantId, data);
    await loadData();
  };

  const handleAdmitFromWaitingRoom = async (queueId: string) => {
    await telemedicineRpmService.admitPatientFromWaitingRoom(tenantId, queueId);
    await loadData();
    setActiveTab('ACTIVE_VIDEO_ROOM');
  };

  const handleRegisterDevice = async (data: RegisterIotDeviceRequest) => {
    await telemedicineRpmService.registerIotDevice(tenantId, data);
    await loadData();
    setActiveTab('IOT_TELEMETRY');
  };

  const handleEnrollRpm = async (data: EnrollRpmPatientRequest) => {
    await telemedicineRpmService.enrollRpmPatient(tenantId, data);
    await loadData();
    setActiveTab('CARE_COHORTS');
  };

  const handleAcknowledgeBreach = async (data: AcknowledgeVitalBreachRequest) => {
    await telemedicineRpmService.acknowledgeVitalBreach(tenantId, data);
    await loadData();
    if (data.escalateToVideoCall) {
      setActiveTab('ACTIVE_VIDEO_ROOM');
    }
  };

  const activeLiveSession = sessions.find((s) => s.status === 'CALL_IN_PROGRESS') || sessions[0];

  return (
    <div className="space-y-4">
      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📹 Telemedicine Overview
        </button>
        <button
          onClick={() => setActiveTab('ACTIVE_VIDEO_ROOM')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'ACTIVE_VIDEO_ROOM' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔒 Encrypted Video Room
        </button>
        <button
          onClick={() => setActiveTab('WAITING_ROOM_QUEUE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'WAITING_ROOM_QUEUE' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          ⏳ Virtual Waiting Room ({waitingQueue.length})
        </button>
        <button
          onClick={() => setActiveTab('IOT_TELEMETRY')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'IOT_TELEMETRY' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📡 Connected IoT Devices ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab('CARE_COHORTS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CARE_COHORTS' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🩺 Chronic Care Cohorts
        </button>
        <button
          onClick={() => setActiveTab('VITAL_BREACHES')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'VITAL_BREACHES' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🚨 Vital Threshold Breaches ({breachAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_VAULT')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'AUDIT_VAULT' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔐 Telehealth Audit Vault
        </button>
      </div>

      {/* Tab Renderers */}
      {activeTab === 'OVERVIEW' && (
        <TelemedicineOverviewView
          metrics={metrics}
          sessions={sessions}
          devices={devices}
          breachAlerts={breachAlerts}
          onScheduleTeleconsult={() => setShowScheduleSession(true)}
          onRegisterDevice={() => setShowRegisterDevice(true)}
          onEnrollRpm={() => setShowEnrollRpm(true)}
        />
      )}

      {activeTab === 'ACTIVE_VIDEO_ROOM' && activeLiveSession && (
        <VirtualConsultationRoomView session={activeLiveSession} />
      )}

      {activeTab === 'WAITING_ROOM_QUEUE' && (
        <VirtualWaitingRoomView
          queue={waitingQueue}
          onAdmit={handleAdmitFromWaitingRoom}
        />
      )}

      {activeTab === 'IOT_TELEMETRY' && (
        <IotDeviceTelemetryView
          devices={devices}
          telemetry={telemetry}
          onRegisterDevice={() => setShowRegisterDevice(true)}
        />
      )}

      {activeTab === 'CARE_COHORTS' && (
        <RpmCareCohortManagementView onEnrollPatient={() => setShowEnrollRpm(true)} />
      )}

      {activeTab === 'VITAL_BREACHES' && (
        <VitalBreachEscalationView
          alerts={breachAlerts}
          onAcknowledge={(alert) => setTargetBreachAlert(alert)}
        />
      )}

      {activeTab === 'AUDIT_VAULT' && <TelehealthAuditVaultView traces={traces} />}

      {/* Dialog Modals */}
      <ScheduleTeleconsultationDialog
        isOpen={showScheduleSession}
        onClose={() => setShowScheduleSession(false)}
        onSubmit={handleScheduleSession}
      />

      <RegisterIotDeviceDialog
        isOpen={showRegisterDevice}
        onClose={() => setShowRegisterDevice(false)}
        onSubmit={handleRegisterDevice}
      />

      <EnrollRpmPatientDialog
        isOpen={showEnrollRpm}
        onClose={() => setShowEnrollRpm(false)}
        onSubmit={handleEnrollRpm}
      />

      {targetBreachAlert && (
        <AcknowledgeVitalBreachDialog
          isOpen={!!targetBreachAlert}
          alertId={targetBreachAlert.id}
          patientName={targetBreachAlert.patientName}
          vitalParameter={targetBreachAlert.vitalParameter}
          measuredValue={targetBreachAlert.measuredValue}
          onClose={() => setTargetBreachAlert(null)}
          onSubmit={handleAcknowledgeBreach}
        />
      )}
    </div>
  );
};
