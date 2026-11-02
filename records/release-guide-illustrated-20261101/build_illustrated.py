from pathlib import Path
from PIL import Image
from html import escape
import base64, hashlib, io, json, re, subprocess, sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

protected = [ROOT/'content.json', ROOT/'content.en.groups.json', ROOT/'content.en.fixes.json',
             ROOT/'JO9_2.4.1_Forum_KO.txt', ROOT/'JO9_2.4.1_Forum_EN.txt',
             GAME/'jack.qsp', Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp')]
before = {str(p): sha(p) for p in protected}

# The original builders remain unchanged and reproduce the original publication.
subprocess.run([sys.executable, str(ROOT/'build.py')], check=True, capture_output=True)
subprocess.run([sys.executable, str(ROOT/'build_bilingual.py')], check=True, capture_output=True)

assets = {
    'ogre': ('content/pic/mob/ogre.png', 0,
             '안개경계 전투 · 거대한 오우거', 'Fog Border combat · the towering ogre'),
    'cat_execute': ('content/pic/scene/catfdef1.png', 1,
                    '캣파이트 승리 · 상대를 처형한 뒤', 'Catfight victory · after executing the opponent'),
    'cat_spare': ('content/pic/scene/catdef2.png', 1,
                  '캣파이트 승리 · 상대를 살려준 뒤', 'Catfight victory · after sparing the opponent'),
    'col_death': ('content/pic/scene/coldef1.png', 1,
                  '콜로세움 패배 · 출전한 노예의 전투 부상 사망', 'Colosseum defeat · your slave dies from battle wounds'),
    'col_survive': ('content/pic/scene/coldef3.png', 1,
                    '콜로세움 패배 · 살아남은 노예의 후송', 'Colosseum defeat · your surviving slave is carried to safety'),
    'col_victory': ('content/pic/scene/arena_victory_spare.png', 2,
                    '콜로세움 승리 · 상대를 살려준 뒤', 'Colosseum victory · after sparing the opponent'),
    'isabella': ('content/pic/bg/isabella_meeting.png', 3,
                 '이사벨라 · 현재 외형으로 갱신한 술집 장면', 'Isabella · the tavern scene with her updated appearance'),
    'egeya': ('content/pic/mob/egeya.png', 3,
              '에게야 · 글라디우스를 든 결투', 'Egeya · a duel fought with a gladius'),
    'group': ('content/pic/mob/defeated/groups/paladin_group.png', 4,
              '안개경계 · 성기사 일행의 단체 패배', 'Fog Border · the paladin and soldiers defeated together'),
}

encoded = {}
image_report = []
for key, (rel, feature, ko, en) in assets.items():
    source = GAME/rel
    raw = source.read_bytes()
    with Image.open(io.BytesIO(raw)) as original:
        original_size = original.size
        im = original.convert('RGB')
        im.thumbnail((560, 560), Image.Resampling.LANCZOS)
        w, h = im.size
        buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=78, method=6)
    binary = buf.getvalue()
    encoded[key] = (base64.b64encode(binary).decode(), w, h)
    image_report.append({'key': key, 'source': rel, 'source_sha256': hashlib.sha256(raw).hexdigest(),
                         'original_size': original_size, 'width': w, 'height': h,
                         'embedded_bytes': len(binary), 'feature_index': feature,
                         'caption_ko': ko, 'caption_en': en})

