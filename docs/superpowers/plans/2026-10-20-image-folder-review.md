# Image Folder Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 사용자가 고른 원본·비교 폴더를 번호별 그룹으로 대조하고 파일별·그룹별 유지 선택을 저장하는 로컬 브라우저 도구를 만든다.

**Architecture:** 독립 Python 서버가 폴더 목록·프로젝트·이미지 접근을 관리한다. Pillow 작업 큐가 썸네일을 생성하고 정적 웹 화면이 검색·대조·선택을 제공한다. 기존 게임 서버·이미지 카탈로그에는 연결하지 않는다.

**Tech Stack:** Python 3.12, Python 표준 라이브러리, Pillow 12, HTML/CSS/JavaScript, Windows 폴더 선택창, PowerShell 실행기.

**Spec:** `G:/somi/JO9sa/docs/superpowers/specs/2026-10-20-image-folder-review-design.md`

## Global Constraints

- 원본·비교 폴더는 사용자가 선택한다. 경로 직접 입력과 등록된 폴더쌍 다시 열기를 지원한다.
- 선택값은 **원본 유지 / 비교본 유지 / 보류**이며 미검토와 보류를 구별한다. 그룹 전체 적용 후 개별 수정이 가능하다.
- 도구 소스: `G:/somi/JO9sa/tools/image-folder-review/`
- 사용자 프로젝트·썸네일: `G:/somi/IMGMG/folder-review/` (실행 옵션으로 변경 가능)
- 서버는 `127.0.0.1`로 제한하고 등록된 폴더 안의 이미지에만 접근한다.
- 원본·비교 이미지의 복사, 덮어쓰기, 이동, 삭제를 실행하지 않는다. 기존 게임과 이미지 카탈로그도 수정하지 않는다. 커밋·푸시 보류 지시는 유지한다.
- 검사 데이터는 별도 `outputs/image-folder-review-20261020/qa/`에 저장한다. 사용자용 프로젝트에 테스트 선택을 남기지 않는다.
- 아래 명령은 도구 소스 폴더에서 실행한다. `python`은 `C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`를 뜻한다.

## Review Focus

- 같은 크기·수정시각을 유지한 이미지 내용 변경: 기존 선택을 그대로 확정하지 않고 재검토로 표시한다. Task 2에서 검증한다.
- 확장자가 다른 일대일 대응에 새 동명 파일이 추가됨: 바이트가 같아도 대조 쌍이 바뀌면 재검토로 표시한다. Task 2에서 검증한다.
- 한 그룹에 한쪽만 있는 파일이 섞임: 없는 쪽을 유지하는 일괄 선택은 건너뛰고 개수를 알리며 개별 선택을 훼손하지 않는다. Tasks 2·4에서 검증한다.
- 재검사 중 재시작·저장 실패: 마지막 정상 결과와 선택을 보존하고 미완료·실패를 정상 저장으로 표시하지 않는다. Tasks 2·3에서 검증한다.
- 등록 후 링크 변경·경로 이탈: 다른 폴더 파일을 썸네일·원본·내보내기로 읽지 않는다. Task 3에서 검증한다.

---

## File Structure

아래 경로는 `G:/somi/JO9sa/tools/image-folder-review/`를 기준으로 한다.

- `folder_review/catalog.py`: 파일 검사·번호 분리·자연 정렬·양쪽 대응.
- `folder_review/project_store.py`: 프로젝트 등록·선택 저장·파일 해시·재검사 이력·내보내기.
- `folder_review/thumbnails.py`: EXIF 회전·비율·투명도를 반영하는 디스크 썸네일 캐시와 작업 큐.
- `folder_review/picker.py`: Windows 폴더 선택창의 취소·성공·오류 결과.
- `folder_review/server.py`, `folder_review/__main__.py`, `folder_review/__init__.py`: 서비스·HTTP 라우팅·실행 인수.
- `static/index.html`, `static/app.js`, `static/style.css`: 한국어 웹 화면.
- `Start-Image-Folder-Review.ps1`, `Open-Image-Folder-Review.cmd`: 숨김 서버 실행·기존 서버 재사용·브라우저 열기.
- `tests/test_catalog.py`, `tests/test_store.py`, `tests/test_service.py`, `tests/browser-smoke.cjs`: 자동 검증.
- `README_KO.md`: 실행·등록·선택·복원·데이터 위치·제거 시 영향 설명.

## Shared Interfaces and Data

