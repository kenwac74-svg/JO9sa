# 전신 35개 주소·복장 32장 최신화 — 2026-11-05

상태: **WORK 반영 완료 / 차기 패치 포함 예정 / 배포 미반영**

## 결과

- 전신 35개 주소와 같은 인물의 하녀 복장 32장, 총 67개 파일을 최신화하고 패치 대상으로 등록했습니다. 모두 795×596 RGBA PNG입니다.
- 이전 E 묶음의 25종은 이번 값이 같은 원본 입력에 대한 새 조정임을 source key와 해시로 확인해, 전신·하녀 모두 검증된 원본에서 다시 출력했습니다.
- 1299번은 H 출력 결과 자체가 이번 입력이므로 이전 출력에 추가 조정을 한 번 적용했습니다. 이 경우를 원본 재조정과 구분했습니다.
- 실제 재출력은 전신 26장과 하녀 32장입니다. 사용자가 이미 조정한 최신 전신 9장은 그대로 유지하고 패치에 등록했습니다.
- 같은 숫자 번호의 다른 등록 이름 95개 경로는 유지했습니다. 제외 경로는 excluded.json에 있습니다.
- QSP·캐릭터 JSON·파일명·번호·사용자 상태 태그·배포 폴더는 변경하지 않았습니다. 2071번 오류 수정 대기는 별도 기록대로 유지합니다.

## 두 Felicity 주소 유지

`girls/full/felicity_blond_long.png`와 `girls/full/felicity_blond_long_young.png`는 파일 내용이 같은 두 주소입니다. 사용자 내보내기 목록에 둘 다 있으므로 두 경로를 모두 보존하고 패치에도 각각 포함했습니다. 같은 해시라는 이유로 어느 한 주소를 제거하지 않습니다. applied.json의 intentionalDuplicateAddresses에 명시했습니다.

## 전용 하녀 파일이 없는 주소

- 1375_white_long_young.png
- felicity_blond_long.png
- felicity_blond_long_young.png

이 세 주소는 기본 전신만 이번 패치에 등록했습니다.

## 이번 내보내기에서 제외한 프로젝트 항목

- julia_red_long.png
- julia_red_long_young.png
- 1185_green_long_young.png
- 1196_green_short_young.png
- 1302_white_long_young.png

위 목록은 이번 묶음의 제외 항목이며 이전 묶음의 전체 적용 상태를 취소한다는 뜻이 아닙니다.

## 복구·출처

이전 상태는 해시가 검증된 개인 패치 objects 사본을 재사용하고, 없는 사본만 G:/somi/JO9resource/character_originals/outfit_transform_20261105-i 에 보관했습니다. beforePath는 직전 상태 복구용, transformSourcePath는 실제 변환 입력입니다. 1375 전신의 독립 원본 baseline은 미확인이므로 현재 사용자 export를 유지했습니다.

## 적용 목록

