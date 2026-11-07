# Text Workshop v0.1 — 체크리스트

체크는 실제 수행·확인한 항목만 한다.

## 준비
- [x] 지정 브랜치 `claude/lucid-ramanujan-2821xz`에서 시작
- [x] 기획서를 `docs/text-workshop/HANDOFF_PLAN_v0.1.md`로 저장소에 보관
- [x] 저장소 현황 조사 (Image Workshop 소스·QSRC 없음 확인)
- [x] 사용자에게 입력 자료 요청 → QSRC zip, Image Workshop zip 수신, 서버 전용·Python 불필요 결정

## 조사 (자료 수신 후)
- [x] Image Workshop 구조 파악: 진입·Show HTML·서버 (백업/롤백 상세는 설치 스크립트·HTML 추가 조사 필요)
- [x] QSRC 텍스트 구조·언어 구성 샘플 조사 (기획 §40): 한글, 인라인 HTML+`<<변수>>`
- [x] 실제 `jack.qsp` 형식 확인 (왕복 바이트 동일)
- [x] 엔진 메뉴 진입 방식 결정: Image Workshop 메뉴에 편승

## 구현
- [x] jack.qsp 파서·문자열 스캐너·인덱서 (`tw_core.js`, 시험 17/17)
- [x] 화면 완전 일치 Resolver, 겹침 수 기반 Location 정렬
- [x] 변수 포함 문자열 판별 (편집 불가 표시)
- [x] QSP 문자열 escape·입력 검증·결과 재파싱 검증
- [x] 해시 확인 + 백업 + 적용 + 재읽기 검증 + 자동 복구 (`JO9_Text_Server.ps1`, 시험 9/9, Linux pwsh)
- [x] History, 작업 단위 롤백, 후속 변경 시 롤백 중단
- [x] UI 3탭, 수정 화면, 적용 전 확인, 주변 문맥 (Chromium 시험 7/7)
- [x] 진입·Context 전달: Image Workshop 메뉴 편승 연동 설치기 (시험 7/7). Detect 실행은 미검증

## 검증
- [~] 기획 §36 시나리오 자동 시험: A 단일 대사, C 동일 문자열 선택, D 이름 선택 치환, E 변수 포함 편집 불가, F 중간 변경, G 실패 복구 확인. B(지문)는 대사와 같은 경로, 실게임 확인 필요
- [ ] 기획 §37 완료 조건 대조
- [ ] 사용자 실제 게임 시험

## 남은 일 (실게임 시험 후)
- [ ] Windows에서 설치기 실행, Detect의 screen.html 저장, Show HTML 실제 형태 확인
- [ ] 화면 매칭 정확도(Location 정렬 휴리스틱) 확인
- [ ] 게임 실행 중 jack.qsp 교체 동작 확인
- [ ] 릴리스 ZIP 패키징 (사용자 승인 후)
