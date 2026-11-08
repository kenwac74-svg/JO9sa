# JO9 특성·아이템 열람표

2026-11-08: 지난 PC 인계에서 빠진 제작본을 저장소에 보존했다. 특성 126개와 아이템 270개를 탭으로 열람하며, 검색·획득처 분류·가격·획득 조건을 표시한다.

## 바로 열기

같은 폴더의 [jo9-reference.html](jo9-reference.html)을 브라우저로 연다. HTML에 데이터가 들어 있어 게임 실행이나 별도 설치 없이 열람할 수 있다.

로컬 주소로 열려면 저장소에서 Node.js로 아래 명령을 실행하고, 터미널에 출력된 주소를 연다.

    node tools/game-reference/serve.cjs 3632

3632를 다른 프로그램이 사용 중이면 숫자를 생략해 빈 포트로 실행한다. 이 서버는 읽기 전용이며 로컬 PC에서만 접속한다.

## 데이터 기준과 남은 갱신

이 자료는 **2026-11-07 제작 당시 QSP 6245907e647f**의 저장본이다. 최종 3차 r2의 QSP 46e972bf98bc 또는 이후 다른 PC의 WORK를 다시 추출한 자료가 아니다. 정액 중독·석녀 같은 이후 신규 특성과 특별요리·식재료 가격 변경은 최신 WORK를 확인한 뒤 갱신해야 한다. HTML 아래의 QSP 표시는 이 저장본의 출처이며 실행 중인 게임을 자동 감지하지 않는다.

items.json의 기본 195개에 조리 음식 75개를 합쳐 HTML에 270개를 담았다. 확인하지 못한 가격·획득처는 미확인으로 표시한다. 게임 밸런스나 구매 조건을 바꾸는 도구가 아니다.

## 생성 원본

추출 스크립트 4개와 템플릿·JSON을 함께 보존했다. QSP 해석에는 저장소의 ../text-workshop/core.cjs를 사용한다. 기존 PC 전용 임시 폴더 의존성을 제거했고 실제 게임 경로는 명령 인자로 받는다. 생성 명령은 이 폴더의 JSON과 HTML을 다시 쓰므로 기존 자료를 보존하고 별도 작업 사본에서 실행한다.

    node tools/game-reference/extract-traits.cjs "<실제 game/jack.qsp>"
    node tools/game-reference/extract-items.cjs "<실제 game/jack.qsp>"
    node tools/game-reference/enrich-item-acquisition.cjs "<실제 game 폴더>"
    node tools/game-reference/assemble.cjs "<실제 game/jack.qsp>"

원래 생성기에 들어 있던 수동 가격·획득처 보완과 특성 규칙은 그대로 보존했다. 새 버전에 재생성할 때 해당 보완도 최신 소스와 대조해야 한다. 이번 인계는 데이터 갱신 완료를 뜻하지 않는다. 출처와 파일 해시는 snapshot.json에서 확인한다.
