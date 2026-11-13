<!-- 인터뷰 블로그 수집·색인·원문 가져오기 인계: 도구 순서, 키 규칙, 새 글이 생겼을 때 주의점, 윈도우 문제 -->
# 인터뷰 블로그 수집·원문 가져오기 인계 (2026-11-13)

## 1. 한 줄 요약
- 원본: `https://kurathekura5.blogspot.com` 인터뷰 글 159편, 대답 5,112개(고정 질문지 Q1~Q32, `INTERVIEW_QUESTIONS_KO.md`).
- 저장소에는 **색인**(키 → 글 주소·질문 번호·차례·부분 지문)과 분류·주제 키가 있다. 청소년기·수간(B1·B2)으로 분류된 523개는 저장소에 원문이 없다.
- 원문은 사용자 PC에서 `fetch_originals.py`가 색인대로 원본 글에서 가져와 `local/`(git 제외)에 채운다. 편집기는 `local/`이 있으면 그것을 읽는다.

## 2. 파일
| 파일 | 역할 | 원문 포함 |
|---|---|---|
| `crawl.py` | 블로그 목록을 따라 글 주소(`urls.txt`)와 글 HTML(`pages/`)을 모은다(처음 DB를 만들 때 쓴 것) | 결과물에 있음, 저장소에 안 올림 |
| `parse.py` | 글 HTML에서 제목·날짜·Q/A 쌍을 뽑아 `posts.json` | 결과물에 있음, 저장소에 안 올림 |
| `build-db.py` | `posts.json` → `interview-db.json`(키·주제·분류·부분 지문), `blocked-index.json`, `withheld-locator.json`, `first-time-interviews.json`, `INTERVIEW_DB_KO.md` | B1·B2 제외 원문 |
| `build-posts-db.py` | 글 단위 `posts-db.json`(질문 문장 포함) | B1·B2 제외 원문 |
| `build-refs.py` | 시뮬레이터 원본 참조표 `dist/data/interview-refs.json` | B1·B2 제외 원문 |
| **`fetch_originals.py`** | 색인으로 원문을 가져와 `local/`에 `interview-db.json`·`posts-db.json`·`interview-refs.json` 사본 | `local/`에 전부 |
| `ai-tools.py` | 다른 AI 작업용 `ai/*.jsonl`(저장소 DB 기준 4,265줄) | B1·B2 제외 원문 |
| `i18n-tools.py` | 번역 파일·글로서리 | — |
| `adapt-dict.json`, `adapt-user.json` | 바꿀 말 사전, 사용자 각색 문장 | — |

## 3. 키 규칙 (가장 중요)
- 대답 키 `p글번호.q질문번호`(같은 글에 같은 번호가 또 나오면 `.2`). 부분 키 `키.sNN`(줄·문장·`1)` 보기 번호로 나눈 차례).
- **글번호는 `crawl.py`가 모은 순서(블로그 최신 글이 p0000)다.** `p0000` = 2023-05 글, `p0158` = 2014-03 글.
- 부분 지문 `sha` = 부분 원문의 SHA-256 앞 12자. `fetch_originals.py`가 원문을 가져올 때 이 값으로 원본이 바뀌었는지 확인한다.

## 4. 평소 쓰는 법 (사용자 PC)
```
cd tools/jo9-history-lab/docs/sextalk-interviews
python -I fetch_originals.py          # 원문이 없는 523개만 채움 (2~3분)
python -I fetch_originals.py --all    # 전부 원본에서 다시 가져옴
```
- 결과 끝 줄: `채움 N개 · 찾지 못함 N개 · 지문 불일치 N개`. 찾지 못함·지문 불일치가 0이 아니면 원본 글이 고쳐졌거나 지워진 것이다(5장).
- ZIP 판에서는 `인터뷰_원문_가져오기.bat`(인자 `--all` 가능).
- 내려받은 글 HTML은 `local/pages/`에 남아 다음 실행 때 다시 받지 않는다. 다시 받으려면 그 폴더를 지운다.

## 5. 주의
1. **새 글이 올라왔을 때 `crawl.py`부터 다시 돌리면 글번호가 모두 밀린다**(최신 글이 p0000이 되므로). 기존 키(대사집·참조·각색 문장에 저장됨)가 다른 글을 가리키게 된다. 새 글을 넣으려면 기존 글은 주소로 맞춰 번호를 유지하고 새 글에만 뒤 번호(p0159~)를 주는 처리를 먼저 만들어야 한다(아직 없음).
2. 원본 글이 고쳐지면 지문 불일치가 난다. 그 대답의 부분 수가 같으면 원문만 바꿔 넣고, 다르면 부분 키를 새로 만든다(`fetch_originals.py` 동작). 부분 키로 저장한 번역·각색은 확인이 필요하다.
3. 원본 글이 지워지면 '찾지 못함'으로 남고 그 대답은 저장소 상태(원문 없음)로 둔다.
4. 윈도우: 내장 `curl`이 인증서 폐기 검사에 실패하는 PC가 있다(`CRYPT_E_NO_REVOCATION_CHECK`). `fetch_originals.py`는 파이썬 `urllib`로 먼저 받고, 실패하면 `curl --ssl-no-revoke`로 다시 시도한다. `crawl.py`는 아직 `curl`만 쓴다.
5. 분류(B1~B9, `display`·`game`)는 `build-db.py`의 정규식이 대답 단위로 정한다. 보기 번호 `1)` 같은 숫자를 나이로 오인해 성인 대답을 B1로 거는 경우가 있다(약 22개 확인). 분류를 고치려면 `build-db.py`의 정규식을 고친 뒤 원문 사본으로 다시 만든다.
6. `local/`에는 B1·B2 원문이 들어 있다. `.gitignore`로 저장소에서 뺐다. 올릴지는 사용자가 정한다(Claude는 올리지 않는다, `docs/claude-refusals/CLAUDE_POLICY_GUIDE_KO.md`).

## 6. 남은 일
- 새 글 추가 시 글번호 유지 처리(5-1).
- `crawl.py`도 `urllib` 우선으로 바꾸기(5-4).
- 분류 정규식의 보기 번호 오인 고치기(5-5)는 사용자가 원할 때.
