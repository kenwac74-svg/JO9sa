"""Publish records and replace only the generated girls checklist block."""
from pathlib import Path
import json,re,hashlib,os
from datetime import datetime,timezone
HERE=Path(__file__).resolve().parent
LOCAL=HERE.parent/'girls-checklist-20261104'
REPO=Path('G:/somi/JO9sa');GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REC=REPO/'records/work-pending-batch-20261105'
def sha(b): return hashlib.sha256(b).hexdigest()
def write(p,b):
 p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_name(p.name+'.batch-finalize.tmp');assert not tmp.exists();tmp.write_bytes(b);os.replace(tmp,p);assert p.read_bytes()==b
def main():
 installed=json.loads((HERE/'installed.json').read_text(encoding='utf8'));assert sha((GAME/'jack.qsp').read_bytes())==installed['candidate']
 test=json.loads((LOCAL/'browser-test-report.json').read_text(encoding='utf8'));assert test['status']=='PASS';assert test['manifestSha256']==sha((LOCAL/'manifest.json').read_bytes())
 manifest=json.loads((LOCAL/'manifest.json').read_text(encoding='utf8'));assert manifest['qspSha']==installed['candidate']
 pattern=re.compile(r'<!-- JO9 GIRLS CHECKLIST START 20261104 -->.*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->',re.S)
 payload=pattern.search((LOCAL/'catalog.updated.html').read_text(encoding='utf-8-sig')).group()
 status=GAME/'modtools/catalog/catalog_status.js';status_before=sha(status.read_bytes())
 updates=[]
 for p in [GAME/'modtools/catalog/catalog_merge_vs_original.html',REPO/'tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']:
  raw=p.read_bytes();text=raw.decode('utf-8-sig');assert len(pattern.findall(text))<=1
  if pattern.search(text):
   new=pattern.sub(lambda _:payload,text,count=1)
  else:
   at=text.lower().rfind('</body>');assert at>=0
   new=text[:at]+payload+text[at:]
  assert pattern.sub('',new,count=1)==pattern.sub('',text,count=1)
  write(p,new.encode('utf8'));updates.append({'path':str(p),'before':sha(raw),'after':sha(new.encode()),'outsideGirlsBlockPreserved':True})
 write(GAME/'modtools/catalog/JO9_캐릭터_이미지체크리스트.html',(LOCAL/'JO9_캐릭터_이미지체크리스트.html').read_bytes())
 for name in ['build_inventory.py','build_pages.py','catalog-girls-checklist.js','manifest.json','README_KO.md','browser-test.cjs','browser-test-report.json']:
  write(REPO/'tools/girls-image-checklist'/name,(LOCAL/name).read_bytes())
 decision_path=LOCAL/'dual-registration/decision.json';decision=json.loads(decision_path.read_text(encoding='utf8'));decision.update(status='APPLIED_WORK',codeImplemented=True,workApplied=True,appliedAt=datetime.now(timezone.utc).isoformat(),appliedQspSha256=installed['candidate'],fullSynced=False)
 write(decision_path,(json.dumps(decision,ensure_ascii=False,indent=2)+'\n').encode())
 write(REPO/'records/girls-checklist-20261104/dual-registration/decision.json',decision_path.read_bytes())
 pending=LOCAL.parent/'hard-trait-price-20261104/SALE_TAX_PENDING_KO.md';text=pending.read_text(encoding='utf8')
 text='> 2026-11-05 일괄 WORK 반영 완료. 아래 대기 상태는 당시 기록이며, 최종 결과는 records/work-pending-batch-20261105/REPORT_KO.md를 따른다. 루미너스 이벤트 의복 이미지만 사용자 제작 대기다.\n\n'+text
 write(pending,text.encode())
 write(REPO/'records/hard-ap-setting-20261103/APPROVED_BATCH_RESULT_20261105.md',(HERE/'REPORT_KO.md').read_bytes())
 p=REPO/'records/deferred-discussions-20261024/index.json';d=json.loads(p.read_text(encoding='utf-8-sig'))
 def walk(v):
  if isinstance(v,dict):
   if v.get('id')=='D13':
    v['status']='PARTIALLY_APPLIED_AP_TRAIT_PRICE_SALE_TAX'
    v['decision']='게임 설정 하드의 기본 행동력+1 제거, 가격 특성 보너스 절반, 일반 판매 상한 제거 및 구간 판매세는 승인·WORK 적용. 성장·복종 추가 보정과 원본 전투/전차 수치는 미정.'
    v['latestAction']={'date':'2026-11-05','scope':'approved WORK batch: hard AP preserved; trait price bonus half preserved; normal sale cap removal + Hard tax applied','workSha256':installed['candidate'],'evidence':'records/work-pending-batch-20261105/REPORT_KO.md','fullSynced':False}
    v['constraints']=[s for s in v.get('constraints',[]) if not s.startswith('행동력 승인 범위를')]+['성장·복종 추가 보정 및 전투/전차 수치의 미승인 초안을 확대 적용하지 않음.']
   for z in v.values():walk(z)
  elif isinstance(v,list):
   for z in v:walk(z)
 walk(d);write(p,(json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode())
 handoff=REPO/'docs/SESSION_HANDOFF_INDEX.md';ht=handoff.read_text(encoding='utf8');heading='## 2026-11-05 승인 대기 묶음 WORK 반영'
 assert heading not in ht
 ht+='\n\n'+heading+'\n\n[적용 결과·검증·보류 범위](../records/work-pending-batch-20261105/REPORT_KO.md). 일반 판매 상한 제거·하드 판매세, 세력 평판 코드, 새·옛 복장 병행 조회와 누락 대체, 이사벨라2571/랜덤2323 분리 및 루미너스 메뉴 오기를 WORK에 반영했다. 기존 수동 변경 보존 후 추적 QSP와 해시5cbc0fbf… 일치. 실제 FastQSP 기능검사·통합9경로PASS. 루미너스 의복 이벤트 이미지는 사용자 제작 대기. Full·ZIP·커밋·푸시는 수행하지 않았다.\n'
 write(handoff,ht.encode())
 assert sha(status.read_bytes())==status_before
 report={'catalogUpdates':updates,'characters':len(manifest['characters']),'inventoryErrors':manifest['errors'],'catalogStatusPreserved':True,'qspSha256':installed['candidate'],'fullTouched':False}
 (HERE/'catalog-refresh.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
