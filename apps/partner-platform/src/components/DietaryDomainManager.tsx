import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@docsearch/ui-kit';
import { dietaryManagementService } from '../services/dietary-management-service.js';
import type {
  DietaryOverviewMetricsDto,
  DietaryAnalyticsDto,
  DietaryKitchenDto,
  DietaryDietTypeDto,
  DietaryFoodItemDto,
  DietaryAssessmentDto,
  DietaryOrderDto,
  DietaryDietPlanDto,
  DietaryMenuTemplateDto,
  DietaryMealScheduleDto,
  DietaryProductionPlanDto,
  DietaryPreparationRecordDto,
  DietaryQualityCheckDto,
  DietaryTrayAssemblyDto,
  DietaryMealDispatchDto,
  DietarySafetyAlertDto,
  DietaryWasteRecordDto,
  DietaryCostRecordDto,
  DietaryProcurementRefDto,
  DietaryBillingRefDto,
  DietaryAuditTraceDto,
  CreateKitchenRequest,
  CreateDietTypeRequest,
  CreateFoodItemRequest,
  CreateDietAssessmentRequest,
  CreateDietOrderRequest,
  CreateDietPlanRequest,
  CreateMenuTemplateRequest,
  CreateMealScheduleRequest,
  CreateProductionPlanRequest,
  RecordMealPreparationRequest,
  RecordQualityCheckRequest,
  CreateTrayAssemblyRequest,
  DispatchMealRequest,
  RecordFoodWasteRequest,
  CreateDietaryProcurementReferenceRequest,
  CreateDietaryBillingReferenceRequest,
  CreateDietChangeRequest,
  CreateNPOOrderRequest,
  ApproveDietOrderRequest,
  ModifyDietOrderRequest,
  ConfirmMealDeliveryRequest,
  RefuseMealRequest,
  RecordMissedMealRequest,
  ResolveDietarySafetyAlertRequest,
  UpdateKitchenRequest
} from '@docsearch/api-contracts';

// Views
import { DietaryOverviewView } from './views/DietaryOverviewView.js';
import { DietaryControlCenterView } from './views/DietaryControlCenterView.js';
import { KitchenDirectoryView } from './views/KitchenDirectoryView.js';
import { KitchenDetailView } from './views/KitchenDetailView.js';
import { DietTypeDirectoryView } from './views/DietTypeDirectoryView.js';
import { FoodIngredientCatalogView } from './views/FoodIngredientCatalogView.js';
import { DietAssessmentView } from './views/DietAssessmentView.js';
import { DietOrderDirectoryView } from './views/DietOrderDirectoryView.js';
import { DietOrderDetailView } from './views/DietOrderDetailView.js';
import { DietitianWorkbenchView } from './views/DietitianWorkbenchView.js';
import { PatientDietTimelineView } from './views/PatientDietTimelineView.js';
import { DailyMealPlanningView } from './views/DailyMealPlanningView.js';
import { MenuManagementView } from './views/MenuManagementView.js';
import { KitchenProductionView } from './views/KitchenProductionView.js';
import { MealPreparationView } from './views/MealPreparationView.js';
import { TrayAssemblyView } from './views/TrayAssemblyView.js';
import { MealDispatchView } from './views/MealDispatchView.js';
import { MealDeliveryView } from './views/MealDeliveryView.js';
import { DietarySafetyView } from './views/DietarySafetyView.js';
import { DietaryWasteView } from './views/DietaryWasteView.js';
import { DietaryProcurementView } from './views/DietaryProcurementView.js';
import { DietaryCostingView } from './views/DietaryCostingView.js';
import { DietaryBillingView } from './views/DietaryBillingView.js';
import { DietaryAnalyticsView } from './views/DietaryAnalyticsView.js';
import { DietaryAuditVaultView } from './views/DietaryAuditVaultView.js';