css = '''
/* Illustrated guide: each explanation keeps its corresponding artwork. */
.feature-grid{display:flex;flex-direction:column;gap:26px}
.feature-grid>.feature{display:block;grid-column:auto;border-top:1px solid var(--line)}
.feature-grid>.feature .feature-copy{padding:24px 26px 20px}
.feature-grid>.feature h3{font-size:22px}
.feature-media{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:0 26px 24px}
.feature-media figure{min-width:0;border:1px solid #465044;background:#111713;border-radius:3px;overflow:hidden}
.feature-media figure img{width:100%;height:auto;aspect-ratio:auto;object-fit:contain;max-height:none}
.feature-media figcaption{padding:9px 12px 11px;font-size:11px;line-height:1.6;color:#bbc4b4}
.feature-grid>.media-single{display:grid;grid-template-columns:1fr 1fr;align-items:center}
.media-single .feature-copy{grid-column:1;grid-row:1}
.media-single .feature-media{grid-column:2;grid-row:1;grid-template-columns:1fr;padding:22px 22px 22px 0}
@media(max-width:720px){
 .feature-grid>.media-single{display:block}
 .feature-media{padding:0 18px 20px;gap:14px}
 .media-single .feature-media{padding:0 18px 20px}
 .feature-grid>.feature .feature-copy{padding:20px 20px 18px}
 .feature-grid>.feature h3{font-size:21px}
}
@media(max-width:520px){.feature-media{grid-template-columns:1fr}}
@media print{
 .feature-grid>.media-single{display:block}
 .feature-media,.media-single .feature-media{padding:0 12px 12px;grid-template-columns:repeat(2,minmax(0,1fr))}
 .feature-media figure{break-inside:avoid;background:#fff}
 .feature-media figure img{max-height:150px;object-fit:contain}
 .feature-media figcaption{color:#444}
}
'''

reports = []
for locale, filename, datafile, basereport in [
    ('ko','JO9_2.4.1_업데이트안내.html','content.json','build-report.json'),
    ('en','JO9_2.4.1_Update_Guide_EN.html','content.en.json','build-report.en.json')
]:
    data = json.loads((ROOT/datafile).read_text(encoding='utf-8'))
    html = (ROOT/filename).read_text(encoding='utf-8')
    cards = []
    for index, item in enumerate(data['features241']):
        chosen = [(key, row) for key, row in assets.items() if row[1] == index]
        figures = []
        for key, (_, _, caption_ko, caption_en) in chosen:
            b64,w,h = encoded[key]
            caption = caption_ko if locale == 'ko' else caption_en
            figures.append(f'<figure data-image-key="{key}"><img src="data:image/webp;base64,{b64}" width="{w}" height="{h}" alt="{escape(caption)}" loading="lazy" decoding="async"><figcaption>{escape(caption)}</figcaption></figure>')
        items = '<ul>'+''.join('<li>'+escape(s)+'</li>' for s in item.get('items', []))+'</ul>' if item.get('items') else ''
        classes = 'feature media-single' if len(chosen) == 1 else 'feature media-multiple'
        cards.append(f'<article class="{classes}"><div class="feature-copy"><p class="eyebrow">UPDATE {index+1:02}</p><h3>{escape(item["title"])}</h3><p>{escape(item["body"])}</p>{items}</div><div class="feature-media">'+''.join(figures)+'</div></article>')
    start = html.index('<div class="feature-grid">')
    end = html.index('<div class="notice"><strong>', start)
    html = html[:start]+'<div class="feature-grid">'+''.join(cards)+'</div>\n'+html[end:]
    html = html.replace('</style>', css+'\n</style>', 1)
    assert len(re.findall(r'<img\b', html)) == 10
    assert len(html.encode('utf-8')) < 800*1024
    destination = ROOT/filename
    destination.write_text(html, encoding='utf-8')
    city = next(row for row in json.loads((ROOT/basereport).read_text(encoding='utf-8'))['embedded_images'] if row['key'] == 'city')
    reports.append({'locale':locale, 'file':str(destination), 'bytes':destination.stat().st_size,
                    'sha256':sha(destination), 'images':[city]+image_report})

for path, expected in before.items():
    assert sha(Path(path)) == expected, 'Protected file changed: '+path
for row in image_report:
    assert sha(GAME/row['source']) == row['source_sha256']
report = {'files':reports, 'protected_hashes':before, 'total_images_per_language':10,
          'source_images_unchanged':True,'forum_texts_unchanged':True}
(ROOT/'illustrated-build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':[{k:v for k,v in row.items() if k!='images'} for row in reports],
                  'images_per_language':10,'protected_files_unchanged':True},ensure_ascii=False))
