#!/usr/bin/env python3
"""Register the kit's master images on the approved board (SIFT + similarity).

Board = references/estudo-modelo2.jpg (891 x 1765), the same Model 2 page as
references/escolha-do-cliente.png at a higher resolution. Writes
scripts/out/registration.json (scale, offset of each master in board px) and
overlay images to check every match by eye.
Run: ~/anaconda3/bin/python3 scripts/register-board.py
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'scripts' / 'out'
OUT.mkdir(parents=True, exist_ok=True)
BOARD = ROOT / 'references' / 'estudo-modelo2.jpg'

MASTERS = {
    'paper': ('images/master/paper.png', (0, 0, 891, 557)),
    'pie': ('images/master/hero-pie-hand.png', (250, 60, 891, 557)),
    'inside': ('images/master/inside-pie.png', (0, 557, 891, 847)),
    'sweets': ('site/assets/doces-custard-original.png', (0, 1155, 891, 1420)),
    'facade': ('site/assets/fachada-original.png', (0, 1420, 548, 1712)),
    'truck': ('site/assets/smoko-truck-original.png', (548, 1420, 891, 1712)),
    'logo': ('brand/Logo-Mals-Bakery-Transparente.png', (380, 10, 510, 120)),
    'seal': ('brand/Logo-Mals-Bakery-Transparente.png', (600, 847, 891, 1155)),
}


def load(path):
    img = cv2.imread(str(ROOT / path), cv2.IMREAD_UNCHANGED)
    if img.ndim == 3 and img.shape[2] == 4:
        alpha = img[:, :, 3]
        rgb = img[:, :, :3]
        return rgb, alpha
    return img[:, :, :3], None


def main():
    board = cv2.imread(str(BOARD))
    gray_b = cv2.cvtColor(board, cv2.COLOR_BGR2GRAY)
    sift = cv2.SIFT_create(nfeatures=8000)
    result = {'board': {'file': BOARD.name, 'width': board.shape[1], 'height': board.shape[0]}}
    for name, (path, roi) in MASTERS.items():
        rgb, alpha = load(path)
        g = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)
        x0, y0, x1, y1 = roi
        mask_b = np.zeros_like(gray_b)
        mask_b[y0:y1, x0:x1] = 255
        mask_m = None if alpha is None else (alpha > 128).astype(np.uint8) * 255
        # Downscale the master so its detail matches the board's density.
        s = min(1.0, 2.0 * (x1 - x0) / g.shape[1])
        gm = cv2.resize(g, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        mm = None if mask_m is None else cv2.resize(mask_m, None, fx=s, fy=s, interpolation=cv2.INTER_NEAREST)
        k1, d1 = sift.detectAndCompute(gm, mm)
        k2, d2 = sift.detectAndCompute(gray_b, mask_b)
        if d1 is None or d2 is None:
            print(name, 'no features'); continue
        matches = cv2.BFMatcher().knnMatch(d1, d2, k=2)
        good = [m for m, n in (p for p in matches if len(p) == 2) if m.distance < 0.75 * n.distance]
        if len(good) < 8:
            print(name, 'too few matches', len(good)); continue
        src = np.float32([k1[m.queryIdx].pt for m in good]) / s
        dst = np.float32([k2[m.trainIdx].pt for m in good])
        M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=3.0)
        scale = float(np.hypot(M[0, 0], M[1, 0]))
        angle = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
        tx, ty = float(M[0, 2]), float(M[1, 2])
        n_in = int(inl.sum())
        h, w = g.shape
        result[name] = {'file': path, 'w': w, 'h': h, 'scale': scale, 'angle': angle,
                        'x': tx, 'y': ty, 'inliers': n_in, 'matches': len(good),
                        'box': [tx, ty, tx + w * scale, ty + h * scale]}
        print(f'{name:7s} scale={scale:.4f} angle={angle:+.2f} x={tx:7.1f} y={ty:7.1f} '
              f'box_r={tx + w * scale:7.1f} box_b={ty + h * scale:7.1f} inliers={n_in}/{len(good)}')
        # Overlay: master warped onto the board at 50 %.
        warped = cv2.warpAffine(rgb, M, (board.shape[1], board.shape[0]))
        wa = cv2.warpAffine(np.full((h, w), 255, np.uint8) if alpha is None else alpha, M,
                            (board.shape[1], board.shape[0])).astype(np.float32)[..., None] / 255 * .5
        over = (board * (1 - wa) + warped * wa).astype(np.uint8)
        cv2.rectangle(over, (x0, y0), (x1, y1), (0, 255, 0), 1)
        crop = over[max(0, y0 - 20):min(board.shape[0], y1 + 20)]
        cv2.imwrite(str(OUT / f'overlay-{name}.jpg'), crop, [cv2.IMWRITE_JPEG_QUALITY, 88])
    (OUT / 'registration.json').write_text(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
