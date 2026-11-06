from pathlib import Path
import json,re,hashlib,os,shutil
HERE=Path(__file__).resolve().parent;LOCAL=HERE.parent/'girls-checklist-20261104'
GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game');REPO=Path('G:/somi/JO9sa');REC=REPO/'records/luminous-clothed-adoption-20261105'
def sha(b):return hashlib.sha256(b).hexdigest()
def put(p,b):
 p.parent.mkdir(parents=True,exist_ok=True);t=p.with_name(p.name+'.luminous-refresh.tmp');assert not t.exists();t.write_bytes(b);os.replace(t,p)
manifest=json.loads((LOCAL/'manifest.json').read_text(encoding='utf8'))
character=next(c for c in manifest['characters'] if c['id']==3002)
assert 'girls/full/Luminous.png' in character['assets']
assert character['refs']['fullimage'].lower()!='girls/full/luminous.png'
pattern=re.compile(r'<!-- JO9 GIRLS CHECKLIST START 20261104 -->.*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->',re.S)
payload=pattern.search((LOCAL/'catalog.updated.html').read_text(encoding='utf-8-sig')).group()
status=GAME/'modtools/catalog/catalog_status.js';statussha=sha(status.read_bytes());files=[]
for p in [GAME/'modtools/catalog/catalog_merge_vs_original.html',REPO/'tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']:
 old=p.read_text(encoding='utf-8-sig');assert len(pattern.findall(old))==1
 new=pattern.sub(lambda _:payload,old,count=1);assert pattern.sub('',new)==pattern.sub('',old)
 put(p,new.encode());files.append(str(p))
put(GAME/'modtools/catalog/JO9_캐릭터_이미지체크리스트.html',(LOCAL/'JO9_캐릭터_이미지체크리스트.html').read_bytes())
for n in ['build_inventory.py','manifest.json']:
 put(REPO/'tools/girls-image-checklist'/n,(LOCAL/n).read_bytes())
assert sha(status.read_bytes())==statussha
report=json.loads((HERE/'APPLIED.json').read_text(encoding='utf8'));report.update(checklistUpdated=True,characterListed=True,catalogStatusPreserved=True,catalogOutsideGirlsBlockPreserved=True)
put(REC/'APPLIED.json',(json.dumps(report,ensure_ascii=False,indent=2)+'\n').encode())
text='# 루미너스 의복 이벤트 이미지 반영\n\n첨부1590×1192 RGBA를 비율·구도를 유지해 정확히 절반인795×596으로 축소했다. QSP가 이미 참조하던 content/pic/girls/full/Luminous.png를 채워 영입 안내666801에 표시된다.3002 JSON·알몸 기본 전신·QSP·배포 폴더는 유지했다. 고해상도 원본은 JO9resource/character_originals/Luminous에 보관했다. 이미지 체크리스트3002에도 이벤트 이미지를 포함했다.\n\nPNG 열림·크기·투명도·직접참조·QSP 불변을 확인했다. 일반 EXE의 루미너스($2000) 영입 안내에서 의복 그림과 구도를 확인하면 된다. 실제 화면 육안 확인은 사용자 대기다.\n'
put(REC/'REPORT_KO.md',text.encode());put(REC/'apply.py',(HERE/'apply.py').read_bytes());put(REC/'refresh.py',Path(__file__).read_bytes())
p=REPO/'docs/SESSION_HANDOFF_INDEX.md';text=p.read_text(encoding='utf8');text+='\n\n## 2026-11-05 루미너스 의복 이벤트 이미지 적용\n\n[반영 기록](../records/luminous-clothed-adoption-20261105/REPORT_KO.md). 사용자 첨부 이미지를795×596 RGBA로 등비 축소해 기존 Luminous.png 이벤트 경로에 적용했다. 루미너스 의복 이미지 대기는 해소됐다. JSON·알몸 기본 이미지·QSP 불변, 체크리스트 갱신, Full·커밋·푸시 없음.\n';put(p,text.encode())
p=REPO/'records/work-pending-batch-20261105/REPORT_KO.md';text=p.read_text(encoding='utf8');text+='\n\n후속: 루미너스 의복 이미지 대기는2026-11-05 사용자 첨부로 해소하여 적용했다. records/luminous-clothed-adoption-20261105/REPORT_KO.md 참조.\n';put(p,text.encode())
assert sha((GAME/'jack.qsp').read_bytes())==report['qspSha256']
print(json.dumps({'eventImageExists':(GAME/report['target']).is_file(),'character3002Listed':True,'qspUnchanged':True,'tagsPreserved':True},indent=2))
# The generated whole-catalog candidate is reproducible; final HTML and source remain.
(LOCAL/'catalog.updated.html').unlink()
assert (GAME/report['target']).read_bytes()==(HERE/'Luminous.png').read_bytes();(HERE/'Luminous.png').unlink()
