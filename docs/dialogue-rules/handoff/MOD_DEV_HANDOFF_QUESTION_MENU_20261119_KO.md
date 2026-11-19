<!-- 승인된 질문 메뉴 대사를 jack.qsp에 넣는 모드 개발 핸드오프(무엇을, 어디에, 어떻게 확인하는지) -->
# 모드 개발 핸드오프: 질문 메뉴 대사 반영 (2026-11-19 최종본)

- 받는 쪽: 모드 개발(QSP 반영·빌드 담당). 이 문서를 쓴 쪽은 QSP를 바꾸지 않았다.
- 기준 파일: `assets/runtime/2.4.1/jack.qsp` SHA-256 `887f7e570e8df2a463c50c4855d4139a6e7a8602202f7039288d5bf15981d438`(main 커밋 ad10a099). 아래 줄 번호는 이 파일 기준이다(1부터, 위치 본문 안의 줄). 2026-11-19 옛 기준 `8332e185…`에서 옮겼다. 넣을 데이터(`question_build_data.json`)는 새 파일로 다시 계산해도 다섯 항목 모두 같았다.
- 기록 방식: 저장소 규칙대로 `mods/*.json`(location, old, new, count, 적용 전후 SHA-256)과 `add_locations`. qsp 직접 수정, `.qsrc` 재빌드 없음. 왕복 검증과 백업 먼저.
- 원고는 모두 사용자가 승인했다(문답 34~42). 문장을 고치지 않는다.

## 0. 넘기는 것
| 파일 | 내용 |
|---|---|
| `handoff/build/question_build_data.json` | 넣을 데이터 전부. 아래 3장. SHA-256 `0353fdf728b10e8deca9f79ad48e30b74349675940908db8ed291ab5eed0e20a` |
| `tools/question_build_data.py` | 위 파일을 만드는 도구. qsp가 바뀌면 다시 돌린다 |
| `question-fill/q*_manuscript.json` | 원고 원본(질문별). 사람이 읽는 표는 같은 폴더의 `q*_manuscript.html` |
| `db/enrich-db.json` | 호칭 표(`honorifics`), 호칭 순서(`honorificRules`), 부르는 말(`honorificVocativeNote`) |
| `handoff/build/engine_smoke.cjs` | QSP 엔진으로 qsp를 열어 조각을 읽는 확인 스크립트 |
| `BUILD_PLAN_20261119_KO.md` | 계획과 확정 사항 |

## 1. 확정 사항 (사용자 승인 2026-11-19)
1. **말투는 목소리로 정한다(B안).** 직업으로 정하던 것을 버린다. 도도(proud)·얼음(ice)·인형(doll)·관조(calm) → 말투 1, 순종(meek)·여린(fragile)·평범(plain) → 2, 솔직(frank)·불꽃(flame) → 3, 공주 → 3(반말 줄만).
2. **원래 대사의 "당신/주인님"은 이번에 바꾸지 않는다.** 새 줄만 호칭 빈칸을 쓴다.
3. **목소리는 처음 대사를 고를 때 저장하고 이후 바꾸지 않는다.** 진행 중인 세이브도 첫 질문 때 저장된다.

## 2. 현재 코드 구조 (읽은 결과)
- 조각 데이터: `#txt_man`의 `:jo9_voice_fragment_data`(2826행부터). 2832행 `if voice_fragment_revision=8 and arrsize('$voice_fragment_ids')=9120: exit`, 164235행 `if $args[0] = 'jo9_voice_fragment_data': voice_fragment_revision=8`. 필드: `$voice_fragment_text/role/types/relations/emotion`, `voice_fragment_level/tone/question/need_fear/good_mood/rare_praise`(키는 조각 id). 색인: `voice_fragment_count['역할_유형_말투']`, `$voice_fragment_item['역할_유형_말투_n']`.
- 데이터 읽는 곳: `interaction` 609·644·672행 `if voice_fragment_revision ! 8: gs '#txt_man','jo9_voice_fragment_data'`. 새 파일은 고르기 안(`#dynamic` 5310행 `JO9_SAVE_VOICE_LAZY_20261118`)에서도 필요할 때 읽는다.
- 유형·말투 계산: `#dynamic` 5192행 `$voice_profile`(직업 → 말투, 수치 → 9유형, R05 반말 정책은 아래 7장). 호출은 5984행(인상 묻기, `slave`)과 6216행(그 밖 질문, `dynslave`). 새 파일에서 두 호출 모두 인수가 7개로 늘었다(화자 번호, `jo9_plain_voice` 결과).
- 관계 칸 계산: `#dynamic` 5987~5996행(인상), 6218~6227행(그 밖).
- 고르기: `#dynamic` 5308행 `$voice_pick_fragment`. 5325행 말투 검사, 5326행 유형 검사, 5327행 관계 검사. **모든 대사가 5402행 `$result=$voice_fragment_text[$jo9_vfp_choice]`를 지난다.** 새 파일은 그 뒤 5403행(흐름 덮어쓰기)과 5411행 `$result=func('jo9_plain_voice',jo9_vf_actor_type,$result,jo9_vf_actor_plain)`(반말 교정표)을 더 지난다.
- 이름 자리 `{PH_001}`은 6262행에서 바꾼다(그 밖 질문 경로).

