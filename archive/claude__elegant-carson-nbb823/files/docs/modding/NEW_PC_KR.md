# PC를 바꿔서 JO9 모딩 이어 하기

repo(git)에는 도구, 패치 기록(`mods\*.json`), 작업 기록이 들어 있다. 게임 설치본, 세이브, 새로 만든 이미지는 repo에 넣지 않는다. 이미지는 **zip 하나**로 직접 옮긴다.

| 옮기는 것 | 방법 |
|---|---|
| 도구·mods·문서 | git push → 새 PC에서 git clone/pull |
| mods가 쓰는 이미지·`menu_icon.json` | `dist\JO9_mod_assets.zip`을 USB·클라우드 드라이브 등으로 직접 복사 |
| 게임 `jack.qsp` | 옮기지 않는다. 새 PC에서 mods를 적용해 똑같이 만든다 |
| 게임 설치본, 세이브 | 각 PC에서 따로 관리 |

## 게임 폴더 구조
게임 폴더는 사용자가 직접 지정한다. 실제 qsp는 게임 폴더 바로 아래가 아니라 `game` 안에 있다.

```text
<게임폴더>\Jack-o-nine-tails.exe
<게임폴더>\game\jack.qsp          ← 패치 대상
<게임폴더>\game\content\pic\...   ← 이미지
<게임폴더>\game\engine\jack.exe   ← 실행 중인 창의 프로세스(jack)
```

## A. 지금 PC에서 떠나기 전에
1. 작업을 커밋·푸시한다(Claude에게 "동기화 해"라고 하면 된다).
2. 이미지 묶음을 만든다.
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\mod_assets.ps1 -Pack
   ```
   - 현재 게임 qsp가 실제로 쓰는 mods 이미지와 `mods_assets\extra.txt`에 적은 파일을 `dist\JO9_mod_assets.zip`으로 묶는다.
   - 파일 목록과 해시는 `mods_assets\manifest.json`에 갱신된다. 이 manifest는 커밋·푸시한다. zip은 git에 넣지 않는다.
3. `dist\JO9_mod_assets.zip`을 새 PC로 복사한다.

## B. 새 PC에서
준비물: Windows 10/11, Git, VS Code, Jack-o-nine-tails 2.3.2.5 Korean 설치본. Python은 필요 없다(분석용 `tools\qsp_dump.py`만 Python이 있어야 한다). 이미지 편집 UI를 쓰려면 Node.js(LTS)도 설치한다.

1. 저장소 복제
   ```powershell
   git clone https://github.com/kenwac74-svg/JO9sa.git JO9sa
   cd JO9sa
   ```
   작업 브랜치가 아직 main에 병합되지 않았으면 `git clone -b claude/elegant-carson-nbb823 ...`으로 받는다.
2. 설치 스크립트 — Claude Code·PATH, VS Code 확장, Node 패키지, 게임 폴더 지정
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\setup_pc.ps1 -GameRoot 'D:\Games\Jack O Nine Tails v2.3 Kor_nosex'
   ```
   `-GameRoot`를 생략하면 폴더 선택 창이 뜬다. repo 루트에 `local.config.json`(git 제외)을 만든다. 게임 폴더만 다시 지정하려면 `-GameOnly`.
3. 이미지 설치 — 복사해 온 zip을 repo의 `dist\`에 두고
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\mod_assets.ps1 -Install
   powershell -ExecutionPolicy Bypass -File tools\mod_assets.ps1 -Check    # 확인만
   ```
   이미 같은 파일은 건너뛴다. 내용이 다른 기존 파일(예: `json\menu_icon.json`)은 `.bak_날짜`로 백업한 뒤 덮어쓴다.
