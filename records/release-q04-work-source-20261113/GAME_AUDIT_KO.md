# 2.4.2 Full · 게임 동작 변경 이력 감사

2026-11-13. 게임/JSON/리소스/개인SAV/Full/음원/Git은 수정하지 않았다. 원고를 재생성하지 않고 기능 사실을 대조했으며 이 폴더에 감사 결과 두 파일만 작성했다.

공개 기준은 2.4.1 3차r2 `46e972bf…` / commit `1c3f76dd…`다. 현재 WORK·추적 QSP·원장은 모두 `bf27cb384e3c48ee166aeeb557d96314df65306d10aae6ea402e7ba72c5bf30e`,310개 로케이션이다.

게임99행·후속46기록·승인15건을 대조했다. 11월8일 이후133개 mods/860편집은 현재 대상부재0건이다. 정확 새 문자열은729편집에 남아 있다. 나머지는 후속치환/삽입·과거계보를 봐야 하며 기능누락131건이라는 뜻이 아니다. 기록 Markdown 156개와 인계4개를 대조했다. 집계는 서로 겹치며 신규기능수가 아니다.

## 우선 보완할 릴리즈노트

- **F01 발견 G01~G04는 반영 전 역사로 표시 필요**: release-data.findings의 현재미수정/실행검증없음은 R02/R03-1~10/R04/R05/R05a로 대체됐다. 원문은 보존하되 최초입력2ad5be48과 resolvedBy를 붙인다.
- **F02 R03 세 고객 실제조건 본문 보완**: 아르테미아외모5/기술4·5/특성1, 레시체력4·감수성1~3·인지도0, 키키모라외모4·선호4·5·young형전용은 후속부록에 있으나 본문 도시/의뢰 기능문단에 빠졌다.
- **F03 복합9건·일반제외·특별보상예외 명시**: R04 부록/체크행을 메인 기능목록에 올려 문의후등록·납품가능/대기·단순전공/등급제외·직접고지특별보상기존목표유지·글로리아납품제외를 명시한다.
- **F04 자동말투·공주직업 현재규칙 명시**: R05/R05a 부록의 지정8명/내부속성/일반공주출신 범위·인식3AND관계3·응석3복귀·현재유지·공주직업고정을 본문에 추가한다. 과거 자동조건미정/추가안함은 역사표시한다.
- **F05 춘향 최종회복·하드·CM·클럽한도**: 연고HP/STA완전회복·사기+20·고통0·임계60/90/60·3개/하드6개, 인물6회·영입대기·CM비용/사망경계·보스처분대상제외가 본문에서 생략됐다.
- **F06 마녀 첫입장 정확조건/기존진행 예외**: 귀족+베네라/펠라게야일반의뢰완료와 이미방문/특별의뢰14·15/혁명진행 예외를 본문에 명시한다.
- **F07 도나 실제존재확인·기존1회보강 범위**: 복제11명도 쿨라히토카리3000실제영입경로·23명생성경로 확인,30보유칸/캐릭터별1회·높은육성값보존을 보완한다. 전체GUI호환완료로 확대하지 않는다.
- **F08 최초99행 중간/대체 이력**: H023/24 임시테스트는H043제거, H07260일은30일, H018은인라인후속대체, H096은공개기준포함. H097BGM미구현은거주지재생완료와월정산/창관보류로분리한다.
- **F09 Claude 개인실/10일장부 기능 구체화**: 개인실수입당일지급·장부중복없음·현물현금분리, 실제업무일칼로리·특별식5일, 외근가사중복방지·하드환급을 요약기능사실로 보완할 수 있다.
- **F10 현재최종 전체회귀/출고는 미실행**: 기존PASS는 각시점/합성계측 범위다. 이번은 현재해시·대상/문자열정적대조만새로수행. 개인SAV/GUI/청감·최종Full/ZIP·전체출고PASS는없다.
- **F11 조사·보류를 기능완료로 세지 않음**: 지팡이조건조사·청소컷재사용확인·워커홀릭주석정정은 새보상/확률기능이아니다. D15해결·실제클럽/창관운영·월정산·상위드랍·C개발·D21호환완료를완성목록에넣지않는다.

## 기능별 전후·현재상태·커버리지

기존장부에 이미 있는 항목도 포함했다. partial은 원장/후속부록에는 있지만 메인노트에 조건이 생략된 경우다.

### G01 조수 일일 헌신·연금 담당

- 이전: 메인 노예 밤규칙 수를 조수 헌신에 사용하고 연금 담당 지정만으로 업무를 셀 수 있었다.
- 현재: 조수 자신의 실제 유효 업무로 보통2/하드3 기준 판정한다. 연금술은 그날 조수가 조제에 성공한 경우만 업무1개, 실패는 제외한다. 해제 안내도 실제 담당 전환과 맞췄다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / H002~H004
- 근거: [2026-11-08_assistant_daily_devotion.json](<G:/somi/JO9sa/mods/2026-11-08_assistant_daily_devotion.json>) · [2026-11-08_assistant_alchemy_brewed_day.json](<G:/somi/JO9sa/mods/2026-11-08_assistant_alchemy_brewed_day.json>) · [ASSISTANT_DEVOTION_DECISION_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/ASSISTANT_DEVOTION_DECISION_KO.md>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### G02 특별 고객 목표·두막 반복 보상

- 이전: 특별고객 일부 요구/목표 기록과 반복 보상 감액이 없었다.
- 현재: 특별고객85건 정리+11건 추가로96건, 강조 없는11건 요구·보상 요약과 잘못된 HTML/목표 주석을 보완했다. 두막 반복 납품 보상10% 누적 감액. 반복구매자9건 목표는 R04와 구분한다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / H010, H036~H038, H066~H068
- 근거: [2026-11-08_special_client_journal.json](<G:/somi/JO9sa/mods/2026-11-08_special_client_journal.json>) · [2026-11-08_dumak_reward_decay.json](<G:/somi/JO9sa/mods/2026-11-08_dumak_reward_decay.json>) · [REPORT_KO.md](<G:/somi/JO9sa/records/goal-summary-20261108/REPORT_KO.md>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### G03 글로리아 후임·영입·담당자 교대

- 이전: 후임 납품·가격별 영입·담당자 교대가 없거나 중간 구현이었다.
- 현재: 첫 A이상 비서 납품의 후임 정보, 1만/5천/2500 가격별 영입·초기상태와 후임인사, 모든 결말 뒤 부동산 담당자 교대를 연결했다. 결과그림·복장/장신구와 선택지 표시도 연결했다. 임시 테스트 버튼은11/9 제거됐고 최종대기는 G04의30일이다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / H013~H031, H040~H043, H071~H075
- 근거: [2026-11-08_gloria_quest_stage1.json](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_stage1.json>) · [2026-11-08_gloria_quest_stage2.json](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_stage2.json>) · [2026-11-09_gloria_test_cheat_removed.json](<G:/somi/JO9sa/mods/2026-11-09_gloria_test_cheat_removed.json>) · [GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### G04 글로리아30일·소문 동기화

- 이전: 납품 후 대기는60일이고 관련 소문에는 같은 날짜 기준이 없었다.
- 현재: 납품일로부터30일로 통일한다. 영입은 후임기록·미종료·주노예빈칸·기존상담조건을 요구한다. 소문은 후임기록과30일을 요구하되 주노예가 있어도 들을 수 있다. 알려진 옛60일 메뉴 캐시만 보정한다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / H072 후속대체, postSnapshot:글로리아30일
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/gloria-delay30-20261112/REPORT_KO.md>)
- 검증한계: 기존145사례는 실제 조건블록/캐시 검사다. 전체 소문상담·비용·GUI로드는 미검증.

### G05 소문 대상·요금·대사창

- 이전: 소문 대상·일반구매자 안내·요금·표시가 기존 방식이었다.
- 현재: 현재 노예의 의뢰43건 충족 안내, 주인공 전공 질문·NPC말투·길드추천을 맞췄다. 소문값은 항상 지불하며 메타 안내를 제거하고 하단 대사창 페이지로 표시한다. 글로리아 소문은 G04가 최종이다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / H046~H051
- 근거: [2026-11-09_rumor_current_slave_ask.json](<G:/somi/JO9sa/mods/2026-11-09_rumor_current_slave_ask.json>) · [2026-11-09_rumor_quest_clients.json](<G:/somi/JO9sa/mods/2026-11-09_rumor_quest_clients.json>) · [2026-11-09_rumor_fee_always_no_meta.json](<G:/somi/JO9sa/mods/2026-11-09_rumor_fee_always_no_meta.json>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### G06 춘향 클럽30일 승계·영입·소유권

- 이전: 에게야 이후 춘향 클럽/보스/영입이 기획 상태였다.
- 현재: 에게야 영입일30일 뒤 춘향 운영. 구세이브는 과거일을 추정하지 않고 첫 상태확인일부터 센다. 일반전은 인물별 최대6회, 승패 모두 실제출전에서 센다. 결투승리 즉시 클럽 소유, 주노예빈칸이면 영입하고 차 있으면 영입약속을 보존한다. 소유후 폐쇄/지배인필요 안내이며 실제 지배인 배치·재개장은 미구현이다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / postSnapshot:춘향 클럽 승계·보스·영입·소유권
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-club-20261112/REPORT_KO.md>)
- 검증한계: 기존20경로103단언·합성저장 근거. GUI/개인SAV/장시간승률 미검증.

### G07 춘향 보스 최종 회복·하드

- 이전: 고정 보스 자원·연고AI가 없었다.
- 현재: 보스HP200/STA300/사기200/기본피해15, 힘5·전투6 기준. 사기피해 차단·화염/냉기+5, 기타지정저항0. HP≤60 또는STA≤90 또는사기≤60에서 연고로 HP200·STA300 완전회복·사기+20·고통0. 쉬움/보통3개·게임중하드6개이며 공격 대신 한 행동, 죽은 뒤 부활하지 않는다. 영입인물 산도 배율을 고정 보스에 다시 곱하지 않는다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / postSnapshot:춘향 클럽, postSnapshot:무작위 일섬
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-club-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-random-finish-20261113/REPORT_KO.md>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### G08 춘향 최종 일섬·유수보·조소

- 이전: 최초는70%미만 시작강제패배·70~100% 확률일섬·100%초과 면제였다.
- 현재: 시작강제패배 제거. 모든 능력에서5~10소모턴 무작위일섬을 회피자세만 막는다. 일반공격3종 속도상성으로 회피상대 수정자+1. 일섬/연고/일반공격 단일행동.70%미만은6강화99턴·조소배지·시작문구. 유수보는 기존70~100%의110−R확률·공격1회무효·6디버프해제 유지.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:춘향 무작위 일섬·회피 상성·조소
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-random-finish-20261113/REPORT_KO.md>)
- 검증한계: 기존 실제엔진184검사. 현재7편집 정확잔존. 실제 배지/툴팁 시각검사·전투도중 저장캐시 모든조합 미검증.

### G09 춘향 CM·무적치트·일반전 처형/석방

- 이전: 일섬이 피해배율치트를 우회하고 새 일반상대3종의 처분선택이 빠졌다.
- 현재: 일섬은 기존 cheat_fight_dif를 적용, HP0일 때만 패배한다. 보스패배 CM≤−10 사망/−10초과~0 20만/0초과~10 10만/10초과~20 5만/20초과0, 승리차감0·정산1회. 새 일반전3종에 기존 처형/석방·CM·상금·승수 정산을 복구했다. 춘향 보스는 이 처분대상이 아니다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / postSnapshot:하단프레임·처분·무적호환
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-combat-fixes-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-club-20261112/REPORT_KO.md>)
- 검증한계: 기존56단언의 즉사 뒤 CM전체 재실행은 없으며 CM경계는 기존 클럽103단언 근거. 전체실전/개인SAV 미검증.

