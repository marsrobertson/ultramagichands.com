#!/usr/bin/env python3
"""Turn Google Maps review screenshots into website images and shareable collages.

Usage:
    python3 tools/build_reviews.py [--maps-url URL] [--rating 5.0] [--count 42]
                                   [--trim-top PX] [--trim-bottom PX]

Reads every image in reviews/raw/ (sorted by filename) and writes:
    reviews/img/NN.jpg             web-sized copies, metadata stripped
    reviews/reviews.js             list the website loads
    reviews/collage/collage.jpg    one long collage (1080px wide)
    reviews/collage/insta-NN.jpg   1080x1350 Instagram carousel slides

--rating and --count are only drawn on the collages if you pass them, so copy
them exactly from your Google Maps listing.
"""
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "reviews" / "raw"
IMG = ROOT / "reviews" / "img"
OUT = ROOT / "reviews" / "collage"
FONTS = Path(__file__).resolve().parent / "fonts"

EXTS = {".png", ".jpg", ".jpeg", ".webp"}
WEB_MAX_W = 900

# Palette matches assets/style.css
SAND = (247, 239, 228)
INK = (15, 42, 46)
INK_SOFT = (61, 85, 89)
SUN = (242, 166, 90)
CORAL = (232, 119, 90)

W = 1080
PAD = 54
GAP = 26
COLS = 2
RADIUS = 22


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def autotrim(im, tol=12):
    """Crop away uniform margins (same colour as the top-left pixel)."""
    rgb = im.convert("RGB")
    bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
    diff = ImageChops.difference(rgb, bg).convert("L").point(lambda p: 255 if p > tol else 0)
    box = diff.getbbox()
    if not box:
        return im
    pad = 16
    l, t, r, b = box
    return im.crop((max(l - pad, 0), max(t - pad, 0), min(r + pad, im.width), min(b + pad, im.height)))


def load(path, trim_top, trim_bottom):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im).convert("RGB")
    if trim_top or trim_bottom:
        im = im.crop((0, trim_top, im.width, im.height - trim_bottom))
    return autotrim(im)


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius, fill=255)
    return im, mask


