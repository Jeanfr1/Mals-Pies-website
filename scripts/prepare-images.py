#!/usr/bin/env python3
"""Export the web images (WebP, several widths) from the upscaled sources.

Inputs: scripts/out/up/*.png (Real-ESRGAN x4 resized to 2x, see upscale.py;
facade and truck come from clean-captures.py first), the kit's logo and the
approved board (for the social card).
Outputs: src/assets/img/*.webp, public/favicon.png, public/apple-touch-icon.png,
public/og-image.jpg
Run: ~/anaconda3/bin/python3 scripts/prepare-images.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UP = ROOT / 'scripts' / 'out' / 'up'
IMG = ROOT / 'src' / 'assets' / 'img'
PUB = ROOT / 'public'
IMG.mkdir(parents=True, exist_ok=True)
PUB.mkdir(parents=True, exist_ok=True)

SETS = {
    'paper': ([1400, 2400], 74),
    'pie': ([900, 1400, 2200], 84),
    'inside': ([900, 1600, 2800], 80),
    'sweets': ([800, 1400, 2400], 80),
    'facade': ([800, 1400, 2400], 80),
    'truck': ([700, 1100, 1800], 80),
}


def export(name, widths, quality):
    src = Image.open(UP / f'{name}.png')
    alpha = src.mode == 'RGBA'
    for w in widths:
        h = round(src.height * w / src.width)
        im = src.resize((w, h), Image.LANCZOS)
        out = IMG / f'{name}-{w}.webp'
        im.save(out, 'WEBP', quality=quality, method=6, **({'exact': False} if alpha else {}))
        print(f'{out.name:20s} {w}x{h} {out.stat().st_size // 1024} KB')


def seal():
    logo = Image.open(ROOT / 'brand' / 'Logo-Mals-Bakery-Transparente.png').convert('RGBA')
    for w in (240, 480, 720):
        im = logo.resize((w, w), Image.LANCZOS)
        im.save(IMG / f'seal-{w}.webp', 'WEBP', quality=88, method=6)
    icon = logo.resize((192, 192), Image.LANCZOS)
    icon.save(PUB / 'favicon.png', optimize=True)
    touch = Image.new('RGBA', (180, 180), (255, 247, 237, 255))
    touch.alpha_composite(logo.resize((160, 160), Image.LANCZOS), (10, 10))
    touch.convert('RGB').save(PUB / 'apple-touch-icon.png', optimize=True)
    print('seal + icons ok')


def og_image():
    """Social card from the approved board's hero (the composition the client chose)."""
    up = UP / 'board-hero.png'
    src = Image.open(up) if up.exists() else Image.open(ROOT / 'references' / 'estudo-modelo2.jpg').crop((0, 0, 891, 558))
    src = src.convert('RGB')
    target = 1200 / 630
    w, h = src.size
    if w / h > target:
        nw = round(h * target)
        src = src.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = round(w / target)
        src = src.crop((0, 0, w, nh))
    src.resize((1200, 630), Image.LANCZOS).save(PUB / 'og-image.jpg', quality=86, optimize=True, progressive=True)
    print('og-image ok')


if __name__ == '__main__':
    for name, (widths, q) in SETS.items():
        if (UP / f'{name}.png').exists():
            export(name, widths, q)
        else:
            print('missing', name)
    seal()
    og_image()
