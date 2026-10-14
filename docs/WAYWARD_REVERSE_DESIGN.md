# Wayward → 잭오나 역기획: 노예 반응 체계 변수 매칭 (카일, 2026-10-14)

목적: Wayward의 아내가 "상황에 맞게 말하는" 체계를 잭오나 노예에게 옮기기 전에, 양쪽 설정과 변수를 맞춰 무엇이 이미 있고 무엇이 없는지 정한다.
근거: Wayward 한국어판 index.html(2026-09-30판) 코드, 잭오나 2.4.0.0 QSP(`source/jack_release_2026-10-14_2.4.0.0.qsp`, codex 브랜치), 사용자 제공 노예 정보 화면.
주의: Wayward에는 게임 라이선스 표기가 없다. 구조와 아이디어만 참고하고 코드·문구는 가져오지 않는다.

## 1. 결론
- Wayward는 LLM을 쓰지 않는다. 미리 쓴 문장을 **사건 기억 → 원인 있는 감정 → 아침 상태 → 표현 단계 → 조각 조립(반복 방지)** 순서로 고른다.
- 잭오나는 **재료가 이미 충분하다.** 원인별 감정(무드렛, 밤마다 줄어드는 크기), 성격 수치, 숨은 성향 발견(`*_revealed`), 몸 상태, 정신 상태 15종이 있다.
- 없는 것은 네 가지다.
  1. 감정의 **원인 인물과 날짜**(누가, 언제)
  2. **표현 단계**(속마음을 드러냄/암시/숨김/거짓 표정)
  3. 여러 상태를 묶는 **아침 상태 종합**
  4. **조각 조립과 반복 방지**
- 그래서 지금 출력이 고정 문장이다. 하단 서술은 정신 상태 하나당 한 문장(`$psy_status[...]`)이고, 일기는 무드렛 하나당 한 문장(`$mood_description[...]`)이다.

## 2. 노예 정보 화면 ↔ 변수 (slave_stat에서 확인)
| 화면 | 변수 | Wayward 대응 |
|---|---|---|
| 감수성 | `slave['sensitivity']` | 감정 기복(`volatility`) |
| 성격 (수동적임 등) | `slave['temper']` | 평정(`composure`) |
| 지성 | `slave['intellect']` | 없음 |
| 자아 (단호함 등) | `slave['ego']` | 자신감(`selfConcept.confidence`) |
| 태도 (개방적 등) | `slave['pride']` (표시는 반대 방향) | 개방성(`selfConcept.openness`) |
| 기분 (황홀함 등) | `slave['mood']` | 기분(`dailyState.mood`) |
| 노예의 특성 | `$slave_features_list` | 성격 태그(`traits`, 예: cold_pragmatist) |
| 하단 서술 | `$psy_status[$slave_psy_status]` | 출력 문장. 잭오나는 정신 상태당 고정 1문장 |
| 우측 규칙 패널 (잠자리, 식단, 식사량, 규칙) | 규칙 변수들 | 간접 통제(부추김/제한, `latitude`) |

## 3. 감정 매칭: Wayward 감정 ↔ 잭오나 무드렛
잭오나 무드렛은 노예 배열의 키(`slave['neg_pain']` 등)에 크기를 담고, 밤마다 `$mood_drop`/`$mood_rise`로 줄어든다. Wayward 감정(세기, 원인, 대상, 끝나는 시각)과 같은 역할이다.

| Wayward 감정 | 잭오나 무드렛 (예) | 차이 |
|---|---|---|
| fear (두려움) | `neg_fear`, `neg_pain` | 원인 인물·날짜 없음 |
| shame / humiliation (수치·굴욕) | `neg_shame`, `neg_naked`, `neg_forced` | 〃 |
| anger / contempt (분노·경멸) | `neg_abuse`, `neg_rules`, `neg_spoil`, `neg_no_praise` | 〃 |
| disgust (혐오) | `neg_disgust` | 〃 |
| sadness / numbness (슬픔·무감각) | `neg_angst`, 정신 상태 `broken`/`depresive` | 무감각은 상태로만 있음 |
| pride / elation (자부심·고양) | `pos_praise`, `pos_reward`, `pos_slave_winner` | 〃 |
| tenderness / devotion (애정·헌신) | `pos_gentle`, `pos_slave_love`~`love6` | 〃 |
| ecstasy / desire (황홀·욕구) | `pos_orgasm`, `pos_multiple_orgasm`, `neg_horny` | 〃 |
| guilt / regret (죄책·후회) | `sin`(죄 수치), `pos_no_punish` | 감정이 아니라 수치로 있음 |

