# 현재 WORK 특성·아이템 열람표 갱신·모드툴 연결·ZIP — 2026-11-08

사운드 정리는 사용자 지시로 취소했다. 이동은 실행하지 않았으며 게임 사운드127개 모두 조사 전 해시와 같다.

원격 41c1a6409e89b1cccac50f1c033d16a5043030d2의 tools/game-reference 폴더만 가져왔다. 현재 WORK QSP 60f8bc4064b33bf6fbd8d0722a18fb06bdf8918b8e1ec0097717abb71badfefe로 다시 추출했다. 특성126→128(정액 중독·석녀), 아이템270→271(특등급 처녀고기), 기본196+조리음식75. 기존 특성 이름과 아이템ID를 보존하고 색정광/불감증의 ID 조건은 현재의 정확한 등급으로 분리했다.

신규 특성은 무작위 생성이라고 잘못 추정하던 문구를 현재 발현·승급·치료·기존 시루 보정 코드로 보완했다. 과일은50금화 또는500스파크/10회분, 와인은50금화/10회분. 특별요리 한 단계 개선·재료 우선순위와 특등급 처녀고기의 현재 획득 이벤트 미연결을 표시했다. 미확인 경로를 임의로 채우지 않았다. 별도 마법DB는 원래 도구 범위에 없다.

items.input.json을 추출·획득처 보완 입력으로 구분하고 traits.json/items.json은 HTML과 같은 최종 데이터로 저장한다. assemble 재실행 때 조리 음식이 중복 추가되지 않음을 확인했다. 새 수동 보완은 refresh-current.cjs에서 현 QSP의 조건/수치를 검증한 뒤 붙인다.

Open-Modding-Tools.ps1의 GAME_REFERENCE_TOOL_20261108 구간은 4개 도구 파일을 WORK/modtools/game-reference로 동기화하고 전용 읽기 서버를 시작/재사용한다. GameReference URL을 출력하고 일반 실행에서는 해당 탭도 연다. 서버는127.0.0.1만 접속하며 game-reference/Start-Game-Reference.ps1은 실제 PID·스크립트 경로·상태를 확인한다. 본문 갱신은 서버 재시작 없이 다음 요청에 반영된다. 제거하면 통합 열기에서 해당 도구만 빠진다.

검증: QSP읽기 왕복, 구버전 항목 보존, 현재128/271개, 완성JSON과HTML 데이터 일치, JS/PowerShell문법, 재생성 음식 중복 없음, 실행기 연속호출 시같은서버 재사용, 실제 브라우저 탭·검색·신규특성·가격 표시 확인. ZIP17항목 전체 바이트 대조와 CRC 검사 통과. UI 화면은 reference-current.jpg, 압축 해시는 package-verification.json.

다운로드 ZIP에는 단독HTML, 같은 데이터JSON과 생성기·템플릿·의존 core.cjs·서버·사용법을 포함한다. 게임QSP·음원·세이브·키·개인설정·runtime은 제외한다. game-reference/README.md에 단독 열람과 재생성 방법을 기록했다. 최신 WORK 기반의 정적 열람표이며 게임 실행을 자동 추적하지 않는다.

게임QSP와사운드·세이브·Full·배포게임ZIP·커밋·푸시는 변경하지 않았다. 이번 ZIP은 사용자 요청한 도구 다운로드용이며 정식 게임 패치가 아니다. 작업 전 도구/통합 실행기/문서의 복구 자료는 before/와 installation.json, 원격 제작본은 원본 커밋에 보존됐다. 재생성 가능한 G:/Codex/tmp 작업 사본은 검사 후 정리했다.