## 3. `question_build_data.json`
| 키 | 개수 | 할 일 |
|---|---|---|
| `new_fragments` | 536 | 새 조각. 각 항목의 `id·text·role·types·relations·tone·level·emotion·question·need_fear·good_mood·rare_praise`를 조각 배열에 넣고, `$voice_fragment_ids[]`에 id를 더한다. `index`의 각 키(역할_유형_말투)에 색인을 붙인다: `$voice_fragment_item[키+'_'+str(count)]=id`, `count+=1` |
| `tag_remove` | 901 | 분리한 원래 줄에서 뺄 유형 태그. `$voice_fragment_types[id]`에서 해당 `|태그|`를 지운다. 남은 태그가 없으면 그 줄은 해당 목소리들에게 안 나온다(의도) |
| `banmal_to_princess` | 1,662 | 말투 3이면서 반말인 원래 줄. `$voice_fragment_types[id]='|princess|'`로 바꾼다(공주만 반말) |
| `princess_index` | 553 묶음 | `역할_princess_3` 색인. 공주가 고를 반말 원래 줄 목록. 새 공주 줄은 `new_fragments`의 `index`로 따로 붙는다 |
| `text_fix` | 1 | 원래 줄의 글자 고침. `$voice_fragment_text[id]`를 `old`에서 `new`로 바꾼다(사용자 확정 문답 58: 반말 대사 중간에 섞인 "있잖아요" → "있잖아") |
| `tone2_fallback_index` | 1,040 묶음 | 솔직·불꽃 말투 3에 존댓말 줄이 하나도 없는 역할의 말투 2 줄. `역할_frank_3` 등 색인에 붙인다 |

- 새 조각 id는 `jo9x_<질문>_<번호>`(공용 줄은 `jo9x_c_…`). 기존 id와 겹치지 않는다.
- `source.honorific`가 `fixed:주인`인 줄(사용자 작성 공주 줄)은 빈칸 없이 "주인"이 글자로 들어 있다. 바꾸지 않는다.
- 이 데이터는 실행 코드로 넣는 것을 권한다: 새 위치(예: `jo9_vf_extra`)에 대입문을 모으고, 조각 데이터를 읽은 직후(164235행 `voice_fragment_revision=8` 대입 다음)와 이미 데이터가 실린 세이브용으로 `interaction` 세 곳에 `if jo9_vf_extra_rev ! 1: gs 'jo9_vf_extra'`를 둔다. `jo9_vf_extra` 끝에서 `jo9_vf_extra_rev=1`.

