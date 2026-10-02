# JO9UIpatch — SNKmod UI 패치 체크리스트

기준: 배포판 **0.14** (`releases/JO9 UI_overhaul_SNKmod_0.11.zip`, JO9UIpatch). 체크는 실제 수행·확인한 항목만 한다.
2026-09-28 R 시절 미완료 항목을 0.11 기준으로 정리했다. 종결 근거는 아래 "정리된 R 시절 항목"에 적었다.

## 남은 작업

### 검증 (사용자 Windows 환경)
- [x] Windows 설치·인게임 점검 (0.14, 사용자 확인 2026-10-02). RESTORE 확인 여부는 기록 없음.
- [ ] 실제 FastQSP에서 개인실 room1~4의 활성 기능·복원·세이브·예외 경로 확인. (WASM 모델 검사는 통과, 실게임 미확인)
- [ ] 다른 패치 뒤 설치 확인: JoNT_IndividualityPatchInstaller → ai_girl_pack → UI 패치 순서로 설치 후 인게임 표시.
- [ ] `tests/test_release_clean_install.py` — Windows PowerShell·실게임 폴더에서 실행.
- [~] ACCEPTANCE_TESTS.md — 정적 부분 수행 (`docs/ACCEPTANCE_RESULTS.md`). Windows·인게임 미실행.

### 버그
- [ ] BUG-001 아마란스 살롱 서비스에서 이전 `$service_picture`가 잔류해 `scene\\service\\...` 이미지가 함께 표시되는 문제 수정. 상세 원인·재현·최소 수정안은 `docs/BUGS.md` 참조.

### 보류 (사용자 지정 시 진행)
- [ ] 누락 menu_icon 아이콘 11개 제작 여부 (`docs/MISSING_MENU_ICONS.md`, cum_gray는 반영 완료).
- [ ] 147개 옛 차이 리소스 중 UI 작업으로 지정할 파일 (결정 14: 지정 전까지 제외).

## 0.12 완료 내역

