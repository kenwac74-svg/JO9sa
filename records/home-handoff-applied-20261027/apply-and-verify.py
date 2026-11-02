"""Apply only the final 52 writes/7 retirements to current WORK, with rollback.

Input: the audited final game-delta, not older staged application scripts.
Output: exact WORK payloads plus compact records and minimal external originals.
QSP, Full, original game, saves, tool settings and review projects are read only.
"""
from pathlib import Path, PurePosixPath
import datetime, hashlib, importlib.util, json, os, shutil, subprocess, uuid

REPO=Path('G:/somi/JO9sa');WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
FULL=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game');ORIGINAL=Path('G:/somi/JO9O/game')
REC=REPO/'records/home-handoff-applied-20261027';TMP=Path('G:/Codex/tmp/home-handoff-apply-20261027')
BACKUP=Path('G:/somi/JO9_work_backups')/('home_handoff_20261027_'+uuid.uuid4().hex[:8])
EXPECTED_HEAD='f8c37eaa06799e530726fcee863a2dcb6d260f8e';REPARSE=0x400
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(2**20),b''):h.update(b)
 return h.hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):
 p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('x',encoding='utf-8') as f:json.dump(v,f,ensure_ascii=False,indent=2);f.write('\n')
def safe(root,relative):
 q=PurePosixPath(relative);assert not q.is_absolute() and '..' not in q.parts and '\\' not in relative and ':' not in relative,relative
 p=root/relative;assert p.resolve().is_relative_to(root.resolve()),relative
 for ancestor in [p,*p.parents]:
  if ancestor.exists():assert not (ancestor.lstat().st_file_attributes & REPARSE),'Linked path: '+str(ancestor)
 return p
def info(p):
 if not p.exists():return {'exists':False}
 assert p.is_file() and not p.is_symlink(),p
 return {'exists':True,'bytes':p.stat().st_size,'sha256':sha(p)}
def selected(root,paths):return {p:info(safe(root,p)) for p in paths}
def save_inventory(root):
 base=root/'save';files={}
 if not base.exists():return files
 for current,dirs,names in os.walk(base,followlinks=False):
  for d in dirs:assert not (Path(current,d).lstat().st_file_attributes & REPARSE),'Linked save directory'
  for n in names:
   p=Path(current,n);assert not (p.lstat().st_file_attributes & REPARSE),'Linked save file'
   files[p.relative_to(root).as_posix()]=info(p)
 return files
def metadata_inventory(root):
 if not root.exists():return {}
 out={}
 for current,dirs,names in os.walk(root,followlinks=False):
  dirs[:]=[d for d in dirs if d.lower() not in {'cache','thumbs','thumbnails','__pycache__'} and not (Path(current,d).lstat().st_file_attributes & REPARSE)]
  for n in names:
   p=Path(current,n)
   if p.suffix.lower() in {'.json','.sqlite','.db'} and not (p.lstat().st_file_attributes & REPARSE):out[p.relative_to(root).as_posix()]=info(p)
 return out
def registry():
 raw=subprocess.check_output(['node',str(REPO/'tools/qa/check-slave-template-ids.cjs'),str(WORK/'json/slaves')],cwd=REPO,text=True,encoding='utf-8')
 report=json.loads(raw);assert report['valid'] and not report['collisions'] and not report['issues'];return report

assert not REC.exists(),'Inspect any earlier application before reusing this record'
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()==EXPECTED_HEAD
manifest=load(REPO/'records/home-handoff-20261027/game-delta.json')
assert len(manifest['writes'])==52 and len(manifest['deletes'])==7 and manifest['qspChanged'] is False and manifest['savesChanged'] is False
assert len({r['path'].lower() for r in manifest['writes']+manifest['deletes']})==59
assert sum(r['path'].endswith('.json') for r in manifest['writes'])==19
assert sum(r['path'].endswith('.png') for r in manifest['writes'])==33
spec=importlib.util.spec_from_file_location('handoff_verifier',REPO/'tools/verify-home-handoff-20261027.py');verify=importlib.util.module_from_spec(spec);spec.loader.exec_module(verify)
assert not verify.check(REPO,manifest,WORK,'preflight')
red=verify.check(REPO,manifest,WORK,'applied');assert red,'Already fully applied; inspect before rerun'
exits=load(TMP/'test-exits.json');assert set(exits)=={'verifier','folderReview','js'} and all(v==0 for v in exits.values())
paths=[r['path'] for r in manifest['writes']+manifest['deletes']]
config_files=[WORK/'config.xml',WORK/'FastQSP.ini',REPO/'tools/local-workspace/local.config.json']
review_data=Path(load(config_files[-1])['catalog'])/'folder-review'
protected={'workQsp':info(WORK/'jack.qsp'),'fullQsp':info(FULL/'jack.qsp'),'originalQsp':info(ORIGINAL/'jack.qsp'),
 'fullSelected':selected(FULL,paths),'originalSelected':selected(ORIGINAL,paths),
 'workSaves':save_inventory(WORK),'fullSaves':save_inventory(FULL),
 'settings':{str(p):info(p) for p in config_files},'reviewData':str(review_data),'reviewMetadata':metadata_inventory(review_data)}
