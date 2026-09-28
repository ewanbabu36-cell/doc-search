import { operationsRepository, type DailyOperationsData } from '../../repositories/company/OperationsRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { getDatabase } from '@docsearch/database';

export class OperationsService {
  async getDailyOperations(_session: SessionContext): Promise<DailyOperationsData> {
    return operationsRepository.getDailyOperations(getDatabase());
  }

  async acknowledgeEmergency(id: string, _session: SessionContext): Promise<{ acknowledged: boolean; id: string }> {
    return operationsRepository.acknowledgeEmergency(id, getDatabase());
  }

  async verifyDoctor(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    _session: SessionContext
  ): Promise<{ success: boolean; id: string; status: string }> {
    return operationsRepository.verifyDoctor(id, status, getDatabase());
  }

  async processPayouts(_session: SessionContext): Promise<{ success: boolean; message: string }> {
    return operationsRepository.processPayouts(getDatabase());
  }
}

export const operationsService = new OperationsService();
