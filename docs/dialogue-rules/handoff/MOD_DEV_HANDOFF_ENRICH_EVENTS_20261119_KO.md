<!-- 승인된 풍부화 사건(무게 2·3) 관찰 지문을 jack.qsp에 덧대는 모드 개발 핸드오프(최종본) -->
# 모드 개발 핸드오프: 풍부화 사건 덧대기 (2026-11-19 최종본)

- 받는 쪽: 모드 개발(QSP 반영·빌드 담당). 이 문서를 쓴 쪽은 QSP를 바꾸지 않았다.
- 기준 파일: `assets/runtime/2.4.1/jack.qsp` SHA-256 `887f7e570e8df2a463c50c4855d4139a6e7a8602202f7039288d5bf15981d438`(main 커밋 ad10a099). 줄 번호는 이 파일 기준(위치 본문 안의 줄, 1부터). 2026-11-19 옛 기준 `8332e185…`에서 옮겼다. **예외:** 부끄러운 벌·몸으로 받는 보상·절정의 행, 3장, 4-1은 Claude가 다루지 않아 옛 기준 줄 번호 그대로다.
- 원고: 사건 13개 252블록. 문장을 고치지 않는다.
  - Claude 초안 9사건 154블록: 사용자가 검토표(`db/enrich-db-review.html`)로 모두 승인했다(문답 31·32).
  - 사용자 작성 4사건 98블록(부끄러운 벌·몸으로 받는 보상·절정·임신 확인): 사용자 의뢰로 다른 AI가 쓰고, 사건끼리 닮은 줄을 두 차례 다시 써서(56칸, 9칸) 사용자가 반영을 지시했다. 검토표에는 칸 구조만 나오고 문장은 `db/enrich-db.json`과 아래 데이터 파일에만 있다.
- 질문 메뉴 핸드오프(`MOD_DEV_HANDOFF_QUESTION_MENU_20261119_KO.md`)를 먼저 넣는다. 목소리 저장값 `$slave['jo9_vtype']`을 같이 쓴다.

## 0. 넘기는 것
| 파일 | 내용 |
|---|---|
| `handoff/build/enrich_build_data.json` | 사건 13개, 블록 252개. 사건마다 칸 → 목소리 → `line`(본문)·`after`(여운). 이름 자리는 이미 `<<$slave_name>>(은)는`으로 바꿨다. SHA-256 `ec0e673bd6ebe0de4e1a055696b3bc1664cc3f5d576935fd235cfc57852090d9` |
| `tools/enrich_build_data.py` | 위 파일을 `db/enrich-db.json`에서 다시 만드는 도구 |
| `db/enrich-db.json` | 원본 DB. 규칙 값은 `limits`, 칸 고르기는 `layouts` |
| `mods/drafts/2026-11-16_enrich_execution_draft.json` | 2026-11-16 처형 위협 시범 초안. **글은 옛 원고(대사 포함)라 쓰지 않는다.** 위치를 만들고 부르는 방식만 참고 |

## 1. 덧대기 규칙 (확정)
1. 원래 글은 그대로 두고 **뒤에 덧붙인다**. 원래 글이 들어간 `$text[n]`에 `'<br>  ' + 본문`을 더한다(시범 초안과 같은 방식).
2. 모든 블록은 **관찰 지문**이다. 대사가 없고 과거형이다. 챔피언 잔류 거센 줄만 사용자가 쓴 현재형이다(승인됨).
3. **여운(`after`)은 헌신 2 이상일 때만** 본문 다음 줄에 붙인다(`limits.afterMinDevotion` = 2). 여운이 빈 블록은 붙이지 않는다.
4. **무게 2 사건은 하루에 사건마다 한 번만** 낸다(`limits.perDayPerTriggerWeight2` = 1). 인물별로 `slave['jo9_en_day_<사건 id>']`에 그날 `day`를 적고 같으면 건너뛴다.
5. 덧붙이는 양은 대사창 3행 이내다(한 행 약 53자). 본문은 최대 84자, 본문+여운은 최대 124자(임신 확인)다.
6. 정신 상태가 무너짐(broken)이면 덧붙이지 않는다(시범 초안과 같음).
7. 목소리: `$slave['jo9_vtype']`(질문 메뉴에서 저장)을 아래처럼 DB 목소리 키로 읽는다. 값이 비었으면 질문 메뉴 4-1과 같은 계산으로 먼저 저장한다.

