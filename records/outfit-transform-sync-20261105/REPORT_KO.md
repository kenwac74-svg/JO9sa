# 복장 이미지 구도 조정 결과 — 2026-11-05

첨부한 manifest.json과 jo9_project.json의 45개 항목은 795×596 캔버스의 동일한 확대·이동 설정입니다. 두 문서의 항목별 값이 일치합니다.

## 반영 결과

- WORK의 `girls/full/cloth` 45장에 첨부된 인물별 확대율(s), 가로 이동(x), 세로 이동(y)을 그대로 적용했습니다.
- 결과는 모두 795×596 RGBA PNG입니다. 투명 경계의 검은 테두리를 방지하도록 알파를 곱한 상태에서 보간했습니다.
- WORK와 추적 이미지 사본을 맞추고 이미지 패치 원장 및 체크리스트를 갱신했습니다.
- 기본 전신·QSP·JSON·배포 폴더는 변경하지 않았습니다.
- 원본: `G:/somi/JO9resource/character_originals/outfit_transform_20261105/cloth`

## 같은 번호의 파일을 구분한 이유

번호 기준으로만 찾으면 296장이 검색됩니다. 그중 45장은 첨부 파일명과 일치하는 하녀 복장이고, 나머지는 44개의 다른 이름 복장과 3개 번호 폴더의 207장입니다. 현재 JSON의 등록 이름과 첨부 파일 이름이 달라, 같은 번호를 공유하는 옛 파일과 새 등록 외형을 구분해야 합니다.

실제 그림도 대조했습니다. 예를 들어 첨부 1069번은 금발 인물이고, 다른 이름의 같은 번호는 파란 머리 인물이며, 1069 번호 폴더에는 또 다른 복장팩이 있습니다. 이 251장에 첨부 값을 일괄 적용하면 다른 인물을 확대하거나 머리를 화면 밖으로 잘라낼 수 있어 이번 반영에서 제외했습니다. 제외 목록은 `excluded.json`, 현재 JSON 연결은 `reference-audit.json`에 기록했습니다.

이 변경은 첨부된 옛 파일명의 복장을 사용하는 화면·저장 자료에 적용됩니다. 현재 JSON이 다른 이름의 이미지를 선택하는 캐릭터의 외형까지 바꾸는 작업은 아닙니다.

## 적용 목록

| 번호 | 복장 파일 | 확대율 | X | Y |
| --- | --- | ---: | ---: | ---: |
| 1136 | `girls/full/cloth/1136_brown_long_young.png` | 1.234453 | -93.814 | -138.108 |
| 1137 | `girls/full/cloth/1137_brown_long_young.png` | 1.292000 | -118.557 | -173.901 |
| 1046 | `girls/full/cloth/1046_blond_long_young.png` | 1.214000 | -87.288 | -126.269 |
| 1048 | `girls/full/cloth/1048_blond_long_young.png` | 1.204000 | -84.905 | -120.733 |
| 1049 | `girls/full/cloth/1049_blond_long_young.png` | 1.154000 | -61.223 | -90.167 |
| 1050 | `girls/full/cloth/1050_blond_long_young.png` | 1.154000 | -62.209 | -92.029 |
| 1051 | `girls/full/cloth/1051_blond_long_young.png` | 1.190000 | -96.631 | -112.310 |
| 1052 | `girls/full/cloth/1052_blond_long_young.png` | 1.164000 | -58.759 | -97.983 |
| 1053 | `girls/full/cloth/1053_blond_long_young.png` | 1.160000 | -66.865 | -95.055 |
| 1066 | `girls/full/cloth/1066_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1067 | `girls/full/cloth/1067_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1068 | `girls/full/cloth/1068_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1069 | `girls/full/cloth/1069_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1070 | `girls/full/cloth/1070_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1071 | `girls/full/cloth/1071_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1072 | `girls/full/cloth/1072_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1073 | `girls/full/cloth/1073_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1074 | `girls/full/cloth/1074_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1075 | `girls/full/cloth/1075_blond_short_young.png` | 1.160000 | -77.582 | -87.482 |
| 1076 | `girls/full/cloth/1076_blond_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1077 | `girls/full/cloth/1077_blond_short_young.png` | 1.141000 | -41.937 | -82.376 |
| 1088 | `girls/full/cloth/1088_blue_long_young.png` | 1.160000 | -58.038 | -92.531 |
| 1089 | `girls/full/cloth/1089_blue_long_young.png` | 1.160000 | -66.865 | -95.055 |
| 1090 | `girls/full/cloth/1090_blue_long_young.png` | 1.160000 | -66.865 | -95.055 |
| 1091 | `girls/full/cloth/1091_blue_long_young.png` | 1.182000 | -58.649 | -107.411 |
| 1092 | `girls/full/cloth/1092_blue_long_young.png` | 1.160000 | -66.865 | -95.055 |
| 1093 | `girls/full/cloth/1093_blue_long_young.png` | 1.140000 | -54.445 | -79.118 |
| 1094 | `girls/full/cloth/1094_blue_long_young.png` | 1.160000 | -66.865 | -95.055 |
| 1095 | `girls/full/cloth/1095_blue_long_young.png` | 1.160000 | -66.865 | -95.055 |
| 1096 | `girls/full/cloth/1096_blue_long_young.png` | 1.160000 | -66.865 | -95.055 |
| 1097 | `girls/full/cloth/1097_blue_long_young.png` | 1.160000 | -61.821 | -95.686 |
| 1098 | `girls/full/cloth/1098_blue_long_young.png` | 1.110000 | -44.344 | -62.323 |
| 1099 | `girls/full/cloth/1099_blue_long_young.png` | 1.110000 | -45.588 | -64.678 |
| 1100 | `girls/full/cloth/1100_blue_long_young.png` | 1.160000 | -66.865 | -95.055 |
| 1111 | `girls/full/cloth/1111_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1112 | `girls/full/cloth/1112_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1113 | `girls/full/cloth/1113_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1114 | `girls/full/cloth/1114_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1115 | `girls/full/cloth/1115_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1116 | `girls/full/cloth/1116_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1117 | `girls/full/cloth/1117_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1118 | `girls/full/cloth/1118_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1119 | `girls/full/cloth/1119_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1120 | `girls/full/cloth/1120_blue_short_young.png` | 1.160000 | -66.865 | -95.055 |
| 1133 | `girls/full/cloth/1133_brown_long_young.png` | 1.180000 | -81.176 | -107.206 |

## 확인 범위

45장 파일 열림·크기·WORK/추적 사본 해시 일치, 기본 전신 및 제외 파일 해시 유지, QSP 유지와 체크리스트 태그 보존을 확인했습니다. 게임 내 외관은 미확인입니다.

이미지 체크리스트를 새로고침한 뒤 `cloth/1046_blond_long_young.png`, `cloth/1136_brown_long_young.png` 등의 머리 위 여백과 기존 전신과의 크기를 눈으로 확인해 주세요.
