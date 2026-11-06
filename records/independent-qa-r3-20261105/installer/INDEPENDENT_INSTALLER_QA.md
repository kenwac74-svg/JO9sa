# JO9 2.4.1 2026-11-05 r2 independent installer QA

검사자 역할은 제작과 분리한 독립 QA다. 기존 23-case 보고서를 인용하지 않고 현재 ZIP의 실제 `INSTALL.cmd`, `INSTALL_HELPER.ps1`을 먼저 읽은 뒤 아래 TC를 새로 실행했다. 게임 EXE 및 `nativejack.exe`는 실행하지 않았다.

## 입력 및 변경 경계

- ZIP: `G:/somi/JO9_2.4.1_Patch_20261105_r2/JO9_2.4.1_Patch_20261105_r2.zip`
- ZIP SHA256: `ff2f3f05097e70e289535d9715cf5b10e812b14f5d16e70dd48f0312db6485db` (시작/종료 동일)
- 실제 shipped helper SHA256: `fcc59b85de2ed73efbfdd7c533a7ec077fc6d2a74d65631b985379c1414b995a`
- 실제 shipped CMD SHA256: `8b971c17ceaefddcde9e241f3874e923017f6044edae7a19018e6b68a11659db`
- manifest SHA256: `d1155fab23c41efc2f078956179674f5a375b94b872f61cf4bff4d0f52776382`
- ZIP 1,973 entries; manifest payload는 JSON 1,158 + PNG 807 + QSP 1 = 1,966 files.
- 검사 대상은 `G:/Codex/tmp/jo9-independent-qa-r2-20261105/installer` 아래 가짜 게임뿐이다. `Jack-o-nine-tails.exe`는 실행 불가능한 텍스트 marker다. WORK, Full, 순정, 실제 SAV, 원본 ZIP은 수정하지 않았다.
- Mini fixture는 QSP 1 + JSON 2 + PNG 역할 marker 1의 4-file payload다. **shipped helper의 고정 manifest SHA 상수 하나만 테스트 복사에서 치환했다.** Mini marker는 유효한 게임 QSP/PNG가 아니며 설치 파일 취급만 검사한다. IQ12는 이 치환 없이 실제 shipped helper와 전체 실제 payload를 사용했다.
- Windows PowerShell 5.1 child의 `PSModulePath`만 Windows PowerShell 시스템 모듈 경로로 맞췄다. `-ExecutionPolicy Bypass`는 해당 child 호출 옵션이다. 전역 정책 변경은 없고 before/after 목록이 동일했다.

## 먼저 식별한 위험

1. CMD의 `setlocal`은 지연 확장을 끄지 않아 `!` 경로 처리에 환경 의존성이 있다.
2. JSON 전체 교체는 old tree 제거를 의도하므로 저장/설정과 경계를 확인해야 한다. helper는 `game/json/save_config.json`만 특별 보존하며 나머지 old JSON tree는 제거한다.
3. helper가 JSON stage → QSP/PNG 교체 → old JSON 이동 → 새 JSON 활성화 순으로 쓰기 때문에 중간 오류에서 런타임과 JSON 모두의 복원이 필요하다.
4. 경로/정션, 검증 전 쓰기, 파일 잠금, source 누락/손상, incomplete extraction, in-place 설치, 반복 설치를 별도로 구분했다.

## 확정 발견

### F01 — [P1] 권한 오류 때 JSON 일부 이동 후 자동 복구 누락

**재현 2회.** 기존 `game/json` 폴더에 현재 사용자 `Deny Delete`, 그 부모 `game`에 `Deny DeleteSubdirectoriesAndFiles`를 설정한다. 파일 읽기·새 stage 생성·기존 QSP 쓰기는 허용된다. NonInteractive helper를 실행한다.

- helper는 payload를 검증하고 stage를 만들고 QSP/PNG를 교체한다.
- 188행의 `Move-Item $targetJson $jsonRollback`이 기존 JSON의 내용을 rollback 폴더로 이동한 뒤 원래 json 폴더 제거/이동 단계에서 Access Denied를 낸다.
- 실행 결과는 exit 1이며, **활성 `game/json`은 빈 폴더**다. 기존 JSON 3개는 `json.__jo9_rollback_<id>`에 남는다.
- QSP는 OLD QSP로 복원되고 새 PNG는 제거되어 runtime 복원은 동작한다. save/INI/XML은 보존된다.
- 189행의 `$oldJsonMoved = $true`가 실행되기 전에 오류가 나서 235행의 조건부 JSON 복원이 실행되지 않는 것이 코드상 원인이다.
- 데이터 자체가 삭제된 것은 아니지만 설치 전 상태가 자동 복원되지 않아 게임은 실행하지 말고 rollback JSON을 수동 복원해야 한다. 에러 출력은 일반 설치 실패/다시 설치 안내만 하며 남은 JSON 복구 경로를 구체적으로 출력하지 않는다.

