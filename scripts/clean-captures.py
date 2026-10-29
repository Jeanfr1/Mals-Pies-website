#!/usr/bin/env python3
"""Remove the viewer interface from the two supplied captures, nothing else.

- Shopfront (site/assets/fachada-original.png): drops the top bar with the
  reviewer's name and close button, lifts the translucent "next" disc back to
  the brightness of its surroundings and repaints the thin chevron.
- Smoko Truck (site/assets/smoko-truck-original.png): drops the strip of
  neighbouring thumbnails along the top edge.
The kit's originals are not modified. Output: scripts/out/src/*.png
Run: ~/anaconda3/bin/python3 scripts/clean-captures.py
"""
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'scripts' / 'out' / 'src'
OUT.mkdir(parents=True, exist_ok=True)

FACADE_TOP = 112          # first row below the viewer's name bar
DISC = (1286, 499, 36)    # "next" button: centre x, y, radius (px of the capture)
TRUCK_TOP = 42            # first row below the thumbnail strip


def facade():
    img = cv2.imread(str(ROOT / 'site/assets/fachada-original.png'), cv2.IMREAD_COLOR).astype(np.float32)
    cx, cy, r = DISC
    yy, xx = np.mgrid[:img.shape[0], :img.shape[1]]
    d = np.hypot(xx - cx, yy - cy)
    # The disc is a translucent grey veil: obs = k*orig + b per channel. Match the
    # mean and spread of an annulus just inside the rim to one just outside.
    ring_in = (d > r - 14) & (d <= r - 3)
    ring_out = (d > r + 3) & (d <= r + 14)
    gain = []
    fixed = img.copy()
    soft = np.clip((r - 1 - d) / 2.5, 0, 1)                  # feather the rim
    for c in range(3):
        a_in, a_out = img[..., c][ring_in], img[..., c][ring_out]
        k = a_in.std() / a_out.std()
        b = a_in.mean() - k * a_out.mean()
        gain.append((round(float(k), 3), round(float(b), 1)))
        restored = np.clip((img[..., c] - b) / k, 0, 255)
        fixed[..., c] = img[..., c] * (1 - soft) + restored * soft
    fixed = fixed.astype(np.uint8)
    # The rim itself (2-3 px antialiased edge) is repainted from its neighbours.
    rim = ((d > r - 3) & (d < r + 2)).astype(np.uint8) * 255
    fixed = cv2.inpaint(fixed, rim, 3, cv2.INPAINT_TELEA)
    # Chevron: light blue strokes inside the disc -> inpaint them.
    hsv = cv2.cvtColor(fixed, cv2.COLOR_BGR2HSV)
    blue = (hsv[..., 0] > 95) & (hsv[..., 0] < 125) & (hsv[..., 1] > 60) & (hsv[..., 2] > 150)
    mask = (blue & (d <= r)).astype(np.uint8) * 255
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
    fixed = cv2.inpaint(fixed, mask, 6, cv2.INPAINT_TELEA)
    fixed = fixed[FACADE_TOP:]
    cv2.imwrite(str(OUT / 'facade-clean.png'), fixed)
    zoom = fixed[cy - FACADE_TOP - 70:cy - FACADE_TOP + 70, cx - 90:cx + 60]
    cv2.imwrite(str(ROOT / 'scripts/out/check-facade-disc.png'),
                cv2.resize(zoom, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST))
    print('facade gain', np.round(gain, 3), 'chevron px', int((mask > 0).sum()), fixed.shape)


def truck():
    img = cv2.imread(str(ROOT / 'site/assets/smoko-truck-original.png'), cv2.IMREAD_COLOR)
    cv2.imwrite(str(OUT / 'truck-clean.png'), img[TRUCK_TOP:])
    print('truck', img[TRUCK_TOP:].shape)


if __name__ == '__main__':
    facade()
    truck()
