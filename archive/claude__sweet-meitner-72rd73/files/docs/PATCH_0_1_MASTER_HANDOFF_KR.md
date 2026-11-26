# JO9 UI_overhaul_SNKmod 0.1 전체 인계 색인

2026-09-28. 사용자는 Codex 작업 전체를 Claude에 인계하고 Codex 측 작업을 종료하도록 요청했다. 이 브랜치는 구현, 배포 당시 자료, 공개 대화 이력, 검수 증거 및 미해결 진단을 보관한다. **문서 인계 완료와 패치 결함 해결 완료는 다르다.** 기존 배포 ZIP은 수정 재빌드하지 않았다.

## Claude 후속 버전과의 관계

최종 전달 직전 Claude 대화에서 0.11 배포 및 JO9UIpatch 커밋 `8feb2a7` 보고를 확인했다. 이는 Claude의 후속 작업이며 이 0.1 인계 브랜치보다 최신 제품 상태다. 여기서 기록한 최종 정책의 범위는 Codex 0.1 개발 종료 시점이며, 이후 사용자 승인 정책은 Claude 대화/0.11 문서가 우선한다. 이 브랜치를 통째로 병합해 0.11 구현을 되돌리지 않는다. 이번 보완 중 참고 문서·이력·검사 런타임만 필요에 따라 취한다. Claude는 WASM 부재로 개인실 검사를 못 돌렸다고 보고했으며, 그 의존성은 이번 브랜치에 추가했다. 0.11 테스트 결과나 ZIP 자체를 Codex가 재검증한 것은 아니다.

## 읽는 순서와 우선순위

1. [최종 리소스 분류 기준](FINAL_RESOURCE_CLASSIFICATION_KR.md): 과거 문서의 포장 범위와 충돌하면 이것이 우선.
2. [기능·설치·개인실 상세 인계](CLAUDE_HANDOFF_RELEASE_0_1_20260928.md): 확정 기능, 대상 연결 방식, 식단, 착유, 출산, 검수 한계.
3. [원본 경로 의존 진단](../audits/LEGACY_RESOURCE_DEPENDENCY_KR.md) 및 [참조 목록](../audits/legacy_resource_refs.json).
4. [설치 후 QSP 변경 진단](../audits/CUMULATIVE_RELEASE_DIAGNOSIS_KR.md).
5. 실제 소스와 아래 배포 파일별 목록을 대조한다. 오래된 R3 문서와 중간 TEST 보고서는 당시 기록이며 최신 정책을 대체하지 않는다.

## 패치 범위

| 영역 | 구현/근거 | 내용 |
|---|---|---|
| 누적 빌드 | [build_package.py](../build/build_package.py), [resource_rules.json](../build/resource_rules.json) | FIX6 기준 본문·이미지와 추가 리소스, 경로 변환, 개인실 변경을 합성 |
| 개인실 1~4 | [private_room.py](../build/private_room.py) | 공통 카드, 원작 메뉴 재사용, 방별 대상 임시 교환/복원, 하위 메뉴 유지 |
| 배치·레이어 | [style.css](../build/private_room/style.css) | 하단 설명, 우측 카드, 팝업, 최상위 툴팁 |
| 식단 | [private_room_diet.py](../build/private_room_diet.py) | 즉시 적용, 비용, 연속 특별식 효과, 구세이브 값 변환 |
| 착유 | private_room.py 및 [조건부 행동 검사](../audits/PRIVATE_ROOM_CONDITIONAL_ACTION_AUDIT_KR.md) | 수유/모유량 조건, 방별 원작 기능 연결. 안개괴물 업무 제외 |
| 출산 | [private_room_birth.py](../build/private_room_birth.py) | 150일 검사, 의료시설 이벤트, 방 슬롯 보존, 정상/ESC 복귀, 비용 부족 분기 |
| 설치·복원 | [Install.ps1](../installer/Install.ps1), [배포 안내](../installer/README_RELEASE_KR.txt) | 사용자 지정 게임 폴더, 사전 백업 불필요, 설치 시 백업, 변경 알림 및 Y/N, 복원 |
| 자산 | resources/new, resources/originals, resources/private_room, baseline | UI 작업용 입력. 이미지팩 교체분은 별도 관할 |
| 원본 해독 | [qsp_dump.py](../tools/qsp_dump.py), reference | FIX6·순정 QSP 및 본문 비교 |

확정 UI와 기능별 세부 값·제외 기능은 상세 인계 문서에 기재했다. generic Actor 리팩터링이나 새로운 개인실 전용 관계 시스템을 도입한 패치가 아니다.

## 배포 파일 및 내용 조회

- [기존 0.1 ZIP](../releases/JO9%20UI_overhaul_SNKmod_0.1.zip): 13,588,772 bytes, SHA256 `6249885f17fba8aef13ab1f668e4470e13880800bfaa81d774f9f7609a9475e0`.
- 본문 패치 248개, 이미지 143개, ZIP 내부 파일 156개(디렉터리 5개 포함 시 항목 161개). 이 숫자를 독립 설치형 검증 완료의 근거로 사용하지 않는다.
- [전체 ZIP 파일·크기·해시](package-index/archive-files.json).
- [설치 명세](package-index/manifest.json), [이미지 출처·참조 맵](package-index/ui_map.json).
- [QSP location별 색인](package-index/qsp-location-index.json), [경로 치환 규칙](package-index/path-rules.json).
- QSP 패치 전체 Text는 ZIP의 qsp-patches.json에 있다. 색인은 검색 편의를 위한 것이며 본문 대신이 아니다.

## 빌드 재현

저장소 루트에서 Python 3로 실행한다. 기준 QSP는 Git에 포함되어 있다.

