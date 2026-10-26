# 조수 질문 2종 행동력 비용 출처 조사

확인일: 2026-10-26 (Asia/Seoul)

조수에게 기분을 묻는 행동과 노예에 대한 생각을 묻는 행동은 원본부터 주인공과 조수 양쪽의 행동력을 소비한다. 이번 2.4 변경에서 새로 생긴 비용 회귀는 아니다. 다만 두 정보성 질문에 비용을 붙인 개별 설계 이유, 또는 일반 노예 대화와 조수 대화의 비대칭이 의도된 밸런스라는 근거는 확인하지 못했다.

이 문서는 컴파일된 QSP를 tools/text-workshop/core.cjs의 parse/shift로 해독한 읽기 전용 비교 결과다. 아래 행 번호는 파일 바이트 행이 아니라 각 location 본문의 1부터 시작하는 행이다. 실행·테스트·패치·런타임 변경은 하지 않았으며 이 기록 파일만 작성했다.

## 비교한 파일과 해시

| 구분 | 경로 | SHA256 |
|---|---|---|
| 현재 WORK | G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp | ed7f14b5a892f2dc695e8b90a29dfd1331c31536b604911fb2fddd9af8107648 |
| JO9O 비교본 | G:/somi/JO9O/game/jack.qsp | 26e15aaf30b6226a2883c6b532a6ee4eed34791110618597d234bb7d6fa3e052 |
| 보호 원본 26e15aaf | G:/somi/JO9O/game/_JO9_SNKmod_STATE/20261002_135916_7059ddaa/original/jack.qsp | 26e15aaf30b6226a2883c6b532a6ee4eed34791110618597d234bb7d6fa3e052 |
| 가장 이른 보호 사본 | G:/somi/JO9O/game/_JO9_SNKmod_STATE/20260929_001051_6069d51a/original/jack.qsp | 070dad711ec21038684c713e7e4999bd913741aa953be4d16ebf123ffccf77dc |

JO9O 비교본과 보호 원본 26e15aaf는 파일 해시가 동일하다. 가장 이른 070dad71 보호 사본에도 같은 두 행동과 공통 양쪽 비용 규칙이 있다. 여기서 '원본'은 확인한 로컬 비교본과 보호 기록의 출처 명칭이며, 더 이전 공식 버전 전체의 설계 역사를 입증하는 표현은 아니다.

## 행동과 호출 경로

현재 실제 메뉴 경로는 조수 돌보기 → 대화(menu_form=830) → 질문(menu_form=831)이다. '영향 주기'(833)는 별도 메뉴다.

| 단계 | 현재 WORK location:행 | 원본 26e15aaf location:행 |
|---|---|---|
| '기분은 어때?' → interaction=1126 | menu_form:4938 | menu_form:4685 |
| '노예에 대한 생각은?' → interaction=1118 | menu_form:4940 | menu_form:4687 |
| 1118을 talk_assistant로 분류 | interaction:754–764 | interaction:609–615 |
| 1126을 talk_assistant로 분류 | interaction:10308–10343 | interaction:9873–9908 |
| 조수 대화 유형 목록의 talk_assistant | interaction_result:57 | interaction_result:48 |
| 해당 유형의 partner='assistant' | interaction_result:218–219 | interaction_result:208–209 |
| 양쪽 비용 호출 | interaction_result:1722–1726 | interaction_result:1558–1562 |

$menu의 goto 처리(현재 $menu:33–38)는 interaction=행동번호 & gt 'interaction' 형식의 실행 링크를 만든다. interaction은 플래그와 인물별 판정값을 초기화하고 해당 질문을 구성한 다음 interaction_result로 이동한다(현재 interaction:13026 / 원본:12285). interaction_result가 talk_assistant를 조수 대화로 분류한 뒤 조수의 응답 판정을 계산하고, 공통 마무리에서 주인공과 조수의 비용 함수를 실행한다.

가장 이른 070dad71 보호 사본에서도 메뉴 ID는 1126/1118(menu_form:4678/4680), 해당 질문은 interaction:9848/608, 공통 양쪽 비용 규칙은 interaction_result:1556–1560에 존재한다.