assert protected['workQsp']['sha256']==manifest['qspSha256']
before=selected(WORK,paths);before_registry=registry();REC.mkdir();BACKUP.mkdir(parents=True)
write(REC/'preflight.json',{'status':'PASS','sourceCommit':EXPECTED_HEAD,'sourceManifestSha256':sha(REPO/'records/home-handoff-20261027/game-delta.json'),'writeCount':52,'retirementCount':7,'appliedCheckBefore':'EXPECTED_FAILURE','appliedCheckBeforeErrors':len(red),'registryBefore':before_registry})
write(REC/'protected-before.json',protected);write(REC/'targets-before.json',before)
write(REC/'plan.json',{'sourceCommit':EXPECTED_HEAD,'applyOrder':['PNG','character JSON','slave_index JSON','exact retirements'],'WORK':str(WORK),'externalBackup':str(BACKUP),'newQspCode':False,'FullWrites':False,'saveMigration':False,'newCommitOrPush':False})
shutil.copyfile(__file__,REC/'apply-and-verify.py')
for rel,record in before.items():
 if record['exists']:
  original=safe(WORK,rel);assert info(original)==record
  target=safe(BACKUP,rel);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(original,target);assert info(target)==record
write(BACKUP/'BACKUP_INDEX.json',{'WORK':str(WORK),'before':before,'sourceCommit':EXPECTED_HEAD})
stage=TMP/'payload';stage.mkdir()
for row in manifest['writes']:
 source=safe(REPO,row['source']);target=safe(stage,row['path']);target.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(source,target);assert sha(target)==row['afterSha256']
assert not verify.check(REPO,manifest,WORK,'preflight'),'WORK changed before writes'
completed=[]
try:
 order=sorted(manifest['writes'],key=lambda r:(0 if r['path'].endswith('.png') else 2 if r['path']=='json/slave_index.json' else 1,r['path']))
 for row in order:
  dest=safe(WORK,row['path']);current=info(dest);assert current==before[row['path']],'Concurrent target edit: '+row['path']
  dest.parent.mkdir(parents=True,exist_ok=True);os.replace(safe(stage,row['path']),dest)
  assert sha(dest)==row['afterSha256'];completed.append({'kind':'write','path':row['path'],'afterSha256':row['afterSha256']})
 for row in manifest['deletes']:
  dest=safe(WORK,row['path'])
  if dest.exists():assert sha(dest)==row['beforeSha256'];dest.unlink();completed.append({'kind':'retire','path':row['path']})
 assert not verify.check(REPO,manifest,WORK,'applied')
 after_registry=registry()
 after_protected={'workQsp':info(WORK/'jack.qsp'),'fullQsp':info(FULL/'jack.qsp'),'originalQsp':info(ORIGINAL/'jack.qsp'),
  'fullSelected':selected(FULL,paths),'originalSelected':selected(ORIGINAL,paths),'workSaves':save_inventory(WORK),'fullSaves':save_inventory(FULL),
  'settings':{str(p):info(p) for p in config_files},'reviewData':str(review_data),'reviewMetadata':metadata_inventory(review_data)}
 assert after_protected==protected,'Protected inputs changed'
except Exception:
 for row in reversed(completed):
  dest=safe(WORK,row['path']);old=before[row['path']]
  if row['kind']=='write':assert dest.exists() and sha(dest)==row['afterSha256'],'Do not roll over a concurrent user edit'
  if old['exists']:
   saved=safe(BACKUP,row['path']);assert info(saved)==old;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(saved,dest)
  elif dest.exists():dest.unlink()
 write(REC/'ROLLBACK_RESULT.json',{'status':'RESTORED_BEFORE_STATE','restored':len(completed),'targetsMatch':selected(WORK,paths)==before})
 raise
for name in ['verifier-tests.log','folder-review-tests.log','js-syntax.log','test-exits.json']:shutil.copyfile(TMP/name,REC/name)
result={'status':'WORK_APPLIED_AND_VERIFIED','sourceCommit':EXPECTED_HEAD,'WORK':str(WORK),'writes':52,'jsonWrites':19,'pngWrites':33,'retirements':7,
 'sourceAndTargetHashesAndExactCase':'PASS','appliedCheckBeforeFailed':True,'appliedCheckAfterPassed':True,
 'registryBefore':before_registry,'registryAfter':after_registry,'verifierFixtureTests':19,'folderReviewTests':34,'jsSyntax':'PASS',
 'qspChanged':False,'qspSha256':manifest['qspSha256'],'savesUnchanged':True,'workSaveFiles':len(protected['workSaves']),'fullSaveFiles':len(protected['fullSaves']),
 'FullChanged':False,'originalChanged':False,'settingsChanged':False,'reviewDataChanged':False,'reviewData':str(review_data),
 'backup':str(BACKUP),'backupFileCount':sum(r['exists'] for r in before.values()),'backupBytes':sum(r.get('bytes',0) for r in before.values()),
 'folderReviewVersion':'1.1.0','activeReviewServerBefore':False,'nativeGameplayVerified':False,'existingSaveMigration':False,
 'pending':['1447 replacement image set','1448 Siru unique acquisition event and random-generation exclusion','Old saved green1179 cache verification'],
 'newCommit':False,'push':False,'packageBuilt':False}
write(REC/'FINAL_RESULT.json',result)
print(json.dumps(result,ensure_ascii=False),flush=True)
