#!/usr/bin/env python3
# Скриншот всего экрана (или окна wine) через python-xlib. Аргумент: путь для сохранения PNG.
import sys
from Xlib import display, X
from PIL import Image

def grab_root(path):
    d = display.Display()
    root = d.screen().root
    geo = root.get_geometry()
    w, h = geo.width, geo.height
    raw = root.get_image(0, 0, w, h, X.ZPixmap, 0xffffffff)
    # Xlib даёт BGRX (32bpp) обычно
    img = Image.frombytes("RGB", (w, h), raw.data, "raw", "BGRX")
    img.save(path)
    print(f"saved {path} {w}x{h}")

def list_windows():
    d = display.Display()
    root = d.screen().root
    out = []
    def walk(win, depth=0):
        try:
            for c in win.query_tree().children:
                try:
                    name = c.get_wm_name()
                    g = c.get_geometry()
                    attrs = c.get_attributes()
                    if name and attrs.map_state == X.IsViewable:
                        out.append((c.id, name, g.x, g.y, g.width, g.height))
                except Exception:
                    pass
                walk(c, depth+1)
        except Exception:
            pass
    walk(root)
    for wid, name, x, y, w, h in out:
        print(f"win 0x{wid:x} '{name}' @ {x},{y} {w}x{h}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_windows()
    else:
        grab_root(sys.argv[1] if len(sys.argv) > 1 else "/tmp/shot.png")
