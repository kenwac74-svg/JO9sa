# 캐릭터 배경 분류 편집기 후보

`seed_world`, `seed_family`, `seed_occupation`은 분류 ID 문자열이며, `seed_background_fixed=1`은 사용자가 명시적으로 저장한 분류임을 나타냅니다. 비운 칸은 빈 문자열입니다. 대분류만 선택하면 대사집의 그룹 선택은 유지하고 게임 분류는 빈 문자열로 저장합니다. 시뮬레이터는 기존처럼 그룹 안에서 임의 선택합니다.

기존 대사집의 구체적인 선택은 읽기만으로 이전하지 않습니다. 표시된 기존 선택을 게임에 옮기는 `게임 분류로 적용` 버튼을 제공합니다. 이후 선택 변경은 자동 저장됩니다. 설명문, 능력치, 특성, 사용자 추가 키를 수정하지 않습니다.

노예 대사집 POST `/api/talkbook/<id>`는 기존 `book`, `revision`에 선택적으로 `applyBackground:true`를 받습니다. 명시적 분류 적용에서는 서버가 저장된 대사집에 배경만 합친 뒤 캐릭터 JSON과 한 번의 `_write()`로 저장합니다. 화면의 미저장 대사는 전송된 배경 전용 저장으로 덮어쓰지 않습니다. 응답은 갱신된 `revision`과 `character`를 포함합니다. 일반 대사집 저장은 JSON 분류를 새로 만들지 않습니다.

노예 revision에는 JSON, 역할 프로필, 대사집이 포함됩니다. 화면 저장을 직렬화하며 앞 응답이 뒤의 선택을 되돌리지 않습니다. 배경 저장 응답은 미저장 능력치·설명문을 담는 `st.edits`를 지우지 않습니다. 일반 필드 저장도 분류 ID를 같은 목록으로 검증하고 누락된 분류를 빈 문자열로 명시합니다.

분류의 원천 목록은 `data/background-classifications.json`입니다. 14개 세계, 57개 출신, 66개 직업 ID를 현재 배경 DB 및 초안 DB에서 중복 없이 가져왔습니다. 철자나 대소문자를 교정하지 않았습니다. 그룹 및 선택 연결은 기존 CAT/SD를 계속 사용합니다.

역할 복제는 네 메타데이터 키를 배경 섹션으로 취급합니다. 역할 프로필의 오래된 배경보다 canonical JSON 분류를 우선합니다. 기존 일반 노예 복제 백엔드는 원본 JSON 전체를 복사하므로 메타데이터도 유지합니다. 마스터의 분류는 역할 프로필에 노예 전환용으로 보관하며 마스터 QSP 시작 코드를 바꾸지 않습니다.

빌드 지문 목록은 `server.py`와 `Start-Modding-Hub.ps1`에서 같은 순서의 53개 파일입니다. 새 Python 모듈, 분류 JSON, 프런트엔드 모듈을 포함합니다. 기존 helper dashboard와 공식 HTML 내용은 후보에 복제하거나 수정하지 않았습니다.

검사 결과: 신규 Python 11개, 신규 JS 5개, 기존 master editor 회귀 11개 통과. Python/JS 문법 및 빌드 목록 순서 일치 확인. HTTP 검사는 실제 Handler를 메모리 HTTP 스트림으로 실행하며 외부 서버·게임·세이브를 열지 않습니다. sandbox의 loopback 연결 제한으로 실제 소켓 왕복 검사는 하지 않았습니다. 브라우저 육안 및 일반 게임 화면 확인은 이 후보 작업에서 하지 않았습니다.

재현 명령은 저장소 작업창 루트에서 다음과 같습니다.

```powershell
py -3 -m unittest discover -s artifacts/character-background-20261118/editor/tests -p 'test_background*.py'
node --test artifacts/character-background-20261118/editor/tests/background-metadata.test.mjs
```

후보 파일은 아직 G 드라이브에 설치하지 않았으며, 커밋·푸시를 실행하지 않았습니다. 설치 직전 `manifest.json`의 source SHA와 최신 원본을 비교해야 합니다. 분류를 게임에 적용하는 QSP 변경은 상위 작업에서 별도로 담당합니다.
