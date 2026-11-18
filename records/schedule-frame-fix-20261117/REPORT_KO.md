# 통합 작업 일정 로딩 복구 — 2026-11-17

원인은 서버 다운이나 일정 데이터 손상이 아니라 실행 중인 대사 서버의 `frame-ancestors none`이었다. 통합 실행기가 새 Origin 환경을 설정해도 이미 떠 있던 서버를 그대로 재사용해 iframe에서 연결 거부로 표시됐다.

`tools/local-workspace/Start-JO9-Tools.ps1`은 기존 PID·폴더·포트 소유자를 검증한 뒤 `/patch-schedule` CSP가 명시된 loopback Origin들을 허용하는지 확인한다. 허용하지 않으면 검증된 자기 서버만 기존 교체 경로로 재시작한다. 읽기 실패나 다른 프로세스 소유 포트는 중지·복제하지 않고 오류를 알린다. 새 서버도 CSP를 확인한 뒤 준비 완료로 보고한다. 독립 실행에서 Origin을 지정하지 않을 때 기존 차단 기본값은 유지한다.

새 회귀13/13과 기존 실행기 회귀가 통과했다. 기존 테스트의 TCP 모형에 현재 코드가 요구하는 State=Listen만 보완했다. PS1 UTF8 BOM·CRLF·문법을 확인했다. 실제 통합 실행을 한 번 실행해 활성화했고 API200·브라우저50/50항목·공통 기록 로드를 확인했다.

일정·메모·카탈로그 상태의 파일 해시는 전후 동일하다. 게임 QSP·Full·배포물은 변경하지 않았다. 사용자 브라우저는 현재 수정된 산식·계수 화면이며 작업 일정은 왼쪽 메뉴에서 정상 열린다. 동시 seed_age 수정과 최종 HTTP 결과는 ../seed-code-fix-20261117/live-verification.json에 있다.

함수는 Get-EditorFrameOrigins, Test-EditorFramePolicy, Get-EditorState이며 반환 state.frameCompatible를 기존 시작 경로가 소비한다. 임시 런타임 판정 필드일 뿐 일정 저장 항목은 아니다. 이 검사를 제거하면 설정이 맞지 않는 서버가 다시 재사용될 수 있다. 복구본은 Start-JO9-Tools.before.ps1이며 후속 변경과 대조한 뒤 필요한 블록만 되돌린다.
