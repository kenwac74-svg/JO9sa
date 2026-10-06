# JO9 본체 모딩 채팅 — 이식 가능한 운영 설계서

이 문서는 **“JO9 게임 본체 모딩 이어가기” 채팅 자체를 게임 개발도구로 쓰는 구조와 설계**를 남긴다. 다른 PC에서는 실제 프로젝트 경로를 지정하고 아래 시작 지시문을 읽혀 같은 역할과 작업 방식으로 이어간다. 리소스 전체 이전, 게임 복사, 설치 묶음 제작은 이 문서의 범위가 아니다.

근거 기준: 로컬 JO9sa main `d94984df838f65dc473fcd0f0f0ed89de1de25a3`와 2026-10-04 이름의 최신 인계. 작성 환경 UTC 날짜는 2026-10-03이며 인계 날짜는 기존 한국 시간 기록을 인용한다. 이후 상태는 새 세션에서 다시 확인한다.

## 1. 개발도구의 정체성

- 대상: **JO9 게임 본체 모딩 이어가기**, ID `01a0f55f-a7b2-7ac3-905b-647154c5943b`. 이름과 ID는 저장소 통합 인계 및 해당 대화 인계에서 확인했다.[S1][S2]
- 입력: 사용자가 플레이하며 지정하는 화면·버튼·대사·이벤트·분기·이미지와 원하는 변화.
- 처리: 실제 실행 QSP와 관련 파일에서 해당 대상을 찾아 최소 변경한다. 코드 분석 결과만 나열하고 끝내지 않는다.
- 출력: 선언형 수정 기록 `mods/*.json`, 필요한 최소 파일 변경, 짧은 작업 기록과 사용자 검증 포인트.
- 목적: 기존 한국어판 JO9를 플레이 기준으로 완성도 있게 다듬는다. 웹 포팅·AI 런타임·대형 새 도구 개발은 후순위다.

재현하는 것은 **역할·규칙·파일 접근·작업 흐름**이다. 원 채팅의 숨은 상태, 내부 추론, 미보존 첨부물, 계정 권한과 기억까지 완전히 복제하는 것은 아니다. Codex와 Claude의 대화도 자동 공유되지 않는다. 파일과 Git 기록을 공통 기억으로 사용한다.

## 2. 역할과 모듈 경계

| 담당/영역 | 역할 | 경계 |
|---|---|---|
| **이 주 채팅 / Codex** | 로컬 상태 확인, 장면에서 코드 역추적, 최소 QSP 내용 변경·mods·기록 관리 | 빌드·패키징으로 임의 확대하지 않음 |
| **로컬 Claude** | 보조 분석·수정안·리뷰. 사용자가 별도로 맡긴 범위는 수정 | Codex와 같은 파일 동시 편집 금지 |
| **집컴 / 노트북** | 같은 로컬 모딩 도구의 장소 이름. main의 mods·기록으로 이어받음 | 별도 인격이나 서로 대화하는 에이전트로 취급하지 않음 |
| **카일 / Claude PM** | 작업 지휘·결정 기록·UI 코드/이미지·2.4 패치 빌드와 검증 | 통압축·게임 플레이 검증은 사용자 담당 |
| **애니 / 실시간모딩** | 모딩 환경·도구·절차 자문 | 직접 모딩·QSP 컨펌 담당 아님 |
| **비비 / 이미지 교체 패치** | QSP 없는 이미지 ZIP·교체 기록 | QSP 수정·UI 빌드 담당 아님 |
| **펜디 / 텍스트편집** | 현재 대기, 필요할 때 재개 | 새 기능을 임의 착수하지 않음 |
| **사용자** | 플레이·수정 방향·취향 판단·게임 검증·PR 병합·패키징 승인 | 통압축 관리와 Drive 업로드도 사용자 담당 |

본체는 main, UI 기록은 `JO9UIpatch`, 이미지 툴은 `JO9imgtool`, 이미지 교체 팩 기록은 `newimgadd`로 분리한다. PM 작업 브랜치는 기록상 `claude/sweet-meitner-72rd73`이다. 하나의 요청 때문에 다른 영역의 도구 개발·엔진 수정·패키징까지 함께 시작하지 않는다.[S1][S3]

채팅 사이의 정보 전달은 Git·인계 문서와 사용자 전달로 한다. 이 설계가 자동 다중 에이전트 실행이나 채팅 간 직접 메시지 전송을 요구하는 것은 아니다.

