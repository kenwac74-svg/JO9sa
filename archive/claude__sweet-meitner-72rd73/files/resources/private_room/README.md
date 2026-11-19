# 개인실 UI 자산

사용자가 2026-09-27 제공하고 사용을 지시한 식단 버튼을 재그림 없이 축소했다.

- 원본: `F:/DOWNC/ChatGPT 이미지 2026년 9월 27일 오후 06_38_37.png`
- 원본 SHA-256: `12cc7525a3b07e220282c94ce2a7245935730d482c005fdd7ca4b0c347c856c2`
- 가공: Sharp Lanczos3, 32×32, PNG 압축 9. 승인된 접시·포크·스푼·금속 테두리 유지.

| 설치 경로 (game 기준) | 규격 | 용량 |
|---|---|---|
| `content/pic/SNKmod/buttons/room_diet.png` | 32×32 | 2,484 B |
| `content/pic/SNKmod/ui/private_room_notice.png` | 286×258, 투명 PNG | 35,297 B |

안내 이미지는 `build/private_room/assets.cjs`의 텍스트 원고로 재생성한다. 우하단 문구는 `개인실 추가 기능 개발 중 by SAnk`다. 기존 그림의 최대 용량을 키우는 방식으로 작업하지 않았으며 새 두 자산의 검사 상한은 각각 4KB / 100KB다.

`menu_item_snapshot.json`은 기존 `game/json/menu_item.json`의 메뉴 상수 사본이다. 빌드 시 원작 질문·교육·보상 메뉴의 하위 연결을 확인하는 데 쓰며 설치하지 않는다.

자산은 `--private-room` 빌드에서만 포함한다. 사용자가 승인한 TEST1 ZIP에 포함하며 기본 R3 빌드는 바꾸지 않는다. 원본 `game/content/pic`의 파일을 덮어쓰지 않는다.
