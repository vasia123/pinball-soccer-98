const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const logs=[]; page.on('console',m=>logs.push(m.text())); page.on('pageerror',e=>logs.push('ERR '+e.message));
  const shot = async (n) => { await page.screenshot({ path: `${outDir}/${n}.png` }); console.log('shot', n); };
  await page.goto('http://localhost:8899/boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true', { waitUntil:'domcontentloaded' });
  await page.waitForSelector('canvas');
  await page.uncheck('#pointerLock').catch(()=>{});
  await page.waitForTimeout(35000); await shot('g_00_menu');
  // активируем GO: клик по кнопке + Enter
  await page.mouse.click(428, 378); await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  console.log('GO activated');
  // периодические скриншоты, ищем фронтенд-меню/стол
  for (let i=1;i<=9;i++){ await page.waitForTimeout(7000); await shot('g_'+String(i).padStart(2,'0')); }
  console.log('=== log tail ==='); console.log(logs.slice(-12).join('\n'));
  await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
