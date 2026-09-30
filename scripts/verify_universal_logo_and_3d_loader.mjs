import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

console.log('\n================================================================');
console.log('🧪 DOC SEARCH UNIVERSAL LOGO, 3D LOADER & 6 ADVANCEMENTS SUITE');
console.log('================================================================\n');

// 1. UI-Kit Canonical Components & 6 Advancements
console.log('--- 1. Checking UI-Kit Component Definitions & 6 Advancements ---');
const logoPath = path.join(rootDir, 'packages/ui-kit/src/components/primitives/DocSearchLogo.tsx');
assert(fs.existsSync(logoPath), 'DocSearchLogo.tsx exists in @docsearch/ui-kit');
const logoContent = fs.readFileSync(logoPath, 'utf8');
assert(logoContent.includes('export const DocSearchLogo'), 'DocSearchLogo is exported');
assert(logoContent.includes('dsMedicalGrad') && logoContent.includes('dsNeonGlow'), 'DocSearchLogo includes cyber-medical SVG gradients and neon glow');
assert(logoContent.includes('clickable') && logoContent.includes('redirectUrl'), 'DocSearchLogo supports clickable and redirectUrl props');

// 6 Advancements checks
assert(logoContent.includes('perspective(600px)') && logoContent.includes('handleMouseMove') && logoContent.includes('glassReflection'), 'Advancement 1: Magnetic 3D Cursor Tilt & Specular Glass Highlight implemented');
assert(logoContent.includes('docsearch:clinical_pulse') && logoContent.includes('dsSonarRadar'), 'Advancement 2: Living Biometric Heartbeat Event Pulse implemented');
assert(logoContent.includes('showTelemetry') && logoContent.includes('DOC SEARCH TELEMETRY') && logoContent.includes('isHudOpen'), 'Advancement 3: Live System Telemetry Beacon & Floating Health HUD implemented');
assert(logoContent.includes('accentColor') && logoContent.includes('primaryCyan'), 'Advancement 4: Theme-Adaptive Bioluminescence implemented');
assert(logoContent.includes('isOnline') && logoContent.includes('OFFLINE VAULT'), 'Advancement 5: Smart Offline Mode Shield Hologram implemented in DocSearchLogo');
assert(logoContent.includes('handleDoubleClick') && logoContent.includes('docsearch:open_command_palette'), 'Advancement 6: Fast Quick-Action Command HUD on Double Click implemented');

const loaderPath = path.join(rootDir, 'packages/ui-kit/src/components/effects/DocSearch3DLogoLoader.tsx');
assert(fs.existsSync(loaderPath), 'DocSearch3DLogoLoader.tsx exists in @docsearch/ui-kit');
const loaderContent = fs.readFileSync(loaderPath, 'utf8');
assert(loaderContent.includes('export const DocSearch3DLogoLoader'), 'DocSearch3DLogoLoader is exported');
assert(loaderContent.includes('dsRotateGyroOuter') && loaderContent.includes('dsLevitate3D'), 'DocSearch3DLogoLoader has 3D gyroscopic rotation & levitation animations');
assert(loaderContent.includes('slow_network') && (loaderContent.includes('nav.connection') || loaderContent.includes('navigator.connection')), 'DocSearch3DLogoLoader has slow internet / low bandwidth detection');
assert(loaderContent.includes('offline') && loaderContent.includes('OFFLINE CLINICAL VAULT ACTIVE'), 'DocSearch3DLogoLoader has Smart Offline Mode Shield Hologram');

// 2. Landing Page
console.log('\n--- 2. Checking Landing Page Branding & Redirection ---');
const landingPath = path.join(rootDir, 'apps/landing-page/src/components/DocSearchLandingPage.tsx');
const landingContent = fs.readFileSync(landingPath, 'utf8');
assert(landingContent.includes('<DocSearchLogo') && landingContent.includes('badgeText="ENTERPRISE OS"'), 'Navbar in DocSearchLandingPage uses DocSearchLogo with ENTERPRISE OS badge');
assert(landingContent.includes('window.scrollTo({ top: 0, behavior: \'smooth\' })'), 'Navbar and Footer logos redirect/scroll smoothly to top on click');

