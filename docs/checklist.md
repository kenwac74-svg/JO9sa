# JO9UIpatch — SNKmod 분리 작업 체크리스트

기준: `JO9UIpatch_Claude_SourceBundle_v1_20260925.zip`의 START_HERE.md §7. 체크는 실제 수행·확인한 항목만 한다.

## P0 — 기준 확인과 연결 근거 확보

- [x] 인계 ZIP 무결성 검증 (152개 파일, FIX6 128개, manifest Files 117 / Payload 119, QSP 본문 5개 PASS). 조건은 context-notes.md 참조.
- [x] 구글 드라이브 `Moding/JO9main/game` 소스 위치 확인 (`jack.qsp`, `locations/*.qsrc`, `css/base.css`).
- [ ] 실제 설치본 `jack.qsp` 해시 기록 — 16.6MB라 현재 도구(base64 인라인)로 내려받지 못함. 해시만이라도 사용자 PC에서 확보 필요.
- [ ] 사용자 SNKmod 작업 폴더 실물 확인 — 드라이브에서 `SNKmod` 이름 파일·폴더 검색 결과 없음.
- [x] CSS `url()` 기준 확인 — FIX6 base.css의 56개 url이 모두 `content/...` 게임 루트 기준 (css/ 기준 아님).
- [x] QSP 이미지 경로 형식 확인 — `content\pic\...` 백슬래시, 게임 루트 기준.
- [x] SNKmod 구조 규칙 확정 (결정 1–3: 단일 UI, 원본 구조 모사, 모더 폴더 제거, grimdark 하위 폴더 = 원래 폴더, FIX6 최신 기준).
- [x] 동명 묶음 1: gear·sound_on·sound_off → `SNKmod/content/pic/buttons/` 한 파일.
- [x] 동명 묶음 2: lab·teach (FIX6) → `SNKmod/content/pic/buttons/`. teach_a/r/s는 FIX6 밖이라 원본 유지 (결정 4).
- [ ] 동명 묶음 3: page_aura (크기 동일, 내용 미확인) — 결정 3 규칙상 서로 다른 목적지라 충돌 없음, 기록만.
- [x] SNKmod 범위 = FIX6 리소스만 (결정 4).
- [ ] 게임 전체 location 텍스트 확보 (`locations.zip` 첨부 요청 중) → FIX6 파일 참조 전수 목록 작성.
- [ ] 5개 밖 location 수정 범위 승인.
- [ ] 추가 동명 후보(트로피·엄지 등) 전수 조사.

## P1 — UI 전용 경로와 복구

- [ ] 승인된 UI를 SNKmod에 배치, 원본 경로 보존.
- [ ] 승인된 QSP/CSS 참조만 전환.
- [ ] UI 연결 적용·재실행·해제, 모드 소유 파일 정리.
- [ ] 기존 FIX6 설치본 전환과 원본 부족 시 중단·안내.

## P2 — 선택형 일반 이미지 교체와 패키징

- [ ] UI 설치와 일반 이미지 교체 목록·동의·쓰기 분리.
- [ ] 승인 일반 이미지만 무백업 덮어쓰기.
- [ ] 수동 교체용 묶음과 안내문.
- [ ] UI 복구가 일반 이미지에 관여하지 않음.

## P3 — 검증 후 배포

- [ ] ACCEPTANCE_TESTS.md U01–U23 수행 (현재 전 항목 미실행).
- [ ] 산출물 제출·저장 확인.