| `jo9_vtype` | DB 목소리 키 |
|---|---|
| meek, fragile | meek |
| plain | plain |
| proud, ice | proud |
| doll, calm | quiet |
| frank | bright |
| flame | fierce |
| princess | princess |

## 2. 칸 고르기
| 묶음 | 칸 | 고르는 법 |
|---|---|---|
| `devotion2` (무게 3) | hi / lo | 헌신 3 이상 hi, 0~2 lo |
| `single` (무게 3) | * | 하나뿐 |
| `attitude4` (무게 2) | shrink / soft / obey / follow | 위에서부터 처음 맞는 것. ① 헌신 3↑: 움츠림 상태(frightened·lachrymose·depresive)면 shrink, 아니면 follow. ② 헌신 0~1이고 맞섬 상태(reluctant·arrogant·hateful·resistant·hysteric)면 **덧붙이지 않음**. ③ 복종 obedience > 20: 움츠림이면 shrink, 아니면 obey. ④ 그 밖: 움츠림이면 shrink, 아니면 soft |

## 3. 정책으로 거르는 것 (반드시)
원고 쪽 원칙(미성년자 성적 묘사 없음 B1, 동물과의 성행위 없음 B2)이 게임 안에서도 지켜지도록 덧붙이기 전에 거른다.

| 대상 | 거르는 조건 | 이유 |
|---|---|---|
| 사용자 작성 4사건(부끄러운 벌·몸으로 받는 보상·절정·임신 확인) | `slave['age'] = CONST_INT['loli_age']`이면 덧붙이지 않는다 | 게임에는 어린 나이 코드 인물이 있고, 성적 보상 결과 코드(`interaction_result` 1294행)에도 그 분기가 있다 |
| 절정 | 상대가 동물·벌레·촉수인 상호작용이면 덧붙이지 않는다 | 해당 상호작용도 절정 판정(`orgastic`)을 거친다 |

- 동물·벌레·촉수 상호작용 후보(키워드 검색 결과, **모드 개발이 확인**): `interaction`의 588, 1351~1356, 1475, 6008, 7018~7024, 14511, 14516, 14521, 14526, 14531, 14536, 54136. `next_day` 812행(밤사이 촉수)도 절정 판정을 거칠 수 있다. 4장 방식대로 표시를 `interaction` 시작(46행 옆)에서 지우면 그 표시는 출력되지 않는다. 이 경로는 실행해 보지 않았다.
- 위 목록은 블록 본문에 zoosex·bestiality·pigsex·horse·arachnid·spider·polypus·vermin·tentacle 같은 말이 있는 상호작용을 모은 것이라 빠지거나 더 들어간 것이 있을 수 있다.

## 4. 사건별 넣을 자리
**(확인함)**은 코드를 읽어 자리를 확인한 것, **(후보)**는 자리 근처까지만 찾은 것이라 모드 개발 쪽에서 정확한 줄을 정해야 한다.