// Dialogs
import { CreateKitchenDialog } from './dialogs/CreateKitchenDialog.js';
import { EditKitchenDialog } from './dialogs/EditKitchenDialog.js';
import { CreateDietTypeDialog } from './dialogs/CreateDietTypeDialog.js';
import { CreateFoodItemDialog } from './dialogs/CreateFoodItemDialog.js';
import { CreateDietAssessmentDialog } from './dialogs/CreateDietAssessmentDialog.js';
import { CreateDietOrderDialog } from './dialogs/CreateDietOrderDialog.js';
import { ApproveDietOrderDialog } from './dialogs/ApproveDietOrderDialog.js';
import { ModifyDietOrderDialog } from './dialogs/ModifyDietOrderDialog.js';
import { CreateDietPlanDialog } from './dialogs/CreateDietPlanDialog.js';
import { CreateMenuTemplateDialog } from './dialogs/CreateMenuTemplateDialog.js';
import { CreateMealScheduleDialog } from './dialogs/CreateMealScheduleDialog.js';
import { CreateProductionPlanDialog } from './dialogs/CreateProductionPlanDialog.js';
import { ReleaseProductionPlanDialog } from './dialogs/ReleaseProductionPlanDialog.js';
import { RecordMealPreparationDialog } from './dialogs/RecordMealPreparationDialog.js';
import { QualityCheckDialog } from './dialogs/QualityCheckDialog.js';
import { CreateTrayAssemblyDialog } from './dialogs/CreateTrayAssemblyDialog.js';
import { DispatchMealDialog } from './dialogs/DispatchMealDialog.js';
import { ConfirmMealDeliveryDialog } from './dialogs/ConfirmMealDeliveryDialog.js';
import { RefuseMealDialog } from './dialogs/RefuseMealDialog.js';
import { RecordMissedMealDialog } from './dialogs/RecordMissedMealDialog.js';
import { CreateDietChangeDialog } from './dialogs/CreateDietChangeDialog.js';
import { CreateNPOOrderDialog } from './dialogs/CreateNPOOrderDialog.js';
import { ResolveDietarySafetyAlertDialog } from './dialogs/ResolveDietarySafetyAlertDialog.js';
import { RecordFoodWasteDialog } from './dialogs/RecordFoodWasteDialog.js';
import { CreateProcurementReferenceDialog } from './dialogs/CreateProcurementReferenceDialog.js';
import { CreateBillingReferenceDialog } from './dialogs/CreateBillingReferenceDialog.js';

interface Props {
  tenantId?: string;
}