### G10 춘향 메뉴·장면·하단 프레임

- 이전: 따옴표 중첩으로 춘향7메뉴주소가 끊기고 마지막글자가 하단선에 붙었다.
- 현재: 대화/결투/출전/조건/공급/영입/대기 실제HTML주소 수정, 전용배경·장면문구·안내중복방지 연결. 원래18px프레임을9px표시,5대사화면 텍스트높이185→165px·여백8px·스크롤. 이미지픽셀 변경과 구분한다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:춘향 메뉴·장면, postSnapshot:하단프레임
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-menu-links-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-combat-fixes-20261112/REPORT_KO.md>)
- 검증한계: 실제HTML명령 엔진실행·별도1280×800렌더 근거. 사용자게임창 미확인.

### G11 춘향 프로필·산도·챔피언·초기관계

- 이전: 프로필·산도·최고경력·인식/헌신 초기값이 없거나 제안이었다.
- 현재: 승인프로필/배경·산도자원×6/5·숨김양성애자·아레나경력최소9. 새3040은인식3/단계0·헌신0/단계0. 기존 육성/기술은 초기화하지 않고 기존춘향에는 산도/최소경력만 갱신한다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:춘향 전체프로필, postSnapshot:초기인식헌신
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-profile-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-initial-attitude-20261112/REPORT_KO.md>)
- 검증한계: 기존209+9단언. 프로필보고서의 보스미구현은 이후 G06으로 대체. GUI/개인SAV 미검증.

### G12 엘자·춘향 지정특성

- 이전: 엘자 절세미인 고정과 춘향 특성이 확정 설정과 달랐다.
- 현재: 엘자 기본미모5·절세미인1회제거·성기사, 춘향 기본미모5·절세미인·광전사, 에게야 역전의용사 유지. 인물revision1로 이후 일반획득/편집을 반복 덮지 않는다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:엘자·춘향 지정특성
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/unique-traits-20261112/REPORT_KO.md>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### G13 도나도나 배경·능력·실제 등장

- 이전: 23명의 소개자리표시자/일괄초기능력과 안테나분류 누락이 있었다.
- 현재: 8877~8899 배경69필드와 안테나 누락3필드·고유분류를 맞췄다.23명 검토·20JSON144필드 일반능력/성격/직업적성 조정, 적합3명 유지. 복제11명도 쿨라 히토카리3000스파크 실제영입경로가 있고23명 모두 직접생성경로가 있다. 이름/이미지/나이/구매조건 보존.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / postSnapshot:도나23배경, postSnapshot:초기능력등장코드
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/dohna-stories-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/dohna-stats-20261112/REPORT_KO.md>) · [APPEARANCE_ROUTES_KO.md](<G:/somi/JO9sa/records/dohna-stats-20261112/APPEARANCE_ROUTES_KO.md>)
- 검증한계: 배경420·능력/메뉴424단언. 합성자동로드 실험 미완료·개인SAV/GUI/장기밸런스 미검증.

### G14 도나도나 특성seed·후속3명

- 이전: 14기존jo9_* seed 전달 누락과 포르노/조커/슈코 요청의 중간 미반영상태가 있었다.
- 현재: 22JSON155필드와14기존seed키 복사연결. 메디코의료S·린외모5/반항심·리리에은둔형·쿄카운동광/투사 등 반영. 사용자성인설정확인 후 포르노 지정특성/9기술·명기잠재, 조커양성애자, 슈코색정광도 반영. 잠재명기는 기존실제행동 발견·1회효과를 사용한다.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:지정특성, postSnapshot:3명후속프리셋
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/dohna-traits-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/dohna-adult-presets-20261112/REPORT_KO.md>)
- 검증한계: 기존348+93단언. 옛 미적용 설명은 역사. 나이범주·외형·이야기 보존.

### G15 기존도나 보유인물1회보강

- 이전: 신규프리셋만 바뀌고 기존보유23명은 갱신되지 않았다.
- 현재: 30보유칸의 생존8877~8899를 ID로 찾아 인물revision1로 한 번만 갱신. 능력/기술은max(현재,새기준), 지정특성과 필수충돌정리 반영. 높은육성·이름·장비·관계·소유일·헌신·진행·현재자원 보존. stock/사망/빈칸 제외.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:기존영입1회갱신
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/dohna-owned-migration-20261112/REPORT_KO.md>)
- 검증한계: 1182단언·합성SAV저장. 전체OPENGAME 실험 실패는 통과아님. 개인SAV의GUI로드/장기플레이 미검증.

### G16 PR17 A 대상장악력·악명

- 이전: 타인경로에서 메인값을 섞어 장악력을 계산하고 악명반점 경로가 빠졌다.
- 현재: 대상별 기존수식·구타와악명−10/−20/−30/−40의1/2/3/4중큰값을 사용. 고문상한/야간장비/steel_leash/표시·저장계산캐시 보완. 순찰성기사단처형·감방구출 각악명−0.5, 공식경기 처형−1/석방+1 등 유지.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:PR17 A
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/handoff-a-work-20261112/REPORT_KO.md>)
- 검증한계: 126검사. 감방전체소유권전환/전체밤넘기기·개인SAV/GUI 미검증. PR전체병합과 구분.

### G17 PR17 B 배경·생성·성장·활동단계

- 이전: 세계/출신/직업책임과 활동/집중 단계형이 기존규칙이었다.
- 현재: 배경152교체+세계1/출신3/직업7추가, 로마풍이름24·독립동향. 기존세계비중+로마1칸·허용후보균등·연령교집합·빈후보실패. 새일반인물 초기능력=세계, 성장=57출신, 기술/특성=31직업73규칙. 도둑체력C·운동선수B예외. 활동4특성단일보유·긍정우선/동계상위·하위효과포함·자동승급없음, 소수누적3+새일반표식1만추가. 기존고정/플레이진행 보존.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:PR17 B, 활동단계미반영감사는후속대체
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-combined-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-background-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-occupation-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-activity-20261112/README_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-origin-growth-20261112/REPORT_KO.md>)
- 검증한계: 개별배경3870·직업197·활동4303·성장1736/통합4729검사. 전체개인SAV/GUI/장기플레이 미검증. 세련됨추첨·하녀발견메모·C차기 제외.

### G18 하드 속성 단계공개

- 이전: 하드에서도 일부속성정보가 즉시표시됐다.
- 현재: 외모/독특함/체형/세련됨/인지도/기분 즉시, 체력/성격/지성 소유10일, 감수성/태도/자아20일. 레벨리오 우선·끝나면소유기간기준.14본문84출력/툴팁만변경, 실제수치/계산 유지.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:하드단계공개
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/hard-attribute-visibility-20261112/REPORT_KO.md>)
- 검증한계: 1275단언은 실제출력식/조건검사.14장면 실제GUI/개인SAV 미검증.

### G19 희망발견·특성상충

- 이전: 희망대사로 적성을 밝혀도 목록에 공개하지 않고 마법적성에 잘못된 대사를 연결했다.
- 현재: 본 페이지의14보유적성 공개·목록갱신, 마법/물약기존대사 복구, 확정특성희망7문구·성향발견 연결. 없는특성부여 없음. 구강중독/구역질반사 생성각10%겹침없는추첨·추가부여양방향차단·기존동시보유는중독유지/반사0정리.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / H035, postSnapshot:희망발견/확정대사
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/wish-discovery-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/wish-approved-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/constitution-hint-20261111/REPORT_KO.md>) · [2026-11-08_oral_gag_exclusion.json](<G:/somi/JO9sa/mods/2026-11-08_oral_gag_exclusion.json>)
- 검증한계: 430시나리오의voice/목록렌더는대역. 충돌처리후속확인은정적. GUI/개인SAV미검증.

### G20 조수애무취소·교육대상

- 이전: 애무뒤로/취소href가깨지고유두메뉴의그림·가슴/기술을주노예에서읽었다.
- 현재: 뒤로20/취소0실제HTML명령 수정, 그림배우·진입크기·표시기술을조수로맞춤. 기준3·조건·비용·교육결과 보존.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:조수교육UI
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/assistant-training-ui-20261112/REPORT_KO.md>)
- 검증한계: 링크2경로/이미지메뉴25사례. 이미지풀대역이라PNG품질미확인. interaction교육효과잔여참조는별도미수정조사후보.

