# 중복 JSON 키·0_template 재분류

2026-11-05, 읽기 전용 추가 조사. 실제 r2 ZIP의 JSON 바이트를 메모리에서 읽고 `git show 49458e6:assets/json/...` 원문과 직접 대조했다. 원본 검사기 결과 파일은 바꾸지 않았다. 게임·JSON·Git·세이브 수정과 게임 EXE 실행은 없다.

## 중복키

**9개 파일의 중복키 객체 경로·값의 출현 순서가 전부 49458e6 기준과 같다.** 따라서 이번 r2에서 새로 생긴 문법 오류가 아니라 기존 데이터 품질 경고로 분류한다. 중복을 없애거나 어떤 값을 채택할지는 별도 판단이며 자동 수정하지 않았다.

정확한 계수는 **중복키 그룹27개, 첫 출현을 제외한 추가 중복 출현29개**다. `menu_after_maidsex`는 한 그룹에1027/1028/1029/1030 네 값이 있으므로 추가 출현은3이다. 기존 PK07의27건을 모두 개별 추가 출현으로 표현하면 계수가 혼동된다.

| 파일 | 49458e6 대비 파일 전체 | 중복키 값 비교 |
|---|---|---|
| menu_icon.json | 바이트 동일 |16개 키가 각2회, 값도 각각 동일. 이전 출고 원장 해시와도 일치 |
| menu_item.json | 바이트 동일 | menu_after_maidsex1027/1028/1029/1030 그대로. 이전 출고 원장 해시와도 일치 |
|2581_marirose.json | 다른 변경으로 해시 다름 | seed_sub_threesome3/2, cane빈문자열2회 모두 기존과 동일 |
|2582_rachel.json | 해시 다름 | seed_sub_threesome5/5, cane빈문자열2회 기존과 동일 |
|2583_galateya.json | 해시 다름 | cane빈문자열2회 기존과 동일 |
|2584_venera.json | 해시 다름 | seed_sub_threesome5/5, cane빈문자열2회 기존과 동일 |
|2622_sense.json | 해시 다름 | seed_sub_threesome0/0 기존과 동일 |
|8889_kikuchiyo.json | 바이트 동일 | seed_dressage5/0 기존과 동일 |
|8902_RiceShower.json | 바이트 동일 | seed_dressage0/4 기존과 동일 |

상이한 값의 중복이 없다는 뜻은 아니다. 기존의 상충 값도 그대로 남아 있으므로 데이터 경고는 유지한다. 실제 엔진이 어느 중복값을 채택하는지까지 이번 조사에서 실행하지 않았다.

## 0_template의 기본 그림

현재 ZIP의 `slave_index.json` 범위 시작은1/1001/2001이며0은 포함하지 않는다. 동일 f9 QSP의 실제 코드에서도 다음을 확인했다.

- `generate_stock:18–20`: 명시 지정도 `special_stock > 0`일 때만 `stock_type = special_stock`으로 선택한다.
- `generate_stock:54/57/60`: 그 외에는 각 범위에서 `stock_type`을 추첨한다. 상한 확장도 하한1/1001/2001을 바꾸지 않는다.
- `generate_stock:81` → `get_stock_seed:11`: 선택된 `stock_type`으로 seed배열을 읽는다. `get_stock_seed`의 Images 구간은 `$stock['fullimage'] = $fullimage[stock_type]`이다.
- `choose_the_girl:20`: 선택값0일 때2575를 기본값으로 정한다.0을 캐릭터로 선택하는 경로가 아니다.

따라서 정상 생성 대상에0_template를 포함하여 그림 존재를 요구한 PK12 항목은 **비플레이 템플릿 기본값 경고/검사 범위 오탐**으로 재분류할 근거가 있다. `QSP_RELEASE_VALIDATION.md`도 원본 `0_template`을 유효한 템플릿으로 명시한다.

엔진이 JSON 전체를 읽어 seed인덱스0을 메모리에 채우는 것과 실제 플레이 인물0을 생성하는 것은 구분한다. native JSON 로더 소스를 이번 조사에서 검증한 것은 아니며, 외부·수동·손상된 세이브가0을 직접 요청할 절대 가능성까지 부정하지 않는다. 정상 생성에서0을 선택하는 경로는 찾지 못했다.

재현과 상세 해시·값·줄 근거: `classify-data.cjs`, `data-classification.json`. 원본 PK07/PK12의 엄격 검사 결과를 보존한 상태에서 분류 해석만 추가했다.
