from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, gzip, shutil, os

O = Path(__file__).resolve().parent
R = Path('G:/somi/JO9sa')
F = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
W = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
T = Path('G:/Codex/tmp/catfight-image-leak-20261101')
Q = Path('G:/Codex/tmp/catfight-image-leak-release-20261101/run-K05PsV')
A = Path('K:/doing/JO9_trash/catfight-image-leak-20261101')
D = R / 'records/catfight-image-leak-20261101'
BEFORE = '994f0606a59cb513602d1385859280c23ce37188898805d309abc8f9cb407724'
AFTER = 'f87363c3050547ae6b7a5387ae9870425fdc4d68cb2e07855e4550df29664168'
sha = lambda b: hashlib.sha256(b).hexdigest()
readj = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
def writej(p, obj):
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def writet(p, text):
    p.write_text(text.rstrip() + '\n', encoding='utf-8')

assert sha((W / 'jack.qsp').read_bytes()) == AFTER
assert sha((F / 'game/jack.qsp').read_bytes()) == AFTER
assert readj(Q / 'report.json')['verdict'] == 'PASS'
assert readj(O / 'green-report.json')['pass']
assert readj(O / 'dom-report.json')['pass']
assert readj(O / 'red-report.json')['reproduced']
A.mkdir(parents=True, exist_ok=True)
D.mkdir(parents=True, exist_ok=True)
archive = []
def preserve(p, name, remove=False):
    raw = p.read_bytes()
    target = A / (name + '.gz')
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        assert gzip.decompress(target.read_bytes()) == raw
    else:
        target.write_bytes(gzip.compress(raw))
        assert gzip.decompress(target.read_bytes()) == raw
    archive.append(dict(source=str(p), target=str(target), sha256=sha(raw), bytes=len(raw), sourceRemoved=remove))
    if remove:
        p.unlink()

# Preserve only files this task changes; all personal and public saves are untouched.
for n in ['BUILD_MANIFEST.json', 'CHANGELOG_KO.md', 'PLAYTEST_KO.md', 'VALIDATION_KO.md']:
    preserve(F / n, 'prior-full/' + n)
for game, n in [(W, 'jack.qsp.bak_20261101_105652'), (F / 'game', 'jack.qsp.bak_20261101_105659')]:
    p = game / n
    assert sha(p.read_bytes()) == BEFORE
    preserve(p, 'apply-backups/' + ('work-' if game == W else 'full-') + n, True)

changelog = (F / 'CHANGELOG_KO.md').read_text(encoding='utf-8-sig')
bullet = '- 장면을 바꾼 뒤 이전 컷신이 남아 다음 행동을 가리던 문제를 수정했습니다.'
assert bullet not in changelog
changelog = changelog.replace('[버그 수정]\n\n', '[버그 수정]\n\n' + bullet + '\n', 1)
writet(F / 'CHANGELOG_KO.md', changelog)

play = (F / 'PLAYTEST_KO.md').read_text(encoding='utf-8-sig')
old = '한 결과를 여러 번 넘겨 보상이나 승수가 다시 증가하지 않는지도 봅니다.'
new = old + ' 이어서 같은 세션에서 집으로 돌아가 목욕·식사 준비·청소를 차례로 실행합니다. 각 생활 장면이 표시되고 이전 전투 결과 그림이 남아 덮지 않는지 확인합니다.'
assert play.count(old) == 1
writet(F / 'PLAYTEST_KO.md', play.replace(old, new))

