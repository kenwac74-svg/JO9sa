# 전투 이펙트 분리 후보 독립 검토

결론: **PASS**. 운영 파일은 수정하지 않았다.

- 기존 QSP: a48c3817f9a679e532b35daed8bfe0f87b94ef2ffd48c1b0beb1680708563332
- 후보 QSP: 7c366e1ae35a5922e32052847bceb28737ddab32c3861b19bbefd7661b45c2b7
- 기존 CSS: f96f144b0361e211673b1ab04ebcafdab4909d23183dd4545eec65d579de0c96
- 후보 CSS: f8844167776c4c98ea93966f5743f241c2e832dbd40f4043bb2ace37f21d9c0c

## 변경 범위

QSP 로케이션 수·이름·순서·본문 밖 모든 필드(설명·기본 행동 포함)가 동일하다. 44개 본문에 있는 잘못된 bg 디렉터리 접두사232개와 역슬래시형48개, 총280개만 content/pic/bg/로 복구한다. 디렉터리 구분자가 뒤따를 때만 교정하므로 flat bg.png 파일 매핑은 그대로다. 정규식 적용 결과를 그대로 믿지 않고 문자열을 직접 순회하는 독립 변환과 후보 본문을 비교해 모든 본문이 정확히 일치함을 확인했다.

두 전투 renderer에서는 효과 출력 한 줄만 항상 존재하는 jo9_battle_fx_layer wrapper로 바뀐다. 이 변환과 주석을 제외하면 피해량·조건·계산·링크·숫자·저장 변수는 그대로다. 새 로케이션과 저장 변수는 없다.

CSS는 기존 파일 바이트 전체를 prefix로 보존하며 새 scoped 규칙 하나만 추가한다. 기존 폰트·기록 페이징·명령 배치·애니메이션은 그대로다.

## 격리 구조

wrapper는 전투 root 안의 absolute0/0·1280×800이며 margin/padding/border가0이다. 자식 효과는 이전 root와 같은 원점·크기의 containing block을 사용하므로 원래 좌표를 보존한다. overflow:hidden은 효과 영역을 한정하고 pointer-events:none은 기존 클릭을 막지 않는다. z-index5는 일반 패널4 위, sound7 아래의 별도 stacking context다. font-size/line-height0은 wrapper 안의 빈 공백만 대상으로 하며 형제 UI에 상속되지 않는다. background:none으로 투명 영역이 유지된다.

viewport-fixed로 옮기거나 root 전체에 transform을 추가하지 않았다. 효과 유무와 관계없이 wrapper가 존재해 일반 UI DOM 구조를 유지한다.

## 검증 한계

이 보고서는 독립 정적 대조다. 실제 엔진9경로와 FX/edge/result native 결과는 부모의 별도 보고서를 확인한다. DOM 위치·클릭 영역이 같더라도 QtWebKit의 실제 일시적 재도색·합성 잔상까지 완전히 해결됐다는 증명은 아니다. 효과 중·후 화면 캡처는 별도로 구분한다.