const fullRegPath = path.join(rootDir, 'apps/landing-page/src/components/FullPageRegistrationView.tsx');
const fullRegContent = fs.readFileSync(fullRegPath, 'utf8');
assert(fullRegContent.includes('<DocSearchLogo') && fullRegContent.includes('badgeText="ONBOARDING DESK"'), 'FullPageRegistrationView uses DocSearchLogo with ONBOARDING DESK badge');
assert(fullRegContent.includes('onClick={onBackToHome}'), 'FullPageRegistrationView logo triggers back to home on click');

const loginModalPath = path.join(rootDir, 'apps/landing-page/src/components/UnifiedHealthcareLoginModal.tsx');
const loginModalContent = fs.readFileSync(loginModalPath, 'utf8');
assert(loginModalContent.includes('<DocSearchLogo') && loginModalContent.includes('badgeText="HEALTHCARE SSO"'), 'UnifiedHealthcareLoginModal uses DocSearchLogo');
assert(loginModalContent.includes('<DocSearch3DLogoLoader mode="login"'), 'UnifiedHealthcareLoginModal uses DocSearch3DLogoLoader during authentication');

// 3. Partner Platform
console.log('\n--- 3. Checking Partner Platform Branding & 3D Loader ---');
const partnerBrandPath = path.join(rootDir, 'apps/partner-platform/src/components/common/DocSearchResponsiveBrand.tsx');
const partnerBrandContent = fs.readFileSync(partnerBrandPath, 'utf8');
assert(partnerBrandContent.includes('<DocSearchLogo'), 'DocSearchResponsiveBrand renders canonical DocSearchLogo');
assert(partnerBrandContent.includes("redirectUrl=\"/\"") && partnerBrandContent.includes("window.location.href = '/'"), 'Partner brand redirects to / on click');

const partnerLoginPath = path.join(rootDir, 'apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx');
const partnerLoginContent = fs.readFileSync(partnerLoginPath, 'utf8');
assert(partnerLoginContent.includes('<DocSearchLogo') && partnerLoginContent.includes('variant="hero"'), 'HospitalStaffLogin renders DocSearchLogo variant="hero"');
assert(partnerLoginContent.includes('<DocSearch3DLogoLoader mode="login"'), 'HospitalStaffLogin renders DocSearch3DLogoLoader during credential verification');

const partnerShellPath = path.join(rootDir, 'apps/partner-platform/src/components/PartnerPlatformShell.tsx');
const partnerShellContent = fs.readFileSync(partnerShellPath, 'utf8');
assert(partnerShellContent.includes('<DocSearch3DLogoLoader mode="download"'), 'PartnerPlatformShell renders DocSearch3DLogoLoader for Suspense module loading');

// 4. Company Platform
console.log('\n--- 4. Checking Company Platform Branding & 3D Loader ---');
const companyShellPath = path.join(rootDir, 'apps/company-platform/src/components/CompanyShell.tsx');
const companyShellContent = fs.readFileSync(companyShellPath, 'utf8');
assert(companyShellContent.includes('<DocSearchLogo') && companyShellContent.includes('COMPANY HQ'), 'CompanyShell renders DocSearchLogo in sidebar brand');
assert(companyShellContent.includes("redirectUrl=\"/\""), 'CompanyShell logo redirects to / on click');

const founderLoginPath = path.join(rootDir, 'apps/company-platform/src/components/auth/FounderLogin.tsx');
const founderLoginContent = fs.readFileSync(founderLoginPath, 'utf8');
assert(founderLoginContent.includes('<DocSearchLogo') && founderLoginContent.includes('variant="hero"'), 'FounderLogin renders DocSearchLogo variant="hero"');
assert(founderLoginContent.includes('<DocSearch3DLogoLoader mode="login"'), 'FounderLogin renders DocSearch3DLogoLoader during authentication');

// Summary
console.log('\n================================================================');
console.log(`📊 FINAL RESULT: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
