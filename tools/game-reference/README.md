# JO9 특성·아이템 열람표

2026-11-08 현재 WORK QSP 기준 갱신본이다. 특성 128개와 아이템 271개(기본 196개·조리 음식 75개)를 검색·분류·탭으로 열람한다. 게임 실행이나 설치 없이 같은 폴더의 jo9-reference.html을 브라우저로 열면 된다.

정액 중독·석녀의 발현과 카오틱 에센스 치료, 기존 시루 보정, 특별요리 재료의 가격·10회분 판매 단위·사용 우선순위를 현재 코드에 대조했다. 특등급 처녀고기는 내부 지급 함수만 있고 획득 이벤트 호출이 없어 입수 불가로 표시한다. 미확인 입수처를 임의로 채우지 않았다.

snapshot.json의 QSP SHA256은 갱신 시점의 출처다. 실행 중 게임을 자동 감지하지 않는다. 재생성 후 QSP가 바뀌면 다시 갱신해야 한다. 원작 표시명·수동 요약은 보존했으며, 이전 제작본을 보존한 원격 커밋은 41c1a6409e89b1cccac50f1c033d16a5043030d2다.

## 모드툴

Open-Modding-Tools.ps1에 포함했다. WORK의 modtools/game-reference에서 읽기 전용 로컬 서버를 시작·재사용하며 GameReference 주소를 출력한다. 일반 실행에서는 해당 탭을 함께 연다. 이 도구만 실행할 때는 Start-Game-Reference.ps1을 사용한다. HTML 단독 열람에는 Node.js가 필요 없다.

## 현재 WORK에서 재생성

Node.js 22 이상을 사용한다. 생성 명령은 이 폴더의 데이터와 HTML을 갱신하므로, 이전 제작본을 보존한 작업 사본에서 실행한다. game/jack.qsp와 game/json/menu_item.json을 읽으며 게임 파일은 쓰지 않는다.

    node extract-traits.cjs "<WORK/game/jack.qsp>"
    node extract-items.cjs "<WORK/game/jack.qsp>"
    node enrich-item-acquisition.cjs "<WORK/game>"
    node assemble.cjs "<WORK/game/jack.qsp>"

생성기는 ../text-workshop/core.cjs에 의존한다. extract-items와 enrich는 items.input.json을 만들고, assemble은 여기에 음식과 현재 보완을 합쳐 최종 items.json·traits.json·jo9-reference.html을 만든다. refresh-current.cjs의 보완은 소스 조건과 수치를 검사한 뒤 반영한다. 실패 시 현재 WORK와 대조해야 하며 과거 수치를 임의로 이어 쓰면 안 된다.

## 범위

열람표이며 게임 밸런스·가격·특성·세이브를 수정하지 않는다. 일반 능력치·일시적 버프·초상 전용 아이콘은 특성 집계 밖이다. 마법 전용 목록은 이 자료에 포함되지 않았다. 생성 시점의 정적 코드 자료이며 모든 플레이 경로를 실행해 검증한 공략은 아니다.
