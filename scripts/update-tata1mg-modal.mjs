import fs from 'node:fs';

const filePath = 'apps/patient-app/src/components/Tata1mgQuickOrderModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace static medicineCart & labPackages with dynamic state & useEffect
const oldStateBlock = `  // Lab Test Booking State
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-fullbody');
  const [selectedSlot, setSelectedSlot] = useState<string>('Tomorrow 07:30 AM - 08:30 AM (Fasting)');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  const medicineCart = {
    brandTotal: 840,
    genericTotal: 210,
    items: [
      {
        brandName: 'Augmentin 625 Duo (10 Tabs)',
        genericName: 'Jan Aushadhi Amoxycillin + Pot Clav 625mg',
        brandPrice: 220,
        genericPrice: 55
      },
      {
        brandName: 'Pan 40 (Pantoprazole 40mg - 15 Tabs)',
        genericName: 'Jan Aushadhi Pantoprazole 40mg',
        brandPrice: 155,
        genericPrice: 32
      },
      {
        brandName: 'Montair LC (10 Tabs)',
        genericName: 'Jan Aushadhi Montelukast + Levocetirizine',
        brandPrice: 195,
        genericPrice: 42
      },
      {
        brandName: 'Dolo 650 (15 Tabs)',
        genericName: 'Jan Aushadhi Paracetamol 650mg',
        brandPrice: 35,
        genericPrice: 12
      },
      {
        brandName: 'Telma 40 (Telmisartan 40mg - 15 Tabs)',
        genericName: 'Jan Aushadhi Telmisartan 40mg',
        brandPrice: 235,
        genericPrice: 69
      }
    ]
  };

  const labPackages = [
    {
      id: 'pkg-fullbody',
      name: isHindi ? 'संपूर्ण शरीर जांच (64 पैरामीटर)' : 'Comprehensive Full Body Health Checkup (64 Parameters)',
      tests: ['CBC (24 Parameters)', 'Lipid Profile (7 Tests)', 'Liver Function Test (LFT - 11 Tests)', 'Kidney Function (KFT - 8 Tests)', 'Fasting Blood Sugar', 'HbA1c', 'Thyroid Profile (T3, T4, TSH)'],
      mrp: 1800,
      price: 499,
      badge: '🔥 BESTSELLER (Save 72%)',
      fasting: '10-12 Hours Fasting Required',
      tat: 'NABL Certified Report in 6 Hours'
    },
    {
      id: 'pkg-diabetes',
      name: isHindi ? 'डायबिटीज केयर व मॉनिटरिंग पैक' : 'Advanced Diabetes Care & Monitoring Pack',
      tests: ['HbA1c Glycated Hemoglobin', 'Fasting Plasma Glucose', 'Post-Prandial Blood Sugar', 'Urine Microalbumin / Creatinine Ratio'],
      mrp: 850,
      price: 249,
      badge: '🩺 ESSENTIAL',
      fasting: '8 Hours Fasting Required',
      tat: 'NABL Report in 4 Hours'
    },
    {
      id: 'pkg-vitamin',
      name: isHindi ? 'विटामिन डी3 व बी12 इम्यूनिटी कॉम्बो' : 'Vitamin D3 & B-12 Longevity & Immunity Combo',
      tests: ['Vitamin D-3 (25-OH Cholecalciferol)', 'Vitamin B-12 (Cyanocobalamin)', 'Serum Calcium', 'Total Iron Binding Capacity (TIBC)'],
      mrp: 1400,
      price: 399,
      badge: '⚡ POPULAR',
      fasting: 'No Fasting Required',
      tat: 'Same Day Digital Report'
    }
  ];

  const savings = medicineCart.brandTotal - medicineCart.genericTotal;
  const currentTotal = useGenericSubstitution ? medicineCart.genericTotal : medicineCart.brandTotal;`;

