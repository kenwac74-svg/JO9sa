# 이미지 교체기 선택 일괄 테두리 — 2026-11-11

사용자 요청: 포트레이트/썸네일의 원본 테두리 보존을 복구하고, 선택한 이미지의 테두리를 만드는 버튼은 상단에 하나만 둔다. WORK와 추적 소스에 반영했다. 운영 PNG·캐릭터 JSON·QSP·세이브·체크 상태·음원·Full·커밋·푸시는 변경하지 않았다.

## 사용법

이미지 교체기를 새로 열거나 새로고침하면 ‘규격 맞추기’ 옆에 **선택 이미지 테두리 만들기** 버튼 하나가 나타난다. 현재 사용자가 열어 둔8891 창에는 witch.png 입력이 있어 그 창을 다시 로드하지 않았다. 새로고침하면 브라우저의 투입 파일은 다시 넣어야 한다.

- 새 이미지를 넣었으면 교체 대상을 지정하고 ‘이 파일 교체’를 체크한 항목에만 생성한다. 기존 얼굴 영역·구도 설정을 사용하며 필요하면 기존 비교창에서 얼굴 영역을 먼저 지정한다.
- 새 입력이 없으면 상단에서 선택한 기존 PNG를 스냅샷으로 가져와 테두리만 생성한다. 다른 동명 베리에이션은 자동으로 포함하지 않는다.
- 결과 미리보기를 확인한 뒤 기존 **백업 후 교체** 또는 ZIP 저장을 사용한다. 테두리 버튼 자체는 게임 파일을 쓰지 않는다. 저장은 기존 해시 검사·백업·복구 흐름을 그대로 사용한다.
- 지원은59×66 썸네일,150×150/151×150 초상이다. 미선택·배경/전신 등 규격외는 제외하고 생성/제외/실패 수를 안내한다. 개별 카드에 테두리 버튼을 추가하지 않았다.

기존 ‘구도·비교’의 **원본 테두리 보존** 체크도 유지한다. 보통의 교체에서는 원본 테두리를 사용할 수 있고, 일괄 생성 버튼은 게임 템플릿의 새 테두리를 만든다. 원본 보존 체크를 직접 바꾸면 생성 모드를 해제하여 기존 보존/해제 방식으로 돌아간다.

## 원인과 구현

기존 frameBox는59×66의 `ui overhaul/`,150×150의 일부 초상 경로만 인식했다. 현재 `ui/legacy_overhaul/`와151×150은 지원에서 빠져 보존 체크가 비활성화됐다. 실제 보존 합성 코드는 남아 있었다.

원천은 `tools/image-workshop/place/JO9_Place_Workshop.html`이다. `C.frameSpec`은 세 규격의 내부 영역을 판정하고 `frameBox`는 원본 bytes가 있을 때 이를 보존에 쓴다.59×66의 내부는(5,8,49,51),둥근모서리3이며150/151 초상은 외곽5px이다. 현재/구형 UI 경로의 icon 분류를 맞췄고 standalone PIC 등록도 두 폴더 배치를 허용한다.

`C.raster`의 `makeFrame` 옵션은 기존 `button_template.png`와 `mob template.png`의 외곽만 합성한다. 템플릿을 inline으로 포함해 파일 선택·네트워크·외부 이미지 생성 서비스가 필요 없다. `frameOnly`는 기존 PNG의 크기·중앙 RGBA를 유지하고 crop/zoom/색상변환으로 중앙을 재가공하지 않는다. 생성 테두리는 회색·세피아를 지원한다. 썸네일 모서리 투명도를 보존하며 encoder에 보호 mask를 전달해 최적화가 테두리 색을 바꾸지 않게 한다. 원본 meta.bytes는 변경하지 않는다.

`makeSelectedFrames`는 선택된 지원 행만 재변환한다. 기존 이미지만 선택했으면 `stageFrameOnlyTargets`가 실제 PNG를 스냅샷으로 읽어 정확한 경로의 작업 행을 만든다. 원본 읽기와 대상 재조회 사이에 해시가 달라지면 행을 무효화한다. 작업 중 오류가 나도 busy를 해제하고 실패를 표시한다. 일반 교체와 저장은 기존 구현을 재사용한다. 다른 crop/색상/베리에이션 선택 기능을 유지한다.