## 4. 그 밖의 상태 매칭
| Wayward | 역할 | 잭오나 | 판정 |
|---|---|---|---|
| dailyState (기력, 기분, 몸 상태) | 아침 상태 | `energy`, `stamina`, `mood`, `hygiene`, `sleep_condition`, `neg_exhausted`, `neg_hungry`, `neg_menstruation`, `neg_slave_wounded` | 재료 있음. 묶는 단계만 없음 |
| latentTraits + noticedLatentTraits | 숨은 성향과 발견 | `courage_revealed`, `exhibitionism_revealed`, `deprivation_attitude_revealed` 등 | **같은 구조가 이미 있음** |
| identityStrain | 정체성 갈등 | 직접 대응 없음. 근사: `angst`와 `moral`의 차이 | 필요할 때 계산식으로 |
| trust / comfort | 주인에 대한 신뢰 | 직접 대응 없음. 근사: 정신 상태, `fear`, `obedience`, `love` | 표현 단계는 정신 상태로 대신 가능 (6절) |
| notedMoments, topOfMind | 강한 순간 기억, 오늘 마음에 걸리는 일 | 없음. 가장 큰 무드렛으로 대신 가능 | 신규(작게) |
| 대사 반복 방지(cooldown) | 같은 문장 연속 방지 | 없음 | 신규 |

## 5. 사건 매칭: 매일 일어나는 일만 기준으로
손님 접대는 창관 모드 전까지는 특정 이벤트 액션이다. 첫 적용 대상에서 뺀다.

| 잭오나 일상 사건 | 생기는 무드렛 | 빈도 |
|---|---|---|
| 처벌 (`torture_intensity`) | `neg_pain`, `neg_fear`, 처벌 안 함이면 `pos_no_punish` | 높음 |
| 보상·칭찬 (`interaction_reward_level`, `cheer_rate`) | `pos_praise`, `pos_reward`, 없으면 `neg_no_praise` | 높음 |
| 성관계 | `pos_orgasm`, `neg_forced`, `neg_raped` | 높음 |
| 잠자리 (규칙 패널) | `pos_sleep`, `neg_bad_sleep`, `pos_slept_with_master` | 매일 |
| 식사 (규칙 패널) | `pos_cookie`, `neg_slave_food`, `neg_hungry` | 매일 |
| 일·수업 | `pos_job`, `neg_job` | 높음 |
| 청결·옷 | `pos_slave_clean`, `neg_slave_dirty`, `neg_naked`, `pos_clothes` | 매일 |
| 규칙 | `neg_rules` | 매일 |

## 6. 최소 추가안 (설계 방향, 미확정)
1. **원인 기록**: 무드렛을 올리는 줄 옆에 날짜와 인물을 함께 기록한다. 예: `slave['neg_pain']`을 올릴 때 `slave['src_neg_pain_day'] = day`, `$slave['src_neg_pain_who'] = '주인님'`. 노예 배열 안에 두므로 노예 교체 때 같이 옮겨질 가능성이 높다(교체 처리 확인 필요).
2. **표현 단계**: 새 신뢰 변수 없이 정신 상태로 정한다(초안).
   - servile·obedient·soft·optimistic → 드러냄
   - docile·reluctant → 암시
   - frightened·broken·depresive·lachrymose → 숨김
   - arrogant·hateful·resistant → 거짓 표정
   - 자아(`ego`)와 태도(`pride`)가 높으면 한 단계 덜 드러낸다
3. **출력 위치**: 노예 정보 화면 하단 서술. 지금의 정신 상태 고정 문장을 앞에 두고, 가장 큰 무드렛 + 원인 + 몸 상태 조각을 붙인다. 이미 노예 상태를 서술하는 자리라 화면 구성이 바뀌지 않는다.
4. **조각 조립과 반복 방지**: 샘플(QSP 시험 통과)과 같은 방식을 쓴다. 조각 표는 `{when}`/`{who}` 빈칸 표시와 `replace`를 쓴다. QSP 함정은 세 가지다. `$이름`과 `이름`은 같은 변수이고, 문자열 안의 `<<>>`는 대입할 때 계산되며, 한 줄 `elseif`는 안 된다.
5. **세이브 호환**: 새 키가 비어 있으면 지금과 같은 고정 문장이 나오게 한다.

## 7. 사용자 결정이 필요한 것
1. 신뢰 변수를 새로 만들지, 정신 상태로 대신할지 (초안은 대신함)
2. 첫 샘플 출력 위치 (초안은 노예 정보 하단 서술)
3. 첫 샘플에 넣을 사건 (초안은 처벌, 칭찬·보상, 잠자리 3종)
4. 구현 담당 (역할상 로컬 도구 또는 Codex)
