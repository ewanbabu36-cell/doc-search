import fs from 'node:fs';

const filePath = 'apps/patient-app/src/components/Tata1mgQuickOrderModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Insert medicine search bar before Prescription Medicines List
const targetList = `{/* Prescription Medicines List */}`;
const searchBar = `{/* Dynamic Medicine Search Bar */}
                  <div style={{ backgroundColor: '#1E293B', borderRadius: '14px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                      🔍 {isHindi ? 'दवा खोजें व कार्ट में जोड़ें' : 'Search & Add Medicines (500+ Formulary)'}
                    </div>
                    <input
                      type="text"
                      placeholder={isHindi ? 'दवा का नाम लिखें (जैसे Paracetamol, Metformin)...' : 'Search medicine name...'}
                      value={searchMedicineQuery}
                      onChange={(e) => handleSearchMedicines(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0B0F19',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#F8FAFC',
                        fontSize: '0.8125rem'
                      }}
                    />
                    {searchResults.length > 0 && (
                      <div style={{ marginTop: '8px', maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {searchResults.map((med) => (
                          <div
                            key={med.id}
                            onClick={() => handleAddMedicineToCart(med)}
                            style={{
                              padding: '8px 10px',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>{med.brandName}</div>
                              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{med.genericName}</div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800 }}>+ {isHindi ? 'जोड़ें' : 'Add'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>\n\n                  `;

if (content.includes(targetList) && !content.includes('Search & Add Medicines')) {
  content = content.replace(targetList, searchBar + targetList);
}

// In lab packages, show loading state if isLoadingPackages
const oldPackagesMap = `{labPackages.map((pkg) => {`;
const newPackagesMap = `{isLoadingPackages ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                      ⏳ {isHindi ? 'लाइव पैकेज लोड हो रहे हैं...' : 'Loading verified diagnostic packages from lab...'}
                    </div>
                  ) : labPackages.map((pkg) => {`;

if (content.includes(oldPackagesMap)) {
  content = content.replace(oldPackagesMap, newPackagesMap);
}

// Close the conditional for lab packages
const oldPkgEnd = `                      </div>\n                    );\n                  })}`;
const newPkgEnd = `                      </div>\n                    );\n                  }))}`;

if (content.includes(oldPkgEnd)) {
  content = content.replace(oldPkgEnd, newPkgEnd);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully wired search in Tata1mgQuickOrderModal.tsx');
