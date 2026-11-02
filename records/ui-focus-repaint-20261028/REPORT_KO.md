# D15 일반 UI 포커스·검은 잔상 — 중단 및 정리 기록

**D15는 미해결이다. 운영 QSP·엔진·CSS·JS·설정·세이브 수정은0이며, 재현·수정 완료로 판정하지 않는다.** 사용자가 10월28일 제보 해결을 우선하도록 지시하여 D15는 후순위로 중단했다.

준비된 합성 성인 프로필은 실제 도움말/특성 UI를 사용하되 날짜·교육·가격 계산 등을 격리한 진단본이다. 실제 GUI에서 잔상 변화·포커스 이동을 관찰하지 못했고, 클릭 재현도 완료하지 못했다. 준비 파일의 PREPARED_NOT_LAUNCHED 상태는 작성 당시 기록으로 원형 보존했다.

실행 경위 정정: root가 두 번 Hidden 실행했다. visible 창은 관찰되지 않았지만 두 프로세스가 종료됐거나 fixture/제품이 crash했다고 확인한 것은 아니다. 정리 전 승격 CIM과 GetProcess 교차 확인에서 root 생성 QA PID46388/27604가 정확한 WORK engine + 이번 focus-baseline.qsp 명령줄, window handle0, HasExited=false로 남아 있었다. 비승격 조회만으로 종료를 추정했던 기록을 이 사실로 정정한다. 명시 승인을 받고 executable/전체 명령줄/생성시각을 다시 대조한 뒤 이 두 PID만 종료했다. 다른 PID·사용자 게임은 중단하지 않았다. 종료 후 jack.exe 잔존0을 확인했다.

launch-stderr.txt(199바이트)와 stdout(0바이트)를 먼저 logs/로 복사하고 해시를 검증했다. stderr에는 Qt 안내, compile 안내, PNG iCCP 경고가 있으며 이것만으로 crash 원인을 확정하지 않는다. 기존 cleanup.ps1은 실행하지 않았고 실제 cleanup 예외도 발생하지 않았다. 기존 whitelist가 새 launch 로그를 허용하지 않는다는 코드 사실과 실제 예외를 혼동하지 않는다.

정리 전후 준비 원장의 보호 입력9개(QSP·엔진·GOLD SAV·원본 config·CSS3개·JS2개)와 원본 icon1개, 총10개 해시가 모두 일치했다. WORK QSP f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97, 엔진 f75032d79ecb58eeb7b969cd3f774d66b091fca38a360acdabd782e03a46c6e6을 유지했다. 개인/원본 SAV를 게임에 불러오거나 저장하지 않았다.

절대 경계 G:/Codex/tmp/jo9-ui-focus-repaint-20261028/baseline에서 재파스한 진단 QSP(76,998,658바이트), 생성 config/ini/icon/SVG 총5파일 77,047,037바이트를 제거했다. content/css/fonts/json 정션4개는 대상 일치·reparse 속성을 확인한 뒤 링크 자체만 비재귀 제거했다. 원본 대상 디렉터리를 따라 삭제하지 않았다. save는 일반 빈 폴더임을 확인하고 비재귀 제거했다. 알 수 없는 생성물·SAV는 없었다.

보존: source/에 원래 PLAN·README·prepare.cjs·prepared.json·cleanup.ps1, logs/에 두 launch 로그, fixture-settings/에 작은 재현용 config/ini/SVG, process 전후·해시 원장·정리 스크립트/결과를 남겼다. 기존 임시 baseline에는 두 raw launch 로그만 그대로 남아 있다(총199바이트). 대형 QSP·게임 복제본·정션은 남아 있지 않다. 원래 prepare.cjs는 기존 baseline 덮어쓰기를 거부하므로, 재개 시 이 보존 로그 상태를 먼저 확인해야 한다.

실행 근거는 qa-process-before/after.json, pre-cleanup-manifest.json, cleanup-result.json이다. 새 게임 실행·빌드·패치·배포를 추가하지 않았다.