validation = f'''# 2.4.1 ZIP 압축 전 점검 결과

2026-11-01 최신 WORK와 배포본의 QSP는 SHA256 `{AFTER}`로 일치합니다. ZIP은 만들지 않았습니다.

- 버전 표기·창 제목 2.4.1과 요청한 제작진 감사 항목을 유지했습니다. 이번 수정은 새 일반 행동 진입 시 이전 전체 컷신 배열을 지우는 변수명 오기 한 곳의 교정입니다. 저장 구조·수치·이미지 경로·인물 식별자·사용자 대사는 변경하지 않았습니다.
- 현재 QSP의 277개 로케이션 구조·줄바꿈·바이트 왕복, 인물 등록, 정확한 패치 재생과 재적용 및 WORK/배포본 일치를 검사했습니다. 동봉 엔진의 필수 실행 경로 아홉 개를 모두 통과했습니다.
- 이번 제보를 수정 전 상태에서 재현했습니다. 같은 세션에서 캣파이트 결과 → 정상 복귀 → 집 → 목욕·요리·청소 → 도시 대화를 이어 실행한 검사 91판정 중 이전 이미지 잔류 관련 36판정이 실패했습니다. 수정 후 같은 91판정은 실패 0입니다.
- 동봉 Qt 엔진의 실제 HTML과 PNG 로딩을 추가 확인한 검사는 163판정·실패 0입니다. 위 91판정이 포함된 확장 검사이므로 두 개수를 합산하지 않습니다. 현재 장면 그림의 로딩뿐 아니라 이전 그림의 부재와 장면 레이어 수를 검사했습니다. 같은 이벤트의 2페이지 그림 및 재표시도 유지됩니다.
- 위 집중 검사는 공개 TC 상태를 바탕으로 만든 격리 사본에서 수행했습니다. 실사용 개인 세이브와 원본 공개 TC 일곱 개를 수정하지 않았습니다. 출고 진단용 복제 세이브는 현재 빌드의 버전 문자열만 맞췄으며 원본은 보존했습니다.
- 제작진 표기 열 개 판정은 직전 2.4.1 표기 작업에서 통과했고 이번에 다시 수행한 것으로 계산하지 않습니다. 직전 통합본의 과거 오류 301판정·정적 16항목·JSON 1,156개·JavaScript 세 개 검사 역시 당시 범위의 기록입니다. 그 검사로 장면 간 이미지 수명까지 확인했다고 해석하지 않습니다.
- 기존 게임 경로와 호환 파일, 공개 TC 세이브 일곱 개를 유지했습니다. 개인 저장·제작 원화·개발 도구·진단 사본은 배포물에 추가하지 않았습니다.

개인 세이브의 GUI 불러오기·CRC 및 저장된 스크립트 전체 복원, 모든 화면의 육안 배치·모든 퀘스트·무작위 결과를 전부 검사한 것은 아닙니다. PLAYTEST_KO.md에 수동 확인 순서를 남겼습니다. 워크숍·Show HTML, 마법낙인 재현, 포커스 관련 검은 잔상과 장기 임신 제보 등 기존 보류사항은 해결 완료로 표시하지 않습니다.
'''
writet(F / 'VALIDATION_KO.md', validation)

