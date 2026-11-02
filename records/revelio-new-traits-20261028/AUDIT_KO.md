# 리벨리스·오베레그 신규 특성 표시 — 독립 전수 감사

대상: 현재 WORK `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`, SHA-256 `972d1b7a8719c9b44e6aca4bfaf5a6f73908240762ce65061a7d298d0aa82679`. QSP 전체 location의 known/revealed/spell 및 특성 목록 표시 참조를 읽고, 공통 UI JavaScript와 현재 명기 생성·상태 경로를 대조했다. 아래 행은 복호화한 location body의 1-based 행이다.

## 결론

**신규 숨김 특성에서 확인된 마법 표시 누락은 이미 지목한 `jo9_traits`의 5개 표시 조건과 구형 활동 fallback 2개뿐이다. 그 외에 추가 수정이 필요한 표시 조건은 찾지 못했다.**

| 누락 위치 | 실제 특성 값 | 현재 발견 조건 | 이번 표시 연결 대상 |
|---|---|---|---|
| `jo9_traits:232` | `jo9_ambition=1` 야심가 | `jo9_ambition_known=1` | 기존 발견 조건 또는 `spell_revelio=1` |
| `:243` | `jo9_focus=1` 끈기 | `jo9_focus_known=1` | 동일 |
| `:244` | `jo9_focus=-1` 산만함 | `jo9_focus_known=1` | 동일 |
| `:245` | `jo9_grudge=1` 옹졸함 | `jo9_grudge_known=1` | 동일 |
| `:246` | `jo9_grudge=-1` 너그러움 | `jo9_grudge_known=1` | 동일 |
| `:240` | `jo9_work_ethic=1` 일벌레, 통합 불가능한 구형 값 조합 | `jo9_work_ethic_known=1` | 동일 |
| `:241` | `jo9_work_ethic=-1` 안분지족, 통합 불가능한 구형 값 조합 | `jo9_work_ethic_known=1` | 동일 |

특성 본체 값 검사는 유지해야 한다. 마법이 활성화되어도 실제 특성 값이 없는 인물에게 이름을 표시하는 변경은 아니다. 표시 조건에서만 우회하고 known/revealed를 쓰지 않으면 새 영구 상태나 세이브 마이그레이션이 필요 없다.

## 모든 신규 특성의 현재 표시 분류

| 분류 | 특성·저장값 | 표시 근거 |
|---|---|---|
| 보유 시 항상 표시 | 천재/백치 `jo9_learning_trait=1/-1` | `#static_base:1933-1934`, `$stock_traits:10-11`, `$newloc:399-400`; 별도 발견 조건 없음 |
| 보유 시 항상 표시 | 구강 선호 `oral_affinity>0`, 반사적 구역질 `jo9_gag_reflex=1`, 항문 선호/혐오 `anal_affinity>0/<0` | `jo9_traits:223-226` |
| 보유 시 항상 표시 | 거센 반항심 `defiant=1`, 노예근성 `jo9_slave_nature=1` | `:228-229` |
| 보유 시 항상 표시 | 선천적 벙어리 `jo9_voice_trait=1` | `:231`; 보류된 값2에 새 표시를 추가하지 않음 |
| 자연 발견 후 표시, 마법 누락 | 야심가, 끈기/산만함, 옹졸함/너그러움 | 위 5개 조건 |
| 자연 발견 또는 마법으로 표시됨 | 통합 활동적/휴식 선호 | `jo9_traits:234-238`, 특히 `:235`에 이미 `activity_known=1 or spell_revelio=1` |
| 구형 fallback에서 마법 누락 | 일벌레/안분지족 | `jo9_traits:239-242`; 정상 통합 활동과 동시에 표시하는 분기가 아님 |
| 보유 시 항상 표시 | 건강체질/약골 `jo9_constitution=1/-1` | `:247-248` |
| 보유 시 항상 표시 | 광전사/성기사/역전의 용사 `jo9_combat_trait=1/2/3` | `:249-251` |
| 보유 시 항상 표시 | 다재다능 `jo9_versatile=1`, 절세미인 `jo9_peerless=1` | `:252/:254` |
| 통합된 기존 숨김 특성, 마법 연결됨 | 관심종자 `jo9_attention` 및 기존 별칭 | `#static_base:2134-2135`: `attention_has=1`이고 `attention_known=2 or spell_revelio=1` |
| 실제 상태 확정 후 아이콘 표시 | 명기 `virginity=4` 및 `jo9_meiki_known` | 다음 절. 별도로 보유가 확정된 특성을 known0 때문에 숨기는 표시 누락이 아님 |

