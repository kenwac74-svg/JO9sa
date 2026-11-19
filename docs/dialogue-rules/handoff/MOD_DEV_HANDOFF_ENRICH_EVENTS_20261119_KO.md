<!-- 승인된 풍부화 사건(무게 2·3) 관찰 지문을 jack.qsp에 덧대는 모드 개발 핸드오프 -->
# 모드 개발 핸드오프: 풍부화 사건 덧대기 (2026-11-19)

- 받는 쪽: 모드 개발(QSP 반영·빌드 담당). 이 문서를 쓴 쪽은 QSP를 바꾸지 않았다.
- 기준 파일: `assets/runtime/2.4.1/jack.qsp` SHA-256 `8332e1857fa594283eddda448177e3e63dbf554a2f3b241350aa7a9c3291c94f`. 줄 번호는 이 파일 기준(위치 본문 안의 줄, 1부터).
- 원고는 사용자가 모두 승인했다(문답 31·32, 검토표 `db/enrich-db-review.html`). 문장을 고치지 않는다.
- 질문 메뉴 핸드오프(`MOD_DEV_HANDOFF_QUESTION_MENU_20261119_KO.md`)를 먼저 넣는다. 목소리 저장값 `$slave['jo9_vtype']`을 같이 쓴다.

## 0. 넘기는 것
| 파일 | 내용 |
|---|---|
| `handoff/build/enrich_build_data.json` | 사건 9개, 블록 154개. 사건마다 칸 → 목소리 → `line`(본문)·`after`(여운). 이름 자리는 이미 `<<$slave_name>>(은)는`으로 바꿨다 |
| `tools/enrich_build_data.py` | 위 파일을 `db/enrich-db.json`에서 다시 만드는 도구 |
| `db/enrich-db.json` | 원본 DB. 규칙 값은 `limits`, 칸 고르기는 `layouts` |
| `mods/drafts/2026-11-16_enrich_execution_draft.json` | 2026-11-16 처형 위협 시범 초안. **글은 옛 원고(대사 포함)라 쓰지 않는다.** 위치를 만들고 부르는 방식만 참고 |

## 1. 덧대기 규칙 (확정)
1. 원래 글은 그대로 두고 **뒤에 덧붙인다**. 원래 글이 들어간 `$text[n]`에 `'<br>  ' + 본문`을 더한다(시범 초안과 같은 방식).
2. 모든 블록은 **관찰 지문**이다. 대사가 없고 과거형이다. 챔피언 잔류 거센 줄만 사용자가 쓴 현재형이다(승인됨).
3. **여운(`after`)은 헌신 2 이상일 때만** 본문 다음 줄에 붙인다(`limits.afterMinDevotion` = 2). 여운이 빈 블록은 붙이지 않는다.
4. **무게 2 사건은 하루에 사건마다 한 번만** 낸다(`limits.perDayPerTriggerWeight2` = 1). 인물별로 `slave['jo9_en_day_<사건 id>']`에 그날 `day`를 적고 같으면 건너뛴다.
5. 덧붙이는 양은 대사창 3행 이내다(한 행 약 53자). 원고는 본문+여운 최대 98자로 맞췄다.
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

## 3. 사건별 넣을 자리
줄 번호는 기준 파일에서 확인한 것이다. **(확인함)**은 코드를 읽어 자리를 확인한 것, **(후보)**는 자리 근처까지만 찾은 것이라 모드 개발 쪽에서 정확한 줄을 정해야 한다.

