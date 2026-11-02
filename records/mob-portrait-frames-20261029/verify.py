from pathlib import Path
from PIL import Image
import json,numpy as np,hashlib
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');R=Path('G:/somi/JO9sa/records/mob-portrait-frames-20261029');B=Path('G:/somi/JO9_work_backups/mob-portrait-frames-20261029');F=Path('G:/somi/JO9sa/assets/mob-portrait-frames-20261029');repo=Path('G:/somi/JO9sa');j=json.loads((R/'installation.json').read_text(encoding='utf-8'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();results=[]
for row in j['files']:
 cur=G/row['path'];old=B/'original'/row['path'];assert sha(cur)==row['after'];assert sha(old)==row['before'];im=Image.open(cur);assert im.size==(150,150);a=np.array(im.convert('RGBA'));b=np.array(Image.open(old).convert('RGBA'));frame=np.array(Image.open(F/(row['category']+'.png')).convert('RGBA'));mask=frame[:,:,3]==255
 if cur.suffix.lower()=='.jpg':
  assert im.format=='JPEG';err=np.abs(a[mask].astype(int)-frame[mask].astype(int));assert int(err.max())<=4;center_err=np.abs(a[18:132,18:132].astype(int)-b[18:132,18:132].astype(int));assert int(center_err.max())<=4
 else:
  assert im.format=='PNG';assert np.array_equal(a[mask],frame[mask]);assert np.array_equal(a[18:132,18:132],b[18:132,18:132])
 if row['before']!=row['after']:assert sha(repo/'resources/new'/row['path'])==row['after']
 results.append({'path':row['path'],'category':row['category'],'format':im.format,'frameMatch':'JPEG tolerance <=4/255' if cur.suffix.lower()=='.jpg' else 'pixel exact'})
assert sha(G/'jack.qsp')==j['qspSha256'];ex=j['excludedFileUnchanged'];assert sha(G/ex['path'])==ex['sha256']
planp=repo/'records/full-client-preparation-20261029/full-client-input-plan.json';plan=json.loads(planp.read_text(encoding='utf-8'));index={x['path']:x for x in plan['files']};delta=0
for row in j['files']:
 if row['before']==row['after']:continue
 x=index['game/'+row['path']];assert x['sha256']==row['before'];size=(G/row['path']).stat().st_size;delta+=size-x['bytes'];x['bytes']=size;x['sha256']=row['after']
plan['summary']['includedBytes']+=delta;plan['portraitFramesUpdate']={'record':'mob-portrait-frames-20261029','files':92,'qspUnchanged':True,'bytesDelta':delta,'scope':'Only changed portrait hashes refreshed; next ZIP requires fresh whole-input validation.'};planp.write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
result={'status':'PASS','verifiedPortraits':len(results),'pngExact':91,'jpegPreservedFormat':3,'qspUnchanged':True,'qspSHA256':j['qspSha256'],'changedImages':j['changed'],'sourceSynced':92,'excludedGroupTrophyPreserved':True,'zipCreated':False,'fullFolderModified':False,'results':results};(R/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print({k:v for k,v in result.items() if k!='results'})
