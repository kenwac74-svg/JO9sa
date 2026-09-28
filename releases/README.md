# UI 패치 원본 ZIP

현재 브랜치가 **JO9UIpatch**인지 확인하고, 이 폴더에서 **Add file → Upload files**를 선택합니다.

업로드할 파일은 사용자가 제공한 원본 **JO9_UI_v1_9_14_AllInOne_R2_FIX6.zip** 한 개입니다. 압축을 다시 만들거나 이름을 바꾸지 마세요.

승인한 원본: 9,073,868 bytes; SHA-256 `254dc8c5cce2c9f5442f34b6de0cdbb029893eb544c76635d76b8b2e2fc0bc82`.

해당 ZIP을 이 브랜치에 커밋하면 설정된 `Import approved FIX6 archive` 워크플로가 내부 파일을 검사·분리하고 `packages/JO9_UI_v1_9_14_AllInOne_R2_FIX6/`와 `docs/FIX6_REPOSITORY_IMPORT.json`을 같은 브랜치에 커밋합니다. 원본 ZIP은 이 폴더에 보존합니다.

SHA-256이 다르면 중단합니다. 이미 분리 저장된 파일에 별도 수정이 있으면 덮어쓰지 않습니다. 자동 작업은 게임 설치가 아니라 저장소 파일 가져오기이며, `main`과 다른 브랜치는 변경하지 않습니다. Actions가 차단되거나 실패하면 성공으로 간주하지 말고 실행 로그를 확인합니다.

이 README가 있다는 사실만으로 ZIP이나 내부 소스가 업로드되었다는 뜻은 아닙니다.