## 3. 명령 체계와 작업 상태 전이

```text
사용자: 플레이 중 대상과 원하는 변화 지정
  → AI: 실제 대상·관련 location·현재 상태 확인
  → AI/사용자: 미정 범위만 정리해 수정 방향 확정
  → AI: 최소 수정안과 새 mods·근거 기록
  → 적용 담당: 왕복 검증·백업·안전한 로컬 적용
  → 사용자: 실제 게임에서 확인
  → AI: 결과·미확인 사항·다음 확인 포인트 기록
  → PM: 별도 요청과 승인에 따라 빌드·배포
```

**상호작용 규칙**

1. “이 장면/이 버튼/이 대사”를 출발점으로 삼는다. 표시 문자열·location·이벤트 ID·변수·이미지 파일명으로 검색하고 직접 호출 관계만 넓힌다.
2. 이미 명확한 수정 지시는 다시 승인받지 않는다. 취향·범위가 미정인 부분만 구체적인 선택이나 수정안을 제시해 사용자가 결정한다.
3. QSP 내용 변경은 새 `mods/YYYY-MM-DD_이름.json`에 남긴다. 기존 적용 mod의 old/new를 소급 수정하지 않는다. `docs/modding/context-notes.md`에 원인·근거·확인 방법을 짧게 추가한다.
4. PROCESS의 기본 로컬 적용은 사용자가 `apply_mods.ps1`로 한다. 이 주 채팅에 실제 적용까지 명시적으로 맡기면 AI가 같은 안전 절차로 수행한다. 적용을 QSRC 재빌드나 패키징과 혼동하지 않는다.[S4]
5. 게임 실행과 화면 검증은 사용자 수동이다. AI가 항상 화면을 실시간으로 보고 있다고 말하지 않는다. 사용자가 요청한 경우에만 `screenshot.ps1`로 화면을 캡처해 읽고 클릭·키 입력을 자동화하지 않는다.
6. 보고는 **수정 파일 / location·이벤트 / 핵심 변경 / 실제 쓰기 여부 / 정적 확인 / 사용자 확인 포인트**만 짧게 한다. 미확인 결과를 완료로 표시하지 않는다.
7. 다른 작성자가 같은 파일을 바꿨으면 그 변경부터 읽고 이어간다. 기존 변경을 덮어쓰거나 임의 stash/reset하지 않는다.

요청 종류를 구분한다:

| 요청 | 행동 |
|---|---|
| “왜 이러는지 봐” | 관련 범위 분석과 근거 보고. 변경까지 맡긴 지시가 아니면 쓰기하지 않음 |
| “이걸 이렇게 바꿔” | 확정된 방향으로 최소 수정·mods·기록. 로컬 적용 범위는 현재 사용자 지시와 PROCESS에 맞춤 |
| “화면 확인해” | 요청된 캡처를 실제로 읽고 관찰 사실만 보고 |
| “빌드해/통합해/배포해” | 맡은 역할과 범위를 확인하여 PM 절차로 연결. 본체 수정 요청의 자동 후속으로 취급하지 않음 |
| “다른 PC에서 이어가” | 아래 경로 변수와 시작 지시문으로 역할·현재 상태를 다시 읽음 |

구 “게임 수정 세션 컨펌” 절차는 PROCESS에서 폐지됐다. 별도 제3자 QSP 컨펌을 매번 기다리는 새로운 단계는 만들지 않는다. 사용자 플레이 검증과 패키징 승인은 유지한다.[S4]

## 4. 기준 우선순위와 설계 원칙

**읽을 순서**

1. 현재 사용자의 명시적 지시와 정정.
2. `AGENTS.md`, `docs/PROJECT.md`로 역할 기준을 읽는다. PROJECT는 카일 관리다.
3. `docs/SESSION_HANDOFF_INDEX.md` → 통합 README → 최신 homecom 인계를 읽어 후속 역할·상태·경로 정정을 반영한다.
4. `CLAUDE.md`, `docs/modding/PROCESS.md`, `context-notes.md`, `IMAGE_RANDOM_RULES.md`, 실제 적용 도구를 해당 작업 범위만 읽는다.
5. 과거 인계·계획·대화는 관련 항목만 참고한다. 현재 규칙과 충돌하는 과거 제안을 실행 지시로 승격하지 않는다.

