import subprocess, time, sys, os, signal, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

DOCS = "/home/vasis/projects_hobby/pinball-soccer-98/docs"
OUT = "/home/vasis/projects_hobby/pinball-soccer-98/tools"
PORT = 8199

# --- serve docs/ ---
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DOCS)
httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
httpd.allow_reuse_address = True
t = threading.Thread(target=httpd.serve_forever, daemon=True); t.start()
print(f"serving {DOCS} on :{PORT}")

errors, logs = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=[
        "--autoplay-policy=no-user-gesture-required",
        "--no-sandbox",
    ])
    page = browser.new_page()
    page.add_init_script("""
      window.__src = 0;
      const _cbs = AudioContext.prototype.createBufferSource;
      AudioContext.prototype.createBufferSource = function(){ window.__src++; return _cbs.apply(this, arguments); };
      window.__acstate = () => { try { return (window.__lastctx||{}).state } catch(e){return 'n/a'} };
      const _ctor = window.AudioContext;
      window.AudioContext = function(...a){ const c = new _ctor(...a); window.__lastctx=c; return c; };
      window.AudioContext.prototype = _ctor.prototype;
    """)
    page.on("console", lambda m: (logs.append(m.text), errors.append(m.text) if m.type=="error" else None))
    page.on("pageerror", lambda e: errors.append("PAGEERROR: "+str(e)))

    page.goto(f"http://127.0.0.1:{PORT}/index.html")
    # Wait for the game to boot: loading overlay hidden or a canvas mounted.
    ok = False
    for i in range(90):
        st = page.text_content("#status") or ""
        disp = page.eval_on_selector("#loading", "el => getComputedStyle(el).display")
        has_canvas = page.eval_on_selector_all("#screen canvas", "els => els.length")
        if i % 5 == 0:
            print(f"[{i}s] status={st!r} loading={disp} canvas={has_canvas}")
        if disp == "none" or has_canvas:
            ok = True; break
        time.sleep(1)
    time.sleep(3)
    page.screenshot(path=f"{OUT}/web_00_boot.png")
    print("booted:", ok, "| canvas:", page.eval_on_selector_all("#screen canvas", "e=>e.length"))

    # user gesture to unlock audio + interact
    try:
        box = page.eval_on_selector("#stage", "el => { const r=el.getBoundingClientRect(); return {x:r.x+r.width/2, y:r.y+r.height/2}; }")
        page.mouse.click(box["x"], box["y"])
    except Exception as e:
        print("click err", e)
    time.sleep(2)
    # keyboard: plunger + flippers
    for k in ["Enter", "KeyZ", "ShiftRight", "Space"]:
        page.keyboard.down(k); time.sleep(0.15); page.keyboard.up(k); time.sleep(0.2)
    time.sleep(3)
    page.screenshot(path=f"{OUT}/web_01_after_input.png")
    src = page.evaluate("window.__src || 0")
    acst = page.evaluate("window.__acstate ? window.__acstate() : 'n/a'")
    print(f"audio: createBufferSource calls={src} ctxState={acst}")
    print("console errors:", len(errors))
    for e in errors[:15]:
        print("  ERR:", e[:200])
    browser.close()
httpd.shutdown()
print("done")
