# Farid Consignment Preservation Implementation Plan

**Goal:** 위탁 인물의 소실과 실패 회수 수수료·청구권 삭제를 막는다.

**Architecture:** 새 jo9_farid_consignment 로케이션 한 곳에 순수 인물 복사/정리와 기존 위탁·반환·정산을 묶는다. jo9_farid_stored 23묶음과 유효 표식1개를 저장하며, 기존 farid_debt/farid_potential_debt를 재사용한다. 일반 인물 목록에는 새 역할을 넣지 않는다.

**Tech Stack:** 기존 컴파일 QSP 코덱, 선언형 mods JSON, apply_mods.ps1, 실제 설치 FastQSP, 공식 release-check.

**Spec:** SPEC_KO.md 및 사용자 승인 대화.

## Global Constraints

- 기준 WORK: efdff96228e6cd77b59808c22b3391947e1682918480aea55c89b0a0bb3adebb.
- 기존 세이브·배포·원본·CSS·JS·이미지 보존. 커밋·푸시 없음.
- ID0도 유효한 보관이 가능해야 한다. 구 세이브의 신원 미상 stock을 자동 승격하지 않는다.
- 수수료는 기존$5이며 자금 부족에 대한 새로운 거래 제한은 만들지 않는다.
- 조기 guard는 stock_to_slave_nogt의 기존 초기화보다 먼저 실행한다.

## Review Focus

- 다수 위탁: 이전 금액은 한 번만 채권으로 옮기고 최신 인물만 당일 반환한다.
- 반환 실패: 활성 슬롯·모든 인물·돈·대금 기록을 보존한다.
- 대금 수령: 다른 stock과 아직 유효한 최신 위탁을 지우지 않는다.
- 세이브: 새 보관 데이터와 유효 표식은 저장되며 이전 저장의 부재는 기본0으로 처리한다.
- 새 인물 생성용 초기화나 특성 repair를 보관/회수에 호출하지 않는다.

## Task 1 — 위탁 보관과 회수

- [x] 현행 실패 재현: 위탁 뒤 다른 후보를 만들고 거절한 다음 원래 인물을 반환해야 한다는 기대조건이 실패함을 확인.
- [x] 조기 guard 부재 재현: source state0/2에서 기존 nogt가 인물을 변경함을 확인.
- [x] helper와 interaction_city119/1191/1193, next_day, stock_to_slave_nogt, stock_to_slave의 최소 선언형 편집 작성. 위탁2페이지의 기존 공용stock 참조도 전용 보관 인물 표시로 교정.
- [x] 정상/비정상/다수 위탁/중복 호출/ID0/천재/전체 묶음 보존/저장 조건의 native 검증.
- [x] 독립 검토 후 필요한 문제만 수정. 왕관 가격 표시의 is_stock와 공용 문구 맵 유지 포함.

## Task 2 — 출고·WORK 반영

- [x] 격리 후보에 apply_mods로 적용, 바이트 왕복·재생·멱등성 확인.
- [x] 현재2.4 대표 저장으로 공식 실제 엔진9경로 검사.
- [x] WORK가 기준 해시 그대로인지 확인하고 동일 후보 적용·백업. 적용972d1b7a, 백업jack.qsp.bak_20261028_135301.
- [x] 재현·검증·복구·구현 의존성·잔여 한계 기록. 진단 사본 정리, 백업 보존. 첫 정리 보고서 직렬화 오류를 고친 뒤 최종 잔여·보존 검사를 완료.
