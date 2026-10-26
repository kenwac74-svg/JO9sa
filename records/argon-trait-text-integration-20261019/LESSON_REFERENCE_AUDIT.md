# 수업·주문 대상 참조 22곳 교정

검토 기준: Work QSP SHA256 `f69637e965af4489a7328eee91864df3e0b3dc22c4ab948c4913b106a68fb753`.

## 바뀌는 내용

원고에 이미 있는 한국어 문장은 그대로 두고, 이름 19곳과 나이 2곳, 장신구 상태 1곳을 실제 대상에게 맞춘다. 새 수업이나 주문, 능력치 효과를 만들지 않는다. 최초 6사례 확인 뒤, 사용자 지시 범위인 설명서의 동일 오류 묶음까지 확인해 22곳으로 확장했다.

| 키 | 이전 참조 | 이후 참조 |
|---|---|---|
| `$cast_spell[66]` | `slave["age"]` | `dynslave["age"]` |
| `$cast_spell[69]` | `$slave_name` | `$dynslave_name` |
| `$oratory_lesson_description[0]` | `$slave_name` | `$dynslave_name` |
| `$oratory_lesson_description[1]` | `$slave_name` | `$dynslave_name` |
| `$music_lesson_description[0]` | `$slave_name` | `$dynslave_name` |
| `$music_lesson_description[2]` | `$slave_name` | `$dynslave_name` |

위 표는 처음 제시한 6사례다. 추가 교정 키는 `$cast_spell[70000]`, `$oratory_lesson_description[3/4/5]`, `$music_lesson_description[3/4/5]`, `$slave_foreplay_anal[0]`, `$slave_seduction[4]`, `$hj_lesson_description[0]`, `$rimming_lesson_description[0]`, `$vaginalsex_lesson_description[4/5]`, `$pigsex_lesson_description[0/2/4]`다.

문장 전체의 전후 대조는 `lesson-before-after.json`에 기록했다. 패치 ID는 `ARGON_LESSON_TARGET_01`부터 `_22`까지다. 공통 명사·신체 부위 표현을 담은 `$slave_noun2` 등의 사전 이름은 바꾸지 않고, 그 사전을 조회하는 대상 배열 참조만 바꾼다. 이미 올바른 `dynslave`를 다시 바꾸는 방식은 사용하지 않는다.

## 호출·의존·제거 영향

- `refresh_database`가 `#static_txt`를 불러와 텍스트 배열을 채운다. 이 문자열은 현재 인물의 값을 미리 저장하는 방식이 아니라 지연 평가되는 표식이 남는 방식이다.
- `interaction`이 수업 단계에 맞는 문자열을 선택하고, `interaction_result`의 기존 `dynamic $replace`가 출력 직전에 `dynslave`를 현재 대상으로 치환한다. 주문 출력에도 같은 치환 관례가 있다.
- 개인실의 수업 대상은 기존 `snk_room_bridge`가 잠시 `slave`로 옮긴다. 새 연결이나 저장 변수는 추가하지 않는다.
- 입력은 기존 배열 키 및 대상 이름·나이, 반환은 기존 문자열이다. 상태·경험치·행동력·세이브 구조 변경은 없다.
- 교정만 제거하면 조수처럼 주 노예와 다른 대상에게 기존 문장을 출력할 때 주 노예의 이름이나 나이가 다시 섞일 수 있다. 다른 기능의 필수 의존성은 생기지 않는다.

## 검증

- 원본 RED: 노예 대상 1개 통과, 다른 직접 대상 5개 실패. 공포 주문에서 주 노예의 나이가 사용됐다.
- 원본 조수 대상 전체 오류 수집: 나이 1곳 및 나머지 5곳의 이름 오류를 모두 실제 엔진에서 확인했다.
- 최초 6곳 수정 GREEN: 노예·조수·개인실 4명 직접 치환 및 실제 개인실 enter/leave 4경로, 총 10개 실행 검사 통과. 결과는 `G:/somi/JO9_work_backups/argon_lesson_green_20261019/client-results.json` 확인.
- 확장된 22곳은 원본 RED를 다시 실행했고, 수정본 동일 10개 대상 경로의 결과는 `G:/somi/JO9_work_backups/argon_lesson_expanded_green_20261019/client-results.json`에 있다. 이름 누락뿐 아니라 주 노예 이름의 혼입, 연령 명사·장신구 상태 혼입도 확인한다.
- 최종 통합 후보 SHA256 `545a59dda6374a1e79fac283cebb80b00cc8892bf23d145bd8ac9c1c6ea76ff2`에서도 22개 문구 × 10개 대상 경로가 모두 통과했다. 결과는 `G:/somi/JO9_work_backups/argon_lesson_final_20261019/client-results.json` 및 `lesson-voice-native-summary.json`에 있다. 같은 최종 검사로 기존 원본을 실행하면 실패하는 대조 결과도 `argon_lesson_final_red_20261019`에 보존했다.
- 대상 이름을 데이터베이스 로드 후 바꿔, 오래된 이름이 출력되지 않는지도 확인한다.
- 검사에서는 원본 `interaction_result`의 지연 출력문을 그대로 실행하지만 전체 수업 진행·보상·화면 배치를 다시 검증하는 것은 아니다. 그 로직은 변경하지 않았다.

## 이번 범위 밖의 문서 주장

설명서의 ‘24곳’ 목록은 인덱스 26개를 열거하며, 현재 QSP에는 중복 대입 1개를 포함해 27줄이 있다. 교정한 22곳 외의 4개 키는 다음처럼 처리했다.

- 화술 `[2]`, 음악 `[1]`: 대상 참조가 없어 교정 불필요.
- `$bj_lesson_description[1]`: 이미 이름은 `dynslave`를 사용하고, 별도 미니게임의 `sex["girl_age"]`를 사용하므로 같은 직접 노예 참조 교정으로 취급하지 않음.
- `$fisting_lesson_description[5]`: 같은 키가 뒤에서 재대입되어 앞의 직접 이름 참조가 이미 덮어써진다. 실제 마지막 대입문은 별도 참가자 조건과 `dynslave`를 함께 쓰므로, 의미를 바꾸는 일괄 치환을 하지 않음.
