# 도나도나 초기 능력·등장 경로 정합성

사용자 승인: 직업 기술·타고난 적성·성격을 인물별로 구분하고 복제된 외모5 인물들의 등장 코드를 확인.

수치의 JO9 환산은 이번 작업의 조정 판단이며 원작 확정 수치가 아니다. 원작 외모 S는5, A/A+는4, B/B+는3으로 복제11명과 린을 구분한다. 이미 개별 설계된 나머지 외모를 일괄 낮추지는 않는다. 메디코·야미·키쿠치요는 적합한 기본값을 유지한다. 전투/직업 경험과 적성은 별개로 정하고 전원을 만능으로 만들지 않는다. 성적 수치·나이·해부·이미지·이름·이야기·구매 가격/조건/행동은 보존한다.

1. 현재 WORK 기준23 JSON과 직접 등장 블록/메뉴 상수를 대조한다.
2. 일반 초기 능력·성격·직업/운동 적성만 수정하고 전후표를 남긴다.
3. 격리 실제 엔진의 JSON 읽기→get_stock_seed 및 실제 상점 메뉴의4가지 조건을 검사한다.
4. WORK/추적 JSON/manifest만 반영한다. 기존 보유 인물의 육성값은 강제로 갱신하지 않는다. QSP·개인SAV·Full·음원·커밋푸시는 범위 밖이다.

## 8877 메디코

의료 B·간호 적성과 동료를 돌보던 경력은 이미 일치하므로 유지.



## 8878 포르노

쿠마 보조·사람 관리와 대인 눈치를 화술 B·화술 적성으로 표현.

- seed_expression: 미지정 → 3
- seed_expression_affinity: 미지정 → 1

## 8879 키라키라

자유와 자극을 좇는 활동형. 천재 연구자와 구분하고 신체 활동·사교를 보완.

- seed_intellect: 5 → 3
- seed_temper: 4 → 5
- seed_ego: 4 → 3
- seed_calisthenics: 미지정 → 2
- seed_expression: 1 → 2
- seed_psy_basic: soft → optimistic

## 8880 츠이나

용병 자금과 인원 운용 경험을 사무·화술 B로 반영. 기존 지성·전투·적성은 유지.

- seed_secretary: 미지정 → 3
- seed_expression: 1 → 3

## 8881 야미

저격수의 전투 A와 기존 지성은 유지.



## 8882 안테나

해킹·신호 분석은 로마의 마법 숙련으로 보지 않는다. 기존 사무 기술로 정보 처리 B·높은 적성을 표현.

- seed_secretary: 미지정 → 3
- seed_secretary_affinity: 미지정 → 3
- seed_temper: 3 → 4
- seed_pride: 2 → 1
- seed_psy_basic: soft → optimistic

## 8883 아리스

실험·저격 훈련은 전투 A로, 생소한 일에 순서대로 지시가 필요한 성격을 내성적·소심·솔직으로 반영. 지성은 유지.

- seed_gladiatrix: 3 → 4
- seed_gladiatrix_affinity: 미지정 → 1
- seed_temper: 4 → 2
- seed_ego: 4 → 2
- seed_pride: 4 → 1

## 8884 미스트레스

회장 비서·상점 운영자: 비서 A·화술 A. 전문적인 업무 능력과 협상 적성을 반영.

- seed_secretary: 1 → 4
- seed_expression: 1 → 4
- seed_secretary_affinity: 미지정 → 3
- seed_expression_affinity: 미지정 → 1
- seed_temper: 3 → 4
- seed_ego: 3 → 4
- seed_pride: 2 → 3

## 8885 조커

전투 S의 특수 인재 성격은 보존. 임시 운영 경험은 비서 B, 치료 지원은 의료 A로 분리해 만능 S 복제를 완화.

- seed_secretary: 5 → 3
- seed_nurse: 5 → 4
- seed_nurse_affinity: 미지정 → 1
- seed_gladiatrix_affinity: 미지정 → 1

## 8886 이누이

A+ 외모를 4로 번역. 밝고 정의감 강한 우등생: 건강함·적극적·단호함·솔직함, 기초 사무·화술.

- seed_beauty: 5 → 4
- seed_stamina: 2 → 3
- seed_sensitivity: 5 → 4
- seed_temper: 2 → 4
- seed_ego: 2 → 4
- seed_pride: 3 → 1
- seed_service: 미지정 → 1
- seed_secretary: 미지정 → 1
- seed_expression: 미지정 → 2
- seed_psy_basic: soft → optimistic

## 8887 시온

칼·잠입·정보 중개 경력: 전투 A·화술 A·비서 B. 재추첨되는 태도0을 당당함으로 지정.

- seed_gladiatrix: 미지정 → 4
- seed_secretary: 미지정 → 3
- seed_expression: 미지정 → 4
- seed_expression_affinity: 미지정 → 1
- seed_pride: 0 → 3

## 8888 린

A+ 외모4. 명문가 수재: 지성5·냉담·차가움·단호함, 비서 C와 적성. 무정함/무관심함0의 재추첨을 방지.

- seed_beauty: 5 → 4
- seed_intellect: 4 → 5
- seed_sensitivity: 0 → 1
- seed_temper: 0 → 1
- seed_ego: 5 → 4
- seed_pride: 1 → 3
- seed_secretary: 미지정 → 2
- seed_secretary_affinity: 미지정 → 1

## 8889 키쿠치요

전투 A·근육질·학문과 예법 관련 기술이 이미 있어 유지.



