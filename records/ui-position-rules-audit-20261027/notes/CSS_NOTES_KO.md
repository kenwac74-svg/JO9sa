# CSS 좌표·크기·레이어 규칙 전수 감사
2026-10-27. 읽기 전용 감사. WORK·배포·세이브·Git 상태를 변경하지 않았다.

## 조사 범위와 수치
- WORK css/base.css SHA-256 a782d60e119299da06700d4b27e1928784dbb1afd765f84dc433a7add8c00a98.
- base.css 1,701개 규칙, mainScreen.css 12개, jo9_traits_view.css 33개: 총 1,746개.
- position/좌우상하/폭높이/min-max 크기를 가진 규칙 1,572개, 해당 선언 5,914개.
- 여기에 display/margin/padding/overflow/z-index/background-size·position까지 포함하면 1,650규칙, 6,474선언이다.
- 정확히 같은 selector가 반복되는 그룹 347개. 같은 selector의 geometry 값이 서로 다른 그룹 200개. 공백·important 표기 차이와 0px/0 차이는 집계에서 일부 정규화했다.
- 이 숫자는 회귀 버그 수가 아니다. 화면별 root 조건·hover·상태별 규칙·의도된 마지막 덮어쓰기·동일 요소의 이미지/클릭영역 보정이 포함된다. 복합 selector 간 specificity 전체와 inline QSP 출력까지 계산한 최종값 집계는 아니다.

보호 참조는 G:/somi/JO9O/game/css이다. 이 참조를 무조건 미수정된 공개 순정본이라고 부르지 않는다.
- 참조 base.css의 969규칙 중 955규칙은 현재와 선언까지 정확히 일치한다. 14규칙은 변경되었고, 현재 파일에는 참조 대비 순증 732규칙이 있다.
- 14변경은 전투 체력 표시 3건·음량 조절 2건·후반 아군/적 수치 표시 6건·우유 관련 3건이다. 세부 selector/행은 css-audit.json referenceChangedOrMissing에 있다.
- mainScreen.css는 보호 참조와 파일 해시까지 같고 12규칙 모두 동일하다.
- jo9_traits_view.css는 보호 참조에 없는 신규 파일이다.
- MOD 표식과 보호 참조 대조를 구분했다. 주석이 없다는 이유만으로 순정이라 단정하지 않았다.

## 위치의 소유권
1. 엔진은 MAINDESC/OBJECTS/MSG 좌표로 바깥 wrapper를 출력하고 body BACKIMAGE를 출력한다. 즉 QSP의 화면 영역 변수와 CSS 안쪽 좌표가 별도로 존재한다.
2. CSS base.css 원래 구간은 absolute 픽셀 배치를 주로 소유한다. 총 position 선언 991개 중 absolute 955, relative 26, fixed 7, static 3이다.
3. QSP inline style은 별도의 선언 출처다. 여기의 CSS 감사만으로 실제 최종 좌표를 확정할 수 없다.
4. 엔진의 기본 스타일은 게임 stylesheet 뒤에 추가된다. 실제 설치 바이너리에서 *{padding:0;margin:0}, div{margin:0 auto;display:table} 상수와 background-size:cover 직후 background shorthand를 확인했다.
5. 따라서 공용 div를 block으로 바꾸는 규칙, min-content에 따른 확대, auto margin, fixed/absolute 기준을 화면별로 구분해야 한다. 단순 숫자 통일은 적절하지 않다.
6. 엔진은 공개 소스상 css 폴더 .css를 모두 읽어 하나의 stylesheet에 결합한다. 파일을 나눈 것만으로 화면별 스코프가 되지 않는다. 현재 설치 엔진의 CSSOM 실측도 runtime-stylesheet-scope.json에서 확인했다. 명시적 link가 없는 비프로필 Start에 프로필 CSS가 로드된다.

