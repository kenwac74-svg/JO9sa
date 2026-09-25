# JO9UIpatch — SNKmod 분리 작업 체크리스트

기준: `JO9UIpatch_Claude_SourceBundle_v1_20260925.zip`의 START_HERE.md §7. 체크는 실제 수행·확인한 항목만 한다.

## P0 — 기준 확인과 연결 근거 확보

- [x] 인계 ZIP 무결성 검증 (152개 파일, FIX6 128개, manifest Files 117 / Payload 119, QSP 본문 5개 PASS). 조건은 context-notes.md 참조.
- [x] 구글 드라이브 `Moding/JO9main/game` 소스 위치 확인 (`jack.qsp`, `locations/*.qsrc`, `css/base.css`).
- [x] 실제 설치본 `jack.qsp` 해시 기록 — FIX6 FinalQsp와 일치 (사용자 첨부).
- [ ] 사용자 SNKmod 작업 폴더 실물 확인 — 드라이브에서 `SNKmod` 이름 파일·폴더 검색 결과 없음.
- [x] CSS `url()` 기준 확인 — FIX6 base.css의 56개 url이 모두 `content/...` 게임 루트 기준 (css/ 기준 아님).
- [x] QSP 이미지 경로 형식 확인 — `content\pic\...` 백슬래시, 게임 루트 기준.
- [x] SNKmod 구조 규칙 확정 (결정 1–3: 단일 UI, 원본 구조 모사, 모더 폴더 제거, grimdark 하위 폴더 = 원래 폴더, FIX6 최신 기준).
- [x] 동명 묶음 1: gear·sound_on·sound_off → `SNKmod/content/pic/buttons/` 한 파일.
- [x] 동명 묶음 2: lab·teach (FIX6) → `SNKmod/content/pic/buttons/`. teach_a/r/s는 FIX6 밖이라 원본 유지 (결정 4).
- [ ] 동명 묶음 3: page_aura (크기 동일, 내용 미확인) — 결정 3 규칙상 서로 다른 목적지라 충돌 없음, 기록만.
- [x] SNKmod 범위 = FIX6 리소스만 (결정 4).
- [x] 게임 전체 location 텍스트 확보, FIX6 파일 참조 전수 목록 작성 (`docs/FIX6_REFERENCE_MAP.md`).
- [x] 5개 밖 location 46개 + base.css 수정 승인 — 경로 치환형으로 (결정 5).
- [x] 본문 교체 5개 location: 해시 불일치여도 경고 후 교체, 교체 전 본문 기록 (결정 6).
- [x] 호환성 정책: QSP 수정 모드 호환불가, 이미지 교체 모드만 점검 (결정 6).
- [x] 참조 없는 FIX6 파일 16개 → SNKmod에 예비 리소스로 포함, 명시 (결정 7).
- [ ] base.css 적용 방식 (엔진 고정 경로) — **사용자 질문 대기**.
- [ ] 5개 밖 location 수정 범위 승인.
- [ ] 추가 동명 후보(트로피·엄지 등) 전수 조사.

## P1 — UI 전용 경로와 복구

- [x] 빌드 스크립트 `build/build_package.py`: SNKmod payload, CSS 경로 치환, 5개 본문, 경로 치환 규칙, `ui_map.json` 생성.
- [x] 빌드 정적 검증 (빌드 시 자동 수행, 실패 시 중단): 치환 후 모든 SNKmod 참조가 payload 실제 파일을 가리킴, FIX6 사용 파일의 옛 경로 참조가 남지 않음.
- [x] 새 설치기 `installer/Install.ps1`: Apply/Check/Restore, FIX6 전환, 일반 이미지 동의.
- [x] 이동식 PowerShell로 가짜 게임 폴더 시험 — `tests/test_installer.py` 30/30.

- [ ] 승인된 UI를 SNKmod에 배치, 원본 경로 보존.
- [ ] 승인된 QSP/CSS 참조만 전환.
- [ ] UI 연결 적용·재실행·해제, 모드 소유 파일 정리.
- [ ] 기존 FIX6 설치본 전환과 원본 부족 시 중단·안내.

- [x] 한글 파일명 영문화 규칙 반영 (빌드 스크립트, 자리표시 원본으로 시험 30/30).
- [x] FIX6 밖 원본 확보: pic 루트 13개(원본), Fer_안전·젖소·평시는 새 디자인 3개 (`resources/new/`).
- [x] pic 루트 13개와 새 아이콘 모두 UI 확인 (사용자).
- [x] 실제 파일로 빌드: 이미지 128개, 치환 679회, 설치기 시험 30/30, 설치 후 한글 이미지 경로 0곳.
- [x] R2 패키징 (사용자 승인) — `releases/JO9_UI_v1_9_14_SNKmod_R2.zip`.
- [x] 사용자 Windows 설치·인게임 시험 (R2): 정상, 누락 이미지 보고.
- [x] buttons.zip 누락 이미지 15개 반영, toggle_trophy·json/menu_icon.json 수정 (사용자 승인). 빌드 이미지 140개, 시험 30/30.
- [x] R3 패키징 (사용자 승인) — `releases/JO9_UI_v1_9_14_SNKmod_R3.zip`.
- [x] 사용자 Windows 설치·인게임 시험 (R3): 이상 없음.

## P2 — 선택형 일반 이미지 교체와 패키징

- [ ] UI 설치와 일반 이미지 교체 목록·동의·쓰기 분리.
- [ ] 승인 일반 이미지만 무백업 덮어쓰기.
- [ ] 수동 교체용 묶음과 안내문.
- [ ] UI 복구가 일반 이미지에 관여하지 않음.

## P3 — 검증 후 배포

- [~] ACCEPTANCE_TESTS.md — 정적 부분 수행 (`docs/ACCEPTANCE_RESULTS.md`). Windows·인게임 미실행.
- [ ] Windows에서 CHECK → APPLY → 인게임 확인 → RESTORE (사용자).
- [ ] 산출물 제출·저장 확인.
