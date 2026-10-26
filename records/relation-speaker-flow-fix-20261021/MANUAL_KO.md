# 인물 평가 화자·연결 수정

2026-10-21 승인 방향을 Work에 적용했다. Full·기존 ZIP·CSS·JSON·세이브는 변경하지 않았고 커밋·푸시는 보류한다.

- 적용 전 498e7fcaa2c116e382ab73ffe38549762297cce945247c2b8ad27509ba874fe0
- 적용 후 c6ba9600e78f38ae1adeb9cf5c09a53115254ec40f666e48b53b912ab3e0195e
- 262 locations 유지. interaction/#dynamic/origins_relations 본문 세 곳만 변경하고 다른 필드는 바이트 동일하다.

## 입력·출력·호출

패치 2026-10-21_relation_speaker_empathy. 기존1117/1118와 같은 평가 경로에서 실제 화자는 slave1, 평가 대상은 slave2다. 실제 화자 이름을 [이름] 헤더로 표시하고, 원문 문장의 평가 대상 이름은 보존한다. page2에서는 실제 첫 native 조각이 채택되어 대상명+콜론이 화자처럼 붙었을 때만 그 seed를 제거한다. 첫 원문 fallback 후 native가 섞인 경우에는 원문에 필요한 대상명을 그대로 둔다. 친족·고유 본문도 유지한다.

page2/4의 발화 앞에, page5/6에서는 기존 내레이션 뒤 발화 경계에 헤더를 넣는다. 기존 질문/내레이션 페이지1/3은 그대로다. 양방향 평가와 기존 interaction 진입점을 사용하며 새 UI 창이나 location은 없다.

기존 $voice_relation_continue는 이전그룹·현재그룹·직전본문·현재본문·말투 두 값에 추가된 page 인수를 받는다. 기존45개 연결은 그대로이며, 추가18문안은 world_prim/nation_neq → personal_goodtol_1/3의 검토된 실제 문장·같은 말투·page2에만 적용한다. 바뀐 문화도 문장과 원래 문화는 문장을 모두 확인한다.

부정적인 배경 평가 뒤의 연민을 ‘그래도’로 이어 기존 의미를 유지한다. ‘어쨌든’이 이미 있는 goodtol_2나 수동 문구, 다른 페이지/말투, 중간에 가족 등 다른 문장이 끼는 경우에는 새 연결을 적용하지 않는다. 색상만으로 감정 방향을 판정하지 않으며 색상 범위도 바꾸지 않았다. 모든 배경 평가를 일반적으로 자연어 생성하는 새 시스템은 아니다.

## 상태·의존성·유지보수

조각 선택 조건·관계 수치·인물 능력치·기억·대사 이력과 #txt_man 은행은 그대로다. 새 숫자 임시 플래그 jo9_relation_native_first 하나는 origins 진입과 종료에서 삭제하며 인물 저장 키·저장 변환은 없다. 동적 helper 수는 늘지 않았다.

interaction의 현재 정의 확인 조건과 $voice_relation_line 마커를 V8에서 V9로 함께 바꾼다. 기존 세이브의 이전 함수 문자열은 정상 대화 진입 시 현재 #dynamic으로 갱신된다. 원래 은행 revision과 선택/이력 함수는 유지했다. 필수 의존성은 기존 origins_relations, $voice_native_actor, $voice_relation_line/$voice_relation_continue, relation 문맥과 interaction 캐시 갱신 경로다.

주요 변경 경계는 REL9_NATIVE_FIRST, REL9_SPEAKER_PAGE2/4/5/6, REL9_CONTEXT_INIT/END, REL9_EMPATHY_CONTINUATION, REL9_CONTINUATION_PAGE이다. 헤더만 지우거나 first 플래그/seed 제거를 따로 남기면 이름이 중복되거나 원문 대상이 사라질 수 있으므로 함께 역적용한다. 마커와 검사 조건도 함께 되돌려야 오래된 캐시를 재사용하지 않는다.

## 검증·한계

수정 전 설치 FastQSP에서 잘못된 대상명 화자 표시와 연민 연결 누락을 assertion 실패로 재현했다. 후보의 기본 기능3경로, 보강된 양방향·원문/혼합 대체·이름·고유/친족·거절/격리·캐시 검사 결과는 component 기록에 있다. 초기 혼합 fixture 실패는 잘못된 bank count 키/재로드 revision 설정을 고친 검사 문제이며 제품을 바꾸지 않았다. export payload 메시지는 레이아웃 자료 수집용으로 completion-marker PASS와 구분한다.

정확 패치 재생·멱등성·QSP 왕복·중복 이름·줄 경계·주석 경계와 실제 엔진 기본9경로가 PASS다. 검사기/인물 편집기 회귀103통과·0실패·1조건부 생략이며 기존 차이 전용 검사는 이번 허용 필드와 달라 별도 exact-delta 검사로 대체했다. 정식 정적 컴파일러로 모든 동적 분기를 증명한 것은 아니다.

실제 native 출력12쌍/24페이지를 현 글꼴·CSS를 사용한 headless Edge로 측정해 표본 넘침이 없었다. 최소 하단 여유57.375px. 원래 QtFastQSP 창의 시각 검사나 가능한 모든 긴/질투 조합을 확인한 결과는 아니다. 실제 세이브 UI 로드·CRC 호환도 별도 미검증이다.

게임을 완전히 종료하고 다시 실행해야 메모리의 이전 QSP 대신 수정 파일을 읽는다. 검사한 후보와 최종 Work의 SHA를 대조했다.

## 복구·재현·공간 정리

최소 원본은 G:/somi/JO9_work_backups/relation-speaker-flow-fix-20261021/baseline-498e7fca.qsp.zip. 압축 항목의 원본 SHA를 확인한 뒤 중복 적용기 백업을 정리한다. 선언형 mods 파일을 선택 폴더에 두고 해당 기준본에 tools/apply_mods.ps1로 적용하면 후보를 재현할 수 있다.

component 테스트 생성기와 추가 검사 스크립트, layout의 native 출력 JSON/재현 스크립트, release 보고서를 남긴다. 실행 시 출력은 G:/Codex/tmp 아래에 두고 docs/QSP_RELEASE_VALIDATION.md의 공식 출고 명령을 따른다. 진단 QSP·복제 JSON·브라우저 임시자료는 검증 후 삭제하며 원본 세이브·직접 만든 자료는 삭제하지 않는다.

보존 대조 추가: 검사 전후 auto_day.sav/auto_day_end.sav 두 자동저장의 해시 변동을 관찰했다. 나머지55개 저장·CSS·Full은 동일하다. 이 작업은 원본 저장에 쓰거나 복원하지 않았고 진단 경로는 별도 임시 폴더였다. 자동저장 변동 원인을 별도 확인 없이 단정하지 않는다.
