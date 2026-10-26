# 에게야 네 복장·한글 이름·초기 특성

WORK에만 반영했다. 원본 ZIP과 기존 세이브, Full, 초상화는 보존했다. 게임을 완전히 종료하고 다시 실행한 뒤 기존 세이브를 불러오면 새 이미지 등록과 이름 보정이 적용된다.

## 그림과 등록

사용자 egeya.zip의 네 PNG를 비율을 유지하여 795×596 RGBA 캔버스로 줄였다. 알몸·하녀·비서는 좌우14/15px 투명 여백을 두고 도미나는 캔버스에 맞는다. 원본을 자르거나 배경을 지우지 않았다. content/pic/girls/full/2579/2579_full_naked.png, 2579_full_maid.png, 2579_full_secr.png, 2579_full_dom.png를 추가했다. 얼굴은 기존 세 장을 사용한다.

json/slaves/2579_egeya.json의 seed_name을 에게야로 바꾸고 fullmade/fullsecretary/fullmistress와 indpack_title/naked/maid/secr/dom, indpack_info를 등록했다. fullimage의 기존 girls/full/egeya_blond_long은 이전 세이브의 정확한 별칭을 계속 인식하도록 유지한다. 실제 기본 그림은 indpack_title을 통해 새 알몸 그림을 읽는다. 기존 선택창은 fullmade 등의 유무를 보고, 실제 표시기는 indpack_*와 현재 image_mode를 사용한다.

## 생성·이름 호환

패치 2026-10-26_egeya_outfits_profile, EGEYA_PRESET_PROFILE_20261026: generate_stock의 마지막 파생값 갱신 전에 stock_type2579이며 creating_clone0일 때 건강체질 jo9_constitution1, 역전의 용사 jo9_combat_trait3과 한글 기본 이름을 설정한다. 복제와 다른 인물에는 이 부여를 적용하지 않는다.

두 기존 획득 분기는 arena_level9, 기존 명성 누적값과 장비를 그대로 둔다. 따라서 기존 칭호인 아레나 그랜드 챔피언을 유지하며 별도 칭호·상금·업적 플래그를 새로 만들지 않는다. 순위가 패배로 내려가면 칭호가 달라질 수 있는 기존 규칙도 유지한다.

EGEYA_DEFAULT_NAME_LOAD_20261026: ongload에서 기존 29개 역할의 type2579 이름이 Egeya/egeya/Egeaya/egeaya/Эгея와 정확히 같을 때만 에게야로 바꾼다. 사용자 지정 이름과 다른 인물, 기존 특성·순위·육성 상태는 변경하지 않는다. 이미 영입한 인물에 특성을 매 로드마다 다시 지급하지 않으므로 삭제·변경한 특성도 복원하지 않는다. NPC 이름은 현재 활성 npc_base에서 이미 에게야이며 새 번역을 덧붙일 필요가 없었다.

## 획득 이후 클럽

현재 획득 후속 이벤트는 egeya_lose1을 설정하고 city_menu_form은 클럽 입구를 비활성화한다. 다른 NPC로 교체되는 분기는 없다. 이번에는 이 흐름을 검사만 했고 NPC나 영업을 새로 만들지 않았다.

## 검증과 분리

문법·구조·줄바꿈·패치 재생/재적용 및 실제 설치 엔진 주요9경로 PASS. 별도 네이티브9검사에서 획득2분기, 이름203사례, 복제/다른ID2사례, 외형12조합, 입구2상태와 네 PNG의 실제 DOM 로딩·795×596 크기를 확인했다. 물리 마우스·전투 전 과정·GUI 세이브 Load/CRC 검사는 범위 밖이며 자세한 한계는 evidence/native-results.json에 있다.

새 QSP location·영구 키는 없다. 기존 trait helpers, jo9_seed_role_images/display_fullimage, all_slave_characters, 현재 JSON 등록과 네 PNG에 의존한다. 이미지들을 분리하려면 JSON 역할 등록도 함께 복구해야 한다. QSP 두 블록은 표시 이름·생성 특성만 담당하며 기존 획득/입구/이미지 선택 코드는 수정하지 않았다.

직전 QSP는 before.qsp.gz, 기존/새 JSON은 before/after 사본, 모든 변경은 patch.json과 assets-manifest.json에 보존한다. 정규화는 normalize-assets.py로 원본 ZIP 해시를 확인한 후 별도 출력 폴더에 재생성할 수 있다. 배포·ZIP 갱신·커밋·푸시는 하지 않았다.
