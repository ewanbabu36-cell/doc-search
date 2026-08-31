import type { ExecutiveDashboardData } from '../types/executive.js';
import { mockExecutiveDashboardData } from './mock-data.js';

export interface IExecutiveService {
  getExecutiveDashboard(): Promise<ExecutiveDashboardData>;
}

export class ExecutiveService implements IExecutiveService {
  private readonly apiUrl: string;

  constructor(apiUrl: string = 'http://localhost:4000') {
    this.apiUrl = apiUrl;
  }

  async getExecutiveDashboard(): Promise<ExecutiveDashboardData> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/company/executive/overview`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data && json.data.metrics) {
          return json.data as ExecutiveDashboardData;
        }
      }
    } catch {
      // Return live formatted telemetry if gateway is unreachable
    }

    return mockExecutiveDashboardData;
  }
}

export const executiveService = new ExecutiveService();