실제 PC의 설정·실행 QSP·Git 상태는 **현재 파일 상태의 증거**다. 기록과 다르면 차이를 보고하며 임의로 문서나 실행 파일을 과거 상태에 맞추지 않는다.

**유지할 설계 원칙**

- 실제 실행 QSP를 기준으로 직접 수정한다. 오래된 QSRC로 전체 재빌드하지 않는다. 과거 QSP 보관본을 현 게임 위에 덮어쓰지 않는다.
- 변수·이벤트 ID·location·기존 분기 의미를 유지하고 요청과 무관한 리팩터링·포맷 정리·기능 추가를 섞지 않는다.
- 특정 장면만 바꿀 때 공용 이미지를 일괄 교체하지 않는다. 실제 호출 분기의 전용 경로로 분리한다. 같은 파일명만으로 기준 자산을 정하지 않는다.
- QSP 변경은 mods로 재현 가능하게 기록한다. JSON의 핵심은 `location`, `field`, `old`, `new`, `count`이며 적용 전후 해시도 근거로 남긴다.
- 현재 도구는 old/new/count와 후속 mod 대체 관계로 적용 여부를 판단한다. 해시는 참고 증거이며 오래된 해시 체인 설명을 적용 기준으로 쓰지 않는다.
- 쓰기 전에 읽기→쓰기 왕복 바이트 동일성 검사와 대상 파일의 날짜 백업을 수행한다. 실제 쓰기 뒤 해시를 다시 확인하며 실패 시 복구한다. 순정 참조는 수정하지 않는다.[S5]
- 이미지 무작위 규칙은 `IMAGE_RANDOM_RULES.md`를 따른다. `picMax` 생성 주체 등 추정으로 남은 부분을 검증 사실로 말하지 않는다.
- 정적 검증·치환 성공은 실제 화면 정상·세이브 호환을 증명하지 않는다.

**현재 전환 상태의 설계 경계**[S1][S6]

- 테스트 게임은 아직 0.14 기반+mods다. 기존 mods/assets의 `SNKmod`는 로컬에서 일괄 제거하지 않는다. 2.4 빌드 때 카일이 경로 전환한다.
- 올걸팩 통합은 통압축 2.4에서 한다. 여자 주인공 제거는 예정이지만 범위 미정이며 여성 NPC 삭제를 뜻하지 않는다.
- BUG-001은 2.4.0 미해결. 엔진·창 제목 변경은 빌드 지시 때 한다. 창 제목은 최신 기록상 `game/config.xml`의 title이다.
- 카탈로그의 최신 비교 기준은 **실제 플레이 폴더 × 순정**이다. 뒤처진 `IMGMG/merge_work`를 현재 통합본으로 오인하지 않는다. 작업 상태는 `catalog_status.js`를 공통 기록으로 삼되 저장되지 않은 브라우저 상태는 별도 확인한다.

## 5. PC별 경로·환경 계약

절대 드라이브 문자를 설계에 고정하지 않는다. 새 PC에서 아래 역할만 실제 경로에 매핑한다. 기존 폴더 구조를 다시 설계하거나 리소스 전체를 옮길 필요는 없다. 필요한 파일이 없으면 해당 작업의 누락 의존성으로 보고한다.

| 변수 | 의미 | 현재 PC에서 확인한 예시 |
|---|---|---|
| `REPO_ROOT` | Git·문서·mods·도구 | `G:\somi\JO9sa` |
| `GAME_ROOT` | 실제 플레이/패치 시험본의 루트 | `G:\somi\JO9` |
| `GAME_QSP` | 실제 실행 QSP | `<GAME_ROOT>\game\jack.qsp` |
| `ORIGINAL_ROOT` | 수정하지 않는 순정 참조 | `G:\somi\JO9O` |
| `IMAGE_WORK_ROOT` | 이미지 작업·카탈로그 | `G:\somi\IMGMG` |
| `OUTPUT_ROOT` | 새 비교 결과·작업 출력 | `<원본·플레이와 분리된 위치>` |

repo의 `local.config.json`은 실제 도구가 읽는 PC별 설정이며 Git 제외다. 필요한 경우 아래 **값만** 바꿔 만든다. 이는 인증이나 전체 설정 내보내기가 아니다.