| 사건 | 묶음 | 넣을 자리 | 조건 |
|---|---|---|---|
| 처형 위협 `execution` | devotion2 | `interaction`의 `\t$text[1] = $execution_reaction[$slave_psy_status]` 뒤(6곳, 8776·8812·8849행 등) **(확인함)** | 없음 |
| 말로 받는 벌 `verbal_punish` | attitude4 | `interaction`의 `$text[2] = $abuse_torture_reaction[$slave_psy_status]` 뒤(6곳, 7410행~) **(확인함)** | `torture_intensity >= 4` |
| 몸으로 받는 벌 `physical_punish` | attitude4 | `$text[2] = $torture_reaction[…]`(17곳, 7279행~), `$bondage_reaction[…]`(8곳, 7834행~), `$light_torture_reaction[…]`(13곳, 6978행~) 뒤 **(확인함)** | `torture_intensity >= 4` |
| 억울한 벌 `unjust_punish` | attitude4 | 위 세 처벌 반응과 같은 자리 | 처벌 **전** `slave['sin'] = 0`. 처벌 코드가 sin을 바꾸기 전에 값을 잡아 둬야 한다. 같은 처벌에서 억울한 벌과 몸으로 받는 벌(또는 말로 받는 벌)이 둘 다 맞으면 **억울한 벌 하나만** 낸다(사용자 확정, 문답 45) |
| 부끄러운 벌 `shame_punish` | attitude4 | `interaction`의 `$text[2] = $shame_torture_reaction[$slave_psy_status]` 뒤(6곳, 7994행~) **(확인함)** | `torture_intensity >= 4`. 3장 나이 거름 |
| 몸으로 받는 보상 `erotic_reward` | attitude4 | `interaction_result` 1267행 `if $interaction_type = 'praise_erotic':` 안, 1284행 `else`(자극이 0보다 큼) 가지의 1286행 `dynamic $special_part` 뒤. `$text[2]`(1270·1272행 반응 글)에 덧붙인다 **(확인함)** | `interaction_reward_level >= 4`(애무 1533·바이브 1534는 4, 1535는 5). 1277행 "반응하지 않는다" 가지에서는 내지 않는다. 3장 나이 거름 |
| 절정과 그 뒤 `climax` | attitude4 | 판정: `#dynamic` 839행 `if orgasm_description ! 0:` 안에서 `orgasm_description`이 1 또는 3(실제 절정, 2는 참아 냄)이고 `'dynslave' = 'slave'`(주 노예)면 표시 `jo9_en_climax = 1`. 출력: `interaction_result` 1717행 `dynamic $array_append, '$text', '$orgasm_text'` **바로 앞**에서 `jo9_en_climax = 1`이면 `$orgasm_text`의 마지막 줄에 덧붙이고 표시를 지운다. 표시는 `interaction` 46행 `orgastic = 0` 옆에서 0으로 초기화 **(확인함)** | 3장 나이·동물 거름. 아래 4-1 겹침 규칙 |
| 임신 확인 `pregnancy_reveal` | devotion2 | `next_day` 2016행 `dynslave['pregnant_revealed'] = 1` 뒤에 주 노예면 `jo9_en_preg_pending`을 세운다. 게임은 이 순간 글을 내지 않으므로, 다음 날 주인이 그 노예를 처음 보는 화면(아침 보고 또는 첫 상호작용 결과)에 블록을 내고 표시를 지운다. 보여 줄 화면은 **(후보)** | 처음 한 번. 3장 나이 거름 |
| 우승 `arena_win` | devotion2 | `interaction_city` 1294(아레나 승리 결과) 안. 1928~1946행 도전전 분기에서 `c1done`·`c2done`·`c3done`이 이번에 처음 1이 되거나 `challenge_type = 4`(절대 챔피언, 처음)일 때 표시를 세우고, 1947행(상금 줄) **바로 앞**에서 `$text[1]`에 덧붙인다 **(확인함)** | 도전전 4종(챔피언 도전·집단전·안개 괴물·절대 챔피언)의 **첫 승리만**. 일반 승리(등급 1~5)와 경마는 내지 않는다(원고에 트로피·쓰러진 상대가 나옴, 사용자 확정 문답 50). 패배 없이 등급 5가 되는 승리는 1295(챔피언 해방)로 가므로 우승 지문이 나오지 않는다 |
| 챔피언 잔류 `champion_stay` | single | `interaction_city` 1988행 `if slave['moral'] > slave['fear']:` 안, 1990행 `$text[2] = '공식적으로 당신이…'` 뒤 **(확인함)** | 없음 |
| 낙인 `branding` | devotion2 | 인두: `interaction_result` 1601행 `dynamic $special_part` 뒤에서 `$text[2]`(`$branding_final`) 끝에 덧붙인다. 노예가 저항해 싸우는 1594행 가지는 화면이 넘어가므로 붙지 않는다. 문신: `interaction_result_city` 830행 `dynamic $do_service` 뒤에서 `interaction_city = 4217`일 때만 마지막 `$text` 끝에 덧붙인다(돈이 모자라면 서비스가 실행되지 않음) **(확인함)** | 인물마다 **첫 낙인 한 번만**(`slave['jo9_en_branded']`로 기록, 다른 방식으로 또 찍어도 내지 않음). **마법 낙인(어드버토 서벌리, `brand = 3`)은 내지 않는다**(통증이 없는 장면이라 원고와 맞지 않음). 암시장 구입 등 `brand = 2`를 대입만 하는 곳(666802, 700007)도 낙인 장면이 아니라 제외. 절정과 겹치면 낙인 우선(4-1). 사용자 확정 문답 51 |
| 판매·납품 `sale` | devotion2 | 팔려 나가는 다섯 경로에서 구매자 글 `$text[1]` 끝에 덧붙인다 **(확인함)**. ① 일반 판매 `interaction_result_city` 76행 `sell_slave_simple`(인물 지우기 124행) ② 상류층 협상 판매 187행 `slave_sold_house`(231행) ③ 의뢰 납품 239·289행 `sell_slave_complex`(258·309행) ④ 개인 고객 판매 458행 `slave_sold`(501행) ⑤ 경매상 `slave_auction_sell_end`(26행에서 지우고 31행에서 글을 모두 지운 뒤 41행에서 새로 씀). **블록 고르기(목소리·헌신)와 이름 채우기는 각 경로의 `dynamic $clear_slave_instance, 'slave'` 직전에 한다.** `<<$slave_name>>`은 화면에 낼 때 계산되므로 그때는 이름이 비어 있다. 이름을 실제 글자로 바꿔 넣는다. ⑤는 26행 전에 만든 블록을 41행 뒤에 붙인다 | 구매자가 받아들인 경우만(`buyer_interested = 1`). `slave_sell_done`은 주석상 쓰지 않는 위치라 제외. 판매가 아닌 이별(임대 계약 만료 `end_contract`, 쫓아내기 `interaction` 8659행~, 챔피언 해방)은 내지 않는다. 사용자 확정 문답 52 |
| 반란 제압 `rebellion` | single | `#dynamic` 1628행 `$dyn_slave_forced`(쉽게 제압) 안, **1642행 팝업 글**(`msg '…쉽게 제압할 수 있었다… 몇 군데 멍이 생겼다.'`)의 끝에 블록을 붙인다. 팝업이므로 `msg` 문자열에 덧붙인 뒤 띄운다 **(확인함)** | 쉽게 제압에서만 낸다. 전투 반란(`$slave_fights_back` 1610행, 밤중 칼 공격 `end_day_screen` 1128행)은 노예가 기절하거나 죽고 결과 글이 없어 내지 않는다. **인물마다 처음 제압될 때 한 번만**(`slave['jo9_en_rebellion']`로 기록). 1635~1640행 가지(주인공이 아이인 경우의 팝업)에는 붙이지 않는다(장면이 원고와 맞지 않음). 주 노예만(`'dynslave' = 'slave'`), 조수에게는 내지 않는다. 사용자 확정 문답 54 |

