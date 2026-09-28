import type { ExecutiveDashboardData } from '../types/executive.js';
import { mockExecutiveDashboardData } from './mock-data.js';
import { apiCall, isMockFallbackAllowed } from './api-client.js';

export interface DailyOperationsData {
  dataSource: 'live';
  calculatedAt: string;
  metrics: {
    totalPartners: number;
    activePartners: number;
    pendingDoctorsCount: number;
    grossDailyBilling: number;
    docSearchTake: number;
    hospitalNetPayouts: number;
    unresolvedEscalationsCount: number;
    appointmentsToday: number;
    appointmentsCompleted: number;
    appointmentsInConsultation: number;
    appointmentsWaiting: number;
    totalBedsCount: number;
    occupiedBedsCount: number;
    vacantIcuBedsCount: number;
    ventilatorsReadyCount: number;
    rxOrdersToday: number;
    pathologyTestsToday: number;
    radiologyOrdersToday: number;
  };
  doctors: Array<{
    id: string;
    name: string;
    specialty: string;
    hospital: string;
    nmc: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    time: string;
    qualification?: string | undefined;
  }>;
  settlementBatches: Array<{
    id: string;
    legalName: string;
    domain: string;
    planId: string;
    batchAmount: number;
    status: 'Pending' | 'Disbursed';
  }>;
  escalations: Array<{
    id: string;
    hospital: string;
    issue: string;
    priority: 'P1 CRITICAL' | 'P2 HIGH' | 'P3 ROUTINE';
    status: 'UNRESOLVED' | 'ACKNOWLEDGED';
    time: string;
    patientName?: string | undefined;
    patientMrn?: string | undefined;
    zoneName?: string | undefined;
    bedNumber?: string | undefined;
  }>;
  specialtyQueues: Array<{
    specialty: string;
    activeDoctors: number;
    currentToken: string;
    avgWait: string;
  }>;
  bedZones: Array<{
    zone: string;
    beds: string;
    icu: string;
    status: 'OPTIMAL' | 'SURGE ALERT' | 'MAINTENANCE';
    color: string;
    totalBeds: number;
    occupiedBeds: number;
  }>;
  diagnosticOrders: Array<{
    id: string;
    patient: string;
    test: string;
    lab: string;
    status: string;
    orderedAt: string;
  }>;
}

export interface IExecutiveService {
  getExecutiveDashboard(): Promise<ExecutiveDashboardData>;
  getDailyOperations(): Promise<DailyOperationsData>;
  acknowledgeEmergency(id: string): Promise<{ acknowledged: boolean; id: string }>;
  verifyDoctor(id: string, status: 'APPROVED' | 'REJECTED'): Promise<{ success: boolean; id: string; status: string }>;
  processPayouts(): Promise<{ success: boolean; message: string }>;
}

export class ExecutiveService implements IExecutiveService {
  async getExecutiveDashboard(): Promise<ExecutiveDashboardData> {
    try {
      const data = await apiCall<ExecutiveDashboardData>('/api/v1/company/executive/overview');
      if (data && data.metrics) {
        return data;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

    return mockExecutiveDashboardData;
  }

  async getDailyOperations(): Promise<DailyOperationsData> {
    return apiCall<DailyOperationsData>('/api/v1/company/executive/operations');
  }

  async acknowledgeEmergency(id: string): Promise<{ acknowledged: boolean; id: string }> {
    return apiCall<{ acknowledged: boolean; id: string }>(
      '/api/v1/company/executive/operations/acknowledge-emergency',
      {
        method: 'POST',
        body: JSON.stringify({ id })
      }
    );
  }

  async verifyDoctor(
    id: string,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<{ success: boolean; id: string; status: string }> {
    return apiCall<{ success: boolean; id: string; status: string }>(
      '/api/v1/company/executive/operations/verify-doctor',
      {
        method: 'POST',
        body: JSON.stringify({ id, status })
      }
    );
  }

  async processPayouts(): Promise<{ success: boolean; message: string }> {
    return apiCall<{ success: boolean; message: string }>(
      '/api/v1/company/executive/operations/process-payouts',
      {
        method: 'POST'
      }
    );
  }
}

export const executiveService = new ExecutiveService();
