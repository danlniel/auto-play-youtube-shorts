"""Generate extension icons: white downward play triangle on a red rounded square.

Pure stdlib (zlib + struct), supersampled 4x for antialiasing.
Run from the repo root: python3 scripts/gen_icons.py
"""
import struct, zlib, os

SS = 4  # supersample factor

def render(size):
    S = size * SS
    radius = S * 0.22
    # triangle pointing down, centered
    tri_w = S * 0.46
    tri_h = S * 0.40
    tx0 = (S - tri_w) / 2
    tx1 = tx0 + tri_w
    ty0 = (S - tri_h) / 2 + S * 0.02
    ty1 = ty0 + tri_h

    top = (255, 40, 70)      # lighter red
    bot = (200, 0, 45)       # darker red

    px = bytearray()
    for y in range(0, S, SS):
        for x in range(0, S, SS):
            r = g = b = a = 0
            for dy in range(SS):
                for dx in range(SS):
                    X, Y = x + dx + 0.5, y + dy + 0.5
                    # rounded rect coverage
                    cx = min(max(X, radius), S - radius)
                    cy = min(max(Y, radius), S - radius)
                    if (X - cx) ** 2 + (Y - cy) ** 2 > radius ** 2:
                        continue
                    # vertical gradient
                    t = Y / S
                    cr = top[0] + (bot[0] - top[0]) * t
                    cg = top[1] + (bot[1] - top[1]) * t
                    cb = top[2] + (bot[2] - top[2]) * t
                    # inside downward triangle? apex at bottom-center
                    if ty0 <= Y <= ty1:
                        f = (Y - ty0) / tri_h  # 0 at top edge, 1 at apex
                        half = (tri_w / 2) * (1 - f)
                        mid = (tx0 + tx1) / 2
                        if abs(X - mid) <= half:
                            cr, cg, cb = 255, 255, 255
                    r += cr; g += cg; b += cb; a += 255
            n = SS * SS
            px += bytes((round(r / n), round(g / n), round(b / n), round(a / n)))
    return bytes(px)

def write_png(path, size, rgba):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c))
    raw = b"".join(b"\x00" + rgba[y * size * 4:(y + 1) * size * 4] for y in range(size))
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(png)

outdir = os.path.join(os.path.dirname(__file__), "..", "icons")
os.makedirs(outdir, exist_ok=True)
for s in (16, 48, 128):
    write_png(os.path.join(outdir, f"icon{s}.png"), s, render(s))
    print(f"icon{s}.png written")
