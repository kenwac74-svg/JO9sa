# Attention merger runtime inventory

Input: G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp

SHA-256: 09c12dec13870967f558a830981604c7b65f199da3824e7a519f5f95285f6e14

Raw-key lines: 122. All line numbers are one-based decoded location body lines.

## menu_form

```qsp
4067: 	if slave["abuse_attitude"]  = 2:
4068: 		$setting_display += '<div id="under_cheats">심리피학 성애자<div id = "clear"><a href = "EXEC: slave[''abuse_attitude''] = -1 & gt ''menu_form''"><img src = "content\pic\clear.png"></a></div></div>'
4070: 	if slave["abuse_attitude"]  = -1:
4071: 		$setting_display += '<div id="under_cheats">연극성 인격장애<div id = "clear"><a href = "EXEC: slave[''abuse_attitude''] = 0 & gt ''menu_form''"><img src = "content\pic\clear.png"></a></div></div>'
4073: 	if slave["abuse_attitude"]  = 0 or slave["abuse_attitude"]  = 1:
4074: 		$setting_display += '<div id="under_cheats"><strike> 욕설 </strike><div id = "clear"><a href = "EXEC: slave[''abuse_attitude''] = 2 & gt ''menu_form''"><img src = "content\pic\clear.png"></a></div></div>'
4157: 	if slave["passion_fame"]  = 1:
4158: 		$setting_display_r += '<div id="under_cheats">인지욕구<div id = "clear"><a href = "EXEC: slave[''passion_fame''] = -1 & gt ''menu_form''"><img src = "content\pic\clear.png"></a></div></div>'
4160: 	if slave["passion_fame"]  = -1:
4161: 		$setting_display_r += '<div id="under_cheats">은둔형 외톨이<div id = "clear"><a href = "EXEC: slave[''passion_fame''] = 0 & gt ''menu_form''"><img src = "content\pic\clear.png"></a></div></div>'
4163: 	if slave["passion_fame"]  = 0:
4164: 		$setting_display_r += '<div id="under_cheats"><strike> 인지도 </strike><div id = "clear"><a href = "EXEC: slave[''passion_fame''] = 1 & gt ''menu_form''"><img src = "content\pic\clear.png"></a></div></div>'
```

## generate_stock_maximum_testing

```qsp
240: stock["abuse_attitude"] = 0
241: stock["passion_fame"] = 0
```

## chose_answer

```qsp
19: 	if slave['passion_fame'] = 1:
22: 	if slave['abuse_attitude'] = 2 and slave['custom'] > 1:
143: 		if slave['passion_fame'] = -1:
146: 		if slave['abuse_attitude'] = -1 and slave['instinct'] > 0:
```

## generate_stock

```qsp
1285: 	if rand(1, 6) = 1: stock['abuse_attitude'] = rand(-1,2)
1295: 	if rand(1, 6) = 1: stock['passion_fame'] = rand(-1,2)
1383: !stock['abuse_attitude_revealed'] = 2
1393: !stock['passion_fame_revealed'] = 2
1437: 	if stock['abuse_attitude'] >= 0: stock['abuse_attitude'] = rand(-1,0)
1438: 	if stock['passion_fame'] <= 0: stock['passion_fame'] = rand(0,1)
```

## get_stock_seed

```qsp
173: stock['abuse_attitude'] = seed_abuse_attitude[stock_type]
174: stock['abuse_attitude_revealed'] = seed_abuse_attitude_revealed[stock_type]
191: stock['passion_fame'] = seed_passion_fame[stock_type]
192: stock['passion_fame_revealed'] = seed_passion_fame_revealed[stock_type]
```

## next_day

```qsp
1451: 			if dynslave['moral'] ! 5 and dynslave['abuse_attitude'] ! 2:
4343: 				if slave["abuse_attitude"] = -1: rape_negative = rape_negative*2
4344: 				if slave["abuse_attitude"] = 1: rape_negative = rape_negative/2
4345: 				if slave["abuse_attitude"] = 2: rape_negative = 0
```

