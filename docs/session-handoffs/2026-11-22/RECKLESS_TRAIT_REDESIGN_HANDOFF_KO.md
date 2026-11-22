# 무모함(courage = 2) 재설계 인계

- 작성: 2026-11-22, Claude (기획만 함. WORK·mods·repo 런타임은 건드리지 않음)
- 사용자 지시: "워크 적용은 니가 하지마. 기획만 하고 핸드오프"
- 기준 파일: `G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp` (2026-11-21 20:09, SHA-256 `09ef2f8df43e66572beae7ed668df528e5d35a3f488c4a4481b6c022dfa19ab8`)
- 아래 줄 번호는 위 파일을 `tools/text-workshop/core.cjs`로 location 본문을 이어 붙인 덤프 기준이라 참고용이다. 적용할 때는 location 이름과 원문 문자열로 찾는다.

## 1. 문제

용기 특성 값: 겁쟁이 −1, 보통 0, 용감함 1, 무모함 2.

무모함은 용감함의 "상위 단계"처럼 설명되지만, 코드에서는 장점이 없고 손해만 더 크다.

| | 용감함 (1) | 무모함 (2, 현재) |
|---|---|---|
| 전투 사기 | ×1.5 | 보정 없음 (코드가 `= 1`만 확인) |
| 복종도 | −4 | −6 |
| 강인함(psy hardness) | +1 | +2 |
| 처벌 판정 | 일반 판정 | 무조건 실패 |

처벌이 무조건 실패하면 두려움·인식·사육·자존 감소가 모두 없다. 대신 실패 효과가 붙는다: 좋은 무드렛 `pos_ineffective_punishment`(기분 +1), 처벌이 죄책감보다 약하면 응석 +성격, merit 초기화. 그래서 사용자가 "고통 계열 커맨드가 안 먹혀 육성을 포기하게 된다"고 판단했다.

참고: 무모함 출현 확률은 그대로 둔다(사용자 결정).
- `generate_stock`: 용기는 1/6 확률로만 `rand(-1,2)` 재추첨 → 무모함 약 4%.
- `jo9_background_b`(암시장 2586~2597): 같은 방식의 1/6 재추첨.
- 고정 캐릭터는 JSON `seed_courage`. 무모함은 2571_isabella, 2592_asian1, 2624_erza, 3003_Albedo. `seed_courage`가 3인 JSON이 하나 있다(표시·판정 없음, 별도 확인 필요).

## 2. 확정된 설계 (사용자 결정)

방향: 용감함 = 균형 잡힌 장점, 무모함 = 큰 장점과 큰 위험. 원문 설명의 "자기 자신에게도 위험"을 전투 생명력 감소로 구현한다.

| 항목 | 현재 | 새 값 | 결정 |
|---|---|---|---|
| 복종도 벌점 | −6 | **−4 (용감함과 같음)** | 사용자 확정 |
| 전투 사기(보라 하트) | 보정 없음 | **×2** | 사용자 확정 |
| 전투 생명력(빨간 하트) | 보정 없음 | **×0.7 (−30%)** | 사용자 확정. 지구력(초록)과 노예 체력 등급은 건드리지 않음 |
| 처벌 판정 | 무조건 실패 | **일반 판정, 성공해도 두려움 상승(2) 대신 1로** | 제안, 사용자 이의 없음 |
| 강인함 | +2 | **+1 (용감함과 같음)** | 제안, 사용자 이의 없음 |
| 두려움 0 고정, 위협 대화 0, 외양간·흡혈 등 겁 없는 반응 | 유지 | 유지 | 제안, 사용자 이의 없음 |
| 설명문 | 원문 | **B안** | 사용자 확정 |
| 난이도 | — | **난이도 무관** (용감함과 같은 규칙. 어려움 50% 규칙을 걸지 않음) | 사용자 확정 (①) |
| 성격 분류 | 부정 쪽 | **중립 특성** | 사용자 확정 |
| 카오틱 에센스 제거 순서 | 2순위(상황형 특성 묶음) | **새 3순위** (상황형 특성 다음, 정액 중독 앞) | 사용자 확정 |
| 특성 목록 표시색 | 1번 `#EA0090` | **2번 `#6B0084`** (중립 특성 색) | 사용자 확정, 색 번호는 제안 |

