# 통합 모드 작업실 직접 실행 — 2026-11-17

## 결과

옛 index.html과 app.mjs를 먼저 실행한 뒤 통합 메뉴를 붙이는 시작 구조를 제거했다. 최초 HTTP 문서부터 통합 제목·메뉴·공통 CSS를 갖는 workspace.html이며 workspace-app.mjs가 직접 시작한다. 폐기된 v0.11 시뮬레이터·산식·보관함·규칙·JSON·특성선택 패널은 생성하지 않는다. CSS로 가려 두는 방식이 아니다.

현재 해시 화면만 최초 초기화하고 다른 화면은 처음 선택할 때 기능 모듈을 생성한다. 이미 연 화면은 재사용한다. 산식으로 직접 열었을 때 coef1개만 존재하고 studio/character/backgrounds는0개임을 실제 브라우저에서 확인했다.

클로드 원본 dist와 backend API는 보존하고 기능 모듈·데이터를 재사용한다. 통합화면의 새로운 시작 코드가 직접 호출하므로 옛 app의 계산·렌더·메뉴 생성·삭제·해시 복구는 실행되지 않는다. 독립 대사/이미지/게임DB의 기존 도구 프레임과 이미지 하위 탭 구성은 유지한다.

## 구성·입출력

- workspace.html: 통합 shell. 공통 styles.css와 integration.css를 head에서 로드한다. 화면 생성자들이 기대하는 nav·헤더·footer 삽입 기준·toast·확인 대화상자를 유지한다.
- workspace-menu.json: 통합 메뉴의 한곳짜리 원장. 서버가 첫 HTML에 메뉴와 JSON을 함께 넣고 integration이 같은 데이터를 사용한다.
- workspace-app.mjs: 기존 freshState/validateState와 같은 jo9-history-lab-v1을 읽는다. getState closure와 기존 전체 설정 가져오기·내보내기를 유지한다. renderAll/현재 charView/저장/다운로드/확정 보관 API를 기능 모듈에 제공한다.
- workspace-router.mjs: 화면당 생성 Promise 하나를 유지한다. 최신 전환만 표시하고 실패는 재시도할 수 있다. 과거 메뉴 북마크는 현재 메뉴로 연결한다.
- integration.mjs: 통합 메뉴·프레임·산출물을 연결한다. 원본 master 화면을 여기서 미리 부팅하지 않고 새 라우터가 필요할 때 준비한다. 비동기 질문 이동은 라우터의 최신 선택 판정을 따른다.
- workbench overlay: backgrounds만 등록·렌더한다. 배경 문구·연결·CSV·사용자 조건은 같은 기능이다. 초기 생성 뒤 render를 명시적으로 한 번 호출한다.
- 8개 createView: workspace API일 때 원래 nav를 삽입하지 않는다. 기능과 자체 패널은 그대로 생성한다.
- server.py: root를 통합 build 주소로 연결하고 새 HTML·시작 코드·모듈을 제공한다. app.mjs의 옛 주소도 새 시작 코드 별칭이며 원본 app이 fallback으로 나오지 않는다.

입력은 최초 해시·기존 저장 설정·메뉴 선택이다. 출력은 해당 화면과 원래 도구의 저장/다운로드 결과다. 로딩만으로 게임 QSP나 캐릭터 데이터를 저장하지 않는다. 새 저장키·필드는0개이며 jo9-history-lab-v1, jo9-character-v1, jo9-past-history-formula-v1, jo9-trait-edits-v1, jo9-runtime-context-v1을 유지한다. 모든 기능 모듈은 같은 버전 URL로 import되어 질문지·계수·런타임 계산의 ES-module singleton을 공유한다.

노예/마스터 편집은 charView 의존성을 먼저 준비한다. 아직 열지 않은 대상 역할의 복제 이벤트는 준비 후 전달한다. 일반 대사 DB의 시뮬레이터 사용도 해당 화면을 준비한 뒤 적용한다. 배경 기본 연결 함수는 UI를 만들지 않고 필요한 계산 준비에만 사용하며, 일시적 실패는 실패 Promise를 비워 재시도한다.

기존 포트·원본 backend·WebView2 .app-data와 private_mode=False는 유지했다. URL의 버전 경로가 달라져도 같은 Origin의 브라우저 저장소를 사용한다. 다른 탭의 저장 전 편집 내용은 강제로 새로고침하지 않았다.

## 검사

- 변경 전 옛 HTML/원본 app 합성 검사2건 실패를 재현했다.
- 직접 진입2·라우터5·bootstrap3의10개 회귀 검사 통과. 빠른 전환·중복 생성 방지·실패 재시도·기존 북마크·배경 첫 렌더 포함.
- JavaScript/Python/JSON/PowerShell 문법 검사 통과.
- 격리 HTTP 서버에서 root·버전 index·새 entry·옛 app 별칭·9개 모듈 경로를 검사하고 종료했다.
- 실제 브라우저 첫 프레임은 통합 제목과 요청 화면의 로딩만 표시했다. 옛 화면 ID6개는0, 현재 로드된 DOM의 중복 ID는0이었다.
- 실제 화면: 산식·계수, 노예1884명 목록, 남녀 마스터42명 목록, 배경14998개 조합, 공유 캐릭터01/02정보와 성경험 질문지 JSON 버튼, 일정50/50개 로드를 확인했다. 실제 저장/이미지 교체/게임 적용 버튼은 누르지 않았다.
- 실제 최종 build: e5e522126a2afc79. 현재 우측 창은 새 버전 경로의 산식·계수 화면이다. seed_age0~99 설명도 유지한다.
- 게임 QSP·일정 데이터의 전후 해시가 같다. Full·기존 배포 ZIP·커밋·푸시는 변경하지 않았다.

## 복구와 확인 한계

change-manifest.json의 before/after와 before/*.gz를 사용한다. 기존 수동 변경이 뒤에 추가될 수 있으므로 파일 전체를 무조건 덮어쓰지 않는다. 새 HTML/entry/router/menu를 제거할 때 server와 build 등록·integration·view guard도 함께 복구해야 한다. 생성 API와 DOM shell 계약을 깨면 해당 화면이 초기화되지 않으므로 개별 파일만 제거하지 않는다.

라우터 단위 검사는 router.test.mjs, 첫 진입은 direct-entry.test.cjs, 재시도/배경 첫 렌더는 bootstrap.test.cjs, HTTP는 http-test.py로 재현한다. 현재 소스가 대상이며 후보 디렉터리의 중복 사본은 정리했다. 게임 전체 플레이·모든 편집 저장 경로를 다시 검사한 것은 아니다.
