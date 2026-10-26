# 큰까마귀 관 종합정보 → 정신 상태 메시지 레이어 조사

2026-10-25. 읽기 전용 조사. 게임 파일 수정, 엔진 실행, 실제 GUI 재현은 하지 않았다. 아래 QSP 행 번호는 text-workshop/core.cjs의 parse 및 shift(..., 5)로 복호화한 각 로케이션 본문의 1부터 시작하는 행이다.

## 판단

종합정보를 위에 올리는 기존 FIX6 CSS와 엔진 MSG의 기본 레이어 사이에 순서 충돌이 있다. 작업본 종합정보는 z-index 2147483200~2147483400을 사용하지만, 종합정보 경로에는 엔진 메시지를 이보다 위에 올리는 규칙이 없다. 정신 상태 링크는 원래 MSG 명령을 그대로 실행한다. 엔진은 MSG 동안 일반 링크를 비활성화하고 메시지 안의 링크만 활성화하므로, 메시지 닫기가 종합정보 뒤에 가려지면 사용자가 보고한 화면과 입력 정지 현상을 설명한다.

확인된 것은 코드와 리소스의 레이어 불일치다. 사용자의 세이브에서 동일 현상을 실제 클릭으로 재현하거나 수정 결과를 검증한 것은 아니다. 큰까마귀 관 효과 자체의 계산 오류를 확인한 것도 아니다.

## 호출 경로와 근거

| 위치 | 확인 내용 |
| --- | --- |
| WORK #item_base:253~261 | 큰까마귀 관 착용 시 auspex=1, item_supermacy_bonus += 1, raven_crown_on=1. 해제 시 반대 처리. 메시지/레이어 제어 없음. |
| WORK main_screen:470~477 | exam_in_progress=0 및 $master_head_gear='raven_crown'이면 종합정보 버튼을 표시. 노예 gs 'debug_info', 조수 gs 'debug_info_assistant'. |
| WORK debug_info:359~395 | main_layout 및 가격/정신상태 계산 뒤 종합정보 HTML을 출력. 395행 정신 상태 링크는 EXEC: msg $debug_psy_status_fuck. |
| WORK debug_info_assistant:5~39 | 같은 구조. 39행 정신 상태 링크도 동일 MSG. |
| WORK debug_info:43,113,183,253,323 | snk_popup 가지의 노예/개인실 1~4 정신 상태 링크도 동일 MSG. |
| WORK css/base.css:9838~9852 | JO9_UI_FIX6_LAYER_ALIGNMENT 블록. #title_scroll_debug는 2147483200!important, 다섯 종합정보 열은 2147483300!important, #title_scroll_debug_quit는 2147483400!important. |
| WORK css/base.css:9939~9945 | 개인실 요약의 #snk_summary_layer는 2147483100. #snk_summary_close는 2147483400!important. |
| WORK engine/jack.exe | 바이너리의 ASCII 템플릿에 id='__message__', position:fixed, api/closemsg, 일반 링크 pointer-events:none 및 #__message__ a의 pointer-events:auto가 존재한다. z-index 문자열은 존재하지 않는다. 이 조사는 엔진 디스어셈블이나 실행 결과를 주장하지 않는다. |
| WORK $ongload:57~66 | MSG 배경/닫기 이미지/좌표를 초기화하며 MSG_FORMAT은 <div id="ink">%TEXT%</div>. 레이어 보정 없음. |

## 정상 비교 사례와 최근 특성 UI의 관계

2026-10-25 특성 전체보기는 같은 엔진 MSG를 위에 표시하도록 css/jo9_traits_view.css:26에 #__message__{z-index:2147483647!important}를 둔다. 패널 자체는 14행 2147483500, 닫기는 22행 2147483501이다. 기존 native-message-results.json은 이 프로필 화면의 실제 MSG 두 개가 닫히는 경로를 기록한다. 이번 조사에서 그 검사를 다시 실행하지 않았다.

그러나 이 CSS의 로딩은 slave_stat:821 및 assistant_stat:737의 프로필 출력에만 있다. debug_info와 debug_info_assistant에는 해당 link나 동등한 전역 규칙이 없다. 따라서 프로필에서 통과한 MSG 검사는 종합정보 MSG의 정상 동작을 증명하지 않는다.