근거:
- 공개 engine-base 고정 커밋 9bb0276be5f94f94f911fab0daeb225cc3c559ec, qsp/jack.cpp:308–321.
- gui/qsp_htmlbuilder.cpp:42–65(스타일 순서·기본값),116–123(MAINDESC wrapper),126–146(MSG wrapper),204–217(CSS 파일 합치기).
- WORK engine/jack.exe는 해당 CSS·wrapper 문자열을 실제 포함한다. 공개 소스 전체와 바이너리 빌드가 동일하다는 뜻은 아니다.

## 구체적 중복·예외 7종
### 1. 시설 이미지: 의도된 개편이지만 선언 소유권이 분산
base.css:7162 #cage: x1021/y690/75×75.
mainScreen.css:1 #cage: x820/y340/155×155.
base.css:9725 V193: x824/y333/155×155 !important.
base.css:9758 V196: x820/150×150 !important.
CSS만 보면 최종 top333은 V193에서, x820/150×150은 V196에서 상속한다. 동작이 틀렸다는 증거는 아니지만 현행 시설 크기를 확인하려면 네 위치를 함께 읽어야 한다. #barn/#stasis도 같은 구조다.

### 2. 크라이오 칸: 후속 가로 좌표 보정은 의도적
mainScreen.css:49 #stasis_cell_1: x972/y335/24×24.
base.css:9728: x983/y333/24×24 !important.
base.css:9995: 1~6번 모든 칸 x974 !important.
마지막 블록 주석은 세로 좌표와 초상화는 보존하고 가로 6개 버튼만 움직인다고 명시한다. 이를 중복 버그로 지우면 안 된다.

### 3. 귀가 버튼: UI 개편이 원본 규칙 위에 누적
base.css:3128 #back_home: x915/y695/100×100.
base.css:8660: x923/y716/72×72 !important.
base.css:9667: 버튼 a의 크기72×72와 신규 배경 이미지.
부모 위치와 클릭 a/그림 크기의 소유 규칙을 한 컴포넌트 단위로 모을 수 있지만, 지금 크기 불일치 버그로 확정할 근거는 없다.

### 4. 전투 로그: 상태별로 다른 크기는 의도된 예외
base.css:3194 #fight_txt: x300/y50/680×480.
base.css:10142 .jo9-battle-v01 #fight_txt: x258/y612/763×172.
base.css:10179 .jo9-battle-result #fight_txt: x423/y650/445×132.
진행 중에는 중앙 하단 전체 기록 패널 안쪽을 사용하고, 결과에서는 좌우 특수/승패 버튼에 공간을 준다. 세 값은 통일 대상이 아니다. 새 root 밖에서 원래 전투 UI를 유지하기 위한 스코프도 의도적이다.

### 5. 전투 상태 목록: 큰 높이를 잘라 수용하는 의도적 예외
base.css:3533 #combat_ui_conditions: y300/210×600.
base.css:10153 .jo9-battle-v01 #combat_ui_conditions: x12/y300/218×122, overflow:auto.
이것은 오른쪽 아래 기술 메뉴로 목록이 넘어가지 않도록 한 범위 제한이다. 단순 중복이라 삭제하면 시험판 배치가 깨진다.

### 6. 공용 컷신 배경과 전체 화면 배경은 다른 계약
base.css:628 #bg: absolute, x4/y3/795×595.
base.css:10188 #jo9_gameover_stage: fixed, x0/y0/1280×800.
base.css:10190~10191: stage 안의 #bg와 img는0/0/100%×100%.
게임오버만 전체 viewport 좌표계로 분리했으므로 공용 #bg를 전역 1280×800으로 바꾸면 다른 도시/컷신이 깨진다.

