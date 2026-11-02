"""Normalize the approved dimaher pair and assemble the final 57-file input.
This preparation writes only review artifacts, never WORK.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import hashlib, json, shutil

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def save(p,d): Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
files=[]
fog=read(ROOT/'output/fog-mob-redraw-20261029/metadata.json')
for r in fog['records']:
    expected=r.get('workSHA256') or r.get('sourceHashes',{}).get('standing' if r['phase']=='battle' else 'defeat')
    files.append(dict(path=r['runtimePath'],source=r['workspacePath'],after=r['sha256'],expectedBefore=expected,subset='fog',phase=r['phase'],key=r['key'],metadata=r))
sample_base=ROOT/'output/mob-regeneration-samples-20261029'
for r in read(sample_base/'manifest.json')['records']:
    if r['key']=='werewolf':continue
    files.append(dict(path=r['intendedRuntimePath'],source=str(sample_base/r['output']),after=r['outputSha256'],expectedBefore=r['currentWorkSha256'],subset='samples',phase=r['phase'],key=r['key'],metadata=r))
dim=ROOT/'output/dimaher-a-review-20261029'
dim_records=[]
for phase in ['battle','defeat']:
    r=read(dim/f'{phase}-selected.json')
    runtime='content/pic/mob/'+('defeated/' if phase=='defeat' else '')+'gladiator_dimaha_1.png'
    high=dim/'high-resolution'/f'dimaher_a_{phase}.png'
    high.parent.mkdir(parents=True,exist_ok=True)
    if not high.exists():shutil.copyfile(r['generatedPath'],high)
    assert sha(high)==sha(r['generatedPath'])
    target=dim/'game-ready'/runtime
    target.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(high) as im:
        im.load(); original_size=list(im.size)
        im.convert('RGB').resize((795,596),Image.Resampling.LANCZOS).save(target,optimize=True)
    refs=[dict(path=p,sha256=sha(p)) for p in r['references']]
    r.update(dict(key='dimaher_a',runtimePath=runtime,workspacePath=str(target),highResolution=str(high),generatedSHA256=sha(high),sourceSize=original_size,sha256=sha(target),bytes=target.stat().st_size,width=795,height=596,opaque=True,tool='built-in image_gen.imagegen',references=refs))
    dim_records.append(r)
    files.append(dict(path=runtime,source=str(target),after=r['sha256'],expectedBefore=sha(WORK/runtime),subset='dimaher_a',phase=phase,key='dimaher_a',metadata=r))
save(dim/'metadata.json',dict(reviewOnly=True,appliedToWork=False,records=dim_records))
sheet=Image.new('RGB',(820,340),'#242424');draw=ImageDraw.Draw(sheet)
for n,r in enumerate(dim_records):
    with Image.open(r['workspacePath']) as im:thumb=ImageOps.contain(im,(400,300))
    sheet.paste(thumb,(n*410+5,25));draw.text((n*410+8,7),r['phase'],fill='white')
sheet.save(dim/'SAMPLE_SHEET.jpg',quality=93)
assert len(files)==57 and len({f['path'].lower() for f in files})==57
mismatches=[]
for f in files:
    assert sha(f['source'])==f['after']
    with Image.open(f['source']) as im:
        im.load();assert im.format=='PNG' and im.size==(795,596)
        assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
    current=sha(WORK/f['path'])
    if f['expectedBefore'] and f['expectedBefore']!=current:
        mismatches.append(dict(path=f['path'],expected=f['expectedBefore'],current=current))
    f['before']=current
out=dict(id='mob-redraw-adopted-20261029',approval='지금까지 된거 전부 승인하니까 work와 이미지리스트에 반영해',files=files,qspBefore=sha(WORK/'jack.qsp'),summary=dict(files=57,fog=51,samplePairs=4,dimaherPair=2,oldWerewolfSampleSuperseded=True),sourceDrift=mismatches)
save(HERE/'manifest.json',out)
print(json.dumps(dict(files=len(files),qsp=out['qspBefore'],sourceDrift=mismatches),ensure_ascii=False))
