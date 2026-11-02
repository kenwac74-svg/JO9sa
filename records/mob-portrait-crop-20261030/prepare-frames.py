"""Extract immutable MOB portrait shells without retaining source face pixels.

Only writes frame-data.json and an optional synthetic preview beside this file.
The aperture is the exact inclusive Pillow ImageDraw.polygon mask used by the
approved 2026-10-29 frame preparation. Source PNG files are read only.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw


REPO = Path("G:/somi/JO9sa")
SOURCE_DIR = REPO / "assets/mob-portrait-frames-20261029"
PLAN = REPO / "records/mob-portrait-frames-20261029/plan.json"
HERE = Path(__file__).resolve().parent
LABELS = {
    "default": "기본",
    "undead": "언데드",
    "elite": "중·고위급",
    "colosseum": "콜로세움",
    "race": "경주",
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=True)
    return stream.getvalue()


def mask_for(size: tuple[int, int], polygon: list[list[int]]) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon([tuple(point) for point in polygon], fill=255)
    return mask


def packed_shell(image: Image.Image, mask: Image.Image) -> bytes:
    """RGBA bytes outside the aperture, ordered by image row then column."""
    return bytes(
        channel
        for pixel, interior in zip(image.get_flattened_data(), mask.get_flattened_data())
        if not interior
        for channel in pixel
    )


def make_preview(frames: dict, overlays: dict[str, Image.Image]) -> Image.Image:
    """Synthetic colors show aperture boundaries; no source faces are drawn."""
    sheet = Image.new("RGB", (470 * len(frames), 705), "#202126")
    draw = ImageDraw.Draw(sheet)
    for index, (key, frame) in enumerate(frames.items()):
        x = index * 470
        synthetic = Image.new("RGBA", (150, 150), (0, 0, 0, 255))
        pixels = synthetic.load()
        for yy in range(150):
            for xx in range(150):
                # Bright deliberately artificial colors make shell leaks clear.
                pixels[xx, yy] = (
                    30 + round(180 * xx / 149),
                    185 - round(115 * yy / 149),
                    210 if (xx // 12 + yy // 12) % 2 else 100,
                    255,
                )
        final = Image.alpha_composite(synthetic, overlays[key])
        draw.text((x + 12, 10), key + " / native 150 x 150", fill="white")
        sheet.paste(final.convert("RGB"), (x + 160, 35))
        draw.text((x + 12, 205), "3x nearest: frame and aperture boundary", fill="white")
        sheet.paste(final.resize((450, 450), Image.Resampling.NEAREST).convert("RGB"), (x + 10, 230))
    return sheet


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview", action="store_true", help="Write synthetic frame-preview.png for visual QA")
    args = parser.parse_args()
    plan = json.loads(PLAN.read_text(encoding="utf-8-sig"))
    frames, overlays, checks = {}, {}, []
    for key, label in LABELS.items():
        source = SOURCE_DIR / (key + ".png")
        source_bytes = source.read_bytes()
        with Image.open(io.BytesIO(source_bytes)) as opened:
            assert opened.format == "PNG", source
            source_image = opened.convert("RGBA")
        assert source_image.size == (150, 150), (source, source_image.size)
        polygon = plan["apertures"][key]
        mask = mask_for(source_image.size, polygon)
        overlay = source_image.copy()
        # Zero RGB too: alpha-only removal would retain hidden original faces.
        overlay.paste((0, 0, 0, 0), (0, 0, 150, 150), mask)
        encoded = png_bytes(overlay)
        with Image.open(io.BytesIO(encoded)) as decoded:
            decoded.load()
            roundtrip = decoded.convert("RGBA")
        assert roundtrip.size == source_image.size
        source_shell = packed_shell(source_image, mask)
        assert packed_shell(roundtrip, mask) == source_shell, key + ": shell changed"
        assert all(
            pixel == (0, 0, 0, 0)
            for pixel, interior in zip(roundtrip.get_flattened_data(), mask.get_flattened_data())
            if interior
        ), key + ": original face pixels retained in aperture"
        assert roundtrip.tobytes() == overlay.tobytes(), key + ": PNG round-trip changed pixels"
        left, top, right, bottom = mask.getbbox()  # Pillow bbox has exclusive right/bottom.
        interior_count = sum(value != 0 for value in mask.get_flattened_data())
        shell_count = 150 * 150 - interior_count
        frames[key] = {
            "label": label,
            "width": 150,
            "height": 150,
            "aperture": polygon,
            "innerBounds": {"x": left, "y": top, "width": right - left, "height": bottom - top},
            "framePng": base64.b64encode(encoded).decode("ascii"),
            "sourcePath": source.relative_to(REPO).as_posix(),
            "sourceSha256": sha(source_bytes),
            "shellPixelSha256": sha(source_shell),
            "framePngSha256": sha(encoded),
            "shellPixels": shell_count,
            "aperturePixels": interior_count,
            "shellAlphaValues": sorted({pixel[3] for pixel, interior in zip(roundtrip.get_flattened_data(), mask.get_flattened_data()) if not interior}),
        }
        overlays[key] = roundtrip
        checks.append({"frame": key, "shellExact": True, "apertureRgbaZero": True, "pngRoundtripExact": True})
    payload = {
        "version": 1,
        "geometry": {
            "aperture": "Exact Pillow ImageDraw.polygon integer rasterization; polygon boundary pixels are included in the aperture.",
            "innerBounds": "x/y are inclusive top-left; width/height count pixels, equivalent to Pillow exclusive-right/bottom getbbox.",
            "shellPixelSha256": "SHA-256 of source decoded RGBA pixels outside the aperture in row-major order, channels RGBA.",
            "framePng": "Raw PNG base64 without a data-URL prefix. Aperture RGBA is exactly zero; outside RGBA equals source.",
        },
        "planPath": PLAN.relative_to(REPO).as_posix(),
        "planSha256": sha(PLAN.read_bytes()),
        "frames": frames,
        "verification": checks,
    }
    target = HERE / "frame-data.json"
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Verify the actual on-disk JSON and every embedded image once more.
    saved = json.loads(target.read_text(encoding="utf-8"))
    for key, frame in saved["frames"].items():
        encoded = base64.b64decode(frame["framePng"], validate=True)
        assert sha(encoded) == frame["framePngSha256"]
        with Image.open(io.BytesIO(encoded)) as decoded:
            image = decoded.convert("RGBA")
            assert sha(packed_shell(image, mask_for(image.size, frame["aperture"]))) == frame["shellPixelSha256"]
    if args.preview:
        preview = HERE / "frame-preview.png"
        make_preview(frames, overlays).save(preview, format="PNG")
    print(json.dumps({"status": "PASS", "frames": len(frames), "output": str(target), "verification": checks}, ensure_ascii=False))


if __name__ == "__main__":
    main()