```json
{
  "GameRoot": "<GAME_ROOT>",
  "GameExe": "<GAME_ROOT>\\Jack-o-nine-tails.exe",
  "GameQsp": "<GAME_ROOT>\\game\\jack.qsp",
  "EngineExe": "<GAME_ROOT>\\game\\engine\\jack.exe",
  "WindowTitle": "Jack-o-nine-tails",
  "ProcessName": "jack"
}
```

`<…>`는 설명용 자리표시자이며 자동 치환되지 않는다. 실제 Windows 경로를 JSON에 넣을 때 역슬래시는 `\\`로 쓴다. ORIGINAL_ROOT 등의 변수는 설계상의 경로표이고 기존 도구가 자동 읽는 설정 키는 아니다.

게임 내부 경로는 기존 상대 경로를 유지한다. 현재 imgmg 도구에는 `G:\somi` 기본값도 있으므로 새 PC에서 `-Root`, `-Play`, `-Original`, `-GamePic`, 교체기의 `-Workshop`/`-Out`/`-PlayUrl` 등 실제 매개변수를 명시한다. **전체 구현이 이미 상대 경로화됐다고 가정하지 않는다.**

최소 환경 계약:

- Codex에 실제 로컬 파일·셸 접근과 해당 작업 폴더 권한이 있어야 한다. VS Code는 Codex 파일 접근의 필수 조건이 아니다.
- Windows PowerShell 5.1에서 기존 QSP 도구가 동작한다. PowerShell 파일은 UTF-8 BOM 규칙을 유지한다.
- Git은 상태·인계 확인용이다. Claude Code/VS Code는 보조 환경이다. 기존 `setup_pc.ps1`은 Claude 중심이며 Codex 채팅 전체를 복원하는 도구가 아니다.
- QSP 적용에 Python은 불필요. 분석용 Python은 기존 안내상 3.10 이상이고, PM의 Python/Node 검사는 해당 역할에서 필요할 때 확인한다. 버전 전체를 고정하는 근거는 없다.
- 개인 화풍 스킬은 이미지 작업을 요청받을 때 필요한 것만 확인한다. 본체 모딩의 필수 의존성으로 묶지 않는다. repo의 전용 SKILL.md 구현은 이번 조사에서 확인되지 않았다.
- 인증·토큰·API 키·쿠키·계정 DB·전체 개인 대화 저장소는 복사하지 않는다. 새 PC에서 사용자가 별도로 로그인한다. 접근 거부 경로는 우회하지 않는다.

**읽기 전용 최초 검사** — repo 폴더에서:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
$jo9Cfg = Get-Content -LiteralPath .\local.config.json -Raw -Encoding UTF8 | ConvertFrom-Json
Get-FileHash -LiteralPath $jo9Cfg.GameQsp -Algorithm SHA256
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\apply_mods.ps1 -DryRun
```

초기 확인에서 패치 적용·게임 실행·설치·빌드·푸시를 자동 실행하지 않는다. 사용자가 실제 대상 파일을 지정하지 않았으면 옛 경로를 추측해 수정하지 않는다.

## 6. 토큰 비용·모델 운용

사용자가 남긴 운영 규칙의 요구를 이어받는다. 전역 설정 파일이나 자동 모델 라우터의 구현 완료를 뜻하지 않는다.[S7]

- 기본 개발/분석은 **Sol**. 검색·단순 분류·문서 정리·정해진 절차는 저비용 모델에 적합하다.
- 일반 QSP·조건·버그 분석, UI·도구 코드, 리뷰·다중 파일 수정은 Sol 범위다.
- Astra는 전체 구조 재설계, 시스템 간 복합 충돌, 합리적인 분석으로 핵심 원인을 못 찾은 경우에만 고려한다. QSP 크기·이미지 수·작업 시간만으로 선택하지 않는다.
- 품질·비용 차이가 의미 있을 때 첫 응답에서 한 줄 추천하고 현재 작업은 계속한다. 사용자가 바꾸기 전 실제 모델이 전환됐다고 말하지 않는다. 특정 세대 ID·가격·추론 강도 고정 규칙은 확인되지 않았다.
- 처음에는 관련 5~10개 파일/location으로 제한한다. 파일명·문자열·호출 경로를 검색한 뒤 필요한 코드·그림만 연다. 전체 QSP·전체 이미지 폴더를 매 요청마다 읽지 않는다.
- 예전 ZIP·backups·archive·build·dist·로그·캐시는 직접 필요할 때만 조사한다. 찾은 답과 실패 원인은 짧은 기록으로 재사용한다.
- 약 두 번 같은 접근이 실패하면 location·동명 자산·현재 버전·브랜치·첫 가정을 재검토한다. 추론량만 늘리지 않는다.

## 7. 새 채팅에 붙여 넣을 시작 지시문

`<…>`를 새 PC 실제 값으로 바꿔 **Codex 대화창**에 붙여 넣는다.

```text
이 채팅은 “JO9 게임 본체 모딩 이어가기”의 로컬 게임 개발도구 역할을 이어받는다.
repo: <REPO_ROOT>, 본체 역할 브랜치: main
플레이 게임: <GAME_ROOT>, 실제 QSP: <GAME_QSP>
읽기 전용 순정 참조: <ORIGINAL_ROOT>
이미지 작업/카탈로그: <IMAGE_WORK_ROOT>, 출력: <OUTPUT_ROOT>

