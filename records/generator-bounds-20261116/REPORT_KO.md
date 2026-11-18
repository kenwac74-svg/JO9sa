<!-- GENERATOR_BOUNDS_INTEGRATED -->
이 후보는 [통합 적용 기록](../fog-ui-restore-20261116/REPORT_KO.md)에 따라 WORK에 반영됐다. 아래는 후보 검증 당시 기록이다.

# generate_stock 내부 재추첨 유한화 후보 — 2026-11-16

후보 모드 내용은 동결했다. 이 폴더 밖의 WORK·저장소·세이브는 수정하지 않았다. 원래 UI/WARNING/세이브 손실 제보의 원인을 확정했다는 뜻이 아니다.

## 인계 파일과 해시

- `candidate-mod.json`: generate_stock body만 5개 정확 치환. 파일 SHA256 `056411c0f3f0b484060b133c56c73f9f34f9b08f46b58ced795837bd92624e00`.
- 입력 WORK QSP SHA256 `dc862baddcdb865680bcffeb141039763bb4e4459d0f6e4ae5a44fdbefd38044`.
- 이 모드만 적용한 메모리 후보 QSP SHA256 `1b0980ffd6a07eab98b280f24203aa9f880d28ea81f791b9e0349b0400d95812`.
- 다른 후보와 병합할 때 root가 최종 before/after 해시를 다시 지정한다. 위 모드 내용은 더 수정하지 않는다.

## 동작과 비용

기존 인자·호출법(`gs 'generate_stock'`)과 stock/stock_type 출력, 기존 special_stock 우선 경로를 유지한다. 새 helper·로케이션·영구 필드·저장 마이그레이션은 없다. 지역 카운터/탐색 변수 6개, 본문 +65줄/+5,672 UTF-16 바이트다. 상한에 닿기 전에는 기존 RNG 호출과 재추첨 조건을 유지한다.

| 대상 | 상한 | 상한 뒤 동작 |
|---|---|---|
| `loop_meta` | 임의 연령 32회 | 두 기존 연령 필터가 허용하는 meta 2를 사용 |
| `loop_type` | 임의 외형 32회 | 같은 meta의 실제 후보 슬롯을 앞에서부터 유한 탐색. 등록된 초상·일치하는 연령·제외 1448/1450/2339·연령 필터를 확인. 최근 외형 중복만 허용 |
| `loop`의 속성합 재시도 | 전체 속성 패스 32회 | stamina/beauty/sensitivity/intellect/temper/ego를 각각 최소 2로 올림. 현재 값을 낮추지 않고 합계 12 이상 보장 |

`loop`의 한 패스는 기존 `$stockatr` 개수만큼 증가하는 유한 순회다. 추가한 `jo9_gen_type_fallback`은 같은 meta의 슬롯 수만큼만 순회한다. 나머지 `jo9_gen_type_ready`는 기록 처리 진입점이다. 본문 jump 라벨 5개를 전수 대조했다. 연령·외형·속성합 외의 재추첨 라벨은 없다.

외형 fallback은 기존 `jo9_mob_pool`의 선택 슬롯 API(`args[1]`)를 사용한다. 슬롯 개수 계산의 기존 범위와 추가 수 180/260/288은 현재 helper 정의에 맞춘다. 이 추가 수가 나중에 바뀌면 이 본문 계산도 함께 맞춰야 한다. fallback으로 기록에 진입할 때 num_count가 88 이상이면 기존처럼 최근 기록을 초기화한다.

등록된 유효 후보가 전혀 없는 손상 DB에서는 stock을 기존 clear helper로 비우고 stock_state=no_slave, stock_type=0, slave_base_price=0으로 만든다. 짧은 안내 뒤 is_home에 따라 main_screen/city_menu_form으로 GT한다. 이때 원 호출자의 이후 정산 전체가 중단되어 무효 stock을 성공으로 수용하지 않는다. 정상 WORK에서는 도달하지 않는 실패 처리다. 호출자의 중간 임시 상태 전체를 되돌리는 트랜잭션은 추가하지 않았다.

