# 최종 QSP 출고검사 PASS

2026-11-05 공식 release 프로필을 새로 실행해 종료코드0과 PASS를 확인했다. 최신 WORK와 실제 포장 stage의 QSP SHA-256은 모두 `f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536`이다.

- 배포 기준 `49458e6`의 QSP SHA-256 `6cc7066736cae7fc428d58f89fbf659f06ee6feae8c710d810ee67c99467d505`에서 정확 재생했다. 기존 51개 본문 교체와 신규 `jo9_json_ko` 한 로케이션을 포함하며 재적용해도 후보 바이트가 바뀌지 않았다.
- 최종 278개 로케이션의 전체 구조·바이트 왕복·줄/주석 경계 검사 통과. 단독 줄바꿈 문제0.
- 현재 WORK 인물 JSON 1,155파일/1,155ID 검사 통과. ID 충돌·JSON 문법 오류·내부 ID 불일치0.
- 실제 WORK FastQSP 엔진의 집·새 게임 초기화·노예 편집·조수 편집·이전 캐시 갱신·하루 진행·무기점 대화·미용실 대화·전투 메뉴 진입 **9/9 완료 표식**을 확인했다. 경로별 약6.99~7.80초였다.
- 후보·기준·포장 QSP·격리 대표 상태 등 공식 입력4개의 검사 전후 해시가 같다. 원본 `24TEST.sav`도 별도 전후 해시가 같으며 WORK·Full·원본 SAV에는 쓰지 않았다.

대표 상태는 구버전 SAV 복사본의 버전 표시3값만 현행화했다. 실제 SAV UI 불러오기·CRC 호환·저장된 모든 스크립트 복원, 모든 게임 분기·전투 결과·화면 배치는 이 검사의 확인 범위가 아니다. 일반 EXE 수동 TC1~5는 `QA_MANUAL_KO.md`에 있으며 사용자 육안 확인 대기다.

근거는 `release-report.json`, `client-results.json`, `patch-replay.log`, `patch-reapply.log`와 각 경로의 작은 stderr 로그다. `reproduce.cjs`가 격리 입력과 정확 재생 패치를 다시 만든다. 진단 QSP·복제 JSON·SAV·QA 패치를 배포 ZIP에 넣지 않는다.

포장 완료 후 최소 후속 검사도 통과했다. 진단에 사용한 JSON 전체1,158파일은 WORK와 모두 같고, 포장 stage에 포함된 JSON134파일도 WORK와 모두 같다. `stage-json-verification.json`과 `json-source-manifest.json`이 근거다. 이 후속 검사에서 QSP의9경로를 중복 실행하지 않았다. 변경 없는 기준본 JSON과 패치의 합성 검사는 포장 담당자의 별도 범위다.