### G21 가임성·쿨라·체질·장비문구

- 이전: 가임체질과시기를혼동하고임신140을만삭/열흘출산으로안내하며장비효과설명이부정확했다.
- 현재: 가임체질/미확인·평상시/실배란·산란형체질 구분. 쿨라임신140은중기로안내. 체질개선실제효과·주인공장비15종의기술/자원/회복/유물효과 명확화. 문구에맞추어수치/조건/효과를바꾸지않음.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:가임성/쿨라, postSnapshot:장비설명
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/fertility-kula-wording-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/constitution-hint-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/equipment-descriptions-20261111/REPORT_KO.md>)
- 검증한계: 저위험문구수정 구조/정확역치환검사. 전체엔진생략·실제툴팁/줄바꿈미확인.

### G22 Claude 개인실업무·10일장부

- 이전: 업무/보상/가사분담·개인실수입/현물보고가부족했다.
- 현재: 방별1업무와일일재검사, 가사우선순위·외근요리/청소중복제외·보상/공로/보고컷 연결. 안개수확뒤부상을함께보고하고밤회복뒤부상유지. 길거리초대박기존17용품.10일장부는지출/수입/현물/결산, 개인실수입당일지급·장부중복없음·현물현금분리/누적초기화. 워커홀릭은행복분기이며성과등급보장아님.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / H039, H055, H057, H060~H065, H076~H091, H098, H099
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>) · [CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/workaholic-comment-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/chores-clean-reuse-20261111/REPORT_KO.md>)
- 검증한계: 사용자11/10동작확인보고는있으나항목별상세미수신. 후속안개문구/장비배율·모든하루종료분기는정적근거.

### G23 개인실인테리어·식단·하드환급

- 이전: 단계효과·업무칼로리/체형관리식단이없고하드증축환급이일반금액이었다.
- 현재: 방별베이직/스탠다드1000/퀄리티2500/럭셔리5000·상위설치·밤효과·처분50%·하드비용1.5배. 업무실행일칼로리집안2/외근3/안개4·일반식요리등급·특별식5일후체형관리·식재료추가2소비. 하드증축환급총6600(일반4400)으로수정.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / H063, H087, H092~H095
- 근거: [2026-11-10_private_room_interior.json](<G:/somi/JO9sa/mods/2026-11-10_private_room_interior.json>) · [2026-11-10_private_room_tier_effects.json](<G:/somi/JO9sa/mods/2026-11-10_private_room_tier_effects.json>) · [2026-11-10_private_room_diet.json](<G:/somi/JO9sa/mods/2026-11-10_private_room_diet.json>) · [REPORT_KO.md](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)
- 검증한계: 후반인테리어/식단당시구조·정적근거. 안정성8네이티브분기와원출고7/9상태를전체PASS로확대하지않음.

### G24 개인실원래행동메뉴·빈방배경

- 이전: 우회콜백이메뉴16을허용하지않고대상을미리해제했으며jo9_interior주석따옴표가배경반환을삼켰다.
- 현재: 방1~4버튼/옛콜백을원래행동메뉴·비용/효과로연결하고같은방복귀/주노예복원·방인물결과이력저장. 행동가능·에너지>−4검사. 주석수정으로네등급정상배경/HTML, 미설정0베이직·기존등급보존.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:개인실메뉴, postSnapshot:빈방배경
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/private-sex-menu-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/private-room-bg-audit-20261112/REPORT_KO.md>)
- 검증한계: 8연결/36버튼/28흐름 및배경24단언. 미니게임중간합성종료·다인전체결과/GUI미검증. 11/10인계무료행동설명은최종비용규칙아님.

### G25 마녀모임 정확첫입장조건

- 이전: 순정/WORK모두무조건입장이며최근조건제거증거는없었다.
- 현재: 귀족+베네라·펠라게야일반의뢰완료 모두요구. 회색/툴팁·실제진입·옛캐시동일조건. 이미방문/특별의뢰14·15진행/혁명완료는기존입장유지. 선행순환하는특별퀘완료를첫입장요구로삼지않음.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / postSnapshot:마녀첫입장
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/witch-coven-entry-audit-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/witch-coven-gate-20261111/REPORT_KO.md>)
- 검증한계: 144상태·진입576건. 최종화면이동은진단반환대역·GUI미검증.

### G26 하드적특수기·방어수치

- 이전: 24종30특수기가하드AI에서선택되지않고지정방어수치가없었다.
- 현재: 하드에서일반공격+미사용특수기균등선택·적별슬롯1회·새전투만초기화. 하드누락AI/자기강화대상보완. 엘자관통/참격−10·타격/화염/냉기−5·정신+10, 포털가디언사기피해차단. 쉬움/보통선택유지.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / postSnapshot:하드특수기, postSnapshot:엘자/가디언
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/hard-enemy-specials-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/enemy-balance-20261111/REPORT_KO.md>)
- 검증한계: 특수기923·방어23행동단언. 보조SAV복원은CRC우회/빈onload라실제GUI호환과다름.

### G27 슐랴프킨·하사VIP·랠리

- 이전: 조수rating오염·하사보상VIP미연결·반복랠리배당/정산중복문제가있었다.
- 현재: 캐롤라인납품직전본인등급재계산. 하사완료는기존평판/콘스탄틴자격대안으로VIP열림·보유금200/기존서비스비용유지. 랠리참가100·우승순이익1~3회300/4회275/이후25씩감소/10회이상125, 실제참가만인물횟수증가·결과중복차단·과거횟수추정없음.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / postSnapshot:슐랴프킨, postSnapshot:하사VIP, postSnapshot:랠리
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/shlyapkin-rating-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/hassa-vip-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/rally-payout-20261111/REPORT_KO.md>)
- 검증한계: 468등급조합은계산대역·하사120조건메뉴대역·랠리185시나리오는난수/일부부수효과대역. GUI미검증.

### G28 젖소코스튬

- 이전: 기존특수젖소녀장비와구분되는일상의상이없었다.
- 현재: 벼룩시장일상복25스파크·중복회색, 독특함+1/일일사육+1/교육+2/세련됨보정−1. 지성/태도감소·부정무들렛/거부없음. 기존cow그림공유·고급훈련cow_gear요구유지.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / postSnapshot:젖소코스튬
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/cow-costume-20261111/REPORT_KO.md>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### G29 사운드실행·형식·중복방지

- 이전: 채택목록/파일과실제PLAY가분리되어둔기·가르시드외연결누락이었다.
- 현재: 전투5종/몬스터18종·유효처형/석방·최종승패·기존치명타/둔기·가르시드실제호출. 새전투등장1회·이어하기/로드/재표시재시작없음·중복처분클릭차단·도주패배음제외. 음악MP3/효과WAV·옛경로갱신, 업무/장부3종WAV연결.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / H001, H005, H012, H056, H061
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/sfx-hooks-20261108/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/audio-format-normalize-20261108/REPORT_KO.md>)
- 검증한계: 실제PLAY경로/음량·음소거근거. 청감·전체루프/모든전투실플레이완료아님. 음원바이너리는다른감사범위.

### G30 거주지/명성BGM·게임오버화면한정

- 이전: 방문/설정누락곡선택·목록부재·게임오버음향범위문제가있었다.
- 현재: 거주지기본곡(귀족/평판5우선)+명성4이상지역곡정해진순서·중복없이순환. 화면/설정재표시현재곡/시각유지, 집기분/전투/이벤트우선·도시복귀는중단곡처음부터. 게임오버곡/효과음은해당화면만, 이탈/로드옛토큰무효화.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / H011, H097BGM후속대체, postSnapshot:거주지BGM
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/residence-bgm-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/city-settings-bgm-20261111/REPORT_KO.md>) · [2026-11-08_gameover_audio_screen_only.json](<G:/somi/JO9sa/mods/2026-11-08_gameover_audio_screen_only.json>)
- 검증한계: JS9/9·설치엔진3탐침·설정120조건. 실제긴MP3청취/전체이벤트/개인SAVUI미검증.

### G31 단축키·중요경고·표기·그림조회

- 이전: 단축키/중요경고/표기·일부그림조회연결이부족했다.
- 현재: 상태/지역/H귀가/좌우페이지키, 조용히규칙중중요경고항상출력, 고기이름/재고/설명통일. 글로리아결과3단계/복장장신구·편집실결과4~6·드레스부품기존그림연결. 사용자저장소개문을그대로소스에보존. 이미지파일세부는다른감사범위.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / H032~H034, H040~H045, H052~H054, H058
- 근거: [2026-11-08_keyboard_hotkeys.json](<G:/somi/JO9sa/mods/2026-11-08_keyboard_hotkeys.json>) · [2026-11-09_quiet_info_always.json](<G:/somi/JO9sa/mods/2026-11-09_quiet_info_always.json>) · [2026-11-08_item_component_images.json](<G:/somi/JO9sa/mods/2026-11-08_item_component_images.json>) · [REPORT_KO.md](<G:/somi/JO9sa/records/work-saved-dialogue-20261111/REPORT_KO.md>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### G32 창관준비·펠라게야/베네라·버전표시

- 이전: 중개인초기화가완료를지우고가족/목표/선호문구와버전표시가옛값이었다.
- 현재: 중개인완료플래그보존·골목준비메뉴/옛아이콘/소유후작업제한훅. 실제창관운영은업데이트예정. 가족설정/목표/실제선호·옛표시/정확캐시를맞추고수동문보존. 버전표시11곳2.4.2, 추적2.4.1보관경로는호환유지.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / existing / H006~H009, H070, postSnapshot:가족설정, approvedFollowups:R10-1
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/brothel-upcoming-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-story-20261112/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/release-version-display-242-20261113/REPORT_KO.md>)
- 검증한계: 이번 감사는 읽기 전용 기록/현재 코드 대조다. 당시 격리·합성 엔진검사와 실제 개인SAV/GUI/청감/장기플레이/최종출고검사는 구분한다.

### R02 조커재구매차단

