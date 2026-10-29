#!/usr/bin/env python3
"""Real-ESRGAN x4plus upscale (spandrel + torch), tiled, alpha kept.

The RGB goes through the model; an alpha channel, when present, is resized
with Lanczos so cut-out edges stay where they were.
Usage: python3 scripts/upscale.py <in.png> <out.png> [--scale 2]
Weights: ~/.cache/realesrgan/RealESRGAN_x4plus.pth
"""
import argparse
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

WEIGHTS = Path.home() / '.cache' / 'realesrgan' / 'RealESRGAN_x4plus.pth'
TILE, PAD = 256, 16


def device():
    if torch.backends.mps.is_available():
        return torch.device('mps')
    return torch.device('cpu')


def run(model, rgb, dev):
    """rgb: HxWx3 float32 0..1 -> (4H)x(4W)x3."""
    h, w, _ = rgb.shape
    out = np.zeros((h * 4, w * 4, 3), np.float32)
    for y in range(0, h, TILE):
        for x in range(0, w, TILE):
            y0, x0 = max(0, y - PAD), max(0, x - PAD)
            y1, x1 = min(h, y + TILE + PAD), min(w, x + TILE + PAD)
            t = torch.from_numpy(rgb[y0:y1, x0:x1].transpose(2, 0, 1)).unsqueeze(0).to(dev)
            with torch.no_grad():
                r = model(t).clamp(0, 1).squeeze(0).cpu().numpy().transpose(1, 2, 0)
            ty, tx = (y - y0) * 4, (x - x0) * 4
            th, tw = min(TILE, h - y) * 4, min(TILE, w - x) * 4
            out[y * 4:y * 4 + th, x * 4:x * 4 + tw] = r[ty:ty + th, tx:tx + tw]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--scale', type=float, default=2.0, help='final scale vs the source')
    a = ap.parse_args()
    dev = device()
    model = ModelLoader().load_from_file(str(WEIGHTS)).model.eval().to(dev)
    im = Image.open(a.src)
    alpha = im.getchannel('A') if im.mode in ('RGBA', 'LA') else None
    rgb = np.asarray(im.convert('RGB'), np.float32) / 255
    try:
        up = run(model, rgb, dev)
    except RuntimeError:
        model = model.to('cpu')
        up = run(model, rgb, torch.device('cpu'))
    size = (round(im.width * a.scale), round(im.height * a.scale))
    res = Image.fromarray((up * 255 + .5).astype(np.uint8)).resize(size, Image.LANCZOS)
    if alpha is not None:
        res.putalpha(alpha.resize(size, Image.LANCZOS))
    res.save(a.dst)
    print(f'{a.src} -> {a.dst} {size} on {dev}')


if __name__ == '__main__':
    main()
