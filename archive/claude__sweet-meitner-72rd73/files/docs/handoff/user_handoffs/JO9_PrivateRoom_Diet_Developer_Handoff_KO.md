# JO9 개인실 식단 시스템 — 개발 AI 핸드오프

작성일: 2026-09-28  
대상: Jack-o-nine-tails 개인실(`room1~room4`) 식사 설정 개편  
저장소 기준: `kenwac74-svg/JO9sa` / `JO9UIpatch`  
문서 목적: **식단 효과 + 일일 비용 + 기존 식비 시스템 연결을 구현하기 위한 개발 지시서**

---

## 0. 핵심 결론

개인실 식단은 최종적으로 3종만 사용한다.

| 식단 | 일 비용 | 핵심 효과 |
|---|---:|---|
| **일반식** | **2 스파크/일** | 기존 개인실 일반식 칼로리 공식 유지 |
| **고열량식** | **4 스파크/일** | 기존 개인실 고열량식 칼로리 공식 유지 |
| **특별식단** | **8 스파크/일** | 일반식 계열 영양 효과 + 장기 특별대우 moodlet + 응석 리스크 |

비용은 즉시 `sparks -= N` 하지 않는다.

> **원작 식비와 동일하게 `total_food_cost`에 일일 누적한다.**

최종 식단 선택지:

1. `일반식`
2. `고열량식`
3. `특별식단`

삭제 대상:

- 굶기 UI
- 촉수 산란액 식단 UI
- 촉수 산란액 소비 로직

---

# 1. 원작에서 확인된 현재 개인실 식단 값

원작 개인실 `roomX_ration`은 현재 다음 값을 사용한다.

```text
roomX_ration = -1  → 굶김
roomX_ration =  1  → 일반 식단
roomX_ration =  0  → 고열량 식단
roomX_ration =  2  → 촉수 산란액
```

현재 `room1~room4`는 거의 동일한 식단 처리 구조를 갖는다.

이번 개편에서는 굶기와 촉수 산란액을 사용자 UI에서 제거한다.

---

# 2. 일반식 — 효과 공식

기존 개인실 공식을 변경하지 않는다.

```qsp
if roomX['fat'] > 1:
    roomX['calories'] = -6
end

if roomX['fat'] = 0:
    roomX['calories'] = 6
end

if roomX['fat'] = 1:
    roomX['calories'] = 3
end

if roomX['neg_hungry'] > 0:
    roomX['calories'] += roomX['stamina']
end
```

요약:

```text
calories =
    fat > 1 ? -6 :
    fat = 1 ? +3 :
              +6
    + (neg_hungry > 0 ? stamina : 0)
```

### 일 비용

```text
2 sparks / day
```

### 비용 처리

```qsp
total_food_cost += 2
```

### 가격 근거

원작 일반 노예 식사 시스템의 B+ 체력 / 보통 배급 기준 건조식이 약 `2 sparks/day`로 설계되어 있다.

개인실 일반식도 기본 유지 식사이므로 같은 가격대를 사용한다.

---

# 3. 고열량식 — 효과 공식

기존 개인실 공식을 변경하지 않는다.

```qsp
roomX['calories'] = 6 + roomX['lactation']

if roomX['neg_hungry'] > 0:
    roomX['calories'] += roomX['stamina']
end
```

요약:

```text
calories =
    6
    + lactation
    + (neg_hungry > 0 ? stamina : 0)
```

### 일 비용

```text
4 sparks / day
```

### 비용 처리

```qsp
total_food_cost += 4
```

### 가격 근거

원작 기준:

```text
건조식 보통 배급 ≈ 2/day
신선식 보통 배급 ≈ 3/day
```

고열량식은 체중 증가 및 수유 상태 추가 섭취까지 포함하는 상위 식단이므로 신선식보다 한 단계 높은 `4/day`로 책정한다.

---

# 4. 특별식단 — 기본 효과

특별식단은 **개인실 특별대우용 프리미엄 식사**다.

체형을 강제로 살찌우는 식단이 아니므로 기본 칼로리 처리는 **일반식 공식 계열**을 사용한다.

```qsp
if roomX['fat'] > 1:
    roomX['calories'] = -6
end

if roomX['fat'] = 0:
    roomX['calories'] = 6
end

if roomX['fat'] = 1:
    roomX['calories'] = 3
end

if roomX['neg_hungry'] > 0:
    roomX['calories'] += roomX['stamina']
end
```

