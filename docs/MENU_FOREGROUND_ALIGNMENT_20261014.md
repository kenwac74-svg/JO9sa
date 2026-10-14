# 선택 메뉴 캐릭터 하단 정렬 — 2026-10-14

대상: `G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp`. 이전 풀팩이 G 루트에서 G:/somi 아래로 이동한 것이 확인됐고, 적용 전 해시는 지난 초기 화면 테두리 수정의 결과와 같다. 예전 작업용 G:/somi/JO9 및 보호 순정은 변경하지 않았다.

증상: 밀수업자 소굴의 이사벨라 선택 화면에서 캐릭터 하단이 지문 영역을 침범함. 전투 뒤 두 번째 선택 화면에도 같은 foreground 구조가 사용된다.

원인: #options가 $text_display에 넣은 center_Isabella 그림은 shop_general의 jo9_scene_menu 안에 출력된다. 메뉴 래퍼는 left:36px/top:64px로 이동하지만 캐릭터도 그 메뉴를 좌표 기준으로 삼아 함께 이동한다. 이전 사냥 전리품 분리 코드는 61120/61121과 sp_txt=1만 처리해 다른 선택창에는 적용되지 않는다. 캐릭터 이미지를 원본 픽셀 크기로 표시하므로 다른 규격에서는 컨테이너를 넘어갈 수도 있다.

수정: shop_general에서 실제 $text_display의 center_Isabella HTML을 찾아 메뉴에서 제거하고 bg의 자식으로 별도 출력한다. 캐시에서 복원된 메뉴도 같은 출력 경로로 처리하며 닫는 div가 없으면 원문을 건드리지 않는다. 기존 사냥 전용 처리는 유지해 중복 분리를 피한다. bg는 기존 left:4px/top:3px/795×595 기준이다. foreground 그림은 하단 0, 가로 중앙, 최대 795×595, width/height auto로 비율을 유지한다. 해당 foreground는 pointer-events:none으로 선택 메뉴 클릭을 가로막지 않는다.

패치: mods/2026-10-14_menu_foreground_canvas_alignment.json. 게임 진행 조건·대사·금액·메뉴 위치·이미지 전환 레지스트리는 변경하지 않았다. CSS 파일은 수정하지 않고 해당 화면에 한정한 CSS를 출력한다.

검증: 수정 전 일반 foreground 분리 검사 실패 → 후보 및 실제 적용본 검사 통과. 공식 apply_mods 복사본 결과가 후보와 동일하고 재적용은 무쓰기. 실제 적용본도 후보와 바이트 동일. 왕복 통과, 248 locations 유지, shop_general 본문 외 모든 레코드 불변.

- 적용 전: `90506109d2afb3110f4db6cdc7a97f5acdd420f9291696f12dbfc761c013fcd2`
- 적용 후: `06d34458f0d40745adbd5ed05b2c94bf72bad1dbdf8a6077d15b41346ef96430`
- 백업: `G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp.bak_20261014_235849`

사용자 플레이 확인 대기. 게임을 완전히 종료·재실행한 뒤 확인한다.

- [ ] 이사벨라 선택창: 그림 하단이 배경 끝에 맞고 지문을 덮지 않음. 선택 메뉴 클릭 정상.
- [ ] 전투 종료 첫 화면 → 두 번째 선택창: 캐릭터 하단 유지, 선택 후 진행 정상.
- [ ] 같은 선택창에서 저장/로드 또는 재방문: 캐릭터 중복 없음, 하단 정렬 유지.
- [ ] 다른 키·규격의 캐릭터 및 추가 컷: 비율 유지, 배경 영역 밖으로 넘치지 않음.

이미지 파일 자체의 투명 여백은 제거하지 않는다. 그림 안에 하단 투명 여백이 있으면 보이는 신체와 캔버스 끝이 다른 것은 별도로 점검한다. 다른 center_image_home 등의 개인실 배치에는 이 규칙을 적용하지 않는다.

검사 실행: `node tests/test_menu_foreground_canvas.cjs "게임경로/game/jack.qsp"`. 배포 ZIP 재빌드는 이번 작업에 포함하지 않았다.
