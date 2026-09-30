# Text Workshop v0.1 — 체크리스트

체크는 실제 수행·확인한 항목만 한다.

## 준비
- [x] 지정 브랜치 `claude/lucid-ramanujan-2821xz`에서 시작
- [x] 기획서를 `docs/text-workshop/HANDOFF_PLAN_v0.1.md`로 저장소에 보관
- [x] 저장소 현황 조사 (Image Workshop 소스·QSRC 없음 확인)
- [ ] 사용자에게 입력 자료 요청 (context-notes.md 미해결 질문 참조)

## 조사 (자료 수신 후)
- [ ] Image Workshop 구조 파악 (진입, Show HTML, 서버, 백업/롤백)
- [ ] QSRC 텍스트 구조·언어 구성 샘플 조사 (기획 §40)

## 구현
- [ ] QSRC 파서·인덱서
- [ ] 완전 일치 Resolver, 현재 Location 우선 정렬
- [ ] 변수 포함 문자열 판별 (편집 불가 표시)
- [ ] QSP 문자열 escape·검증
- [ ] 해시 확인 + 백업 + 적용 + 재읽기 검증 + 자동 롤백
- [ ] History, 작업 단위 롤백, 롤백 충돌 중단
- [ ] UI 3탭, 수정 화면, 적용 전 확인, 주변 문맥
- [ ] 엔진 메뉴 진입, Context 전달

## 검증
- [ ] 기획 §36 시나리오 A–G 자동 시험
- [ ] 기획 §37 완료 조건 대조
- [ ] 사용자 실제 게임 시험
