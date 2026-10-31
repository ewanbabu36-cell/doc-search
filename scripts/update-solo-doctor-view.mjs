import fs from 'node:fs';

const filePath = 'apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the static CLINICAL_COCKPIT_TEMPLATES array definition
const startMarker = 'const CLINICAL_COCKPIT_TEMPLATES: ClinicalTemplatePreset[] = [';
const endMarker = 'export const POPULAR_INVESTIGATION_PILLS = [';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) +
    'export const CLINICAL_COCKPIT_TEMPLATES: ClinicalTemplatePreset[] = [];\n\n' +
    content.slice(endIndex);
  console.log('Replaced CLINICAL_COCKPIT_TEMPLATES array with empty export');
} else {
  console.error('Could not locate CLINICAL_COCKPIT_TEMPLATES definition bounds');
}

// 2. Add state and useEffect inside SoloDoctorOpdCockpitView
const componentDef = 'export const SoloDoctorOpdCockpitView: React.FC<SoloDoctorOpdCockpitViewProps> = ({';
const stateAddition = `
  // Dynamic Clinical Templates loaded from live Database API
  const [cockpitTemplates, setCockpitTemplates] = useState<ClinicalTemplatePreset[]>([]);

  React.useEffect(() => {
    fetch('/api/v1/clinical/prescription-templates')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCockpitTemplates(res.data);
        }
      })
      .catch((err) => console.warn('Failed to load clinical templates:', err));
  }, []);
`;

const compIndex = content.indexOf(componentDef);
if (compIndex !== -1) {
  // Find opening brace after props destructuring
  const bodyStart = content.indexOf('{', compIndex + componentDef.length);
  // Find where component body starts
  const firstState = content.indexOf('const [', bodyStart);
  if (firstState !== -1) {
    content = content.slice(0, firstState) + stateAddition + '\n  ' + content.slice(firstState);
    console.log('Added cockpitTemplates state and useEffect');
  }
}

// 3. Replace CLINICAL_COCKPIT_TEMPLATES usages with cockpitTemplates
content = content.replace('CLINICAL_COCKPIT_TEMPLATES.forEach((tmpl) => {', 'cockpitTemplates.forEach((tmpl) => {');
content = content.replace('{CLINICAL_COCKPIT_TEMPLATES.map((tmpl) => (', '{cockpitTemplates.map((tmpl) => (');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated SoloDoctorOpdCockpitView.tsx');
