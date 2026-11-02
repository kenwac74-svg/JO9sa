# 안개 전투 전용 배경 분리 — QSP 후보

사용자가 전용 안개 전투 배경과 QSP 두 곳의 경로 분리를 승인했다. 현재 단계는 **후보 준비만 완료**이며 WORK에는 설치하지 않는다. 최종 그림이 준비된 뒤 부모 작업에서 이미지와 함께 반영한다.

## 변경

- 새 경로: `content/pic/bg/battle_mist_forest.png` (부모 작업의 최종 그림,795×596).
- `боевой_интерфейс`: `$place = 'edge_patrol'` 분기의 배경 img 경로 한 곳.
- `конец_боя`: 같은 안개 전투 결과 분기의 배경 img 경로 한 곳.
- 기존 `interior_change` 호출은 유지했다.
- `$bg['edge_patrol'] = 'edge_of_mists<<rand(1,2)>>'`와 탐험/도시 화면은 그대로다.
- 콜로세움 `ui/jo9_battle_test_v01/arena.png`, 이벤트/기본 `ui/grimdark/bg/fight.png` 및 `bg/fight.png` 분기는 그대로다.
- 새 저장 변수, 전투 판정·보상·선택지·무기·HP 변경 없음.

수정 전 SHA: `6b6348b7009d4efb3e9e291b72217515b0f71dd523c38a6b745303d7a16a5632`.
후보 SHA: `ea9a02151917f6ddf416553c0b409862b47efcd877937c515cecd502a5b922b3`.

## 파일

후보/기준/해당 패치만 있는 폴더:
`G:/Codex/tmp/fog-battle-background-20261029/{candidate.qsp,baseline.qsp,mods/2026-10-29_fog_battle_background.json}`.

추적 기록: 이 폴더의 `build.cjs`, `patch.json`, `test-source.cjs`, `source-report.json`, `official-report.json`.

`build.cjs`는 수정 전 WORK 해시를 확인하고 두 body field만 바꾼다. 기존 후보 파일이 있으면 덮어쓰지 않는다. `test-source.cjs`는 새 경로와 guard·다른 분기·탐험 경로를 검사하며 provenance marker와 새 경로를 되돌렸을 때 원래 본문과 정확히 같은지 확인한다.

## 검증 해석

변경 전 source RED는 새 전투 경로가 없는 것을 확인했다. 후보 source PASS는 두 body field만 달라졌고 나머지 데이터·로케이션 필드가 동일함을 확인했다.

공식 출고 검사는 구조/줄바꿈·템플릿·패치 재생/멱등성·실제 설치 엔진9경로·입력 보존을 검사한다. 최종 `official-report.json`의 verdict가 결과다. 전용 PNG가 아직 WORK에 없다는 사실은 `source-report.json`에 명시했다. 엔진 smoke PASS가 새 그림의 존재·모양·실제 모든 전투 승패 화면 검증을 의미하지 않는다.

## 통합·분리 영향

1. 부모 작업이 최종 `battle_mist_forest.png`를 WORK와 추적 리소스에 설치하고795×596·파일 해시를 검증한다.
2. WORK QSP가 수정 전 SHA인지 다시 확인하고 별도 백업한다.
3. 이 후보 QSP와 패치만 반영하고 새 리뷰 해시를 기록한다. 작업 중 수동 QSP 변경이 있으면 전체 파일을 덮어쓰지 말고 패치를 새 기준에 재검토한다.
4. PNG를 빼고 QSP만 반영하면 안개 전투의 배경이 누락된다. QSP 경로 변경 없이 PNG만 추가하면 안개 전투에 사용되지 않는다.
5. 원상복귀는 이 두 패치 블록을 직전 본문으로 되돌리는 것이며 탐험 `$bg` 설정을 바꿀 필요가 없다.

이 하위 작업은 WORK QSP·배경·세이브·배포 폴더를 변경하거나 ZIP·커밋·푸시를 만들지 않는다.
