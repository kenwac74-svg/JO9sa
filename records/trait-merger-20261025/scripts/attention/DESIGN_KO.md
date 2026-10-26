# 주목욕구 통합: 현행 독자·작성자 목록과 최소 설계

읽기 전용 설계 조사, 2026-10-25. WORK나 G: 파일은 수정하지 않았다. 기준은 `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`, SHA-256 `09c12dec13870967f558a830981604c7b65f199da3824e7a519f5f95285f6e14`. 줄 번호는 복호화한 각 로케이션 본문 1기준이다. 전수 원문은 `inventory.md` 및 `inventory.json`, 재현 스크립트는 `inventory.cjs`다. raw key가 들어간 122줄과 이름·설명 별칭을 포함한 총139줄을 확인했다.

## 최소 통합 모델

권장 표시명은 **주목욕구**. 기존 특성 효과를 한 특성으로 합치되 양쪽 반대 특성을 따로 유지한다. 기존 세이브를 순회해 값을 고치는 마이그레이션은 필요 없다.

```text
attention = jo9_attention=1 OR abuse_attitude=-1 OR passion_fame=1
psi       = abuse_attitude=2
recluse   = passion_fame=-1
abuse_effect = attention AND abuse_attitude IN {-1,0} ? -1 : abuse_attitude
fame_effect  = attention AND passion_fame IN {0,1} ? 1 : passion_fame
```

`jo9_attention`은 새 생성·명시적 편집용 단일 저장키다. 기존 두 키의 주목욕구 값은 읽기 호환 별칭으로 계속 인정한다. 별도의 새 로케이션 없이 기존 `jo9_traits`에 순수 계산 모드를 추가하면 된다. 숫자 입력을 받는 helper면 `dynslave` 치환·slave1 복제·조수에도 같은 식을 쓸 수 있다. 계산 helper는 어떤 저장값도 변경하지 않는다.

단일 canonical 키가 필요한 이유: 기존 raw `(abuse=2,fame=-1)`에 주목욕구를 추가할 때 두 반대 특성을 보존하려면 저장할 자리가 없다. 새 키 없이 구현하면 한 반대 특성을 덮어쓰거나 새 부여를 금지해야 한다. canonical bool과 기존 방식에 맞춘 `jo9_attention_known` 0/1/2 하나가 가장 작은 완전한 표현이다. 이 키는 요청한 통합 기능에 필요한 상태이며 기존 저장 데이터를 일괄 변환하지 않는다.

### 기존 조합의 읽기 결과

| 기존 abuse | 기존 fame | 주목욕구 | abuse_effect | fame_effect | 유지되는 다른 특성 |
|---:|---:|---:|---:|---:|---|
| 0 | 0 | 0 | 0 | 0 | 없음 |
| -1 | 0 | 1 | -1 | 1 | 없음 |
| 0 | 1 | 1 | -1 | 1 | 없음 |
| -1 | 1 | 1 | -1 | 1 | 없음, 중복 보너스 없음 |
| 2 | 1 | 1 | 2 | 1 | 심리피학 |
| -1 | -1 | 1 | -1 | -1 | 은둔형 외톨이 |
| 2 | -1 | 0 | 2 | -1 | 심리피학+은둔형 외톨이 |
| 2 | -1, canonical=1 | 1 | 2 | -1 | 세 특성 모두 |

주목욕구의 공통 칭찬 반응은 위 교차조합에서도 작동한다. 같은 반응영역에서 충돌하는 효과만 기존 반대값이 우선한다. 따라서 심리피학은 언어압박 저항·면역을 유지하고 은둔형 외톨이는 공개장소 보상 감점을 유지한다. 반대 특성이 있는 인물에게 주목욕구가 생겼다고 그 반대 특성을 삭제하지 않는다. 단순히 raw 키를 서로 대입하는 구현은 금한다.

raw `abuse=1`과 `fame=2`도 현행 생성기에서 나올 수 있다(`generate_stock:1285,1295`). 주목욕구가 없는 경우 이 수치는 그대로 계산한다. 특히 `fame=2`는 표시·정확히1 조건에는 안 걸려도 격려+10과 데이트 양수배율에 영향을 준다. 이 별도 이상값을 저장 정규화하는 변경은 범위 밖이다. 실제 구현에서는 주목욕구를 함께 보유해도 abuse=1, fame=2 및 그 밖의 비표준 값을 그대로 계산한다. 통합축 효과는 원래 attention값과0에만 적용한다.