특별식단의 차별점은 칼로리 자체가 아니라:

- 고급 식사 대우
- 장기 긍정 moodlet
- 장기 응석(spoil) 리스크

에 있다.

---

# 5. 특별식단 — 일 비용

최종 가격:

```text
8 sparks / day
```

비용 처리:

```qsp
total_food_cost += 8
```

## 가격 근거

원작 경제 기준:

```text
건조식 보통 배급     ≈ 2/day
신선식 보통 배급     ≈ 3/day
영양사 관리 추가비    = +5/day
보충제               = +1/day
```

따라서:

```text
신선식 3 + 영양사 5 = 8
```

특별식단은 일반 식비보다 명확히 비싼 개인실 프리미엄 대우이면서도, 매일 유지해야 하는 장기 비용이므로 `10/day`보다 `8/day`가 원작 경제와 더 잘 맞는다.

참고로 원작 일회성 간식 가격도:

```text
다크 초콜릿   1
크림 케이크   2
바나나 선데이 4
행복 젤리     8
암브로시아    25
```

이다.

특별식단은 `8/day`를 매일 지불하므로:

```text
5일  = 40
10일 = 80
```

이 필요하다.

4개 개인실을 모두 특별식단으로 유지하면:

```text
32 sparks/day
320 sparks/10 days
```

이므로 충분한 유지비가 발생한다.

---

# 6. 특별식단 — 연속 공급일

신규 최소 변수:

```qsp
roomX['special_diet_days']
```

특별식단을 실제로 공급한 날:

```qsp
roomX['special_diet_days'] += 1
```

### 초기화

다른 식단으로 변경하거나 개인실에서 해당 캐릭터가 빠지면:

```qsp
roomX['special_diet_days'] = 0
```

새로운 범용 관계 스탯이나 별도 친밀도 시스템은 만들지 않는다.

---

# 7. 특별식단 — 장기 moodlet 효과

## 1~4일

```text
추가 moodlet 없음
```

기본 식사 효과만 적용.

## 5~9일

```qsp
roomX['pos_cookie'] = max(roomX['pos_cookie'], 1)
```

## 10일 이상

```qsp
roomX['pos_cookie'] = max(roomX['pos_cookie'], 1)
roomX['pos_dessert'] = max(roomX['pos_dessert'], 1)
```

요약:

```text
1~4일:
    기본 식사

5~9일:
    기본 식사
    + pos_cookie

10일+:
    기본 식사
    + pos_cookie
    + pos_dessert
```

`pos_cookie`와 `pos_dessert`는 원작에 이미 존재하는 긍정 moodlet을 재사용한다.

---

# 8. 특별식단 — 기분 강제 고정 금지

다음 식의 직접 mood 고정은 하지 않는다.

```qsp
roomX['mood'] = max(roomX['mood'], 3)
```

금지 이유:

특별식단이 아래 원작 심리 상태를 무시하는 치트가 되어서는 안 된다.

- `angst`
- 공포
- 심리상태
- 기존 moodlet
- 기존 기분 상한/하한

따라서 기분 효과는 **원작 moodlet 시스템을 통해 간접 적용**한다.

---

# 9. 특별식단 — 응석(spoil) 페널티

5일 이상 연속 공급 시:

```qsp
if roomX['special_diet_days'] >= 5:
    roomX_rate['spoil'] += 1 + roomX['moral']
end
```

공식:

```text
spoil 증가량 = 1 + moral
```

의도:

> 좋은 대우가 지속될수록 긍정 효과가 생기지만, 장기적으로 응석이 늘어나는 리스크도 함께 발생한다.

따라서 특별식단은 단순 상위호환 식단이 아니다.

---

# 10. 일일 식비 처리 방식 — 중요

## 금지

식사 처리 시 직접:

```qsp
sparks -= 2
sparks -= 4
sparks -= 8
```

하지 않는다.

## 사용

원작의 식비 회계 변수:

```qsp
total_food_cost
```

에 누적한다.

예:

```qsp
if roomX_state = CONST_INT['slave_exist']:
    if roomX_ration = 1:
        total_food_cost += 2
    elseif roomX_ration = 0:
        total_food_cost += 4
    elseif roomX_ration = 2:
        total_food_cost += 8
    end
end
```