report = f'''# 이전 전투 컷신이 생활 장면을 덮는 문제 — 수정 및 검수 누락 보고

WORK와 Full 2.4.1에 반영했다. 변경 전 `{BEFORE}`, 변경 후 `{AFTER}`. ZIP·커밋·푸시는 하지 않았다.

## 원인과 수정

`interaction`의 새 행동 초기화가 실제 `$special_image_full` 대신 오기인 `$special_Fimage_full`을 지웠다. `interaction_screen`은 현재 페이지의 `$special_image_full[txt]`가 남아 있으면 일반 장면보다 우선 출력한다. 그 결과 올바른 욕실·주방 그림이 선택돼도 이전 `catfdef1.png`가 다시 위에 그려졌다. 포커스에 따라 사라지는 엔진 잔상과는 다른 상태 초기화 결함이다.

보호 원본 QSP에도 같은 오기가 있지만, 10월 31일 새 캣파이트 결과 그림을 이 배열에 연결한 우리 변경에서 종료 후 수명 검증을 하지 않은 책임은 별도다. 이번 패치는 `interaction` 초기화의 변수명 한 곳을 교정하고 JO9 MOD 마커로 기록했다. 화면을 다시 그릴 때마다 지우지 않으므로 같은 이벤트 안의 페이지별 그림은 보존한다.

## 왜 기존 검수에서 걸러내지 못했나

1. `records/catfight-full-result-render-20261031/probe.cjs`는 결과 그림이 DOM에 존재하고 795×596으로 로딩되는지, 같은 결과를 두 번 그려도 보상이 늘지 않는지만 확인했다. 이벤트 종료 후 생활 행동까지 이어 가지 않았다.
2. `records/full-prezip-20261101/native-historical-regressions.cjs`의 캣파이트 집중 검사는 실제 `interaction_screen_city`를 변수·보상 검사 지점으로 대체했다. 보고서에도 `imagesRendered=false`였다. 301판정 통과는 그 제한된 범위의 결과이며 이번 이미지 누적을 검사한 증거가 아니었다.
3. 이전 MANUAL의 ‘다음 이벤트에서 원래 초기화된다’는 문장은 실행 확인 없이 적은 잘못된 단정이었다. 해당 문서에 정정문을 추가했다.

예상 이미지가 ‘있다’는 검사에 그쳤고, 이전 이미지가 ‘없다’는 검사 및 장면을 벗어난 뒤의 순차 실행을 빠뜨린 것이 검수 누락의 핵심이다.

## 이번 검증과 범위

- 수정 전 native 91판정 중 36실패로 증상 재현. 수정 후 91판정·0실패.
- 현행/옛 주인공 두 분기 × 처형/생존 결과를 실제 렌더러로 출력하고, 결과 재표시 → 실제 앞으로 가기 처리 → 도시 복귀 → 집 → 목욕34·주인공 요리35·청소36 → 일반 도시 대화를 이어 실행했다.
- 실제 Qt DOM/PNG 로딩을 더한 163판정·0실패. 위 91판정을 포함하므로 합산하지 않는다. 올바른 그림 로딩·이전 결과 그림 부재·장면 레이어 수를 검사했다. UI용 아이콘은 장면 그림 수와 구분했다.
- 캣파이트 관람 이벤트의 2페이지 그림과 같은 페이지 재출력이 유지됨을 확인했다. 정상 페이지별 그림까지 지우는 회귀를 방지했다.
- 필수 출고 9경로 및 구조·줄 경계·바이트 왕복·정확 패치 재생·멱등성·배포 일치 PASS. 입력 QSP·대표 공개 TC의 해시를 검사 전후 대조했다.
- 입력 선택값만 진단용으로 주입했고 실제 사용자 창에 마우스·키를 보내지 않았다. 무관한 도시 무작위 이벤트만 격리했다. 개인 SAV를 GUI로 열거나 모든 저장 스크립트·CRC·화면 배치를 검사한 것은 아니다. 조수/노예 식사 준비의 모든 개별 분기를 별도 실행했다고 주장하지 않는다. 공용 새 행동 초기화는 동일하게 적용된다.

초기 진단에서 직접 결과 진입 phase를 2로 잘못 둔 자료와, DOM 장면 수에 UI 아이콘까지 포함한 측정 자료는 별도 보존했다. 최종 판정에는 올바른 phase3 및 `#bg > img` 기준의 재실행 자료만 사용했다. 제품 오류를 숨기거나 실패를 통과로 집계하지 않았다.

## 사용과 유지보수

기존 세이브를 변경하지 않았다. 현재 실행 중인 구버전 프로세스에는 파일 변경이 소급되지 않으므로 게임을 다시 실행하고 새 행동에 진입하면 교정된 초기화가 작동한다. 공개 `TC_03_CATFIGHT_VICTORY.sav`에서 두 결과를 비교한 뒤 같은 세션으로 목욕·식사 준비·청소를 이어 육안 확인할 수 있다. 관람 2페이지도 보존돼야 한다.

생산 코드의 입력·반환은 기존 `interaction` 진입 규약 그대로다. 새 행동마다 기존 전체 장면 배열을 비우는 부작용만 정상화한다. 의존 호출자는 `interaction`을 새로 시작하는 일반 행동, 출력자는 `interaction_screen`이다. 이 수정을 제거하면 이전 전체 컷신의 잔류가 다시 발생한다. 저장 변수·로케이션을 추가하지 않았고 대사·보상·경로도 바꾸지 않았다.

패치는 `mods/2026-11-01_interaction_image_scope_reset.json`, 재현 도구는 이 폴더의 `native.cjs`와 `dom.cjs`다. `docs/QSP_RELEASE_VALIDATION.md`에 장면 전환 후 부재 확인을 필수 추가 회귀로 명시했다. 재생성 가능한 진단 복사본은 정리하고 핵심 보고서·재현 스크립트와 해시 검증한 복구 자료를 보존한다.
'''
writet(O / 'REPORT_KO.md', report)

