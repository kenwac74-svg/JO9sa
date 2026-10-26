# 특성 복원 구현 기준 — 2026-10-19

이번 작업은 사용자 승인에 따라 기존 효과가 없는 특성을 실제로 추가하는 것이다. 7건에 대응하는 기존 한국어 표시 설명과 작동 효과는 감사 결과 없다. 일부 JSON seed 값은 남아 있으므로 이를 새 일반 생성 경로에서 읽는다. 과거 seed 값이 있다는 사실과 현재 효과가 있다는 사실은 구분한다.

## 구성

새 QSP 로케이션을 추가하지 않고 기존 `jo9_traits`에 등록·설명·편집·효과 진입점을 둔다. 기존 `get_stock_seed`, `#static_base`, `#dynamic` 및 실제 경험치 호출 지점에서 호출한다. 발화 불가의 메뉴·수업 제한은 별도 `voice-transform.cjs`가 담당한다.

| ID | 인물 필드 | 신규 효과 기준 |
|---|---|---|
| oral_pref | oral_affinity > 0 | oral 범주 기술의 양의 경험치 +50%, 해당 행동의 수용 계산 +2 |
| gag_reflex | jo9_gag_reflex = 1 | sub_bj/sub_dt 행동의 수용 계산 -2. 키스·혀 애무 등은 제외 |
| anal_pref | anal_affinity > 0 | sub_anal/anal_stretch 양의 경험치 +50%, 해당 행동의 수용 계산 +2 |
| anal_averse | anal_affinity < 0 | 해당 행동의 수용 계산 -2 |
| defiant | defiant = 1 | 자존심이 0이 되거나 기존 정신 상태가 broken이 될 때까지 양의 moral_rate를 0으로 제한. 기존 moral과 음수 변화는 유지 |
| innate_mute | jo9_voice_trait = 1 | 발화 의존 행동 제한; 별도 voice 변환에서 연결 |
| tongue_loss | jo9_voice_trait = 2 | 발화 의존 행동 제한; 별도 voice 변환에서 연결 |

위 수치는 원고에 없는 구체값을 구현하기 위해 이번에 선택한 기준이다. 기존 원작 수치를 복구한 것으로 설명하지 않는다. `oral_affinity < 0`은 신체적 구역반사와 같다고 입증되지 않아 새 `jo9_gag_reflex`로 분리한다. 옛 `mute`의 숫자 구분도 추정해서 이전하지 않는다.

구강 선호의 기술 범위는 oral, sub_kiss, sub_tongue, sub_bj, sub_dt, sub_asslik이다. 항문 선호/기피는 sub_anal, anal_stretch이다. 다른 기술과 일반 penetration 집계 전체에는 보너스를 부여하지 않는다.

## 인물 생성 및 세이브

- 기존 고정 템플릿의 `seed_oral_affinity`, `seed_anal_affinity`, `seed_defiant`를 일반 `get_stock_seed` 경로에 연결한다. 값은 보존하며 음수 oral 값에 구역반사를 임의로 부여하지 않는다.
- 새 필드는 `seed_jo9_gag_reflex`, `seed_jo9_voice_trait`로 지정 가능하다. 지정하지 않으면 0이다.
- 기존의 새 무작위 인물 전용 `jo9_traits/generate` 호출에서 oral 10%, gag 10%, anal 선호 10%/기피 10%, defiant 10%, 발화 불가 1%/혀 손실 1%를 추첨한다.
- 기존 세이브 인물을 다시 추첨하지 않는다. 새 기능을 기존 인물에 부여하려면 편집기에서 선택한다.
- +50%의 정수 나눗셈 손실은 인물별 `jo9_oral_xp_credit`, `jo9_anal_xp_credit`의 나머지(0 또는 1)로 보존한다. 1 XP 두 번이면 총 3 XP가 된다. 다른 인물의 경험치를 섞지 않는다.
- `jo9_defiant_resolved`는 조건 충족으로 해소되었음을 기록한다. 편집기로 다시 부여할 때 해소 기록을 초기화한다.

## 호출 계약

- `func('jo9_traits','restored_xp', 역할, 기술, 기본경험치)` → 최종 경험치. 기술은 실제 키 또는 기존 `$subskill` 표현식을 받을 수 있다. 양의 보너스 대상만 분수 누적값을 변경한다.
- `func('jo9_traits','restored_acceptance', 역할, 기술)` → 해당 특성의 수용 계산 보정값. 상태를 변경하지 않는다. 원래 행동이 stimulating/orgastic인 실행 분기 안에서 호출한다.
- `gs 'jo9_traits','restored_refresh', 역할` → 불복종의 양의 헌신 증가 억제 및 해소 조건 갱신. 기존 수치의 음수 변화와 무관한 필드는 변경하지 않는다.
- `jo9_traits/list`, `describe`, `editor`, `edit`, `generate` → 기존 계약을 유지하고 7건을 추가한다.

Master Alex의 직접 moral 증가 227581/227582/227583도 같은 불복종 조건으로 제한한다. 227584 완료 서비스와 `hard_return` 초기 설정은 자존심을 0으로 만드는 경로라서 기존 효과가 유지된다. 새 인물의 seed 초기 moral과 편집기로 직접 지정하는 값은 자연 성장과 다르므로 기존대로 유지한다.

등록 모듈만 제거하면 추가 특성이 표시·편집되지 않는다. 효과 훅을 남긴 채 모듈을 제거하면 호출은 존재하지만 효과를 반환하지 못한다. 반대로 등록만 남기고 호출 훅을 제거하면 설명과 표시는 남으나 실제 효과가 작동하지 않는다. 함께 제거해야 한다.

## 검증 한계

감사 기준은 Work QSP `f69637e965af4489a7328eee91864df3e0b3dc22c4ab948c4913b106a68fb753`이다. 실제 엔진에서 등록·설명·편집·역할 분리·무특성 동일 동작·경험치·수용 계산·헌신 억제와 해소를 검증한다. 이미지나 문장의 미학적 검수와 장기간 밸런스 검증은 별도 플레이 영역이다.