원작은 이후 회계 처리에서:

```qsp
food_bill = total_food_cost + autobuy_cost
total_food_cost = 0
```

형태로 식비를 결산한다.

따라서 개인실 식비도 이 흐름에 합류시킨다.

---

# 11. 비용 부과 조건

식사를 실제로 제공하는 상태에만 비용을 더한다.

권장:

```qsp
if roomX_state = CONST_INT['slave_exist']:
    ...
end
```

원작 개인실 코드는 기절 상태(`slave_faint`)를 기존 굶김 분기와 같이 처리하고 있으므로, 기절해 실제 식사를 하지 않는 날까지 정상 식사비를 청구하지 않도록 주의한다.

사망/빈 방에도 식비를 청구하지 않는다.

---

# 12. `roomX_ration = 2` 재사용

현재 값 `2`는 촉수 산란액 식단에 사용된다.

이번 기획에서는 촉수 산란액 식단을 제거하므로, **기존 값 `2`를 특별식단에 재사용하는 것이 가장 작은 수정**이다.

권장 최종 매핑:

```text
roomX_ration = 1 → 일반식
roomX_ration = 0 → 고열량식
roomX_ration = 2 → 특별식단
```

이 방식의 장점:

- 기존 `roomX_ration` 구조 유지
- 신규 ration 변수 불필요
- room1~4 반복 구조 최소 변경
- UI와 next-day 식단 분기만 교체 가능

## 주의

기존 저장게임에서 이미 `roomX_ration = 2`인 캐릭터는 이전에는 촉수 산란액 식단이었다.

따라서 기존 세이브 호환 정책이 필요하다면 이를 별도 QA한다.

**세이브 마이그레이션 방법은 이 문서에서 임의 확정하지 않는다.**

---

# 13. 제거할 기존 촉수 식단 로직

기존 `roomX_ration = 2` 분기에서 사용하던 다음 계열은 특별식단으로 교체하면서 제거한다.

- `fiend_tattoo` 식사 판정
- `neg_disgust` 촉수식 관련 판정
- `neg_slave_food` 촉수식 관련 판정
- `perversion_xp` 증가
- `spawn_semen` 소비
- 촉수 산란액 관련 설명문

즉 특별식단에는 `spawn_semen`이 관여하지 않는다.

---

# 14. 굶기 식단 처리

최신 개인실 UX에서는 굶기 식단을 노출하지 않는다.

최종 UI 선택지는 항상:

```text
일반식
고열량식
특별식단
```

세 개다.

다만 기존 저장게임에는 `roomX_ration = -1`이 존재할 수 있으므로:

- 저장 호환 처리
- 기존 -1 값을 자동 일반식으로 전환할지
- 기존 값을 유지하되 UI에서는 숨길지

는 개발 시 별도 확인한다.

**사용자 승인 없이 세이브 값을 일괄 변환하지 않는다.**

---

# 15. room1~room4 공통 적용

동일한 처리를 아래 모두에 적용한다.

```text
room1
room2
room3
room4
```

반복 구현 시 room 번호 복사/붙여넣기 오류를 특히 주의한다.

기존 소스에도 room 변수 오타/교차 참조 가능성이 있으므로 다음을 확인한다.

```text
room1 → room1만 참조
room2 → room2만 참조
room3 → room3만 참조
room4 → room4만 참조
```

---

# 16. 구현 예시

아래는 구조 설명용 의사코드다. 실제 location 이름과 기존 코드 스타일을 유지해 최소 수정한다.

```qsp
! 개인실 식사 설정 - room1 예

if room1_state > CONST_INT['no_slave']:
    room1_rate['hygiene'] += 12 + room1['wounds']

    ! 일반식
    if room1_ration = 1:
        if room1['fat'] > 1: room1['calories'] = -6
        if room1['fat'] = 0: room1['calories'] = 6
        if room1['fat'] = 1: room1['calories'] = 3
        if room1['neg_hungry'] > 0: room1['calories'] += room1['stamina']

        if room1_state = CONST_INT['slave_exist']:
            total_food_cost += 2
        end

        room1['special_diet_days'] = 0

    ! 고열량식
    elseif room1_ration = 0:
        room1['calories'] = 6 + room1['lactation']
        if room1['neg_hungry'] > 0: room1['calories'] += room1['stamina']

        if room1_state = CONST_INT['slave_exist']:
            total_food_cost += 4
        end

        room1['special_diet_days'] = 0

    ! 특별식단
    elseif room1_ration = 2:
        if room1['fat'] > 1: room1['calories'] = -6
        if room1['fat'] = 0: room1['calories'] = 6
        if room1['fat'] = 1: room1['calories'] = 3
        if room1['neg_hungry'] > 0: room1['calories'] += room1['stamina']

        if room1_state = CONST_INT['slave_exist']:
            total_food_cost += 8
            room1['special_diet_days'] += 1

            if room1['special_diet_days'] >= 5:
                room1['pos_cookie'] = max(room1['pos_cookie'], 1)
                room1_rate['spoil'] += 1 + room1['moral']
            end

            if room1['special_diet_days'] >= 10:
                room1['pos_dessert'] = max(room1['pos_dessert'], 1)
            end
        end
    end
end
```

