# 반복 구매자 목표 등록 Implementation Plan

> For agentic workers: use superpowers:executing-plans inline. Do not delegate or commit.

**Goal:** 승인한9개 복합요구 의뢰를 문의 후 목표에 연결한다.

**Architecture:** interaction_city의 실제 문의 지점에서 기존 문의기록을 채운다. slave_sell_chek의 공용 목표목록/상세를 확장하고 기존 색상 대사·뒤로 링크 형식을 재사용한다.

**Tech Stack:** QSP2/Node.js/FastQSP/공식apply_mods.

**Spec:** G:/somi/JO9sa/records/release-r04-repeat-goals-20261113/SPEC_KO.md

## Global Constraints

- 단순등급/전문 제외, 직접고지된 특별보상/분기는 유지, 글로리아 납품 제외.
- 거래/정산/대기/진행 보존, 새 전역배열0, WORK/추적QSP만 반영.
- 기존수동편집·다른승인대기·보류기획·Full·음원·개인SAV·커밋푸시 유지.

## Review Focus

- 문의 전/옛저장 무기록은 목표 미등록, 재문의 후 등록.
- 대기0/양수와 실제 날짜 처리 뒤 상태 일치.
- 등급만 색깔인 데미안·간접트리거인 글로리아 제외.
- 9개동시/반복문의에서중복없고기존목표/특별보상유지.
- QSP왕복/줄/주석/공식재생/멱등/역검증과 실제엔진을 분리.

## Task 1 · 기록/목표 표시

- [ ] 실제 문의입구/목표목록/상세/대기/구저장 보존의 RED검사 작성·실행.
- [ ] 검토된장면만 문의기록/목록·상세·대기표시 연결.
- [ ] 같은 검사GREEN·기존대조군 검증.
- [ ] 공식재생·멱등·역검증 후 WORK/소스/원장 동기화.
- [ ] 승인목록/릴리즈/사용·제거영향·검증한계 문서 및 자체임시사본 정리.
