// Интерактив: снять pointerLock, кликнуть GO по абсолютным координатам страницы, войти в игру.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const url = process.argv[2] || 'http://localhost:8899/boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true';
  const menuWait = parseInt(process.argv[3] || '35', 10);
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  const shot = async (n) => { await page.screenshot({ path: `${outDir}/${n}.png` }); console.log('shot', n); };

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });

  // снять pointer lock, чтобы курсор/клики работали как в обычном окне
  try { await page.uncheck('#pointerLock', { timeout: 3000 }); console.log('pointerLock unchecked'); } catch(e){ console.log('uncheck err', e.message); }

  await page.waitForTimeout(menuWait * 1000);
  await shot('p2_00_menu');

  // GO ~ page(428,378)
  await page.mouse.move(428, 378); await page.waitForTimeout(300);
  await page.mouse.click(428, 378);
  console.log('clicked GO (428,378)');
  await page.waitForTimeout(18000);
  await shot('p2_01_afterGO');
  await page.waitForTimeout(12000);
  await shot('p2_02_afterGO2');

  console.log('\n=== CONSOLE tail ===');
  console.log(logs.slice(-20).join('\n'));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
