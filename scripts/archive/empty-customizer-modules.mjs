import fs from 'node:fs';

const file = 'apps/company-platform/src/components/billing/SubscriptionCustomizerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /const INITIAL_DEFAULT_MODULES:\s*CustomizerModuleItem\[\]\s*=\s*\[[\s\S]*?\n\];/;
if (targetRegex.test(content)) {
  content = content.replace(targetRegex, 'const INITIAL_DEFAULT_MODULES: CustomizerModuleItem[] = [];');
  console.log('MATCHED AND REPLACED INITIAL_DEFAULT_MODULES');
} else {
  console.log('REGEX DID NOT MATCH');
}

// Also add empty state in modules grid
const gridTarget = `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {modulesList.map((mod) => (`;
const gridReplacement = `<div style={{ display: 'grid', gridTemplateColumns: modulesList.length === 0 ? '1fr' : '1fr 1fr', gap: '10px' }}>
                  {modulesList.length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94A3B8', border: '1px dashed #334155', borderRadius: '12px' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🧩</div>
                      <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: '4px' }}>No Subscription Modules Attached</strong>
                      <span style={{ fontSize: '0.75rem', display: 'block' }}>Use "+ Add Custom Module" below to configure specialized hospital add-ons.</span>
                    </div>
                  ) : (
                    modulesList.map((mod) => (`;

if (content.includes(gridTarget)) {
  content = content.replace(gridTarget, gridReplacement);
  // close ternary before </div>\s*</div>\s*\)}
  const closeTarget = `</div>
                    </div>
                  ))}
                </div>`;
  const closeReplacement = `</div>
                    </div>
                  ))
                )}
                </div>`;
  content = content.replace(closeTarget, closeReplacement);
  console.log('MATCHED AND REPLACED MODULES GRID');
} else {
  console.log('GRID TARGET NOT FOUND');
}

fs.writeFileSync(file, content, 'utf8');
