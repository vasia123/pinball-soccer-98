// Интерактивный тест: грузит игру, кликает по canvas (GO), жмёт клавиши, снимает скриншоты.
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.argv[2] || 'http://localhost:8899/boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true';
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const canvas = await page.waitForSelector('canvas', { timeout: 30000 });
  const shot = async (name) => { await page.screenshot({ path: `${outDir}/${name}.png` }); console.log('shot', name); };

  // ждём загрузки меню
  await page.waitForTimeout(50000);
  await shot('play_00_menu');

  // Клик по кнопке GO (в координатах canvas). Game 800x600. GO ~ (428,378).
  const box = await canvas.boundingBox();
  console.log('canvas box', JSON.stringify(box));
  const cx = (gx, gy) => ({ x: box.x + gx * (box.width/800), y: box.y + gy * (box.height/600) });

  // На всякий: сначала клик по флагу UK (центр), затем GO
  let p = cx(428, 378);
  await page.mouse.click(p.x, p.y);
  console.log('clicked GO at', JSON.stringify(p));
  await page.waitForTimeout(15000);
  await shot('play_01_afterGO');

  // Возможные действия для старта игры: Enter, Space, "1" (start), клики
  for (const key of ['Enter','Space','1','5']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(6000);
    await shot(`play_key_${key}`);
  }

  // Клик по центру на случай "нажмите чтобы начать"
  p = cx(400, 300); await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(8000);
  await shot('play_02_center');

  console.log('\n=== CONSOLE tail ===');
  console.log(logs.slice(-30).join('\n'));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
