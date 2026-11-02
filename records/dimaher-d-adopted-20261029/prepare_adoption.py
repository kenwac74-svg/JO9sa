"""Prepare D adoption, with an existing battle file and a missing defeat file."""
from pathlib import Path
from PIL import Image
import json,hashlib
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
review=ROOT/'output/dimaher-d-review-20261029';metadata=load(review/'metadata.json')
base={r['path'].replace('\\','/').lower():r for r in load(review/'baseline.json')}
files=[]
for r in metadata['records']:
    p=r['runtimePath'];old=base[str(WORK/p).replace('\\','/').lower()]
    assert (WORK/p).exists()==old['exists'],p
    expected=old['sha256'];assert not old['exists'] or sha(WORK/p)==expected,p
    assert sha(r['workspacePath'])==r['sha256'],p
    with Image.open(r['workspacePath']) as im:
        im.load();assert im.format=='PNG' and im.size==(795,596)
        assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
    files.append(dict(path=p,source=r['workspacePath'],after=r['sha256'],before=expected,phase=r['phase'],key='dimaher_d',metadata=r))
assert len(files)==2 and sum(f['before'] is None for f in files)==1
manifest=dict(id='dimaher-d-adopted-20261029',approval='work에 반영하고 리스트도 갱신해',files=files,qspBefore=sha(WORK/'jack.qsp'),sourceDrift=[])
(HERE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
src=Path('G:/somi/JO9sa/records/dimaher-e-adopted-20261029/adopt_work.cjs').read_text(encoding='utf-8')
src=src.replace('DIMAHER_E_ADOPTION_20261029','DIMAHER_D_ADOPTION_20261029').replace('dimaher-e-adopted-20261029','dimaher-d-adopted-20261029').replace('dimaher_e','dimaher_d').replace('쌍수 투사E','쌍수 투사D')
src=src.replace("const v=JSON.parse(read(review+'/manifest.json'))", "const currentSha=p=>fs.existsSync(p)?sha(p):null;\nconst v=JSON.parse(read(review+'/manifest.json'))")
src=src.replace("sha(game+'/'+f.path)","currentSha(game+'/'+f.path)")
old="a(fs.realpathSync(game+'/'+f.path).toLowerCase().startsWith(fs.realpathSync(game).toLowerCase()+path.sep));"
new="a(fs.realpathSync(fs.existsSync(game+'/'+f.path)?game+'/'+f.path:path.dirname(game+'/'+f.path)).toLowerCase().startsWith(fs.realpathSync(game).toLowerCase()+path.sep));"
assert old in src;src=src.replace(old,new)
src=src.replace("f.beforePath=backup+'/original/'+f.path;", "f.beforePath=f.before===null?null:backup+'/original/'+f.path;")
old="fs.mkdirSync(path.dirname(f.beforePath),{recursive:true});fs.copyFileSync(game+'/'+f.path,f.beforePath,fs.constants.COPYFILE_EXCL);a.equal(sha(f.beforePath),f.before);"
new="if(f.beforePath){fs.mkdirSync(path.dirname(f.beforePath),{recursive:true});fs.copyFileSync(game+'/'+f.path,f.beforePath,fs.constants.COPYFILE_EXCL);a.equal(sha(f.beforePath),f.before);}"
assert old in src;src=src.replace(old,new)
src=src.replace("a.equal(sha(p),f.before);ct.atomic(p,b)","a.equal(currentSha(p),f.before);ct.atomic(p,b)")
src=src.replace("const summary={files:2,", "const summary={files:2,newRuntimeFiles:files.filter(f=>f.before===null).length,replacedRuntimeFiles:files.filter(f=>f.before!==null).length,")
old="context.lastImageAdoption={date:'2026-10-29',record:id,files:2,standingAndDefeatOnly:true,qspChanged:false};"
new=old+"\nm.summary={...m.summary,missingStanding:m.entries.filter(e=>e.standing?.path&&!affected.has(e.standing.path.toLowerCase())&&!fs.existsSync(game+'/'+e.standing.path)).length,missingDefeat:m.entries.filter(e=>e.defeat?.path&&!affected.has(e.defeat.path.toLowerCase())&&!fs.existsSync(game+'/'+e.defeat.path)).length};"
assert old in src;src=src.replace(old,new)
(HERE/'adopt_work.cjs').write_text(src,encoding='utf-8')
print(json.dumps(dict(files=2,newFile=1,existingFile=1,script=str(HERE/'adopt_work.cjs'))))