def paste_card(canvas, im, x, y):
    """Paste with rounded corners and a soft shadow."""
    im, mask = rounded(im, RADIUS)
    shadow = Image.new("RGBA", (im.width + 60, im.height + 60), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((30, 36, 30 + im.width, 36 + im.height), RADIUS, fill=(15, 42, 46, 46))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(shadow, (x - 30, y - 30))
    card = im.convert("RGBA")
    card.putalpha(mask)
    canvas.alpha_composite(card, (x, y))


def star(draw, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    draw.polygon(pts, fill=fill)


def header(canvas, rating, count):
    d = ImageDraw.Draw(canvas)
    y = PAD
    d.text((PAD, y), "ULTRA MAGIC HANDS", font=font("inter-latin-500-normal.woff", 26), fill=CORAL)
    y += 46
    d.text((PAD, y), "What people say", font=font("fraunces-latin-600-normal.woff", 76), fill=INK)
    y += 104
    x = PAD
    for i in range(5):
        star(d, x + 18, y + 18, 18, SUN)
        x += 42
    label = "Google Maps reviews"
    if rating and count:
        label = f"{rating} · {count} Google reviews"
    elif rating:
        label = f"{rating} on Google Maps"
    d.text((x + 12, y + 2), label, font=font("inter-latin-500-normal.woff", 30), fill=INK_SOFT)
    return y + 36 + 44


def footer(canvas):
    d = ImageDraw.Draw(canvas)
    f = font("fraunces-latin-400-italic.woff", 30)
    text = "ultramagichands.com · Playa San Juan, Tenerife"
    tw = d.textlength(text, font=f)
    d.text(((W - tw) / 2, canvas.height - PAD - 30), text, font=f, fill=INK_SOFT)


def col_width():
    return (W - 2 * PAD - (COLS - 1) * GAP) // COLS


def fit(im, cw, max_h=None):
    h = round(im.height * cw / im.width)
    if max_h and h > max_h:
        w = round(im.width * max_h / im.height)
        return im.resize((w, max_h), Image.LANCZOS)
    return im.resize((cw, h), Image.LANCZOS)


def masonry(images, top, max_bottom=None):
    """Place images into the shortest column. Returns (placements, leftover, bottom)."""
    cw = col_width()
    heights = [top] * COLS
    placed = []
    for i, im in enumerate(images):
        c = heights.index(min(heights))
        limit = (max_bottom - top) if max_bottom else None
        r = fit(im, cw, limit)
        if max_bottom and heights[c] + r.height > max_bottom and placed:
            return placed, images[i:], max(heights)
        x = PAD + c * (cw + GAP) + (cw - r.width) // 2
        placed.append((r, x, heights[c]))
        heights[c] += r.height + GAP
    return placed, [], max(heights) - GAP


def build_long(images, rating, count):
    probe = Image.new("RGBA", (W, 10))
    top = header(probe, rating, count)
    placed, _, bottom = masonry(images, top)
    canvas = Image.new("RGBA", (W, bottom + PAD + 80), SAND + (255,))
    header(canvas, rating, count)
    for r, x, y in placed:
        paste_card(canvas, r, x, y)
    footer(canvas)
    return canvas.convert("RGB")


def build_slides(images, rating, count, h=1350):
    slides = []
    queue = list(images)
    while queue:
        canvas = Image.new("RGBA", (W, h), SAND + (255,))
        top = header(canvas, rating, count)
        placed, queue, bottom = masonry(queue, top, max_bottom=h - PAD - 70)
        # Centre the block vertically in the free space.
        shift = max((h - PAD - 70 - bottom) // 2, 0)
        for r, x, y in placed:
            paste_card(canvas, r, x, y + shift)
        footer(canvas)
        slides.append(canvas.convert("RGB"))
    return slides


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--maps-url", help="your Google Maps listing link, used for the 'Read all reviews' button")
    ap.add_argument("--rating", help="star rating exactly as Google shows it, e.g. 5.0")
    ap.add_argument("--count", help="number of reviews exactly as Google shows it")
    ap.add_argument("--trim-top", type=int, default=0, help="pixels to cut from the top of each screenshot (phone status bar)")
    ap.add_argument("--trim-bottom", type=int, default=0, help="pixels to cut from the bottom of each screenshot")
    args = ap.parse_args()

    files = sorted(p for p in RAW.iterdir() if p.suffix.lower() in EXTS) if RAW.exists() else []
    if not files:
        raise SystemExit(f"No screenshots found in {RAW.relative_to(ROOT)}/ (png, jpg, webp).")

    IMG.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for old in list(IMG.glob("*.jpg")) + list(OUT.glob("*.jpg")):
        old.unlink()

    images, entries = [], []
    for n, path in enumerate(files, 1):
        im = load(path, args.trim_top, args.trim_bottom)
        images.append(im)
        web = im if im.width <= WEB_MAX_W else im.resize((WEB_MAX_W, round(im.height * WEB_MAX_W / im.width)), Image.LANCZOS)
        name = f"{n:02d}.jpg"
        web.save(IMG / name, "JPEG", quality=85, optimize=True, progressive=True)  # no EXIF carried over
        entries.append({"src": f"img/{name}", "w": web.width, "h": web.height})

    js = "// Generated by tools/build_reviews.py. Do not edit by hand.\n"
    js += f"window.REVIEWS = {json.dumps(entries, indent=1)};\n"
    if args.maps_url:
        js += f"window.REVIEWS_MAPS_URL = {json.dumps(args.maps_url)};\n"
    (ROOT / "reviews" / "reviews.js").write_text(js)

    build_long(images, args.rating, args.count).save(OUT / "collage.jpg", "JPEG", quality=90, optimize=True)
    slides = build_slides(images, args.rating, args.count)
    for i, s in enumerate(slides, 1):
        s.save(OUT / f"insta-{i:02d}.jpg", "JPEG", quality=92, optimize=True)

    print(f"{len(files)} screenshots -> reviews/img/, reviews/reviews.js, "
          f"reviews/collage/collage.jpg and {len(slides)} Instagram slide(s).")


if __name__ == "__main__":
    main()
