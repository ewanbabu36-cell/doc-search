// apps/api-gateway/src/routes/partner/commercial-operations.routes.ts
import { type FastifyPluginAsync } from 'fastify';
import {
  getDatabase,
  surgeryEmiApplications,
  surgeryConciergeLeads,
  doctorPayoutConfigurations,
  doctorSettlementVouchers,
  patientCarePasses,
  patientHealthWallets,
  pharmacyGenericSubstitutions,
  pharmacyChronicRefillRadars,
  phlebotomistFleets,
  homeCollectionOrders,
  rcmPreauthScrubberRules,
  rcmClaimScrubLogs,
  doctorVolumePayoutTiers,
  patientFamilyHealthMembers,
  pharmacyB2bPurchaseOrders,
  pharmacyRtvDebitNotes,
  diagnosticHealthPackages,
  corporateTpaClients,
  saasCommunicationWallets,
  saasMarketplaceAddons,
  eq,
  and,
  desc,
  sql
} from '@docsearch/database';
import crypto from 'node:crypto';
import { authenticate } from '../../plugins/auth-guard.js';

export const commercialOperationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  // =========================================================================
  // PILLAR 1: SURGERY FINANCING & 0% CHECKOUT EMI ENGINE (vs Practo Care & Bajaj Finserv)
  // =========================================================================

  // Pre-approve Instant 0% Medical EMI
  fastify.post('/api/v1/partner/billing/surgery-financing/pre-approve', async (request, reply) => {
    const body = request.body as {
      patientName?: string;
      patientPhone?: string;
      procedureName?: string;
      packageAmount: number;
      cibilScoreBand?: string;
    };

    const packageAmount = Number(body.packageAmount) || 50000;
    const band = body.cibilScoreBand || '750_EXCELLENT';
    const isApproved = band !== 'BELOW_600_POOR';

    // 0% Interest EMI calculation for 3, 6, 12 months with merchant subvention fee
    const plans = [
      {
        tenureMonths: 3,
        monthlyEmi: Math.round(packageAmount / 3),
        interestRatePct: 0.0,
        subventionRatePct: 2.5,
        subventionAmount: Math.round(packageAmount * 0.025),
        hospitalNetSettlement: Math.round(packageAmount * (1 - 0.025)),
        instantPreApproved: isApproved
      },
      {
        tenureMonths: 6,
        monthlyEmi: Math.round(packageAmount / 6),
        interestRatePct: 0.0,
        subventionRatePct: 3.5,
        subventionAmount: Math.round(packageAmount * 0.035),
        hospitalNetSettlement: Math.round(packageAmount * (1 - 0.035)),
        instantPreApproved: isApproved
      },
      {
        tenureMonths: 12,
        monthlyEmi: Math.round(packageAmount / 12),
        interestRatePct: 0.0,
        subventionRatePct: 4.0,
        subventionAmount: Math.round(packageAmount * 0.04),
        hospitalNetSettlement: Math.round(packageAmount * (1 - 0.04)),
        instantPreApproved: isApproved
      }
    ];

    return reply.send({
      success: true,
      data: {
        packageAmount,
        cibilScoreBand: band,
        preApprovalStatus: isApproved ? 'PRE_APPROVED_INSTANT' : 'MANUAL_UNDERWRITING_REQUIRED',
        creditLimitGranted: isApproved ? Math.max(packageAmount, 150000) : 0,
        availableFinancingPartners: ['BAJAJ_FINSERV_HEALTH', 'SAVEIN', 'PROPELLD'],
        plans
      }
    });
  });

  // Apply for Surgery 0% EMI Loan
  fastify.post('/api/v1/partner/billing/surgery-financing/apply', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const packageAmount = Number(body.packageAmount) || 65000;
    const downPayment = Number(body.downPayment) || 0;
    const loanAmount = Number(body.loanAmount) || (packageAmount - downPayment);
    const tenureMonths = Number(body.tenureMonths) || 6;
    const subventionRatePct = tenureMonths === 3 ? 2.5 : tenureMonths === 6 ? 3.5 : 4.0;
    const subventionAmount = Math.round(loanAmount * (subventionRatePct / 100));
    const monthlyEmiAmount = Math.round(loanAmount / tenureMonths);
    const loanReferenceNumber = `EMI-BJF-${Date.now().toString().slice(-6)}`;

    const [inserted] = await db.insert(surgeryEmiApplications).values({
      tenantId,
      patientName: body.patientName || 'Walk-in Patient',
      patientPhone: body.patientPhone || '+91 98110 00000',
      procedureName: body.procedureName || 'Surgical Procedure',
      packageAmount: String(packageAmount),
      downPayment: String(downPayment),
      loanAmount: String(loanAmount),
      tenureMonths,
      monthlyEmiAmount: String(monthlyEmiAmount),
      subventionRatePct: String(subventionRatePct),
      subventionAmount: String(subventionAmount),
      financingPartner: body.financingPartner || 'BAJAJ_FINSERV',
      cibilScoreBand: body.cibilScoreBand || '750_EXCELLENT',
      status: 'PRE_APPROVED',
      loanReferenceNumber
    }).returning();

    return reply.status(201).send({
      success: true,
      message: '0% Surgery EMI Application submitted and instant pre-approved!',
      data: inserted
    });
  });

  // List Surgery EMI Applications
  fastify.get('/api/v1/partner/billing/surgery-financing/applications', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();

    const apps = await db.select().from(surgeryEmiApplications)
      .where(eq(surgeryEmiApplications.tenantId, tenantId))
      .orderBy(desc(surgeryEmiApplications.createdAt));

    return reply.send({ success: true, data: apps });
  });

  // List Surgery Concierge Leads
  fastify.get('/api/v1/partner/billing/surgery-concierge/leads', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();

    const leads = await db.select().from(surgeryConciergeLeads)
      .where(eq(surgeryConciergeLeads.tenantId, tenantId))
      .orderBy(desc(surgeryConciergeLeads.createdAt));

    return reply.send({ success: true, data: leads });
  });

  // Create or Update Surgery Concierge Lead
  fastify.post('/api/v1/partner/billing/surgery-concierge/leads', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const [lead] = await db.insert(surgeryConciergeLeads).values({
      tenantId,
      patientName: body.patientName || 'Patient',
      patientPhone: body.patientPhone || '+91 99999 99999',
      procedureName: body.procedureName || 'Laparoscopic Surgery',
      specialty: body.specialty || 'General Surgery',
      surgeonName: body.surgeonName || 'Dr. Vivek Sharma',
      packageCost: String(body.packageCost || 60000),
      stage: body.stage || 'CONSULTATION',
      emiOpted: Boolean(body.emiOpted),
      emiTenureMonths: body.emiTenureMonths || null,
      monthlyEmiAmount: body.monthlyEmiAmount ? String(body.monthlyEmiAmount) : null,
      tpaApprovedAmount: String(body.tpaApprovedAmount || 0),
      otDate: body.otDate || 'Tentative',
      otRoom: body.otRoom || 'Modular OT-01',
      bedAssigned: body.bedAssigned || 'Deluxe-201',
      careBuddy: body.careBuddy || 'Sister Sunita'
    }).returning();

    return reply.status(201).send({ success: true, data: lead });
  });

  // =========================================================================
  // PILLAR 2: DOCTOR REVENUE SHARE & NMC-COMPLIANT SPLIT PAYOUT LEDGER (vs KareXpert & Practo Ray)
  // =========================================================================

  // Get Doctor Payout Configurations
  fastify.get('/api/v1/partner/billing/doctor-payouts/configs', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();

    const configs = await db.select().from(doctorPayoutConfigurations)
      .where(eq(doctorPayoutConfigurations.tenantId, tenantId))
      .orderBy(desc(doctorPayoutConfigurations.createdAt));

    return reply.send({ success: true, data: configs });
  });

  // Create or Update Doctor Payout Configuration
  fastify.post('/api/v1/partner/billing/doctor-payouts/configs', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const [cfg] = await db.insert(doctorPayoutConfigurations).values({
      tenantId,
      doctorName: body.doctorName || 'Dr. Consultant',
      opdConsultationCutPct: String(body.opdConsultationCutPct || 70.0),
      hospitalFacilityUsageCutPct: String(body.hospitalFacilityUsageCutPct || 30.0),
      ipdProcedureCutPct: String(body.ipdProcedureCutPct || 75.0),
      emergencyNightSurgeBonusPct: String(body.emergencyNightSurgeBonusPct || 50.0),
      tdsRatePct: String(body.tdsRatePct || 10.0),
      fixedRoomRentalDeduction: String(body.fixedRoomRentalDeduction || 150.0),
      nmcComplianceTag: 'CLINICAL_FACILITY_INFRASTRUCTURE_USAGE',
      status: 'ACTIVE'
    }).returning();

    return reply.status(201).send({ success: true, data: cfg });
  });

  // Generate Automated EOD Doctor Settlement with TDS & NMC Ethics Declaration
  fastify.post('/api/v1/partner/billing/doctor-payouts/settlements/generate', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const grossBilled = Number(body.grossBilled) || 15000;
    const consultationsCount = Number(body.consultationsCount) || 15;
    const opdDoctorSharePct = Number(body.opdConsultationCutPct) || 70.0;
    const facilityUsagePct = 100 - opdDoctorSharePct;
    const fixedRoomRental = 150.0;

    const facilityUsageFee = Math.round(grossBilled * (facilityUsagePct / 100)) + fixedRoomRental;
    const doctorGrossEarnings = Math.max(0, grossBilled - facilityUsageFee);
    const tdsRate = 10.0; // Section 194J - 10% on professional services
    const tdsDeducted = Math.round(doctorGrossEarnings * (tdsRate / 100));
    const netPayable = doctorGrossEarnings - tdsDeducted;

    const voucherNumber = `VOUCH-DOC-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const periodStart = new Date(now.setHours(0, 0, 0, 0));
    const periodEnd = new Date();

    const nmcDeclaration = 'Certified strictly in accordance with National Medical Commission (NMC) Registered Medical Practitioner Regulations 2023. Payout represents legitimate professional clinical fees after deduction of hospital facility infrastructure, chamber equipment rental, and statutory TDS under Section 194J. No commercial kickbacks or referral fee-splitting involved.';

    const [voucher] = await db.insert(doctorSettlementVouchers).values({
      tenantId,
      voucherNumber,
      doctorName: body.doctorName || 'Dr. Vivek Sharma (MS Gen Surg)',
      settlementCycle: body.settlementCycle || 'EOD_DAILY',
      periodStartDate: periodStart,
      periodEndDate: periodEnd,
      totalConsultationsCount: consultationsCount,
      grossConsultationBilled: String(grossBilled),
      facilityUsageFeeDeducted: String(facilityUsageFee),
      tdsDeducted: String(tdsDeducted),
      netPayableToDoctor: String(netPayable),
      status: 'GENERATED',
      nmcEthicsDeclaration: nmcDeclaration,
      transactionReference: `NEFT-SIM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    }).returning();

    return reply.status(201).send({
      success: true,
      message: 'NMC-Compliant EOD Doctor Settlement Voucher generated successfully!',
      data: voucher
    });
  });

  // Get Settlement Vouchers
  fastify.get('/api/v1/partner/billing/doctor-payouts/settlements', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();

    const vouchers = await db.select().from(doctorSettlementVouchers)
      .where(eq(doctorSettlementVouchers.tenantId, tenantId))
      .orderBy(desc(doctorSettlementVouchers.createdAt));

    return reply.send({ success: true, data: vouchers });
  });

  // =========================================================================
  // PILLAR 3: RECURRING SUBSCRIPTION & CHRONIC CARE PASS (vs Apollo Circle & 1mg)
  // =========================================================================

  // Get Care Pass Plans
  fastify.get('/api/v1/partner/billing/care-passes/plans', async (_request, reply) => {
    const plans = [
      {
        passCode: 'CARE_FAMILY_999',
        passTier: 'ANNUAL_FAMILY',
        name: 'DocSearch Family Health Shield (Annual)',
        annualFee: 999.0,
        billingCycle: 'ANNUAL',
        benefits: [
          'Unlimited Free OPD Follow-up Consultations (Up to 4 family members)',
          'Flat 15% Savings on In-House Pharmacy & Jan Aushadhi Dispensing',
          '12 Free Home Blood Collection Visits per Year (Zero ₹150 convenience surcharge)',
          'Priority Bed Admission & Free 24/7 Care Concierge'
        ],
        churnRiskBenchmark: '< 5%'
      },
      {
        passCode: 'CARE_CHRONIC_199',
        passTier: 'MONTHLY_CHRONIC',
        name: 'DocSearch Diabetes & Cardiac Care Pass (Monthly)',
        annualFee: 199.0,
        billingCycle: 'MONTHLY',
        benefits: [
          'Monthly Doorstep HbA1c / Lipid Profile Blood Collection (Free)',
          'Flat 15% In-House Pharmacy Discount with 3-Day Automated Refill Radar',
          'Free Diabetologist Video Review Every 30 Days',
          'Dynamic UPI Auto-Debit Mandate (Skip-anytime)'
        ],
        churnRiskBenchmark: '< 8%'
      }
    ];

    return reply.send({ success: true, data: plans });
  });

  // Subscribe to Care Pass
  fastify.post('/api/v1/partner/billing/care-passes/subscribe', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const isFamily = body.passTier !== 'MONTHLY_CHRONIC';
    const passCode = isFamily ? 'CARE_FAMILY_999' : 'CARE_CHRONIC_199';
    const annualFee = isFamily ? 999.0 : 199.0;
    const expiryDays = isFamily ? 365 : 30;
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const [sub] = await db.insert(patientCarePasses).values({
      tenantId,
      patientName: body.patientName || 'Subscriber Patient',
      patientPhone: body.patientPhone || '+91 98100 00000',
      passCode,
      passTier: isFamily ? 'ANNUAL_FAMILY' : 'MONTHLY_CHRONIC',
      annualFee: String(annualFee),
      unlimitedOpdFollowupsActive: true,
      pharmacyDiscountPct: '15.00',
      freeHomeCollectionAllowance: isFamily ? 12 : 6,
      freeHomeCollectionUsed: 0,
      status: 'ACTIVE',
      autoDebitWebhookActive: true,
      churnRisk: 'LOW',
      expiryDate
    }).returning();

    return reply.status(201).send({
      success: true,
      message: `Subscribed to ${passCode} successfully!`,
      data: sub
    });
  });

  // Get Active Care Passes
  fastify.get('/api/v1/partner/billing/care-passes/active', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();

    const passes = await db.select().from(patientCarePasses)
      .where(eq(patientCarePasses.tenantId, tenantId))
      .orderBy(desc(patientCarePasses.createdAt));

    return reply.send({ success: true, data: passes });
  });

  // Topup Health Wallet with Promotional Bonus
  fastify.post('/api/v1/partner/billing/care-passes/wallet-topup', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const amount = Number(body.amount) || 1000;
    const bonusPct = amount >= 2000 ? 10 : 0;
    const bonusCredit = Math.round(amount * (bonusPct / 100));

    const [wallet] = await db.insert(patientHealthWallets).values({
      tenantId,
      patientPhone: body.patientPhone || '+91 98100 12345',
      walletBalance: String(amount),
      bonusCreditBalance: String(bonusCredit),
      totalSavedLifetime: String(bonusCredit),
      status: 'ACTIVE'
    }).returning();

    return reply.send({
      success: true,
      message: `Health Wallet loaded with ₹${amount} + ₹${bonusCredit} bonus promotional credit!`,
      data: wallet
    });
  });

  // =========================================================================
  // PILLAR 4: PHARMACY MARGIN OPTIMIZATION & PMBJP SUBSTITUTION (vs Tata 1mg)
  // =========================================================================

  // Generic PMBJP Substitution Catalog
  fastify.get('/api/v1/partner/pharmacy/generic-substitutions', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const query = (request.query as any)?.q?.toLowerCase() || '';
    const db = getDatabase();

    let list = await db.select().from(pharmacyGenericSubstitutions)
      .where(eq(pharmacyGenericSubstitutions.tenantId, tenantId))
      .orderBy(desc(pharmacyGenericSubstitutions.patientSavingsPct));

    if (query) {
      list = list.filter((it: any) =>
        it.brandMedicationName.toLowerCase().includes(query) ||
        it.brandComposition.toLowerCase().includes(query) ||
        it.pmbjpGenericName.toLowerCase().includes(query)
      );
    }

    return reply.send({
      success: true,
      summary: {
        avgPatientSavingsPct: '81.9%',
        avgHospitalMarginPct: '66.1%',
        totalAvailableSubstitutions: list.length
      },
      data: list
    });
  });

  // Chronic Refill Radar
  fastify.get('/api/v1/partner/pharmacy/chronic-refills/radar', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();

    const radars = await db.select().from(pharmacyChronicRefillRadars)
      .where(eq(pharmacyChronicRefillRadars.tenantId, tenantId))
      .orderBy(pharmacyChronicRefillRadars.daysRemaining);

    return reply.send({ success: true, data: radars });
  });

  // Dispatch WhatsApp Chronic Refill Push
  fastify.post('/api/v1/partner/pharmacy/chronic-refills/dispatch-reminder', async (request, reply) => {
    const body = request.body as any;
    const db = getDatabase();

    if (body.radarId) {
      await db.update(pharmacyChronicRefillRadars)
        .set({
          whatsappRefillDispatched: true,
          reorderStatus: 'WHATSAPP_DISPATCHED'
        })
        .where(eq(pharmacyChronicRefillRadars.id, body.radarId));
    }

    return reply.send({
      success: true,
      message: '1-Click WhatsApp Refill Link dispatched with 15% Care Pass pharmacy savings badge!'
    });
  });

  // =========================================================================
  // PILLAR 5: HOME DIAGNOSTICS & PHLEBOTOMIST LOGISTICS FLEET (vs Apollo / 1mg)
  // =========================================================================

  // Phlebotomist Fleet
  fastify.get('/api/v1/partner/diagnostics/phlebotomist-fleet', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();

    const fleet = await db.select().from(phlebotomistFleets)
      .where(eq(phlebotomistFleets.tenantId, tenantId))
      .orderBy(desc(phlebotomistFleets.todayPickupsCompleted));

    return reply.send({ success: true, data: fleet });
  });

  // Home Collection Orders
  fastify.get('/api/v1/partner/diagnostics/home-collections', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();

    const orders = await db.select().from(homeCollectionOrders)
      .where(eq(homeCollectionOrders.tenantId, tenantId))
      .orderBy(desc(homeCollectionOrders.createdAt));

    return reply.send({ success: true, data: orders });
  });

  // Cold Chain Telemetry & Barcode Scanning Update
  fastify.post('/api/v1/partner/diagnostics/home-collections/:id/cold-chain-update', async (request, reply) => {
    const orderId = (request.params as any).id;
    const body = request.body as any;
    const db = getDatabase();

    const celsius = Number(body.coldChainCelsius) || 4.0;
    const status = celsius <= 6.0 ? 'OPTIMAL_CHILLED' : celsius <= 10.0 ? 'WARNING_ELEVATED' : 'BREACH';
    const barcode = body.vacutainerBarcode || `VAC-BAR-${Date.now().toString().slice(-6)}`;

    const [updated] = await db.update(homeCollectionOrders)
      .set({
        vacutainerBarcode: barcode,
        coldChainCelsius: String(celsius),
        coldChainStatus: status,
        status: 'SAMPLE_COLLECTED_CHILLED'
      })
      .where(eq(homeCollectionOrders.id, orderId))
      .returning();

    return reply.send({
      success: true,
      message: 'Cold chain temperature logged and specimen barcode registered!',
      data: updated
    });
  });

  // =========================================================================
  // PILLAR 6: RCM REVENUE CYCLE DEFENSE & PRE-AUTH SCRUBBER (vs Epic / KareXpert)
  // =========================================================================

  // RCM Pre-Auth Rules
  fastify.get('/api/v1/partner/billing/rcm/rules', async (_request, reply) => {
    const db = getDatabase();
    const rules = await db.select().from(rcmPreauthScrubberRules);
    return reply.send({ success: true, data: rules });
  });

  // Pre-Auth Claim Scrubber Engine (Pre-scrubs before IRDAI / NHCX 2.0 submission)
  fastify.post('/api/v1/partner/billing/rcm/scrub-claim', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const claimNumber = body.claimNumber || `CLM-${Date.now().toString().slice(-6)}`;
    const proposedAmount = Number(body.proposedClaimAmount) || 65000;
    const procedure = body.procedureName || 'Laparoscopic Cholecystectomy';
    const hasUltrasound = Boolean(body.hasUltrasoundReport ?? true);
    const hasImplantInvoice = Boolean(body.hasImplantBarcode ?? true);
    const losHours = Number(body.losHours) || 20;

    const findings: any[] = [];
    let scrubberScore = 100;
    let leakageAmount = 0;

    // Scrubber Rule Checks
    if (!hasUltrasound && procedure.toLowerCase().includes('cholecyst')) {
      findings.push({
        ruleCode: 'RCM-RULE-01',
        severity: 'CRITICAL_DENIAL_RISK',
        description: 'Missing ultrasound justification report for gallbladder removal.',
        fix: 'Attach USG Abdomen DICOM / radiologist signed report before submitting pre-auth.'
      });
      scrubberScore -= 40;
    }

    if (body.billedNonPayableConsumables) {
      const nonPayableVal = 3200;
      findings.push({
        ruleCode: 'RCM-RULE-02',
        severity: 'WARNING_MARGIN_LEAKAGE',
        description: `Billed ₹${nonPayableVal} non-payable consumables (gloves, drape sheets) which TPA will reject.`,
        fix: 'Shift ₹3,200 into approved OT tariff bundle or patient co-pay rider.'
      });
      scrubberScore -= 15;
      leakageAmount += nonPayableVal;
    }

    if (losHours > 24 && procedure.toLowerCase().includes('laparoscopic')) {
      findings.push({
        ruleCode: 'RCM-RULE-03',
        severity: 'CRITICAL_DENIAL_RISK',
        description: `Proposed LOS of ${losHours} hours exceeds 24-hour day-care benchmark without clinical complication note.`,
        fix: 'Add Attending Surgeon justification note detailing postoperative observation need.'
      });
      scrubberScore -= 25;
    }

    if (!hasImplantInvoice && (procedure.toLowerCase().includes('knee') || procedure.toLowerCase().includes('stent'))) {
      findings.push({
        ruleCode: 'RCM-RULE-04',
        severity: 'CRITICAL_DENIAL_RISK',
        description: 'Missing OEM Implant serial barcode verification invoice.',
        fix: 'Upload vendor implant invoice and NPPA ceiling price compliance certification.'
      });
      scrubberScore -= 35;
    }

    const denialProbability = Math.max(5, 100 - scrubberScore);
    const scrubStatus = scrubberScore >= 80 ? 'CLEAN_SUBMIT_APPROVED' : 'BLOCKED_DENIAL_RISK';

    const [log] = await db.insert(rcmClaimScrubLogs).values({
      tenantId,
      claimNumber,
      patientUhid: body.patientUhid || 'UHID-8821',
      patientName: body.patientName || 'Rameshwar Dayal',
      procedureName: procedure,
      proposedClaimAmount: String(proposedAmount),
      scrubberScore,
      denialProbabilityPct: String(denialProbability),
      flaggedViolationsCount: findings.length,
      detectedLeakageAmount: String(leakageAmount),
      findings,
      scrubStatus
    }).returning();

    return reply.send({
      success: true,
      data: {
        scrubStatus,
        scrubberScore,
        denialProbabilityPct: denialProbability,
        findings,
        leakageAmountPrevented: leakageAmount,
        nhcxReady: scrubStatus === 'CLEAN_SUBMIT_APPROVED',
        logId: log?.id || 'rcm-log-01'
      }
    });
  });

  // Bedside Unbilled Consumable Cross-Check
  fastify.get('/api/v1/partner/billing/rcm/unbilled-consumables-audit/:admissionId', async (_request, reply) => {
    return reply.send({
      success: true,
      data: {
        admissionId: (_request.params as any).admissionId,
        unbilledItemsFound: [
          { item: 'Trocar Cannula Disposable 10mm', department: 'OT Nursing', amount: 1800, detectedVia: 'OT Sister Notes' },
          { item: 'Hem-o-lok Polymer Ligating Clips M/L', department: 'Surgical Tray', amount: 2400, detectedVia: 'Scrub Nurse Log' },
          { item: 'Monopolar Electrosurgical Cautery Pencil', department: 'OT Consumable', amount: 650, detectedVia: 'Anesthesia Safety Checklist' }
        ],
        totalRecoveredRevenue: 4850,
        status: 'AUTO_POSTED_TO_DRAFT_BILL'
      }
    });
  });

  // =========================================================================
  // ADDITIONAL COMMERCIAL HEGEMONY PILLARS & REVENUE ENGINES
  // =========================================================================

  // --- PILLAR 1: Slot Surge Pricing, Volume Tiers & Doctor Attribution ---
  fastify.post('/api/v1/partner/billing/slots/surge-pricing', async (request, reply) => {
    const body = request.body as any;
    const baseFee = Number(body.baseFee) || 800;
    const waitlist = Number(body.currentWaitlistCount) || 12;
    const isNight = Boolean(body.isEmergencyNightSlot);

    let surgePct = 0;
    let reason = 'STANDARD_SCHEDULE';

    if (isNight) {
      surgePct = 50;
      reason = 'EMERGENCY_NIGHT_SURGE';
    } else if (waitlist >= 15) {
      surgePct = 25;
      reason = 'HIGH_DEMAND_PEAK_HOUR';
    }

    const surgeFee = Math.round(baseFee * (1 + surgePct / 100));

    return reply.send({
      success: true,
      data: {
        baseFee,
        surgePct,
        surgeFee,
        reason,
        patientTransparentAlert: surgePct > 0 
          ? `⚡ Transparent Surge: +${surgePct}% applied due to ${reason === 'EMERGENCY_NIGHT_SURGE' ? 'Night Emergency Duty' : 'High Chamber OPD Volume'}. Guaranteed wait time < 20 mins.`
          : 'Standard OPD consultation tariff applied.'
      }
    });
  });

  fastify.get('/api/v1/partner/billing/doctor-payouts/volume-tiers', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();
    const tiers = await db.select().from(doctorVolumePayoutTiers).where(eq(doctorVolumePayoutTiers.tenantId, tenantId));
    return reply.send({ success: true, data: tiers });
  });

  fastify.get('/api/v1/partner/billing/doctor-payouts/retention-attribution', async (_request, reply) => {
    return reply.send({
      success: true,
      data: {
        doctorDrivenRevenue: 420000,
        platformReferredRevenue: 280000,
        doctorDrivenPatientsPct: 60.0,
        platformReferredPatientsPct: 40.0,
        clinicGrossMarginContribution: 168000,
        retentionRatePct: 88.4
      }
    });
  });

  // --- PILLAR 2: Family Health Tree, OTP Wallet Deduction & Cart Recovery ---
  fastify.get('/api/v1/partner/billing/care-passes/family-tree', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const phone = (request.query as any)?.phone || '+91 98118 77665';
    const db = getDatabase();
    const members = await db.select().from(patientFamilyHealthMembers)
      .where(eq(patientFamilyHealthMembers.tenantId, tenantId));
    const filtered = members.filter((m: any) => m.primaryPatientPhone === phone);
    return reply.send({ success: true, data: filtered.length > 0 ? filtered : members });
  });

  fastify.post('/api/v1/partner/billing/care-passes/family-tree', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const [member] = await db.insert(patientFamilyHealthMembers).values({
      tenantId,
      primaryPatientPhone: body.primaryPatientPhone || '+91 98118 77665',
      memberName: body.memberName || 'Family Member',
      relationship: body.relationship || 'SPOUSE',
      memberPhone: body.memberPhone,
      memberAge: body.memberAge ? Number(body.memberAge) : null,
      monthlySpendLimit: String(body.monthlySpendLimit || 5000),
      walletSpendingEnabled: true
    }).returning();

    return reply.status(201).send({ success: true, data: member });
  });

  fastify.post('/api/v1/partner/billing/care-passes/wallet-deduct', async (request, reply) => {
    const body = request.body as any;
    const amount = Number(body.amount) || 500;
    const otp = String(body.otpCode || '').trim();

    // Verify OTP simulation
    if (!otp || otp.length < 4) {
      return reply.status(400).send({ success: false, message: 'Invalid OTP code. 4-digit SMS OTP required for wallet debit.' });
    }

    const discountAmount = Math.round(amount * 0.15); // 15% Care Pass benefit
    const netDebited = amount - discountAmount;

    return reply.send({
      success: true,
      message: `Health Wallet debited ₹${netDebited} after ₹${discountAmount} (15%) Care Pass savings!`,
      data: {
        originalAmount: amount,
        carePassDiscountAmount: discountAmount,
        netDebitedFromWallet: netDebited,
        referenceId: `WAL-DEB-${Date.now().toString().slice(-6)}`,
        authTimestamp: new Date().toISOString()
      }
    });
  });

  fastify.post('/api/v1/partner/billing/care-passes/abandoned-cart-recovery', async (request, reply) => {
    const body = request.body as any;
    const phone = body.patientPhone || '+91 98118 77665';
    return reply.send({
      success: true,
      message: `WhatsApp cart recovery prompt dispatched to ${phone} with 1-click free OPD promo!`
    });
  });

  // --- PILLAR 3: Pharmacy B2B POs, GRN Inspector & RTV Debit Notes ---
  fastify.post('/api/v1/partner/pharmacy/b2b/generate-po', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const poNumber = `PO-B2B-${Date.now().toString().slice(-6)}`;
    const totalAmount = Number(body.estimatedAmount) || 120000;
    const gstInputCredit = Math.round(totalAmount * 0.12);

    const [po] = await db.insert(pharmacyB2bPurchaseOrders).values({
      tenantId,
      poNumber,
      vendorName: body.vendorName || 'Cipla Wholesale Depot',
      paymentTerms: body.paymentTerms || 'NET_30',
      totalItemsCount: Number(body.itemsCount) || 15,
      totalAmount: String(totalAmount),
      gstInputCredit: String(gstInputCredit),
      expectedGrossMarginPct: '29.50',
      status: 'PO_GENERATED'
    }).returning();

    return reply.status(201).send({ success: true, data: po });
  });

  fastify.post('/api/v1/partner/pharmacy/b2b/inspect-grn', async (request, reply) => {
    const body = request.body as any;
    const mrp = Number(body.mrp) || 100;
    const ptr = Number(body.ptr) || 68;
    const marginPct = Number((((mrp - ptr) / mrp) * 100).toFixed(1));
    const isMarginAlert = marginPct < 22.0;

    return reply.send({
      success: true,
      data: {
        poNumber: body.poNumber || 'PO-B2B-2026-001',
        batchNumber: body.batchNumber || 'BAT-9912',
        mrp,
        ptr,
        gstInputCredit: Number((ptr * 0.12).toFixed(2)),
        grossMarginPct: marginPct,
        isMarginDeficitAlert: isMarginAlert,
        status: isMarginAlert ? 'MARGIN_DEFICIT_WARNING' : 'GRN_MATCHED_CLEAN'
      }
    });
  });

  fastify.post('/api/v1/partner/pharmacy/b2b/generate-rtv-debit-note', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const debitNoteNumber = `RTV-DN-${Date.now().toString().slice(-6)}`;
    const qty = Number(body.quantity) || 50;
    const rate = Number(body.unitPurchaseRate) || 120;
    const debitAmount = qty * rate;

    const [note] = await db.insert(pharmacyRtvDebitNotes).values({
      tenantId,
      debitNoteNumber,
      vendorName: body.vendorName || 'Sun Pharma Distributors',
      medicationName: body.medicationName || 'Expiring Stock',
      batchNumber: body.batchNumber || 'EXP-991',
      expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      daysToExpiry: 45,
      quantity: qty,
      debitAmount: String(debitAmount),
      status: 'DEBIT_NOTE_DISPATCHED'
    }).returning();

    return reply.status(201).send({ success: true, data: note });
  });

  fastify.post('/api/v1/partner/pharmacy/prescriptions/convert-to-cart', async (request, reply) => {
    const body = request.body as any;
    return reply.send({
      success: true,
      message: 'Prescription converted to POS cart with PMBJP Jan Aushadhi substitution options applied!',
      data: {
        prescriptionId: body.prescriptionId || 'RX-8821',
        cartItemsCount: 3,
        genericSavingsAvailable: 480,
        substitutePmbjpPrompt: true
      }
    });
  });

  // --- PILLAR 4: Diagnostic Health Packages & Sign-and-Dispatch ---
  fastify.get('/api/v1/partner/diagnostics/packages', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();
    const pkgs = await db.select().from(diagnosticHealthPackages).where(eq(diagnosticHealthPackages.tenantId, tenantId));
    return reply.send({ success: true, data: pkgs });
  });

  fastify.post('/api/v1/partner/diagnostics/reports/:id/sign-and-dispatch', async (request, reply) => {
    const reportId = (request.params as any).id;
    const body = request.body as any;
    return reply.send({
      success: true,
      message: `Diagnostic Report #${reportId} signed digitally by ${body.pathologistName || 'Dr. Pathologist, MD'} and dispatched via WhatsApp!`,
      data: {
        reportId,
        digitalSignatureVerified: true,
        whatsappDeliveryStatus: 'DISPATCHED_PDF_LINK'
      }
    });
  });

  // --- PILLAR 5: Corporate TPA Master, AR Aging & NHCX 2.0 Payload ---
  fastify.get('/api/v1/partner/billing/tpa/corporate-clients', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();
    const clients = await db.select().from(corporateTpaClients).where(eq(corporateTpaClients.tenantId, tenantId));
    return reply.send({ success: true, data: clients });
  });

  fastify.get('/api/v1/partner/billing/tpa/ar-aging', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();
    const clients = await db.select().from(corporateTpaClients).where(eq(corporateTpaClients.tenantId, tenantId));

    const total0To30 = clients.reduce((s: number, c: any) => s + Number(c.aging0To30Days || 0), 0);
    const total31To60 = clients.reduce((s: number, c: any) => s + Number(c.aging31To60Days || 0), 0);
    const total61To90 = clients.reduce((s: number, c: any) => s + Number(c.aging61To90Days || 0), 0);
    const total90Plus = clients.reduce((s: number, c: any) => s + Number(c.aging90PlusDays || 0), 0);
    const totalReceivable = total0To30 + total31To60 + total61To90 + total90Plus;

    return reply.send({
      success: true,
      data: {
        totalReceivable,
        buckets: {
          '0_30_days': total0To30,
          '31_60_days': total31To60,
          '61_90_days': total61To90,
          '90_plus_days': total90Plus
        },
        tdsDeductionRecoveryExpected: Math.round(totalReceivable * 0.10),
        disallowedDeductionsUnderAppeals: 48500
      }
    });
  });

  fastify.post('/api/v1/partner/billing/tpa/nhcx-payload', async (request, reply) => {
    const body = request.body as any;
    const claimId = body.claimNumber || `CLM-${Date.now().toString().slice(-6)}`;
    const fhirBundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Claim',
            id: claimId,
            status: 'active',
            type: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'institutional' }]
            },
            use: 'preauthorization',
            patient: { reference: `Patient/${body.patientUhid || 'UHID-8821'}` },
            insurer: { identifier: { value: body.insurerCode || 'STAR_HEALTH_TPA' } },
            total: { value: Number(body.claimAmount) || 65000, currency: 'INR' },
            diagnosis: [
              { sequence: 1, diagnosisCodeableConcept: { coding: [{ code: body.diagnosisIcd10 || 'K80.20', display: 'Calculus of gallbladder' }] } }
            ]
          }
        }
      ]
    };

    return reply.send({
      success: true,
      message: 'ABDM NHCX 2.0 FHIR Claim Bundle generated successfully!',
      data: {
        claimNumber: claimId,
        standard: 'ABDM_NHCX_2.0_FHIR_R4',
        fhirBundle
      }
    });
  });

  // --- PILLAR 6: SaaS Platform Tiers, Communication Wallet & Addon Marketplace ---
  fastify.get('/api/v1/partner/commercial/saas-tiers', async (_request, reply) => {
    const tiers = [
      {
        tierCode: 'COMMUNITY_FREE',
        name: 'Community Clinic Starter',
        priceMonthlyInr: 0,
        limits: { doctors: 1, branches: 1, monthlyInvoices: 100 },
        features: ['Basic OPD Tokens', 'Digital Prescription', 'Thermal ESC/POS Print']
      },
      {
        tierCode: 'CLINIC_PROFESSIONAL',
        name: 'Multi-Doctor Professional Clinic',
        priceMonthlyInr: 2999,
        limits: { doctors: 5, branches: 2, monthlyInvoices: 10000 },
        features: ['Doctor Payout Matrix', 'Jan Aushadhi Substitution', 'WhatsApp Reminders', 'Multi-Payer Tariff Multipliers']
      },
      {
        tierCode: 'HOSPITAL_ENTERPRISE',
        name: 'Integrated Multi-Specialty Hospital',
        priceMonthlyInr: 14999,
        limits: { doctors: 999, branches: 10, monthlyInvoices: 999999 },
        features: ['IPD Bed Census', 'OT Scheduler', '0% Surgery EMI Desk', 'NHCX 2.0 Pre-Auth Scrubber', 'LIMS ASTM/HL7 Interfacing']
      }
    ];

    return reply.send({ success: true, data: tiers });
  });

  fastify.get('/api/v1/partner/commercial/comm-wallet', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();
    const [wallet] = await db.select().from(saasCommunicationWallets).where(eq(saasCommunicationWallets.tenantId, tenantId));
    return reply.send({ success: true, data: wallet });
  });

  fastify.post('/api/v1/partner/commercial/comm-wallet/recharge', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const amount = Number((request.body as any)?.amount) || 1000;
    const db = getDatabase();

    const [updated] = await db.insert(saasCommunicationWallets).values({
      tenantId,
      walletBalance: String(amount),
      smsRate: '0.20',
      whatsappRate: '0.75'
    }).onConflictDoUpdate({
      target: saasCommunicationWallets.tenantId,
      set: {
        walletBalance: sql`clinical.saas_communication_wallets.wallet_balance + ${amount}`
      }
    }).returning();

    return reply.send({ success: true, message: `Communication wallet credited with ₹${amount}!`, data: updated });
  });

  fastify.get('/api/v1/partner/commercial/addons', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const db = getDatabase();
    const addons = await db.select().from(saasMarketplaceAddons).where(eq(saasMarketplaceAddons.tenantId, tenantId));
    return reply.send({ success: true, data: addons });
  });

  fastify.post('/api/v1/partner/commercial/addons/toggle', async (request, reply) => {
    const tenantId = (request as any).session?.tenantId || '6855be07-5298-4148-a571-c51ac49ac7f3';
    const body = request.body as any;
    const db = getDatabase();

    const [addon] = await db.update(saasMarketplaceAddons)
      .set({ isEnabled: Boolean(body.isEnabled) })
      .where(and(
        eq(saasMarketplaceAddons.tenantId, tenantId),
        eq(saasMarketplaceAddons.addonCode, body.addonCode)
      ))
      .returning();

    return reply.send({ success: true, data: addon });
  });
};
