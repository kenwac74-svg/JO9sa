# 줄리아 재회 NPC 이미지 — 독립 코드 검토

검토 대상: `2026-10-28_julia_meeting_npc_images.json`.

- 기준 WORK: `3fbdb2cca0e3eb2d4a70c2f9b442f2fb39bb756f1aefe6217cf8c10668f1106c`
- 후보: `f0911bef8f53ef1464edc3d107beccaca3af90c7f0368a4b7df92f7a6082e1b2`
- 범위: 기존 `interaction_city`, `interaction_screen_city`, `$ongload`의 편집 7개. 새 location·helper·영구 상태 키 없음.

**검토 범위에서 actionable finding은 없다.**

## 새 장면과 기존 중간 저장

새로 만드는 이벤트163의 action3·15·18은 `julia`, action16·17은 `johanna`를 가리킨다. 15페이지는 주인공이 줄리아에게 짐을 챙기라고 말하는 장면이므로 줄리아를 유지하고, 16페이지부터 요한나로 전환한다. 그림은 현재 장면 NPC를 나타내며 주인공 화자 초상으로 바꾸는 수정이 아니다.

기존 저장의 보정은 renderer의 `_layout` 직후, 기존 special_action 실행 전에 위치한다. 이벤트163의 지정된 action5개에서 각각의 기존 alyce/kuma 대입문만 치환한다. 현재 NPC ID도 이전 두 ID 중 하나일 때만 페이지3–15·18은 줄리아, 16–17은 요한나로 고친다. 그 뒤 원래 special_action을 실행하므로 별도의 custom ID/action은 유지된다. action이 없는 4–14페이지에서 이미 저장된 잘못된 NPC ID도 교정 범위에 포함된다.

`$ongload`의 기존 처리 뒤에 현재 화면·이벤트163·페이지3–18·이전 NPC ID 조건이 모두 맞는 경우만 renderer 재표시를 추가한다. 이벤트 생성 분기163으로 되돌아가지 않으므로 줄리아 재생성·인물 교환을 실행하지 않는다. 현재 NPC ID가 이미 교정되었거나 custom ID이면 강제로 다시 그리지 않는다.

## 보존 범위

- 다른 이벤트의 alyce/kuma 참조와 전역 NPC 이미지 매핑은 바꾸지 않는다.
- 이벤트의 대사, 배경, NPC 표시 flag, show_slave_fullimage 및 인물 생성·획득 처리 본문은 유지한다.
- 현재 NPC ID의 페이지 조건 밖에서는 live ID를 덮어쓰지 않는다. 기존 action 실행 순서도 유지한다.
- 이미지 파일·경로, 실제 인물 배열, 획득 플래그 및 기존 세이브 파일을 수정하는 코드가 없다.

## 독립 확인과 한계

현재 WORK의 기준 해시, 각 old 문자열의 정확히1회 일치를 확인했다. 패치를 메모리에서 재생한 해시가 후보와 일치하며 QSP 바이트 왕복도 일치한다. 변경한 body 외 모든 encoded 필드는 원본과 동일하다. 역순 정확 역적용 후 전체 바이트가 현재 WORK와 일치하므로 다른 수동 편집을 덮어쓰지 않는다.

이번 검토는 후보의 정적 코드·실행 순서 검토다. 실제 엔진의 새 이벤트·중간 저장 로드·이미지 렌더링은 별도 native 검증 범위다. 제품 QSP·G:·기존 세이브를 쓰지 않았고 이 검토 문서만 저장했다.
