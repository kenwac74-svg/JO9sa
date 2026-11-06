# 선택형 설치 도우미 회귀 계약

대상은 `INSTALL_HELPER.ps1 -TargetRoot <기존 설치 루트> -NonInteractive`다. 원본 도우미·실제 게임·개인 저장을 수정하지 않고, 최소 3파일 payload와 격리된 도우미 사본만 사용한다.

- 정상 설치: `game/json` 전체를 명세의 파일로 교체하고, 명세의 PNG/QSP만 덮어쓴다. 다른 그림·저장·설정·다른 폴더는 보존한다.
- 실제 엔진의 개인 설정 파일인 기존 `game/json/save_config.json`은 새 payload에 없을 때 보존한다. 그 외 옛 JSON·하위 폴더는 전체 교체 범위다.
- 기존 게임 루트는 루트 EXE 및 `game/jack.qsp`가 있어야 한다. 한글·공백 경로, 같은 도우미 재실행을 지원한다.
- ZIP을 빈 폴더에 푼 별도 소스와 이미 게임 루트에 푼 동일 소스/대상 모두 지원한다. 동일 경로의 JSON에 옛 파일이 섞여 있어도 명세 파일만 먼저 staging한 뒤 교체한다.
- 명세 고정 SHA, 상대 경로 경계, 중복/대소문자 충돌, kind, SHA 형식, 모든 payload hash를 쓰기 전에 검사한다.
- JSON 루트와 대상 경로의 junction/reparse point를 거부한다. 밖의 자료를 따라가거나 변경하지 않는다.
- 오류나 취소는 기존 파일을 보존한다. 자동 테스트는 명세/입력 오류와 배타적 파일 잠금 실패를 다루며, 실제 GUI 폴더 선택/취소는 별도 수동 확인이다.

실행 harness는 도우미의 `__MANIFEST_SHA256__` 자리만 fixture 명세 SHA로 바꾼다. 원본에 이미 고정 SHA가 있으면 명시된 상수 한 곳만 격리 사본에서 치환한다. 원본 도우미의 전체 hash도 전후 비교한다.

## 자동 사례

정상 별도 설치, 재실행, 소스=대상, 소스=대상+옛 JSON, 명세 외 파일 보존, 실행기/QSP 누락, 상대/절대/역슬래시 경로 탈출, 중복·대소문자 충돌, 잘못된 kind/hash/명세, payload 변조/누락, JSON junction, PNG 대상 부모 junction, 배타적 대상 파일 잠금.

`run-installer-tests.cjs --red-only`는 도우미가 없는 상태를 실제 실패로 기록한다. 도우미가 준비된 뒤 `--helper <원본 ps1 경로>`로 같은 계약을 실행한다.
