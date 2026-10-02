# VS Code에서 JO9 모딩 시작하기

새 PC라면 먼저 [새 PC 안내](NEW_PC_KR.md)대로 `tools\setup_pc.ps1`과 `tools\apply_mods.ps1`을 실행한다.

## 준비 (처음 한 번)
1. VS Code 설치. 확장에서 `Korean Language Pack for Visual Studio Code`(Microsoft)를 설치하면 메뉴가 한국어가 된다.
2. 확장에서 `Claude Code`(Anthropic 공식)를 설치하고 로그인한다.
3. 메뉴 `파일 > 폴더 열기`로 `C:\MOVE\JO9sa`를 연다. "이 폴더를 신뢰하는가"를 물으면 신뢰한다.
4. repo가 최신인지 확인한다. 터미널(`Ctrl+``)에서 `git pull`.

## 매번 작업할 때
1. 게임(`jack.exe`)을 켜 둔다. 게임 폴더는 `C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex`.
2. VS Code에서 `C:\MOVE\JO9sa`를 열고 Claude Code 패널을 연다.
3. 게임을 플레이하다가 고치고 싶은 장면에서 Claude에게 지시한다. 예) "지금 화면에서 환락 센터를 사창가 골목으로 바꿔줘".
4. 필요하면 "화면 봐"라고 한다. Claude가 `tools\screenshot.ps1`로 게임 화면을 캡처해 읽는다.
5. 수정이 끝나면 게임에서 직접 확인하고 결과를 알려 준다.

## Claude에게 처음 보낼 메시지
```text
docs/modding/JO9_Claude_Local_Modding_Handoff.md와 docs/modding/context-notes.md를 읽어. 게임 폴더는 C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex 이고, 최신 소스는 source/jack_2026-10-01.qsp 야. 먼저 게임 폴더의 jack.qsp와 source/jack_2026-10-01.qsp의 SHA-256을 비교해서 같은지 알려줘. 아직 아무것도 수정하지 마.
```

## 수정 전에 지켜야 할 것
- 소스 기준은 최신 qsp 직접 수정이다. `.qsrc`로 재빌드하지 않는다.
- qsp를 읽고 그대로 다시 썼을 때 원본과 바이트가 같은지 먼저 검증한다.
- 백업은 수정 대상 파일(`jack.qsp`, `css\base.css`)만 날짜를 붙여 복사한다. 게임 폴더 전체를 git에 넣지 않는다.

## 막혔을 때
- `claude`가 인식되지 않으면 PATH 문제다. `C:\Users\Ken Choung\.local\bin`을 사용자 PATH에 추가하고 터미널을 다시 연다.
- PowerShell 프롬프트(`PS ...>`)에는 Claude에게 보낼 메시지를 붙여 넣지 않는다. Claude 패널이나 `claude` 화면에만 붙여 넣는다.
