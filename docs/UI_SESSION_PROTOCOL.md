# UI 세션 협업 규칙 (UI 세션 쪽 실행 절차)

공통 규칙과 역할은 `docs/modding/PROCESS.md`(게임 수정 세션 관리)를 따른다. 이 문서는 UI 세션이 그 규칙을 지키기 위해 실제로 하는 일과, 두 세션이 서로 기대하는 것을 적는다.

## 1. 연락 방법
- 두 세션은 서로 직접 메시지를 보내지 못하는 경우가 있다. **저장소 파일이 공식 연락 수단**이다. 대화창 메시지는 사용자 전달용 요약이다.
  - UI → 게임 수정: `release/qsp-review/<버전>/README.txt` (후보 SHA-256, 적용 mods, 확인 결과, 요청)
  - 게임 수정 → UI: `mods/*.json`과 `docs/modding/context-notes.md`, 컨펌은 메시지 또는 사용자 전달
- 버전마다 폴더를 새로 만든다. 지난 폴더는 고치지 않는다.

## 2. UI 빌드가 mods를 쓰는 방법
- `main`을 UI 작업 브랜치(`claude/sweet-meitner-72rd73`)에 병합한 뒤 빌드한다.
- `mods/*.json`을 파일 이름 순서로 적용한다. `field`는 `body`만 지원한다. `old`가 UI 본문에 정확히 `count`번 없으면 빌드가 멈춘다. 해시는 보지 않는다.
- `old`/`new`의 원본 UI 이미지 경로는 UI 빌드와 같은 SNKmod 경로로 바꿔 찾는다.
- 후보: `build_package.py --release`, 기반: 같은 명령에 `--no-mods`.

## 3. mods가 새 이미지·메뉴 아이콘을 쓸 때
- 이미지는 UI 패키지가 설치하므로 UI 세션이 `resources/mod_assets/content/pic/SNKmod/`에 넣고 `resources/mod_assets/assets.json`에 SHA-256과 사용하는 mods 이름을 적는다. 이 이미지는 참조 형식과 관계없이 trash로 보내지 않는다.
- `json/menu_icon.json` 값 변경은 같은 `assets.json`의 `MenuIcon`에 적는다(UI 패키지가 이 파일을 통째로 교체하므로).
- 빌드는 mods의 `new`가 가리키는 `SNKmod\…` 경로가 패키지에 없으면 멈춘다.
- **게임 수정 세션에 바라는 것**: 이미지가 필요한 mods는 `description`에 SNKmod 경로를 적고, 가능하면 이미지 파일도 `main`의 `mods/assets/content/pic/SNKmod/…`에 함께 커밋한다. 그러면 UI 세션이 사용자 PC 없이도 가져올 수 있다. (제안, 게임 수정 세션 확인 필요)

## 4. 버전과 패키징
- `jack.qsp`, 이미지, 설치기, README 중 무엇이든 내용이 바뀌면 버전을 올린다. 같은 버전으로 다시 빌드하지 않는다.
- 패키징(배포 ZIP)은 (1) 게임 수정 세션 컨펌 + (2) 사용자 게임 점검 + (3) 사용자 패키징 승인 뒤에만 한다. 컨펌된 SHA-256과 다른 `jack.qsp`로는 만들지 않는다.
- 컨펌 뒤 이미지·README만 바뀌면 `jack.qsp`가 같으므로 재컨펌 없이 버전만 올린다.

## 5. 검사
- UI 세션은 매 후보마다: `tools/qsp_verify.py`(게임 수정 세션 도구), `tests/test_installer.py`(Windows PowerShell 5.1), `tests/test_private_room.py`(후보), node가 있으면 `tests/*.cjs`.
- 게임 실행과 화면 확인은 사용자가 한다. UI 세션은 자동화하지 않는다.
