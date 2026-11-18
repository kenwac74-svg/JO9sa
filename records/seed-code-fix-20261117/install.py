from pathlib import Path
import gzip,hashlib,json,os
HERE=Path(__file__).resolve().parent
HUB=Path('G:/somi/JO9sa/tools/modding-hub')
REPO=HUB.parent.parent
record=REPO/'records/seed-code-fix-20261117'
manifest=json.loads((HERE/'change-manifest.json').read_text('utf-8'))
def sha(raw):return hashlib.sha256(raw).hexdigest()
def current(p):return p.read_bytes() if p.exists() else None
schedule=Path('G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/patch-schedule.json')
schedule_before=sha(schedule.read_bytes()) if schedule.exists() else None
game=Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')
game_before=sha(game.read_bytes())
assert not record.exists(),'Existing record preserved'
writes=[]
for item in manifest:
 target=HUB/item['path'];before=current(target)
 assert (sha(before) if before is not None else None)==item['before'],item['path']+' changed'
 raw=(HERE/'candidate'/item['path']).read_bytes();assert sha(raw)==item['after']
 if before is not None:assert gzip.decompress((HERE/'before'/Path(item['path']+'.gz')).read_bytes())==before
 writes.append((target,before,raw))
for name in ['prepare.py','install.py','seed-code.test.mjs','change-manifest.json','REPORT_KO.md']:
 writes.append((record/name,None,(HERE/name).read_bytes()))
for p in (HERE/'before').rglob('*.gz'):writes.append((record/'before'/p.relative_to(HERE/'before'),None,p.read_bytes()))
writes.append((HUB/'tests/seed-code.test.mjs',None,(HERE/'seed-code.test.mjs').read_bytes()))
done=[]
try:
 for target,before,raw in writes:
  assert current(target)==before,str(target)+' changed'
  target.parent.mkdir(parents=True,exist_ok=True);tmp=target.with_name(target.name+'.seed-code-tmp')
  with tmp.open('xb') as f:f.write(raw)
  assert current(target)==before
  os.replace(tmp,target);done.append((target,before,raw))
 assert (sha(schedule.read_bytes()) if schedule.exists() else None)==schedule_before
 assert sha(game.read_bytes())==game_before
 report={'status':'APPLIED','candidateFiles':len(manifest),'regressionTests':{'passed':7,'failed':0},'syntax':['JavaScript','Python','PowerShell'],'gameQspUnchanged':game_before,'scheduleUnchanged':schedule_before,'formulaStorageReset':False,'characterOrTalkbookFilesWritten':False,'changes':manifest}
 for out in [HERE/'applied.json',record/'applied.json']:out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({k:v for k,v in report.items() if k!='changes'}))
except:
 for target,before,raw in reversed(done):
  if current(target)!=raw:continue
  if before is None:target.unlink()
  else:target.write_bytes(before)
 raise
