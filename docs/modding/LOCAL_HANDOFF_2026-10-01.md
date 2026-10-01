# 로컬 Claude 핸드오프 — 2026-10-01

너(로컬 Claude Code)는 사용자가 JO9를 플레이하며 하는 지시를 받아 게임 소스를 직접 고친다. 아래는 이미 정해진 것이다. 다시 묻지 말고 이대로 진행한다. 원칙 전문은 `JO9_Claude_Local_Modding_Handoff.md`.

## 경로
- repo: `C:\MOVE\JO9sa` (브랜치 `main`, `git pull`로 최신 유지)
- 게임 폴더: `C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex` (여기에 git init 하지 않는다)
- 최신 소스(사용자 지정): `source/jack_2026-10-01.qsp`, SHA-256 `59e1a1afb4fdd2e9bf9b1ffdcb12c10f2f4cc15d4cd3d890e21f8cb652f5958e`
- 화면 확인: 게임을 켠 상태에서 `powershell -ExecutionPolicy Bypass -File tools\screenshot.ps1` → 출력된 PNG를 읽는다. 사용자가 "화면 봐"라고 하면 이걸 쓴다. 클릭·키 입력 자동화는 하지 않는다.

## 결정 (확정)
1. 소스 기준은 최신 qsp 직접 수정이다. `.qsrc` 재빌드는 하지 않는다 (FIX6가 5개 location을 qsp에서 직접 교체해서 `.qsrc`가 오래됐다).
2. 백업은 수정 대상 파일(`jack.qsp`, `css\base.css`)을 날짜 붙여 복사한다. 게임 폴더 전체를 git에 넣지 않는다.
3. 이 repo의 UI 패치(`JO9UIpatch`)와 이미지 툴(`JO9imgtool`)에는 손대지 않는다.

## qsp 형식 (`tools/qsp_dump.py`가 읽는 방식)
- UTF-16LE, `\r\n` 구분. 첫 줄 `QSPGAME`. `f[3]`이 location 수(문자 코드 +5 이동 암호). 이후 location마다 이름, 설명, 본문, 액션 수, 액션당 3줄. 모든 값은 문자 코드를 +5 하여 저장한다.
- 쓰기는 이 역순(−5)이다. 수정하지 않은 location은 원본 줄을 그대로 둔다.

## 작업 순서 (이 순서를 지킨다)
1. **해시 비교.** 게임 폴더 `jack.qsp`와 `source/jack_2026-10-01.qsp`의 SHA-256을 비교해 보고한다. 다르면 멈추고 사용자에게 어느 쪽이 최신인지 묻는다.
2. **왕복 검증.** qsp를 읽고 수정 없이 그대로 다시 쓴 결과가 원본과 바이트 동일한지 확인한다. 통과 전에는 어떤 수정도 하지 않는다. 쓰기 도구는 `tools/qsp_patch.py` 같은 새 파일로 만들고 첫 줄에 한국어 한 줄 주석을 단다.
3. **백업.** `jack.qsp`를 `jack.qsp.bak_20261001`로 복사한다.
4. **첫 수정 과제.** 홍등가 메뉴 라벨을 바꾼다.
   - location `city_menu_form`, 문자열 `FUNC('$menu', 'interaction_city', $menu_item_dosug, 22700, '환락 센터')`
   - 마지막 인자 `'환락 센터'`만 `'사창가 골목'`으로 바꾼다. 소스 전체에서 "환락"은 이 한 곳뿐이다. 치환 횟수가 정확히 1인지 확인한다.
   - 라벨은 `$save_link`에도 아이콘 키(`menu_icon.json`)에도 쓰이지 않아 버그 위험이 낮다고 분석해 두었다.
   - `#place_base`의 `'은밀한 유흥관'`(장소 안쪽 제목)도 바꿀지는 사용자 결정 대기다. 임의로 바꾸지 않는다.
5. **적용과 확인.** 수정한 qsp를 게임 폴더의 `jack.qsp`로 둔다(백업 확인 후). 게임을 다시 켜고 홍등가 메뉴를 화면 캡처로 확인한다. 안 보이면 원본을 복구한다.

## 이미지 랜덤 선택 구조 (참고)
- `display_pic` location이 경로 `girls/sex_scenes/<행위>/<행위>_<머리색>_<길이>_<나이>_<번호>`를 만든다. 번호는 `rand(1, picMax[풀])`이고 직전 번호는 피한다. `picMax`는 qsp에 대입문이 없으며, 폴더 파일 수를 엔진이 세는 것으로 추정한다.
- 특정 이벤트 전용 이미지는 공용 이미지를 바꾸지 말고 해당 이벤트 분기에서만 새 경로를 쓰게 한다. 자세한 내용은 `context-notes.md`.

## 보고 형식
수정 파일, 수정 location, 핵심 변경, 빌드(쓰기) 여부, 게임에서 확인할 포인트만 짧게. 확인하지 못한 것은 확인하지 못했다고 쓴다.