## interaction

```qsp
971: 		cheer_effect = 2 + max(-1, master_supermacy) + slave['passion_fame']*5 + slave['moral'] - slave_already_done_total[$str(interaction)]
995: 		threat_effect = min(slave['rational'], slave['intellect']) - slave['abuse_attitude']*5 + max(-1, master_supermacy) - rebell[$slave_psy_status] - slave_already_done_recent[$str(interaction)]
5990: 	if slave['passion_fame'] = -1: interaction_reward_potence /= 2
5994: 		if slave['passion_fame'] ! 0 and slave['passion_fame_revealed'] = 0: slave['passion_fame_revealed'] = 1
6008: 	if slave['passion_fame'] = -1: interaction_reward_potence /= 2
6011: 	if slave['passion_fame'] > 0: interaction_reward_potence *= 2
6015: 		if slave['passion_fame'] ! 0 and slave['passion_fame_revealed'] = 0: slave['passion_fame_revealed'] = 1
6030: 	if slave['passion_fame'] = -1: interaction_reward_potence /= 2
6032: 	if slave['passion_fame'] > 0: interaction_reward_potence *= 2
6035: 		if slave['passion_fame'] ! 0 and slave['passion_fame_revealed'] = 0: slave['passion_fame_revealed'] = 1
6050: 	if slave['passion_fame'] = -1: interaction_reward_potence /= 2
6056: 		if slave['passion_fame'] ! 0 and slave['passion_fame_revealed'] = 0: slave['passion_fame_revealed'] = 1
6716: 		if slave['abuse_attitude'] ! -1 and slave['passion_fame'] ! 1: interaction_reward_potence -= slave_already_done_total[$str(interaction)] - slave['age_count']/4 &! diminishing returns from repetition - ImperatorAugustus
6727: 		if slave['abuse_attitude'] ! -1 and slave['passion_fame'] ! 1: interaction_reward_potence -= slave_already_done_total[$str(interaction)] - slave['age_count']/8 &! diminishing returns from repetition - ImperatorAugustus
6738: 		if slave['abuse_attitude'] ! -1 and slave['passion_fame'] ! 1: interaction_reward_potence -= slave_already_done_total[$str(interaction)] - slave['age_count']/12 &! diminishing returns from repetition - ImperatorAugustus
6750: 		if slave['abuse_attitude'] ! -1 and $slave_psy_status ! 'broken':
6772: 		if slave['abuse_attitude'] ! -1 and $slave_psy_status ! 'broken':
6796: 		if slave_already_done_today[$str(interaction)] = 0 and slave['abuse_attitude'] ! 2: $play_sound[1] = $cry[slave['age']]
6810: 		if slave_already_done_today[$str(interaction)] = 0 and slave['abuse_attitude'] ! 2: $play_sound[1] = $cry[slave['age']]
6829: 		if slave_already_done_today[$str(interaction)] = 0 and futile_threat = 0 and slave['abuse_attitude'] ! 2: $play_sound[1] = $cry[slave['age']]
6848: 		if slave_already_done_today[$str(interaction)] = 0 and slave['abuse_attitude'] ! 2: $play_sound[1] = $cry[slave['age']]
6868: 		if slave_already_done_today[$str(interaction)] = 0 and slave['abuse_attitude'] ! 2: $play_sound[1] = $cry[slave['age']]
10560:  if slave["passion_fame"] = -1:  praise_potence = praise_potence/2
10585:  if slave["passion_fame"] ! 0 and slave["passion_fame_revealed"] = 0: slave["passion_fame_revealed"] = 1
10609:  if slave["passion_fame"] = -1:  praise_potence = praise_potence/2
10612:  if slave["passion_fame"] > 0:  praise_potence += praise_potence
10637:  if slave["passion_fame"] ! 0 and slave["passion_fame_revealed"] = 0: slave["passion_fame_revealed"] = 1
11120: if assistant["passion_fame"] = -1: praise_potence = praise_potence/2
11123: if assistant["passion_fame"] > 0: praise_potence += praise_potence
11141:   if assistant["passion_fame"] ! 0 and assistant["passion_fame_revealed"] = 0: assistant["passion_fame_revealed"] = 1
11152: if assistant["passion_fame"] = -1: praise_potence = praise_potence/2
11154: if assistant["passion_fame"] > 0: praise_potence += praise_potence
11170:  if assistant["passion_fame"] ! 0 and assistant["passion_fame_revealed"] = 0: assistant["passion_fame_revealed"] = 1
11182: if assistant["passion_fame"] = -1: praise_potence = praise_potence/2
11202:  if assistant["passion_fame"] ! 0 and assistant["passion_fame_revealed"] = 0: assistant["passion_fame_revealed"] = 1
11343:   if assistant["abuse_attitude"] ! 0 and assistant["abuse_attitude_revealed"] = 0: assistant["abuse_attitude_revealed"] = 1
11472:          if assistant["abuse_attitude"] = -1: rape_negative = rape_negative*2
11473:          if assistant["abuse_attitude"] = 1: rape_negative = rape_negative/2
11474:          if assistant["abuse_attitude"] = 2: rape_negative = 0
```

