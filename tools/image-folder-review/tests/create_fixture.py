import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('--root', required=True, type=Path)
args = parser.parse_args()
a, b = args.root / '원본 폴더', args.root / '비교 폴더'
for side, root, color in [('original', a, '#365e55'), ('comparison', b, '#42627f')]:
    root.mkdir(parents=True, exist_ok=True)
    names = ['dt_pink_short_milf_3.png', 'dt_pink_short_milf_4.png', '1092_bath_2.png', 'other/dt_pink_short_milf_3.png']
    if side == 'original':
        names += ['dt_pink_short_milf_10.png', 'single.png']
    else:
        names += ['extra (2).png']
    names += [f'bulk_{i}.png' for i in range(1,46)]
    for name in names:
        p = root / name
        p.parent.mkdir(parents=True, exist_ok=True)
        image = Image.new('RGB', (960, 620), color)
        draw = ImageDraw.Draw(image)
        draw.rounded_rectangle((30, 30, 930, 590), radius=30, outline='#abc1c7', width=4)
        draw.text((70, 100), side.upper() + '\n\n' + name, fill='white', font_size=30)
        image.save(p)
print(json.dumps({'original': str(a), 'comparison': str(b)}, ensure_ascii=False))
