# 전투 포트레이트 컬러 연결 — 2026-10-24

WORK에 반영했다. 원인은 전투용 $combatant_ava에 세피아 ava를 대입한 것이며, 컬러 ava_clear로 네 대입문만 변경했다. 이사벨라2571 JSON은 seed_ava가2571_face_sepia, seed_ava_clear가2571_face이며 두 파일 모두 존재한다.

## 입력·결과와 호출

일반 시작 начать_бой의 combatant=1은 $slave['ava_clear'], combatant=2는 $assistant['ava_clear']를 읽는다. 별도 $gladiator_fight_start와 $catfight_fight_start는 $slave['ava_clear']를 읽는다. 출력은 기존 $combatant_ava 문자열(.png 확장자 포함) 한 개이며, боевой_интерфейс와 конец_боя가 그대로 소비한다. 주인공 $master_ava, 상대 이미지, 비전투 ava 및 상태·수치·전투 판정은 그대로다. 새 변수·location·호출·세이브 변환·외부 의존성은 없다.

## 유지·복구

mods/2026-10-24_combat_color_portraits.json이 원문·변경문·해시를 보관한다. 표시 주석 COMBAT_COLOR_GENERAL_SLAVE/GENERAL_ASSISTANT/ARENA_SLAVE/CATFIGHT_SLAVE로 찾는다. 네 대입문은 독립적이며 하나를 되돌리면 해당 시작 경로만 세피아로 돌아간다. before.qsp.gz는 이번 작업 직전 원본의 단일 압축 복구본으로 해제 바이트 일치를 확인했다. 실행 중 게임은 이미 읽은 QSP를 사용하므로 게임 재실행이 필요하다. 이미 시작한 전투를 저장한 파일의 $combatant_ava는 유지하며 다음 전투부터 컬러를 선택한다. 기존 세이브를 수정하지 않았다.

## 검증과 한계

수정 전 네 인물 대입 경로는 실제 FastQSP에서 WRONG_PATH로 실패했고 주인공만 통과했다. 수정 후 네 대입과 주인공 총5사례가 실제 전투·결과 화면의 포트레이트 출력문 두 개를 실행하여 컬러 경로 출력 및 세피아 경로 미출력, 비전투 ava 불변을 통과했다. 이 집중 검사는 원래 대입/출력문을 추출하여 실행하므로 모든 전투 시작·승패를 플레이한 검사는 아니다. 공식 출고 검사9경로, 구조266locations·왕복·CRLF/주석 경계·인물 JSON 등록·정확 패치 재생/재적용 PASS. 관련 검사기 회귀27건 PASS. 독립 diff 검토 PASS. 실제 GUI 시각/전수 전투 플레이·GUI 세이브 로드는 별도 미검증이다.

WORK 이외 Full·배포 ZIP·CSS·JSON·이미지·세이브 변경 없음. 커밋·푸시 없음.
