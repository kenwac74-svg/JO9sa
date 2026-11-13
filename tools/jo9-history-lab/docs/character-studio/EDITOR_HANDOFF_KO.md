<!-- 통합 캐릭터 편집기 작업 전체 인계(2026-11-13): 정책·사용자 규칙·원하는 것·구조·데이터 규정·필로우토크·실행·검사·남은 일 -->
# 통합 캐릭터 편집기 전체 인계 (2026-11-13)

이 문서 하나로 편집기 작업을 이어받는다. 세부는 각 장의 링크 문서를 본다. **이미 정한 것은 다시 묻지 않는다.** 결정 대기 목록은 `OPEN_QUESTIONS_KO.md`.

## 0. 읽는 순서
1. 이 문서
2. `docs/claude-refusals/CLAUDE_POLICY_GUIDE_KO.md`(정책 적용 지침, 사용자 확정) → `REFUSAL_LOG_KO.md`(기록) → `REASONS_KO.md`(기술 사유)
3. `docs/CREATIVE_INTENT_RULES_20261015.md`(사용자 기본 지침)
4. `OPEN_QUESTIONS_KO.md`, `checklist.md`, `context-notes.md`(이 폴더)
5. 저장소 `CLAUDE.md`, `AGENTS.md`, `docs/PROJECT.md`

