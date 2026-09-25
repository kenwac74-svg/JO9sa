# GPT 인계 — SNKmod에서 이름이 바뀐 UI 리소스

- 작성일: 2026-09-25
- 기준: JO9 UI v1.9.14 SNKmod **R3** (사용자 Windows 인게임 시험 통과)
- 저장소: `kenwac74-svg/JO9sa`, 브랜치 `JO9UIpatch`

## 먼저 알아 둘 것

- UI 패치 이미지는 `game/SNKmod/content/pic/` 아래에 있다. 게임 원본 `game/content/pic/`의 파일은 그대로 남아 있다.
- 아래 22개는 원래 한글 파일명이었다. SNKmod 안에서는 **영문 이름으로만** 존재한다. 게임 코드(jack.qsp, css/base.css)도 영문 이름의 SNKmod 경로를 가리키도록 바뀌었다.
- 원본 한글 파일은 게임 폴더에 그대로 있지만, SNKmod 설치 후에는 게임이 그 파일을 쓰지 않는다.
- 이 22개를 다룰 때는 아래 **새 경로**를 쓴다. 한글 이름으로 새 파일을 만들거나 참조하지 않는다.
- 규칙: 앞으로 한글 파일명 리소스가 생기면 사용자에게 알리고, 사용자가 정한 영문 이름으로 바꿔 SNKmod에 넣는다.

## 1. `ui/jon-UIadds/` 가임·처녀 상태 아이콘 (9개, 28×30)

원래 폴더 `content/pic/ui/jon-UIadds/` → 새 폴더 `SNKmod/content/pic/ui/`. 모두 `sjm_UI_UIadds` location에서 노예·조수 상태 표시에 쓴다.

| 원래 이름 | 새 이름 | 게임 툴팁 (코드상 의미) | 이미지 출처 |
|---|---|---|---|
| Fer_가임.png | **Fer_PregO.png** | 가임기 | FIX6 |
| Fer_불임.png | **Fer_PregX.png** | 임신 불가 | FIX6 |
| Fer_산란.png | **Fer_PregEg.png** | 산란기 | FIX6 |
| Fer_아동.png | **Fer_Mi.png** | 임신 불가 (미성숙, fertility = -2) | FIX6 |
| Fer_안전.png | **Fer_PregS.png** | 안전일 | 새 디자인 (회색 자궁) |
| Fer_젖소.png | **Fer_Milk.png** | 착유용 젖소 | 새 디자인 (젖소 머리) |
| Fer_평시.png | **Fer_Normal.png** | 임신률 저하 | 새 디자인 (분홍 자궁) |
| Vir_비.png | **Vir_Xcr.png** | 처녀막 없음 | FIX6 |
| Vir_처.png | **Vir_Ocr.png** | 처녀막 있음 | FIX6 |

- Fer_Milk와 Fer_Normal은 참조가 있지만 소스상 거의 나오지 않는다. 젖소 상태(-3)는 항상 "공개됨"과 함께 설정되어 Fer_PregX가 대신 나온다. 평시에 해당하는 fertility 값은 게임 데이터에 없다. 그래도 참조가 있어 포함했다.

## 2. `content/pic/` 루트 상태 아이콘 (13개)

원래 위치 `content/pic/` → 새 위치 `SNKmod/content/pic/ui/`. 사용자가 UI로 판단해 `ui/` 아래로 옮겼다. 이미지는 게임 원본 바이트 그대로다.

| 원래 이름 | 새 이름 | 크기 | 참조 위치 |
|---|---|---|---|
| 낙태.png | **Abortion.png** | 22×22 | assistant_stat |
| 출산.png | **Birth.png** | 22×22 | assistant_stat |
| 상처.png | **Wound.png** | 15×15 | main_screen |
| 질병.png | **Ill.png** | 15×15 | main_screen |
| 소리.png | **Sound.png** | 312×92 | main_screen, city_screen, css/base.css |
| 임신.png | **Preg.png** | 36×36 | slave_private_room1–4 |
| 임신s.png | **Preg_s.png** | 15×15 | main_screen |
| 피임약0.png | **Pill0.png** | 36×36 | slave_private_room1–4 |
| 피임약0s.png | **Pill0_s.png** | 15×15 | main_screen |
| 피임약1.png | **Pill1.png** | 36×36 | slave_private_room1–4 |
| 피임약1s.png | **Pill1_s.png** | 15×15 | main_screen |
| 피임약2.png | **Pill2.png** | 36×36 | slave_private_room1–4 |
| 피임약2s.png | **Pill2_s.png** | 15×15 | main_screen |

- `_s`가 붙은 이름은 원래 이름 끝의 `s`(작은 아이콘)를 뜻한다.

## 참고 — 이름은 그대로이고 위치만 바뀐 파일

이름 변경은 아니지만 경로를 찾을 때 헷갈릴 수 있는 것들이다.

- `content/pic/hart_red|green|purple|blue.png` → `SNKmod/content/pic/ui/hart_*.png` (새 디자인. hart_blue는 예비)
- `ui/grimdark/buttons/*`, `ui/grimdark/bg/*` → SNKmod의 원래 폴더(`buttons/`, `bg/`). `grimdark`, `approved_main_v1`, `jo9_v197`, `jon-UIadds` 같은 모더 폴더 단계는 SNKmod에서 없앴다. 그 폴더 바로 아래 파일은 `SNKmod/content/pic/ui/`로 간다.
- 전체 대응표는 패키지의 `ui_map.json`(Originals → SNKmod)에 있다.