- [x] jack.qsp 완성본을 패치에 넣고 설치 때 교체, 원본은 _JO9_SNKmod_STATE에 보관.
- [x] 사용자 확인 정상 jack.qsp와 바이트 동일 (a9bfe562…).
- [x] test_installer 58/58, 개인실 검사 통과, 패키징 0.12.
- [x] 예전 흔적 메시지 제거, 설치기 메시지를 필수 안내만으로 축소.
- [x] cell_exchange 아이콘 교체.
- [x] 배포용 README.html(스크린샷 포함) 추가.
- [x] 장비 툴팁 강화 통합 (#dynamic 380줄, Kura 변경 제외).
- [ ] 인게임에서 장비 툴팁 표시 확인.
- [x] 쿠라 개인 패치 병합 (main_menu·init_custom_game·#masters_base·#dynamic).
- [ ] 인게임에서 새 게임 13번 쿠라 시작 확인.

## 0.11 완료 내역

- [x] 참조 없는 예비 리소스 29개를 SNKmod/trash로, 원래 경로 목록 README_trash.txt.
- [x] cum_gray.png 포함, menu_icon.json 연결.
- [x] 설치 후 바뀐 파일(QSP 포함)은 실패가 아니라 호환성 경고, 현재본 백업, 바뀐 원래 파일은 유지.
- [x] 알려지지 않은 본문 경고 1줄로 통합.
- [x] 설치 순서 안내(Check·확인 창·README_RELEASE_KR).
- [x] tests/test_installer.py 53/53 (빌드본·ZIP 압축 해제본).
- [x] 개인실 WASM 검사 4종 PASS, test_private_room.py 13/13 (Codex 런타임 보완 후).
- [x] 참조 분류: 한글 참조·연결 누락·출처 누락 0, trash 밖 미참조 0.
- [x] 패키징 0.11, 사용자에게 전달, JO9UIpatch 반영 (4024cf0).
- [x] Codex 최종 인계(d3188e9) 병합.

## 정리된 R 시절 항목

| 옛 항목 | 처리 | 근거 |
|---|---|---|
| 배포 ZIP 패키징/릴리스 확정 (개인실 개발본) | 완료 | 0.1(Codex), 0.11 배포 |
| 사용자 SNKmod 작업 폴더 실물 확인 | 해당 없음 | SNKmod는 빌드가 `content/pic/SNKmod`로 만든다. 작업 폴더는 리소스 출처가 아니다 (결정 14) |
| 동명 묶음 3: page_aura | 종결 | 결정 3 규칙상 목적지가 달라 충돌 없음. 기록만 필요했고 기록됨 |
| base.css 적용 방식 (엔진 고정 경로) | 완료 | 원래 경로에 덮어쓰고 원본을 `_JO9_SNKmod_STATE`에 보관 (manifest Overwrite) |
| 5개 밖 location 수정 범위 승인 | 완료 | 결정 5 승인, 0.1부터 243개 본문 교체 + 신규 5개 (사용자 확인 TEST13 기준) |
| 추가 동명 후보(트로피·엄지 등) 전수 조사 | 완료 | 결정 12–14 전수 분류 (`docs/RESOURCE_CLASSIFICATION_0_1_REPORT_KR.md`) |
| 승인된 UI를 SNKmod에 배치, 원본 경로 보존 | 완료 | 원본 content/pic 불변 검사 (test_installer A2·A4) |
| 승인된 QSP/CSS 참조만 전환 | 완료 | 참조 분류 연결 누락 0, 옛 경로 잔존 0 |
| UI 연결 적용·재실행·해제, 모드 소유 파일 정리 | 완료 | test_installer A2–A4, B1–B4 |
| 기존 FIX6 설치본 전환과 원본 부족 시 중단·안내 | 완료 (정책 변경) | 백업 있으면 전환(C1), 없으면 중단 대신 경고 후 계속(A1) |
| UI 설치와 일반 이미지 교체 분리 | 완료 | 별도 동의, 비대화형은 교체 안 함 (E1) |
| 승인 일반 이미지만 무백업 덮어쓰기 | 완료 (기능) | 설치기 General 처리. 0.11은 General 0개 |
| 수동 교체용 묶음과 안내문 | 해당 없음 | 이미지팩 교체분은 UI 패치 관할 아님 (결정 14), 0.11 일반 이미지 없음 |
| UI 복구가 일반 이미지에 관여하지 않음 | 완료 | Restore는 state 기록 파일만 다룸 |
| 산출물 제출·저장 확인 | 완료 | 0.11 ZIP 전달, releases/와 JO9UIpatch에 저장 |

## 이력 (완료)

### 개인실 UI 개발본 · 2026-09-27
- [x] 활성 원작 기능의 room1~4 연결, 신규 기능 개발 제외.
- [x] 개인실 카드·질병/상처·생식 슬롯·버튼 활성/비활성/숨김 구현.
- [x] 식단 아이콘 32×32, 안내 PNG와 토글, 개인 침대 문구.
- [x] 정적/대상 교환 모델 검사 8/8, 설치·복구·R3 업그레이드 34/34.
- 상세: [PRIVATE_ROOM_WORK_20260927.md](PRIVATE_ROOM_WORK_20260927.md).

### P0·P1 (R1–R3)
- [x] 인계 ZIP 무결성, 소스 위치, 설치본 해시, CSS `url()`·QSP 경로 형식 확인.
- [x] SNKmod 구조 규칙(결정 1–4), 동명 묶음 1·2, 참조 전수 목록 (`docs/FIX6_REFERENCE_MAP.md`).
- [x] 경로 치환형 수정 승인(결정 5), 본문 교체·호환성 정책(결정 6), 예비 리소스(결정 7).
- [x] 빌드 스크립트·정적 검증, 설치기 Apply/Check/Restore, 한글 파일명 영문화.
- [x] R2·R3 패키징과 사용자 Windows 인게임 시험 (R3 이상 없음).
