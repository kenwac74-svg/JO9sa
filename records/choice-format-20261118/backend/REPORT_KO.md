# 선택지 서식 backend 후보

운영 파일은 수정하지 않았다. `choice-format.cjs`, `core.cjs`, `server.cjs`는 검토·병합할 후보이며 `source-fingerprints.json`에 복사 당시 소스 해시를 남겼다. `prepare-server.cjs`는 그 소스의 고유 삽입 지점을 확인해 server 후보를 재생성한다.

`POST /api/choice-format/options {selection,sceneId?,usageId?}`은 현재 페이지의 선택지를 `choices` 배열로 돌려준다. 각 항목은 `id`, 전체 원문과 QSP 해시를 포함한 `selection`, literal 내 `anchorIndex`, `label`, 현재 `style`, `sourceLine`을 가진다. 배열 페이지는 같은 배열·단계의 대입과 추가문만 모으며, scalar 조합 페이지는 현재 parts와 조건별 alternatives를 모은다. 선택한 원문에 있는 선택지는 항상 포함한다. 명시한 sceneId·usageId를 현재 탐색 문맥에 전달하고, 같은 배열을 같은 location의 여러 장면에서 사용하는 경우 선택한 사용처의 장면 범위를 유지한다. 조회는 조건이나 실행문을 실행하지 않는다. `gameLayout`은 기존 설치 레이아웃 로더를 쓰며, 읽지 못하면 선택지 목록은 유지하고 `layoutError`를 돌려준다.

`POST /api/preview {operation:'choice-format',selection:choice.selection,choiceFormat:{anchorIndex,style}}`는 기존 미리보기 형식과 `choiceFormat:{anchorIndex,label,style}`를 반환한다. style은 부분 변경이다. 생략한 속성은 그대로 두며 빈 값은 그 속성만 제거한다. 특히 기존 `1.2em`, `normal`, `rgb(...)` 값을 입력 폼이 표현하지 못하더라도 해당 속성을 제출하지 않으면 보존한다. 기존 `/api/apply`의 승인·미리보기 해시·파일 재확인·백업·최소 mods 기록·되돌리기를 재사용한다.

지원 키는 `fontFamily`, `fontSize`(6~120 px), `letterSpacing`(-10~40 px), `lineHeight`(0.5~4 배수), `paragraphGap`(-120~240 px), `color`(#RGB/#RRGGBB)다. 문단 간격은 기존 br을 유지한 아래 여백 보정이다. 기본 inline anchor에서 적용되도록, 기존 display가 없을 때만 inline-block을 넣고 `data-jo9-choice-gap-display="1"`로 소유를 기록한다. 간격을 기본값으로 되돌리면 도구가 만든 display만 제거한다. 기존 display가 있으면 그대로 둔다.

quote와 치환문을 이해하는 scanner로 anchor를 찾으며 실행문·원래 marker·내부 HTML·다른 선택지는 수정하지 않는다. CSS에서는 변경한 속성만 제거·추가하며 다른 선언의 raw 문자열을 보존한다. 기존 style이 unquoted면 안전한 double-quoted 속성으로 감싼다. `core.prepare`의 새 선택 옵션 `preserveLineEndings:true`로 원문 literal의 CRLF를 유지한다. 기본 편집 동작은 바뀌지 않는다. 이 모듈은 파일을 직접 저장하지 않는다.

검사: source 단위 9개 통과 후 사용처 지정 회귀 1개를 추가했으며 영향받는 옵션 검사 3개가 통과했다(다중 anchor, quoted >, 치환문, QSP/HTML 인용, CRLF, CSS 미지정 선언·기존 단위, unquoted 속성, nonBMP entity, page/조건별 선택지 범위, stale source, 최소 mod 정·역재생). 격리 HTTP 1개 통과(options→preview 무저장→미승인 거부→승인 apply→export 재생→바이트 동일 복원→외부 변경 충돌). 최초 sandbox의 localhost EACCES 후 승인된 격리 실행으로 통과했다. 생산 후보 3개 문법 확인. HTTP 검사 임시 폴더는 종료 시 제거했다.

현재 WORK는 읽기 전용으로 `interaction_city:24549`를 조회했다. page 9에 두 선택지(24551·24552)가 반환되며 QSP 바이트는 조회 전후 같다. 전체 파일 SHA256은 `acd6bc3c868cb8f39e89a261d3733f351c7f4fe21da87f873ab9ba914686885b`였다. 실제 게임 화면과 사용자가 선택한 임의 실행문의 동작은 이 도구 검사 범위가 아니다.

제거할 때는 choice-format 모듈·options route·preview 분기·static UI route와 UI 파일을 함께 제거한다. 이미 승인 반영한 QSP 서식은 도구 제거로 바뀌지 않으며 기존 기록의 되돌리기나 최소 mod 역변경을 사용한다. core의 optional 인자는 다른 호출자가 기본값을 사용하므로 유지해도 기본 편집에는 영향이 없다.

재현:

```powershell
node --test artifacts/choice-format-20261118/backend/choice-format.test.cjs
node --test artifacts/choice-format-20261118/backend/choice-format-api.test.cjs
```

API 검사는 OS 임시 폴더의 중립 fixture와 임시 서버만 쓴다. `loader.cjs`는 후보 모듈과 기존 의존성을 조합하는 검사 전용 파일이다.
