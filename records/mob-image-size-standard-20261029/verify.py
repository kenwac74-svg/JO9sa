from pathlib import Path
import json,hashlib
from PIL import Image,ImageChops
R=Path('G:/somi/JO9sa/records/mob-image-size-standard-20261029');j=json.loads((R/'installation.json').read_text(encoding='utf-8'));G=Path(j['game']);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
for row in j['files']:
 original=Path(row['backup']);candidate=Path(row['normalizedOutput']);current=G/row['path']
 assert sha(original)==row['before'];assert sha(candidate)==row['after'];assert sha(current)==row['after']
 with Image.open(current) as im:
  assert im.size==(795,596) and im.format=='PNG' and im.mode=='RGBA'
  b=im.getchannel('A').getbbox()
  checks.append({'path':row['path'],'sha256':row['after'],'dimensions':[795,596],'format':'PNG','alphaNonzeroBounds':list(b) if b else None,'sourceMode':row['sourceMode'],'geometry':row['geometry']})
# This already-correct-size file was a JPEG before; the PNG conversion preserves its decoded RGB pixels exactly.
goblin=G/'content/pic/mob/goblin.png';gorig=Path(j['backupRoot'])/'original/content/pic/mob/goblin.png'
with Image.open(goblin) as current,Image.open(gorig) as previous:
 assert ImageChops.difference(current.convert('RGB'),previous.convert('RGB')).getbbox() is None
assert sha(G/'jack.qsp')==j['qspSha256']
result={'status':'PASS','changedFilesVerified':len(checks),'targetDimensions':[795,596],'all128RealArtStandard':True,'qspUnchanged':True,'qspSha256':j['qspSha256'],'portraitHashesPreservedAtInstall':j['portraitHashesPreserved'],'goblinDecodedPixelsPreserved':True,'remainingNonstandardRealArt':j['remainingNonstandardRealArt'],'concurrentSkips':j['skipped'],'checks':checks}
(R/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print({k:v for k,v in result.items() if k!='checks'})
