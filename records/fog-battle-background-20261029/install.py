from pathlib import Path
import gzip,hashlib,json,shutil
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');R=Path('G:/somi/JO9sa/records/fog-battle-background-20261029');T=Path('G:/Codex/tmp/fog-battle-background-20261029');B=Path('G:/somi/JO9_work_backups/fog-battle-background-20261029');sha=lambda b:hashlib.sha256(b).hexdigest()
p=json.loads((R/'patch.json').read_text(encoding='utf-8'));report=json.loads((R/'official-report.json').read_text(encoding='utf-8'));assert report['verdict']=='PASS'
old=(G/'jack.qsp').read_bytes();new=(T/'candidate.qsp').read_bytes();assert sha(old)==p['before_sha256'];assert sha(new)==p['after_sha256']
from PIL import Image
bg=G/'content/pic/bg/battle_mist_forest.png';im=Image.open(bg);assert im.size==(795,596) and im.format=='PNG'
B.mkdir(parents=True,exist_ok=True);dest=B/'jack-before.qsp.gz';assert not dest.exists()
with gzip.open(dest,'wb',compresslevel=9) as f:f.write(old)
assert sha(gzip.decompress(dest.read_bytes()))==p['before_sha256']
(G/'jack.qsp').write_bytes(new);assert sha((G/'jack.qsp').read_bytes())==p['after_sha256'];shutil.copy2(R/'patch.json',Path('G:/somi/JO9sa/mods')/(p['id']+'.json'))
result={'status':'INSTALLED','before':p['before_sha256'],'after':p['after_sha256'],'changedLocations':['боевой_интерфейс','конец_боя'],'changedBehavior':'fog combat background only','background':'content/pic/bg/battle_mist_forest.png','backgroundSha256':sha(bg.read_bytes()),'backup':str(dest),'oldBackgroundsPreserved':True,'saveVariablesAdded':0,'fullFolderChanged':False,'zipCreated':False}
(R/'installation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(result)