## interaction_result

```qsp
148: 				if dynslave['abuse_attitude'] < 0: rise_mod += -2
149: 				if dynslave['abuse_attitude'] = 2: rise_mod += 2
150: 				if dynslave['abuse_attitude_revealed'] = 0 and 'dynslave' = $interaction_partner: dynslave['abuse_attitude_revealed'] = 1
151: 				if dynslave['abuse_attitude'] ! 2: dynslave['neg_abuse'] = max(dynslave['neg_abuse'], min(torture_intensity, dynslave['sensitivity']))
1326: 	if slave['abuse_attitude'] = -1 and $slave_psy_status ! 'broken':
1327: 		if slave['abuse_attitude_revealed'] = 0: slave['abuse_attitude_revealed'] = 1
1332: 	if slave['passion_fame'] = 1 and $slave_psy_status ! 'broken':
1333: 		if slave['passion_fame_revealed'] = 0: slave['passion_fame_revealed'] = 1
1406: 	if slave['abuse_attitude'] = 2:
```

## interaction_city

```qsp
12774: 		stock['abuse_attitude'] = 2 &! Psi-Masochist
```

## #var_base

```qsp
2511: 	if slave['abuse_attitude'] = 2 and slave['abuse_attitude_revealed'] = 2 and slave['masturbation_rule'] = 0:
2725: 	if slave['abuse_attitude'] = 2 and slave['abuse_attitude_revealed'] = 2 and slave['masturbation_rule'] = 0:
```

## #dynamic

```qsp
580: 		if abuse > 0:        phobia += dynslave['abuse_attitude'] - abuse
666: 		if abuse > 0: interaction_dynslave['phobia'] += dynslave['abuse_attitude']
1217: 		phobia += sex["girl_abuse_attitude"] - abuse
1664: 		if dynslave['abuse_attitude'] = -1: rape_fear += dynslave['temper'] &! hysteric trait increases rape fear proportional to temperament (feels strongly)
1666: 		if dynslave['abuse_attitude'] = 2:  rape_fear -= dynslave['temper'] &! psi-masochist trait decreases rape fear proportional to temperament (feels strongly)
```

## #static_base

