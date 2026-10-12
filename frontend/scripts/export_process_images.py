"""Source renders -> the four "How we work" step images (public/assets/process/step-N.webp).

Run:  python scripts/export_process_images.py

The renders come in different sizes and the part fills a different share of each one. To make
the four steps read as one sequence, every output has the same canvas and the object (the
bounding box of everything that is not background) is scaled so that all four have the same
size and sit at the same spot. The canvas keeps the renders' flat background colour, which the
page's fade band is built to match.
"""
import os

import numpy as np
from PIL import Image

SRC = r"C:\Archivos Marcos\ARROYO_SYSTEMS\WEB_IMAGENES"
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "process")

# (output step, source file)
STEPS = [(1, "1.png"), (2, "2.png"), (3, "3.1.png"), (4, "4.png")]

BACKGROUND = (46, 52, 64)   # the background of renders 1, 2 and 4
CANVAS = (2088, 870)        # same for every step: 2.4 : 1
OBJECT_SIZE = 620           # sqrt(width x height) of the object's bounding box, in canvas px
THRESHOLD = 25              # colour distance from the background that counts as "object"


def load_on_common_background(path):
    img = Image.open(path).convert("RGB")
    pixels = np.asarray(img).astype(np.float64)
    bg = pixels[2, 2]
    target = np.array(BACKGROUND, dtype=np.float64)
    if np.abs(bg - target).max() > 1:
        # A render with a slightly different background: shift it, weighting by closeness to
        # the background so the object's own colours stay untouched.
        distance = np.sqrt(((pixels - bg) ** 2).sum(axis=2))
        weight = np.clip(1 - distance / 45, 0, 1)[..., None]
        pixels = np.clip(pixels + (target - bg) * weight, 0, 255)
        bg = target
    return Image.fromarray(pixels.astype(np.uint8)), np.sqrt(((pixels - bg) ** 2).sum(axis=2))


def main():
    os.makedirs(DST, exist_ok=True)
    for step, name in STEPS:
        img, distance = load_on_common_background(os.path.join(SRC, name))
        ys, xs = np.where(distance > THRESHOLD)
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        scale = OBJECT_SIZE / np.sqrt((x1 - x0) * (y1 - y0))
        resized = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        centre_x, centre_y = (x0 + x1) / 2 * scale, (y0 + y1) / 2 * scale
        canvas = Image.new("RGB", CANVAS, BACKGROUND)
        canvas.paste(resized, (round(CANVAS[0] / 2 - centre_x), round(CANVAS[1] / 2 - centre_y)))
        out = os.path.join(DST, "step-%d.webp" % step)
        canvas.save(out, quality=94, method=6)
        print(step, name, "scale %.2f" % scale, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
