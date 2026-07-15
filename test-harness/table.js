const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const logs=[]; page.on('console',m=>logs.push(m.text()));
  const shot = async (n) => { await page.screenshot({ path: `${outDir}/${n}.png` }); console.log('shot', n); };
  await page.goto('http://localhost:8899/boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true', { waitUntil:'domcontentloaded' });
  await page.waitForSelector('canvas');
  await page.uncheck('#pointerLock').catch(()=>{});
  await page.waitForTimeout(35000);
  // пройти экран языка (GO ~428,378) + Enter
  await page.mouse.click(428,378); await page.waitForTimeout(500); await page.keyboard.press('Enter');
  // ждём фронтенд-меню
  await page.waitForTimeout(28000); await shot('t_00_frontend');
  // жмём GO во фронтенд-меню (~643,420)
  await page.mouse.click(643,420); await page.waitForTimeout(1000); await page.keyboard.press('Enter');
  console.log('table GO');
  // ждём загрузку стола
  for (let i=1;i<=6;i++){ await page.waitForTimeout(6000); await shot('t_load_'+i); }
  // пробуем управление: флипперы и плунжер
  const controls = [
    ['ShiftLeft','флиппер L'], ['ShiftRight','флиппер R'],
    ['z','z'], ['m','m'], ['ArrowLeft','←'], ['ArrowRight','→'],
    ['Space','плунжер space'], ['ArrowDown','плунжер ↓'], ['Enter','enter'], ['Digit1','1 start']
  ];
  for (const [key,label] of controls) {
    await page.keyboard.down(key); await page.waitForTimeout(500); await page.keyboard.up(key);
    await page.waitForTimeout(1500);
  }
  await shot('t_after_controls');
  await page.waitForTimeout(4000); await shot('t_final');
  console.log('=== log tail ==='); console.log(logs.slice(-10).join('\n'));
  await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