appendix = '''
## 2026-11-01 장면 전환 후 이전 컷신 잔류 회귀

결과 컷신·전체 화면 배열을 수정했을 때는 기본 9경로와 결과 페이지 단독 검사에 더해 **같은 상태로 이벤트를 나간 뒤 다음 행동까지** 확인한다. `interaction_screen_city`를 빈 검사 지점으로 대체한 변수 검사는 이 회귀의 완료 증거가 아니다.

필수 순서: 현행/옛 주인공 × 처형/생존 결과 → 같은 결과 재표시 → 실제 앞으로 가기 처리 → 도시 → 집 → 목욕·요리·청소 → 일반 도시 대화. 현재 장면 그림이 있다는 확인과 함께 이전 결과 그림이 없고 장면 레이어 수가 맞는지도 검사한다. 같은 이벤트 2페이지·재출력의 전체 그림은 유지돼야 한다.

실제 출력 로케이션을 유지하는 재현 도구와 red/green 결과는 `records/catfight-image-leak-20261101`에 있다. 기본 실행기는 고유한 새 임시 폴더로 지정한다. 엔진 검사는 다른 엔진 진단과 동시에 실행하지 않는다.

```powershell
$env:JO9_IMAGE_LEAK_QA_ROOT = 'G:/Codex/tmp/<이번 검사의 새 고유 폴더>'
$env:JO9_IMAGE_LEAK_QA_GAME_DIR = 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game'
node records/catfight-image-leak-20261101/native.cjs prepare green '<현재 검사할 jack.qsp>'
node records/catfight-image-leak-20261101/native.cjs run green
node records/catfight-image-leak-20261101/dom.cjs prepare
node records/catfight-image-leak-20261101/dom.cjs run
```

동봉 엔진과 공개 TC 상태를 사용한다. DOM 확장 결과는 native 판정을 포함하므로 합산하지 않는다. DOM 장면 수는 `#bg > img`, 이전 그림 부재 검색은 모든 `#bg img`를 검사한다. 중첩 앵커 안의 UI 아이콘은 장면 그림에 합산하지 않는다. 개인 세이브 GUI 불러오기·전체 스크립트 복원·육안 픽셀 정렬 검증으로 표현하지 않는다. 재현 도구 실행에 필요한 Node/PowerShell과 기존 QA 코덱은 유지한다.
'''
doc = R / 'docs/QSP_RELEASE_VALIDATION.md'
text = doc.read_text(encoding='utf-8-sig')
assert '## 2026-11-01 장면 전환 후 이전 컷신 잔류 회귀' not in text
writet(doc, text + '\n' + appendix)
erratum = '''
## 2026-11-01 정정 — 장면을 나간 뒤의 초기화 미검증

위 기록의 ‘다음 이벤트에서 원래 초기화된다’는 설명은 당시 실행 검증이 없던 잘못된 단정이다. 결과 그림의 존재·재표시와 보상만 검사하고 새 생활 장면까지 이어 가지 않아 `interaction`의 `$special_Fimage_full` 오기를 놓쳤다. 이후 사용자 제보로 이전 결과 그림 잔류를 재현했고 실제 `$special_image_full` 초기화로 교정했다. 이전 결과 통과 기록은 당시 범위로만 해석한다. 원인·수정·검사 확대는 [후속 보고](../catfight-image-leak-20261101/REPORT_KO.md)에 기록했다.
'''
oldmanual = R / 'records/catfight-full-result-render-20261031/MANUAL_KO.md'
writet(oldmanual, oldmanual.read_text(encoding='utf-8-sig') + '\n' + erratum)
oldreport = R / 'records/full-prezip-20261101/REPORT_KO.md'
writet(oldreport, oldreport.read_text(encoding='utf-8-sig') + '\n## 2026-11-01 후속 제보와 검증 범위 정정\n\n캣파이트 301판정의 하위 시험은 결과 렌더러를 검사 지점으로 대체했고 이미지를 출력하지 않았다. 결과 복귀 후 목욕·요리 등에서 이전 컷신이 사라지는지 검사하지 않아 사용자 제보를 놓쳤다. 기본 9경로와 당시 집중 검사 통과를 이 장면 수명의 검증으로 해석하지 않는다. 후속 수정과 실제 렌더러·DOM 순차 회귀는 [별도 보고](../catfight-image-leak-20261101/REPORT_KO.md)에 기록했다. 현재 Full의 최신 QSP 해시는 해당 후속 보고를 우선한다.\n')
handoff = R / 'docs/SESSION_HANDOFF_INDEX.md'
writet(handoff, handoff.read_text(encoding='utf-8-sig') + f'\n## 2026-11-01 이전 전투 그림 잔류 수정 — 최신 WORK/Full 2.4.1\n\n[원인·검수 누락·후속 검증](../records/catfight-image-leak-20261101/REPORT_KO.md). 일반 행동 초기화 변수명 오기 한 곳을 교정했다. WORK/Full QSP `{AFTER}`. 수정 전 증상 재현, 실제 연속 장면 출력 native91 및 DOM확장163판정 실패0, 출고9경로 PASS. 새 저장 구조·경로 이동 없음. Full 갱신은 현재 배포 준비 지시 범위이며 이후 일반 WORK 전용 정책은 유지한다. ZIP·커밋·푸시는 하지 않았다.\n')

