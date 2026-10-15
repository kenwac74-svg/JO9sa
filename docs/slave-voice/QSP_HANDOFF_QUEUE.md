# QSP 수정 핸드오프 대기 목록 (카일)

사용자 지시(2026-10-15): QSP 수정으로 넘길 것들은 모아 두었다가 **나중에 일괄로 핸드오프**한다. 개별로 바로 넘기지 않는다.
QSP 내용 수정은 로컬 담당(집컴·노트북)이 `mods/*.json`과 `tools/apply_mods.ps1`로 적용한다. 핸드오프할 때 이 목록을 mods와 함께 main에 올리고 사용자에게 한 줄 안내를 준다.

| # | 내용 | 근거 | 상태 |
|---|---|---|---|
| 1 | 경찰관 집안 `family_index` 54 → 4 (`generate_stock`) | 설계 문서 12.9 | 사용자 결정 완료. 일괄 원칙 전에 main에 먼저 올림: `mods/2026-10-15_policeman_family_index_fix.json`(4e98bbe). 일괄 핸드오프 때 함께 안내한다 |
| 2 | 직업 후보 묶음의 번역된 값 바로잡기: `$orphan_occupation`의 '창녀' → 'whore', `$orpnange_occupation`의 '창녀' → 'whore', '매춘굴' → 'brothel' | 설계 문서 12.8. 이 값이 뽑히면 직업 처리(능력치·설명)가 빠진다 | 사용자 결정 대기 |
| 3 | `$barbarian_king_occupation`의 'barbarian_princess'에 직업 처리 분기가 없음 | 설계 문서 12.8 | 처리 방법 결정 대기 (분기 추가 또는 기존 직업으로 바꿈) |
| 4 | (선택) 이미 세이브에 있는 경찰관 집안 노예의 `family_index` 54를 불러올 때 4로 바로잡기 | 1번의 후속 | 사용자 결정 대기 |

## QSP가 아닌 배포 설정 (참고, 배포 담당에게 전달)
| 내용 | 근거 |
|---|---|
| 배포본 `FastQSP.ini`에 `ignoreCRC=true` | `ENGINE_AND_PORT_REVIEW.md` 4절. QSP가 바뀐 뒤 세이브 불러오기가 표시 없이 거부되는 문제 |
