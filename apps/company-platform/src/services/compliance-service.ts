import type {
  ComplianceFrameworkDto,
  ComplianceControlDto,
  ComplianceEvidenceDto,
  ComplianceControlMappingDto,
  DataClassificationDto,
  DataRetentionPolicyDto,
  DataRetentionRuleDto,
  BAARecordDto,
  GovernanceExceptionDto,
  ComplianceVerificationDto,
  ComplianceReportDto,
  ComplianceOverviewDto,
  CreateComplianceFrameworkRequest,
  CreateComplianceControlRequest,
  CreateComplianceEvidenceRequest,
  MapEvidenceToControlRequest,
  CreateRetentionPolicyRequest,
  CreateBAARecordRequest,
  CreateGovernanceExceptionRequest,
  ReviewGovernanceExceptionRequest,
  VerifyComplianceControlRequest,
  GenerateComplianceReportRequest
} from '@docsearch/api-contracts';
import {
  mockComplianceOverview,
  mockComplianceFrameworks,
  mockComplianceControls,
  mockComplianceEvidence,
  mockComplianceControlMappings,
  mockDataClassifications,
  mockDataRetentionPolicies,
  mockDataRetentionRules,
  mockBAARecords,
  mockGovernanceExceptions,
  mockComplianceVerifications,
  mockComplianceReports
} from './mock-compliance-data.js';

export interface IComplianceService {
  getComplianceOverview(): Promise<ComplianceOverviewDto>;
  getFrameworks(): Promise<ComplianceFrameworkDto[]>;
  getFrameworkById(frameworkId: string): Promise<ComplianceFrameworkDto | null>;
  getControls(): Promise<ComplianceControlDto[]>;
  getControlsByFramework(frameworkId: string): Promise<ComplianceControlDto[]>;
  getEvidence(): Promise<ComplianceEvidenceDto[]>;
  getEvidenceById(evidenceId: string): Promise<ComplianceEvidenceDto | null>;
  mapEvidenceToControl(req: MapEvidenceToControlRequest): Promise<ComplianceControlMappingDto>;
  getControlMappings(): Promise<ComplianceControlMappingDto[]>;
  getDataClassifications(): Promise<DataClassificationDto[]>;
  getRetentionPolicies(): Promise<DataRetentionPolicyDto[]>;
  getRetentionRules(): Promise<DataRetentionRuleDto[]>;
  getBAARecords(): Promise<BAARecordDto[]>;
  getGovernanceExceptions(): Promise<GovernanceExceptionDto[]>;
  createGovernanceException(req: CreateGovernanceExceptionRequest): Promise<GovernanceExceptionDto>;
  reviewGovernanceException(req: ReviewGovernanceExceptionRequest): Promise<GovernanceExceptionDto>;
  getComplianceVerifications(): Promise<ComplianceVerificationDto[]>;
  verifyControl(req: VerifyComplianceControlRequest): Promise<ComplianceVerificationDto>;
  getComplianceReports(): Promise<ComplianceReportDto[]>;
  generateComplianceReport(req: GenerateComplianceReportRequest): Promise<ComplianceReportDto>;
  createFramework(req: CreateComplianceFrameworkRequest): Promise<ComplianceFrameworkDto>;
  createControl(req: CreateComplianceControlRequest): Promise<ComplianceControlDto>;
  createEvidence(req: CreateComplianceEvidenceRequest): Promise<ComplianceEvidenceDto>;
  createRetentionPolicy(req: CreateRetentionPolicyRequest): Promise<DataRetentionPolicyDto>;
  createBAARecord(req: CreateBAARecordRequest): Promise<BAARecordDto>;
}

