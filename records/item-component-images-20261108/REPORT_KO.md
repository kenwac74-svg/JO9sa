# 두 의상 부품 이미지 연결 — 2026-11-08

`underwear_nun`(수녀 드레스)와 `slut_dress`(창녀 드레스)의 설명 그림을 각각 기존 `scene/item/underwear_nun.png`, `scene/item/slut_dress.png`에 연결했다. 기존 PNG 파일은 변경하지 않았다.

## 구현과 호출

- 패치: `mods/2026-11-08_item_component_images.json`; `#item_base`의 기존 `$ib_cycle` 호출 두 곳만 수정했다.
- `$ib_cycle`은 ID·이름·가격·설명·이미지 경로를 받아 기존 `$item_name`, `item_price`, `$item_description`, `$item_demo`에 저장한다.
- 기존 렌더러 `$show_item_description_and_image`는 설명이 비면 이미지도 숨긴다. 두 항목의 기존 아이템명을 그대로 설명에 넣고, 가격은 기존 기본값 0을 명시했다. 아이템 효과·속성 및 공통 렌더러 코드는 바꾸지 않았다.
- 변경 블록 표시는 `ITEM_COMPONENT_IMAGES_20261108_NUN`과 `ITEM_COMPONENT_IMAGES_20261108_DRESS`다.
- 입력은 해당 아이템 ID, 출력은 기존 정보창의 그림과 이름 설명이다. 새로운 함수·상태 변수·저장 형식은 추가하지 않았다.
- 기존 세이브는 불러온 후 첫 정상 화면 이동에서 `$ongload` → `$newloc` → `$addon update full` → `refresh_database`를 통해 정의가 갱신된다. 별도 전용 캐시 보정은 추가하지 않았다.
- 연결을 제거하면 두 아이템의 `$item_demo`와 설명이 다시 빈 기본값이 되어 기존 정보창의 그림이 사라진다. 착용 효과는 이번 연결과 별개다.

## 확인

- 수정 전 격리 QSP의 실제 FastQSP 실행에서 `JO9_QA_MISSING_underwear_nun`을 확인했다.
- 후보에서는 기존 값을 STALE로 넣은 뒤 `#item_base`, `#dynamic`을 실행했다. 두 이미지 경로와 설명, 기존 이름·가격, 실제 정보창 HTML의 PNG 주소를 검사하고 완료 마커를 받았다.
- 파일 왕복·줄 경계·주석 경계·패치 재생·재적용 멱등성 및 현재 WORK의 예상 해시 일치를 확인했다.
- 체크리스트를 새 QSP 기준으로 갱신했다. 두 항목은 direct로 연결되고 실행 연결 미확인은 130개에서 128개로 줄었다. 체크 상태는 보존했다.
- 일반 EXE의 실제 그림 배치는 사용자 확인 대기다. 전체 출고 검사는 이번 두 항목 연결 작업에서 실행하지 않았다.

## 일반 EXE 확인 경로

기존 세이브를 불러온 뒤 정상 화면을 한 번 이동한다. 노예 정보 → 장비/복장 화면에서 소유한 수녀 드레스와 창녀 드레스를 각각 착용하고 정보 영역의 그림을 확인한다. 후보 링크의 마우스 툴팁은 텍스트 전용이므로 그림 확인 위치와 다르다.

## 보존과 인계

- 적용 전: `d4a403b3490f13da7ad4e73e279f8aa138094fcee436e28e902bab30f5676452`
- 현재 WORK: `b6d7f9183231e307e9e40fa92bd191c960b7f24ec22035f5c1ae9d568d21d0a7`
- 적용 전 QSP 백업: `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261108_023456`
- 다음 누적 패치에는 이 mods 기록과 두 PNG 경로를 포함한다. 배포 ZIP·Kor_Full·커밋·푸시는 이번 작업에서 수행하지 않았다.