카탈로그 생성기는 `tools/imgmg/make_catalog_editor.ps1`이다. 생성물에만 남아 있던 기존11/8 ‘새 경로 추가’의 모듈과 주변 연결10곳을 원천 main 스크립트로 이관했다. 생성 시 해당 기능이 빠지지 않도록 했으며 CSS는 변경하지 않았다. standalone과 카탈로그 모두의 dialog 부모를 허용했다.

## 반영 위치와 제거 영향

- 원천 HTML과 WORK `game/modtools/place/JO9_Place_Workshop.html` 일치.
- 생성한 JS를 source `tools/local-workspace/catalog-seed/catalog_editor.js`와 WORK `game/modtools/catalog/catalog_editor.js`에 동일 배치.
- `tools/imgmg/workshop-new-path.js`는 기존 모듈의 dialog 부모 한 줄만 standalone 겸용으로 보완.
- source 원장에는 작업 보고서 포인터와 해당 파일 해시만 갱신. QSP 기준 해시는 유지.

단독8891은 새 HTML을, 체크리스트3813은 `/catalog_editor.js` 지연 로딩 자산을 제공함을 HTTP로 확인했다. 서버 재시작은 필요 없었다. 별도의 새 임시 IAB 탭에서도 설치된 버튼 하나를 읽기 전용 확인했다. 사용자 기존 탭의 선택·투입 파일은 건드리지 않았다.

기능을 제거할 때는 원천의 frameSpec/raster 기능과 batch UI/이벤트 연결을 함께 판단한 뒤 생성기를 다시 실행해야 한다. 생성물만 편집하면 다음 재생성 때 변경이 사라진다. 이미 저장한 테두리 PNG의 복구는 이 도구 코드 롤백이 아니라 기존 PIC 백업/복구로 한다.

## 검증과 한계

관련18검사 통과: 현재 경로/151규격, 선택/미선택·규격외·실패 복구, 기존 원본 전용 처리와 재조회 중 변경 거부, 실물 Edge canvas 중앙픽셀/외곽/원본 bytes/투명도/회색·세피아/기존 보존, 새 경로9개 및 구도2개 회귀다. 변경 전 경로 미지원 실패와 스냅샷 경쟁 조건 실패를 각각 확인했다.

실물 브라우저에서 standalone과 생성된 catalog 양쪽을 검사했다. 버튼1개·카드별 추가 버튼0, 선택 행만 실제 PNG 출력 생성, 기존 원본만으로 작업 행 생성, 저장 전 쓰기0, 새 경로 option 유지, 페이지 오류0을 확인했다. 이 검사는 합성 색상 PNG와 메모리 폴더를 사용했고 실제 사용자 그림은 저장하지 않았다. CSS/게임 EXE에서 최종 외형을 확인한 것과 구분한다.

신규 UI가 포함된 원천5개 스크립트 및 생성 JS 문법, source/WORK 두 쌍 해시, 운영 QSP·현재 선택 unfamiliar PNG·카탈로그 체크 상태의 보호 해시를 확인했다. 테스트 중 native Node fetch의 단독 PS 서버 응답 길이 오류가 한 번 발생했으나 curl과 실제 IAB에서 전체 최신 페이지 제공을 확인했다. 서버 코드 변경/재시작은 하지 않았다.

복구 자료는 `G:/somi/JO9_work_backups/workshop-batch-frame-20261111/`에 보존했다. 원천 HTML·이전 catalog_editor.js·새 경로 모듈·원장이 있다. 재현 스크립트·검사 로그·브라우저 결과/스크린샷은 이 records 폴더에 남겼다. 출력 스크린샷은 검사용 합성 이미지다.

재검사: `node --test workshop-batch-frame.test.cjs workshop-batch-frame-ui.test.cjs workshop-frame-pixels.test.cjs`와 `node workshop-frame-browser.cjs`. 추가 회귀는 원래 `tools/imgmg/workshop-new-path.test.cjs`, `tools/workshop-alignment.test.cjs`다. browser 스크립트는 원천으로 임시 catalog 생성본을 만들고 기존 설치 Edge/Pillow 없는 Canvas만 사용한다. 검증 후 작업별 G:/Codex/tmp 폴더를 정리했다.