난이도: 용감함 사기 ×1.5, 무모함 사기 ×2, 무모함 생명력 ×0.7을 모든 난이도에서 같게 적용한다. 용감함은 바뀌지 않는다.

## 3. 수정할 곳

### 3-1. 복종도 벌점 — location `#static_base` (`$update_slave_price` 안)

```
old:		if dynslave['courage'] = 2: slave_obedience_penalty += 6
new:		if dynslave['courage'] = 2: slave_obedience_penalty += 4
```

### 3-2. 강인함 +1 상한 — 세 곳

`#static_base`의 `$recalc_slave_mood` 안 (기분 상한 ③에 쓰임):
```
old:		slave_psy_hardness = max (dynslave['ego'], dynslave['temper'], dynslave['spoil'], dynslave['pride']) + dynslave['courage']
new:		slave_psy_hardness = max (dynslave['ego'], dynslave['temper'], dynslave['spoil'], dynslave['pride']) + min(1, dynslave['courage'])
```

`#static_base`의 정신 상태 판정 안:
```
old:		slave_psy_hardness += dynslave['courage']
new:		slave_psy_hardness += min(1, dynslave['courage'])
```

`jo9_nymph_reaction` (jo9 명령 반응):
```
old:   local jo9_react_hardness = max(jo9subject['ego'], jo9subject['temper'], jo9subject['spoil'], jo9subject['pride']) + jo9subject['courage']
new:   local jo9_react_hardness = max(jo9subject['ego'], jo9subject['temper'], jo9subject['spoil'], jo9subject['pride']) + min(1, jo9subject['courage'])
```

같은 강인함을 쓰는 다른 곳(정신 상태 판정의 `courage = slave_psy_hardness`, 복종 계열 문턱 `slave_psy_hardness/2`)은 위 값을 따라가므로 따로 고치지 않는다. 무모함의 `courage = 100`, `fear = 0`(공포 불가)은 유지한다.

### 3-3. 처벌 판정 — location `#dynamic` (`$dyn_torture_result` 안)

old:
```
	elseif interaction_dynslave['phobia'] = 2 or dynslave['courage'] = 2:
		torture_succeeded = 0 &! slave has a trait aligned with the activity or has the moronic trait (impossible to frighten)
		if dynslave['courage_revealed'] = 0: dynslave['courage_revealed'] = 1
	elseif interaction_dynslave['phobia'] = -1:
		torture_succeeded = 2 &! always increase fear when exploiting slave phobia (unless moronic)
	elseif torturer_skill < fear_resistance:
		torture_succeeded = 0
	else
		torture_succeeded = iif(torture_intensity >= dynslave['fear'], 2, 1) &! increase fear if torture intensity matches or exceeds current fear (possible to max fear without using tier-5 punishments)
	end 
```
new (끝의 `end ` 뒤 공백은 원문 그대로 둔다):
```
	elseif interaction_dynslave['phobia'] = 2:
		torture_succeeded = 0 &! slave has a trait aligned with the activity
		if dynslave['courage_revealed'] = 0 and dynslave['courage'] = 2: dynslave['courage_revealed'] = 1
	elseif interaction_dynslave['phobia'] = -1:
		torture_succeeded = 2 &! always increase fear when exploiting slave phobia (unless moronic)
	elseif torturer_skill < fear_resistance:
		torture_succeeded = 0
	else
		torture_succeeded = iif(torture_intensity >= dynslave['fear'], 2, 1) &! increase fear if torture intensity matches or exceeds current fear (possible to max fear without using tier-5 punishments)
	end 
	! JO9 MOD START RECKLESS_DISCIPLINE_2026112X
	! Reckless slaves cannot be frightened, but a punishment that gets through still teaches: success stays at 1 (no fear increase).
	if dynslave['courage'] = 2:
		if dynslave['courage_revealed'] = 0: dynslave['courage_revealed'] = 1
		if torture_succeeded = 2: torture_succeeded = 1
	end
	! JO9 MOD END RECKLESS_DISCIPLINE_2026112X
```

