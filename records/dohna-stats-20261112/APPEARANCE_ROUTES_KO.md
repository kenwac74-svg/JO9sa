# 등장·영입 경로 감사

현재 WORK 기준. JSON 번호와 같은 대사 인덱스만 찾은 것이 아니라 메뉴→상수→장면 조건→special_stock→generate_stock→역할 이동까지 대조했다. #txt_man의 voice_fragment_ids 숫자는 캐릭터 번호가 아니므로 제외했다.

## 복제11명

공통 경로: 팔라티노 언덕의 쿨라 상점 → 히토카리 의뢰 ($KulaShop_options[3]). 최초 영입 여부 플래그0,3,000스파크 이상,현재 slave 칸이 비어 있어야 한다.

| 번호 | 이름 | interaction_city | 1회 영입 플래그 | 실제 메뉴 상수 | 판정 |
|---|---|---|---|---|---|
| 8886 | 이누이 | 6245 | Inui | menu_buyInui | 직접 영입 경로 있음 |
| 8890 | 리리에 | 6248 | Ririe | menu_buyRirie | 직접 영입 경로 있음 |
| 8891 | 쿄카 | 6249 | Kyoka | menu_buyKyoka | 직접 영입 경로 있음 |
| 8892 | 노에루 | 6250 | Noelle | menu_buyNoelle | 직접 영입 경로 있음 |
| 8893 | 미루키 | 6251 | Miruki | menu_buyMiruki | 직접 영입 경로 있음 |
| 8894 | 타마키 | 6252 | Tamaki | menu_buyTamaki | 직접 영입 경로 있음 |
| 8895 | 치하루 | 6253 | Chiharu | menu_buyChiharu | 직접 영입 경로 있음 |
| 8896 | 후미 | 6254 | Fumi | menu_buyFumi | 직접 영입 경로 있음 |
| 8897 | 사나 | 6255 | Sana | menu_buySana | 직접 영입 경로 있음 |
| 8898 | 나나미 | 6256 | Nanami | menu_buyNanami | 직접 영입 경로 있음 |
| 8899 | 슈코 | 6257 | Shuko | menu_buyShuko | 직접 영입 경로 있음 |

## 전체23명

### 8877 메디코

메뉴: #options:4185; 영입: interaction_city:12078; menu_item.json의 menu_buymedico=6236.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyMedico, menu_BuyMedico, '메디코 ($3000)')
if interaction_city = 6236:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8877
	show_stock_fullimage = 1	
	
	gs 'generate_stock'	
	gs 'stock_to_slave_nogt'


	slave['brand'] = 0
	sparks -= 3000
	medico = 1
! JO9 MOD START J9M0798 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;도심 뒷골목에서 발견했어요 여행트렁크에 담겨있었는데 냄새가 좀 나서 씻겨뒀어요.</div>'
! JO9 MOD END J9M0798
end
```

### 8878 포르노

메뉴: #options:4167; 영입: interaction_city:12098; menu_item.json의 menu_buyporno=6237.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyPorno, menu_BuyPorno, '포르노 ($3000)')
if interaction_city = 6237:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8878
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'
	
	slave['brand'] = 0
	sparks -= 3000
	porno = 1
! JO9 MOD START J9M0797 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;공원화장실에 처박혀있는걸 데려왔어요 숨은 잘 쉬고있으니 걱정마세요.</div>'
! JO9 MOD END J9M0797
end
```

### 8879 키라키라

메뉴: #options:4176; 영입: interaction_city:12116; menu_item.json의 menu_buykirakira=6238.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyKirakira, menu_BuyKirakira, '키라키라 ($3000)')
if interaction_city = 6238:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8879
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	kirakira = 1
! JO9 MOD START J9M0796 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;부둣가에서 찾았어요 푹 젖은게 바닷속에 빠졌나봐요.</div>'
! JO9 MOD END J9M0796
end
```

### 8880 츠이나

메뉴: #options:4234; 영입: interaction_city:12135; menu_item.json의 menu_buytsuina=6239.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyTsuina, menu_BuyTsuina, '츠이나 ($3000)')
if interaction_city = 6239:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8880
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	tsuina = 1
! JO9 MOD START J9M0795 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;플랫의 거점에 있던걸 데려왔어요 꽤 거칠게 다뤄진거같은데 멀쩡한게 꽤나 튼튼하네요.</div>'
! JO9 MOD END J9M0795
end
```

### 8881 야미

