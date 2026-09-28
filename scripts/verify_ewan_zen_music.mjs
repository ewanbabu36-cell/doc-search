import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n================================================================');
console.log('🧘 EWAN CALMNESS INSTRUMENTAL MUSIC & SOUNDSCAPE VERIFICATION');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

// 1. Audio Engine Check
console.log('--- 1. Checking EwanZenAudioEngine ---');
const audioEnginePath = path.join(rootDir, 'packages', 'ui-kit', 'src', 'components', 'ewan', 'EwanZenAudioEngine.ts');
assert(fs.existsSync(audioEnginePath), 'EwanZenAudioEngine.ts exists');
const audioEngineContent = fs.readFileSync(audioEnginePath, 'utf-8');

assert(audioEngineContent.includes('export const ewanZenAudio = new EwanZenAudioEngine()'), 'Exports singleton ewanZenAudio');
assert(audioEngineContent.includes('export const ZEN_SOUNDSCAPE_TRACKS'), 'Exports ZEN_SOUNDSCAPE_TRACKS');
assert(audioEngineContent.includes('zen-sanctuary'), 'Includes Track: HQ Zen Sanctuary');
assert(audioEngineContent.includes('deep-focus'), 'Includes Track: Deep Focus Serenity');
assert(audioEngineContent.includes('midnight-rain'), 'Includes Track: Midnight Rain & Soft Keys');
assert(audioEngineContent.includes('432hz-ethereal'), 'Includes Track: 432Hz Ethereal Healing');
assert(audioEngineContent.includes('renderWarmPadChord'), 'Includes warm analog pad chord synthesizer');
assert(audioEngineContent.includes('playSingingBowl'), 'Includes Tibetan singing bowl overtone synthesizer');
assert(audioEngineContent.includes('startRain'), 'Includes pink noise rain texture synthesizer');
assert(audioEngineContent.includes('docsearch:ewan_zen_music_state'), 'Dispatches global state synchronization events');

// 2. Music Widget Check
console.log('\n--- 2. Checking EwanZenMusicWidget ---');
const musicWidgetPath = path.join(rootDir, 'packages', 'ui-kit', 'src', 'components', 'ewan', 'EwanZenMusicWidget.tsx');
assert(fs.existsSync(musicWidgetPath), 'EwanZenMusicWidget.tsx exists');
const musicWidgetContent = fs.readFileSync(musicWidgetPath, 'utf-8');

assert(musicWidgetContent.includes('export const EwanZenMusicWidget'), 'Exports EwanZenMusicWidget component');
assert(musicWidgetContent.includes('variant === \'header-button\''), 'Supports header-button variant for EWAN window');
assert(musicWidgetContent.includes('variant = \'floating-dock\''), 'Supports floating-dock variant beside EWAN orb/pill');
assert(musicWidgetContent.includes('EWAN Zen Audio Studio'), 'Renders EWAN Zen Audio Studio HUD');
assert(musicWidgetContent.includes('Playing Slowly in Background'), 'Displays soft background playback status');
assert(musicWidgetContent.includes('HQ Background Volume:'), 'Provides soft background volume slider');

// 3. EwanSystemTrainer Integration Check
console.log('\n--- 3. Checking Integration in EwanSystemTrainer ---');
const systemTrainerPath = path.join(rootDir, 'packages', 'ui-kit', 'src', 'components', 'ewan', 'EwanSystemTrainer.tsx');
const systemTrainerContent = fs.readFileSync(systemTrainerPath, 'utf-8');

assert(systemTrainerContent.includes("import { EwanZenMusicWidget } from './EwanZenMusicWidget.js'"), 'Imports EwanZenMusicWidget');
assert(systemTrainerContent.includes('<EwanZenMusicWidget variant="floating-dock" />'), 'Renders EwanZenMusicWidget beside floating avatar dock');
assert(systemTrainerContent.includes('<EwanZenMusicWidget variant="header-button" />'), 'Renders EwanZenMusicWidget in window controls header');

// 4. Index Exports Check
console.log('\n--- 4. Checking packages/ui-kit/src/components/ewan/index.ts ---');
const indexPath = path.join(rootDir, 'packages', 'ui-kit', 'src', 'components', 'ewan', 'index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

assert(indexContent.includes("export * from './EwanZenAudioEngine.js'"), 'Exports EwanZenAudioEngine in index.ts');
assert(indexContent.includes("export * from './EwanZenMusicWidget.js'"), 'Exports EwanZenMusicWidget in index.ts');

console.log('\n================================================================');
console.log(`📊 FINAL RESULT: ${passCount} / ${passCount + failCount} TESTS PASSED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
