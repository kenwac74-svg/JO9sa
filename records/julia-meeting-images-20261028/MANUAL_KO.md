# 줄리아 재회 이벤트 이미지 — 구현·저장 호환·검증·복구

## 승인 내용과 원인

사용자가 승인한 대상은 조니의 화이트타운 줄리아 재회 이벤트에서 도나도나 캐릭터가 나오는 문제다. 기존 `interaction_city=163`은 action3/16/18에서 alyce, action15/17에서 kuma를 지정했다. 해당 화면은 대사 화자 자체가 아니라 현재 장면의 NPC와 참고 정보를 표시한다. 대사상3·15·18은 줄리아,16·17은 요한나다.

이벤트의 NPC 지정5곳을 `julia`와 `johanna`로 고친다. 대사·진행·배경·옷·인물 생성·교환·획득 처리는 유지한다. 정상적인 다른 이벤트를 위해 alyce/kuma 그림이나 전역 NPC 매핑은 바꾸지 않는다. 기존 `characters/julia.png`와 `johanna.png`가 실제795×596 PNG이며 해당 NPC로 등록되어 있음을 확인했다. 새 이미지를 만들거나 원본을 덮어쓰지 않는다.

## 기존 중간 저장

`$special_action`과 현재 `$npc_id`는 저장에 남을 수 있다.4~14페이지에는 별도 action이 없어 앞 페이지의 잘못된 NPC가 계속 남을 수도 있다. 따라서 생성 부분의5개 ID만 바꾸는 것으로 끝내지 않는다.

`interaction_screen_city`에서 기존 `_layout` 뒤, 원래 action 실행 전에 이벤트163에 한정하여 저장된 action5개의 정확한 옛 NPC 대입문만 치환한다. 현재 NPC도 실제 alyce/kuma일 때만3~15·18페이지는julia,16~17페이지는johanna로 바꾼다. 그 뒤 기존 action을 원래 순서대로 실행한다. 다른 ID로 지정된 사용자 action과 다른 이벤트는 바꾸지 않는다.1~2페이지의 현재 NPC 결정은 기존 action을 따른다.

`$ongload` 끝에는 현재 화면이 `interaction_screen_city`, 이벤트가163, 페이지가3~18이고 NPC가 옛 alyce/kuma인 경우에만 같은 renderer를 다시 그리는 조건을 추가한다. 기존 로드 처리는 먼저 마친다. `interaction_city=163` 생성 분기로는 돌아가지 않는다. 이 분기는 줄리아를 생성·교환하므로 중간 저장 복구에 재호출하면 기존 인물을 덮을 수 있다.

## 입력·출력·부수 효과

새 함수·로케이션·저장 변수는 없다. 기존 event163 호출은 `$special_action`5개에 맞는 NPC 대입문을 넣는다. renderer의 입력은 기존 `interaction_city`, `txt`, `$npc_id`, `$special_action`이고 출력은 교정된 같은 NPC 참조와 기존 방식의 화면 HTML이다. 알려진 옛 action 문구와 NPC 참조만 바꾼다. 현재 인물·대사·페이지·보상·관계 플래그는 수정하지 않는다.

로드 조건의 입력은 기존 `$curloc`와 위 상태값이며, 조건에 해당하면 기존 renderer로 GT한다. 별도 반환값이나 영구 수리 버전 키는 없다. 반복 렌더에서도 이미 교정된 참조는 그대로다. 사용자 지정 다른 NPC는 자동으로 줄리아/요한나에 덮어쓰지 않는다. 기존 세이브 파일 자체를 편집하지 않으며, 이후 사용자가 저장하면 교정된 기존 action/ID가 함께 저장된다.

## 코드와 의존성

선언형 명세 `2026-10-28_julia_meeting_npc_images.json`의7개 편집은 기존3로케이션만 대상으로 한다.

| 위치 / 마커 | 역할 |
|---|---|
| `interaction_city`, `JULIA_MEETING_NPC_3/15/16/17/18_20261028` | 신규 이벤트 action5개의 NPC 참조 교정 |
| `interaction_screen_city`, `JULIA_MEETING_SAVED_ACTIONS_20261028` | 옛 action5개와 현재 잘못된 참조를 표시 전에 교정 |
| `$ongload`, `JULIA_MEETING_LOAD_REDRAW_20261028` | 잘못된 중간 저장 화면만 renderer로 재진입 |

