#!/usr/bin/env python3
"""Frame the README captures (scripts/out/readme/) into .github/assets/."""
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'scripts/out/readme'
DST = ROOT / '.github/assets'
DST.mkdir(parents=True, exist_ok=True)
URL = 'mals-pies-oonoonba.vercel.app'


def browser(img, width=1200):
    img = img.convert('RGB').resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    bar = 38
    card = Image.new('RGB', (width, img.height + bar), '#ECE7E1')
    d = ImageDraw.Draw(card)
    for i, c in enumerate(('#FF5F57', '#FEBC2E', '#28C840')):
        d.ellipse((16 + i * 20, 13, 28 + i * 20, 25), fill=c)
    d.rounded_rectangle((width * .3, 8, width * .7, 30), 8, fill='#FFFFFF')
    d.text((width * .5, 19), URL, fill='#6E6862', anchor='mm')
    card.paste(img, (0, bar))
    mask = Image.new('L', card.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, card.width - 1, card.height - 1), 12, fill=255)
    out = Image.new('RGBA', card.size)
    out.paste(card, (0, 0), mask)
    return out


def phone(img, width=300):
    img = img.convert('RGB').resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    pad = 12
    body = Image.new('RGBA', (width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, body.width - 1, body.height - 1), 44, fill='#151311')
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), 34, fill=255)
    body.paste(img, (pad, pad), m)
    d.rounded_rectangle((body.width / 2 - 46, pad + 8, body.width / 2 + 46, pad + 30), 12, fill='#151311')
    return body


def shadowed(canvas, item, xy, radius=18, offset=10):
    sh = Image.new('RGBA', (item.width + 80, item.height + 80), (0, 0, 0, 0))
    sh.paste((21, 19, 17, 90), (40, 40 + offset, 40 + item.width, 40 + offset + item.height), item.getchannel('A'))
    sh = sh.filter(ImageFilter.GaussianBlur(radius))
    canvas.alpha_composite(sh, (xy[0] - 40, xy[1] - 40))
    canvas.alpha_composite(item, xy)


# Desktop: 2 x 2 browser windows
shots = [browser(Image.open(SRC / f'desktop-{n}.png'), 900) for n in ('hero', 'inside', 'range', 'visit')]
gap, margin = 48, 56
W = margin * 2 + shots[0].width * 2 + gap
H = margin * 2 + shots[0].height * 2 + gap
canvas = Image.new('RGBA', (W, H), '#F4EEE6')
for i, s in enumerate(shots):
    shadowed(canvas, s, (margin + (i % 2) * (s.width + gap), margin + (i // 2) * (s.height + gap)))
canvas.convert('RGB').save(DST / 'desktop-sections.jpg', quality=84, optimize=True, progressive=True)

# Mobile: four phones on the brand red
phones = [phone(Image.open(SRC / f'mobile-{n}.png')) for n in ('hero', 'range', 'sweets', 'visit')]
gap, margin = 40, 60
W = margin * 2 + sum(p.width for p in phones) + gap * 3
H = margin * 2 + phones[0].height
canvas = Image.new('RGBA', (W, H), '#D81920')
x = margin
for p in phones:
    shadowed(canvas, p, (x, margin), radius=22, offset=14)
    x += p.width + gap
canvas.convert('RGB').save(DST / 'mobile-screens.jpg', quality=84, optimize=True, progressive=True)

# Banner
shutil.copy(SRC / 'banner.png', DST / 'banner.png')
Image.open(DST / 'banner.png').convert('RGB').save(DST / 'banner.png', optimize=True)

# Hero scroll GIF (first and last frames held longer)
frames = sorted((SRC / 'frames').glob('f_*.png'))
seq = SRC / 'seq'
shutil.rmtree(seq, ignore_errors=True)
seq.mkdir()
frames = frames[::2]
order = [frames[0]] * 5 + frames + [frames[-1]] * 6
for i, f in enumerate(order):
    shutil.copy(f, seq / f'g_{i:04d}.png')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '7', '-i', str(seq / 'g_%04d.png'), '-vf',
                'fps=7,scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
                '-loop', '0', str(DST / 'hero-scroll.gif')], check=True)
for f in sorted(DST.iterdir()):
    print(f'{f.name:22s} {f.stat().st_size / 1024:8.0f} KB', Image.open(f).size)
