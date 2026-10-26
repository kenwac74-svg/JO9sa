# 이미지 폴더 비교 도구 홈컴 핸드오프 QA — 2026-10-27

현재 작업 폴더 `tools/image-folder-review`의 필터 변경을 읽기 전용으로 검토했다. 게임, 기존 검토 DB, 실행 중인 도구 서버와 소스 파일은 수정하지 않았다. Python 검사는 테스트가 소유한 임시 파일과 localhost 테스트 서버만 사용했다.

## 비교 기준과 포함 범위

- 비교한 `origin/main`: `dead2c06edf133eca325617ca2fdc54c4c58c504`.
- 현재 HEAD에서는 도구가 untracked라 `git diff origin/main`만으로 비교하면 삭제처럼 보인다. 실제 파일을 `git show <SHA>:<path>`의 blob과 직접 비교했고 CRLF/LF만 정규화했다.
- main의 도구 파일 21개 중 실제 내용 변경은 아래 7개, 추가 파일은 0개다. 나머지 14개는 동일하다. 변경량은 합계 169줄 추가, 15줄 삭제다.

| 파일 | 변경 | 추가/삭제 |
|---|---|---:|
| `README_KO.md` | 네 필터와 미판정 해시·선택 보존 설명 | +13 / -0 |
| `folder_review/__init__.py` | 버전 1.1.0 | +1 / -1 |
| `folder_review/server.py` | 항목 단위 필터, 해시 상태, 결과 수 | +44 / -3 |
| `static/app.js` | 필터 요청, 초기화, 상태·개수·노란 파일명 표시, 해시 완료 후 갱신 | +16 / -9 |
| `static/index.html` | 네 조건의 전체/골라보기/숨기기 컨트롤과 초기화 버튼 | +9 / -2 |
| `static/style.css` | 불일치 파일명 노란색, 상태 배지, 좁은 화면 배치 | +3 / -0 |
| `tests/test_service.py` | 필터 회귀 검사 6개와 fixture | +83 / -0 |

## 요구사항 대조

- 원본 X · 비교본 O: `comparison_only`.
- 원본 O · 비교본 X: `original_only`.
- 동일 파일명 · 해시 일치: `hash_same`.
- 동일 파일명 · 해시 불일치: `hash_different`; 양쪽 파일명에 `hash-different`를 적용하고 CSS 색상은 `#ffe066`이다.
- 각 조건에 `all`, `only`, `hide`를 제공한다. 검색·검토 상태와 AND로 적용하며 그룹 페이지를 나누기 전에 개별 항목을 거른다.
- 해시는 파일명 대소문자·확장자까지 같은 양쪽 파일에만 비교한다. 기존 썸네일 작업의 SHA-256을 재사용한다. 확인 중과 오류는 같음/다름으로 판정하지 않으며 숨기기에서는 유지한다.
- 그룹 선택 대상은 반환된 필터 항목이다. 숨겨진 항목의 기록을 삭제하지 않는다. 초기화는 검색·검토 상태·네 조건을 모두 해제한다.

## 새로 실행한 검증

작업 위치: `tools/image-folder-review`.

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
& 'C:\Users\Ken Choung\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B -X utf8 -m unittest discover -s tests -v
```

결과: **34개 검사 모두 통과**, `Ran 34 tests in 6.971s`, `OK`, 종료 코드 0. localhost API 및 fixture junction 검사를 위해 권한이 있는 실행을 사용했다.

새 필터 검사 6개는 혼합 그룹의 항목 단위 존재 필터, 동일 파일명 해시 필터, 미판정 해시, 읽기 오류, 숨긴 행의 선택 보존, 페이지 분할 전 필터를 검증한다. 기존 저장·재검사·경로·썸네일·HTTP·실행기 검사도 함께 통과했다.

`node --check tools/image-folder-review/static/app.js`도 종료 코드 0으로 통과했다. 이번 QA에서는 실제 브라우저 조작이나 현재 DB 전체의 해시 완료 여부를 검증하지 않았다.

## 실행본과 전달본 구분

`tmp/modtools-main-20261026/tools/image-folder-review`와 현재 소스를 비교했다. 실제 기능 소스 5개(`__init__.py`, `server.py`, `app.js`, `index.html`, `style.css`)는 동일하다. 실행본의 `README_KO.md`와 `tests/test_service.py`는 이전 버전이다.

홈컴 전달에는 현재 작업 폴더의 위 7개 변경을 최신 main에 반영해야 한다. 실행본 디렉터리 전체를 전달 원본으로 쓰면 사용 안내와 회귀 검사를 누락한다. 이 QA에서 소스 수정이나 커밋·푸시는 수행하지 않았다. root가 새 main을 fetch해 기준 SHA가 바뀌면 이 비교 범위를 새 기준에 재확인해야 한다.
