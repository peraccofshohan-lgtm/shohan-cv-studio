#!/usr/bin/env python3
"""
Render documentation PNG previews of every CV template.

The layout instructions come from the real application code: `npm run
docs:previews` emits JSON describing each template's resolved design tokens and
resolved section model (produced by the same resolver that feeds the live
preview, DOCX, PDF and print pipelines). This script only draws them.

Text is shaped with HarfBuzz and rasterised with FreeType — the same stack
Chromium uses in the shipped app — so Bengali conjuncts, reph and yaphala in the
previews match production output instead of drifting into dotted circles.

Fonts are converted from the bundled WOFF2 assets (SIL OFL 1.1).

Requirements:
    pip install pillow fonttools brotli uharfbuzz freetype-py

Usage:
    npm run docs:previews
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw
from fontTools.ttLib import TTFont

try:
    import freetype
    import uharfbuzz as hb
except ImportError:  # pragma: no cover
    freetype = None
    hb = None

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "docs" / "preview-models.json"
OUT = ROOT / "docs" / "images"
FONT_CACHE = Path("/tmp/shohan-fonts")

PAGE_W, PAGE_H = 620, 877  # A4 at 75 dpi
FONT_FILES: dict[str, Path] = {}


# --------------------------------------------------------------------- fonts
def prepare_fonts() -> dict[str, Path]:
    FONT_CACHE.mkdir(parents=True, exist_ok=True)
    wanted = {
        "Inter-Regular": "inter/files/inter-latin-400-normal.woff2",
        "Inter-SemiBold": "inter/files/inter-latin-600-normal.woff2",
        "Inter-Bold": "inter/files/inter-latin-700-normal.woff2",
        "Bengali-Regular": "noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff2",
        "Bengali-SemiBold": "noto-sans-bengali/files/noto-sans-bengali-bengali-600-normal.woff2",
        "Bengali-Bold": "noto-sans-bengali/files/noto-sans-bengali-bengali-700-normal.woff2",
    }
    out: dict[str, Path] = {}
    for key, rel in wanted.items():
        target = FONT_CACHE / f"{key}.ttf"
        if not target.exists():
            src = ROOT / "node_modules" / "@fontsource" / rel
            if not src.exists():
                print(f"missing font source {src}", file=sys.stderr)
                continue
            font = TTFont(str(src))
            font.flavor = None
            font.save(str(target))
        out[key] = target
    return out


# ----------------------------------------------------------------- text engine
class TextEngine:
    """Shapes text with HarfBuzz and rasterises glyphs with FreeType."""

    def __init__(self) -> None:
        self._ft: dict[str, object] = {}
        self._hb: dict[str, object] = {}

    def _fonts(self, path: Path):
        key = str(path)
        if key not in self._ft:
            self._ft[key] = freetype.Face(key)
            self._hb[key] = hb.Font(hb.Face(open(key, "rb").read()))
        return self._ft[key], self._hb[key]

    def shape(self, path: Path, text: str, size: float):
        face, font = self._fonts(path)
        face.set_pixel_sizes(0, max(1, int(round(size))))
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(font, buf)
        scale = size / font.face.upem
        glyphs = []
        x = 0.0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            glyphs.append((info.codepoint, x + pos.x_offset * scale, pos.y_offset * scale))
            x += pos.x_advance * scale
        return glyphs, x

    def measure(self, path: Path, text: str, size: float) -> float:
        if not text:
            return 0.0
        if hb is None:
            return ImageDraw.Draw(Image.new("RGB", (8, 8))).textlength(
                text, font=ImageFont.truetype(str(path), max(6, int(round(size))))  # noqa
            )
        return self.shape(path, text, size)[1]

    def draw(self, img: Image.Image, path: Path, text: str, size: float, x: float,
             baseline: float, fill: tuple[int, int, int]) -> float:
        if not text:
            return 0.0
        if hb is None:  # pragma: no cover - approximate fallback
            pil_font = ImageFont.truetype(str(path), max(6, int(round(size))))
            painter = ImageDraw.Draw(img)
            painter.text((x, baseline), text, font=pil_font, fill=fill, anchor="ls")
            return painter.textlength(text, font=pil_font)
        glyphs, width = self.shape(path, text, size)
        face, _ = self._fonts(path)
        pixels = img.load()
        for gid, dx, dy in glyphs:
            face.load_glyph(gid, freetype.FT_LOAD_RENDER)
            slot = face.glyph
            bitmap = slot.bitmap
            w, h, pitch = bitmap.width, bitmap.rows, bitmap.pitch
            if not w or not h:
                continue
            ox = int(round(x + dx)) + slot.bitmap_left
            oy = int(round(baseline - dy)) - slot.bitmap_top
            data = bitmap.buffer
            for row in range(h):
                ty = oy + row
                if ty < 0 or ty >= img.height:
                    continue
                base_index = row * pitch
                for col in range(w):
                    alpha = data[base_index + col]
                    if alpha <= 16:
                        continue
                    tx = ox + col
                    if 0 <= tx < img.width:
                        if alpha >= 235:
                            pixels[tx, ty] = fill
                        else:
                            under = pixels[tx, ty]
                            a = alpha / 255.0
                            pixels[tx, ty] = (
                                int(fill[0] * a + under[0] * (1 - a)),
                                int(fill[1] * a + under[1] * (1 - a)),
                                int(fill[2] * a + under[2] * (1 - a)),
                            )
        return width


ENGINE = TextEngine()


def colour(value: str) -> tuple[int, int, int]:
    h = value.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def blend(fg: str, bg: str, alpha: float) -> str:
    fr, fgn, fb = colour(fg)
    br, bgn, bb = colour(bg)
    return "#%02x%02x%02x" % (
        int(fr * alpha + br * (1 - alpha)),
        int(fgn * alpha + bgn * (1 - alpha)),
        int(fb * alpha + bb * (1 - alpha)),
    )


def bengali_text(text: str) -> bool:
    return any("\u0980" <= ch <= "\u09FF" for ch in text or "")


def split_runs(text: str):
    """Split into (chunk, is_bengali) runs so each gets a face that has its glyphs."""
    runs = []
    for ch in text:
        bengali = "\u0980" <= ch <= "\u09FF"
        if runs and runs[-1][1] == bengali:
            runs[-1] = (runs[-1][0] + ch, bengali)
        else:
            runs.append((ch, bengali))
    return runs


# ---------------------------------------------------------------------- page
class Page:
    def __init__(self, muted: bool = False) -> None:
        self.muted = muted
        self.img = Image.new("RGB", (PAGE_W, PAGE_H), "#ffffff")
        self.draw = ImageDraw.Draw(self.img)

    def _face(self, bengali: bool, weight: int) -> Path:
        if bengali:
            key = "Bengali-Bold" if weight >= 700 else "Bengali-SemiBold" if weight >= 600 else "Bengali-Regular"
        else:
            key = "Inter-Bold" if weight >= 700 else "Inter-SemiBold" if weight >= 600 else "Inter-Regular"
        return FONT_FILES.get(key) or FONT_FILES["Inter-Regular"]

    def measure(self, value: str, size: float, weight: int = 400) -> float:
        return sum(ENGINE.measure(self._face(b, weight), chunk, size) for chunk, b in split_runs(value or ""))

    @staticmethod
    def ascent(size: float) -> float:
        return size * 0.80

    def text(self, x: float, y: float, value: str, *, size: float, weight: int = 400,
             fill: str = "#1b232c", anchor: str = "la", spacing: float = 0.0,
             line_height: float = 1.0) -> None:
        """Draw mixed-script text with `y` as the TOP edge of the line box.

        Vertical anchor codes: a = top of the line box, m = vertical centre,
        b = baseline offset below the top. Horizontal codes: l / m / r.
        """
        if not value:
            return
        vertical = anchor[1] if len(anchor) > 1 else "a"
        horizontal = anchor[0] if anchor else "l"
        total = self.measure(value, size, weight)
        cursor = x - (total / 2 if horizontal == "m" else total if horizontal == "r" else 0)
        leading = size * (line_height - 1.0) / 2
        if vertical == "m":
            baseline = y + size * line_height / 2 + size * 0.29
        else:  # top ("a") — leading is split above and below the glyph box
            baseline = y + leading + size * 0.79
        if self.muted:
            return
        ink = colour(fill)
        for chunk, bengali in split_runs(value):
            face = self._face(bengali, weight)
            if spacing and not bengali:
                for ch in chunk:
                    w = ENGINE.measure(face, ch, size)
                    ENGINE.draw(self.img, face, ch, size, cursor, baseline, ink)
                    cursor += w + spacing
            else:
                cursor += ENGINE.draw(self.img, face, chunk, size, cursor, baseline, ink)

    def rect(self, x: float, y: float, w: float, h: float, fill: str, radius: int = 0) -> None:
        if self.muted or w <= 0 or h <= 0:
            return
        if radius:
            self.draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=fill)
        else:
            self.draw.rectangle([x, y, x + w, y + h], fill=fill)

    def circle(self, cx: float, cy: float, r: float, fill: str) -> None:
        if self.muted:
            return
        self.draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)


def wrap(page: Page, text: str, size: float, max_width: float, weight: int = 400) -> list[str]:
    lines: list[str] = []
    line = ""
    for word in str(text or "").split():
        trial = f"{line} {word}".strip()
        if page.measure(trial, size, weight) > max_width and line:
            lines.append(line)
            line = word
        else:
            line = trial
    if line:
        lines.append(line)
    return lines


def ellipsize(page: Page, text: str, size: float, max_width: float) -> str:
    value = text or ""
    while value and page.measure(value + "…", size) > max_width:
        value = value[:-1]
    return (value + "…") if value != text else value


# ------------------------------------------------------------------- drawing
MM = 2.9528  # CSS px per millimetre at 96 dpi
PT = 4.0 / 3.0  # px per CSS point


def render(model: dict, sections: list[dict], muted: bool = False, continuation: bool = False):
    """Lays out one page using the same measurements as src/document/styles.ts.

    `continuation` skips the identity header (pages 2+).
    Returns (image, final y, number of sections consumed).
    """
    design = model["design"]
    data = model["data"]
    language = model["language"]
    palette = design["palette"]
    tokens = model.get("tokens") or {}
    title = tokens.get("title") or {}

    page = Page(muted=muted)

    base = 9.9 * design["bodyScale"]        # pt, body copy
    heading_size = 10.2 * design["headingScale"]
    margin = design["marginMm"] * MM
    gap = 5.2 * design["sectionSpacing"] * MM      # between sections
    entry_gap = 3.1 * design["sectionSpacing"] * MM
    line_h = design["lineHeight"]

    is_rail = design["bodyLayout"] in ("sidebar-left", "sidebar-right")
    rail_w = 62 * MM
    rail_x = (PAGE_W - rail_w) if design["bodyLayout"] == "sidebar-right" else 0
    if is_rail:
        main_x = margin + (rail_w if design["bodyLayout"] == "sidebar-left" else 0)
        main_w = PAGE_W - 2 * margin - rail_w
    else:
        main_x, main_w = margin, PAGE_W - 2 * margin
    max_y = PAGE_H - margin

    header_style = design["headerStyle"]          # split | banner | centered | minimal | band | dual
    band_header = header_style == "band"
    on_primary = "#ffffff"
    name_colour = on_primary if band_header else palette["primary"]
    muted_colour = blend("#ffffff", palette["primary"], 0.86) if band_header else palette["muted"]

    def line_box(size_pt: float) -> float:
        return size_pt * line_h

    # ------------------------------------------------------------- rail
    if is_rail and not continuation:
        page.rect(rail_x, 0, rail_w, PAGE_H, palette["sidebar"])
        rx = rail_x + 5 * MM
        rw = rail_w - 10 * MM
        ry = 6 * MM
        if data["photo"]:
            diameter = 90
            page.rect(rail_x + rail_w / 2 - diameter / 2, ry, diameter, diameter,
                      blend("#ffffff", palette["sidebar"], 0.16), radius=int(diameter / 2))
            page.text(rail_x + rail_w / 2, ry + diameter / 2 - 2.2, "PHOTO", size=7,
                      fill=blend("#ffffff", palette["sidebar"], 0.72), anchor="mm")
            ry += diameter + 4 * MM
        page.text(rx, ry, "যোগাযোগ" if language == "bn" else "CONTACT", size=(base - 1.4) * PT,
                  weight=700, fill=blend("#ffffff", palette["sidebar"], 0.74), spacing=0.9)
        ry += 5.4 * MM
        for value in [data["personal"]["mobile"], data["personal"]["email"], data["personal"]["address"]]:
            for line in wrap(page, value, (base - 0.7) * PT, rw):
                page.text(rx, ry, line, size=(base - 0.7) * PT, fill="#ffffff", line_height=1.45)
                ry += (base - 0.7) * PT * 1.45
            ry += 0.8 * MM
        ry += 2.4 * MM
        for section in sections:
            if section["id"] not in ("skills", "languages"):
                continue
            page.text(rx, ry, section["title"].upper(), size=(heading_size - 1) * PT, weight=700,
                      fill=blend("#ffffff", palette["sidebar"], 0.8), spacing=0.9)
            ry += 5.2 * MM
            items = section["chips"] if section["kind"] == "chips" else [
                f'{row["label"]}: {row["value"]}' for row in section["labelled"]]
            for item in items[:8]:
                for line in wrap(page, item, (base - 0.7) * PT, rw):
                    page.text(rx, ry, line, size=(base - 0.7) * PT, fill="#ffffff", line_height=1.45)
                    ry += (base - 0.7) * PT * 1.45
            ry += 3.6 * MM

    # ----------------------------------------------------------- header
    y = margin
    if continuation:
        # No identity block on later pages; print engines repeat only the rail.
        if not is_rail:
            y = margin
    band_bottom = 0.0
    if band_header:
        y = margin + 6.5 * MM
        band_bottom = y  # refined below once the identity block height is known

    if not continuation:
        centered = header_style == "centered"
        photo_size = 26 * MM
        identity_h = 0.0
        contact_lines = []
        name_size = 23 * design["headingScale"]
        if header_style == "banner" or header_style == "band":
            name_size = 24 * design["headingScale"]
        elif header_style == "minimal":
            name_size = 21 * design["headingScale"]
        elif header_style == "dual":
            name_size = 22 * design["headingScale"]
        name_size *= PT

        identity_h = name_size * 1.12
        if data["personal"]["headline"]:
            identity_h += 1.4 * MM + (base + 0.7) * PT * 1.3
        contact_size = (base - 0.6) * PT
        contact_items = [c for c in [data["personal"]["mobile"], data["personal"]["email"],
                                     data["personal"]["address"], data["personal"]["linkedin"]] if c]

        photo_right = design["photoPosition"] == "right"
        text_w = main_w - (photo_size + 6 * MM if data["photo"] and not centered else 0)

        # measure the contact lines that fit
        contact_lines, current, used = [], [], 0.0
        for item in contact_items:
            w = page.measure(item, contact_size)
            if current and used + 4.5 * MM + w > text_w:
                contact_lines.append(current)
                current, used = [item], w
            else:
                used += (4.5 * MM if current else 0) + w
                current.append(item)
        if current:
            contact_lines.append(current)
        contact_h = 2.6 * MM + len(contact_lines) * contact_size * 1.35 if contact_lines else 0
        identity_h += contact_h

        identity_h = max(identity_h, photo_size if data["photo"] else 0)
        name_x = main_x + main_w / 2 if centered else main_x
        anchor = "ma" if centered else "la"

        page.text(name_x, y, data["personal"]["fullName"], size=name_size, weight=700,
                  fill=name_colour, anchor=anchor, line_height=1.12)
        cursor_y = y + name_size * 1.12

        # ---------------------------------------------------- title block
        # Mirrors .cv-title: hidden titles reserve no space at all.
        title_h = 0.0
        if title.get("visible") and title.get("text"):
            t_size = float(title.get("sizePt", 10)) * PT
            title_h = (float(title.get("spaceBeforeMm", 0))
                       + t_size * 1.25 * (1.0 / (4.0 / 3.0)) * 1.0
                       + float(title.get("spaceAfterMm", 0))) * MM
            if title.get("accentLine"):
                title_h += 1.4 * MM
            identity_h += title_h
            t_y = cursor_y + float(title.get("spaceBeforeMm", 0)) * MM
            t_anchor = {"center": "ma", "right": "ra"}.get(title.get("align", "left"), "la")
            t_x = name_x if t_anchor == "la" else (
                main_x + main_w / 2 if t_anchor == "ma" and centered else
                (main_x + main_w if t_anchor == "ra" else name_x))
            if t_anchor == "ma" and not centered:
                t_x = main_x + main_w / 2
            t_colour = title.get("color") or palette["muted"]
            page.text(t_x, t_y, title["text"], size=t_size,
                      weight=int(title.get("weight", 600)),
                      fill=t_colour if not band_header else blend("#ffffff", palette["primary"], 0.82),
                      anchor=t_anchor, spacing=float(title.get("letterSpacing", 0.14)) * t_size)
            if title.get("accentLine"):
                line_w = 26 * MM
                lx = t_x if t_anchor == "la" else (t_x - line_w / 2 if t_anchor == "ma" else t_x - line_w)
                page.rect(lx, t_y + t_size * 0.95 + 0.8 * MM, line_w, 0.5 * MM, palette["accent"])
            cursor_y += title_h
        if data["personal"]["headline"]:
            cursor_y += 1.4 * MM
            page.text(name_x, cursor_y, data["personal"]["headline"], size=(base + 0.7) * PT,
                      fill=muted_colour, anchor=anchor, line_height=1.3)
            cursor_y += (base + 0.7) * PT * 1.3
        cursor_y += 2.6 * MM
        for line in contact_lines:
            x = name_x
            if centered:
                total = sum(page.measure(part, contact_size) for part in line) + 4.5 * MM * (len(line) - 1)
                x = name_x - total / 2
            for part in line:
                page.text(x, cursor_y, part, size=contact_size, fill=muted_colour, line_height=1.35)
                x += page.measure(part, contact_size) + 4.5 * MM
            cursor_y += contact_size * 1.35

        if data["photo"] and design["photoShape"] != "none":
            px_x = (main_x + main_w / 2 - photo_size / 2 if centered
                    else main_x + main_w - photo_size if photo_right
                    else main_x)
            px_y = y if not centered else y - 2 * MM
            radius = int(photo_size / 2) if design["photoShape"] == "circle" else (
                int(3 * MM) if design["photoShape"] == "rounded" else 0)
            page.rect(px_x, px_y, photo_size, photo_size, palette["tint"], radius=radius)
            page.text(px_x + photo_size / 2, px_y + photo_size / 2 - 2.4, "PHOTO", size=7.4,
                      fill=palette["muted"], anchor="mm", spacing=0.8)
            if centered:
                identity_h += photo_size + 4 * MM

        y += identity_h

        if band_header:
            # .hdr-band: background covers the negative margin, name block and padding
            band_bottom = y + 6.5 * MM
            page.rect(0, 0, PAGE_W, band_bottom, palette["primary"])
            page.text(name_x, margin + 6.5 * MM, data["personal"]["fullName"], size=name_size, weight=700,
                      fill=on_primary, anchor=anchor, line_height=1.12)
            cursor_y = margin + 6.5 * MM + name_size * 1.12
            if data["personal"]["headline"]:
                cursor_y += 1.4 * MM
                page.text(name_x, cursor_y, data["personal"]["headline"], size=(base + 0.7) * PT,
                          fill=blend("#ffffff", palette["primary"], 0.84), anchor=anchor)
                cursor_y += (base + 0.7) * PT * 1.3
            cursor_y += 2.6 * MM
            for line in contact_lines:
                x = name_x
                if centered:
                    total = sum(page.measure(part, contact_size) for part in line) + 4.5 * MM * (len(line) - 1)
                    x = name_x - total / 2
                for part in line:
                    page.text(x, cursor_y, part, size=contact_size,
                              fill=blend("#ffffff", palette["primary"], 0.9), line_height=1.35)
                    x += page.measure(part, contact_size) + 4.5 * MM
                cursor_y += contact_size * 1.35
            if data["photo"] and design["photoShape"] != "none":
                px_x = (main_x + main_w / 2 - photo_size / 2 if centered
                        else main_x + main_w - photo_size if photo_right else main_x)
                page.rect(px_x, margin + 6.5 * MM, photo_size, photo_size,
                          blend("#ffffff", palette["primary"], 0.16),
                          radius=int(photo_size / 2) if design["photoShape"] == "circle" else 0)
                page.text(px_x + photo_size / 2, margin + 6.5 * MM + photo_size / 2 - 2.4, "PHOTO",
                          size=7.4, fill=blend("#ffffff", palette["primary"], 0.8), anchor="mm")
            y = band_bottom + gap

        elif header_style == "banner":
            page.rect(main_x, y + 1.4 * MM, main_w, 0.5 * MM, palette["primary"])
            y += 4.2 * MM + gap
        elif header_style == "dual":
            page.rect(main_x, y, main_w, 0.35 * MM, palette["accent"])
            page.rect(main_x, y + 4.6 * MM + identity_h + 4.6 * MM, main_w, 0.35 * MM, palette["accent"])
            y += identity_h + 4.6 * MM * 2 + gap
        elif header_style == "minimal":
            y += 2.4 * MM + gap
        else:
            y += gap

        if design["band"] > 0:
            page.rect(main_x, y, main_w, design["band"] * MM, palette["accent"])
            y += design["band"] * MM + gap


    # --------------------------------------------------------- sections
    def heading(title: str) -> bool:
        nonlocal y
        style = design["headingStyle"]
        label = title.upper() if design["upperHeadings"] else title
        size = (heading_size - 0.4 if style == "caps" else heading_size) * PT
        weight = 700
        spacing = (0.16 if style == "caps" else 0.11 if design["upperHeadings"] else 0.0) * size
        if style == "boxed":
            box_h = 8.4 * MM
            page.rect(main_x, y, main_w, box_h, palette["tint"])
            page.text(main_x + 2.6 * MM, y + 1.2 * MM, label, size=size, weight=weight,
                      fill=palette["primary"], spacing=spacing)
            y += box_h + 2.4 * MM
            return True
        if style == "side-mark":
            page.rect(main_x, y, 0.9 * MM, 5.4 * MM, palette["accent"])
            page.text(main_x + 4.4 * MM, y, label, size=size, weight=weight,
                      fill=palette["primary"], spacing=spacing)
            y += 5.4 * MM + 2.4 * MM
            return True
        text_x = main_x + (3.5 * MM if style == "bar" else 0)
        page.text(text_x, y, label, size=size, weight=weight, fill=palette["primary"], spacing=spacing)
        if style in ("rule", "caps", "underline", "bar"):
            label_w = page.measure(label, size, weight) + (spacing * len(label) if not bengali_text(label) else 0)
            rule_x = text_x + label_w + 3 * MM
            rule_h = {"underline": 0.55, "bar": 0.25, "caps": 0.25}.get(style, 0.25) * MM
            if rule_x < main_x + main_w - 4 * MM:
                page.rect(rule_x, y + size * 0.5, main_x + main_w - rule_x, rule_h,
                          palette["accent"] if style == "underline" else palette["primary"])
        if style == "bar":
            page.rect(main_x, y + 0.6 * MM, 1.1 * MM, 3.6 * MM, palette["accent"])
        y += size * 1.25 + 2.4 * MM
        return True

    def entry(item: dict) -> None:
        nonlocal y
        title_size = (base + 0.4) * PT
        page.text(main_x, y, item["title"], size=title_size, weight=600, fill=palette["text"])
        if item["period"]:
            period_size = (base - 0.8) * PT
            if design["entryLayout"] == "split":
                page.text(main_x + main_w, y, item["period"], size=period_size,
                          fill=palette["muted"], anchor="ra")
            elif design["entryLayout"] == "inline":
                offset = page.measure(item["title"], title_size, 600) + 2 * MM
                page.text(main_x + offset, y, f'· {item["period"]}', size=period_size, fill=palette["muted"])
            else:
                page.text(main_x, y + title_size * 1.3, item["period"], size=period_size, fill=palette["muted"])
                y += period_size * 1.3
        y += title_size * 1.3
        if item["subtitle"]:
            for line in wrap(page, item["subtitle"], (base - 0.3) * PT, main_w)[:1]:
                y += 0.5 * MM
                page.text(main_x, y, line, size=(base - 0.3) * PT, fill=palette["muted"])
                y += (base - 0.3) * PT * 1.35
        if item["meta"]:
            y += 0.6 * MM
            page.text(main_x, y, item["meta"], size=(base - 1.2) * PT, fill=palette["accent"])
            y += (base - 1.2) * PT * 1.35
        if item["bullets"]:
            y += 1.4 * MM
            for bullet in item["bullets"][:5]:
                bullet_size = (base - 0.3) * PT
                for line in wrap(page, bullet, bullet_size, main_w - 4 * MM)[:2]:
                    page.circle(main_x + 1.2 * MM, y + bullet_size * 0.62, 0.6 * MM, palette["accent"])
                    page.text(main_x + 4 * MM, y, line, size=bullet_size, fill=palette["text"])
                    y += bullet_size * 1.35 + 0.7 * MM
        if item["body"]:
            y += 1.2 * MM
            for line in wrap(page, item["body"], (base - 0.3) * PT, main_w)[:3]:
                page.text(main_x, y, line, size=(base - 0.3) * PT, fill=palette["text"])
                y += (base - 0.3) * PT * 1.35
        y += entry_gap
        if design["entryRule"]:
            page.rect(main_x, y - entry_gap / 2, main_w, 0.18 * MM, blend(palette["text"], "#ffffff", 0.86))

    def section_block(section: dict) -> bool:
        nonlocal y
        if not heading(section["title"]):
            return False
        if section["kind"] == "paragraph":
            for paragraph in section["paragraphs"]:
                for line in wrap(page, paragraph, base * PT, main_w):
                    if y > max_y:
                        return True
                    page.text(main_x, y, line, size=base * PT, fill=palette["text"], line_height=line_h)
                    y += base * PT * line_h
                y += 1.6 * MM
        elif section["kind"] == "chips":
            x = main_x
            row_h = 5.4 * MM
            for chip in section["chips"][:16]:
                w = page.measure(chip, (base - 0.9) * PT) + 4.4 * MM
                if x + w > main_x + main_w:
                    x = main_x
                    y += row_h + 1.4 * MM
                page.rect(x, y, w, row_h, palette["tint"], radius=int(1 * MM))
                page.draw.rectangle([x, y, x + w, y + row_h], outline=blend(palette["primary"], "#ffffff", 0.82))
                page.text(x + 2.2 * MM, y + 0.7 * MM, chip, size=(base - 0.9) * PT, fill=palette["text"])
                x += w + 1.8 * MM
            y += row_h + 2.4 * MM
        elif section["kind"] == "labelled-grid":
            rows = section["labelled"][:16]
            columns = 1 if len(rows) <= 1 else 2
            col_gap = 5 * MM if columns == 2 else 0
            col_w = (main_w - col_gap * (columns - 1)) / columns
            size = (base - 0.4) * PT
            dt_w = 34 * MM if columns == 1 else max(20 * MM, col_w * 0.42)
            dd_w = col_w - dt_w - 2 * MM
            offsets = [0.0] * columns
            for index, row in enumerate(rows):
                col = index % columns
                ox = main_x + col * (col_w + col_gap)
                row_y = y + offsets[col]
                page.text(ox, row_y, ellipsize(page, row["label"], size, dt_w - 2 * MM),
                          size=size, fill=palette["muted"])
                dd_lines = wrap(page, row["value"], size, dd_w)[:3] or [""]
                for line_index, line in enumerate(dd_lines):
                    page.text(ox + dt_w, row_y + line_index * size * 1.35, line,
                              size=size, fill=palette["text"])
                offsets[col] += max(1, len(dd_lines)) * size * 1.35 + 0.9 * MM
            y += max(offsets) + 2.4 * MM
        elif section["kind"] == "timeline":
            for item in section["timeline"]:
                if y > max_y - 12:
                    return True
                entry(item)

        return True

    consumed = 0
    for index, section in enumerate(sections):
        if is_rail and section["id"] in ("skills", "languages"):
            consumed = index + 1
            continue
        if y > max_y - 10:
            break
        if not section_block(section):
            break
        y += gap
        if y > max_y:
            consumed = index + 1
            break
        consumed = index + 1

    if data["signature"]:
        sign_y = min(y + 4 * MM, max_y - 8 * MM)
        page.rect(main_x + main_w - 46 * MM, sign_y, 46 * MM, 0.2 * MM,
                  blend(palette["text"], "#ffffff", 0.5))
        page.text(main_x + main_w, sign_y + 1.2 * MM, data["personal"]["fullName"],
                  size=(base - 1) * PT, fill=palette["muted"], anchor="ra")

    return page.img, y, consumed


def main() -> int:
    global FONT_FILES
    if not MODELS.exists():
        print(f"missing {MODELS}; run `npx vitest run tests/emit-models.test.ts`", file=sys.stderr)
        return 2
    FONT_FILES = prepare_fonts()
    models = json.loads(MODELS.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    total_pages = 0
    for model in models:
        remaining = list(model["sections"])
        page_no = 1
        while remaining:
            _, _, consumed = render(model, remaining, muted=True)
            if consumed <= 0:
                consumed = 1
            image, _, _ = render(model, remaining[:consumed], continuation=page_no > 1)
            suffix = "" if page_no == 1 else f"-p{page_no}"
            image.save(
                OUT / f'template-{model["templateId"]}-{model["language"]}{suffix}.png',
                "PNG",
                optimize=True,
            )
            total_pages += 1
            remaining = remaining[consumed:]
            page_no += 1
    print(f"rendered {total_pages} pages across {len(models)} previews into docs/images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