```qsp
1625: 		if dynslave['abuse_xp'] > 50 and dynslave['abuse_attitude'] = 0: dynslave['abuse_attitude'] = 2 &! Psi-masochist (cannot replace Hysteric)
1675: 		if dynslave['abuse_attitude_revealed'] = 1 and dynslave['abuse_attitude'] ! 0:
1676: 			if dynslave['abuse_attitude'] = 2: msg '<<$Пси_мазохистка>>'
1677: 			if dynslave['abuse_attitude'] = -1: msg '<<$Истеричка>>'
1678: 			dynslave['abuse_attitude_revealed'] = 2
1679: 		elseif dynslave['abuse_attitude'] = 0:
1680: 			dynslave['abuse_attitude_revealed'] = 0
1755: 		if dynslave['passion_fame_revealed'] = 1 and dynslave['passion_fame'] ! 0:
1756: 			if dynslave['passion_fame'] = 1: msg '<<$Тщеславная>>'
1757: 			if dynslave['passion_fame'] = -1: msg '<<$Хикикомори>>'
1758: 			dynslave['passion_fame_revealed'] = 2
1759: 		elseif dynslave['passion_fame'] = 0:
1760: 			dynslave['passion_fame_revealed'] = 0
2125:         if dynslave['abuse_attitude'] = 2 and (dynslave['abuse_attitude_revealed'] = 2 or spell_revelio = 1):
2126:             $dynslave_features_list += '<a href="EXEC: msg $Пси_мазохистка"><<dyneval($vb_cycle_skill, 2, "심리피학 성애자")>></a><br>'
2127:             if dynslave['abuse_attitude_revealed'] = 2: dynslave['neg_abuse'] = 0
2129:         if dynslave['abuse_attitude'] = -1 and (dynslave['abuse_attitude_revealed'] = 2 or spell_revelio = 1):
2130:             $dynslave_features_list += '<a href="EXEC: msg $Истеричка"><<dyneval($vb_cycle_skill, 3, "연극성 인격장애")>></a><br>'
2191:         if dynslave['passion_fame'] = 1 and (dynslave['passion_fame_revealed'] = 2 or spell_revelio = 1):
2192:             $dynslave_features_list += '<a href="EXEC: msg $Тщеславная"><<dyneval($vb_cycle_skill, 3, "인지욕구")>></a><br>'
2194:         if dynslave['passion_fame'] = -1 and (dynslave['passion_fame_revealed'] = 2 or spell_revelio = 1):
2195:             $dynslave_features_list += '<a href="EXEC: msg $Хикикомори"><<dyneval($vb_cycle_skill, 2, "은둔형 외톨이")>></a><br>'
2196:             if dynslave['passion_fame_revealed'] = 2: dynslave['pos_praise'] = 0
```

## #static_txt

```qsp
1357: ! JO9 MOD START TRAIT_DESC_45 | 2026-10-16_trait_descriptions_woman | $Пси_мазохистка = #txt_woman
1358: $Пси_мазохистка = ' 당신은 당신 노예가 모욕당하고 말로 학대당할 때 비뚤어진 쾌락을 느낀다는 걸 알아차린다. 욕설과 협박은 아무 소용이 없고, 오히려 그녀의 나쁜 행동만 더 부추길 뿐이다. 더 거친 제재를 써야 한다.'
1360: ! JO9 MOD START TRAIT_DESC_46 | 2026-10-16_trait_descriptions_woman | $Истеричка = #txt_woman
1361: $Истеричка = ' 타인의 관심은 당신 노예에게 엄청나게 중요하다. 그녀는 언제나 주목의 중심에 있고 싶어 하고, 칭찬을 갈망한다. 말로 하는 격려는 특히 효과적일 것이다.'
1420: ! JO9 MOD START TRAIT_DESC_66 | 2026-10-16_trait_descriptions_woman | $Тщеславная = #txt_woman
1421: $Тщеславная = ' 당신은 노예가 사람들 사이에서 활짝 살아나는 걸 알아차린다. 그녀는 분명 주목의 중심에 서는 걸 좋아하고, 끊임없이 떠든다. 도시 데이트는 아주 효과적인 보상이 될 것이다.'
1423: ! JO9 MOD START TRAIT_DESC_67 | 2026-10-16_trait_descriptions_woman | $Хикикомори = #txt_woman
1424: $Хикикомори = ' 당신 노예는 낯선 사람을 피하고, 공개된 장소에 있는 걸 즐기지 않는다는 걸 알게 된다. 보아하니 그녀가 원하는 건 그저 네 벽 안에 틀어박혀 아무 데도 나가지 않는 것뿐이다. 데이트는 그녀에게 끝없는 스트레스가 될 것이다.'
```

