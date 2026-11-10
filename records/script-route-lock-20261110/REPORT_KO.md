# 각본 시작·선택 경로 고정

2026-11-10 사용자 요청에 따라 시작 클릭 → 분기 선택 누적 → 마무리 지정 → 한 각본 출력으로 수정했다.

## 바뀐 동작

- 중간 대사도 시작 클릭 즉시 고정한다. 이전 시작 안내가 사라져도 고정은 풀리지 않는다. 새 각본 시작만 시작을 초기화한다.
- 분기의 이 대사 선택은 탐색과 동시에 선택 대사를 각본 choices에 저장하고 다음 단계 후보를 표시한다. 끝 지정 때 choices를 지우지 않는다.
- 같은 변형 재방문·탐색·편집 탭 왕복·새로고침은 고정을 유지한다. 앞 분기를 바꾸면 뒤 대사·장면 경로·끝만 정리한다.
- 장면 간 이동도 고정한다. 동일 목적지에 다른 선택지가 여러 개면 추측하지 않고 출력 시 확인한다.
- QSP가 실제 바뀌면 고정을 지우지 않고 stale 상태로 출력만 잠근다. 같은 QSP의 옛 pins.at는 실제 원문으로 boundary를 재조회해 키를 보정한다.
- 정적 대사가 동적 페이지로 중복 분류되어 버린 분기나 원문 코드가 각본에 섞이던 collector 결함도 수정했다. 실제 동적식은 코드 없는 메타 안내로 남긴다.
- 경로 요약과 출력 버튼을 장면 위의 실제 HTML로 옮겼다. 이전 도우미는 접힌 도구에 남기고 고정한 현재 단계의 대안도 접어서 유지한다. CSS로 기존 인터페이스를 가린 변경이 아니다.

## 구조·입출력·유지보수

| 함수/경로 | 입력과 반환 | 호출·부작용 |
| --- | --- | --- |
| script-range.js mark(role) | 현재 context의 point를 boundary로 검증해 start/end 저장 | 카드·추가 도우미. sessionStorage의 jo9-script-range만 변경 |
| pick(entry,sceneId) | 대사를 열고 검증된 selected.at/실제 엔트리 키를 choices·pins에 누적 | 각본 모드 routeCard. 다음 후보는 기존 renderFlow가 표시 |
| follow(fromContext,toContext) | boundary의 유일한 routeChoice를 choices·routes에 저장 | openScene. QSP 실행 상태는 변경하지 않음 |
| boundary({point,fromPoint?}) | 검증된 selected와 제안 경계; 유일한 직접 목적지에 routeChoice 추가 | 기존 endpoint 유지. 동적 조건 추정·실행 없음 |
| /api/script/range | start/end/choices → ready text/stats/map 또는 미선택 분기 | 기존 exporter/importer·저장 경로와 호환 |
| rangeRoles | start/end/pins와 현재 실제 사용 장면 → 표시 역할 | 고정 표식. 제거하면 고정 상태 표시가 사라짐 |

새 라이브러리·게임 변수·세이브 형식을 추가하지 않았다. 기존 core/scenes, boundary/range, sessionStorage, importer.source를 재사용한다. 선택 키는 표시 단계 번호가 아니라 검증된 unit 위치와 실제 사용 장면을 쓴다. UI 또는 backend만 되돌리면 선택 키·고정 표시·출력이 어긋날 수 있으므로 before의 관련 코드를 함께 대조한다.

## 검증·설치·복구

기존 결함은 새 UI 회귀가 실패하는 것으로 먼저 재현했다. 실제 core/scenes를 사용하는 UI 행동 검사, backend 경로 계약, 기존 출력·저장·수정 각본·공유 흐름 검사와 격리 브라우저에서 확인했다. 최종 수치·설치 해시는 verification.json 및 regression.log를 따른다.

격리 브라우저에서 3단계 시작→조건 A/B→6단계 끝의 4대사 TXT, 두 장면을 잇는 7대사 TXT, 새로고침/탭 왕복과 원문 코드·버린 변형 제외를 확인했다. 시험 대사만 사용하며 실제 게임 QSP·세이브에는 반영하지 않았다. WORK 편집실 코드를 설치한 뒤 현재 탭의 기존 입력 보존도 확인한다.

기본 저장 폴더: G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/runtime/script-exports/. 저장 후 전체 경로와 같은 내용의 미리보기가 나온다.

before/source와 before/installed는 수정 전 관련 코드다. 원래 파일과 다르면 후속 변경을 대조하고 복원한다. 시험 QSP·시험 서버·중복 시험 출력은 검증 뒤 정리하고 핵심 재현 코드·검사 결과·예시 TXT·스크린샷을 남긴다.

게임 QSP·PNG·JSON·세이브·Full·음원과 일정/체크 상태는 변경하지 않는다. 커밋·푸시·배포도 하지 않는다. 사운드 MP3→WAV 제안은 사용자 지시로 이 도구 작업을 우선하며 이번에 수행하지 않았다.

## 최종 확인 결과

- 관련 검사 57개 통과, 실패 0개. WORK 설치 파일 8개는 소스와 바이트 단위로 일치한다.
- QSP·글로리아 JSON·체크 기록·패치 일정 4개 해시가 설치 전과 같다.
- 브라우저에서 1장면 4대사 / 2장면 7대사 저장, 탭 왕복·새로고침 복원을 확인했다. 보존 예시 TXT는 같은 중립 시험 QSP를 재생성하여 동일 range/save backend로 다시 저장한 결과다.
- 현재 WORK 탭을 최종 새로고침하여 새 스타일 로드와 기존 입력 5개 보존을 확인했다.
- 재현: node records/script-route-lock-20261110/reproduce-samples.cjs, 이후 node records/script-route-lock-20261110/verify-install.cjs. 검증기는 fixture 정리 후에도 보존 예시를 읽어 재실행할 수 있다.
