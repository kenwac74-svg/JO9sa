# 하단 설명 공백 — 실제 Qt 검증

WORK/Full/원본/사용자 세이브를 바꾸지 않고 `G:/Codex/tmp/shop-text-quest-20261026/text/spacing`의 복제 QSP만 실행했다. QSP는 `Start` 본문만 바꾸었으며 나머지 인코딩 필드가 기준 WORK와 전부 같은지 검사했다. 실제 `slave_stat`, `exit`, `jo9_traits`의 텍스트 함수를 호출하고 원래 CSS와 폰트를 그대로 사용했다.

실행기는 상위 런처가 아닌 `G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe`다. SHA256 `f75032d79ecb58eeb7b969cd3f774d66b091fca38a360acdabd782e03a46c6e6`. 런처를 사용한 최초 시도는 엔진 로그가 생기지 않아 중단했으며 결과 판정에 쓰지 않았다. 각 실행에서 도구가 만든 PID만 종료했다.

## 원인과 후보 보완

구 JS `b5da0bb7b78484c870695a11ed78897d2f9e0d65f23df931ab7195a30eb4a0de`에서 실제 건강체질 설명의 같은 줄 인접 단어 24쌍 간격이 전부 0px였다. 원문 `textContent`는 정확히 같았다. 원문 공백이 아니라 QtWebKit이 단어 `inline-block` 사이 공백 text node를 시각적으로 접는 문제다.

첫 후보 `d8ff09b63a40a96a967e6b86156e093368295cbfea3739a53a22dbce9f4b6b8f`는 단어 span을 `white-space:pre`로 하고 뒤 공백을 그 span 안에 넣어 건강체질 간격을 5px로 복원했다. 그러나 긴 단일 토큰에서 `visit(box)` 뒤 `clientWidth`를 읽으면 QtWebKit이 패널 자체를 긴 토큰 폭으로 확장한 후라 fallback이 실행되지 않았다. 한글/영문/URL 사례에서 패널이 각각 1925/2885/2769px로 늘어났다.

최종 후보는 기존 패널의 폭을 **span 주입 전**에 포착하도록 측정 순서만 보완했다. CSS·폰트·본문은 바꾸지 않았다. 최종 후보 SHA256은 `fd5d5db466ca9851277c77af4c73398ca12f6e29a0efcb6d6c8a6730430bc237`다.

## 관측 결과

Range는 `/\S+/g`로 단어 본문만 선택하여 뒤 공백을 제외했다. 따라서 아래 간격은 span 전체 폭 차이가 아니라 실제 글자 끝과 다음 글자 시작 사이의 차이다. 300ms 및 약 900ms에 두 번 측정했다.

| 화면/입력 | 글꼴/크기 | 같은 줄 최소 간격 | 패널 폭 | 단어 안 분리 | 수평 넘침 | 세로 넘침 |
|---|---|---|---|---|---|---|
| 구 JS 건강체질 | 경기천년제목 Medium 18px | 0px, 24쌍 | 760px | 없음 | 없음 | 없음 |
| 최종 JS 건강체질 | 같은 글꼴 18px | 5px, 24쌍 | 760px | 없음 | 없음 | 없음 |
| 구 JS 게임오버 | 같은 글꼴 22px | 0px, 33쌍 | 830px | 없음 | 없음 | 기존 scrollHeight 차이 14px |
| 최종 JS 게임오버 | 같은 글꼴 22px | 6px, 32쌍 | 830px | 없음 | 없음 | 동일한 scrollHeight 차이 14px |
| 한글 단일 토큰 120자 | 같은 글꼴 18px | 일반 단어 사이 5px | 760px | 긴 토큰만 3줄 | 없음 | 없음 |
| 영문 단일 토큰 180자 | 같은 글꼴 18px | 일반 단어 사이 5px | 760px | 긴 토큰만 4줄 | 없음 | 없음 |
| URL 단일 토큰 276자 | 같은 글꼴 18px | 일반 단어 사이 5px | 760px | 긴 토큰만 4줄 | 없음 | 없음 |

모든 사례에서 원문 `textContent`가 정확히 보존됐다. 최종 후보의 긴 토큰 3종은 fallback으로 나뉘며, 다른 어절은 나뉘지 않는다. 한글의 span `max-width`는 760px, 영문은 2880px, URL은 2764px로 기록되지만 실제 글자 Range 최대 폭은 각각 752/752/759px이며 최종 패널 폭은 760px이다. 영문/URL의 실제 패널 높이는 154px로 원래 일반 설명의 150px보다 4px 크고, 아래 경계 797px는 800px 뷰포트 안에 남는다. 수평·수직 스크롤 넘침은 없다. 건강체질 검사는 실제 `$func('jo9_traits','text','healthy')`를 사용했다.

게임오버 QSP 원문의 inline CSS에는 `overflow:auto`가 있지만 실제 후보 Qt DOM의 computed `overflowY`는 `visible`이며 `scrollTop=1`은 적용되지 않았다. 따라서 실제로 스크롤할 수 있다고 주장하지 않는다. 엄격한 `scrollHeight <= clientHeight` 조건은 구 JS와 최종 후보 모두 14px 차이로 실패했다. 구 JS는 198/212px, 후보는 231/245px다. 공백이 보이면서 본문이 한 줄 늘었으나 14px 차이는 새로 생긴 것이 아니다. 본문 아래 경계는 472px이고 메뉴 위 경계는 506px여서 메뉴를 침범하지 않는다.

원래 승인된 요구는 본문 가독성과 메뉴 미침범이다. 세로 차이 0과 스크롤 가능 여부는 root가 추가했다가 실제 요구와 다름을 확인한 진단 가정이다. 이 조건으로 나온 FAIL 마커를 원시 기록에 보존하며 제품 실패로 해석하지 않는다. 최종 판정은 텍스트 보존·5/6px 공백·일반 어절 분리 없음·가로 경계 유지·메뉴 미침범을 모두 확인한 `PASS_APPROVED_READABILITY_SCOPE`다. 추가 baseline 스크롤 검증과 끝 공백 없는 긴 토큰 변형은 범위를 넓히지 않고 중단했다. 후보 JS나 CSS를 추가로 수정하지 않았다.

`spacing-native-results.json`에 두 시점의 모든 단어 Range·간격·폰트·패널 경계와 원시 클라이언트 판정을 보존했다. `native-spacing.cjs`는 격리 복제 생성, `collect-native-spacing.cjs`는 진단 세이브에서 필요한 DOM/Range 기록만 추출하는 재현 스크립트다. 스크린샷 픽셀 비교나 전체 사용자 세이브 호환성 검사는 아니다.

검증 후 진단 QSP·세이브·복제 JSON·준비만 하고 실행하지 않은 추가 사본을 모두 정리했다. 정리 대상의 절대 경로를 고정하고 정션 대상에는 들어가지 않았다. Windows PowerShell의 정션 삭제 오류는 해당 연결 자체에 대한 비재귀 삭제로 처리했다. 결과·재현 코드·준비 메타·정리 기록은 artifact 폴더에 남겼고, `G:/Codex/tmp/shop-text-quest-20261026/text/spacing`은 더 이상 남아 있지 않다.
