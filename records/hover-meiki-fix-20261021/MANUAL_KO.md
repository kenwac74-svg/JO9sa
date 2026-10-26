# 장비 툴팁·개인실 명기 판정 수리

2026-10-21 사용자 요청에 따라 Work에 적용했다. 아래 통합 결과가 하위 구성요소 메모의 ‘실제 게임 미적용’ 시점보다 최신이다. Full·기존 ZIP·CSS·JSON은 그대로이며 커밋·푸시는 보류한다.

- 적용 전: 1e911ced3798826e8cd1f35ed1e4115e9fd6450a9fdecaeb231b5f6885c1abb4
- 적용 후: 498e7fcaa2c116e382ab73ffe38549762297cce945247c2b8ad27509ba874fe0
- 262 locations 유지, 본문 세 곳만 변경. 모든 다른 QSP 필드 바이트 동일.

## 장비 목록

패치 EQUIPMENT_TOOLTIP_RESTORE_20261021. #dynamic의 주인공·노예·조수 선택 목록에 현재 $item_description의 설명을 연결했다. 실제 고정 장비 링크176개와 공통 비전투 helper1개다. 제거 선택12개와 비활성 주석은 그대로다. 옛379/380은 주석 예시를 포함한 발생 수여서 현재 실행 링크 수로 쓰지 않는다. 기존 조건·EXEC href·착용·수량·아우라 표시·설명 데이터·CSS는 보존했다.

새 캐시 스크립트 $jo9_equipment_tooltip은 장비 키를 입력받고 안전한 HTML 속성용 설명 문자열을 $result로 반환한다. br/개행은 공백으로, 나머지 HTML 태그는 제거하고 앰퍼샌드·따옴표·꺾쇠를 이스케이프한다. 두 임시 문자열은 반환 때 killvar로 제거한다. 기존 소스와 임시 이름 충돌은 없다. 기존 인코딩된 HTML entity는 역변환하지 않으며 현 설명에서 그런 사례는 없었다. 지원하지 않는 LOCAL/$chr를 사용한 중간 시도는 최종본에서 제거했다. 실패 기록은 equipment/RESULT.json에 남겼다.

이 캐시 스크립트 문자열은 다른 동적 정의처럼 저장에 포함될 수 있다. 새 인물 상태 키나 저장 마이그레이션은 없다. 기존 $newloc의 jo9_meiki_revision을214348873에서214348874로 높여 #static_base/#dynamic을 기존 경로에서 한 번 다시 정의한다. 평상시 저장 로드는 $ongload → saved_game_loaded → $newloc → $addon.update.full → refresh_database를 통해 #item_base/#боевые_предметы의 최신 설명도 읽는다. 별도 인물 초기화는 추가하지 않았다.

필수 의존성은 #dynamic, 각 장비 목록·$get_non_combat_equipment, $item_description, 기존 $strfind/$replace/$dyneval, css/base.css의 tooltip-left/[tooltip-data] 규칙이다. formatter만 빼면 링크의 참조가 깨진다. 되돌릴 때는 해당 속성·formatter·캐시 갱신 패치를 함께 역적용해야 한다. 주석 경계는 EQUIPMENT_TOOLTIP_TEXT_20261021 및 EQUIPMENT_TOOLTIP_SAVE_CACHE_20261021이다.

## 개인실 명기 판정

패치 MEIKI_ROOM_ROLE_ROUTING_20261021. jo9_meiki_willing에 room1~4의 기존 역할과 동일한 분기만 추가했다. 입력은 역할명과 발견 조건 인수, 반환은 숫자0/1이다. actor state=slave_exist 검사와 인수1일 때의 기존 발견 이력 조건을 그대로 복사했다. helper는 인물이나 난수를 변경하지 않는다.

호출자는 직접 개인실 interaction1027~1030 및 next_day의 기존 전환 템플릿이다. 교육처럼 snk_room_bridge가 대상을 slave로 옮기는 경로도 보존했다. jo9_meiki_state·jo9_meiki_checks·전환 호출·교육 브리지·확률은 전혀 고치지 않았다. 조건을 만족하는 첫 전환 때5%로 한 번 판정한다. 이미 소비한 기회·기존 발견 이력·복원 상태는 초기화하거나 소급 추첨하지 않는다. 새 네 역할 분기를 제거하면 직접 방 경로가 다시0을 반환하는 누락이 재발한다. 자세한 입력·의존성과 실제 호출 위치는 meiki/MANUAL_KO.txt와 source-map.json에 있다.

## 검사와 한계

문법 관련 검사는 QSP 컨테이너 왕복·중복 이름·줄 경계·주석 경계·정확 패치 재생/멱등성과 실제 설치 FastQSP에서의 실행으로 수행했다. 정식 정적 컴파일러로 모든 동적 분기를 증명한 것은 아니다. 사용자 재확정에 따라 이 검사들을 매 수정마다 생략하지 않는다.

최종 통합본은 장비4경로·개인실5경로, 출고 기본9경로 모두 PASS. 검사기/인물 편집기 회귀103통과·0실패·1건 의도된 과거 차이 검사 생략이다. 개인실 세부 시험1094사례는 실제 코드의 여섯 난수 표현만 진단 복사본에서 고정값으로 바꿔 경계1~6·반복·기존 이력·브리지 복귀를 검증했다. 임의 PRNG 분포 추정이나 전체 게임 검사가 아니다. 브리지의 무관한 문구 갱신은 진단에서 빈 함수로 두었다.

기존 저장은 대표 상태 구성에만 사용했다. 실제 세이브 선택 UI·CRC·실제 마우스 오버 배치·전체 플레이는 미검증이다. 테스트한 후보와 최종 Work 파일의 SHA가 일치한다. 실행 중 게임은 파일을 메모리에 읽으므로 완전히 종료한 뒤 다시 실행해야 수정된 QSP를 읽는다.

## 복구·재현·임시자료

최소 원본은 G:/somi/JO9_work_backups/hover-meiki-fix-20261021/baseline-1e911ced.qsp.zip에 있고 항목의 원본 SHA를 검증했다. 원본 세이브·원본 자료는 삭제하지 않았다. 진단 QSP·복제 JSON·시험 사본은 검증 후 정리한다.

재현은 보관된 두 mods JSON을 선택 폴더로 복사해 해시가 같은 기준 QSP에 tools/apply_mods.ps1로 적용한다. equipment/build-tests.cjs는 입력QSP와 G 임시 출력 폴더를, meiki/native-tests.cjs는 입력QSP·지정 임시 출력 폴더·검사 목록을 받는다. 생성된 plan.json은 tools/qa/run-client-smoke.ps1로 실행한다. 전체 출고 명령은 docs/QSP_RELEASE_VALIDATION.md를 따르며 Work만 검사할 때 --mirror는 생략한다. 생성된 진단 QSP/JSON을 저장소나 배포에 넣지 않는다.
