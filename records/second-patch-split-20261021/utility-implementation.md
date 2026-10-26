# 도나 구형 JSON 정리 유틸 구현·검증

최종 파일은 utility/의 3개뿐이다. test_dona_cleanup.py와 utility-test-result.json은 내부 재현·검증 기록이며 배포 ZIP에 넣지 않는다.

- Remove-Old-Dona-Json.cmd: 사용자가 직접 실행하면 같은 폴더의 PowerShell 파일을 호출하고 결과 창을 유지한다. 관리자 권한이나 설치 과정이 필요 없다.
- Remove-Old-Dona-Json.ps1: Windows PowerShell 5.1용 UTF-8 BOM 파일이다.
- dona-json-delete-allowlist.json: runtime-delta.json의 delete_runtime_files 25행만 담았다. 스크립트에 이 파일의 SHA-256이 고정되어 있어 목록을 바꾸거나 임의 목록을 주입할 수 없다.

입력·출력: 인수 없이 실행하면 스크립트 옆 game 또는 스크립트 폴더에서 jack.qsp/json/slaves 및 정상 8877~8901 파일 25개와 그 해시를 확인한다. 찾지 못하면 실제 game 폴더를 선택하거나 경로를 입력한다. 명시적 -GameDirectory도 지원한다. -DryRun과 그 별칭 -WhatIf는 같은 전체 사전 검사를 하되 삭제하지 않는다. 완료·이미 정리됨·미리보기는 종료 코드 0, 검사 실패·취소·삭제 실패는 1이며 한국어 이유를 출력한다.

주요 구성: Resolve-Game/Safe-Path/Assert-NoReparse는 실제 루트 표식, 내부 경로, 루트·상위·대상의 정션/심볼릭 링크를 검사한다. Require-Hash는 .NET SHA-256 스트림으로 파일 내용을 확인한다. Require-Keep는 정상 번호 파일 존재와 해시를 확인한다. 25쌍 전체의 사전 검사를 통과한 뒤에만 삭제하며, 각 삭제 직전 양쪽 해시·경로를 다시 확인한다. 없는 구형 파일은 안전하게 건너뛴다. 삭제는 고정된 구형 파일에만 비재귀 Remove-Item -LiteralPath를 사용한다.

영향과 분리: 같은 번호의 원래 퀘스트 JSON과 정상 고번호 JSON을 변경하지 않는다. QSP·상태·세이브·마이그레이션·자동 실행·백업 작업은 없다. CMD를 빼면 PS1 수동 실행은 가능하지만 이중클릭 안내가 사라진다. PS1이나 해시가 고정된 JSON을 빼거나 JSON을 고치면 정리를 실행할 수 없다. 삭제 중 권한·잠금 등의 I/O 실패가 생기면 이미 삭제한 파일은 되돌리지 않고 개수를 알린다. 파일시스템 트랜잭션·동시 외부 편집 차단 기능은 없다.

검증: 최종 G: 기록 경로의 3개 파일로 Windows PowerShell 5.1 실행 시험 18/18 PASS. 실제 배포 기준 구형 25개와 Work 정상 25개의 복사본을 G:/Codex/tmp/second-patch-split-20261021/cleanup-tests에 만들었다. 삭제·멱등·부분누락·DryRun/WhatIf·구형변조·정상누락/변조·전부구형없음에서정상검증·잘못된폴더·디렉터리대상·정션3종·자동탐색2종·목록변조·불완전추출폴더거부·한글공백CMD 경로를 검사했다. 자체 생성한 시험 정션은 비재귀로 제거했다. 실제 폴더선택 대화상자의 화면 조작은 자동시험 범위 밖이다.

재현: py G:/somi/JO9sa/records/second-patch-split-20261021/test_dona_cleanup.py
결과: utility-test-result.json의 status, 18개 시험, 최종 파일 바이트수·SHA-256 참조.

