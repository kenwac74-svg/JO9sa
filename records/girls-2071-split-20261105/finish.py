"""Record the approved split, close its backlog entry and preserve test evidence."""
from pathlib import Path
import hashlib
import json
import shutil

HERE=Path(__file__).resolve().parent
REPO=Path('G:/somi/JO9sa')
GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
RECORD=REPO/'records/girls-2071-split-20261105'
PLAN=json.loads((HERE/'plan.json').read_bytes())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,s):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_bytes(s.encode('utf-8') if isinstance(s,str) else s)
def append_once(p,marker,text):
    old=p.read_text(encoding='utf-8-sig')
    assert marker not in old,p
    put(p,old.rstrip()+'\n\n'+text.strip()+'\n')

statics=sorted((HERE/'static-check').glob('run-*/report.json'))
assert len(statics)==1
static=json.loads(statics[0].read_bytes())
assert static['verdict']=='STATIC_PASS'
for name in ['report.json','report.md','patch-replay.log','patch-reapply.log']:
    shutil.copy2(statics[0].with_name(name),RECORD/('static-'+name))

report=f'''# 2071 외형 분리 — WORK 적용 완료

사용자 승인일: 2026-11-05 KST. 이 기록은 JO9-GIRLS-2071-20261105의 최종 처리 결과입니다.

| 외형 | 독립 캐릭터 번호 | 적용 내용 |
| --- | ---: | --- |
| 갈색 장발 | 2071 | 현행 JSON·전신·하녀·초상 보존 |
| 하늘색 단발 | 2324 | 추가팩에서 이미 별도 등록된 정의·전신·초상 3종 재사용 |
| 옛 금발 단발 | 2340 | 원본 2071 JSON에서 이미지 경로 4곳만 새 번호로 변경, 전신·초상 3종 바이트 그대로 복사 |

하늘색은 `records/new-character-image-pack-20261027/provenance.json`의 originalId2071→newId2324 기록과 현물 전신·초상으로 동일 인물임을 확인했습니다. 따라서 하늘색 인물을 중복 생성하는 2341 정의는 만들지 않았습니다. 옛2071 하늘색 전신과2324 전신의 해시는 구도 조정으로 다르므로 같은 바이트라고 기록하지 않았습니다. 앞선 "하늘색 초상 없음" 설명은2071 접두사만 검색한 오류였으며, 실제2324 초상3종이 있습니다.

금발 설정은 보호 원본 JO9O의2071.json 전체를 복제하고 fullimage·seed_ava·seed_ava_gray·seed_ava_clear 네 필드만2340으로 치환했습니다. 원본 능력·신체 설정을 유지했고 전용 복장 값은 빈 문자열입니다. 현행2071·2324 및2017 JSON은 바이트 단위로 보존했습니다.

## 표시·무작위 생성

새 금발2340은 milf 범위에 포함됩니다. `json/slave_index.json`의 milf_last를2339→2340으로 확대했고, `generate_stock`의 기존 mature 상한 하한값을2338→2340으로 한 줄 보완했습니다. 저장된 상한이 오래됐더라도 새 번호를 추첨할 수 있으며, 기존보다 큰 상한은 그대로 존중합니다. `game_difficulty`와 난이도 설정은 관련이 없습니다.

기존 `jo9_seed_role_images`는 변경하지 않았습니다. 금발2340·하늘색2324의 하녀·비서·도미나 전용 그림이 없으면 각자 기본 전신으로 돌아가는 실제 엔진 조회를6건 확인했습니다. 갈색2071의 하녀 조회는 기존 갈색 하녀 그림을 사용합니다. blue_short라는 이름의 옛 하녀 그림은 실제 갈색 인물이며2324 또는2340에 연결하지 않았습니다.

## 호환·패치·체크리스트

옛 금발4경로, 옛 하늘색 전신1경로, 잘못 명명된 갈색 하녀1경로를 삭제하지 않았습니다. 이6개는 `assets/compatibility-aliases/2026-11-05_2071_split.json`에 관계·해시·KEEP 사유를 기록했습니다. 동일 바이트 사본과 같은 인물의 다른 구도, 잘못 명명된 복장을 구분하며 자동 동기화하지 않습니다.

이미지 체크리스트는2071/2324/2340별 활성 세트를 따로 표시하고 옛 경로는 해당 캐릭터의 "옛 저장 호환 경로"에 둡니다. 물리 파일 전체 목록에는 남아 있습니다. 사용자 캐릭터 태그와 기존 일반 이미지 행은 유지하고 새2340 PNG4행만 추가했습니다. WORK 카탈로그·시드·독립 HTML·체크리스트 생성기·추적 PNG/JSON/QSP·runtime-source·개인 이미지 패치 원장에 반영했습니다. 새 그림을 생성한 작업이 아니라 기존 금발4PNG의 새 주소 등록입니다.

## 검사와 한계

- QSP 바이트 왕복·역재생·줄/주석 경계·패치 재적용·번호 충돌 검사 통과(`STATIC_PASS`).
- 설치된 네이티브 엔진에서 실제 JSON 로딩, 갈색/하늘색/금발 연결, 원본 금발 seed, 오래된/향후 상한, 타 연령 그룹 보존, 전용 복장 부재6경로와 기존 갈색 하녀 조회 통과(`native-results.json`).
- 새4PNG 디코딩, 전신795×596 및 원래 초상 치수, WORK/추적/인덱스 해시, 패치 payload 일치 확인.
- 기존 로컬 서버 `/catalog?girlssets=1`에서 새2340·기존2324·구분 설명·호환 섹션 HTTP200 확인.
- 실제 사용자 세이브 GUI 불러오기와 자연 추첨으로 새 캐릭터를 만나는 플레이는 미확인입니다. 저장 파일 형식이나 보유 인물 ID를 강제로 바꾸지 않았습니다.
- 일반 게임 EXE에서 새로 등장한 금발의 전신/초상 일치와 역할 전환 시 기본 전신 표시를 눈으로 확인하면 됩니다. 그림 자체는 웹 체크리스트에서2071·2324·2340을 검색해 확인할 수 있습니다.

WORK·추적 QSP SHA-256: `{PLAN['candidate']}`

Full 배포 폴더·ZIP·커밋·푸시는 수행하지 않았습니다. 취소된2017 분리 기록은 `records/girls-2017-split-20261105/REPORT_KO.md`의 REVERTED 상태를 유지합니다.
'''
put(RECORD/'REPORT_KO.md',report)
put(RECORD/'finish.py',Path(__file__).read_bytes())