for source, name in [(Q / 'report.json', 'release-report.json'), (Q / 'report.md', 'release-report.md'), (Q / 'client-runner.log', 'release-client-runner.log'), (Q / 'patch-replay.log', 'release-patch-replay.log'), (Q / 'patch-reapply.log', 'release-patch-reapply.log')]:
    shutil.copy2(source, O / name)
for n in ['native.cjs', 'dom.cjs', 'prepare.cjs', 'patch.json', 'REPORT_KO.md', 'prepared.json', 'release-fixture.json', 'red-report.json', 'red-fixture-phase2-report.json', 'green-report.json', 'dom-report.json', 'dom-controls-included-report.json', 'green-prepared.json', 'red-prepared.json', 'red-runner.log', 'green-runner.log', 'dom-runner.log', 'release-report.json', 'release-report.md', 'release-client-runner.log', 'release-patch-replay.log', 'release-patch-reapply.log', 'finish.py']:
    shutil.copy2(O / n, D / n)
for n in ['CHANGELOG_KO.md', 'PLAYTEST_KO.md', 'VALIDATION_KO.md']:
    shutil.copy2(F / n, D / n)

manifest = readj(F / 'BUILD_MANIFEST.json')
for row in manifest['files']:
    if row['path'] in ['game/jack.qsp', 'CHANGELOG_KO.md', 'PLAYTEST_KO.md', 'VALIDATION_KO.md']:
        raw = (F / row['path']).read_bytes()
        row.update(bytes=len(raw), sha256=sha(raw))
manifest['preparedUtc'] = datetime.now(timezone.utc).isoformat()
manifest['qspSha256'] = AFTER
manifest['payloadBytesExcludingManifest'] = sum(row['bytes'] for row in manifest['files'])
manifest['validation'].update(imageScopeNativeAssertions=91, imageScopeNativeFailures=0, imageScopeDomAssertionsIncludingNative=163, imageScopeDomFailures=0, imageScopeBaselineFailures=36, imageScopeQspSha256=AFTER, mandatoryNativePaths=9, imageScopeReleaseVerdict='PASS', historicalChecksScope='Historical assertions apply only to their recorded scopes. They did not test previous-image absence after event exit. See records/catfight-image-leak-20261101/REPORT_KO.md.')
writej(F / 'BUILD_MANIFEST.json', manifest)
writej(O / 'ARCHIVE_MANIFEST.json', archive)
shutil.copy2(O / 'ARCHIVE_MANIFEST.json', A / 'ARCHIVE_MANIFEST.json')
shutil.copy2(O / 'ARCHIVE_MANIFEST.json', D / 'ARCHIVE_MANIFEST.json')
shutil.copy2(F / 'BUILD_MANIFEST.json', D / 'BUILD_MANIFEST.json')
applied = dict(beforeQspSha256=BEFORE, afterQspSha256=AFTER, work=str(W / 'jack.qsp'), full=str(F / 'game/jack.qsp'), productionApplied=True, changedLocations=['interaction'], saveSchemaChanged=False, newVariables=0, newLocations=0, zipCreated=False, commitCreated=False, pushed=False)
writej(O / 'APPLIED.json', applied)
shutil.copy2(O / 'APPLIED.json', D / 'APPLIED.json')
print(json.dumps(dict(status='DOCS_AND_MANIFEST_UPDATED', record=str(D), qsp=AFTER, archivedPriorFiles=len(archive), payloadFiles=len(manifest['files'])), ensure_ascii=False))
