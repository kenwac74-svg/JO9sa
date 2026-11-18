# 듀플리카토 에센티아 — 설계 진행 기록

2026-11-16 사용자 확정. WORK와 추적 소스에 지급·시전 구현을 반영했다. 최신 기록은 records/duplicato-essentia-20261116/REPORT_KO.md다.

## 확정

- 명칭: 듀플리카토 에센티아 (Duplicato Essentia).
- 프리실라 귀환 보상에서 마법을 요구하는 선택에 연결한다. 별도 결과 1페이지를 사용한다.
- 노예와 조수가 둘 다 있어야 한다.
- 양방향 친밀도 모두 40 이상. 노예→조수와 조수→노예를 각각 검사한다.
- 조수가 가진 특성 중 하나를 노예에게 **복사**한다.
- **긍정적인 재능 특성만** 대상이다. 성격·기질·종족·칭호·전투 특성은 대상이 아니다.
- 겁쟁이·무모함·용감함은 전투가 아닌 **성격과 기질**이다. 복사 후보에서 제외한다.

## 현재 코드 기준 후보

`#static_base`와 `generate_stock`의 긍정 적성값 1에 해당하는 14키다.

| 표시명 | 내부키 |
|---|---|
| 운동광 | sport_affinity |
| 달변가 | expression_affinity |
| 순종적인 동물 | pet_affinity |
| 순종적인 말 | dressage_affinity |
| 미련한 소 | cowSK_affinity |
| 타고난 간호사 | nurse_affinity |
| 타고난 하녀 | service_affinity |
| 예민한 미각 | cook_affinity |
| 타고난 투사 | gladiatrix_affinity |
| 타고난 마법사 | enchanter_affinity |
| 타고난 미적감각 | art_affinity |
| 절대음감 | music_affinity |
| 발레리나 / 이국적인 댄서 | calisthenics_affinity |
| 보좌관 | secretary_affinity |

춤은 같은 내부키이며 인물 조건에 따라 표시명만 다르다. 천재는 학습 특성, 다재다능은 칭호이며 이 후보 목록과 다르다.

## 최종 확정 및 구현

발견한 재능만, 기존 상충 특성은 제거하고 복사한다. 마법력 B 이상,900스파크,주인공/노예/조수 각각1AP,마법전체하루1회,받는노예평생1회,주는조수반복가능. 양방향친밀도40. 구체적인 사용법·저장영향·검증은 새 구현 보고서를 따른다.
