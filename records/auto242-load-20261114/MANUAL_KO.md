# 자동 불러오기 코드 안내

패치: mods/2026-11-14_auto_load_compat242.json
진입: $ongload 첫 gs 'jo9_load_compat242'. 입력은 현재 세이브의 기본 정의와 보유 역할이고 일반 호출의 result는 이름·이미지 보정 건수다. path 모드는 문자열 1개를 받아 알려진 경로만 바꾼다. 음원 변환은 jo9_audio_formats에 위임하므로 해당 helper의 동작도 의존한다.

내부 임시값은 local이다. 숫자 능력치·육성 경험·재산·장비·관계·진행은 이 helper에서 쓰지 않는다. 원본 SAV를 파일로 덮어쓰지 않으며 사용자가 저장한 새 파일에 보정 결과가 남는다. 반복 호출은 새 변경 없이 끝난다.

제거 시 $ongload의 AUTO_LOAD_COMPAT242_ENTRY 블록과 추가 helper를 함께 제거해야 한다. 호출만 남기면 없는 로케이션 오류가 발생한다. 이미 갱신해 저장한 값은 helper 제거만으로 복원되지 않는다. baseline.qsp.gz는 이번 변경 직전 복구본이며 이후 작업을 덮는 용도로 사용하면 안 된다. 빌더는 미적용 baseline을 입력으로 받아야 한다.

재현: auto242-build.cjs → auto242-tests.cjs red/green → 공식 release-check.cjs. 기록의 native 결과와 original-save-proof.json, gate-report.json, archive-verification.json 참고. GUI 검증은 Start만 별도 교체한 진단 사본으로 수행했고, 실제 배포 QSP는 변형하지 않았다. 한 세이브의 복원과 174개 지정 검사는 모든 플레이 분기 전수 검증과 구분한다.
