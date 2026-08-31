import React, { useState, useEffect, useCallback } from 'react';
import type {
  BiomedicalAssetDto,
  AssetTransferDto,
  PpmScheduleDto,
  BreakdownWorkOrderDto,
  CalibrationRecordDto,
  SafetyTestRecordDto,
  SparePartDto,
  SparePartUsageDto,
  VendorServiceVisitDto,
  CondemnationRecordDto,
  BiomedicalIncidentDto,
  BiomedicalAuditTraceDto,
  AssetOverviewMetricsDto,
  AssetDowntimeAnalyticsDto,
  CreateBiomedicalAssetRequest,
  UpdateBiomedicalAssetRequest,
  CreateAssetTransferRequest,
  CreatePpmScheduleRequest,
  CompletePpmTaskRequest,
  CreateWorkOrderRequest,
  AssignWorkOrderRequest,
  CompleteWorkOrderRequest,
  VerifyWorkOrderRequest,
  CreateCalibrationRecordRequest,
  CreateSafetyTestRecordRequest,
  CreateSparePartRequest,
  ConsumeSparePartRequest,
  LogVendorVisitRequest,
  CreateCondemnationRequest,
  ApproveCondemnationRequest,
  CreateBiomedicalIncidentRequest,
  ResolveBiomedicalIncidentRequest
} from '@docsearch/api-contracts';

import { assetBiomedicalService } from '../services/asset-biomedical-service.js';

// Operational Views
import { AssetOverviewView } from './views/AssetOverviewView.js';
import { AssetControlCenterView } from './views/AssetControlCenterView.js';
import { AssetInventoryDirectoryView } from './views/AssetInventoryDirectoryView.js';
import { AssetDetailView } from './views/AssetDetailView.js';
import { PpmScheduleBoardView } from './views/PpmScheduleBoardView.js';
import { BreakdownWorkOrdersView } from './views/BreakdownWorkOrdersView.js';
import { BiomedicalCalibrationView } from './views/BiomedicalCalibrationView.js';
import { ElectricalSafetyTestingView } from './views/ElectricalSafetyTestingView.js';
import { SparePartsInventoryView } from './views/SparePartsInventoryView.js';
import { VendorOemManagementView } from './views/VendorOemManagementView.js';
import { CondemnationDisposalView } from './views/CondemnationDisposalView.js';
import { BiomedicalIncidentsView } from './views/BiomedicalIncidentsView.js';
import { ClinicalEquipmentReadinessView } from './views/ClinicalEquipmentReadinessView.js';
import { AssetFinancialsView } from './views/AssetFinancialsView.js';
import { AssetDowntimeAnalyticsView } from './views/AssetDowntimeAnalyticsView.js';
import { AssetComplianceVaultView } from './views/AssetComplianceVaultView.js';
import { AssetAuditVaultView } from './views/AssetAuditVaultView.js';

// Action Dialogs
import { RegisterAssetDialog } from './dialogs/RegisterAssetDialog.js';
import { EditAssetDialog } from './dialogs/EditAssetDialog.js';
import { TransferAssetDialog } from './dialogs/TransferAssetDialog.js';
import { CreatePpmScheduleDialog } from './dialogs/CreatePpmScheduleDialog.js';
import { CompletePpmTaskDialog } from './dialogs/CompletePpmTaskDialog.js';
import { ReportBreakdownDialog } from './dialogs/ReportBreakdownDialog.js';
import { AssignWorkOrderDialog } from './dialogs/AssignWorkOrderDialog.js';
import { CompleteWorkOrderDialog } from './dialogs/CompleteWorkOrderDialog.js';
import { VerifyWorkOrderDialog } from './dialogs/VerifyWorkOrderDialog.js';
import { RecordCalibrationDialog } from './dialogs/RecordCalibrationDialog.js';
import { RecordSafetyTestDialog } from './dialogs/RecordSafetyTestDialog.js';
import { RegisterSparePartDialog } from './dialogs/RegisterSparePartDialog.js';
import { ConsumeSparePartDialog } from './dialogs/ConsumeSparePartDialog.js';
import { LogVendorVisitDialog } from './dialogs/LogVendorVisitDialog.js';
import { ProposeCondemnationDialog } from './dialogs/ProposeCondemnationDialog.js';
import { ApproveCondemnationDialog } from './dialogs/ApproveCondemnationDialog.js';
import { ReportBiomedicalIncidentDialog } from './dialogs/ReportBiomedicalIncidentDialog.js';
import { ResolveBiomedicalIncidentDialog } from './dialogs/ResolveBiomedicalIncidentDialog.js';

