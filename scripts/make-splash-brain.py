"""Regenerate assets/splash-brain.png from assets/brain-logo.png.

Run with `python3 scripts/make-splash-brain.py` after the mark changes.
No third-party imports on purpose, so it works from a bare checkout.

Cut the brain photo out of its studio backdrop and pad it for the splash.

The source is a photograph: an opaque 500x500 PNG whose backdrop is a noisy
near-white (#F7F7F8 to #FCFCFC) with a grey drop shadow in the lower right.
Laid on the splash's #FFFFFF it showed as a faintly darker square around the
mark, which is the "off background" this is here to remove.

The matte keys on chroma rather than brightness. The backdrop is neutral and
the photograph's cast shadow is very close to it (chroma 20-24 at its most
tinted), while every part of the brain is a saturated red, pink, blue or
yellow, so one threshold separates the mark from both. Dropping the cast
shadow is deliberate: a splash mark sitting on a flat colour should not carry
a studio floor with it, and keying it in gave a hard band where the shadow's
brightness crossed the threshold.

Holes between the rubber bands are recovered by flood-filling the backdrop
inward from the border and calling everything it cannot reach foreground, so an
enclosed sliver of backdrop stays opaque instead of punching through to the
splash colour.
"""
import struct
import zlib
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'brain-logo.png'
OUT = ROOT / 'assets' / 'splash-brain.png'

CANVAS = 1024          # square, so `contain` fits it to the screen's width
MARK_FRACTION = 0.46   # of the canvas, so the mark lands near 45% of the width
CHROMA_FLOOR = 28      # the cast shadow peaks near 24; the mark never drops this low


def decode(path):
    data = open(path, 'rb').read()
    pos, idat, chunks = 8, b'', {}
    while pos < len(data):
        ln, = struct.unpack('>I', data[pos:pos + 4])
        typ = data[pos + 4:pos + 8].decode()
        body = data[pos + 8:pos + 8 + ln]
        if typ == 'IDAT':
            idat += body
        else:
            chunks[typ] = body
        pos += 12 + ln
    w, h, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', chunks['IHDR'])
    assert (depth, ctype, interlace) == (8, 3, 0), (depth, ctype, interlace)
    plte = chunks['PLTE']
    raw = zlib.decompress(idat)
    rows, prev, p = [], bytearray(w), 0
    for _ in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p + w]); p += w
        if f == 1:
            for i in range(1, w):
                line[i] = (line[i] + line[i - 1]) & 255
        elif f == 2:
            for i in range(w):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(w):
                a = line[i - 1] if i else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(w):
                a = line[i - 1] if i else 0
                b, c = prev[i], (prev[i - 1] if i else 0)
                est = a + b - c
                da, db, dc = abs(est - a), abs(est - b), abs(est - c)
                line[i] = (line[i] + (a if da <= db and da <= dc else b if db <= dc else c)) & 255
        rows.append(line)
        prev = line
    rgb = bytearray(w * h * 3)
    for y in range(h):
        row = rows[y]
        for x in range(w):
            i = row[x] * 3
            o = (y * w + x) * 3
            rgb[o:o + 3] = plte[i:i + 3]
    return w, h, rgb


def encode(path, w, h, rgba):
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)
        raw += rgba[y * stride:(y + 1) * stride]
    def chunk(typ, body):
        return (struct.pack('>I', len(body)) + typ + body
                + struct.pack('>I', zlib.crc32(typ + body) & 0xffffffff))
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(png)


w, h, rgb = decode(SRC)

# 1. Key on chroma, with a darkness fallback for the brain's own deep shadows.
solid = bytearray(w * h)
for i in range(w * h):
    r, g, b = rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]
    if max(r, g, b) - min(r, g, b) >= CHROMA_FLOOR:
        solid[i] = 1

# 2. Flood the backdrop in from the border; anything it cannot reach is the mark.
seen = bytearray(w * h)
q = deque()
for x in range(w):
    for i in (x, (h - 1) * w + x):
        if not solid[i] and not seen[i]:
            seen[i] = 1; q.append(i)
for y in range(h):
    for i in (y * w, y * w + w - 1):
        if not solid[i] and not seen[i]:
            seen[i] = 1; q.append(i)
while q:
    i = q.popleft()
    x, y = i % w, i // w
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < w and 0 <= ny < h:
            j = ny * w + nx
            if not solid[j] and not seen[j]:
                seen[j] = 1; q.append(j)
mask = bytearray(255 if not seen[i] else 0 for i in range(w * h))

# 3. Pull one pixel in off the keyed edge, so the blur below feathers from
#    inside the mark rather than smearing backdrop-tinted pixels outward.
eroded = bytearray(w * h)
for y in range(h):
    for x in range(w):
        i = y * w + x
        if not mask[i]:
            continue
        if (x and not mask[i - 1]) or (x < w - 1 and not mask[i + 1]) \
           or (y and not mask[i - w]) or (y < h - 1 and not mask[i + w]):
            continue
        eroded[i] = 255

# 4. Two 3x3 box passes: a soft edge, so the cut-out does not read as a sticker.
alpha = eroded
for _ in range(2):
    nxt = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            total = count = 0
            for dy in (-1, 0, 1):
                yy = y + dy
                if not (0 <= yy < h):
                    continue
                for dx in (-1, 0, 1):
                    xx = x + dx
                    if 0 <= xx < w:
                        total += alpha[yy * w + xx]; count += 1
            nxt[y * w + x] = total // count
    alpha = nxt

# 5. Crop to the mark, then centre it on a transparent square canvas.
xs = [x for x in range(w) for y in range(h) if alpha[y * w + x] > 8]
ys = [y for y in range(h) for x in range(w) if alpha[y * w + x] > 8]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
cw, ch = x1 - x0 + 1, y1 - y0 + 1
target = int(CANVAS * MARK_FRACTION)
scale = target / max(cw, ch)
dw, dh = max(1, round(cw * scale)), max(1, round(ch * scale))
ox, oy = (CANVAS - dw) // 2, (CANVAS - dh) // 2

out = bytearray(CANVAS * CANVAS * 4)
for y in range(dh):
    sy = y0 + min(ch - 1, int(y / scale))
    for x in range(dw):
        sx = x0 + min(cw - 1, int(x / scale))
        s = sy * w + sx
        d = ((oy + y) * CANVAS + ox + x) * 4
        out[d:d + 3] = rgb[s * 3:s * 3 + 3]
        out[d + 3] = alpha[s]

encode(OUT, CANVAS, CANVAS, out)
print(f'wrote {OUT}: {CANVAS}x{CANVAS}, mark {dw}x{dh} from source box {cw}x{ch}')