## 8890 리리에

A 외모4. 인정받고 싶은 허세와 내성적인 면을 구분. 화술 C·취미 미술 D, 실제 마법은 부여하지 않음.

- seed_beauty: 5 → 4
- seed_sensitivity: 5 → 4
- seed_ego: 2 → 3
- seed_pride: 3 → 4
- seed_intellect: 4 → 3
- seed_expression: 미지정 → 2
- seed_art: 미지정 → 1

## 8891 쿄카

A 외모4. 근육질·진압반장: 체력5·전투 A·전투 적성, 적극적·완고함. 사무와 현장 지휘의 화술 C.

- seed_beauty: 5 → 4
- seed_stamina: 2 → 5
- seed_sensitivity: 5 → 3
- seed_temper: 2 → 4
- seed_ego: 2 → 5
- seed_intellect: 4 → 3
- seed_gladiatrix: 미지정 → 4
- seed_gladiatrix_affinity: 미지정 → 1
- seed_secretary: 미지정 → 2
- seed_expression: 미지정 → 2

## 8892 노에루

원작 S 외모5 유지. 아이돌: 음악 A·무용 A·화술 B, 음악/무용 적성. 무대 밖 높은 자존심을 태도로 표현.

- seed_stamina: 2 → 3
- seed_sensitivity: 5 → 3
- seed_temper: 2 → 4
- seed_ego: 2 → 4
- seed_pride: 3 → 5
- seed_intellect: 4 → 3
- seed_music: 미지정 → 4
- seed_calisthenics: 미지정 → 4
- seed_expression: 미지정 → 3
- seed_music_affinity: 미지정 → 1
- seed_calisthenics_affinity: 미지정 → 1

## 8893 미루키

원작 B 외모3. 말로 상대를 움직이려는 자신감과 미숙함: 적극적·단호함·건방짐·화술 C.

- seed_beauty: 5 → 3
- seed_sensitivity: 5 → 3
- seed_temper: 2 → 4
- seed_ego: 2 → 4
- seed_pride: 3 → 4
- seed_intellect: 4 → 3
- seed_expression: 미지정 → 2
- seed_expression_affinity: 미지정 → 1
- seed_psy_basic: soft → optimistic

## 8894 타마키

A 외모4. 치어리더: 체력4·무용 B·화술 B·운동/무용 적성. 열정적이고 솔직한 낙천성.

- seed_beauty: 5 → 4
- seed_stamina: 2 → 4
- seed_sensitivity: 5 → 4
- seed_temper: 2 → 5
- seed_ego: 2 → 3
- seed_pride: 3 → 1
- seed_intellect: 4 → 3
- seed_calisthenics: 미지정 → 3
- seed_expression: 미지정 → 3
- seed_sport_affinity: 미지정 → 1
- seed_calisthenics_affinity: 미지정 → 1
- seed_psy_basic: soft → optimistic

## 8895 치하루

B 외모3. 운동부·위원장: 체력4·운동 적성·무용 C, 적극적·단호함·솔직함, 기초 사무와 화술.

- seed_beauty: 5 → 3
- seed_stamina: 2 → 4
- seed_sensitivity: 5 → 3
- seed_temper: 2 → 4
- seed_ego: 2 → 4
- seed_pride: 3 → 1
- seed_intellect: 4 → 3
- seed_calisthenics: 미지정 → 2
- seed_sport_affinity: 미지정 → 1
- seed_secretary: 미지정 → 1
- seed_expression: 미지정 → 2

## 8896 후미

A+ 외모4. 부드럽지만 심지가 강한 대학생·행사 홍보 아르바이트: 건강함·다감함·단호함, 화술 B와 적성·기초 생활 기술.

- seed_beauty: 5 → 4
- seed_stamina: 2 → 3
- seed_sensitivity: 5 → 4
- seed_temper: 2 → 3
- seed_ego: 2 → 4
- seed_pride: 3 → 1
- seed_service: 미지정 → 2
- seed_cook: 미지정 → 1
- seed_secretary: 미지정 → 1
- seed_expression: 미지정 → 3
- seed_expression_affinity: 미지정 → 1

## 8897 사나

B 외모3. 성실하지만 학업·운동에서 두각을 보이지 않는 학생: 평범한 지성2·소심함·의존적, 기초 기술 D. 숙련은 육성으로 남김.

- seed_beauty: 5 → 3
- seed_pride: 3 → 2
- seed_intellect: 4 → 2
- seed_service: 미지정 → 1
- seed_secretary: 미지정 → 1

## 8898 나나미

B+ 외모3. 공장 일을 돕던 주부: 건강함·다감함·주관적·솔직함, 집안일 B·요리 B·사무 C.

- seed_beauty: 5 → 3
- seed_stamina: 2 → 3
- seed_sensitivity: 5 → 4
- seed_temper: 2 → 3
- seed_ego: 2 → 3
- seed_pride: 3 → 1
- seed_intellect: 4 → 3
- seed_service: 미지정 → 3
- seed_cook: 미지정 → 3
- seed_secretary: 미지정 → 2

## 8899 슈코

B 외모3. 전문 직업이 없는 인물: 직접적인 지시를 따르는 솔직함·기초 집안일 D. 기존 총명함은 근거가 부족해 평범함2로 설정.

- seed_beauty: 5 → 3
- seed_pride: 3 → 1
- seed_intellect: 4 → 2
- seed_service: 미지정 → 1