이 예시는 **구조 가이드**다.

기존 starvation 처리 및 상태 갱신 순서를 파괴하지 말고 현재 next-day 처리 구조 안에 최소 변경으로 넣는다.

---

# 17. 가격 밸런스 QA

## 1명 기준

| 식단 | 1일 | 5일 | 10일 |
|---|---:|---:|---:|
| 일반식 | 2 | 10 | 20 |
| 고열량식 | 4 | 20 | 40 |
| 특별식단 | 8 | 40 | 80 |

## 개인실 4개 모두 사용

| 식단 | 1일 | 5일 | 10일 |
|---|---:|---:|---:|
| 일반식 ×4 | 8 | 40 | 80 |
| 고열량식 ×4 | 16 | 80 | 160 |
| 특별식단 ×4 | 32 | 160 | 320 |

특별식단은 장기 유지 시 확실한 비용이 발생하지만 경제를 파괴할 정도의 고정비가 되지 않는 수준을 목표로 한다.

---

# 18. 구현 금지

- 일반식 기존 칼로리 공식 임의 변경 금지
- 고열량식 기존 칼로리 공식 임의 변경 금지
- 특별식단에서 `mood` 직접 강제 설정 금지
- 특별식단에 촉수/정액 로직 재사용 금지
- 식비를 즉시 `sparks`에서 차감하지 말 것
- 개인실마다 서로 다른 가격을 만들지 말 것
- room1~4를 별도 시스템으로 재설계하지 말 것
- generic food architecture 신규 도입 금지
- 세이브 마이그레이션을 임의 확정하지 말 것

---

# 19. 완료 체크리스트

- [ ] 최종 식단 3종: 일반식 / 고열량식 / 특별식단
- [ ] 일반식 효과 공식 원본 유지
- [ ] 고열량식 효과 공식 원본 유지
- [ ] 특별식단 기본 칼로리는 일반식 계열
- [ ] 일반식 비용 `2/day`
- [ ] 고열량식 비용 `4/day`
- [ ] 특별식단 비용 `8/day`
- [ ] 비용은 `total_food_cost`에 누적
- [ ] 빈 방/사망 상태 식비 없음
- [ ] 기절 상태의 실제 식사 여부와 비용 일치
- [ ] 특별식단 5일 `pos_cookie`
- [ ] 특별식단 10일 `pos_dessert`
- [ ] 특별식단 5일 이상 `spoil += 1 + moral`
- [ ] 식단 변경/개인실 이탈 시 연속일 초기화
- [ ] `spawn_semen` 식단 로직 제거
- [ ] room1~4 동일 적용
- [ ] room 간 잘못된 변수 참조 없음
- [ ] 기존 세이브 `roomX_ration = -1/2` 호환성 QA

---

# 20. 최종 구현 정의

> **일반식은 기존 개인실 체형관리 공식을 그대로 유지하며 2 스파크/일이다.**
>
> **고열량식은 기존 `6 + lactation + hungry 보정` 공식을 그대로 유지하며 4 스파크/일이다.**
>
> **특별식단은 일반식 계열 칼로리 공식을 사용하면서 5일부터 `pos_cookie`, 10일부터 `pos_dessert`를 추가하고, 5일 이상부터 `spoil += 1 + moral` 리스크를 준다. 비용은 8 스파크/일이다.**
>
> **모든 비용은 원작 가계 식비 시스템과 동일하게 `total_food_cost`에 누적하며 즉시 `sparks`를 차감하지 않는다.**
