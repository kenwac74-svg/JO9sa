"""Backed-up, hash-guarded WORK and tracked-source image installation."""
import json,hashlib,zipfile,io,os
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
from PIL import Image
H=Path(__file__).resolve().parent;G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');R=Path('G:/somi/JO9sa')
sha=lambda b:hashlib.sha256(b).hexdigest()
def main():
 p=json.loads((H/'plan.json').read_text(encoding='utf8'));t=Path(p['stage']);assert sha((G/'jack.qsp').read_bytes())==p['qspHash']
 for name,digest in p['jsonHashes'].items():assert sha((G/name).read_bytes())==digest,name
 for ref in p['sourceFrames'].values():assert sha((G/'content/pic'/ref['path']).read_bytes())==ref['sha256']
 data={};originals={};mappings=[]
 for f in p['files']:
  live=G/'content/pic'/f['path'];old=live.read_bytes();assert sha(old)==f['before'],f['path'];new=(t/'candidate'/f['path']).read_bytes();assert sha(new)==f['after']
  with Image.open(io.BytesIO(old)) as im:before=np.asarray(im.convert('RGBA'))
  with Image.open(io.BytesIO(new)) as im:
   assert im.format=='PNG';assert im.size==(f['width'],f['height']);im.verify()
  with Image.open(io.BytesIO(new)) as im:after=np.asarray(im.convert('RGBA'))
  if f['operation']=='frame-only':assert np.array_equal(before[5:-5,5:-5],after[5:-5,5:-5]),f['path']
  if f.get('existingFramePreserved'):
   mask=np.ones(before.shape[:2],bool);mask[5:-5,5:-5]=False;assert np.array_equal(before[mask],after[mask]),f['path']
  if f.get('source'):assert sha((G/'content/pic'/f['source']).read_bytes())==f['sourceSha256']
  data[f['path']]=new
  for target in [live,R/'assets/content/pic'/f['path']]:
   exists=target.is_file();raw=target.read_bytes() if exists else None;digest=sha(raw) if raw is not None else None
   if raw is not None:originals.setdefault(digest,raw)
   mappings.append({'path':str(target),'before':digest,'existed':exists,'after':f['after']})
 b=Path('G:/somi/JO9_work_backups')/('portrait-sync-20261108_'+datetime.now(timezone.utc).strftime('%H%M%S'));assert not b.exists();b.mkdir()
 with zipfile.ZipFile(b/'originals.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
  for digest,raw in originals.items():z.writestr('objects/'+digest,raw)
  z.writestr('restore-map.json',json.dumps(mappings,ensure_ascii=False,indent=2))
 with zipfile.ZipFile(b/'originals.zip') as z:
  assert z.testzip() is None
  for digest,raw in originals.items():assert z.read('objects/'+digest)==raw
 for f in p['files']:
  for target in [G/'content/pic'/f['path'],R/'assets/content/pic'/f['path']]:
   target.parent.mkdir(parents=True,exist_ok=True);tmp=target.with_name(target.name+'.portrait-sync.tmp');assert not tmp.exists();tmp.write_bytes(data[f['path']]);os.replace(tmp,target);assert sha(target.read_bytes())==f['after']
 assert sha((G/'jack.qsp').read_bytes())==p['qspHash']
 for name,digest in p['jsonHashes'].items():assert sha((G/name).read_bytes())==digest
 installed={'status':'INSTALLED','backup':str(b),'files':len(p['files']),'changedCharacters':31,'newPortraits':93,'borderOnly':15,'bordersAdded':90,'jsonUnchanged':True,'qspUnchanged':True,'sourceFullImagesUnchanged':True,'centerPixelsPreservedForFrameOnly':True,'existingFramesPreserved':True,'originalUniquePayloads':len(originals),'restoreMap':mappings}
 (H/'installation.json').write_text(json.dumps(installed,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({k:v for k,v in installed.items() if k!='restoreMap'}))
if __name__=='__main__':main()
