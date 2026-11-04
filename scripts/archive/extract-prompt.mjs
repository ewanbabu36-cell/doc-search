import fs from 'node:fs';

const logPath = 'C:/Users/alamr/.gemini/antigravity/brain/892f07c8-c0bb-480f-a73b-ee5cfc4b62ea/.system_generated/logs/transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');
console.log('Total transcript lines:', lines.length);

for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i].trim();
  if (!line) continue;
  try {
    const d = JSON.parse(line);
    if (d.type === 'USER_INPUT') {
      console.log('Found USER_INPUT at step:', d.step_index);
      fs.writeFileSync('D:/DOC SEARCH/reports/category-15-prompt.txt', d.content, 'utf8');
      console.log('Prompt written, length:', d.content.length);
      break;
    }
  } catch (err) {
    // continue
  }
}