## 4. 코드에서 바꿀 것
### 4-1. 목소리 고정과 공주
`$voice_profile` 결과를 받은 뒤(5984행 다음, 6216행 다음):
```
! 인상 묻기 경로(slave). 그 밖 경로는 dynslave·$jo9_vn_occupation으로 같은 일
if $slave['jo9_vtype']='':
 $slave['jo9_vtype']=$jo9_vf_type
 if instr('|mprincess|barbarian_princess|','|'+$slave_occupation+'|')>0 or instr('|3002|2610|2620|3010|3021|3023|2621|3012|','|'+str(slave_type)+'|')>0: $slave['jo9_vtype']='princess'
end
$jo9_vf_type=$slave['jo9_vtype']
jo9_vf_tone=2
if instr('|proud|ice|doll|calm|','|'+$jo9_vf_type+'|')>0: jo9_vf_tone=1
if instr('|frank|flame|princess|','|'+$jo9_vf_type+'|')>0: jo9_vf_tone=3
```
- 공주 판정의 노예 종류 번호는 전역 변수 `slave_type`이다(그 밖 질문 경로는 `dynslave_type`). 2026-11-16 처형 위협 초안(`mods/drafts/2026-11-16_enrich_execution_draft.json`)도 같은 변수를 썼다. 2026-11-19 처음 판에는 `slave['type']`으로 잘못 적었다가 고쳤다.
- **인물이 다른 칸으로 옮겨도 `jo9_vtype`는 따라간다(2026-11-19 확인).** 칸 이동은 `#static_base` 441행 `$swap_slave_instances`가 인물 배열 전체를 `copyarr`로 맞바꾼다. 새 qsp를 QSP 엔진으로 열어 `slave`(공주, 헌신 4)와 `assistant`(순한, 헌신 1)를 맞바꾸니 글자 값과 숫자 값이 모두 함께 옮겨졌다(`handoff/build/swap_vtype_test.cjs`, 오류 0). 팔거나 내보내 인물 배열을 지우면 값도 함께 지워지고, 새로 들어온 인물은 첫 질문 때 계산된다.

### 4-2. 관계 칸
5987~5996행과 6218~6227행을 아래 순서로 바꾼다(정신 상태 psy, 헌신 moral, 복종 obedience). 처음 맞는 줄을 쓴다.
| 순서 | 조건 | `$jo9_vf_mode` |
|---|---|---|
| 1 | psy = broken | broken |
| 2 | moral ≥ 3, psy가 frightened·lachrymose·depresive | depresive면 bleak, 아니면 fearful |
| 3 | moral ≥ 3 | loyal |
| 4 | moral ≤ 1, psy가 reluctant·arrogant·hateful·resistant·hysteric | hostile |
| 5 | obedience > 20, psy가 움츠림 쪽 | bleak/fearful |
| 6 | obedience > 20 | duty |
| 7 | psy가 움츠림 쪽 | bleak/fearful |
| 8 | psy = optimistic | hopeful |
| 9 | 그 밖(헌신 2의 맞섬 상태 포함) | neutral |

호칭을 위해 같은 자리에서 `jo9_vh_moral`(헌신), `jo9_vh_obed`(obedience > 20이면 1), `jo9_vh_oppose`(모드가 hostile이면 1)을 둔다.

### 4-3. 말투 검사 (5325행)
`tone2_fallback_index`로 말투 3 색인에 붙인 말투 2 줄이 통과하도록 바꾼다:
```
if voice_fragment_tone[$jo9_vfp_id] ! jo9_vf_tone and not (jo9_vf_tone=3 and voice_fragment_tone[$jo9_vfp_id]=2 and $jo9_vf_type ! 'princess'): jo9_vfp_ok=0
```
기존 색인은 말투별로 나뉘어 있어서 말투 2 줄은 붙인 곳에서만 들어온다.

### 4-4. 호칭 빈칸 (5411행 반말 교정 다음)
```
if instr($result,'{호칭')>0: $result=$dyneval($jo9_hon_apply,$result)
```
`$jo9_hon_apply`는 아래 규칙으로 빈칸을 바꾼다(DB `honorificRules` 그대로).
| 순서 | 조건 | 존댓말 | 반말(공주) |
|---|---|---|---|
| 1 | jo9_vh_oppose=1 | 당신 꼴 | 헌신 표대로 |
| 2 | jo9_vh_obed=1 | 주인님 꼴 | 주인 꼴 |
| 3 | 그 밖 | 헌신 0~1 당신, 2↑ 주인님 | 헌신 0 너, 1~2 당신, 3↑ 주인 |

| 빈칸 | 당신 | 주인님 | 너 | 주인 |
|---|---|---|---|---|
| `{호칭}` | 당신 | 주인님 | 너 | 주인 |
| `{호칭이}` | 당신이 | 주인님이 | 네가 | 주인이 |
| `{호칭은}` | 당신은 | 주인님은 | 너는 | 주인은 |
| `{호칭을}` | 당신을 | 주인님을 | 너를 | 주인을 |
| `{호칭의}` | 당신의 | 주인님의 | 네 | 주인 |
| `{호칭에게}` | 당신에게 | 주인님께 | 너한테 | 주인한테 |
| `{호칭부름}` | (지움) | 주인님 | (지움) | 주인 |

