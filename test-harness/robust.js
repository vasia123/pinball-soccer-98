const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const t0 = Date.now();
  const ts = () => ((Date.now()-t0)/1000).toFixed(0)+'s';
  const shot = async (n) => { const p=`${outDir}/${n}.png`; await page.screenshot({ path:p }); console.log(ts(),'shot',n); return p; };
  const holdClick = async (x,y,ms=900) => { await page.mouse.move(x,y); await page.waitForTimeout(400); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); };

  await page.goto('http://localhost:8899/boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true', { waitUntil:'domcontentloaded' });
  await page.waitForSelector('canvas');
  await page.uncheck('#pointerLock').catch(()=>{});

  await page.waitForTimeout(38000); await shot('rb_00_lang');
  // язык: длинное удержание GO (центр-низ, 428,378)
  await holdClick(428,378,1000);
  console.log(ts(),'lang GO hold');
  await page.waitForTimeout(30000); await shot('rb_01_front');
  // фронтенд: длинное удержание GO (643,420)
  await holdClick(643,420,1000);
  console.log(ts(),'front GO hold -> loading');

  // терпеливо ждём стол: кадры каждые 20с до ~220с
  for (let i=1;i<=11;i++){ await page.waitForTimeout(20000); await shot('rb_load_'+String(i).padStart(2,'0')); }

  // плунжер (Space) + флипперы (Shift)
  await page.keyboard.down('Space'); await page.waitForTimeout(2500); await page.keyboard.up('Space');
  await page.waitForTimeout(2000); await shot('rb_plunge');
  await page.keyboard.down('ShiftLeft'); await page.waitForTimeout(1500); await page.keyboard.up('ShiftLeft');
  await page.waitForTimeout(500); await shot('rb_flipL');
  await page.keyboard.down('ShiftRight'); await page.waitForTimeout(1500); await page.keyboard.up('ShiftRight');
  await page.waitForTimeout(500); await shot('rb_flipR');
  await page.waitForTimeout(4000); await shot('rb_end');
  console.log(ts(),'done');
  await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
