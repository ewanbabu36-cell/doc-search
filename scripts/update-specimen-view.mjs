import fs from 'node:fs';

const filePath = 'apps/partner-platform/src/components/views/SpecimenCollectionView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Inside SpecimenCollectionView component:
const compHeader = 'export const SpecimenCollectionView: React.FC<SpecimenCollectionViewProps> = ({';
const stateAddition = `
  // Dynamic Vacutainer Tube Master from live Database API
  const [tubes, setTubes] = useState<VacutainerTubeConfig[]>(CRELIO_VACUTAINER_TUBES);

  React.useEffect(() => {
    fetch('/api/v1/laboratory/vacutainer-tubes')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setTubes(res.data);
        }
      })
      .catch((err) => console.warn('Failed to load vacutainer tubes:', err));
  }, []);
`;

const compIndex = content.indexOf(compHeader);
if (compIndex !== -1) {
  const firstState = content.indexOf('const [', compIndex);
  if (firstState !== -1) {
    content = content.slice(0, firstState) + stateAddition + '\n  ' + content.slice(firstState);
    console.log('Added tubes state and useEffect to SpecimenCollectionView');
  }
}

// Replace CRELIO_VACUTAINER_TUBES.map with tubes.map
content = content.replace('{CRELIO_VACUTAINER_TUBES.map((tube) => {', '{tubes.map((tube) => {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated SpecimenCollectionView.tsx');
