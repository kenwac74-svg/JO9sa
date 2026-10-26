"""Seal r1 after native checks, independent package audit and image history."""
from pathlib import Path
import datetime, hashlib, json, shutil, sys

REPO=Path('G:/somi/JO9sa');REC=REPO/'records/third-patch-build-20261026-r1'
PREV=REPO/'records/third-patch-build-20261026';FIX=REPO/'records/third-patch-approved-followups-20261026'
OUT=Path('G:/somi/JO9_2.4_ThirdPatch_20261026_r1')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game');FULL=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
QA=Path(sys.argv[1]);LOCAL=Path(__file__).parent
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def data(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(2**20),b''):h.update(b)
 return h.hexdigest()
def exclusive(p,b):
 p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('xb') as f:f.write(b)
def save(p,v):exclusive(p,data(v))

b=load(REC/'BUILD_RESULT.json');engine=load(QA/'report.json');audit=load(REC/'independent-review.json')
history=load(REC/'image-history-final-result.json');fix=load(FIX/'FINAL_RESULT.json')
assert engine['verdict']=='PASS' and engine['profile']=='release' and audit['status']=='PASS'
assert fix['releaseVerdict']=='PASS' and fix['after']==b['qspSha256']
assert history['counts']['packagedImagePaths']==6946 and history['compatibilityAliasesAdded']==2
assert digest(Path(history['manifest']['path']))==history['manifest']['sha256']
checks={x['name']:x for x in engine['checks']}
assert all(x['status']=='PASS' for x in engine['checks'] if x.get('required'))
assert checks['distribution-byte-match']['detail']['sha256']==b['qspSha256']==digest(WORK/'jack.qsp')
assert checks['installed-client-smoke']['detail']['passed']==9
for p in load(FIX/'protected.json'):assert digest(Path(p['file']))==p['sha256'],p['file']
protected=load(FIX/'images/baseline.json')['protected']
for root,key in [(WORK,'workSaves'),(FULL,'fullSaves')]:
 rows=protected[key]
 assert {p.relative_to(root).as_posix() for p in (root/'save').rglob('*') if p.is_file()}=={r['path'] for r in rows}
 for r in rows:assert (root/r['path']).stat().st_size==r['bytes'] and digest(root/r['path'])==r['sha256']
for kind,row in b['artifacts'].items():
 p=Path(row['archive']);assert p.stat().st_size==row['bytes'] and digest(p)==row['sha256']
 print('FINAL HASH',kind,flush=True)
for name in ['report.json','report.md','client-runner.log','patch-replay.log','patch-reapply.log']:
 shutil.copyfile(QA/name,REC/('release-validation'+Path(name).suffix if name.startswith('report.') else name))
shutil.copyfile(QA/'client/client-results.json',REC/'client-results.json')
for p in (QA/'client').glob('*-stderr.log'):shutil.copyfile(p,REC/p.name)
for name in ['build.py','finalize.py','finalize-image-history.py']:
 shutil.copyfile(LOCAL/name,REC/name)
final={**b,'status':'READY_FOR_DISTRIBUTION','sealedAt':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat(),
 'engineVerdict':'PASS','enginePaths':9,'targetedNativeGroups':6,'rallyClassificationCases':256,
 'independentReview':'PASS','independentChecks':audit['checksPassed'],
 'approvedFollowups':{'refusalPriority':True,'aboveRangeHighestTier':True,'twoJsonCorrections':True,'twoCompatibilityPng':True},
 'imageHistoryRecorded':True,'imageManifestSha256':history['manifest']['sha256'],'newPackagedImagesSinceSecond':29,
 'newCompatibilityCopies':2,'artworkCreationCount':None,'allArchiveCRCAndRuntimeSHA256Verified':True,
 'allWorkAndFullSaveFilesUnchanged':True,'saveFilesVerified':{'work':len(protected['workSaves']),'full':len(protected['fullSaves'])},
 'priorThirdArtifactsPreserved':True,'FullSynchronized':False,'commit':False,'push':False,
 'manualFullPlay':'No GUI rendering or save-load/full-game verification claimed.'}
