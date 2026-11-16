# 모드툴·편집기·DB·일정표 독립 감사

감사 시각: 2026-11-13T05:48:26.139Z. 코드·리소스·WORK·Full·개인SAV·음원·커밋/푸시는 수정하지 않았다.

기존 도구69행과 교차영역/후속24항목, 48개 기록폴더의 파일명 866개 및 공개기준 이후 19커밋을 추적했다. 이 수치는 신규기능 수가 아니다.

## 누락·불완전 설명

- **F01 H152~154 원래DB도입/조건설명/읽기서버·ZIP 이력이 currentResult에서 빠짐** — originalRow.before/after를 보존하고 마법·개인아이디어확장은 별도후속으로 연결.
- **F02 H159의 구현된 고유캐릭터복제가 그룹보류설명에 가려짐** — 새ID·원본불변·공유/개별슬롯분리 구현을 복원하고 D19그룹확장만 보류.
- **F03 최초128/271/70+기획1과 현재129/272/74+기획0 혼동** — 역사수치와현재행수를 계층화.
- **F04 소스DB최신HTML과WORK설치HTML 불일치** — 11/13소스만의 승인설명을 보존하며 설치/원장 최신화여부를 후속대조.
- **F05 실행기 전체검사실패·TIME_WAIT PID0 한계누락** — 11/8개별수정과11/10~11잔여한계를 분리.
- **F06 사운드자동열기 옛설명과11/11최신결정 충돌** — 현재는경로출력만·자동파일열기제외.
- **F07 CSS설치/새경로원천이관/DB부분갱신 구체설명부족** — T074/T076/T082~T088 before/after 반영.
- **F08 H165~168 미커밋표시는 당시이력** — 관련파일545f8d1d 포함을 현재상태로 별도연결.

- **F09 H293/H294의 [object Object] 설명 손상** — 실제도구로그 line21/37의 파일경로·슬롯변환·이미지JSON변경을 T092/T093으로 복원했다. 현재파일최종상태는 부모Girls감사와 대조한다.

## 현재 파일 대조

- text-workshop 공통 비교56개, 캐릭터추가기 공통9개, 이미지워크숍 HTML과 카탈로그 생성JS는 source/설치본이 일치했다.
- DB 소스HTML: 441959 B / 59250736a5f181176914154700d11cd3d4198d247fe1fe6c268d6e110c22f529.
- DB WORK HTML: 414625 B / da7e42b3759b32f0a822c3f22dd6db3a124e48c9b1cfffaa4153043e60cc7856.
- 두 HTML은 특성129·아이템272·마법11·적/MOB74·기획0으로 행수는 같지만 활동특성4설명과 춘향 최신규칙·정적감사경고 표시가 다르다. 아이템/마법 섹션은 동일하다.
- snapshot.files 중 현재소스와 다른 항목은 3개다. 설치/원장은 이번 감사에서 바꾸지 않았다.
- 소스만 최신인 DB를 WORK기준으로 역덮기하지 않고 Q05 설치/동봉버전 확인 대상으로 남긴다.
- game-reference의 생성기/JSON/UI원천은 완성HTML에 내장되므로 개별 미설치만으로 실행누락이라 판정하지 않는다.

## 기능별 before / after