## 실제 효과 독자

| 위치 | 현행 동작 | 통합 시 조치 |
|---|---|---|
| `chose_answer:19–20` | fame=1 요구 대사 후보 | fame_effect=1로 읽기 |
| `chose_answer:143–147` | recluse 싫음, abuse=-1 싫음 | recluse raw 유지, abuse_effect=-1로 읽기 |
| `interaction:971` | 격려에 fame*5 | fame_effect*5 |
| `interaction:995` | 협박에 -abuse*5 | abuse_effect*5 |
| `interaction:5990,6008,6030,6050` | 도시/해변/극장/식당 recluse 보상1/2 | raw recluse 유지 |
| `interaction:6011,6032` | 해변·극장 fame>0 보상2배 | fame_effect>0로 읽기 |
| `interaction:6716,6727,6738` | 두 특성 중 하나면 칭찬 반복감쇠 면제 | attention 단일 판정 |
| `interaction:6750,6772` | abuse=-1이면 미이행 약속에 대한 실망 분기 면제 | attention 단일 판정(공통 칭찬 반응) |
| `interaction_result:1326–1337` | 두 trait 블록이 기분+potence를 각각 더함; 기억은 level,2 각각 증가 | 단일 attention 블록, 기분+potence 한번, pos_praise+=max(level,2) 한번 |
| `interaction_result:148–151` | abuse<0 성장-2, psi 성장+2, psi 아닌 경우 부정 기억 | abuse_effect로 음수 판정; psi 조건은 raw 유지 |
| `#dynamic:580` | diligence phobia에 abuse-abuse_intensity | abuse_effect 사용 |
| `#dynamic:666` | torture phobia에 abuse | abuse_effect 사용 |
| `#dynamic:1217` | 구형 sex snapshot의 girl_abuse_attitude | 아래 별도 주의사항 |
| `#dynamic:1664,1666` | abuse=-1이면 fear+temper, psi이면 -temper | abuse_effect=-1, raw psi 각각 유지 |
| `next_day:4343–4345` | abuse=-1이면 부정반응2배,1이면1/2,psi이면0 | abuse_effect 사용; raw psi 면역0 우선 |
| `interaction:11472–11474` | 위 부정반응 조수 버전 | 동일 |
| `master_love:71` | abuse=-1이 특정 감정유형 후보 자격 | abuse_effect=-1로 읽기(언어압박 성향에서 유래한 기존 유형 자격) |
| `master_love:137,160` | psi, recluse가 별도 유형 후보 | raw 유지 |
| `next_day:1451` | psi의 미보상 악영향 면제 | raw 유지 |
| `interaction:6796,6810,6829,6848,6868` | psi의 울음 소리 억제 | raw 유지 |
| `interaction_result:1406` | psi 반응문·소리 분기 | raw 유지 |
| `#var_base:2511,2725` | psi와 발견상태·명령 조건 조합 | raw 유지 |

기분 보너스 중복 제거는 수치 변경이다. 원래 두 특성을 모두 가진 인물은 기본 기분효과 외에 추가 기분+potence가 두 번 들어갔다. 통합 후에는 양쪽 별칭 수와 무관하게 추가 한 번이다. `pos_praise`도 같은 저장목적의 보정이므로 `max(level,2)` 한 번을 권한다. `level+2`는 중복을 남기는 방식이다. 약속 단계 level3의 기존 hysteric 효과를 지키려면 무조건+2로 고정하면 안 된다.

### 조수·관계 화면의 같은 효과

- `interaction:10560,10609,10612`: 삼인 식당·해변, recluse1/2 및 fame 양수2배.
- `interaction:11120,11123,11152,11154,11182`: 조수 해변·극장·식당, 위와 같음.
- `interaction.relations:232,275,278`: 관계 화면의 보상 계산, 위와 같음.
- 발견 플래그 작성자: `interaction:5994,6015,6035,6056,10585,10637,11141,11170,11202,11343`; `interaction.relations:257,304`; `interaction_result:150,1327,1333`.