export const DietaryDomainManager: React.FC<Props> = ({ tenantId = '11111111-1111-4111-8111-111111111111' }) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'control-center'
    | 'kitchens'
    | 'diet-types'
    | 'food-items'
    | 'assessments'
    | 'orders'
    | 'dietitian-workbench'
    | 'patient-timeline'
    | 'meal-planning'
    | 'menus'
    | 'production'
    | 'preparation'
    | 'tray-assembly'
    | 'dispatch'
    | 'delivery'
    | 'safety'
    | 'waste'
    | 'procurement'
    | 'costing'
    | 'billing'
    | 'analytics'
    | 'audit-vault'
  >('overview');

  // State
  const [metrics, setMetrics] = useState<DietaryOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<DietaryAnalyticsDto | null>(null);
  const [kitchens, setKitchens] = useState<DietaryKitchenDto[]>([]);
  const [dietTypes, setDietTypes] = useState<DietaryDietTypeDto[]>([]);
  const [foodItems, setFoodItems] = useState<DietaryFoodItemDto[]>([]);
  const [assessments, setAssessments] = useState<DietaryAssessmentDto[]>([]);
  const [orders, setOrders] = useState<DietaryOrderDto[]>([]);
  const [dietPlans, setDietPlans] = useState<DietaryDietPlanDto[]>([]);
  const [menuTemplates, setMenuTemplates] = useState<DietaryMenuTemplateDto[]>([]);
  const [, setMealSchedules] = useState<DietaryMealScheduleDto[]>([]);
  const [productionPlans, setProductionPlans] = useState<DietaryProductionPlanDto[]>([]);
  const [preparationRecords, setPreparationRecords] = useState<DietaryPreparationRecordDto[]>([]);
  const [, setQualityChecks] = useState<DietaryQualityCheckDto[]>([]);
  const [trayAssemblies, setTrayAssemblies] = useState<DietaryTrayAssemblyDto[]>([]);
  const [mealDispatches, setMealDispatches] = useState<DietaryMealDispatchDto[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<DietarySafetyAlertDto[]>([]);
  const [wasteRecords, setWasteRecords] = useState<DietaryWasteRecordDto[]>([]);
  const [costRecords, setCostRecords] = useState<DietaryCostRecordDto[]>([]);
  const [procurementRefs, setProcurementRefs] = useState<DietaryProcurementRefDto[]>([]);
  const [billingRefs, setBillingRefs] = useState<DietaryBillingRefDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<DietaryAuditTraceDto[]>([]);

  // Selection
  const [selectedKitchen, setSelectedKitchen] = useState<DietaryKitchenDto | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DietaryOrderDto | null>(null);
  const [selectedProductionPlan, setSelectedProductionPlan] = useState<DietaryProductionPlanDto | null>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<DietaryMealDispatchDto | null>(null);
  const [selectedSafetyAlert, setSelectedSafetyAlert] = useState<DietarySafetyAlertDto | null>(null);
  const [selectedTrayBarcode, setSelectedTrayBarcode] = useState('');
  const [selectedBatchNumber] = useState('');

  // Dialog Visibility Flags
  const [isCreateKitchenOpen, setIsCreateKitchenOpen] = useState(false);
  const [isEditKitchenOpen, setIsEditKitchenOpen] = useState(false);
  const [isCreateDietTypeOpen, setIsCreateDietTypeOpen] = useState(false);
  const [isCreateFoodItemOpen, setIsCreateFoodItemOpen] = useState(false);
  const [isCreateAssessmentOpen, setIsCreateAssessmentOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isApproveOrderOpen, setIsApproveOrderOpen] = useState(false);
  const [isModifyOrderOpen, setIsModifyOrderOpen] = useState(false);
  const [isCreateDietPlanOpen, setIsCreateDietPlanOpen] = useState(false);
  const [isCreateMenuTemplateOpen, setIsCreateMenuTemplateOpen] = useState(false);
  const [isCreateMealScheduleOpen, setIsCreateMealScheduleOpen] = useState(false);
  const [isCreateProductionPlanOpen, setIsCreateProductionPlanOpen] = useState(false);
  const [isReleaseProductionPlanOpen, setIsReleaseProductionPlanOpen] = useState(false);
  const [isRecordPreparationOpen, setIsRecordPreparationOpen] = useState(false);
  const [isQualityCheckOpen, setIsQualityCheckOpen] = useState(false);
  const [isCreateTrayAssemblyOpen, setIsCreateTrayAssemblyOpen] = useState(false);
  const [isDispatchMealOpen, setIsDispatchMealOpen] = useState(false);
  const [isConfirmDeliveryOpen, setIsConfirmDeliveryOpen] = useState(false);
  const [isRefuseMealOpen, setIsRefuseMealOpen] = useState(false);
  const [isMissedMealOpen, setIsMissedMealOpen] = useState(false);
  const [isDietChangeOpen, setIsDietChangeOpen] = useState(false);
  const [isNPOOrderOpen, setIsNPOOrderOpen] = useState(false);
  const [isResolveAlertOpen, setIsResolveAlertOpen] = useState(false);
  const [isRecordWasteOpen, setIsRecordWasteOpen] = useState(false);
  const [isProcurementRefOpen, setIsProcurementRefOpen] = useState(false);
  const [isBillingRefOpen, setIsBillingRefOpen] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const [
        m,
        a,
        k,
        dt,
        fi,
        as,
        ord,
        dp,
        mt,
        ms,
        pp,
        pr,
        qc,
        ta,
        md,
        sa,
        wr,
        cr,
        prc,
        br,
        at
      ] = await Promise.all([
        dietaryManagementService.getOverviewMetrics(tenantId),
        dietaryManagementService.getAnalytics(tenantId),
        dietaryManagementService.getKitchens(tenantId),
        dietaryManagementService.getDietTypes(tenantId),
        dietaryManagementService.getFoodItems(tenantId),
        dietaryManagementService.getAssessments(tenantId),
        dietaryManagementService.getOrders(tenantId),
        dietaryManagementService.getDietPlans(tenantId),
        dietaryManagementService.getMenuTemplates(tenantId),
        dietaryManagementService.getMealSchedules(tenantId),
        dietaryManagementService.getProductionPlans(tenantId),
        dietaryManagementService.getPreparationRecords(tenantId),
        dietaryManagementService.getQualityChecks(tenantId),
        dietaryManagementService.getTrayAssemblies(tenantId),
        dietaryManagementService.getMealDispatches(tenantId),
        dietaryManagementService.getSafetyAlerts(tenantId),
        dietaryManagementService.getWasteRecords(tenantId),
        dietaryManagementService.getCostRecords(tenantId),
        dietaryManagementService.getProcurementRefs(tenantId),
        dietaryManagementService.getBillingRefs(tenantId),
        dietaryManagementService.getAuditTraces(tenantId)
      ]);

      setMetrics(m);
      setAnalytics(a);
      setKitchens(k);
      setDietTypes(dt);
      setFoodItems(fi);
      setAssessments(as);
      setOrders(ord);
      setDietPlans(dp);
      setMenuTemplates(mt);
      setMealSchedules(ms);
      setProductionPlans(pp);
      setPreparationRecords(pr);
      setQualityChecks(qc);
      setTrayAssemblies(ta);
      setMealDispatches(md);
      setSafetyAlerts(sa);
      setWasteRecords(wr);
      setCostRecords(cr);
      setProcurementRefs(prc);
      setBillingRefs(br);
      setAuditTraces(at);
    } catch (err) {
      console.error('Failed to load dietary data:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="space-y-6">
      {/* Module Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Hospital Dietary & Kitchen Management</h1>
            
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Clinical nutrition, medical diet orders, batch kitchen production, tray assembly, and bedside meal delivery</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Badge variant="primary">{metrics?.totalActiveDietaryPatients || 0} Inpatients on Diet</Badge>
          <Badge variant="primary">{metrics?.mealsDueToday || 0} Meals Today</Badge>
          {(metrics?.activeSafetyAlerts || 0) > 0 && (
            <Badge variant="danger">{metrics?.activeSafetyAlerts} Safety Intercepts</Badge>
          )}
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto pb-px text-xs font-semibold text-gray-600">
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => { setActiveTab('overview'); setSelectedKitchen(null); setSelectedOrder(null); }}>Overview</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'control-center' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => { setActiveTab('control-center'); setSelectedKitchen(null); setSelectedOrder(null); }}>Control Center</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'orders' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}>Diet Orders ({orders.length})</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'dietitian-workbench' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('dietitian-workbench')}>Dietitian Workbench</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'assessments' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('assessments')}>Assessments</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'kitchens' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => { setActiveTab('kitchens'); setSelectedKitchen(null); }}>Kitchens ({kitchens.length})</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'production' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('production')}>Batch Production</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'tray-assembly' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('tray-assembly')}>Tray Assembly</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'dispatch' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('dispatch')}>Meal Dispatch & Delivery</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'safety' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('safety')}>Safety & Allergies</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'waste' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('waste')}>Food Waste</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'costing' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('costing')}>Costing & Billing</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
        <button className={`px-3.5 py-2 rounded-t-lg transition-colors ${activeTab === 'audit-vault' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('audit-vault')}>Audit Vault</button>
      </div>

      {/* Main View Router */}
      <div className="pt-2">
        {activeTab === 'overview' && metrics && (
          <DietaryOverviewView
            metrics={metrics}
            orders={orders}
            safetyAlerts={safetyAlerts}
            kitchens={kitchens}
            onOpenNewOrder={() => setIsCreateOrderOpen(true)}
            onOpenSafetyAlerts={() => setActiveTab('safety')}
            onOpenKitchenControl={() => setActiveTab('control-center')}
          />
        )}

        {activeTab === 'control-center' && (
          <DietaryControlCenterView
            safetyAlerts={safetyAlerts}
            orders={orders}
            productionPlans={productionPlans}
            onResolveAlert={(al) => {
              setSelectedSafetyAlert(al);
              setIsResolveAlertOpen(true);
            }}
            onReleaseProduction={(p) => {
              setSelectedProductionPlan(p);
              setIsReleaseProductionPlanOpen(true);
            }}
          />
        )}

        {activeTab === 'kitchens' && (
          selectedKitchen ? (
            <KitchenDetailView
              kitchen={selectedKitchen}
              productionPlans={productionPlans}
              onBack={() => setSelectedKitchen(null)}
              onEdit={() => setIsEditKitchenOpen(true)}
            />
          ) : (
            <KitchenDirectoryView
              kitchens={kitchens}
              onOpenKitchen={(k) => setSelectedKitchen(k)}
              onEditKitchen={(k) => {
                setSelectedKitchen(k);
                setIsEditKitchenOpen(true);
              }}
              onNewKitchen={() => setIsCreateKitchenOpen(true)}
            />
          )
        )}

        {activeTab === 'diet-types' && (
          <DietTypeDirectoryView
            dietTypes={dietTypes}
            onNewDietType={() => setIsCreateDietTypeOpen(true)}
          />
        )}

        {activeTab === 'food-items' && (
          <FoodIngredientCatalogView
            foodItems={foodItems}
            onNewFoodItem={() => setIsCreateFoodItemOpen(true)}
          />
        )}

        {activeTab === 'assessments' && (
          <DietAssessmentView
            assessments={assessments}
            onNewAssessment={() => setIsCreateAssessmentOpen(true)}
          />
        )}

        {activeTab === 'orders' && (
          selectedOrder ? (
            <DietOrderDetailView
              order={selectedOrder}
              dietPlan={dietPlans.find((p) => p.orderId === selectedOrder.id)}
              onBack={() => setSelectedOrder(null)}
              onApprove={() => setIsApproveOrderOpen(true)}
              onModify={() => setIsModifyOrderOpen(true)}
              onNPO={() => setIsNPOOrderOpen(true)}
              onCreatePlan={() => setIsCreateDietPlanOpen(true)}
            />
          ) : (
            <DietOrderDirectoryView
              orders={orders}
              onOpenOrder={(o) => setSelectedOrder(o)}
              onNewOrder={() => setIsCreateOrderOpen(true)}
              onApproveOrder={(o) => {
                setSelectedOrder(o);
                setIsApproveOrderOpen(true);
              }}
              onModifyOrder={(o) => {
                setSelectedOrder(o);
                setIsModifyOrderOpen(true);
              }}
            />
          )
        )}

        {activeTab === 'dietitian-workbench' && (
          <DietitianWorkbenchView
            assessments={assessments}
            orders={orders}
            safetyAlerts={safetyAlerts}
            onApproveOrder={(o) => {
              setSelectedOrder(o);
              setIsApproveOrderOpen(true);
            }}
            onResolveAlert={(a) => {
              setSelectedSafetyAlert(a);
              setIsResolveAlertOpen(true);
            }}
            onConductAssessment={() => setIsCreateAssessmentOpen(true)}
          />
        )}

        {activeTab === 'patient-timeline' && (
          <PatientDietTimelineView
            orders={orders}
            dispatches={mealDispatches}
            safetyAlerts={safetyAlerts}
          />
        )}

        {activeTab === 'meal-planning' && (
          <DailyMealPlanningView
            dietPlans={dietPlans}
            orders={orders}
            onNewPlan={() => setIsCreateDietPlanOpen(true)}
          />
        )}

        {activeTab === 'menus' && (
          <MenuManagementView
            templates={menuTemplates}
            onNewTemplate={() => setIsCreateMenuTemplateOpen(true)}
          />
        )}

        {activeTab === 'production' && (
          <KitchenProductionView
            plans={productionPlans}
            onNewProductionPlan={() => setIsCreateProductionPlanOpen(true)}
            onReleasePlan={(p) => {
              setSelectedProductionPlan(p);
              setIsReleaseProductionPlanOpen(true);
            }}
          />
        )}

        {activeTab === 'preparation' && (
          <MealPreparationView
            prepRecords={preparationRecords}
            productionPlans={productionPlans}
            onLogPreparation={() => setIsRecordPreparationOpen(true)}
          />
        )}

        {activeTab === 'tray-assembly' && (
          <TrayAssemblyView
            trayAssemblies={trayAssemblies}
            onNewTrayAssembly={() => setIsCreateTrayAssemblyOpen(true)}
            onDispatchTray={(t) => {
              setSelectedTrayBarcode(t.trayBarcode);
              setIsDispatchMealOpen(true);
            }}
          />
        )}

        {activeTab === 'dispatch' && (
          <MealDispatchView
            dispatches={mealDispatches}
            onConfirmDelivery={(d) => {
              setSelectedDispatch(d);
              setIsConfirmDeliveryOpen(true);
            }}
            onRefuseMeal={(d) => {
              setSelectedDispatch(d);
              setIsRefuseMealOpen(true);
            }}
            onMissedMeal={(d) => {
              setSelectedDispatch(d);
              setIsMissedMealOpen(true);
            }}
          />
        )}

        {activeTab === 'delivery' && (
          <MealDeliveryView dispatches={mealDispatches} />
        )}

        {activeTab === 'safety' && (
          <DietarySafetyView
            safetyAlerts={safetyAlerts}
            onResolveAlert={(a) => {
              setSelectedSafetyAlert(a);
              setIsResolveAlertOpen(true);
            }}
          />
        )}

        {activeTab === 'waste' && (
          <DietaryWasteView
            wasteRecords={wasteRecords}
            onLogWaste={() => setIsRecordWasteOpen(true)}
          />
        )}

        {activeTab === 'procurement' && (
          <DietaryProcurementView
            procurementRefs={procurementRefs}
            onRequestProcurement={() => setIsProcurementRefOpen(true)}
          />
        )}

        {activeTab === 'costing' && (
          <div className="space-y-6">
            <DietaryCostingView costRecords={costRecords} />
            <DietaryBillingView
              billingRefs={billingRefs}
              onPostCharge={() => setIsBillingRefOpen(true)}
            />
          </div>
        )}

        {activeTab === 'billing' && (
          <DietaryBillingView
            billingRefs={billingRefs}
            onPostCharge={() => setIsBillingRefOpen(true)}
          />
        )}

        {activeTab === 'analytics' && analytics && (
          <DietaryAnalyticsView analytics={analytics} />
        )}

        {activeTab === 'audit-vault' && (
          <DietaryAuditVaultView auditTraces={auditTraces} />
        )}
      </div>

      {/* Action Dialogs */}
      {isCreateKitchenOpen && (
        <CreateKitchenDialog
          isOpen={isCreateKitchenOpen}
          onClose={() => setIsCreateKitchenOpen(false)}
          onSubmit={async (data: CreateKitchenRequest) => {
            await dietaryManagementService.createKitchen(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isEditKitchenOpen && selectedKitchen && (
        <EditKitchenDialog
          isOpen={isEditKitchenOpen}
          kitchen={selectedKitchen}
          onClose={() => setIsEditKitchenOpen(false)}
          onSubmit={async (id: string, data: UpdateKitchenRequest) => {
            await dietaryManagementService.updateKitchen(tenantId, id, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateDietTypeOpen && (
        <CreateDietTypeDialog
          isOpen={isCreateDietTypeOpen}
          onClose={() => setIsCreateDietTypeOpen(false)}
          onSubmit={async (data: CreateDietTypeRequest) => {
            await dietaryManagementService.createDietType(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateFoodItemOpen && (
        <CreateFoodItemDialog
          isOpen={isCreateFoodItemOpen}
          onClose={() => setIsCreateFoodItemOpen(false)}
          onSubmit={async (data: CreateFoodItemRequest) => {
            await dietaryManagementService.createFoodItem(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateAssessmentOpen && (
        <CreateDietAssessmentDialog
          isOpen={isCreateAssessmentOpen}
          onClose={() => setIsCreateAssessmentOpen(false)}
          onSubmit={async (data: CreateDietAssessmentRequest) => {
            await dietaryManagementService.createAssessment(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateOrderOpen && (
        <CreateDietOrderDialog
          isOpen={isCreateOrderOpen}
          dietTypes={dietTypes}
          onClose={() => setIsCreateOrderOpen(false)}
          onSubmit={async (data: CreateDietOrderRequest) => {
            await dietaryManagementService.createOrder(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isApproveOrderOpen && selectedOrder && (
        <ApproveDietOrderDialog
          isOpen={isApproveOrderOpen}
          order={selectedOrder}
          onClose={() => setIsApproveOrderOpen(false)}
          onSubmit={async (orderId: string, data: ApproveDietOrderRequest) => {
            await dietaryManagementService.approveOrder(tenantId, orderId, data);
            await loadAllData();
          }}
        />
      )}

      {isModifyOrderOpen && selectedOrder && (
        <ModifyDietOrderDialog
          isOpen={isModifyOrderOpen}
          order={selectedOrder}
          dietTypes={dietTypes}
          onClose={() => setIsModifyOrderOpen(false)}
          onSubmit={async (orderId: string, data: ModifyDietOrderRequest) => {
            await dietaryManagementService.modifyOrder(tenantId, orderId, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateDietPlanOpen && selectedOrder && (
        <CreateDietPlanDialog
          isOpen={isCreateDietPlanOpen}
          order={selectedOrder}
          onClose={() => setIsCreateDietPlanOpen(false)}
          onSubmit={async (data: CreateDietPlanRequest) => {
            await dietaryManagementService.createDietPlan(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateMenuTemplateOpen && (
        <CreateMenuTemplateDialog
          isOpen={isCreateMenuTemplateOpen}
          kitchens={kitchens}
          onClose={() => setIsCreateMenuTemplateOpen(false)}
          onSubmit={async (data: CreateMenuTemplateRequest) => {
            await dietaryManagementService.createMenuTemplate(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateMealScheduleOpen && (
        <CreateMealScheduleDialog
          isOpen={isCreateMealScheduleOpen}
          orders={orders}
          onClose={() => setIsCreateMealScheduleOpen(false)}
          onSubmit={async (data: CreateMealScheduleRequest) => {
            await dietaryManagementService.createMealSchedule(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateProductionPlanOpen && (
        <CreateProductionPlanDialog
          isOpen={isCreateProductionPlanOpen}
          kitchens={kitchens}
          onClose={() => setIsCreateProductionPlanOpen(false)}
          onSubmit={async (data: CreateProductionPlanRequest) => {
            await dietaryManagementService.createProductionPlan(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isReleaseProductionPlanOpen && selectedProductionPlan && (
        <ReleaseProductionPlanDialog
          isOpen={isReleaseProductionPlanOpen}
          plan={selectedProductionPlan}
          onClose={() => setIsReleaseProductionPlanOpen(false)}
          onSubmit={async (planId: string, data) => {
            await dietaryManagementService.releaseProductionPlan(tenantId, planId, data);
            await loadAllData();
          }}
        />
      )}

      {isRecordPreparationOpen && (productionPlans[0] || selectedProductionPlan) && (
        <RecordMealPreparationDialog
          isOpen={isRecordPreparationOpen}
          productionPlan={(selectedProductionPlan || productionPlans[0]) as DietaryProductionPlanDto}
          onClose={() => setIsRecordPreparationOpen(false)}
          onSubmit={async (data: RecordMealPreparationRequest) => {
            await dietaryManagementService.recordMealPreparation(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isQualityCheckOpen && (
        <QualityCheckDialog
          isOpen={isQualityCheckOpen}
          batchNumber={selectedBatchNumber || 'BATCH-LUNCH-01'}
          kitchenName={kitchens[0]?.kitchenName || 'Central Kitchen'}
          onClose={() => setIsQualityCheckOpen(false)}
          onSubmit={async (data: RecordQualityCheckRequest) => {
            await dietaryManagementService.recordQualityCheck(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isCreateTrayAssemblyOpen && (
        <CreateTrayAssemblyDialog
          isOpen={isCreateTrayAssemblyOpen}
          orders={orders}
          onClose={() => setIsCreateTrayAssemblyOpen(false)}
          onSubmit={async (data: CreateTrayAssemblyRequest) => {
            await dietaryManagementService.createTrayAssembly(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isDispatchMealOpen && (
        <DispatchMealDialog
          isOpen={isDispatchMealOpen}
          trayBarcode={selectedTrayBarcode || 'TRAY-3W-304A'}
          patientName={orders[0]?.patientName || 'Inpatient'}
          wardName={orders[0]?.wardName || 'Ward 3W'}
          onClose={() => setIsDispatchMealOpen(false)}
          onSubmit={async (data: DispatchMealRequest) => {
            await dietaryManagementService.dispatchMeal(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isConfirmDeliveryOpen && selectedDispatch && (
        <ConfirmMealDeliveryDialog
          isOpen={isConfirmDeliveryOpen}
          dispatch={selectedDispatch}
          onClose={() => setIsConfirmDeliveryOpen(false)}
          onSubmit={async (dispatchId: string, data: ConfirmMealDeliveryRequest) => {
            await dietaryManagementService.confirmMealDelivery(tenantId, dispatchId, data);
            await loadAllData();
          }}
        />
      )}

      {isRefuseMealOpen && selectedDispatch && (
        <RefuseMealDialog
          isOpen={isRefuseMealOpen}
          dispatch={selectedDispatch}
          onClose={() => setIsRefuseMealOpen(false)}
          onSubmit={async (dispatchId: string, data: RefuseMealRequest) => {
            await dietaryManagementService.refuseMeal(tenantId, dispatchId, data);
            await loadAllData();
          }}
        />
      )}

      {isMissedMealOpen && selectedDispatch && (
        <RecordMissedMealDialog
          isOpen={isMissedMealOpen}
          dispatch={selectedDispatch}
          onClose={() => setIsMissedMealOpen(false)}
          onSubmit={async (dispatchId: string, data: RecordMissedMealRequest) => {
            await dietaryManagementService.recordMissedMeal(tenantId, dispatchId, data);
            await loadAllData();
          }}
        />
      )}

      {isDietChangeOpen && selectedOrder && (
        <CreateDietChangeDialog
          isOpen={isDietChangeOpen}
          order={selectedOrder}
          dietTypes={dietTypes}
          onClose={() => setIsDietChangeOpen(false)}
          onSubmit={async (data: CreateDietChangeRequest) => {
            await dietaryManagementService.createDietChange(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isNPOOrderOpen && selectedOrder && (
        <CreateNPOOrderDialog
          isOpen={isNPOOrderOpen}
          order={selectedOrder}
          onClose={() => setIsNPOOrderOpen(false)}
          onSubmit={async (data: CreateNPOOrderRequest) => {
            await dietaryManagementService.createNPOOrder(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isResolveAlertOpen && selectedSafetyAlert && (
        <ResolveDietarySafetyAlertDialog
          isOpen={isResolveAlertOpen}
          alert={selectedSafetyAlert}
          onClose={() => setIsResolveAlertOpen(false)}
          onSubmit={async (alertId: string, data: ResolveDietarySafetyAlertRequest) => {
            await dietaryManagementService.resolveSafetyAlert(tenantId, alertId, data);
            await loadAllData();
          }}
        />
      )}

      {isRecordWasteOpen && (
        <RecordFoodWasteDialog
          isOpen={isRecordWasteOpen}
          kitchens={kitchens}
          onClose={() => setIsRecordWasteOpen(false)}
          onSubmit={async (data: RecordFoodWasteRequest) => {
            await dietaryManagementService.recordFoodWaste(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isProcurementRefOpen && (
        <CreateProcurementReferenceDialog
          isOpen={isProcurementRefOpen}
          onClose={() => setIsProcurementRefOpen(false)}
          onSubmit={async (data: CreateDietaryProcurementReferenceRequest) => {
            await dietaryManagementService.createProcurementRef(tenantId, data);
            await loadAllData();
          }}
        />
      )}

      {isBillingRefOpen && (
        <CreateBillingReferenceDialog
          isOpen={isBillingRefOpen}
          onClose={() => setIsBillingRefOpen(false)}
          onSubmit={async (data: CreateDietaryBillingReferenceRequest) => {
            await dietaryManagementService.createBillingRef(tenantId, data);
            await loadAllData();
          }}
        />
      )}
    </div>
  );
};
