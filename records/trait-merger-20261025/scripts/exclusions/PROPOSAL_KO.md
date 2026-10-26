# 승인된 배제 5그룹: 적용 전 읽기 전용 인벤토리

**후속 사용자 지시로 우선순위 변경:** 아래는 초기 조사 시점의 제안이다. 현재 구현은 `POSITIVE_PRIORITY_KO.md` 및 `implement.cjs`를 따른다. 긍정/부정 충돌은 긍정을 남기고 부정을 지우며, cow와 운동/활동처럼 모두 유익한 조합은 기존 동시 보유를 유지한다. 경로·해시·원시 seed 조사 결과는 그대로 유효하다.

2026-10-25. WORK `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`의 SHA-256은 `09c12dec13870967f558a830981604c7b65f199da3824e7a519f5f95285f6e14`이다. QSP 273개 location을 메모리에서 읽었고 게임·JSON·세이브를 수정하지 않았다. 행 번호는 이 해시의 복호화 location 본문 1기준이다. `inventory.cjs`는 인벤토리 JSON만 다시 쓴다.

## 확정 규칙과 최소 공통 구현

| 한쪽 보유/신규값 | 충돌하는 반대쪽 |
|---|---|
| courage=2 | darkness/blood/fire/water/vermin/deprivation_attitude 중 값=-1 |
| jo9_slave_nature=1 | meekness<0 |
| meekness>0 | defiant=1 |
| jo9_voice_trait=1 | expression_affinity>0, 이름 달변가 유지 |
| cowSK_affinity>0 | sport_affinity=1 또는 통합 활동 특성(기존 passion_comfort=-1 또는 jo9_work_ethic=1) |

기존 `jo9_traits` location에 **순수 판정 모드 하나**를 두는 방법을 제안한다. 입력은 역할 문자열·변경 key·예정값, 반환은 허용 1/거부 0이다. 호출 시점의 배우 값과 예정값만 검사하며, 반대 특성·발견 상태·기억·완료 표식·자원은 바꾸지 않는다. 새 location, 영구적 허용/금지 표식, 세이브 이관 명부는 필요 없다. 통합 활동의 두 기존 저장키를 당분간 지원한다면 공통 판정에서 같은 논리 상태로 해석한다.

허용 검사는 양방향이어야 한다. 예를 들어 courage=2를 새로 넣는 경로와 환경공포=-1을 넣는 경로 모두 검사한다. 0으로 해제하거나 충돌 방향에서 벗어나는 변경은 허용하고, 이미 가지고 있는 같은 값을 다시 쓰는 것은 새 획득으로 취급하지 않는다. 전혀 관련 없는 특성의 변경도 기존 충돌을 청소하는 계기가 되면 안 된다. 통합 특성의 여러 키를 한 번에 바꿀 때는 변경 후의 논리 상태를 먼저 계산하여 자기 자신의 이전 별칭값에 의해 막히지 않게 한다.

## 유지 우선순위

1. 기존 세이브·역할 이동에 실린 값은 그대로 유지한다. load/refresh/list/price/발견 검사에 새 배제 정리 루프를 붙이지 않는다.
2. 보유 중 새 획득·수동 추가는 기존 반대 특성보다 우선하지 않는다. 공통 판정을 통과한 뒤에만 setter·새 완료 표식·발견 상태·부수효과를 실행한다.
3. 유료/아이템 획득이 연결되는 경우에는 돈/AP/아이템 차감과 1회 사용 표식보다 먼저 검사한다. 이번 대상 key의 정적 인벤토리에서는 보유 중 유료 신규 부여 경로를 확인하지 못했다. 현재 카오틱 에센스는 삭제만 한다.
4. 새 생성은 JSON에서 먼저 넣은 값, 이후 소스에서 먼저 성공한 추첨을 유지한다. 나중의 충돌 추첨을 건너뛴다. 이전 특성을 0으로 만들고 새 특성을 넣는 방식은 사용하지 않는다.
5. 고정 JSON 원본은 수정할 필요가 없다. 현재 1,126개 JSON의 승인 5그룹 원시 seed 동시 충돌은 0개다. 향후 새 JSON 충돌은 새 생성 setter 순서에 따라 뒤의 값을 건너뛰되 기존 세이브에 소급하지 않는다.

## 실제 부여 지점

| 경로 | 현재 지점 | 변경 방식 |
|---|---|---|
| 기본 seed → stock | get_stock_seed:93,95,100,103,105,108,140,152,176,179,182,185,188,197 | 실제 값을 넣기 직전 공통 판정. 현재 seed에 충돌 0개. deprivation_attitude 직접 seed setter는 현재 이 location에 없음 |
| 무작위 환경공포 | generate_stock:1286–1291 | 랜덤 후보를 1회 저장하고 검사 후 대입. 검사와 대입에서 rand를 두 번 호출하지 않음 |
| 활동·용기·운동·언변·소 적성·복종성향 추첨 | generate_stock:1292,1296,1298,1300,1303,1319 | 위와 동일. preset 값과 먼저 성공한 다른 특성을 유지 |
| 새 JO9 추첨 | jo9_traits:92–93,97,106 | defiant/nature/voice/work_ethic 양수 setter를 검사. 0 초기화는 해당 신규 생성 경로의 초기화이므로 기존 인물에게 재호출 금지 |
| 생성 치트 | generate_stock:1430,1439 및 generate_stock_maximum_testing:238,242 | 치트도 새 충돌값만 검사. 해제·중립 변경은 허용 |
| 특수 조수 직접 생성 | get_special_assistant_quest:237,238,254,278,281,290 | stock을 통하지 않으므로 누락하면 안 됨. 배우는 assistant |
| 데모·특수 직접 생성 | get_demo_slave:110,112 / get_special_slave:104,106 | blood_attitude와 courage 직접 seed setter도 검사. 배우는 slave |
| 도시 고정 인물 입수 | interaction_city:12769,12776,12864,12868 | generate_stock 후 stock 초기 커스터마이즈다. setter 직전 검사; 통합된 활동/복종 별칭 처리도 이 순서에 맞춤 |
| 에게야 영입 초기 보정 | interaction_city:17590,17822 | courage=1이므로 이번 courage=2 배제에는 충돌하지 않음. 기존 동작 유지 가능 |
| 원래 특성 수동 편집 | menu_form:4077–4128,4131–4137,4167–4176,4194–4200,4202/4212,4283/4289,4305/4317 | HTML EXEC 링크의 직접 대입/±1을 공통 판정 또는 공통 setter로 전달. 음수→0→양수 경계와 수치형 meekness 전체값 보존 |
| JO9 특성 수동 편집 | jo9_traits:139–218, 실제 동적 setter:143–150 | 토글의 예정값을 계산한 뒤 검사. 거부 시 side effect/known/초기화/refresh 실행 전에 종료 |

