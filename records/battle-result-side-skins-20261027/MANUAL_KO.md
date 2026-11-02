# 전투 결과 좌우 하단 배경

WORK와 추적 base.css에만 BATTLE_RESULT_SIDE_SKINS_20261027 블록을 추가했다. 기존 CSS 전체 바이트는 보존했다. 새 그림 없이 bg_stat.png의 양피지·금속 테두리·장식을 기존 하단 행동칸과 같은 확대/위치 규칙으로 재사용한다.

결과 root의 ::before/::after가 각각(0,440,242×360)/(1037,440,243×360)에 배경을 그린다. root 안에서 z-index0/pointer-events:none인 장식이므로 버튼·아이콘·메시지·이펙트보다 아래에 놓이고 입력을 받지 않는다. 기존 아이콘·로그·글꼴·원문 색상·전투 계산과 콜백은 바꾸지 않는다. 새 QSP 위치·함수·변수·저장 키·DOM 태그는 없다.

승리/KO 두 조건에서 실제 QtWebKit의 배경 로드·계산 스타일·클립·아이콘 hit·메시지 글꼴/색/스크롤을 확인했다(native-side-skins-results.json). 화면의 직접 시각/연속 클릭 검사와 구분한다. QSP/JS는 무변경이므로 이번에 QSP 공식9경로를 다시 검사한 것은 아니다.

백업 G:/somi/JO9_work_backups/battle_result_side_skins_20261027115945/css/base.css를 WORK와 assets/css-2.4/base.css에 함께 복구하거나 해당 식별자 블록만 제거하면 이전 갈색 배경으로 돌아간다. 기존 이미지 파일은 수정하지 않았다. 배포·세이브·엔진·설정·ZIP·커밋·푸시는 변경하지 않는다.
