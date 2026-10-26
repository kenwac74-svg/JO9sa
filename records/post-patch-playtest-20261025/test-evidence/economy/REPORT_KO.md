경제·성장 실제 플레이테스트

현재 Work a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a

34 PASS / 3 FAIL / 2 GAP

확정 결함: 스컵스·작크·아네스의 구매자 소문 항목은 표시되지만 원래 링크 href가 exec:gt로 잘려 상담 화면으로 이동하지 않는다. jo9_buyer_rumors의 menu가 작은따옴표를 포함한 콜백을 $menu exec_options에 전달하고, exec_options도 href를 작은따옴표로 감싸기 때문이다. 세 실제 메뉴의 원래 링크를 클릭한 엔진 로그에 같은 결과가 남았다. 제품 수정은 하지 않았다.

통과한 범위: 병원 두 역할 승인/취소/대상교체/중복결제, 자금·기존건강 차단, 두 판매상 세 난이도와 저복종 감가·표시가/지급가·인물제거·낙인/평판 재검사, 에센스 구매900/재고1/두 역할 사용/상태보호/대상·특성·재고·자금 가드, AP 일일회복표, 실제 운동/천재 교육XP, 전체 하루 영양/휴식/보조식품 및 우유1.5배, 다재다능 명성1회 지급. 세부 수치와 경로는 report.json 및 개별 suite 보고서에 보존했다.

미도달: 소문 결과·복수 추천·실제 납품 후 할인 상담은 위 링크 결함 때문에 native 메뉴 흐름에서 검증하지 못했다. 근육질의 초기 가정교사 메뉴 fixture는 main_screen 입구 뒤에서 진행이 멎어 원인이 미확정이다. 별도 원래 interaction 진입 검증 결과는 report.json에서 구분했다. 원래 위치나 GT를 stub로 바꾼 이전 검사를 이번 플레이테스트의 PASS로 재사용하지 않았다.

재현: node C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\artifacts\post-patch-playtest-20261025\economy\playtest.cjs <suite> --run. 생성·실행 대상은 G:/Codex/tmp/jo9-post-patch-playtest-20261025/economy. 원래 Work와 사용자 HOME 세이브는 읽기만 한다. 설치 엔진의 원래 EXEC/forward 링크를 DOM synthetic click으로 실행했고, 실제 물리 마우스 검증은 아니다. 알림 MSG의 실제 닫힘은 완료 마커만으로 보증하지 않는다.
