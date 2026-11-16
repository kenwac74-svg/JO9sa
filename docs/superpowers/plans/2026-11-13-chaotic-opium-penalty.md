# 카오틱 에센스 기존 부작용 연결 Implementation Plan

> For agentic workers: use executing-plans inline; one bounded final independent review. No commit/push without user instruction.

Goal: 성공한 복용에 도미니의 부정적 효과·행동력−2/저행동력 기절·기존 아편형 중독을 연결한다.
Architecture: WORK를 기준으로 단일 jo9_chaotic helper의 성공 지점만 변경. 원래 아편 daily 판정과 저장축을 공유하며 신규 중독공식/영구누적축은 만들지 않는다. 날짜 갱신 전 첫 복용은 on_opium으로 예약하고 추가 복용은 addiction을 즉시+1하여 하루N회=N회 누적.
Tech Stack: QSP codec, 선언형 mods, PowerShell apply_mods, 실제 FastQSP 합성 진단.
Spec: records/chaotic-sanity-review-20261113/LATEST_REQUIREMENTS.json + 사용자 아편형 선택.

Global Constraints: WORK/추적 소스만, 개인 SAV·Full·음원·커밋푸시 제외. 기존 가격·제거우선순위·긍정특성 보호 유지. 새 저장값0개. Domini 명령강제 및 약물의 긍정효과 부여 금지. 원래 스트레스 식은 음수일 때만0으로 제한해 긍정효과 제외.

Review Focus: AP2/1/0의 즉시기절; 실패 시 무소모; 양 역할; 하루중복/기존아편 합산; 체력0의 기존 중독 연산 안전성.

## Task 1 — scoped behavior and proof
- [x] Actual native RED on approved AP behavior (FAIL_CE_slave-ap-5-energy).
- [x] Modify jo9_chaotic; descriptions in menu_form/pharmacy.
- [x] Actual native GREEN on24 scenarios, original next-day opium block, no personal save.
- [x] Exact patch replay/idempotence, roundtrip and changed-scope validation.
- [x] One fresh scoped review; resolve findings and rerun relevant checks.
- [x] Install WORK/tracked QSP and input hashes; update release ledger/notes and retain manual/reproducer; clean synthetic copies.

Ruling: current main working tree contains the user's authoritative uncommitted WORK snapshots. Implementation and tests use an isolated temporary QSP copy with exact hash guards, then synchronize only approved files; a stale-head worktree would discard context. No branch merge or commit.
Ruling: reuse existing opium fields and natural recovery, not the earlier unapproved permanent-total or withdrawal redesign. Extra same-day doses count individually without adding an extra daily dose.
Ruling: only the cast-time negative mood/stress are copied; no Domini spell state is granted. Reuse the existing spellbound mood state and its current description.

Completion: WORK/source d139d7a69212be749f4ed8ce03041a85e2a2712341a548c6b6e92d1228b8fb1e; native36 cases GREEN, exact replay/idempotence/roundtrip, final review no remaining Important issues. No commit/push/Full. Task temporary synthetic copies are removed after this record.
Ruling: faint checks the existing half-action representation (energy*2-half_action), not integer stars alone; the dose cost remains exactly2AP.
