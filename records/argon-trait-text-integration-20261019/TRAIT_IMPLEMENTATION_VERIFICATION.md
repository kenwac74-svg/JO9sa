# 특성 구현 및 검증 결과

작성: 2026-10-19. 이 문서는 작업 폴더에 작성한 변환 모듈과 격리된 엔진 검증 결과를 설명한다. 플레이 폴더 적용이나 배포 동기화를 수행했다는 뜻은 아니다.

- 변환 모듈: `trait-transform.cjs`
- 모듈 SHA256: `5a090f2a6352a22f19ffcba1345b82437af2ce8845be89f8f0bee029e42f858e`
- 감사·변환 기준 Work SHA256: `f69637e965af4489a7328eee91864df3e0b3dc22c4ab948c4913b106a68fb753`
- 특성 단독 후보 SHA256: `821696dcffd256d9718bb4fd04ae394239af6141324eacf33c5388c5ed05310b`
- 최종 통합 후보 SHA256: `545a59dda6374a1e79fac283cebb80b00cc8892bf23d145bd8ac9c1c6ea76ff2`

## 실제 추가 범위

새 로케이션 0개. `jo9_traits`, `get_stock_seed`, `get_special_assistant_quest`, `#static_base`, `interaction_city`, `#dynamic`, `sex_interaction`의 7개 기존 로케이션을 변경한다.

7개 설명은 기존 한국어 문구를 덮지 않는다. 기존 표시 문구가 없었으며, 아르곤 원고를 새 설명 팝업으로 연결한다. 원래 미사용 러시아어 정의도 수정하지 않았다. 비교 원문 전문은 `TRAIT_MAPPING_KO.txt`에 있다.

인물 필드 5개를 새로 사용한다: `jo9_gag_reflex`, `jo9_voice_trait`, `jo9_oral_xp_credit`, `jo9_anal_xp_credit`, `jo9_defiant_resolved`. 옛 설정 필드 `oral_affinity`, `anal_affinity`, `defiant`는 현행 효과에 연결했다. 새 발화 제한의 실행 가드는 별도 `voice-transform.cjs` 담당이다.

## 주요 패치 ID와 호출 경로

| 패치 ID | 역할 및 의존 관계 |
|---|---|
| ARGON_RESTORED_DESCRIPTIONS | `jo9_traits/describe`. 제공받은 7개 문자열을 그대로 표시 |
| ARGON_RESTORED_LIST | 보유한 추가 특성을 기존 인물 특성 목록에 포함 |
| ARGON_RESTORED_LIST_RETURN | 기존 `dynamic` 내부의 반환 문자열이 버려지던 오류를 `$dyneval` 반환으로 수정. 기존 야심가·약골 등도 실제 목록에 반환 |
| ARGON_RESTORED_EDITOR / EDIT_RESET | 기존 2107 편집 화면에 두 열로 선택 추가. 관련 경험치 나머지와 해소 기록만 초기화 |
| ARGON_RESTORED_GENERATE / SEED | 새 무작위 인물 추첨과 기존 고정 JSON seed 로딩. 현재 인물을 재추첨하지 않음 |
| ARGON_RESTORED_ASSISTANT_* | 특수 조수 seed의 잘못된 `slave_type` 참조를 해당 `assistant_type`으로 일치 |
| ARGON_RESTORED_ACCEPTANCE | 현재 행동의 실제 `$subskill`을 읽어 기존 수용 계산 후 특성 보정. 기존 stimulating/orgastic 분기 안에서 호출 |
| ARGON_RESTORED_PRIMARY_XP / SECONDARY_XP_1·2 | 실제 주·보조 기술을 별도로 지정하여 경험치 증가를 한 번씩 보정 |
| ARGON_RESTORED_DIRECT_XP_001…022 | 기존 별도 장면의 명시적 경험치 22곳에 동일 보정 적용. 여주인 로케이션 변경 없음 |
| ARGON_RESTORED_DEFIANT_BEFORE / AFTER | 기존 속성 계산 전 양의 헌신 증가 억제 및 기존 자존심/정신 상태 계산 후 해소 갱신 |
| ARGON_RESTORED_DIRECT_MORAL_227581·227582·227583 | 유료 수업의 직접 헌신 대입도 조건을 따르게 함. 자존심 0인 완성 서비스는 유지 |

수치 기준, 입력/반환, 세이브 필드, 호출 및 제거의 결과는 `TRAIT_IMPLEMENTATION_SPEC.md`에 기재했다. 구체 수치는 이번 새 구현 기준이며 원작에 완성된 효과를 복구한 것이라고 주장하지 않는다.

## 실제 엔진 검증

미구현 기준 복사본에서 목록·설명·편집 연결과 효과 반환의 실패(RED)를 먼저 확인했다.

특성 단독 UI 3/3 통과: `G:/somi/JO9_work_backups/argon_traits_ui_green_return_fixed_20261019/client-results.json`.

- 노예·조수·개인실 4명에 대해 7개 목록 조건 및 공유 정보창의 실제 소비 경로.
- 아르곤 설명 7개 전체 문자열과 실제 설명 분기 일치.
- 기존 야심가·약골 목록의 반환 회귀 검사.
- 실제 편집 링크·토글과 개인실 역할 교환/복원.

최종 통합 후보 효과 4/4 통과: `G:/somi/JO9_work_backups/argon_trait_effects_combined_20261019/client-results.json`.

- 6개 역할에서 무특성 동일 값, 무관 기술·음수 경험치 유지, +50% 정수 나머지 보존, 특성별 수용 보정.
- 기존 `#dynamic` 수용 계산·주 기술 경험치·보조 기술 경험치 본문 실행. 4 XP가 6 XP, 1 XP 두 번이 합계 3 XP로 처리되어 중복 배율이 없음을 확인.
- 6개 역할의 기존 헌신과 음수 변화 보존, 자존심/정신 상태에 따른 영구 해소, 실제 속성 재계산의 증가 차단. 유료 수업 3곳의 실제 대입 줄을 특성 있음·없음·해소 상태 총 9경우로 실행.
- 실제 `get_stock_seed`가 설정값을 복사하고 없는 값은 0으로 설정. 2,000회 새 인물 추첨의 범위·종류 확인 및 현재 노예의 설정이 바뀌지 않음을 확인.

검사 복사본만 만들었으며 원본 게임·세이브·JSON은 변경하지 않았다. 전체 GUI 조작, 게임 내 설명 팝업의 시각적 배치, 장기 밸런스는 별도 플레이 검수 영역이다. 기존 세이브 상태를 검사에 사용했지만 GUI의 세이브 로드 자체를 대신 검증한 것은 아니다.
