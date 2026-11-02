# 이번 감사의 결함·후보 구분

## 확정 P2 — 조건 컷이 맞을 때 수동 전환이 B/C에 갇힘

현재 WORK `78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d`의 원래 jo9_html과 jo9_toggle을 실행했다. 조건 없는 A/B/C/D는 정상 순환한다. B조건1개 또는 B·C조건2개를 만족시키면 자동 B 이후 수동 클릭이 **B → C → B → C → B**로 반복된다. 기대는 **B → C → D → A → B**다. 3probe·15assert 중 조건 그룹의4기대가 실패했다. Q241-CUT-003으로 기록했다.

jo9_toggle의 현재 선택 검증이 implicit mode0를 호출하여 매번 조건 B를 다시 우선 선택한다. C에서 B로 정규화된 것으로 판단되어 기존 수동 증가가 건너뛰어진다. [실제 실패 근거](<C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\output\qa-bounty-241-20261101/toggle-native-report.json>), [재현 코드](<C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\output\qa-bounty-241-20261101/toggle-native.cjs>)가 있다.

격리 후보는 기존 jo9_path 호출1개에 mode3 인수만 추가한다. 조건/후보 필터와 fallback을 유지하면서 수동 검증의 자동 우선선택을 피한다. 후보 SHA `05f5726d813a883805c81c794f08de129c047c04b030ee6e0c37c27f5d8735ef`에서5probe·29assert 실패0을 확인했다. [후보 검사](<C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\output\qa-bounty-241-20261101/toggle-fix-native-report.json>), [최소 변경 제안](<C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\output\qa-bounty-241-20261101/conditions/fix-proposal.json>). **생산 WORK/Full에 반영하지 않았다.** 추가 경계·공식 출고·실제 버튼 gate는 execution-map.json의 GATE-CUT-003에 미완료로 남겼다.

## 확정 문서 불일치 — 연습 성향 +1 안내

10/31 연습 매뉴얼은 종료 시+1이라고 설명하지만11/01 지정행동 규칙과 현행 코드는 연습0이다. 이번 native 연습160사례에서도0을 확인했다. 게임 결함과 구분한 문서 불일치1건이며 이번 감사에서 문서를 수정하지 않았다.

## 낮은 영향의 정적 후보 — content/a.jpg 배경 주소

Full CSS에 `content/a.jpg` 배경 선언10개가 있으나 파일은 없다. 정적 부재는 확인했고, 실제 화면 손상·인물 그림 누락·진행 장애는 재현하지 않았다. 앞의 인물 img는 별도 주소를 사용한다. **확정 런타임 버그 수에는 더하지 않는다.** [후보 근거](<C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\output\qa-bounty-241-20261101/package/css-candidate.json>). H03/O01에서 초상 주변을 확인하고 경주 분기는 공개 상태가 없으므로 미검증으로 둔다.

집계: 새 확정 런타임 결함1건(P2), 문서 불일치1건, 화면 영향 미확정 정적 후보1건. 기존 보류항목은 해결 완료로 바꾸지 않았다. 게임·이미지·개인 SAV·Full 동기화·ZIP·커밋·푸시 수정0.
