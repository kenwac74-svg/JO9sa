# 이미지 폴더 비교 필터 — 2026-10-26

사용자 요청: 원본에만/비교본에만 있는 파일과 동일 파일명의 해시 일치/불일치를 각각 골라보거나 숨긴다. 불일치 파일명은 노란색으로 표시한다.

## 소스와 적용

- 이 작업 폴더의 HEAD에는 도구가 없어서 `origin/main`의 `dead2c06edf133eca325617ca2fdc54c4c58c504`에서 `tools/image-folder-review`를 가져와 수정했다. 기존 다른 작업은 변경하지 않았다.
- 버전: 1.1.0. 수정: `folder_review/server.py`, `folder_review/__init__.py`, `static/index.html`, `static/app.js`, `static/style.css`, 서비스 회귀 검사, 사용 안내.
- 현재 실행본: `tmp/modtools-main-20261026/tools/image-folder-review`. 같은 소스 5개 파일을 반영하고 소유권을 확인한 서버만 재시작했다. 이전 파일은 `tmp/folder-filter-backup-*`에 보관했다.
- 주소: `http://127.0.0.1:11332/`.
- 데이터: `C:\Users\Ken Choung\.codex\worktrees\modding-tools-transfer\JO9sa\tools\local-workspace\catalog\folder-review`를 그대로 재사용했다. 재시작 전후 프로젝트 JSON의 파일명·크기·수정시각이 같음을 확인했다.
- 게임 QSP·이미지·세이브는 수정하지 않았다. 초기 작업 때는 커밋·푸시하지 않았으며, 이후 사용자 요청으로 `codex/girls-workshop-handoff-20261027` 홈컴 인계 브랜치에 함께 기록한다.

## 동작

네 조건마다 전체 표시/골라보기/숨기기를 제공한다. 조건·검색·검토 상태를 AND로 적용하며 페이지를 나누기 전에 개별 항목을 거른다. 그룹 선택은 필터에 맞는 항목에만 적용하고, 숨긴 항목의 기록을 보존한다. 초기화는 검색·필터를 모두 해제한다.

동일 파일명은 대소문자와 확장자까지 같아야 한다. 기존 썸네일 큐의 SHA-256 결과를 재사용하며 요청마다 이미지 전체를 다시 해시하지 않는다. 해시 확인 중/오류는 일치·불일치 판정에서 제외하고 별도로 표시한다. 숨기기에서는 미판정 항목을 유지한다. 배경 확인이 진행되면 화면의 개수와 결과가 갱신된다. 외부 파일 변경은 기존 폴더 다시 검사로 확인한다.

## 검증

- 변경 전 전체 Python 검사 28개 통과. 샌드박스에서 localhost 통신이 거절된 검사는 권한을 갖춘 실행으로 재검사했다.
- 신규 필터 검사 실패 확인 후 구현했다. 변경 후 `python -X utf8 -m unittest discover -s tests -v`: 34개 모두 통과.
- `node --check static/app.js`: 통과.
- 격리된 예제 프로젝트에서 내부 브라우저로 네 조건의 골라보기/숨기기 8개 조작, 실제 반환 행, 노란 파일명 색 `rgb(255, 224, 102)`, 초기화, 필터된 그룹 선택 시 숨긴 행 보존을 확인했다.
- 실제 11332 화면에서 기존 girls/pic 프로젝트 유지와 네 필터 표시를 확인했다. 당시 동일 파일명 12,293쌍 중 618쌍 일치, 11,675쌍 확인 중이었다. 전체 이미지 해시 완료를 기다리거나 완료했다고 보고하지 않았다.
- 예제 화면: `tmp/folder-filter-qa/filters-proof.jpg`. 기존 `tests/browser-smoke.cjs`는 실행하지 않았으며 실제 브라우저 검증은 cua_repl로 수행했다.

현재 작업 폴더는 외부에서 관리하는 detached worktree다. 홈컴 인계 커밋은 위 main의 전체 트리를 기준으로 도구 변경 7파일만 합성하며, 이전 게임/옛 도구 소스로 덮어쓰지 않는다. 실제 전달 절차와 새 검증 결과는 `docs/modding/HOME_HANDOFF_20261027.md`와 `records/home-handoff-20261027/folder-review-qa.md`를 따른다.