기존 `$julia_meeting`, `$special_action`, `_layout`, NPC 등록과 이미지 표시를 재사용한다. 저장된 대사 배열을 다시 복사하지 않는다. `julia/johanna`는 `#npc_base`의 기존 등록값을 쓴다. 표시기에 로마 인물 전신 이미지를 연결하는 기존 규칙을 유지한다.

생성부 ID만 되돌리면 새 이벤트에 잘못된 ID를 넣지만 renderer가 다시 교정하므로 제거할 때는 이 패치 전체를 함께 판단해야 한다. renderer 수리를 제거하면 옛 저장의 남은 action·페이지 참조가 다시 잘못 보일 수 있다. 로드 재표시만 제거하면 다음 페이지 전환 전까지 저장 당시 화면이 남을 수 있다. 인물 생성 분기를 재호출하는 대체 복구는 사용하지 않는다.

## 적용과 재현

기준 QSP는 `3fbdb2cca0e3eb2d4a70c2f9b442f2fb39bb756f1aefe6217cf8c10668f1106c`, 후보는 `f0911bef8f53ef1464edc3d107beccaca3af90c7f0368a4b7df92f7a6082e1b2`다. WORK에만 적용한다. 기존 사용자 세이브·배포용 게임·PNG·엔진·CSS·JS·ZIP·커밋·푸시는 변경하지 않는다. 적용 여부·자동 백업과 보호 해시는 `installation.json`을 따른다.

`build.cjs`의 첫 인수로 적용 직전 백업을 주면 변경 JSON을 다시 생성할 수 있다. 명세 재생과 정확한 역적용을 검사했으며 다른 본문·수동 변경은 그대로다. 공식 검사의 `--mods-dir`에는 이 패치 하나만 지정한다. 기능 재현 스크립트와 기준 경로 지정법은 `tests/REPORT_KO.md`에 남긴다.

## 검증과 한계

수정 전 실제 event163의 action3 실행에서 기대julia가alyce인 실패를 확인했다. 검사에서는 인물 생성만 성인 대리 인물로 격리해 재생성·교환 호출 수를 측정하고, 장면 대사는 합성 문자열을 사용한다. 실제 renderer·action·로드 분기의 실행과 인물23묶음·목록·페이지·대사 보존을 구분해 확인한다. 정확한 실행 조건·합성 저장 여부·stub·GUI 미검사 범위는 `tests/REPORT_KO.md`를 따른다.

표시·중간상태105조건, 비대상·사용자참조21조건과 실제 load-tail GT→renderer 실행은 통과했다. 여섯 역할의 인물23묶음과 대사·목록이 유지됐다. 추가 실험 `native-load`는 새로 만든 합성 옛SAV를 OPENGAME으로 열 때 `Could not open file` 이후 완료 마커 timeout이 발생했다. 따라서 실제 저장 파일 로더와 전체 로드 과정은 검증 완료로 적지 않는다. [QSP 공식 명령 문서](https://dev.qsp.org/docs/language/qsp-keywords/qsp-keywords-statements/)의 OPENGAME 정의를 대조했지만, 이 설치 엔진·진단 저장의 파일 열기 실패 원인은 이번에 확정하지 않았다. 이 추가 실험 실패는 제품 표시 검사의 성공과 별도로 로그·결과에 보존한다. 이 문제를 이유로 엔진이나 사용자 세이브를 수정하지 않는다.

공식 문법 관련 구조·줄/주석 경계·바이트 왕복·패치 재생·멱등성과 설치 엔진 공통9경로는 `official-report.json`에 기록한다. 모든 동적 QSP 분기·전체 플레이·개인 세이브 GUI 로드를 증명하는 검사는 아니다. 이미지 두 파일은 육안으로도 확인했지만 실제 게임 창의 모든 시각 배치 검사와 구분한다.

## 복구와 정리

게임을 종료한 뒤 `installation.json`에 기록된 자동 백업을 WORK `jack.qsp`로 복원할 수 있다. 이 이유로 사용자 세이브를 삭제하지 않는다. 변경 명세·핵심 보고·스크립트·로그·백업은 보존한다. 재생성 가능한 진단 QSP·후보·복제 JSON은 검사 후 절대 경계를 확인하여 정리하고 링크·세이브·백업은 보존한다. `cleanup.json`에 계획과 최종 결과를 남긴다.
