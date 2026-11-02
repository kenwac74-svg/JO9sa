from pathlib import Path
import json,zipfile,hashlib,re,datetime
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');R=Path('G:/somi/JO9sa/records/character-pack-work-install-20261029');P=Path('G:/somi/JO9_Character_ImagePack_20261027');m=json.loads((P/'MANIFEST.json').read_text(encoding='utf-8-sig'));sha=lambda b:hashlib.sha256(b).hexdigest()
q=sha((G/'jack.qsp').read_bytes());idx=sha((G/'json/slave_index.json').read_bytes());files=m['files'];assert len(files)==135
existing={int(x.name.split('_')[0].split('.')[0]) for x in (G/'json/slaves').glob('*.json') if x.name.split('_')[0].split('.')[0].isdigit()};ids={f['newId'] for f in files};assert not ids.intersection(existing),str(ids.intersection(existing))
with zipfile.ZipFile(P/'JO9_NewCharacters27_20261027_Manual.zip') as z:
 assert z.testzip() is None
 payload=[]
 for f in files:
  rel=f['path'];assert rel.startswith('game/') and '..' not in Path(rel).parts
  target=G/rel[5:];assert not target.exists(),str(target)
  b=z.read(rel);assert sha(b)==f['sha256'];payload.append((target,b,f))
 for target,b,f in payload:
  target.parent.mkdir(parents=True,exist_ok=True)
  with target.open('xb') as out:out.write(b)
 for target,b,f in payload:assert sha(target.read_bytes())==f['sha256']
assert sha((G/'jack.qsp').read_bytes())==q and sha((G/'json/slave_index.json').read_bytes())==idx
R.mkdir(parents=True,exist_ok=True);result={'status':'INSTALLED','characters':27,'png':108,'json':27,'hashesVerified':135,'qspUnchanged':True,'randomGenerationIntegrated':False,'slaveIndexUnchanged':True,'fullSynced':False,'files':files};(R/'installation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print({k:v for k,v in result.items() if k!='files'})
