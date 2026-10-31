import fs from 'node:fs';

const filePath = 'apps/partner-platform/src/components/views/BedManagementView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace customWards initial state with dynamic initializer & useEffect
const oldWardStateRegex = /const \[customWards, setCustomWards\] = useState<Array<\{[\s\S]*?\}\>\>\(\[\s*\{[\s\S]*?\}\s*\]\);/;

const newWardState = `const [customWards, setCustomWards] = useState<Array<{
    id: string;
    wardName: string;
    wardType: string;
    floor: string;
    totalBeds: number;
    baseTariffInr: number;
    equipmentTags: string[];
  }>>(() => {
    if (wards && wards.length > 0) {
      return wards.map((w) => ({
        id: w.id,
        wardName: w.name,
        wardType: w.wardType || 'GENERAL',
        floor: w.floor || '1st Floor',
        totalBeds: w.totalBeds || 10,
        baseTariffInr: (w as any).baseTariffInr || 2500,
        equipmentTags: (w as any).equipmentTags || ['Central O2 Pipeline']
      }));
    }
    return [];
  });

  React.useEffect(() => {
    if (wards && wards.length > 0) {
      setCustomWards(wards.map((w) => ({
        id: w.id,
        wardName: w.name,
        wardType: w.wardType || 'GENERAL',
        floor: w.floor || '1st Floor',
        totalBeds: w.totalBeds || 10,
        baseTariffInr: (w as any).baseTariffInr || 2500,
        equipmentTags: (w as any).equipmentTags || ['Central O2 Pipeline']
      })));
    } else {
      fetch('/api/v1/partner/inpatient/wards')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setCustomWards(data.data.map((w: any) => ({
              id: w.id || w.ward_code,
              wardName: w.ward_name || w.name,
              wardType: w.ward_type || w.wardType || 'GENERAL',
              floor: w.floor || '1st Floor',
              totalBeds: w.total_beds || w.totalBeds || 10,
              baseTariffInr: w.base_tariff_inr || 2500,
              equipmentTags: w.equipment_tags || ['Central O2 Pipeline']
            })));
          }
        })
        .catch(console.warn);
    }
  }, [wards]);`;

if (oldWardStateRegex.test(content)) {
  content = content.replace(oldWardStateRegex, newWardState);
  console.log('Replaced customWards state');
} else {
  console.log('customWards state regex did not match');
}

// Replace otMaintenanceSchedules initial state with empty array
const oldOtRegex = /const \[otMaintenanceSchedules, setOtMaintenanceSchedules\] = useState<Array<\{[\s\S]*?\}\>\>\(\[\s*\{[\s\S]*?\}\s*\]\);/;
const newOtState = `const [otMaintenanceSchedules, setOtMaintenanceSchedules] = useState<Array<{
    id: string;
    roomName: string;
    roomType: 'OT' | 'CATH_LAB';
    maintenanceType: 'WEEKLY_FUMIGATION' | 'BIOMEDICAL_CALIBRATION' | 'HEPA_FILTER_AIR_CHANGE';
    scheduledDate: string;
    timeWindow: string;
    engineerName: string;
    infectionControlSignoff: boolean;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'CERTIFIED';
  }>>([]);`;

if (oldOtRegex.test(content)) {
  content = content.replace(oldOtRegex, newOtState);
  console.log('Replaced otMaintenanceSchedules state');
} else {
  console.log('otMaintenanceSchedules state regex did not match');
}

// Add clean empty state to customWards rendering
const oldWardRender = `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {customWards.map((w) => (`;

const newWardRender = `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {customWards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#0F172A', border: '1px dashed #334155', borderRadius: '12px', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏥</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                  No Inpatient Wards Found
                </div>
                <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 20px' }}>
                  Set up your facility wards, floors, and capacities to enable inpatient bed tracking.
                </p>
                <Button variant="primary" onClick={() => setIsAddWardModalOpen(true)}>
                  ➕ Register Inpatient Ward
                </Button>
              </div>
            ) : customWards.map((w) => (`;

if (content.includes(oldWardRender)) {
  content = content.replace(oldWardRender, newWardRender);
  console.log('Added empty state to customWards grid');
} else {
  console.log('customWards render target not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('BedManagementView.tsx successfully updated.');
