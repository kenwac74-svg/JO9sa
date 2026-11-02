from pathlib import Path
from PIL import Image
import json,hashlib,shutil,numpy as np
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');T=Path('G:/Codex/tmp/mob-portrait-frames-20261029');R=Path('G:/somi/JO9sa/records/mob-portrait-frames-20261029');B=Path('G:/somi/JO9_work_backups/mob-portrait-frames-20261029')
p=json.loads((T/'plan.json').read_text(encoding='utf-8'));sha=lambda q:hashlib.sha256(q.read_bytes()).hexdigest();assert sha(G/'jack.qsp')==p['qspSHA256'];assert not B.exists()
unsupported=G/'content/pic/mob/gladiator_prisoners_ava.png';unsupported_sha=sha(unsupported)
for row in p['rows']:
 assert not row.get('requiresQspApproval');target=G/row['path'];candidate=T/'candidate'/row['path'];assert sha(target)==row['before'];assert sha(candidate)==row['after']
 before=np.asarray(Image.open(target).convert('RGBA'));after=np.asarray(Image.open(candidate).convert('RGBA'));assert np.array_equal(before[18:132,18:132],after[18:132,18:132]);assert after.shape==(150,150,4)
 frame=np.asarray(Image.open(T/'frames'/(row['category']+'.png')).convert('RGBA'));mask=frame[:,:,3]==255;assert np.array_equal(after[mask],frame[mask])
B.mkdir(parents=True)
for row in p['rows']:
 target=G/row['path'];backup=B/'original'/row['path'];backup.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,backup);assert sha(backup)==row['before']
for row in p['rows']:
 if row['before']==row['after']:continue
 candidate=T/'candidate'/row['path'];target=G/row['path'];target.write_bytes(candidate.read_bytes());assert sha(target)==row['after']
assert sha(G/'jack.qsp')==p['qspSHA256'];assert sha(unsupported)==unsupported_sha
R.mkdir(parents=True,exist_ok=True)
for name in ['prepare.py','plan.json','comparison.png']:
 shutil.copy2(T/name,R/name)
frame_out=Path('G:/somi/JO9sa/assets/mob-portrait-frames-20261029');frame_out.mkdir(parents=True,exist_ok=True)
for f in (T/'frames').glob('*.png'):shutil.copy2(f,frame_out/f.name)
result={'status':'INSTALLED','portraitsVerified':len(p['rows']),'changed':sum(r['before']!=r['after'] for r in p['rows']),'unchanged':sum(r['before']==r['after'] for r in p['rows']),'qspUnchanged':True,'qspSha256':p['qspSHA256'],'sharedSpawn':'default; no alias or QSP change','backup':str(B),'dimensions':[150,150],'sourceCenterUnchanged':[18,18,132,132],'nonPortraitTrophiesUnchanged':True,'excludedFileUnchanged':{'path':'content/pic/mob/gladiator_prisoners_ava.png','sha256':unsupported_sha},'files':p['rows']}
(R/'installation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');(B/'restore-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print({k:v for k,v in result.items() if k!='files'})