증거: `reproduction/IQ07.log`, `reproduction/IQ07-before-after.json` (두 번째 새 fixture), 첫 재현 `retest/IQ07.log`. 최종 판정은 FAIL. 초회 IQ07은 Delete만 거부해 부모 DeleteChild 권한으로 설치가 성공했으므로 **오류 주입 미성립**으로 제외했다.

개선 방향 제안(이 보고서 작성 시 원본 미수정): 같은 `game` 디렉터리의 JSON 전환은 copy fallback이 없는 `[IO.Directory]::Move(source,destination)`을 사용하고 오류 TC를 다시 실행한다. 복구 관련 188/191/232/235행을 함께 검토한다.

### F02 — [P2] CMD /V:ON 환경의 `!` 경로에서 잘못 중단

`cmd /d /v:on /s /c INSTALL.cmd`를 `cmd on 한글 & (괄호) !JO9_QA_MARK!` 작업 디렉터리에서 실행한다. 명령 인자에는 특수문자 경로를 넣지 않아 호출부의 변수 확장 영향을 배제했다. child 환경의 `JO9_QA_MARK=EXPANDED`다.

- 실제 shipped CMD는 helper와 manifest가 있는데도 누락/압축 전체 해제 안내를 출력하고 exit 1.
- 같은 특수문자 경로의 `/V:OFF`는 정상 설치한다.
- `/V:ON`에서 `!`가 없는 한글/&/() 대조 경로는 정상 설치한다.
- target 파일 해시는 실패 전후 동일하다. 설치 손상은 없고 설치 진입이 차단된다.
- `setlocal`을 `setlocal EnableExtensions DisableDelayedExpansion`으로 바꾼 **격리 candidate**는 `!` 포함 경로의 `/V:ON`과 `/V:OFF` 모두 정상 설치했다.

증거: `retest/IQ09.log`, `retest/IQ15.log`, `reproduction/IQ18.log`, `reproduction/IQ19.log`. candidate는 `candidate/INSTALL.cmd`, 한 줄 diff와 input/output SHA는 해당 폴더와 `input-and-candidate-hashes.json`에 보존했다. 실제 shipped CMD와 원본 ZIP은 변경하지 않았다.

## TC coverage

| TC | 조건 | 결과 / 증거 |
|---|---|---|
| IQ01 | PS helper: 한글·공백·&·()·! source/target 경로 | PASS, `IQ01.log`; 실제 payload 대조 및 보호 파일 해시 보존 |
| IQ02 | 같은 mini 반복 설치 | PASS, `IQ02.log`; 두 번째 전체 target bytes 동일 |
| IQ03 | PNG 역할 source bytes 변조 | PASS, `IQ03.log`; 해당 상대 경로 표시, exit 1, target 전체 동일 |
| IQ04 | JSON source 누락 | PASS, `IQ04.log`; 누락 상대 경로 표시, target 전체 동일 |
| IQ05 | 기존 PNG 역할 target exclusive file lock | PASS, `IQ05.log`; 사전 차단, target 전체 동일 |
| IQ06 | QSP 복사 후 새 이미지 만들기 Access Denied | PASS, `IQ06.log`; QSP 원복, old JSON 유지, stage/rollback 정리 |
| IQ07 | old JSON move에 Delete + parent DeleteChild 거부 | **FAIL F01**, `reproduction/IQ07.log`; 반복 재현, 활성 JSON 빈 폴더 |
| IQ08 | shipped CMD: /V:OFF + in-place + 한글/&/()/! | PASS, `IQ08.log`; 자동 script-root 인식, old JSON 제거 |
| IQ09 | shipped CMD: /V:ON + 같은 특수문자 경로 | **FAIL F02**, `retest/IQ09.log`; 변경 없이 exit 1 |
| IQ10 | helper/manifest가 빠진 CMD만 실행 | PASS, `retest/IQ10.log`; 전체 압축 해제 안내, exit 1 |
| IQ11 | NonInteractive에서 TargetRoot 미지정/자동 후보 없음 | PASS, `IQ11.log`; UI 호출 없이 exit 1 |
| IQ12 | **실제 shipped helper + 실제 전체 1,966 payload** | PASS, `IQ12.log`; 설치 후 1,966 SHA 전부 대조, JSON 1,158 + save_config 1, old JSON 제거 |
| IQ13 | ExecutionPolicy before/after | PASS, `execution-policy-before-after.json`; scope 목록 동일 |
| IQ14 | 원본 ZIP 무변경 | PASS, `IQ14.log`; 지정 SHA 그대로 |
| IQ15 | shipped CMD: /V:ON + 한글/&/(), ! 없음 | PASS, `retest/IQ15.log`; F02 대조군 |
| IQ16 | source PNG ReadData 거부 | PASS, `retest/IQ16.log`; 쓰기 전 차단, target bytes 동일 |
| IQ17 | 사용자 save_config ReadData 거부 | PASS, `retest/IQ17.log`; stage 정리, old target bytes 동일 |
| IQ18 | 한 줄 CMD candidate: /V:ON + 한글/&/()/! | PASS, `reproduction/IQ18.log` |
| IQ19 | 같은 CMD candidate: /V:OFF + 한글/&/()/! | PASS, `reproduction/IQ19.log` |

