# 명기 검사 코드 분리 및 리뷰 결과

대상: G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp

## 변경 범위

현재 조건과 결과를 유지한 구조 변경이다. 신규 검사 조건, 보정 수치, 확률, 적용 대상은 추가하지 않았다. 흩어진 검사식은 `jo9_meiki_checks` 로케이션으로 모았다. 이 함수는 숫자 `result` 0 또는 1을 반환하고 인물·세션 저장값을 변경하지 않는다.

기능 처리 및 호출 흐름은 기존 로케이션에 유지한다. 검사 로케이션은 호출부에서 사용하는 필수 의존성이며, 파일에서 제거해도 정상 실행된다는 구조는 아니다. 주석 태그는 출처와 완결된 구간을 식별한다.

## QGen에서 확인할 위치

| 로케이션 | 역할 |
|---|---|
| jo9_meiki_checks | 분리된 검사식. 각 mode는 독립적인 if/end 구간이다. |
| jo9_meiki_willing | 대상별 값을 검사 함수에 전달하고 기존 발견 여부를 판정한다. |
| jo9_meiki_state | 이전 상태 기록, 최초 판정, 상태 유지, 최초 기술값 처리. 연령 판정식은 검사 함수 호출로 교체했다. |
| #dynamic / $vaginally_penetrated | 기존 상태 전환 뒤 검사 결과에 따라 상태 함수 인수 1 또는 0을 선택한다. J9M1760 구간에 대응 else/end가 모두 포함된다. |
| interaction | 기존 보정 위치와 적용 횟수. 검사식은 전용 함수 호출로 교체했다. |
| sex_interaction_result / sex_interaction_result_woman | 세션 자격 플래그, 단계 기록, 기존 1회 보정 처리. |
| jo9_meiki_training_bonus | 기존 교육 보너스 반환. 검사식은 전용 함수 호출로 교체했다. |
| $newloc | 저장된 동적 정의 갱신을 위해 기존 캐시 버전 3을 4로 변경했다. |

## 검사 함수 입출력

호출 형식은 `func('jo9_meiki_checks', 'mode', ...)`이다. 첫 문자열 인수인 mode는 아래에 정의되어 있다. 미등록 mode의 반환값은 0이다. 인수 이름은 전달 순서를 설명하며 새 저장 변수가 아니다.

| mode | 전달값 순서 | 검사 대상 |
|---|---|---|
| age | age | 기존 young_age / milf_age 비교 |
| actor | state, age, fear, domini_dictum, neg_raped, neg_disgust, res, sex_acceptance | 기존 대상 상태 검사 |
| direct | diligence, 기존 대상 검사 결과 | 기존 두 조건 |
| transition | interaction_type, diligence, 기존 대상 검사 결과 | 기존 전환 조건 |
| group | 두 대상의 diligence, 두 대상의 기존 검사 결과 | 기존 동시 조건 |
| companion | slave_les_txt5 | 기존 한국어 유형 문자열 비교 |
| session_route | sex_interaction | 기존 번호 목록 비교 |
| session_state | interaction_type, diligence, bondage, girl_raped, girl_disgust, girl_fear | 기존 세션 상태 조건 |
| session_step | sex_interaction, interaction_type, diligence | 기존 단계 기록 조건 |
| session_finish | interaction_type, cum_pleasure, jo9_meiki_voluntary_steps, jo9_meiki_bonus_paid | 기존 결과 및 중복 처리 조건 |

## 주석 구분

- `JO9 MOD START / END`: 추가·변경 구간 및 호출 연결.
- `useless START CHECK_... / END`: 사용자가 지정한 추가 검사 분류. 각 구간은 대응 if/end를 포함한다. 기능상 필요한 값 검사와 추가 제한이 함께 있는 경우 해당 mode의 입출력 설명을 기준으로 구분한다. 전부 정책만을 위한 식이라고 단정하지 않는다.
- 기존 U001~U044의 줄 단위 태그는 제거했다. 특히 U022/U030으로 잘못 분류했던 원본 deny 분기는 실행 코드 그대로 보존했다.

## 수동 편집의 구조 경계

검사식은 별도 로케이션에서, 상태·보정 수치는 기존 기능 로케이션에서 확인할 수 있다. 검사 mode의 조건을 수정하는 일과 해당 함수나 호출부를 삭제하는 일은 다르다. 호출부에는 검사 결과를 사용하는 분기와 처리 순서가 남아 있다. 새로운 수동 수정의 문법·의미까지 자동 보장하지 않는다.

확률 5%, 발견 기회 처리, 기존 효과 수치, 재판정 여부는 이번 작업에서 변경하지 않았다. 함수 호출의 반환값과 기존 분기 결과를 대조했다.

## 검증 및 한계

- QSP 컨테이너 무수정 왕복 일치.
- 저장소 apply_mods.ps1로 사본에 적용한 결과와 준비된 후보의 SHA256 일치.
- 제한된 테스트 평가기로 기존/신규 검사식, 실제 상태 함수, 대상 함수, 세션 처리 블록 58,615개 사례 비교 통과.
- 다른 243개 로케이션의 본문과 모든 기존 로케이션의 설명·액션 데이터 보존.
- 기존 원본 deny 분기 두 곳의 존재 및 보존 확인.
- 실제 QSP 클라이언트의 네이티브 실행과 저장 로드 화면 테스트는 수행하지 않았다. 평가기는 검증 대상 명령의 부분집합을 구현하며 실제 엔진을 대체하지 않는다.

배포본은 이번 수정 대상이 아니다. 적용 전 플레이본 백업과 적용 해시는 installed.json에 기록한다. QGen의 외부 파일 변경을 다시 열지 않고 저장하면 적용본을 덮어쓸 수 있다.