issue=REPO/'records/girls-2071-issue-20261105/ISSUE_KO.md'
old=issue.read_text('utf-8-sig')
if '# 2071번 이미지 번호 충돌·복장 불일치 — 오류 수정 대기' in old:
    old=old.replace('# 2071번 이미지 번호 충돌·복장 불일치 — 오류 수정 대기','# 2071번 이미지 번호 충돌·복장 불일치 — 해결 완료',1)
    old=old.replace('- 상태: 사용자 지시로 오류 수정 대상으로 등록 / 원인·분리 방식 미확정 / 수정 미착수','- 현재 상태: 2026-11-05 사용자 승인으로 해결 / 갈색2071·기존 하늘색2324·새 금발2340으로 분리. 아래 초기 조사 기록은 변경 전 근거입니다.',1)
    put(issue,old)
append_once(issue,'최종 처리: 갈색2071', '## 최종 처리: 갈색2071 · 하늘색2324 · 금발2340\n\n하늘색은 이미2324로 등록된 사실을 확인하여 재사용하고, 원본 금발만2340으로 추가했습니다. 기존2071 JSON과 옛 이미지 주소는 보존했습니다. [적용·검증 보고서](../girls-2071-split-20261105/REPORT_KO.md).')
ip=issue.with_name('inventory.json');inventory=json.loads(ip.read_bytes())
inventory['status']='RESOLVED_WORK_APPLIED'
inventory['resolution']={'dateKST':'2026-11-05','brownId':2071,'existingBlueId':2324,'newBlondId':2340,'report':'records/girls-2071-split-20261105/REPORT_KO.md','legacyAddressesPreserved':6}
inventory['gameFilesModified']=True
put(ip,json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')

section='## 2026-11-05 — 2071 외형 분리 적용 완료'
text=section+'\n\nJO9-GIRLS-2071-20261105 해결. 갈색2071 유지, 기등록된 하늘색2324 재사용, 원본 금발을 새2340으로 등록했습니다. 없는 전용 복장은 기본 전신을 표시하며 옛6경로를 호환용으로 보존합니다. 체크리스트·추적 소스·차기 패치 원장 동기화, 실제 엔진 조회 및 정적 패치 검사 통과. [최종 보고](../records/girls-2071-split-20261105/REPORT_KO.md). Full·ZIP·커밋·푸시 없음.'
append_once(REPO/'docs/SESSION_HANDOFF_INDEX.md',section,text)
append_once(REPO/'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',section,text)
append_once(REPO/'docs/modding/GIRLS_DECISIONS_AND_BACKLOG_20261026.md',section,text.replace('../records/','../../records/'))
append_once(REPO/'docs/IMAGE_COMPATIBILITY_ALIASES_KO.md','## 2026-11-05 2071 외형 분리', '## 2026-11-05 2071 외형 분리\n\n갈색2071·기존 하늘색2324·새 금발2340의 독립 표시를 유지합니다. 옛2071 금발4경로, 하늘색 전신1경로, blue_short라는 이름의 실제 갈색 하녀1경로를 KEEP으로 보존했습니다. 원장 [2026-11-05_2071_split.json](../assets/compatibility-aliases/2026-11-05_2071_split.json)은 같은 바이트 사본과 다른 구도의 같은 인물, 잘못 명명된 복장 관계를 구분합니다. 해시만으로 삭제하거나 자동 교체하지 않습니다. [최종 보고](../records/girls-2071-split-20261105/REPORT_KO.md).')
changelog=GAME.parent/'CHANGELOG_KO.md';body=changelog.read_text('utf-8-sig')
entry='- 2071번에 섞여 있던 외형을 갈색2071·하늘색2324·금발2340으로 분리하고 전신·초상을 연결했습니다. 전용 복장이 없으면 기본 전신을 표시합니다.\n'
assert entry not in body
assert '[신규 업데이트]\n' in body
put(changelog,body.replace('[신규 업데이트]\n','[신규 업데이트]\n'+entry,1))

assert sha(GAME/'jack.qsp')==PLAN['candidate']==sha(REPO/'assets/runtime/2.4.1/jack.qsp')
for id,h in PLAN['protectedJson'].items():assert sha(GAME/f'json/slaves/{id}.json')==h
print(json.dumps(dict(report=str(RECORD/'REPORT_KO.md'),issue='RESOLVED_WORK_APPLIED',qsp=PLAN['candidate'],fullTouched=False),ensure_ascii=False))
