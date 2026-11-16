# Q04 WORK 소스·배포 입력 통일

2026-11-13 사용자 승인 반영. QSP bf27cb384e3c48ee166aeeb557d96314df65306d10aae6ea402e7ba72c5bf30e 유지.

## 반영 결과

- WORK의 수동 JSON20개(기존19개+2339_yagisuna 신규1개), 이미지162개를 추적 소스에 맞췄다. 기존28개는 변경 전 원본을 gzip으로 보존했고 신규154개는 정확 경로·SHA를 기록했다. 이미지162개는 새 그림 수가 아니라 소스와 내용/등록이 달랐던 파일 수다.
- WORK 게임 파일·개인SAV·Full·음원은 변경하지 않았다. 커밋·푸시·ZIP 생성 없음.
- 전체 런타임 43,217개를 입력원장으로 작성했다. 원장의 state는 WORK_RUNTIME_INPUT_SNAPSHOT_NOT_PACKAGE_FROZEN이다. 모드툴546파일은Q05 동봉 결정 대기 목록이며 현재 런타임 payload와 구분한다. 루트 실행기 해시를 기록했고 구버전설치문서/개인상태/제작원본은 자동 포함하지 않았다.
- Girls 32,356개 전수SHA. 공개3차 이후 신규54·변경160·동일32142. [파일별표](../../docs/release-prep/2026-11-13/GIRLS_CHANGELOG_KO.md).

## JSON 소스 변경

| WORK 경로 | 유형 | 달라진 키 |
|---|---|---|
| json/slaves/1448_Shiru.json | 기존 소스 갱신 | indpack_title |
| json/slaves/2339_yagisuna.json | 신규 소스 | seed_name, fullimage, fullmade, fullmistress, fullsecretary, seed_ava, seed_ava_gray, seed_ava_clear, seed_age, seed_boobs, seed_boobs_img, seed_pussy_img, seed_psy_basic, seed_world, seed_world_description, seed_family_description, seed_occupation_description |
| json/slaves/2572_felicity.json | 기존 소스 갱신 | indpack_title, indpack_naked |
| json/slaves/2573_wilhelmine.json | 기존 소스 갱신 | seed_world_description, seed_family_description, seed_occupation_description, indpack_title, indpack_naked |
| json/slaves/2574_yasmin.json | 기존 소스 갱신 | seed_boobs, indpack_title, indpack_naked |
| json/slaves/2576_julia.json | 기존 소스 갱신 | indpack_title, indpack_naked |
| json/slaves/2577_pelageya.json | 기존 소스 갱신 | indpack_title, indpack_naked |
| json/slaves/2579_egeya.json | 기존 소스 갱신 | indpack_title |
| json/slaves/2582_rachel.json | 기존 소스 갱신 | indpack_title, indpack_naked, fullmade, fullsecretary, fullmistress |
| json/slaves/2583_galateya.json | 기존 소스 갱신 | indpack_title |
| json/slaves/2584_venera.json | 기존 소스 갱신 | indpack_title, indpack_naked, fullmade, fullsecretary, fullmistress |
| json/slaves/2585_pelageya.json | 기존 소스 갱신 | indpack_title, indpack_naked |
| json/slaves/2605_vampirella.json | 기존 소스 갱신 | indpack_title, indpack_naked, fullmade, fullsecretary, fullmistress |
| json/slaves/2611_snegurochka.json | 기존 소스 갱신 | fullmade, fullmistress, fullsecretary, indpack_title, indpack_naked |
| json/slaves/2614_snezhana.json | 기존 소스 갱신 | fullmade, fullmistress, fullsecretary, indpack_title, indpack_naked |
| json/slaves/2617_jasmine.json | 기존 소스 갱신 | fullmade, indpack_title, indpack_naked |
| json/slaves/2624_erza.json | 기존 소스 갱신 | fullmade, fullmistress, fullsecretary, indpack_title, indpack_naked |
| json/slaves/3002_Luminous.json | 기존 소스 갱신 | fullmade, fullmistress, fullsecretary, indpack_title, indpack_naked |
| json/slaves/3013_Shaakti.json | 기존 소스 갱신 | fullmade, fullmistress, fullsecretary, indpack_title, indpack_naked |
| json/slaves/3021_Diana.json | 기존 소스 갱신 | fullmade, fullmistress, fullsecretary, indpack_title, indpack_naked |

## 옛 경로 보존

기존부터 WORK에 없던9경로는 소스 원본과 원장 항목을 모두 보존했다. 실제 게임 폴더에 임의 복원하지 않았다. 4개 옛 초상은 마이그레이션 검토 대상, Gloria4개는 미배포 캐릭터의 철회된 복구 제안,2339는 이름 변경 전JSON이다. 이들을 모두 공개세이브 호환 오류로 취급하지 않는다. 현재 활성 입력에는2339_yagisuna 하나만 넣어 같은ID 이중생성을 막는다. 남아 있는 정상 옛 경로·36개 지정호환관계도 유지한다.

## 검증

전체 런타임SHA를 수집하고 이후 크기·수정시각이 그대로인지 확인했다. 복사182개는WORK/소스SHA 재대조·JSON파싱·PNG162헤더/치수 확인. 활성캐릭터JSON1157개, 중복숫자ID0, 소스불일치0. 지정호환36관계 일치. 기존부터 부재한 옛9개는 별도 기재했다. 신규저장키/게임코드변경0이므로 이번 파일 통일을 전체 엔진/GUI/CRC로드 검증으로 표현하지 않는다. 최종 포장 때 다시 전체 입력을 동결·해시하고 출고 검사를 한다.

[소스 변경 계획](resource-sync-plan.json) · [실제 복사 결과](source-sync-result.json) · [검증](resource-verification.json) · [옛 경로 분류](legacy-retention.json) · [2.4.2 입력](../../assets/runtime-manifests/2.4.2-work.json).

원복 근거는source-before.json.gz의28개 원본과원장 gzip 및154개 신규경로 목록이다. 원본을무조건되돌리거나새파일을삭제하는자동롤백은수행하지않는다. 기존sources/읽기전용자료는수정하지않았다.