save(REC/'FINAL_RESULT.json',final)
public={k:v for k,v in final.items() if k not in ['artifacts','revisionOf','manualFullPlay']}
public['revisionOf']='2.4 third cumulative patch, 2026-10-26'
public['artifacts']={kind:{'file':Path(row['archive']).name,'bytes':row['bytes'],'sha256':row['sha256'],'runtimeCount':row['runtimeCount'],'unchangedFromSecondPatch':kind=='indie'} for kind,row in b['artifacts'].items()}
(OUT/'BUILD_MANIFEST.json').write_bytes(data(public))
save(REPO/'docs/THIRD_PATCH_RELEASE_20261026_r1.json',public)
report=f'''# 2.4 3차 누적 패치 r1 배포 기록

상태: READY_FOR_DISTRIBUTION. 출력: {OUT.as_posix()}.

- 승인된 랠리 거절 우선 처리, 범위 밖 기술값의 최고 구간 분류, 정확한 이미지 JSON 두 필드와 기존 URL 호환 PNG 두 개를 포함한다.
- 본체 9 / 인디 6,830 / 개인 148, 합계 6,987개 런타임이다. 개인팩은 PNG 147개와 에게야 JSON 1개다.
- 이미지는 총 6,946경로다. 2차 이후 추가 29경로 중 이번 2경로는 호환 사본이며 새 그림 제작량이 아니다. 기존 카탈로그 코드·체크·진행·원장은 보존하고 이미지 배포 메타데이터 이력만 추가했다.
- 인디팩은 기존과 바이트 동일하여 재다운로드가 필요 없다. 새 개인팩 r1 → 새 본체 r1 순서로 적용한다. 처음 설치할 때는 인디팩을 먼저 적용한다.
- QSP {b['qspSha256']}. 문법 경계·구조·정확 패치 재생·멱등성, 수정 분기 native 6그룹, 최종 ZIP 조합의 실제 엔진 9경로 PASS. ZIP 전체 CRC와 런타임 SHA, 독립 패키지 감사 PASS.
- 기존 3차 ZIP과 Full, WORK/Full 세이브 {len(protected['workSaves'])}+{len(protected['fullSaves'])}개를 보존했다. Full 동기화·커밋·푸시는 하지 않았다.
- GUI 화면·모든 세이브 불러오기·전체 플레이의 검증을 뜻하지 않는다. 기존 보류 기획과 검은 잔상 조사는 이번에 추가하지 않았다.

설치는 출력 폴더의 README_3RD_KO.txt, 플레이어 변경 내역은 CHANGELOG_KO.md를 기준으로 한다. 플레이어 노트는 두 분류의 최종 결과만 포함한다.

근거: records/third-patch-build-20261026-r1/FINAL_RESULT.json, release-validation.json, independent-review.json, PATCH_IMAGE_MANIFEST.json 및 records/third-patch-approved-followups-20261026/.
'''
exclusive(REPO/'docs/THIRD_PATCH_RELEASE_20261026_r1.md',report.encode('utf-8'))
# Keep the old release evidence and archives; current entry documents point to r1.
for name in ['THIRD_PATCH_RELEASE_20261026.md','THIRD_PATCH_RELEASE_20261026.json']:
 oldpath=REPO/'docs'/name;exclusive(REC/'docs-before'/name,oldpath.read_bytes())
 if name.endswith('.md'):
  oldpath.write_text('최신 배포: [3차 r1](THIRD_PATCH_RELEASE_20261026_r1.md). 아래는 이전 빌드 기록이다.\n\n'+oldpath.read_text(encoding='utf-8'),encoding='utf-8')
 else:oldpath.write_bytes(data(public))
handoff='\n\n## 2026-10-26 — 승인 추가 수정 포함 3차 r1\n\n[최신 배포 기록](THIRD_PATCH_RELEASE_20261026_r1.md). 랠리 거절·상한 밖 기술 분류·이미지 JSON 두 건과 호환 PNG 두 개를 포함했다. 새 본체/개인팩 r1을 적용하고 인디팩은 재사용한다. 구조·수정 분기·최종 엔진 9경로·ZIP 무결성·독립 감사 PASS. 기존 ZIP/Full/세이브 보존, 커밋·푸시 없음.\n'
for name in ['SESSION_HANDOFF_INDEX.md','SECOND_PATCH_WORK_BUNDLE_20261021.md','PACKAGING_POLICY_20261019.md']:
 with (REPO/'docs'/name).open('a',encoding='utf-8') as f:f.write(handoff)
pre=REPO/'records/third-patch-prebuild-20261026/FINAL_REPORT.json';v=load(pre)
v.update(workQsp=b['qspSha256'],deliveryDirectory=str(OUT),deliveryManifest=str(OUT/'BUILD_MANIFEST.json'),newlyIncludedImagePaths=29,compatibilityAliasImagePaths=2,approvedFollowupsApplied=True,thirdZipBuilt=True)
pre.write_bytes(data(v))
plan=FIX/'PLAN_KO.md';plan.write_text(plan.read_text(encoding='utf-8').replace('- [ ] 새 파일명','- [x] 새 파일명'),encoding='utf-8')
print(json.dumps({'status':final['status'],'output':str(OUT),'artifacts':public['artifacts']},ensure_ascii=False),flush=True)
