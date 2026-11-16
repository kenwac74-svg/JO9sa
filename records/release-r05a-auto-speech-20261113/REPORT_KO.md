# R05a 자동 말투·공주 직업 고정

사용자확정 범위를 WORK에 반영했다. 기준 7db751c87928f4f9d65f208c30834092b6e6886b83c4758dd578ed6707cff239 → bf27cb384e3c48ee166aeeb557d96314df65306d10aae6ea402e7ba72c5bf30e. 로케이션310개 중6개 변경,27편집.

## 동작·저장비용

지정8명·내부반말속성·공주출신 일반노예만 자동 전환한다. 인식3 AND (헌신3 OR 사육3 OR 두려움3)이면 존댓말, 해제 AND 응석3이면 반말, 나머지 유지. 조수도 실제 화자 배열을 갱신한다. 기존jo9_plain_tone -1/0/1을 재사용해 추가키0·전역배열0.

공주출신은family=mprincess만 해당하며 직업도mprincess로 고정한다. 유효한 생성행18개만 좁혔다. 기존로드/대화는 직업·직업설명·경매표기·work_index만 맞춘다. 기존육성/기술/특성/경험/관계/처녀상태/진행은 재계산하지 않는다. 직업만공주·야만족공주·유니크를 일반공주로 포함하지 않는다.

## 검증

- 실제설치엔진4그룹264검사 통과: 상태/경계210,실제화자16,캐시/역할/로드12,공주생성/직업26.
- 기존미구현기준 RED: 실제대화16검사중9실패. 없는update API를 호출한 다른2그룹은 완료시간초과·SAV없음으로 기록했고 정상실패검사로 계산하지 않았다.
- 첫GREEN중1건은 공주직업고정후존댓말유형이하녀의1에서공주의2로달라지는기대값오류. 검사기대값만바로잡았다.
- 독립검토가 캐시가드중복을찾았다. 실제엔진에서재현후구/신가드모두인식하도록수정. 반복시콜백문자열동일검사통과.
- 공식적용기재생·반복적용·정확역패치·구조/CRLF/바이트왕복. 변경외304로케이션본문보존.

[네이티브결과](native-green-report.json), [구조/재생](structural-proof.json), [확정명세](spec.json), [검토](review.json). 합성인물검사이며 개인SAV열기/쓰기·실제UI불러오기·전체GUI·전체릴리즈검증을대체하지않는다.

## 호출·제거·재현

[사용법](../../docs/modding/CHARACTER_SPEECH_MODE_KO.md). #dynamic의voice_impression/native_actor/plain_stored와chose_answer의직접응답7곳이실제화자update를호출한다. $ongload는cache/load,generate_stock은직업처리전princess를호출한다. jo9_background_b의18행직업후보를고정했다.

동적갱신과생성/로드연결을함께제거해야한다. 인물배열을지우지않는다. 이미공주로맞춘직업의이전값은새필드로보관하지않았으므로제거만으로복귀하지않는다.

재현스크립트voice-auto*.cjs와정확mods,기준QSPgzip을보존한다. G:/Codex/tmp/release-r05a-auto-speech-20261113에baseline.qsp.gz를풀고candidate빌더,네이티브prepare green,run-client-smoke.ps1,collect green순으로실행한다. 배포결과로보고하지않는다. 임시진단QSP/JSON/SAV는검증후정리한다.

Full/ZIP/음원/JSON/개인SAV/커밋푸시없음. 다음원래승인대기는Q04. D21은코드·리소스동결후마지막이다.
