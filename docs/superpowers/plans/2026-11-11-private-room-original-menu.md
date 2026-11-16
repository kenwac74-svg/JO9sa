# Private Room Original Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 개인실1~4의 기존 버튼을 원래 행동 선택 메뉴에 연결하고, 사용자가 확정한 원래 비용·효과를 그대로 사용한다.

**Architecture:** 기존 `snk_room_bridge`의 대상 교환을 유지한 채 `menu_sex`(현행16)를 허용한다. 행동 구현은 원래 `interaction`/`sex_*`를 재사용하고 종료·취소·이탈에서 기존 bridge의 대상 복원을 사용한다. 새 지속 필드는 추가하지 않는다.

**Tech Stack:** 기존 QSP, `mods/*.json`, 공식 PowerShell 적용기, Node QSP 코덱, 설치 FastQSP 격리 진단.

**Spec:** 직전 대화의 “개인실 버튼 → 원래 행동 선택 메뉴 → 해당 개인실 복귀” 제안과 사용자 “원래 메뉴와 동일하게 행동력 소모”, “원래 메뉴의 비용·효과 그대로 사용” 승인. 이미 확정된 기준이며 추가 기능·균형 변경은 없다.

## Global Constraints

- 현재 WORK가 기준이며 수동 변경을 보존한다. WORK/추적 소스만 갱신한다.
- 원래 행동의 비용·효과·대사·수락/거절·결과 처리를 다시 구현하지 않는다.
- Full·사용자 세이브·음원·커밋·푸시는 다루지 않는다.
- 진단 사본은 `G:/Codex/tmp/jo9-private-sex-menu-20261111`에 두고 검증 후 정리한다.

## Review Focus

- 네 개인실의 원래 주 노예 존재/부재 모두: 대상·다른 인물·이력이 섞이지 않는다.
- 원래 메뉴16이 bridge guard에서 되돌아가지 않는다.
- 종료·접기·뒤로·ESC·다른 화면 이동에서 교환과 콜백을 복원한다.
- 낡은 `room_sex` 콜백도 같은 메뉴로 연결하고 새 소모를 덧붙이지 않는다.
- 행동 불가·행동력 경계 및 정상 주 노예의 기존 메뉴를 보존한다.

### Task 1: 현재 경로의 회귀 재현

**Files:** `records/private-sex-menu-20261111/native.cjs` (검사 빌더), `native-before.json/log`.

**Interfaces:** 현재 QSP를 받아 격리된 진단 QSP/plan을 만든다. 합성 성인 상태만 사용한다. 원래 로케이션을 보존하고 계측 위치를 보고한다.

- [x] bridge로 방 인물을 연결한 후 메뉴16이 유지되는지 검사한다.
- [x] 현재 WORK에서 개인실로 되돌아가는 실패를 실제 엔진으로 확인한다.

### Task 2: 기존 메뉴 연결

**Files:** `mods/2026-11-11_private_room_original_menu.json`, 재현·적용 `task.cjs`; 변경 위치 `slave_private_room1~4`, `menu_form`, `snk_room_bridge`.

**Interfaces:** 기존 `enter(방번호, menu_sex)`, `guard`, `leave`를 재사용한다. 기존 메뉴 및 동적 상태 포맷을 유지한다.

- [x] 네 버튼을 `enter → menu_sex → menu_form`에 연결하고 기존 메뉴와 맞는 대상/행동력 조건을 사용한다.
- [x] bridged 활동 메뉴의 별도 우회를 없애고 정상 주 노예와 동일한 원래 버튼을 사용한다.
- [x] guard에 메뉴16과 관련 행동력 검사를 추가한다. 낡은 `room_sex`는 교환을 풀지 않고 원래 메뉴로 보낸다.
- [x] 원래 행동 로케이션의 본문이 바뀌지 않았는지 대조한다.

### Task 3: 검증·설치·인계

**Files:** WORK `game/jack.qsp`, `assets/runtime/2.4.1/jack.qsp`, `assets/runtime-source-2.4.1.json`, `records/private-sex-menu-20261111/*`, `docs/SESSION_HANDOFF_INDEX.md`.

- [x] 네 방의 메뉴·대상·기존 주 노예 복원과 종료/취소를 실제 엔진에서 확인한다.
- [x] 원래 행동 비용·효과와 같은 조건의 직접 경로를 대조하고 직접 조작의 초기화/종료 연결을 확인한다.
- [x] 바이트 왕복·줄/주석 경계·공식 재생·재적용·입력 해시 검사를 통과시킨다.
- [x] 독립 검토 후 WORK와 소스·원장을 맞춘다. 실제 SAV/GUI 미검증 범위를 명시한다.
- [x] 복구 압축본·최소 보고서·재현 코드만 보존하고 시험 사본을 정리한다.

실행 방식: 현재 승인 작업을 같은 채팅에서 이어서 진행한다. 커밋 단계는 사용자 지시가 없으므로 포함하지 않는다.
