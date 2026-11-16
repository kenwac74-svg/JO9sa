> 최신 후속: [성인 설정 확인·이전 제외 요청 적용](../dohna-adult-presets-20261112/REPORT_KO.md). 포르노·조커·슈코 요청은 이제 WORK 반영됐다. 아래의 미적용 설명은 당시 이력이다.

> 연령 판단 정정: [후속 정정 기록](AGE_CLASSIFICATION_CORRECTION_KO.md). seed_age=1과 _loli만으로 실제 미성년이라고 단정했던 판단은 철회했다. 사용자 명시 포르노21세. 아래 미반영 이력과 실제 반영 상태는 구분한다.

# 도나도나 특성·초기 기술 WORK 반영

[22명 특성표·전후 값·제외](TRAITS_KO.md), [설계·요청 범위](DESIGN_PLAN_KO.md).

22 JSON155필드와 기존 get_stock_seed 본문1곳, 새 로케이션 jo9_dohna_traits를 반영했다. 메디코 의료S·린 외모5 외에는 이번에 일반 기술/외모 능력을 추가 조정하지 않았다. 미지정12명의 특성은 직업/성격에 따라 선정했고 리리에/쿄카/린의 후속 사용자 지시를 우선했다. 원작 확정 특성과 이번 JO9 해석은 표에서 구분했다.

## 실행 연결과 사용

기존 get_stock_seed는 jo9_learning_trait/jo9_combat_trait/jo9_constitution/jo9_work_ethic/jo9_focus/jo9_grudge/jo9_attention/jo9_ambition 및 공개 키를 JSON에서 복사하지 않았다. 따라서 JSON만 바꿔서는 일부 지정 특성이 나오지 않는다. get_stock_seed 마지막에 jo9_dohna_traits를 호출해 해당22명에 한해14개 기존 상태 키를 seed 배열에서 복사한다. 일반 인물·대상 외 번호·복제 생성에는 적용하지 않는다. 기존 trait activity/attention/exclusion 정리 함수를 사용하며 새 전역 제한이나 새로운 trait 효과는 만들지 않았다.

원래 정수 enum과 공개 체계를 따른다. 일반 _revealed는2, 야심/끈기/너그러움/일 성향 known은1, 관심종자의 known은2가 공개 상태다. 원래 공개 플래그가 없는 oral/anal/defiant에는 가짜 _revealed 키를 만들지 않는다. 지정값을 읽은 뒤 기존 실제 특성 목록과 생성 과정에서도 유지된다.

입력은 WORK json/slaves의22개 캐릭터 JSON과 seed 배열이다. 출력/부작용은 신규 stock의 초기 특성 값·원래 공개 상태 및 필수 충돌 정리다. 기존 보유 인물이나 개인 SAV를 찾아 덮어쓰는 일회성 마이그레이션·revision 필드를 추가하지 않았다. 캐릭터별 기존 변수에 필요한 값이 저장된다. 기존 인물의 일괄 특성 재지정은 이번 작업에 포함하지 않는다. 새 게임/신규 영입 프리셋 적용이 기준이다.

WORK/추적 JSON·QSP와 assets/runtime-source-2.4.1.json 일치. 모드: mods/2026-11-12_zzzzz_dohna_traits.json. 표식 DOHNA_TRAIT_SEEDS_20261112/DOHNA_TRAIT_SEED_CALL_20261112. 새 함수만 지우면 호출이 남으므로 삭제 시 get_stock_seed의 호출부와 함께 되돌린다. 후속 변경 뒤에는 전체 과거 QSP를 덮지 말고 이 mod의 변경만 역검토한다.

## 검증

- 수정 전 실제 설치 엔진에서 새 seed 누락을 재현했다.
- 수정 후 실제 JSON → 원래 get_stock_seed → 실제 특성 표시 검사가 통과했다.
- 추가로22명 모두 원래 generate_stock 전체 경로를 통과시킨 통합 검사 348단언, 실패0. 지정 특성/공개 키/기존 소개문/나이 보존, 리리에 관심종자 부재, 린 자유로운 영혼, 미스트레스 워커홀릭, 비대상/포르노/복제 대조, 기존 slave 역할 강제 변경 없음.
- QSP 구조/CRLF/왕복·공식 적용기 재생/재적용 무변경·역적용 시 기준본과 바이트 일치.
- 변경155필드 이외의 JSON 값/키 보존, 이름·이미지·이야기·나이 보존. 포르노 JSON은 기준 manifest 해시와 동일.
- 실제 개인 SAV UI 로드·기존 보유 인물의 일괄 특성 재조정·장기 밸런스와 전체 배포 출고 검사는 하지 않았다.

일반 EXE에서 새로 영입한 해당 인물의 정보/특성 목록을 확인한다. 확인 예: 메디코 의료S, 안테나 천재, 리리에 은둔형 외톨이, 쿄카 운동광/타고난 투사, 린 외모5/거센 반항심.

최종 QSP SHA-256: 6aa822b7a38a2bd1a2941eb6b1b70cc9f48b20a702e0ba9505632ce4b4452f7c.

## 미적용과 보존

포르노의 성적 특성·기술, 조커의 성적 행동 연결 특성, 슈코의 색정광은 미성년 분류로 미적용했다. 조커의 비성적 지정은 반영했다. 제한을 회피하려고 나이나 그림을 바꾸지 않았다. ‘타고난 연금술사’는 사용자 선택에 따라 기존 타고난 마법사의 연금술 보너스를 사용한다.

최소 복구 자료: baseline.qsp.gz,22 JSON의 before.gz,manifest 이전 gzip,plan.json의 필드별 차이·입력 해시. 핵심 원고/설계·적용/검증 스크립트와 엔진 로그를 보존했다. Full·원본JO9O·개인 세이브·음원은 변경하지 않았고 커밋·푸시하지 않았다.
