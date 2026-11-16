# jont-remake — JoNT 장면 프롬프트 추출기

Jack-o-nine-tails(잭오나) 캐릭터 그림 폴더(예: `content/pic/girls/sex_scenes/2571`)를 읽어서, 그림마다 **상황·구도·복장 프롬프트**를 항목별로 뽑아 주는 도구예요.
뽑은 프롬프트는 Mage.space 웹에서 **미리 저장해 둔 캐릭터**(Characters 기능)로 같은 장면을 다시 그릴 때 써요.
그래서 프롬프트에는 캐릭터 외형(머리·눈·피부·체형)을 넣지 않아요.

- 원본 그림 해석: OpenRouter 비전 모델 (기본 `x-ai/grok-4.7`)
- 결과 확인·편집: 브라우저 작업표 (`serve` 또는 `export`)
- 그림 생성: Mage.space 웹에서 사람이 직접 해요. Mage API로 자동 생성하는 `generate` 명령도 있지만, 아래 「알려진 한계」 때문에 지금은 쓰지 않아요.

---

## 1. 준비

- **Node.js 20 이상**: 개발과 시험은 v24에서 했어요. 추가로 설치할 패키지는 없어요.
- **OpenRouter API 키**: 장면 해석과 샘플 해석에 써요.
- **Mage API 키**: `generate`, `models`, `try-model` 명령에만 필요해요. 선택이에요.
- **sharp** (선택): 썸네일을 만들고 그림 크기를 맞출 때 써요. 없으면 그 기능만 건너뛰어요.
  - 아래 순서로 찾아요.
    1. `config.json`의 `sharpPath`
    2. `./node_modules/sharp`
    3. `../Sixth Sense 1.0 배포용/easygen/node_modules/sharp`
  - 직접 설치하려면 `npm i sharp`를 실행해요.

```bash
copy config.example.json config.json
```

`config.json`에서 고칠 곳은 아래와 같아요.

| 키 | 뜻 |
|---|---|
| `sourceFolder` | 원본 캐릭터 그림 폴더 |
| `sourceId` | 원본 파일 이름 앞의 번호. 예: `2571` → `2571_bath_3.png` |
| `target.id` | 새 캐릭터 번호. 저장할 파일 이름이 `<target.id>_bath_3.png`가 돼요 |
| `target.mageMention` | Mage에 저장한 캐릭터 핸들. 프롬프트 맨 앞에 `@핸들`로 붙어요 |
| `target.includeAppearance` | `false`(기본)이면 외형 태그를 넣지 않아요 |
| `tagPrefix` / `prosePrefix` | 프롬프트 맨 앞에 붙는 품질·화풍 글. 비워도 돼요 |
| `negative` | 기본 네거티브 |
| `openrouter.model` | 해석 모델. `pick-model`로 바꾸는 게 편해요 |

API 키는 환경변수로 넣는 걸 권해요. `config.json`의 `apiKey` 칸에 넣어도 동작해요.

```bash
setx OPENROUTER_API_KEY "키"
```
```bash
setx MAGE_API_KEY "키"
```

`setx`로 넣은 값은 새로 연 창에서만 보이는 게 보통이에요. 그래서 스크립트가 Windows 사용자 환경변수를 직접 한 번 더 읽어요.

> ⚠️ `config.json`에 키를 넣었다면 그 파일과 `work/` 폴더는 남에게 넘기지 마세요. 이 배포 묶음에는 `config.example.json`만 들어 있어요.

---

## 2. 명령

```bash
node remake.mjs <명령> [옵션]
```

| 명령 | 하는 일 |
|---|---|
| `pick-model` | OpenRouter 이미지 입력 모델 목록을 보여 주고 고른 모델을 config에 저장해요. 517장 기준 예상 비용과 시험 결과가 함께 나와요. `--find 이름`, `--set 모델ID` |
| `describe` | 원본 그림 → 항목별 장면 프롬프트. 이미 해석한 그림은 건너뛰어요. 다시 하려면 `--force` |
| `serve` | 작업표를 `http://127.0.0.1:8790/`에 열어요. 샘플 이미지 해석이 되는 모드예요. `--port` |
| `export` | 작업표 `prompts.html`, `prompts.csv`, `prompts.json`을 `work/<src>_to_<tgt>/`에 저장해요 |
| `status` | 해석·생성 진행 상황 |
| `generate` / `all` | Mage API로 그림 생성. `all`은 describe 다음 generate. `--dry-run`이면 보내지 않고 출력만 해요 |
| `models` | Mage API가 받는 모델과 `model_id` 목록. 성인 그림을 막는 모델은 빼고 보여요 |
| `try-model --id <ID>` | 그 `model_id`를 Mage가 받는지 한 장으로 시험해요. 거절되면 과금이 없어요 |

공통 옵션은 아래와 같아요.

