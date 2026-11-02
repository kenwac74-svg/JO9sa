# stage18과 종료 경로 읽기 확인

이 문서는 폐기한 sanitizer 세대의 실패 분석이다. 이후 원문 본문을 보존한 별도 접근의10사례/284조건 통과는 REPORT_KO.md와 unmodified-ten-results.json에 있다.

추가 엔진 실행 없이 최종 QSP 및 세 번의 합성 체크포인트를 읽었다. **최종 fixture에도 MSG 치환의 구조 손실이 있다. 따라서 최종 timeout 역시 제품의 실행 실패를 입증하지 못한다.**

## stage18 이후 실제 코드

진단 `interaction_result` 본문1~2행은 `qa_stage=18` 및 상대 경로 `savegame 'qa-progress.sav'`다. 이후 순서는 다음과 같다.

1. 원래 `interaction_result:12~214`: 최초 방문 플래그·타입 배열 초기화, 결과 보조 함수 정의. 정상 이 구간에는 GT·EXIT·반복 jump가 없다. 정의된 중괄호 본문은 이때 실행하지 않는다.
2. 원래 `216~240`: interaction_type으로 대상 역할 선택. 알려지지 않은 타입일 때238행에서 MSG가 있다. 이번 타입 `make_slave_do`는 주 노예 목록에 있다.
3. 원래 `244~247`: 수락·저항·성실도·공포 helper의 roster 순회. `250~253`: 보상/추가 처리 및 debug일 때252행 MSG. 완료하면 진단 stage19를 저장한다.
4. 원래 `642~704`: 공통 결과 함수 정의·호출. `646`에서 거절 여부를 나누며, 수락하면 `671`에서 special_part를 실행한다. `674~680`의 텍스트 평가 루프는 i와 배열 길이를 비교하고 jump로 되돌아간다. 정상 종료 후 나머지 상태 처리를 이어간다.
5. 원래 `1712~1729` 카운터·행동력 처리, `1795` 상호작용 임시값 reset, `1899~1907` 성향 종료 처리를 거쳐 **`1919: gt 'interaction_screen'`**으로 끝난다.

fixture는 마지막 화면을 `interaction_screen → gt 'Start'` QA 이어달리기로 바꿨다. Start도 실제 행동을 `gt 'interaction'`으로 시작한다. **GS로 UI 전환 location을 호출한 뒤 돌아오기를 기대한 구조는 아니다.** 최종 snapshot의 `actualResultReturns=0`은 fixture의 interaction_screen에 도달하지 못했다는 뜻이며, 화면에서 반환되지 않는 것이 버그라는 뜻이 아니다. 방 bridge는 원래 `gs room_sex` 내부가 `gt interaction`을 실행하는 구조이며, 뒤의 QA 실패문은 GT가 되지 않을 때만 잡도록 두었다.

위 목록은 이번에 선택한 make_*_do 경로다. 원래 결과 location에는 다른 상호작용 타입의 GT·별도 텍스트 루프가 있으나 이번 타입에서 실행되는 경로가 아니다. 공통 성공 함수 내659행의 MSG는 이번 성인/비특수 상태에서 조건이 거짓이다. 진단에서 MSG 문자열은 QA로 치환했다.

## 최종 fixture의 남은 MSG 치환 오류

원래252행의 debug 한 줄은 다음 구조다. 생략 부위는 수치 조회용 debug 문자열이다.

`if debug_interactions > 0: dynamic $replace({msg <수치 debug 문자열>}, 'dynslave', $interaction_partner)`

최종 진단본문240행은 다음처럼 끝난다.

`if debug_interactions > 0: dynamic $replace({msg 'QA_MESSAGE'`

MSG 문자열 치환 정규식이 줄 끝까지 지워 중괄호·replace 인수를 잃었다. debug=0이어도 이 소스 구조 손실은 fixture의 동등성을 깨므로 timeout을 제품 원인으로 해석할 수 없다. 조건·jump·label·end 토큰188개와 text 대입20개의 자동 비교는 inline 중괄호/따옴표 완결성을 검사하지 않아 이 오류를 놓쳤다. 추가 수정 fixture나 엔진 실행은 하지 않았다.

## 마지막 저장 관측값

| 항목 |2차(이전 필터, stage19)|최종(stage18)|
|---|---|---|
| 사례 |첫 주 노예5414|첫 주 노예5414|
| 타입/선택 파트너 |make_slave_do / slave|make_slave_do / 아직 빈 값|
| 주인공/bridge |hero13 / target0|hero13 / target0|
| 주 노예 상태 |id100, age2, fertility0|동일|
| pregnant / inseminated |0 /0|0 /0|
| cycle_day / ovulation |20 /1|20 /1|
| interaction_slave.res / diligence |10 /5|0 /0 (전처리 전 reset값)|
| repulse / sex_acceptance |4 /9|4 /0|
| 결과 helper 캐시 정의값 |0|0|

두 snapshot 모두 조수·room1~4는 age2/fertility0/pregnant0/inseminated0, cycle_day20/ovulation2다. 이는 그 역할의 성공/실패 관측이 아니라 아직 처리하지 않은 초기값이다. 합성 입력의 타입1435와 실제 string 파트너를 포함한 읽기 결과는 `runtime-checkpoints.json`에 보존했다.

기존 최소 단위 검사(`private-pregnancy-followup-20261028`)의62조건 및4방 bridge 왕복 PASS는 그대로다. 이번 전체 연결은 완료0이며 이 기존 결과의 경계를 넓혀 주지 못했다. 실제 사용자 SAV·GUI 클릭·저장 캐시는 계속 미검증이다.
