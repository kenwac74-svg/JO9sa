# tools/imgmg — 이미지 통합 작업 폴더(G:\somi\IMGMG) 도구

IMGMG는 용량 때문에 git 밖에서 사용자가 관리한다. 이 폴더는 그 도구의 공유본이며, 실제 실행본은 `G:\somi\IMGMG\_tools\`에 있다(고치면 양쪽을 맞춘다).
여기서 실행할 때는 `-Root G:\somi\IMGMG`를 준다. 모든 스크립트는 UTF-8 BOM으로 저장해야 Windows PowerShell 5.1이 한국어를 읽는다.

| 스크립트 | 하는 일 |
|---|---|
| `make_catalog.ps1` | 머지본 × 원본 작업 체크리스트 카탈로그(`catalog_merge_vs_original.hta/.html`). 상태는 `catalog_status.js`에 따로 저장돼 다시 만들어도 유지 |
| `make_catalog_editor.ps1` | 게임의 `modtools\place\JO9_Place_Workshop.html`(이미지 교체기)을 `catalog_editor.js`로 묶어 체크리스트에 넣는다(카드의 🖼 교체, Edge·Chrome 전용). 교체기를 새로 받으면 다시 실행 |
| `sync_snkmod.ps1` | 게임 폴더 SNKmod → `UIpatch`, `merge_work` 동기화(기본 보고, `-Apply` 적용, 덮어쓰기 전 `_backup` 보관, 대상에만 있는 파일은 지우지 않음) |
| `make_imagepack.ps1 -Version N` | 이미지 교체 팩 ZIP + 첨부 카탈로그 + 웹 게시용 카탈로그(`imagepack\`) |
| `make_scene_sample.ps1` | 새 장면 리소스 × 올걸팩 계열별 대표 샘플 비교 카탈로그(loli 표기 계열 제외) |
| `make_replacement_preview.ps1` | 원본 자리 대체 이미지 설명 페이지 |

결정과 규칙은 `docs/session-handoffs/2026-10-04/homecom-2026-10-04.md`.

체크리스트 상단의 **PIC 폴더 등록**은 `catalog_pic.js`가 관리한다. 하위 폴더 전체의 PNG 경로를 읽어 한 개의 폴더 연결과 함께 기억하고, 교체기는 `window.JO9PIC`의 연결과 목록을 그대로 사용한다. 브라우저 저장소가 멈추거나 저장을 거부해도 현재 창의 등록을 완료한다. 새 파일을 추가했으면 **전체 다시 읽기**, 다른 폴더를 연결하려면 **폴더 다시 선택**을 사용한다. `catalog_pic.js`도 `_tools`와 카탈로그 폴더에 같이 배치한다.

공유 연결 검사는 `tests/catalog-pic.test.cjs`에 있다. 생성한 `catalog_editor.js` 경로, 카탈로그 HTML 경로, 시나리오(`hang`, `blocked`, `cached`, `denied`, `bad-folder`)를 순서대로 전달한다. 실제 브라우저의 폴더 선택·권한 승인과 게임 이미지 교체 확인은 사용자가 한다.

## 미체크 폴더 보기 (2026-10-11)

미체크 전용 보기의 **미체크 폴더** 선택 메뉴에서 폴더별 미체크 개수를 확인하고 범위를 선택한다. 왼쪽 폴더 선택과 동기화하며, **하위 폴더 포함**을 끄면 선택한 폴더의 파일만 표시한다. **전체 폴더**는 하위 폴더 체크 상태와 관계없이 모든 미체크 파일을 표시한다. 일반 보기로 돌아가면 진입 전 필터·하위 폴더 설정·페이지를 복원한다.

`catalog-review-module.js`는 `catalog_workshop.js`의 동일 표식 구간과 함께 갱신한다. 실행본 `G:\somi\IMGMG\catalog_workshop.js` 및 재생성용 `_tools/catalog_workshop.js`에도 적용한다. 카탈로그 전체 재생성·작업번호 변경·이미지 이동은 하지 않는다. 회귀 검사: `node tools/imgmg/test-review.cjs`.

## 구버전 1.2.1 제외 (2026-10-11)

사용자 지시에 따라 `make_catalog.ps1`의 플레이/원본 이미지 인덱스에서 파일명에 `1.2.1`이 포함된 이미지는 제외한다. 이동된 구버전 파일을 순정 측 비교 목록에서 되살리지 않는다. 현재 catalog/seed의 114개 행 제거와 가상 B컷 해제 기록은 `docs/LEGACY_1_2_1_IMAGES_ARCHIVE_20261011.md`를 참조한다. 체크 상태·작업 ID ledger는 보존한다.

## SNKmod 정규 경로 이전 (2026-10-11)

SNKmod는 폐기했다. 신규 자원은 bg/characters/scene/master/ui/buttons 등 실제 용도별 정규 폴더를 사용한다. sync_snkmod.ps1은 퇴역 안내만 하고 -Apply는 거부한다. make_catalog.ps1은 순정의 옛 SNKmod도 목록에서 제외하되 원본 파일은 보존한다. 기존 ID와 확인 상태의 대응은 catalog_path_aliases.json, 상세 기록은 docs/SNKMOD_RELOCATION_20261011.md에 있다.
