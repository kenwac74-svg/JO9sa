# 플레이어용 통합 소개문 근거

- docs/release/2026-10-19/CHANGELOG_KO.md: 2.3 대비 2.4 최초 변경.
- records/release-guide-illustrated-20261101/content.json 및 SOURCES.md: 2.4.0 누적·2.4.1 채택 사항의 전체 출처.
- records/third-patch-prebuild-20261026/INTERNAL_CHANGELOG_20261026_KO.md: 특성·거래·행동력·위기 대응 최종 반영.
- records/arena-mercy-loss-rule-20261031/MANUAL_KO.md, cruel-mercy-rules-20261101/REPORT_KO.md: 실제 경기 패배시 처분 영향; 지배력·매력 추가 보정은 미구현.
- records/hardcore-auction-20261102/FINAL_RESULT.json: 공개경매 난이도별 상한.
- records/champion-liberation-fix-20261102/MANUAL_KO.md: 챔피언 후속 그림·상금 합산. 모든 챔피언 진행이 한 페이지라는 표현은 사용하지 않음.
- docs/TUTORIAL_CURRENT_UI_20261102.md, VATICAN_PALADIN_SETTING_PANEL_20261102.md, PORTAL_GUARDIAN_SETTING_PANEL_20261102.md: 최신 튜토리얼·인물 소개.

## 그림
media-manifest.json에 출처·해시·원본/내장 크기·실제 캡처/구성 예시/일러스트를 구분했다. 게임 원화를 수정하지 않고 축소 WebP를 HTML에 내장했다. 전투 예시는 현행 출력 HTML에서 테스트 이름과 더미 로그만 정리한 문서용 예시다. battle-capture-report.json에 변환을 명시했다. 과거 Qt 실행 화면을 최신 2.4.1 직접 실행 캡처라고 표시하지 않았다.

## 문서 확인
PC1280/모바일390 가로 넘침 없음, 내장 이미지17개 디코드, 확대 닫기/기타12그룹 펼치기, 외부HTTP요청0. 문서 생성 작업에 전체 게임 회귀검사를 실행하지 않았다. 독립 원고 검토에서 상금 단계/챔피언 페이지 표현을 교정했다.
