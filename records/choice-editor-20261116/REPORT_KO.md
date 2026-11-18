# 선택한 대사에 선택지 추가 — 설치 완료

2026-11-16. stage 7파일을 WORK에 설치하고, 그중 기존 소스 소유 파일 6개를 저장소에도 맞췄다. WORK 전용 통합 브리지는 해당 소유 경로를 유지했다. 기존 포트 3813 서버를 원래 인자로 숨김 재시작했고 HTTP 200을 확인했다.

## 사용 흐름

1. 기존 대사 편집에서 기준 대사를 고르고 「＋ 선택지 추가」를 펼친다.
2. 문구, 한 줄 QSP 실행문, 선택 조건을 직접 쓴다. 실행문 예: `interaction_city = 6027 & gt 'interaction_city'`. 빈 조건은 항상 표시한다. 선택지 문구는 일반 텍스트이며 기존 `<<...>>` 치환문을 사용할 수 있다.
3. 「선택지 추가 미리보기」에서 조건과 실행문을 확인하고 기존 승인 체크·반영 버튼을 사용한다. 반영 후 원래 대사가 다시 선택되므로 같은 대사에 반복 추가할 수 있다.

입력을 바꾸면 기존 미리보기와 승인이 해제된다. 대사별 세 필드 초안을 sessionStorage에 보관한다. 다른 대사로 갔다가 돌아오면 복원하며, 통합 WORKSHOP 자동 장면 감지는 현재 선택지 초안을 dirty로 취급한다. 선택지 저장 성공 시 제출한 초안만 지운다.

## 지원과 경계

- 본문 안의 독립된 문자열 대입을 지원한다. 문자열 scalar와 정적인 숫자/문자열 인덱스 배열이 대상이다. 예: `$text[2] = '대사'`, `$intro = '대사'`. 원래 literal·다른 필드·다른 location을 유지한다.
- 별도 `lhs += '<br><a data-jo9-choice="ID" href="EXEC:...">문구</a>'` 문장을 만든다. 조건이 있으면 새 문장만 `if 조건: ... end`로 감싼다. 반복 추가 순서와 앞선 조건의 독립성을 유지한다.
- `*p/*pl` 출력, 연결식, 한 줄에 다른 명령이 붙은 대입, inline-if, 동적인 배열 인덱스는 범위를 확정할 수 없다는 이유를 안내하고 변경하지 않는다. 대입 뒤 주석도 현재 범위에서는 지원하지 않는다.
- 조건은 한 줄의 표현식이다. 따옴표·괄호 균형과 따옴표 밖의 명령/블록 구분자를 검사한다. 실행문도 한 줄로 입력하며 여러 명령은 `&`로 연결한다. 목적지/명령 목록, AI 판정, 내용/가치 판단에 따른 규칙은 없다.
- 실행문의 `&`와 `"`는 HTML 속성 entity로 저장하고, 전체 HTML의 작은따옴표는 QSP literal 규칙으로 두 번 쓴다. parse → literal → EXEC decode에서 실행문이 원래 값과 일치하는 것을 검사했다. 괄호·명령 내용 자체를 다른 코드로 대체하지 않는다.
- 선택지마다 생성 코드 3줄, 조건이 있으면 5줄과 HTML 문자열이 추가된다. 새 영구 상태 변수는 없다. 게임이 해당 문자열 배열을 저장하면 추가 HTML만큼 저장 내용이 늘 수 있다.
- 스크립트의 선택지 표시/최종 줄바꿈, 임의 실행문의 의미·실제 목적지 존재·세이브 조건의 참거짓은 정적 검사로 보장하지 않는다. root가 준비하는 게임 출력기의 `data-jo9-choice=` 경로와 함께 실제 게임에서 확인해야 한다.

## 구성과 의존성

`choice-addition.cjs`의 `prepare(doc, selection, {label, actionCode, condition})`는 문서/선택 해시와 대입 범위를 검증하고 후보 raw·원래 entry·최소 edit·추가 선택지 정보를 반환한다. 파일을 직접 저장하지 않는다. core의 문자열 복원/직렬화/최소 edit, check-image-cycle-syntax의 블록 구조 검사에 의존한다. `normalize`는 입력의 구조 경계만 검사한다.

`server.cjs`의 기존 `/api/preview`에서 `operation:'choice'`일 때 prepare를 호출한다. `/api/apply`의 기존 승인·해시 충돌·백업·원자적 교체·기록·복원 경로를 재사용한다. 기존 runtime 백업과 최소 mods 내보내기 형식을 유지한다.

