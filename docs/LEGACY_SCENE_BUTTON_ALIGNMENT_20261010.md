# 2026-10-10 무기 선택 버튼 글자 정렬 복구

사용자 화면에서 무기 선택 버튼의 글자가 왼쪽 테두리에 붙어 표시됐다. 무기 선택 `$get_weapon[1]`/`[2]` 코드는 순정과 동일했다. `2026-10-09_city_scene_menu_alignment`가 기존 `bg` 컨테이너를 `jo9_scene_menu`로 바꾸면서 부모의 `text-align:center`가 `left!important`로 바뀌었고, 별도 정렬 선언이 없는 옛 `under`/`under_gray` 버튼의 글자도 왼쪽 정렬을 상속했다.

현재 플레이 QSP의 `$menu` → `layout_style`에 아래 규칙만 추가했다. 기존 메뉴 열의 배치·크기·클릭 처리 및 무기 선택 코드는 그대로다.

```css
#jo9_scene_menu #under,#jo9_scene_menu #under_gray{text-align:center!important;}
```

- 패치: `mods/2026-10-10_restore_legacy_scene_button_alignment.json` (1 edit). 선행 메뉴 정렬 패치와 연쇄 재적용이 가능하도록 전체 layout 함수 문맥을 기록했다.
- 백업: `G:/somi/JO9/game/jack.qsp.bak_20261010_153843`.
- 적용 전 SHA-256: `1AF050F737D62BA29BCB898A18DBD7C43443B4F114B837C2ED05618AF34A96E6`.
- 적용 후 SHA-256: `6C450E2199733202907D9C594DDBC3DEB77B2D7241B85FED90AB61CCDAFE2AFB`.
- QSP 왕복 바이트 일치, 247 location 유지, `$menu.body` 외 변경 없음.
- 실제 게임 CSS와 적용 전/후 layout CSS로 만든 headless Edge fixture에서 활성·비활성 버튼 글자 정렬이 left → center로 바뀌는 것을 확인했다. 버튼 및 클릭 오버레이의 x/y/width/height와 EXEC href, 공용 메뉴 영역 및 일반 메뉴 열의 배치는 동일했다.
- 앞선 도시 메뉴 정렬 mod 전체와 이번 mod를 함께 DryRun해 멱등 재적용 PASS, 실제 QSP 추가 쓰기 없음.
- 상세 검사: `docs/qa/2026-10-10_legacy-scene-button-alignment.json`.

Edge fixture 검사는 QSP 클라이언트 화면 검증을 대신하지 않는다. 사용자에게 게임 재실행 후 같은 무기 선택 화면에서 버튼 글자가 가운데 표시되는지 확인을 요청한다.


## 순차 검토 후속 — 사용자 정상 확인

해당 항목 안내 후 사용자가 “정상”이라고 확인해 무기 선택 버튼 정렬 항목을 해결·종료한다. 직전 두 현행 QSP의 가운데 정렬 규칙 존재·왕복 보존을 확인했으며 게임 파일은 추가 변경하지 않았다.
