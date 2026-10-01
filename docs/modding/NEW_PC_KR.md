# 새 PC에서 JO9 모딩 환경 재현하기

이 repo는 도구와 패치 기록(`mods\*.json`)만 관리한다. 게임 설치본·이미지·세이브는 repo에 넣지 않고 PC마다 따로 둔다.

## 준비물
- Windows 10/11, PowerShell 5.1(기본 포함)
- Git, Visual Studio Code
- Jack-o-nine-tails 2.3.2.5 Korean 설치본
- Python은 필요 없다. (분석용 `tools\qsp_dump.py`만 Python 3.10 이상이 있어야 한다.)

## 게임 폴더 구조
게임 폴더는 사용자가 직접 지정한다. 실제 qsp는 게임 폴더 바로 아래가 아니라 `game` 안에 있다.

```text
<게임폴더>\Jack-o-nine-tails.exe
<게임폴더>\game\jack.qsp          ← 패치 대상
<게임폴더>\game\engine\jack.exe   ← 실행 중인 창의 프로세스(jack)
```

## 순서
1. 저장소 복제
   ```powershell
   git clone https://github.com/kenwac74-svg/JO9sa.git JO9sa
   cd JO9sa
   ```
2. 설치 스크립트 실행 — Claude Code 설치·PATH, VS Code 확장(한국어 팩, Claude Code), 게임 폴더 지정
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\setup_pc.ps1 -GameRoot 'D:\Games\Jack O Nine Tails v2.3 Kor_nosex'
   ```
   `-GameRoot`를 생략하면 폴더 선택 창이 뜬다. 필수 파일 3개를 확인하고 repo 루트에 `local.config.json`(git 제외)을 만든다. 게임 폴더만 다시 지정하려면 `-GameOnly`를 붙인다.
3. 패치 적용 — `mods\*.json`을 파일 이름 순서로 적용
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\apply_mods.ps1 -DryRun   # 검증만
   powershell -ExecutionPolicy Bypass -File tools\apply_mods.ps1
   ```
   - 현재 해시가 어떤 패치의 적용 후 해시와 같으면 거기까지는 "이미 적용됨"으로 건너뛴다.
   - 원본(`before_sha256`)도 적용 후 해시도 아니면 아무것도 쓰지 않고 중단한다. 이때는 게임 버전이나 다른 모드 적용 여부를 확인한다.
   - 읽고 그대로 다시 쓴 결과가 원본과 바이트 동일할 때(왕복 검증)만 진행한다.
   - 쓰기 전에 `jack.qsp.bak_YYYYMMDD_HHMMSS` 백업을 만들고, 쓴 뒤 해시가 `after_sha256`과 다르면 백업으로 되돌린다.
4. 화면 확인 — 게임을 켜고(이미 켜져 있으면 재사용) 창을 캡처
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\launch_and_capture.ps1
   ```
   결과는 `compare\jo9_game_window.png`(git 제외). 도시 메뉴에 `사창가 골목`이 보이면 성공이다.
5. VS Code에서 `파일 > 폴더 열기`로 repo 폴더를 열고 Claude Code 패널을 연다. Claude는 `CLAUDE.md`를 보고 작업 규칙을 따른다. 위 2~4단계는 `Tasks: Run Task`의 `JO9: ...` 작업으로도 실행할 수 있다.
6. Claude Code 계정 로그인은 직접 한다(자동화하지 않음).

## 새 수정을 기록하는 방법
게임에서 수정이 확정되면 `mods\` 에 날짜로 시작하는 JSON을 하나 추가한다. 앞 패치의 `after_sha256`이 다음 패치의 `before_sha256`이 된다.

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

`field`는 `body`(본문) 또는 `desc`(설명)다. `count`는 해당 location 안에서 `old`가 나와야 하는 정확한 횟수다.

## 막혔을 때
- `claude`가 인식되지 않으면 `%USERPROFILE%\.local\bin`이 사용자 PATH에 있는지 확인하고 터미널을 다시 연다.
- 스크립트의 한국어가 깨지면 파일이 UTF-8(BOM) 그대로인지 확인한다. Windows PowerShell 5.1은 BOM이 없으면 한국어를 잘못 읽는다.
- PowerShell 프롬프트(`PS ...>`)에는 Claude에게 보낼 메시지를 붙여 넣지 않는다.
