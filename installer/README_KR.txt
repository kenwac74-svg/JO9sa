JO9 UI v1.9.14 SNKmod R3 — 설치 안내
==========================================

이 패키지는 FIX6 UI를 SNKmod 폴더 방식으로 옮긴 것입니다.
Windows 설치·인게임 표시는 아직 검증하지 않은 개발판입니다.

[설치 방식]
- UI/UX 이미지: game/SNKmod/content/pic/ 아래에 새로 넣습니다.
  원래 game/content/pic/ 의 이미지는 수정·이동·삭제하지 않습니다.
- 이미지가 아닌 파일(jack.qsp, css/base.css, json/menu_icon.json, 조건에 맞는 engine/jack.exe):
  원래 경로에 덮어씁니다. 설치 전 원본을 _JO9_SNKmod_STATE 폴더에 보관해 복구할 수 있습니다.
- jack.qsp: 5개 UI location 본문을 교체하고, 46개 location의 UI 이미지 경로를 SNKmod 경로로 바꿉니다.
- BG 번역 이미지(slave_psychology)와 트로피룸은 UI/UX에 포함됩니다.

[사용법]
- CHECK.cmd : 아무 파일도 바꾸지 않고 설치 계획과 경고를 보여 줍니다.
- APPLY.cmd : 설치합니다. game 폴더의 jack.qsp를 선택하세요. 게임은 닫아 두세요.
- RESTORE.cmd : SNKmod UI를 제거하고 jack.qsp·base.css·엔진을 설치 전 상태로 되돌립니다.
- SNKmod 폴더만 지우지 마세요. jack.qsp가 SNKmod 경로를 가리키고 있어 UI 그림이 깨집니다.
  제거할 때는 반드시 RESTORE.cmd를 쓰세요.
- SNKmod 이미지는 jack.qsp 수정과 함께 작동합니다. SNKmod 폴더만 수동 복사해서는 적용되지 않습니다.

[기존 FIX6 설치본]
- FIX6 백업(_JO9_UI_ALL1914_BACKUPS)이 온전하면, 설치 전에 FIX6 이전 상태로 먼저 되돌립니다.
- 백업이 없거나 FIX6 설치 후 파일이 바뀌었으면 되돌리지 않고 경고만 합니다.
  이 경우 FIX6가 덮어쓴 원본 이미지는 복구할 수 없습니다. FIX6 백업 폴더는 지우지 않습니다.

[호환성]
- jack.qsp를 수정하는 다른 모드(QSP 모드)와는 호환되지 않습니다.
  QSP 모드끼리 함께 쓰려면 통합 빌드가 필요합니다.
  설치기는 해시가 맞지 않아도 설치를 거부하지 않습니다. 경고를 보여 주고 이 모드의 UI 본문으로 교체합니다.
- 이미지 교체 모드: 이 모드가 SNKmod로 옮긴 이미지(ui_map.json의 Originals 경로)를
  원본 경로에서 바꾸는 모드는 그 이미지가 게임에 반영되지 않으므로 호환되지 않습니다.

[한글 파일명 정리]
- 한글 이름 UI 이미지 22개는 SNKmod 안에서 영문 이름으로 바꿔 넣었습니다 (예: Fer_가임 → Fer_PregO, 소리 → Sound).
  원본 한글 파일은 그대로 두며, jack.qsp·base.css의 참조만 영문 이름으로 바꿉니다.
  대응표는 ui_map.json의 Originals와 SNKmod 항목에 있습니다.
- Fer_안전·Fer_젖소·Fer_평시는 새 디자인 아이콘(Fer_PregS, Fer_Milk, Fer_Normal)으로 넣었습니다.

[예비 리소스]
- ui_map.json에서 Status가 "spare"인 16개 파일은 이 모드에서 쓰지 않습니다.
  앞으로 쓸 수 있도록 미리 넣어 둔 예비 리소스입니다.

[일반 이미지 (캐릭터·NPC·일반 배경)]
- 이번 R3 패키지에는 일반 이미지가 없습니다.
- 일반 이미지를 포함하는 경우: UI/UX는 원본 UI 이미지를 보존하고 복구할 수 있습니다.
  캐릭터·NPC·일반 배경은 원본 파일을 교체하며 백업·자동 복구를 제공하지 않습니다.
  원하는 그림만 수동으로 교체할 수도 있습니다. UI/UX를 제거해도 교체한 일반 이미지는 그대로 남습니다.

[엔진]
- 순정 jack.exe와 맞는 Qt5Widgets.dll이 확인될 때만 재도색 수정 엔진으로 교체합니다.
- 이미 수정된 엔진이나 커스텀/미상 엔진은 그대로 둡니다.