- 이전: 메뉴jokr/구매joker불일치와저장링크우회
- 현재: joker검사·구매입구미구매/3000이상/빈칸재검사·정확옛캐시치환. 오타변수의구매이력추정/삭제없음.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R02
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r02-joker-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진106검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-1 아르테미아외모

- 이전: min_beauty>4가값을저장하지않음
- 현재: 실제최저외모5·4거절/5·6허용·평가등급8유지
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-1
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03a-artemia-beauty-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진24검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-2 아르테미아기술8종

- 이전: 기술>3/>4비교식이값을저장하지않음
- 현재: 음악/이종/페티시즘4이상·애무/구강/삽입/단체/역할놀이5이상실제대입검사
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-2
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03b-artemia-skills-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진120검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-3 아르테미아특성

- 이전: 요구nymphomania1이실제납품미연결
- 현재: 특성1/2이상허용·0/음수거절·발견여부추가조건없음
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-3
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03c-artemia-trait-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진43검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-4 레시감수성상한

- 이전: sensitivity<4가상한을저장하지않음
- 현재: 상한3검사·다른고객잔류없음·최종R03-7과합쳐1~3
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-4
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03d-leshiy-sensitivity-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진30검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-5 레시체력최저

- 이전: min_stamina>3및최저검사누락
- 현재: 레시만체력4이상·3거절·다른고객일괄활성화없음
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-5
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03e-leshiy-stamina-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진33검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-6 레시무명

- 이전: unknown1요구실제미연결
- 현재: 인지도0만허용·1이상거절·인물값자체변경없음
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-6
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03f-leshiy-unknown-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진31검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-7 레시감수성최저

- 이전: 저장최저1을실제검사가읽지않음
- 현재: 감수성1~3허용·0/4이상거절·별도사용자최저값보존
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-7
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03g-leshiy-sensitivity-min-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진35검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-8 키키모라외모

- 이전: min_beauty>3가최저값미저장
- 현재: 최저외모4·3거절/4이상허용
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-8
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03h-kikimora-beauty-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진30검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-9 키키모라선호8종

- 이전: 속성/기술8종>비교식값미저장
- 현재: 감수성/성격/화술/음악/역할놀이4이상·구강/애무/페티시즘5이상
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-9
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03i-kikimora-preferences-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진75검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R03-10 키키모라분류전용

- 이전: 공용agree_age0미지정규약으로young지정미동작
- 현재: 키키모라전용gate만young형분류0수락·다른고객0미지정/no_loli대체규칙·가격/평가유지
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R03-10
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r03j-kikimora-young-20261113/REPORT_KO.md>)
- 검증한계: 기존실제엔진72검사·공식재생/멱등/역검증. 가격/평가·완료거래/인물/진행보존. 개인SAVUI/전체출고미검증.

### R04 복합반복의뢰9건·일반제외·특별보상예외

- 이전: 아네스/에르멜린다/노에미/캡/엘리자베스5종문의목표미연결
- 현재: 색강조복합요구9건만문의후목표/상세등록·납품가능/기존대기N일표시. 전문/등급단순일반의뢰제외, 대사/지문이별도이벤트/특별보상을직접고지하는기존목표는유지. 글로리아일반납품은간접트리거로제외. 문자열키9개저장.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R04
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r04-repeat-goals-20261113/REPORT_KO.md>)
- 검증한계: 105검사·실제문의블록추출/목표함수. 전체interaction_city클릭/GUI미검증. 중간숫자키는최종문자열키로대체.

### R05 일반직업반말제거·인물속성

- 이전: 일반11직업이유니크지정과무관하게반말선택
- 현재: 일반11직업반말제거·격식/기본문체유지. 지정8명기본반말·인물jo9_plain_tone−1/0/1을화자/완성문교정/소개호환/옛캐시에연결. 최종자동전환은R05a추가.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R05
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r05-voice-policy-20261113/REPORT_KO.md>)
- 검증한계: 188검사·모든문장/어미/GUI미검증. 자동수치없음이라는당시범위는R05a후속대체.

### R05a 자동말투·공주출신직업고정

- 이전: 자동관계말투전환/공주출신직업고정없음
- 현재: 지정8명·내부반말속성·일반공주출신만인식3AND(헌신3OR사육3OR두려움3)이면존댓말, 그조건해제AND응석3이면반말, 나머지현재말투유지. family=mprincess일반노예직업/직업설명/경매표기/work_index공주고정. 직업만공주·야만족공주·유니크제외, 기존기술/육성/진행재계산없음·추가키0.
- 상태/커버리지: WORK 반영 기록·현재 코드 정적대조 / partial / approvedFollowups:R05a
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/release-r05a-auto-speech-20261113/REPORT_KO.md>)
- 검증한계: 실제엔진264검사·합성인물/실화자/캐시/역할/로드. 개인SAVUI/전체GUI/출고검사별도.

### X01 기획·폐기·미수정·차기분리

- 이전: 옛조사/제안/당시미구현이최신반영과섞여완성기능으로오인될수있음
- 현재: 상위드랍/전리품·세련됨추첨·하녀발견메모·C필로우토크/경험통계/펠리시티·월정산·비밀서고/특등급재료중요퀘·안개동부32문구·D15재발조사는완성기능제외. 기존지팡이조건조사는새획득수정아님. D21최종이관은아직미구현필수마지막작업.
- 상태/커버리지: 보류/미구현/별도조사 / excluded / deferredItems, H096, H097
- 근거: [REPORT_KO.md](<G:/somi/JO9sa/records/drop-affinity-audit-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/ui-focus-repaint-20261111/REPORT_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/pending-decisions-20261112/DECISIONS_KO.md>) · [REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-combined-20261112/REPORT_KO.md>) · [index.json](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>)
- 검증한계: 계획/조사/보류일뿐실행완료아님. 재개/구현/배포승인추정없음.

## 최초 게임99행 최종판정