현재 순서를 그대로 두면 무작위 생성에서 `6환경공포 → courage`, `comfort/sport → cow`, `expression → voice`, `meekness → defiant/nature` 순으로 선점한다. 이는 **두 특성에 고정 서열을 새로 주는 것이 아니라 현재 코드에서 이미 들어간 값이 뒤의 새 부여보다 우선한다**는 의미다. fixed preset은 모든 무작위 추첨보다 먼저다(generate_stock:72).

## 보유 중 갱신과 삭제 경로

- #static_base:1626–1631은 여섯 환경 축의 XP 획득이다. 모두 현 값=0일 때 **양수** 내성/기호값을 주므로 이번 공포=-1 배제를 추가할 필요가 없다. 공포가 새로 생기는 경로로 오인하지 않는다.
- jo9_traits:init_slave_nature:351–354는 영입 시 flag=1/initialized=0에만 적용하는 기존 자격 검사이며, 불충족 시 nature를 지운다. 호출은 stock_to_slave_nogt:84, expert_to_slave:8, jo9_traits 편집:214다. 현재 load/refresh에서 직접 호출하지 않는다. 새 배제의 전역 정리 입구로 사용하면 안 된다. 새 부여 판정을 먼저 통과시키고 기존 획득 초기화와 구별한다.
- jo9_traits:restored_refresh:416–421는 기존 defiant의 pride=0/정신붕괴 해제 및 moral 성장 억제다. 여기에 새 meekness 배제 청소를 추가하지 않는다.
- $expert_search:47와 generate_clone:19는 기존 새 인물 최종 ego/pride 자격 보정이다. 소유 중 전역 trait 정리 경로가 아니다.
- jo9_chaotic:34–173은 현재 보유한 부정 key만 후보로 모으며,179–212는 선택한 key와 관련 XP/known/revealed만 지운다.214에서 에센스를 차감한다. **새 특성을 주지 않으므로 배제 판정으로 가로막지 않는다.** 기존 불일치의 반대쪽을 자동 부여하거나 지우지 않는다. 활동 통합 후 부정 특성 삭제가 별칭을 되살리지 않는지는 통합 담당 검증에 포함한다.
- generate_stock:1419의 기존 gladiatrix 대 동물3적성 제거는 이번 신규 5그룹과 별개의 기존 동작이다. 새 정책의 근거로 넓히지 않는다.

## 역할·개인실·수동도구

`jo9_traits`는 문자열 역할을 받아 $replace/dynamic으로 해당 배열을 읽고 쓴다. 같은 방식으로 순수 판정도 slave/assistant/room1–4/stock 등 호출한 배우를 받아야 한다. 특정 `slave` 배열만 검사하면 조수 편집에서 누락된다. 개인실 연동은 snk_room_bridge:57,73–79에서 실제 room 배열을 slave로 바꾸고 끝날 때 복구한다(96–100). 따라서 현재 호출 역할 그대로 검사하고 별도의 개인실 이름 추정/전역 상태를 만들 필요가 없다.

menu_form:4477–4489의 신규 특성 편집기는 slave/assistant 선택 후 jo9_traits:editor를 호출하지만, 원래 특성 편집 링크들은 slave에 직접 쓴다. 두 수동 경로를 모두 연결해야 한다. 저장소 tools/state-editor는 QSP 정의/규칙 편집 도구이며 조사한 registry에 이 16개 trait 값의 별도 live setter는 없었다. 외부 임의 세이브/JSON 텍스트 편집 전체를 방어한다는 주장은 하지 않는다.

## 권장 검증표

각 5그룹을 양방향·중립해제·같은값 재설정으로 검사한다. 주노예/조수/개인실, preset 후 random, fixed 조수, 도시 커스터마이즈, 원래 편집기/JO9 편집기를 포함한다. 새 통합 활동키의 각 별칭 단독/동시 보유와 숫자형 meekness -5/+6도 포함한다. 기존 충돌 세이브 복사본은 load·refresh·가격·하루 경과·역할이동 전후 원값을 비교한다. 새 획득 거부에서는 자원·known·revealed·초기화 완료값 모두 불변인지 확인한다. 에센스는 기존 부정 특성 1개만 지우고 1회분만 차감하며 통합 별칭에서 되살아나지 않아야 한다.

이 문서는 적용 전 설계/정적 경로 조사다. 엔진 실행 또는 세이브 변환을 실시하지 않았다. 이번 조사에서 진단 QSP·복제 세이브·압축해제 복사본은 만들지 않았다.