- `{호칭부름}`이 지워질 때는 바로 앞의 `", "`도 함께 지운다(", {호칭부름}." → ".").
- 반말 줄의 "당신" 꼴은 DB 표대로 `당신의`가 아니라 `당신`(조사 없이) 등으로 되어 있으니 `db/enrich-db.json`의 `honorifics.banmal`을 그대로 쓴다.
- `{PH_001}`(이름 자리)은 기존 6262행이 그 밖 질문 경로에서 바꾼다. 새 조각 중 `{PH_001}`이 있는 줄은 요구 묻기의 무너짐 상태 줄 6개뿐이고 그 경로로 나온다.

## 5. 검사 (모드 개발 쪽에서)
1. 적용 전후 SHA-256, 왕복 동일, old가 정해진 횟수만큼만 나오는지.
2. QSP 엔진: `npm install @qsp/wasm-engine@2.0.0` 뒤 `node handoff/build/engine_smoke.cjs <qsp>`로 열리는지. `tools/qa/check-voice-fragments.cjs`의 방식(수치·상태 조합을 돌며 `$text` 페이지를 모으는 것)으로 아래를 확인한다.
   - 오류 0.
   - 공주가 아닌 목소리의 대답에 반말 끝맺음이 없다.
   - 대답에 `{호칭`이 남지 않고, ", ." 같은 빈 부르는 말 흔적이 없다.
   - 목소리 7 × 관계 칸에서 새 조각(`jo9x_`)이 실제로 뽑힌다.
   - 공주 아닌 목소리의 대답 길이가 늘지 않는다(조각 하나 82자 이내, 기본+덧붙임 150자 이내로 원고를 맞췄다).
3. 게임 실행과 화면 확인은 사용자가 한다.

## 6. 이번에 하지 않는 것
- 원래 대사의 호칭 빈칸화(확정 사항 2).
- 깊이(`$voice_depth_level`)의 숨은 식 정리(결정 전).
- 풍부화 사건(무게 2·3) 덧대기. 별도 핸드오프 `MOD_DEV_HANDOFF_ENRICH_EVENTS_20261119_KO.md`(최종본)로 넘긴다.

## 7. 새 파일의 R05 말투 정책과 겹치는 부분 (사용자 확인 필요)
main에는 2026-11-12~13 사용자 승인으로 Codex가 넣은 말투 정책이 있다(`records/always-plain-voice-20261112`, `records/release-r05-voice-policy-20261113`, `docs/modding/CHARACTER_SPEECH_MODE_KO.md`). 이 핸드오프의 설계(문답 43까지)와 겹치는 곳을 적는다. 어느 쪽을 따를지는 사용자가 정한다. 이 문서는 고르지 않는다.

| 항목 | R05(main) | 이 핸드오프 |
|---|---|---|
| 반말 대상 | 지정 유니크 8명(3002·2610·2620·3010·3021·3023·2621·3012) 기본 반말. 인물별 `jo9_plain_tone`(1 켜기, -1 끄기, 0 기본)이 우선. 공주 가문 일반 인물은 직업을 `mprincess`로 맞춘다 | 공주 목소리(`princess`)만 반말. 공주 판정은 직업 mprincess·barbarian_princess 또는 같은 8개 번호 |
| 말투 1·2 | 직업으로 정한다(격식 직업 1, 기본 2). 일반 직업의 반말은 없앴다 | 목소리로 정한다(B안, 문답 43) |
| 반말 문장 | 원문 반말 원고는 두고, 고르기 뒤 5411행에서 교정표(2,406문장 정확 일치)로 8명용 반말을 맞춘다 | 말투 3 반말 줄 1,768개를 `|princess|` 태그로 바꿔 공주만 고르게 한다 |
| 호칭 빈칸 자리 | — | 5411행 교정 뒤에 둔다(교정표가 빈칸이 든 새 줄을 모르므로 그대로 통과한다) |

