# 관련 JSON 누락 회귀 수정 후보

실제 저장소·WORK와 부모 작업의 core/candidate 파일은 수정하지 않았다. `REGRESSION_MANIFEST.json`의 시작 해시가 그대로임을 확인했다.

원인은 공통 코어의 JSON 읽기 실패가 해당 행을 목록에서 제외하고, 공유 그룹 계산도 그 제외된 목록으로 줄어드는 데 있다. 따라서 공유 대상 하나가 깨져도 나머지 번호만 저장될 수 있었다.

- `appearance-sharing.cjs`: 읽기 실패의 번호·경로·오류를 보관한다. 쓰기용 targets/preview/apply/materialize는 현재 명시 그룹 또는 명시적으로 분리되지 않은 펠라게야 그룹 전체가 읽히는지 확인한다. 다른 그룹의 오류는 차단하지 않는다. 읽기용 resolve/describe의 기존 오류 격리는 유지한다.
- `character-image-links.cjs`: 같은 서버 인스턴스가 읽었던 일반 자동 공유 그룹을 작은 메모리 Map에 보관한다. 정책이 같을 때, 이후 관련 JSON이 깨지거나 사라져도 재조회만으로 이전 대상을 잊지 않고 저장 전에 거부한다. 명시적인 공유 정책 변경으로 분리하면 이전 관찰은 적용하지 않는다. 게임 파일·세이브 필드·정책에 추가 기록하지 않는다.

검사: 수정 전 파일로 새 회귀 6개 중 4개가 실패해 재현했다. 수정 후보로 새 회귀 6개와 기존 `pelageya-group.test.cjs` 4개가 모두 PASS(10/10)했다. 두 후보의 Node 문법 검사도 PASS. 관련 JSON 오류 시 다른 정상 JSON·연결 이력·공통 이력 생성 전 중단, 일반 공유 재조회 후 오류, 무관한 JSON 오류 허용, 명시 분리 허용, 기존 그룹 저장·역할별 이미지 연결·롤백을 확인했다. 모든 파일 쓰기는 자동 정리되는 OS 임시 fixture 안에서만 실행했다.

일반 자동 그룹의 원래 기본 경로를 아직 한 번도 읽지 않았고 명시 정책도 없는 상태에서 해당 JSON이 이미 깨져 있다면, 이전 공유 관계를 추측할 자료는 없다. 이번 메모리 관찰은 요청한 정상 읽기→관련 파일 손상→저장 순서의 회귀를 다룬다.

재현 명령: `JO9_SHARING_CORE`를 이 폴더의 `appearance-sharing.cjs`, `JO9_LINK_MODULE`을 이 폴더의 `character-image-links.cjs`로 지정하고 `node --test related-json.test.cjs ../pelageya-group.test.cjs`를 실행한다. 실제 게임 쓰기 검사는 하지 않았다.
