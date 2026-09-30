import fs from 'fs';
import path from 'path';

console.log('🧪 Starting Lab & Pharmacy Routing & Notification Verification...\n');

const doctorDeskPath = path.resolve('apps/partner-platform/src/components/views/DoctorExpressConsultationDesk.tsx');
const limsPathPath = path.resolve('apps/partner-platform/src/components/ClinicalInvestigationDomainManager.tsx');

const doctorDeskCode = fs.readFileSync(doctorDeskPath, 'utf8');
const limsCode = fs.readFileSync(limsPathPath, 'utf8');

let failed = false;

function check(title, condition) {
  if (condition) {
    console.log(`✅ PASS: ${title}`);
  } else {
    console.error(`❌ FAIL: ${title}`);
    failed = true;
  }
}

// 1. Check Pharmacy Routing state and radio options in DoctorExpressConsultationDesk
check(
  'DoctorExpressConsultationDesk declares pharmacyRouting state',
  doctorDeskCode.includes("const [pharmacyRouting, setPharmacyRouting] = useState<'IN_HOUSE_POS' | 'EXTERNAL_WHATSAPP'>('IN_HOUSE_POS')")
);

check(
  'DoctorExpressConsultationDesk renders Pharmacy Routing radio buttons (In-House POS & External/WhatsApp)',
  doctorDeskCode.includes('name="pharmacyRouting"') &&
  doctorDeskCode.includes('value="IN_HOUSE_POS"') &&
  doctorDeskCode.includes('value="EXTERNAL_WHATSAPP"') &&
  doctorDeskCode.includes('🏥 In-House Chemist POS') &&
  doctorDeskCode.includes('📱 External / WhatsApp e-Rx')
);

// 2. Check Lab Routing state and radio options in DoctorExpressConsultationDesk
check(
  'DoctorExpressConsultationDesk declares labRouting state',
  doctorDeskCode.includes("const [labRouting, setLabRouting] = useState<'IN_HOUSE' | 'EXTERNAL_PARTNER' | 'PATIENT_DIRECT_SLIP'>('IN_HOUSE')")
);

check(
  'DoctorExpressConsultationDesk renders Lab Routing radio buttons (In-House, External Partner, Patient Direct Slip)',
  doctorDeskCode.includes('name="labRouting"') &&
  doctorDeskCode.includes('value="IN_HOUSE"') &&
  doctorDeskCode.includes('value="EXTERNAL_PARTNER"') &&
  doctorDeskCode.includes('value="PATIENT_DIRECT_SLIP"') &&
  doctorDeskCode.includes('🏥 In-House Lab') &&
  doctorDeskCode.includes('🏢 External Partner Lab') &&
  doctorDeskCode.includes('📄 Patient Direct Slip')
);

// 3. Check Conditional Execution on Complete Consultation
check(
  'Pharmacy order is conditionally dispatched to Chemist POS only when IN_HOUSE_POS',
  doctorDeskCode.includes("if (pharmacyRouting === 'IN_HOUSE_POS')") &&
  doctorDeskCode.includes("hospitalEventBus.publish(\n        'RX_DISPENSED_TO_PHARMACY'")
);

check(
  'Lab order is conditionally dispatched only when not PATIENT_DIRECT_SLIP',
  doctorDeskCode.includes("if (labRouting !== 'PATIENT_DIRECT_SLIP')") &&
  doctorDeskCode.includes("status: labRouting === 'EXTERNAL_PARTNER' ? 'AWAITING_EXTERNAL_PICKUP' : 'PENDING_SAMPLE_COLLECTION'")
);

// 4. Check Lab Report Ready Real-Time Notification
check(
  'DoctorExpressConsultationDesk declares labReportAlert state and subscribes to LAB_REPORT_COMPLETED',
  doctorDeskCode.includes('const [labReportAlert, setLabReportAlert] = useState<') &&
  doctorDeskCode.includes("hospitalEventBus.subscribe('LAB_REPORT_COMPLETED'")
);

check(
  'DoctorExpressConsultationDesk renders Lab Report Ready alert banner with View Report action',
  doctorDeskCode.includes('Lab Report Ready for Patient {labReportAlert.patientName}') &&
  doctorDeskCode.includes('👁️ View Lab Report') &&
  doctorDeskCode.includes('setLabReportAlert(null)')
);

check(
  'ClinicalInvestigationDomainManager publishes LAB_REPORT_COMPLETED in handleVerifyResult and handleFinalizeReport',
  limsCode.includes("hospitalEventBus.publish(\n      'LAB_REPORT_COMPLETED',\n      'PathologyLims'") &&
  limsCode.includes('🔔 Lab Report Ready for Patient')
);

if (failed) {
  console.error('\n❌ Verification FAILED!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}
