from PIL import Image
from pathlib import Path
import hashlib
import json

source = Path('G:/somi/Jack O Nine Tails v2.4_work/game/content/modworkpic/승리한 검투사와 황금의 경기장.png')
output = Path(__file__).parent / 'catdef2.png'
raw = source.read_bytes()
with Image.open(source) as image:
    original_size = image.size
    image.convert('RGB').resize((795, 596), Image.Resampling.LANCZOS).save(output, 'PNG', optimize=True)
with Image.open(output) as image:
    image.verify()
with Image.open(output) as image:
    assert image.size == (795, 596) and image.mode == 'RGB'
assert source.read_bytes() == raw
result = {'source': str(source), 'sourceSize': original_size, 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'output': str(output), 'size': [795, 596], 'mode': 'RGB', 'bytes': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'sourcePreserved': True, 'method': 'Lanczos resize only; no crop, repaint, or compositing'}
(Path(__file__).parent / 'resize-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({key: result[key] for key in ['size', 'mode', 'bytes', 'sourcePreserved']}))