상한 뒤에는 기존 조건을 모두 만족할 때까지 계속 추첨하던 동작과 결과 분포가 달라진다. 연령은 meta2, 외형은 같은 범주의 첫 유효 후보로 기울고 낮은 속성은 올린다. 상한 미도달 경로의 분포는 유지한다. 외부 보상 루프의 100회 상한과 가격 기준은 변경하지 않는다.

## 검증

`audit-tests.cjs red`는 실제 기존 generate_stock의 모든 내부 재추첨 구간과 실제 jo9_mob_pool을 포함하는 최소 QSP를 별도 엔진 프로세스에서 실행했다. RNG 경계와 숫자 seed 로더만 제어했다. 무한 입력을 현재 게임 프로세스에서 직접 돌리지 않았으며, 각 프로세스는 3초에 해당 PID만 종료했다.

- 기존 코드 RED: 차단 연령·고정 최근 중복·제외 번호·등록 빈 슬롯 앞의 제외 번호·모든 낮은 속성·빈 등록부 6조건이 문법 오류 없이 3초 제한에 도달했다. 기존 explicit special_stock=1448/정상 필터 2대조군은 통과했다(`red-results.json`).
- 첫 후보의 최근 기록 100개 경계에서 기록 초기화 누락을 실제 엔진 assertion으로 검출했다(`history-boundary-red.json`). 이를 고친 동결 후보는 해당 조건까지 포함한 9조건을 모두 통과했다(`green-results.json`), 각 약 0.29~0.31초.
- 최종 GREEN은 위 6악조건, 최근 기록 경계, explicit special_stock 보존, 두 연령 필터를 켠 정상 입력을 검사했다. 속성합/유효 외형/빈풀 실패 복귀 상태를 실제 엔진 assertion으로 확인했다. QSP 오류/실패 assertion 0건.
- WORK JSON 실제 후보 풀 대조: meta1 427슬롯/유효427, meta2 722슬롯/유효720, meta3 628슬롯/유효627. 제외 번호·연령·초상 등록을 확인했으며 deterministic 첫 후보는 각각 1/1001/2001이다. 최근기록 제한88보다 후보가 많다(`static-results.json`).
- 메모리 후보 구조 왕복·generate_stock CRLF·마커 경계·정확 치환·다른 필드 불변·모든 jump 대상 확인.
- 전체 정적 gate는 기존 입력에도 있는 `jo9_slave_death` 본문 199/200줄 loneLF 2건으로 중단된다. 후보에도 정확히 같은 2건만 남았고 이번 본문에는 새 오류가 없다. 이를 전체 STATIC_PASS로 보고하지 않았다.

이 검사는 내부 재추첨 구간의 실제 QSP 실행이다. 뒤의 전체 배경/특성/가격 생성, 일반 EXE 화면, 실제 사용자 저장 불러오기, 원 제보의 UI/WARNING/손실은 검증하지 않았다. root의 통합 검사와 별도 UI 조사 대상이다.

## 재현·제거·정리

`node audit-tests.cjs red`, `node audit-tests.cjs green`, `node static-check.cjs`로 재현한다. 스크립트에는 이 PC의 원본/엔진 절대 경로가 있다. 현재 소스가 핀 해시와 달라지면 root가 동일 치환이 맞는지 확인해야 한다. `build-candidate.cjs`는 동결 후보를 최초 입력에서 다시 만드는 재현 스크립트이며, 이미 통합한 WORK에 실행하지 않는다.

모드 제거는 해당 5개 치환의 new→old 역치환이다. 기존 무상한 재추첨이 돌아오며 새 저장 필드는 남지 않는다. 다른 생성 변경이 같은 구간에 추가되었다면 먼저 충돌을 확인한다.

최종 보존: 후보 모드, 핵심 재현 스크립트 3개, 차이 명세, 이 보고서, RED/GREEN/정적 결과와 작은 엔진 로그. 재생성 가능한 `fixture.qsp`, plan/중간 client-results, FastQSP.ini는 테스트 스크립트가 정리한다. `candidate-generate_stock.qsps`는 모드에서 재생성 가능한 중복 본문으로 최종 정리했다. 이 폴더 안에 대형 QSP 복사본·JSON 등록부 복제·압축 해제본은 없다.