메뉴: #options:4204; 영입: interaction_city:12153; menu_item.json의 menu_buyyammy=6240.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyYammy, menu_BuyYammy, '야미 ($3000)')
if interaction_city = 6240:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8881
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	yammy = 1
! JO9 MOD START J9M0794 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;겨우 찾았더니 전력으로 반항해서 꽤 고생했어요 그래도 쿠마에게 간다니까 순순히 잡히더라구요. </div>'
! JO9 MOD END J9M0794
end
```

### 8882 안테나

메뉴: #options:4194; 영입: interaction_city:12171; menu_item.json의 menu_buyantenna=6241.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyAntenna, menu_BuyAntenna, '안테나 ($3000)')
if interaction_city = 6241:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8882
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	antenna = 1
! JO9 MOD START J9M0793 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;뭐하는 꼬맹이길래 연구소에 구속되있는거에요? 꺼내오는데 꽤 힘들었어요.</div>'
! JO9 MOD END J9M0793
end
```

### 8883 아리스

메뉴: #options:4213; 영입: interaction_city:12189; menu_item.json의 menu_buyalyce=6242.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyAlyce, menu_BuyAlyce, '아리스 ($3000)')
if interaction_city = 6242:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8883
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	alyce = 1
! JO9 MOD START J9M0792 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;오빠에게 데려다준다니 순순히 따라오더라구요.</div>'
! JO9 MOD END J9M0792
end
```

### 8884 미스트레스

메뉴: #options:4243; 영입: interaction_city:12207; menu_item.json의 menu_buymist=6243.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyMist, menu_BuyMist, '미스트레스 ($3000)')
if interaction_city = 6243:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8884
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	mist = 1
! JO9 MOD START J9M0791 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;꼭꼭 숨어있었는데 겨우 찾았어요.</div>'
! JO9 MOD END J9M0791
end
```

### 8885 조커

메뉴: #options:4222; 영입: interaction_city:12225; menu_item.json의 menu_buyjoker=6244.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyJoker, menu_BuyJoker, '조커 ($3000)')
if interaction_city = 6244:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8885
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	joker = 1
! JO9 MOD START J9M0790 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[제작자]<br>&nbsp;: 남캐로 설정이 불가능해서 여자입니다.....</div>'
! JO9 MOD END J9M0790
end
```

### 8886 이누이

메뉴: #options:4270; 영입: interaction_city:12243; menu_item.json의 menu_buyInui=6245.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyInui, menu_BuyInui, '이누이 ($3000)')
if interaction_city = 6245:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8886
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Inui = 1
! JO9 MOD START J9M0789 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;이누이.</div>'
! JO9 MOD END J9M0789
end
```

### 8887 시온

메뉴: #options:4252; 영입: interaction_city:12261; menu_item.json의 menu_buyzion=6246.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyZion, menu_BuyZion, '시온 ($3000)')
if interaction_city = 6246:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8887
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	zion = 1
! JO9 MOD START J9M0788 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;시온.</div>'
! JO9 MOD END J9M0788
end
```

### 8888 린

메뉴: #options:4280; 영입: interaction_city:12280; menu_item.json의 menu_buyrin=6247.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyRin, menu_BuyRin, '린 ($3000)')
if interaction_city = 6247:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8888
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	rin = 1
! JO9 MOD START J9M0787 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;린.</div>'
! JO9 MOD END J9M0787
end
```

### 8889 키쿠치요

메뉴: #options:2331; 영입: interaction_city:12546; menu_item.json의 menu_buyKikuchiyo=6261.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyKikuchiyo, menu_buyKikuchiyo, '키쿠치요 ($3000)')
if interaction_city = 6261:
	npc = 1
	$npc_id = 'bararaika'
	$place = 'smugglers_den'
	$return_lock = 'shop_general'

	special_stock = 8889
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave' 

	slave['brand'] = 0
	sparks -= 3000
	Kikuchiyo = 1
! JO9 MOD START J9M0773 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[발랄라이카]<br>&nbsp;아 이거? 안개괴물하고 좋은 승부를 펼치던 걸. 결국 졌지만, 쓸만해 보여서 구해왔지. 필요하면 스파크 내고 데려가도록 해.</div>'
! JO9 MOD END J9M0773
end
```

### 8890 리리에

메뉴: #options:4307; 영입: interaction_city:12299; menu_item.json의 menu_buyRirie=6248.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyRirie, menu_BuyRirie, '리리에 ($3000)')
if interaction_city = 6248:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8890
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Ririe = 1
! JO9 MOD START J9M0786 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;리리에.</div>'
! JO9 MOD END J9M0786
end
```

