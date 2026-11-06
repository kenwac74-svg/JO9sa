"""Felicity same-path image replacement and one-pass outfit alignment."""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json

HERE = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
SOURCE = Path('C:/Users/User/AppData/Local/Temp/2026-11-05_10-37-41_687d (1)_795x596.png')
SCALE = 1.36
PLACEMENT = {'maid': (-149, -211), 'mistress': (-171, -205), 'secretary': (-204, -213)}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    applied_path = HERE / 'applied.json'
    previous = json.loads(applied_path.read_text(encoding='utf-8')) if applied_path.exists() else None
    originals = {r['runtimePath']: r for r in previous['files']} if previous else {}
    source = SOURCE if SOURCE.exists() else GAME / 'content/pic/girls/full/felicity_blond_long.png'
    assert digest(source) == '1b8ee1efcab2e2d9e0042b753cca40c4d9bb0d51f0b6f35a289635c2ba77087b'
    assert Image.open(source).size == (795, 596)
    rows = []
    for name in ['felicity_blond_long.png', 'felicity_blond_long_young.png']:
        rel = 'content/pic/girls/full/' + name
        target = HERE / 'images' / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.read_bytes())
        before = originals[rel]['before'] if rel in originals else digest(GAME / rel)
        rows.append({'path': rel, 'before': before, 'after': digest(target),
                     'source': str(source), 'operation': 'replace_basic_exact_bytes'})
    for role, placement in PLACEMENT.items():
        rel = f'content/pic/girls/full/{role}/felicity.png'
        original = Path(originals[rel]['beforePath']) if rel in originals else GAME / rel
        if rel in originals:
            assert digest(original) == originals[rel]['before']
        im = Image.open(original).convert('RGBA')
        size = tuple(round(x * SCALE) for x in im.size)
        # Premultiplication prevents hidden RGB in transparent pixels bleeding out.
        resized = im.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')
        dest = Image.new('RGBA', (795, 596))
        dest.alpha_composite(resized, placement)
        # Existing source art ends at the bottom; keep that edge outside the frame.
        assert size[1] + placement[1] >= 596
        target = HERE / 'images' / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        dest.save(target)
        rows.append({'path': rel, 'before': digest(original), 'after': digest(target),
                     'source': str(original), 'operation': 'uniform_scale_translation',
                     'scale': SCALE, 'translation': placement, 'resizedCanvas': size,
                     'alpha': 'premultiplied LANCZOS; no threshold/matte extraction',
                     'bbox': dest.getchannel('A').getbbox()})
    (HERE / 'prepared.json').write_text(json.dumps({'id': 'felicity-size-match-20261105', 'files': rows}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    sheet = Image.new('RGB', (1590, 1252), '#4b5052')
    draw = ImageDraw.Draw(sheet)
    for i, (row, label) in enumerate(zip([rows[j] for j in [0, 2, 3, 4]], ['NEW BASIC', 'MAID', 'MISTRESS', 'SECRETARY'])):
        x, y = i % 2 * 795, i // 2 * 626
        im = Image.open(HERE / 'images' / row['path']).convert('RGBA')
        sheet.paste(Image.alpha_composite(Image.new('RGBA', im.size, '#4b5052'), im).convert('RGB'), (x, y + 30))
        draw.text((x + 15, y + 8), label, fill='white')
    sheet.save(HERE / 'review.jpg', quality=94)
    print('Prepared 5 PNG paths, 4 unique images; 795x596; basic exact copy, 3 outfits uniformly aligned.')


if __name__ == '__main__':
    main()
