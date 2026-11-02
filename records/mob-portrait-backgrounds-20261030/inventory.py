from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, json, math
ROOT=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
OUT=Path(__file__).parent
OUT.mkdir(parents=True,exist_ok=True)
rows=[]
for p in sorted((ROOT/'content/pic/mob').rglob('*')):
    if p.suffix.lower() not in ('.png','.jpg','.jpeg') or not p.is_file(): continue
    with Image.open(p) as im:
        if im.size!=(150,150): continue
        rows.append({'path':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':im.mode})
extra=ROOT/'content/pic/characters/mistress_ava.png'
if extra.exists(): rows.append({'path':extra.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(extra.read_bytes()).hexdigest(),'mode':Image.open(extra).mode})
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
for start in range(0,len(rows),48):
    group=rows[start:start+48]; cols=8; cellw=180;cellh=185
    sheet=Image.new('RGB',(cols*cellw,math.ceil(len(group)/cols)*cellh),'#d2c6af');d=ImageDraw.Draw(sheet)
    for j,row in enumerate(group):
        x=(j%cols)*cellw;y=(j//cols)*cellh
        im=Image.open(ROOT/row['path']).convert('RGBA');sheet.paste(im,(x+15,y+22),im)
        name=Path(row['path']).name
        d.text((x+4,y+3),f'{start+j:03d} {name}',font=font,fill='black')
    sheet.save(OUT/f'inventory-{start//48+1}.jpg',quality=92)
(OUT/'inventory.json').write_text(json.dumps({'root':str(ROOT),'qspSha256':hashlib.sha256((ROOT/'jack.qsp').read_bytes()).hexdigest(),'rows':rows},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'portraits':len(rows),'sheets':math.ceil(len(rows)/48)}))
