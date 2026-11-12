<!-- 통합 캐릭터 편집기 다음 세션(소넷 등) 인계: 현재 상태, 원칙, 남은 작업 순서 -->
# 통합 캐릭터 편집기 · 다음 세션 인계 (2026-11-12)

먼저 이 문서, `PLAN_KO.md`, `checklist.md`, `context-notes.md`(같은 폴더), `GUIDE_KO.md`, repo `CLAUDE.md`·`AGENTS.md`, `docs/claude-refusals/REFUSAL_LOG_KO.md`를 읽는다. 이미 정한 것은 다시 묻지 않는다.

## 1. 위치
| 항목 | 값 |
|---|---|
| 편집기 브랜치 | `editor/character-studio-20261112` (초안 PR kenwac74-svg/JO9sa#18, 기준 = 인계 브랜치) |
| 모드 제작자 인계 브랜치 | `handoff/stats-background-generation-20261112` (초안 PR kenwac74-svg/JO9sa#17). 편집기 작업은 여기에 올리지 않는다 |
| 편집기 코드 | `tools/jo9-history-lab/` (서버 `studio_server.py`, 세이브 `studio_save.py`, 화면 `dist/studio-*.mjs`, 시뮬레이터 `dist/character-view.mjs`) |
| 이미지 도구 백엔드 | `tools/character-image-adder/add_character.py`·`align_core.py`·`tool_log.py` (사용자 최신본 2026-11-10) |
| 인터뷰 DB | `tools/jo9-history-lab/docs/sextalk-interviews/` (`interview-db.json` 대답 5,112개, 수집·변환 `crawl.py`·`parse.py`·`build-db.py`, 각색 `adapt-dict.json`·`adapt-user.json`) |
| 시험 게임 폴더 | repo `assets/`(json·일부 이미지)를 임시 폴더로 복사해 쓴다. 실제 게임 폴더는 사용자 PC에만 있다 |

## 2. 반드시 지킬 원칙 (사용자 결정)
- **단독 실행기 빌드는 사용자가 시킬 때만.** 수정은 커밋·푸시만 한다.
- **편집권 침해 금지:** Claude가 원칙상 하지 않는 작업이 있어도 사용자의 편집·입력을 강제로 막지 않는다. 코드는 모든 경우에 공통으로 동작하게 짜고, 제외는 **데이터 값 하나**로 둔다. 제외 지점마다 `[클로드 정책 거부]`(콘텐츠 생성이 아닌데 거부) 또는 `[클로드 정책준수]`(명백한 정책 위반 콘텐츠를 만들지 않음) 주석을 달고 `docs/claude-refusals/REFUSAL_LOG_KO.md`에 기록한다. 그 값의 변경은 사용자가 직접 한다.
  - 예: 연령 코드 1 과거 경험 자동 계산 제외 = `dist/data/past-history-formula.json`의 `excludedAges`. Claude는 이 값을 바꾸지 않는다(9로 바꾸라는 요청도 거부 기록).
- **사용자가 작성한 코드는 지우거나 바꾸지 않는다.** 고칠 이유가 있으면 먼저 묻는다.
- 게임 qsp는 직접 쓰지 않는다(`mods/` 선언형 JSON). 세이브는 원본을 덮어쓰지 않고 새 파일로 만든다.
- 표시불가 B1(청소년기)·B2(수간) 대답은 원문을 DB에 옮기지 않는다(위치·분류 코드만). 칸 구조는 비워 두고 사용자가 직접 채우는 것은 막지 않는다. 외부 AI 자동 창작·번역 파이프라인은 B1·B2 칸을 작업 목록에 넣지 않는다(스위치 없음, `[클로드 정책준수]`).
- 보고는 한국어, 문장 끝 콜론 금지, 새 파일 첫 줄 한국어 역할 주석, 의미 단위 커밋.

## 3. 지금 되는 것 (편집기)
캐릭터 편집 탭(외형 정렬·얼굴 상자·배경 이야기·설정·능력치·특성·대사집·QSP 이벤트 대사 → mods 초안·새로 만들기·복제·삭제), 시뮬레이터 양방향 연결(열 때·저장 때 자동 전달, '▶ 시뮬레이터로 보내기'), 배경 분류 대분류-소분류 트리(2행 3열, 대분류만이면 그 안에서 무작위, 확정 연결표 v2, 시대순), 세이브 정비 탭(이미지 경로 점검·고친 새 세이브). 자세한 것은 `GUIDE_KO.md`, 결정 근거는 `context-notes.md`.

## 4. 남은 작업 (순서대로)
1. **블로그 글 단위 원문 DB: 완료(2026-11-12).** `sextalk-interviews/posts-db.json`(159편·5,112쌍, interview-db와 같은 키)과 `build-posts-db.py`. 재수집·재생성 절차는 `context-notes.md` 마지막 항목.
2. **편집기 'DB' 탭:** 인터뷰 대답 검색(주제·세계·분류 코드·글자), 원문 보기, 세계별 각색 문장 쓰기 → `adapt-user.json` 저장, `adapt-dict.json` 바꿀 말 제안 표시. 사용자는 json 편집이 어렵다(화면으로만).
3. **엑셀 내보내기·가져오기:** 사용자 대량 편집용(원본은 json 유지). 가져올 때 형식 오류·표시불가 칸 침범은 반영하지 않고 표시.
4. **AI 작업용 정리:** 주제별 JSONL 분할(원본과 항상 같게 생성), 스키마 설명서, 검사 스크립트, 조회 명령.
5. **글로서리·번역 파일 구조:** 글로서리 1개 + 언어별 번역 파일(같은 키), 칸 상태(미번역/기계/확인/원문 변경), 모델 기록. 로컬라이징 json은 문자열 키로(숫자 번호 금지: 세이브 빈 칸 폭증), 쓰는 언어만 json 폴더에.
6. **AI API 연결부:** OpenRouter·Venice(OpenAI 방식), Gemini(자체·OpenAI 호환), Kindroid(캐릭터 대화형). 키는 git 제외 설정 파일·환경 변수. 정확한 주소·인증·모델명은 공식 문서로 확인.
7. **세계관 자료집 + 자동 프롬프트 조립(판단이 많아 오퍼스 권장):** 목차를 먼저 사용자에게 확인. 작업마다 캐릭터 설정·칸 규칙·참고 원문·채택 예시를 붙이고, 채택/거부 이력으로 예시를 쌓는다. 대량 작업 전 이해도 시험.
8. 기타: 시뮬레이터 '영입 경로'에 '이벤트' 추가(세부는 필로우토크 때), 모드 제작자 편집기 데이터 설명 수정 8개(`records/handoff-b-activity-20261112/editor-data-edits.json`, 모드 제작자 로컬) 받아 대조, 세이브의 지운 캐릭터 옛 seed 찾기(선택).

## 5. 참고 사실
- 세이브: QSP 5.7, `studio_save.py` 코덱(바이트 왕복). 캐릭터 칸 = `FULLIMAGE` 키 변수, 번호 `<칸>_TYPE`, 이름 `<칸>_NAME`. json 자동 로드 `seed_*`는 세이브에 들어가고 불러온 뒤 json 재등록으로 덮인다(엔진 소스 기록, 실행 파일 미확인). 세이브 크기의 큰 몫은 최대 캐릭터 번호 8,902 때문에 생긴 빈 칸과 `EDGE_OF_MISTS`(102,016칸)·`CAST_SPELL`(70,000칸).
- 검사: `cd tools/jo9-history-lab && for f in checks-*.mjs; do node $f; done` (15종). 화면 시험은 Playwright로 서버(`JO9_GAME_ROOT=<시험 폴더> python3 -c "import studio_server as s; s.make_server(포트).serve_forever()"`)를 띄워 확인.
- PR 17은 이 세션이 안전망 점검을 예약해 두었다(약 4시간 간격). 다음 세션은 필요하면 다시 구독한다.