export class ComplianceService implements IComplianceService {
  private frameworks: ComplianceFrameworkDto[] = [...mockComplianceFrameworks];
  private controls: ComplianceControlDto[] = [...mockComplianceControls];
  private evidence: ComplianceEvidenceDto[] = [...mockComplianceEvidence];
  private mappings: ComplianceControlMappingDto[] = [...mockComplianceControlMappings];
  private classifications: DataClassificationDto[] = [...mockDataClassifications];
  private retentionPolicies: DataRetentionPolicyDto[] = [...mockDataRetentionPolicies];
  private retentionRules: DataRetentionRuleDto[] = [...mockDataRetentionRules];
  private baaRecords: BAARecordDto[] = [...mockBAARecords];
  private exceptions: GovernanceExceptionDto[] = [...mockGovernanceExceptions];
  private verifications: ComplianceVerificationDto[] = [...mockComplianceVerifications];
  private reports: ComplianceReportDto[] = [...mockComplianceReports];

  async getComplianceOverview(): Promise<ComplianceOverviewDto> {
    return Promise.resolve({
      ...mockComplianceOverview,
      activeFrameworksCount: this.frameworks.filter((f) => f.status === 'ACTIVE').length,
      totalControlsCount: this.controls.length,
      controlsRequiringReviewCount: this.controls.filter((c) => c.controlStatus === 'READY_FOR_REVIEW' || c.controlStatus === 'EVIDENCE_REQUIRED').length,
      evidenceRequiringReviewCount: this.evidence.filter((e) => e.evidenceStatus === 'UNDER_REVIEW').length,
      activeBAACount: this.baaRecords.filter((b) => b.status === 'ACTIVE').length,
      expiringBAACount: this.baaRecords.filter((b) => b.status === 'EXPIRING').length,
      activeRetentionPoliciesCount: this.retentionPolicies.filter((r) => r.status === 'ACTIVE').length,
      openExceptionsCount: this.exceptions.filter((e) => e.status === 'REQUESTED' || e.status === 'UNDER_REVIEW' || e.status === 'APPROVED').length,
      pendingVerificationsCount: this.verifications.filter((v) => v.status === 'PENDING').length
    });
  }

  async getFrameworks(): Promise<ComplianceFrameworkDto[]> {
    return Promise.resolve([...this.frameworks]);
  }

  async getFrameworkById(frameworkId: string): Promise<ComplianceFrameworkDto | null> {
    const fw = this.frameworks.find((f) => f.id === frameworkId);
    return Promise.resolve(fw ? { ...fw } : null);
  }

  async getControls(): Promise<ComplianceControlDto[]> {
    return Promise.resolve([...this.controls]);
  }

  async getControlsByFramework(frameworkId: string): Promise<ComplianceControlDto[]> {
    return Promise.resolve(this.controls.filter((c) => c.frameworkId === frameworkId));
  }

  async getEvidence(): Promise<ComplianceEvidenceDto[]> {
    return Promise.resolve([...this.evidence]);
  }

  async getEvidenceById(evidenceId: string): Promise<ComplianceEvidenceDto | null> {
    const ev = this.evidence.find((e) => e.id === evidenceId);
    return Promise.resolve(ev ? { ...ev } : null);
  }

  async mapEvidenceToControl(req: MapEvidenceToControlRequest): Promise<ComplianceControlMappingDto> {
    const ctrl = this.controls.find((c) => c.id === req.controlId);
    const ev = this.evidence.find((e) => e.id === req.evidenceId);
    if (!ctrl || !ev) {
      throw new Error('Control or Evidence not found');
    }

    const newMapping: ComplianceControlMappingDto = {
      id: crypto.randomUUID(),
      controlId: ctrl.id,
      controlCode: ctrl.controlCode,
      controlTitle: ctrl.title,
      evidenceId: ev.id,
      evidenceCode: ev.evidenceCode,
      evidenceTitle: ev.title,
      evidenceType: ev.evidenceType,
      mappingStatus: 'ACTIVE',
      mappingNotes: req.mappingNotes,
      mappedByEmail: req.actorEmail,
      mappedAt: new Date().toISOString(),
      metadata: {}
    };

    this.mappings.push(newMapping);
    ctrl.evidenceCount += 1;
    ev.linkedControlCount += 1;

    return Promise.resolve({ ...newMapping });
  }

