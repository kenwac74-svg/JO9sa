from pathlib import Path
from PIL import Image
import json,hashlib,shutil,datetime,os
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
R=Path('G:/somi/JO9sa/records/mob-image-size-standard-20261029')
B=Path('G:/somi/JO9_work_backups/mob-size-standard-20261029')
I=json.loads((R/'inventory.json').read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def safe_member(root,rel):
 p=root.joinpath(*Path(rel).parts).absolute()
 assert root.absolute() in p.parents,str(p)
 assert not p.is_symlink(),str(p)
 return p
assert sha(G/'jack.qsp')==I['qspSha256'],'QSP changed since inventory; parent must refresh'
assert not B.exists(),'Unique backup root already exists; do not overwrite'
selected=[x for x in I['files'] if x.get('kind')=='battle_artwork' and (x.get('needsResize') or x.get('format')!='PNG')]
assert len(selected)==82,len(selected)
rows=[];skipped=[]
# Prepare every output without touching WORK.
for x in selected:
 source=safe_member(G,x['path'])
 if sha(source)!=x['sha256']:
  skipped.append({'path':x['path'],'reason':'changed since inventory','expected':x['sha256'],'actual':sha(source)});continue
 with Image.open(source) as original:
  assert not getattr(original,'is_animated',False),x['path']
  rgba=original.convert('RGBA');factor=min(795/original.width,596/original.height)
  resized=(max(1,round(original.width*factor)),max(1,round(original.height*factor)))
  offset=((795-resized[0])//2,(596-resized[1])//2)
  image=rgba if resized==rgba.size else rgba.resize(resized,Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',(795,596),(0,0,0,0));canvas.paste(image,offset)
  output=safe_member(R/'normalized',x['path']);output.parent.mkdir(parents=True,exist_ok=True)
  assert not output.exists(),'Do not overwrite prepared output'
  canvas.save(output,format='PNG',optimize=True)
  with Image.open(output) as check:
   assert check.size==(795,596) and check.format=='PNG'
   assert check.mode=='RGBA'
  rows.append({'path':x['path'],'roles':x['roles'],'before':x['sha256'],'after':sha(output),'beforeBytes':x['bytes'],'afterBytes':output.stat().st_size,'sourceDimensions':[x['width'],x['height']],'targetDimensions':[795,596],'sourceMode':x['mode'],'sourceFormat':x['format'],'targetMode':'RGBA','targetFormat':'PNG','geometry':{'scale':factor,'resized':list(resized),'offset':list(offset),'padding':[795-resized[0],596-resized[1]],'method':'contain; preserve aspect; no crop; Lanczos; transparent padding'},'sourceAlphaRange':x['alphaRange'],'backup':str(B/'original'/x['path']),'normalizedOutput':str(output),'state':'prepared'})
B.mkdir(parents=True)
manifest={'status':'PREPARED','startedKST':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat(),'game':str(G),'backupRoot':str(B),'qspSha256':I['qspSha256'],'selected':len(selected),'skipped':skipped,'files':rows,'scope':'Existing real battle art only. Portraits, Grinch fallback, catalog, resources/new, Full, QSP unchanged.'}
def save_manifest():
 (R/'installation.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
 (B/'restore-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
save_manifest()
# Copy and verify every original before the first WORK write.
for row in rows:
 source=safe_member(G,row['path'])
 current=sha(source)
 if current!=row['before']:
  row['state']='skipped_concurrent_change';manifest['skipped'].append({'path':row['path'],'reason':'changed before backup','expected':row['before'],'actual':current});continue
 backup=safe_member(B/'original',row['path']);backup.parent.mkdir(parents=True,exist_ok=True)
 assert not backup.exists();shutil.copy2(source,backup);assert sha(backup)==row['before'];row['state']='backed_up'
save_manifest()
for row in rows:
 if row['state']!='backed_up':continue
 target=safe_member(G,row['path']);current=sha(target)
 if current!=row['before']:
  row['state']='skipped_concurrent_change';manifest['skipped'].append({'path':row['path'],'reason':'changed immediately before write','expected':row['before'],'actual':current});save_manifest();continue
 source=Path(row['normalizedOutput']);assert sha(source)==row['after']
 # Whole-file replacement after verified backup. No crossing shells or computed delete.
 target.write_bytes(source.read_bytes());assert sha(target)==row['after'];row['state']='applied';save_manifest()
assert sha(G/'jack.qsp')==I['qspSha256']
portrait_verified=0
for x in I['files']:
 if x.get('exists') and 'portrait' in x['roles']:
  assert sha(G/x['path'])==x['sha256'],x['path'];portrait_verified+=1
remaining=[]
for x in I['files']:
 if x.get('kind')=='battle_artwork':
  with Image.open(G/x['path']) as im:
   if im.size!=(795,596) or im.format!='PNG':remaining.append({'path':x['path'],'size':list(im.size),'format':im.format})
manifest['status']='INSTALLED' if not manifest['skipped'] and not remaining else 'PARTIAL_WITH_SKIPS'
manifest['applied']=sum(x['state']=='applied' for x in rows)
manifest['portraitHashesPreserved']=portrait_verified
manifest['qspUnchanged']=True
manifest['remainingNonstandardRealArt']=remaining
manifest['alreadyCorrectUntouched']=sum(x.get('kind')=='battle_artwork' and not x.get('needsResize') and x.get('format')=='PNG' for x in I['files'])
manifest['changedBytesDelta']=sum(x['afterBytes']-x['beforeBytes'] for x in rows if x['state']=='applied')
manifest['completedKST']=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat()
save_manifest()
print(json.dumps({k:v for k,v in manifest.items() if k not in ['files','skipped']},ensure_ascii=False))
print('SKIPPED',manifest['skipped'])