- `FileRecord`: `{id, side, relative_path, group_key, variant_key, extension, size, mtime_ns}`. `side`는 `original|comparison`. `variant_key`는 번호 표기를 보존한다.
- `Row`: `{id, group_id, original: FileRecord|null, comparison: FileRecord|null, decision, review_required}`. `decision`은 `null|original|comparison|defer`다.
- `Group`: `{id, relative_dir, name, rows, decision_summary}`. 요약은 미검토·보류·원본 유지·비교본 유지·혼합 선택·재검토를 표시한다.
- `Project`: `{id, name, original_root, comparison_root, scan, groups, stats}`. 선택에는 판단 당시 양쪽 파일명·해시와 대조 쌍 ID를 함께 기록한다.
- HTTP JSON은 `{ok:true,...}` 또는 `{ok:false,error:{code,message}}`다. 클라이언트는 실패를 조용히 무시하지 않는다.

## Task 1: 폴더 검사와 번호 그룹화

**Files:** Create `folder_review/catalog.py`, `folder_review/__init__.py`; Test `tests/test_catalog.py`.

**Interfaces:** `parse_filename(name: str) -> dict`; `scan_pair(original: Path, comparison: Path) -> dict`; `build_groups(files: list[dict]) -> list[dict]`. `scan_pair`는 파일 목록과 읽기 실패·지원되지 않는 형식·건너뛴 링크 기록을 반환한다.

- [x] 번호 분리·대응 테스트를 먼저 작성한다. `_3/_4/_9/_10`은 한 그룹에서 숫자순이며 앞·중간 숫자, `_02`, `_2`, ` (2)`, 기본 파일, `_1`은 구별한다. 다른 상대폴더의 동명 파일도 구별한다.
- [x] 정확한 상대파일명 우선 대응, 남은 동일 번호 표기의 일대일 확장자 차이 대응, 다중 후보의 일방 행 보존을 테스트한다.
- [x] `python -m unittest discover -s tests -p test_catalog.py -v`를 실행해 새 기능 부재로 실패함을 확인한다.
- [x] 위 인터페이스를 구현한다. 링크는 따라가지 않으며 PNG/JPEG/WebP/GIF/BMP/TIFF 등 지원 확장자를 수집하고 원본 이미지를 변경하지 않는다.
- [x] 같은 명령에서 모든 기대 그룹·행·누락 개수가 통과함을 확인한다.

대표 테스트 `test_trailing_number_preserves_character_id`의 핵심 기대값:
```python
self.assertEqual(parse_filename("1092_bath_3.png")["base"], "1092_bath")
self.assertNotEqual(parse_filename("bath_02.png")["variant_key"], parse_filename("bath_2.png")["variant_key"])
```

## Task 2: 프로젝트·개별 선택·그룹 일괄 선택의 영속 저장

**Files:** Create `folder_review/project_store.py`; Test `tests/test_store.py`.

**Interfaces:** `ProjectStore(data_dir: Path)`; `register(name: str, original: str, comparison: str) -> dict`; `list_projects() -> list[dict]`; `get_project(project_id: str) -> dict`; `apply_scan(project_id: str, scan: dict) -> dict`; `set_decision(project_id: str, row_ids: list[str], choice: str|null) -> dict`; `export_decisions(project_id: str, format: str) -> bytes`.

- [x] 선택 저장·재시작 복원·원본/비교 반전 시 분리·잘못된 경로·동일 폴더·등록 취소 후 무변경 테스트를 먼저 작성한다. 동일 폴더쌍 재등록은 기존 프로젝트를 돌려준다.
- [x] 그룹 일괄 선택 후 한 행만 수정하면 혼합 선택이 되는지 검증한다. `original` 일괄 적용에서 원본 없는 행은 기존 결정을 유지하고 `{applied,skipped}`에 반영해야 한다. `defer`는 모든 대상 행에 적용한다.
- [x] 양쪽 파일의 변경·삭제, 같은 크기·mtime의 바이트 변경, 새 파일로 인한 대조 쌍 재편, 새 행 추가, 저장 예외를 테스트한다. 이전 결정의 이력을 보존하며 재검토와 미검토를 구별한다.
- [x] `python -m unittest discover -s tests -p test_store.py -v`의 실패를 확인한다.
- [x] Task 1 결과를 사용하여 위 인터페이스를 구현한다. JSON 임시파일 작성·flush·교체와 프로세스 내 잠금을 사용한다. 결정 저장 및 재검토는 양쪽 파일의 SHA256을 확인한다. JSON/CSV 내보내기에는 프로젝트·상대경로·선택·재검토 상태를 포함한다.
- [x] 같은 명령에서 저장 실패를 포함한 모든 기대 결과가 통과함을 확인한다.