### 8891 쿄카

메뉴: #options:4316; 영입: interaction_city:12318; menu_item.json의 menu_buyKyoka=6249.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyKyoka, menu_BuyKyoka, '쿄카 ($3000)')
if interaction_city = 6249:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8891
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Kyoka = 1
! JO9 MOD START J9M0785 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;쿄카.</div>'
! JO9 MOD END J9M0785
end
```

### 8892 노에루

메뉴: #options:4289; 영입: interaction_city:12337; menu_item.json의 menu_buyNoelle=6250.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyNoelle, menu_BuyNoelle, '노에루 ($3000)')
if interaction_city = 6250:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8892
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Noelle = 1
! JO9 MOD START J9M0784 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;노에루.</div>'
! JO9 MOD END J9M0784
end
```

### 8893 미루키

메뉴: #options:4298; 영입: interaction_city:12356; menu_item.json의 menu_buyMiruki=6251.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyMiruki, menu_BuyMiruki, '미루키 ($3000)')
if interaction_city = 6251:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8893
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Miruki = 1
! JO9 MOD START J9M0783 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;미루키.</div>'
! JO9 MOD END J9M0783
end
```

### 8894 타마키

메뉴: #options:4345; 영입: interaction_city:12375; menu_item.json의 menu_buyTamaki=6252.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyTamaki, menu_BuyTamaki, '타마키 ($3000)')
if interaction_city = 6252:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8894
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Tamaki = 1
! JO9 MOD START J9M0782 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;타마키.</div>'
! JO9 MOD END J9M0782
end
```

### 8895 치하루

메뉴: #options:4325; 영입: interaction_city:12394; menu_item.json의 menu_buyChiharu=6253.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyChiharu, menu_BuyChiharu, '치하루 ($3000)')
if interaction_city = 6253:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8895
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Chiharu = 1
! JO9 MOD START J9M0781 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;치하루.</div>'
! JO9 MOD END J9M0781
end
```

### 8896 후미

메뉴: #options:4334; 영입: interaction_city:12413; menu_item.json의 menu_buyFumi=6254.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyFumi, menu_BuyFumi, '후미 ($3000)')
if interaction_city = 6254:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8896
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Fumi = 1
! JO9 MOD START J9M0780 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;후미.</div>'
! JO9 MOD END J9M0780
end
```

### 8897 사나

메뉴: #options:4372; 영입: interaction_city:12432; menu_item.json의 menu_buySana=6255.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuySana, menu_BuySana, '사나 ($3000)')
if interaction_city = 6255:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8897
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Sana = 1
! JO9 MOD START J9M0779 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;사나.</div>'
! JO9 MOD END J9M0779
end
```

### 8898 나나미

메뉴: #options:4354; 영입: interaction_city:12451; menu_item.json의 menu_buyNanami=6256.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyNanami, menu_BuyNanami, '나나미 ($3000)')
if interaction_city = 6256:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8898
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Nanami = 1
! JO9 MOD START J9M0778 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;나나미.</div>'
! JO9 MOD END J9M0778
end
```

### 8899 슈코

메뉴: #options:4363; 영입: interaction_city:12470; menu_item.json의 menu_buyShuko=6257.

```qsp
			func('$menu', 'interaction_city', $menu_item_BuyShuko, menu_BuyShuko, '슈코 ($3000)')
if interaction_city = 6257:
	npc = 1
	$npc_id = 'kula'
	$place = 'kulashop'
	$return_lock = 'shop_general'

	special_stock = 8899
	
	gs 'generate_stock'
	dynamic $swap_slave_instances, 'stock', 'slave'

	slave['brand'] = 0
	sparks -= 3000
	Shuko = 1
! JO9 MOD START J9M0777 | 2026-10-09_dialogue_format_and_protagonist | changed block; context may be included
	$text[1] = '[쿨라]<br>&nbsp;슈코.</div>'
! JO9 MOD END J9M0777
end
```

## 별도 발견·미수정

조커의 구매 버튼은 #options에서 jokr=0을 확인하지만 영입 장면은 joker=1을 기록한다. 재구매 차단 변수 불일치가 있다. 이번 사용자가 요청한 초기 능력 조정·등장 조사 범위에서 QSP를 고치지는 않았다. 등장 코드가 있다는 것은 고유 개인 이벤트 전체가 완성됐다는 의미는 아니다.
