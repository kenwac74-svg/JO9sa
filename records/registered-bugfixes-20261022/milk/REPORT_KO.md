# 우유 협동조합 가격판 겹침 CSS 조각 검증 — 2026-10-22

상태: 검토 조각 작성 및 격리 브라우저 전후 검증 완료. 저장소/Work 파일 미적용.

- 패치 ID: MILK_COOPERATIVE_SIGN_OVERLAP_20261022
- 적용 조각: css-patch.json의 old→new 정확한 단일 치환. milk-sign.diff도 같은 변경을 표시한다.
- 적용 대상: G:/somi/JO9sa/assets/css-2.4/base.css 및 G:/somi/Jack O Nine Tails v2.4_work/game/css/base.css. 두 현재 파일은 동일하다.
- 수정: #milk_sign_board left 33→425, #milk_sign_writing left 35→427. 두 요소를 똑같이 오른쪽 392px 이동한다. 기존 두 선언 주변에 JO9 MOD START/END 식별 주석을 둔다.
- 원인/호출: shop_general 247~250행이 우유 협동조합에서만 이 두 ID를 출력한다. 공용 $menu의 jo9_scene_menu는 x36/y64에서 첫 열을 시작하고 spacer를 숨긴다. 기존 가격판 x33/y0이 메뉴와 충돌한다.
- 배치·글꼴·표현은 CSS에 둔다는 docs/CSS_2_4_POLICY_20261015.md 기준을 따른다. QSP에 배치 CSS를 추가하지 않는다.

검증 결과:

- Headless Edge 1280×800 UI 중 795×595 장면 영역으로 계산. 현재 QSP의 $menu layout_style, milk_cooperative 메뉴 문구/조건, menu_icon.json 항목, 현재 CSS 전체, 현재 폰트와 원본 래스터를 읽어 격리 HTML을 재구성했다.
- milk_can 0/1 × milk_license 0/1 × milk_stock 0/1/4/5/6 = 20개 상태. 수정 전 20/20 FAIL: 첫째·둘째 행과 가격판 요소가 겹친다. 수정 후 20/20 PASS: 가격판/숫자와 어느 행도 겹치지 않고 장면 영역 안에 들어온다.
- 최대 7행 메뉴: 첫 행 x36/y64/330×62, 마지막 행 y436~498. 메뉴 전체를 내리지 않는다. 모든 상태에서 li와 링크 좌표를 전후 대조하여 동일함을 확인했다.
- 수정 후 가격판 CSS 상자 x425~775/y0~143. 실제 그림 x425~625/y0~133. 숫자 CSS 상자는 x427/y90이며 기존 글꼴/크기를 유지한다.
- 우유통은 기존 우측 HUD에 있다: 실제 그림 x1125~1210/y640~772(85×132); 재고 x1183/y697. 우유통/재고 좌표는 전후 동일하고 가격판과 겹치지 않으며 1280×800 안에 있다. 795×595는 장면 영역이므로 기존 우유통을 억지로 이 안으로 이동시키지 않는다.
- 전후 PNG를 직접 열어 원래 그림이 메뉴를 가리는 상태와 수정 후 메뉴가 모두 노출되는 상태를 확인했다. before.png/after.png는 최대 7행, 우유통 미보유 상태다. 우유통 보유 상태는 geometry JSON에 포함한다.
- CSS 고정 문구 검사 PASS. QSP/이미지/콜백/메뉴 조건/문구/가격/재고/세이브 및 기타 상태는 수정하지 않았다. QSP 구문 변경이 없으므로 이번 CSS 조각을 이유로 QSP를 재작성하지 않았다.
- 이 검사는 격리 HTML의 브라우저 배치 검사다. 네이티브 FastQSP 엔진 실행이나 실제 게임 화면 검증 결과로 표현하지 않는다.

적용/재현:

1. css-patch.json의 대상 파일 before 해시를 확인한다.
2. 각 대상에서 old 블록이 정확히 1회 존재하는지 확인하고 new로 치환한다. 그 외 바이트는 유지한다.
3. after 해시를 확인한다. 두 대상은 동일한 after 해시여야 한다. CSS manifest 갱신은 통합 적용 담당이 한다.
4. 적용 전 재현: node verify-milk-layout.cjs before (예상 실패). 후보 재현: node verify-milk-layout.cjs after (현재 unpatched Work CSS에 조각을 메모리에서 적용, 예상 통과).
5. 실제 적용 후 재검사: node verify-milk-layout.cjs installed "G:/somi/Jack O Nine Tails v2.4_work/game/css/base.css" (예상 통과).

입력/출력과 의존성:

- 입력은 두 ID를 포함하는 현재 CSS와 shop_general이 출력한 동일 ID의 HTML이다. 반환값·호출 상태 변경은 없다. 결과는 가격판과 숫자의 시각적 위치 이동뿐이다.
- 관련 의존성은 shop_general의 우유 협동조합 분기, 공용 메뉴의 현재 x36/y64 배치, 200×133 원본 그림이다. 래스터 경로를 교체하지 않는다.
- 두 선택자는 함께 이동해야 한다. 한쪽 선언만 제거·복구하면 그림과 가격 숫자가 분리된다. 두 left 값을 함께 복구하면 기존 메뉴 겹침이 다시 발생한다.

해시:

- 두 CSS before: 4b34d5f30002b01ea161535891131465b986dd3454428634141ad45fd9e60276
- 두 CSS after: c979bb955d99a13007a4dd17dbabc4a6873f9d132ad8ff77003d08ccc3bf2a76
- Work QSP(미변경): c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d
- 가격판 PNG(미변경): a31bed50f18e94a1daa5c7fb23cb70ea057cc0866ea068643557194dd12d4ae6

임시자료 정리: 재생성 가능한 후보 CSS 2개, HTML 2개, 브라우저 stderr 및 Edge 임시 프로필을 제거한다. 조각 JSON·재현 스크립트·diff·전후 배치 JSON·전후 PNG·이 보고서만 남긴다. live Work, Kor_Full, 저장소, ZIP, 커밋/푸시는 건드리지 않았다.