| 이력 | 항목 | 현재판정 |
|---|---|---|
| H001 | 채택 전투5종·몬스터18종 효과음 실제 연결 | 기존 반영 기록 유지 |
| H002 | 연금술 해제 대사와 실제 담당 전환 정합성 수정 | 기존 반영 기록 유지 |
| H003 | 실제 조제 성공일만 헌신 업무로 계산 | 기존 반영 기록 유지 |
| H004 | 조수 본인의 업무로 일일 헌신 판정 | 기존 반영 기록 유지 |
| H005 | 기존 BGM MP3·효과음 WAV 및 저장 경로 이관 | 기존 반영 기록 유지 |
| H006 | 중개인 대사 초기화가 퀘스트 완료를 지우던 오류 | 기존 반영 기록 유지 |
| H007 | 이전 세이브 창관 메뉴 아이콘 폴백 | 기존 반영 기록 유지 |
| H008 | 창관 인수 준비 항목을 골목 안으로 이동 | 안내 수정·기능 예정 |
| H009 | 창관 소유 뒤 골목 일시키기 비활성 훅 | 기존 반영 기록 유지 |
| H010 | 두막 반복 납품 보상10% 누적 감액 | 기존 반영 기록 유지 |
| H011 | 게임오버 화면 전용 음악·효과음 | 기존 반영 기록 유지 |
| H012 | 가르시드 전투 진입·확정 둔기 피해 효과음 | 기존 반영 기록 유지 |
| H013 | 2500스파크 결말의 온순 상태 안정화 | 기존 반영 기록 유지 |
| H014 | 글로리아 가격별 기본 헌신+1 | 기존 반영 기록 유지 |
| H015 | 글로리아 이벤트 종료 뒤 일회성 힌트 제거 | 기존 반영 기록 유지 |
| H016 | 글로리아 가격별 초기 친밀·기분 조정 | 기존 반영 기록 유지 |
| H017 | 글로리아 선택지 높이와 줄 간격 조정 | 기존 반영 기록 유지 |
| H018 | 글로리아 선택지 페이지 초기화 임시 수정 | 중간페이지수정→인라인선택지후속대체 |
| H019 | 글로리아 선택지 왼쪽 정렬·가격별 색상 | 기존 반영 기록 유지 |
| H020 | 글로리아 선택지를 하단 대사창 안으로 이동 | 기존 반영 기록 유지 |
| H021 | 글로리아4페이지 주인공 응답과 선택지 | 기존 반영 기록 유지 |
| H022 | 글로리아 경고 페이지·첫 후임 납품 정보 저장 | 기존 반영 기록 유지 |
| H023 | 임시 글로리아 이벤트 준비 버튼 | 임시테스트→H043에서제거 |
| H024 | 임시 테스트 후임 능력치 사본 보완 | 임시테스트→H043에서제거 |
| H025 | 글로리아 영입 인식을 모든 가격에서4로 통일 | 기존 반영 기록 유지 |
| H026 | 글로리아 첫 상담14페이지 맞춤법 | 기존 반영 기록 유지 |
| H027 | 글로리아 첫 상담9페이지 띄어쓰기 | 기존 반영 기록 유지 |
| H028 | 글로리아 첫 상담14페이지 사용자 각색 반영 | 기존 반영 기록 유지 |
| H029 | 글로리아 상담6페이지2차 각색·지명 통일 | 기존 반영 기록 유지 |
| H030 | 후임의 저장 헌신별 전 주인 인사 | 기존 반영 기록 유지 |
| H031 | 후임 이름 치환의 한국어 조사 오류 방지 | 기존 반영 기록 유지 |
| H032 | 수녀·창녀 드레스 부품 기존 그림 연결 | 기존 반영 기록 유지 |
| H033 | 상태 탭·지역 이동 단축키 | 기존 반영 기록 유지 |
| H034 | H키 귀가 단축키 | 기존 반영 기록 유지 |
| H035 | 상반 특성 생성·기존 저장 배타 처리 | 기존 처리 확인 |
| H036 | 목표 탭을 비우던 주석 작은따옴표 수정 | 기존 반영 기록 유지 |
| H037 | 의뢰 대사 배열20줄 잘못된HTML 제거 | 기존 반영 기록 유지 |
| H038 | 색 강조 없는 의뢰11건만 요구·보상 요약 | 기존 반영 기록 유지 |
| H039 | 지출 총계 마이너스 부호 | 기존 반영 기록 유지 |
| H040 | 글로리아 결과3단계 그림 연결 | 기존 반영 기록 유지 |
| H041 | 글로리아 영입 복장·장신구 착용 | 기존 반영 기록 유지 |
| H042 | 글로리아 사무소5년 근무 대사 | 기존 반영 기록 유지 |
| H043 | 글로리아 임시 테스트 버튼·함수 제거 | 기존 반영 기록 유지 |
| H044 | 고기 이름·재고·설명 감지 표기 통일 | 기존 반영 기록 유지 |
| H045 | 조용히 명령 중 중요 경고는 항상 표시 | 기존 반영 기록 유지 |
| H046 | 현재 노예 대상 소문·주인공 전공 질문 | 기존 반영 기록 유지 |
| H047 | 소문값 항상 지불·메타 안내 제거 | 기존 반영 기록 유지 |
| H048 | NPC 소문 말투·길드 추천 문장 | 기존 반영 기록 유지 |
| H049 | 소문을 하단 대사창 페이지로 표시 | 기존 반영 기록 유지 |
| H050 | 일반 구매자 대신 의뢰43건 충족 안내 | 기존 반영 기록 유지 |
| H051 | 스컵스의 미완료 글로리아 소문 | 기존 반영 기록 유지 |
| H052 | 편집실 결과5단계 그림 연결 | 기존 반영 기록 유지 |
| H053 | 편집실 결과6단계 그림 연결 | 기존 반영 기록 유지 |
| H054 | 편집실 결과4단계 그림 연결 | 기존 반영 기록 유지 |
| H055 | 알바 물품 종류별 보고 문장 | 기존 반영 기록 유지 |
| H056 | 업무 결과·10일 장부 효과음3종 | WAV후속반영·청감미검증 |
| H057 | 안개 수확 뒤 부상 보고·부상컷 유지 | 기존 반영 기록 유지 |
| H058 | 좌우 방향키 일반 페이지 넘김 | 기존 반영 기록 유지 |
| H059 | 개인실 메뉴·상호작용에도 단계 배경 | 기존 반영 기록 유지 |
| H060 | 업무 상황별 승인 문안 무작위 변형 | 기존 반영 기록 유지 |
| H061 | 업무 결과음 문자열 지역변수 수정 | 기존 반영 기록 유지 |
| H062 | 외근 중 요리·청소 중복 방지 | 기존 반영 기록 유지 |
| H063 | 하드 증축비 환급8경로 수정 | 기존 반영 기록 유지 |
| H064 | 길거리 빈손 날 전용 컷 | 기존 반영 기록 유지 |
| H065 | 길거리 초대박 기존 용품17종 획득 | 기존 반영 기록 유지 |
| H066 | 특별 고객85개 기존 이름표 정리 | 기존 반영 기록 유지 |
| H067 | 특별 고객11건 등록해 총96건 | 기존 반영 기록 유지 |
| H068 | Sp.·스펙터 최상위 중복 표시 제거 | 기존 반영 기록 유지 |
| H069 | 개인실 기존 일일 수입 블록 삭제 | 기존 반영 기록 유지 |
| H070 | 창관 인수·소유 후 메뉴는 준비 훅 | 안내 수정·기능 예정 |
| H071 | 첫 A이상 비서 납품 후임 정보 보존 | 기존 반영 기록 유지 |
| H072 | 60일 후 빈 노예 칸에서 이벤트 개시 | 60일→30일후속대체 |
| H073 | 1만·5천·2500 가격별 영입 조건 | 기존 반영 기록 유지 |
| H074 | 모든 결말 뒤 부동산 후임 교체 | 기존 반영 기록 유지 |
| H075 | 최종 영입 초기 상태 수치 | 기존 반영 기록 유지 |
| H076 | 업무 선택과 일일 재검사 | 기존 반영 기록 유지 |
| H077 | 집안일 전담과 기존 담당자 우선순위 | 기존 반영 기록 유지 |
| H078 | 집안일 기분·예외 보고 | 기존 반영 기록 유지 |
| H079 | 알바 자격·성과 확률 | 후속 정정 완료 |
| H080 | 알바 식재료·연금 보상 | 기존 반영 기록 유지 |
| H081 | 알바 적성·창고·하드 보정 | 기존 반영 기록 유지 |
| H082 | 길거리 업무 성과·수입 | 기존 반영 기록 유지 |
| H083 | 길거리 업무 자격·상태 연계 | 기존 반영 기록 유지 |
| H084 | 안개 업무 자격·수입·장비 보정 | 기존 반영 기록 유지 |
| H085 | 안개 부상과 밤 회복 순서 | 기존 반영 기록 유지 |
| H086 | 안개 아이템 획득과 처리 방식 | 후속 정정 완료 |
| H087 | 저장 식재료 추가 소비·공로 연결 | 기존 반영 기록 유지 |
| H088 | 업무 결과 컷 선택과 변형 | 기존 반영 기록 유지 |
| H089 | 10일 장부4분류와 실제 정산 완료 | 기존 반영 기록 유지 |
| H090 | 현물과 현금 구분·누적 초기화 | 기존 반영 기록 유지 |
| H091 | 집별 장부 배경과 폴백 | 기존 반영 기록 유지 |
| H092 | 방별 인테리어 구매·처분 규칙 | 기존 반영 기록 유지 |
| H093 | 단계별 밤 효과·하드 비용 | 기존 반영 기록 유지 |
| H094 | 실제 업무일 칼로리 소비 | 기존 반영 기록 유지 |
| H095 | 일반식 요리 등급·특별식5일 체형관리 | 기존 반영 기록 유지 |
| H096 | 11월6~7일 변경은3차r2에 이미 포함 | 공개기준판에이미포함·신규제외 |
| H097 | 월정산·전체창관·BGM순차재생은미구현 | 거주지BGM완료/월정산·실제창관운영미구현 |
| H098 | 개인실 수입은 당일 지급·장부에서 중복 지급하지 않음 | 기존 반영 기록 유지 |
| H099 | 안개 소지품 획득 확률 설명과 실제값 차이 | 안내정정·실제확률변경없음 |

## 조사한 모드 목록