먼저 docs/modding/JO9_CHAT_PORTABLE_SETUP_KR.md와 AGENTS.md를 읽고,
docs/PROJECT.md, docs/SESSION_HANDOFF_INDEX.md가 연결하는 통합 README 및
최신 homecom 인계를 함께 읽어라. CLAUDE.md와 modding의 PROCESS,
context-notes, IMAGE_RANDOM_RULES는 관련 작업의 기준으로 사용해라.
HEAD·branch·Git 변경·local.config·실제 QSP 해시와 apply_mods -DryRun 결과를
확인해 짧게 보고해라. 최초 확인에서는 게임·자산·mods를 쓰거나 빌드하지 마라.

너(Codex)가 주 로컬 수정자, 로컬 Claude는 보조 분석·리뷰자다.
카일은 Claude PM과 2.4 패치 빌드 담당이고 통압축과 플레이 검증은 내가 한다.
같은 파일을 동시에 수정하지 말고 공통 기억은 Git과 인계 문서로 유지해라.

내가 플레이하며 지정한 장면·버튼·대사·분기를 출발점으로 실제 location과
파일을 찾아 최소 변경해라. 분석 코드만 길게 내뱉고 끝내지 마라.
QSP 직접 수정·새 mods·짧은 근거 기록을 사용하고 QSRC 전체 재빌드 금지.
로컬 적용은 PROCESS와 현재 내가 맡긴 범위를 따르되 왕복 검증·백업·쓴 뒤
해시 재확인을 유지해라. 플레이는 내가 하고 요청할 때만 화면을 캡처해라.
실시간 상시 관찰이나 클릭·키 입력 자동화를 가정하지 마라.

