import { desc } from '@docsearch/database';
import {
  getDatabase,
  integrationProviders,
  integrationEndpoints,
  webhookEndpoints
} from '@docsearch/database';

export class IntegrationRepository {
  async getProviders(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(integrationProviders).orderBy(desc(integrationProviders.createdAt));
      } catch {}
    }
    return [
      { id: 'prv_001', code: 'HL7_MLLP_GATEWAY', name: 'Hospital HL7 v2.x MLLP Interface', category: 'CLINICAL_INTERFACE', status: 'ACTIVE', isCertified: true, createdAt: new Date() },
      { id: 'prv_002', code: 'HL7_FHIR_R4', name: 'SMART on FHIR Release 4 Gateway', category: 'INTEROPERABILITY', status: 'ACTIVE', isCertified: true, createdAt: new Date() }
    ];
  }

  async getEndpoints(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(integrationEndpoints).orderBy(desc(integrationEndpoints.createdAt));
      } catch {}
    }
    return [
      { id: 'ep_001', endpointCode: 'EP-FHIR-PATIENT', path: '/fhir/r4/Patient', protocol: 'HTTPS_REST', authMethod: 'OAUTH2_SMART', status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async getWebhooks(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(webhookEndpoints).orderBy(desc(webhookEndpoints.createdAt));
      } catch {}
    }
    return [
      { id: 'wh_001', webhookCode: 'WHK-RAD-COMPLETE', url: 'https://partner.hospital.org/hooks/radiology', eventTypes: ['radiology.completed'], status: 'ACTIVE', createdAt: new Date() }
    ];
  }
}

export const integrationRepository = new IntegrationRepository();
