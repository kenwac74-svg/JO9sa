"""Remove only this batch's reproducible diagnostic copies after archiving evidence."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parent;REPO=Path('G:/somi/JO9sa');REC=REPO/'records/work-pending-batch-20261105'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def safe_remove_tree(p,allowed):
 p=p.absolute();allowed=allowed.absolute();assert p.is_relative_to(allowed) and p!=allowed
 assert not p.is_symlink() and not (hasattr(p,'is_junction') and p.is_junction()),p
 files=[]
 for q in p.rglob('*'):
  assert not q.is_symlink() and not (hasattr(q,'is_junction') and q.is_junction()),q
  if q.is_file():files.append((q,q.stat().st_size))
 size=sum(s for _,s in files);shutil.rmtree(p);return size,len(files)
def main():
 assert (REC/'FINAL_RESULT.json').is_file()
 for name in ['MANUAL_KO.md','verification.json','manual-annotations.json']:
  src=ROOT/'catalog'/name
  if src.exists():shutil.copy2(src,REC/'catalog'/name)
 src=ROOT.parent/'hard-trait-price-20261104/FACTION_REPUTATION_S_PLUS_PENDING.json'
 shutil.copy2(src,REC/'faction/original-extracted.json')
 for name in ['native-verification.json','coverage.json','README_KO.md']:
  shutil.copy2(ROOT/'images'/name,REC/'images'/name)
 report={'removedBytes':0,'removedFiles':0,'targets':[],'preservedRecovery':'G:/Codex/tmp/jo9-work-batch-20261105-recovery','sourcesAndFinalArtworkDeleted':False}
 dirs=[]
 for folder in ['tax','images','faction']:
  p=ROOT/folder/'native'
  if p.exists():dirs.append((p,ROOT))
 for name in ['generated','sourcecopy']:
  p=ROOT/'catalog'/name
  if p.exists():dirs.append((p,ROOT))
 val=Path('G:/Codex/tmp/jo9-work-batch-20261105-validation')
 for run in val.glob('run-*'):
  for child in ['client','patches']:
   p=run/child
   if p.exists():dirs.append((p,val))
 for p,allowed in dirs:
  size,count=safe_remove_tree(p,allowed);report['targets'].append({'path':str(p),'bytes':size,'files':count});report['removedBytes']+=size;report['removedFiles']+=count
 files=list(ROOT.rglob('*.qsp'))+list(val.glob('run-*/*.qsp'))+list(val.glob('run-*/*.qsp.bak_*'))
 state=Path('G:/Codex/tmp/jo9-work-batch-20261105-state/state.sav')
 if state.exists():files.append(state)
 candidate=ROOT.parent/'girls-checklist-20261104/catalog.updated.html'
 if candidate.exists():files.append(candidate)
 for name in ['condition-block.html','metadata.json','work-candidate.html','seed-candidate.html']:
  p=ROOT/'catalog'/name
  if p.exists():files.append(p)
 for p in files:
  assert p.is_file() and not p.is_symlink();size=p.stat().st_size;p.unlink();report['targets'].append({'path':str(p),'bytes':size,'files':1});report['removedBytes']+=size;report['removedFiles']+=1
 # Keep the sole pre-change WORK and distinct tracked-QSP recovery snapshots.
 recovery=Path(report['preservedRecovery']);assert (recovery/'work-before.qsp').is_file() and (recovery/'tracked-before.qsp').is_file()
 (ROOT/'cleanup.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8');shutil.copy2(ROOT/'cleanup.json',REC/'cleanup.json')
 result=json.loads((REC/'FINAL_RESULT.json').read_text(encoding='utf8'));result.update(validationVerdict='PASS',validationFixtureIssueResolved='An expected old-version notification in a diagnostic state copy; original SAV unchanged',temporaryDiagnosticsRemovedBytes=report['removedBytes'],sceneBlockSha256='36a403fc7521684f75f33dd762f5a490f84c0420aac7f9aa0f8d2c07ebfc37b1')
 (REC/'FINAL_RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');(ROOT/'FINAL_RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 assert digest(Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'))==result['qspSha256']
 print(json.dumps({'removedMiB':round(report['removedBytes']/1048576,1),'removedFiles':report['removedFiles'],'qspSha256':result['qspSha256'],'recoveryPreserved':True},indent=2))
if __name__=='__main__':main()
