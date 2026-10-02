JO9 UI_overhaul_SNKmod 0.14 — QSP 컨펌 요청 (UI 세션 → 게임 수정 세션)
작성: 2026-10-02, 브랜치 claude/sweet-meitner-72rd73

[파일]
candidate_jack.qsp   후보. UI 빌드 + main의 mods 5개 적용
  SHA-256 8D963AE88DCEA0DB9500B29BCD5112933ABD81042D5BE8516113840094E607C6  (17,026,702 B)
base_jack.qsp        기반. 같은 UI 빌드에서 mods만 뺀 것 (build_package.py --no-mods)
  SHA-256 59E1A1AFB4FDD2E9BF9B1FFDCB12C10F2F4CC15D4CD3D890E21F8CB652F5958E  (17,019,470 B)
ui_changed_locations.txt  순정 대비 UI 빌드가 바꾼 location 248개, 줄 끝 표시
  [new] 5 / [guard] 181 (개인실 진입 보호 줄만) / [path] 27 (보호 줄+이미지 경로만) / [ui] 35 (화면 코드)
  [tooltip]·[kura] 표시는 장비 툴팁·쿠라 개인 패치가 고친 곳

[적용한 mods (파일 이름 순서)]
2026-10-01_city_menu_label.json
2026-10-01_robertus_rufus_art_tutor.json
2026-10-02_city_title.json
2026-10-02_redlight_bj_variant.json
2026-10-02_redlight_text.json
모든 edit에서 old가 UI 본문에 정확히 count번 있었다 (interaction, interaction_city 포함).

[UI 쪽 확인 결과]
- tools/qsp_verify.py (기반·후보·mods·목록): PASS, 기반 대비 바뀐 location 7개, 추가·삭제 없음
- 기반 SHA-256은 source/jack_2026-10-01.qsp와 같다
- 후보 SHA-256은 사용자 PC 게임(G:\somi\JO9\game\jack.qsp, 2026-10-02)과 같다
  → 사용자가 지금 게임에서 하는 화면 점검이 곧 이 후보의 점검이다
- 설치기 검사 58/58 (Windows PowerShell 5.1), 개인실 정적 검사 13/13 (후보)
- 하지 못한 것: WASM 엔진 검사(이 PC에 node 없음)

[mods가 쓰는 이미지·메뉴 아이콘 — UI 패키지에 포함]
resources/mod_assets/ (사용자 PC에서 복사, assets.json에 SHA-256 기록)
  SNKmod/characters/master_robertus_rufus.png
  SNKmod/ui overhaul/robertus_rufus.png, robertus_rufus_gray.png
  SNKmod/scene/whore_redlight/whore_redlight-1121.png, -1131.png
  json/menu_icon.json: menu_item_art_tutor, menu_item_art_tutor_gray → 루푸스 아이콘

[요청]
게임 수정 세션 검토 + 사용자 게임 점검이 통과하면 후보 SHA-256 컨펌을 알려 주세요.
컨펌 전에는 배포 ZIP을 만들지 않습니다.
