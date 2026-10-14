#!/usr/bin/env python3
"""Sinh toàn bộ icon PNG của app bằng Pillow.

Chạy:  python3 scripts/gen-icons.py   (cài Pillow nếu thiếu: pip3 install Pillow)
Hình vẽ khớp với icons/icon.svg: hai thẻ bài xếp chồng màu #1a73e8 trên nền trắng.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
SS = 4  # vẽ to gấp 4 rồi thu nhỏ để khử răng cưa

PRIMARY = (26, 115, 232, 255)   # #1a73e8
LIGHT = (211, 227, 253, 255)    # #d3e3fd
WHITE = (255, 255, 255, 255)


def draw_cards(size, scale):
    """Vẽ 2 thẻ trên lớp trong suốt, kích thước size; scale = tỉ lệ phần hình so với khung 512."""
    s = size * SS
    layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    k = s / 512 * scale
    off = s * (1 - scale) / 2  # canh giữa khi thu nhỏ (cho maskable)

    def box(x, y, w, h):
        return [off + x * k, off + y * k, off + (x + w) * k, off + (y + h) * k]

    # Thẻ phía sau, xoay -12° quanh tâm (256, 278)
    back = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(back).rounded_rectangle(box(136, 128, 240, 300), radius=36 * k, fill=LIGHT)
    cx, cy = off + 256 * k, off + 278 * k
    back = back.rotate(12, resample=Image.BICUBIC, center=(cx, cy))  # PIL xoay ngược chiều kim đồng hồ
    layer.alpha_composite(back)

    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box(136, 104, 240, 300), radius=36 * k, fill=PRIMARY)
    d.rounded_rectangle(box(176, 176, 120, 24), radius=12 * k, fill=WHITE)
    faded = (255, 255, 255, 153)
    lines = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    dl = ImageDraw.Draw(lines)
    dl.rounded_rectangle(box(176, 224, 160, 18), radius=9 * k, fill=faded)
    dl.rounded_rectangle(box(176, 260, 100, 18), radius=9 * k, fill=faded)
    layer.alpha_composite(lines)
    return layer


def make(size, scale=1.0, corner=None, name=""):
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    if corner is None:
        img.paste(WHITE, [0, 0, s, s])  # nền đặc, phủ kín
    else:
        ImageDraw.Draw(img).rounded_rectangle([0, 0, s - 1, s - 1], radius=corner * s, fill=WHITE)
    img.alpha_composite(draw_cards(size, scale))
    img = img.resize((size, size), Image.LANCZOS)
    if corner is None:
        img = img.convert("RGB")  # không có kênh trong suốt
    img.save(OUT / name, optimize=True)
    print("✓", name, f"{size}x{size}")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    make(192, scale=1.0, corner=0.22, name="icon-192.png")
    make(512, scale=1.0, corner=0.22, name="icon-512.png")
    # Maskable: hình nằm trong vùng an toàn — chừa 20% mỗi cạnh, nền phủ kín
    make(512, scale=0.78, name="icon-maskable-512.png")
    # iOS tự bo góc; nền phải đặc, không trong suốt
    make(180, scale=1.0, name="apple-touch-icon.png")