`choice-editor.js`는 폼, 초안, preview 요청, 승인 무효화와 `window.JO9ChoiceEditor.dirty()`를 담당한다. index의 기존 전역 `selection/key/api/invalidate/say/previewId`와 기존 render/apply 이벤트를 사용한다. 통합 `unified-workshop.js`는 기존 dirty 검사에 이 공개 함수를 더한다.

`flow.cjs`는 마커가 있는 배열 추가 선택지만 현재 페이지로 한정한다. `page-flow.cjs`는 scalar 조합식의 변수 뒤에 추가된 선택지와 직접 `$text` 결과 본문 뒤의 추가 선택지를 각각 독립 part로 노출한다. 각 링크가 다른 literal/sourceStart에 있으므로 두 결과 이동을 혼동하지 않는다.

제거할 때는 폼·script/static 라우팅·choice preview 분기·모듈·dirty 보강을 함께 되돌린다. 이미 QSP에 반영한 선택지는 편집기 파일을 제거해도 게임에 남는다. 그 QSP 변경은 기존 변경 기록의 되돌리기나 해당 최소 mod의 역변경으로 별도 복구한다. 다른 작업이 뒤따랐다면 전체 파일 백업을 무작정 덮어쓰지 않는다.

## 검사와 한계

새 backend 7개, UI VM 4개, 격리 HTTP 통합 1개, 관련 기존 회귀 26개가 통과했다(총 38개 Node 테스트). 새 기능 미구현과 scalar 직접 결과 선택지 누락, 경쟁 미리보기 응답 결함은 실패를 먼저 재현한 뒤 통과시켰다. 기존 UI 경로·이미지 지정·페이지 삽입 회귀도 확인했다.

HTTP 통합에서는 미리보기 무저장, 승인 없는 반영 거부, 백업 바이트, 반복 추가, 최소 mod 재생, 외부 변경 충돌 거부, 두 번 되돌리기의 원본 바이트 일치를 검사했다. 중립 fixture만 사용했으며 운영 QSP는 열어 쓰지 않았다. 테스트 서버는 종료했고 OS 임시 폴더를 정리했다. 네트워크 제한으로 첫 내부 HTTP 시도는 EACCES였으며 동일한 격리 검사를 허용된 권한으로 실행해 통과했다.

생산 JS 6파일과 index의 비어 있지 않은 inline JS 2개(총 8개)의 문법을 검사했다. 브라우저 육안 검사, 실제 QtWebKit 렌더링, 임의 QSP 실행문의 실제 엔진 실행은 이 하위 작업에서 수행하지 않았다.

원본/WORK 기준 해시와 설치 후보 해시는 `manifest.json`에 있다. `unified-workshop.js`는 기존 WORK 전용 파일이며 저장소에 새로 추가할 대상으로 표시하지 않았다. 나머지 기존 4파일은 조사한 source/WORK 기준 해시가 같다. 신규 2파일은 양쪽에 없었다.

## 재현

```powershell
node --test artifacts/choice-editor-20261116/choice-addition.test.cjs artifacts/choice-editor-20261116/choice-ui.test.cjs
node --test artifacts/choice-editor-20261116/choice-api.test.cjs
node --require ./artifacts/choice-editor-20261116/loader.cjs --test G:/somi/JO9sa/tools/text-workshop/addition.test.cjs G:/somi/JO9sa/tools/text-workshop/scenes.test.cjs G:/somi/JO9sa/tools/text-workshop/scalar-image.test.cjs G:/somi/JO9sa/tools/text-workshop/page-flow-multiline.test.cjs G:/somi/JO9sa/tools/text-workshop/alt-choice.test.cjs G:/somi/JO9sa/tools/text-workshop/workshop-shared-flow.test.cjs
```

`loader.cjs`는 테스트에서만 기존 의존성을 읽고 stage의 수정 모듈을 연결한다. 운영 설치에 포함하지 않는다. `prepare-stage.cjs`는 처음 복사한 원본에 한 번만 적용하는 재현용 편집 스크립트다. 이미 준비한 stage에 다시 실행하지 않는다. `finalize-stage.cjs`는 현재 stage의 문법과 해시를 기록한다.

## 설치 후 실제 화면 확인

동일 서버의 standalone 편집실에서 사용자 대사를 선택하고 「＋ 선택지 추가」의 세 입력칸을 펼쳤다. 중립 문구·실행문·조건을 입력해 실제 미리보기 결과와 승인 미체크/반영 잠금을 확인했다. 검사용 초안은 지웠고 운영 QSP 반영은 하지 않았다. 통합 iframe 로드는 확인했으나 자동화의 iframe 클릭이 실패하여 해당 클릭 검사는 standalone에서 수행했다. 네이티브 게임 실행은 별도다. 상세: browser-verification.json.