| 모드 | 기능항목 | 현재정확편집/전체 | 대상부재 |
|---|---|---:|---:|
| 2026-11-08_adopted_combat_monster_sfx.json | G29 | 6/6 | 0 |
| 2026-11-08_assistant_alchemy_abort_text.json | G01 | 2/2 | 0 |
| 2026-11-08_assistant_alchemy_brewed_day.json | G01 | 3/3 | 0 |
| 2026-11-08_assistant_daily_devotion.json | G01 | 1/2 | 0 |
| 2026-11-08_audio_formats_mp3_bgm_wav_sfx.json | G29 | 2/10 | 0 |
| 2026-11-08_broker_brothel_offer.json | G32 | 2/4 | 0 |
| 2026-11-08_broker_quest_killvar_fix.json | G32 | 1/1 | 0 |
| 2026-11-08_brothel_buy_unhide.json | G32 | 1/1 | 0 |
| 2026-11-08_brothel_icon_save_fallback.json | G32 | 0/1 | 0 |
| 2026-11-08_brothel_option_in_alley.json | G32 | 5/6 | 0 |
| 2026-11-08_brothel_owned_work_lock.json | G32 | 1/2 | 0 |
| 2026-11-08_dumak_reward_decay.json | G02 | 1/1 | 0 |
| 2026-11-08_gameover_audio_screen_only.json | G29 | 2/4 | 0 |
| 2026-11-08_garsid_blunt_playback.json | G29 | 7/8 | 0 |
| 2026-11-08_gloria_2500_docile.json | G03 | 2/2 | 0 |
| 2026-11-08_gloria_base_moral_plus1.json | G03 | 3/3 | 0 |
| 2026-11-08_gloria_hint_once.json | G03 | 1/1 | 0 |
| 2026-11-08_gloria_join_intimacy.json | G03 | 0/5 | 0 |
| 2026-11-08_gloria_quest_choice_fit.json | G03 | 0/1 | 0 |
| 2026-11-08_gloria_quest_choice_page.json | G03 | 0/1 | 0 |
| 2026-11-08_gloria_quest_choice_style.json | G03 | 5/5 | 0 |
| 2026-11-08_gloria_quest_inline_choices.json | G03 | 1/3 | 0 |
| 2026-11-08_gloria_quest_master_page.json | G03 | 0/1 | 0 |
| 2026-11-08_gloria_quest_stage1.json | G03 | 2/3 | 0 |
| 2026-11-08_gloria_quest_stage2.json | G03 | 3/9 | 0 |
| 2026-11-08_gloria_quest_test_cheat.json | G03 | 0/2 | 0 |
| 2026-11-08_gloria_quest_test_cheat_copy.json | G03 | 0/2 | 0 |
| 2026-11-08_gloria_rational4.json | G03 | 3/3 | 0 |
| 2026-11-08_gloria_realtor_intro_p14_spelling.json | G03 | 1/1 | 0 |
| 2026-11-08_gloria_realtor_intro_p9_spacing.json | G03 | 1/1 | 0 |
| 2026-11-08_gloria_realtor_intro_rewrite.json | G03 | 0/1 | 0 |
| 2026-11-08_gloria_realtor_intro_rewrite_2.json | G03 | 0/1 | 0 |
| 2026-11-08_gloria_successor_greeting.json | G03 | 1/1 | 0 |
| 2026-11-08_gloria_successor_no_particle.json | G03 | 5/5 | 0 |
| 2026-11-08_item_component_images.json | G31 | 2/2 | 0 |
| 2026-11-08_keyboard_hotkeys.json | G31 | 4/4 | 0 |
| 2026-11-08_keyboard_hotkeys_home.json | G31 | 3/3 | 0 |
| 2026-11-08_oral_gag_exclusion.json | G19 | 3/3 | 0 |
| 2026-11-08_quest_list_comment_quote.json | G02 | 1/1 | 0 |
| 2026-11-08_special_client_journal.json | G02 | 157/160 | 0 |
| 2026-11-08_static_offer_arrays.json | G02 | 20/20 | 0 |
| 2026-11-08_uncolored_goal_summaries.json | G02 | 11/12 | 0 |
| 2026-11-09_bill_total_sign.json | G22 | 1/1 | 0 |
| 2026-11-09_decade_ledger.json | G22 | 0/1 | 0 |
| 2026-11-09_gloria_image_reference.json | G03 | 0/1 | 0 |
| 2026-11-09_gloria_join_outfit.json | G03 | 1/1 | 0 |
| 2026-11-09_gloria_talk_five_years.json | G03 | 1/1 | 0 |
| 2026-11-09_gloria_test_cheat_removed.json | G03 | 2/2 | 0 |
| 2026-11-09_meat_name_unify.json | G31 | 13/13 | 0 |
| 2026-11-09_quiet_info_always.json | G31 | 3/3 | 0 |
| 2026-11-09_room_duty_chores.json | G22 | 24/29 | 0 |
| 2026-11-09_rumor_current_slave_ask.json | G05 | 3/3 | 0 |
| 2026-11-09_rumor_fee_always_no_meta.json | G05 | 4/4 | 0 |
| 2026-11-09_rumor_npc_lines.json | G05 | 2/5 | 0 |
| 2026-11-09_rumor_paged_message.json | G05 | 1/2 | 0 |
| 2026-11-09_rumor_quest_clients.json | G05 | 2/4 | 0 |
| 2026-11-09_rumor_skups_gloria.json | G03 | 0/1 | 0 |
| 2026-11-09_work_editor_image_stage5.json | G31 | 1/1 | 0 |
| 2026-11-09_work_editor_image_stage6.json | G31 | 1/1 | 0 |
| 2026-11-09_work_editor_image_sync.json | G31 | 0/1 | 0 |
| 2026-11-10_daywork_goods_kind.json | G22 | 7/7 | 0 |
| 2026-11-10_duty_ledger_sfx_wav.json | G29 | 2/2 | 0 |
| 2026-11-10_duty_ledger_sounds.json | G29 | 0/2 | 0 |
| 2026-11-10_fog_injury_after_haul.json | G22 | 2/14 | 0 |
| 2026-11-10_page_hotkeys.json | G31 | 1/1 | 0 |
| 2026-11-10_private_room_diet.json | G23 | 19/19 | 0 |
| 2026-11-10_private_room_interior.json | G23 | 12/15 | 0 |
| 2026-11-10_private_room_scene_bg.json | G23 | 3/3 | 0 |
| 2026-11-10_private_room_tier_effects.json | G23 | 13/13 | 0 |
| 2026-11-10_room_duty_text_variants.json | G22 | 30/30 | 0 |
| 2026-11-10_stability_01_duty_sound.json | G22 | 0/1 | 0 |
| 2026-11-10_stability_02_external_duty_chores.json | G22 | 2/2 | 0 |
| 2026-11-10_stability_03_room_refunds.json | G23 | 8/8 | 0 |
| 2026-11-10_street_empty_scene.json | G22 | 1/1 | 0 |
| 2026-11-10_street_sex_items.json | G22 | 9/9 | 0 |
| 2026-11-11_brothel_upcoming_tooltip.json | G32 | 1/1 | 0 |
| 2026-11-11_city_settings_bgm_keep.json | G30 | 0/1 | 0 |
| 2026-11-11_constitution_hint_text.json | G21 | 1/1 | 0 |
| 2026-11-11_cow_costume.json | G28 | 7/7 | 0 |
| 2026-11-11_equipment_effect_descriptions.json | G21 | 15/15 | 0 |
| 2026-11-11_erza_guardian_defense.json | G26 | 2/2 | 0 |
| 2026-11-11_hard_enemy_specials.json | G26 | 4/4 | 0 |
| 2026-11-11_hassa_vip_access.json | G27 | 2/2 | 0 |
| 2026-11-11_hassa_vip_dialogue.json | G27 | 10/10 | 0 |
| 2026-11-11_private_room_original_menu.json | G24 | 11/11 | 0 |
| 2026-11-11_rally_entry_payout.json | G27 | 27/27 | 0 |
| 2026-11-11_residence_fame_bgm.json | G30 | 13/13 | 0 |
| 2026-11-11_shlyapkin_target_rating.json | G27 | 1/1 | 0 |
| 2026-11-11_wish_approved_dialogue.json | G19 | 0/1 | 0 |
| 2026-11-11_wish_trait_discovery.json | G19 | 0/1 | 0 |
| 2026-11-11_witch_coven_entry.json | G25 | 3/3 | 0 |
| 2026-11-11_work_saved_luminous_text.json | G31 | 1/1 | 0 |
| 2026-11-11_workaholic_duty_comment.json | G22 | 1/1 | 0 |
| 2026-11-12_chunhyang_combat_repairs.json | G09 | 1/4 | 0 |
| 2026-11-12_chunhyang_menu_links.json | G10 | 0/1 | 0 |
| 2026-11-12_chunhyang_profile.json | G11 | 4/5 | 0 |
| 2026-11-12_chunhyang_profile_approved_background.json | G11 | 0/1 | 0 |
| 2026-11-12_chunhyang_profile_champion.json | G11 | 1/2 | 0 |
| 2026-11-12_chunhyang_scene_presentation.json | G10 | 8/8 | 0 |
| 2026-11-12_chunhyang_successor_battle.json | G06 | 14/16 | 0 |
| 2026-11-12_private_room_background_comment.json | G24 | 1/2 | 0 |
| 2026-11-12_unique_character_traits.json | G12 | 0/1 | 0 |
| 2026-11-12_zz_assistant_training_ui.json | G20 | 3/3 | 0 |
| 2026-11-12_zz_chunhyang_initial_attitude.json | G11 | 1/1 | 0 |
| 2026-11-12_zz_fertility_kula_wording.json | G21 | 29/29 | 0 |
| 2026-11-12_zz_gloria_delay30_rumor.json | G03 | 3/3 | 0 |
| 2026-11-12_zz_pelageya_venera_story.json | G32 | 18/19 | 0 |
| 2026-11-12_zz_pelageya_venera_story_cache.json | G32 | 0/1 | 0 |
| 2026-11-12_zz_pelageya_venera_story_display.json | G32 | 1/5 | 0 |
| 2026-11-12_zzz_always_plain_voice.json | R05 | 0/3 | 0 |
| 2026-11-12_zzzz_dohna_stories.json | G13 | 1/4 | 0 |
| 2026-11-12_zzzzz_dohna_traits.json | G14 | 1/1 | 0 |
| 2026-11-12_zzzzzz_hard_attribute_visibility.json | G18 | 9/14 | 0 |
| 2026-11-12_zzzzzzz_dohna_adult_presets.json | G14 | 2/4 | 0 |
| 2026-11-12_zzzzzzzz_dohna_owned_migration.json | G15 | 1/2 | 0 |
| 2026-11-12_zzzzzzzzz_handoff_a_work.json | G16 | 6/10 | 0 |
| 2026-11-12_zzzzzzzzzz_handoff_b_combined.json | G17 | 14/17 | 0 |
| 2026-11-13_chunhyang_random_finisher.json | G08 | 7/7 | 0 |
| 2026-11-13_r02_joker_purchase_guard.json | R02 | 5/5 | 0 |
| 2026-11-13_r03a_artemia_beauty_minimum.json | R03-1 | 2/2 | 0 |
| 2026-11-13_r03b_artemia_skill_minima.json | R03-2 | 2/2 | 0 |
| 2026-11-13_r03c_artemia_trait_requirement.json | R03-3 | 0/1 | 0 |
| 2026-11-13_r03d_leshiy_sensitivity_maximum.json | R03-4 | 3/3 | 0 |
| 2026-11-13_r03e_leshiy_stamina_minimum.json | R03-5 | 3/3 | 0 |
| 2026-11-13_r03f_leshiy_unknown_requirement.json | R03-6 | 1/1 | 0 |
| 2026-11-13_r03g_leshiy_sensitivity_minimum.json | R03-7 | 1/1 | 0 |
| 2026-11-13_r03h_kikimora_beauty_minimum.json | R03-8 | 2/2 | 0 |
| 2026-11-13_r03i_kikimora_preference_minima.json | R03-9 | 2/2 | 0 |
| 2026-11-13_r03j_kikimora_young_only.json | R03-10 | 1/1 | 0 |
| 2026-11-13_r04_repeat_client_objectives.json | R04 | 12/12 | 0 |
| 2026-11-13_r05_voice_policy_flags.json | R05 | 3/15 | 0 |
| 2026-11-13_r05a_auto_speech_transitions.json | R05a | 27/27 | 0 |
| 2026-11-13_r10_version_display_242.json | G32 | 10/10 | 0 |

## 조사한 기록·인계 목록

