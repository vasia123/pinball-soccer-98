const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('console', m => { if(/err|fail|exec|load|CGO|Show/i.test(m.text())) {} });
  const shot = async (n) => { await page.screenshot({ path: `${outDir}/${n}.png` }); console.log('shot', n); };
  await page.goto('http://localhost:8899/boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true', { waitUntil:'domcontentloaded' });
  await page.waitForSelector('canvas');
  await page.uncheck('#pointerLock').catch(()=>{});
  const canvas = await page.$('canvas');
  await page.waitForTimeout(35000);
  await shot('in_00_menu');

  const GO = { x: 428, y: 378 };
  // 1) Enter
  await canvas.click({ position: undefined }).catch(()=>{}); // focus canvas
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter'); await page.waitForTimeout(9000); await shot('in_01_enter');
  // 2) явный down/up точно на GO
  await page.mouse.move(GO.x, GO.y); await page.waitForTimeout(400);
  await page.mouse.down(); await page.waitForTimeout(200); await page.mouse.up();
  await page.waitForTimeout(9000); await shot('in_02_downup');
  // 3) двойной клик
  await page.mouse.dblclick(GO.x, GO.y); await page.waitForTimeout(9000); await shot('in_03_dbl');
  // 4) клик чуть в разных точках вокруг GO
  for (const dx of [-8,0,8]) { await page.mouse.click(GO.x+dx, GO.y); await page.waitForTimeout(1500); }
  await page.waitForTimeout(8000); await shot('in_04_around');
  await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
