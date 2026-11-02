# 조수 안개 AP 격리 native 회귀 검사

기준은 `f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97`, 검사 후보는 `e830028463ab3ca675e5e931110182883bb773e9a9403a1385d1d968114b9c98`다. 실제 설치된 `engine/jack.exe`를 숨김 진단 프로세스로 실행했다. 제품·mods·records·원본·기존 세이브는 수정하지 않았다.

## 실행

프로젝트 workspace를 현재 경로로 사용한다.

```powershell
node fog-assistant-ap-20261028/tests/red.cjs
node fog-assistant-ap-20261028/tests/run.cjs
node fog-assistant-ap-20261028/tests/run.cjs --candidate G:/Codex/tmp/jo9-fog-assistant-ap-20261028/stage/candidate.qsp
```

WORK가 이후 변경됐다면 `red.cjs`와 `run.cjs` 모두 `--baseline <f652 원본 또는 백업 QSP 경로>`를 전달한다. baseline 해시는 고정되어 다른 버전을 조용히 기준으로 사용하지 않는다. `--candidate`는 완성된 후보 QSP를 읽는 옵션이며 패치를 작성하거나 적용하지 않는다. `--keep-diagnostics`를 주면 후보 통과 뒤에도 진단 QSP를 보존한다.

진단본은 `G:/Codex/tmp/jo9-fog-assistant-ap-20261028/tests`에만 쓴다. 결과 JSON·로그·합성 SAV는 이 workspace의 `tests`에 쓴다. 실제 사용자 세이브를 읽거나 복제하지 않는다. `core.cjs`, `save-codec.cjs`, `run-client-smoke.ps1`은 기존 `G:/somi/JO9sa/tools` 도구에 의존한다.

## RED → GREEN 근거

`red.cjs`는 원래 finish→settle에서 조수4·주인공5·settled1·master helper0회를 먼저 검사하고 합성 SAV를 남긴다. 그 후 새 기대 조수3·주인공4와 다르다는 단일 실패 표식을 확인한다. `red-results.json`의 `EXPECTED_REQUIREMENT_RED`는 승인 요구가 기존 버전에 아직 없다는 뜻이며 기존 공식의 새 결함이라는 뜻이 아니다.

최종 `baseline-results.json`과 `candidate-results.json`은 각각 native **4fixture/147조건 PASS**다. 비용 행렬은 21사례/127조건이고, 실제 begin/handoff/단독 출전/AP1 진입과 최소 출구 경로 3fixture가 20조건이다. 같은 조건을 기준·후보 양쪽에서 확인했으므로 성공 fixture는 합계 8개다. RED 1건은 이 PASS 수에 넣지 않았다.

- 기본 AP5·S75: 기존 조수4/주인공5 → 후보 조수3/주인공4.
- S64·55: 조수3 유지. S54/35/20/9/0 및 AP1도 `min(g(S), AP전−2)`에 맞으며 환산 손실에 추가2를 더하지 않는다.
- 반복 settle/finish와 close 이후 조회에서 중복 비용 없음. 노예 선봉은 기존 최소1, 비승리 조수 정산은 주인공 추가 비용 없음.
- 주인공 half_action 0/1/−1, 반지, easy, cheat, 음수 AP·오베레그 조건은 **변경하지 않은 원래 master helper를 별도로 직접 실행한 결과**와 energy/half_action/strength rate/easy 소비가 같다. 실제 비용 호출은 원문 helper로 위임하는 카운터 wrapper로 횟수만 센다.
- 조수 half_action/easy/calories/stamina rate는 임의로 helper 두 번을 추가한 방식처럼 변하지 않는다. S0은 원래 부상80·표식 분기도 실행했다.
- 실제 begin→원래 패배 분기→handoff→begin 도착: 조수는 S45에 따라2, 주인공은5 유지. 적의 잔여 HP/상태는 보존된다. 이후 주인공 원래 출구 정산은 기존·후보 모두 energy1/half_action−1이며 동행 추가 helper는0회다.
- AP1 출전은 그대로 허용된다. 후보 조수−1/주인공4, 기준 조수0/주인공5다. 출전 조건을 AP2 이상으로 바꾸지 않았다.

## 원문과 진단 격리 경계

`jo9_fog_relay`의 비용·settled·begin/handoff/finish/close 본문은 실제 compiled QSP를 읽어 실행한다. 해당 로케이션의 MSG 9문장만 QA 카운터로 바꾼다. 무관한 속성 재계산·인스턴스 제거·갑옷 해제 helper는 명시적 spy다. 검사의 HP는 모두 양수이며 사망 처분을 검증했다고 주장하지 않는다. 명성은 적수0·명성80으로 격리하고 victory snapshot은 미설정 상태다. 명성·스냅샷 전반은 검증 범위가 아니다.

원래 master helper 본문은 바이트가 같은 상태로 유지하며 그 문자열에 위임한다. 비교 대조군도 같은 원문을 직접 실행한다. 실제 무기 선택·그림 출력 대신 원래 begin/handoff가 도착하는 로케이션에 QA 확인부를 둔다. 패배→handoff 조건과 출구의 combatant0 상태/비용 블록은 원문 그대로다. 전체 출구의 보상·사망·후단 치트 복구·UI 동선·실제 전투 턴은 실행 범위가 아니다. 전체 인물23묶음 동치 검사도 이번 147조건의 주장에 포함하지 않는다.

첫 시도는 절대 SAVEGAME 경로에서 완료하지 못했다. 상대 진단 SAV 경로로 바꾼 뒤 정상 완료됐다. 초기 handoff 검사는 출구의 첫 `if combatant=0`을 지나치게 넓게 추출해 무관한 갱신 팝업으로 멈췄다. `lethal_damage_received`의 유일한 본문 시작으로 경계를 좁힌 최종 실행만 PASS에 포함했다. 이 두 harness 문제를 요구 RED나 제품 회귀로 집계하지 않았다.

## 보존과 정리

매 실행 전후 WORK QSP·설치 엔진·보호 원본 QSP의 SHA256을 확인했다. 각 결과의 `protected`가 모두 동일하다. 경로는 승인된 tests 폴더로 고정하고, 후보 GREEN 뒤에는 절대 경로·링크 여부·직접 파일 목록을 확인해 **이 harness의 진단 파일만 비재귀 삭제**했다. 모르는 파일이 있으면 보존하고 정리를 중단한다. `stage/candidate.qsp`는 이 정리 대상에 포함하지 않았다.

최종 후보 JSON의 `diagnosticsCleaned=true`와 실제 tests 임시 폴더 부재를 확인했다. 합성 SAV와 로그·검사 스크립트·결과 JSON은 workspace에 남아 있다. SAVEGAME 위치와 spy/원문 경계를 바꾸면 같은 검사를 다시 실행해야 한다.
