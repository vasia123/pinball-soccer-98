import time, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
DOCS="/home/vasis/projects_hobby/pinball-soccer-98/docs"; OUT="/home/vasis/projects_hobby/pinball-soccer-98/tools"; PORT=8204
Handler=functools.partial(http.server.SimpleHTTPRequestHandler, directory=DOCS)
httpd=socketserver.TCPServer(("127.0.0.1",PORT),Handler); httpd.allow_reuse_address=True
threading.Thread(target=httpd.serve_forever,daemon=True).start()
errors=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=["--autoplay-policy=no-user-gesture-required","--no-sandbox"])
    pg=b.new_page(viewport={"width":1280,"height":720})
    pg.on("console", lambda m: errors.append(m.text) if m.type=="error" else None)
    pg.on("pageerror", lambda e: errors.append("PAGEERR: "+str(e)))
    pg.goto(f"http://127.0.0.1:{PORT}/index.html")
    for _ in range(120):
        if pg.eval_on_selector_all("#screen canvas","e=>e.length"): break
        time.sleep(1)
    print("booted"); time.sleep(3)
    box=pg.eval_on_selector("#screen canvas","el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}")
    def fire(gx,gy,t,btn):
        pg.evaluate("""([gx,gy,t,btn])=>{const c=document.querySelector('#screen canvas');const r=c.getBoundingClientRect();
          c.dispatchEvent(new MouseEvent(t,{clientX:r.left+gx*r.width/640,clientY:r.top+gy*r.height/480,button:0,buttons:btn,bubbles:true}));}""",[gx,gy,t,btn])
    def click(gx,gy):
        fire(gx,gy,'mousemove',0); time.sleep(0.2); fire(gx,gy,'mousedown',1); time.sleep(0.4); fire(gx,gy,'mouseup',0); time.sleep(0.3)
    def key(k,hold=0.15):
        pg.keyboard.down(k); time.sleep(hold); pg.keyboard.up(k); time.sleep(0.25)
    def shot(n): pg.screenshot(path=f"{OUT}/wf_{n}.png"); print("shot",n)

    print("settle language screen…"); time.sleep(25)
    click(315,347); time.sleep(12); shot("10_table")     # language GO -> table select
    click(548,378); print("table GO -> field load (polling up to ~6min)…")
    # poll for a big screen change (field load finishes): sample a pixel region's data-URL length change is hard;
    # just wait generously with periodic screenshots
    for i in range(18):
        time.sleep(20);
    shot("11_afterload")
    key("Enter"); time.sleep(4)                            # dismiss attract / options
    click(340,378); time.sleep(8); shot("12_newgame")      # NEW GAME
    click(460,368); time.sleep(10); shot("13_field")       # OK team select -> field
    # gameplay keys
    key("Enter",0.5); time.sleep(2)                        # plunger launch
    for _ in range(5): key("KeyZ"); key("ShiftRight")
    time.sleep(2); shot("14_play")
    print("console errors:", len(errors))
    for e in errors[:10]: print("  ERR:",e[:160])
    b.close()
httpd.shutdown(); print("done")
