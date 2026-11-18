"""Prepare a mechanical bottom-rim resize; never write into the game/repository."""
from pathlib import Path
from PIL import Image, ImageChops, ImageOps
import hashlib
import json
import re

HERE = Path(__file__).resolve().parent
GAME = Path("G:/somi/Jack O Nine Tails v2.4_work/game")
PNG_REL = Path("content/pic/ui/grimdark/bg.png")
CSS_REL = Path("css/base.css")

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

source_bytes = (GAME / PNG_REL).read_bytes()
source = Image.open(GAME / PNG_REL)
source.load()
assert source.size == (1280, 800)
candidate = source.copy()
# The gold top bevel begins at y780; the complete old band is 20 pixels.
# Continue the immediately adjacent parchment/vertical strips for ten rows,
# then resize the actual complete rim 20->10 pixels without changing width.
candidate.paste(ImageOps.flip(source.crop((0, 770, 1280, 780))), (0, 780))
rim = source.crop((0, 780, 1280, 800)).convert('RGB').resize(
    (1280, 10), Image.Resampling.LANCZOS)
if source.mode == 'P':
    rim = rim.quantize(palette=source, dither=Image.Dither.NONE)
candidate.paste(rim, (0, 790))
assert ImageChops.difference(source.crop((0, 0, 1280, 780)),
                             candidate.crop((0, 0, 1280, 780))).getbbox() is None
assert candidate.size == source.size and candidate.mode == source.mode
if source.mode == 'P':
    assert candidate.getpalette() == source.getpalette()
png_out = HERE / "game" / PNG_REL
png_out.parent.mkdir(parents=True, exist_ok=True)
candidate.save(png_out, format="PNG", optimize=True)
opened = Image.open(png_out)
opened.load()
assert opened.size == source.size and opened.mode == source.mode
assert ImageChops.difference(opened, candidate).getbbox() is None

css_before = (GAME / CSS_REL).read_bytes()
css_text = css_before.decode("utf-8-sig")
pattern = (r'/\* JO9 MOD START SCENE_BOTTOM_FRAME_HALF_20261112 \*/\r?\n'
           r'[\s\S]*?/\* JO9 MOD END SCENE_BOTTOM_FRAME_HALF_20261112 \*/\r?\n\r?\n')
css_after, count = re.subn(pattern, '', css_text)
assert count == 1 and "jo9_scene_bottom_frame" not in css_after
css_bytes = (b'\xef\xbb\xbf' if css_before.startswith(b'\xef\xbb\xbf') else b'') + css_after.encode('utf-8')
css_out = HERE / "game" / CSS_REL
css_out.parent.mkdir(parents=True, exist_ok=True)
css_out.write_bytes(css_bytes)

# The root task merges this one exact deletion into the latest WORK QSP.
qsp_old = ("! JO9 MOD START SCENE_BOTTOM_FRAME_HALF_20261112\r\n"
           "if instr('|shop_general|interaction_screen_city|interaction_screen|slave_sell|choice_screen|','|'+$curloc+'|') > 0: *p '<div id=\"jo9_scene_bottom_frame\" aria-hidden=\"true\"></div>'\r\n"
           "! JO9 MOD END SCENE_BOTTOM_FRAME_HALF_20261112\r\n")
(HERE / 'qsp-edit.json').write_text(json.dumps({
    'location': '_layout', 'field': 'body', 'old': qsp_old, 'new': '', 'count': 1,
    'patchId': 'ACTUAL_BOTTOM_RIM_HALF_20261117'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Compact source-asset proof with original and candidate 4x vertically enlarged.
proof = Image.new('RGB', (1280, 240), '#181818')
proof.paste(source.crop((0, 770, 1280, 800)).resize((1280, 120), Image.Resampling.NEAREST).convert('RGB'), (0, 0))
proof.paste(candidate.crop((0, 770, 1280, 800)).resize((1280, 120), Image.Resampling.NEAREST).convert('RGB'), (0, 120))
proof.save(HERE / 'rim-before-after-4x.png')

report = {
    'source': str(GAME / PNG_REL), 'sourceSha256': sha(source_bytes),
    'candidate': str(png_out), 'candidateSha256': sha(png_out.read_bytes()),
    'sizeBeforeAfter': list(source.size), 'modeBeforeAfter': source.mode,
    'rimResize': 'LANCZOS in RGB then quantized to the unchanged original PNG palette',
    'oldBand': {'top': 780, 'height': 20, 'width': 1280},
    'newBand': {'top': 790, 'height': 10, 'width': 1280},
    'unchangedPixels': 'all pixels in rows 0..779',
    'recoveredPanelRows': '780..789 mirror-extended from immediately adjacent source rows779..770 to avoid a texture reset seam',
    'cssBeforeSha256': sha(css_before), 'cssAfterSha256': sha(css_bytes),
    'cssChange': 'remove only SCENE_BOTTOM_FRAME_HALF_20261112; retain prior text scroll dimensions and existing body pseudo elements',
    'qspChange': 'remove only the 3-line SCENE_BOTTOM_FRAME_HALF_20261112 block from _layout',
    'proof': 'rim-before-after-4x.png: original upper half, candidate lower half; all source pixels enlarged4x vertically',
    'nativeVisualCheck': 'pending user restart and visible confirmation',
    'writes': 'only local artifact folder; no WORK/repository/Full writes',
}
(HERE / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