4. 패치 적용
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\apply_mods.ps1 -DryRun   # 검증만
   powershell -ExecutionPolicy Bypass -File tools\apply_mods.ps1
   ```
   - edit마다 `old`가 있으면 바꾸고, `new`가 이미 있으면 건너뛴다. 뒤 mod가 앞 mod의 결과를 다시 바꾼 경우도 "적용돼 있음"으로 건너뛴다. 그래서 원본이든 일부만 패치된 상태든 몇 번을 돌려도 같은 결과가 된다.
   - 둘 다 아니면 아무것도 쓰지 않고 중단한다. 이때는 게임 버전이나 다른 모드 적용 여부를 확인한다.
   - 왕복 검증(읽고 그대로 다시 쓴 결과가 원본과 바이트 동일) 뒤에만 쓰고, 쓰기 전에 `jack.qsp.bak_YYYYMMDD_HHMMSS` 백업을 만든다.
   - 원본 기준 게임(`59E1A1AF…`)에서 시작했다면 결과 해시는 `source\README.md` 표의 최신 보관본 해시와 같아야 한다.
5. 게임을 켜서 직접 확인한다. 바뀐 장면(홍등가 메뉴, 펠라 담당 r/s, 길거리 창녀 t/u 등)이 나오면 된다.
6. VS Code에서 `파일 > 폴더 열기`로 repo 폴더를 열고 Claude Code 패널을 연다. Claude Code 계정 로그인은 직접 한다. Claude는 `CLAUDE.md`와 `docs/modding/context-notes.md`를 읽고 이어서 작업한다.

2~4단계는 VS Code `Tasks: Run Task`의 `JO9: ...` 작업으로도 실행할 수 있다.

## 이미지 편집 UI (선택)
`start-image-ui.cmd`를 더블클릭하거나 `npm run image-ui`. OpenRouter API 키는 화면에서 입력하거나 환경 변수 `OPENROUTER_API_KEY`로 준다. 키는 파일에 저장하지 않으므로 PC마다 다시 넣는다. 자세한 사용법은 `tools\image-ui\README.md`.

## 새 수정을 기록하는 방법
게임에서 수정이 확정되면 `mods\`에 날짜로 시작하는 JSON을 하나 추가한다. 파일 이름 순서로 적용되므로, 앞 mod의 결과를 다시 바꾸는 mod는 이름이 뒤에 오게 짓는다. `before_sha256`, `after_sha256`은 참고용이며 모르면 빈 문자열로 둔다.

```json
{
  "description": "무엇을 왜 바꾸는지 한 줄",
  "id": "YYYY-MM-DD_짧은이름",
  "target": "game\\jack.qsp",
  "before_sha256": "적용 전 해시",
  "after_sha256": "적용 후 해시",
  "edits": [
    { "location": "location 이름", "field": "body", "old": "정확한 원래 문자열", "new": "바꿀 문자열", "count": 1 }
  ]
}
```

`field`는 `body`(본문) 또는 `desc`(설명)다. `count`는 해당 location 안에서 `old`가 나와야 하는 정확한 횟수다. 새 이미지를 쓰는 mod를 추가했으면 PC를 옮기기 전에 `mod_assets.ps1 -Pack`을 다시 한다. mods 문자열에 직접 나오지 않는 파일(메뉴 아이콘 등)은 `mods_assets\extra.txt`에 경로를 적는다.

## 막혔을 때
- `claude`가 인식되지 않으면 `%USERPROFILE%\.local\bin`이 사용자 PATH에 있는지 확인하고 터미널을 다시 연다.
- 스크립트의 한국어가 깨지면 파일이 UTF-8(BOM) 그대로인지 확인한다. Windows PowerShell 5.1은 BOM이 없으면 한국어를 잘못 읽는다.
- `mod_assets.ps1 -Install`이 "zip이 없습니다"라고 하면 zip이 `dist\JO9_mod_assets.zip`에 있는지, 또는 `-Zip <경로>`로 지정했는지 확인한다.
- PowerShell 프롬프트(`PS ...>`)에는 Claude에게 보낼 메시지를 붙여 넣지 않는다.
