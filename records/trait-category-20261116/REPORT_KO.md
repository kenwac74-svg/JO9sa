# 성격·기질 분류 정정

2026-11-16 사용자 지시. 겁쟁이(courage=-1), 용감함(1), 무모함(2)을 전투에서 성격과 기질로 옮겼다. 통합 특성편집기 실사용 JSON, 추적 게임DB JSON, WORK/소스 HTML과 공통 추출기 매핑을 맞췄다.

각 데이터의 해당 세 category 외 모든 내용은 동일하다. jo9_combat_trait 3행과 게임QSP는 그대로다. 전체 재추출·구축·서버 재시작은 하지 않았다. 브라우저에서 특성편집기 또는 게임DB를 새로 읽으면 반영된다. 기존에 열린 화면은 새로고침해야 한다.

설치 대상별 이전/이후 해시는 manifest.json, 최소 후보는 stage/, 이전 바이트는 before/에 있다. 현재 통합 편집기의 studioRoot는 G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab이다. 다른 studioRoot로 옮길 때도 이 데이터 분류를 보존해야 한다.

이 변경은 듀플리카토 에센티아의 후보 필터와 별개다. 세 특성은 긍정 재능이 아니므로 주문 복사 후보에서 제외한다. 마법은 설계 중이다. Full·ZIP·커밋푸시 없음.
