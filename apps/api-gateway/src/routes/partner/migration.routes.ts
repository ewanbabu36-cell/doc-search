import type { FastifyPluginAsync } from 'fastify';
import { legacyDataMigrationService, type LegacySourceSystem } from '../../services/partner/LegacyDataMigrationService.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { AppError } from '@docsearch/shared-core';

export const migrationRoutes: FastifyPluginAsync = async (app) => {
  // Detect file format & column signatures
  app.post(
    '/api/v1/partner/migration/detect-format',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body || {}) as { headers?: string[] };
      if (!body.headers || !Array.isArray(body.headers)) {
        throw new AppError({ message: 'Headers array is required for format detection', statusCode: 400 });
      }

      const detectedSystem = legacyDataMigrationService.detectLegacySystem(body.headers);
      const mappings = legacyDataMigrationService.getDefaultFieldMappings(detectedSystem, body.headers);

      return reply.send({
        success: true,
        data: {
          detectedSystem,
          mappings
        }
      });
    }
  );

  // Dry-run preview & validation
  app.post(
    '/api/v1/partner/migration/dry-run',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = (request.body || {}) as { csvContent?: string; forcedSystem?: LegacySourceSystem };
      if (!body.csvContent || typeof body.csvContent !== 'string') {
        throw new AppError({ message: 'csvContent string is required', statusCode: 400 });
      }

      const dryRunResult = legacyDataMigrationService.simulateDryRun(body.csvContent, body.forcedSystem);
      return reply.send({
        success: true,
        data: dryRunResult
      });
    }
  );

  // Execute atomic migration
  app.post(
    '/api/v1/partner/migration/execute',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId, userId } = request.session;
      const body = (request.body || {}) as { csvContent?: string; system?: LegacySourceSystem };

      if (!body.csvContent || !body.system) {
        throw new AppError({ message: 'csvContent and system parameters are required', statusCode: 400 });
      }

      const result = await legacyDataMigrationService.executeMigration(
        tenantId,
        body.csvContent,
        body.system,
        userId || 'admin@docsearch.health'
      );

      return reply.status(201).send({
        success: true,
        data: result
      });
    }
  );

  // Get tenant migration audit history
  app.get(
    '/api/v1/partner/migration/history',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { tenantId } = request.session;
      const history = legacyDataMigrationService.getMigrationHistory(tenantId);
      return reply.send({
        success: true,
        data: history
      });
    }
  );

  // Download sample CSV templates for legacy systems
  app.get(
    '/api/v1/partner/migration/sample-template/:system',
    async (request, reply) => {
      const { system } = request.params as { system: string };
      const normalizedSystem = system.toUpperCase();

      let templateCsv = '';
      let filename = 'migration-template.csv';

      if (normalizedSystem.includes('PRACTO')) {
        filename = 'practo-ray-patient-records-template.csv';
        templateCsv = [
          'Full Name,Mobile Number,Gender,Date of Birth,Blood Group,Email,Address,UHID MRN',
          'Ramesh Chandra Sharma,9876543210,Male,1985-04-12,B+,ramesh.sharma@example.com,"Flat 402, Lotus Towers, Andheri West, Mumbai",PR-99201',
          'Sunita Devi,9123456789,Female,1992-08-25,O+,sunita.devi@example.com,"Sector 14, Gurgaon, Haryana",PR-99202',
          'Amit Patel,9988776655,Male,1978-11-03,A+,amit.patel@example.com,"Navrangpura, Ahmedabad, Gujarat",PR-99203'
        ].join('\n');
      } else if (normalizedSystem.includes('MARG')) {
        filename = 'marg-erp-pharmacy-stock-template.csv';
        templateCsv = [
          'Item Name,Generic Salt Composition,Batch No,Expiry Date,MRP INR,Purchase Rate INR,Stock Qty,HSN Code',
          'Augmentin 625 Duo,Amoxicillin 500mg + Clavulanic Acid 125mg,AG2409,2027-08-31,210.00,145.50,150,300420',
          'Pan 40 Tablet,Pantoprazole Sodium 40mg,PN8821,2026-12-31,162.00,98.20,240,300490',
          'Azithral 500,Azithromycin 500mg,AZ7734,2027-05-31,135.00,82.00,80,300420',
          'Jan Aushadhi Paracetamol 650,Paracetamol 650mg,PM6501,2028-02-28,22.00,12.00,500,300490'
        ].join('\n');
      } else if (normalizedSystem.includes('LIVEHEALTH') || normalizedSystem.includes('CRELIO')) {
        filename = 'livehealth-pathology-test-master-template.csv';
        templateCsv = [
          'Investigation Name,Test Code,Department,Price INR,Specimen Type,Reference Interval,Units',
          'Complete Blood Count (CBC),HEM-CBC,HEMATOLOGY,350.00,EDTA Whole Blood,Adult Male: 13.0-17.0,g/dL',
          'Fast Blood Sugar (FBS),BIO-FBS,BIOCHEMISTRY,120.00,Fluoride Plasma,70.0 - 100.0,mg/dL',
          'Lipid Profile Comprehensive,BIO-LIPID,BIOCHEMISTRY,650.00,Serum,Cholesterol < 200,mg/dL',
          'Thyroid Stimulating Hormone (TSH),IMM-TSH,IMMUNOLOGY,280.00,Serum,0.4 - 4.2,uIU/mL'
        ].join('\n');
      } else {
        filename = 'vyapar-tally-accounts-template.csv';
        templateCsv = [
          'Party Name,Mobile Number,Opening Balance INR,GSTIN,City,Credit Limit INR',
          'Aarav Healthcare Clinic,9811223344,45000.00,27ABCDE1234F1Z5,Mumbai,100000',
          'Lifecare Chemist Store,9822334455,12500.00,07FGHIJ5678K1Z2,Delhi,50000'
        ].join('\n');
      }

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(templateCsv);
    }
  );
};