관심종자는 기존 숨김 특성을 통합한 축으로, 활성 인물의 기존 공통 특성 목록에서 이미 마법 우회가 있다. 시장·냉동의 간결 목록은 원래 모든 기존 숨김 특성을 나열하는 경로가 아니다. 이 범위를 새로 늘리거나 `jo9_traits.list`에 관심종자를 추가하면 활성 목록의 중복 표시가 생길 수 있어 이번 누락 수정 대상에 포함하지 않는다.

## 명기의 known은 단순 표시 발견 키와 다름

현재 코드에는 **미리 추첨된 별도의 명기 보유/잠재 값은 있는데 `known=0`이어서 UI만 숨기는 구조가 없다.** `jo9_meiki_known`은 명기 상태를 지속 적용하는 조건으로도 사용된다.

현재 `jo9_meiki_state`의 slave 분기(다른 5개 역할도 같은 구조):

1. `:8-13`: 최초 동기화에서 현재 virginity를 prev로 저장한다. 이미 전환된 상태라면 checked를 설정한다.
2. `:15-17`: **이미 `virginity=4`인 인물은 known=1, checked=1로 동기화**한다. 이 경로에는 리벨리스 조건이 없다.
3. `:22-32`: `prev virginity=0 → 현재 virginity>=2`, checked=0이라는 최초 전환에 도달하고 호출 인자 `args[1]=1`일 때 **그 시점에 5% 추첨**한다. 성공하면 known=1이다. 그 전에 별도 보유 플래그를 읽어 숨김을 해제하는 방식이 아니다.
4. `:36-46`: known=1이며 virginity>=2이면 실제 상태를 `virginity=4`로 바꾸고 기존 초기화 revision에 따라 관련 기술의 최초 보정을 적용한다. 따라서 known을 임의로1로 쓰면 표시만 바꾸는 데 그치지 않는다.
5. `:272-274`: 최초 발견 메시지는 위 추첨 성공에서 local found 표식이 설정되었을 때 표시한다. 기존 `virginity=4` 동기화만으로는 이 found 표식을 새로 설정하지 않는다.

실제 아이콘은 `sjm_UI_UIadds:41-43`(slave), `:151-153`(assistant)에서 **`virginity=4`만 보고 표시**한다. 이 파일은 표시 앞 `:5-10`에서 해당 역할들의 `jo9_meiki_state`를 호출한다. 그러므로 `virginity=4/known=0`이라는 과거 또는 수동 상태가 있어도, known 미발견 때문에 실제 보유 아이콘이 가려지는 경로는 확인되지 않았다.

생성 경로도 `get_stock_seed:265`에서 `stock['virginity']=seed_virginity[stock_type]`를 읽고, 일반 생성은 virginity0/2 등을 설정한다. 현재 WORK의 slaves JSON 전수에서 `seed_virginity=4`인 파일은 0개였다. 이 사실은 과거 세이브나 수동 인물의 상태4를 부정하는 근거는 아니다. 현재 보유 판정과 미추첨 전환 상태를 구별하는 근거다.

`jo9_meiki_willing`의 known·virginity 검사는 동작/효과 사용 조건이고, `next_day:2015`의 known 검사는 영구 상태 보존 조건이다. 이번 표시 수정에서 이들을 바꾸지 않는다. 리벨리스로 known을1로 설정하거나, 추첨을 새로 하거나, virginity를4로 변환하는 것은 이번 범위 밖의 실제 특성 부여/상태 변경이다.

