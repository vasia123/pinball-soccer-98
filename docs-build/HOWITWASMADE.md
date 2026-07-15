# Как это было сделано

Полный путь от ISO с archive.org до играбельной браузерной версии.

## 1. Источник
- `http://archive.org/details/SoccerPinball98` → `CD1.iso` (45 МБ, ISO 9660).
- Внутри ISO: `Soccer98.exe` (44.8 МБ), `pinball.ico`, `autorun.inf`.

## 2. Что такое Soccer98.exe
PE32 GUI, но код крошечный (~7 КБ), а ~44.8 МБ — **overlay после PE-образа**.
Это **самораспаковывающийся инсталлятор Gentee**: стаб пишет в `%TEMP%`
`ginstall.dll` + сжатый архив и через GUI-мастер ставит игру. Overlay — кастомное
сжатие Gentee, вручную не карвится.

## 3. Распаковка
1. Портативный **Wine** (WoW64, wine-11.13, без sudo — распакован из сборки Kron4ek).
2. Запуск `Soccer98.exe` под Wine → GUI-мастер «Destination Directory / Start».
3. Под WSLg координатные клики не работают (rootless Xwayland), но **клавиатурные
   события XTEST идут в сфокусированное окно** → фокус на окне + `Enter` = нажатие Start.
4. Установилось 92 МБ / 753 файла в `drive_c/Program Files (x86)/Soccer98`.

Движок: `Soccer98/Soccer98/winpin.exe` (движок «Win95 Pinball 2»).
Запуск: `winpin.bat` = `cd soccer98 && winpin.exe`.

## 4. Графический стек (определяет способ эмуляции)
Импорты `winpin.exe`: `ddraw.dll` (DirectDraw 2D — `DirectDrawCreate`,
`CreateSurface`, front/back flipping), `dinput.dll`, `dsound.dll`, `winmm`+`msacm32`.
**Никакого Direct3D/OpenGL** — чистый 2D DirectDraw.

Вывод: **v86 не подходит** (его VBE9x-драйвер не умеет DirectDraw).
**BoxedWine подходит** — Wine реализует DirectDraw программно, а web-сборка
BoxedWine официально поддерживает DirectDraw (но не 3D).

## 5. Браузерный рантайм
- `Boxedwine25R1Web.zip` из релизов danoon2/Boxedwine — **single-threaded**
  (не требует COOP/COEP/SharedArrayBuffer → чистый GitHub Pages).
- Файловая система = обычные zip: root `boxedwine.zip` (минимальный Wine с DirectDraw)
  + игра как app-zip, монтируется на `c:\files`.
- Запуск: `boxedwine.html?app=pinball&p=winpin.bat&resolution=800x600&sound=true`.

## 6. Упаковка игры
`pinball.zip` = содержимое установочной папки, **без**:
- `uninstall.exe`;
- `pats/soccer98.avi` — интро проигрывается через **DirectShow (quartz.dll)**,
  которого нет в minimal-Wine; при попытке проиграть игра виснет на чёрном экране.
  Без файла игра корректно пропускает интро и идёт в меню.

## 7. Ввод в браузере
- Снять галку **Lock/hide mouse pointer** (pointer-lock мешает клику по меню).
- Клики по кнопкам меню — **с удержанием** ~0.5–1 с (эмулятор без JIT опрашивает
  мышь по кадрам, быстрый клик проскакивает).
- Флипперы — **L Shift / R Shift**, запуск мяча — **Space**.

## 8. Проверка
Headless Chromium (Playwright) + `python3 -m http.server`:
язык → фронтенд-меню (TOURNAMENT TABLE) → GO → загрузка стола. DirectDraw рисует
корректно, звук открывается (44100 Гц). Скрипты проверки — в `test-harness/`.

## Ключевые факты одной строкой
- Игра: DirectDraw 2D, DX5-эпоха, движок «Win95 Pinball 2».
- Инсталлятор: Gentee self-extractor (`ginstall.dll` + сжатый overlay).
- Рантайм: BoxedWine 25R1 web, single-threaded.
- Главный фикс совместимости: удалить `soccer98.avi` (DirectShow).
