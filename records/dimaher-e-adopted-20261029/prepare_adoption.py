"""Build the bounded E-only adoption from the verified existing workflow."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
review=ROOT/'output/dimaher-e-review-20261029'
metadata=load(review/'metadata.json');base={r['path'].replace('\\','/').lower():r['sha256'] for r in load(review/'baseline.json')}
files=[]
for r in metadata['records']:
    p=r['runtimePath'];expected=base[str(WORK/p).replace('\\','/').lower()]
    assert sha(WORK/p)==expected,p
    assert sha(r['workspacePath'])==r['sha256'],p
    files.append(dict(path=p,source=r['workspacePath'],after=r['sha256'],before=expected,phase=r['phase'],key='dimaher_e',metadata=r))
assert len(files)==2
manifest=dict(id='dimaher-e-adopted-20261029',approval='이거 승인, 다음은 쌍수 투사D · dimaher_d',files=files,qspBefore=sha(WORK/'jack.qsp'),sourceDrift=[])
(HERE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
src=(ROOT/'output/mob-redraw-adopted-20261029/adopt_work.cjs').read_text(encoding='utf-8')
src=src.replace('MOB_REDRAW_ADOPTION_20261029','DIMAHER_E_ADOPTION_20261029').replace('mob-redraw-adopted-20261029','dimaher-e-adopted-20261029')
src=src.replace('files.length,57','files.length,2').replace('affected.size,57','affected.size,2')
src=src.replace('entrySlots,54','entrySlots,2').replace('groupSlots,7','groupSlots,0').replace('canonicalGroups,7','canonicalGroups,0')
src=src.replace('files:57','files:2').replace('oldRows.length-57','oldRows.length-2').replace('standingDefeatAndGroups:true','standingAndDefeatOnly:true')
src=src.replace("ct.atomic(gp,JSON.stringify(groups,null,2)+'\\n');ct.atomic(cp,JSON.stringify(context,null,2)+'\\n');","a(read(gp).equals(originals.get(gp)));ct.atomic(cp,JSON.stringify(context,null,2)+'\\n');")
old="최신 안개경계 재작화51장(전투22·개별 패배22·단체 패배7), 아레나·캣파이트 샘플4장, 쌍수 투사A2장 등57장을 WORK 및 resources/new에 반영했다. 초기 늑대인간 샘플은 최신 안개경계 재작화로 대체한다. 전투 장소·경로·집단 구성·초상·Mage Edit 프롬프트는 보존하고 PNG 및 체크리스트61슬롯만 갱신했다."
new="승인된 쌍수 투사E(dimaher_e)의 전투·패배2장을 WORK 및 resources/new에 반영했다. 전투 장소·경로·집단 구성·초상·Mage Edit 프롬프트와 다른 이미지의 기존 사용자 작업을 보존하고 PNG2개 및 체크리스트2슬롯만 갱신했다."
assert old in src
src=src.replace(old,new)
(HERE/'adopt_work.cjs').write_text(src,encoding='utf-8')
print(json.dumps(dict(files=2,output=str(HERE/'adopt_work.cjs'))))