| 사건 | 묶음 | 넣을 자리 | 조건 |
|---|---|---|---|
| 처형 위협 `execution` | devotion2 | `interaction`의 `\t$text[1] = $execution_reaction[$slave_psy_status]` 뒤(6곳, 8721·8757·8794행 등) **(확인함)** | 없음 |
| 말로 받는 벌 `verbal_punish` | attitude4 | `interaction`의 `$text[2] = $abuse_torture_reaction[$slave_psy_status]` 뒤(6곳, 7358행~) **(확인함)** | `torture_intensity >= 4` |
| 몸으로 받는 벌 `physical_punish` | attitude4 | `$text[2] = $torture_reaction[…]`(17곳, 7227행~), `$bondage_reaction[…]`(8곳, 7782행~), `$light_torture_reaction[…]`(13곳, 6926행~) 뒤 **(확인함)** | `torture_intensity >= 4` |
| 억울한 벌 `unjust_punish` | attitude4 | 위 세 처벌 반응과 같은 자리 | 처벌 **전** `slave['sin'] = 0`. 처벌 코드가 sin을 바꾸기 전에 값을 잡아 둬야 한다. 같은 처벌에서 억울한 벌과 몸으로 받는 벌이 둘 다 맞으면 억울한 벌을 먼저 하나만 낸다(Claude 제안, 사용자 확인 전) |
| 우승 `arena_win` | devotion2 | `выход_из_боя` 54~61행 `arena_level`이 5가 되는 분기, `interaction_city` 1919행 `slave['arena_level'] = 9`, `$ride_finish` 76행 경주 4승·7승 **(후보)** | 칭호가 오르는 순간만 |
| 챔피언 잔류 `champion_stay` | single | `interaction_city` 1963행 `if slave['moral'] > slave['fear']:` 안, 1965행 `$text[2] = '공식적으로 당신이…'` 뒤 **(확인함)** | 없음 |
| 낙인 `branding` | devotion2 | 인두 `interaction` 8594행 `$text[1] = $fire_branding` 뒤, 문신 `interaction_city` 9994행 `copyarr '$text', '$tattoo_branding'` 뒤, 마법 `interaction` 421행 `slave['brand'] = 3` 분기의 결과 글 뒤, 결과 `interaction_result` 1497행 `$branding_final` **(후보)** | 한 번 낙인에 한 번 |
| 판매·납품 `sale` | devotion2 | `interaction_result_city` 58행(`sell_slave_simple`), 221·271행(`sell_slave_complex`) 분기에서 인물이 떠나기 전의 결과 글 뒤 **(후보)** | 노예가 아직 `slave`에 있을 때 |
| 반란 제압 `rebellion` | single | `выход_из_боя` 231~238행 `if $враг[1] = 'воспитуемая':` 안(전투 뒤 제압), `#dynamic` 1627행 `$dyn_slave_forced`의 제압 글(`msg`) 뒤 **(후보)** | 노예가 진 경우만 |

- DB의 `hooks` 중 낙인 "interaction 1811"은 지금 파일에서 연주 코드라 맞지 않는다. 위 표를 따른다.
- 원래 글에 노예 대사가 없는 것은 확인했다. 판매(구매자만 말함), 반란 제압, 억울한 벌, 몸·말 처벌, 낙인, 우승, 챔피언 잔류가 그렇다. 처형 위협은 15줄 중 1줄에 대사가 있으나 사용자 결정으로 관찰 지문만 쓴다(문답 31).

## 4. 이번에 넣지 않는 것
| 사건 | 이유 |
|---|---|
| 부끄러운 벌, 몸으로 받는 보상, 절정 | 사용자 작성 칸. 칸 구조만 있고 글이 아직 없다 |
| 임신 확인 | 사용자 작성 칸, 글 없음 |
| 따뜻한 보상 | 추후 검토로 미룸 |

## 5. 검사 (모드 개발 쪽에서)
1. 적용 전후 SHA-256, 왕복 동일, old가 정해진 횟수만큼만 나오는지.
2. QSP 엔진(`@qsp/wasm-engine` 2.0.0)으로 각 사건 코드를 실행해: 오류 0, 원래 글이 그대로 남음, 덧붙인 줄에 `{` 빈칸이 남지 않음, 헌신 0~1에서 여운 없음, 무게 2 사건이 같은 날 두 번 나오지 않음, 맞섬 상태(헌신 0~1)에서 무게 2 덧붙임 없음.
3. 게임 실행과 화면 확인은 사용자가 한다.