## 좌측 목록과 중앙 확장 UI의 공통 연결

- `$newloc:388-389` → `$slave_traits:16-17` → `#static_base:$update_slave_features_list`가 활성 인물의 공통 목록을 만든다. 신규 특성은 `#static_base:1937`에서 `jo9_traits.list`를 호출한다.
- `slave_stat:131`, `assistant_stat:112`는 각자의 동일 features_list를 `jo9_traits_view.sidebar`에 전달한다.
- `jo9_traits_view:30/:38/:91-95`는 이미 만들어진 목록을 source로 출력한다. `content/js/jo9_traits_view.js:12/:24/:45/:97`은 그 source DOM을 복제해 좌측과 확장 목록을 구성한다. known/revealed/spell을 다시 판정하는 별도 JS 조건은 없다.
- 따라서 `jo9_traits.list`의 7개 조건을 수정하면 좌측·중앙 확장에 같은 결과가 전달된다. 별도 JS 분기나 영구 발견 동기화는 필요 없다.
- 같은 list 호출은 `$stock_traits:14`, `$newloc:403`의 냉동 인물 목록, 현재 위탁 probe `jo9_farid_consignment:104`에도 연결되어 있다. 해당 화면 자체의 기존 진입·왕관·간결 표시 규칙은 유지한다.
- 감옥·축사·조수실·냉동실·교육 및 선택 화면은 기존 features_list를 출력한다. 별도로 같은 신규 숨김 특성을 직접 판정하는 추가 표시 조건은 찾지 못했다.

## 임시 마법 표시와 영구 자연 발견의 분리

- 리벨리스는 `interaction:441-445`에서 비용40과 함께 `spell_revelio=1`을 설정한다. `next_day:4703`에서0으로 돌아간다.
- 오베레그 착용/해제는 `#item_base:364-372`에서 같은 플래그와 obereg_on을 설정한다. `$newloc:370`은 착용 중이면 spell_revelio=1을 유지한다. 새 마법 상태 키는 필요 없다.
- 자연 발견은 `jo9_traits_personality:92-95`(야심가), `:99-108`(활동), `:111-126`(집중), `:149-159`(기억 성향) 등의 실제 행동/경험 경로가 각 known을 쓴다. 이 경로는 그대로 둔다.
- 관심종자의 자연 관찰·확정은 `jo9_traits:694-705`, `#static_base:1680-1684`에 있다. 임시 마법 표시 때문에 confirm을 호출하거나 known을2로 바꾸지 않는다.
- `jo9_traits_combat:31-32`의 `health_issues_revealed`는 체질 시술의 검진 선행 조건이다. 특성 이름의 숨김 조건이 아니므로 마법으로 의료 조건을 우회하는 변경에 포함하지 않는다.
- 일반 기존 특성들의 revealed 조건은 이미 `#static_base:1991-2204`에서 spell_revelio 우회를 사용한다. 일부 발견 후 효과 정리는 내부의 실제 revealed/known 조건을 따로 확인하므로 표시용 OR를 효과 처리에까지 넓히지 않는다.

권고 범위는 **특성 본체 값을 유지한 채 7개 목록 표시 조건에만 `or spell_revelio=1`을 연결**하는 것이다. 마법 종료 뒤 known이0인 특성은 다시 숨겨지고, 자연 발견으로 known이 설정된 특성은 계속 표시되는 기존 분리가 유지되어야 한다.

## 검증 한계와 보존

이번 결과는 읽기 전용 정적 감사다. 실제 엔진·GUI·사용자 세이브 재현은 하지 않았다. 제품·WORK·G: 원본·기존 세이브를 변경하지 않았고, 생성 확률·특성 값·자연 발견·새 상태 변수도 추가하지 않았다. 다음 후보 JSON을 받으면 그 변경 범위와 상태 불변성을 별도로 검토할 수 있다.
