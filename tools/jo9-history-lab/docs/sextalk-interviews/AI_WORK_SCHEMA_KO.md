<!-- AI 작업용 주제별 JSONL의 형식·생성·검사·조회 설명서 -->
# AI 작업용 인터뷰 JSONL 설명서

원본은 `interview-db.json`(대답 5,112개)이다. `ai/`의 파일은 거기서 **만들어진 사본**이므로 손으로 고치지 않는다. 고치려면 원본이나 `adapt-user.json`을 바꾸고 다시 만든다.

## 무엇이 들어 있나
- 빈 대답을 뺀 모든 대답 4,788줄을 담는다(2026-11-13 정책 적용 지침). `display`가 false면 게임 표시불가(B3 근친·B4 금기 목록·B5 SNS 등)이고, `masked`가 true면 청소년기·수간 분류 대답이라 문제 부분이 `*`로 가려져 있다(`[클로드 정책준수]`, 원문은 원본 글 링크). `*` 부분을 추측해 채우지 않는다.
- 파일은 주제별로 나뉜다: `NN_주제.jsonl`(NN은 문항 번호, 예 `02_first_time.jsonl`). `index.json`에 파일별 줄 수와 SHA-256, 세계 순서가 있다.
- `game`이 false인 줄(첫 경험 나이·나이 차 등)은 게임 미반영 주제라 작업 대상에서 건너뛰어도 된다.

## 한 줄의 칸
| 칸 | 뜻 |
|---|---|
| `id` | 대답 키 `p0012.q07`(글 번호·문항 번호). 같은 문항이 한 글에 또 나오면 `.2` |
| `post`, `q`, `topic` | 글 id, 문항 번호, 주제 키 |
| `question` | 그 글의 질문 문장 |
| `answer` | 대답 원문(`@아이디`는 `@…`로 가림) |
| `parts` | 줄·문장·보기 번호로 나눈 부분 `{key: 'p0012.q07.s01', text}`. 번역·각색 단위로 쓴다 |
| `len`, `tone`, `nums` | 글자 수, 어투 표지(laugh·tilde·polite·casual 등), 대답 속 수량 |
| `modern` | 들어 있는 현대 소재 분류(바꿀 말 사전 `adapt-dict.json`의 항목) |
| `adapt` | 13자 문자열. `index.json`의 `worlds` 순서대로 세계마다 U(사용자가 직접 각색)·0(그대로)·1(사전 치환)·2(문장 각색 필요)·3(그 세계에 없는 소재) |
| `game` | 게임에 쓰는 주제인지 |

JSON 키는 정렬돼 있고 한 줄에 한 개체다.

## 명령
```bash
cd tools/jo9-history-lab/docs/sextalk-interviews
python3 -I ai-tools.py export    # 원본에서 ai/ 를 새로 만든다
python3 -I ai-tools.py check     # 원본에서 다시 만든 결과와 같은지, 원문 미수록·빈 대답이 섞이지 않았는지 검사(어긋나면 종료 코드 1)
python3 -I ai-tools.py query --key p0000.q02 --json
python3 -I ai-tools.py query --topic first_time --grep 노콘 --limit 5
python3 -I ai-tools.py query --world medieval --grade 2     # 세계별 각색 등급으로 찾기
```
`check`는 ① 파일 목록·내용이 원본에서 다시 만든 것과 같음 ② 모든 줄이 JSON이고 키가 DB에 있고 중복이 없음 ③ 표시불가·자리표시 대답이 없음 ④ 값이 원본과 같고 파일이 주제와 맞음 ⑤ 표시 가능한 대답이 빠짐없이 들어 있음을 본다.

## 작업 결과 쓰는 법(지침)
- 결과는 `ai/`를 고치지 말고 키를 맞춘 별도 파일로 만든다. 각색 문장은 사용자가 DB 탭이나 엑셀로 반영한다(자동으로 `adapt-user.json`에 쓰지 않는다).
- 모델·날짜 기록과 칸 상태(미번역/기계/확인/원문 변경)는 글로서리·번역 파일 구조(남은 작업 5번)에서 정한다.