결과:
- 무모함도 `주인 숙련도 + 5 + 강도 ≥ 저항`이면 성공(1)이다. 죄책감이 있으면 인식 +(1+지능)÷2, 고통·구속이면 사육, 자존 감소, 죄책감 상한 성장, 강도 > 죄책감이면 절망 증가가 적용된다.
- 실패 효과는 다른 노예와 같다.
- 무모함은 `jo9_traits`의 `repair_exclusions`로 공포증(−1)을 가질 수 없으므로 phobia −1 분기는 해당하지 않는다.
- 피학성애자처럼 phobia가 2이면(특성 합산 결과) 지금처럼 실패다.
- 정신 상태 판정이 매번 `fear = 0`으로 지우므로 1로 낮춘 뒤에도 두려움은 쌓이지 않는다.

### 3-4. 전투 사기·생명력 — location `jo9_traits_combat` ('setup' 분기)

old:
```
 if jo9_trait_combat_courage = 1:
  jo9_trait_combat_mor_num *= 3 & jo9_trait_combat_mor_den *= 2
 elseif jo9_trait_combat_courage = -1:
  jo9_trait_combat_mor_den *= 2
 end
```

new (난이도 무관, 사용자 확정):
```
 if jo9_trait_combat_courage = 1:
  jo9_trait_combat_mor_num *= 3 & jo9_trait_combat_mor_den *= 2
 elseif jo9_trait_combat_courage = 2:
  ! JO9 MOD START RECKLESS_COMBAT_2026112X
  ! Reckless: never backs down (morale x2) but takes risks with her own body (health x0.7).
  jo9_trait_combat_mor_num *= 2
  jo9_trait_combat_hp_num *= 7 & jo9_trait_combat_hp_den *= 10
  ! JO9 MOD END RECKLESS_COMBAT_2026112X
 elseif jo9_trait_combat_courage = -1:
  jo9_trait_combat_mor_den *= 2
 end
```

이 분기의 분수는 다른 보정(건강체질 6/5, 전투 특성 3/2, 산도 6/5)과 곱해진 뒤 마지막에 한 번 정수 나눗셈된다. 생명력은 `max(1, …)`로 최소 1이 보장된다. 분자 ≠ 분모일 때 현재 생명력을 최대치로 채우는 기존 줄이 있어, 전투 시작 생명력도 ×0.7이 된다. 난이도 분기는 넣지 않는다(사용자 확정: 난이도 무관).

### 3-5. 설명문 B안 — 두 곳

location `#static_txt`(TRAIT_DESC_36 블록)와 `#txt_woman`에 같은 문장이 있다. 둘 다 바꾼다.

```
old: $Отмороженая = '[무모함]<br>당신 노예는 단순히 용감한 정도가 아니라 무모하다. 어째서인지 공포라는 감정을 모르고, 겁주는 것이 불가능하다. 이런 유형은 타인에게뿐 아니라 자기 자신에게도 매우 위험할 수 있다!'
new: $Отмороженая = '[무모함]<br>당신 노예는 단순히 용감한 정도가 아니라 무모하다. 공포를 모르기에 겁주는 것은 불가능하지만, 벌로 잘못을 가르칠 수는 있다. 싸움에서 물러설 줄 모르는 만큼, 타인에게뿐 아니라 자기 자신에게도 매우 위험하다!'
```

old 문자열은 적용 전에 WORK에서 바이트 그대로 다시 확인할 것(이 문서는 덤프에서 옮겨 적었다).

### 3-6. 카오틱 에센스 제거 순서 — location `jo9_chaotic`

현재 순위(먼저 후보가 있는 순위 안에서 무작위 1개 제거):
1. 부정 특성 (게으름, 통증 공포증, 각종 공포증, 거센 반항심, 산만함, 옹졸함, 동성애 혐오자 등)
2. 상황형 특성 (관심종자, 무기력함, 폐소 공포증, 불감증·석녀, 순수한 영혼, 레즈비언, **겁쟁이·무모함**, 과대망상, 평화주의자, 검소함·사치광, 입맛·당분, 은둔형 외톨이)
3. 정액 중독(색정광으로 완화)

변경(사용자 확정): 무모함을 2순위에서 빼서 **정액 중독보다 앞**(새 3순위)에 둔다. 정액 중독은 4순위로 밀린다. 사용자 판단: 정액 중독도 장점이 큰 고위험·고보상 특성이므로, 중립 특성인 무모함이 그보다 늦게 지워질 이유가 없다. 겁쟁이는 2순위에 그대로 둔다.

