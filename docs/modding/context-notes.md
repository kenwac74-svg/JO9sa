# JO9 로컬 모딩 — 작업 결정과 근거 기록

계속 덧붙인다. 확인한 사실과 추정을 구분한다.

## 2026-10-01 세션 1

### 확인한 사실
- 클라우드 repo(`kenwac74-svg/JO9sa`)에는 `jack.qproj`, `locations/*.qsrc`, 풀린 `jack.qsp`가 없다. UI 패치 도구, FIX6 원본 ZIP(`baseline/`), SNKmod 패키지(`releases/`)만 있다.
- FIX6 ZIP에는 `payload/engine/jack.exe`와 `qsp-patches.json`이 있다. `tools/qsp_dump.py`는 `jack.qsp`의 location을 JSON으로 푼다.
- 클라우드 환경에는 wine이 없어 게임 실행 검증이 불가능하다.

### 결정
- 소스 수정은 클라우드가 아니라 사용자 PC의 로컬 Claude Code에서 한다 (사용자 선택).
- 로컬 게임 폴더는 `C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex`.
- 기존 `docs/checklist.md`, `docs/context-notes.md`는 UI 패치용이라 덮어쓰지 않고 `docs/modding/`에 따로 둔다.