## 원본 주석과 일반 대화의 차이

원본 interaction_result:1558에 다음 주석이 있다. 현재 WORK:1722에도 같은 문구가 유지된다.

> ! interactions that involve the master plus one other slave consume a full action for the master and the partner

이어지는 조건과 호출은 다음과 같다.

    if interaction_no_auto_energy_drop = 0 and (interaction_<<$interaction_partner>>['res'] >= 0 or instr($interaction_type, 'praise') ! 0):
        dynamic $master_energy_drop
        dynamic $<<$interaction_partner>>_energy_drop
    end

일반 노예 대화인 type='talk'는 원본 interaction_result:552–553 / 현재:597–598에서 interaction_no_auto_energy_drop=1을 명시적으로 설정한다. 이 면제는 type='talk_assistant'에 적용되지 않는다. 따라서 일반 노예 대화는 무료인데 조수의 같은 성격 질문은 비용을 소비하는 비대칭도 원본에서 이미 확인된다. 공통 주석은 일반적인 비용 규칙의 근거이며, 이 두 질문의 비대칭을 특별히 의도했다는 설명은 아니다.

## 실제 차감되는 값과 예외

- 정상적인 양수 행동력 구간의 기본 비용은 주인공 master_energy 1, 조수 assistant['energy'] 1이다. assistant['stamina'] 등급을 직접 1 차감하는 코드는 아니다.
- 주인공 비용 함수는 원본 #dynamic:1252–1262 / 현재:1339–1349다. master_half_action에 기본 2를 더하고 1보다 크면 master_energy를 1 차감하며 누적 반 행동 2를 소비한다. 이 함수의 본문은 비교한 원본과 현재가 동일하다.
- 조수 비용 함수는 원본 #dynamic:1240–1250 / 현재:1317–1337다. assistant['half_action']에 기본 2를 더하고 행동력을 1 차감한다. 별도로 assistant['calories']도 1 차감한다.
- 응답 거부 판정이 실패(res<0)하거나 interaction_no_auto_energy_drop=1이면 공통 자동 비용은 실행되지 않는다. 두 질문은 비용 면제를 설정하지 않는다. interaction 진입 시 자동 비용 플래그는 0으로 초기화된다(원본:39 / 현재:60).
- cheat_inf_en=1이면 두 비용 함수의 행동력 차감 부분은 건너뛴다. 조수 calories 차감과 이미 음수인 행동력에 따른 후속 처리는 별도이므로, 치트가 함수 전체의 모든 부수 효과를 막는다는 뜻은 아니다.
- bull_ring_on=1은 주인공 비용을 반 행동 누적으로 바꾼다. easy_for_master/easy_for_assistant 플래그도 반 행동을 지원한다. 두 질문 자체는 이 플래그를 켜지 않으며 easy_for_master는 interaction 진입 시 0으로 초기화된다.
- 행동력은 -5 하한이 있다. 행동력이 음수이면 원본에서 조수 stamina 성장 누적값과 주인공 str 성장 누적값에 과로 영향이 생길 수 있다. 주인공은 obereg_on 예외가 있다. 현재 모드의 근육질 과로 50% 처리는 조수의 음수 행동력에 따른 stamina 누적값 손실을 바꾼 것이며 이 질문의 기본 행동력 1 비용을 새로 만든 처리가 아니다.
- 현재만 존재하는 선천적 벙어리 질문 차단은 interaction:204–225에서 실행 전에 빠져나가며 비용 면제를 설정한다. 이는 원본의 정상 질문 비용과 구별되는 후속 모드 예외다.

## 조사 범위와 결론의 한계

이 기록은 조수의 1126/1118 질문 두 가지와 공통 비용 처리만 다룬다. 원본부터 양쪽 행동력을 소비했다는 출처는 확인됐다. 질문 비용을 무료로 바꿀지 여부는 별도 설계 결정이며 이 조사로 변경을 승인하거나 적용하지 않는다. 특정 사용자의 저장 상태에서 실제 차감량을 재현하는 네이티브 실행 검증은 수행하지 않았다.
