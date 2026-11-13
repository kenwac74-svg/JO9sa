# GitHub 인계 스냅샷 · 2026-11-12

편집기 소스 기준: 53769aa9ca4ce4461f362925814b8da6e399f9db (v0.11).

- 최신 인계: [통계·배경·생성 공식](docs/JO9_Stats_Background_Generation_Handoff_20261112.md).
- 세계·출신·직업 검수 설정과 연결표: presets/.
- 통계 게임 구현은 다음 업데이트. 이번 브랜치는 독립 편집기 및 설계 자료의 인계이며 게임 반영본이 아니다.
- 실행: `start-history-lab.py`를 더블클릭한다(Python 필요. 이 PC 안에서만 보이는 서버를 띄우고 초기값 시뮬레이터를 연다. 백신 오탐이 나던 .cmd 실행기는 2026-11-11 뺐다). 직접 하려면 이 폴더에서 python3 -m http.server 7689 --directory dist 후 http://127.0.0.1:7689/.
- 기존 브라우저의 최신 편집값은 자동 포함되지 않는다. 사용자 최신 전체설정 JSON을 불러올 것.
- 본문에 남은 /workspace/sites/jo9-history-lab 경로는 원 작업 환경이다. 이 저장소에서는 tools/jo9-history-lab 아래 대응 파일을 사용한다.
- Sites 호스팅 식별 파일(.openai)은 이식하지 않았다. 게임 본체·배포 폴더·main에는 반영하지 않았다.
- 검증: node checks-background-connections.mjs, node checks-background-dialogue.mjs, node checks.mjs 등 checks-*.mjs. 원 작업에서 통과한 검사이며 실제 게임 플레이 확인과 구분한다.


## 동봉 자료 및 기준 정정

- presets/에 핸드오프 3장의 자료 6개를 모두 동봉했다(출신 계층 엑셀·활동/집중 특성 개편 문서 포함).
- 0eb1394b는 문서 작성 전 기능 기준, 53769aa는 인계 문서 추가 후 실제 소스 기준이다.
- 원 GitHub 인계 커밋은 085b0d8. 이번에는 기준 설명·참조 파일·manifest만 보강했으며 실행 코드와 게임 기능은 변경하지 않았다.
- snapshot-manifest.json은 이 묶음의 모든 파일(자기 자신 제외)의 SHA-256을 기록한다.