- [records/always-plain-voice-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/always-plain-voice-20261112/REPORT_KO.md>)
- [records/assistant-training-ui-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/assistant-training-ui-20261112/REPORT_KO.md>)
- [records/audio-format-normalize-20261108/PLAN_KO.md](<G:/somi/JO9sa/records/audio-format-normalize-20261108/PLAN_KO.md>)
- [records/audio-format-normalize-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/audio-format-normalize-20261108/REPORT_KO.md>)
- [records/brothel-upcoming-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/brothel-upcoming-20261111/REPORT_KO.md>)
- [records/catfight-successor-planning-20261111/ACQUISITION_SAFETY_AUDIT_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/ACQUISITION_SAFETY_AUDIT_KO.md>)
- [records/catfight-successor-planning-20261111/CHARACTER_PROPOSAL_KO_20261112.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/CHARACTER_PROPOSAL_KO_20261112.md>)
- [records/catfight-successor-planning-20261111/CHUNHYANG_BASELINE_PROPOSAL_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/CHUNHYANG_BASELINE_PROPOSAL_KO.md>)
- [records/catfight-successor-planning-20261111/CHUNHYANG_DEFENSE_DRAFT_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/CHUNHYANG_DEFENSE_DRAFT_KO.md>)
- [records/catfight-successor-planning-20261111/CM_AND_LOSS_AUDIT_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/CM_AND_LOSS_AUDIT_KO.md>)
- [records/catfight-successor-planning-20261111/DEFENSE_BONUS_AUDIT_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/DEFENSE_BONUS_AUDIT_KO.md>)
- [records/catfight-successor-planning-20261111/DESIGN_DRAFT_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/DESIGN_DRAFT_KO.md>)
- [records/catfight-successor-planning-20261111/EGEYA_COMPARISON_KO_20261112.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/EGEYA_COMPARISON_KO_20261112.md>)
- [records/catfight-successor-planning-20261111/ENEMY_TRAITS_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/ENEMY_TRAITS_KO.md>)
- [records/catfight-successor-planning-20261111/HERO_MAX_POWER_AUDIT_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/HERO_MAX_POWER_AUDIT_KO.md>)
- [records/catfight-successor-planning-20261111/HERO_VS_FOG_MONSTER_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/HERO_VS_FOG_MONSTER_KO.md>)
- [records/catfight-successor-planning-20261111/TURN_CHECK_AUDIT_KO.md](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/TURN_CHECK_AUDIT_KO.md>)
- [records/chores-clean-reuse-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/chores-clean-reuse-20261111/REPORT_KO.md>)
- [records/chunhyang-club-20261112/progress.md](<G:/somi/JO9sa/records/chunhyang-club-20261112/progress.md>)
- [records/chunhyang-club-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-club-20261112/REPORT_KO.md>)
- [records/chunhyang-combat-fixes-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-combat-fixes-20261112/REPORT_KO.md>)
- [records/chunhyang-initial-attitude-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-initial-attitude-20261112/REPORT_KO.md>)
- [records/chunhyang-menu-links-20261112/INITIAL_LINK_AUDIT_KO.md](<G:/somi/JO9sa/records/chunhyang-menu-links-20261112/INITIAL_LINK_AUDIT_KO.md>)
- [records/chunhyang-menu-links-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-menu-links-20261112/REPORT_KO.md>)
- [records/chunhyang-profile-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-profile-20261112/REPORT_KO.md>)
- [records/chunhyang-random-finish-20261113/DESIGN_PLAN_KO.md](<G:/somi/JO9sa/records/chunhyang-random-finish-20261113/DESIGN_PLAN_KO.md>)
- [records/chunhyang-random-finish-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-random-finish-20261113/REPORT_KO.md>)
- [records/city-settings-bgm-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/city-settings-bgm-20261111/REPORT_KO.md>)
- [records/claude-stability-fixes-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)
- [records/constitution-hint-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/constitution-hint-20261111/REPORT_KO.md>)
- [records/cow-costume-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/cow-costume-20261111/REPORT_KO.md>)
- [records/dohna-adult-presets-20261112/PLAN_KO.md](<G:/somi/JO9sa/records/dohna-adult-presets-20261112/PLAN_KO.md>)
- [records/dohna-adult-presets-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/dohna-adult-presets-20261112/REPORT_KO.md>)
- [records/dohna-owned-migration-20261112/DESIGN_PLAN_KO.md](<G:/somi/JO9sa/records/dohna-owned-migration-20261112/DESIGN_PLAN_KO.md>)
- [records/dohna-owned-migration-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/dohna-owned-migration-20261112/REPORT_KO.md>)
- [records/dohna-stats-20261112/APPEARANCE_ROUTES_KO.md](<G:/somi/JO9sa/records/dohna-stats-20261112/APPEARANCE_ROUTES_KO.md>)
- [records/dohna-stats-20261112/BEFORE_AFTER_KO.md](<G:/somi/JO9sa/records/dohna-stats-20261112/BEFORE_AFTER_KO.md>)
- [records/dohna-stats-20261112/DESIGN_PLAN_KO.md](<G:/somi/JO9sa/records/dohna-stats-20261112/DESIGN_PLAN_KO.md>)
- [records/dohna-stats-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/dohna-stats-20261112/REPORT_KO.md>)
- [records/dohna-stories-20261112/PLAN_KO.md](<G:/somi/JO9sa/records/dohna-stories-20261112/PLAN_KO.md>)
- [records/dohna-stories-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/dohna-stories-20261112/REPORT_KO.md>)
- [records/dohna-stories-20261112/STORIES_KO.md](<G:/somi/JO9sa/records/dohna-stories-20261112/STORIES_KO.md>)
- [records/dohna-traits-20261112/AGE_CLASSIFICATION_CORRECTION_KO.md](<G:/somi/JO9sa/records/dohna-traits-20261112/AGE_CLASSIFICATION_CORRECTION_KO.md>)
- [records/dohna-traits-20261112/DESIGN_PLAN_KO.md](<G:/somi/JO9sa/records/dohna-traits-20261112/DESIGN_PLAN_KO.md>)
- [records/dohna-traits-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/dohna-traits-20261112/REPORT_KO.md>)
- [records/dohna-traits-20261112/TRAITS_KO.md](<G:/somi/JO9sa/records/dohna-traits-20261112/TRAITS_KO.md>)
- [records/drop-affinity-audit-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/drop-affinity-audit-20261111/REPORT_KO.md>)
- [records/drop-equipment-planning-20261111/DESIGN_DRAFT_KO.md](<G:/somi/JO9sa/records/drop-equipment-planning-20261111/DESIGN_DRAFT_KO.md>)
- [records/drop-equipment-planning-20261111/NEXT_UPDATE_HANDOFF_KO.md](<G:/somi/JO9sa/records/drop-equipment-planning-20261111/NEXT_UPDATE_HANDOFF_KO.md>)
- [records/duty-ledger-wav-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/REPORT_KO.md>)
- [records/enemy-balance-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/enemy-balance-20261111/REPORT_KO.md>)
- [records/enemy-special-reference-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/enemy-special-reference-20261111/REPORT_KO.md>)
- [records/equipment-descriptions-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/equipment-descriptions-20261111/REPORT_KO.md>)
- [records/fertility-kula-wording-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/fertility-kula-wording-20261112/REPORT_KO.md>)
- [records/gloria-delay30-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/gloria-delay30-20261112/REPORT_KO.md>)
- [records/goal-summary-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/goal-summary-20261108/REPORT_KO.md>)
- [records/handoff-a-work-20261112/B_DECISIONS_KO.md](<G:/somi/JO9sa/records/handoff-a-work-20261112/B_DECISIONS_KO.md>)
- [records/handoff-a-work-20261112/DESIGN_PLAN_KO.md](<G:/somi/JO9sa/records/handoff-a-work-20261112/DESIGN_PLAN_KO.md>)
- [records/handoff-a-work-20261112/handoff-pr17-comment.md](<G:/somi/JO9sa/records/handoff-a-work-20261112/handoff-pr17-comment.md>)
- [records/handoff-a-work-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/handoff-a-work-20261112/REPORT_KO.md>)
- [records/handoff-b-activity-20261112/README_KO.md](<G:/somi/JO9sa/records/handoff-b-activity-20261112/README_KO.md>)
- [records/handoff-b-background-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-background-20261112/REPORT_KO.md>)
- [records/handoff-b-combined-20261112/FULL_GENERATION_VALIDATION_KO.md](<G:/somi/JO9sa/records/handoff-b-combined-20261112/FULL_GENERATION_VALIDATION_KO.md>)
- [records/handoff-b-combined-20261112/PR_COMMENT_FINAL_KO.md](<G:/somi/JO9sa/records/handoff-b-combined-20261112/PR_COMMENT_FINAL_KO.md>)
- [records/handoff-b-combined-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-combined-20261112/REPORT_KO.md>)
- [records/handoff-b-combined-20261112/STATUS_KO.md](<G:/somi/JO9sa/records/handoff-b-combined-20261112/STATUS_KO.md>)
- [records/handoff-b-combined-20261112/USER_DECISIONS_KO.md](<G:/somi/JO9sa/records/handoff-b-combined-20261112/USER_DECISIONS_KO.md>)
- [records/handoff-b-occupation-20261112/PLAN_KO.md](<G:/somi/JO9sa/records/handoff-b-occupation-20261112/PLAN_KO.md>)
- [records/handoff-b-occupation-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-occupation-20261112/REPORT_KO.md>)
- [records/handoff-b-origin-growth-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-origin-growth-20261112/REPORT_KO.md>)
- [records/handoff-b-style-interop-red-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/handoff-b-style-interop-red-20261112/REPORT_KO.md>)
- [records/handoff-gap-audit-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/handoff-gap-audit-20261112/REPORT_KO.md>)
- [records/hard-attribute-visibility-20261112/DESIGN_PLAN_KO.md](<G:/somi/JO9sa/records/hard-attribute-visibility-20261112/DESIGN_PLAN_KO.md>)
- [records/hard-attribute-visibility-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/hard-attribute-visibility-20261112/REPORT_KO.md>)
- [records/hard-enemy-specials-20261111/progress.md](<G:/somi/JO9sa/records/hard-enemy-specials-20261111/progress.md>)
- [records/hard-enemy-specials-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/hard-enemy-specials-20261111/REPORT_KO.md>)
- [records/hassa-vip-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/hassa-vip-20261111/REPORT_KO.md>)
- [records/local-completed-work-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/local-completed-work-20261111/REPORT_KO.md>)
- [records/pelageya-story-20261112/HANDOFF_SOURCE.md](<G:/somi/JO9sa/records/pelageya-story-20261112/HANDOFF_SOURCE.md>)
- [records/pelageya-story-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-story-20261112/REPORT_KO.md>)
- [records/pending-decisions-20261112/DECISIONS_KO.md](<G:/somi/JO9sa/records/pending-decisions-20261112/DECISIONS_KO.md>)
- [records/post3-ledger-refresh-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/post3-ledger-refresh-20261111/REPORT_KO.md>)
- [records/private-room-bg-audit-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/private-room-bg-audit-20261112/REPORT_KO.md>)
- [records/private-sex-menu-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/private-sex-menu-20261111/REPORT_KO.md>)
- [records/protagonist-slot-audit-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/protagonist-slot-audit-20261111/REPORT_KO.md>)
- [records/rally-payout-20261111/gameplay-handoff-before.md](<G:/somi/JO9sa/records/rally-payout-20261111/gameplay-handoff-before.md>)
- [records/rally-payout-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/rally-payout-20261111/REPORT_KO.md>)
- [records/release-night-preflight-20261113/APPROVAL_QUEUE_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/APPROVAL_QUEUE_KO.md>)
- [records/release-night-preflight-20261113/DISTRIBUTION_DRAFT_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/DISTRIBUTION_DRAFT_KO.md>)
- [records/release-night-preflight-20261113/MIGRATION_REFRESH_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/MIGRATION_REFRESH_KO.md>)
- [records/release-night-preflight-20261113/README_2_4_2_DRAFT_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/README_2_4_2_DRAFT_KO.md>)
- [records/release-night-preflight-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/REPORT_KO.md>)
- [records/release-night-preflight-20261113/RESOURCE_REVIEW_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/RESOURCE_REVIEW_KO.md>)
- [records/release-night-preflight-20261113/VISUAL_QA_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/VISUAL_QA_KO.md>)
- [records/release-prep-20261113/ASSET_AUDIT_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/ASSET_AUDIT_KO.md>)
- [records/release-prep-20261113/AUDIT_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/AUDIT_KO.md>)
- [records/release-prep-20261113/BASE_AUDIT_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/BASE_AUDIT_KO.md>)
- [records/release-prep-20261113/CODE_AUDIT_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/CODE_AUDIT_KO.md>)
- [records/release-prep-20261113/MIGRATION_PREFLIGHT_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/MIGRATION_PREFLIGHT_KO.md>)
- [records/release-prep-20261113/R03A_ARTEMIA_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03A_ARTEMIA_REVIEW_KO.md>)
- [records/release-prep-20261113/R03B_ARTEMIA_SKILLS_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03B_ARTEMIA_SKILLS_REVIEW_KO.md>)
- [records/release-prep-20261113/R03C_ARTEMIA_TRAIT_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03C_ARTEMIA_TRAIT_REVIEW_KO.md>)
- [records/release-prep-20261113/R03D_LESHIY_SENSITIVITY_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03D_LESHIY_SENSITIVITY_REVIEW_KO.md>)
- [records/release-prep-20261113/R03E_LESHIY_STAMINA_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03E_LESHIY_STAMINA_REVIEW_KO.md>)
- [records/release-prep-20261113/R03F_LESHIY_UNKNOWN_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03F_LESHIY_UNKNOWN_REVIEW_KO.md>)
- [records/release-prep-20261113/R03G_LESHIY_MIN_SENSITIVITY_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03G_LESHIY_MIN_SENSITIVITY_REVIEW_KO.md>)
- [records/release-prep-20261113/R03H_KIKIMORA_BEAUTY_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03H_KIKIMORA_BEAUTY_REVIEW_KO.md>)
- [records/release-prep-20261113/R03I_KIKIMORA_PREFERENCES_REVIEW_KO.md](<G:/somi/JO9sa/records/release-prep-20261113/R03I_KIKIMORA_PREFERENCES_REVIEW_KO.md>)
- [records/release-r02-joker-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r02-joker-20261113/PLAN_KO.md>)
- [records/release-r02-joker-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r02-joker-20261113/REPORT_KO.md>)
- [records/release-r03a-artemia-beauty-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03a-artemia-beauty-20261113/PLAN_KO.md>)
- [records/release-r03a-artemia-beauty-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03a-artemia-beauty-20261113/REPORT_KO.md>)
- [records/release-r03b-artemia-skills-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03b-artemia-skills-20261113/PLAN_KO.md>)
- [records/release-r03b-artemia-skills-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03b-artemia-skills-20261113/REPORT_KO.md>)
- [records/release-r03c-artemia-trait-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03c-artemia-trait-20261113/PLAN_KO.md>)
- [records/release-r03c-artemia-trait-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03c-artemia-trait-20261113/REPORT_KO.md>)
- [records/release-r03d-leshiy-sensitivity-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03d-leshiy-sensitivity-20261113/PLAN_KO.md>)
- [records/release-r03d-leshiy-sensitivity-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03d-leshiy-sensitivity-20261113/REPORT_KO.md>)
- [records/release-r03e-leshiy-stamina-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03e-leshiy-stamina-20261113/PLAN_KO.md>)
- [records/release-r03e-leshiy-stamina-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03e-leshiy-stamina-20261113/REPORT_KO.md>)
- [records/release-r03f-leshiy-unknown-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03f-leshiy-unknown-20261113/PLAN_KO.md>)
- [records/release-r03f-leshiy-unknown-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03f-leshiy-unknown-20261113/REPORT_KO.md>)
- [records/release-r03g-leshiy-sensitivity-min-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03g-leshiy-sensitivity-min-20261113/PLAN_KO.md>)
- [records/release-r03g-leshiy-sensitivity-min-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03g-leshiy-sensitivity-min-20261113/REPORT_KO.md>)
- [records/release-r03h-kikimora-beauty-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03h-kikimora-beauty-20261113/PLAN_KO.md>)
- [records/release-r03h-kikimora-beauty-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03h-kikimora-beauty-20261113/REPORT_KO.md>)
- [records/release-r03i-kikimora-preferences-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03i-kikimora-preferences-20261113/PLAN_KO.md>)
- [records/release-r03i-kikimora-preferences-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03i-kikimora-preferences-20261113/REPORT_KO.md>)
- [records/release-r03j-kikimora-young-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r03j-kikimora-young-20261113/PLAN_KO.md>)
- [records/release-r03j-kikimora-young-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r03j-kikimora-young-20261113/REPORT_KO.md>)
- [records/release-r04-repeat-goals-20261113/initial-numeric-REPORT_KO.md](<G:/somi/JO9sa/records/release-r04-repeat-goals-20261113/initial-numeric-REPORT_KO.md>)
- [records/release-r04-repeat-goals-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r04-repeat-goals-20261113/REPORT_KO.md>)
- [records/release-r04-repeat-goals-20261113/SPEC_KO.md](<G:/somi/JO9sa/records/release-r04-repeat-goals-20261113/SPEC_KO.md>)
- [records/release-r05-voice-policy-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r05-voice-policy-20261113/REPORT_KO.md>)
- [records/release-r05-voice-policy-20261113/SPEC_KO.md](<G:/somi/JO9sa/records/release-r05-voice-policy-20261113/SPEC_KO.md>)
- [records/release-r05-voice-policy-20261113/THRESHOLD_PROPOSAL_KO.md](<G:/somi/JO9sa/records/release-r05-voice-policy-20261113/THRESHOLD_PROPOSAL_KO.md>)
- [records/release-r05a-auto-speech-20261113/MIGRATION_NOTES_KO.md](<G:/somi/JO9sa/records/release-r05a-auto-speech-20261113/MIGRATION_NOTES_KO.md>)
- [records/release-r05a-auto-speech-20261113/PLAN_KO.md](<G:/somi/JO9sa/records/release-r05a-auto-speech-20261113/PLAN_KO.md>)
- [records/release-r05a-auto-speech-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-r05a-auto-speech-20261113/REPORT_KO.md>)
- [records/release-version-display-242-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-version-display-242-20261113/REPORT_KO.md>)
- [records/residence-bgm-20261111/PLAN_KO.md](<G:/somi/JO9sa/records/residence-bgm-20261111/PLAN_KO.md>)
- [records/residence-bgm-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/residence-bgm-20261111/REPORT_KO.md>)
- [records/residence-bgm-feasibility-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/residence-bgm-feasibility-20261108/REPORT_KO.md>)
- [records/sfx-hooks-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/sfx-hooks-20261108/REPORT_KO.md>)
- [records/sfx-runtime-fix-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>)
- [records/shlyapkin-rating-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/shlyapkin-rating-20261111/REPORT_KO.md>)
- [records/trait-stage-audit-20261112/APPROVED_PLAN_KO.md](<G:/somi/JO9sa/records/trait-stage-audit-20261112/APPROVED_PLAN_KO.md>)
- [records/trait-stage-audit-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/trait-stage-audit-20261112/REPORT_KO.md>)
- [records/ui-focus-repaint-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/ui-focus-repaint-20261111/REPORT_KO.md>)
- [records/unique-traits-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/unique-traits-20261112/REPORT_KO.md>)
- [records/wish-approved-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/wish-approved-20261111/REPORT_KO.md>)
- [records/wish-discovery-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/wish-discovery-20261111/REPORT_KO.md>)
- [records/witch-coven-entry-audit-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/witch-coven-entry-audit-20261111/REPORT_KO.md>)
- [records/witch-coven-gate-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/witch-coven-gate-20261111/REPORT_KO.md>)
- [records/work-saved-dialogue-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/work-saved-dialogue-20261111/REPORT_KO.md>)
- [records/workaholic-comment-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/workaholic-comment-20261111/REPORT_KO.md>)
- [docs/session-handoffs/2026-11-08/ASSISTANT_DEVOTION_DECISION_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/ASSISTANT_DEVOTION_DECISION_KO.md>)
- [docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md>)
- [docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)
- [docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)

## 검증 범위

현재입력 해시·310로케이션·133mods 대상/문자열잔존을 읽기전용으로 새로 확인했다. 각보고서 엔진검사는 당시버전의 합성/격리범위이며 이번에는 게임을 실행하지 않았다. 개인SAV를 읽거나 쓰지 않았다. 실제GUI/청감/장기플레이·최종Full/ZIP·출고PASS·D21은별도다.

공개기준뒤 Git19커밋을 읽었다. HEAD545f8d1d이며 11월12~13일 미커밋WORK기록도함께대조했다. Git권한오류는require_escalated의읽기log로해결했다.

도구/이미지파일·보관/일정전용은다른감사범위로목록을JSON에보존했다. 임시QSP·복제JSON·합성SAV·음원사본을만들지않았다.