- DB의 `hooks` 중 낙인 "interaction 1811"은 지금 파일에서 연주 코드라 맞지 않는다. 위 표를 따른다.
- 원래 글에 노예 대사가 없는 것은 확인했다. 판매(구매자만 말함), 반란 제압, 억울한 벌, 몸·말·부끄러운 처벌, 낙인, 우승, 챔피언 잔류가 그렇다. 처형 위협은 15줄 중 1줄에 대사가 있으나 사용자 결정으로 관찰 지문만 쓴다(문답 31).

### 4-1. 한 화면에 두 사건이 겹칠 때 (사용자 확정 2026-11-19, 문답 49)
성적 보상(1533~1535)은 `orgastic = 1`이라 대부분 같은 화면에서 절정이 난다. 처벌 중에도 흥분이 최대면 절정이 날 수 있다(`interaction_result` 534행).
- **한 화면에는 사건 블록 하나. 절정이 났으면 절정 블록만 낸다.** 같은 화면의 보상·처벌 블록(말·몸·억울한·부끄러운 벌, 몸으로 받는 보상)은 내지 않는다.
- 몸으로 받는 보상: 덧붙이는 자리(1286행 뒤)는 1275행 자극 계산 **뒤**라 절정 표시 `jo9_en_climax`가 이미 정해져 있다. `jo9_en_climax = 1`이면 보상 블록을 붙이지 않는다.
- 처벌 4사건: 덧붙이는 자리(`interaction`의 반응 글 대입)는 절정 판정(`interaction_result`)보다 **앞**이다. 그래서 그 자리에서 바로 붙이지 말고 블록과 대상 칸(`$text[2]`)을 대기값(예: `$jo9_en_pending`, `jo9_en_pending_idx`, `$jo9_en_pending_id`)에 담아 둔다. `interaction_result` 1717행 앞에서 `jo9_en_climax = 1`이면 대기값을 버리고 절정 블록을 내고, 아니면 대기 블록을 그 칸에 붙인다. 대기값은 `interaction` 시작(46행 옆)에서 비운다.
- 하루 한 번 기록(`slave['jo9_en_day_<사건 id>']`)은 **실제로 낸 블록만** 남긴다. 절정에 밀려 나오지 않은 사건은 그날 다시 나올 수 있다.
- **예외: 낙인은 절정보다 우선한다.** 인두 낙인 화면에서 절정이 나면 낙인 블록을 내고 절정 블록은 생략한다(인물마다 한 번뿐인 무게 3 사건, 문답 51).
- 억울한 벌과 다른 처벌이 겹치면 억울한 벌 하나(문답 45)를 먼저 고른 뒤, 그 결과와 절정 사이에서 다시 이 규칙을 적용한다.

## 5. 이번에 넣지 않는 것
| 사건 | 이유 |
|---|---|
| 따뜻한 보상 | 추후 검토로 미룸 |

## 6. 검사 (모드 개발 쪽에서)
1. 적용 전후 SHA-256, 왕복 동일, old가 정해진 횟수만큼만 나오는지.
2. QSP 엔진(`@qsp/wasm-engine` 2.0.0)으로 각 사건 코드를 실행해 확인한다.
   - 오류 0, 원래 글이 그대로 남음, 덧붙인 줄에 `{` 빈칸이 남지 않음.
   - 헌신 0~1에서 여운 없음, 무게 2 사건이 같은 날 두 번 나오지 않음, 맞섬 상태(헌신 0~1)에서 무게 2 덧붙임 없음.
   - 어린 나이 코드 인물에게 사용자 작성 4사건 블록이 나오지 않음, 동물·벌레·촉수 상호작용에서 절정 블록이 나오지 않음.
   - 4-1 규칙대로 한 화면에 블록이 하나만 나옴. 절정이 난 보상·처벌 화면에는 절정 블록만 있음. 밀려난 사건의 하루 한 번 기록이 남지 않음.
3. 게임 실행과 화면 확인은 사용자가 한다.
