# JO9 특성·아이템·마법 DB와 개인 아이디어

현재 WORK에서 특성·아이템·마법을 검색·분류해서 읽고, ‘내 아이디어’ 탭에서 향후 추가할 특성·아이템·마법의 이름·내용·효과·조건·가격/소모·메모를 저장한다.

## 사용

- 모드툴의 GameReference를 열면 된다. 마법은 소모량·직접 메뉴 조건·코드 출처와 실제 시전 코드를 함께 표시한다.
- ‘내 아이디어’에서 새로 작성하고 **아이디어 저장**을 누른다. 목록에서 선택해 수정하며, 삭제는 두 번 확인한다. 작성 중인 내용을 남긴 채 DB 탭을 오갈 수 있다.
- 서버 모드의 개인 기록은 화면에 표시한 `WORK/game/modtools/game-reference/runtime/ideas.json`에 저장된다. 포트가 바뀌어도 같은 파일을 읽는다. 도구 코드/DB 갱신은 이 파일을 복사하거나 초기화하지 않는다.
- 단독 `jo9-reference.html`을 파일로 열면 브라우저에 저장한다. 브라우저/파일 저장소를 바꿀 때는 JSON 백업을 이용한다.
- **JSON 백업**으로 모든 저장 아이디어를 내보낸다. **JSON 가져오기·추가**는 새 ID만 추가한다. 기존 ID의 현재 내용은 유지하므로 옛 백업을 가져와도 최신 수정문을 덮지 않는다.
- 다른 창이 먼저 저장하면 최신 목록을 다시 읽고 작성 중인 양식은 유지한다. 내용을 확인한 뒤 다시 저장한다. 실패/손상 파일을 빈 자료로 덮지 않는다.

개인 기록은 생성 HTML과 Git에 포함하지 않는다. 이 도구에서 아이디어를 저장해도 게임 QSP/능력치/세이브에 자동 적용되지는 않는다.

## 현재 WORK로 다시 생성

Node.js 22 이상. 먼저 작업 사본에서 다음을 실행한다. `game`은 현재 WORK의 game 폴더다.

    node extract-traits.cjs "<game/jack.qsp>"
    node extract-items.cjs "<game/jack.qsp>"
    node enrich-item-acquisition.cjs "<game>"
    node extract-spells.cjs "<game/jack.qsp>" "<game/json/menu_item.json>"
    node assemble.cjs "<game/jack.qsp>"

생성기는 `../text-workshop/core.cjs`에 의존한다. 원작 표시명·수동 보완은 해당 생성기에서 유지한다. traits/items/spells JSON과 HTML은 같은 QSP 해시를 가져야 한다. 마법은 직접 메뉴 조건과 시전 정의를 대조한 자료이며, 상위 메뉴 조건·모든 자동 시전 경로·모든 결과를 실제 플레이로 검증한 공략은 아니다.

`serve.cjs`는 127.0.0.1에서만 실행된다. `ideas-core.cjs`와 `ideas-store.cjs`가 필요하다. API는 개인 기록 파일만 수정하며 revision 충돌과 외부 Origin 쓰기를 거부한다. `Start-Game-Reference.ps1`은 자기 서버의 PID/경로/버전을 확인해 재사용하거나 코드 변경 시 재시작한다. 개인 파일은 그대로 둔다.
