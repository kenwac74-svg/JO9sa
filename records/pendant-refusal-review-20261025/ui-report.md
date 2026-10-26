# 목걸이 착용 거부 선택 화면 — UI 및 콜백 읽기 전용 조사

2026-10-25. WORK jack.qsp SHA-256 be2c993d24911fec5edfc0efceee9d4bd570c2d9e3a511975a69e29e383ba898 기준. QSP 행은 각 로케이션 복호화 본문의 1부터 시작하는 번호다. 게임 파일 수정, 엔진 실행, GUI 재현은 하지 않았다.

## 먼저 바로잡을 식별자

보고된 문구는 #item_base:1169의 '장식 목걸이 착용을 거부한다. 그래도 강제로 잠가 버릴까?'다. 이 문구는 plain_pendant가 아니라 $item_property['golden_collar'] 블록(:1164~1191)에 있다. golden_collar의 실제 이름 정의는 :1161의 '금장 목줄'이다. plain_pendant는 :930의 '장식 목걸이'이며 효과는 :933~935의 st_plus += 1뿐이고 거부 분기는 없다. 따라서 화면 문구만으로 현재 착용 ID를 plain_pendant라고 확정하면 안 된다.

## 선택 화면의 구조

- #item_base:1166: 배우가 활동 가능, 저항성 정신상태, obedience<0, beaten_ever=0, domini_dictum=0이고 passion_luxury=0이면 거부한다.
- :1167~1169: study 장소, 배우 그림, npc=0, txt=1, 거부 문구를 설정한다.
- :1170~1182: $yes/$no 콜백을 만든다.
- :1183: gt 'choice_screen'. 이 첫 선택 화면은 엔진 MSG가 아니다.
- choice_screen:9: _layout을 사용하고 :30에 일반 #text로 문구를 출력한다.
- choice_screen:120: #approve 안의 링크가 EXEC: dynamic $yes를 실행한다.
- choice_screen:121: #deny 안의 링크가 EXEC: dynamic $no를 실행한다.
- css/base.css:722~744: #approve는 (50,300), #deny는 (600,300), 모두 150×150 absolute 배치다. 이 두 셀렉터에는 z-index 보정이 없다. #yes/#no라는 버튼 ID는 이 경로에 없다.

## 지하실 prisoner에 치환되었을 때의 콜백

$recalc_equipment_bonuses는 #item_base:53에서 배우의 collar 효과를 실행한다. #static_base:940~944의 $newloc_update_slave가 이를 호출하고, $newloc:380이 주 화면 배우 목록(노예/조수/수감자/젖소)에 적용한다. next_day:4134~4136의 야간 아이템 효과에는 beaten_ever를 임시로 올려 거부를 피하는 별도 보호가 있으므로, 최초 거부가 그 보호 안에서 나온 것으로 단정할 수 없다. 실제 진입 지점은 실행 증거가 필요하다.

금장 목줄 효과가 prisoner에 올바르게 치환되었다면:

| 선택 | 코드상 동작 |
| --- | --- |
| 아니오 / #deny | #item_base:1179~1181: $prisoner['collar']='пусто', prisoner_inventory['golden_collar'] += 1, prisoner_stat_screen=2, menu_form=0, gt $return_lock. |
| 예 / #approve | :1174에서 prisoner로 치환한 $dyn_slave_forced 실행. 완료 뒤 :1175에서 prisoner_stat_screen=2, menu_form=0, gt $return_lock. |

prisoner는 slave/assistant가 아니므로 둘 다 최종 목적지가 $return_lock다. 현재 세이브의 실제 $return_lock, 저장된 $yes/$no 문자열, 대상 역할을 확인해야 복귀 오류나 재진입을 판단할 수 있다.

## Y 뒤 '멍' 메시지가 의미하는 것

#dynamic:1607~1635가 강제 착용의 공통 효과다. :1621에서 '멍이 생겼다'는 문구를 엔진 MSG로 보여 준다. 실제 beaten_ever=1은 :1627이고 피해·멍 계산은 :1629~1633이다. 이 대사는 상태 적용보다 먼저 나온다.