대표 테스트 `test_group_choice_then_individual_override`의 핵심 기대값:
```python
self.assertEqual(result["skipped"], 1)  # 원본이 없는 행 한 개
self.assertEqual(reopened_group["decision_summary"], "mixed")
```

## Task 3: 자동 썸네일·폴더 선택·로컬 API

**Files:** Create `folder_review/thumbnails.py`, `folder_review/picker.py`, `folder_review/server.py`, `folder_review/__main__.py`; Test `tests/test_service.py`.

**Interfaces:** `ThumbnailCache(cache_dir: Path, workers: int=2)`; `enqueue(files: list[dict]) -> None`; `get(file: dict, priority: bool=False) -> dict`; `pick_folder(initial: str|None=None) -> dict`; `ReviewService(data_dir: Path)`; `serve(host: str, port: int, data_dir: Path) -> None`.

- [x] EXIF 회전·투명 PNG·가로세로 비율·손상 이미지·캐시 재사용·변경 시 무효화 테스트를 먼저 작성한다. GIF 등은 대표 첫 프레임을 사용하고 그 사실을 표시한다.
- [x] 폴더 선택 취소를 정상 결과로 반환하는 테스트, 원본 읽기 범위 이탈·심볼릭 링크 교체·잘못된 ID 차단 테스트, 작업 중 마지막 정상 프로젝트 유지 테스트를 작성한다.
- [x] `python -m unittest discover -s tests -p test_service.py -v`에서 미구현 실패를 확인한다.
- [x] 최대 2개 작업 스레드로 썸네일을 자동 생성하고 요청된 화면 항목을 우선 처리한다. 대표 썸네일은 긴 변 480px 이하의 WebP로 저장하며 원본 크기를 함께 반환한다. 실패 파일에도 항목과 오류를 남긴다.
- [x] Windows 폴더 선택은 별도 Python 프로세스의 Tk 파일 선택창을 사용한다. `pick_folder` 결과는 `{cancelled,path,error}`이며 경로 직접 입력도 동일한 등록 검증을 거친다.
- [x] 다음 API를 구현한다: `GET /api/projects`, `POST /api/projects`, `GET /api/projects/{id}`, `POST /api/projects/{id}/rescan`, `POST /api/projects/{id}/decisions`, `GET /api/jobs/{id}`, `POST /api/pick-folder`, `GET /api/projects/{id}/export?format=json|csv`, `GET /asset/{project_id}/{file_id}?mode=thumb|original`.
- [x] 목록 API는 검색·존재상태·검토상태·페이지 필터를 받는다. 등록·재검사는 작업 ID를 반환하여 UI가 검사/썸네일 진행을 확인하도록 한다. POST에는 세션 토큰과 Host/Origin 검사를 적용하며 자산을 읽기 직전에도 경로 범위를 확인한다.
- [x] `python -m unittest discover -s tests -v`에서 앞 단계와 HTTP 통합 테스트가 모두 통과함을 확인한다.

대표 테스트 `test_asset_symlink_changed_after_scan`와 `test_thumbnail_bound`의 핵심 기대값:
```python
self.assertEqual(response.status, 403)
self.assertLessEqual(max(thumbnail.size), 480)
```

## Task 4: 한국어 비교·선택 화면

**Files:** Create `static/index.html`, `static/app.js`, `static/style.css`; Test `tests/browser-smoke.cjs`.

**Interfaces:** Task 3 API를 사용한다. 브라우저는 로컬 파일 경로를 직접 읽지 않는다. 선택 요청은 겹쳐 저장되지 않게 직렬 처리하며 서버 응답을 기준으로 표시한다.

- [x] 브라우저 검증에 등록·프로젝트 재열기·검색·번호순·한쪽 누락·개별 선택·그룹 전체 선택 후 개별 수정·새로고침 복원·재검토·내보내기를 기대 동작으로 작성하고 미구현 실패를 확인한다.
- [x] 사용자 선택 버튼과 경로 입력을 갖춘 폴더쌍 등록 화면, 등록 목록, 그룹 목록과 좌우 비교 행을 구현한다. 번호·파일명·크기를 표시하며 20개 그룹 단위 페이지로 목록을 제한한다.
- [x] 각 행과 그룹 상단에 원본 유지·비교본 유지·보류를 제공한다. 그룹 선택은 확인된 대상 행 전체에 적용하고 적용/건너뜀 개수를 표시한다. 체크 상태는 서로 배타적이며 누락된 쪽은 선택 불가다.
- [x] 검색·존재상태·검토상태 필터, 진행 개수와 검사/썸네일 진행, 저장 중/완료/실패 표시, JSON/CSV 내보내기를 구현한다.
- [x] 원본·비교 확대창에 화면 맞춤·100% 보기·닫기와 전체 경로를 제공한다. 투명 이미지에는 체크무늬 배경을 사용한다. 키보드 접근·창 크기 변경 시 조작 가능성을 확인한다.
- [x] 브라우저 검증에서 기대 동작과 네트워크/콘솔 오류 없음, 이미지 로드 성공을 확인하고 대표 화면을 내부 검사 이미지로 남긴다.

