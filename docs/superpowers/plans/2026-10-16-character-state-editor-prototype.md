# Character State Editor Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 실제 명기 상태 정의를 읽고 편집·비교·프로젝트 저장·대상별 적용·복원을 수행하는 로컬 테스트 편집기를 제공한다.

**Architecture:** 기존 QSP 컨테이너 입출력을 재사용하는 별도 `tools/state-editor` 모듈이다. 등록된 명기 상태 바인딩만 편집하고, 모든 후보는 원본 해시와 최소 치환으로 검증한다. 서버의 대상 목록은 명시한 플레이/배포 QSP이며 화면 조작 전에는 게임을 쓰지 않는다.

**Tech Stack:** Node.js built-ins, 기존 text-workshop/core.cjs, HTML/CSS/JavaScript, node:test, Edge/Playwright.

**Spec:** ../specs/2026-10-16-jo9-character-state-editor-design.md

## Global Constraints

- 순정 JO9O, sources/, 세이브와 게임 클라이언트는 수정/실행하지 않는다.
- 플레이/배포 QSP를 각각 읽고 후보를 생성한다. 한 대상을 다른 대상에 복사하지 않는다.
- 게임 내용·표시는 QSP, 기존 CSS 용도는 유지한다.
- 신규 구조/독립 복제/상태 코드 재매핑은 이 테스트판에서 미지원으로 표시한다. 기존 상태와 연결 규칙 편집은 실제 바인딩에서 수행한다.
- 새 조건·수치·대상 게이트를 임의로 추가하지 않는다. 사용자가 고른 기존 값 외 원문은 보존한다.
- 실제 게임 변경 시험은 복제한 QSP에서만 수행한다. 사용자 게임은 적용 버튼 전후의 명시적 동작으로만 변경한다.
- 사용자의 이번 ‘테스트로 실제 구현’ 지시에 따라 계획 작성 후 연속 실행한다. 추가 실행 방식 확인은 요구하지 않는다.

## Review Focus

- 같은 값이 여러 역할/위치에 존재함: 모든 등록 바인딩 일치, 미등록 같은 리터럴 보존.
- 편집 중 파일 변경: 미리보기와 적용/복원에서 해시 충돌 거부.
- 백업/기록/부분 쓰기 실패: journal 선기록, 파일별 전후 해시, 검증된 백업과 실패 상태 보존.
- UI가 시안으로 오인됨: 실제 파일 경로/해시/읽은 값과 미지원 구분, 후보 적용과 실제 게임 쓰기 분리.
- 저장된 코드 캐시/이력: 기존 초기화 버전을 단순 bool로 편집하지 않고, 필요한 기존 캐시 갱신 지점을 정확히 처리.

## Files and interfaces

- `tools/state-editor/registry.cjs`: `inspect(raw)` and `prepare(raw, edits, baseHash)`; 실제 상태표·이력·연결 위치와 타입별 편집 필드를 제공하고 최소 패치를 생성.
- `tools/state-editor/store.cjs`: `createStore({targets,runtime})`; 프로젝트 저장/불러오기, 대상별 후보, 백업/journal 적용/충돌 검사/복원.
- `tools/state-editor/server.cjs`: localhost 서버, 세션 토큰·Origin·경로 검사, JSON API, 정적 UI.
- `tools/state-editor/index.html`, `app.js`, `style.css`: 상태표/전환/이력/효과, 변경 비교, 프로젝트와 적용·복원 UI.
- `tools/state-editor/*.test.cjs`: 실제 파일 기반 회귀. `README.md`, 런처와 실행 상태 파일.

### Task 1: 실제 상태 정의 등록과 최소 치환

- [x] 테스트 먼저 작성: 무수정 바이트 동일, 숫자/표시값 변경, 역할 전체 일치, 같은 리터럴 다른 위치 보존, 범위/미등록/오래된 해시 거부.
- [x] 테스트 실패 확인 후 inspect/prepare 구현.
- [x] 실제 work와 Full 각각 읽어 준비/역치환/컨테이너 검사. 게임 쓰기 없음.

### Task 2: 대상별 후보·프로젝트·백업과 복원

- [x] 테스트 먼저 작성: QSP 사본 두 개에 서로 다른 원문 유지, 후보/적용/복원, hash 충돌, 중간 실패/복구 이력, no-op, 프로젝트 재개방.
- [x] 테스트 실패 확인 후 store 구현. journal을 쓰기 전에 기록하고 이후 사용자 변경은 덮어쓰지 않는다.
- [x] 서버의 세션/Origin/body/정해진 경로만 허용하는 테스트와 구현.

### Task 3: 실제 GUI와 통합 시험

- [x] API 계약으로 GUI 구현. 입력은 서버가 읽은 필드/범위를 사용하며 하드코딩 예시 검색은 넣지 않는다.
- [x] QSP 사본 대상 브라우저 시험: 실제 값 로드→편집→비교→저장/재개방→적용→다시 읽기→복원.
- [x] 320/736/1024 폭, 에러/입력 범위/오래된 후보/선택 대상 보존 검증.

### Task 4: 검토·배치·실행

- [x] 새 모듈 전체 테스트와 재사용 코어 관련 회귀 실행, fresh review의 중요한 문제 해결.
- [x] main에 통합, 실제 두 QSP 불변 확인, 테스트 편집기 서버를 숨김 실행하고 HTTP 값 대조.
- [x] 우측 사이드뷰 열기, 인계/검증 기록·커밋·푸시. 실제 게임 플레이 검증과 구분.

## Execution notes

- 별도 Git 작업 사본 `state-editor-work` / branch `codex/state-editor-prototype`에서 구현한다. 앱의 관리형 worktree 연결은 지원되지 않아 일반 Git worktree로 유지한다.
- 원본 게임 수정 없이 사본에서 전체 적용·복원을 자동 시험한다. 실행 중인 실제 게임에 테스트 숫자를 주입하지 않는다.

## Verification ledger

- Separate worktree, baseline 10/10 passed after loopback sandbox escalation.
- Registry 16/16; store 15/15; server 6/6; assets 3/3.
- Full relevant suite: 107 passed, 1 platform skip, 0 failed.
- Browser actual disposable QSP edit/project/apply/restore/cache/icons passed.
- Ruling: this test prototype exposes supported value editing; internal condition/ID cloning remains explicitly unsupported, as recorded in spec.
- Review fixes: missing icons blocked/rechecked; dead lock recovered; source-only restore plus deliberate current-source saved-cache refresh supplied.