사용자는 "앞에, 혹은 동일한 순서"라고 한 뒤 선택을 Claude에게 맡겼다. **A안(앞)으로 확정**. 이유: 같은 순위(B안)는 둘 중 무엇이 지워질지 무작위라 플레이어가 예측할 수 없다. A안이면 "무모함을 남기고 싶으면 정액 중독을 먼저 치료할 수 없다"는 순서가 분명하다. B안 코드는 참고로만 남긴다.

2순위 old:
```
  if jo9ceactor['courage'] = -1 or jo9ceactor['courage'] = 2:
   $jo9_chaotic_keys[jo9_chaotic_count] = 'courage'
   if jo9ceactor['courage'] = -1: $jo9_chaotic_labels[jo9_chaotic_count] = '겁쟁이'
   if jo9ceactor['courage'] = 2: $jo9_chaotic_labels[jo9_chaotic_count] = '무모함'
   $jo9_chaotic_xps[jo9_chaotic_count] = ''
   jo9_chaotic_count += 1
  end
```
2순위 new:
```
  if jo9ceactor['courage'] = -1:
   $jo9_chaotic_keys[jo9_chaotic_count] = 'courage'
   $jo9_chaotic_labels[jo9_chaotic_count] = '겁쟁이'
   $jo9_chaotic_xps[jo9_chaotic_count] = ''
   jo9_chaotic_count += 1
  end
```

A안(확정) — 새 3순위를 정액 중독 블록 바로 앞에 넣는다. old의 세 줄은 덤프에서 한 번만 나오는 것을 확인했다(줄바꿈 CRLF).
```
old:
if jo9_chaotic_count = 0:
 dynamic $replace({
  if jo9ceactor['nymphomania'] > 1:
new:
! JO9 MOD START RECKLESS_CHAOTIC_ORDER_2026112X
! Reckless is a neutral trait: remove it after negative and situational traits, before semen addiction.
if jo9_chaotic_count = 0:
 dynamic $replace({
  if jo9ceactor['courage'] = 2:
   $jo9_chaotic_keys[0] = 'courage'
   $jo9_chaotic_labels[0] = '무모함'
   $jo9_chaotic_xps[0] = ''
   jo9_chaotic_count = 1
  end
 }, 'jo9ceactor', $jo9_chaotic_role)
end
! JO9 MOD END RECKLESS_CHAOTIC_ORDER_2026112X
if jo9_chaotic_count = 0:
 dynamic $replace({
  if jo9ceactor['nymphomania'] > 1:
```

B안(참고용, 적용하지 않음) — 정액 중독과 같은 순위에 넣어 둘 중 무작위 1개를 고른다. 정액 중독 블록 전체를 바꾼다.
```
old:
if jo9_chaotic_count = 0:
 dynamic $replace({
  if jo9ceactor['nymphomania'] > 1:
   $jo9_chaotic_keys[0] = 'jo9_addiction_treatment'
   $jo9_chaotic_labels[0] = '정액 중독'
   $jo9_chaotic_xps[0] = ''
   jo9_chaotic_count = 1
  end
 }, 'jo9ceactor', $jo9_chaotic_role)
end
new:
if jo9_chaotic_count = 0:
 dynamic $replace({
  if jo9ceactor['nymphomania'] > 1:
   $jo9_chaotic_keys[jo9_chaotic_count] = 'jo9_addiction_treatment'
   $jo9_chaotic_labels[jo9_chaotic_count] = '정액 중독'
   $jo9_chaotic_xps[jo9_chaotic_count] = ''
   jo9_chaotic_count += 1
  end
  ! JO9 MOD START RECKLESS_CHAOTIC_ORDER_2026112X
  if jo9ceactor['courage'] = 2:
   $jo9_chaotic_keys[jo9_chaotic_count] = 'courage'
   $jo9_chaotic_labels[jo9_chaotic_count] = '무모함'
   $jo9_chaotic_xps[jo9_chaotic_count] = ''
   jo9_chaotic_count += 1
  end
  ! JO9 MOD END RECKLESS_CHAOTIC_ORDER_2026112X
 }, 'jo9ceactor', $jo9_chaotic_role)
end
```
B안에서도 정액 중독이 뽑히면 기존 메시지("정액 중독을 색정광으로 완화")가, 무모함이 뽑히면 일반 제거 메시지가 나온다.

