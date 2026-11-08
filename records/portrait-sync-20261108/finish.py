import json,hashlib,zipfile,csv,io
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import numpy as np
H=Path(__file__).resolve().parent;G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');R=Path('G:/somi/JO9sa')
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf8'))
def main():
 plan=load(H/'plan.json');installed=load(H/'installation.json');http=load(H/'http-verification.json');track=load(H/'tracking.json');cat=load(H/'catalog-reconciliation.json');t=Path(plan['stage'])
 assert http['httpImages']==108 and http['allBytesMatchWork'];assert sha((G/'jack.qsp').read_bytes())==plan['qspHash']
 for rel,digest in plan['jsonHashes'].items():assert sha((G/rel).read_bytes())==digest
 rawfiles={}
 for f in plan['files']:
  raw=(G/'content/pic'/f['path']).read_bytes();assert sha(raw)==f['after'];assert raw==(R/'assets/content/pic'/f['path']).read_bytes();rawfiles[f['path']]=raw
  with Image.open(io.BytesIO(raw)) as im:assert im.format=='PNG' and im.size==(f['width'],f['height']);im.verify()
  if f.get('source'):assert sha((G/'content/pic'/f['source']).read_bytes())==f['sourceSha256']
 assert sha((G/'modtools/catalog/catalog_status.js').read_bytes())==track['statusHash']
 for c in cat['catalogs']:assert sha(Path(c['path']).read_bytes())==c['sha256']
 with zipfile.ZipFile(Path(installed['backup'])/'originals.zip') as z:
  assert z.testzip() is None
  for f in plan['files']:
   before=z.read('objects/'+f['before']);assert sha(before)==f['before']
   with Image.open(io.BytesIO(before)) as im:a=np.asarray(im.convert('RGBA'))
   with Image.open(io.BytesIO(rawfiles[f['path']])) as im:b=np.asarray(im.convert('RGBA'))
   if f['operation']=='frame-only':assert np.array_equal(a[5:-5,5:-5],b[5:-5,5:-5])
   if f.get('existingFramePreserved'):
    mask=np.ones(a.shape[:2],bool);mask[5:-5,5:-5]=False;assert np.array_equal(a[mask],b[mask])
  border=[f for f in plan['files'] if f['operation']=='frame-only'];sheet=Image.new('RGB',(1000,3*190),'#eeeeee');dr=ImageDraw.Draw(sheet)
  for i,f in enumerate(border[::3]):
   x=(i%3)*330;y=(i//3)*190;dr.text((x+4,y+3),Path(f['path']).stem,fill='black')
   for offset,raw in [(0,z.read('objects/'+f['before'])),(155,rawfiles[f['path']])]:
    with Image.open(io.BytesIO(raw)) as im:sheet.paste(im.convert('RGB'),(x+offset+4,y+23))
  sheet.save(H/'border-only-review.jpg',quality=94)
 with (H/'inspection.csv').open('w',encoding='utf-8-sig',newline='') as handle:
  w=csv.writer(handle);w.writerow(['characterId','name','operation','path','source','crop','width','height','before_sha256','after_sha256'])
  for f in plan['files']:w.writerow([f.get('characterId',''),f.get('name',''),f['operation'],f['path'],f.get('source',''),f.get('crop',''),f['width'],f['height'],f['before'],f['after']])
 bundle=H/'JO9_Portrait_Sync_20261108_Review.zip';assert not bundle.exists()
 with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED) as z:
  for f in plan['files']:z.writestr('game/content/pic/'+f['path'],rawfiles[f['path']])
  z.write(H/'inspection.csv','inspection.csv');z.writestr('README_KO.txt','WORK에 반영한 초상108개 검토용 묶음입니다. 31명 초상93개와 테두리만 추가한15개입니다. 원본 복구는 별도 백업과 해시 기록을 확인하세요.\n')
 with zipfile.ZipFile(bundle) as z:
  assert z.testzip() is None
  for f in plan['files']:assert sha(z.read('game/content/pic/'+f['path']))==f['after']
 verification={'status':'VERIFIED','charactersScanned':1154,'portraitFilesScanned':6450,'mismatchedCharactersFixed':31,'newPortraitFiles':93,'borderOnlyFiles':15,'missingBordersAdded':90,'totalChangedFiles':108,'allPngReadable':True,'samePathsAndDimensions':True,'workAndTrackedSourcesMatch':True,'headSourcesUnchanged':True,'qspUnchanged':True,'jsonUnchanged':True,'userTagsUnchanged':True,'existingFramesPreserved':True,'borderOnlyCentersPreserved':True,'http':http,'catalogs':cat['catalogs'],'reviewZip':str(bundle),'reviewZipSha256':sha(bundle.read_bytes()),'backup':installed['backup'],'gameplayVisualChecked':False}
 # Delete only the exact generated candidate files after WORK/source/ZIP equality.
 expected={t/'candidate'/f['path'] for f in plan['files']};actual={p for p in t.rglob('*') if p.is_file()};assert actual==expected
 assert str(t.resolve()).replace('\\','/')=='G:/Codex/tmp/portrait-sync-20261108'
 for p in t.rglob('*'):assert not p.is_symlink() and not getattr(p,'is_junction',lambda:False)()
 for f in plan['files']:
  p=t/'candidate'/f['path'];assert sha(p.read_bytes())==f['after'];p.unlink()
 for p in sorted([p for p in t.rglob('*') if p.is_dir()],key=lambda p:len(p.parts),reverse=True):p.rmdir()
 t.rmdir();verification['candidateTemporaryFilesRemoved']=108
 (H/'verification.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(verification,ensure_ascii=False))
if __name__=='__main__':main()
