const { chromium } = require('playwright');
(async () => {
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const shot = async (n) => { await page.screenshot({ path: `${outDir}/${n}.png` }); console.log(new Date().toISOString(),'shot', n); };
  await page.goto('http://localhost:8899/boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true', { waitUntil:'domcontentloaded' });
  await page.waitForSelector('canvas');
  await page.uncheck('#pointerLock').catch(()=>{});
  await page.waitForTimeout(35000);
  await page.mouse.click(428,378); await page.waitForTimeout(500); await page.keyboard.press('Enter');
  await page.waitForTimeout(28000);
  await page.mouse.move(643,420); await page.waitForTimeout(400);
  await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up();
  console.log('GO -> loading, waiting patiently...');
  // периодические кадры каждые 20с в течение ~180с
  for (let i=1;i<=9;i++){ await page.waitForTimeout(20000); await shot('pt_'+String(i).padStart(2,'0')); }
  // мяч в игру: плунжер
  await page.keyboard.down('Space'); await page.waitForTimeout(2000); await page.keyboard.up('Space');
  await page.waitForTimeout(3000); await shot('pt_plunge');
  // флипперы
  await page.keyboard.down('ShiftLeft'); await page.waitForTimeout(1200); await page.keyboard.up('ShiftLeft');
  await shot('pt_flipL');
  await page.keyboard.down('ShiftRight'); await page.waitForTimeout(1200); await page.keyboard.up('ShiftRight');
  await shot('pt_flipR');
  await page.waitForTimeout(3000); await shot('pt_end');
  await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