## interaction.relations

```qsp
232:  if slave["passion_fame"] = -1:  prise_potence = prise_potence/2
257:  if slave["passion_fame"] ! 0 and slave["passion_fame_revealed"] = 0: slave["passion_fame_revealed"] = 1
275:  if slave["passion_fame"] = -1:  prise_potence = prise_potence/2
278:  if slave["passion_fame"] > 0:  prise_potence += prise_potence
304:  if slave["passion_fame"] ! 0 and slave["passion_fame_revealed"] = 0: slave["passion_fame_revealed"] = 1
```

## master_love

```qsp
32: 	- abuse_attitude = -1		|- masochism = 2				| - Лоли или девушка	|	-нет любви к ассист.|	- nymphomania = 1 		| - courage = -1
33: 	- perversion = -1			|- abuse_attitude = 2		| 						|						|   - perversion = 2 		| - passion_fame = -1
71: if slave1["abuse_attitude"] = -1 or slave1["perversion"] = -1 or slave1["masochism"] = -1 or slave1["nymphomania"] = -1 or slave1["exhibitionism"] = -1 or slave1["compassion"] = 1:
137: if slave1["masochism"] = 2 or slave1["abuse_attitude"] = 2 or slave1["deprivation_attitude"] = 2 or slave1["compassion"] = -1:
160: if slave1["courage"] = -1 or slave1["passion_fame"] = -1 or slave1["selfesteem"] = -1:
```

## get_demo_slave

```qsp
109: slave["abuse_attitude"] = seed_abuse_attitude[slave_type]
```

## get_special_slave

```qsp
103: slave["abuse_attitude"] = seed_abuse_attitude[slave_type]
```

## #txt_woman

```qsp
982: $Пси_мазохистка = ' 당신은 당신 노예가 모욕당하고 말로 학대당할 때 비뚤어진 쾌락을 느낀다는 걸 알아차린다. 욕설과 협박은 아무 소용이 없고, 오히려 그녀의 나쁜 행동만 더 부추길 뿐이다. 더 거친 제재를 써야 한다.'
983: $Истеричка = ' 타인의 관심은 당신 노예에게 엄청나게 중요하다. 그녀는 언제나 주목의 중심에 있고 싶어 하고, 칭찬을 갈망한다. 말로 하는 격려는 특히 효과적일 것이다.'
1003: $Тщеславная = ' 당신은 노예가 사람들 사이에서 활짝 살아나는 걸 알아차린다. 그녀는 분명 주목의 중심에 서는 걸 좋아하고, 끊임없이 떠든다. 도시 데이트는 아주 효과적인 보상이 될 것이다.'
1004: $Хикикомори = ' 당신 노예는 낯선 사람을 피하고, 공개된 장소에 있는 걸 즐기지 않는다는 걸 알게 된다. 보아하니 그녀가 원하는 건 그저 네 벽 안에 틀어박혀 아무 데도 나가지 않는 것뿐이다. 데이트는 그녀에게 끝없는 스트레스가 될 것이다.'
```

## jo9_chaotic

```qsp
77:  if jo9ceactor['abuse_attitude'] = -1:
78:   $jo9_chaotic_keys[jo9_chaotic_count] = 'abuse_attitude'
79:   $jo9_chaotic_labels[jo9_chaotic_count] = '연극성 인격장애'
182:  if instr('|grace|dexterity|sport_affinity|masochism|exhibitionism|meekness|selfesteem|abuse_attitude|darkness_attitude|blood_attitude|fire_attitude|water_attitude|vermin_attitude|deprivation_attitude|', '|' + $args[0] + '|') > 0: jo9ceactor[$args[0] + '_revealed'] = 0
```