발견 writer는 아직 존재하지 않는 반대 raw 키를 만들어서는 안 된다. 합친 효과가 관찰됐으면 canonical attention의 revealed=1을 표시하고, 실제 보유한 기존 별칭만 필요한 경우 드러내면 된다. psi/recluse 발견은 원래 raw revealed를 그대로 쓴다.

### 구형 snapshot 주의

`#dynamic:1217`의 `sex['girl_abuse_attitude']`는 현재 전체 QSP에서 **유일한 등장**이다. 현행 `sex_initiate:90–93`와 조수 대응부는 몇몇 특성만 직접 복사하며 abuse 키를 쓰지 않는다. snapshot을 새로 초기화하는 `sex_initiate:26` killvar 뒤에도 writer가 없다. 따라서 지금 정상 작동하는 주목욕구 효과라고 보고하면 안 된다. 최소 통합에서는 이 dormant reader를 건드리지 않아도 기존 동작을 보존한다. 해당 구형 경로까지 완성하려면 새 snapshot 대입이 별도 동작 확장이 된다는 점을 기록한다.

## 작성자와 유지해야 할 저장 경로

| 위치 | 작성 내용 |
|---|---|
| `generate_stock:1285,1295` | 두 enum 랜덤추첨 |
| `generate_stock:1437–1438` | 테스트/cheat_l 생성 보정 |
| `generate_stock_maximum_testing:240–241` | 테스트 stock 양쪽0 |
| `get_stock_seed:173–174,191–192` | seed 값·발견상태 복사 |
| `get_demo_slave:109`, `get_special_slave:103` | seed abuse 복사 |
| `interaction_city:12774` | 특정 stock에 psi=2 부여 |
| `#static_base:1625` | abuse_xp>50이고 abuse0이면 psi=2 습득 |
| `menu_form:4067–4074` | psi→hysteric→neutral→psi raw cycle |
| `menu_form:4157–4164` | fame→recluse→neutral→fame raw cycle |
| `jo9_chaotic:77–82,179–182` | abuse=-1만 제거후보, 선택된 raw0·xp0·revealed0 |

새 생성에서는 주목욕구를 canonical 한 특성으로만 쓴다. 기존 enum 추첨에서 -1 abuse 또는 +1 fame이 나왔을 때 canonical1로 모으고 그 **새로 생성중인 stock의 해당 attention 별칭만**0으로 만들면 기존 확률을 보존하면서 중복 저장을 없앨 수 있다. seed/clone/이미 존재하는 인물에 범용 정규화를 걸지 않는다. 현행 원본 추첨을 그대로 활용하면 합집합 확률은 47/576(약8.16%)이며 새 별도 rand가 불필요하다.

습득부 `#static_base:1625`는 canonical 또는 fame별칭의 주목욕구 보유자도 원래 hysteric 보유자처럼 psi로 자연 전환되지 않게 `attention=0`을 확인한다. 이미 psi인 세이브는 그대로 유지한다. 강제로 psi를 부여하는 story/명시적 편집은 attention을 덮어쓰지 않는다.

편집 메뉴에서는 세 항목을 명시적으로 나눈다: 주목욕구 on/off, 심리피학 on/off, 은둔형 외톨이 on/off. 기존 두 cycle을 남겨놓으면 하나의 trait가 두 번 나오고 한 cycle 조작이 다른 trait를 지운다. 기존 raw attention 별칭을 반대 특성으로 덮어쓰는 명시적 편집에서는 먼저 attention·발견상태를 canonical로 옮겨 논리적 trait를 보존한다.

카오틱 에센스는 통합 attention을 **한 제거후보**로 센다. 사용자가 명시적으로 제거한 경우만 canonical 및 attention값인 두 별칭을0으로 만든다. psi=2/recluse=-1은 유지한다. 이렇게 하지 않으면 아이템을 쓰고도 다른 별칭 때문에 주목욕구가 남거나 중복 추첨된다. 표시등급은 기존 둘 모두3이므로 통합도3이며 기존 부정 후보 hysteric의 통합 후 라벨을 주목욕구로 바꾼다. 이제 옛 fame 단독 인물도 동일 통합 특성으로 제거 가능해지는 변화가 생긴다.

