# 워크숍 현재 화면 캡처 수리 — 2026-10-24

WORK의 노예 정보/규칙 화면에서 워크숍이 열리지 않던 문제를 수정했다. 소스와 WORK modtools/JO9_Detect.ps1 및 VERSION.txt만 갱신했다.

## 원인과 수정

실행 중인 엔진(Qt5.4.2)의 QTextEdit는 MSAA TEXT 역할42의 자기 자신의 Value에 HTML241802자를 제공한다. 기존 함수는 UIA 자식 Document/Edit의 TextPattern만 찾고0자를 반환했다. 실제 같은 창으로 RED0자→GREEN241802자를 확인했다. 기존 메뉴 키 전송은 실제 메뉴 호출을 검증하지 못했고, 뒤의 클립보드 대체 읽기도 성공하지 않아 네 번의 실패 로그가 남았다. 정확히 어느 자동 키/클립보드 호출이 실패했는지는 이전 로그만으로 확정하지 않는다.

현재는 MSAA에서 메뉴 바→Other→Show html의 실제 객체를 찾아 CHILDID_SELF(0)의 동작을 호출하고, 열린 QTextEdit 자체의 Value를 직접 읽는다. 이 주 경로는 키보드 입력과 클립보드를 쓰지 않는다. 숨겨진 과거 HTML은 캡처 후보에서 제외한다. MSAA가 없는 환경의 기존 경로는 유지하되, 키를 보내기 전에 유효한 창과 실제 전경 창을 확인한다.

## 호출·입출력·의존성·복구

- 호출: 기존 JO9_Launch.cmd(-Sta)→JO9_Detect.ps1. WORKSHOP_MSAA_CAPTURE_20261024 표식의 내장 C# 접근성 함수가 메뉴 호출과 읽기를 담당한다.
- 입력: 현재 게임 PID/메인 HWND 및 엔진이 만든 HTML 창. 출력: 기존 runtime/context.json의 이미지 목록·현재 시각·status.
- 쓰기: 원래의 runtime/context.json/viewer_hwnd.txt/detect.log와 필요한 기존 서버 상태. 게임 QSP·이미지·JSON·세이브에는 쓰지 않는다.
- 의존성: Windows oleacc.dll과 .NET Accessibility, 기존 UIAutomation/Forms. 추가 프로그램 설치는 없다.
- 변경: 소스/WORK의 감지기와 VERSION.txt 두 쌍. Full·ZIP·게임 소스·설정/필터·커밋/푸시는 변경하지 않았다.
- 제거/분리: C# 접근성 블록만 지우고 호출을 남기면 컴파일/호출이 실패한다. 복구하려면 before.ps1 및 before-version.txt를 소스와 WORK에 함께 복원한다. runtime이나 사용자 이미지·설정은 초기화하지 않는다.

## 검증

PowerShell문법과 WindowsPowerShell STA에서 C#컴파일PASS. 실제 HTML창의 읽기 RED/GREEN, 숨김재사용/보이는창재사용3회, 잘못된핸들입력차단, 클립보드sequence보존PASS. 설치된 전체 감지2회에서 context status=ok·이미지36개·에게야현재전신을확인했다. 두번째는캐시핸들재사용도통과했다. 기존브라우저14993페이지에서감지36개/표시4개및에게야·방배경카드를확인했다.

사용 방법은 기존 WORKSHOP 실행과 같다. 이 버전의 검사 범위는 현재 WORK 엔진과 현재 규칙 창이며, 모든 구형/다른 엔진의 대체 경로를 전수 검사한 결과는 아니다.
