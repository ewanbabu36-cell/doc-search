import fs from 'node:fs';

const file = 'apps/company-platform/src/components/billing/SubscriptionCustomizerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' \}\}>\s*\{modulesList\.map\(\(mod\) => \(/;

if (regex.test(content)) {
  const replacement = `<div style={{ display: 'grid', gridTemplateColumns: modulesList.length === 0 ? '1fr' : '1fr 1fr', gap: '10px' }}>
                  {modulesList.length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94A3B8', border: '1px dashed #334155', borderRadius: '12px' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🧩</div>
                      <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: '4px' }}>No Subscription Modules Attached</strong>
                      <span style={{ fontSize: '0.75rem', display: 'block' }}>Use "+ Add Custom Module" below to configure specialized hospital add-ons.</span>
                    </div>
                  ) : (
                    modulesList.map((mod) => (`;
  content = content.replace(regex, replacement);
  // and close the ternary
  const closeRegex = /(\s*<\/div>\s*<\/div>\s*\)\)\}\s*<\/div>)/;
  content = content.replace(closeRegex, '\n                      </div>\n                    </div>\n                  ))\n                )}\n                </div>');
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS');
} else {
  console.log('REGEX DID NOT MATCH');
}
