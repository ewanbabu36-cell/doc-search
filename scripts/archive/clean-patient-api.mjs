import fs from 'node:fs';

const filePath = 'apps/patient-app/src/services/patient-api.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Empty out CANONICAL_DEMO_FAMILY and DEMO_ arrays
content = content.replace(
  /export const CANONICAL_DEMO_FAMILY: PatientProfile\[\] = \[\s*\{[\s\S]*?\}\s*\];/,
  'export const CANONICAL_DEMO_FAMILY: PatientProfile[] = [];'
);

// 2. Fix requestOtp fallback
content = content.replace(
  /return \{\s*success: true,\s*message: 'Demo OTP: 1234 \(Enter to continue\)',[\s\S]*?devOtp: '1234'\s*\};/,
  `return {
      success: false,
      message: 'Could not contact healthcare gateway. Please check your network connection.',
      isRegistered: false,
      multiplePatients: false,
      patientCount: 0,
      registeredName: null,
      patientMrn: null,
      patients: [],
      devOtp: ''
    };`
);

// 3. Fix verifyOtp fallback
content = content.replace(
  /if \(phone === '9876543210' && !options\?\.selectedPatientId\) \{[\s\S]*?return \{\s*success: true,\s*multiplePatients: false,\s*patient: this\.currentPatient\s*\};/g,
  `return {
      success: false,
      message: 'Verification failed. Please enter the valid OTP received on your mobile.',
      multiplePatients: false
    };`
);

// 4. Fix getFamilyMembers fallback
content = content.replace(
  'return CANONICAL_DEMO_FAMILY;',
  'return [];'
);

// 5. Fix addFamilyMember fallback
content = content.replace(
  /const fallback: PatientProfile = \{\s*id: `pat-fam-\$\{Date\.now\(\)\}`,[\s\S]*?return fallback;/,
  'return null;'
);

// 6. Fix getPrescriptions fallback
content = content.replace(
  /if \(!targetPhone\) return DEMO_PRESCRIPTIONS;[\s\S]*?return DEMO_PRESCRIPTIONS;/g,
  `if (!targetPhone) return [];
    try {
      const res = await fetch(\`/api/v1/patient/prescriptions?phone=\${encodeURIComponent(targetPhone)}\`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.prescriptions)) {
          return data.prescriptions;
        }
      }
    } catch (err) {
      console.warn('Prescriptions fetch failed:', err);
    }
    return [];`
);

// 7. Fix getLabReports fallback
content = content.replace(
  /if \(!targetPhone\) return DEMO_LAB_REPORTS;[\s\S]*?return DEMO_LAB_REPORTS;/g,
  `if (!targetPhone) return [];
    try {
      const res = await fetch(\`/api/v1/patient/lab-reports?phone=\${encodeURIComponent(targetPhone)}\`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reports)) {
          return data.reports;
        }
      }
    } catch (err) {
      console.warn('Lab reports fetch failed:', err);
    }
    return [];`
);

// 8. Fix getMedicationSchedule fallback
content = content.replace(
  /async getMedicationSchedule\(phone\?: string\): Promise<MedicationScheduleResponse> \{[\s\S]*?return \{\s*success: true,\s*patientName: this\.currentPatient\?\.fullName[\s\S]*?\};\s*\}/,
  `async getMedicationSchedule(phone?: string): Promise<MedicationScheduleResponse> {
    const targetPhone = phone || this.currentPatient?.phone;
    const emptyResponse: MedicationScheduleResponse = {
      success: true,
      patientName: this.currentPatient?.fullName || '',
      doctorName: '',
      prescriptionId: '',
      prescribedDate: '',
      diagnosis: '',
      adherenceScore: 100,
      streakDays: 0,
      caregiverAlertContact: '',
      scheduledDoses: [],
      nextDueDose: null
    };

    if (!targetPhone) return emptyResponse;

    try {
      const res = await fetch(\`/api/v1/patient/medications/schedule?phone=\${encodeURIComponent(targetPhone)}\`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.scheduledDoses)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Medication schedule API offline:', err);
    }

    return emptyResponse;
  }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully cleaned patient-api.ts');
