const { chromium } = require('playwright');
(async () => {
  const outDir = '/home/vasis/projects_hobby/pinball-soccer-98/test-harness/shots';
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const shot = async (n) => { await page.screenshot({ path: `${outDir}/${n}.png` }); console.log('shot', n); };
  await page.goto('http://localhost:8899/boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true', { waitUntil:'domcontentloaded' });
  await page.waitForSelector('canvas');
  await page.uncheck('#pointerLock').catch(()=>{});
  // язык
  await page.waitForTimeout(35000);
  await page.mouse.click(428,378); await page.waitForTimeout(500); await page.keyboard.press('Enter');
  // фронтенд -> GO (длинное удержание)
  await page.waitForTimeout(28000);
  await page.mouse.move(643,420); await page.waitForTimeout(400);
  await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up();
  console.log('GO -> loading table');
  // ждём загрузку стола (долго, без JIT)
  await page.waitForTimeout(70000); await shot('fp_00_table');
  // Плунжер: удержать Space / стрелку вниз, чтобы запустить мяч
  for (const key of ['Space','ArrowDown']) {
    await page.keyboard.down(key); await page.waitForTimeout(1500); await page.keyboard.up(key);
    await page.waitForTimeout(2500);
  }
  await shot('fp_01_afterplunge');
  // Флипперы: удержать левый/правый (пробуем распространённые раскладки)
  for (const key of ['ShiftLeft','ShiftRight','ControlLeft','ControlRight','z','ArrowLeft','ArrowRight','Slash']) {
    await page.keyboard.down(key); await page.waitForTimeout(700); await page.keyboard.up(key);
    await page.waitForTimeout(700);
  }
  await shot('fp_02_afterflippers');
  await page.waitForTimeout(3000); await shot('fp_03_final');
  await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
