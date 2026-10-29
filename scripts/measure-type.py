#!/usr/bin/env python3
"""Measure the ink boxes of the board's type (board px of estudo-modelo2.jpg).

Each entry: region (x0, y0, x1, y1) + colour predicate. Rows are split into
lines by the vertical projection of the ink. Output: scripts/out/type.json
and an overlay (scripts/out/overlay-type.png) to check every box by eye.
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
B = cv2.imread(str(ROOT / 'references/estudo-modelo2.jpg')).astype(int)
bl, gr, rd = B[..., 0], B[..., 1], B[..., 2]
RED = (rd > 150) & (gr < 70) & (bl < 80)
INK = (rd < 70) & (gr < 70) & (bl < 70)
CREAM = (rd > 225) & (gr > 210) & (bl > 190)
LIGHT_RED = (rd > 220) & (gr > 80) & (gr < 170) & (bl > 90) & (bl < 180)

REGIONS = {
    'nav-left': ((80, 40, 330, 64), INK),
    'nav-right': ((580, 40, 780, 64), INK),
    'title': ((25, 75, 440, 465), RED),
    'sub': ((30, 460, 230, 512), INK),
    'cta': ((30, 512, 210, 540), RED),
    'callout-flaky': ((735, 108, 830, 132), INK),
    'callout-steak': ((390, 403, 460, 427), INK),
    'inside-title': ((25, 570, 380, 765), CREAM),
    'inside-caption': ((600, 800, 880, 830), CREAM),
    'range-eyebrow': ((30, 860, 240, 882), CREAM),
    'range-explore': ((30, 1112, 190, 1142), CREAM),
    'sweet-title': ((25, 1160, 430, 1325), RED),
    'sweet-copy': ((30, 1325, 320, 1410), CREAM),
    'sweet-arrow': ((200, 1380, 250, 1405), RED),
    'visit-left': ((25, 1610, 230, 1700), CREAM),
    'visit-right': ((720, 1655, 880, 1700), CREAM),
    'foot-address': ((50, 1716, 245, 1742), CREAM),
    'foot-phone': ((270, 1716, 350, 1742), CREAM),
    'foot-directions': ((355, 1716, 470, 1745), RED),
    'foot-truck': ((670, 1716, 850, 1745), RED),
}


def lines(mask, x0, y0, min_gap=2):
    rows = mask.sum(1)
    on = rows > max(1, rows.max() * .04)
    out, start = [], None
    for i, v in enumerate(list(on) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if out and start - out[-1][1] <= min_gap:
                out[-1][1] = i
            else:
                out.append([start, i])
            start = None
    res = []
    for a, b in out:
        cols = np.where(mask[a:b].any(0))[0]
        if len(cols) == 0 or b - a < 3:
            continue
        res.append([int(x0 + cols[0]), int(y0 + a), int(x0 + cols[-1] + 1), int(y0 + b)])
    return res


result = {}
over = B.astype(np.uint8).copy()
for name, ((x0, y0, x1, y1), pred) in REGIONS.items():
    m = pred[y0:y1, x0:x1]
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)).astype(bool)
    ls = lines(m, x0, y0)
    result[name] = ls
    for (a, b, c, d) in ls:
        cv2.rectangle(over, (a, b), (c - 1, d - 1), (0, 255, 0), 1)
    print(f'{name:16s}', ls)
(ROOT / 'scripts/out/type.json').write_text(json.dumps(result, indent=1))
cv2.imwrite(str(ROOT / 'scripts/out/overlay-type.png'), over)
