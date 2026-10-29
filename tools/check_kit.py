#!/usr/bin/env python3
"""Read-only structural/integrity checks. Not a browser or performance test.
Run from any directory with Python 3, Pillow and Node.js.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.nodes = []

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def verify_local_refs(file):
    parser = Document()
    parser.feed(file.read_text())
    ids = [a['id'] for _, a in parser.nodes if 'id' in a]
    assert len(ids) == len(set(ids)), f'Duplicate ID in {file.name}'
    for tag, attrs in parser.nodes:
        for key in ['src', 'href', 'poster']:
            value = attrs.get(key)
            if not value:
                continue
            if value.startswith('#'):
                assert value[1:] in ids, f'Broken anchor: {value}'
                continue
            split = urlsplit(value)
            if split.scheme or split.netloc:
                continue
            target = (file.parent / unquote(split.path)).resolve()
            assert target.is_file(), f'Missing local file: {target}'
        for key in ['aria-labelledby', 'aria-controls']:
            if key in attrs:
                assert all(i in ids for i in attrs[key].split()), f'Broken {key}: {attrs[key]}'
        if attrs.get('target') == '_blank':
            assert 'noopener' in attrs.get('rel', ''), 'External tab lacks noopener'
    return parser


def main():
    checks = []
    lock = json.loads((ROOT/'docs/architecture-lock.json').read_text())
    assert lock['selected_model'] == 2
    assert digest(ROOT/lock['selection_source']) == lock['selection_sha256']
    assert digest(ROOT/lock['logo']) == lock['logo_sha256']
    checks.append('approved model 2 and selected-reference hashes')
    document = verify_local_refs(SITE/'index.html')
    verify_local_refs(ROOT/'docs/GUIA-VISUAL.html')
    assert next(a for t, a in document.nodes if t == 'html')['lang'] == 'en-AU'
    main_scenes = [(a['id'], a['data-background']) for t, a in document.nodes if t == 'section' and 'data-scene' in a]
    assert [x[0] for x in main_scenes] == lock['main_scene_ids']
    assert [x[1] for x in main_scenes] == lock['main_background_sequence']
    assert [i for i, kind in main_scenes if kind == 'solid'] == ['the-range']
    assert len([1 for t, _ in document.nodes if t == 'h1']) == 1
    assert not any(t == 'video' for t, _ in document.nodes), 'Film must not download in public site'
    assert not any(t == 'iframe' for t, _ in document.nodes), 'No embedded map tracking'
    for _, attrs in document.nodes:
        if attrs.get('href', '').startswith('tel:'):
            assert attrs['href'] == 'tel:+61747782538'
    checks.append('five scenes, single red menu, en-AU, local links and ARIA targets')
    raw = (SITE/'index.html').read_text()
    for fragment in re.findall(r'<svg\b.*?</svg>', raw, re.S):
        ET.fromstring(fragment)
    for css_ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)', (SITE/'styles.css').read_text()):
        assert (SITE/css_ref).is_file(), f'Broken CSS asset: {css_ref}'
    for file in ROOT.rglob('*.json'):
        json.loads(file.read_text())
    for file in (SITE/'assets/fonts').glob('*.woff'):
        assert file.read_bytes()[:4] == b'wOFF', f'Invalid WOFF header: {file}'
    checks.append('inline SVG XML, CSS asset references, JSON and WOFF signatures')
    images = []
    for file in ROOT.rglob('*'):
        if file.suffix.lower() in ['.png', '.webp', '.jpg', '.jpeg']:
            im = Image.open(file)
            im.verify()
            images.append(file)
    logo = Image.open(ROOT/lock['logo']).convert('RGBA')
    alpha = logo.getchannel('A')
    histogram = alpha.histogram()
    total = logo.width * logo.height
    zero_fraction = histogram[0] / total
    high_fraction = sum(histogram[241:]) / total
    pixels = logo.get_flattened_data() if hasattr(logo, 'get_flattened_data') else logo.getdata()
    visible_black = sum(1 for r, g, b, a in pixels if a > 64 and max(r, g, b) < 40)
    assert logo.size == (1254, 1254)
    assert alpha.getextrema() == (0, 255)
    assert zero_fraction > .55 and high_fraction > .2
    assert visible_black == 0
    assert (ROOT/lock['logo']).read_bytes() == (SITE/'assets/logo.png').read_bytes()
    cutout = Image.open(SITE/'assets/hero-pie-hand.webp')
    assert cutout.mode == 'RGBA' and cutout.getchannel('A').getextrema()[0] == 0
    checks.append(f'{len(images)} images decode; transparent logo and foreground; identical logo copies')
    manifest = json.loads((ROOT/'docs/asset-manifest.json').read_text())
    for entry in manifest['assets']:
        assert digest(ROOT/entry['file']) == entry['sha256'], f'Asset hash mismatch: {entry["file"]}'
        if entry['kind'] == 'client_original':
            assert entry['sha256'] == entry['original_attachment_sha256']
    checks.append('asset origin hashes; all supplied originals preserved')
    node = shutil.which('node')
    assert node, 'Node.js needed for JavaScript syntax checks'
    for name in ['app.js', 'content.js']:
        subprocess.run([node, '--check', str(SITE/name)], check=True, capture_output=True)
    code = "const fs=require('fs'),vm=require('vm');let c={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),c);process.stdout.write(JSON.stringify(c.window.MALS_DATA));"
    content = json.loads(subprocess.check_output([node, '-e', code, str(SITE/'content.js')]))
    assert set(content) == {'pies', 'rolls', 'sandwiches', 'sweets'}
    assert len(content['pies']['items']) == 18
    assert len(content['rolls']['items']) == 8
    for _, attrs in document.nodes:
        if 'data-menu' in attrs:
            assert attrs['data-menu'] in content
        if 'data-category' in attrs:
            assert attrs['data-category'] in content
    checks.append('JavaScript syntax and menu data binding; 18 pies and 8 savoury options')
    movie = ROOT/'animation/hero-movement-HD.mp4'
    assert movie.is_file() and movie.stat().st_size > 100000
    video = {'file': str(movie.relative_to(ROOT))}
    if shutil.which('ffprobe'):
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'quiet', '-show_streams', '-show_format', '-of', 'json', str(movie)]))
        stream = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        assert stream['width'] == 1920 and stream['height'] == 1080
        assert stream['avg_frame_rate'] == '24/1'
        assert abs(float(probe['format']['duration']) - 10) < .1
        assert not any(s['codec_type'] == 'audio' for s in probe['streams'])
        video.update(width=stream['width'], height=stream['height'], fps=24, seconds=float(probe['format']['duration']), audio=False)
        checks.append('film is 1920x1080, 24 fps, 10 seconds, no audio')
    else:
        checks.append('film exists; ffprobe not installed for metadata recheck')
    checksum_file = ROOT/'MANIFEST.sha256'
    checked_hashes = 0
    if checksum_file.exists():
        for line in checksum_file.read_text().splitlines():
            expected, filename = line.split('  ', 1)
            assert digest(ROOT/filename) == expected, f'Package checksum mismatch: {filename}'
            checked_hashes += 1
        checks.append(f'package integrity: {checked_hashes} SHA-256 hashes')
    print(json.dumps({'status': 'PASS', 'scope': 'structural and integrity checks, not browser QA', 'checks': checks, 'logo': {'mode': 'RGBA', 'dimensions': list(logo.size), 'alpha_range': list(alpha.getextrema()), 'fully_transparent_percent': round(zero_fraction*100,3), 'high_opacity_percent': round(high_fraction*100,3), 'visible_black_pixels': visible_black}, 'film': video, 'browser_qa': {'status':'UNVERIFIED','reason':'sites-previewd mailbox unavailable at /tmp/sites-previewd/requests; start and status returned os error 2'}, 'not_performed':['browser rendering and interactive QA','performance measurements','deployment']}, indent=2))


if __name__ == '__main__':
    main()