| 감사ID·기존행 | 기능 | 이전 | 이후·현재 결과 | 상태·누락 보완 | 검증한계·근거 |
|---|---|---|---|---|---|
| T001<br>H100 | 다음 패치 50항목 일정판 | 정적 체크리스트 중심 | 완료·보류·재파악·폐기·진행중 상태, 완료 취소, 차수·날짜·메모·검색·필터를 지원한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/patch-schedule-20261107/MANUAL_KO.md](<G:/somi/JO9sa/records/patch-schedule-20261107/MANUAL_KO.md>)<br>[tools/text-workshop/patch-schedule.cjs](<G:/somi/JO9sa/tools/text-workshop/patch-schedule.cjs>)<br>[tools/text-workshop/patch-schedule-data.cjs](<G:/somi/JO9sa/tools/text-workshop/patch-schedule-data.cjs>) |
| T002<br>H101 | 일정 공통 저장·충돌 방어·PC 이전 | 다른 창/PC의 상태 보존 경로 없음 | CatalogDir/patch-schedule.json을 revision으로 검사해 원자 저장하며 JSON 가져오기/내보내기와 현재 상태를 넣은 독립 HTML을 제공한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/patch-schedule-20261107/MANUAL_KO.md](<G:/somi/JO9sa/records/patch-schedule-20261107/MANUAL_KO.md>)<br>[tools/text-workshop/patch-schedule.test.cjs](<G:/somi/JO9sa/tools/text-workshop/patch-schedule.test.cjs>)<br>[tools/local-workspace/Build-Patch-Schedule.cjs](<G:/somi/JO9sa/tools/local-workspace/Build-Patch-Schedule.cjs>) |
| T003<br>H102 | 통합 실행과 편집기 실행에 일정판 포함 | 편집기·체크리스트 등만 자동 열림 | 실제 편집기 주소의 /patch-schedule을 자동 열고 PatchSchedule 주소를 출력한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[tools/local-workspace/Open-Modding-Tools.ps1](<G:/somi/JO9sa/tools/local-workspace/Open-Modding-Tools.ps1>)<br>[tools/local-workspace/Start-JO9-Tools.ps1](<G:/somi/JO9sa/tools/local-workspace/Start-JO9-Tools.ps1>)<br>[records/patch-schedule-20261107/MANUAL_KO.md](<G:/somi/JO9sa/records/patch-schedule-20261107/MANUAL_KO.md>) |
| T004<br>H103 | 패치 일정 공통 기획 아이디어 노트 | 작업별 메모만 존재 | 최대 20,000자 ideaNotes와 명시적 저장 버튼을 추가하고 JSON·독립 HTML·로컬 저장에 포함한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/schedule-ideas-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/schedule-ideas-20261108/REPORT_KO.md>)<br>[tools/text-workshop/patch-schedule.cjs](<G:/somi/JO9sa/tools/text-workshop/patch-schedule.cjs>)<br>[tools/text-workshop/schedule-ideas.test.cjs](<G:/somi/JO9sa/tools/text-workshop/schedule-ideas.test.cjs>) |
| T005<br>H104 | 오프라인 모딩 작업실 HTML | 프로젝트 근거와 승인·인계가 여러 기록에 분산 | 본체·사양·이미지·QSP/Git/mods/해시/DryRun·역할·결정·검증 게이트·개별 승인·전후 변경 이력을 단일 HTML에서 관리한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/modding-workbench-20261108/README_KO.md](<G:/somi/JO9sa/records/modding-workbench-20261108/README_KO.md>)<br>[records/modding-workbench-20261108/JO9_Modding_Workbench.html](<G:/somi/JO9sa/records/modding-workbench-20261108/JO9_Modding_Workbench.html>) |
| T006<br>H105 | 오프라인 작업실 백업·연결 검사·인계 출력 | 단일 관리 화면의 검증/복원 경로 없음 | 초안 자동저장, JSON/자체 HTML 백업, 파일 해시·규격·decode·전후 비교, JSON 중복 키/ID/이미지 참조 검사, Markdown 인계와 수집기 근거 등록을 지원한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/modding-workbench-20261108/README_KO.md](<G:/somi/JO9sa/records/modding-workbench-20261108/README_KO.md>) |
| T007<br>H106 | 흐름 전체 각본 내보내기 | 컷/문자열 단위 편집 중심 | 장면·페이지·조건 대체문·장면 문구·선택지·다음 장면을 ID 있는 각본 TXT로 출력한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[tools/text-workshop/script-export.cjs](<G:/somi/JO9sa/tools/text-workshop/script-export.cjs>)<br>[tools/text-workshop/script-export.js](<G:/somi/JO9sa/tools/text-workshop/script-export.js>) |
| T008<br>H107 | 각색본 번호별 일괄 가져오기·반영 | 각본과 원문 위치를 일괄 대응하는 흐름 없음 | 반환 각본을 페이지 ID로 원문에 짝지어 미리보기·일부 제외·승인·기존 백업/최소 mods/되돌리기와 함께 반영한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[tools/text-workshop/script-import.cjs](<G:/somi/JO9sa/tools/text-workshop/script-import.cjs>)<br>[tools/text-workshop/script-export.test.cjs](<G:/somi/JO9sa/tools/text-workshop/script-export.test.cjs>) |
| T009<br>H108 | 시작·마무리 대사로 선택 구간 각본 | 이벤트 전체 출력 중심 | 11/8 양끝 지정 구간출력에 이어 11/10 시작 즉시고정·탐색분기누적·장면간경로고정·끝지정/탭왕복/새로고침 보존으로 보완. QSP 변경은 고정을 지우지 않고 stale로 출력만 잠근다. | 11/10 후속구현 기록 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/dialogue-range-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/dialogue-range-20261108/REPORT_KO.md>)<br>[tools/text-workshop/script-range.cjs](<G:/somi/JO9sa/tools/text-workshop/script-range.cjs>)<br>[tools/text-workshop/script-range.js](<G:/somi/JO9sa/tools/text-workshop/script-range.js>)<br>[records/script-route-lock-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/script-route-lock-20261110/REPORT_KO.md>)<br>[records/script-route-lock-20261110/verification.json](<G:/somi/JO9sa/records/script-route-lock-20261110/verification.json>) |
| T010<br>H109 | 구간 경계 제안·미해결 연결·선택 전환 방어 | 중간 시작/끝 또는 미완성 경로의 오인 가능 | 초기 경계후보 제안·미해결연결·전환중잠금은 이력으로 보존한다. 최신 시작은 클릭 즉시 고정하며 QSP 변경은 stale 안내와 출력잠금으로 처리한다. | 초기기능·후속대체 구분<br>보완: 초기 안내문과 최신 즉시고정을 같은 시점 기능으로 섞지 않는다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/dialogue-range-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/dialogue-range-20261108/REPORT_KO.md>)<br>[tools/text-workshop/script-range.test.cjs](<G:/somi/JO9sa/tools/text-workshop/script-range.test.cjs>)<br>[records/script-route-lock-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/script-route-lock-20261110/REPORT_KO.md>) |
| T011<br>H110 | 정적 HTML 탭·패널과 단일 스타일시트 | 기능 JS가 UI/style 삽입, CSS로 기존 화면 덮어 숨김 | index.html이 각본·수정·공유 검색·고급·저널·AI를 선언하고 workshop-ui.js가 실제 hidden 상태, workshop.css가 스타일을 소유한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-native-layout-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-native-layout-20261108/REPORT_KO.md>)<br>[tools/text-workshop/index.html](<G:/somi/JO9sa/tools/text-workshop/index.html>)<br>[tools/text-workshop/workshop-ui.js](<G:/somi/JO9sa/tools/text-workshop/workshop-ui.js>)<br>[tools/text-workshop/workshop.css](<G:/somi/JO9sa/tools/text-workshop/workshop.css>) |
| T012<br>H111 | AI 도크를 본문과 분리된 Grid 행으로 배치 | 고정 overlay·본문 아래 padding 보정 | AI가 실제 두 번째 행으로 배치되며 접기·높이 조절·기억, 초안·요청·응답 상태를 보존한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-native-layout-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-native-layout-20261108/REPORT_KO.md>)<br>[tools/text-workshop/dialogue-ai.js](<G:/somi/JO9sa/tools/text-workshop/dialogue-ai.js>)<br>[tools/text-workshop/workshop-ui.js](<G:/somi/JO9sa/tools/text-workshop/workshop-ui.js>) |
| T013<br>H112 | 선택 전달 콜백 충돌 제거 | 여러 모듈이 하나의 전역 선택 콜백을 덮음 | jo9:selection 이벤트를 각본·구간·변수 검사 모듈이 독립 구독하고 저널 UI도 정적 노드를 재사용한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-native-layout-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-native-layout-20261108/REPORT_KO.md>)<br>[tools/text-workshop/variable-inspector.js](<G:/somi/JO9sa/tools/text-workshop/variable-inspector.js>)<br>[tools/text-workshop/journal-keywords-ui.js](<G:/somi/JO9sa/tools/text-workshop/journal-keywords-ui.js>) |
| T014<br>H113 | 각본 탭에 그림·현재/다음·전체 흐름 복구 | 초기 탭 정리에서 navigation/그림이 수정 탭에만 남음 | 공유 navigation을 수정 패널 밖으로 옮겨 두 탭에서 현재/다음·그림·분기·전체 흐름을 확인한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-flow-restore-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-flow-restore-20261108/REPORT_KO.md>)<br>[tools/text-workshop/workshop-shared-flow.test.cjs](<G:/somi/JO9sa/tools/text-workshop/workshop-shared-flow.test.cjs>) |
| T015<br>H114 | 카드별 구간 시작/끝·표식·단계 이동 | 별도 선택 영역을 왕복해 구간 지정 | 카드에서 선택한 시작·분기·마무리가 실제 각본 경로로 누적된다. 앞 분기를 바꾸면 뒤 경로/끝만 정리한다. | 도구 후속 반영 완료 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-flow-restore-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-flow-restore-20261108/REPORT_KO.md>)<br>[tools/text-workshop/script-range.js](<G:/somi/JO9sa/tools/text-workshop/script-range.js>)<br>[records/script-route-lock-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/script-route-lock-20261110/REPORT_KO.md>)<br>[records/script-route-lock-20261110/verification.json](<G:/somi/JO9sa/records/script-route-lock-20261110/verification.json>) |
| T016<br>H115 | 저장 없이 각본 미리보기 생성 | 저장 성공 뒤에만 빈 접이식 미리보기가 채워짐 | 독립 미리보기가 같은 경로 탐색/분기 선택으로 본문을 생성하고 파일 쓰기 없이 보여 준다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-range-output-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-range-output-20261108/REPORT_KO.md>)<br>[tools/text-workshop/range-output.cjs](<G:/somi/JO9sa/tools/text-workshop/range-output.cjs>) |
| T017<br>H116 | 각본 실제 파일 저장·경로·새로고침 복원 | 브라우저 다운로드 요청만 하며 저장 완료/경로 확인 못함 | runtime/script-exports에 UTF-8 BOM/CRLF 고유TXT를 실제 저장하고 전체경로·동일본문 미리보기·재개방 복원을 제공한다. 11/10 QSP변경은 고정삭제 대신 stale 상태로 출력만 잠근다. | 실제저장·후속 stale보존 구현<br>보완: 초기 QSP변경시 구간해제는 11/10에 대체됐다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-range-output-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-range-output-20261108/REPORT_KO.md>)<br>[tools/text-workshop/range-output.test.cjs](<G:/somi/JO9sa/tools/text-workshop/range-output.test.cjs>)<br>[tools/text-workshop/server.cjs](<G:/somi/JO9sa/tools/text-workshop/server.cjs>)<br>[records/script-route-lock-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/script-route-lock-20261110/REPORT_KO.md>) |
| T018<br>H117 | 각본 탭에서 수정본 TXT 검토·반영 | import UI가 수정 탭의 접힌 고급 메뉴 안에 있음 | 접힌 가져오기 UI를 각본탭의 원본/수정TXT·ID·검토·비교·확인·반영 흐름으로 옮겼다. 11/10 직접편집 후 반영행에 수정문재검토 버튼과 잠긴 이유를 표시하며 제외선택을 유지한다. | 후속 재검토안내 구현 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/script-review-ui-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/script-review-ui-20261108/REPORT_KO.md>)<br>[tools/text-workshop/script-import-ui.js](<G:/somi/JO9sa/tools/text-workshop/script-import-ui.js>)<br>[tools/text-workshop/script-review.js](<G:/somi/JO9sa/tools/text-workshop/script-review.js>)<br>[records/script-recheck-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/script-recheck-20261110/REPORT_KO.md>)<br>[records/script-recheck-20261110/verification.json](<G:/somi/JO9sa/records/script-recheck-20261110/verification.json>) |
| T019<br>H118 | 각본 ID·변수·구분선 검사 및 명시적 원문 재대조 | 구 QSP 각본은 해시 불일치로 거부 | 기본 거부 유지하되 사용자가 켠 재대조에서 같은 위치/종류/완전 동일 원문이 유일한 경우만 연결한다. 변수 누락·추가와 0/중복/누락/없는 페이지를 차단한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/script-review-ui-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/script-review-ui-20261108/REPORT_KO.md>)<br>[tools/text-workshop/script-import.cjs](<G:/somi/JO9sa/tools/text-workshop/script-import.cjs>)<br>[tools/text-workshop/script-review.test.cjs](<G:/somi/JO9sa/tools/text-workshop/script-review.test.cjs>) |
| T020<br>H119 | 브라우저 줄바꿈·넘침 검토와 승인 무효화 | 텍스트 분량과 화면 설정 변화의 연결 부족 | 사용자치수 넘침검토에 이어 WORK config/CSS/폰트/UI를 읽는 실제캔버스 프로필을 제공한다. 당시1280×800·일반740×185·종이770×575이며 현재CSS 변경은 재읽기 대상이다. | 실제 UI크기 참고 미리보기 구현<br>보완: QtWebKit/실제변수값/특수장면의 최종화면 확인은 별도다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/script-review-ui-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/script-review-ui-20261108/REPORT_KO.md>)<br>[tools/text-workshop/script-review.js](<G:/somi/JO9sa/tools/text-workshop/script-review.js>)<br>[records/script-game-layout-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/script-game-layout-20261110/REPORT_KO.md>)<br>[records/script-game-layout-20261110/verification.json](<G:/somi/JO9sa/records/script-game-layout-20261110/verification.json>) |
| T021<br>H120 | 비교 카드 오른쪽 수정문 직접 편집 | 수정문이 일반 div여서 비교 중 수정 불가 | textarea 편집이 해당 페이지 본문만 전체 각본/세션 초안에 동기화하며 카드·제외 선택을 유지한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/script-inline-edit-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/script-inline-edit-20261108/REPORT_KO.md>)<br>[tools/text-workshop/inline-script-edit.test.cjs](<G:/somi/JO9sa/tools/text-workshop/inline-script-edit.test.cjs>)<br>[tools/text-workshop/script-review.js](<G:/somi/JO9sa/tools/text-workshop/script-review.js>) |
| T022<br>H121 | WORK에서 빠진 노예 전용 보기 복구 | 소스 seed에는 있으나 WORK HTML에 노예 블록 누락 | 설치본의 수동 데이터와 다른 영역을 보존하며 노예 보기와 기본 전체 캐릭터 필터를 복구한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-ui-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-ui-20261108/REPORT_KO.md>)<br>[tools/girls-image-checklist/catalog-girls-checklist.js](<G:/somi/JO9sa/tools/girls-image-checklist/catalog-girls-checklist.js>) |
| T023<br>H122 | 5개 영역의 명시적 탭과 버튼 검색 | 펼침 목록 중심, 입력 즉시 검색 | 전체 이미지·노예 이미지·추가팩·전투 MOB·처리 주석 5탭과 버튼으로 확정하는 검색을 제공한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-ui-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-ui-20261108/REPORT_KO.md>)<br>[records/catalog-native-tabs-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-native-tabs-20261108/REPORT_KO.md>)<br>[tools/local-workspace/catalog-seed/catalog_workshop.js](<G:/somi/JO9sa/tools/local-workspace/catalog-seed/catalog_workshop.js>) |
| T024<br>H123 | 탭별 지연 로딩과 상태·요청 경쟁 보존 | load 뒤 DOM 이동/CSS summary 강제 숨김, 13.2MB 초기 원천 HTML | 초기 nav/빈 패널과 inert template, /catalog-tab 허용 목록으로 선택 탭만 생성한다. 초기 HTTP응답123,794바이트. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-native-tabs-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-native-tabs-20261108/REPORT_KO.md>)<br>[tools/text-workshop/catalog-tabs.cjs](<G:/somi/JO9sa/tools/text-workshop/catalog-tabs.cjs>)<br>[tools/local-workspace/catalog-seed/catalog-tabs.js](<G:/somi/JO9sa/tools/local-workspace/catalog-seed/catalog-tabs.js>) |
| T025<br>H124 | 탭 구조와 생성기·기존 데이터 쓰기 호환 | 씬 재생성 시 이전 전체 HTML로 UI를 덮을 가능 | 씬 생성기가 conditions template 내부만 교체하고 기존 var D/window.JO9_* 패턴·원본 JSON 배열을 유지한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-native-tabs-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-native-tabs-20261108/REPORT_KO.md>)<br>[tools/scene-image-conditions/generate.cjs](<G:/somi/JO9sa/tools/scene-image-conditions/generate.cjs>)<br>[tools/text-workshop/server.cjs](<G:/somi/JO9sa/tools/text-workshop/server.cjs>) |
| T026<br>H125 | 처리 주석130개에 권장 행동·이유·다음 할 일 | 과거 조사 주석의 후속 행동이 부족 | 중복후보6/비교45/아이템검토8/여성용검토8/예비보관60/연결완료3으로 안내하고 카드 바로가기를 제공한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-action-notes-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-action-notes-20261108/REPORT_KO.md>)<br>[tools/scene-image-conditions/review-notes.json](<G:/somi/JO9sa/tools/scene-image-conditions/review-notes.json>)<br>[tools/scene-image-conditions/review-notes.cjs](<G:/somi/JO9sa/tools/scene-image-conditions/review-notes.cjs>) |
| T027<br>H126 | 현재 WORK 씬 조건 정적 재분석 | 이전 QSP 분석 기준 | 11/8 씬1127개 분석(연결728/무작위258/동적4/전환9/미확인128)을 남겼다. 11/9 사용자결정으로60f8bc 기준 분석표시를 유지했다. | 정적분석 당시이력·현재 전수등장확인 아님 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/scene-condition-refresh-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/scene-condition-refresh-20261108/REPORT_KO.md>)<br>[docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md>) |
| T028<br>H127 | 새·옛 역할 등록 병행 판정 | 옛 fullsecretary/fullmistress가 비면 정상 추가팩도 미연결로 표시 | indpack_secr/indpack_dom 등 하나라도 있으면 역할 연결로 분류하고 effectiveRoles/menuIssue를 맞춘다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/checklist-role-status-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/checklist-role-status-20261108/REPORT_KO.md>)<br>[tools/girls-image-checklist/checklist-role-status.test.cjs](<G:/somi/JO9sa/tools/girls-image-checklist/checklist-role-status.test.cjs>)<br>[tools/girls-image-checklist/build_inventory.py](<G:/somi/JO9sa/tools/girls-image-checklist/build_inventory.py>) |
| T029<br>H128 | 빈 legacyFields 경고 제거 | 등록이 없어도 이전 장면 경고 섹션 생성 | 실제 등록만 이전 개별 장면 참고 경로로 표시한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/checklist-role-status-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/checklist-role-status-20261108/REPORT_KO.md>)<br>[tools/girls-image-checklist/catalog-girls-checklist.js](<G:/somi/JO9sa/tools/girls-image-checklist/catalog-girls-checklist.js>) |
| T030<br>H129 | 기존 PNG 파일 탐색·캐릭터 수동 연결 | 경로 미등록 슬롯은 외부 도구 또는 재생성 필요 | 전신·초상·역할·상태별 의상에서 PIC 내부 PNG를 골라 JSON 경로를 저장하고 원본/이력을 남긴다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/character-image-links-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md>)<br>[tools/text-workshop/character-image-links.cjs](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>)<br>[tools/girls-image-checklist/checklist-link-picker.js](<G:/somi/JO9sa/tools/girls-image-checklist/checklist-link-picker.js>) |
| T031<br>H130 | 현재 WORK JSON의 실시간 이미지 조회 | 정적 내장 원장이 최신1448/2577 등록을 놓침 | 실제JSON 최신이미지 조회에 이어 11/11 고정1155ID 요청을 전체JSON 감지로 확장했다. 정적manifest 행수와 현재조회수를 구분한다. | 전체JSON 감지로 후속확대 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/character-image-links-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md>)<br>[tools/text-workshop/character-image-links-api.test.cjs](<G:/somi/JO9sa/tools/text-workshop/character-image-links-api.test.cjs>)<br>[records/json-character-discovery-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>) |
| T032<br>H131 | 옷 입은 모습 슬롯과 역할 복장 공용 선택 | 대표그림 indpack_title과 기본 전신이 하나의 칸/저장 의미로 섞임 | 알몸은 indpack_naked 우선·없으면 fullimage, 옷 입은 모습은 별도 indpack_title로 표시하고 하녀·비서·도미나 공용 지정 버튼을 제공한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/SESSION_HANDOFF_INDEX.md](<G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md>)<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/girls-image-checklist/catalog-girls-checklist.js](<G:/somi/JO9sa/tools/girls-image-checklist/catalog-girls-checklist.js>) |
| T033<br>H132 | 타이틀 지정 시 알몸 등록 보존 | 옷 입은 대표 그림 지정 뒤 알몸 기본도 그 그림을 가리킬 위험 | 타이틀 추가 시 indpack_naked가 없으면 현재 fullimage로 채우고 기본 전신 변경 시 fullimage/기존 naked 및 이전 full과 같던 title을 맞춘다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/SESSION_HANDOFF_INDEX.md](<G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md>)<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/text-workshop/character-image-links.cjs](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>) |
| T034<br>H133 | generate_stock에 맞춘 무작위 분류 | slave_index 범위만으로 무작위 여부 판단 | 현재 generate_stock의 영 캐릭터1462까지 확대 범위와1448/1450 제외를 반영한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/SESSION_HANDOFF_INDEX.md](<G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md>)<br>[tools/girls-image-checklist/build_inventory.py](<G:/somi/JO9sa/tools/girls-image-checklist/build_inventory.py>) |
| T035<br>H134 | 펠라게야2577→2585·2607 이미지 연결 공유 | 세 번호의 JSON 연결을 각각 편집 | 2577 경로저장시2585/2607에 이미지필드만 적용하는 단방향그룹이다. 같은PNG 공유와 임의복제그룹 경로자동전파는 별개이며 후자는 D19보류다. | 3번호공유 구현·일반화만 보류 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/pelageya-group-gloria-list-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-group-gloria-list-20261109/REPORT_KO.md>)<br>[tools/text-workshop/character-image-links.cjs](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>)<br>[tools/text-workshop/pelageya-group.test.cjs](<G:/somi/JO9sa/tools/text-workshop/pelageya-group.test.cjs>)<br>[records/deferred-discussions-20261024/index.json](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>) |
| T036<br>H135 | 2341 글로리아 목록 등록 | 정적1154명 원장에 글로리아 누락 | 기존1154명을 유지해1155명으로 갱신하고 글로리아 기본/3초상/3역할 PNG 존재를 표시한다. | 11/9 정적1154→1155 이력·11/11 전체JSON 감지로 확대 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/pelageya-group-gloria-list-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-group-gloria-list-20261109/REPORT_KO.md>)<br>[tools/girls-image-checklist/manifest.json](<G:/somi/JO9sa/tools/girls-image-checklist/manifest.json>) |
| T037<br>H136 | 전용 번호 폴더·일반 역할 경로 경고 | 파일명까지 강제하던 rulePath/위치별 안내 부족 | 전용 full/face/sex_scenes 번호폴더 유무에 따라 권장 폴더를 판정하고 카드·슬롯·목록·파일 선택 창에 경고한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/character-path-rules-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/character-path-rules-20261109/REPORT_KO.md>)<br>[tools/girls-image-checklist/path-rules.test.cjs](<G:/somi/JO9sa/tools/girls-image-checklist/path-rules.test.cjs>)<br>[tools/text-workshop/character-image-links.cjs](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>) |
| T038<br>H137 | 폴더 선택으로 새 경로 이미지 저장 | 기존 대상 PNG 교체 중심 | 새경로→PIC폴더/새하위폴더 준비→투입원본파일명→규격/구도확인→새PNG저장. 실제저장때 폴더생성, QSP/JSON자동연결은 없음. 11/11 생성기원천에 이관했다. | 새경로기능·원천반영 구현 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/new-image-path-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/new-image-path-20261108/REPORT_KO.md>)<br>[tools/imgmg/workshop-new-path.js](<G:/somi/JO9sa/tools/imgmg/workshop-new-path.js>)<br>[tools/cut-addition/catalog_editor.js](<G:/somi/JO9sa/tools/cut-addition/catalog_editor.js>)<br>[records/workshop-batch-frame-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-batch-frame-20261111/REPORT_KO.md>) |
| T039<br>H138 | 새 파일 충돌 방어·경로 유지·목록 재편입 | 새 경로 선택과 기존 교체 경로의 상태 혼선 가능 | 기존 파일명 충돌·예약명·PIC 경계를 거부하고 새 경로 선택을 유지하며 성공 파일을 공유 인덱스/현재 편집 목록에 등록한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/new-image-path-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/new-image-path-20261108/REPORT_KO.md>)<br>[tools/imgmg/workshop-new-path.test.cjs](<G:/somi/JO9sa/tools/imgmg/workshop-new-path.test.cjs>)<br>[tools/imgmg/new-image-path-save.test.cjs](<G:/somi/JO9sa/tools/imgmg/new-image-path-save.test.cjs>) |
| T040<br>H139 | 선택 대사 단계에 이미지 연결 API | 대사별 이미지 슬롯 지정 흐름 없음 | 그림지정이 없는 검증된 단계는 기존 $special_image_full API로 연결한다. 11/8 별도패널은11/9 그림아래 새경로/조건UI로 대체했고 백업·최소mod·복구는 유지한다. | API유지·별도패널 대체 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/dialogue-image-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/dialogue-image-20261108/REPORT_KO.md>)<br>[tools/text-workshop/dialogue-image.cjs](<G:/somi/JO9sa/tools/text-workshop/dialogue-image.cjs>)<br>[tools/text-workshop/dialogue-image-api.test.cjs](<G:/somi/JO9sa/tools/text-workshop/dialogue-image-api.test.cjs>) |
| T041<br>H140 | 현재 이미지 지정 한 곳의 참조 경로 변경 | PNG 내용 교체 또는 단계 공통 별도 슬롯 중심 | 그림 아래에서 기존 파일을 선택하고 같은 이미지의 여러 지정 중 원본 행/조건으로 한 곳을 골라 바꾼다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/image-reference-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/image-reference-20261109/REPORT_KO.md>)<br>[tools/text-workshop/image-reference.cjs](<G:/somi/JO9sa/tools/text-workshop/image-reference.cjs>)<br>[tools/text-workshop/flow.cjs](<G:/somi/JO9sa/tools/text-workshop/flow.cjs>) |
| T042<br>H141 | 장면 이미지의 성향·보유금·계급·평판 조건과 fallback | 장면 참조별 추가 조건 편집 없음 | 기존 체크리스트 조건 UI/검증을 재사용해 해당 대입문만 조건과 기본 이미지로 감싼다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/image-reference-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/image-reference-20261109/REPORT_KO.md>)<br>[tools/text-workshop/catalog-cut-conditions.js](<G:/somi/JO9sa/tools/text-workshop/catalog-cut-conditions.js>)<br>[tools/text-workshop/image-cut-condition-rules.cjs](<G:/somi/JO9sa/tools/text-workshop/image-cut-condition-rules.cjs>) |
| T043<br>H142 | 실제 원본 사본 폴더를 정상 저장소로 인정 | jo9o_original_cuts를 junction으로만 보고 실제 사본을 오판 | junction은 실제 대상, 실제 폴더는 등록 경로/원본해시를 대조해 사용하고 새 사본·B컷 생성/롤백을 지원한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-sync-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[tools/text-workshop/original-cuts.cjs](<G:/somi/JO9sa/tools/text-workshop/original-cuts.cjs>)<br>[tools/text-workshop/original-store.test.cjs](<G:/somi/JO9sa/tools/text-workshop/original-store.test.cjs>) |
| T044<br>H143 | 목록 밖 등록·수동 B컷 보존 | 필터된 목록 밖 reserve를 해제로 해석하거나 수동B와 충돌 | 저장 spare와 기존 등록부가 함께 있는 목록 밖 항목을 유지하고 미등록 수동B는 덮어쓰지 않는다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-sync-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[tools/text-workshop/original-cuts.cjs](<G:/somi/JO9sa/tools/text-workshop/original-cuts.cjs>) |
| T045<br>H144 | 쓰기 없는 동기화 계획·QSP/체크 버전 재확인 | 버전 기준 설명/사전계획 API 부족 | register dryRun과 original-sync-plan이 후보·복사·추가/해제·해시를 읽기 전용으로 제시하고 반영 전/등록 직후 버전 충돌을 중단·복구한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-sync-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[tools/text-workshop/catalog-sync-version.cjs](<G:/somi/JO9sa/tools/text-workshop/catalog-sync-version.cjs>)<br>[tools/text-workshop/catalog-sync-api.test.cjs](<G:/somi/JO9sa/tools/text-workshop/catalog-sync-api.test.cjs>) |
| T046<br>H145 | 체크 상태 복구와 원본 B컷48쌍 추가 | 체크9개만 남고 등록238/예약282가 남은 불일치 | 백업과 최신9선택을 합쳐 최종1903상태, 기존237+신규48=285원본등록·44예약으로 통일했다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/catalog-sync-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[records/catalog-sync-20261109/merge-result.json](<G:/somi/JO9sa/records/catalog-sync-20261109/merge-result.json>)<br>[records/catalog-sync-20261109/source-sync.json](<G:/somi/JO9sa/records/catalog-sync-20261109/source-sync.json>) |
| T047<br>H146 | 효과음 후보·지역 BGM 청취 목록 | 별도 후보 기록만 존재 | Pixabay 효과음 원본 링크와 WORK 지역 BGM12곡 플레이어를 묶은 청취_목록.html을 생성하고 통합 실행기에 포함한다. 11/11 최신결정: 사운드목록은 SoundAudition 경로만 출력하며 자동파일열기에서 제외한다. | 도구구현·사운드 자동열기제외가 최신<br>보완: 기존문구의 사운드자동열기 포함은 당시이력이다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[tools/sound-audition/build.cjs](<G:/somi/JO9sa/tools/sound-audition/build.cjs>)<br>[tools/local-workspace/Open-Modding-Tools.ps1](<G:/somi/JO9sa/tools/local-workspace/Open-Modding-Tools.ps1>)<br>[records/json-character-discovery-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>)<br>[docs/modding/MOD_TOOLS_OPEN_20261021.md](<G:/somi/JO9sa/docs/modding/MOD_TOOLS_OPEN_20261021.md>) |
| T048<br>H147 | 내 폴더·음원 추가·후보별 파일 배정 | 목록의 고정 원본 링크/플레이어만 제공 | 폴더·복수 파일·개인 음원을 읽고 후보 A/B/BGM별62영역에 지정/해제하여 로컬 재생한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/sound-file-picker-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/sound-file-picker-20261108/REPORT_KO.md>)<br>[tools/sound-audition/audio-library.cjs](<G:/somi/JO9sa/tools/sound-audition/audio-library.cjs>)<br>[tools/sound-audition/browser.js](<G:/somi/JO9sa/tools/sound-audition/browser.js>) |
| T049<br>H148 | 재제작·채택·보류와 설정 이전 | 검토 상태·사용자 배정의 일관된 보관 없음 | 한 항목 한 상태 토글, 브라우저 저장과 설정 JSON 가져오기/내보내기에 파일 메타·배정·검토 상태를 보관한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/sound-file-picker-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/sound-file-picker-20261108/REPORT_KO.md>)<br>[tools/sound-audition/audio-library.test.cjs](<G:/somi/JO9sa/tools/sound-audition/audio-library.test.cjs>) |
| T050<br>H149 | 승인 선택 기록과 실제 본체 연결 상태 구분 | 후보 표시만으로 실제 게임 채택 여부 오해 가능 | 승인 선택을 결정ID별 최초 한 번만 리뷰/배정에 합쳐 사용자 이후 재검토를 보존하고 실제 본체 연결과 구분한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/sound-adoption-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/sound-adoption-20261108/REPORT_KO.md>)<br>[tools/sound-audition/approved-selections.json](<G:/somi/JO9sa/tools/sound-audition/approved-selections.json>)<br>[tools/sound-audition/decision.test.cjs](<G:/somi/JO9sa/tools/sound-audition/decision.test.cjs>) |
| T051<br>H150 | 정상 편집기 포트 소유 판정 | 이 PC의 FinWait1/remote0.0.0.0:0 정상 소켓을 거부 | Listen 또는 해당 원격0 소켓을 검사해 올바른 PID의 서버를 정상 재사용한다. | 11/8 수정있음·후속 전체실행기 실패/TIME_WAIT 한계별도<br>보완: 11/10 launcher.test.ps1은 수정전후 포트소유 검사실패. 11/11 초상도구 검증은 TIME_WAIT PID0오판으로 자동실행이 막혀 LISTEN없음 확인후 직접시작. 현재74행 조건도 남아있다. 모든 실행기상황 해결완료로 표시하면 안 된다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[tools/local-workspace/Start-JO9-Tools.ps1](<G:/somi/JO9sa/tools/local-workspace/Start-JO9-Tools.ps1>)<br>[records/script-game-layout-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/script-game-layout-20261110/REPORT_KO.md>)<br>[records/slave-portrait-frame-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/REPORT_KO.md>) |
| T052<br>H151 | 기본 모드툴에서 인물 상태 편집기·별도 씬 추가기 제외 | 옛 기본 도구 목록에 인물 상태 편집기 포함 | 사용자 결정으로 상태편집기와 이미 HTML로 만든 씬 추가기는 기본 열기에서 제외하고 사운드/특성아이템DB를 포함한다. 11/11 최신결정: 사운드목록은 SoundAudition 경로만 출력하며 자동파일열기에서 제외한다. | 도구구현·사운드 자동열기제외가 최신<br>보완: 기존문구의 사운드자동열기 포함은 당시이력이다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md>)<br>[docs/modding/MOD_TOOLS_OPEN_20261021.md](<G:/somi/JO9sa/docs/modding/MOD_TOOLS_OPEN_20261021.md>)<br>[records/json-character-discovery-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>)<br>[tools/local-workspace/Open-Modding-Tools.ps1](<G:/somi/JO9sa/tools/local-workspace/Open-Modding-Tools.ps1>) |
| T053<br>H152 | 원격 특성·아이템 열람표 반입과 최신 WORK 추출 | 현재 로컬에 아이템 리스트 없어 보류 | 원격41c1a640의 game-reference만 가져와 현재 WORK 기준 특성128/아이템271(기본196+조리75)로 재추출한다. | 11/8 원래 도입이력 보존·이후확장 별도<br>보완: 현재결과가 마법/개인아이디어 설명으로 치환돼 원래기능이 사라졌다. 원래 before/after는 release-data.rows에 남아있으므로 후속과 별도층으로 복원한다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/game-reference-refresh-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-refresh-20261108/REPORT_KO.md>)<br>[tools/game-reference/extract-traits.cjs](<G:/somi/JO9sa/tools/game-reference/extract-traits.cjs>)<br>[tools/game-reference/extract-items.cjs](<G:/somi/JO9sa/tools/game-reference/extract-items.cjs>)<br>[records/game-reference-ideas-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-ideas-20261111/REPORT_KO.md>)<br>[records/game-reference-ideas-20261111/verification.json](<G:/somi/JO9sa/records/game-reference-ideas-20261111/verification.json>)<br>[tools/game-reference/snapshot.json](<G:/somi/JO9sa/tools/game-reference/snapshot.json>) |
| T054<br>H153 | 발현·치료·획득처와 정확한 현재 조건 설명 | 원격 데이터의 무작위 추정/등급·가격 설명 일부 낡음 | 현재 발현/승급/치료·시루보정, 정확한 등급, 과일/와인 가격과10회분, 특별요리/재료우선순위·미연결 획득이벤트를 표시한다. | 11/8 원래 도입이력 보존·이후확장 별도<br>보완: 현재결과가 마법/개인아이디어 설명으로 치환돼 원래기능이 사라졌다. 원래 before/after는 release-data.rows에 남아있으므로 후속과 별도층으로 복원한다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/game-reference-refresh-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-refresh-20261108/REPORT_KO.md>)<br>[tools/game-reference/refresh-current.cjs](<G:/somi/JO9sa/tools/game-reference/refresh-current.cjs>)<br>[tools/game-reference/enrich-item-acquisition.cjs](<G:/somi/JO9sa/tools/game-reference/enrich-item-acquisition.cjs>)<br>[records/game-reference-ideas-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-ideas-20261111/REPORT_KO.md>)<br>[records/game-reference-ideas-20261111/verification.json](<G:/somi/JO9sa/records/game-reference-ideas-20261111/verification.json>)<br>[tools/game-reference/snapshot.json](<G:/somi/JO9sa/tools/game-reference/snapshot.json>) |
| T055<br>H154 | 읽기 서버·통합 실행·도구 ZIP | 독립 정적 자료만 있고 통합 실행 연결 없음 | 127.0.0.1 서버의 PID/스크립트/상태를 확인해 재사용하고 GameReference URL을 열며17항목 소스/데이터 ZIP을 제공한다. | 11/8 원래 도입이력 보존·이후확장 별도<br>보완: 현재결과가 마법/개인아이디어 설명으로 치환돼 원래기능이 사라졌다. 원래 before/after는 release-data.rows에 남아있으므로 후속과 별도층으로 복원한다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/game-reference-refresh-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-refresh-20261108/REPORT_KO.md>)<br>[tools/game-reference/Start-Game-Reference.ps1](<G:/somi/JO9sa/tools/game-reference/Start-Game-Reference.ps1>)<br>[tools/game-reference/serve.cjs](<G:/somi/JO9sa/tools/game-reference/serve.cjs>)<br>[tools/local-workspace/Open-Modding-Tools.ps1](<G:/somi/JO9sa/tools/local-workspace/Open-Modding-Tools.ps1>)<br>[records/game-reference-ideas-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-ideas-20261111/REPORT_KO.md>)<br>[records/game-reference-ideas-20261111/verification.json](<G:/somi/JO9sa/records/game-reference-ideas-20261111/verification.json>)<br>[tools/game-reference/snapshot.json](<G:/somi/JO9sa/tools/game-reference/snapshot.json>) |
| T056<br>H155 | 목록·큰 전신·얼굴/복장·정보 탭 레이아웃 | 기존 character_editor_ui와 추가/수정 창 | 왼쪽 캐릭터 목록, 중앙 기본/타이틀/하녀/비서/도미나 전신, 오른쪽 얼굴·복장, 정보/고유이야기/복제능력치 하단 탭으로 재작성한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/character_editor_ui.py](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>) |
| T057<br>H156 | 전신 기본 얼굴 박스와 키보드 조작 | 기존 얼굴 드래그 선택 중심 | 전신을 넣으면151:150 박스를 대략 위치에 띄우고 이동/크기드래그·방향키1/10px·+/−·R·휠·마지막 크기 기억을 제공한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/character_editor_ui.py](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>) |
| T058<br>H157 | 슬롯별 크기 맞춤·앵커/여백 정렬 | 기존 전신 규격 맞춤 옵션 중심 | 배율/X/Y·드래그/휠/키/숫자·정수리/하단·정수리/턱·투명여백·기본비율·수치복사·저장수치 적용을 추가한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/align_core.py](<G:/somi/JO9sa/tools/character-image-adder/align_core.py>)<br>[tools/character-image-adder/character_editor_ui.py](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>) |
| T059<br>H158 | 고유 이름·slug·이야기·복제 능력치 편집 | 기본 외형 추가/기존 변경 중심 | 표시이름/영문파일명/고유ID와 이야기3문단, 복제본 정수 seed 능력치를 별도 편집한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/add_character.py](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>) |
| T060<br>H159 | 원본 이미지 경로 공유 고유 캐릭터 복제 | 캐릭터 복제 경로 없음 | 새 고유ID JSON을 만들고 이미지·외모·stock_*는 원본경로 공유, 이름·이야기3문단·정수seed능력치는 별도저장한다. 교체한슬롯만 새파일로 분리한다. 원본불변·랜덤풀미등록. 임의복제그룹 경로전파 일반화D19만 보류다. | 고유캐릭터복제 구현·그룹일반화만 보류<br>보완: 기존 currentResult가 펠라게야 그룹보류로 치환돼 이미구현된 새ID복제/슬롯별공유끊기 설명이 빠졌다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/add_character.py](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>)<br>[records/deferred-discussions-20261024/index.json](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>)<br>[tools/text-workshop/character-image-links.cjs](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>) |
| T061<br>H160 | 체크리스트와 같은 이미지 저장 의미·폴더 규칙 | 추가기의 이전 경로/대표그림 해석 | 전용 번호폴더, 일반 title/알몸/역할 폴더와 naked/title 연동을 체크리스트와 맞추고 기존 연결은 같은 경로 교체·규칙밖은 경고한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/add_character.py](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>) |
| T062<br>H161 | 공유 이미지 대상 표시와 저장/삭제 확인 | 공유 파일 교체 영향 표시 부족 | 같은 PNG를 쓰는 다른 ID를 전신 아래에 표시하고 교체/삭제 직전 확인한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/add_character.py](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>)<br>[tools/character-image-adder/character_editor_ui.py](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>) |
| T063<br>H162 | 통합 작업 로그와 캐릭터별 맞춤수치 | 도구별 기록 분산 | 사람용md/프로그램용jsonl/ID·슬롯별수치JSON에 입력·앵커·변환·경로/해시·JSON전후·공유·경고·오류와 save_start/save를 남긴다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/tool_log.py](<G:/somi/JO9sa/tools/character-image-adder/tool_log.py>)<br>[tools/character-image-adder/.gitignore](<G:/somi/JO9sa/tools/character-image-adder/.gitignore>) |
| T064<br>H163 | 기존 규격 통일기 기록 가져오기 | normalizer의 jo9_project/manifest가 분리 | 버튼으로 기존 기록을 통합 로그에 합치고 UTC→현지시각 변환을 지원한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/tool_log.py](<G:/somi/JO9sa/tools/character-image-adder/tool_log.py>) |
| T065<br>H164 | 개인실 장면·인테리어 카탈로그/개인패치 등록 스크립트 | 새 장면/인테리어 PNG의 카탈로그·개인패치 원장 미등록 | register.cjs/register_interiors.cjs가 기본dry-run/--apply로 신규 경로만 코드·진행기록·개인패치 create이벤트에 등록한다. | 도구 구현 기록 유지 | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[records/scene-home-catalog-20261110/register.cjs](<G:/somi/JO9sa/records/scene-home-catalog-20261110/register.cjs>)<br>[records/scene-home-catalog-20261110/register_interiors.cjs](<G:/somi/JO9sa/records/scene-home-catalog-20261110/register_interiors.cjs>) |
| T066<br>H165 | 연결 해제·전체 삭제 시 공유 PNG 보존 | 다른 ID가 쓰는 공유파일도 삭제될 수 있음 | 모든 이미지 참조·같은 물리경로별칭·ID0·옛 암묵초상·같은ID역할공유를 검사해 연결/JSON만 지우고 공유PNG를 남긴다. | 수정·설치 기록있음·관련파일545f8d1d(11/11)에 커밋됨<br>보완: 원래 미커밋표시는 당시이력이다. 현재Git에서 관련파일545f8d1d 포함을 확인했다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/claude-stability-fixes-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)<br>[tools/character-image-adder/add_character.py](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>)<br>[tools/character-image-adder/test_character_safety.py](<G:/somi/JO9sa/tools/character-image-adder/test_character_safety.py>) |
| T067<br>H166 | 이름·slug·ID·이야기 초안 손실 방지 | 이미지 외 입력만 바꾸면 인물이동·닫기·복제에서 미저장 누락 | 입력 모두 dirty감지에 포함하고 이동/닫기뿐 아니라 복제시작도 확인한다. 취소 시 입력/이미지 상태 보존, 복제 carried원고는 저장/원복 전까지 dirty를 유지한다. | 수정·설치 기록있음·관련파일545f8d1d(11/11)에 커밋됨<br>보완: 원래 미커밋표시는 당시이력이다. 현재Git에서 관련파일545f8d1d 포함을 확인했다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/claude-stability-fixes-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)<br>[tools/character-image-adder/character_editor_ui.py](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>)<br>[tools/character-image-adder/test_character_safety.py](<G:/somi/JO9sa/tools/character-image-adder/test_character_safety.py>) |
| T068<br>H167 | 둘째 등록 묶음과 무변경 재실행 보존 | 고정 이벤트ID 때문에 두번째 묶음 기록이 누락될 수 있음 | 경로+파일해시 기반 묶음ID와 공통 register-batch helper로 매 묶음을 기록하고 기존등록 반복은 NO_CHANGES로 모든 쓰기 없이 종료한다. | 수정·설치 기록있음·관련파일545f8d1d(11/11)에 커밋됨<br>보완: 원래 미커밋표시는 당시이력이다. 현재Git에서 관련파일545f8d1d 포함을 확인했다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/claude-stability-fixes-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)<br>[records/scene-home-catalog-20261110/register-batch.cjs](<G:/somi/JO9sa/records/scene-home-catalog-20261110/register-batch.cjs>)<br>[records/scene-home-catalog-20261110/registration.test.cjs](<G:/somi/JO9sa/records/scene-home-catalog-20261110/registration.test.cjs>) |
| T069<br>H168 | 실제 WORK 공유이미지 dry-run 및 도구 회귀 근거 | 공유/단독/취소/복제 경계의 자동 회귀 부족 | 합성 캐릭터23검사·등록6검사와 실제공유이미지dry-run 보존, 두실제등록묶음 NO_CHANGES를 기록한다. | 수정·설치 기록있음·관련파일545f8d1d(11/11)에 커밋됨<br>보완: 원래 미커밋표시는 당시이력이다. 현재Git에서 관련파일545f8d1d 포함을 확인했다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/claude-stability-fixes-20261110/verification.json](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/verification.json>)<br>[tools/character-image-adder/test_character_safety.py](<G:/somi/JO9sa/tools/character-image-adder/test_character_safety.py>)<br>[records/scene-home-catalog-20261110/registration.test.cjs](<G:/somi/JO9sa/records/scene-home-catalog-20261110/registration.test.cjs>) |
| T070<br>H170 | 추가 이미지팩 현재WORK 미리보기 | 27명108파일은 과거내장dataURL썸네일,71개가 현재기록과 달랐다. | original=0 WORK전용API로 현재파일을 읽고 내장108썸네일을 제거했다. 누락은 파일없음으로 표시한다. | 구현·당시108개 HTTP바이트대조<br>보완: 이미지영역H170에 있어 도구69행만 감사하면 누락된다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/additional-pack-work-preview-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/additional-pack-work-preview-20261108/REPORT_KO.md>) |
| T071<br>N35 | 전체 캐릭터JSON 감지·번호없는/중복숫자 지원 | 고정1155ID만 요청해 신규3040과 번호없는파일이 빠졌다. | 정상객체JSON전체(.JSON포함)를 읽는다. 고유숫자는 기존ID, 번호없음/중복은 json:<실제파일명>으로 구분한다. 이름/파일명/경로 수동검색, 파일별태그·수동연결·초상테두리와 옛태그 보관을 지원한다. | 구현·실제번호없는 운영파일은 당시없음<br>보완: 당시51검사·실제1157JSON은 기록근거, 번호없는저장은 합성자료검증이다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/json-character-discovery-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>) |
| T072<br>N43 | 노예초상 카드 자동테두리 | 목록에서 프레임 비교·합성·명시적용 버튼이 없었다. | 컬러/흑백/세피아별 원본/후보비교 후 적용한다.150/151×150 바깥5px만 합성·중앙RGBA보존, 기존프레임유지·불확실확인·공유영향표시·최신해시검사·기존백업저장. | 도구구현·운영PNG 실제저장검증은 미실행<br>보완: 19검사/실제야즈민 미리보기취소와 운영PNG적용·게임표시는 구분. PillowPython의존. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/slave-portrait-frame-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/REPORT_KO.md>) |
| T073<br>N36 | 이미지교체기 선택일괄테두리 | 보존합성 일부만 있고 현행경로/151px분류와 일괄버튼이 부족했다. | 단일버튼으로 선택지원규격만 처리한다. 입력없으면 선택원본을 작업행으로 읽고 중앙픽셀/알파/bytes를 보존한다.59×66/150/151초상·회색/세피아·보호mask·재조회충돌 지원, 저장은 기존백업후교체다. | 구현·source/WORK 생성JS일치<br>보완: 당시18검사·양쪽브라우저는 합성PNG범위. 운영PNG저장0. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-batch-frame-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-batch-frame-20261111/REPORT_KO.md>) |
| T074<br>N36, H137, H138 | 새경로 기능 생성기원천 이관 | 11/8생성JS에만 있어 재생성때 기능이 빠질 수 있었다. | 11/11 새경로모듈·연결10곳을 원천main스크립트로 이관하고 standalone/catalog dialog부모를 모두 허용했다. | 원천반영·현재생성JS설치일치<br>보완: 기존새경로 원천반영이라는 문구를 재생성손실방지 before/after로 보완. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/workshop-batch-frame-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-batch-frame-20261111/REPORT_KO.md>) |
| T075<br>N35, H146, H151 | 사운드목록 자동파일열기 제외 | 11/8통합실행은 청취HTML도 자동열었다. | 11/11 SoundAudition경로 출력은 유지하고 자동브라우저열기목록에서 제거했다. 사용자가 직접열기 요청때만 연다. | 현재실행기 코드확인<br>보완: 옛자동열기와 최신사용자결정을 시간별로 분리. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/json-character-discovery-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>) |
| T076<br>H119 | 각본 실제UI크기 스타일 CSS설치 | 도구복사 확장자목록에서 CSS가 빠져 새스타일이 설치되지 않을 수 있었다. | Start-JO9-Tools.ps1 설치대상에 .css를 포함했다. 초안/키/설정/기록 제외는 유지한다. | 수정·현재.css포함확인<br>보완: CSS선택검사는 통과, 전체launcher.test 실패는 별도. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/script-game-layout-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/script-game-layout-20261110/REPORT_KO.md>) |
| T077<br>H152, H153 | 마법11종 DB | 11/8특성·아이템DB에 별도마법표가 없었다. | 실제메뉴명/설명·시전소모량·메뉴/시전위치·직접조건·원문코드의11종마법표를 추가하고 단독HTML에 내장했다. | 구현·양HTML11종<br>보완: 원래DB도입행 치환없이 신규확장으로 분리. 상위조건/자동시전/전체결과 공략은 아님. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/game-reference-ideas-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-ideas-20261111/REPORT_KO.md>) |
| T078<br>H154 | 개인 기획아이디어 CRUD·백업 | 열람DB에 개인기록 UI/저장이 없었다. | 종류별작성/편집/취소/2회확인삭제/검색/탭초안유지/JSON백업·새ID추가가져오기·revision검사 지원. 서버는 runtime/ideas.json, 단독HTML은 브라우저저장. 생성/설치에서 개인파일을 복사하지 않는다. | 구현·개인데이터변경없음<br>보완: API백업확인과 UI다운로드실물미확인·작은화면미검증을 보존. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/game-reference-ideas-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-ideas-20261111/REPORT_KO.md>) |
| T079<br>N31 | 적 전투특성 탭 | 특성·아이템·마법만 있었다. | 11/11적70종 상시플래그/저항/일반155·특수30을 추출하고 수동검색/분류/상세/최초지연구성·탭초안보존·--enemies-only 및 기준해시표시를 추가했다. 이후74종으로 확대. | 구현·당시70과현재74분리<br>보완: 게임방어수정과 열람UI기능을 별도로 남긴다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/game-reference-enemies-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-enemies-20261111/REPORT_KO.md>) |
| T080<br>N30 | 적 특수공격 공통이름·사용자표 | 30기술은 개별적카드로만 보였다. | 16공통이름·24적사용자·슬롯30·공격/피해/효과/카운터/하드조건 비교표와 수동검색을 제공한다. 이름은 열람표용이며 QSP공격문장 변경아님. | 구현·이후정적특수33과구분<br>보완: 당시30기술과 신규3기술정의 후속을 분리. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/enemy-special-reference-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/enemy-special-reference-20261111/REPORT_KO.md>) |
| T081<br>N29, N24 | MOB 비교·상세 탭 | 적특성카드만 있고 자원/피해 비교표가 없었다. | 11/11 QSP적70+춘향기획1행의 수동검색·등록/분류필터·이름/자원/피해정렬·선택상세·빈결과숨김·탭상태보존. 11/12실제구현후 현재정의74/기획0이다. | 구현·역사상미구현표시와현재분리<br>보완: N29기획1종은 과거이력이며 현재소개로 쓰지 않는다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/game-reference-mobs-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/game-reference-mobs-20261111/REPORT_KO.md>) |
| T082<br>N37 | DB 코스튬1행·추출기보완 | 아이템271행에 cow_costume이 없었다. | cow_costume1행을 DB/JSON/HTML에 추가하고 helper실제정의를 재추출때 읽도록 추출기를 보완했다. 부분갱신출처별도. | 현재양HTML272아이템<br>보완: 게임의상추가와 DB/추출기변경을 함께 기록. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/cow-costume-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/cow-costume-20261111/REPORT_KO.md>) |
| T083<br>N28 | 장비설명15행 DB부분갱신 | 일부장비설명이 실제효과와 달랐다. | QSP교정에 대응한 DB15설명·items.input/items.json을 갱신했다. 다른DB/적/개인기록/UI보존. | 부분갱신·양HTML items동일<br>보완: 전체재추출로 표현하지 않는다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/equipment-descriptions-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/equipment-descriptions-20261111/REPORT_KO.md>) |
| T084<br>N26 | 지정고유특성 획득설명3행 | 엘자·춘향 최신배정 전 설명이었다. | 절세미인/광전사/성기사 획득설명과 재추출기를 최신배정에 맞추고 부분갱신출처를 기록했다. | 부분갱신기록<br>보완: 게임특성배정과 도구3행후속 모두 남긴다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/unique-traits-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/unique-traits-20261112/REPORT_KO.md>) |
| T085<br>N25 | 산도·챔피언·양성애자 DB갱신 | 춘향 최신산도/경력/숨김보유 설명전 자료였다. | 산도1행추가를 포함해 특성129행, 해당설명과MOB영입인물상태를 갱신했다. 아이템/마법/적은 당시보존. | 현재양HTML129특성<br>보완: H152~153의128은 최초수치다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/chunhyang-profile-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-profile-20261112/REPORT_KO.md>) |
| T086<br>N24, N29, N31 | MOB74종 실제구현상태 | 적70+춘향기획1행이었다. | 춘향보스·일반상대3종을 추가해 적/MOB74·일반공격167·정적특수33·기획0. 춘향3기술/승계·결투·영입표시, 소유후 지배인/재개장은 미구현. | 현재양HTML74종<br>보완: 70+1기획과74실제를 층별보존. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/chunhyang-club-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-club-20261112/REPORT_KO.md>) |
| T087<br>N02, N01 | 활동단계4특성설명 HTML전달 | B통합은 traits.json4행을 고쳤으나 HTML에는 옛설명이 남았다. | 11/13 소스HTML에 워커홀릭/무기력함/끈기/산만함4행 description/source만 전달했다. 감사시점 WORK HTML은 옛4행이었다. | 소스최신있음·WORK설치차이<br>보완: 게임통합과 도구설치완료는 별도상태다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/handoff-b-combined-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-combined-20261112/REPORT_KO.md>)<br>[records/chunhyang-random-finish-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-random-finish-20261113/REPORT_KO.md>)<br>[tools/game-reference/traits.json](<G:/somi/JO9sa/tools/game-reference/traits.json>)<br>[tools/game-reference/jo9-reference.html](<G:/somi/JO9sa/tools/game-reference/jo9-reference.html>) |
| T088<br>N01 | 11/13 춘향 MOB설명 | 11/12표에는 저R강제패배·확률일섬·정밀/속공/강공이 남았다. | 소스HTML/원천은 조소6버프99턴·5~10턴무작위일섬·회피방어·3속공으로 갱신. WORK HTML은 이전설명, snapshot.files는 이전HTML해시였다. | 소스갱신·WORK설치동기화는감사범위외<br>보완: 게임최신반영으로 DB설치도최신이라 단정하지 않는다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/chunhyang-random-finish-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-random-finish-20261113/REPORT_KO.md>)<br>[tools/game-reference/mobs-data.cjs](<G:/somi/JO9sa/tools/game-reference/mobs-data.cjs>)<br>[tools/game-reference/jo9-reference.html](<G:/somi/JO9sa/tools/game-reference/jo9-reference.html>) |
| T089<br> | DB 실제소스와 snapshot파일해시 차이 | snapshot.files는11/12설치물해시를 보관한다. | 소스HTML441959B/59250736…와WORK414625B/da7e42b3… 차이, traits.json/mobs-data.cjs 해시도현재소스와 불일치. 원본을 바꾸지 않고 기록했다. | 정적차이확인·후속조치부모범위<br>보완: 새기능이 아닌 입력완전성 감사. 최신승인소스변경을 무조건버리면 안 된다. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[tools/game-reference/snapshot.json](<G:/somi/JO9sa/tools/game-reference/snapshot.json>)<br>[tools/game-reference/jo9-reference.html](<G:/somi/JO9sa/tools/game-reference/jo9-reference.html>)<br>[tools/game-reference/traits.json](<G:/somi/JO9sa/tools/game-reference/traits.json>)<br>[tools/game-reference/mobs-data.cjs](<G:/somi/JO9sa/tools/game-reference/mobs-data.cjs>)<br>[G:/somi/Jack O Nine Tails v2.4_work/game/modtools/game-reference/jo9-reference.html](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/game-reference/jo9-reference.html>) |
| T090<br>H129, H136, H155, H160, N35 | Girls UI·폴더규칙·지원경계 | 여러캐릭터도구를 같은지원범위로 오해할 수 있었다. | 체크리스트는 전체JSON/비번호지원, Python추가기는 숫자ID기반. 전용girls/full\|face\|sex_scenes/<ID> 경고·일반역할폴더·알몸/타이틀분리·수동연결은 제공하되 파일명강제/자동이동 없음. scene/home은girls목록대상 아님. | 코드지원경계 확인<br>보완: Girls실물자산SHA/변경경로는 부모감사. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/character-path-rules-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/character-path-rules-20261109/REPORT_KO.md>)<br>[records/json-character-discovery-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>)<br>[docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[tools/character-image-adder/add_character.py](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>) |
| T091<br>R11 | Full 모드툴동봉 상태 | WORK/modtools에 실행도구와 개인runtime/편집기록/백업이 섞인다. | 기능이력과별도로 Q05/R11동봉범위 승인대기. 개인아이디어·초안·키·이력·백업은 자동배포입력으로 간주하지 않는다. | 동봉범위미확정<br>보완: 구현완료와 Full동봉완료를 구분. | 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.<br>[records/release-night-preflight-20261113/APPROVAL_QUEUE_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/APPROVAL_QUEUE_KO.md>)<br>[docs/release-prep/2026-11-13/RELEASE_NOTES_CHECKLIST_KO.md](<G:/somi/JO9sa/docs/release-prep/2026-11-13/RELEASE_NOTES_CHECKLIST_KO.md>) |

| T092<br>H293 | 펠리시티 도구 실제저장 기록 직렬화 복원 | 기존 전신·타이틀·역할이미지의 저장전 구성. 로그에 저장전바이트해시는 없어 완전한이전파일 대조는 미확인. | 2026-11-10 05:01:20+09:00 전신·타이틀·하녀·비서·도미나 PNG5개 realign저장. 타이틀입력2304×1792에 배율0.3425/X9.8/Y−17.02, 나머지4슬롯795×596 배율1/X0/Y0, 초상유지. | 실제도구 save로그 확인·역사기록이며현재파일최종상태는부모Girls감사와대조<br>구조화 files/slots/json_changes를 문자열로 바꾸지 않아 원장설명이 깨졌다. 아래 선택된 로그메타데이터로 복원한다. | 원본로그는 읽기만 했으며 이름/장면/설정문을 각색하지 않았다. 과거save해시를 현재파일해시라고 단정하지 않는다. 이전바이트/실제외형 검증은 별도.<br>[G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl:21](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| T093<br>H294 | 엘자 도구 실제저장 기록 직렬화 복원 | fullmade/fullmistress/fullsecretary가 빈문자열이고 indpack_naked/title은 미등록이었다. 이전그림바이트/최종외형은 이로그만으로 미확인. | 2026-11-10 11:14:21+09:00 타이틀·하녀·비서·도미나 PNG4개교체와 2624_erza.json저장/백업. 빈역할3키를 각역할경로에 등록하고 naked=기본전신/title=characters 타이틀로분리. 초상유지. | 실제도구 save로그 확인·역사기록이며현재파일최종상태는부모Girls감사와대조<br>구조화 files/slots/json_changes를 문자열로 바꾸지 않아 원장설명이 깨졌다. 아래 선택된 로그메타데이터로 복원한다. | 원본로그는 읽기만 했으며 이름/장면/설정문을 각색하지 않았다. 과거save해시를 현재파일해시라고 단정하지 않는다. 이전바이트/실제외형 검증은 별도.<br>[G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl:37](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |

## 관련 기록 파일명 coverage

보고서·명세·관련코드 내용과 기존원장을 대조했다. 아래는 하위파일명 전체목록이며 모든 백업·진단·이미지 본문을 열었다는 뜻은 아니다.

인계: [docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>), [docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md>), [docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>), [docs/session-handoffs/2026-11-06/NEW_PC_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-06/NEW_PC_HANDOFF_KO.md>)

### records/patch-schedule-20261107 (3)

- adoption.json
- MANUAL_KO.md
- QA_RESULT.json

### records/next-patch-schedule-20261107 (1)

- NEXT_PATCH_SCHEDULE_20261107.html

### records/schedule-ideas-20261108 (12)

- add-schedule-ideas.cjs
- before/04d288392c35d9a0d1b0bb30e35e37a8f3690af273fde4e2262b6704d665a96c.gz
- before/3681001485ec30aeeb5f25f4b3b7172148d2098d9817516e120b3a26ca9c3fcb.gz
- before/a76db765dc4deee2a0025d02b4204d398340dec43b9c198f317e94318781351f.gz
- before/df991d86cfe7339e9bd76f54f7171f699265dc34550f7b6a101243d39079a4e2.gz
- before.json
- installation.json
- patch-schedule-ideas.png
- REPORT_KO.md
- server-error.log
- server.log
- verification.json

### records/modding-workbench-20261108 (2)

- JO9_Modding_Workbench.html
- README_KO.md

### records/dialogue-range-20261108 (24)

- before/40156b5d5febe7035320b1f65ead7917e15c889127ee02fe2629a8ea9effd16d.gz
- before/5d33f7756257f4542982214133f562fd8e1d8391db3e4a84f47333319cd352d3.gz
- before/61eaf87a317b04ac818f9ad5df9d38dc182a445e4ef0075a0361e51aef5b6352.gz
- before/bda92e3965dcdec13ced0f53162c222c841c691f407b22a169d788c070acc89e.gz
- before/d39c93afd1f17de55d27387840dd775c929d425fbfaeda8247e0b4b111b63e27.gz
- before/d4248d0c5624949979316878e88268de562041754b41711fbb58d7ae8371b5cb.gz
- before/e5fd16e3479655eb24571505e573349f215cabec2cea20c1cfc931f95532b1f7.gz
- before/f719b6e86e4cb4bf098d9c83aa427f1b6576bc35b4878aaa747ad5774eff0a12.gz
- before/f8042ffecbcd21b1d82ae8a5f9c67744272eb695c1f827f77b39306c80bf4232.gz
- finalize.cjs
- install.cjs
- installation.json
- pending-confirmation.cjs
- prepare.cjs
- range-ui.png
- REPORT_KO.md
- restart.ps1
- script-range.cjs
- script-range.js
- script-range.test.cjs
- selection-bridge.cjs
- selection-bridge.json
- selection-race.cjs
- verification.json

### records/workshop-native-layout-20261108 (19)

- before/054c21b6db86a3ebabfef6fba6ed2255f20b5081138fb89c99caabb2da5fd48e.gz
- before/1ee8c1bca0c86356bc0160c64598addb7e0143ce69776cf68bb09a6689066174.gz
- before/36ce4ef10af2affecd467388b56aaed6351de638b3d038a8f69c2122feacfa58.gz
- before/478ccf294b67ccc146912a5eacfa3f1dced45b20f950c43dabe4c5e843731ce6.gz
- before/4b31983625f6ad4df3310ebba7e9452bfe9d8663f82c9c98ffe2b8cafc2cf31b.gz
- before/a0c982018535ea9e92c64b0c5b526c995a93ba3fba15d0415cbd71a886d69bfb.gz
- before/c5f83a78ccc602a5aca2d5ffd96729f661700bef1515106ce76f74483b46f9ca.gz
- before.json
- build-workshop-layout.cjs
- finalize-workshop-layout.cjs
- install-workshop-layout.cjs
- installation.json
- native-layout.png
- PLAN_KO.md
- REPORT_KO.md
- verification.json
- workshop-native-layout.test.cjs
- workshop-ui.js
- workshop-ui.test.cjs

### records/workshop-flow-restore-20261108 (12)

- before/4c668b4fac36ba84d24d298bd75aa589149f799df31b175ce69da78b44c95682.gz
- before/718186dd60fe4928b2059f4f1cec1a9c0176036c0ebb692eb292e94c6fc0e52c.gz
- before/82130678226a8edd9afc103f6158de10962a6c267e3569f5a0a1f321fa22ba2c.gz
- before/c78e02e7972c82f01557d7e5b289e1cea5377d051857e4120f15098e6a3f5494.gz
- before.json
- installation.json
- PLAN_KO.md
- REPORT_KO.md
- restore-workshop-flow.cjs
- verification.json
- workshop-shared-flow.png
- workshop-shared-flow.test.cjs

### records/workshop-range-output-20261108 (11)

- before/0889e7a4e6fa98aa1174ef348a775d529cc43168b2e77f855d3602c26c0f08f0.gz
- before/38239329607020acdfcb3de37a9a80837267d3dd37204badd4c31830a0215bd8.gz
- before/8ce019072028101b61eb3590c510c1aa58d67bad57f80d2d18052e4ebe16ec0d.gz
- before.json
- fix-range-output.cjs
- range-output-preview.png
- range-output-proof.json
- REPORT_KO.md
- server-error.log
- server.log
- verification.json

### records/script-review-ui-20261108 (22)

- before/185b80095a340b297e45918c395972669c267087dbf536796c6ead29e71ab69f.gz
- before/44e12445569eb8fa0db54f900c123f6079dc30f7f73e66745addc42894a51981.gz
- before/54ac3478638a4d1d1b4d5336ce6b694a8a2815dd1d85fe3943d74eb8360f5de2.gz
- before/68eb3258458e67fcc1dd5a962aa42704b805836dde5ea0f22d3be30c573fcba2.gz
- before/b059390c8d7f85c494b9008639214701791b2b7c5fac0c9320a691532310a070.gz
- before/dd1524238836e5a2224cb31495759291de8151bc18a25892ecceaa7b3ea64092.gz
- before.json
- content-review.json
- inspect-script-review.cjs
- installation.json
- integration-script-review.cjs
- integration.json
- PLAN_KO.md
- REPORT_KO.md
- script-review-browser.json
- script-review-comparison.png
- script-review-preview.png
- server-error.log
- server.log
- USER_REVISION_GLORIA.txt
- USER_REVISION_GLORIA_2.txt
- verification.json

### records/script-inline-edit-20261108 (9)

- before/4c87cb300798afd89a41c5955ec8d7514ad53615f18a71a4644a283a43385665.gz
- before/99bd5d56dcd45b408fc7356eb13752c6ac9fb89e3309e819312ec23ab3025088.gz
- before/a42fa59a85e31f0409ef0e21c4b048cf7c04719aea546e01b0cca82ab8b6d151.gz
- before/f9c90b61095931c94c1446a44d126135610d8e9d8e389cee9cca2e2b4b634852.gz
- before.json
- inline-edit-patch.cjs
- REPORT_KO.md
- script-inline-edit.png
- verification.json

### records/script-route-lock-20261110 (31)

- before/installed/index.html
- before/installed/script-export.cjs
- before/installed/script-range.cjs
- before/installed/script-range.js
- before/installed/workshop-ui.js
- before/installed/workshop.css
- before/source/index.html
- before/source/range-output.test.cjs
- before/source/README.md
- before/source/script-export.cjs
- before/source/script-range.cjs
- before/source/script-range.js
- before/source/workshop-shared-flow.test.cjs
- before/source/workshop-ui.js
- before/source/workshop.css
- before-install.json
- checks/jo9-script-route-ui-branch-change-20261110.txt
- checks/jo9-script-route-ui-follow-red-20261110.txt
- checks/jo9-script-route-ui-green-20261110.txt
- checks/jo9-script-route-ui-red-20261110.txt
- checks/jo9-script-route-ui-reindex-red-20261110.txt
- PLAN_KO.md
- prepare-fixture.cjs
- regression.log
- REPORT_KO.md
- reproduce-samples.cjs
- route-proof.png
- sample-single-scene.txt
- sample-two-scenes.txt
- verification.json
- verify-install.cjs

### records/script-recheck-20261110 (7)

- approval-ready.png
- before/index.html
- before/inline-script-edit.test.cjs
- before/script-import-ui.js
- regression.log
- REPORT_KO.md
- verification.json

### records/script-game-layout-20261110 (16)

- before/index.html
- before/launcher.test.ps1
- before/script-import-ui.js
- before/script-review.js
- before/server.cjs
- before/Start-JO9-Tools.ps1
- before/workshop.css
- browser-fixture.cjs
- browser-verification.json
- game-ui-preview.jpg
- paper-ui-preview.jpg
- PLAN_KO.md
- regression.log
- REPORT_KO.md
- verification.json
- verify-css-deployment.ps1

### records/catalog-ui-20261108 (4)

- before.zip
- changes.json
- patch.py
- REPORT_KO.md

### records/catalog-native-tabs-20261108 (27)

- before/0addecfd98d41a32c7691f188ad1de412ab80520f0ae030800484a6c75be01f4.gz
- before/0c6aeb8670ced2b0ac17faa31493589d5d6fec06583dd18525af114175cd70f5.gz
- before/0dd7183e196550537b41f319a044e069d07ce37bebd484851fd4211a3e394b8b.gz
- before/2383b8c81574054e10dfa4a3e7a65a898262d19959b300d8fb7f0fe53b97d219.gz
- before/303d47884247a5d7e6124b6e9e2049aeb5609774041a804c303d47b7b230f0b9.gz
- before/336d8e17569345f20ee320bfad091c3fd405fd6e1ce2600cdd2dd9d668a71620.gz
- before/3a42844ba9b5b6e733050e8c48aafde9e7f41188a1ce9e945c9a8e15993e1689.gz
- before/4b1b446ba3986e7694de74d038bb927455926e09918943d2911b951f14d7cecc.gz
- before/4c761d1b0872154b1117e6bc29463a5fbf78eef1597b63db4a63b96076681c10.gz
- before/6808932298497fb72f776a930dec21670f5f6d00c86b0a02104fb3d922b8e6c1.gz
- before/983d1e2659da6b1903797b752f8f1523fc123c99a8c3bb198ce42ce93231c9ba.gz
- before/a5816a98ff7b857a1f2aab909501a819858566781d5563be9e535aee3dc46a02.gz
- before/b41ddfb04fed5a9015a47b6015872b31c163cb01c92b08d8431cc5a0153eabc3.gz
- before/c434cd8e5609ac88c82b4626af36e8ddbacd73591ad19767e6a74e1ecd38f1a4.gz
- build-native-tabs.cjs
- catalog-native-tabs.test.cjs
- catalog-tabs.cjs
- catalog-tabs.js
- catalog-tabs.test.cjs
- finalize-native-tabs.cjs
- followup.json
- install-native-tabs.cjs
- installation.json
- native-tabs.png
- PLAN_KO.md
- REPORT_KO.md
- verification.json

### records/catalog-action-notes-20261108 (3)

- REPORT_KO.md
- source-installation.json
- verification.json

### records/scene-condition-refresh-20261108 (6)

- catalog-0-before.html.gz
- catalog-1-before.html.gz
- install.cjs
- installation.json
- metadata.json
- REPORT_KO.md

### records/checklist-role-status-20261108 (15)

- before/04d8729d4378a40b2bd018861d5106b90309d394fa4f5e86b108a0e28d1a9fdb.gz
- before/18c492d1e514dcc2d8fd65767ad4a2b5d4a2c04818b10b89042fb9ecb9077849.gz
- before/4d5c7c936fbed9957f8a7367e5974a4888bbf57ef656e8921329109b3cdb0cb0.gz
- before/6f24475ae1f41733c4bbf2da5b0737883592c7112c3ebdc21d02c82a8ca8c363.gz
- before/735decb73d9ff084ef5a03351a0912a3d4cd3b0260f0818c20dc95182c919aa1.gz
- before/892bd2d38583319a47e8f2ae1e2bad1a77e27d7cafe4183796c6cc0734310963.gz
- before/9f5ca97778e1f22add9a9156df7b23362c7275ac5b96dedff10a4307d8156092.gz
- before/b077117ccc19b020f4cfdd3875675057ea5776b7dda973f790c306142346fa13.gz
- before.json
- browser-status.png
- fix-checklist-role-status.cjs
- install-checklist-role-status.cjs
- installation.json
- REPORT_KO.md
- verification.json

### records/character-image-links-20261108 (33)

- actual-availability.json
- audit-shiru-links.cjs
- before/094ad9533eeef93740d0e806fdd1a537e802ddce53c3a0c7800c39e3307df61a.gz
- before/1aa7ad2dfa268514e110ccea48287d2c9a578c6c2c5fbc203af2f1a84dffaa61.gz
- before/543a1fb0941145f50f6326e7af994552c32b49fd322cdec55e39988b4dccf3e4.gz
- before/54c0e92247a5eb89ae48eaa91fdc14e51410564e4f66dc66aa62f41cd4cb4cf2.gz
- before/8d2c7fb0c736ff344ae260346f0b800c63263aa9a0d120c577d5f334c60cf80e.gz
- before/926b8ca15c24a164b78ef85b608db8f91147418415ff820bae03457d418c3011.gz
- before/a4bf23974c7ee1d18e4b2100a38b2f79553c7c59bbe54df5d6e4ac46bcc430b1.gz
- before/ab254fe51b889e8d900adeaffb443d522bd03d88ebe22caad065bc9ad422c1c3.gz
- before/c1c2e00d7f63747e7520f0ea927175b33c250f642c43d1cb556a29606135ba60.gz
- before/d1ee370dbdefe735bfc449f82489fa2f700012b496b723a0e9509e8a7f1a4476.gz
- before/e8b3abd6ef6a00243bf7ff5a065d3721699702911d261c142f9123943ce21e94.gz
- before/fddf67831381347c700f0bb1c1acd933941e999525a48e6f26fa0d232a05b605.gz
- browser-file-picker.png
- character-image-links-plan.md
- checklist-link-picker.test.cjs
- checks.txt
- client-results.json
- finalize-character-link-data.cjs
- finish-character-image-links.cjs
- install-character-image-links.cjs
- installation.json
- live-read.json
- native-character-image-links.cjs
- native-results.json
- plan.json
- preview-character-image-links.cjs
- REPORT_KO.md
- shiru-audit.json
- stage-character-image-links.cjs
- verification.json
- verify-live-character-links.cjs

### records/character-path-rules-20261109 (12)

- before/75ce24eb9b5c68b759862dc67aa73ac695a87da9b3dade0d4fc4db2694de0dc1.gz
- before/9984edda426d6ecc348f69595e9f0f56df924798b04c85b28cabcee236ba37f3.gz
- before/b4f171f53404d4c073ec2cba5f26224858817bdfedb48582a60e246f38d70f2f.gz
- browser-check.cjs
- browser-result.json
- install.cjs
- install.json
- PLAN_KO.md
- REPORT_KO.md
- verification.json
- verify-install.cjs
- warnings-fixture.png

### records/pelageya-group-gloria-list-20261109 (15)

- before/193e4641797625d301d5bdbd1f2d0d5c5cabb0b394f47523d8df29d97e860b1a.gz
- before/566b4cb0b13dec79c7abbf5d7dca00d4d6b5d2dde75a691c8f7650e3bb3d447c.gz
- before/69c4abc9611d6538ddb8875391d1ef151bea7c151f83e3ea771325779358b05b.gz
- before/838e899dcb1d2a2c659ac54c449b24275ddc6818d6c509a61f9fb375b2c746b2.gz
- before/926b8ca15c24a164b78ef85b608db8f91147418415ff820bae03457d418c3011.gz
- before/9f861199b8db50025f4fd3078d6e93822c60f4e02247d28ad8159843b737a50e.gz
- before/aac59e449bc2b5596049b79001002292cb34096a93e1014f6081f37c933ef448.gz
- before/d6a793b0a72d9deeef5265ca1eb1f57354a820ab776eb01be9a09a5499e65420.gz
- checks.txt
- gloria-list.png
- install.json
- live-records.json
- pelageya-group.png
- REPORT_KO.md
- verification.json

### records/new-image-path-20261108 (12)

- before/2060b658fdc77fb50ff3baef7bc83f75cbd36130495cc84b640a29cbe53918ec.gz
- before/f53ac4ec2a156bb93f20fcc4824f3d5df314b29154880d54c86df7b2d1dea24d.gz
- browser-folder-picker.png
- checks-0.txt
- checks-1.txt
- install-new-image-path.cjs
- new-image-path-plan.md
- plan.json
- preview-new-image-path.cjs
- REPORT_KO.md
- stage-new-image-path.cjs
- verification.json

### records/dialogue-image-20261108 (17)

- before/47252255a273d1cfde8d9f8cb2348f9eeb9cd3530dc1eaa4e2c56bb14da23eac.gz
- before/a018c316c9fc3f7cc8b64369e01942db2a225399ce61f8198ff47ecb29e3e6dc.gz
- before/c04ebea69ce328af1ebb53b363ad1c31c76ffd3fb2934f900f496602e1d80aee.gz
- before/fdcc655fa76eefc52ff764b7c80f9c897b2fc348d9709ffbd0ae3633f6622d68.gz
- browser-preview.png
- checks.txt
- dialogue-image-plan.md
- inspect-dialogue-image-work.cjs
- install-dialogue-image.cjs
- native-results.json
- plan.json
- prepare-dialogue-image-native.cjs
- REPORT_KO.md
- server-pid.txt
- stage-dialogue-image.cjs
- verification.json
- work-probe.json

### records/image-reference-20261109 (16)

- before/031b5211489c56d232a9af57de89f48b184fb1663702f90fd9670420d892f496.gz
- before/05212c868bc4df4480fc4950d25ce5a43537f376062d942e90bbe110045b24a1.gz
- before/08f6dd16ad1e62f0842c768a5d2545a983f5944261276669543ead171532199d.gz
- before/0b809094ad32cade91bc11e22c22476000b0be2025d9950031b1ade63d459436.gz
- before/3d548f72bd272e8482bc21f7d19afb7318855a07abd02fa8d61d9857347010fa.gz
- before/7c23bcd30269cf20fb79ca5e2af5d4f742345d9b6edc5b7e0833b89cdcd2f5f9.gz
- before/87a758732f23e58eb749c39cf97a4c28a4b55650990827808a7869aa5b5a32e5.gz
- before/fa9c8b1ec2a3c8874797c1e85c47bd179a2df75bfab2ae7a3423ff04d1d49e98.gz
- browser-conditions.png
- checks.txt
- install.json
- mod-replay.txt
- native-results.json
- prepare-reference-qa.cjs
- REPORT_KO.md
- verification.json

### records/catalog-sync-20261109 (20)

- approved-b-and-preflight.json
- before/1cba7c555af763bf78b1f62c26a13ed4970ab3c869ff48899b13f28de8810125.gz
- before/5a7f1a2fe2a2ae6690f52440d00ee89b5937188acf42112c0be505f1ae8bd842.gz
- before/82b93cec5a8f97980feeb036d7d87be869716e1e16ef3cad9728d6a7647dd0f0.gz
- before/8e228ba875c24fabca2a9e549f6d92d067e972d75db9cd84e11bcdb863548b53.gz
- before/b3c9763c43b337274da76b730b51e0828c9de8f8565e22f4e7c9cf475c089b03.gz
- before/ca93db5771262d19e337df7c8afb361e8ed0240f9f0ee7561e0e379ee2361445.gz
- before/d0361424c429ca9eaadd96d56bf429c0729bd2ecbb080c8ba3fc771e3d68c5a2.gz
- before/db951e25175eaf765dbdcf9bc76cb1bc5986d158b6856f829544bcb1ddaaf0c6.gz
- before/fbd4e9cc5432a9548015b7274dd97612ee1582601ffba4d916343b15c87c9881.gz
- checks.txt
- install.json
- merge-plan.json
- merge-result.json
- recovery-plan.json
- REPORT_KO.md
- source-sync.json
- status-after.js.gz
- sync-complete.png
- verification.json

### records/additional-pack-work-preview-20261108 (4)

- installation.json
- REPORT_KO.md
- task.cjs
- verification.json

### records/portrait-sync-20261108 (20)

- audit.py
- borders.py
- cleanup.json
- extra_frames.py
- findings.json
- finish.py
- frame_screen.py
- inspection.csv
- install.py
- installation.json
- match.py
- plan.json
- prepare.py
- record.cjs
- REPORT_KO.md
- search.py
- search_by_pixels.py
- search_compare.py
- track.cjs
- verification.json

### records/sound-file-picker-20261108 (3)

- installation.json
- REPORT_KO.md
- verification.json

### records/sound-adoption-20261108 (14)

- decision.test.cjs
- finish.cjs
- installation.json
- JO9_사운드_설정 (4).json
- prepared.json
- REPORT_KO.md
- selection.json
- staged/approved-selections.json
- staged/audio-library.cjs
- staged/browser.js
- staged/build.cjs
- task.cjs
- tests.log
- verification.json

### records/sound-candidate-refresh-20261108 (3)

- baseline.json
- REPORT_KO.md
- settings3-audit.json

### records/game-reference-refresh-20261108 (34)

- before/043c351fa91994b4336c31c909ad18ba437086371fe38b5edc13569bd053d820.gz
- before/10800911af6bf6875d9a63a5aaa0058feedc8fd65f87e00b7a2f2fafa5187402.gz
- before/2a36cd959e1530d6a208bd44ce710d1b1133f8514a52719383c32de5cd5b6b78.gz
- before/2bc77b8bd49cafe101803758e243fb4766f474898cb41984d382a640d3e195c8.gz
- before/419054e61f3de8651ec98bf3cb9ce26bed81f32047a21527f7822e541746df80.gz
- before/44bb936694755fe439209057d990c0c91aec5c1e47ce3e577800184e8d51a581.gz
- before/5408d683c57bf403c049efff3bd1b4db6f2eacabf4d0e30827de3bf3d88cc626.gz
- before/5b3cc315e796f030425779fa24ee38704d4e13023186bbab26cdd989c56a6b88.gz
- before/5e5e209e87e5f1bba8d4d938a38a7a4b8b5aca757e4d5753990162c8fbb69215.gz
- before/5ef011fbcf3929729640031e4595f50449371cdf9c74ce81f4fb675f658d3672.gz
- before/60f206b13a999b9e6d241386cdd4e60fd28abaca295732ec875cefb95640e770.gz
- before/6a3c51278df5992e6b8139f67d7ae6c7578e6bd314f25c894e95680f3356f460.gz
- before/6dad1002522b1ec33680033affab8e82142e84c9d0a43feae0c908e7d811eb0b.gz
- before/72572e29cd48077a4fff154c289406ee19ad19cc5d21bb428be475fb53a065bc.gz
- before/745daff3de1302c1d2fa73eaa8f695526222e25b6dc8eb890195255757e412be.gz
- before/78c4b2ca2c42f3b2578b6178113541f9cf40a498f17b1f35d41f6ee750f77758.gz
- before/79215c0925ebd977c56c5a0eb8fb21f0f9f61f32a754b14ba34405000aa2e137.gz
- before/a652bcdb2f407af793603ae2f68c30a6a7a8add15d5f2391b0df719aadf62f9e.gz
- before/b18fd36672f097704a3f4df8ff409a1ad3c680c18841a7cab70925e35ed22dd4.gz
- before/c910f419ae9fe7edd7df6c08b477ef54e281fd08c73e61611a84464478021db8.gz
- before/eb019a7adde6de29549a8a9fc755c7f10732e7ec3dcc65e6070eb273612aa197.gz
- before/f432cdfc72499dcfdbc9104c6b50cadf56813a6f98b034a8814057e7bafb30b1.gz
- before/f4f732194fc01ecb27127e7368c24b1eae255f1928263a0a8ef99f75c21d4f12.gz
- before/f9a1cc4e16f3cdfdfd9171953cc8ecd8759b5f25784977d4a660fce9e77cb8db.gz
- before/fc80b72b781332094ab917ed43fc896850ded76f4723622a7279133de1eaf282.gz
- finish.cjs
- install.cjs
- installation.json
- package-verification.json
- package.py
- prepare.cjs
- reference-current.jpg
- REPORT_KO.md
- verification.json

### records/game-reference-ideas-20261111 (9)

- install.cjs
- installation.json
- PLAN_KO.md
- reference-ideas.png
- REPORT_KO.md
- source-preconditions.json
- test-results.txt
- verification.json
- verify-install.cjs

### records/game-reference-enemies-20261111 (12)

- before/assemble.cjs
- before/jo9-reference.html
- before/README.md
- before/reference-template.html
- before/snapshot.json
- before.json
- enemy-reference-tab.jpg
- qsp-scope-check.json
- REPORT_KO.md
- ui-validation.json
- validation.json
- verify.cjs

### records/enemy-special-reference-20261111 (15)

- before/enemies-data.cjs
- before/enemies-ui.js
- before/enemy-traits-catalog.cjs
- before/enemy-traits.json
- before/ENEMY_TRAITS_KO.md
- before/jo9-reference.html
- before/README.md
- before/snapshot.json
- before.json
- check-and-install-reference.cjs
- cleanup.json
- enemy-special-table.jpg
- REPORT_KO.md
- ui-validation.json
- validation.json

### records/game-reference-mobs-20261111 (13)

- before/assemble.cjs
- before/jo9-reference.html
- before/README.md
- before/reference-template.html
- before/snapshot.json
- before.json
- check-and-install-reference.cjs
- cleanup.json
- mob-information.png
- regression.log
- REPORT_KO.md
- ui-validation.json
- validation.json

### records/workshop-batch-frame-20261111 (19)

- batch-frame-ui.png
- browser-results.json
- browser-tests.log
- catalog-batch-frame-ui.png
- http-verification.json
- REPORT_KO.md
- tests.log
- verification.json
- workshop-batch-frame-ui.test.cjs
- workshop-batch-frame.js
- workshop-batch-frame.test.cjs
- workshop-frame-browser.cjs
- workshop-frame-core-edit.cjs
- workshop-frame-finalize.cjs
- workshop-frame-http.cjs
- workshop-frame-install.cjs
- workshop-frame-pixels.test.cjs
- workshop-frame-ui-edit.cjs
- workshop-preserve-new-path.cjs

### records/slave-portrait-frame-20261111 (9)

- backend-installed.json
- catalog-installed.json
- preview-dialog.jpg
- REPORT_KO.md
- source-installed.json
- ui-final-installed.json
- verification.json
- verify-install.cjs
- yasmin-audit.json

### records/json-character-discovery-20261111 (11)

- before.json
- http-verification.json
- install.cjs
- installation.json
- inventory-tests.log
- REPORT_KO.md
- test-results.json
- tests.log
- verification.json
- verify-http.cjs
- verify.cjs

### records/claude-stability-fixes-20261110 (32)

- cleanup.json
- core-engine-original-report.json
- core-engine-version-followup.json
- install.json
- qsp/apply.log
- qsp/generate-mods.cjs
- qsp/generate-tests.cjs
- qsp/hash-chain.json
- qsp/idempotent.log
- qsp/native-baseline/duty-energy-stderr.log
- qsp/native-baseline/duty-legacy-stderr.log
- qsp/native-baseline/duty-priority-stderr.log
- qsp/native-baseline/duty-set-stderr.log
- qsp/native-baseline/refund-hard-stderr.log
- qsp/native-baseline/refund-normal-stderr.log
- qsp/native-baseline/sound-report-stderr.log
- qsp/native-baseline/sound-route-stderr.log
- qsp/native-baseline-results.json
- qsp/native-fixed/duty-energy-stderr.log
- qsp/native-fixed/duty-legacy-stderr.log
- qsp/native-fixed/duty-priority-stderr.log
- qsp/native-fixed/duty-set-stderr.log
- qsp/native-fixed/refund-hard-stderr.log
- qsp/native-fixed/refund-normal-stderr.log
- qsp/native-fixed/sound-report-stderr.log
- qsp/native-fixed/sound-route-stderr.log
- qsp/native-fixed-results.json
- qsp/scope-results.json
- qsp/verify.cjs
- REPORT_KO.md
- resource-verification.json
- verification.json

### records/scene-home-catalog-20261110 (18)

- catalog-before/catalog_merge_vs_original.html.gz
- catalog-before/catalog_status.js.gz
- catalog-before/catalog_work_codes.js.gz
- catalog-before/catalog_work_ids.json.gz
- catalog-before/events.jsonl.gz
- catalog-before/progress.json.gz
- catalog-before-interiors/catalog_merge_vs_original.html.gz
- catalog-before-interiors/catalog_status.js.gz
- catalog-before-interiors/catalog_work_codes.js.gz
- catalog-before-interiors/catalog_work_ids.json.gz
- catalog-before-interiors/events.jsonl.gz
- catalog-before-interiors/progress.json.gz
- register-batch.cjs
- register.cjs
- register_interiors.cjs
- registration.test.cjs
- REGISTRATION_RESULT.json
- REGISTRATION_RESULT_interiors.json

### records/work-image-source-sync-20261110 (3)

- audit.json
- REPORT_KO.md
- sync.cjs

### records/cow-costume-20261111 (18)

- apply.log
- cow-costume-build.cjs
- cow-costume-db.test.cjs
- cow-costume-install.cjs
- cow-costume-native.cjs
- cow-costume.test.cjs
- db-test.log
- helper.qsp.txt
- jo9-cow-costume.qsp.txt
- native-costume.log
- native-results.json
- reapply.log
- red-tests.log
- replay-again.log
- replay.log
- REPORT_KO.md
- verification.json
- wasm-tests.log

### records/equipment-descriptions-20261111 (14)

- apply.log
- before/items.input.json
- before/items.json
- before/jo9-reference.html
- before/README.md
- before/runtime-source-2.4.1.json
- before/snapshot.json
- before.qsp.gz
- changes.json
- idempotence.log
- replay.log
- REPORT_KO.md
- task.cjs
- verification.json

### records/unique-traits-20261112 (29)

- apply.log
- before/3040_chunhyang.json
- before/extract-traits.cjs
- before/jo9-reference.html
- before/runtime-source.json
- before/snapshot.json
- before/traits.json
- before.qsp.gz
- cleanup.json
- idempotence.log
- instrumentation-candidate.json
- instrumentation-installed.json
- instrumentation-red.json
- native-candidate-stderr.log
- native-candidate.json
- native-installed-stderr.log
- native-installed.json
- native-red-stderr.log
- native-red.json
- prepared.json
- replay.log
- REPORT_KO.md
- runner-candidate.log
- runner-installed.log
- runner-red.log
- save-candidate.json
- save-installed.json
- task.cjs
- verification.json

### records/chunhyang-profile-20261112 (48)

- apply.log
- approved-background.cjs
- approved-prepared.json
- background-approved.json
- before/3040_chunhyang.json
- before/runtime-source.json
- before-background-approval.json
- before-final.qsp.gz
- before.qsp.gz
- candidate-character.json
- candidate-combat-stderr.log
- candidate-generation-stderr.log
- candidate-profile-stderr.log
- champion-approved.json
- check-clean.cjs
- cleanup.json
- extract.log
- final-apply.log
- final-idempotence.log
- final-prepared.json
- final-replay.log
- final-verification.json
- finalize.cjs
- finish-records.cjs
- idempotence.log
- installed-combat-stderr.log
- installed-generation-stderr.log
- installed-profile-stderr.log
- instrumentation-candidate.json
- instrumentation-installed.json
- instrumentation-red.json
- native-candidate.json
- native-installed.json
- native-red.json
- prepared.json
- profile.json
- red-combat-stderr.log
- red-profile-stderr.log
- reference-verification.json
- replay.log
- REPORT_KO.md
- runner-candidate.log
- runner-installed.log
- runner-red.log
- save-candidate.json
- save-installed.json
- task.cjs
- verification.json

### records/chunhyang-club-20261112 (89)

- baseline.json
- baseline.qsp.gz
- candidate-acquisition-stderr.log
- candidate-battle-stderr.log
- candidate-initial-low-stderr.log
- candidate-periodic-stderr.log
- candidate-round-stderr.log
- candidate-rules-stderr.log
- candidate-settlement-stderr.log
- chun-battle.qsptxt
- chun-club.qsptxt
- cleanup.json
- club-build.cjs
- club-finalize.cjs
- club-install.cjs
- club-integration.cjs
- club-records.cjs
- club-task.cjs
- club-tests.cjs
- code-map.json
- installed-acquisition-stderr.log
- installed-battle-stderr.log
- installed-initial-low-stderr.log
- installed-integration-cm-death-stderr.log
- installed-integration-defend-turn-stderr.log
- installed-integration-engine-start-stderr.log
- installed-integration-exit-loss-stderr.log
- installed-integration-exit-win-stderr.log
- installed-integration-legacy-route-stderr.log
- installed-integration-menus-stderr.log
- installed-integration-potion-turn-stderr.log
- installed-integration-regular-start-stderr.log
- installed-integration-regular-win-stderr.log
- installed-integration-style-back-stderr.log
- installed-integration-weapon-chooser-stderr.log
- installed-integration-weapon-turn-stderr.log
- installed-periodic-stderr.log
- installed-round-stderr.log
- installed-rules-stderr.log
- installed-settlement-stderr.log
- instrumentation-candidate.json
- instrumentation-installed-integration.json
- instrumentation-installed.json
- instrumentation-integration.json
- integration-cm-death-stderr.log
- integration-defend-turn-stderr.log
- integration-engine-start-stderr.log
- integration-exit-loss-stderr.log
- integration-exit-win-stderr.log
- integration-legacy-route-stderr.log
- integration-menus-stderr.log
- integration-potion-turn-stderr.log
- integration-regular-start-stderr.log
- integration-regular-win-stderr.log
- integration-style-back-stderr.log
- integration-weapon-chooser-stderr.log
- integration-weapon-turn-stderr.log
- native-candidate.json
- native-installed-integration.json
- native-installed.json
- native-integration.json
- native-red.json
- official-idempotence.log
- official-replay.log
- patch-schedule.before.json.gz
- prepared.json
- progress.md
- red-red-stderr.log
- reference-before/enemies-data.cjs
- reference-before/extract-traits.cjs
- reference-before/jo9-reference.html.gz
- reference-before/mobs-data.cjs
- reference-before/mobs-ui.js
- reference-before/README.md
- reference-before/snapshot.json
- reference-before/traits.json
- reference.json
- replay.json
- REPORT_KO.md
- resources.json
- review.json
- runner-candidate.log
- runner-installed-integration.log
- runner-installed.log
- runner-integration.log
- runner-red.log
- runtime-source.before.json
- verification.json
- work-apply.log

### records/chunhyang-random-finish-20261113 (33)

- assets_runtime-source-2.4.1.json.before.gz
- baseline.qsp.gz
- candidate-lowinit-stderr.log
- candidate-lowinit-stdout.log
- candidate-normal-stderr.log
- candidate-normal-stdout.log
- candidate-rounds-stderr.log
- candidate-rounds-stdout.log
- candidate-specials-stderr.log
- candidate-specials-stdout.log
- chun-random-build.cjs
- chun-random-close.cjs
- chun-random-install.cjs
- chun-random-native.cjs
- chun-random-task.cjs
- DESIGN_PLAN_KO.md
- native-candidate-instrumentation.json
- native-candidate-report.json
- native-red-instrumentation.json
- native-red-report.json
- official-idempotence.log
- official-replay.log
- plan.json
- prior-b-reference-catchup.json
- red-lowinit-stderr.log
- red-lowinit-stdout.log
- reference-assemble.log
- REPORT_KO.md
- review.json
- tools_game-reference_jo9-reference.html.before.gz
- tools_game-reference_mobs-data.cjs.before.gz
- verification.json
- work-apply.log

### records/handoff-b-combined-20261112 (67)

- baseline.qsp.gz
- CANDIDATE_STYLE_DIFF.json
- cleanup.txt
- combined-generation-fourth-error-ui.json
- combined-generation-fourth-win32-window-text.txt
- final-audit.json
- full-generation-prepared-baseline.json
- full-generation-prepared-candidate-fifth.json
- full-generation-prepared-candidate-first.json
- full-generation-prepared-candidate-fourth.json
- full-generation-prepared-candidate-second.json
- full-generation-prepared-candidate-sixth.json
- full-generation-prepared-candidate-third.json
- full-generation-prepared-candidate.json
- full-generation-static.json
- FULL_GENERATION_VALIDATION_KO.md
- handoff-b-apply.cjs
- handoff-b-close.cjs
- handoff-b-combined.cjs
- handoff-b-final-audit.cjs
- historical-942bcadf/FULL_GENERATION_VALIDATION_KO.md
- historical-942bcadf/initial-six-native-results.json
- historical-942bcadf/native-fifth-stderr.log
- historical-942bcadf/native-first-stderr.log
- historical-942bcadf/native-fixed-baseline-stderr.log
- historical-942bcadf/native-fourth-stderr.log
- historical-942bcadf/native-integration.json
- historical-942bcadf/native-second-stderr.log
- historical-942bcadf/native-sixth-stderr.log
- historical-942bcadf/native-third-stderr.log
- historical-942bcadf/timeout-second-error-ui.json
- initial-six-native-results.json
- manifest.before.json.gz
- native-fifth-stderr.log
- native-first-stderr.log
- native-fixed-baseline-stderr.log
- native-fourth-stderr.log
- native-integration.json
- native-second-stderr.log
- native-sixth-stderr.log
- native-third-stderr.log
- official-idempotence-final.log
- origin-growth-input.cjs
- origin-growth-module.cjs
- origin-growth-native.cjs
- plan.json
- pr-comment-final.json
- PR_COMMENT_FINAL_KO.md
- REPORT_KO.md
- run-native-with-error.ps1
- seed-source-manifest.json
- six-initial-client-results.json
- STATUS_KO.md
- style-deferred-check.cjs
- style-deferred-client-results.json
- style-deferred-fixture-metadata.json
- style-deferred-fixture.cjs
- style-deferred-style-interop-stderr.log
- style-deferred-style-interop-stdout.log
- style-interop-final.json
- summarize-full-generation.cjs
- timeout-second-error-ui.json
- traits-description-edits.json
- traits.before.json.gz
- USER_DECISIONS_KO.md
- verification.json
- verify-full-generation.cjs

## Git coverage

공개기준: 1c3f76ddcf5c8da0a92cea1908ef3cdb1627af4f. 도구 변경파일명과 현재미커밋 파일명 전체는 JSON에 있다.

- 545f8d1d 2026-11-11T04:20:07+09:00 WORK 안정성 수정·모드툴 개선과 최신 변경내역 정리
- 607c7ec6 2026-11-10T10:34:02+09:00 개인실 인테리어 4단계·효과·식단 재설계·장면 배경·알바 물건 문장
- 174e2dbb 2026-11-10T05:49:55+09:00 Private-room duty texts, street goods, sounds, scene registration, character tool
- f2c86c3c 2026-11-10T04:44:25+09:00 Add 2026-11-10 Claude handoff (private-room duties, ledger, scenes, character tool)
- 72923a8c 2026-11-10T04:33:14+09:00 Private-room maid duties, decade ledger, page hotkeys, street_empty scene
- f26e49db 2026-11-09T13:56:23+09:00 Rumor system: always charge fee, no meta lines, Skups Gloria hint; remove Gloria test button
- bf6b6fe2 2026-11-09T13:47:09+09:00 Warn when character image folders differ from placement rules
- 6729ef98 2026-11-09T09:46:01+09:00 Fix image reference editing, catalog sync and shared character images
- a349a506 2026-11-09T00:40:52+09:00 Record the 2026-11-09 bulk commits in the handoff docs for Codex
- 96e58b9b 2026-11-09T00:39:36+09:00 Commit pending workshop and image-checklist tool work
- 10d3e960 2026-11-09T00:39:15+09:00 Add Gloria quest, broker brothel offer, hotkeys and related game fixes
- e7e4b11a 2026-11-08T15:31:15+09:00 Judge assistant daily devotion by her own duties; fix alchemy-off line
- a0d25e4b 2026-11-08T14:36:10+09:00 Sync WORK updates and native modtools; hand off to Claude
- 2436b52a 2026-11-08T03:51:04+09:00 Fix blank objectives tab caused by apostrophe in quest-list comment
- 328169ed 2026-11-08T01:53:49+09:00 Add script export/import editor, special-client journal and Dumak fixes
- 717a9da6 2026-11-08T01:53:38+09:00 Preserve 2026-11-07 next-patch schedule tools and notes
- c324ded3 2026-11-08T01:13:10+09:00 records: JO9 오프라인 모딩 작업실과 인계 보관
- f02a8d35 2026-11-07T14:45:03Z records: 다음 패치 작업 일정판(2026-11-07) 보관
- 336bff54 2026-11-07T14:23:46+09:00 Update BGM reuse policy and sound audition handoff

## 검증 한계

- 이번 감사는 기록·코드·파일의 읽기 전용 대조다. 과거 기능검사를 다시 실행하지 않았으며 현재 브라우저/엔진 전체 PASS를 뜻하지 않는다.
- 운영도구 실제쓰기·게임화면·개인SAV·청감·최종Full/ZIP은 이번에 검사하지 않았다.
- 관찰시점 차이는 부모Q04후속작업 결과로 해소여부를 별도연결한다.
- 항목수에는 대체/보류/메타데이터/검증근거가 포함되므로 신규기능수로 합산하지 않는다.

[기계처리용 상세 JSON](tools-audit.json)에 원래H100~168행 전체·현재정정층·파일SHA·차이·coverage를 보존했다.

외부도구로그 추가coverage: G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl (실제save line21/37 기술메타데이터).
