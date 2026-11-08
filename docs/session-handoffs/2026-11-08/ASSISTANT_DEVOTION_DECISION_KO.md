# 조수 헌신도 일일 상승 — 결정 요청 (GPT용)

작성: 2026-11-08, Claude (로컬 모딩 세션)
상태: **결정·적용 완료 (2026-11-08, 사용자 결정).** B안 변형: 조수 자신의 실제 업무 수로 판정, 쉬움·보통 2개·하드코어 3개, 메인 노예와 겹치는 업무 제외, 연금술은 그날 조제에 성공한 경우만. mods `2026-11-08_assistant_daily_devotion` + `2026-11-08_assistant_alchemy_brewed_day`. 게임 UI 표시 없음(릴리즈 노트만). 아래는 결정 전 분석 기록.
기준 QSP: WORK `G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp` (SHA-256 `fffd82c3b9a9…`). 행 번호는 이 파일의 location 본문 기준이며, 다른 세션이 수정하면 바뀔 수 있다.

## 제보

> 조수에서 헌신도가 풀이 아닐 때, 노예일 때는 헌신도 수치가 오르지만, 노예가 없는 상태에서 조수 자리에만 있는 경우에는 헌신도 수치가 안 올라요.

## 결론: 사실이다 (바닐라부터 있던 설계 문제)

바닐라 `G:\somi\JO9O\game\jack.qsp`(next_day 1897·2642행)도 로직이 같다. 우리 모드가 만든 회귀가 아니다.

### 근거

1. 매일 오르는 헌신 보너스는 `next_day`의 `$next_day_slave_moral` 블록(약 2959–2985행)에 있다. 이 블록은 `$do_for_each_slave_in_list`로 `$unfrozen_slave_characters`의 모든 캐릭터에 대해 돈다. 대상은 slave, assistant, prisoner, cow, room1–4, farmhand, harpy, pig다(`#static_base` 340–369행).
   ```
   moral_app = min (dynslave['moral'], dynslave['custom'], dynslave['rational'], dynslave['instinct'])
   if moral_app = dynslave['moral'] and overnight_rules_count >= iif(difficulty_setting = 2, 3, 2):
    if min(dynslave['obedience'], dynslave['mood']) > 0 and max(dynslave['angst'], dynslave['spoil']) = 0 and max(dynslave['fear'], dynslave['pride']) < 5:
     moral_basis = (dynslave['custom'] + dynslave['rational'] + dynslave['instinct'])/3
     moral_boost = min (dynslave['mood'], moral_basis)
     if moral_boost < 1: moral_boost = 1
     dynslave_rate['moral'] += moral_boost
   ```
2. `overnight_rules_count`는 전역 변수다. `next_day` 2188행에서 0으로 초기화된다. 그 뒤 **`if slave_state = CONST_INT['slave_exist']:` 블록 안에서 메인 노예(`slave`)의 규칙만** 센다(2198–2506행). 세는 규칙은 cooks, cleans, washes_master, blowjob 등과 masturbation, no_orgasm이다.
3. 결과는 다음과 같다.
   - **메인 노예가 없으면** 규칙 수가 0이라 조수는 다른 조건을 다 갖춰도 매일 보너스를 받지 못한다.
   - **메인 노예가 있으면** 노예의 규칙 수(2개 이상, 어려움은 3개)가 조수에게도 그대로 적용되어 조수가 덕을 본다. 제보의 "노예일 때는 오른다"가 이 경우다.
   - 조수 자신에게 걸린 규칙(`assistant['cleans_rule']`, `cooks_rule`, `washes_master_rule`, `washes_slave_rule`, `tentacle_rule`, `supervise_rule`)은 이 판정에 전혀 쓰이지 않는다.
4. 예외: 쉬움 난이도에는 조수 전용 보너스(`next_day` 356–365행, `difficulty_setting = 1 and assistant_state = slave_exist`)가 따로 있다. 이 보너스는 노예가 있는지와 상관없이 헌신을 올린다. 따라서 제보는 **보통·어려움 난이도에서** 그대로 성립한다.
5. 같은 문제가 room1–4, prisoner, cow 등 다른 역할에도 똑같이 있다. 모두 메인 노예의 규칙 수를 빌려 쓴다.

### 같은 파일 안의 선례

같은 `next_day`의 방종(spoil) 처리는 이미 메인 노예가 아닌 역할을 규칙 수 조건에서 뺀다.

