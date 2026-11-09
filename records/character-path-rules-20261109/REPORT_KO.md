# 캐릭터 이미지 폴더 규칙·경고 (2026-11-09)

## 사용자 확정과 결과

전용 번호 폴더가 있는 캐릭터는 전신·초상·장면 각각의 번호 폴더 아래에 모든 해당 이미지를 둔다. 종류별 폴더를 유지하며 초상·장면을 전신 폴더 하나로 모으지 않는다. 전용 폴더가 없으면 옷 입은 기본 타이틀은 기존 characters/, 알몸은 girls/full/ 바로 아래, 역할 복장은 하녀 cloth/maid·비서 secretary·도미나 mistress 하위폴더를 사용한다. 하녀는 기존 두 역할 폴더를 모두 인정한다. 파일명은 검사하지 않는다. 정의는 ../../docs/modding/IMAGE_NAMING_RULES_KO.md와 AGENTS.md32번에 기록했다.

카드의 경로 규칙 경고 건수/상세와 각 이미지 칸·전체 등록·행동 목록·파일 선택 창에서 현재 경로와 권장 폴더를 표시한다. 공용 타이틀도 경고를 생략하지 않는다. 경고는 저장을 막지 않는다. 기존 검색 버튼·태그·PNG 교체·수동 연결·펠라게야 공유·옷 입은 모습/알몸 분리 기능을 유지했다. WORK 통합 리스트·seed·독립 HTML에 반영했으며 독립 HTML의 기존 접힘 구조도 유지했다.

## 구현·입출력·연결

catalog-girls-checklist.js의 CHECKLIST_PATH_RULES_20261109 블록이 기존 파일명까지 강제하던 rulePath를 대체한다. hasDedicatedFolder(character)는 실시간 dedicatedImageFolders가 있으면 그것을 사용하고, 오프라인에서는 기존 디렉터리/파일 목록에서 정확한 번호 폴더를 찾는다. pathRule(character,path,field)는 어긋날 때 {field,path,expected,kind,dedicated}, 정상 또는 미지정 종류는 null을 반환한다. Windows 슬래시·content/pic 접두어·대소문자를 정규화한다. pathWarnings는 현재 참조와 전용 캐릭터 실제 이미지 목록을 모으고 중복 경고와 별도 보존 호환 사본을 제외한다. 실제 참조가 옛 호환 경로인 경우는 경고가 남는다.

ruleNote는 칸/행/선택 창, pathWarningBox는 카드 상세에서 쓴다. checklist-link-picker.js는 현재 등록 및 새 선택의 경고를 보여 주고 기존 API로 그대로 저장한다. 이미지나 JSON 이동 코드는 추가하지 않았다. character-image-links.cjs의 snapshot이 실제 girls/full,face,sex_scenes 번호 폴더를 읽어 dedicatedImageFolders 배열을 추가한다. 비어 있는 폴더도 인식하며 외부 경로를 전용 폴더로 사용하지 않는다. 기존 응답 필드와 apply의 이미지 공유·백업·원자적 저장은 유지한다. 게임 상태·세이브 형식 의존성은 없다.

## 검사·설치

node --test tools/girls-image-checklist/path-rules.test.cjs tools/girls-image-checklist/checklist-link-picker.test.cjs tools/girls-image-checklist/checklist-role-status.test.cjs tools/text-workshop/character-image-links.test.cjs tools/text-workshop/character-image-links-api.test.cjs tools/text-workshop/pelageya-group.test.cjs:24통과. 새 경로 검사6개와 실제 빈 폴더 검사1개가 구현 전 실패하는 것을 확인했다.

browser-check.cjs: 합성 그림·격리 저장기로6개 확인(공용 타이틀 경고, 경고 상태 저장 가능, 정상 폴더 선택 시 경고 해소, 검색 버튼, 전용 초상 경로, JS 오류 없음), fixture 저장2회. 실제 게임 이미지를 테스트용으로 덮어쓰지 않았다. warnings-fixture.png는 합성 화면이다.

verify-install.cjs: 현재 서버3813의 /catalog-tab/girls 지연 로딩 응답에서 새 코드 확인, 실시간 전용 폴더 메타데이터와 소스/설치 모듈 일치. seed·WORK·독립 HTML의 모든 인라인 스크립트 구문 확인. 설치 전후 WORK QSP·선별 JSON5개·체크 상태7개와 별도 진행 중인 소스 QSP/원장2개 해시 보존. 임시 설치 파일0개. 검사 시1031은 규칙 밖 연결10건이 있었고 자동 수정하지 않았다. 샘플1448/2341/2577은0건이었다. 자세한 근거는 verification.json과 install.json.

실제 서버를 기존 게임/카탈로그/원본 인수 그대로 재시작했다. 열려 있던 브라우저는 새로고침하면 새 경고가 나온다. 게임 EXE의 화면 검사는 이번 도구 변경 범위가 아니며 수행하지 않았다.

## 보존·복구·Claude 인계

이번 작업은 파일 이동·게임 PNG/JSON/QSP 수정·음원 변경·Full 동기화·배포·푸시를 하지 않는다. 사용자는 완료 뒤 로컬 커밋을 지시했다. 작업 시작 때 이미 수정돼 있던 assets/runtime/2.4.1/jack.qsp와 assets/runtime-source-2.4.1.json은 이번 커밋 대상에서 제외한다. 개인 설정과 이전 작업의 미추적 복구 자료도 보존한다.

로컬 커밋 이후 Claude는 AGENTS.md32번과 최신 규칙 문서를 먼저 읽으면 된다. 설치 원본 해시와 적용 목록은 install.json, 기존 WORK의 고유 HTML 복구 자료는 before/<이전해시>.gz에 로컬 보존한다. Git에는 임시 복구 사본을 추가하지 않는다. install.cjs는6729ef9 기준을 확인하고 다르면 덮어쓰지 않는 이번 설치의 재현 자료다. 되돌릴 때는 후속 수정 여부부터 확인하고 해당 JS 블록·모듈을 함께 복원한다. 경고 기능을 제거해도 실제 이미지 등록은 바뀌지 않는다.