브라우저 검사는 별도 임시 프로젝트·서버를 직접 시작하고 종료한다. 기존 테스트와 같은 `JO9_PLAYWRIGHT`, `JO9_BROWSER` 환경변수를 지원한다. 핵심 기대값은 페이지 새로고침 뒤에도 선택이 유지되고 `pageErrors.length === 0`인 것이다. 실행 명령:
```powershell
$env:JO9_PLAYWRIGHT = 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:JO9_BROWSER = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
& 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' tests/browser-smoke.cjs
```

## Task 5: 실행기·사용 안내·실제 대량 폴더 점검

**Files:** Create `Start-Image-Folder-Review.ps1`, `Open-Image-Folder-Review.cmd`, `README_KO.md`; Update `tests/test_service.py` for CLI/server reuse tests.

**Interfaces:** `python -m folder_review --host 127.0.0.1 --port 11332 --data-dir <path>`; 실행기는 실제 활성 URL·PID 기록을 읽되 HTTP 응답으로 서버 종류를 검증한 후에만 재사용한다. 포트가 다른 프로그램에 사용 중이면 빈 포트를 고른다.

- [x] 경로에 공백·한글이 있는 실행, 이미 실행 중인 서버, 다른 프로그램의 포트 점유를 검증하는 실행기 테스트를 먼저 작성하고 실패를 확인한다.
- [x] Python/Pillow 확인·숨김 서버 시작·응답 대기·실제 URL 열기를 구현한다. PowerShell은 UTF-8 BOM으로 저장한다. 게임 실행기나 기존 도구 일괄 실행기는 호출하지 않는다.
- [x] 안내서에 폴더 등록·번호 그룹 규칙·개별/전체 선택·자동 저장·보류/재검토·재검사·내보내기·데이터 위치를 설명한다. 소스 모듈별 역할·호출 관계·의존성·상태 파일 제거의 영향·검증 한계도 기록한다.
- [x] 전체 Python 테스트와 브라우저 검증을 실행한다. 실제 `K:/doing/JONT2.3kor_scene/game/content/pic/girls/sex_scenes`와 현재 Work의 대응 폴더를 별도 QA 데이터 위치에 등록하여 대량 검사·자동 썸네일·페이지·검색을 점검한다. 실제 폴더가 없으면 존재하는 대량 폴더를 읽기 전용으로 선정하고 기록한다.
- [x] 테스트 전후 원본 파일의 수·크기·mtime 목록과 테스트에서 선택한 파일들의 해시가 변하지 않았는지 확인한다. 검사 실패를 해결한 뒤 독립 검토자가 전체 변경과 필수 예외를 검토한다.
- [x] 사용자용 데이터 위치로 서버를 실행하고 새 도구의 등록 화면을 브라우저에 연다. 실행 URL과 검증 결과를 간단히 보고한다. 커밋·푸시는 하지 않는다.

대표 테스트 `test_occupied_port_does_not_reuse_foreign_server`의 핵심 기대값은 `self.assertNotEqual(launched_port, foreign_port)`이며 기존 서버 재사용 테스트는 `self.assertEqual(first_pid, second_pid)`다. Task 3의 전체 unittest 명령과 Task 4의 브라우저 명령으로 함께 검증한다.

## Self-Review and Execution Handoff

설계서의 폴더 선택·그룹화·썸네일·확대·선택·자동 저장·재검사·내보내기·게임 분리 요구는 위 다섯 작업에 대응한다. 인터페이스의 `original|comparison|defer` 값은 모든 단계에서 동일하다. 검토 초점의 다섯 조건은 각 소유 단계의 테스트에 포함했다.

작업 간 API 의존성이 높고 파일 범위가 독립 도구로 제한되므로 **현재 대화에서 직접 구현하고 마지막에 독립 검토하는 방식**을 권장한다. 사용자는 이 계획을 검토한 뒤 직접 구현 또는 단계별 보조 에이전트 구현 방식을 선택한다. 커밋·푸시 보류는 어느 방식에서도 해제되지 않는다.
