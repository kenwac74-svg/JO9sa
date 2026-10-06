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
