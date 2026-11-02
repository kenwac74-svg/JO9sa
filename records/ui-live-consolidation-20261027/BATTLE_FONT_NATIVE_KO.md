# 전투 글꼴·행간·로그 표시 native 검사

최종 후보 QSP `a48c3817…`, base.css `f96f144b…`에서 6개 경로를 실제 설치 엔진으로 검사해 모두 통과했다. `battle-font-native-results.json`에 입력 해시·실행 완료 마커·DOM 수치를 보존했다. 검사 스크립트는 `scripts/battle-font-native.cjs`다.

검사 명령:

임시 후보가 정리된 뒤에는 반영된 WORK를 명시한다.

`node scripts/battle-font-native.cjs --candidate "G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp" --game "G:/somi/Jack O Nine Tails v2.4_work/game" --out G:/Codex/tmp/ui-live-consolidation-20261027/battle-font-final-pass --minSkill 21 --minResult 22 --run`

- 원본 전투 렌더의 물리적 줄바꿈·들여쓰기를 유지한 채 실행했다. 엔진 body의 `white-space:pre-wrap`과 전투 root의 `normal`이 실제로 대조됐다.
- 원본 스틸레토 공격·오우거 공격 템플릿으로 표시 packet을 구성하고, 진단용 피해량·상태 표기를 붙였다. 전투 계산·밸런스 검사라는 뜻은 아니다.
- 일반 2인 packet 91자, 7개 긴 무기 행, 5적 packet 259자, 승리·기절 결과, 5적 승리 결과를 비교했다.
- 일반 2인/5적 및 2인 결과는 한 페이지에 들어갔다. 좁은 결과창의 5적 packet은 **3페이지**가 필요했고 모든 페이지를 검사했다.
- 모든 이야기 페이지는 `22px`, 기본 font-family 선언은 `'경기천년제목 Medium', 'Malgun Gothic', '맑은 고딕', sans-serif`였다. 명령24px·무기명21px·효과17px의 역할별 크기를 별도로 확인했다. 페이지 조작 글자는16px이다.
- 각 페이지의 `clientHeight >= scrollHeight`, 가로 경계, 실제 글자 Range 경계와 표시 상태를 확인했다. `overflow:hidden`으로 내용만 가린 경우는 통과하지 않는다.
- 각 페이지의 textContent를 합친 값이 원문 sourceText와 **엄격하게 동일**했다. 공백을 빼고 비교하는 보조 판정과 달리, 모든 원문 문자의 보존까지 확인한 것이다.
- 3페이지 사례에서 이전/다음 링크의 hit-test와 실제 DOM 이벤트로 페이지0→1→0 이동을 확인했다. 한 페이지 사례에는 페이지 조작부가 나타나지 않았다.
- 무기 7행의 마지막 항목까지 영역 안에 들어가며 클릭 대상이 됐다. 원본 보조무기 표본에 있는 이름·그림이 모두 없는0×0 빈 앵커만 표시 명령 검사에서 제외했다. 내용 있는 항목은 제외하지 않았다.
- 결과 thumb의 원래 EXEC 명령은 보존했다. 진단 DOM에서 변수 기록용 접두만 추가해 실제 클릭했고, 진단 QSP의 종료 sentinel에 도달했다. 실제 보상·퀘스트 정산은 해당 검사의 범위가 아니다.

초기 검사에서 무기 효과 글자까지21px을 요구하거나 빈 앵커에 hit-test를 요구한 부분은 실제 역할별 표기와 달라 교정했다. 결과 뒤에 추가 진단 script를 QSP `*p`로 재삽입해 재렌더하던 검사 흐름도 원래 thumb 명령을 직접 클릭하는 방법으로 바꿨다. 운영 코드에 이런 진단 변경은 들어가지 않는다.

설정 파일은 원본 UTF-16LE BOM 바이트를 그대로 복사했다. 이미지·폰트·JSON은 읽기 정션, 후보 JS는 독립 사본을 사용했다. 원본 세이브는 쓰지 않았다. 이 결과는 실제 엔진 렌더·합성 DOM 입력 회귀 검사이며, CUA로 게임 화면을 직접 눌러 완료한 수동 플레이와 구분한다.
