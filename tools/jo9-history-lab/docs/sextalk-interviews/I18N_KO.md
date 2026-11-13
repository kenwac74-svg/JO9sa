<!-- 인터뷰 대답 번역 파일(언어별)·글로서리 구조와 도구 사용법 -->
# 번역 파일·글로서리 구조

## 구조
- 번역 단위 = 대답의 **부분 키**(`p0012.q07.s01`, `parts`의 key). 모든 대답의 부분이며, 전부 `*`인 부분(청소년기·수간 가림)과 빈 부분만 뺀다(2026-11-13 정책 적용 지침).
- `i18n/glossary.json` 1개: 용어 id(영문 소문자 문자열) → `{ko, note, langs: {언어: 번역}}`. 처음에는 바꿀 말 사전의 소재 12개를 한국어 원말만 채워 두었다. 번역은 비어 있다.
- `i18n/<언어>.json` 언어마다 1개, 모두 같은 키: `{lang, source: 'ko', entries: {키: {status, srcSha, text, model?, date?}}}`. 언어 파일은 `init`을 한 언어만 생긴다(지금은 없음).
- 칸 상태 `status`
  - `untranslated` 미번역
  - `machine` 기계 번역(**모델 `model` 기록 필수**, 날짜 `date`)
  - `verified` 사람이 확인
  - `source_changed` 원문이 바뀜(옛 번역문은 보존, 이전 상태는 `prevStatus`)
- `srcSha` = 번역 당시 원문 부분의 SHA-256 앞 12자. 원문이 바뀌면 `sync`가 알아챈다.

## 명령
```bash
cd tools/jo9-history-lab/docs/sextalk-interviews
python3 -I i18n-tools.py init en                       # 언어 파일 만들기(전부 untranslated)
python3 -I i18n-tools.py sync en                       # 원문과 맞추기(새 부분 추가, 바뀐 원문은 source_changed)
python3 -I i18n-tools.py set en p0012.q07.s01 "번역문" --model <모델명>            # 기계 번역 기록
python3 -I i18n-tools.py set en p0012.q07.s01 "번역문" --status verified          # 사람이 확인한 번역
python3 -I i18n-tools.py status [en]                   # 상태별 개수
python3 -I i18n-tools.py check                         # 형식·키·상태·모델 기록·원문 변경 검사(오류면 종료 코드 1)
python3 -I i18n-tools.py glossary --term nocondom --lang en --text "bare"          # 글로서리 입력(없는 term은 --ko 로 추가)
python3 -I i18n-tools.py game-export en <출력.json> --min verified                 # 게임 json용 평면 파일
```

## 게임 json 규칙(결정)
- 로컬라이징 json은 **문자열 키**(`p0012.q07.s01`)만 쓴다. 숫자 번호 배열 금지: 세이브에 `seed_*` 배열이 통째로 들어가 빈 칸이 폭증한다(세이브 구조 참고).
- `game-export`는 요청한 언어 1개의 평면 파일만 만든다. 쓰는 언어만 게임 json 폴더에 넣는다. 기본은 `machine` 이상, `--min verified`면 확인된 것만.
- `check`는 키 형식(문자열 키), 번역 대상 여부, 기계 번역의 모델 기록, 원문 변경 반영, 누락을 본다.

## 하지 않는 것
- 청소년기·수간 분류 대답은 문제 부분만 `*`로 가린 값으로 들어간다. 사용자가 직접 채우는 것은 막지 않는다.
- API로 자동 번역하는 연결부는 남은 작업 6번이다. 지금은 사람이나 외부 AI가 `set`으로 기록한다.
