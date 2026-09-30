import { runBrowserScenario, VIEWPORTS } from './category-5-cdp-helpers.mjs';

async function main() {
  console.log('[*] Checking localStorage and forcing clean position...');

  const res = await runBrowserScenario({
    url: 'http://localhost:5175',
    viewport: VIEWPORTS.desktop_1080,
    scenarioName: 'ewan_debug_modal',
    preEvalAction: `
      (async function() {
        console.log('Stored position:', localStorage.getItem('docsearch_ewan_position'));
        localStorage.removeItem('docsearch_ewan_position');
        
        await new Promise(r => setTimeout(r, 500));
        // Dismiss banner
        const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Skip') || b.textContent.includes('No thanks'));
        if (skipBtn) skipBtn.click();
        await new Promise(r => setTimeout(r, 400));

        // Click the launcher orb directly
        const orb = document.querySelector('[title*="EWAN Assistant"]');
        console.log('Orb found:', !!orb);
        if (orb) {
          orb.click();
        }
        await new Promise(r => setTimeout(r, 1000));
        const modal = document.querySelector('[title*="EWAN"]');
        console.log('Modal visible in DOM:', document.body.innerHTML.includes('EWAN Assistant'));
      })()
    `
  });

  console.log('Console errors:', res.consoleErrors);
  console.log('DOM:', res.dom);
}

main().catch(console.error);
