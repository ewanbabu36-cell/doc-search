import fs from 'node:fs';

const filePath = 'apps/partner-platform/src/components/views/PathologistTargetCockpitView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the massive TARGET_SPECIMENS array definition (lines 69 to 723)
const startMarker = 'export const TARGET_SPECIMENS: RichSpecimenRecord[] = [';
const endMarker = 'export interface PathologistTargetCockpitViewProps {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) +
    'export const TARGET_SPECIMENS: RichSpecimenRecord[] = [];\n\n' +
    content.slice(endIndex);
  console.log('Replaced massive TARGET_SPECIMENS array with empty export');
} else {
  console.error('Could not locate TARGET_SPECIMENS definition bounds');
}

// 2. Add specimens prop to PathologistTargetCockpitViewProps
content = content.replace(
  'export interface PathologistTargetCockpitViewProps {\n  facilityName?: string;',
  'export interface PathologistTargetCockpitViewProps {\n  specimens?: RichSpecimenRecord[];\n  facilityName?: string;'
);

// 3. Destructure specimens in component
content = content.replace(
  'export const PathologistTargetCockpitView: React.FC<PathologistTargetCockpitViewProps> = ({\n  facilityName =',
  'export const PathologistTargetCockpitView: React.FC<PathologistTargetCockpitViewProps> = ({\n  specimens,\n  facilityName ='
);

// 4. Add liveSpecimens state and useEffect
const emptySpecimenDef = `
const EMPTY_SPECIMEN: RichSpecimenRecord = {
  id: '',
  orderNumber: '',
  accessionNumber: 'NO SPECIMEN SELECTED',
  barcode: '',
  patientId: '',
  patientName: 'No Specimen Selected',
  patientMrn: '',
  patientAge: '',
  patientGender: 'OTHER',
  department: 'BIOCHEMISTRY',
  filterCategory: 'ROUTINE',
  priority: 'ROUTINE',
  isCritical: false,
  status: 'SAMPLE_COLLECTED',
  statusLabel: 'NO ACTIVE SPECIMENS',
  orderingDoctorName: '',
  wardOrLocation: '',
  specimenType: '',
  tubeType: '',
  collectionTime: '',
  intakeTime: '',
  analyzerMachine: '',
  clinicalHistory: '',
  parameters: [],
  deltaCheck: { biomarker: '', unit: '', alertMessage: '', isViolation: false, visits: [] },
  auditHistory: [],
  pathologistImpression: '',
  reflexOptions: []
};
`;

const stateAddition = `
  // Dynamic Specimens State from props or live Database API
  const [liveSpecimens, setLiveSpecimens] = useState<RichSpecimenRecord[]>(specimens || []);

  React.useEffect(() => {
    if (specimens && specimens.length > 0) {
      setLiveSpecimens(specimens);
    } else {
      fetch('/api/v1/laboratory/specimens/cockpit')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setLiveSpecimens(res.data);
            setSelectedSpecimenId(res.data[0].id);
          }
        })
        .catch((err) => console.warn('Failed to load cockpit specimens:', err));
    }
  }, [specimens]);
`;

// Insert empty specimen definition before component
content = content.replace(
  'export const PathologistTargetCockpitView: React.FC<PathologistTargetCockpitViewProps>',
  emptySpecimenDef + '\nexport const PathologistTargetCockpitView: React.FC<PathologistTargetCockpitViewProps>'
);

// Insert liveSpecimens state after setSelectedSpecimenId
content = content.replace(
  "const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>('SPEC-90414');",
  "const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>('');\n" + stateAddition
);

// 5. Replace TARGET_SPECIMENS references in component
content = content.replace(/TARGET_SPECIMENS\.filter/g, 'liveSpecimens.filter');
content = content.replace('TARGET_SPECIMENS.find((s) => s.id === selectedSpecimenId)', 'liveSpecimens.find((s) => s.id === selectedSpecimenId)');
content = content.replace('return TARGET_SPECIMENS[0]!;', 'return liveSpecimens[0] || EMPTY_SPECIMEN;');
content = content.replace('ALL: TARGET_SPECIMENS.length,', 'ALL: liveSpecimens.length,');
content = content.replace('onOpenRejectModal(TARGET_SPECIMENS[0]!)', 'onOpenRejectModal(activeSpecimen)');
content = content.replace('onOpenPanicModal(TARGET_SPECIMENS[0]!)', 'onOpenPanicModal(activeSpecimen)');

// 6. Update deptCounts dependency array
content = content.replace('}, []);', '}, [liveSpecimens]);');

fs.writeFileSync(filePath, content, 'utf8');
console.log('PathologistTargetCockpitView.tsx updated successfully.');
