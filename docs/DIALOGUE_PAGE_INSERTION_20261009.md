# 이벤트 중간 페이지 삽입 보완

2026-10-09 사용자 요청: 이벤트 수정에 필요한 페이지 삽입에서 페이지 번호 참조를 이유로 일괄 차단하지 않는다.

## 변경

- `$text`, `$special_image`, `$special_image_full`, `$special_action`, `$play_sound`의 이후 숫자 인덱스를 이동한다.
- `txt_count`의 고정 페이지 수, `txt`의 고정 비교 조건·이동 대상을 조정한다. 범위 비교는 기존 페이지의 판정 결과를 보존하도록 경계값을 이동한다.
- 실행 코드가 담긴 dynamic 문자열과 EXEC 링크의 페이지 이동도 조정한다. 일반 대사와 주석의 숫자는 바꾸지 않는다.
- 새 페이지는 앞 페이지의 특수 이미지를 이어받는다. 보상·소리·실행 동작은 새 페이지에 복사하지 않는다.
- 기본 도시 이벤트의 `interaction_city → interaction_result_city → interaction_screen_city` 연결을 확인해 지원한다. 배열을 재생성하는 다른 결과 처리 경로를 같은 방식으로 허용하지 않는다.
- 미리보기에 함께 조정한 연결을 표시한다. 추가 입력문도 탭의 임시 저장소에 보존한다.

## 실제 장면과 검증

`interaction_city = 100181`의 2페이지 뒤에 삽입하는 경우:

- 새 대사: 3페이지.
- 기존 3페이지 대사와 `$special_action[3]`의 집 배경 전환: 4페이지로 이동.
- `txt_count = 3`: 4로 이동.
- 새 3페이지 그림: 2페이지 그림을 사용.
- 기존 이벤트 변수 변경과 `$return_lock = 'next_day'`는 보존.

`addition.test.cjs`: 이미지·소리·실행 인덱스, 범위 비교의 기존 페이지 판정 보존, dynamic/EXEC 이동, 다른 분기 보존, 오래된 입력 거부 등 통과.

`test-dialogue-pages-real.cjs`: 현재 실제 QSP의 사본을 독립 서버에서 검색 → 미리보기 → 적용 → 내보내기 → 복원했다. 해당 장면의 3→4페이지 변경과 실행 처리 이동, 다른 QSP 필드 보존, 내보내기로 수정 재구성, 원본 바이트 복원을 확인했다. 결과: `tmp/dialogue-pages-real-test/validation.json`.

실제 게임 QSP는 설치 과정에서 수정하지 않았다. 실제 게임 엔진에서의 재생 검증은 사용자가 수행한다. 계산식으로 정해지는 페이지 연결, 조건마다 다른 배열 생성, 공용 렌더러의 특수 전용 조건 등 아직 해석하지 못하는 경우에는 분석할 구체적인 연결을 오류에 표시한다. 모든 이벤트를 지원한다고 주장하지 않는다.

설치 백업: `C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa\tools\local-workspace\runtime\dialogue-add-install\20261009_001451`.
