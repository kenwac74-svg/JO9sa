# 최신 62종 재조정 — 2026-11-05

상태: **WORK 반영 완료 / 차기 패치 포함 예정 / 배포 미반영**

## 결과

- 전신 62장과 동일 인물의 하녀 복장 61장, 총 123개 파일을 이번 이미지 패치에 등록했습니다. 모두 795×596 RGBA PNG입니다.
- 전신 43장은 이전 E/F 결과가 WORK에 남아 있고 이번 값은 같은 원본 입력에 대한 새 조정이므로, 검증된 원본에서 새 값으로 다시 출력했습니다.
- 하녀 복장도 같은 43종을 이전 원본 백업에서 다시 출력했습니다. 이전 결과 위에 새 원본 기준 확대를 겹쳐 적용하지 않았습니다.
- 새 복장 17장에는 현재 원본에 이번 값을 적용했습니다. 총 실제 재출력은 전신 43장·하녀 60장입니다.
- 기존 최신 전신 18장과 identity 항목 2개(2259 전신·하녀)는 픽셀을 유지하고 패치에 등록했습니다.
- 1447_black_long_young.png는 일치하는 하녀 복장이 없어 전신만 반영했습니다. 프로젝트에만 있는 1236_pink_short_young.png는 이번 묶음에서 제외했습니다.
- 동일 번호의 다른 등록 이름 10개 경로는 유지했습니다. 목록은 excluded.json입니다.
- QSP·캐릭터 JSON·번호·파일 경로·체크리스트 상태 태그 및 배포 폴더는 변경하지 않았습니다.

## 2071번 오류 수정 대기

사용자의 별도 지시로 [2071 번호 다중 외형·복장 불일치](../girls-2071-issue-20261105/ISSUE_KO.md)를 오류 수정 대상으로 등록했습니다. 관련 12개 파일과 현 JSON 연결을 기록했으며 이번 62종 묶음에서는 2071 이미지를 수정하지 않았습니다.

## 원본과 복구 자료

현재 파일의 이전 해시가 기존 개인 이미지 패치 objects에 있으면 검증 후 그 불변 사본을 복구 경로로 재사용했습니다. 없는 원본만 G:/somi/JO9resource/character_originals/outfit_transform_20261105-h 아래 보관했습니다. beforePath는 직전 화면으로의 복구용이고 transformSourcePath는 이번 조정의 실제 원본이므로 재조정 때 혼동하지 않아야 합니다.

1447·1449의 기본 전신 및 1449 하녀는 순정 폴더에 독립 baseline이 없다는 출처 한계를 inventory.provenanceAmbiguities에 기록했습니다. 두 전신은 최신 입력 파일을 그대로 보존했고, 1449 하녀는 작업 직전 WORK 원본 해시를 확인해 조정했습니다.

## 파일 목록

