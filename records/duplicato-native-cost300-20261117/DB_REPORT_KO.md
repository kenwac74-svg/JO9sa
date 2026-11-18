# 듀플리카토 300스파크 마법 자료만 갱신

현재 설치된 WORK QSP `4bb19a7268634acf1ebf7f1619f68ab30b2d2f0cdc7193c5a27253e7149b1585`에서 마법 12종을 추출하고 기존 마법 추출 검사를 통과했다. 듀플리카토 에센티아는 300스파크이며 세 참가자의 행동력 1과 다른 조건 표시는 유지된다.

전체 DB 재생성은 첫 단계인 기존 `extract-traits.cjs` 77행의 흡혈귀 특성 검증에서 중단됐다. 이번 비용 변경과 무관한 생성기 문제를 수정하거나 검사를 우회하지 않았으며 전체 DB 갱신은 보류했다. 기존 `generation-failed.json`을 근거로 남긴다.

기존 `jo9-reference.html`의 내장 `reference-data.spells` JSON 값만 교체했다. 특성·아이템·전체 meta·적·MOB 자료는 깊은 비교로 동일함을 확인했고 기존 출처 해시를 그대로 보존했다. HTML의 나머지 JSON 바이트와 내장 자료 밖의 UI 코드는 그대로다. 이번 결과를 전체 자료가 새 QSP로 갱신된 것으로 표시하지 않는다.

설치 후보는 `extract-spells.cjs`, `spells.test.cjs`, `spells.json`, `jo9-reference.html` 네 파일이다. `partial-update-manifest.json`에 원래 저장소/WORK 파일 해시와 후보 해시, 보호한 구역의 출처 해시, 검사 결과를 기록했다. 개인 아이디어·runtime·게임·세이브·Full은 수정하지 않았다. 결과는 아직 로컬 후보이며 실제 DB 설치는 담당 에이전트가 원본 해시 확인 후 수행한다.
