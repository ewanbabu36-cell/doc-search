import fs from 'fs';

const content = fs.readFileSync('apps/landing-page/src/components/FullPageRegistrationView.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onSubmit') || lines[i].includes('isSubmitting =') || lines[i].includes('setIsSubmitting(true)')) {
    console.log(`Line ${i + 1}:`);
    for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 35); j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
    console.log('---');
  }
}