따라서 Y 뒤 멍 안내가 보였다는 사실만으로 실제 상태 변경이 완료됐다고 할 수 없다. 엔진 MSG가 아직 열려 있으면, 그 뒤에 이전 choice_screen이 남아 있는 것은 가능한 중간 상태다. 메시지를 정상적으로 닫은 뒤에야 상태 적용과 GT가 진행된다. 실제 멍 값이 이미 증가했는지, 안내만 보고 있는지 구분해야 한다.

## 앞선 종합정보 MSG 레이어 문제와 비교

종합정보 문제에서는 #title_scroll_debug와 내용 열에 2147483200~2147483400 레이어가 있다. 이 선택 화면에는 그 셀렉터를 출력하는 코드가 없고 #approve/#deny도 기본 레이어다. 그러므로 같은 고 z-index 충돌이라고 현재 코드만으로 확정할 수 없다.

다만 예 선택의 공통 효과는 실제 MSG를 띄우므로, Y 뒤 단계에서는 __message__ 및 api/closemsg의 존재·레이어·클릭 가능 여부를 확인할 가치가 있다. 첫 선택의 X 클릭 실패와 Y 뒤 복귀 정지는 서로 다른 원인일 수도 있다.

별도 확인점으로 interior_change:1969의 jo9_clean_style은 이미지 감상 모드에서 #approve와 #deny를 모두 visibility:hidden!important 및 pointer-events:none!important로 숨긴다. 새 장면의 jo9_html은 :1859~1867에서 이 모드를 초기화한다. 이 규칙만으로 X 하나만 안 눌린다는 증상을 설명하지는 못하며, 실제 DOM에 오래된 style이 남아 있는지 확인하는 용도다.

golden_collar 효과 블록 전체(:1164~1191)는 보호 기준 JO9O의 동일 블록(:1026부터)과 복호화 문자열이 정확히 같다. choice_screen의 버튼 EXEC도 기준본과 동일하며 이미지 경로만 다르다. 이것이 현재 모든 실행 상태의 정상을 증명하지는 않지만, 이번 문제를 새 콜백 코드 변경으로 단정할 근거는 없다.

## 최소 네이티브 조사 순서와 판별 기대값

1. 원래 거부 화면 직전에 대상 역할·이름·collar ID, $curloc, $return_lock, $yes/$no, beaten_ever, bruises, bruises rate를 확보한다. 화면 문구와 실제 아이템 ID의 불일치를 확인한다.
2. 첫 choice_screen에서 __message__가 없는지 확인한다. #approve/#deny 및 실제 a/img의 getBoundingClientRect, computed visibility/display/pointer-events/z-index와 조상들을 기록한다. 그림의 보이는 중심뿐 아니라 3×3 표본의 elementFromPoint가 올바른 링크/자식인지 확인한다.
3. #deny 실제 클릭과 직접 dynamic $no 실행을 서로 독립된 초기 사본에서 비교한다. 직접 실행은 되는데 클릭만 실패하면 히트박스/가림/이벤트 경로 문제다. 둘 다 실행돼 collar가 비워졌는데 화면이 같다면 $return_lock와 후속 재진입을 조사한다. 정상 기대값은 인벤토리 +1과 collar 비움이며 같은 거부 조건이 더는 충족되지 않는 것이다.
4. #approve 클릭 뒤 MSG가 뜨면 api/closemsg의 elementFromPoint와 클릭 결과를 확인한다. 메시지를 닫기 전후의 실제 beaten_ever/멍 값을 나누어 기록한다. 정상 기대값은 닫기 뒤 beaten_ever=1, 조건부 피해/멍 적용, $return_lock으로 GT다. beaten_ever=1이므로 같은 배우의 같은 금장 목줄 거부는 재발하지 않아야 한다.
5. 키 Y와 마우스 예 선택을 비교한다. 현재 QSP에는 이 경로용 Y/X 키 처리 코드가 없으므로, 키가 어느 네이티브 명령 또는 링크에 연결되는지 실행 로그로 확인한다. 다른 배우의 새 거부인지, 동일 콜백의 반복 실행인지도 이름/ID로 구분한다.

이 조사는 수정 구현을 제안하거나 적용하지 않았다. 네이티브 결과로 UI 가림, MSG 미완료, 저장된 콜백/복귀 목적지, 실제 반복 진입 중 어느 것이 원인인지 먼저 확정해야 한다. 임시 QSP/JSON 복제나 압축 해제본도 만들지 않았다.