### 7-1. 사용자 결정 (2026-11-19, 문답 55)
1. **두 규칙을 상황에 따라 함께 쓴다.** 직업에 기본으로 연결되는 목소리가 있고, 유니크 캐릭터는 인물별 설정으로 다르게 둘 수 있다(예: 직업은 거지인데 목소리는 공주에 가까움). 구현: 4-1의 `$slave['jo9_vtype']`이 이미 있으면 계산하지 않고 그대로 쓰므로, 유니크 캐릭터는 이 값을 인물 자료에서 미리 넣어 두면 된다.
2. **반말을 켜면 공주 목소리로 본다.** R05 기준으로 반말인 인물(지정 8명 기본, 또는 `jo9_plain_tone = 1`)은 `jo9_vtype = 'princess'`로 둔다. 4-1의 공주 판정에 `func('jo9_plain_voice','enabled',slave_type,func('jo9_plain_voice','update','slave')) = 1`을 더한다(그 밖 경로는 `$jo9_vn_memory_actor` 기준). 예외는 따로 정한다.
3. **반말 줄은 태그로 가르고 R05 교정표는 그대로 둔다**(사용자 확정, 문답 56). 순서는 고르기 → 교정표(5411행) → 호칭 빈칸. 반말로 분류된 줄 점검표: `question-fill/banmal_review.html`.

### 7-2. 반말 줄 가르기 분석 (새 qsp 기준 실측)
| 항목 | 수 |
|---|---|
| 말투 3 조각 | 3,040 (반말 1,669, 존댓말 1,371). 끝에 붙은 부르는 말을 떼고 판정한 값(문답 57). 그전 규칙으로는 반말 1,768이었다 |
| R05 교정표 항목 | 2,406. 이 중 조각 글과 정확히 같은 것 1,440. 나머지 966은 조각이 아닌 출력용으로 보인다(확인하지 않음) |
| 말투 3 존댓말 조각 중 교정표에 있는 것 | 1,346 / 1,371 (25개 없음) |
| 이번 새 조각 중 말투 3 존댓말(명랑 219, 거센 24) | 243. 교정표에 없음 |
| 새 조각 중 호칭 빈칸이 든 줄 | 191 |
| 태그로 가를 때 공주 후보가 없는 역할 | 0 / 728 |

| | 태그로 가르기(이 핸드오프) | 교정표로 맞추기(R05) |
|---|---|---|
| 방식 | 고를 때 반말 줄만 공주 후보로 둔다 | 아무 말투 3 줄이나 고른 뒤 정확히 같은 문장을 반말로 바꾼다 |
| 새 줄 | 태그만 달면 바로 맞는 말투로 나온다 | 새 줄·고친 줄마다 교정표 항목을 더해야 한다. 없으면 존댓말이 그대로 나온다 |
| B안과 함께 쓸 때 | 명랑·거센의 존댓말 새 줄 243개가 반말 인물에게 가지 않는다 | 반말 인물이 말투 3에서 고르면 위 243개와 교정표에 없는 23개가 존댓말로 나온다 |
| 위험 | 1,662줄의 태그를 바꾼다. 반말 판정이 끝맺음 규칙이라 틀린 분류가 섞일 수 있다 | 교정표 크기(약 0.7MB)와 관리 부담. 고를 때는 말투를 모른다 |

- **분석 결론(제안, 문답 56에서 확정):** 대사 고르기는 **태그로 가르고**, R05 교정표는 **그대로 둔다**. 태그로 가르면 공주 목소리는 반말 줄만 고르므로 조각 경로에서는 교정표가 할 일이 거의 없어진다. 하지만 교정표는 조각이 아닌 출력(966항목)도 맡고 있어 지우면 안 된다. 순서는 고르기 → 교정표(5411행) → 호칭 빈칸이다.
- 태그 쪽 위험(끝맺음 규칙의 오분류)은 반말로 분류된 줄을 한 번 훑어보는 것으로 줄일 수 있다. 점검표로 훑어본 뒤 끝에 붙은 부르는 말을 떼고 판정하도록 규칙을 고쳐 99줄이 반말 목록에서 빠졌다(문답 57). 남은 의심 40줄을 사용자가 점검해 존댓말 7줄을 반말 목록에서 빼고(`POLITE_FIX`) 1줄의 글자를 고쳤다(`text_fix`). 나머지는 검사의 오탐이었다(문답 58). 지금 반말 1,662줄, 의심 0줄.
