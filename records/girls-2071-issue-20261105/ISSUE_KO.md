# 2071번 이미지 번호 충돌·복장 불일치 — 해결 완료

- 식별자: JO9-GIRLS-2071-20261105
- 등록일: 2026-11-05 KST
- 현재 상태: 2026-11-05 사용자 승인으로 해결 / 갈색2071·기존 하늘색2324·새 금발2340으로 분리. 아래 초기 조사 기록은 변경 전 근거입니다.
- 범위: G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/girls

## 사용자 제보와 확인 사실

사용자는 2071이라는 동일 번호에 여러 파일이 공존하므로 오류 수정 대상으로 기록하도록 지시했습니다. 현재 관련 PNG는 12개이며 전신은 금발 단발·하늘색 단발·갈색 장발의 3개 등록 이름으로 나뉩니다. 복장은 blue_short와 brown_long 두 경로이고, 얼굴에는 blond_short와 brown_long 두 세트 및 별도 sepia 경로가 있습니다.

앞선 구도 동기화에서 blue_short 전신은 하늘색 단발 인물인데 같은 이름의 하녀 복장은 갈색 장발의 다른 인물인 점을 육안 확인했습니다. 해당 하녀 1장은 조정하지 않고 원본 상태로 보존했습니다. 이 이슈는 그 복장 1장만의 문제로 축소하지 않고 2071 번호 전체의 외형/경로 대응 관계를 수정 대상으로 다룹니다.

현재 json/slaves/2071.json은 갈색 장발 전신·하녀·초상화 세트를 직접 참조합니다. 따라서 모든 현재 게임 화면에서 항상 오표시가 발생한다고 단정하지 않습니다. 다른 파일명 또는 옛 저장 경로를 사용할 때 서로 다른 인물의 전신·얼굴·복장이 섞일 가능성을 확인해야 합니다.

## 파일 목록

| 경로 | 규격 | 바이트 |
| --- | ---: | ---: |
| `girls/face/2071_blond_short_milf.png` | 151×150 | 40485 |
| `girls/face/2071_blond_short_milf_gray.png` | 151×150 | 22521 |
| `girls/face/2071_blond_short_milf_sepia.png` | 151×150 | 32906 |
| `girls/face/2071_brown_long_milf.png` | 150×150 | 53008 |
| `girls/face/2071_brown_long_milf_gray.png` | 150×150 | 42314 |
| `girls/face/2071_brown_long_milf_sepia.png` | 150×150 | 43253 |
| `girls/full/2071_blond_short_milf.png` | 795×596 | 211014 |
| `girls/full/2071_blue_short_milf.png` | 795×596 | 246096 |
| `girls/full/2071_brown_long_milf.png` | 795×596 | 248956 |
| `girls/full/cloth/2071_blue_short_milf.png` | 795×596 | 299774 |
| `girls/full/cloth/2071_brown_long_milf.png` | 795×596 | 299772 |
| `girls/face/sepia/2071_brown_long_milf_sepia.png` | 150×150 | 43253 |

## 현재 JSON 연결

- `fullimage` → `girls/full/2071_brown_long_milf`
- `fullmade` → `girls/full/cloth/2071_brown_long_milf`
- `seed_ava` → `content/pic/girls/face/2071_brown_long_milf_sepia`
- `seed_ava_gray` → `content/pic/girls/face/2071_brown_long_milf_gray`
- `seed_ava_clear` → `content/pic/girls/face/2071_brown_long_milf`

## 이후 수정 시 확인할 범위

1. 2071을 참조하는 현행 JSON·QSP·동적 이미지 조회와 옛 저장의 경로를 구분한다.
2. 각 그림이 같은 인물의 복장인지 별도 인물인지 대조하고, 2071의 기준 세트를 정한다.
3. 파일명 오기 수정·다른 번호로 분리·호환 경로 유지 중 필요한 방식을 결정한다.
4. 기존 저장의 외형 참조를 보존할 범위를 확인한 뒤 수정안을 제출한다.

현재 단계에서는 이미지 교체, 파일명 변경, 이동·삭제, 캐릭터 번호 분리 및 QSP·JSON·SAV 수정은 수행하지 않았습니다. 원본 SHA-256과 JSON 참조는 inventory.json에 기록했습니다.

관련 구도 반영 기록: [G 묶음](../outfit-transform-sync-20261105-g/REPORT_KO.md).

## 최종 처리: 갈색2071 · 하늘색2324 · 금발2340

하늘색은 이미2324로 등록된 사실을 확인하여 재사용하고, 원본 금발만2340으로 추가했습니다. 기존2071 JSON과 옛 이미지 주소는 보존했습니다. [적용·검증 보고서](../girls-2071-split-20261105/REPORT_KO.md).