```sh
python build/build_package.py --qsp reference/FIX6-jack.qsp --release --vanilla-qsp reference/vanilla-jack.qsp --out dist/release-0.1
```

출력 폴더는 `dist/release-0.1/JO9 UI_overhaul_SNKmod_0.1`이다. 빌드 스크립트는 폴더를 생성하며 ZIP 압축은 별도다. 이번 인계에서 새 빌드나 배포를 실행하지 않았다. 후속 담당자는 먼저 분류 결과를 보고하고 사용자의 다음 지시에 따라 수정한다.

## 검사 재현과 한계

기존 ZIP을 임시 디렉터리에 풀어 아래 `<package>`에 그 안의 manifest.json이 있는 폴더를 지정할 수도 있다.

```sh
python tests/test_private_room.py --pkg "<package>" --qsp reference/FIX6-jack.qsp
python tests/test_installer.py --qsp reference/FIX6-jack.qsp --pwsh "<PowerShell executable>" --pkg "<package>"
node tests/test_private_room_routes.cjs "<package>"
node tests/test_private_room_diet.cjs "<package>"
node tests/test_private_room_milking.cjs "<package>"
node tests/test_private_room_birth.cjs "<package>"
```

- Node 검사에 필요한 기존 `@qsp/wasm-engine` 1.0.0 런타임, package.json, LICENSE, Readme를 원래 검사 경로인 `audits/reward-diagnostic/vendor-legacy/package/`에 보존했다. 게임에 설치하는 파일이 아닌 검사 의존성이다.
- Windows 순정 설치/복원 검사는 `tests/test_release_clean_install.py --game <순정 사본> --pkg <package>`이다. Windows PowerShell 경로가 코드에 고정되어 있고, 실제 원본 CSS/JSON/엔진/Qt 및 필요한 이미지가 추가로 있어야 한다. reference QSP 두 개만으로 이 검사를 온전히 재현할 수 있다고 주장하지 않는다.
- 과거 결과: 정적 13개, 설치기 43개, 착유 40조건, 출산 72조합 검사. [0.1 보고](../audits/RELEASE_0_1_REPORT_KR.md), [TEST13 보고](../audits/TEST13_REPORT_KR.md), [출산 로그](../audits/test13-birth.log), [설치 로그](../audits/release01-installer.log).
- WASM 검사는 일부 화면/보조 함수 대역을 사용한다. 실제 FastQSP 전 화면 클릭 검수가 아니다.
- 사용자가 TEST13의 정상 동작을 확인했지만, 이후 순정 설치 환경에서 구 UI가 나타나는 문제를 제보했다. 설치→런처 실행→재시작을 포함한 검수가 추가로 필요하다.

## 미해결 과제와 담당

| 과제 | 확인된 상태 | Claude 후속 작업 |
|---|---|---|
| 리소스 분류 | 원본 UI 경로 참조 2,157개와 비교 폴더 간 차이 147개 발견. 미사용/테마/이미지팩이 섞일 수 있음 | 최종 분류 기준과 순정 목록으로 실제 UI 작업 자산만 전수 분류하고 결과부터 보고 |
| QSP 유지 | 설치 기록 해시와 현재 JO9O QSP가 다름. 관련 5개 본문은 구 qsrc와 일치 | 실제 실행 전후 해시로 변경 시점 재현. 재컴파일은 아직 가설 |
| 미발견 참조 12개 | Codex는 정적 미발견 목록까지만 검사 | Claude가 받은 ref.zip 및 최신 0.1로 사용처 재확인. 사용자 승인 cum_gray 생성 작업은 Claude 작업 브랜치에서 보존 |
| 최종 회귀 검사 | 과거 설치/복원 검사는 통과했으나 실행 후 유지 검사는 미완료 | 분류/수정 후 설치·메인/개인실·재시작·복원까지 검수 |

Claude의 최근 작업 브랜치와 이 브랜치는 서로 다른 시점의 변경을 담고 있다. 이 인계로 Claude의 cum_gray, 분류 기록, 다른 사용자의 작업을 덮어쓰지 않는다. 코드 병합 전에 차이를 확인한다. 이번 전달은 main 또는 기존 작업 브랜치에 자동 병합하지 않는다.

## 작업 이력·원문 자료

- [공개 대화 이력 Markdown](handoff/history/conversation_visible.md) / [JSON](handoff/history/conversation_visible.json): 최종 인계 준비 시점까지 709개 사용자·답변 텍스트.
- [초기 핸드오프](handoff/user_handoffs/JO9_UIpatch_PRIVATE_ROOM_WORK_HANDOFF_20260927.md).
- [개인실 UI 설계 v2](handoff/user_handoffs/JO9_PrivateRoom_UI_Design_v2_KO.md).
- [식단 개발 핸드오프](handoff/user_handoffs/JO9_PrivateRoom_Diet_Developer_Handoff_KO.md).
- docs 및 audits의 TEST/ISSUE 문서와 로그는 변경 경위/검수 근거로 함께 보존한다.

이미지팩 원본, 개인 세이브, 계정 인증 정보, 비공개 내부 추론은 포함하지 않는다. 과거 첨부 화면 이미지 전체나 다른 채팅의 모든 원문을 수집한 아카이브는 아니다. 최종 UI 자산과 구현, 제공받은 설계 문서, 현재 채팅의 공개 이력으로 인계한다. 사용자가 Claude에 별도로 전달한 이미지/순정 목록/ref.zip은 그 자료를 이용한다.

Codex는 이 자료의 원격 업로드와 최종 전달을 마치고 작업을 종료한다. 이후 담당은 Claude이며, 분류 결과 보고를 우선한다.
