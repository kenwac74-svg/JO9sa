JO9 Current Screen Image Workshop v1.1.2 + PIC_TOP_R1
재패키징: 2026-09-25

이번 반영 내용
--------------
제공받은 JO9_Place_Workshop_PIC_TOP_v1.html을 내용 변경 없이
payload/modtools/place/JO9_Place_Workshop.html에 반영했습니다.
PIC 폴더 등록 영역이 현재 화면 이미지 목록보다 위에 표시됩니다.

설치 검증용 manifest와 VERSION.txt를 함께 갱신했습니다.
엔진, 감지/서버 스크립트, 설치/복구 스크립트, 필터 설정은 원본
v1.1.2 배포본과 바이트 단위로 동일합니다. SNmod 기능은 미포함입니다.

설치 방법
---------
1. 진행 상황을 저장하고 게임과 기존 워크샵 창을 닫습니다.
2. 이 ZIP의 내용물을 Jack-o-nine-tails.exe가 있는 게임 최상위 폴더에 풉니다.
   JO9_PATCH_MANAGER.cmd와 payload 폴더가 그 실행 파일 옆에 있어야 합니다.
3. JO9_PATCH_MANAGER.cmd 실행 → 1. 패치 설치 / 업데이트 → 확인 후 YES.
4. 게임을 다시 실행하고 Other → Image Workshop으로 확인합니다.

순정 복구를 먼저 실행하지 마세요. 기존 패치 관리자와 동일한 업데이트 방식입니다.
알 수 없는 엔진 변경이 감지되면 기존 설치기의 호환성 경고를 확인하세요.
브라우저 탭 제목은 승인된 HTML 그대로이므로 이전 v1.0.5 표기가 남아 있습니다.
이 재패키징본 구분은 ZIP 이름과 설치 후 game/modtools/VERSION.txt를 사용합니다.

검증 범위
---------
파일 무결성, JavaScript 문법, 오프라인 Chromium UI 검사를 수행했습니다.
Windows에서 설치 실행, Show HTML 캡처, 실제 이미지 쓰기/복구,
실제 게임 화면에서의 동작은 이번 환경에서 검증하지 않았습니다.
검증 상세: REPACKAGE_QA_REPORT.txt / REPACKAGE_REVIEW.md

아래는 원본 v1.1.2 사용 안내입니다.
============================================================

JO9 Current Screen Image Workshop v1.1.2 — Patch Manager

권장 실행:
JO9_PATCH_MANAGER.cmd

메뉴:
1. 패치 설치 / 업데이트
2. 순정 복구
0. 종료

설치 원칙
---------
순정 복구는 설치의 선행 절차가 아니다.
설치/업데이트를 선택하면 현재 상태에서 바로 패치를 설치한다.

설치 전에 항상 변경 파일 목록을 출력한다.

현재 game/engine/jack.exe가:
- 2.3 순정이면 정상 설치 안내
- 기존 JO9 Image Workshop 패치 엔진이면 업데이트 안내
- 둘 다 아니면:
  "2.3 버전 순정파일이 아닙니다.
   다른 모드와 충돌하지 않는지 점검하세요.
   그래도 진행하시겠습니까?"
  경고 후 YES를 입력하면 계속 설치 가능.

즉 비순정 파일이라고 패치를 막지 않는다.

중요한 호환성 변경
-----------------
설치 시 game/modtools 폴더 전체를 삭제하지 않는다.
우리 패치가 사용하는 파일만 덮어쓴다.

순정 복구 시에도 game/modtools 전체를 지우지 않는다.
JO9 Image Workshop 소유 파일만 제거하고, 다른 파일이 남아 있으면
modtools 폴더 자체는 유지한다.

순정 복구는 사용자가 메뉴에서 명시적으로 선택한 경우에만 실행한다.
복구 시 game/engine/jack.exe는 2.3 순정 엔진으로 바뀌므로
다른 엔진 모드를 쓰고 있다면 경고를 확인해야 한다.

이미지 감지/교체 코어는 v1.1.1과 동일.
