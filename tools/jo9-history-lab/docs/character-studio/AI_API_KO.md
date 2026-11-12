<!-- AI API 연결부(OpenRouter·Venice·Gemini·Kindroid) 설정·사용법·확인 상태 -->
# AI API 연결부

코드 `ai_api.py`, 설정 `ai-providers.json`(키 없음). 표준 라이브러리만 쓴다.

## 확인 상태(2026-11-12, 공식 문서)
| 제공처 | 방식 | 주소 | 인증 | 상태 |
|---|---|---|---|---|
| OpenRouter | OpenAI 방식 | `https://openrouter.ai/api/v1/chat/completions` | `Authorization: Bearer <키>` | 확인 |
| Venice | OpenAI 방식 | `https://api.venice.ai/api/v1/chat/completions` | `Authorization: Bearer <키>` | 확인 |
| Gemini | OpenAI 호환 | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` | `Authorization: Bearer <키>` | 확인 |
| Kindroid | 캐릭터 대화형 | — | — | **미확인** |

- 응답 글은 `choices[0].message.content`, 사용량은 `usage`. 모델 이름은 바뀌므로 코드에 박지 않고 호출할 때 준다.
- OpenRouter 앱 표시 헤더(`HTTP-Referer`, `X-OpenRouter-Title`)는 선택이며 쓰지 않았다. 필요하면 `ai-providers.json` 의 `headers` 에 넣는다.
- Gemini 자체(generateContent) 방식은 이번에 문서를 확인하지 못해 넣지 않았다. 필요하면 공식 문서로 확인한 뒤 `kind` 를 추가한다.
- **Kindroid는 공식 문서에 접근하지 못해**(주소 안내가 이동·404) 주소·인증·요청 칸을 추측해 채우지 않았다. 호출하면 거부 메시지가 나온다. 사용자가 문서를 확인해 `ai-providers.json` 의 `baseUrl`·인증 방식을 알려 주면 구현한다. 캐릭터 대화형이라 번역 호출과는 구조가 다르다(남은 작업 7번과 함께 정하기).

## 키
환경 변수(`OPENROUTER_API_KEY`, `VENICE_API_KEY`, `GEMINI_API_KEY`, `KINDROID_API_KEY`) 또는 git 제외 파일 `ai.local.json`(`{"keys": {"openrouter": "…"}}`, `.gitignore` 등록됨). 키 값은 출력·기록하지 않는다.

## 명령
```bash
cd tools/jo9-history-lab
python3 -I ai_api.py providers                                   # 제공처·키 유무·확인 상태
python3 -I ai_api.py chat openrouter <모델> "안녕"                # 한 번 호출(연결 시험)
python3 -I ai_api.py part openrouter <모델> en p0012.q07.s01     # 부분 1개 번역 → i18n/en.json 에 기계 번역·모델 기록(먼저 i18n-tools.py init en)
python3 -I ai_api.py part ... --dry-run                          # 보낼 내용만 보기
```
- 429·5xx는 최대 2번 다시 시도, 시간 제한 120초, https(시험용 127.0.0.1 제외)만 허용.
- `part`는 번역 목록(표시 가능한 부분)에 있는 키만 보낸다. 표시불가(B1·B2 포함)는 보내지 않고 거부한다(`[클로드 정책준수]`, 스위치 없음).
- 이 연결부는 호출·기록만 한다. 프롬프트 조립(캐릭터 설정·칸 규칙·예시)은 남은 작업 7번이다. `part`의 프롬프트는 연결 시험용 최소 문장이다.

## 시험(2026-11-12)
실제 키 없이 로컬 가짜 서버(127.0.0.1)로 확인: 키 없음 거부, `Authorization` 헤더와 경로, 429 후 재시도, Kindroid 거부, `part`의 번역 기록(모델 `제공처/모델`)·표시불가 키 거부. 실제 제공처 호출은 키가 없어 해 보지 못했다.