| 경로 | 처리 | 확대율 | X | Y |
| --- | --- | ---: | ---: | ---: |
| `girls/full/2259_red_long_milf.png` | base-identity-preserve-register | 1.000000 | 0.000 | 0.000 |
| `girls/full/2137_brown_short_milf.png` | base-existing-new-export-register | 1.110000 | -49.000 | -67.000 |
| `girls/full/1206_pink_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1208_pink_long_young.png` | base-rebase-original | 1.190000 | -70.000 | -113.000 |
| `girls/full/1207_pink_long_young.png` | base-rebase-original | 1.190000 | -84.000 | -113.000 |
| `girls/full/1209_pink_long_young.png` | base-rebase-original | 1.190000 | -70.000 | -113.000 |
| `girls/full/1210_pink_long_young.png` | base-rebase-original | 1.190000 | -73.000 | -113.000 |
| `girls/full/1211_pink_long_young.png` | base-rebase-original | 1.190000 | -78.000 | -113.000 |
| `girls/full/1213_pink_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1214_pink_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1215_pink_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1216_pink_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1227_pink_short_young.png` | base-rebase-original | 1.190000 | -74.000 | -113.000 |
| `girls/full/1225_pink_short_young.png` | base-rebase-original | 1.190000 | -97.000 | -113.000 |
| `girls/full/1226_pink_short_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1230_pink_short_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1231_pink_short_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1229_pink_short_young.png` | base-rebase-original | 1.190000 | -87.000 | -113.000 |
| `girls/full/1248_purple_long_young.png` | base-rebase-original | 1.190000 | -70.000 | -113.000 |
| `girls/full/1238_purple_long_young.png` | base-rebase-original | 1.190000 | -73.000 | -113.000 |
| `girls/full/1243_purple_long_young.png` | base-rebase-original | 1.190000 | -68.000 | -113.000 |
| `girls/full/1245_purple_long_young.png` | base-rebase-original | 1.190000 | -82.000 | -113.000 |
| `girls/full/1246_purple_long_young.png` | base-rebase-original | 1.190000 | -86.000 | -113.000 |
| `girls/full/1260_purple_short_young.png` | base-rebase-original | 1.190000 | -74.000 | -113.000 |
| `girls/full/1261_purple_short_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1262_purple_short_young.png` | base-rebase-original | 1.190000 | -87.000 | -113.000 |
| `girls/full/1263_purple_short_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1259_purple_short_young.png` | base-rebase-original | 1.190000 | -75.000 | -113.000 |
| `girls/full/1266_red_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1447_black_long_young.png` | base-existing-new-export-register | 1.179000 | -75.000 | -106.000 |
| `girls/full/1449_green_long_young.png` | base-existing-new-export-register | 1.235000 | -110.000 | -140.000 |
| `girls/full/1269_red_long_young.png` | base-rebase-original | 1.278000 | -106.011 | -163.348 |
| `girls/full/1270_red_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1272_red_long_young.png` | base-rebase-original | 1.190000 | -66.000 | -113.000 |
| `girls/full/1273_red_long_young.png` | base-rebase-original | 1.190000 | -70.000 | -113.000 |
| `girls/full/1274_red_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1275_red_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1277_red_long_young.png` | base-rebase-original | 1.235000 | -89.000 | -140.000 |
| `girls/full/1278_red_long_young.png` | base-rebase-original | 1.209000 | -83.500 | -124.000 |
| `girls/full/1286_red_short_young.png` | base-rebase-original | 1.190000 | -74.000 | -113.000 |
| `girls/full/1287_red_short_young.png` | base-rebase-original | 1.235000 | -91.000 | -140.000 |
| `girls/full/1288_red_short_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1289_red_short_young.png` | base-rebase-original | 1.190000 | -74.000 | -113.000 |
| `girls/full/1292_red_short_young.png` | base-rebase-original | 1.235000 | -92.000 | -140.000 |
| `girls/full/1293_red_short_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1294_white_long_young.png` | base-rebase-original | 1.201000 | -63.900 | -120.000 |
| `girls/full/1295_white_long_young.png` | base-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/1296_white_long_young.png` | base-existing-new-export-register | 1.235000 | -93.800 | -140.000 |
| `girls/full/1297_white_long_young.png` | base-existing-new-export-register | 1.235000 | -93.800 | -140.000 |
| `girls/full/1298_white_long_young.png` | base-existing-new-export-register | 1.235000 | -93.800 | -140.000 |
| `girls/full/1299_white_long_young.png` | base-existing-new-export-register | 1.235000 | -83.000 | -140.000 |
| `girls/full/1301_white_long_young.png` | base-existing-new-export-register | 1.273000 | -100.000 | -163.000 |
| `girls/full/1303_white_long_young.png` | base-existing-new-export-register | 1.235000 | -93.800 | -140.000 |
| `girls/full/1305_white_long_young.png` | base-existing-new-export-register | 1.235000 | -84.000 | -140.000 |
| `girls/full/1306_white_long_young.png` | base-existing-new-export-register | 1.190000 | -63.000 | -113.000 |
| `girls/full/1315_white_short_young.png` | base-existing-new-export-register | 1.190000 | -78.000 | -113.000 |
| `girls/full/1316_white_short_young.png` | base-existing-new-export-register | 1.235000 | -93.800 | -140.000 |
| `girls/full/1317_white_short_young.png` | base-existing-new-export-register | 1.235000 | -90.000 | -140.000 |
| `girls/full/1318_white_short_young.png` | base-existing-new-export-register | 1.235000 | -93.800 | -140.000 |
| `girls/full/1319_white_short_young.png` | base-existing-new-export-register | 1.257000 | -102.600 | -151.000 |
| `girls/full/1320_white_short_young.png` | base-existing-new-export-register | 1.235000 | -93.800 | -140.000 |
| `girls/full/1321_white_short_young.png` | base-existing-new-export-register | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/2259_red_long_milf.png` | costume-identity-preserve-register | 1.000000 | 0.000 | 0.000 |
| `girls/full/cloth/2137_brown_short_milf.png` | costume-affine-current-original | 1.110000 | -49.000 | -67.000 |
| `girls/full/cloth/1206_pink_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1208_pink_long_young.png` | costume-rebase-original | 1.190000 | -70.000 | -113.000 |
| `girls/full/cloth/1207_pink_long_young.png` | costume-rebase-original | 1.190000 | -84.000 | -113.000 |
| `girls/full/cloth/1209_pink_long_young.png` | costume-rebase-original | 1.190000 | -70.000 | -113.000 |
| `girls/full/cloth/1210_pink_long_young.png` | costume-rebase-original | 1.190000 | -73.000 | -113.000 |
| `girls/full/cloth/1211_pink_long_young.png` | costume-rebase-original | 1.190000 | -78.000 | -113.000 |
| `girls/full/cloth/1213_pink_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1214_pink_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1215_pink_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1216_pink_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1227_pink_short_young.png` | costume-rebase-original | 1.190000 | -74.000 | -113.000 |
| `girls/full/cloth/1225_pink_short_young.png` | costume-rebase-original | 1.190000 | -97.000 | -113.000 |
| `girls/full/cloth/1226_pink_short_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1230_pink_short_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1231_pink_short_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1229_pink_short_young.png` | costume-rebase-original | 1.190000 | -87.000 | -113.000 |
| `girls/full/cloth/1248_purple_long_young.png` | costume-rebase-original | 1.190000 | -70.000 | -113.000 |
| `girls/full/cloth/1238_purple_long_young.png` | costume-rebase-original | 1.190000 | -73.000 | -113.000 |
| `girls/full/cloth/1243_purple_long_young.png` | costume-rebase-original | 1.190000 | -68.000 | -113.000 |
| `girls/full/cloth/1245_purple_long_young.png` | costume-rebase-original | 1.190000 | -82.000 | -113.000 |
| `girls/full/cloth/1246_purple_long_young.png` | costume-rebase-original | 1.190000 | -86.000 | -113.000 |
| `girls/full/cloth/1260_purple_short_young.png` | costume-rebase-original | 1.190000 | -74.000 | -113.000 |
| `girls/full/cloth/1261_purple_short_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1262_purple_short_young.png` | costume-rebase-original | 1.190000 | -87.000 | -113.000 |
| `girls/full/cloth/1263_purple_short_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1259_purple_short_young.png` | costume-rebase-original | 1.190000 | -75.000 | -113.000 |
| `girls/full/cloth/1266_red_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1449_green_long_young.png` | costume-affine-current-original | 1.235000 | -110.000 | -140.000 |
| `girls/full/cloth/1269_red_long_young.png` | costume-rebase-original | 1.278000 | -106.011 | -163.348 |
| `girls/full/cloth/1270_red_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1272_red_long_young.png` | costume-rebase-original | 1.190000 | -66.000 | -113.000 |
| `girls/full/cloth/1273_red_long_young.png` | costume-rebase-original | 1.190000 | -70.000 | -113.000 |
| `girls/full/cloth/1274_red_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1275_red_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1277_red_long_young.png` | costume-rebase-original | 1.235000 | -89.000 | -140.000 |
| `girls/full/cloth/1278_red_long_young.png` | costume-rebase-original | 1.209000 | -83.500 | -124.000 |
| `girls/full/cloth/1286_red_short_young.png` | costume-rebase-original | 1.190000 | -74.000 | -113.000 |
| `girls/full/cloth/1287_red_short_young.png` | costume-rebase-original | 1.235000 | -91.000 | -140.000 |
| `girls/full/cloth/1288_red_short_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1289_red_short_young.png` | costume-rebase-original | 1.190000 | -74.000 | -113.000 |
| `girls/full/cloth/1292_red_short_young.png` | costume-rebase-original | 1.235000 | -92.000 | -140.000 |
| `girls/full/cloth/1293_red_short_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1294_white_long_young.png` | costume-rebase-original | 1.201000 | -63.900 | -120.000 |
| `girls/full/cloth/1295_white_long_young.png` | costume-rebase-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1296_white_long_young.png` | costume-affine-current-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1297_white_long_young.png` | costume-affine-current-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1298_white_long_young.png` | costume-affine-current-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1299_white_long_young.png` | costume-affine-current-original | 1.235000 | -83.000 | -140.000 |
| `girls/full/cloth/1301_white_long_young.png` | costume-affine-current-original | 1.273000 | -100.000 | -163.000 |
| `girls/full/cloth/1303_white_long_young.png` | costume-affine-current-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1305_white_long_young.png` | costume-affine-current-original | 1.235000 | -84.000 | -140.000 |
| `girls/full/cloth/1306_white_long_young.png` | costume-affine-current-original | 1.190000 | -63.000 | -113.000 |
| `girls/full/cloth/1315_white_short_young.png` | costume-affine-current-original | 1.190000 | -78.000 | -113.000 |
| `girls/full/cloth/1316_white_short_young.png` | costume-affine-current-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1317_white_short_young.png` | costume-affine-current-original | 1.235000 | -90.000 | -140.000 |
| `girls/full/cloth/1318_white_short_young.png` | costume-affine-current-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1319_white_short_young.png` | costume-affine-current-original | 1.257000 | -102.600 | -151.000 |
| `girls/full/cloth/1320_white_short_young.png` | costume-affine-current-original | 1.235000 | -93.800 | -140.000 |
| `girls/full/cloth/1321_white_short_young.png` | costume-affine-current-original | 1.235000 | -93.800 | -140.000 |

## 확인

123개 파일의 열림·크기·알파 포맷 및 WORK/추적 사본 해시 일치, 유지 대상 20개 픽셀과 체크리스트 태그 보존을 확인했습니다. 실제 게임 외관은 사용자 확인 전입니다.

체크리스트를 새로고침해 1206·1449번 전신/하녀의 크기·상단 여백을 확인해 주세요.
