# 새·옛 이미지 등록 병행 조회 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans when the user gives the batch WORK application instruction. This document currently records approved pending work.

**Goal:** 복장 메뉴부터 이미지 출력까지 새·옛 등록을 함께 조회하고 누락 시 기본 전신으로 이어지게 한다.
**Architecture:** 기존 `jo9_seed_role_images`의 별칭 보정과 정상 우선순위를 보존하면서 공통 선택·등록 확인 모드를 추가한다. FastQSP의 기존 파일 존재 연산을 함수 로컬 변수로 사용한다.
**Tech Stack:** 현재 WORK QSP, 선언형 mods JSON, 실제 배포 FastQSP 엔진.
**Spec:** `PENDING_KO.md`, `RISKS_KO.md`, 사용자 2026-11-04 전체 QSP 범위 및 공통 조회 방식 승인 완료.

## 제약

- WORK·Full·QSP·JSON·그림·SAV를 이번 기록 작업으로 바꾸지 않는다.
- 구현은 WORK 일괄 반영 지시 후 수행한다. Full 동기화·커밋·푸시는 별도 지시를 따른다.
- 파일명과 캐릭터 ID를 유지한다. 새 영구 캐시나 임신 외형 기능을 추가하지 않는다.

## 검사 초점

- 새 등록만 있는 복장, 옛 등록만 있는 복장, 양쪽 모두 있는 복장.
- 상태 그림·일반 그림·기본 전신의 파일 누락과 손상.
- 기존 세이브 캐시와 사용자 지정 외형, 캐릭터 간 공유 파일.
- 기존 선택지 유지와 새 등록 복장 메뉴 표시, 메뉴·클릭·실제 출력 일치.
- 현행 배포 EXE에서 파일 존재 연산 및 읽기 전용 조회 검증.

### Task 1: 감사·승인 명세

- [x] 현재 QSP 왕복 일치와 해시를 확인하고 전체 설명·본문·액션의 참조를 추출한다.
- [x] 실행·주석·개발용·초기화·추론용 코드와 조회 소비 코드를 구분한다.
- [x] `audit.json`에 현재 코드와 맥락을, 대기 명세에 규칙과 제약을 기록한다.

### Task 2: 공통 조회와 소비 지점 후보 — 일괄 반영 지시 대기

- [ ] 최신 WORK 해시를 다시 확인해 감사 이후 수동 변경을 보존한다.
- [ ] `jo9_seed_role_images`에 문자열 후보와 현재 ID를 받는 공통 선택 경로를 준비한다. 상태 변형→같은 복장 일반→반대 등록→기본 전신 순서와 현행 우선순위를 함께 반영한다.
- [ ] `assistant_stat`의 메뉴 6조건·클릭 4대입, `display_fullimage`, 집 선행 조건, 이벤트·결과·미리보기의 실제 조회를 같은 규칙으로 연결한다. 이름 추론·배열 초기화·주석은 기계적으로 교체하지 않는다.
- [ ] 최신본 기준 location/old/new/count와 전후 해시를 담은 mods JSON을 만든다.

### Task 3: 관련 검사와 WORK 반영 — 일괄 반영 지시 대기

- [ ] 구등록/새등록/양쪽/빈값, 상태·일반·기본 누락, 기존 캐시·개별 외형·역할 0~3 경계 사례를 검사한다.
- [ ] 실제 FastQSP에서 존재 연산과 수정 동적 코드·문법을 확인한다. 기존 등록·캐시의 불필요한 쓰기가 없음을 확인한다.
- [ ] 승인된 묶음 순서로 WORK에 반영한다. 이전·이후 해시, 변경 블록과 간단한 일반 EXE 육안 확인 경로를 남긴다.
