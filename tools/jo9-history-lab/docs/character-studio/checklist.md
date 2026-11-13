<!-- 통합 캐릭터 편집기 작업 체크리스트 -->
# 체크리스트

- [x] 1-1 업로드본 이미지 도구를 `tools/character-image-adder`에 반영(차이 확인 후)
- [x] 1-2 서버: 게임 폴더 지정·저장(설정 파일), `/api/game`
- [x] 1-3 서버: `/api/chars`(scan_characters), `/api/char/<id>`(JSON + 이미지 경로)
- [x] 1-4 서버: `/game/<경로>` 이미지 제공(게임 폴더 안만)
- [x] 1-5 서버 검사 스크립트(시험 게임 폴더)
- [x] 2-1 '캐릭터 편집' 탭 목록·검색·불러오기
- [x] 2-2 설정·배경 이야기(3칸)·이름 편집
- [x] 2-3 능력치·특성·스킬 편집(seed_* 전부, 특성 이름 표시)
- [x] 2-4 저장(백업, 바뀐 키만, 저장 전 미리보기)
- [x] 3-1 슬롯 미리보기·이미지 선택
- [x] 3-2 정렬(드래그·휠·키·숫자)·얼굴 상자
- [x] 3-3 저장(save_character_slots), Tk 도구와 결과 대조
- [x] 4-1 대사집 파일 형식·위치
- [x] 4-2 과거 경험 사실·필로우토크 대사 편집, 시뮬레이터 연결
- [x] 5-1 qsp 검색(이름·ID)
- [x] 5-2 mods JSON 초안 내보내기, 적용 검증
- [x] 6-1 새 캐릭터·복제·삭제
- [x] 6-2 작업 기록
- [x] 7-1 단독 실행기·설명서·인계

## 인계 남은 작업(NEXT_SESSION_HANDOFF_KO.md 4장)
- [x] 1 블로그 글 단위 원문 DB(`sextalk-interviews/posts-db.json`, 159편·5,112쌍, 2026-11-12)
- [x] 2 편집기 DB 탭(`dist/studio-db.mjs`, `studio_interview.py`, 2026-11-12)
- [x] 3 엑셀 내보내기·가져오기(`studio_excel.py`, DB 탭 버튼, 2026-11-12)
- [x] 4 AI 작업용 분할·설명서·검사(`sextalk-interviews/ai-tools.py`, `ai/`, `AI_WORK_SCHEMA_KO.md`, 2026-11-12)
- [x] 5 글로서리·번역 파일(`sextalk-interviews/i18n-tools.py`, `i18n/glossary.json`, `I18N_KO.md`, 2026-11-12)
- [x] 6 API 연결부(OpenRouter·Venice·Gemini 완료, Kindroid는 공식 문서 미확인으로 보류: `ai_api.py`, `AI_API_KO.md`, 2026-11-12)
- [ ] 7 세계관 자료집·자동 프롬프트 조립

## 나중에 할 것(기록)
- [x] 시뮬레이터 '영입 경로'에 게임 안 획득 루트 전체 표시(`dist/data/acquisition-routes.json`, 2026-11-13)
- [ ] 병합 전: 모드 제작자의 편집기 데이터 설명 수정 8개(`records/handoff-b-activity-20261112/editor-data-edits.json`, 아직 repo에 없음)를 받아 `dist/data`와 대조

## 통합 DB (DB_PLAN_KO.md, 2026-11-13 기획 확인 대기)
- [x] 0 인터뷰 각색 엑셀 사용자에게 전달(실제 Excel 확인은 사용자)
- [ ] 1 공통 표 엔진 + 영입 경로 표로 시험
- [ ] 2 배경 분류·직업 명세·과거 경험 공식·필로우토크 사실·특성·대사 초안·용어집 표
- [ ] 3 게임 캐릭터·대사집 표
- [ ] 4 세계관 자료집 표 + 프롬프트 조립
- [ ] 5 단계별 왕복 검사·화면 시험
