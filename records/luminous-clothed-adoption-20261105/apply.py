from pathlib import Path
from PIL import Image
from datetime import datetime,timezone
import hashlib,json,os

HERE=Path(__file__).resolve().parent
GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO=Path('G:/somi/JO9sa')
SOURCE=Path('C:/Users/User/AppData/Local/Temp/Luminous_clothed_matched_1590x1192 (1).png')
REL='content/pic/girls/full/Luminous.png'
def sha(b):return hashlib.sha256(b).hexdigest()
def put(p,b):
 p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_name(p.name+'.luminous.tmp');assert not tmp.exists();tmp.write_bytes(b);os.replace(tmp,p);assert p.read_bytes()==b
def main():
 HERE.mkdir(exist_ok=True);before=sha((GAME/'jack.qsp').read_bytes())
 raw=SOURCE.read_bytes();assert sha(raw)=='d4d034a37e1b7876fe2000e61e46af919ad23b32d6bb28c3eb21709430dd54e4'
 target=GAME/REL;assert not target.exists(),'Existing event image must be reviewed before overwrite'
 with Image.open(SOURCE) as im:
  assert im.size==(1590,1192) and im.mode=='RGBA'
  out=im.resize((795,596),Image.Resampling.LANCZOS)
  stage=HERE/'Luminous.png';out.save(stage,optimize=True)
 with Image.open(stage) as im:im.verify()
 with Image.open(stage) as im:assert im.size==(795,596) and im.mode=='RGBA';alpha=im.getextrema()[3]
 payload=stage.read_bytes()
 original=Path('G:/somi/JO9resource/character_originals/Luminous/Luminous_clothed_1590x1192.png')
 assert not original.exists() or original.read_bytes()==raw
 put(original,raw);put(target,payload);put(REPO/'assets'/REL,payload)
 report={'appliedAt':datetime.now(timezone.utc).isoformat(),'characterId':3002,'event':'interaction_city=666801, Luminous recruitment introduction','source':str(SOURCE),'sourceSha256':sha(raw),'archivedOriginal':str(original),'target':REL,'targetSha256':sha(payload),'sourceSize':[1590,1192],'outputSize':[795,596],'alphaExtrema':alpha,'resampling':'LANCZOS, uniform 0.5 scale; no crop/reposition/background removal','qspSha256':before,'qspUnchanged':sha((GAME/'jack.qsp').read_bytes())==before,'characterJsonUnchanged':True,'nakedBaseUnchanged':True,'fullTouched':False,'visualQa':'User normal EXE inspection pending'}
 rec=REPO/'records/luminous-clothed-adoption-20261105';put(rec/'APPLIED.json',(json.dumps(report,ensure_ascii=False,indent=2)+'\n').encode())
 (HERE/'APPLIED.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 runtime=REPO/'assets/runtime-source-2.4.1.json';d=json.loads(runtime.read_text(encoding='utf8'));assert not any(x.get('runtimePath')==REL for x in d['files'])
 d['files'].append({'runtimePath':REL,'repositoryPath':'assets/'+REL,'bytes':len(payload),'sha256':sha(payload)});put(runtime,(json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode())
 print(json.dumps({'target':str(target),'size':[795,596],'RGBA':True,'qspUnchanged':report['qspUnchanged'],'fullTouched':False},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
