#!/usr/bin/env python3
"""Lift the pastry crumbs scattered on the paper in the approved board's hero.

The board (upscaled 2x, scripts/out/up/board-hero.png) has crumbs around the
pie that the clean paper master lacks. Golden-brown pixels outside the pie
(registered master alpha, dilated), the seal and the type become an RGBA layer
the size of the board hero: src/assets/img/crumbs.webp (board px x 2).
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
up = cv2.imread(str(ROOT / 'scripts/out/up/board-hero.png'))
H, W = up.shape[:2]
S = W / 891
reg = json.loads((ROOT / 'scripts/out/registration.json').read_text())['pie']

# Pie master alpha warped onto the board (similarity from register-board.py).
pie = cv2.imread(str(ROOT / 'images/master/hero-pie-hand.png'), cv2.IMREAD_UNCHANGED)
a = np.radians(reg['angle'])
s = reg['scale'] * S
M = np.float32([[s * np.cos(a), -s * np.sin(a), reg['x'] * S], [s * np.sin(a), s * np.cos(a), reg['y'] * S]])
pie_mask = cv2.warpAffine(pie[:, :, 3], M, (W, H)) > 20
pie_mask = cv2.dilate(pie_mask.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0

hsv = cv2.cvtColor(up, cv2.COLOR_BGR2HSV).astype(int)
h, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
crumb = (h >= 7) & (h <= 24) & (sat > 70) & (val > 90) & (val < 250)
crumb &= ~pie_mask
crumb[: int(130 * S), int(375 * S):int(520 * S)] = False   # seal
crumb[:, : int(25 * S)] = False
crumb[:, int(845 * S):] = False                              # board pie edge, not crumbs
mask = cv2.morphologyEx(crumb.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(mask, 8)
keep = np.zeros_like(mask)
for i in range(1, n):
    if st[i][4] >= 18:          # specks below this are paper noise
        keep[lab == i] = 1
alpha = cv2.GaussianBlur(cv2.dilate(keep, np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 1.1)
alpha = np.clip(alpha * 1.4, 0, 1)
rgba = np.dstack([up, (alpha * 255).astype(np.uint8)])
cv2.imwrite(str(ROOT / 'scripts/out/crumbs.png'), rgba)
check = up.copy()
check[keep > 0] = (0, 255, 0)
cv2.imwrite(str(ROOT / 'scripts/out/check-crumbs.jpg'), cv2.resize(check, None, fx=.6, fy=.6))
ys, xs = np.where(keep > 0)
print('components', int(n - 1), 'kept px', int(keep.sum()), 'bbox', xs.min() / S, ys.min() / S, xs.max() / S, ys.max() / S)

# Export: trimmed to the crumbs' bounding box; the offset goes to the CSS.
from PIL import Image
img = Image.open(ROOT / 'scripts/out/crumbs.png')
box = img.getchannel('A').getbbox()
pad = 6
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(img.width, box[2] + pad), min(img.height, box[3] + pad))
img.crop(box).save(ROOT / 'src/assets/img/crumbs.webp', 'WEBP', quality=82, method=6)
print('crumbs.webp box (board px):', [round(v / S, 2) for v in box], 'size', img.crop(box).size)
