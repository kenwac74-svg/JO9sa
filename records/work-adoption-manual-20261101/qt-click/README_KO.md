# 자동 Qt DOM 클릭 검사

이 결과물은 **자동화한 게임 내 Qt DOM 검사**다. 수동 플레이나 화면의 픽셀·배치를 확인하는 검사가 아니다. 준비 시점에는 엔진을 실행하지 않았다.

최신 WORK의 mode3 수정 SHA256 `05f5726d813a883805c81c794f08de129c047c04b030ee6e0c37c27f5d8735ef`를 읽었고, 이미 수정된 호출을 확인했다. 생산 파일은 쓰지 않았다.

실행 계획: `G:/Codex/tmp/work-adoption-qt-click-20261101/plan.json`. 하나의 `cycle-click` 케이스와 명시적 검사 27개를 준비했다. 실제 `interior_change` 본문을 유지한 3개 로케이션의 QSP는 176,802바이트다. 리소스는 자기 소유 1px PNG 다섯 개(그림 A/B/C/D와 버튼 아이콘)이며 외부 링크는 없다.

B의 조건이 충족되는 상태에서 최초 B, 실제 이미지 전환 링크의 MouseEvent 네 번으로 C → D → A → B를 기대한다. 매 상태의 `src`, `naturalWidth`, `naturalHeight`, 클릭 전 QSP 선택 ID, 원래 전환 링크의 EXEC 대상을 검사하고 실제 전환 링크 클릭 횟수 4회도 확인한다.

진단 JavaScript는 실제 `#jo9_image_cycle` 안의 anchor를 찾는다. `href`의 원래 `gs 'interior_change', 'jo9_toggle'` 실행문을 보존하고 임시 DOM에만 상태 수집·다음 검사 콜백을 앞뒤에 덧붙인 뒤 `MouseEvent`를 dispatch한다. 원래 함수나 Windows 입력 자동화를 대체하지 않는다. 마지막 B의 관측 결과만 숨긴 진단 콜백 링크로 돌려받는다. 단계 번호로 이전 HTML 안의 재실행된 스크립트를 무시한다.

상위 작업이 엔진을 직렬 실행한 다음 `node qt-click.cjs collect`로 `qt-click-report.json`을 만든다. `SAVEGAME`은 상대 경로 `qt-click.sav`만 사용한다. 결과 수집 후 `node qt-click.cjs cleanup`으로 소유 폴더·링크 부재를 확인하고 보고·로그·재현 코드만 보관한 뒤 재생성 가능한 QSP·PNG·진단 SAV를 정리한다. 스크립트에는 엔진 실행 명령이 없다.
