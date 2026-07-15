// Тест-харнесс: грузит BoxedWine в headless-браузере, снимает скриншоты, собирает ошибки.
// Использование: node run.js "<url>" <секунд_ожидания> <префикс_скриншота>
const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:8899/boxedwine.html?app=ski32&p=ski32.exe';
  const waitSec = parseInt(process.argv[3] || '25', 10);
  const prefix = process.argv[4] || 'shot';
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  require('fs').mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

  console.log('NAV', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Пытаемся нажать возможную кнопку Start/Play, если есть
  for (const sel of ['#start', 'button#start', 'text=Start', 'text=Play', 'text=Click to start']) {
    try {
      const el = await page.$(sel);
      if (el) { await el.click({ timeout: 1000 }); console.log('clicked', sel); break; }
    } catch (_) {}
  }

  for (let i = 1; i <= waitSec; i += 4) {
    await page.waitForTimeout(4000);
    const p = `${outDir}/${prefix}_${String(i).padStart(3,'0')}s.png`;
    await page.screenshot({ path: p });
    console.log('shot', p);
  }

  console.log('\n===== CONSOLE (' + logs.length + ') =====');
  console.log(logs.slice(-60).join('\n'));

  // Диагностика canvas: непустой ли он
  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return { canvas: false };
    return { canvas: true, w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight };
  });
  console.log('CANVAS', JSON.stringify(canvasInfo));

  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
