from pathlib import Path
import gzip,hashlib,json,os
HERE=Path(__file__).resolve().parent;HUB=Path('G:/somi/JO9sa/tools/modding-hub');REPO=HUB.parent.parent
record=REPO/'records/direct-workspace-20261117';assert not record.exists()
manifest=json.loads((HERE/'change-manifest.json').read_text('utf-8'));http=json.loads((HERE/'http-verification.json').read_text('utf-8'));assert http['status']=='PASS'
sha=lambda raw:hashlib.sha256(raw).hexdigest()
current=lambda p:p.read_bytes() if p.exists() else None
game=Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');schedule=game.parent/'modtools/catalog/patch-schedule.json'
unchanged={str(p):sha(p.read_bytes()) for p in [game,schedule]}
writes=[]
for item in manifest:
 target=HUB/item['path'];before=current(target);assert (sha(before) if before is not None else None)==item['before'],str(target)+' changed'
 raw=(HERE/'candidate'/item['path']).read_bytes();assert sha(raw)==item['after']
 if before is not None:assert gzip.decompress((HERE/'before'/Path(item['path']+'.gz')).read_bytes())==before
 writes.append((target,before,raw))
for name in ['PLAN_KO.md','prepare.py','install.py','direct-entry.test.cjs','router.test.mjs','http-test.py','http-verification.json','change-manifest.json']:
 writes.append((record/name,None,(HERE/name).read_bytes()))
for file in (HERE/'before').rglob('*.gz'):writes.append((record/'before'/file.relative_to(HERE/'before'),None,file.read_bytes()))
done=[]
try:
 for target,before,raw in writes:
  assert current(target)==before,str(target)+' changed'
  target.parent.mkdir(parents=True,exist_ok=True);tmp=target.with_name(target.name+'.direct-workspace-tmp')
  with tmp.open('xb') as f:f.write(raw)
  assert current(target)==before;os.replace(tmp,target);done.append((target,before,raw))
 for p,h in unchanged.items():assert sha(Path(p).read_bytes())==h
 report={'status':'APPLIED','files':len(manifest),'expectedBuild':http['build'],'newEntry':'workspace-app.mjs','oldAppBootstrapRemoved':True,'storageKeysUnchanged':True,'gameAndScheduleUnchanged':unchanged,'newSavedFields':0}
 for target in [HERE/'applied.json',record/'applied.json']:target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(report,ensure_ascii=False))
except:
 for target,before,raw in reversed(done):
  if current(target)!=raw:continue
  if before is None:target.unlink()
  else:target.write_bytes(before)
 raise
