# 생략한 renderer의 후처리 경계 — 읽기 확인

추가 엔진 실행 없이 f652 원문과 원문 보존 probe/ten의 최종 합성 SAV를 읽었다.

원래 `interaction_screen:7~9`는 `$special_action[txt]`가 빈 값이 아닐 때 해당 동적 코드를 실행한다. 이 부분이 단순 그림 표시라고 전제하면 안 된다. 다만 이번10사례의 선택 코드에서는 이 배열을 설정하지 않는다.

- `interaction:31`은 매 행동 시작에 `$special_action`을 지운다.
- 5414/441이 사용하는 원래 `interaction:2092~2140`과 방1027~1030의 `8372~8554`에는 `$special_action` 대입이 없다.
- 해당 타입은 모두 `make_slave_do`/`make_assistant_do`/`make_roomN_do`다. 실행된 원래 공통 결과 분기 `interaction_result:642~704`에도 이 배열 대입이 없다.
- 원래 결과의1029~1096행에 있는 action 대입은 별도 `self_sex_lesson_special` 분기(`985`)에 속하므로 이번10사례에서 선택되지 않는다.
- 실제 호출한 공통 상태·특성 helper에는 이 배열을 설정하는 참조가 없다. 관련 문자열 갱신의 `#var_base` 참조는 배열을 지우는 코드다.

**probe 최종 SAV와 ten 최종 SAV 모두 SPECIAL_ACTION 변수 자체가 없고, 비어 있지 않은 action 항목0개다.** 두 경우 txt=1이다. 최종 SAV는 각각 주 노예5414와 방4 bridge 사례가 끝난 상태다. 각 중간 사례의 action 배열을 따로 누적 저장한 것은 아니며, 나머지 사례의 빈 값은 위의 원래 초기화·선택 분기·호출 경로로 확인했다.

따라서 이번 정상10사례에 대해 임신/역할 상태를 뒤집는 `$special_action[txt]` 후처리를 생략한 근거는 찾지 못했다. renderer7~9를 실행하지 않은 사실 자체는 그대로며, 모든 행동·기존 SAV·다른 분기에서 special_action이 항상 비어 있다고 일반화하지 않는다.

원래 renderer의 `_layout` 호출, 화면/소리, 링크, 다른 action과 실제 GUI 복귀는 검사하지 않았다. 최종 통과는 원래 결과 처리→실제 특성/repair→원래 일일 함수의 상태 계산 연결 통과다. 실제 화면 이후의 모든 상태·일일 전체 사건이나 사용자의 저장 캐시까지 보장하는 결과가 아니다.
