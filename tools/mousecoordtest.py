import threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

DOCS = "/home/vasis/projects_hobby/pinball-soccer-98/docs"
OUT = "/home/vasis/projects_hobby/pinball-soccer-98/tools"
PORT = 8219

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DOCS)
httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
httpd.allow_reuse_address = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
print(f"serving on :{PORT}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=[
        "--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
    ctx = browser.new_context(viewport={"width": 393, "height": 851},
                              is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.goto(f"http://127.0.0.1:{PORT}/index.html")

    # Wait for the game window's canvas to mount.
    canvas = None
    for i in range(120):
        n = page.eval_on_selector_all("#screen canvas", "els => els.length")
        if n:
            canvas = True
            break
        if i % 10 == 0:
            print(f"[{i}s] waiting for canvas… status={page.text_content('#status')!r}")
        page.wait_for_timeout(1000)
    if not canvas:
        print("RESULT: FAIL (canvas never mounted)")
        browser.close(); httpd.shutdown(); raise SystemExit

    # Record offsetX/offsetY of every mousedown that reaches the canvas.
    page.evaluate("""
      window.__downs = [];
      const c = document.querySelector('#screen canvas');
      c.addEventListener('mousedown', e =>
        window.__downs.push({x: Math.round(e.offsetX), y: Math.round(e.offsetY), fixed: !!e.__rwFixed}), true);
      window.__geom = (() => {
        const r = c.getBoundingClientRect();
        return {dispW: Math.round(r.width), dispH: Math.round(r.height),
                logW: c.width / (window.devicePixelRatio||1),
                logH: c.height / (window.devicePixelRatio||1),
                left: r.left, top: r.top};
      })();
    """)
    geom = page.evaluate("window.__geom")
    print("geometry:", geom)

    # Tap the displayed center of the canvas.
    cx = geom["left"] + geom["dispW"] / 2
    cy = geom["top"] + geom["dispH"] / 2
    page.mouse.click(cx, cy)
    page.wait_for_timeout(200)
    downs = page.evaluate("window.__downs")
    print("mousedown events on canvas:", downs)

    # The forwarded (fixed) event should carry logical coords (~center of 640x480),
    # not the displayed coords (~center of 393-wide canvas).
    fixed = [d for d in downs if d["fixed"]]
    ok = False
    if fixed:
        fx, fy = fixed[-1]["x"], fixed[-1]["y"]
        exp_x, exp_y = geom["logW"] / 2, geom["logH"] / 2
        ok = abs(fx - exp_x) <= 8 and abs(fy - exp_y) <= 8
        print(f"fixed center=({fx},{fy}) expected≈({exp_x},{exp_y})  disp center≈({geom['dispW']//2},{geom['dispH']//2})")
    print("RESULT:", "PASS" if ok else "FAIL")
    browser.close()
httpd.shutdown()