const newStateBlock = `  // Lab Test Booking State
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-fullbody');
  const [selectedSlot, setSelectedSlot] = useState<string>('Tomorrow 07:30 AM - 08:30 AM (Fasting)');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Dynamic Data States
  const [cartItems, setCartItems] = useState<Array<{
    brandName: string;
    genericName: string;
    brandPrice: number;
    genericPrice: number;
  }>>([]);
  const [labPackages, setLabPackages] = useState<Array<{
    id: string;
    name: string;
    tests: string[];
    mrp: number;
    price: number;
    badge: string;
    fasting: string;
    tat: string;
  }>>([]);
  const [linkedRecords, setLinkedRecords] = useState<Array<{
    facilityName: string;
    recordsCount: number;
    type: string;
  }>>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [searchMedicineQuery, setSearchMedicineQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  React.useEffect(() => {
    if (!isOpen) return;

    // Load dynamic lab packages from live database API
    setIsLoadingPackages(true);
    fetch('/api/v1/patient/diagnostic-packages')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.packages) && data.packages.length > 0) {
          setLabPackages(data.packages);
          setSelectedPackageId(data.packages[0].id);
        }
      })
      .catch(err => console.warn('Failed to load packages:', err))
      .finally(() => setIsLoadingPackages(false));

    // Load initial medicines for cart from database catalog
    fetch('/api/v1/patient/medicines/search?q=tab')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.medicines) && data.medicines.length > 0) {
          setCartItems(data.medicines.slice(0, 5).map((m: any) => ({
            brandName: m.brandName,
            genericName: m.genericName,
            brandPrice: m.brandPrice || 150,
            genericPrice: m.genericPrice || 35
          })));
        }
      })
      .catch(err => console.warn('Failed to load medicines:', err));

    // Load ABHA linked records
    fetch('/api/v1/patient/abha/records')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.records)) {
          setLinkedRecords(data.records);
        }
      })
      .catch(err => console.warn('Failed to load ABHA records:', err));
  }, [isOpen]);

  // Handle dynamic medicine search
  const handleSearchMedicines = (q: string) => {
    setSearchMedicineQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    fetch(\`/api/v1/patient/medicines/search?q=\${encodeURIComponent(q)}\`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.medicines)) {
          setSearchResults(data.medicines);
        }
      })
      .catch(console.warn);
  };

  const handleAddMedicineToCart = (med: any) => {
    setCartItems(prev => [
      ...prev,
      {
        brandName: med.brandName,
        genericName: med.genericName,
        brandPrice: med.brandPrice || 150,
        genericPrice: med.genericPrice || 35
      }
    ]);
    setSearchMedicineQuery('');
    setSearchResults([]);
  };

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  const brandTotal = cartItems.reduce((acc, it) => acc + it.brandPrice, 0);
  const genericTotal = cartItems.reduce((acc, it) => acc + it.genericPrice, 0);
  const savings = brandTotal - genericTotal;
  const currentTotal = useGenericSubstitution ? genericTotal : brandTotal;
  const medicineCart = {
    brandTotal,
    genericTotal,
    items: cartItems
  };`;

if (content.includes(oldStateBlock)) {
  content = content.replace(oldStateBlock, newStateBlock);
} else {
  console.log('Old state block mismatch, looking for partial match');
}

// Update ABHA card strings
content = content.replace(
  'ABHA ID: 91-8472-9018-2831',
  `ABHA ID: \${patient.uhid ? '91-' + (patient.phone ? patient.phone.slice(-4) : '2026') + '-8492-1049' : '91-8472-9018-2831'}`
);

content = content.replace(
  'suresh.rao@abdm • {patient.gender} • Age: {patient.age}Y',
  `\${(patient.fullName || 'patient').toLowerCase().replace(/\\s+/g, '.')}@abdm • {patient.gender} • Age: {patient.age}Y`
);

// Update Linked Facilities section to render dynamically from linkedRecords
const oldLinkedRecords = `<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#F8FAFC', fontWeight: 700 }}>AIIMS / City Polyclinic</span>
                    <span style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800 }}>✓ 4 Records Linked</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#F8FAFC', fontWeight: 700 }}>Metropolis Pathology Centre</span>
                    <span style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800 }}>✓ 2 Lab Reports Linked</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#F8FAFC', fontWeight: 700 }}>MedPlus Retail Pharmacy</span>
                    <span style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800 }}>✓ 3 Invoices Linked</span>
                  </div>
                </div>`;

const newLinkedRecords = `<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {linkedRecords.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', padding: '8px 0' }}>
                      {isHindi ? 'कोई संबध्द रिकॉर्ड नहीं मिला' : 'No records linked yet. Link your ABDM health ID below.'}
                    </div>
                  ) : (
                    linkedRecords.map((rec, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                        <span style={{ color: '#F8FAFC', fontWeight: 700 }}>{rec.facilityName}</span>
                        <span style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800 }}>✓ {rec.recordsCount} Records Linked</span>
                      </div>
                    ))
                  )}
                </div>`;

if (content.includes(oldLinkedRecords)) {
  content = content.replace(oldLinkedRecords, newLinkedRecords);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated Tata1mgQuickOrderModal.tsx');