  async getControlMappings(): Promise<ComplianceControlMappingDto[]> {
    return Promise.resolve([...this.mappings]);
  }

  async getDataClassifications(): Promise<DataClassificationDto[]> {
    return Promise.resolve([...this.classifications]);
  }

  async getRetentionPolicies(): Promise<DataRetentionPolicyDto[]> {
    return Promise.resolve([...this.retentionPolicies]);
  }

  async getRetentionRules(): Promise<DataRetentionRuleDto[]> {
    return Promise.resolve([...this.retentionRules]);
  }

  async getBAARecords(): Promise<BAARecordDto[]> {
    return Promise.resolve([...this.baaRecords]);
  }

  async getGovernanceExceptions(): Promise<GovernanceExceptionDto[]> {
    return Promise.resolve([...this.exceptions]);
  }

  async createGovernanceException(req: CreateGovernanceExceptionRequest): Promise<GovernanceExceptionDto> {
    const code = `EXC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newExc: GovernanceExceptionDto = {
      id: crypto.randomUUID(),
      exceptionCode: code,
      title: req.title,
      description: req.description,
      frameworkId: req.frameworkId,
      controlId: req.controlId,
      requestedByEmail: req.requestedByEmail,
      ownerEmail: req.actorEmail,
      status: 'REQUESTED',
      riskLevel: req.riskLevel,
      justification: req.justification,
      compensatingControls: req.compensatingControls,
      requestedExpirationDate: req.requestedExpirationDate,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.exceptions.unshift(newExc);
    return Promise.resolve({ ...newExc });
  }

  async reviewGovernanceException(req: ReviewGovernanceExceptionRequest): Promise<GovernanceExceptionDto> {
    const exc = this.exceptions.find((e) => e.id === req.exceptionId);
    if (!exc) {
      throw new Error('Governance exception not found');
    }
    exc.status = req.decision;
    exc.approvedByEmail = req.actorEmail;
    exc.approvedAt = new Date().toISOString();
    exc.closureNotes = req.closureNotes;
    exc.updatedAt = new Date().toISOString();
    return Promise.resolve({ ...exc });
  }

  async getComplianceVerifications(): Promise<ComplianceVerificationDto[]> {
    return Promise.resolve([...this.verifications]);
  }

  async verifyControl(req: VerifyComplianceControlRequest): Promise<ComplianceVerificationDto> {
    const ctrl = this.controls.find((c) => c.id === req.controlId);
    if (!ctrl) {
      throw new Error('Compliance control not found');
    }

    const code = `VER-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVerif: ComplianceVerificationDto = {
      id: crypto.randomUUID(),
      verificationCode: code,
      controlId: ctrl.id,
      controlCode: ctrl.controlCode,
      verificationType: req.verificationType,
      status: req.status,
      verifierEmail: req.verifierEmail,
      verificationDate: new Date().toISOString(),
      evidenceReference: req.evidenceReference,
      findings: req.findings,
      remediationRequired: req.remediationRequired,
      remediationDueDate: req.remediationDueDate,
      metadata: {},
      createdAt: new Date().toISOString()
    };

    this.verifications.unshift(newVerif);
    if (req.status === 'VERIFIED') {
      ctrl.controlStatus = 'VERIFIED';
      ctrl.lastVerifiedAt = new Date().toISOString();
    } else if (req.status === 'FAILED') {
      ctrl.controlStatus = 'EVIDENCE_REQUIRED';
    }

    return Promise.resolve({ ...newVerif });
  }

  async getComplianceReports(): Promise<ComplianceReportDto[]> {
    return Promise.resolve([...this.reports]);
  }