jo9_traits_view.js의 init은 #jo9_tv_root가 없으면 즉시 종료한다. 정신 상태 MSG를 가로채거나 종합정보 HTML을 변경하는 코드는 없다. 현재 증거는 최근 특성 JS가 새로 만든 오류보다, 기존 종합정보 레이어 보정에 공통 MSG 처리가 누락된 경우를 지지한다.

## 변경 유래

- 보호 기준 G:/somi/JO9O/game의 debug_info:379, debug_info_assistant:35에도 동일한 정신 상태 MSG 링크가 있다. 따라서 MSG 호출 자체는 기준본에도 있었다.
- 보호 기준 base.css의 같은 종합정보 셀렉터는 position:absolute를 사용하지만, 작업본의 FIX6 고 z-index 덮어쓰기는 없다.
- G:/somi/JO9sa/baseline/JO9_UI_v1_9_14_AllInOne_R2_FIX6.zip의 payload/css/base.css를 메모리에서 직접 읽었다. 2026-09-25 주석의 JO9_UI_FIX6_LAYER_ALIGNMENT 블록과 같은 고 z-index 값이 이미 있다. 그러므로 이 레이어 변경은 최근 특성 전체보기보다 앞선 FIX6 배포 자료로 확인된다.
- 보호 기준 자체가 upstream 순정 전체를 의미한다고 추정하지 않았다. 여기서 확정하는 범위는 지정된 보호 기준과 FIX6 보관본 사이의 구체적 차이다.

## 최소 수정 제안 — 미적용

전역 css/base.css에 엔진 #__message__를 종합정보/개인실/프로필 오버레이보다 위에 놓는 규칙을 추가하는 범위가 가장 작다. 이미 프로필에서 사용하는 z-index:2147483647!important 규칙을 공통 메시지 레이어로 적용하는 방향이다. 기존 종합정보의 높은 레이어는 유지할 수 있다.

이 범위에는 QSP 로케이션, 새 함수, 큰까마귀 관 효과, 정신상태 계산, 배우 필드, 세이브 변환, 메시지 내용 변경이 필요하지 않다. 엔진 실행 파일도 바꿀 이유가 확인되지 않았다. 이 제안은 적용하거나 검증하지 않았다.

승인 후 검증은 격리 사본에서 실제 정신 상태 링크를 클릭하여 수행해야 한다. 노예/조수 일반 종합정보 및 개인실 요약에서 메시지의 api/closemsg가 elementFromPoint 기준으로 최상단인지, 클릭 후 원래 요약으로 복귀하는지, 연속 두 번 열고 닫아도 입력이 살아 있는지 확인한다. 기존 특성 전체보기의 MSG와 종합정보 자체 닫기도 함께 확인한다.

## 입력 해시와 조사 종료 상태

| 파일 | SHA-256 |
| --- | --- |
| WORK jack.qsp | be2c993d24911fec5edfc0efceee9d4bd570c2d9e3a511975a69e29e383ba898 |
| WORK css/base.css | eebc83753cbe894a2b914b4a620449cd4d1e73a8bc053846e6cebd84c351d1df |
| WORK engine/jack.exe | f75032d79ecb58eeb7b969cd3f774d66b091fca38a360acdabd782e03a46c6e6 |
| 보호 기준 jack.qsp | 26e15aaf30b6226a2883c6b532a6ee4eed34791110618597d234bb7d6fa3e052 |
| 보호 기준 css/base.css | 7ec25fa3d09e4fc9f672cb7bb37a46a2b21e56097f7582a078771e8e1ca4aa06 |
| FIX6 ZIP 안 payload/css/base.css | 37d2314c3fb3ff8f22421ccd1140c07d8f27cf47fdd0d9dc61e85817257eb4d6 |

작업용 QSP/JSON 복제나 압축 해제본을 만들지 않았다. ZIP은 메모리에서 읽었으며 이번 조사에서 추가한 파일은 이 보고서뿐이다.