테스트는 현재 0.14 기반+mods이며 mods/assets의 SNKmod는 지금 제거하지 마라.
2.4 전환·엔진·제목·UI 통합·패키징은 별도 지시에 따라 담당 역할로 처리해라.
이미 정한 결정은 다시 묻지 말고 미정 범위만 구체적으로 물어라.
수정 파일·location·핵심 변경·실제 쓰기·검증·확인 포인트만 짧게 보고해라.
관련 범위 검색으로 토큰을 아끼고 기본 Sol 운영 규칙을 따라라.
리소스 전체 이식이나 새로운 도구 구현은 이번 요청에 포함하지 않는다.
현재 요청: <장면과 원하는 변화 / 없으면 “읽기 전용 시작 확인만”>.
```

## 8. 설계 복원 수락 기준

- [ ] 새 채팅이 Codex 주 수정자·Claude 보조·카일 PM·사용자 검증 역할을 정확히 이해한다.
- [ ] 실제 새 PC 경로·HEAD·브랜치·미커밋 변경을 확인하고 옛 G:/C: 경로를 추측하지 않는다.
- [ ] 실행 QSP 기준·mods 방식·왕복 검증·백업·DryRun·실제 게임 검증의 차이를 설명한다.
- [ ] 작은 장면 요청에 관련 location만 찾아 수정·기록·확인 포인트를 제시한다.
- [ ] 미정 사항과 역사적 제안을 확정 사실로 섞지 않는다. 현재 테스트와 2.4 빌드를 분리한다.
- [ ] 상시 화면 관찰·자동 협업·완전 기억 복제를 약속하지 않는다.
- [ ] 리소스 전체 이전이나 무관한 설치·빌드·배포를 시작하지 않는다.

## 근거 및 이번 확인의 한계

아래 링크는 조사 당시 커밋에 고정했다. 새 PC의 최신 문서를 다시 읽으면 이 설계서의 낡은 상태도 갱신할 수 있다.

- **[S1]** [통합 인계 README](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/docs/session-handoffs/2026-10-04/README.md): 주 대화·Codex 주 담당·2.4 상태.
- **[S2]** [주 대화 인계](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/docs/session-handoffs/2026-10-04/threads/01a0f55f-a7b2-7ac3-905b-647154c5943b.md): 대상 ID·플레이 중심 작업·사용자 역할 결정. 조회된 3페이지/24턴은 전체 원문을 보장하지 않는다.
- **[S3]** [AGENTS.md](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/AGENTS.md), [PROJECT.md](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/docs/PROJECT.md), [CLAUDE.md](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/CLAUDE.md): 역할·분담·읽을 문서.
- **[S4]** [PROCESS.md](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/docs/modding/PROCESS.md): 사용자 적용·mod 인계·PM 빌드·구 컨펌 폐지.
- **[S5]** [apply_mods.ps1](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/tools/apply_mods.ps1), [context-notes.md](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/docs/modding/context-notes.md): old/new/count·후속 대체·참고 해시·백업.
- **[S6]** [최신 homecom 인계](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/docs/session-handoffs/2026-10-04/homecom-2026-10-04.md), 특히 추가 7절: 플레이 폴더 기준 카탈로그·미정 사항.
- **[S7]** [운영 규칙 구축 인계](https://github.com/kenwac74-svg/JO9sa/blob/d94984df838f65dc473fcd0f0f0ed89de1de25a3/docs/session-handoffs/2026-10-04/threads/6abcccf4-5244-83e8-9cd3-d4d706b57b11.md): 사용자의 최소 컨텍스트·Sol/Astra 요구. 전역 규칙 파일 구현 완료 증거는 없음.
- 추가로 실제 `docs/modding/LOCAL_HANDOFF_2026-10-01.md`, `NEW_PC_KR.md`, `IMAGE_RANDOM_RULES.md`, `source/README.md`, `assets/README.md`, `tools/setup_pc.ps1`, `tools/imgmg`의 경로 매개변수를 읽었다. 오래된 QSRC 재빌드·해시 체인·자동 실행 안내는 현재 코드와 최신 정정으로 대체했다.

**읽기 검사 결과:** main HEAD는 위 커밋, origin은 `https://github.com/kenwac74-svg/JO9sa.git`. 실제 QSP SHA-256은 `88F6A7F0A8060E47DFB0475FED4AD1D66442DABDADB931E8C71E744BE2F08FA6`. Windows PowerShell 5.1의 DryRun에서 왕복 검증(location 248개), 10개 mod/13개 edit 적용·후속 대체 판정이 통과했고 파일을 쓰지 않았다. 기존 인계의 `6D5E7563…A05B`와 다른 해시의 전체 차이 원인은 이번에 분석하지 않았다. 오래된 해시를 강제로 맞추는 지시를 만들지 않았다.

관측 도구는 Git 2.56.0.windows.1, PowerShell 7.6.5/Windows PowerShell 5.1.26100.9549, Claude Code 2.1.287, VS Code 1.140.0, Node 24.19.0이다. Python은 이 실행 환경 PATH에서 미발견. 이는 관측값이며 고정 필수 버전은 아니다. 원격 fetch·pull·새 PC 동작·게임 화면·세이브 호환은 검증하지 않았다.

로컬 메모리 확인: `CODEX_HOME` 환경변수는 비어 있었고 사용자 기본 `.codex`의 `memories_v2`는 없었다. `memories`는 빈 목록이며 요약 파일도 확인되지 않았다. session_index에는 대상 대화 검색 결과가 없었고 지원되는 개인 맥락 조회는 이용 불가를 반환했다. 원 대화 전체·숨은 기억은 복원하지 못했다. SQLite/인증 파일·차단 경로를 우회하지 않았다.

게임·엔진·mods·자산 변경, 빌드, 설치, 패치 적용, 패키징, 커밋·푸시는 이번 문서 작업에서 수행하지 않았다.