### 7. 프로필 CSS의 전역 selector: 위험 후보와 의도적 공용 규칙을 분리
jo9_traits_view.css:30 주석은 프로필에서만 로드된다고 설명한다.
동 파일:32 body:before는 base.css:10002의 top45/height755를 top0/height800으로 덮는다. 실제 비프로필 Start에서도 이 규칙이 적용됨을 확인했다. 따라서 프로필 전용이라는 주석은 실제 적용 범위와 다르며, 프로필 밖으로의 스타일 누출은 확인된 사실이다. 의도대로 전용 스코프로 바꾸는 구현은 아직 하지 않았다.
동 파일:3 #left_column,#left_column_assistant{display:block}도 같은 ID를 쓰는 다른 화면에 영향을 줄 수 있다. 좌표가 아니라 table→block 크기 산정 변경이므로 실제 사용처/DOM 측정이 필요하다.
동 파일:26 #__message__의 z2147483647!important는 네이티브 메시지를 특성 확장창 위에 놓기 위한 의도적 공용 규칙이다. 전역이라는 이유만으로 지우면 팝업 닫기 회귀를 만들 수 있다.

## 화면군별 정적 분류
css-audit.json에는 1,650개 관련 규칙 전체의 file/line/selector/family/origin/geometry 선언을 저장했다.
분류는 selector 이름과 구조를 기준으로 한 관리용 분류이며, 모든 QSP 호출 화면의 단독 소유권을 증명하지 않는다.
- home_main / home_quick_actions / home_facilities / private_room_facilities.
- startup_gameover / cutscene_city / battle / racing.
- character_creation / profile_detail / trait_overview_profile.
- shared_text_image_panels / shared_navigation_controls / popup_tooltip.
- activity_panels / training_equipment / milk_economy / trophy_room / editor.
- other_shared는 닫기·설정·기타 공용 요소 또는 이름만으로 화면 소유권을 확정하지 못한 것.

## 공용 규격으로 정리할 방향 — 구현 승인 전
- 화면 계약을 '전체 캔버스', '일반 컷신', '프로필 중앙 패널', '전투', '네이티브 메시지'로 나눈다. 서로 다른 크기의 화면을 하나의 #bg 규칙으로 합치지 않는다.
- 각 화면 계약에 origin/size/root/display 방식/레이어/overflow 소유자를 기록한다. 바깥 영역 변수는 QSP/엔진, 안쪽 레이아웃은 CSS, 등장 조건과 텍스트는 QSP가 맡는다.
- 현재 효과값을 먼저 동결한 뒤, 시설·상태 아이콘 등 컴포넌트별 마지막 유효 선언을 한 위치로 모은다. 원본/버전별 이력은 기록과 Git에 보존하고, 운영 CSS에 계속 덧붙이는 방식은 줄인다.
- stylesheet 파일 분리와 실제 화면 스코프를 혼동하지 않는다. 프로필/전투/전체 화면 root별 스코프가 필요하다.
- 엔진 호환용 전역 규칙은 별도 소유 목록에 두고 이유를 적는다. #__message__ 같은 필수 전역 규칙까지 일괄 삭제하지 않는다.
- 구형 QtWebKit에서 CSS custom properties나 :has() 지원을 전제로 설계하지 않는다. 공통 수치 문서/빌드 입력의 단일 기준은 가능하나 새 런타임 의존성은 별도 승인 사안이다.
- 변경 전후 실제 엔진 DOM geometry와 클릭영역을 화면 계약마다 비교한 뒤 적용한다. 이번 감사는 코드 수정이나 자동 정리 승인이 아니다.

## 실제 엔진 CSSOM 확인 추가
runtime-stylesheet-scope.json의 비프로필 Start 검사 PASS. viewport1280×800, profileElementPresent=false, explicitCssLinks=[]인데 stylesheet0에 프로필 규칙이 들어 있다. body::before는 rule1618의 top45/height755를 rule1726의 top0/height800이 덮고, getComputedStyle 결과도 top0px/height800px/backgroundPosition -501.5px 0px다. 이 재현에서는 WORK·엔진·세이브 변경이 없다. native ruleCount1748과 정적rule1746의 차이는 정적 집계가 keyframes 컨테이너/프레임을 화면 배치 규칙에서 제외하기 때문이며, 두 수치를 같은 정의로 혼용하지 않는다.
