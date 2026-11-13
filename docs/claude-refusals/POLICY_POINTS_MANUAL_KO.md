<!-- Claude 정책 때문에 편집기에서 기능이 없거나 비어 있는 곳의 파일·줄·동작 안내(사용자가 직접 고칠 때 보는 지도, 2026-11-13) -->
# 정책 제외 지점 지도 (사용자 수동 편집용)

- 경로는 `tools/jo9-history-lab/` 기준이다. 줄 번호는 커밋 379aa5df 기준이며, 파일이 바뀌면 조금 밀릴 수 있다. 검색어로 찾는 것이 정확하다.
- 모든 지점은 주석 `[클로드 정책 거부]` 또는 `[클로드 정책준수]`가 붙어 있다. 편집기 폴더 전체에서 이 두 낱말을 검색하면 다 나온다.
- 기록과 사유는 `REFUSAL_LOG_KO.md`, `REASONS_KO.md`. 지침은 `CLAUDE_POLICY_GUIDE_KO.md`.

## 1. 값 하나만 바꾸면 되는 것 (데이터 스위치)
| # | 무엇이 안 되나 | 파일 · 위치 | 지금 값 | 바꾸면 |
|---|---|---|---|---|
| 1 | 연령 코드 1: 과거 경험 자동 계산, 필로우토크 자동 대사, 시뮬레이터 필로우토크 칸, 대사집으로 '시뮬레이터 담기'의 대사·과거 경험 | `dist/data/past-history-formula.json` 23줄 `"excludedAges"` | `[1]` | `[]`로 바꾸면 이 표의 1번 항목이 모두 다른 연령과 같은 코드로 돈다. 서버(`studio_server.py` 282줄 `excluded_ages()`)·공식(`dist/past-history.mjs` 85줄)·필로우토크(`dist/pillow-talk.mjs` 155줄)·사실(`dist/past-facts.mjs` 30줄)·시뮬레이터(`dist/character-view.mjs` 103·147·155·217·400줄)·대사집(`dist/studio-view.mjs` 321·431줄)이 모두 이 값 하나를 읽는다. 편집기 '산식 계수' 탭에는 표시만 있고 바꾸는 칸은 없다 |
| 2 | 살던 세상의 동물 경험(B2) 사실이 뽑히지 않음 | `dist/data/past-facts.json` 342줄 `"homeAnimal"` → `"pctByWorld"` | 세계별 모두 0 | 세계별 % 값을 넣으면 그 비율로 사실이 뽑힌다. 대사는 없다(3장 표 2번) |
| 3 | 엔진 표본(뽑기 분포·검사용 2.5MB)에 연령 코드 1이 없음 | `docs/sim/run-generate-stock.cjs` 35줄 | `no_loli = 1` | `0`으로 바꾸고 스크립트를 다시 돌려 `dist/data/generated-stock.json`을 새로 만든다 |

## 2. 사용자 PC에서 도구로 채우는 것
| # | 무엇이 비어 있나 | 채우는 법 |
|---|---|---|
| 4 | 인터뷰 DB의 청소년기·수간 분류 대답 523개 원문 | `docs/sextalk-interviews/fetch_originals.py`(ZIP의 `인터뷰_원문_가져오기.bat`)가 원본 글에서 가져와 `local/`에 채운다. 편집기 DB 탭·엑셀·시뮬레이터 원본 참조가 자동으로 그 사본을 읽는다 |
| 5 | 주인공 카드 9·10번 내력 | `docs/character-studio/world-bible/01a_heroes_KO.md`에서 직접 쓴다 |

## 3. Claude가 문장을 만들지 않아 자리표시만 있는 것 (입력은 열려 있음)
| # | 무엇 | 위치 | 직접 쓰는 곳 |
|---|---|---|---|
| 6 | 첫 경험이 청소년기(B1)로 뽑힌 노예의 첫 경험 대사 | `dist/character-view.mjs` 132줄 (자리표시 '[이 대사는 표시 불가합니다.]'), 사실 생성 `dist/past-facts.mjs` 63줄 | 시뮬레이터 필로우토크 칸(입력창 열림, 2026-11-13 잠금 해제) 또는 캐릭터 편집 › 대사집 |
| 7 | 이종 경험 중 표시불가 장면·살던 세상의 동물 경험(B2) 대사 | `dist/character-view.mjs` 136·139줄 | 같음 |

## 4. 다른 AI 자동 작업 목록에서 빠지는 것 (Claude 파이프라인)
| # | 무엇 | 위치 | 비고 |
|---|---|---|---|
| 8 | 다른 AI 작업 파일 `ai/*.jsonl`에 청소년기·수간 523개가 없음 | `docs/sextalk-interviews/ai-tools.py` 30·88줄(`text_withheld`) | 저장소 DB에 원문이 없어서다. 로컬 원문 사본으로 작업 파일을 만들려면 이 두 줄의 조건과 읽는 DB 경로(`local/interview-db.json`)를 바꿔야 한다 |
| 9 | 'AI 연결' 탭 번역 보내기가 그 키를 거부 | `ai_api.py` 159줄(`part_source`), 번역 목록 `docs/sextalk-interviews/i18n-tools.py` `source_parts()` | 같음 |

## 5. 이미 풀린 것 (기록)
- 시뮬레이터 필로우토크 표시불가 칸 입력창 잠금 → 2026-11-13 해제(`dist/character-view.mjs` 169줄).
- 대사집 저장에서 연령 코드 1 차단 → 2026-11-12 해제.
- 엑셀·DB 탭에서 표시불가 행을 빼던 것 → 2026-11-13 해제(행·링크 유지).
- 엑셀 가져오기에서 표시불가 행의 세계 열을 무시하던 것 → 2026-11-13 해제.
