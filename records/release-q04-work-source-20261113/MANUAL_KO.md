# Q04 동기화·기록 감사 사용법

입력은 현재 WORK와 기존 runtime-source 원장, 원배포 Full 명세, Git의 공개3차r2 명세다. QSP bf27cb384e3c48ee166aeeb557d96314df65306d10aae6ea402e7ba72c5bf30e를 작업 전후에 대조했다.

- q04-resources.cjs scan: WORK 전체 메타데이터와 런타임 SHA를 읽어 변경 계획을 만든다. --reuse-verified-scan은 기존 전수해시와 파일크기·수정시각이 전부 같은 경우에만 재사용한다. apply는 작업 당시 source/WORK 해시를 재확인하고 소스182개·원장만 바꾼다. 기존28원본은 source-before.json.gz, 원장원본은 runtime-source-manifest.before.json.gz에 남긴다. 두 번째 apply는 기존복구파일을 덮지 않고 중단한다.
- q04-verify.cjs: 복사쌍/JSON/PNG헤더/활성ID/옛원본/36관계를 검사한다. 결과JSON을 쓰고 두 입력원장의 옛경로 분류 메타데이터를 보완한다. 게임은 수정하지 않는다.
- q04-docs.cjs resources: JSON키 차이·Girls 파일표/CSV·소스검증 보고서를 쓴다. integrate는 원장과 승인상태/인수인계를 쓰는 작업 당시 일회 실행이다. register-only는 승인 이력을 다시 추가하지 않고698행 문서를 재생성한다.
- q04-release-notes.cjs: 현재 게임/도구/Girls 감사내용을 메인 릴리즈노트에 통합하고 기록coverage를 만든다. 이미완료한 문서에 그대로 반복하면 설명이 중복될 수 있으므로 원본/차이를 대조해야 한다.

의존성은 Node.js 기본모듈, 로컬Git, 보관된 JSON/Gzip과명시한 G드라이브 경로다. 외부서비스/게임엔진/개인SAV를 사용하지 않는다. 삭제하면 이 작업의 재현수단이 없어질 뿐 게임실행코드는 바뀌지 않는다. 원복은 기록된 정확원본/경로를 검토해 개별수행하며 이번작업에서 자동삭제·복원은실행하지않았다. Full/ZIP/음원/커밋/푸시를 처리하지 않는다.

구조 검증과 실제복사는 resource-verification.json, 기록누락대조는 complete-change-register.json/record-coverage.json, 마지막검증은 final-verification.json을 따른다. 현재 배포입력은 최종동결전이며 Q05/Q06·전체출고검증이 남았다.
