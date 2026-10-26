# 검사 재현

공개 기록에는 진단 QSP/복제 JSON/세이브 원문을 넣지 않았다. before.qsp는 G:/somi/JO9_work_backups/registered_bugfixes_20261022/before.qsp에 별도 보존한다. 현재 QSP가 이후 수동 편집으로 바뀌면 기록된 해시에 맞는 입력을 사용한다.

- 공식 검사: tools/qa/release-check.cjs에 현재 검증 대상, 이 before.qsp, 이번 mods/2026-10-22_registered_bugfixes.json만 담은 폴더, 설치 엔진과 game-dir, 고정된 현재2.4 대표 세이브 사본, cache-revision2를 명시한다. out은 모든 입력의 부모 디렉터리 밖 G:/Codex/tmp 하위의 별도 경로로 둔다.
- 에게야: node egeya/test-egeya.cjs <새 G 임시 출력폴더> integrated <최종 QSP> baaa39836b905e748a6ec8f356494b0260160a364164bc3684812394e4a9dbc9. red-order/green 모드는 보존 before.qsp를 명시한다. mapping-inventory.json과 edits-pre-review.json은 스크립트 옆에 유지한다.
- 그린치/선택지: node reproduce/root-tests.cjs <QSP> <검사태그>. 임시 출력은 스크립트에 명시된 G:/Codex/tmp/jo9-bugfixes-20261022/root에 생성된다.
- 안개: fog/tests.cjs는 __dirname 아래 큰 진단 QSP들을 만들므로 먼저 스크립트만 새 G 임시 디렉터리에 복사하고 실행한다. node tests.cjs <QSP> <검사태그>.
- 우유: milk/verify-milk-layout.cjs installed <WORK/css/base.css>. 코드에 지정된 G 임시 경로를 만들며 실제 게임 화면 클릭 검사와 구분한다.

검사 후 보고서/재현 코드만 보존하고 생성 QSP/복제JSON/브라우저프로필을 정리한다. apply-work.ps1과 integrate.cjs는 이번 적용 단계의 재현 기록이며, 이미 바뀐 현재 WORK에 무조건 다시 실행하는 배포 도구가 아니다. 실제 적용은 항상 대상 해시를 새로 확인한다. 커밋/푸시/배포는 이 검사에 포함되지 않는다.