제거 동작은 기존 공통 경로(`jo9ceactor[$args[0]] = 0`)를 그대로 써서 용기 0(특성 없음)이 된다. 2순위의 old 블록 들여쓰기(공백 1칸·2칸·3칸)는 WORK에서 바이트로 다시 확인할 것.

### 3-7. 특성 목록 표시색 — location `#static_base`

특성 색 표(`$_font_col_skill`): 0 `#cd0000`, 1 `#EA0090`, 2 `#6B0084`, 3 `#0000D8`, 4 `#009FEF`, 5 `#009900`, 6 `#996515`.
2번은 용감함·레즈비언·통증 내성·각종 기호증·검소함·은둔형 외톨이 같은 중립·혼합 특성이 쓰는 색이다. 1번은 무모함과 미약한 대사량만 쓴다. 무모함을 중립 특성으로 바꾸므로 2번으로 옮긴다.

```
old:            $dynslave_features_list += '<a href="EXEC: msg $Отмороженая"><<dyneval($vb_cycle_skill, 1, "무모함")>></a><br>'
new:            $dynslave_features_list += '<a href="EXEC: msg $Отмороженая"><<dyneval($vb_cycle_skill, 2, "무모함")>></a><br>'
```

이 줄 외에 무모함을 색으로 표시하는 곳은 찾지 못했다(디버그 치트 메뉴의 순환 버튼은 색 없음).

### 3-8. 손대지 않는 곳 (의도적으로 유지)

- 위협 대화 `threat_effect = 0` (`interaction`, 두 곳)
- 외양간 배치 순응, 외양간 거부 문구, "무섭고" 대사 분기, `neg_master_vampire` 면제, 마법 두려움·절망 면제
- 공포증 금지(`jo9_traits` repair_exclusions / allow)
- 정신 상태 판정의 `courage = 100`, `fear = 0`
- 마차 기동성(+1, 용감함과 같음)
- 출현 확률

## 4. 적용과 검사 (적용 담당이 할 일)

1. (완료) 난이도는 사용자가 ① 난이도 무관으로 확정.
2. mods에 선언형 JSON 1개로 기록(location, old, new, count, before/after SHA-256). 다른 세션의 미적용 mod까지 함께 적용되지 않도록 이 mod만 든 폴더로 `tools\apply_mods.ps1 -ModsDir`를 쓰는 편이 안전하다. 2026-11-22 현재 repo에 다른 세션의 커밋 안 된 변경이 100건 이상 있다.
3. AGENTS 33항 기준 필요한 검사만 한다. 조건·계산 변경이므로 영향받는 경계값만 목표 검사.
   - 복종도: 무모함 노예의 복종도가 같은 조건의 용감함과 같은지
   - 처벌: 무모함이 저항보다 강한 처벌에서 성공(1)하고, 두려움 단계가 오르지 않으며, 인식·사육이 오르는지. 약한 처벌은 실패하는지
   - 강인함: 무모함의 복종 계열 문턱이 용감함과 같은지
   - 전투: 무모함 생명력 ×0.7, 사기 ×2(모든 난이도). 용감함 ×1.5 그대로. 건강체질과 겹칠 때 분수 계산
   - 카오틱 에센스: 부정·상황형 후보가 있으면 무모함이 뽑히지 않는지. 그것들이 없으면 정액 중독보다 무모함이 먼저 제거되는지. 무모함이 없을 때 정액 중독 완화가 그대로 동작하는지. 겁쟁이는 계속 2순위인지
   - 설명문 두 곳 표시, 특성 목록에서 무모함이 2번 색(#6B0084)인지
4. repo 동기화와 CHANGELOG는 기존 절차대로. 커밋·푸시는 사용자 지시가 있을 때만.

## 5. 사용자 확인 포인트 (게임에서 직접)

1. 무모함 노예의 특성 설명이 B안으로 나오고, 특성 목록 글자색이 용감함과 같은 보라색인지
2. 무모함 노예를 처벌했을 때 "생각보다 심하지 않았어요"가 매번 뜨지 않고, 인식·사육이 오르는지
3. 무모함 동료로 전투할 때 빨간 하트가 줄어든 채 시작하고 보라 하트가 늘었는지