| 옵션 | 뜻 |
|---|---|
| `--only bath,kiss` | 이 커맨드만 처리 |
| `--limit N` | N장만 처리 |
| `--model ID` | 이번 실행만 다른 해석 모델 사용 |
| `--config 경로` | 다른 설정 파일 사용 |

**보통 쓰는 순서**
```bash
node remake.mjs describe --limit 5
```
```bash
node remake.mjs serve
```
몇 장 결과를 확인한 다음, 나머지를 해석해요.
```bash
node remake.mjs describe
```

---

## 3. 작업표 (serve / export)

### 「장면」 탭
- 그림마다 원본 썸네일, 저장할 파일 이름, 조립된 프롬프트, 항목 표가 나와요.
- **항목**: 인원 · 동작 · 자세 · 표정 · 의상 · 옷 상태 · 상대 · 소품 · 배경 · 조명 · 구도
  - 위쪽 체크박스로 프롬프트에 넣을 항목을 고르면 모든 장에 적용돼요.
  - 빠른 버튼: 「모두」, 「장면만(의상 빼기)」, 「의상만」
- **항목별 복사·수정**: 칸을 고치면 초록색으로 표시되고, 그 장의 프롬프트만 다시 만들어져요.
- **의상 일괄 바꾸기**: `maid outfit, white apron`처럼 입력하면 모든 장의 의상 칸이 바뀌어요(주황색 표시).
  - 「알몸 장면은 그대로」(기본 켜짐)
  - 「옷 상태도 지우기」
- 그 밖에: 태그식/문장식 전환, 앞 글과 `@캐릭터` 칸, 검색, 완료 체크, 30장 단위 페이지, 현재 설정으로 CSV 내려받기
- 설정, 고친 칸, 완료 체크는 그 브라우저의 localStorage에 저장돼요.

### 「샘플」 탭
- 배경 · 자세 · 표정 · 의상 · 구도 · 조명별로 이미지를 올리면 **그 항목만** 해석해서 저장해요.
- 이름이 `bg01`, `pose01`, `face01`, `outfit01`, `cam01`, `light01` 순서로 자동으로 붙어요.
- 「쓰기」에 체크한 샘플은 장면 탭의 같은 항목 칸에서 `@`를 치면 목록으로 떠요. 고르면 그 내용이 들어가요.
  - 태그식이면 태그가, 문장식이면 문장이 들어가요.
  - 의상 일괄 바꾸기 칸에서도 쓸 수 있어요.
- 저장 위치는 `library.json`이에요. 모든 캐릭터 폴더가 같이 써요.
- 새 이미지 해석은 `serve`로 열었을 때만 돼요. 키를 HTML에 넣지 않으려고 서버가 대신 호출해요. `export`로 만든 파일에서는 이미 있는 샘플만 `@`로 쓸 수 있어요.

---

## 4. 파일 구조

```
jont-remake/
├─ remake.mjs            스크립트 전부 (CLI · 해석 · 조립 · 서버 · Mage 호출)
├─ worksheet.html        작업표 틀. /*__DATA__*/null 자리에 자료가 들어가요
├─ config.example.json   설정 예시 (키 없음)
├─ README.md             이 문서
│  ── 실행하면 생기는 것 (배포에 넣지 않음) ──
├─ config.json           내 설정 (키가 들어갈 수 있음)
├─ library.json          샘플 라이브러리 (샘플 이미지 포함)
└─ work/
   ├─ architectures.json         `models` 결과
   └─ <src>_to_<tgt>/
      ├─ state.json              그림별 해석 결과·오류·생성 기록 (이어서 하기용)
      ├─ thumbs/                 썸네일 캐시
      ├─ prompts.html|csv|json   export 결과
```

### remake.mjs 안의 구역 (위에서 아래 순서)
1. **안전장치 상수**
   - `SAFE_POS_TAGS`, `SAFE_NEG`, `AGE_WORDS`
   - `EXCLUDED`: 건너뛰는 커맨드 목록
   - `CENSORED_ARCH`: 막은 Mage 모델 목록
2. **명령별 독립 처리**: `pick-model`, `models`, `try-model`. 설정 파일 없이도 일부 동작해요.
3. **설정·원본 목록**
   - 파일 이름 → 커맨드 키는 `keyOf()`로 바꿔요. 예: `2571_bath_3.png` → `bath`
   - 저장 이름은 `outName()`으로 만들어요.
4. **1단계 해석**: `FIELDS`(항목 정의), `VISION_SYSTEM`(지시문), `describe()`
5. **2단계 조립**
   - `sceneFields()`: 외형 걷어 내기
   - `buildPrompt(scene, {style, use, outfit, keepNude, dropState})`
   - 작업표 JS의 `promptOf()`도 같은 규칙이에요.
