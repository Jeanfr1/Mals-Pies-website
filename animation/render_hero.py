#!/usr/bin/env python3
"""Reproduce a 10-second 2.5D presentation film from the delivered image layers.
Needs FFmpeg with drawtext/zoompan/xfade. Does not run or screenshot a browser.
"""
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'site' / 'assets'
ANIMATION = ROOT / 'animation'
W, H, FPS = 1920, 1080, 24
ANTON = ANIMATION / 'Anton.ttf'
BARLOW = ANIMATION / 'BarlowCondensed.ttf'


def run(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)


def text(label, size, x, y, color, font=ANTON):
    # Fixed source text uses no apostrophes/colon escaping. Paths in this kit are ASCII.
    return f"drawtext=fontfile='{font}':text='{label}':fontsize={size}:fontcolor={color}:x={x}:y={y}"


def still_input(file):
    return ['-loop', '1', '-framerate', str(FPS), '-i', str(file)]


def output_options(seconds, path):
    return ['-t', str(seconds), '-r', str(FPS), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(path)]


def main():
    for f in [ANTON, BARLOW, ASSETS/'paper.webp', ASSETS/'hero-pie-hand.webp', ASSETS/'inside-pie.webp', ASSETS/'logo.png']:
        if not f.is_file():
            raise FileNotFoundError(f)
    destination = ANIMATION / 'hero-movement-HD.mp4'
    with tempfile.TemporaryDirectory(prefix='mals-film-') as temporary:
        temp = Path(temporary)
        first, hero, last = [temp / n for n in ['01-macro.mp4', '02-hero.mp4', '03-inside.mp4']]
        vf = f"scale=2304:1296,zoompan=z='1.15-0.15*on/59':x='iw*.52-iw/zoom/2':y='ih*.52-ih/zoom/2':d=1:s={W}x{H}:fps={FPS},setsar=1"
        run([*still_input(ASSETS/'inside-pie.webp'), '-vf', vf, *output_options(2.5, first)])
        words = [text('HOT.', 230, 70, 185, '0xD81920'), text('FLAKY.', 230, 70, 399, '0xD81920'), text('LOCAL.', 230, 70, 613, '0xD81920'), text('MALS PIES & PASTRIES', 34, 77, 904, '0x151311', BARLOW), text('BAKED IN TOWNSVILLE.', 30, 77, 949, '0x151311', BARLOW), text('FIND YOUR FAVOURITE', 29, 77, 1005, '0xD81920', BARLOW)]
        labels = [text('THE BAKERY    |    THE GOOD STUFF', 25, 155, 76, '0x151311', BARLOW), text('SMOKO TRUCK    |    FIND US', 25, 1370, 76, '0x151311', BARLOW)]
        graph = (
            f"[0:v]scale={W}:{H},setsar=1," + ','.join(words) + '[type];'
            "[1:v]scale=1260:-1,format=rgba[food];"
            "[type][food]overlay=x='775-12*sin(t*.55)':y='-4+6*sin(t*.7)':eval=frame:shortest=1[composite];"
            "[2:v]scale=142:142,format=rgba[seal];"
            "[composite][seal]overlay=x=(W-w)/2:y=15:shortest=1[branded];"
            "[branded]" + ','.join(labels) + f",zoompan=z='1+0.025*on/143':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={W}x{H}:fps={FPS},setsar=1[out]"
        )
        run([*still_input(ASSETS/'paper.webp'), *still_input(ASSETS/'hero-pie-hand.webp'), *still_input(ASSETS/'logo.png'), '-filter_complex', graph, '-map', '[out]', *output_options(6, hero)])
        vf = f"scale=2304:1296,zoompan=z='1+0.06*on/71':x='iw*.52-iw/zoom/2':y='ih*.52-ih/zoom/2':d=1:s={W}x{H}:fps={FPS},setsar=1," + text('THE INSIDE', 155, 70, 95, '0xFFF7ED') + ',' + text('STORY.', 155, 70, 250, '0xFFF7ED')
        run([*still_input(ASSETS/'inside-pie.webp'), '-vf', vf, *output_options(3, last)])
        graph = "[0:v]settb=AVTB,setpts=PTS-STARTPTS[a];[1:v]settb=AVTB,setpts=PTS-STARTPTS[b];[2:v]settb=AVTB,setpts=PTS-STARTPTS[c];[a][b]xfade=transition=fade:duration=0.75:offset=1.75[ab];[ab][c]xfade=transition=fade:duration=0.75:offset=7,format=yuv420p[out]"
        run(['-i', str(first), '-i', str(hero), '-i', str(last), '-filter_complex', graph, '-map', '[out]', *output_options(10, destination)])
    print(destination)


if __name__ == '__main__':
    main()
