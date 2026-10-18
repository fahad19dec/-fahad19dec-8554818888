"""Draws the app icons, favicon and splash image from brand.config.js.

    python3 scripts/brand-icons.py     (needs Node and Pillow: pip install pillow)

Rerun after changing the logo or icon colors in brand.config.js.
"""
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "images"
brand = json.loads(subprocess.check_output(["node", "-p", "JSON.stringify(require('./brand.config'))"], cwd=ROOT))
logo = brand["logo"]


def rgba(color):
    color = color.lstrip("#")
    return tuple(int(color[i : i + 2], 16) for i in (0, 2, 4)) + (255,)


def draw(size, background=None, pad=0.18, handle=None, head=None, name=None):
    """The mark on a square: `pad` is the share of each side left empty."""
    scale = 4  # draw large, then shrink, for smooth edges
    side = size * scale
    image = Image.new("RGBA", (side, side), rgba(background) if background else (0, 0, 0, 0))
    pen = ImageDraw.Draw(image)
    unit = side * (1 - 2 * pad) / 100
    at = lambda p: (side * pad + p[0] * unit, side * pad + p[1] * unit)
    width = logo["handleWidth"] * unit
    handle = rgba(handle or logo["handleColor"])
    (a, b) = logo["handle"]
    pen.line([at(a), at(b)], fill=handle, width=round(width))
    for end in (a, b):
        x, y = at(end)
        pen.ellipse([x - width / 2, y - width / 2, x + width / 2, y + width / 2], fill=handle)
    head = rgba(head or logo["headColor"])
    pen.polygon([at(p) for p in logo["poll"]], fill=head)
    pen.polygon([at(p) for p in logo["head"]], fill=head)
    image = image.resize((size, size), Image.LANCZOS)
    image.save(OUT / name)
    print("wrote", name)


bg = brand["icon"]["background"]
draw(1024, bg, 0.18, name="icon.png")
draw(48, bg, 0.12, name="favicon.png")
draw(512, None, 0.15, name="splash-icon.png")
# Android adaptive icon: the launcher crops to a circle or squircle, so the
# foreground keeps the mark inside the middle two thirds.
draw(512, None, 0.27, name="android-icon-foreground.png")
Image.new("RGBA", (512, 512), rgba(bg)).save(OUT / "android-icon-background.png")
print("wrote android-icon-background.png")
draw(432, None, 0.27, handle="#ffffff", head="#ffffff", name="android-icon-monochrome.png")
