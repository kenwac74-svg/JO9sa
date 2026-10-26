"""Seal verified artifacts and retain only compact audit/reproduction evidence."""
import hashlib
import json
from pathlib import Path
import shutil

REPO=Path('G:/somi/JO9sa');REC=REPO/'records/third-patch-build-20261026'
OUT=Path('G:/somi/JO9_2.4_ThirdPatch_20261026');TMP=Path('G:/Codex/tmp/third-patch-build-20261026')
QA=Path('G:/Codex/tmp/third-patch-release-20261026/run-mp6kyE')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game');FULL=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')

def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def data(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(2**20),b''):h.update(b)
 return h.hexdigest()
def save(p,v):
 with p.open('xb') as f:f.write(data(v))

b=load(REC/'BUILD_RESULT.json');engine=load(REC/'release-validation.json');independent=load(REC/'independent-review.json')
assert engine['verdict']=='PASS' and independent['status']=='PASS'
history=load(REC/'image-history-final-result.json') if (REC/'image-history-final-result.json').exists() else None
if history is None:
 for p in REC.glob('*history*.json'):
  d=load(p)
  if d.get('status')=='PACKAGED_IMAGE_METADATA_RECORDED' and d.get('runId'):history=d;break
assert history and history['counts']['packagedImagePaths']==6944
assert digest(WORK/'jack.qsp')=='f2433bf3bbb887f00a0a319130bf06cb0bfdaeaa091b113d831c701407f1b07a'
assert digest(FULL/'jack.qsp')=='c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d'
# This file is never written by the builder or the diagnostic engine.
gold_hash=digest(WORK/'save/JO9_GOLD_AP_CHECK_20261026.sav')
assert gold_hash==load(REPO/'records/third-patch-prebuild-20261026/FINAL_REPORT.json')['existingGoldTestSave']

for kind,row in b['artifacts'].items():
 p=Path(row['archive']);assert p.stat().st_size==row['bytes'] and digest(p)==row['sha256'],kind
 print('FINAL HASH',kind,flush=True)
for name in ['client-results.json']:
 shutil.copyfile(QA/'client'/name,REC/name)
for name in ['client-runner.log','patch-replay.log','patch-reapply.log']:
 shutil.copyfile(QA/name,REC/name)
for p in (QA/'client').glob('*-stderr.log'):shutil.copyfile(p,REC/p.name)
local=Path(__file__).parent
shutil.copyfile(local/'build.py',REC/'build.py');shutil.copyfile(__file__,REC/'finalize.py')

final={**b,'status':'READY_FOR_DISTRIBUTION','qspSha256':digest(WORK/'jack.qsp'),'engineVerdict':'PASS','enginePaths':9,'independentReview':'PASS','independentChecks':independent['checksPassed'],'imageHistoryRecorded':True,'personalImages':145,'indieImages':6799,'newPackagedImagesSinceSecond':27,'artworkCreationCount':None,'allArchiveCRCAndRuntimeSHA256Verified':True,'FullSynchronized':False,'gameFilesChanged':False,'personalSavesUnchanged':True,'commit':False,'push':False,'manualFullPlay':'User handles manual play checks; no all-save or full-game completion claim.','excludedUnapproved':['two image reference typo fixes','rally obedience dispatch change','out-of-range skill dispatch change']}
save(REC/'FINAL_RESULT.json',final)
public={k:v for k,v in final.items() if k not in ['artifacts','metadata','manualFullPlay','excludedUnapproved']}
public['artifacts']={kind:{'file':Path(row['archive']).name,'bytes':row['bytes'],'sha256':row['sha256'],'runtimeCount':row['runtimeCount'],'unchangedFromSecondPatch':kind=='indie'} for kind,row in b['artifacts'].items()}
public['imageManifestSha256']=history['manifest']['sha256'];(OUT/'BUILD_MANIFEST.json').write_bytes(data(public))
link='docs/THIRD_PATCH_RELEASE_20261026.md'
report=f'''# 2.4 3차 누적 패치 배포 기록

상태: READY_FOR_DISTRIBUTION. 출력: {OUT.as_posix()}.

- 본체7 / 인디6830 / 개인146, 총6983 런타임.
- 개인 이미지145개(기존118+추가27)와연결JSON1. 추가27은새로팩에들어간경로이며새로제작한그림수로해석하지않는다.
- 인디팩은2차원본과바이트동일하며설치자는재다운로드불필요.
- QSP {final['qspSha256']}. 실제ZIP추출조합JSON=WORK,구조/문법경계/정확재생/재적용·엔진9경로·배포바이트대조PASS.
- 전ZIP전체CRC·런타임SHA검사PASS. 독립검수67/67PASS. 기존도나삭제기3파일동결해시유지;게임실폴더에서실행하지않았다.
- 체크리스트6행·고정ID/코드추가,기존체크·진행·원장보존. 이미지배포이력6944경로기록/재검증PASS.
- 1·2차누적. 기존ZIP·WORK·Full·세이브·설정보존,커밋·푸시없음. 일반전체플레이/전세이브로드인증이아니다.
- 미승인제안3건은미포함. 별도보류기획·검은잔상조사는이번패치에서활성화하지않았다.

플레이어노트는[신규업데이트]/[버그수정]최종결과만사용한다. 설치는새README_3RD_KO.txt와SHA256SUMS.txt를기준으로한다.

근거: records/third-patch-build-20261026/FINAL_RESULT.json,release-validation.json,independent-review.json,PATCH_IMAGE_MANIFEST.json.
'''
save(REPO/'docs/THIRD_PATCH_RELEASE_20261026.json',public)
(REPO/link).write_text(report,encoding='utf-8')
handoff='\n\n## 2026-10-26 — 3차 누적 패치 제작 완료\n\n[배포기록](THIRD_PATCH_RELEASE_20261026.md). 본체·개인팩신규,인디팩2차동일재사용. 원장대조로누락19추가확인해기존118+신규27=개인이미지145/JSON1을포함. 전체6983런타임·ZIPCRC/SHA·공식엔진9·독립67PASS. 이미지체크리스트/이력갱신. 기존ZIP/WORK/Full/세이브보존,커밋푸시없음. 설치/파일명은3차출력README가우선.\n'
for name in ['SESSION_HANDOFF_INDEX.md','SECOND_PATCH_WORK_BUNDLE_20261021.md','PACKAGING_POLICY_20261019.md']:
 with (REPO/'docs'/name).open('a',encoding='utf-8') as f:f.write(handoff)
prepath=REPO/'records/third-patch-prebuild-20261026/FINAL_REPORT.json';pre=load(prepath)
pre.update(thirdZipBuilt=True,deliveryDirectory=str(OUT),deliveryManifest=str(OUT/'BUILD_MANIFEST.json'),newlyIncludedImagePaths=27,previouslyListedImages=8,additionalLedgerImages=19)
prepath.write_bytes(data(pre))
print(json.dumps({'status':final['status'],'output':str(OUT),'archives':public['artifacts']},ensure_ascii=False),flush=True)