interface Props {
  tenantId: string;
}

export type TabKey =
  | 'overview'
  | 'fleet_registry'
  | 'directory'
  | 'asset_detail'
  | 'ppm_board'
  | 'breakdown_work_orders'
  | 'calibration'
  | 'electrical_safety'
  | 'spare_parts'
  | 'vendor_oem'
  | 'condemnation'
  | 'incidents'
  | 'readiness'
  | 'financials'
  | 'downtime'
  | 'compliance'
  | 'audit';

export const AssetBiomedicalDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);

  // State
  const [metrics, setMetrics] = useState<AssetOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<AssetDowntimeAnalyticsDto | null>(null);
  const [assets, setAssets] = useState<BiomedicalAssetDto[]>([]);
  const [, setTransfers] = useState<AssetTransferDto[]>([]);
  const [ppmSchedules, setPpmSchedules] = useState<PpmScheduleDto[]>([]);
  const [workOrders, setWorkOrders] = useState<BreakdownWorkOrderDto[]>([]);
  const [calibrations, setCalibrations] = useState<CalibrationRecordDto[]>([]);
  const [safetyTests, setSafetyTests] = useState<SafetyTestRecordDto[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartDto[]>([]);
  const [sparePartUsages, setSparePartUsages] = useState<SparePartUsageDto[]>([]);
  const [vendorVisits, setVendorVisits] = useState<VendorServiceVisitDto[]>([]);
  const [condemnations, setCondemnations] = useState<CondemnationRecordDto[]>([]);
  const [incidents, setIncidents] = useState<BiomedicalIncidentDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<BiomedicalAuditTraceDto[]>([]);

  // Selection
  const [selectedAsset, setSelectedAsset] = useState<BiomedicalAssetDto | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<BreakdownWorkOrderDto | null>(null);
  const [selectedPpm, setSelectedPpm] = useState<PpmScheduleDto | null>(null);
  const [selectedCondemnation, setSelectedCondemnation] = useState<CondemnationRecordDto | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<BiomedicalIncidentDto | null>(null);

  // Dialog open states
  const [isRegisterAssetOpen, setIsRegisterAssetOpen] = useState(false);
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [isTransferAssetOpen, setIsTransferAssetOpen] = useState(false);
  const [isCreatePpmOpen, setIsCreatePpmOpen] = useState(false);
  const [isCompletePpmOpen, setIsCompletePpmOpen] = useState(false);
  const [isReportBreakdownOpen, setIsReportBreakdownOpen] = useState(false);
  const [isAssignWoOpen, setIsAssignWoOpen] = useState(false);
  const [isCompleteWoOpen, setIsCompleteWoOpen] = useState(false);
  const [isVerifyWoOpen, setIsVerifyWoOpen] = useState(false);
  const [isRecordCalOpen, setIsRecordCalOpen] = useState(false);
  const [isRecordSafetyOpen, setIsRecordSafetyOpen] = useState(false);
  const [isRegisterSpareOpen, setIsRegisterSpareOpen] = useState(false);
  const [isConsumeSpareOpen, setIsConsumeSpareOpen] = useState(false);
  const [isLogVendorVisitOpen, setIsLogVendorVisitOpen] = useState(false);
  const [isProposeCondemnOpen, setIsProposeCondemnOpen] = useState(false);
  const [isApproveCondemnOpen, setIsApproveCondemnOpen] = useState(false);
  const [isReportIncidentOpen, setIsReportIncidentOpen] = useState(false);
  const [isResolveIncidentOpen, setIsResolveIncidentOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        m,
        ana,
        ass,
        tr,
        ppm,
        wo,
        cal,
        saf,
        sp,
        spu,
        vv,
        cond,
        inc,
        aud
      ] = await Promise.all([
        assetBiomedicalService.getOverviewMetrics(tenantId),
        assetBiomedicalService.getDowntimeAnalytics(tenantId),
        assetBiomedicalService.getAssets(tenantId),
        assetBiomedicalService.getTransfers(tenantId),
        assetBiomedicalService.getPpmSchedules(tenantId),
        assetBiomedicalService.getWorkOrders(tenantId),
        assetBiomedicalService.getCalibrationRecords(tenantId),
        assetBiomedicalService.getSafetyTestRecords(tenantId),
        assetBiomedicalService.getSpareParts(tenantId),
        assetBiomedicalService.getSparePartUsages(tenantId),
        assetBiomedicalService.getVendorVisits(tenantId),
        assetBiomedicalService.getCondemnations(tenantId),
        assetBiomedicalService.getIncidents(tenantId),
        assetBiomedicalService.getAuditTraces(tenantId)
      ]);
      setMetrics(m);
      setAnalytics(ana);
      setAssets(ass);
      setTransfers(tr);
      setPpmSchedules(ppm);
      setWorkOrders(wo);
      setCalibrations(cal);
      setSafetyTests(saf);
      setSpareParts(sp);
      setSparePartUsages(spu);
      setVendorVisits(vv);
      setCondemnations(cond);
      setIncidents(inc);
      setAuditTraces(aud);
      if (ass.length > 0 && !selectedAsset) {
        setSelectedAsset(ass[0] || null);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedAsset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleRegisterAsset = async (payload: CreateBiomedicalAssetRequest) => {
    await assetBiomedicalService.createAsset(tenantId, payload);
    await loadData();
  };

  const handleUpdateAsset = async (id: string, payload: UpdateBiomedicalAssetRequest) => {
    await assetBiomedicalService.updateAsset(tenantId, id, payload);
    await loadData();
  };

  const handleTransferAsset = async (payload: CreateAssetTransferRequest) => {
    await assetBiomedicalService.createTransfer(tenantId, payload);
    await loadData();
  };

  const handleCreatePpmSchedule = async (payload: CreatePpmScheduleRequest) => {
    await assetBiomedicalService.createPpmSchedule(tenantId, payload);
    await loadData();
  };

  const handleCompletePpmTask = async (scheduleId: string, payload: CompletePpmTaskRequest) => {
    await assetBiomedicalService.completePpmTask(tenantId, scheduleId, payload);
    await loadData();
  };

  const handleCreateWorkOrder = async (payload: CreateWorkOrderRequest) => {
    await assetBiomedicalService.createWorkOrder(tenantId, payload);
    await loadData();
  };

  const handleAssignWorkOrder = async (workOrderId: string, payload: AssignWorkOrderRequest) => {
    await assetBiomedicalService.assignWorkOrder(tenantId, workOrderId, payload);
    await loadData();
  };

  const handleCompleteWorkOrder = async (workOrderId: string, payload: CompleteWorkOrderRequest) => {
    await assetBiomedicalService.completeWorkOrder(tenantId, workOrderId, payload);
    await loadData();
  };

  const handleVerifyWorkOrder = async (workOrderId: string, payload: VerifyWorkOrderRequest) => {
    await assetBiomedicalService.verifyWorkOrder(tenantId, workOrderId, payload);
    await loadData();
  };

  const handleCreateCalibration = async (payload: CreateCalibrationRecordRequest) => {
    await assetBiomedicalService.createCalibrationRecord(tenantId, payload);
    await loadData();
  };

  const handleCreateSafetyTest = async (payload: CreateSafetyTestRecordRequest) => {
    await assetBiomedicalService.createSafetyTestRecord(tenantId, payload);
    await loadData();
  };

  const handleCreateSparePart = async (payload: CreateSparePartRequest) => {
    await assetBiomedicalService.createSparePart(tenantId, payload);
    await loadData();
  };

  const handleConsumeSparePart = async (payload: ConsumeSparePartRequest) => {
    await assetBiomedicalService.consumeSparePart(tenantId, payload);
    await loadData();
  };

  const handleLogVendorVisit = async (payload: LogVendorVisitRequest) => {
    await assetBiomedicalService.logVendorVisit(tenantId, payload);
    await loadData();
  };

  const handleCreateCondemnation = async (payload: CreateCondemnationRequest) => {
    await assetBiomedicalService.createCondemnation(tenantId, payload);
    await loadData();
  };

  const handleApproveCondemnation = async (condemnationId: string, payload: ApproveCondemnationRequest) => {
    await assetBiomedicalService.approveCondemnation(tenantId, condemnationId, payload);
    await loadData();
  };

  const handleCreateIncident = async (payload: CreateBiomedicalIncidentRequest) => {
    await assetBiomedicalService.createIncident(tenantId, payload);
    await loadData();
  };

  const handleResolveIncident = async (incidentId: string, payload: ResolveBiomedicalIncidentRequest) => {
    await assetBiomedicalService.resolveIncident(tenantId, incidentId, payload);
    await loadData();
  };

  if (loading && !metrics) {
    return <div className="p-8 text-center text-xs text-gray-500">Loading HTM & Biomedical Asset Platform...</div>;
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '📊 Command Center' },
    { key: 'fleet_registry', label: '🏥 Asset Fleet Cards' },
    { key: 'directory', label: '📋 Master Directory' },
    { key: 'ppm_board', label: '🛠️ PPM Scheduler' },
    { key: 'breakdown_work_orders', label: '🚨 Breakdown WOs' },
    { key: 'calibration', label: '📐 Metrology & Calibration' },
    { key: 'electrical_safety', label: '⚡ Safety Tests (IEC)' },
    { key: 'spare_parts', label: '📦 Spare Parts Store' },
    { key: 'vendor_oem', label: '🤝 OEM Service Visits' },
    { key: 'condemnation', label: '♻️ Condemnation Board' },
    { key: 'incidents', label: '⚠️ Safety Incidents & CAPA' },
    { key: 'readiness', label: '🩺 Clinical Ward Readiness' },
    { key: 'financials', label: '💰 Valuation & TCO' },
    { key: 'downtime', label: '📈 MTBF / MTTR Analytics' },
    { key: 'compliance', label: '🛡️ NABH / AERB Vault' },
    { key: 'audit', label: '🔒 Cryptographic Trace Vault' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b bg-white p-2 rounded-xl shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Views */}
      {activeTab === 'overview' && metrics && (
        <AssetOverviewView
          metrics={metrics}
          assets={assets}
          workOrders={workOrders}
          ppmSchedules={ppmSchedules}
          onRegisterAsset={() => setIsRegisterAssetOpen(true)}
          onReportBreakdown={() => setIsReportBreakdownOpen(true)}
          onSelectAsset={(asset) => {
            setSelectedAsset(asset);
            setActiveTab('asset_detail');
          }}
        />
      )}

      {activeTab === 'fleet_registry' && (
        <AssetControlCenterView
          assets={assets}
          onTransfer={(asset) => {
            setSelectedAsset(asset);
            setIsTransferAssetOpen(true);
          }}
          onEdit={(asset) => {
            setSelectedAsset(asset);
            setIsEditAssetOpen(true);
          }}
          onCondemn={(asset) => {
            setSelectedAsset(asset);
            setIsProposeCondemnOpen(true);
          }}
          onSelect={(asset) => {
            setSelectedAsset(asset);
            setActiveTab('asset_detail');
          }}
        />
      )}

      {activeTab === 'directory' && (
        <AssetInventoryDirectoryView
          assets={assets}
          onSelect={(asset) => {
            setSelectedAsset(asset);
            setActiveTab('asset_detail');
          }}
          onRegister={() => setIsRegisterAssetOpen(true)}
        />
      )}

      {activeTab === 'asset_detail' && (selectedAsset || assets[0]) && (
        <AssetDetailView
          asset={(selectedAsset || assets[0]) as BiomedicalAssetDto}
          ppmSchedules={ppmSchedules}
          workOrders={workOrders}
          calibrations={calibrations}
          onBack={() => setActiveTab('fleet_registry')}
          onEdit={(asset) => {
            setSelectedAsset(asset);
            setIsEditAssetOpen(true);
          }}
          onTransfer={(asset) => {
            setSelectedAsset(asset);
            setIsTransferAssetOpen(true);
          }}
          onReportBreakdown={() => setIsReportBreakdownOpen(true)}
        />
      )}

      {activeTab === 'ppm_board' && (
        <PpmScheduleBoardView
          schedules={ppmSchedules}
          onCreateSchedule={() => setIsCreatePpmOpen(true)}
          onCompletePpm={(schedule) => {
            setSelectedPpm(schedule);
            setIsCompletePpmOpen(true);
          }}
        />
      )}

      {activeTab === 'breakdown_work_orders' && (
        <BreakdownWorkOrdersView
          workOrders={workOrders}
          onReportBreakdown={() => setIsReportBreakdownOpen(true)}
          onAssignEngineer={(wo) => {
            setSelectedWorkOrder(wo);
            setIsAssignWoOpen(true);
          }}
          onCompleteRepair={(wo) => {
            setSelectedWorkOrder(wo);
            setIsCompleteWoOpen(true);
          }}
          onVerifyClinician={(wo) => {
            setSelectedWorkOrder(wo);
            setIsVerifyWoOpen(true);
          }}
        />
      )}

      {activeTab === 'calibration' && (
        <BiomedicalCalibrationView
          records={calibrations}
          onRecordCalibration={() => setIsRecordCalOpen(true)}
        />
      )}

      {activeTab === 'electrical_safety' && (
        <ElectricalSafetyTestingView
          records={safetyTests}
          onRecordSafetyTest={() => setIsRecordSafetyOpen(true)}
        />
      )}

      {activeTab === 'spare_parts' && (
        <SparePartsInventoryView
          spareParts={spareParts}
          usages={sparePartUsages}
          onAddPart={() => setIsRegisterSpareOpen(true)}
          onConsumePart={() => setIsConsumeSpareOpen(true)}
        />
      )}

      {activeTab === 'vendor_oem' && (
        <VendorOemManagementView
          visits={vendorVisits}
          onLogVisit={() => setIsLogVendorVisitOpen(true)}
        />
      )}

      {activeTab === 'condemnation' && (
        <CondemnationDisposalView
          condemnations={condemnations}
          onApproveCondemnation={(cond) => {
            setSelectedCondemnation(cond);
            setIsApproveCondemnOpen(true);
          }}
        />
      )}

      {activeTab === 'incidents' && (
        <BiomedicalIncidentsView
          incidents={incidents}
          onReportIncident={() => setIsReportIncidentOpen(true)}
          onResolveIncident={(inc) => {
            setSelectedIncident(inc);
            setIsResolveIncidentOpen(true);
          }}
        />
      )}

      {activeTab === 'readiness' && (
        <ClinicalEquipmentReadinessView assets={assets} />
      )}

      {activeTab === 'financials' && (
        <AssetFinancialsView assets={assets} />
      )}

      {activeTab === 'downtime' && analytics && (
        <AssetDowntimeAnalyticsView analytics={analytics} />
      )}

      {activeTab === 'compliance' && (
        <AssetComplianceVaultView />
      )}

      {activeTab === 'audit' && (
        <AssetAuditVaultView traces={auditTraces} />
      )}

      {/* Dialog Modals */}
      <RegisterAssetDialog
        isOpen={isRegisterAssetOpen}
        onClose={() => setIsRegisterAssetOpen(false)}
        onSubmit={handleRegisterAsset}
      />

      {selectedAsset && (
        <EditAssetDialog
          isOpen={isEditAssetOpen}
          asset={selectedAsset}
          onClose={() => setIsEditAssetOpen(false)}
          onSubmit={handleUpdateAsset}
        />
      )}

      {selectedAsset && (
        <TransferAssetDialog
          isOpen={isTransferAssetOpen}
          asset={selectedAsset}
          onClose={() => setIsTransferAssetOpen(false)}
          onSubmit={handleTransferAsset}
        />
      )}

      <CreatePpmScheduleDialog
        isOpen={isCreatePpmOpen}
        assets={assets}
        onClose={() => setIsCreatePpmOpen(false)}
        onSubmit={handleCreatePpmSchedule}
      />

      {selectedPpm && (
        <CompletePpmTaskDialog
          isOpen={isCompletePpmOpen}
          schedule={selectedPpm}
          onClose={() => setIsCompletePpmOpen(false)}
          onSubmit={handleCompletePpmTask}
        />
      )}

      <ReportBreakdownDialog
        isOpen={isReportBreakdownOpen}
        assets={assets}
        onClose={() => setIsReportBreakdownOpen(false)}
        onSubmit={handleCreateWorkOrder}
      />

      {selectedWorkOrder && (
        <AssignWorkOrderDialog
          isOpen={isAssignWoOpen}
          workOrder={selectedWorkOrder}
          onClose={() => setIsAssignWoOpen(false)}
          onSubmit={handleAssignWorkOrder}
        />
      )}

      {selectedWorkOrder && (
        <CompleteWorkOrderDialog
          isOpen={isCompleteWoOpen}
          workOrder={selectedWorkOrder}
          onClose={() => setIsCompleteWoOpen(false)}
          onSubmit={handleCompleteWorkOrder}
        />
      )}

      {selectedWorkOrder && (
        <VerifyWorkOrderDialog
          isOpen={isVerifyWoOpen}
          workOrder={selectedWorkOrder}
          onClose={() => setIsVerifyWoOpen(false)}
          onSubmit={handleVerifyWorkOrder}
        />
      )}

      <RecordCalibrationDialog
        isOpen={isRecordCalOpen}
        assets={assets}
        onClose={() => setIsRecordCalOpen(false)}
        onSubmit={handleCreateCalibration}
      />

      <RecordSafetyTestDialog
        isOpen={isRecordSafetyOpen}
        assets={assets}
        onClose={() => setIsRecordSafetyOpen(false)}
        onSubmit={handleCreateSafetyTest}
      />

      <RegisterSparePartDialog
        isOpen={isRegisterSpareOpen}
        onClose={() => setIsRegisterSpareOpen(false)}
        onSubmit={handleCreateSparePart}
      />

      <ConsumeSparePartDialog
        isOpen={isConsumeSpareOpen}
        assets={assets}
        spareParts={spareParts}
        onClose={() => setIsConsumeSpareOpen(false)}
        onSubmit={handleConsumeSparePart}
      />

      <LogVendorVisitDialog
        isOpen={isLogVendorVisitOpen}
        assets={assets}
        onClose={() => setIsLogVendorVisitOpen(false)}
        onSubmit={handleLogVendorVisit}
      />

      {selectedAsset && (
        <ProposeCondemnationDialog
          isOpen={isProposeCondemnOpen}
          asset={selectedAsset}
          onClose={() => setIsProposeCondemnOpen(false)}
          onSubmit={handleCreateCondemnation}
        />
      )}

      {selectedCondemnation && (
        <ApproveCondemnationDialog
          isOpen={isApproveCondemnOpen}
          condemnation={selectedCondemnation}
          onClose={() => setIsApproveCondemnOpen(false)}
          onSubmit={handleApproveCondemnation}
        />
      )}

      <ReportBiomedicalIncidentDialog
        isOpen={isReportIncidentOpen}
        assets={assets}
        onClose={() => setIsReportIncidentOpen(false)}
        onSubmit={handleCreateIncident}
      />

      {selectedIncident && (
        <ResolveBiomedicalIncidentDialog
          isOpen={isResolveIncidentOpen}
          incident={selectedIncident}
          onClose={() => setIsResolveIncidentOpen(false)}
          onSubmit={handleResolveIncident}
        />
      )}
    </div>
  );
};
