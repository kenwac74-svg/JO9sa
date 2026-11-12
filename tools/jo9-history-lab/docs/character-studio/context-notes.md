<!-- 통합 캐릭터 편집기 작업 중 결정과 근거 기록 -->
# 결정 기록

## 2026-11-12
- 사용자 결정: 브라우저 통합, 편집 범위 전부(외형·배경·능력치·대사집·QSP 이벤트 대사), 게임에 없는 대사는 별도 대사집 파일.
- 업로드본(`character-image-adder` 2026-11-10판)은 repo 판보다 새것이다(add_character.py·character_editor_ui.py·tool_log.py 다름, 나머지 같음). 서버는 업로드본 함수를 그대로 부른다.
- 이미지 도구 백엔드는 GUI와 분리돼 있다(`save_character_slots`, `clone_character`, `add_character`, `delete_character`, `align_core.apply_transform`). 서버에서 그대로 호출한다.
- 시험 게임 폴더: repo `assets/`(json/slaves 1,181개, content/pic/girls)를 스크래치 폴더로 복사해 쓴다. repo 원본은 쓰지 않는다.