6. **3단계 Mage 생성**: `generate()` (제출 → `status_url` 폴링 → 다운로드 → 원본 크기로 맞춤)
7. **작업표·샘플**
   - `SAMPLE_CATS`, `extractSample()`, `makeData()`
   - `export`, `serve`. serve는 `GET /`, `GET|POST /api/library`, `POST /api/extract`를 처리해요.

### 상태 파일 형식 (`state.json`의 `items[파일명].scene`)
```json
{ "count": "1girl, 1boy", "model": "x-ai/grok-4.7",
  "fields": { "action": {"tags": "...", "text": "..."}, "pose": {...}, "expression": {...},
              "outfit": {...}, "outfit_state": {...}, "partner": {...}, "props": {...},
              "background": {...}, "lighting": {...}, "camera": {...} } }
```
- 예전 형식(`tags`/`prose`/`framing`)도 읽을 수 있어요. 대신 항목이 나뉘지 않아요. `describe --force`로 다시 해석하면 돼요.
- 항목을 추가하거나 바꾸려면 `FIELDS` 배열만 고치면 돼요. 지시문, 작업표, CSV가 모두 이 배열을 따라가요. 기존 그림은 `--force`로 다시 해석해야 해요.

---

## 5. 안전장치 (설정으로 끌 수 없음)

- 성인만 다뤄요.
  - 양성 프롬프트에 `adult, mature female`이 항상 붙고, 네거티브에는 아동 관련 태그가 항상 붙어요.
  - 비전 모델이 미성년자로 보이거나 확실하지 않다고 답한 그림과 샘플은 쓰지 않아요.
  - 캐릭터 설정에 아동을 뜻하는 말이 있으면 실행을 멈춰요.
- 커맨드 34종은 기본으로 건너뛰어요. 강간, 폭력·고문·자해, 동물과의 성행위, 배설 계열이에요(`EXCLUDED`). 2571 폴더 기준 715장 중 198장이에요.
- 외부 회사 모델이라 성인 그림을 막는 Mage 모델은 `generate`와 `try-model`에서 막아요: gpt_image_2, grok_image, nano_banana_v2, seedream, minimax_h3_image

---

## 6. 시험 결과와 알려진 한계 (2026-11-15 기준)

### 해석 모델 비교 (2571 폴더, 같은 그림)
| 모델 | 결과 |
|---|---|
| `x-ai/grok-4.7` | 가장 정밀해요. 517장 약 $3.7 |
| `x-ai/grok-4.3` | 정확해요. 약 $1.9 |
| `qwen/qwen3-vl-235b-a22b-instruct` | 통과했지만 체위 표기가 가끔 엇갈려요 |
| `minimax/minimax-m3.1-flash`, `mistralai/mistral-medium-3-5` | 반쯤 보이는 상대 남자를 놓쳐요 |
| `google/gemini-2.5-flash` | 목욕·성행위 장면을 거부해요 |

비용은 그림 1장당 입력 약 1.5k, 출력 약 0.7k 토큰으로 잡은 추정치예요.

### Mage API
- SDXL 계열(`stable_diffusion_xl`, `sdxl_plus`)은 `model_id`가 기본 체크포인트 하나뿐이에요. 다른 값을 넣으면 400 오류가 나요.
- 웹에서 고르는 커뮤니티 체크포인트(Pinkie, Hassaku, Cortado, Pony 계열 등)는 API로 쓸 수 없어요.
- LoRA, IP-Adapter, 화풍 선택 필드도 없어요.
- 캐릭터 기능(`@핸들`)을 지원하는 모델: Mango(v2 이상), Guava 등. 성인 장면을 얼마나 허용하는지는 직접 시험하지 않았어요.
- 이런 이유로 실제 작업은 **프롬프트만 뽑고 그림은 Mage 웹에서 직접** 하는 방식이에요.
- `generate` 명령은 제출, 폴링, 저장까지 짜 두었지만 **실제 생성까지 끝까지 돌려 본 적은 없어요**. 결과 주소(`result.url`)와 종료 상태 값은 SDK 문서를 보고 짠 거라, 처음 쓸 때 확인이 필요해요.

### 그 밖
- 원본 게임 폴더 구조
  - 장면 그림: `girls/sex_scenes/<번호>/<번호>_<커맨드>_<n>.png`, 795×596
  - 전신 그림: `girls/full/<번호>/<번호>_full_<의상>[_horny|_rebel].png`
  - 얼굴 그림: `girls/face/<번호>/<번호>_face.png`, 151×150
  - `sourceFolder`를 `full/<번호>`로 바꾸면 전신 그림 폴더에도 그대로 쓸 수 있어요. 다만 시험은 `sex_scenes`로만 했어요.
- `@` 목록 창은 화면을 스크롤하면 입력 칸을 따라 다시 위치를 잡아요. 아주 긴 목록은 목록 안에서 스크롤돼요.
