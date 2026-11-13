<!-- 통합 캐릭터 편집기 작업 중 결정과 근거 기록 -->
# 결정 기록

## 2026-11-12
- 사용자 결정: 브라우저 통합, 편집 범위 전부(외형·배경·능력치·대사집·QSP 이벤트 대사), 게임에 없는 대사는 별도 대사집 파일.
- 업로드본(`character-image-adder` 2026-11-10판)은 repo 판보다 새것이다(add_character.py·character_editor_ui.py·tool_log.py 다름, 나머지 같음). 서버는 업로드본 함수를 그대로 부른다.
- 이미지 도구 백엔드는 GUI와 분리돼 있다(`save_character_slots`, `clone_character`, `add_character`, `delete_character`, `align_core.apply_transform`). 서버에서 그대로 호출한다.
- 시험 게임 폴더: repo `assets/`(json/slaves 1,181개, content/pic/girls)를 스크래치 폴더로 복사해 쓴다. repo 원본은 쓰지 않는다.
- 게임 캐릭터 JSON에는 세계·출신·직업 ID가 없다(seed 키 164개 중 world/family/occupation은 description 문장만). 그래서 '배경·설정' 탭은 이름·나이 분류·기본 심리·처녀 여부·배경 이야기 3칸을 고친다. 세계·출신·직업 분류는 대사집 파일에 둔다(4단계).
- 고칠 수 있는 키: 게임이 읽는 seed_ 키(`game-seed-keys.json`)에서 이미지·얼굴 경로를 뺀 것. 키가 없으면 게임이 무작위로 정하므로, ×는 키를 지워 '무작위'로 되돌린다.
- 특성은 traits.json 중 묶인 키가 seed 키이고 setValue가 있는 88개만 JSON으로 고정할 수 있다. 같은 키를 쓰는 특성은 하나만 가진다.
- 저장: 바뀐 키만 반영하고 처음 저장할 때 `.bak`(이미지 도구와 같은 규칙). JSON은 이미지 도구처럼 들여쓰기 4칸으로 다시 쓴다. 안 고친 배경 문단은 원문(`<!-- #nwtx -->` 포함) 그대로 둔다.
- 서버 쓰기 요청은 JSON 형식·같은 출처(127.0.0.1/localhost)만 받는다.
