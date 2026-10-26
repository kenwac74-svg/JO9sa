# 재현 절차

WORK와 원본 세이브는 읽기 전용 입력이다. 스크립트가 만드는 QSP·JSON·세이브는 G:/Codex/tmp/jo9-collar-runtime-20261025 안의 진단 자료다.

1. `save-load.cjs --run`으로 긴 구형 장비 속성/콜백을 담은 네 상태를 실제 SAVEGAME으로 만든다.
2. `save-load.cjs --load`로 로드용 계측 세계를 생성하고, `prepare-gui.cjs`로 시작 화면을 대기 상태로 바꾼다. `--load --run`의 OPENGAME 자동 경로는 엔진의 기존 파일 열기 연결 문제 때문에 사용하지 않는다.
3. 원래 설치 엔진으로 각 `load/*-load.qsp`를 열고, Windows Computer Use로 Game → Load (Ctrl+L), 해당 `*.sav` 절대 경로 입력, Enter를 실행한다. 원래 $ongload와 메뉴가 복원되고 native 콜백이 실행된다. 실제 메시지는 확인 버튼으로 닫고 하단 메뉴가 다시 눌리는지 본다. 완료 로그와 `*-after.sav`를 확인한다.
4. `full-day-tests.cjs --run`은 일반일과 청구일의 전체 일일 진행 Y/X 4경로를 검사한다. 기존 제어 흐름은 유지하고 카운터·스냅샷·완료 검사만 추가한다.
5. `audit.cjs`를 시작 전, `audit.cjs --verify`를 종료 후 실행한다. `collect.cjs`로 전후 숫자와 원본 보존 해시를 검증·보관한다.

진단은 CRC 무시를 사용한다. 인물 그림 등 대부분의 이미지 리소스는 복제하지 않아 시각 자료가 빈 공간으로 보일 수 있다. 이 검사는 대사 선택·메뉴 복귀·수치·파일 로드의 동작 검사이며 이미지 검사가 아니다. 기록의 SAVEGAME 파일 해시와 요약 값은 증거이며, 임시 전체 세이브는 위 스크립트와 원본 입력으로 재생성할 수 있다.