## 표시·설명·발견

- 단일 일반 표시: `#static_base:2129–2131`를 canonical/별칭 합집합 조건으로 교체하고 `2191–2193`의 두 번째 양수행을 제거한다. psi행2125–2127, recluse행2194–2196는 유지한다.
- 하나의 공개상태는 canonical revealed2 OR 실제보유 abuse별칭 revealed2 OR 실제보유 fame별칭 revealed2 OR spell_revelio로 판단한다. 없는 별칭의 stale revealed가 trait를 드러내면 안 된다.
- 발견 알림: `#static_base:1675–1681,1755–1761`에서 같은 attention의 팝업을 두 번 띄우지 않는다. canonical reveal 처리에서 한 번 표시하고 실제보유 별칭을 discovered로 승격한다. 이미 하나가 공개된 인물은 나머지 별칭이 나중에 발견되어도 재알림하지 않는다.
- 설명 원문: `#static_txt:1361,1421`와 `#txt_woman:983,1003`. 새 설명은 주목/칭찬과 사회적 보상, 언어압박 민감성을 함께 서술한다. 둘을 같은 설명 별칭으로 연결해 외부 호출을 보존한다.
- 반대 설명: `#static_txt:1358,1424`, `#txt_woman:982,1004`는 유지한다.
- `#static_base:2196`의 공개된 recluse가 pos_praise를0으로 만드는 부작용은 반대축 의미의 일부다. attention과 교차한 legacy 인물에도 계속 적용되므로 단순 표시 코드라고 삭제하면 안 된다.

## 검증 항목

1. canonical on/off × raw abuse{-1,0,1,2} × raw fame{-1,0,1,2} 계산표 검사; 기존 세이브 raw가 조회·로드만으로 바뀌지 않는지 확인.
2. 구형 둘 동시보유와 canonical+별칭 중복보유가 칭찬기분·기억을 한번만 적용하는지 실제 엔진 분기 검사.
3. 양쪽 단독 legacy 인물이 일반 상황에서 동일한 통합효과를 내는지 격려/협박/칭찬/데이트/언어압박 비교.
4. psi/recluse 교차조합의 면역·공개장소 감점·발견·표시를 보존하는지 확인.
5. 일반·조수·slave1·동적dynslave 및 menu_form 편집 경로 확인.
6. 카오틱 후보 count와 제거가 한 특성에 대해 한번 작동하고 반대 trait를 유지하는지 확인.
7. 신규 생성·seed·clone·이미 저장된 인물을 구분하여 기존 값 보존 확인.

이 문서는 설계·독자/작성자 조사다. 게임 적용·엔진 검사를 수행한 결과가 아니다.

## 격리 구현 모듈

`implement.cjs`의 `apply(ctx)`가14개 로케이션에49개의 정확한 치환을 제공한다. `ctx.get(name)`과 `ctx.edit(name,old,new,count)`를 사용하며 G:나 실제 QSP를 쓰지 않는다. 숫자 조회 helper는 순수 조회이고 새 키 작성은 명시적 편집·실제 발견·신규 무작위 생성으로 한정한다. `testCases(ctx)`는29개 QSP 검사 본문과95개 assertion을 제공한다. 이 수는 엔진 통과 결과가 아니라 생성된 검사 수다. 실제 엔진 결과는 상위 통합 검사 보고서를 따른다.

## 최신 사용자 지시: 긍정 우선

이 절이 앞선 교차조합 보존 제안보다 우선한다. attention_repair(role)는 주목욕구가 있는 인물의 passion_fame=-1과 해당 revealed만0으로 만든다. 심리피학 abuse=2, 기타 비표준 값, 주목욕구의 기존 별칭은 보존한다. 조회 helper는 repair 전까지 순수 조회를 유지한다. 실제 로드·프로필 정리는 상위 공통 dispatcher가 호출하며 저장 파일을 직접 고치지 않는다. 신규 주목욕구 편집 부여는 즉시 repair하고, 주목욕구가 있을 때 은둔형 외톨이를 새로 넣는 편집은 거부한다. 이미 가진 은둔형 외톨이를 끄는 조작은 허용한다. 현재 검사 생성량은33개 fixture·123개 assertion이다.
