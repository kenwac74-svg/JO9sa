# Scene 이미지 등장·재현 조건

현재 WORK scene 폴더를 읽어 이미지 체크리스트의 각 카드에 요약과 펼침 상세를 삽입한다. 게임 QSP/이미지/세이브/체크 상태는 쓰지 않는다. build 함수는 정적 입력을 받고 경로별 조건 메타데이터를 반환한다. generate는 현재 QSP, runtime JSON, CSS, 실제 씬 목록을 읽고 후보 HTML과 JSON을 만든다. install은 전후 해시·JS문법·기존 목록 보존·전파일 포함을 검사한 후보만 WORK/seed에 적용하고 원본 HTML gzip 복구본을 남긴다.

표시는 직접 연결, 명시적 난수/번호 선택, 동적 후보, 정의부, 수동 전환 컷, 실행 연결 미확인을 구분한다. 메뉴 가용 조건, 이벤트 내부 조건, 페이지 슬롯, 상위 이벤트 번호 지정 지점과 코드 위치를 볼 수 있다. 조건은 실시간 세이브값이 아니며 그림 내용으로 조건을 추측하지 않는다.

재분석: node tools/scene-image-conditions/generate.cjs --game "<WORK/game>" --repo "<JO9sa>" --out "G:/Codex/tmp/<새 작업명>". 후보 생성 후 generation.json을 검토해 설치한다. 설치 스크립트는 실행 파일과 생성 명세를 같은 폴더에서 읽으므로 generation.json과 함께 실행해야 한다. 기존 날짜 백업이 있으면 덮어쓰지 않고 중단한다.

의존: tools/text-workshop/core.cjs의 QSP/문자열 코덱, scenes.cjs의 주석·분기 분석. 브라우저는 기존 rowHtml과 JO9_CATALOG_BRIDGE, 선택적으로 /api/state를 사용한다. 표시 모듈을 빼면 조건 표시만 사라지며 게임 동작은 바뀌지 않는다. 새 서버 API나 서버 재시작은 없다. QSP 해시가 달라지면 화면에 오래된 분석임을 알린다.

한계: 상위 진행은 이벤트 번호를 지정하는 소스 근거이고, 이후 덮어쓰기·동적 호출·저장 상태를 완전히 실행해 검증한 재현 경로가 아니다. 현재 연결을 못 찾았다고 미사용/삭제 가능으로 단정하지 않는다. 단독 번호명에 근거해 형제 파일을 자동 연결하지 않는다. 카탈로그 밖 게임 참조 경로는 metadata.json의 unresolved에 별도로 남긴다.

## 2026-11-08 처리 주석

카드의 권장 처리·이유·다음 할 일·삭제 판정은 review-notes.json에서 읽는다. 위쪽 처리 주석 목록을 펼쳐 권고 종류별로 찾고 파일명을 누르면 기존 ?image= 경로로 해당 카드에 이동한다.
review-notes.cjs는 경로 중복·허용 조치·필수 문구를 검사하고 현재 분석 메타데이터에 주석을 붙인다. generate.cjs가 매번 읽기 때문에 재분석해도 주석을 잃지 않는다. QSP 또는 해당 이미지 해시가 조사 때와 달라지면 이전 권고를 접고 조치 재확인을 먼저 표시한다.
각 항목의 path/action/label/reason/nextStep/deleteDecision/evidence/imageSha256와 문서의 qspSha256가 입력이다. 출력은 기존 카드와 처리 목록의 안내 HTML이다. 체크 상태, 게임 QSP, 이미지 파일은 변경하지 않는다. 모듈과 호출을 제거하면 처리 주석만 사라진다.
action-notes.test.cjs와 review-notes.test.cjs는 안내 표시·이스케이프·완료 항목·목록 바로가기·재생성 보존·오래된 권고 표시·중복 자료 거부를 검사한다. 기존 analyse/catalog 검사와 합계 20개다.