원본 r2 대상 17 TC 중 15 PASS, 2 FAIL. 별도 CMD candidate 2 TC PASS. 첫 실행 IQ07의 주입 미성립 및 IQ10의 QA 로그 디코딩 오류는 위 최종 결과로 대체한다. 초회 raw 기록은 보존하며 제품 결함으로 세지 않는다.

## 기술 수정 candidate 회귀 — 9/9 PASS

제작자에게 전달한 승인 범위의 격리 후보는 다음 둘이다. 원본 r2 ZIP, WORK, Full에는 반영하지 않았다.

- `candidate/INSTALL.cmd`: `setlocal` → `setlocal EnableExtensions DisableDelayedExpansion` 한 줄만 변경. SHA256 `b5b2d3e7d8a87b306e2ce83b3491ac941418e67f74354b2cd7ef750115368c06`.
- `CANDIDATE_INSTALL_HELPER.ps1`: 188/191/232/235행의 JSON 디렉터리 `Move-Item` 네 곳만 `[IO.Directory]::Move`로 변경. SHA256 `fd1dc7d5ef2193ada4e65e248f7f617e15918cba907a0fcc8676dd1a69a83098`. 배포 template의 고정 manifest SHA는 r2 원상수 그대로다. JSON current/stage/rollback은 같은 `game` 부모 아래이므로 같은 볼륨 내 rename만 필요하고 copy fallback은 불필요하다.

`candidate-regression`에서 새 가짜 게임 트리를 사용해 IQ01 정상, IQ02 반복, IQ06 runtime 중간 실패, **IQ07 원 ACL 재현**, IQ08 in-place, IQ18 CMD /V:ON, IQ19 CMD /V:OFF, **IQ20 두 번째 별도 ACL fixture**, **IQ21 실제 전체 payload 설치**를 실행해 9/9 PASS했다. 두 ACL TC는 exit 1로 설치를 중단하면서 기존 JSON/QSP와 보호 파일의 전체 byte map이 설치 전과 같고 stage/rollback도 남지 않았다. IQ21은 실제 1,966 payload 파일의 설치 후 SHA를 모두 대조하고 JSON 1,158 + 보존 save_config 1, old JSON 제거, sav/INI/XML 보존을 확인했다(42.7초).

이 회귀 결과는 candidate helper/CMD를 사용한다. 해당 폴더의 raw summary에 남은 “IQ12 uses exact shipped helper” 문구는 공통 harness 설명이며, 실제 실행 TC는 IQ21이고 사용 template은 이 절의 candidate SHA다. 최종 `candidate-regression/summary.json`에는 template SHA와 사용 여부를 명시했다.

## 미실행 및 사용자 TC 인계

- 실제 기존 게임 자동 인식 UI, 폴더 선택기 표시/선택/취소(취소 exit 2), 더블클릭의 창/메시지 가독성, 탐색기 ZIP 내부 직접 실행 경험은 미실행이다. 가짜 게임의 script-root 자동 인식만 자동화했다.
- 실제 게임 EXE로 로딩, 기존 세이브 불러오기, JSON 사용 분기, 이미지 표시 등 플레이 TC는 사용자 인계다. 이 보고서는 게임 동작 PASS를 뜻하지 않는다.
- UAC/표준 사용자 간 권한 차이, 네트워크/외장 볼륨, 디스크 부족/강제종료, 동시 변경 race, 매우 긴 경로, 보안 프로그램 격리, 폴더 선택기의 가짜/실제 게임 구분은 이번 실행 범위 밖이다.
- 정션/심볼릭 링크 방어는 코드에서 확인했지만 이번 독립 실행 TC로 재검증하지 않았다.

## 재현 및 자료 보존

`run-independent-installer-qa.ps1`는 UTF-8 BOM PowerShell 5.1 스크립트다. 기본 실행은 가짜 fixture root가 비어 있어야 하며, 원본을 덮어쓰지 않는다. `-Only IQ07,IQ09`와 별도 `-OutRoot`는 선택적 재현을 지원한다. 삭제는 별도 범위 확인 후 수행한다. 핵심 보고서, 원문 CMD, candidate, hash, 로그, 재현 script를 보존하고 큰 재생성 가능 fixture는 최종 정리한다.

정리 완료: `cleanup-result.json`. 정확한 절대 fixture 경로와 모든 조상의 reparse 부재, 모든 자식의 범위·reparse 부재, 모든 EXE가 실행 불가능한 QA text marker임을 확인한 뒤 8,345 files / 383 directories / 975,720,105 bytes를 제거했다. `G:/Codex/tmp/jo9-independent-qa-r2-20261105/installer`는 남아 있지 않다. 테스트 데이터는 전부 재생성 가능하며 유일한 복구 자료·사용자 데이터는 포함하지 않았다.