  async generateComplianceReport(req: GenerateComplianceReportRequest): Promise<ComplianceReportDto> {
    const code = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRep: ComplianceReportDto = {
      id: crypto.randomUUID(),
      reportCode: code,
      reportName: req.reportName,
      frameworkType: req.frameworkType,
      reportingPeriodStart: req.reportingPeriodStart,
      reportingPeriodEnd: req.reportingPeriodEnd,
      outputFormat: 'PDF_AND_JSON',
      status: 'COMPLETED',
      generatedAt: new Date().toISOString(),
      generatedByEmail: req.actorEmail,
      evidenceReference: `REP-EVID-${code}`,
      metadata: {},
      createdAt: new Date().toISOString()
    };
    this.reports.unshift(newRep);
    return Promise.resolve({ ...newRep });
  }

  async createFramework(req: CreateComplianceFrameworkRequest): Promise<ComplianceFrameworkDto> {
    const newFw: ComplianceFrameworkDto = {
      id: crypto.randomUUID(),
      frameworkCode: req.frameworkCode,
      frameworkType: req.frameworkType,
      name: req.name,
      description: req.description,
      version: req.version,
      status: 'ACTIVE',
      ownerEmail: req.ownerEmail,
      controlCount: 0,
      verifiedControlCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.frameworks.unshift(newFw);
    return Promise.resolve({ ...newFw });
  }

  async createControl(req: CreateComplianceControlRequest): Promise<ComplianceControlDto> {
    const fw = this.frameworks.find((f) => f.id === req.frameworkId);
    const newCtrl: ComplianceControlDto = {
      id: crypto.randomUUID(),
      frameworkId: req.frameworkId,
      frameworkCode: fw?.frameworkCode,
      controlCode: req.controlCode,
      title: req.title,
      description: req.description,
      controlCategory: req.controlCategory,
      controlStatus: 'NOT_STARTED',
      requirementSummary: req.requirementSummary,
      ownerEmail: req.ownerEmail,
      reviewDueDate: req.reviewDueDate,
      evidenceCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.controls.unshift(newCtrl);
    if (fw) {
      fw.controlCount += 1;
    }
    return Promise.resolve({ ...newCtrl });
  }

  async createEvidence(req: CreateComplianceEvidenceRequest): Promise<ComplianceEvidenceDto> {
    const newEv: ComplianceEvidenceDto = {
      id: crypto.randomUUID(),
      evidenceCode: req.evidenceCode,
      evidenceType: req.evidenceType,
      title: req.title,
      description: req.description,
      sourceDomain: req.sourceDomain,
      sourceReference: req.sourceReference,
      evidenceStatus: 'SUBMITTED',
      collectedAt: new Date().toISOString(),
      validFrom: req.validFrom,
      validUntil: req.validUntil,
      submittedByEmail: req.submittedByEmail,
      linkedControlCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.evidence.unshift(newEv);
    return Promise.resolve({ ...newEv });
  }

  async createRetentionPolicy(req: CreateRetentionPolicyRequest): Promise<DataRetentionPolicyDto> {
    const newPol: DataRetentionPolicyDto = {
      id: crypto.randomUUID(),
      policyCode: req.policyCode,
      name: req.name,
      description: req.description,
      status: 'ACTIVE',
      defaultRetentionDays: req.defaultRetentionDays,
      legalHoldSupported: req.legalHoldSupported,
      deletionMethod: 'CRYPTOGRAPHIC_ERASURE',
      archiveBeforeDelete: true,
      approvalRequired: true,
      ownerEmail: req.ownerEmail,
      effectiveDate: new Date().toISOString(),
      version: '1.0.0',
      rulesCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.retentionPolicies.unshift(newPol);
    return Promise.resolve({ ...newPol });
  }

  async createBAARecord(req: CreateBAARecordRequest): Promise<BAARecordDto> {
    const newBAA: BAARecordDto = {
      id: crypto.randomUUID(),
      baaCode: req.baaCode,
      partnerId: req.partnerId,
      partnerName: req.partnerName,
      status: req.status,
      effectiveDate: req.effectiveDate,
      expirationDate: req.expirationDate,
      signedReference: req.signedReference,
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.baaRecords.unshift(newBAA);
    return Promise.resolve({ ...newBAA });
  }
}

export const complianceService = new ComplianceService();