| 경로 | 처리 | 확대율 | X | Y |
| --- | --- | ---: | ---: | ---: |
| `girls/full/1134_brown_long_young.png` | base-rebase-original | 1.138000 | -46.500 | -82.000 |
| `girls/full/1140_brown_long_young.png` | base-rebase-original | 1.114000 | -40.000 | -68.000 |
| `girls/full/1142_brown_long_young.png` | base-rebase-original | 1.179000 | -68.100 | -107.000 |
| `girls/full/1144_brown_long_young.png` | base-rebase-original | 1.167000 | -75.100 | -100.000 |
| `girls/full/1157_brown_short_young.png` | base-rebase-original | 1.190000 | -75.000 | -113.000 |
| `girls/full/1167_brown_short_young.png` | base-rebase-original | 1.129000 | -49.000 | -77.000 |
| `girls/full/1176_green_long_young.png` | base-rebase-original | 1.147000 | -55.000 | -88.000 |
| `girls/full/1177_green_long_young.png` | base-rebase-original | 1.157000 | -51.000 | -92.100 |
| `girls/full/1178_green_long_young.png` | base-rebase-original | 1.189000 | -72.000 | -112.400 |
| `girls/full/1180_green_long_young.png` | base-rebase-original | 1.181000 | -72.000 | -107.000 |
| `girls/full/1182_green_long_young.png` | base-rebase-original | 1.181000 | -61.000 | -106.800 |
| `girls/full/1183_green_long_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1184_green_long_young.png` | base-rebase-original | 1.180000 | -82.000 | -107.000 |
| `girls/full/1186_green_long_young.png` | base-rebase-original | 1.180000 | -63.000 | -107.000 |
| `girls/full/1191_green_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1192_green_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1193_green_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1194_green_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1197_green_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1198_green_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1199_green_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1212_pink_long_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1233_pink_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1236_pink_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1264_purple_short_young.png` | base-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/1299_white_long_young.png` | base-affine-previous-export | 1.096000 | -44.503 | -57.499 |
| `girls/full/1375_white_long_young.png` | base-existing-new-export-register | 1.082000 | -50.400 | -51.000 |
| `girls/full/2086_blue_long_milf.png` | base-existing-new-export-register | 1.158000 | -62.300 | -94.000 |
| `girls/full/2124_brown_long_milf.png` | base-existing-new-export-register | 1.113000 | -43.000 | -67.000 |
| `girls/full/2128_brown_long_milf.png` | base-existing-new-export-register | 1.138000 | -61.000 | -82.000 |
| `girls/full/2129_brown_long_milf.png` | base-existing-new-export-register | 1.163000 | -64.300 | -97.000 |
| `girls/full/2200_pink_short_milf.png` | base-existing-new-export-register | 1.125000 | -49.200 | -75.000 |
| `girls/full/2272_red_short_milf.png` | base-existing-new-export-register | 1.147000 | -57.900 | -88.000 |
| `girls/full/felicity_blond_long.png` | base-existing-new-export-register | 1.180000 | -82.000 | -107.000 |
| `girls/full/felicity_blond_long_young.png` | base-existing-new-export-register | 1.180000 | -82.000 | -107.000 |
| `girls/full/cloth/1134_brown_long_young.png` | costume-rebase-original | 1.138000 | -46.500 | -82.000 |
| `girls/full/cloth/1140_brown_long_young.png` | costume-rebase-original | 1.114000 | -40.000 | -68.000 |
| `girls/full/cloth/1142_brown_long_young.png` | costume-rebase-original | 1.179000 | -68.100 | -107.000 |
| `girls/full/cloth/1144_brown_long_young.png` | costume-rebase-original | 1.167000 | -75.100 | -100.000 |
| `girls/full/cloth/1157_brown_short_young.png` | costume-rebase-original | 1.190000 | -75.000 | -113.000 |
| `girls/full/cloth/1167_brown_short_young.png` | costume-rebase-original | 1.129000 | -49.000 | -77.000 |
| `girls/full/cloth/1176_green_long_young.png` | costume-rebase-original | 1.147000 | -55.000 | -88.000 |
| `girls/full/cloth/1177_green_long_young.png` | costume-rebase-original | 1.157000 | -51.000 | -92.100 |
| `girls/full/cloth/1178_green_long_young.png` | costume-rebase-original | 1.189000 | -72.000 | -112.400 |
| `girls/full/cloth/1180_green_long_young.png` | costume-rebase-original | 1.181000 | -72.000 | -107.000 |
| `girls/full/cloth/1182_green_long_young.png` | costume-rebase-original | 1.181000 | -61.000 | -106.800 |
| `girls/full/cloth/1183_green_long_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1184_green_long_young.png` | costume-rebase-original | 1.180000 | -82.000 | -107.000 |
| `girls/full/cloth/1186_green_long_young.png` | costume-rebase-original | 1.180000 | -63.000 | -107.000 |
| `girls/full/cloth/1191_green_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1192_green_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1193_green_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1194_green_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1197_green_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1198_green_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1199_green_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1212_pink_long_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1233_pink_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1236_pink_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1264_purple_short_young.png` | costume-rebase-original | 1.180000 | -71.000 | -107.000 |
| `girls/full/cloth/1299_white_long_young.png` | costume-affine-previous-export | 1.096000 | -44.503 | -57.499 |
| `girls/full/cloth/2086_blue_long_milf.png` | costume-affine-current-original | 1.158000 | -62.300 | -94.000 |
| `girls/full/cloth/2124_brown_long_milf.png` | costume-affine-current-original | 1.113000 | -43.000 | -67.000 |
| `girls/full/cloth/2128_brown_long_milf.png` | costume-affine-current-original | 1.138000 | -61.000 | -82.000 |
| `girls/full/cloth/2129_brown_long_milf.png` | costume-affine-current-original | 1.163000 | -64.300 | -97.000 |
| `girls/full/cloth/2200_pink_short_milf.png` | costume-affine-current-original | 1.125000 | -49.200 | -75.000 |
| `girls/full/cloth/2272_red_short_milf.png` | costume-affine-current-original | 1.147000 | -57.900 | -88.000 |

## 확인

67개 파일의 열림·규격·알파 포맷·WORK/추적 사본 해시 일치와 유지 대상 9개·기존 상태 태그 보존을 확인했습니다. 실제 게임 외관은 사용자 확인 전입니다. 체크리스트를 새로고침해 1134·1299번의 전신과 하녀 크기·여백을 확인해 주세요.
