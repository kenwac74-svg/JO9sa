# 개인실 외근 규칙 제한 - 검토용 변경 조각

`external-edits.json`은 WORK의 SHA256 `a244ee964f0aaa1ffd6f0d0696242fa0b2bf6b46841cb3b8df2ca9e7747a416a`를 기준으로 만든 정확한 12개 old/new 변경이다. 이 작업에서는 게임 QSP나 추적 소스에 반영하지 않았다. 두 로케이션 `jo9_room_duty`, `slave_stat`만 담당한다.

- 외근 duty 2/3/4 선택 시, 그리고 일일 업무 가능 판정 전에 지정된 9개 규칙을 해제한다. 기존 `duty_rules` 정리도 유지한다.
- 개인실 대상의 외근 규칙 화면에서만 해당 9개 버튼을 비활성 이미지와 `외근 지시를 받은 노예는 수행할 수 없습니다.` 툴팁으로 표시한다. 클릭 실행 코드와 href는 없다.
- 일반 노예, 내근/휴식, 나머지 6개 규칙, 기존 담당자 안내와 시설 조건, 장비 문자열을 유지한다.
- 조수 지원, 죄책감 헬퍼 수정, 저장 구조 변경은 포함하지 않는다. 원본의 일반 노예 전용 죄책감 범위가 유지된다.

`external-native.cjs`는 원래의 set/daily 코드와 규칙 UI 분기를 추출하여 설치된 FastQSP 엔진으로 검사할 진단 QSP를 만든다. UI 출력만 문자열 수집으로 대체하고 담당자 안내 헬퍼는 고정 응답으로 격리했다. 40개 설정 사례(같은 외근 재선택 포함), 20개 일일 정리 사례, 대상 0~4 및 duty 0~4/체크 0~1의 UI 50개 조합과 기존 안내/시설 분기를 검사했다. GREEN 총 1,721개 assertion이 통과했다. 기존 WORK의 RED는 설정 해제, 일일 정리, 비활성 UI의 누락 때문에 각각 실패했다.

정적 검사에서는 정확한 변경 재생, 지정된 두 본문만의 변경, 바이트 왕복, CRLF, 주석 경계를 확인했다. 실제 저장 불러오기, 전체 하루 진행, 화면 배치와 툴팁 육안 확인은 이 분리 검사 범위에 포함되지 않는다.

재현 순서: `external-native.cjs red` -> 숨김 `run-client-smoke.ps1`에 red-plan.json 전달 -> `external-build.cjs` -> `external-native.cjs green` -> 같은 runner에 green-plan.json 전달 -> `external-verify.cjs`. 모두 Node.js로 실행한다. 진단 출력은 `G:/Codex/tmp/private-rule-external-20261116`이다. 반영 후 재현할 때는 `JO9_EXTERNAL_BASELINE` 환경변수로 위 해시의 작업 직전 백업을 지정한다. 재생성 가능한 진단 QSP와 설정 사본은 결과/로그 보존 후 정리했다.