- 2877행 `if 'dynslave' = 'slave' and ...`: 규칙이 부족해서 방종이 오르는 처리는 메인 노예에게만 적용한다. 주석 원문: "other roles are considered busy enough".
- 2904행 `('dynslave' ! 'slave' or overnight_rules_count >= ...)`: 방종이 줄어드는 처리는 메인 노예가 아니면 규칙 수와 관계없이 적용한다.

`'dynslave'` 문자열은 `$replace(..., 'dyn'+'slave', 'assistant')`로 치환되기 때문에 `'assistant' ! 'slave'`가 되어 역할 판정에 쓸 수 있다.

## 선택지

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| A. 비메인 역할은 규칙 수 조건 면제 | 2965행 조건을 `('dynslave' ! 'slave' or overnight_rules_count >= iif(difficulty_setting = 2, 3, 2))`로 바꾼다 | 1줄 수정이다. 2904행 선례와 같은 철학이다. 노예가 있든 없든 결과가 같다 | 조수·메이드 등은 다른 조건(복종·기분>0, 불안·방종=0, 공포·자존심<5, 헌신이 4능력치 중 최저)만 맞으면 매일 오른다. 노예가 있을 때보다 쉬워지는 경우가 생긴다 |
| A′. 조수만 면제 | `('dynslave' = 'assistant' or overnight_rules_count >= …)` | 영향 범위가 제보 대상인 조수로 한정된다 | room1–4·prisoner 등은 그대로 메인 노예에게 의존한다 |
| B. 조수 자신의 규칙 수로 판정 | `$next_day_slave_moral` 앞에서 `jo9_assistant_rules_count`를 센다(cleans, cooks, washes_master, washes_slave, tentacle, supervise 중 =1인 것). 조수일 때는 이 값을 쓴다 | 원래 "규칙을 지켜야 헌신이 자란다"는 설계 의도를 살린다 | 수정량이 더 많다. 조수 규칙 종류가 노예와 달라서 기준(2/3개)이 적절한지 따로 판단해야 한다. 노예가 있을 때 덕 보던 동작이 사라질 수 있다 |
| C. 현행 유지 | 수정하지 않는다 | — | 제보가 해결되지 않는다 |

Claude 의견(참고만): A′가 제보를 가장 좁고 안전하게 고친다. 다른 역할까지 일관성을 맞추려면 A다. B는 설계 의도에 가장 가깝지만 밸런스 판단이 따로 필요하다.

## 결정 후 작업 방법 (로컬 세션이 수행)

1. WORK QSP를 직접 수정하지 말고 `mods/2026-11-0X_assistant_daily_devotion.json`을 선언형으로 만든다. 형식은 `docs/modding/NEW_PC_KR.md`를 따른다. 수정 대상은 location `next_day`, field `body`, old에는 2965행 원문을 넣고 count는 1로 둔다.
2. 단일 mod 폴더에 넣고 `tools\apply_mods.ps1 -Qsp <WORK qsp> -ModsDir <임시폴더>`로 적용한다. 전체 mods 폴더로 적용하면 `2026-10-01_robertus_rufus_art_tutor`에서 멈추는 미해결 문제가 있다.
3. `tools/qa/check-qsp-line-endings.cjs`와 `check-qsp-marker-boundaries.cjs`를 통과해야 한다.
4. **주석에 작은따옴표를 쓰지 않는다.** QSP는 `!` 주석 안의 `'`도 문자열 시작으로 읽어 다음 줄들을 삼킨다. 2026-11-08 목표 탭이 빈 화면이 된 원인이 이것이었고, `mods/2026-11-08_quest_list_comment_quote.json`으로 고쳤다.
5. CHANGELOG_KO.md에 한 줄 기록하고, 사용자가 인게임으로 확인한다. 확인 방법: 보통 난이도, 노예 없이 조수만 두고 헌신 외 조건을 맞춘 뒤 하루를 넘겨 `assistant_rate['moral']`이 오르는지 본다. `debug_info_assistant` 화면의 "헌신 단계"에서 볼 수 있다.

## GPT가 답해 줄 것

- A / A′ / B / C 중 무엇으로 할지
- B를 고르면: 조수 규칙 몇 개 이상을 기준으로 할지, 어려움 난이도 기준은 몇 개로 할지
- 메이드(room1–4)·죄수 등 다른 역할도 같이 바꿀지
