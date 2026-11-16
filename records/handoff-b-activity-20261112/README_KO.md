# B 활동·집중 특성 4단계 모듈

2026-11-12 승인 기획을 현재 WORK A 반영본 `a4d1985c…`에서 독립 구현했다. 게임 WORK와 배포 runtime에는 쓰지 않았다. `activity.mod.json`은 16개 부분 교체와 새 location `jo9_activity_stage` 하나를 포함한다. 독립 적용 결과 해시는 `62ceea521254da2bc1ce6599c4a6094e965f7a88835343ff82c8eb9ce732bceb`다.

## 저장 필드와 단일 보유

새 영구 저장 필드는 없다. 기존 `jo9_focus`가 끈기 +1 / 산만함 -1을, 기존 `jo9_work_ethic`가 워커홀릭 +1 / 무기력함 -1을 저장한다. 상위 단계에서는 `jo9_focus=0`이다. 상위 호환 필드 `passion_comfort`는 `-jo9_work_ethic`로 유지한다. 기존 발견 플래그와 반복 subject·활동 day/count·경험치 소수 누적 필드를 재사용한다.

새 helper가 돌려주는 +1/+2/-1/-2는 파생 계산값이다. 긍정과 부정이 충돌하면 긍정을, 같은 계열에서 하위와 상위가 충돌하면 상위를 남긴다. 반복 활동이나 경험치로 자동 승급시키지 않는다. 명시적 부여는 이 우선순위를 지키며, 편집기에서 현재 단계 버튼을 다시 누르면 해제한다. `activity_repair`는 활동 필드만 접고 다른 소질·기술·고정 프로필 revision은 수정하지 않는다.

## 효과와 연결

- 끈기: 같은 업무·교육 반복 시 경험치 +10%, 내부 기분 단계 누적값 +2.
- 워커홀릭: 끈기 효과를 한 번 포함하고 하루 두 번째 업무·교육부터 내부 기분 누적값 +2. 반복과 횟수 조건이 겹치면 합계 +4. 직접 휴식·마사지 보상 절반.
- 산만함: 같은 업무·교육 반복 시 경험치와 업무 성과 -10%.
- 무기력함: 산만함 효과를 한 번 포함하고 하루 두 번째 업무·교육부터 내부 기분 누적값 -2. 직접 휴식·마사지 보상 두 배.

원래 고정 규칙 업무의 반복 보정 제외 플래그를 유지한다. 날짜가 바뀌면 기존 활동 day/count로 하루 횟수를 초기화한다. 반복 subject는 기존처럼 날짜를 넘어 유지하며 다른 업무를 하면 바뀐다. 기존 경험치 소수 누적 방식도 유지한다. 휴식의 broken 상태에 따른 free_time 기분 추가는 보존하고, 특성 배율은 별도로 적용해 해당 상태에서도 절반/두 배가 성립한다.

입구는 기존 `jo9_traits`의 `activity_*` 호출이다. 새 `activity_stage`는 4단계값, `activity_focus`는 상위가 포함한 반복 효과의 부호, 기존 `activity_sign`과 `activity_value`는 상위 단계의 기존 휴식/활동 부호를 반환한다. `jo9_traits_personality`의 activity/xp/performance/finish가 반복 효과를 적용한다. 기존 `activity_load`, discovery/reveal, JSON/고정 인물 생성 후 repair, Dohna 일회 마이그레이션의 repair, 일반 특성 편집기의 edit/set_guarded가 같은 helper를 사용한다. 특성 목록을 만들기 전에도 정규화한다.

직업별 추첨과 generate_stock 순서는 이 모듈에서 수정하지 않았다. 기존 공통 activity_generate의 work/comfort 합성과 소질 배척 규칙을 유지했다. 직업 에이전트의 최종 후처리 끝에서 `gs 'jo9_traits','activity_repair','stock'`를 호출한다. 직조공 등의 final 확률과 add 확률은 해당 모듈에서 원래 mode대로 계산한다.

현재 고정 Dohna 및 춘향 프로필의 원자료·마이그레이션 대입문은 수정하지 않았다. 실제 23인 마이그레이션과 춘향 init를 원본 실행값과 대조하여 활동 세 필드의 승인된 단일화 외의 literal numeric 필드가 같음을 확인했다. revision=1 이후에는 service를 수동 변경하고 다시 마이그레이션해도 보존됨을 확인했다.

## 표시 자료

게임 설명·특성 툴팁을 4단계 규칙으로 수정했다. 게임 편집기 네 버튼은 기존 물리 필드를 유지하며 새 단일 규칙으로 처리한다. 외부 특성 열람표는 `editor-data-edits.json`에 두 JSON 파일의 8개 description 교체를 기록했다. 기존 id/binding은 유지한다. `texts.json`은 설명 원문이다. 아직 외부 도구 원본에는 쓰지 않았다.

## 검증과 한계

- 구조·줄 끝·주석/MOD 경계: `inspectWorld` 통과, 307 locations, 왕복 동일, 줄 끝 오류 0.
- QSP WASM: 155개 사례 통과. 해당 구형 엔진에서만 FOR를 동등 LOOP로 메모리 변환했다.
- 실제 설치 FastQSP `game/engine/jack.exe`: 변환하지 않은 후보 전체 소스에서 같은 입력과 기대값의 4,303 assertions를 실행해 완료 마커 확인. `client-results.json` pass=true. 기존 게임 창은 건드리지 않았다.
- 기존/신규 25단계 쌍, 세 저장 필드 27조합, 공통 생성 18조합, 두 부여 순서의 긍정/상위 우선, 동일 반복/교대/첫 활동/두 번째 활동/날짜 변경, 소수 경험치, 고정 업무 제외, 휴식·마사지, 단일 표시, 편집기, 실제 고정 인물 보존을 포함한다.

실제 사용자 세이브 GUI 불러오기와 화면 육안은 확인하지 않았다. `jo9_room_duty`의 기존 고정 일과 전용 `activity_sign` 직접 참조와 별도 기분 수치는 이 모듈에서 바꾸지 않았다. 하녀 service_affinity 발견 경험치 메모는 사용자 보류에 따라 그대로 두며, 성공 업무→발견 흐름과 XP 필드는 추가·수정하지 않았다.

helper를 제거하면 새 activity_stage/focus 호출과 편집기 라우트가 끊기므로 이 모듈의 edits도 함께 되돌려야 한다. 저장 필드는 기존 필드이므로 별도 파일 형식 이관은 없다.

재현은 A 반영 기준본에서 `node build.cjs`로 후보를 만든 뒤 `node activity.test.cjs`와 `tools/qa/run-client-smoke.ps1 -Engine <현재 engine/jack.exe> -Plan <이 폴더/native-plan.json> -TimeoutSeconds 60`을 실행한다. 통합 후보는 `node activity.test.cjs <통합 후보.qsp>`로 동일 검사를 다시 만들 수 있다. 완료 후 재생성 가능한 QSP·설정 사본은 정리하고 핵심 스크립트·모드·검사 결과만 남겼다.