## 1. 위치
| 항목 | 값 |
|---|---|
| 편집기 브랜치 | `editor/character-studio-20261112` (초안 PR kenwac74-svg/JO9sa#18, 기준 = 인계 브랜치) |
| 모드 제작자 인계 브랜치 | `handoff/stats-background-generation-20261112` (초안 PR kenwac74-svg/JO9sa#17). 편집기 작업은 여기 올리지 않는다. 모드 제작자용 기획서만 올린다 |
| 편집기 코드 | `tools/jo9-history-lab/` |
| 이미지 도구 백엔드 | `tools/character-image-adder/` (`add_character.py`·`align_core.py`·`tool_log.py`, 사용자 최신본) |
| 인터뷰 DB | `tools/jo9-history-lab/docs/sextalk-interviews/` |
| 세계관 자료집 | `tools/jo9-history-lab/docs/character-studio/world-bible/`, 목차 `WORLD_BIBLE_TOC_DRAFT_KO.md` |
| 게임 qsp 기준 | 사용자 최신본 `4354cf39…`(Drive jack.7z). 모드 제작자 작업본은 B 반영 `29f4c048…`. 저장소 `assets/runtime/2.4.1/jack.qsp`는 `8332e185…`(옛것) |
| 사용자 PC 작업 | 작업 ZIP(`build-work-zip.py`)을 풀어 씀. 게임 폴더는 사용자가 알려 준다(예 `C:\MOVE\Jack O Nine Tails v2.4.1_Kor_Full\game\…`) |

## 2. 정책 (사용자 확정, 반드시 지킴)
### 2.1 Claude 정책 적용 지침 요지 (`CLAUDE_POLICY_GUIDE_KO.md`)
- Claude가 **하지 않는 것**은 하나: B1(미성년)·B2(수간) 성적 문장을 Claude가 쓰거나 옮겨 적거나 번역·각색·요약해 **Claude가 만드는 파일**에 넣는 것.
- **언제나 하는 것**: 행·칸·키를 빼지 않는다, 메타데이터(키·주제·분류·개수·링크·정렬·검색)는 다 다룬다, 코드는 모든 경우에 공통으로 짜고 제외는 데이터 값 하나로 둔다(값은 사용자가 바꿈), 사용자 편집권을 막지 않는다, 사용자가 쓴 코드·글을 지우거나 바꾸지 않는다.
- **원본 연결 방식**: Claude는 원문의 **위치 색인**(글 주소·질문 번호·차례·부분 지문)과 질문 성격 키(`first_age` 등), 행·열 구조만 만든다. 원문은 사용자가 스크래퍼(`fetch_originals.py`)로 자기 PC에 가져온다. **Claude는 원문을 읽어 문장 단위로 판단·가림하지 않는다**("네가 정책판단을 하느라 모든 텍스트를 읽는게 문제").
- 데이터가 빠지거나 기능이 바뀌는 제외가 필요하면 **구현 전에** 몇 개가 빠지는지·이유·대안을 알리고 결정을 받는다.
- 기록: 콘텐츠 생성이 아닌데 막은 것 `[클로드 정책 거부]`, 명백한 정책 위반 콘텐츠를 만들지 않은 것 `[클로드 정책준수]`. 제외 지점마다 주석 + `REFUSAL_LOG_KO.md`.
- 지금 걸린 제외 지점: 과거 경험 자동 계산 연령 코드 1(`dist/data/past-history-formula.json` `excludedAges: [1]`), 엔진 표본 `no_loli = 1`(`docs/sim/run-generate-stock.cjs`), 필로우토크 B1 첫 경험·B2 대사 자리표시, 주인공 카드 9·10번 내력 미작성(칸은 비워 둠). 인터뷰 DB의 B1·B2 523개는 저장소에 원문 없음(색인만).

### 2.2 사용자 기본 지침 (`CREATIVE_INTENT_RULES_20261015.md`)
- 세계관과 개발 의도를 보존한다. 현실의 가치판단으로 설정을 바꾸지 않는다. 지원 제한을 게임 규칙으로 위장하지 않는다. 사용자 기획·Claude 제안·제한·실제 구현을 구분해 보고한다.

### 2.3 작업 규칙 (사용자 지시 모음)
- **편집기 빌드·배포 ZIP은 사용자가 시킬 때만.** 평소엔 커밋·푸시만.
- 게임 qsp는 직접 쓰지 않는다. **게임 수정은 모드 제작자에게 기획서로 넘긴다**("기획서만 만들어 어차피 모드 제작자가 해야한다"). `mods/` JSON을 직접 만들지 않는다.
- 세이브는 원본을 덮어쓰지 않고 새 파일. 세이브 정비 범위는 **버전 불일치 문제(이미지 경로 등) 해결**이지 전역 편집이 아니다.
- 사운드 바이너리는 git에 올리지 않는다.
- 보고는 한국어, 문장 끝 콜론 금지, 새 파일 첫 줄 한국어 역할 주석, 의미 단위 커밋, 커밋 끝에 Co-Authored-By·Claude-Session 줄.
- 코드를 고치면 검사를 돌린 뒤 완료라고 한다.
- **토큰을 아낀다.** 이미 있는 구조(예: 원문 = 글 주소 + 질문 번호 색인)를 먼저 쓰고, 큰 재설계 전에 더 단순한 길이 있는지 본다. 판단이 필요한 큰 일만 묻고, 정해진 것은 묻지 않는다.

## 3. 사용자가 원하는 것 (목표)
1. **시뮬레이션 + 편집기**(시뮬레이터를 빼지 않는다). 캐릭터의 외형·서사·대사·설정·능력치·특성을 모두 편집. 대사집은 별도 파일. 새로 만들기·복제·삭제. 편집 값 저장 버튼, 편집기 → 시뮬레이터 보내기.
2. 유니크 캐릭터도 세계·출신·직업을 정하면 그 값이 고정.
3. 배경 선택: 대분류-소분류 트리, **2행 3열**(세계 대분류·소분류가 한 열), **시대순**, 대분류만 고르면 그 안에서 무작위, 소분류를 고르면 해당 대분류만.
4. 사용자는 혼자 손으로 편집하며 **JSON 편집이 어렵다** → 표·엑셀로 편집(통합 DB, `DB_PLAN_KO.md`).
5. **다른 AI(Venice·Gemini·OpenRouter·Kindroid)에게 번역·창작(각색)을 맡긴다.** Claude는 세계관 자료집·각색 지침·작업 파일·프롬프트 조립을 만든다. 초기 프롬프트만으로는 세계관 이해가 떨어지므로 자료집이 필요.
6. 인터뷰 DB에서 **원본 블로그로 바로 갈 수 있게**(매번 블로그와 대조하기 힘듦). 원문은 DB에서 꺼내 본다.
7. 어느 PC에서나 로컬 작업: 작업 ZIP, **앱 창**(브라우저·포트·캐시 문제 없이).
8. 모드 제작자와 역할 분담: 게임 반영·실행 확인은 모드 제작자/사용자, 편집기·기획·자료는 Claude.

## 4. 구조
### 4.1 서버·실행
| 파일 | 역할 |
|---|---|
| `start-studio-app.py` | **앱 창 실행기**(pywebview, 포트 7719 고정, 창 닫으면 서버 종료, 저장소 `.app-data/`). 없으면 브라우저 방식으로 |
| `start-history-lab.py` | 브라우저 실행기. 7689~7709 중 같은 버전이면 열고, 다른 버전(옛 편집기)이 떠 있으면 건너뜀(`/build.txt` 대조) |
| `studio_server.py` | 로컬 서버. API(`ROUTES_GET`/`ROUTES_POST`), 정적 파일은 **`/v/<빌드>/` 주소**로 냄(브라우저 캐시의 옛 파일과 안 섞임), `BUILD_ID`(dist·서버 파일 지문), `local/` 참조표 우선 |
| `studio_save.py` | QSP 5.7 세이브 코덱(바이트 왕복), 캐릭터 칸 = `FULLIMAGE` 키 변수 |
| `studio_interview.py` | 인터뷰 DB 검색·보기·각색 저장. `local/`의 `interview-db.json`·`posts-db.json`을 먼저 읽음 |
| `studio_excel.py` | 각색 엑셀 내보내기·가져오기(외부 라이브러리 없음, 5,112행, 자동 필터, 원본 링크 하이퍼링크, 키 기준 가져오기) |
| `ai_api.py` + `ai-providers.json` | AI API(OpenRouter·Venice·Gemini OpenAI 방식, Kindroid는 사용자 입력창). 키는 `ai.local.json`(git 제외) |
| `build-standalone.py` | 한 파일 단독 실행기 빌드(시킬 때만) |
| `build-work-zip.py` | 사용자 PC 작업 ZIP 빌드(시킬 때만) |

### 4.2 화면 탭(`dist/`)
캐릭터 편집(`studio-view.mjs`·`studio-look.mjs`) · 캐릭터 시뮬레이터(`character-view.mjs`) · 산식 계수(`coef-view.mjs`) · 특성 편집(`trait-editor.mjs`) · 배경 설정 목록(`backgrounds.mjs`) · 뽑기 분포(`sim-view.mjs`) · DB(`studio-db.mjs`) · AI 연결(`studio-ai.mjs`) · 세이브 정비(`studio-save.mjs`). 앱 틀 `app.mjs`. 계산: `past-history.mjs`(과거 경험 공식), `past-facts.mjs`(섹스토크 사실), `pillow-talk.mjs`(대사 조립), `sim-data.mjs`(배경 v2 옵션·정리), `background-connections.mjs`(확정 연결표 v2).

### 4.3 데이터(`dist/data/`)
`backgrounds.json`(개정 배경 대사), `background-drafts.json`(신규 초안: 지구 고대 로마 등), `background-categories.json`(대분류·소분류·시대), `occupation-specs.json`(직업 명세: add/final·가중치), `past-history-formula.json`(과거 경험 계수, `excludedAges`), `past-facts.json`(사실 확률표), `first-time-drafts.json`·`xeno-talk-drafts.json`(Claude 대사 초안), `interview-refs.json`(원본 참조표, B1·B2 원문 null), `first-time-interviews.json`, `acquisition-routes.json`(영입 경로), `traits*.json`, `generated-stock.json`(엔진 표본 2.5MB, 읽기 전용), `game-seed-keys.json`, `isabella-source.json`.

## 5. 데이터 추출·정렬 규정
### 5.1 인터뷰 DB (`docs/sextalk-interviews/`, 인계 `BLOG_SCRAPE_HANDOFF_KO.md`)
- 키 `p글번호.q질문번호`(같은 글에 같은 번호가 또 있으면 `.2`), 부분 키 `키.sNN`(줄·문장·`1)` 보기 번호로 나눔). **글번호 = 블로그 수집 순서, p0000이 최신 글.** 새 글을 그대로 다시 수집하면 번호가 밀린다(주의).
- 주제 키 = 질문 번호(Q1~Q32, `INTERVIEW_QUESTIONS_KO.md`). 예 Q1 `first_age`, Q2 `first_time`, Q3 `age_gap`.
- 분류(기계적 정규식, `build-db.py`): B1 청소년기, B2 수간, B3 근친, B4 금기 목록, B5 현대 SNS, B9 빈 대답. `display`(게임 표시 가능), `game`(게임용 주제), `text_withheld`(저장소에 원문 없음 = B1·B2).
- 저장소 원문: B1·B2 523개 제외. 사용자 PC `local/`(git 제외)에 `fetch_originals.py`가 전부 채움(시험: 채움 523, 찾지 못함 0, 지문 불일치 0).
- 파생 파일: `posts-db.json`(글 단위, 질문 문장 포함), `dist/data/interview-refs.json`(시뮬레이터 참조), `ai/*.jsonl`(다른 AI 작업용 4,265줄, B3~B9 포함·빈 대답과 원문 없는 523 제외), `i18n/`(번역 단위·글로서리), `blocked-index.json`, `withheld-locator.json`.
- 엑셀: 열 = 키·주제·분류·원본 글 링크·대답 원문(수정 금지)·세계 13열. 자동 필터, 정렬해도 가져오기는 키 기준. 세계 열 → `adapt-user.json`.
- 바꿀 말 사전 `adapt-dict.json`: 12범주 × 13세계, 값 문자열 = 치환(A1), `{rewrite}` = 다시 쓰기(A2), null = 그 세계에 없음/그대로. 선사~마법 6세계는 사용자(다른 AI) 각색 대상(U).

### 5.2 배경·시뮬레이터
- 세계·출신·직업은 **시대순**(선사 → 고대 → 중세 → 판타지 → 근대 → 현대 → 미래, `background-categories.json`). 대분류-소분류 트리, 2행 3열. 확정 연결표 v2(`buildCoherentConnections`)로 가능한 조합만. 상위만 고르면 그 안에서 무작위. 하위를 고르면 그 대분류만 남기고 하위 단계만 정리(pruneV2).
- '뽑기 분포' 탭은 옛 게임 풀(`backgrounds.json` pools)을 그대로 쓴다.
- 직업 명세: 개별 확률은 **기본 추첨 확률에 더하는 값**이 대부분(add), 일부는 최종 비율(final).

### 5.3 영입 경로 (`acquisition-routes.json`)
- 게임 코드 추적으로 13경로 + 이벤트 17종(시장·길드 / 암시장·밀수 / 전투·포획 / 이벤트). ★ = 다른 세상에서 바로 온 상태(안개 경계·경매장·밀수업자·암시장, 로마 관습 모름). `patrol` 키는 past-facts가 순찰 장면 번호를 읽으므로 유지.

## 6. 필로우토크(섹스토크) 시스템 — 차기 업데이트, 게임 미반영
근거: 인계 브랜치 `docs/session-handoffs/2026-11-12/NEXT_UPDATE_PILLOW_TALK_HANDOFF_KO.md`, `docs/JO9_Pillow_Talk_Rules_v1_20261112.md`, `docs/JO9_Sex_Talk_Planning_v0_20261112.md`, `docs/JO9_Past_History_Formula_20261111.md`.
- **과거 경험 공식**(`past-history.mjs`): 총횟수 = 기준량(기술 등급) × 직업 × 출신 × 세계 × 연령 × 성욕 특성 × 기본 속성 × 특성 키워드 × 변동. 처녀 고정 배경 0. 질·구강·애널 배분은 기술 등급². **모든 특성 추첨이 끝난 뒤 맨 마지막**에 계산. 연령 코드 1은 계산하지 않음(`excludedAges`).
- **커맨드**: 대화하기 > 질문한다 아래, 하루 1회, 행동력 0.5. 거부 순서 절망 ≥ 3 → 응석 ≥ 3 → 인식 ≤ 2(각 고정 문구). 헌신 1~5로 질문 22개가 열림.
- **말투**: 성격 9유형(E = temper + sensitivity, A = ego + pride; 불꽃·도도·솔직·평범·관조·얼음·순종·여린·인형), 말투 1 격식(maid·valertry·secretary·nun·policewoman·mind_contol·time_plice·jailer·academy·mech)·2 일반 존댓말, 반말은 지정 유니크 8명만. 관계 모드(적대·두려움·우울·무너짐·기대·의무·헌신·중립), 감정 깊이 0~2. 호칭표: 초기 상태(사육·헌신·두려움 모두 1 이하)·적대면 반말·당신, 세습 귀족·공주 초기 상태는 너/네놈(인식 2 이상이면 안 함), 주인에게 비속어 금지.
- **거짓말**: 이 노예에 대한 장악력 < 0이면 다른 노예의 기존 답(오답)으로 답함. 장악력은 대상별 계산(`jo9_supermacy`, 인계 1 mod).
- **사실**: 영입 때 한 번 정해 저장(`past-facts.mjs`), 언제 물어도 같은 사실. 두 층 = 영입 전 과거(고정) + 영입 후 누적(주인·주인 외(창관·길거리)·이종, 게임 행동마다 증가).
- **첫 경험**: 성인은 고유어 나이("스물두 살 때였어요.."). 세계별 평균 선사 14, 야만 15, 지구 고대 로마 16, 현대 18(표준편차 2), 19 미만은 B1 표시불가(자리표시).
- **이종 경험**: 영원의 로마 안의 일만. 안개 경계 순찰 구출 장면(611xx: 촉수·괴물·와그·오크(61114) 포함), 성경험 횟수·상대 수에 포함. 이전 주인 촉수 착정은 영원의 로마에 오래 머문 유니크에게만 수동 지정. 로마 외 세계 출신은 촉수 착정 없음.
- **상대 수**: 한 명당 평균 횟수 접객업 2·밤 문화 5·그 밖 10·기혼 100. 전직 노예는 성 기술 평균 3 이상이면 성노예 2, 아니면 집 노예 10.
- **대사 자료**: Claude 초안(첫 경험 12행·이종 18행·조각 62행)은 규칙 시험용 프리셋. 22개 주제 중 나머지 19개는 원본 DB를 다른 AI·사용자가 각색. 시뮬레이터에서 칸마다 직접 편집·원본 DB 연결.
- **저장 방식**(QSP vs 별도 JSON)은 모드 제작자가 판단. JSON 자동 로드(`seed_*`)는 세이브에 들어감을 확인했다.

## 7. 세계관 자료집 (다른 AI용)
- 확정(2026-11-13): 장 구성, 3장 인물 30명, JO9 한국어 개정 우선(원작은 참고), 한국어 한 벌, 1장 핵심 요약 1,500자 안팎. 제미니 위키(`reference/gemini-wiki-20261113.html`)는 참고만, qsp와 대조한 것만 씀.
- 본문 있음: 1장 영원의 로마(노예상 일상·지위), 1a 주인공 카드(남성 1~18, 여주인공은 한국어판 삭제, 9·10번 칸만), 2장 장소, 3장 세력·인물 30, 5장 세계별 각색 지침(13+지구 고대 로마), 8a장 인터뷰 대답 각색 요령.
- 남음: 4장, 6장(출신 57·직업 66), 7장(말하기), 8장(필로우토크), 9장(문체), 10장(분류 코드 뜻만, AI에게 지시하지 않음), 11장(용어집), 부록 A~C(조립 틀, 채택·거부 이력, 이해도 시험).
- 원문 기준 용어: 영원의 로마(원문 '불멸의 로마'), 가문은 **카미라**(키메라는 생물), 타우루스 왕 **국왕 아르보리우스**, 경매인 **파리드**(잡파는 옛 한글판 오염), 경기 주기 **10일**. 게임 반영은 모드 제작자 기획서(`docs/session-handoffs/2026-11-13/LORE_FIX_SPEC_KO.md`, 인계 브랜치).

## 8. 검사·시험
- 검사 15종: `cd tools/jo9-history-lab && for f in checks-*.mjs; do node $f; done`
- 인터뷰: `python3 -I ai-tools.py check`, `python3 -I i18n-tools.py check`(`docs/sextalk-interviews/`)
- 화면: `JO9_GAME_ROOT=<시험 게임 폴더> python3 -c "import studio_server as s; s.make_server(포트).serve_forever()"` 후 Playwright. 시험 게임 폴더는 저장소 `assets/`(json·일부 이미지)를 임시 폴더로 복사.
- 엑셀 왕복: `studio_excel.export_xlsx()` → `check_import()` 변경 0.

## 9. 주의 (함정)
- **`dist/` 새 파일은 `git add -f`**(.gitignore 첫 줄 `dist/`). 커밋 뒤 `git ls-files`로 확인.
- `local/`(인터뷰 원문)·`.app-data/`(앱 창 저장소)·`ai.local.json`은 git 제외.
- 사용자 PC 윈도우: `curl` 인증서 폐기 검사 실패(`CRYPT_E_NO_REVOCATION_CHECK`) → `fetch_originals.py`는 urllib 우선. `crawl.py`는 아직 curl.
- 브라우저 캐시로 옛 편집기가 보이던 문제 → `/v/<빌드>/` 주소와 실행기 버전 대조로 해결. 앱 창은 포트 7719 고정(설정이 포트별로 저장되므로).
- 다른 세션(소넷 등)이 같은 브랜치에 푸시할 수 있다 → 푸시 거절 시 `git pull --rebase` 후 다시.
- 앱 창(pywebview)은 윈도우 실기 미확인.

## 10. 남은 일 (우선순위 제안)
1. `OPEN_QUESTIONS_KO.md` A1~A7 결정 받기.
2. 통합 DB(`DB_PLAN_KO.md`) 구현.
3. 세계관 화면 + AI 연결 탭 프롬프트 자동 조립.
4. 세계관 자료집 나머지 장.
5. 모드 제작자 편집기 데이터 설명 수정 8개 대조(받으면).
6. 블로그 새 글 번호 유지 처리, `crawl.py` urllib.
7. (선택) 세이브의 지운 캐릭터 옛 seed 찾기.

## 11. 문서 지도
| 문서 | 내용 |
|---|---|
| `OPEN_QUESTIONS_KO.md` | 결정 대기·사용자 확인·받을 것 |
| `DB_PLAN_KO.md` | 통합 DB 기획 |
| `WORLD_BIBLE_TOC_DRAFT_KO.md`, `world-bible/` | 세계관 자료집 |
| `GUIDE_KO.md`, `PLAN_KO.md`, `checklist.md`, `context-notes.md` | 편집기 사용법·기획·할 일·결정 기록 |
| `AI_API_KO.md` | AI API 연결 |
| `docs/sextalk-interviews/BLOG_SCRAPE_HANDOFF_KO.md`, `INTERVIEW_QUESTIONS_KO.md`, `AI_WORK_SCHEMA_KO.md`, `I18N_KO.md`, `INTERVIEW_DB_KO.md` | 인터뷰 DB |
| `docs/claude-refusals/` | 정책 지침·기록·사유서 |
| 인계 브랜치 `docs/session-handoffs/2026-11-12/`, `2026-11-13/` | 모드 제작자 인계 1~3, 기획서 |
