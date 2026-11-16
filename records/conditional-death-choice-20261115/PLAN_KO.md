# 조건부 2번 선택지 Implementation Plan

> **For agentic workers:** Execute the approved scope task by task; independently review scoped game and preview changes.

**Goal:** CM≤−10 AND 주인공 이상성욕 A 이상이면 기존 2번 대신 #노예살자2-2를 표시하고 독립적인 결과 편집 자리를 만든다.

**Architecture:** 기존 jo9_slave_death의 두 번째 HTML 링크만 조건에 따라 바꾼다. 기존 선택값에 22를 추가하고 원래 1·2·3번 처리와 분리한다. 결과는 사용자 지정 표식만 넣는다. 편집기는 조건부 링크도 원래 선택지 아래에 묶고 해당 결과로 미리보기 이동한다.

**Tech Stack:** QSP exact edit, existing JS page-flow and DOM renderer, focused Node and actual engine fixture.

**Spec:** 2026-11-15 사용자 조건 및 표식 확정. 새 결과 원고·비용·CM 변화 등 전용 효과는 미정이다. 기존 2번 이미지를 편집용 임시 이미지로 유지한다.

## Global Constraints

- `(2 * jo9_cruel_mercy + jo9_cruel_mercy_half) <= -20 and master_fetish >= 4`. 성별 제한 없음.
- 조건 불성립 시 기존 2번. 시작 화면은 여전히 3개 슬롯이다.
- 새 결과는 `$text='#노예살자2-2'`, 전용 효과 추가 없음. 사망 뒤 공통 정리·장비 보존은 유지한다.
- 다른 결과 문구·이미지 및 3번 slaughter_result 연결 보존.
- WORK·추적 소스만. Full·세이브·이미지 파일·배포물·커밋푸시 제외.

## Tasks

- [ ] 조건 경계와 22번 독립 결과를 기존 코드에서 실패하는 검사로 확인.
- [ ] 게임 후보 작성. 선택지에서 22로 이동하며 resolve에서도 조건을 재확인. 결과 텍스트·공통 정리만 실행하고 기존 2·3번 효과로 넘어가지 않음.
- [ ] 조건부 링크의 편집기 탐색·결과 제목·접힌 조건 표시를 최소 보완. 3개 기본 슬롯 유지.
- [ ] CM −10.5/−10/−9.5, 이상성욕 B/A/S, 주인공 성별 양쪽을 집중 검사. 원래 결과들과 조건식·보호 문자열 대조.
- [ ] 백업·정확 치환 기록 뒤 WORK 적용, 소스 스냅샷과 편집기 맞춤. 미정 원고·효과 및 실제 GUI 확인 범위를 보고.
