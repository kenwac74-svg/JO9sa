# 2.4.2 Full 준비 상세 변경 이력 부록

2026-11-13. 최초308행과11/11후속상태를 보존하고 이후46기록을 붙였다. **과거상태/중간 대체/미구현 기획을 완성 기능으로 세지 않는다.** 현재 최종 동작은 메인 릴리즈 노트와 후속 기록을 우선한다.

## 최초 이력: 게임 99행

| ID | 날짜·분류 | 변경 | 당시 결과/11월11일 후속 결과 | 상태·남은 확인 | 근거 |
|---|---|---|---|---|---|
| H001 | 2026-11-08<br>사운드 | 채택 전투5종·몬스터18종 효과음 실제 연결 | 채택 전투5종·몬스터18종의 실제 재생 연결. 전투 판정과 처형/석방 선택 조건 유지. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_adopted_combat_monster_sfx.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H002 | 2026-11-08<br>조수 | 연금술 해제 대사와 실제 담당 전환 정합성 수정 | 조수 연금술 명령을 해제할 때의 대사가 남성판에서 "노예를 도와 포션을 만들라"로 번역되어 없는 동작을 안내했다. 해제하면 노예가 단독으로 조제하고 조수 능력치는 쓰이지 않으므로, 남녀판 모두 "조제를 그만두고 노예가 맡는다, 노예가 없으면 다시 조수"로 바로잡는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_assistant_alchemy_abort_text.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H003 | 2026-11-08<br>조수 | 실제 조제 성공일만 헌신 업무로 계산 | 조수 헌신 판정(ASSISTANT_DAILY_DEVOTION_20261108)에서 연금술은 조제 담당 지정 스위치일 뿐 매일 하는 업무가 아니므로, 그날 조수가 실험실에서 물약 조제에 성공했을 때만 업무 1개로 센다. 재료 부족으로 실패하면 세지 않으며, 표시는 판정 직후 0으로 돌린다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_assistant_alchemy_brewed_day.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H004 | 2026-11-08<br>조수 | 조수 본인의 업무로 일일 헌신 판정 | 조수의 매일 헌신 보너스가 메인 노예의 밤 규칙 수(overnight_rules_count)를 빌려 써서, 노예 없이 조수만 있으면 헌신이 오르지 않던 문제(바닐라부터)를 고친다. 조수는 자신이 실제로 맡은 업무 수(회계, 연금술[연구실], 요리[부엌], 청소, 주인 목욕[욕실], 촉수[촉수], 감독[노예], 노예 목욕[욕실+노예], 오르가슴 금지 — 같은 업무를 메인 노예가 맡고 있으면 제외)로 판정하고 기준은 노예와 같은 보통 2개/어려움 3개다. 상승량과 나머지 조건, 다른 역할은 바꾸지 않는다. 게임 UI 표시는 하지 않는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_assistant_daily_devotion.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H005 | 2026-11-08<br>사운드 | 기존 BGM MP3·효과음 WAV 및 저장 경로 이관 | 사용자 지시: 기존 BGM은 MP3, 효과음은 WAV. 기존 세이브의 음악 경로와 캐시된 음악 호출을 갱신한다. 음악 선택 조건과 효과음 역할은 유지한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_audio_formats_mp3_bgm_wav_sfx.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H006 | 2026-11-08<br>창관 준비 훅 | 중개인 대사 초기화가 퀘스트 완료를 지우던 오류 | 중개인 대사 교체(BROKER_BROTHEL_OFFER_20261108)에서 넣은 killvar 문자열 broker_quest 배열 삭제가 같은 변수의 숫자 값인 broker_quest 완료 표시까지 지워, #txt_man이 다시 읽힐 때마다 퀘스트 완료가 0으로 돌아가 창관 인수 선택지가 나오지 않았다. 새 대사가 1~9번을 모두 덮어쓰므로 killvar를 제거한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_broker_quest_killvar_fix.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H007 | 2026-11-08<br>창관 준비 훅 | 이전 세이브 창관 메뉴 아이콘 폴백 | 창관을 인수한다 선택지가 예전 세이브에서 보이지 않던 문제. 메뉴 아이콘 변수는 새 게임 시작 때 menu_icon.json에서 읽혀 세이브에 저장되므로, 예전 세이브에는 새 아이콘 변수가 비어 있어 메뉴 항목의 li가 빠졌다. 값이 비어 있으면 그 자리에서 같은 아이콘 HTML로 채운다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_brothel_icon_save_fallback.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H008 | 2026-11-08<br>창관 준비 훅 | 창관 인수 준비 항목을 골목 안으로 이동 | 창관 인수 선택지와 중개인 대사는 유지한다. 남녀 사창가 골목의 툴팁 2곳을 업데이트 예정으로 바꿨다. 실제 창관 구매·경영은 여전히 미구현이다. | 안내 수정·기능 예정<br>잔여: 일반 EXE 재시작 후 중개인 제안을 받은 상태에서 인수 선택지 툴팁 육안 확인. 창관 구현은 이번에 재개하지 않는다. | [근거1](<G:/somi/JO9sa/records/brothel-upcoming-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/brothel-upcoming-20261111/verification.json>) |
| H009 | 2026-11-08<br>창관 준비 훅 | 창관 소유 뒤 골목 일시키기 비활성 훅 | 사용자 지시: 창관 인수가 완료되면 사창가 골목의 일 시키기(남성 주인공 메뉴)를 비활성화한다. 완료 표시는 새 변수 brothel_owned이며 이후 창관 모드가 1로 설정한다. 인수 후에는 창관을 인수한다 선택지도 숨긴다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_brothel_owned_work_lock.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H010 | 2026-11-08<br>문구·아이템 | 두막 반복 납품 보상10% 누적 감액 | 두막의 오두막 노예 판매 지급액을 거래 회차마다 10%씩 감액한다(정수 내림, 하한 20스파크, 영구 누적). 누적 횟수는 기존 판매 통계 master['slaveSoldDumak']를 써서 기존 세이브의 판매 기록도 반영된다. 반복 거래로 스파크를 무한히 얻는 차익을 막는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_dumak_reward_decay.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H011 | 2026-11-08<br>사운드 | 게임오버 화면 전용 음악·효과음 | 게임오버 화면에만 gameoverbgm.mp3와 gameover.wav를 재생한다. 화면 이탈과 로드에서 정지하고 일반 전투 패배에는 연결하지 않는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gameover_audio_screen_only.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H012 | 2026-11-08<br>사운드 | 가르시드 전투 진입·확정 둔기 피해 효과음 | 사용자 게임 적용 지시. 가르시드 전투 진입과 실제 둔기 피해 발생을 소리 ON/효과음 음량에 맞춰 연결. 사용자 청감 검사는 생략. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_garsid_blunt_playback.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H013 | 2026-11-08<br>글로리아 | 2500스파크 결말의 온순 상태 안정화 | 사용자 지시: 2,500 스파크 결말은 인식 4에서도 온순함을 유지한다. 두려움과 인식이 같으면 복종중 판정이 덮어쓰므로 두려움을 5로 올리고, 두려움이 용기(기질 4+기분) 이상이면 두려움 상태가 되므로 중립 무드릿 3개(괜찮아요, 푹 쉬었어요, 푹 잤어요, 7일)로 기분을 +3에 둔다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_2500_docile.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H014 | 2026-11-08<br>글로리아 | 글로리아 가격별 기본 헌신+1 | 사용자 지시: 글로리아 영입 시 기본 헌신 등급을 선택지마다 +1(1만 2→3, 5천 1→2, 2,500 0→1). 1만 스파크로 사면 헌신 3이라 바로 조수로 바꿀 수 있다(조수 교체 조건 헌신 3 이상). CM +7 보너스와 두려움·절망 규칙은 그대로. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_base_moral_plus1.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H015 | 2026-11-08<br>글로리아 | 글로리아 이벤트 종료 뒤 일회성 힌트 제거 | 사용자 지시: 글로리아 퀘스트는 반복 퀘스트가 아니므로, 퀘스트가 끝난 뒤(jo9_gloria_event &gt; 0)에는 채용조건 대화에서 A 등급 귓속말 페이지(4페이지)를 뺀다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_hint_once.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H016 | 2026-11-08<br>글로리아 | 글로리아 가격별 초기 친밀·기분 조정 | 사용자 지시: 영입 가격에 따라 글로리아의 첫 상태를 맞춘다. 원인은 새 노예에게 붙는 낯선 세계 무드릿(neg_slave, 글로리아는 13일)으로 기분이 음수가 되어 적극적 성격(temper 4) 때문에 관심병으로 판정된 것. neg_slave를 지우고, 1만은 이사벨라 수준(습관3·이성5·본능3, 다정함·칭찬·보상 무드릿 7일), 5천은 습관2·이성3·본능2와 무드릿 2개, 2,500은 동기 없이 두려움만 최고값이 되어 온순함(순응)으로 판정되게 하고 절망은 우울증 판정을 피하려 2에서 1로 낮춘다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_join_intimacy.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H017 | 2026-11-08<br>글로리아 | 글로리아 선택지 높이와 줄 간격 조정 | 사용자 지시: 글로리아 선택지가 대사창(높이 185px) 밖으로 넘치지 않게 한다. 빈 줄을 없애고 선택지 묶음만 16px, 줄 간격 120%로 줄인다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_choice_fit.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H018 | 2026-11-08<br>글로리아 | 글로리아 선택지 페이지 초기화 임시 수정 | 후속 구현으로 대체된 중간 수정 이력이다. 해당 임시 구현을 현재 방식이나 신규 기능으로 다시 집계하지 않는다. 최초 조사 내용·비고에서 교체 이력을 확인한다. | 후속 대체 이력 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_choice_page.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H019 | 2026-11-08<br>글로리아 | 글로리아 선택지 왼쪽 정렬·가격별 색상 | 사용자 지시: 글로리아 선택지를 다른 선택지처럼 왼쪽에 맞추고 색을 넣는다(1만 녹색, 5천 파랑, 2,500 보라, 관심 없다 빨강). 엔진 기본 CSS div{margin:0 auto;display:table} 때문에 선택지 묶음이 가운데로 쏠렸으므로 그 div를 일반 블록으로 둔다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_choice_style.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H020 | 2026-11-08<br>글로리아 | 글로리아 선택지를 하단 대사창 안으로 이동 | 사용자 지시: 글로리아 선택지를 메뉴 UI가 아니라 하단 대사창에 넣는다. 3페이지 문장 아래에 선택지 링크 4개를 붙이고(스파크 부족은 회색 글자), 에르자 선택지처럼 그 페이지의 앞뒤 버튼을 숨긴다. 메뉴 페이지 5로 넘기던 처리는 뺀다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_inline_choices.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H021 | 2026-11-08<br>글로리아 | 글로리아4페이지 주인공 응답과 선택지 | 사용자 지시: 글로리아 3페이지에서 선택지를 빼고, 4페이지에 주인공 대사(내가 데려온 후임에게 자리를 내주게 됐다니 안된 일이군)를 넣어 그 아래에 선택지 4개를 보인다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_master_page.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H022 | 2026-11-08<br>글로리아 | 글로리아 경고 페이지·첫 후임 납품 정보 저장 | 글로리아 퀘스트 1단계(사용자 승인 대사). 채용조건 대화 3페이지 뒤에 A 등급 이상은 데려오지 말라는 귓속말 페이지를 넣고 기존 4·5페이지를 5·6으로 민다. 부동산에 종합 등급 A(7) 이상 비서를 처음 납품하면 후임 정보(이름, 납품일, 노예 배열 사본)를 판매로 지워지기 전에 저장한다. 대화 메뉴·선택지·NPC 교체는 다음 단계. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_stage1.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H023 | 2026-11-08<br>글로리아 | 임시 글로리아 이벤트 준비 버튼 | 임시 테스트용(배포 전 제거). 부동산 메뉴에 [테스트] 글로리아 퀘스트 준비 버튼을 넣는다. 누르면 조수(없으면 노예)를 후임으로 저장하고 납품일을 60일 전으로 둔다. 노예를 후임으로 쓰면 노예 칸을 비운다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_test_cheat.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H024 | 2026-11-08<br>글로리아 | 임시 테스트 후임 능력치 사본 보완 | 임시 테스트용(배포 전 제거). 테스트 버튼이 후임의 노예 정보도 복사해 인사말 헌신 단계를 시험할 수 있게 한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_test_cheat_copy.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H025 | 2026-11-08<br>글로리아 | 글로리아 영입 인식을 모든 가격에서4로 통일 | 사용자 지시: 글로리아는 이미 로마에서 살아 왔으므로 영입 시 인식(rational)을 가격과 관계없이 4로 맞춘다(1만 5→4, 5천 3→4, 2,500 0→4). | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_rational4.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H026 | 2026-11-08<br>글로리아 | 글로리아 첫 상담14페이지 맞춤법 | 사용자 승인: 글로리아 첫 상담 P14 끝의 드릴께요를 드릴게요로 고치고 마침표를 붙인다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_realtor_intro_p14_spelling.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H027 | 2026-11-08<br>글로리아 | 글로리아 첫 상담9페이지 띄어쓰기 | 사용자 승인: 글로리아 첫 상담 P9의 확장 하실을 확장하실로 붙여 쓴다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_realtor_intro_p9_spacing.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H028 | 2026-11-08<br>글로리아 | 글로리아 첫 상담14페이지 사용자 각색 반영 | 사용자 각색본 반영: 부동산 사무소 글로리아 첫 상담(interaction_city 1311, #txt_man 1608~1624행) 14페이지. 각본 ID dc59990424962453, 원본 records/script-review-ui-20261108/USER_REVISION_GLORIA.txt. 번역투·오타를 정리하고 임대 조건·비용 등 정보는 유지. 편집실 script-import로 현재 WORK 원문 14개 유일 재대조 후 생성. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_realtor_intro_rewrite.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H029 | 2026-11-08<br>글로리아 | 글로리아 상담6페이지2차 각색·지명 통일 | 사용자 2차 각색본 반영: 글로리아 첫 상담(interaction_city 1311) 중 S1-P5, S1-P6, S1-P7, S1-P9, S1-P10, S1-P14. 1차(2026-11-08_gloria_realtor_intro_rewrite) 반영 결과를 기준으로 재대조. 지명은 백색 도시, 개미굴, 네크로폴리스로 통일. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_realtor_intro_rewrite_2.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H030 | 2026-11-08<br>글로리아 | 후임의 저장 헌신별 전 주인 인사 | 사용자 승인 대사: 글로리아 퀘스트가 끝난 뒤 교체된 부동산 NPC(후임)가 채용조건 대화 첫 페이지에서 전 주인을 알아보고 인사한다. 넘길 때 저장한 후임의 헌신 등급으로 1 이하 건조, 2~3 살가움, 4~5 그리움과 애정 인사를 고른다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_successor_greeting.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H031 | 2026-11-08<br>글로리아 | 후임 이름 치환의 한국어 조사 오류 방지 | 사용자 지시: 후임 이름 뒤에 조사가 붙지 않게 한다. 새 대사 3곳을 조사 없는 문장으로 고치고, 기존 부동산 대사의 이름 치환은 글로리아+조사(는·가·를·의·에게)를 그녀+조사로, 화자 표시와 조사 없는 이름만 후임 이름으로 바꾼다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_successor_no_particle.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H032 | 2026-11-08<br>이미지 연결 훅 | 수녀·창녀 드레스 부품 기존 그림 연결 | 수녀 드레스와 창녀 드레스 부품의 설명 그림을 기존 PNG에 연결한다. 설명이 비면 그림도 숨기는 기존 렌더러에 맞춰 기존 아이템명을 설명에 사용한다. 가격 0과 아이템 효과는 유지한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_item_component_images.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H033 | 2026-11-08<br>단축키 | 상태 탭·지역 이동 단축키 | 키보드 단축키 추가. 주인공·노예·조수 상태창에서 좌우 화살표로 상단 탭(보관함·목표·장비·일지 / 규칙·신체·장비·오라)을 옮기고, 지역 이동 패널이 보일 때 W N B V O E R C G 키로 해당 지역 이동 버튼을 누른다. 처리는 content/js/jo9_hotkeys.js가 하고 QSP는 그 스크립트를 싣기만 한다. 엔진이 이미 쓰는 키(S·A·D 등)는 엔진이 먼저 받는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_keyboard_hotkeys.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H034 | 2026-11-08<br>단축키 | H키 귀가 단축키 | H 키로 집에 돌아가는 단축키. 도시 화면의 집으로 가기 버튼과 외양간·감옥의 집으로 돌아간다 버튼이 있는 화면에서 jo9_hotkeys.js를 싣는다. 키 처리는 JS가 툴팁이 집으로 로 시작하는 링크만 누르므로 메인 화면의 집 나가기 버튼은 건드리지 않는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_keyboard_hotkeys_home.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H035 | 2026-11-08<br>특성 | 상반 특성 생성·기존 저장 배타 처리 | 현재 WORK에 11/8 배타 패치 3블록이 있다. 생성은 겹치지 않는 각 10% 단일 추첨, allow 양방향 부여 차단, 기존 동시 보유 보정은 펠라 중독을 남기고 반사적 구역질을 제거한다. | 기존 처리 확인<br>잔여: 관련 코드·호출의 정적 확인이다. 새 엔진 실행이나 사용자 기존 세이브의 실제 보정 결과까지 확인한 것은 아니다. | [근거1](<G:/somi/JO9sa/records/constitution-hint-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/constitution-hint-20261111/oral-gag-audit.json>) |
| H036 | 2026-11-08<br>목표·의뢰 | 목표 탭을 비우던 주석 작은따옴표 수정 | SPECIAL_CLIENT_JOURNAL_20261108이 $quest_list에 넣은 주석에 작은따옴표(Spectre's)가 있어 QSP가 다음 줄까지 문자열로 읽었고, 목표 탭 전체가 빈 화면이 되었다. 주석에서 따옴표를 뺀다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_quest_list_comment_quote.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H037 | 2026-11-08<br>목표·의뢰 | 의뢰 대사 배열20줄 잘못된HTML 제거 | #static_txt의 가르시드·부셴·아라무스 의뢰 대사 20줄이 '$garsid_quest[1]&lt;br&gt; = ...'처럼 대입문 사이에 &lt;br&gt;이 끼어 값이 들어가지 않던 문제를 고친다(원본 한국어판부터 있던 손상). 대사 내용은 바꾸지 않는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_static_offer_arrays.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H038 | 2026-11-08<br>목표·의뢰 | 색 강조 없는 의뢰11건만 요구·보상 요약 | 조건의 색 강조가 있는 의뢰 대사는 유지하고, 색 강조가 없는 11개 의뢰만 NPC의 요구와 보상으로 요약한다. 실제 NPC 대사·진행 조건·목록·저장 형식·CSS는 유지한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_uncolored_goal_summaries.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H039 | 2026-11-09<br>정산 | 지출 총계 마이너스 부호 | 지난 주기 지출내역의 총계를 지출임이 보이도록 마이너스로 표시한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_bill_total_sign.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H040 | 2026-11-09<br>글로리아 | 글로리아 결과3단계 그림 연결 | 대사 편집실: interaction_result_city 3단계 이미지 연결 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_gloria_image_reference.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H041 | 2026-11-09<br>글로리아 | 글로리아 영입 복장·장신구 착용 | 사용자 지시: 글로리아는 옷을 입은 채로 온다. 명주 의상(cocktail_dress), 하이힐(high_heels), 보석 목걸이(incrusted_necklace), 우아한 반지(plain_ring, 왼손)를 착용시킨다. 명주 의상 그림은 2341_Gloria.json의 indpack_cocktail에 초록 원피스(비서 복장 그림)를 등록해 보인다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_gloria_join_outfit.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H042 | 2026-11-09<br>글로리아 | 글로리아 사무소5년 근무 대사 | 사용자 승인 대사: 글로리아 사정 대화 2페이지에 5년을 일한 사무소에서 팔려 가는 푸념을 넣는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_gloria_talk_five_years.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H043 | 2026-11-09<br>글로리아 | 글로리아 임시 테스트 버튼·함수 제거 | 사용자 지시: 글로리아 퀘스트 테스트가 끝났으므로 임시 테스트 선택지([테스트] 글로리아 퀘스트 준비)와 그 함수를 삭제한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_gloria_test_cheat_removed.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H044 | 2026-11-09<br>문구·아이템 | 고기 이름·재고·설명 감지 표기 통일 | 육류 표기를 다진고기·보통 살코기로 통일: 도축장 구매 메뉴, 냉장고 재고 표시, 식품점·도축장 재고 설명, 구매 후 문구와 해당 설명 감지 정규식. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_meat_name_unify.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H045 | 2026-11-09<br>문구·아이템 | 조용히 명령 중 중요 경고는 항상 표시 | 조수·노예 조용히 명령이 켜져 있어도 경고·사건 알림(사망, 도주·자살, 굶주림 경고, 규칙 위반, 월경, 산란, 촉수 성장·사망, 소 탈출, 기생충 경고)은 하루 종료 화면에서 항상 보여 준다. 요리·청소·목욕 같은 일상 장면은 그대로 조용히 규칙을 따른다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_quiet_info_always.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H046 | 2026-11-09<br>소문 | 현재 노예 대상 소문·주인공 전공 질문 | 사용자 지시: 소문을 현재 노예 칸의 노예에 대해서만 말하게 하고(보유 인물 전체 순회 제거), 첫 페이지에 주인공이 NPC에게 내 노예 이름과 잘하는 전공(slave_specialisation 3 이상, 최대 3개, 조수 전공 판정과 같은 값)을 말하며 값을 잘 쳐주는 곳을 묻는 대사를 넣는다. 표식 @M@로 시작하는 소문 페이지는 주인공 화자로 출력한다. NPC 답변 문장은 아직 바꾸지 않았다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_rumor_current_slave_ask.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H047 | 2026-11-09<br>소문 | 소문값 항상 지불·메타 안내 제거 | 사용자 지시: 소문값은 조언이 없어도 항상 받는다(노예가 없어도 받고, 소문값은 내지 않았다 안내 제거). 소문이 비면 NPC가 요즘은 귀담아들을 만한 소문이 없다고 말한다. 목표 탭 같은 게임 밖 안내는 NPC 대사에서 모두 없앤다(의뢰 손님 페이지는 직접 찾아가 이야기를 들어 보라는 말로 끝낸다). 기본 원칙: 메타 발언 금지. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_rumor_fee_always_no_meta.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H048 | 2026-11-09<br>소문 | NPC 소문 말투·길드 추천 문장 | 사용자 지시: 소문 NPC 답변을 소문 투로 고친다. 길드가 가장 잘 쳐준다고 권하되, 근방 구매자가 원하면 그 이름(가장 높은 구매가를 내는 1명)도 함께 말한다. 근방 구매자만 있는 경우, 아무도 없는 경우 문장도 같은 투로 바꾼다. 아네스는 기존처럼 존댓말 치환을 쓴다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_rumor_npc_lines.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H049 | 2026-11-09<br>소문 | 소문을 하단 대사창 페이지로 표시 | 사용자 지시: 소문을 듣는다(스컵스·바텐더 작크·아네스)에서 다음 소문을 메뉴 UI가 아니라 하단 대사창의 페이지 넘김 화살표로 읽는다. 소문 보기를 interaction_city 951560으로 넘겨 소문 페이지 전체를 $text 대사 페이지로 만들고, 마지막 페이지를 넘기면 각 NPC 메뉴로 돌아간다. 아네스 말투 치환은 기존 보기 화면과 같다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_rumor_paged_message.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H050 | 2026-11-09<br>소문 | 일반 구매자 대신 의뢰43건 충족 안내 | 사용자 지시: 소문에서 일반 구매자 이름을 빼고 길드 권유만 남기며, 보상·스토리가 있는 의뢰 손님(목표 탭 특별 고객 의뢰)을 한 명당 한 페이지씩 안내한다. 대상은 이미 만나 목표 탭에 올라 있고(special_goal_status) 일반 구매 조건 데이터가 있어 판정 가능한(buyer_demand와 demand_rating 보유) 43건이며 현재 노예 칸의 노예가 full 조건을 충족할 때만 나온다. 전용 조건 코드를 쓰는 의뢰 40명은 제외. 세 NPC가 같은 목록을 들려 준다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_rumor_quest_clients.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H051 | 2026-11-09<br>글로리아 | 스컵스의 미완료 글로리아 소문 | 사용자 지시: 글로리아 퀘스트 안내. 스컵스의 소문 마지막 페이지에 부동산 중개업소 주인이 글로리아를 팔려 한다는 소문을 붙인다. 퀘스트가 끝나면(jo9_gloria_event &gt; 0) 나오지 않는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_rumor_skups_gloria.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H052 | 2026-11-09<br>이미지 연결 훅 | 편집실 결과5단계 그림 연결 | 대사 편집실: interaction_result_city 5단계 이미지 연결 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage5.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H053 | 2026-11-09<br>이미지 연결 훅 | 편집실 결과6단계 그림 연결 | 대사 편집실: interaction_result_city 6단계 이미지 연결 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage6.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H054 | 2026-11-09<br>이미지 연결 훅 | 편집실 결과4단계 그림 연결 | 대사 편집실: interaction_result_city 4단계 이미지 연결 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_sync.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H055 | 2026-11-10<br>개인실 업무·인테리어 | 알바 물품 종류별 보고 문장 | F-6: 알바(일용직) 보고 끝에 받아 온 물건 종류(식재료/연금 재료/물약)에 따른 한 문장을 덧붙인다. 종류는 메이드 데이터 duty_goodskind(0 없음, 1 식재료, 2 연금 재료, 3 물약)에 저장하며 예전 세이브는 0이라 문장이 없다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_daywork_goods_kind.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H056 | 2026-11-10<br>사운드 | 업무 결과·10일 장부 효과음3종 | bad_secen/great-success/ledger 3종을 PCM 16bit 44.1kHz WAV로 변환하고 실제 보고/장부 PLAY 경로를 WAV로 연결했다. 원본 MP3는 보존했다. | 후속 반영·청감 대기<br>잔여: 격리 엔진 호출/음소거·우선순위·경로·볼륨은 확인했으나 실제 청취와 정상 세이브 플레이는 미확인. 음원 Git 업로드/커밋은 하지 않았다. | [근거1](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/verification.json>)<br>[근거3](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/native-after.json>) |
| H057 | 2026-11-10<br>개인실 업무·인테리어 | 안개 수확 뒤 부상 보고·부상컷 유지 | 안개 경계 탐색에서 부상과 수확이 같은 날 나올 때, 수확 보고가 먼저 나오고 부상 문장이 이어서 덧붙는다. 컷은 부상한 날 부상 컷을 쓴다. 판정·확률·금액은 그대로다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_fog_injury_after_haul.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H058 | 2026-11-10<br>단축키 | 좌우 방향키 일반 페이지 넘김 | 페이지 이동 표시(다음·뒤로 마크)가 나오는 화면에서 좌우 화살표 키로 쪽을 넘긴다. 처리는 content/js/jo9_hotkeys.js의 pageMove가 하고, 모든 화면이 부르는 _layout이 그 스크립트를 싣는다. 상태창의 탭 이동 단축키는 그대로 우선한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_page_hotkeys.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H059 | 2026-11-10<br>개인실 업무·인테리어 | 개인실 메뉴·상호작용에도 단계 배경 | 개인실 인테리어 단계 그림을 개인실 메뉴 화면과 개인실에서 시작하는 상호작용 장면(place slave_private_roomN)의 배경에도 쓴다. 파일이 없으면 기존 sboudoir 그림으로 돌아간다. 방 배정 화면(interaction 7771x)의 sboudoir는 그대로 둔다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_private_room_scene_bg.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H060 | 2026-11-10<br>개인실 업무·인테리어 | 업무 상황별 승인 문안 무작위 변형 | 개인실 업무의 상황 묘사를 상황별 여러 문안으로 늘려 무작위로 보여 준다. 장문형은 주인공 매력이 인상적 이상일 때만 섞인다. 길거리 몸값 표현은 화대로, 국·이불·곳간·의원은 세계관에 맞게 수프·담요·저장고·병원으로 바꿨다. 확률·금액·조건은 그대로다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_room_duty_text_variants.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H061 | 2026-11-10<br>안정성 | 업무 결과음 문자열 지역변수 수정 | 개인실 업무 결과음 경로를 지역 문자열 변수로 통일한다. 기존 결과별 음원 경로·음소거 조건·재생 호출은 유지한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_stability_01_duty_sound.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H062 | 2026-11-10<br>안정성 | 외근 중 요리·청소 중복 방지 | 외근 2~4 지정 시 기존 요리·청소 지시와 집안일 소유 플래그를 해제한다. 구 저장의 외근 메이드는 요리·청소 담당자 선택에서 제외한다. 내근과 기존 다른 업무 우선순위는 유지한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_stability_02_external_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H063 | 2026-11-10<br>안정성 | 하드 증축비 환급8경로 수정 | 개인실 증축 철거·이주 처분가의 8개 경로에 기존 증축비와 같은 하드 1.5배를 적용한다. 20% 환급은 일반 1000/400/1000/2000, 하드 1500/600/1500/3000이다. 인테리어 환급은 이미 적용된 배수를 유지한다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_stability_03_room_refunds.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H064 | 2026-11-10<br>개인실 업무·인테리어 | 길거리 빈손 날 전용 컷 | 길거리 업무에서 수입이 없던 날(빈손)에는 정산 컷신 street_empty를 보여 준다. 그림이 없으면 기존 화면이 그대로 남는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_street_empty_scene.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H065 | 2026-11-10<br>개인실 업무·인테리어 | 길거리 초대박 기존 용품17종 획득 | 길거리 업무에서 초대박이 나면 성 관련 용품 1개를 받아 온다(쉬움·보통 100%, 하드 50%). 처리는 안개 경계 소지품과 같은 방식(암시장 판매 60% 또는 보관 선택, 보관 위치 이름은 용품함)이다. 용품 풀 17종은 기존 아이템 ID를 쓴다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_street_sex_items.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H066 | 2026-11-08<br>목표·의뢰 | 특별 고객85개 기존 이름표 정리 | 지역 또는 소속 + 직함 + NPC 이름으로85개 기존 이름표를 통일. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_special_client_journal.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H067 | 2026-11-08<br>목표·의뢰 | 특별 고객11건 등록해 총96건 | 아라무스·부셴·가르시드·발리오스·그라쿠스·가이우스·바르바르 왕·두막·인형술사·스펙터 경·파멜라를 등록해96건. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_special_client_journal.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H068 | 2026-11-08<br>목표·의뢰 | Sp.·스펙터 최상위 중복 표시 제거 | 특별 고객 목록으로 묶어 표시하며 실제 퀘스트 진행 조건은 유지. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_special_client_journal.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H069 | 2026-11-08<br>창관 준비 훅 | 개인실 기존 일일 수입 블록 삭제 | 메이드 승진 단계인 개인실의 해당 수입 블록을 제거하고 옛 세이브 postitute_rule을 로드 시0으로 초기화. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_broker_brothel_offer.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H070 | 2026-11-08<br>창관 준비 훅 | 창관 인수·소유 후 메뉴는 준비 훅 | 실제 구매·명명·관리 메뉴를 구현한 상태로 바꾸지 않는다. 미래 업데이트 선택지와 준비 훅을 유지하고 툴팁만 업데이트 예정으로 정정했다. | 안내 수정·기능 예정<br>잔여: 실화면 툴팁 확인. 창관 전체 기능은 사용자 결정에 따라 향후 업데이트 대상이다. | [근거1](<G:/somi/JO9sa/records/brothel-upcoming-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/brothel-upcoming-20261111/verification.json>) |
| H071 | 2026-11-08<br>글로리아 | 첫 A이상 비서 납품 후임 정보 보존 | 첫 종합A(7)이상 비서 납품 시 판매 직전에 이름·날짜·그림·배열 사본을 저장. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_stage1.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H072 | 2026-11-08<br>글로리아 | 60일 후 빈 노예 칸에서 이벤트 개시 | 후임 납품60일 후,현재 노예 칸이 비고 jo9_gloria_event=0이면 대화 항목 표시. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_stage2.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H073 | 2026-11-08<br>글로리아 | 1만·5천·2500 가격별 영입 조건 | 1만은 성공,5천은 brand_reputation 또는 guild_reputation=5,2500은 같은 평판과 cruel_mercy&lt;=-30 필요. 성공 시에만 결제·2341전환,실패/거절도 이벤트 종료. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_stage2.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H074 | 2026-11-08<br>글로리아 | 모든 결말 뒤 부동산 후임 교체 | 성공·거절·협상 실패 뒤 저장된 후임 이름/그림 적용,계약 서비스는 후임 비성적 장면. 별도 jo9_gloria NPC는 이벤트용 보존. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_quest_stage2.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H075 | 2026-11-08<br>글로리아 | 최종 영입 초기 상태 수치 | 기본 헌신3/2/1,인식 모두4,습관3/2/0·본능3/2/0. 신규 neg_slave 제거.2500은 두려움5·절망1·중립7일 무드릿3개. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-08_gloria_2500_docile.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H076 | 2026-11-09<br>개인실 업무 | 업무 선택과 일일 재검사 | room1~4 duty0없음/1집안일/2안개/3길거리/4알바. 조건 미달은 해제,외근 행동력3미만·상처2이상은 쉼,집안일 중복 방지. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H077 | 2026-11-09<br>개인실 업무 | 집안일 전담과 기존 담당자 우선순위 | service·cook4이상인 메이드1명이 집안일 전담이면 요리·청소에서 먼저 선택. 추가 행동력 대신 기존 가사 소모,수동 아이콘 숨김. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H078 | 2026-11-09<br>개인실 업무 | 집안일 기분·예외 보고 | mood rate 기본-5,하녀 적성/노예근성0,워커홀릭+5,게으름-10. 기본 보고 대신 실패·휴식과 헌신5의10%관심 대사. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H079 | 2026-11-09<br>개인실 업무 | 알바 자격·성과 확률 | 워커홀릭 행복 컷의 주석을 중급 이상에서 빈손이 아닌 성과로 바로잡고 결과 등급 보정이 없음을 명시했다. 기분·확률·보상·컷신 조건·표시 문구는 그대로다. | 후속 정정 완료<br>잔여: 이 주석 불일치에 대한 추가 작업 없음. 기존 알바 실제 플레이 확인과는 별개다. | [근거1](<G:/somi/JO9sa/records/workaholic-comment-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/workaholic-comment-20261111/verification.json>) |
| H080 | 2026-11-09<br>개인실 업무 | 알바 식재료·연금 보상 | 식재료80%/연금20%. 식재료는5개 묶음2/3/5/12개,유제품 포함·고기 제외. 연금 소/중/대는 서로 다른5개 묶음1/2/3개,초대박은 기존 제조 물약1개. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H081 | 2026-11-09<br>개인실 업무 | 알바 적성·창고·하드 보정 | 요리적성 식량+20%,연금적성 재료+20%,사무적성 양쪽+10%. 냉장고/연구실 용량 한도,하드50%와 물약50%취소,overflow 보고. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H082 | 2026-11-09<br>개인실 업무 | 길거리 업무 성과·수입 | 행동력3,보통 확률8/40/34/15/3%,소16~22·중23~30·대35~45·초대박56~64. 절세미인+20%,grace±10%,하드절반. 명기값4는 대이상15:3재추첨(하드50%). | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H083 | 2026-11-09<br>개인실 업무 | 길거리 업무 자격·상태 연계 | 기술3종4이상,virginity&lt;=1·어린연령 제외. 성향별 기분·기존 중독 위안 상태와 정상 주기 판정 연계. 의학적으로 확인한 임신이면 업무 해제. 질병/평판 변화 없음. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H084 | 2026-11-09<br>개인실 업무 | 안개 업무 자격·수입·장비 보정 | 체력·전투4이상·무기와 갑옷 필수. 행동력3. 기본확률25/28/30/14/3%,소11~20·중25~37·대44~66·초대박55. 무기1~5등급 대/초대박 배율0.7/0.85/1/1.2/1.4. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H085 | 2026-11-09<br>개인실 업무 | 안개 부상과 밤 회복 순서 | 기본15%를 갑옷1~6등급1.3/1.15/1/0.85/0.7/0.55 및 체질·용기로 보정. 수확과 별개 판정,밤 회복 뒤1~3단계 부상 반영. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H086 | 2026-11-09<br>개인실 업무 | 안개 아이템 획득과 처리 방식 | 보통 난이도의 조건부 추첨 29%는 유지한다. 빈손 제외 75%를 곱한 실제 외출당 획득률은 21.75%이며 약 25%라는 인계 설명을 정정했다. | 후속 정정 완료<br>잔여: 이번 설명 정정의 추가 작업 없음. 게임 확률이나 아이템 개편은 변경하지 않았다. | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/jo9-post3-20261110/REPORT_KO.md>) |
| H087 | 2026-11-09<br>개인실 업무 | 저장 식재료 추가 소비·공로 연결 | 개인실 주민1명당 재고가 많은 식재료2개/일 소비,재고 없으면 건너뜀. 기존 식비2/4/8유지. 외근 성과 tier를 virtue로 연결해 기존 칭찬으로 처리. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H088 | 2026-11-09<br>개인실 업무 | 업무 결과 컷 선택과 변형 | 업무·성과·성향·부상·휴식에 따라daywork/fog/street 컷 선택. NAME및(2)~(5)존재 파일 중 무작위,없으면 이전 화면. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H089 | 2026-11-09<br>정산 | 10일 장부4분류와 실제 정산 완료 | 지출→축사·개인실 수입→현물(있을 때)→결산 페이지. 마지막에 decade증가·축사수익지급·청구액차감·파산처리 원래 동작 실행. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_decade_ledger.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H090 | 2026-11-09<br>정산 | 현물과 현금 구분·누적 초기화 | street/fog/item매각은 금액합산,재료/보관물품은 수량만 별도. 장부 생성 뒤jo9_led_street/fog/item/mat/keep초기화. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_decade_ledger.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H091 | 2026-11-09<br>정산 | 집별 장부 배경과 폴백 | jo9_ledger_&lt;estate소문자&gt;.png→genericjo9_ledger.png→서재 배경. 집 기준이며 무작위집 선택 아님. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_decade_ledger.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H092 | 2026-11-10<br>개인실 인테리어 | 방별 인테리어 구매·처분 규칙 | 기본0→스탠다드1000/퀄리티2500/럭셔리5000. 쿨라에서방선택·단계선택·미리보기·확인. 단계건너뛰기허용/하향불가. 파산처분50%,방철거/이주초기화. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_private_room_interior.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H093 | 2026-11-10<br>개인실 인테리어 | 단계별 밤 효과·하드 비용 | 밤마다mood rate+4/+8/+12(angst&lt;3),half_action-1/-2/-3. 하드효과절반. 하드 증축비·설치비1.5배,표시/조건/차감/시세동일. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_private_room_tier_effects.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H094 | 2026-11-10<br>개인실 식단 | 실제 업무일 칼로리 소비 | duty_ok=1일만집안일2/길거리·알바3/안개4소모. 부상/행동력부족휴식제외,과체중은추가소모로-6아래가지않음. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_private_room_diet.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H095 | 2026-11-10<br>개인실 식단 | 일반식 요리 등급·특별식5일 체형관리 | 일반식cooked_food&lt;=1불평,&gt;max(pride,2)맛효과. 특별식5일이상 영양사식체형관리·생리상태보정,5/10일맛효과유지. 고열량+6·가격2/4/8유지. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-10_private_room_diet.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)<br>[근거3](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거4](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H096 | 2026-11-10<br>기준 제외 | 11월6~7일 변경은3차r2에 이미 포함 | 검증된46e972bf기준에라이브러리/특성활동/만능/가격/경매순서/의뢰제한/힌트/특별고객페이지/알리만/중독/시루/파브리카/아그라바변경이이미있으므로추가분에서제외. | 기준 포함·조사 이력 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| H097 | 2026-11-10<br>기획 제외 | 월정산·전체창관·BGM순차재생은미구현 | 거주지·명성 BGM 순차 재생은 후속 승인으로 실제 WORK에 반영했다. 월정산은 아이디어 보류(D20), 창관 구매·경영은 미구현 유지 및 예정 안내, 집안일 컷은 기존 청소 조회가 이미 연결되어 추가 제작 제안을 철회했다. | 일부 완료·일부 보류<br>잔여: BGM 실제 긴 곡 청취·사용자 GUI 플레이는 미확인. 월정산·창관을 자동 구현하지 않는다. 집안일 신규 그림/연결은 잔여 과제가 아니다. | [근거1](<G:/somi/JO9sa/records/residence-bgm-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/brothel-upcoming-20261111/REPORT_KO.md>)<br>[근거3](<G:/somi/JO9sa/records/chores-clean-reuse-20261111/REPORT_KO.md>)<br>[근거4](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>) |
| H098 | 2026-11-09<br>정산 | 개인실 수입은 당일 지급·장부에서 중복 지급하지 않음 | 길거리·안개·물품매각 수입은 해당 일에 sparks로 지급하며 jo9_led_*에 표시용으로 누적한다. 장부 마지막에 다시 주는 돈은 기존 barn_total_profit뿐이고,개인실 수입은 합계에만 나타나 중복 지급하지 않는다. | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_room_duty_chores.json>)<br>[근거2](<G:/somi/JO9sa/mods/2026-11-09_decade_ledger.json>)<br>[근거3](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>) |
| H099 | 2026-11-10<br>문서·코드 대조 | 안개 소지품 획득 확률 설명과 실제값 차이 | Claude 인계의 약 25% 안내를 보통 난이도 외출당 21.75%(75% × 29%)로 바로잡았다. 게임 확률은 그대로다. | 후속 정정 완료<br>잔여: 이 문서 불일치의 추가 작업 없음. 별도 아이템·전리품 개편 보류는 유지한다. | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/jo9-post3-20261110/REPORT_KO.md>) |

## 최초 이력: 모드 도구 69행

| ID | 날짜·분류 | 변경 | 당시 결과/11월11일 후속 결과 | 상태·남은 확인 | 근거 |
|---|---|---|---|---|---|
| H100 | 2026-11-07<br>일정·워크플로 | 다음 패치 50항목 일정판 | 완료·보류·재파악·폐기·진행중 상태, 완료 취소, 차수·날짜·메모·검색·필터를 지원한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/patch-schedule-20261107/MANUAL_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/patch-schedule.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/patch-schedule-data.cjs>) |
| H101 | 2026-11-07<br>일정·워크플로 | 일정 공통 저장·충돌 방어·PC 이전 | CatalogDir/patch-schedule.json을 revision으로 검사해 원자 저장하며 JSON 가져오기/내보내기와 현재 상태를 넣은 독립 HTML을 제공한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/patch-schedule-20261107/MANUAL_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/patch-schedule.test.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/local-workspace/Build-Patch-Schedule.cjs>) |
| H102 | 2026-11-07~08<br>실행기 | 통합 실행과 편집기 실행에 일정판 포함 | 실제 편집기 주소의 /patch-schedule을 자동 열고 PatchSchedule 주소를 출력한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/tools/local-workspace/Open-Modding-Tools.ps1>)<br>[근거2](<G:/somi/JO9sa/tools/local-workspace/Start-JO9-Tools.ps1>)<br>[근거3](<G:/somi/JO9sa/records/patch-schedule-20261107/MANUAL_KO.md>) |
| H103 | 2026-11-08<br>일정·워크플로 | 패치 일정 공통 기획 아이디어 노트 | 최대 20,000자 ideaNotes와 명시적 저장 버튼을 추가하고 JSON·독립 HTML·로컬 저장에 포함한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/schedule-ideas-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/patch-schedule.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/schedule-ideas.test.cjs>) |
| H104 | 2026-11-08<br>일정·워크플로 | 오프라인 모딩 작업실 HTML | 본체·사양·이미지·QSP/Git/mods/해시/DryRun·역할·결정·검증 게이트·개별 승인·전후 변경 이력을 단일 HTML에서 관리한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/modding-workbench-20261108/README_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/modding-workbench-20261108/JO9_Modding_Workbench.html>) |
| H105 | 2026-11-08<br>일정·워크플로 | 오프라인 작업실 백업·연결 검사·인계 출력 | 초안 자동저장, JSON/자체 HTML 백업, 파일 해시·규격·decode·전후 비교, JSON 중복 키/ID/이미지 참조 검사, Markdown 인계와 수집기 근거 등록을 지원한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/modding-workbench-20261108/README_KO.md>) |
| H106 | 2026-11-08<br>대사 편집실 | 흐름 전체 각본 내보내기 | 장면·페이지·조건 대체문·장면 문구·선택지·다음 장면을 ID 있는 각본 TXT로 출력한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/script-export.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/script-export.js>) |
| H107 | 2026-11-08<br>대사 편집실 | 각색본 번호별 일괄 가져오기·반영 | 반환 각본을 페이지 ID로 원문에 짝지어 미리보기·일부 제외·승인·기존 백업/최소 mods/되돌리기와 함께 반영한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/script-import.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/script-export.test.cjs>) |
| H108 | 2026-11-08<br>대사 편집실 | 시작·마무리 대사로 선택 구간 각본 | 시작을 즉시 고정하고 분기 선택을 누적하며, 마무리 지정·탭 전환·새로고침에도 고정을 유지한다. 11/8 기능을 대체한 후속 보완이며 신규 기능 수와 중복 합산하지 않는다. | 도구 후속 반영 완료<br>잔여: 실제 게임에 사용자 각색본을 반영하는 작업은 별도 사용자 실행 대상이다. | [근거1](<G:/somi/JO9sa/records/script-route-lock-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/script-route-lock-20261110/verification.json>) |
| H109 | 2026-11-08<br>대사 편집실 | 구간 경계 제안·미해결 연결·선택 전환 방어 | 앞 시작/예상 끝을 제안하고 미응답 중 저장 잠금, 잘못 고른 길/미해결 연결 안내, 대사 전환 중 지정 잠금을 제공한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/dialogue-range-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/script-range.test.cjs>) |
| H110 | 2026-11-08<br>대사 편집실 | 정적 HTML 탭·패널과 단일 스타일시트 | index.html이 각본·수정·공유 검색·고급·저널·AI를 선언하고 workshop-ui.js가 실제 hidden 상태, workshop.css가 스타일을 소유한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/workshop-native-layout-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/index.html>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/workshop-ui.js>)<br>[근거4](<G:/somi/JO9sa/tools/text-workshop/workshop.css>) |
| H111 | 2026-11-08<br>대사 편집실 | AI 도크를 본문과 분리된 Grid 행으로 배치 | AI가 실제 두 번째 행으로 배치되며 접기·높이 조절·기억, 초안·요청·응답 상태를 보존한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/workshop-native-layout-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/dialogue-ai.js>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/workshop-ui.js>) |
| H112 | 2026-11-08<br>대사 편집실 | 선택 전달 콜백 충돌 제거 | jo9:selection 이벤트를 각본·구간·변수 검사 모듈이 독립 구독하고 저널 UI도 정적 노드를 재사용한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/workshop-native-layout-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/variable-inspector.js>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/journal-keywords-ui.js>) |
| H113 | 2026-11-08<br>대사 편집실 | 각본 탭에 그림·현재/다음·전체 흐름 복구 | 공유 navigation을 수정 패널 밖으로 옮겨 두 탭에서 현재/다음·그림·분기·전체 흐름을 확인한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/workshop-flow-restore-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/workshop-shared-flow.test.cjs>) |
| H114 | 2026-11-08<br>대사 편집실 | 카드별 구간 시작/끝·표식·단계 이동 | 카드에서 선택한 시작·분기·마무리가 실제 각본 경로로 누적된다. 앞 분기를 바꾸면 뒤 경로/끝만 정리한다. | 도구 후속 반영 완료<br>잔여: 정상 사용 중 새 문제가 발생하면 해당 각본/경로로 재현한다. 현재 새 미해결 결함으로 등록하지 않는다. | [근거1](<G:/somi/JO9sa/records/script-route-lock-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/script-route-lock-20261110/verification.json>) |
| H115 | 2026-11-08<br>대사 편집실 | 저장 없이 각본 미리보기 생성 | 독립 미리보기가 같은 경로 탐색/분기 선택으로 본문을 생성하고 파일 쓰기 없이 보여 준다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/workshop-range-output-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/range-output.cjs>) |
| H116 | 2026-11-08<br>대사 편집실 | 각본 실제 파일 저장·경로·새로고침 복원 | runtime/script-exports에 고유 UTF-8 BOM/CRLF TXT를 저장하고 전체 경로·동일 본문을 자동 펼침 미리보기와 재개방 복원에 표시한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/workshop-range-output-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/range-output.test.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/server.cjs>) |
| H117 | 2026-11-08<br>대사 편집실 | 각본 탭에서 수정본 TXT 검토·반영 | 직접 편집 후 승인 체크가 잠기는 이유와 ‘수정문 재검토’ 버튼을 반영 행에 표시한다. 재검토 뒤 체크·반영 활성화를 확인했다. | 도구 후속 반영 완료<br>잔여: 기존 사용자 각색본의 실제 QSP 반영은 검증에서 실행하지 않았다. | [근거1](<G:/somi/JO9sa/records/script-recheck-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/script-recheck-20261110/verification.json>) |
| H118 | 2026-11-08<br>대사 편집실 | 각본 ID·변수·구분선 검사 및 명시적 원문 재대조 | 기본 거부 유지하되 사용자가 켠 재대조에서 같은 위치/종류/완전 동일 원문이 유일한 경우만 연결한다. 변수 누락·추가와 0/중복/누락/없는 페이지를 차단한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/script-review-ui-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/script-import.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/script-review.test.cjs>) |
| H119 | 2026-11-08<br>대사 편집실 | 브라우저 줄바꿈·넘침 검토와 승인 무효화 | WORK의 1280×800 UI와 게임 글꼴, 740×185 대사창·종이 전체 화면을 기준으로 분량과 넘침을 보여준다. 기존 사용자 크기 설정도 유지한다. | 도구 후속 반영 완료<br>잔여: QtWebKit 최종 줄바꿈·실제 이름/변수 치환·특수 장면은 실제 게임 화면 확인 대상이다. | [근거1](<G:/somi/JO9sa/records/script-game-layout-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/script-game-layout-20261110/verification.json>) |
| H120 | 2026-11-08<br>대사 편집실 | 비교 카드 오른쪽 수정문 직접 편집 | textarea 편집이 해당 페이지 본문만 전체 각본/세션 초안에 동기화하며 카드·제외 선택을 유지한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/script-inline-edit-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/inline-script-edit.test.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/script-review.js>) |
| H121 | 2026-11-08<br>이미지 카탈로그 | WORK에서 빠진 노예 전용 보기 복구 | 설치본의 수동 데이터와 다른 영역을 보존하며 노예 보기와 기본 전체 캐릭터 필터를 복구한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-ui-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/girls-image-checklist/catalog-girls-checklist.js>) |
| H122 | 2026-11-08<br>이미지 카탈로그 | 5개 영역의 명시적 탭과 버튼 검색 | 전체 이미지·노예 이미지·추가팩·전투 MOB·처리 주석 5탭과 버튼으로 확정하는 검색을 제공한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-ui-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/catalog-native-tabs-20261108/REPORT_KO.md>)<br>[근거3](<G:/somi/JO9sa/tools/local-workspace/catalog-seed/catalog_workshop.js>) |
| H123 | 2026-11-08<br>이미지 카탈로그 | 탭별 지연 로딩과 상태·요청 경쟁 보존 | 초기 nav/빈 패널과 inert template, /catalog-tab 허용 목록으로 선택 탭만 생성한다. 초기 HTTP응답123,794바이트. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-native-tabs-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/catalog-tabs.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/local-workspace/catalog-seed/catalog-tabs.js>) |
| H124 | 2026-11-08<br>이미지 카탈로그 | 탭 구조와 생성기·기존 데이터 쓰기 호환 | 씬 생성기가 conditions template 내부만 교체하고 기존 var D/window.JO9_* 패턴·원본 JSON 배열을 유지한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-native-tabs-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/scene-image-conditions/generate.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/server.cjs>) |
| H125 | 2026-11-08<br>이미지 카탈로그 | 처리 주석130개에 권장 행동·이유·다음 할 일 | 중복후보6/비교45/아이템검토8/여성용검토8/예비보관60/연결완료3으로 안내하고 카드 바로가기를 제공한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-action-notes-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/scene-image-conditions/review-notes.json>)<br>[근거3](<G:/somi/JO9sa/tools/scene-image-conditions/review-notes.cjs>) |
| H126 | 2026-11-08<br>이미지 카탈로그 | 현재 WORK 씬 조건 정적 재분석 | 1,127개 씬 조건을 WORK/seed에 재분석하고 표시 연결728·무작위258·동적후보4·전환9·미확인128을 기록한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/scene-condition-refresh-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md>) |
| H127 | 2026-11-08<br>캐릭터 체크리스트 | 새·옛 역할 등록 병행 판정 | indpack_secr/indpack_dom 등 하나라도 있으면 역할 연결로 분류하고 effectiveRoles/menuIssue를 맞춘다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/checklist-role-status-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/girls-image-checklist/checklist-role-status.test.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/girls-image-checklist/build_inventory.py>) |
| H128 | 2026-11-08<br>캐릭터 체크리스트 | 빈 legacyFields 경고 제거 | 실제 등록만 이전 개별 장면 참고 경로로 표시한다. | 도구 구현 기록 유지<br>잔여: 특정 플레이 미표시 제보는 미재현. 당시 경고 수정과 실제 게임 장면 재현 여부는 별개다. | [근거1](<G:/somi/JO9sa/records/checklist-role-status-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/girls-image-checklist/catalog-girls-checklist.js>) |
| H129 | 2026-11-08<br>캐릭터 체크리스트 | 기존 PNG 파일 탐색·캐릭터 수동 연결 | 전신·초상·역할·상태별 의상에서 PIC 내부 PNG를 골라 JSON 경로를 저장하고 원본/이력을 남긴다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/girls-image-checklist/checklist-link-picker.js>) |
| H130 | 2026-11-08<br>캐릭터 체크리스트 | 현재 WORK JSON의 실시간 이미지 조회 | 화면 열기/상태 새로고침이 실제 JSON을 읽고 최신 참조·유효 역할·파일 인덱스를 반환한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/character-image-links-api.test.cjs>) |
| H131 | 2026-11-08~09<br>캐릭터 체크리스트 | 옷 입은 모습 슬롯과 역할 복장 공용 선택 | 알몸은 indpack_naked 우선·없으면 fullimage, 옷 입은 모습은 별도 indpack_title로 표시하고 하녀·비서·도미나 공용 지정 버튼을 제공한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md>)<br>[근거2](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거3](<G:/somi/JO9sa/tools/girls-image-checklist/catalog-girls-checklist.js>) |
| H132 | 2026-11-08~09<br>캐릭터 체크리스트 | 타이틀 지정 시 알몸 등록 보존 | 타이틀 추가 시 indpack_naked가 없으면 현재 fullimage로 채우고 기본 전신 변경 시 fullimage/기존 naked 및 이전 full과 같던 title을 맞춘다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md>)<br>[근거2](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>) |
| H133 | 2026-11-08~09<br>캐릭터 체크리스트 | generate_stock에 맞춘 무작위 분류 | 현재 generate_stock의 영 캐릭터1462까지 확대 범위와1448/1450 제외를 반영한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md>)<br>[근거2](<G:/somi/JO9sa/tools/girls-image-checklist/build_inventory.py>) |
| H134 | 2026-11-09<br>캐릭터 체크리스트 | 펠라게야2577→2585·2607 이미지 연결 공유 | 현재 펠라게야 2577→2585·2607 단방향 공유와 복제본의 같은 PNG 사용은 유지한다. 체크리스트 그룹을 일반화해 새 복제본까지 연결 변경을 전파하는 확장은 D19 사용자 보류다. | 기존 구현·확장 보류<br>잔여: 그룹 일반화는 사용자 재개 지시 전 구현하지 않는다. | [근거1](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>) |
| H135 | 2026-11-09<br>캐릭터 체크리스트 | 2341 글로리아 목록 등록 | 기존1154명을 유지해1155명으로 갱신하고 글로리아 기본/3초상/3역할 PNG 존재를 표시한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/pelageya-group-gloria-list-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/girls-image-checklist/manifest.json>) |
| H136 | 2026-11-09<br>캐릭터 체크리스트 | 전용 번호 폴더·일반 역할 경로 경고 | 전용 full/face/sex_scenes 번호폴더 유무에 따라 권장 폴더를 판정하고 카드·슬롯·목록·파일 선택 창에 경고한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/character-path-rules-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/girls-image-checklist/path-rules.test.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>) |
| H137 | 2026-11-08<br>이미지 교체 도구 | 폴더 선택으로 새 경로 이미지 저장 | ＋새 경로→폴더 탐색/하위폴더 준비→원본 파일명→규격/구도 확인→새 파일 저장을 지원한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/new-image-path-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/imgmg/workshop-new-path.js>)<br>[근거3](<G:/somi/JO9sa/tools/cut-addition/catalog_editor.js>) |
| H138 | 2026-11-08<br>이미지 교체 도구 | 새 파일 충돌 방어·경로 유지·목록 재편입 | 기존 파일명 충돌·예약명·PIC 경계를 거부하고 새 경로 선택을 유지하며 성공 파일을 공유 인덱스/현재 편집 목록에 등록한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/new-image-path-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/imgmg/workshop-new-path.test.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/imgmg/new-image-path-save.test.cjs>) |
| H139 | 2026-11-08~09<br>대사 이미지 연결 | 선택 대사 단계에 이미지 연결 API | 실제 사용 장면/페이지를 정적 확인해 $special_image_full을 넣고 기존 preview/apply/백업/최소mod/되돌리기를 재사용한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/dialogue-image-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/dialogue-image.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/dialogue-image-api.test.cjs>) |
| H140 | 2026-11-09<br>대사 이미지 연결 | 현재 이미지 지정 한 곳의 참조 경로 변경 | 그림 아래에서 기존 파일을 선택하고 같은 이미지의 여러 지정 중 원본 행/조건으로 한 곳을 골라 바꾼다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/image-reference-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/image-reference.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/flow.cjs>) |
| H141 | 2026-11-09<br>대사 이미지 연결 | 장면 이미지의 성향·보유금·계급·평판 조건과 fallback | 기존 체크리스트 조건 UI/검증을 재사용해 해당 대입문만 조건과 기본 이미지로 감싼다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/image-reference-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/catalog-cut-conditions.js>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/image-cut-condition-rules.cjs>) |
| H142 | 2026-11-09<br>원본 B컷 동기화 | 실제 원본 사본 폴더를 정상 저장소로 인정 | junction은 실제 대상, 실제 폴더는 등록 경로/원본해시를 대조해 사용하고 새 사본·B컷 생성/롤백을 지원한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/original-cuts.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/original-store.test.cjs>) |
| H143 | 2026-11-09<br>원본 B컷 동기화 | 목록 밖 등록·수동 B컷 보존 | 저장 spare와 기존 등록부가 함께 있는 목록 밖 항목을 유지하고 미등록 수동B는 덮어쓰지 않는다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/original-cuts.cjs>) |
| H144 | 2026-11-09<br>원본 B컷 동기화 | 쓰기 없는 동기화 계획·QSP/체크 버전 재확인 | register dryRun과 original-sync-plan이 후보·복사·추가/해제·해시를 읽기 전용으로 제시하고 반영 전/등록 직후 버전 충돌을 중단·복구한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/catalog-sync-version.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/text-workshop/catalog-sync-api.test.cjs>) |
| H145 | 2026-11-09<br>원본 B컷 동기화 | 체크 상태 복구와 원본 B컷48쌍 추가 | 백업과 최신9선택을 합쳐 최종1903상태, 기존237+신규48=285원본등록·44예약으로 통일했다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/catalog-sync-20261109/merge-result.json>)<br>[근거3](<G:/somi/JO9sa/records/catalog-sync-20261109/source-sync.json>) |
| H146 | 2026-11-08<br>사운드 청취 도구 | 효과음 후보·지역 BGM 청취 목록 | Pixabay 효과음 원본 링크와 WORK 지역 BGM12곡 플레이어를 묶은 청취_목록.html을 생성하고 통합 실행기에 포함한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/sound-audition/build.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/local-workspace/Open-Modding-Tools.ps1>) |
| H147 | 2026-11-08<br>사운드 청취 도구 | 내 폴더·음원 추가·후보별 파일 배정 | 폴더·복수 파일·개인 음원을 읽고 후보 A/B/BGM별62영역에 지정/해제하여 로컬 재생한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/sound-file-picker-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/sound-audition/audio-library.cjs>)<br>[근거3](<G:/somi/JO9sa/tools/sound-audition/browser.js>) |
| H148 | 2026-11-08<br>사운드 청취 도구 | 재제작·채택·보류와 설정 이전 | 한 항목 한 상태 토글, 브라우저 저장과 설정 JSON 가져오기/내보내기에 파일 메타·배정·검토 상태를 보관한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/sound-file-picker-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/sound-audition/audio-library.test.cjs>) |
| H149 | 2026-11-08<br>사운드 청취 도구 | 승인 선택 기록과 실제 본체 연결 상태 구분 | 승인 선택을 결정ID별 최초 한 번만 리뷰/배정에 합쳐 사용자 이후 재검토를 보존하고 실제 본체 연결과 구분한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/sound-adoption-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/sound-audition/approved-selections.json>)<br>[근거3](<G:/somi/JO9sa/tools/sound-audition/decision.test.cjs>) |
| H150 | 2026-11-08<br>실행기 | 정상 편집기 포트 소유 판정 | Listen 또는 해당 원격0 소켓을 검사해 올바른 PID의 서버를 정상 재사용한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/local-workspace/Start-JO9-Tools.ps1>) |
| H151 | 2026-11-08<br>실행기 | 기본 모드툴에서 인물 상태 편집기·별도 씬 추가기 제외 | 사용자 결정으로 상태편집기와 이미 HTML로 만든 씬 추가기는 기본 열기에서 제외하고 사운드/특성아이템DB를 포함한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md>)<br>[근거3](<G:/somi/JO9sa/docs/modding/MOD_TOOLS_OPEN_20261021.md>) |
| H152 | 2026-11-08<br>특성·아이템 DB | 원격 특성·아이템 열람표 반입과 최신 WORK 추출 | 특성128·아이템271을 유지하고 마법11종의 이름·설명·소모량·메뉴/시전 근거를 추가했다. ‘별도 마법 DB 없음’은 최초 조사 시점의 이력이다. | 도구 기능 추가 완료<br>잔여: 현재 QSP 전 내용을 실시간 자동 추적하는 공략이 아니다. 상위 조건·자동 시전·실제 게임 결과 전체는 검증 범위 밖이다. | [근거1](<G:/somi/JO9sa/records/game-reference-ideas-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/game-reference-ideas-20261111/verification.json>) |
| H153 | 2026-11-08<br>특성·아이템 DB | 발현·치료·획득처와 정확한 현재 조건 설명 | 특성128·아이템271을 유지하고 마법11종의 이름·설명·소모량·메뉴/시전 근거를 추가했다. ‘별도 마법 DB 없음’은 최초 조사 시점의 이력이다. | 도구 기능 추가 완료<br>잔여: 현재 QSP 전 내용을 실시간 자동 추적하는 공략이 아니다. 상위 조건·자동 시전·실제 게임 결과 전체는 검증 범위 밖이다. | [근거1](<G:/somi/JO9sa/records/game-reference-ideas-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/game-reference-ideas-20261111/verification.json>) |
| H154 | 2026-11-08<br>특성·아이템 DB | 읽기 서버·통합 실행·도구 ZIP | 특성/아이템/마법 개인 아이디어 작성·편집·삭제·검색·JSON 백업/추가 가져오기와 WORK runtime/ideas.json 저장을 제공한다. 생성기·도구 갱신은 개인 기록을 덮어쓰지 않는다. | 도구 기능 추가 완료<br>잔여: JSON 다운로드 실물의 저장 위치/내용과 작은 화면 실제 배치는 미확인이다. API 백업 내용 검사는 통과했다. | [근거1](<G:/somi/JO9sa/records/game-reference-ideas-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/game-reference-ideas-20261111/verification.json>) |
| H155 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 목록·큰 전신·얼굴/복장·정보 탭 레이아웃 | 왼쪽 캐릭터 목록, 중앙 기본/타이틀/하녀/비서/도미나 전신, 오른쪽 얼굴·복장, 정보/고유이야기/복제능력치 하단 탭으로 재작성한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>) |
| H156 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 전신 기본 얼굴 박스와 키보드 조작 | 전신을 넣으면151:150 박스를 대략 위치에 띄우고 이동/크기드래그·방향키1/10px·+/−·R·휠·마지막 크기 기억을 제공한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>) |
| H157 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 슬롯별 크기 맞춤·앵커/여백 정렬 | 배율/X/Y·드래그/휠/키/숫자·정수리/하단·정수리/턱·투명여백·기본비율·수치복사·저장수치 적용을 추가한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/align_core.py>)<br>[근거3](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>) |
| H158 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 고유 이름·slug·이야기·복제 능력치 편집 | 표시이름/영문파일명/고유ID와 이야기3문단, 복제본 정수 seed 능력치를 별도 편집한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>) |
| H159 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 원본 이미지 경로 공유 고유 캐릭터 복제 | 현재 펠라게야 2577→2585·2607 단방향 공유와 복제본의 같은 PNG 사용은 유지한다. 체크리스트 그룹을 일반화해 새 복제본까지 연결 변경을 전파하는 확장은 D19 사용자 보류다. | 기존 구현·확장 보류<br>잔여: 그룹 일반화는 사용자 재개 지시 전 구현하지 않는다. | [근거1](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>) |
| H160 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 체크리스트와 같은 이미지 저장 의미·폴더 규칙 | 전용 번호폴더, 일반 title/알몸/역할 폴더와 naked/title 연동을 체크리스트와 맞추고 기존 연결은 같은 경로 교체·규칙밖은 경고한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>) |
| H161 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 공유 이미지 대상 표시와 저장/삭제 확인 | 같은 PNG를 쓰는 다른 ID를 전신 아래에 표시하고 교체/삭제 직전 확인한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>)<br>[근거3](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>) |
| H162 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 통합 작업 로그와 캐릭터별 맞춤수치 | 사람용md/프로그램용jsonl/ID·슬롯별수치JSON에 입력·앵커·변환·경로/해시·JSON전후·공유·경고·오류와 save_start/save를 남긴다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/tool_log.py>)<br>[근거3](<G:/somi/JO9sa/tools/character-image-adder/.gitignore>) |
| H163 | 2026-11-09~10<br>캐릭터 이미지 추가기 | 기존 규격 통일기 기록 가져오기 | 버튼으로 기존 기록을 통합 로그에 합치고 UTC→현지시각 변환을 지원한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/tool_log.py>) |
| H164 | 2026-11-10<br>이미지 등록 워크플로 | 개인실 장면·인테리어 카탈로그/개인패치 등록 스크립트 | register.cjs/register_interiors.cjs가 기본dry-run/--apply로 신규 경로만 코드·진행기록·개인패치 create이벤트에 등록한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/register.cjs>)<br>[근거3](<G:/somi/JO9sa/records/scene-home-catalog-20261110/register_interiors.cjs>) |
| H165 | 2026-11-10<br>캐릭터 이미지 추가기 | 연결 해제·전체 삭제 시 공유 PNG 보존 | 모든 이미지 참조·같은 물리경로별칭·ID0·옛 암묵초상·같은ID역할공유를 검사해 연결/JSON만 지우고 공유PNG를 남긴다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>)<br>[근거3](<G:/somi/JO9sa/tools/character-image-adder/test_character_safety.py>) |
| H166 | 2026-11-10<br>캐릭터 이미지 추가기 | 이름·slug·ID·이야기 초안 손실 방지 | 입력 모두 dirty감지에 포함하고 이동/닫기뿐 아니라 복제시작도 확인한다. 취소 시 입력/이미지 상태 보존, 복제 carried원고는 저장/원복 전까지 dirty를 유지한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/character_editor_ui.py>)<br>[근거3](<G:/somi/JO9sa/tools/character-image-adder/test_character_safety.py>) |
| H167 | 2026-11-10<br>이미지 등록 워크플로 | 둘째 등록 묶음과 무변경 재실행 보존 | 경로+파일해시 기반 묶음ID와 공통 register-batch helper로 매 묶음을 기록하고 기존등록 반복은 NO_CHANGES로 모든 쓰기 없이 종료한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/register-batch.cjs>)<br>[근거3](<G:/somi/JO9sa/records/scene-home-catalog-20261110/registration.test.cjs>) |
| H168 | 2026-11-10<br>도구 검증 | 실제 WORK 공유이미지 dry-run 및 도구 회귀 근거 | 합성 캐릭터23검사·등록6검사와 실제공유이미지dry-run 보존, 두실제등록묶음 NO_CHANGES를 기록한다. | 도구 구현 기록 유지 | [근거1](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/verification.json>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/test_character_safety.py>)<br>[근거3](<G:/somi/JO9sa/records/scene-home-catalog-20261110/registration.test.cjs>) |

## 최초 이력: 이미지·사운드 140행

| ID | 날짜·분류 | 변경 | 당시 결과/11월11일 후속 결과 | 상태·남은 확인 | 근거 |
|---|---|---|---|---|---|
| H169 | 2026-11-07<br>배포 기준 | 3차r2 출시 누적 기준 | 3차r2 이미지831/JSON1158/QSP1/도구419/총2409 | 기준 포함·조사 이력 | [근거1](<G:/somi/JO9sa/docs/CUMULATIVE_CHECK_20261107_KO.md>)<br>[근거2](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H170 | 2026-11-08<br>카탈로그 | 추가팩 미리보기 WORK 실시간 전환 | original=0 WORK API사용/108내장미리보기제거/메타데이터갱신 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/additional-pack-work-preview-20261108/REPORT_KO.md>) |
| H171 | 2026-11-08<br>캐릭터 이미지 | 1031 조수 의상·전용 장면 조사 | 90계열617장면등록/전신71참조포함688PNG무결성;72의상조건+90단독장면호출정상 | 검토 기록 유지<br>잔여: 특정 플레이 미표시 제보는 미재현. 당시 경고 수정과 실제 게임 장면 재현 여부는 별개다. | [근거1](<G:/somi/JO9sa/records/character-1031-assistant-audit-20261108/REPORT_KO.md>) |
| H172 | 2026-11-08<br>초상 | 전신과 초상 동기화 1203 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H173 | 2026-11-08<br>초상 | 전신과 초상 동기화 1451 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H174 | 2026-11-08<br>초상 | 전신과 초상 동기화 1452 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H175 | 2026-11-08<br>초상 | 전신과 초상 동기화 1453 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H176 | 2026-11-08<br>초상 | 전신과 초상 동기화 1454 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H177 | 2026-11-08<br>초상 | 전신과 초상 동기화 1455 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H178 | 2026-11-08<br>초상 | 전신과 초상 동기화 1456 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H179 | 2026-11-08<br>초상 | 전신과 초상 동기화 1457 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H180 | 2026-11-08<br>초상 | 전신과 초상 동기화 1458 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H181 | 2026-11-08<br>초상 | 전신과 초상 동기화 1459 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H182 | 2026-11-08<br>초상 | 전신과 초상 동기화 1460 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H183 | 2026-11-08<br>초상 | 전신과 초상 동기화 1461 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H184 | 2026-11-08<br>초상 | 전신과 초상 동기화 1462 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H185 | 2026-11-08<br>초상 | 전신과 초상 동기화 2325 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H186 | 2026-11-08<br>초상 | 전신과 초상 동기화 2326 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H187 | 2026-11-08<br>초상 | 전신과 초상 동기화 2327 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H188 | 2026-11-08<br>초상 | 전신과 초상 동기화 2328 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H189 | 2026-11-08<br>초상 | 전신과 초상 동기화 2329 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H190 | 2026-11-08<br>초상 | 전신과 초상 동기화 2330 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H191 | 2026-11-08<br>초상 | 전신과 초상 동기화 2331 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H192 | 2026-11-08<br>초상 | 전신과 초상 동기화 2332 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H193 | 2026-11-08<br>초상 | 전신과 초상 동기화 2334 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H194 | 2026-11-08<br>초상 | 전신과 초상 동기화 2335 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H195 | 2026-11-08<br>초상 | 전신과 초상 동기화 2336 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H196 | 2026-11-08<br>초상 | 전신과 초상 동기화 2337 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H197 | 2026-11-08<br>초상 | 전신과 초상 동기화 2338 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H198 | 2026-11-08<br>초상 | 전신과 초상 동기화 2575 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H199 | 2026-11-08<br>초상 | 전신과 초상 동기화 2613 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H200 | 2026-11-08<br>초상 | 전신과 초상 동기화 2617 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H201 | 2026-11-08<br>초상 | 전신과 초상 동기화 3011 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H202 | 2026-11-08<br>초상 | 전신과 초상 동기화 3018 | 현재전신얼굴크롭 컬러/흑백/세피아3종 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) |
| H203 | 2026-11-08<br>초상 | 1447·1448·1450·2339·빌헬미네 초상 테두리 보완 | 원래 15개 테두리 보완 이력은 보존한다. 그중 빌헬미네 컬러/흑백/세피아3개는 현재 WORK를 소스·런타임 원장·목록 용량에 맞췄다. 새로 프레임을 합성한 작업으로 세지 않는다. | 현재 WORK 소스 보존<br>잔여: 해당 동기화는 게임 PNG를 바꾸지 않았으므로 새 시각 QA는 수행하지 않았다. | [근거1](<G:/somi/JO9sa/records/work-image-source-sync-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/work-image-source-sync-20261110/audit.json>) |
| H204 | 2026-11-08<br>초상 | 초상과 테두리 중복 수량 | 93크롭+15테두리전용=108파일;90프레임중75는크롭과겹침 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/portrait-sync-20261108/verification.json>) |
| H205 | 2026-11-08<br>이미지 | 도서관 도시 아이콘2경로 교체 | [object Object]<br>[object Object] | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) |
| H206 | 2026-11-08<br>이미지 | 2331 초상3종 후속교체 | [object Object]<br>[object Object]<br>[object Object] | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) |
| H207 | 2026-11-08<br>이미지 | 뱀자리 이동 V 아이콘 교체 | 1501B | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) |
| H208 | 2026-11-08<br>이미지 | 중개인 그림·아이콘 교체 | [object Object]<br>[object Object] | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) |
| H209 | 2026-11-08<br>이미지 | 중개인 그림·아이콘 교체 | ui/legacy_overhaul/broker.png의 현재 WORK PNG를 원래 바이트 그대로 소스와 원장에 보존했다. 카탈로그 연결·체크 상태·QSP는 유지했다. | 현재 WORK 소스 보존<br>잔여: 새 그림 제작/게임 이미지 교체가 아닌 소스 보존 작업이다. | [근거1](<G:/somi/JO9sa/records/work-image-source-sync-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/work-image-source-sync-20261110/audit.json>) |
| H210 | 2026-11-08<br>이미지 | 펠라게야 누락 비서복 PNG 추가 | 345977B | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) |
| H211 | 2026-11-09<br>이미지 | 시루 도미나 PNG 후속교체 | 현재 1448_shiru.png를 소스/런타임 원장에 맞췄다. 이후 별도 승인으로 같은 그림을 옛 도미나 경로에도 임시 복구했다. | 현재 WORK 소스 보존<br>잔여: 옛 경로의 삭제/원장 정리는 D21 세이브 마이그레이션 검증 뒤에만 수행한다. | [근거1](<G:/somi/JO9sa/records/work-image-source-sync-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/shiru-domina-alias-20261111/REPORT_KO.md>)<br>[근거3](<G:/somi/JO9sa/records/shiru-domina-alias-20261111/verification.json>) |
| H212 | 2026-11-08<br>캐릭터 JSON | 시루1448 이미지7경로 새기준과 호환 | 옛 girls/full/mistress/1448_white_long_young.png를 현재 1448_shiru.png와 동일 바이트로 복구했다. 이전 ‘옛 도미나 누락’ 상태는 해소했다. 현재 그림·JSON·다른6쌍의 보존 결정은 유지했다. | 호환 복구·정리 보류<br>잔여: 모든 수정 완료 후 2.4.2 Full 배포 직전 세이브 참조·화면 캐시 이관을 검증한 뒤 옛 PNG와 원장 해당 항목 정리. 지금 마이그레이션/삭제는 하지 않는다. | [근거1](<G:/somi/JO9sa/records/shiru-domina-alias-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/shiru-domina-alias-20261111/verification.json>)<br>[근거3](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>) |
| H213 | 2026-11-09<br>캐릭터 JSON | 2585 펠라게야3역할 기존그림 연결 | 2577기존3PNG경로를fullmade/indpack_maid,fullsecretary/indpack_secr,fullmistress/indpack_dom에지정 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/pelageya-outfits-20261109/REPORT_KO.md>) |
| H214 | 2026-11-09<br>캐릭터 JSON | 2607 펠라게야3역할 기존그림 연결 | 2577기존3PNG경로를fullmade/indpack_maid,fullsecretary/indpack_secr,fullmistress/indpack_dom에지정 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/pelageya-outfits-20261109/REPORT_KO.md>) |
| H215 | 2026-11-09<br>캐릭터 JSON | 펠라게야 단방향 공유 그룹 | 현재 펠라게야 2577→2585·2607 단방향 공유와 복제본의 같은 PNG 사용은 유지한다. 체크리스트 그룹을 일반화해 새 복제본까지 연결 변경을 전파하는 확장은 D19 사용자 보류다. | 기존 구현·확장 보류<br>잔여: 그룹 일반화는 사용자 재개 지시 전 구현하지 않는다. | [근거1](<G:/somi/JO9sa/records/deferred-discussions-20261024/index.json>)<br>[근거2](<G:/somi/JO9sa/tools/text-workshop/character-image-links.cjs>) |
| H216 | 2026-11-09<br>카탈로그 | 2341 글로리아 이미지 목록 등록 | 글로리아의 indpack_cocktail을 현재 옷 입은 모습 characters/2341_gloria_title로 연결했다. 승인된 수동 이미지9키와 PNG5개를 보존하고 WORK/소스/원장을 맞췄다. 글로리아는 미배포 캐릭터이므로 옛4경로 부재를 공개 배포 세이브 호환 결함으로 분류했던 제안은 철회했다. | 후속 반영·화면 대기<br>잔여: EXE 재시작 후 명주 의상에서 초록 원피스가 나오는지 실제 화면 확인. 옛4경로 복구는 하지 않는다. | [근거1](<G:/somi/JO9sa/records/gloria-cocktail-title-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/gloria-cocktail-title-20261110/verification.json>) |
| H217 | 2026-11-09<br>캐릭터 JSON | 1448 indpack_title 경로 저장 | 1448 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-24-08-735Z_0ba4859d/record.json>) |
| H218 | 2026-11-09<br>캐릭터 JSON | 1448 indpack_title 경로 저장 | 1448 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-30-44-223Z_cd16a9b2/record.json>) |
| H219 | 2026-11-09<br>캐릭터 JSON | 2341 fullimage 경로 저장 | 2341 fullimage 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-58-48-043Z_c8c19b1a/record.json>) |
| H220 | 2026-11-09<br>캐릭터 JSON | 2341 indpack_maid 경로 저장 | 2341 indpack_maid 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-20-702Z_53e21ea2/record.json>) |
| H221 | 2026-11-09<br>캐릭터 JSON | 2341 indpack_secr 경로 저장 | 2341 indpack_secr 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-44-763Z_84a811fa/record.json>) |
| H222 | 2026-11-09<br>캐릭터 JSON | 2341 indpack_dom 경로 저장 | 2341 indpack_dom 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-52-655Z_6fe1999c/record.json>) |
| H223 | 2026-11-09<br>캐릭터 JSON | 2341 indpack_title 경로 저장 | 2341 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T05-00-03-550Z_c96ce963/record.json>) |
| H224 | 2026-11-09<br>캐릭터 JSON | 2572 indpack_title 경로 저장 | 2572 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T07-01-19-587Z_1ed111cd/record.json>) |
| H225 | 2026-11-09<br>캐릭터 JSON | 2573 indpack_title 경로 저장 | 2573 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T10-43-25-893Z_efd83a55/record.json>) |
| H226 | 2026-11-09<br>캐릭터 JSON | 2577 indpack_title 경로 저장 | 2577 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-11-37-001Z_e42aff84/record.json>) |
| H227 | 2026-11-09<br>캐릭터 JSON | 2579 indpack_title 경로 저장 | 2579 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-42-58-380Z_78cf4ecf/record.json>) |
| H228 | 2026-11-09<br>캐릭터 JSON | 2579 indpack_title 경로 저장 | 2579 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-47-04-943Z_e6c0b37a/record.json>) |
| H229 | 2026-11-09<br>캐릭터 JSON | 2583 indpack_title 경로 저장 | 2583 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T16-31-42-523Z_d4223ab0/record.json>) |
| H230 | 2026-11-09<br>캐릭터 JSON | 3002 indpack_title 경로 저장 | 3002 indpack_title 경로 저장 | 기존 반영 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T18-19-03-636Z_04539a5e/record.json>) |
| H231 | 2026-11-08<br>아이템 이미지 | 수녀 드레스 설명그림 연결 | 기존이름을설명/기존가격0명시/scene/item/underwear_nun.png연결 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/item-component-images-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/mods/2026-11-08_item_component_images.json>) |
| H232 | 2026-11-08<br>아이템 이미지 | 창녀 드레스 설명그림 연결 | 기존이름을설명/기존가격0명시/scene/item/slut_dress.png연결 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/item-component-images-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/mods/2026-11-08_item_component_images.json>) |
| H233 | 2026-11-09<br>원본 B컷 | 체크 상태 복구 | 최신9우선보존1832복구;최종상태1903;목록밖reserve24보존 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/catalog-sync-20261109/recovery-plan.json>) |
| H234 | 2026-11-09<br>원본 B컷 | 원본 B컷48개 물리등록 | 물리B컷48+보관원본48=96파일;최종원본285;원본없음44예약 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/catalog-sync-20261109/merge-plan.json>) |
| H235 | 2026-11-09<br>원본 B컷 | 네릴리스 주교 일반 B컷 전환 | 현재PNG유지;원본보호체크1건해제/일반B컷유지 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>) |
| H236 | 2026-11-09<br>장면 이미지 | 글로리아 특별서비스 3단계 그림 | scene/others/gloria01.png | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_gloria_image_reference.json>)<br>[근거2](<G:/somi/JO9sa/assets/content/pic/scene/others/gloria01.png>) |
| H237 | 2026-11-09<br>장면 이미지 | 글로리아 특별서비스 4단계 그림 | scene/others/gloria02.png | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_sync.json>)<br>[근거2](<G:/somi/JO9sa/assets/content/pic/scene/others/gloria02.png>) |
| H238 | 2026-11-09<br>장면 이미지 | 글로리아 특별서비스 5단계 그림 | scene/others/gloria03.png | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage5.json>)<br>[근거2](<G:/somi/JO9sa/assets/content/pic/scene/others/gloria03.png>) |
| H239 | 2026-11-09<br>장면 이미지 | 글로리아 특별서비스 6단계 그림 | scene/others/gloria04.png | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage6.json>)<br>[근거2](<G:/somi/JO9sa/assets/content/pic/scene/others/gloria04.png>) |
| H240 | 2026-11-08<br>UI 이미지 | 깨끗한 V 아이콘 후보 | 활성 뱀자리 이동 그림은 qm_serpentine.png이고 V 아이콘 교체 이력(207행)이 있다. 별도 후보 qm_v_clean.png가 직접 참조되지 않는다는 사실만으로 현재 V 버튼 누락을 제안하지 않는다. | 수정 불필요<br>잔여: 이번 최신본 작성에서 이미지 열람·실행 화면을 재검증하지 않았다. 기존 감사 근거의 해석 정정이다. | [근거1](<C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/jo9-post3-20261110/audit-data.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/ui/jon-UIadds/qm_serpentine.png>) |
| H241 | 2026-11-08<br>화면 글자·CSS | 개인실 비활성 메뉴 글꼴 | SNK_MENU_LABEL_FONT_20261108주석+.snk_menu_label font-family:경기천년제목 Medium;text-decoration:none | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/assets/css-2.4/base.css>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/css/base.css.bak_20261108_snk_font>) |
| H242 | 2026-11-08<br>사운드 | 기존 BGM30개 형식통일 | city.mp3 음원을 추가하는 대신 도시 설정창에서 유효한 직전 곡을 유지한다. 빈 선택이나 옛 city 선택이면 기존 도시 음악 규칙으로 복구한다. 이후 거주지·명성 목록 제어까지 후속 반영했다. | 후속 반영·청감 대기<br>잔여: 일반 EXE에서 도시 설정창 진입/이탈 때 곡 유지 청취. 원래 형식 통일 작업 전체를 이번에 다시 수행한 것이 아니다. | [근거1](<G:/somi/JO9sa/records/city-settings-bgm-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/city-settings-bgm-20261111/verification.json>)<br>[근거3](<G:/somi/JO9sa/records/residence-bgm-20261111/REPORT_KO.md>) |
| H243 | 2026-11-08<br>사운드 | 게임오버 전용 BGM/SFX | gameoverbgm.mp3원본복사+gameover.wav변환;화면중BGM반복/SFX1회 | 기존 반영 기록 유지<br>잔여: 실제 게임에서 소리와 음량 청취 확인. | [근거1](<G:/somi/JO9sa/records/audio-format-normalize-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/mods/2026-11-08_gameover_audio_screen_only.json>) |
| H244 | 2026-11-08<br>사운드 | 가르시드 사용자파일 채택 | 사용자gsid.mp3보존/PCM16bit gsid.wav설치 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/sound-adoption-20261108/REPORT_KO.md>) |
| H245 | 2026-11-08<br>사운드 | 둔기 사용자파일 채택 | 사용자blunt.mp3보존/PCM16bit blunt.wav설치 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/sound-adoption-20261108/REPORT_KO.md>) |
| H246 | 2026-11-08<br>사운드 실행 연결 | 가르시드 등장/둔기 타격 실제 재생 | 새전투가르시드1회;피해발생둔기주/보조/적공격;라운드합침/최종타격결과소비 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/sfx-hooks-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/mods/2026-11-08_garsid_blunt_playback.json>) |
| H247 | 2026-11-08<br>사운드 실행 연결 | 채택 승리 실제PLAY 보완 | 기존조건/결과분기완료후기존sound_on/sound_volume으로1회PLAY | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/assets.json>)<br>[근거3](<G:/somi/JO9sa/mods/2026-11-08_adopted_combat_monster_sfx.json>) |
| H248 | 2026-11-08<br>사운드 실행 연결 | 채택 전투 패배 실제PLAY 보완 | 기존조건/결과분기완료후기존sound_on/sound_volume으로1회PLAY | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/assets.json>)<br>[근거3](<G:/somi/JO9sa/mods/2026-11-08_adopted_combat_monster_sfx.json>) |
| H249 | 2026-11-08<br>사운드 실행 연결 | 채택 처형 실제PLAY 보완 | 기존조건/결과분기완료후기존sound_on/sound_volume으로1회PLAY | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/assets.json>)<br>[근거3](<G:/somi/JO9sa/mods/2026-11-08_adopted_combat_monster_sfx.json>) |
| H250 | 2026-11-08<br>사운드 실행 연결 | 채택 석방 실제PLAY 보완 | 기존조건/결과분기완료후기존sound_on/sound_volume으로1회PLAY | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/assets.json>)<br>[근거3](<G:/somi/JO9sa/mods/2026-11-08_adopted_combat_monster_sfx.json>) |
| H251 | 2026-11-08<br>사운드 실행 연결 | 채택 치명타 실제PLAY 보완 | 기존조건/결과분기완료후기존sound_on/sound_volume으로1회PLAY | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/assets.json>)<br>[근거3](<G:/somi/JO9sa/mods/2026-11-08_adopted_combat_monster_sfx.json>) |
| H252 | 2026-11-08<br>사운드 실행 연결 | 몬스터18종 대표 등장음 | 18적키대표WAV;다적첫등록1회/가르시드우선;검투/캣파이트시작연결 | 기존 반영 기록 유지<br>잔여: 실제 게임에서 소리와 음량 청취 확인. | [근거1](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/monsters.json>)<br>[근거3](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/assets.json>) |
| H253 | 2026-11-08<br>사운드 기획 | 거주지·명성 순차 BGM | 귀족 신분·전역 평판 우선, 그 외 거주지 기본곡 뒤 기존 7지역의 명성 4 이상 곡을 중복 없이 순환한다. 기본곡 1개와 서로 다른 추가곡 3개면 총 4곡. 방문 지역 때문에 목록을 바꾸지 않고 전투·이벤트·게임오버 우선순위를 보존한다. 빈민가/백색 독립 명성값은 추가하지 않았다. | 후속 반영·청감 대기<br>잔여: 실제 긴 MP3 청취, 사용자 GUI 세이브 조작, 모든 이벤트 플레이는 미확인. 배포 전 전체 출고 검사는 별도다. | [근거1](<G:/somi/JO9sa/records/residence-bgm-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/residence-bgm-20261111/verification.json>)<br>[근거3](<G:/somi/JO9sa/records/residence-bgm-20261111/native-after.json>)<br>[근거4](<G:/somi/JO9sa/assets/bgm/residence-playlist-20261111.json>) |
| H254 | 2026-11-08<br>음원 파일 | 사운드 폴더 정리 취소 | 사운드 폴더 정리는 사용자가 취소했다. china/town을 포함한 기존 음원을 임의 이동·삭제하지 않는다. 별도 승인된 형식 변환·게임 연결과 구분한다. | 사용자 취소 유지<br>잔여: 정리 작업을 자동 재개하지 않는다. | [근거1](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md>) |
| H255 | 2026-11-08<br>배포 기준 | 사운드 Git 업로드 제외 | 사용자승인으로음원0개a0d25e4로교체;로컬WORK/assets55보존;.gitignore음원확장자제외 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/commit-handoff-20261108/audio-exclusion.json>)<br>[근거2](<G:/somi/JO9sa/.gitignore>) |
| H256 | 2026-11-10<br>사운드 | 개인실 빈손/부상 보고 효과음 | bad_secen.wav를 게임 호출에 연결했다. 해당 행의 MP3 형식 차이는 후속 변환으로 해소했으며 원본 MP3도 남겨 두었다. | 후속 반영·청감 대기<br>잔여: 격리 엔진 호출/음소거·우선순위·경로·볼륨은 확인했으나 실제 청취와 정상 세이브 플레이는 미확인. 음원 Git 업로드/커밋은 하지 않았다. | [근거1](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/verification.json>)<br>[근거3](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/native-after.json>) |
| H257 | 2026-11-10<br>사운드 | 개인실 초대박 보고 효과음 | great-success.wav를 게임 호출에 연결했다. 해당 행의 MP3 형식 차이는 후속 변환으로 해소했으며 원본 MP3도 남겨 두었다. | 후속 반영·청감 대기<br>잔여: 격리 엔진 호출/음소거·우선순위·경로·볼륨은 확인했으나 실제 청취와 정상 세이브 플레이는 미확인. 음원 Git 업로드/커밋은 하지 않았다. | [근거1](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/verification.json>)<br>[근거3](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/native-after.json>) |
| H258 | 2026-11-10<br>사운드 | 개인실 10일 장부 진입 효과음 | ledger.wav를 게임 호출에 연결했다. 해당 행의 MP3 형식 차이는 후속 변환으로 해소했으며 원본 MP3도 남겨 두었다. | 후속 반영·청감 대기<br>잔여: 격리 엔진 호출/음소거·우선순위·경로·볼륨은 확인했으나 실제 청취와 정상 세이브 플레이는 미확인. 음원 Git 업로드/커밋은 하지 않았다. | [근거1](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/verification.json>)<br>[근거3](<G:/somi/JO9sa/records/duty-ledger-wav-20261110/native-after.json>) |
| H259 | 2026-11-10<br>사운드 실행 연결 | 개인실 효과음 문자열 변수 | 대입/조건/PLAY모두$jo9_rd_snd문자열통일 | 기존 반영 기록 유지<br>잔여: 실제 게임에서 소리와 음량 청취 확인. | [근거1](<G:/somi/JO9sa/mods/2026-11-10_stability_01_duty_sound.json>)<br>[근거2](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>) |
| H260 | 2026-11-10<br>개인실 컷신 | home/daywork_empty.png | content/pic/scene/home/daywork_empty.png · 1448×1086 · 2513714B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H261 | 2026-11-10<br>개인실 컷신 | home/daywork_happy.png | [object Object]<br>[object Object]<br>[object Object] | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H262 | 2026-11-10<br>개인실 컷신 | home/daywork_normal.png | content/pic/scene/home/daywork_normal.png · 1448×1086 · 2627328B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H263 | 2026-11-10<br>개인실 컷신 | home/daywork_rest.png | content/pic/scene/home/daywork_rest.png · 1448×1086 · 2565933B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H264 | 2026-11-10<br>개인실 컷신 | home/daywork_rich.png | content/pic/scene/home/daywork_rich.png · 1448×1086 · 2815773B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H265 | 2026-11-10<br>개인실 컷신 | home/fog_empty.png | content/pic/scene/home/fog_empty.png · 1448×1086 · 2576842B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H266 | 2026-11-10<br>개인실 컷신 | home/fog_injured.png | content/pic/scene/home/fog_injured.png · 1448×1086 · 2614903B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H267 | 2026-11-10<br>개인실 컷신 | home/fog_jackpot.png | content/pic/scene/home/fog_jackpot.png · 1448×1086 · 2781209B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H268 | 2026-11-10<br>개인실 컷신 | home/fog_normal.png | content/pic/scene/home/fog_normal.png · 1448×1086 · 2707365B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H269 | 2026-11-10<br>개인실 컷신 | home/fog_rest.png | content/pic/scene/home/fog_rest.png · 1448×1086 · 2734739B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H270 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_centralkvartal_house.png | content/pic/scene/home/jo9_ledger_centralkvartal_house.png · 1448×1086 · 2860981B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H271 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_kamira_house.png | content/pic/scene/home/jo9_ledger_kamira_house.png · 1448×1086 · 2467089B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H272 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_korvus_house.png | content/pic/scene/home/jo9_ledger_korvus_house.png · 1448×1086 · 2396144B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H273 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_otchuzhdenie_house.png | content/pic/scene/home/jo9_ledger_otchuzhdenie_house.png · 1448×1086 · 2657169B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H274 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_redlight_house.png | content/pic/scene/home/jo9_ledger_redlight_house.png · 1448×1086 · 2486653B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H275 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_serpis_house.png | content/pic/scene/home/jo9_ledger_serpis_house.png · 1448×1086 · 2754758B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H276 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_slum_house.png | content/pic/scene/home/jo9_ledger_slum_house.png · 1448×1086 · 2391721B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H277 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_taurus_house.png | content/pic/scene/home/jo9_ledger_taurus_house.png · 1448×1086 · 2956116B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H278 | 2026-11-10<br>개인실 컷신 | home/jo9_ledger_white_house.png | content/pic/scene/home/jo9_ledger_white_house.png · 1448×1086 · 2999120B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H279 | 2026-11-10<br>개인실 컷신 | home/street_empty.png | content/pic/scene/home/street_empty.png · 1448×1086 · 2636190B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H280 | 2026-11-10<br>개인실 컷신 | home/street_normal.png | content/pic/scene/home/street_normal.png · 1448×1086 · 2136384B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H281 | 2026-11-10<br>개인실 컷신 | home/street_pleasure.png | content/pic/scene/home/street_pleasure.png · 1448×1086 · 2323100B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H282 | 2026-11-10<br>개인실 컷신 | home/street_pregnant.png | content/pic/scene/home/street_pregnant.png · 1448×1086 · 2356758B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H283 | 2026-11-10<br>개인실 컷신 | home/street_rest.png | content/pic/scene/home/street_rest.png · 1448×1086 · 2637907B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H284 | 2026-11-10<br>개인실 컷신 | home/street_rich.png | content/pic/scene/home/street_rich.png · 1448×1086 · 2306399B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H285 | 2026-11-10<br>개인실 컷신 | home/street_unpleasant.png | content/pic/scene/home/street_unpleasant.png · 1448×1086 · 2342215B | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) |
| H286 | 2026-11-10<br>인테리어 이미지 | interior/basic_slave_room.png | [object Object]<br>[object Object] | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT_interiors.json>) |
| H287 | 2026-11-10<br>인테리어 이미지 | interior/luxury_slave_room.png | [object Object]<br>[object Object] | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT_interiors.json>) |
| H288 | 2026-11-10<br>인테리어 이미지 | interior/quality_slave_room.png | [object Object]<br>[object Object] | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT_interiors.json>) |
| H289 | 2026-11-10<br>인테리어 이미지 | interior/standard_slave_room.png | [object Object]<br>[object Object] | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT_interiors.json>) |
| H290 | 2026-11-10<br>리소스 등록 | 개인실36PNG 복구·배포 입력명세 | WORK+개인객체36해시확인86012529B;assets/additional-resources+runtime외부입력연결 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>)<br>[근거2](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/resource-verification.json>) |
| H291 | 2026-11-10<br>리소스 등록 | 두번째 그림묶음 등록·반복 보완 | 경로+해시묶음ID/두묶음기록/반복NO_CHANGES무쓰기/객체확인후목록갱신 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/scene-home-catalog-20261110/register-batch.cjs>)<br>[근거2](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>) |
| H292 | 2026-11-10<br>개인실 컷신 | 개인실 업무·장부·인테리어 그림조회 | 기존 외근·장부·인테리어 조회를 유지한다. 개인실 1~4 자동 청소는 수동 청소 명령과 같은 clean 조회·렌더링을 이미 사용하므로 집안일 신규 그림/연결은 불필요하다. | 기존 연결 확인<br>잔여: 일반 EXE에서 실제 자동 청소가 발생한 날 해당 인물의 기존 청소 컷 육안 확인. 원래 외근·장부·인테리어 전체를 이번에 다시 플레이한 것은 아니다. | [근거1](<G:/somi/JO9sa/records/chores-clean-reuse-20261111/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/chores-clean-reuse-20261111/verification.json>) |
| H293 | 2026-11-10<br>사용자 캐릭터 자산 | 2572 펠리시티 도구 실제 저장 | 펠리시티 저장 이력5PNG는 유지한다. 그중 기본 전신 felicity_blond_long_young.png를 현재 WORK와 동일한 소스·원장·카탈로그 메타데이터로 갱신했다. 기존 ‘원본과 동일’ 오표시를 교체로 바로잡았다. | 현재 WORK 소스 보존<br>잔여: 기존 저장5PNG 전체를 새로 제작하거나 재검증한 것이 아니다. 새 PC/배포 입력 여부는 배포 직전 별도 확인한다. | [근거1](<G:/somi/JO9sa/records/work-image-source-sync-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/work-image-source-sync-20261110/audit.json>) |
| H294 | 2026-11-10<br>사용자 캐릭터 자산 | 2624 엘자 도구 실제 저장 | [object Object]<br>[object Object]<br>[object Object]<br>[object Object]<br>[object Object]<br>[object Object] | 로컬 적용 기록 유지 | [근거1](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| H295 | 2026-11-10<br>캐릭터 이미지 도구 | 공유PNG 해제·전체삭제 보존 | 타번호모든참조/물리별칭/ID0/옛초상/역할공유확인하여보존;단독삭제유지 | 기존 반영 기록 유지 | [근거1](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>) |
| H296 | 2026-11-10<br>배포 기준 | 신규정식ZIP·Full 동기화 미실행 | 현재 WORK와 추적 소스의 후속 변경은 정식 새 ZIP이나 Full에 자동 반영한 것이 아니다. 이번 작업도 자료 최신본 작성뿐이다. | 배포 작업 미실행<br>잔여: 정식 배포 지시 후 누적 패치 입력·전체 출고 검사. Full 동기화·커밋·푸시는 별도 명시 지시 필요. | [근거1](<G:/somi/JO9sa/docs/WORK_ONLY_SYNC_POLICY_20261026.md>)<br>[근거2](<G:/somi/JO9sa/docs/PACKAGING_POLICY_20261019.md>) |
| H297 | 2026-11-08~2026-11-10<br>character-json-net | json/menu_icon.json 출시 기준→현재 WORK 순변경 | json/menu_icon.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/menu_icon.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/menu_icon.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H298 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/1448_Shiru.json 출시 기준→현재 WORK 순변경 | json/slaves/1448_Shiru.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/JO9sa/records/character-image-links-20261108/before/54c0e92247a5eb89ae48eaa91fdc14e51410564e4f66dc66aa62f41cd4cb4cf2.gz>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/1448_Shiru.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H299 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/2572_felicity.json 출시 기준→현재 WORK 순변경 | json/slaves/2572_felicity.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2572_felicity.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2572_felicity.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H300 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/2573_wilhelmine.json 출시 기준→현재 WORK 순변경 | json/slaves/2573_wilhelmine.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2573_wilhelmine.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2573_wilhelmine.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H301 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/2577_pelageya.json 출시 기준→현재 WORK 순변경 | json/slaves/2577_pelageya.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-08T17-48-29-097Z_56f345df/before.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2577_pelageya.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H302 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/2579_egeya.json 출시 기준→현재 WORK 순변경 | json/slaves/2579_egeya.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2579_egeya.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2579_egeya.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H303 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/2583_galateya.json 출시 기준→현재 WORK 순변경 | json/slaves/2583_galateya.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2583_galateya.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2583_galateya.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H304 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/2585_pelageya.json 출시 기준→현재 WORK 순변경 | json/slaves/2585_pelageya.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2585_pelageya.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2585_pelageya.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H305 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/2607_pelageya2.json 출시 기준→현재 WORK 순변경 | json/slaves/2607_pelageya2.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2607_pelageya2.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2607_pelageya2.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H306 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/2624_erza.json 출시 기준→현재 WORK 순변경 | json/slaves/2624_erza.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2624_erza.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2624_erza.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H307 | 2026-11-08~2026-11-10<br>character-json-net | json/slaves/3002_Luminous.json 출시 기준→현재 WORK 순변경 | json/slaves/3002_Luminous.json 출시 기준→현재 WORK 순변경 | 로컬 적용 기록 유지 | [근거1](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/3002_Luminous.json>)<br>[근거2](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/3002_Luminous.json>)<br>[근거3](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) |
| H308 | 2026-11-08~2026-11-10<br>캐릭터 JSON | 2341 글로리아 신규 캐릭터JSON | 글로리아의 indpack_cocktail을 현재 옷 입은 모습 characters/2341_gloria_title로 연결했다. 승인된 수동 이미지9키와 PNG5개를 보존하고 WORK/소스/원장을 맞췄다. 글로리아는 미배포 캐릭터이므로 옛4경로 부재를 공개 배포 세이브 호환 결함으로 분류했던 제안은 철회했다. | 후속 반영·화면 대기<br>잔여: EXE 재시작 후 명주 의상에서 초록 원피스가 나오는지 실제 화면 확인. 옛4경로 복구는 하지 않는다. | [근거1](<G:/somi/JO9sa/records/gloria-cocktail-title-20261110/REPORT_KO.md>)<br>[근거2](<G:/somi/JO9sa/records/gloria-cocktail-title-20261110/verification.json>) |

## 11월11일 이후 추가·후속 기록46건

중간에 미반영으로 조사했던 활동 단계형·춘향 기획·보류 원고 등은 후속 구현 기록과 함께 읽는다. 백업 정리나 조사 문서는 게임 신규 기능이 아니다.

### N01 2026-11-13 Codex: 춘향 무작위 일섬·회피 상성·조소

[수정·사용·보존·검증](<G:/somi/JO9sa/records/chunhyang-random-finish-20261113/REPORT_KO.md>). 시작즉사 제거,모든능력에서5~10턴무작위일섬/회피자세만방어,일반3종속도상성,70%미만6버프99턴과춘향의조소배지/시작원고. 일섬·연고단일행동,CM/치트/유수보/영입보존.실제엔진4그룹184검사·공식재생/멱등/역검증통과,개인SAV/화면시각검사미실시. WORK/소스/manifest일치2ad5be48. MOB표와직전B설명4개의HTML동기화. Full/음원/커밋푸시없음.

[상세 근거1](<G:/somi/JO9sa/records/chunhyang-random-finish-20261113/REPORT_KO.md>)

### N02 2026-11-13 Codex: PR17 B 통합 WORK 반영

[반영범위·사용·저장·검증·보류](<G:/somi/JO9sa/records/handoff-b-combined-20261112/REPORT_KO.md>).152본문교체+11신규,연결v2/로마이름·독립그룹,세계초기보정/57출신성장,31직업73규칙,활동4단계.사용자확정비중·우선순위·책임분리.새캐릭터값4개,기존고정/플레이기록유지.통합생성검사/공식재생·멱등·역검증통과,개인SAV/UI미확인.하녀발견메모보류,C차기.커밋푸시/Full/음원없음.

[상세 근거1](<G:/somi/JO9sa/records/handoff-b-combined-20261112/REPORT_KO.md>)

### N03 2026-11-12 Codex: PR17 A 장악력·악명 현재 WORK 적용

[사용·의존성·검증·복구](<G:/somi/JO9sa/records/handoff-a-work-20261112/REPORT_KO.md>). 대상별 수식과 구타/악명큰값,순찰성기사/감방각-0.5,남은 같은원인경로/기존계산캐시 보완.실제엔진126검사·공식재생/멱등/역검증 통과.10본문+함수1,새저장변수0.개인SAV/전체밤넘기기/UI 미검증. PR댓글전달,B진행중,C차기.커밋푸시/Full/음원없음.

[상세 근거1](<G:/somi/JO9sa/records/handoff-a-work-20261112/REPORT_KO.md>)

### N04 2026-11-12 Codex: 도나도나 기존 영입 인물 1회 갱신

[사용법·보존 규칙·실행·검증·복구](<G:/somi/JO9sa/records/dohna-owned-migration-20261112/REPORT_KO.md>). 승인한23명에 현재보다 낮은 초기 능력/기술만 보강하고 지정 특성/충돌을 반영.30보유 역할·캐릭터별 revision1로 이동/재호출 후 반복 방지.이름/관계/장비/소유일/헌신/진행 유지.실제 엔진1182단언0실패·SAV완료표시저장·공식재생/멱등/역검증 통과.전체 OPENGAME/개인SAV/UI 미검증. WORK/추적 QSP/manifest 반영; JSON/Full/음원/커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/dohna-owned-migration-20261112/REPORT_KO.md>)

### N05 2026-11-12 Codex: 성인 설정 확인 후 포르노·조커·슈코 프리셋 적용

[적용값·잠재 명기·사용·검증·복구](<G:/somi/JO9sa/records/dohna-adult-presets-20261112/REPORT_KO.md>). 사용자 명시 포르노21세/조커·슈코 성인 설정을 기준으로 앞선 연령 오판 철회 후 기존 제외 요청 반영. 포르노 지정5특성·9기술 등급·명기 잠재1필드,조커 양성애자,슈코 색정광. 실제 생성/잠재 숨김·기존 행동 콜백 발견·1회효과·캐시93단언 통과. 3 JSON51필드·4본문 반영,나이범주/이미지/이야기 유지. 하드모드 단계 공개14본문/함수 보존. 신규 영입 기준,기존보유 강제갱신/개인SAV/UI 미검증. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/dohna-adult-presets-20261112/REPORT_KO.md>)

### N06 2026-11-12 Codex: 하드모드 속성 단계 공개 및 연령 판단 정정

[하드모드 적용·사용·검증](<G:/somi/JO9sa/records/hard-attribute-visibility-20261112/REPORT_KO.md>). 기존 소유일수10일/20일로 속성 값을 단계 공개,레벨리오 우선 공개.14본문84출력·툴팁,실제 엔진1275단언·공식 재생/재적용·역검증 통과. 실제 수치/JSON/세이브 필드 유지,GUI/개인SAV로드 미검증. [연령 판단 정정](<G:/somi/JO9sa/records/dohna-traits-20261112/AGE_CLASSIFICATION_CORRECTION_KO.md>): seed_age1/_loli로 실제 미성년을 단정했던 판단 철회. 사용자가 포르노21세 명시. 이후 사용자 명시3명 성인 설정 확인으로 기존 제외 프리셋을 반영했다. 최상단 후속 기록 참조. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/hard-attribute-visibility-20261112/REPORT_KO.md>) · [상세 근거2](<G:/somi/JO9sa/records/dohna-traits-20261112/AGE_CLASSIFICATION_CORRECTION_KO.md>)

### N07 2026-11-12 Codex: 도나도나 지정 특성과 개별 보완

[특성표·155필드·제외·검증·복구](<G:/somi/JO9sa/records/dohna-traits-20261112/REPORT_KO.md>). 22명 초기 특성과 공개값, 메디코 의료S·린 외모5/반항심·리리에 은둔형 외톨이·쿄카 운동광/투사를 WORK 반영. 미지정12명은 배경별 선정, 외모5 예외 린/노에루. 키라키라 연금은 기존 마법 적성 보너스 사용으로 확정. 누락되던14개 jo9_* seed 복사 연결 추가. 실제 전체 생성22명348단언·별도 seed/특성 목록·공식 재생/재적용·역검증 통과. 포르노 성적 항목/조커 성적 행동 연결 특성/슈코 색정광 미적용, 비성적 항목은 반영. 나이/외형/이야기 보존. 기존 보유 인물 강제 재지정 없음, 개인SAV/UI 미검증. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/dohna-traits-20261112/REPORT_KO.md>)

### N08 2026-11-12 Codex: 도나도나 초기 능력과 등장 코드

[전후표·등장 근거·검증·복구](<G:/somi/JO9sa/records/dohna-stats-20261112/REPORT_KO.md>). 사용자 승인으로23명 검토 후20 JSON144필드의 일반 초기 능력/성격/직업 적성을 조정. 적합한3명 유지, 복제 외모5 구분, 실제 직업 기술 반영. 복제11명 모두 쿨라 히토카리 의뢰의3,000스파크 영입 경로 존재. 실제 JSON/get_stock_seed 및 원래 상점4조건424단언 통과. QSP/이름/이미지/이야기/나이/성적값/구매조건 유지. 기존 보유 인물 강제 갱신 없음. 실제 개인SAV/UI·장기밸런스 미검증, 합성 자동로드 별도 실험 미완료. 조커 jokr/joker 재구매 차단 불일치 발견·미수정. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/dohna-stats-20261112/REPORT_KO.md>)

### N09 2026-11-12 Codex: 도나도나 23명 배경·안테나 고유 분류

[원고·변경·사용·복구·검증](<G:/somi/JO9sa/records/dohna-stories-20261112/REPORT_KO.md>). 첨부 HTML을 참고해 8877~8899의 세계/출신/직업69개를 WORK·추적 JSON에 반영했다. 안테나 누락3필드와 unic 분류를 보완하고 기존 영입 경로를 유지했다. 알려진 자리표시자/안테나 일반 소개 정확 일치만 갱신하며 직접 편집문 보존. 실제 엔진420단언·공식재생/재적용·구조/역검증·WORK/소스/manifest 일치. 실제GUI/개인SAV로드 미검증. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/dohna-stories-20261112/REPORT_KO.md>)

### N10 2026-11-12 Codex: 활동·집중 특성 단계형 개편 미반영 확인

[승인안 대비 반영/잔여/미정 보고](<G:/somi/JO9sa/records/trait-stage-audit-20261112/REPORT_KO.md>). 최신 승인 기획 원문을 함께 보존했다. WORK479fe110은 여전히 집중/활동 두 축. 기존 하위 경험치/성과·반복기분과 활동횟수/보상배율은 있으나 네 특성 단일 보유·상위 대체·하위효과 포함·직조공20%·편집기/JSON/표의 단계형 정리는 미반영. 실제 엔진22단언으로 현재 구식 동작을 확인했으며 새 기획 구현 완료/승인안 검사 통과가 아니다. 기존 충돌/저장 이관/신규 분포는 미정, 자동승급은 범위 밖. 게임/JSON/개인SAV/Full/음원/커밋푸시 변경없음.

[상세 근거1](<G:/somi/JO9sa/records/trait-stage-audit-20261112/REPORT_KO.md>)

### N11 2026-11-12 Codex: 오래된 백업 K 드라이브 보관

[범위·보존·검증·복원](<G:/somi/JO9sa/records/backup-archive-20261112/REPORT_KO.md>). 오래된 백업 92154파일/16.98GiB를 `K:\doing\JO9_trash\somi_backups_20261112_135507`로 옮겼다. 원래 경로는 보관소 CSV/JSON 목록에서 찾는다. 지정 최신 복구본·세이브·연결 포함 묶음·원본·Git추적 자료는 유지했다. WORK/Full/추적QSP 해시 동일, 게임 코드·커밋푸시 변경없음.

[상세 근거1](<G:/somi/JO9sa/records/backup-archive-20261112/REPORT_KO.md>)

### N12 2026-11-12 Codex: 대화 조립 규칙 현행 문서·반말 적용 범위 정정

[현재 WORK의 대화 조립 규칙](<G:/somi/JO9sa/docs/SLAVE_DIALOGUE_ASSEMBLY_RULES_CURRENT_20261112_KO.md>). 사용자 최신 기준은 일반 노예 반말 미적용·유니크 중 지정 인물만 선택 적용이다. 현재 직업별 tone3 분기는 일반/미지정 인물도 선택할 수 있어 기준과 미일치하며, 이 문서 작업에서는 게임 코드를 바꾸지 않았다. 성격9유형·말투·관계·깊이·사실/사건·후보/반복·페이지/이력/캐시를 현재479fe110 기준으로 명세했다. QSP/JSON/개인SAV/Full/음원/커밋푸시 변경없음.



### N13 2026-11-12 Codex: 8명 전용 반말 WORK 반영

[사용·범위·검증·복구](<G:/somi/JO9sa/records/always-plain-voice-20261112/REPORT_KO.md>). 루미너스/바실리사/라나/리아스/다이아나/이리스/캬루/에키드나의 일반 대화를 관계·직업과 무관하게 반말로 연결했다. 실제 화자별 적용, 전용 완성문장 교정2,406건, 캬루·이리스 소개6필드, 알려진 옛 소개문 표시 호환·대사캐시 갱신. 성격/관계 의미·육성수치·일반 인물·직접 편집문 보존. 실제 엔진160단언·구조/공식재생/재적용·바이트역검증 통과. WORK/소스/메타479fe110 일치. 실제GUI/개인SAV로드 미검증. D24 완료, D22/23 중요퀘 보류 및 잔나/호손 미결 유지. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/always-plain-voice-20261112/REPORT_KO.md>)

### N14 2026-11-12 Codex: 반말 전용 세트 방향·중요 퀘스트 연계 보류

[확정·잔나 설명·호손 제안](<G:/somi/JO9sa/records/pending-decisions-20261112/DECISIONS_KO.md>). 반말 세트는 캐릭터별 지정·상태 변화와 무관하게 항상 반말로 확정, 검토8명 전체 확정·WORK 연결 완료(아래 최신 후속 참조). 비밀서고는 중요 퀘스트 연계/계속 리마인드, 특등급 재료는 도축장 중요 퀘스트 연계로 보류(D22/23). 잔나4필드는 재설명/선택 대기. 호손 보호는 후속 중요 퀘스트 지원권 안을 제안했으며 미승인·게임 미적용. QSP/JSON/개인SAV/Full/음원/커밋푸시 변경없음.

[상세 근거1](<G:/somi/JO9sa/records/pending-decisions-20261112/DECISIONS_KO.md>)

### N15 2026-11-12 Codex: 조수 애무 버튼·유두 교육 이미지 대상 수정

[원인·수정·검증·사용·복구](<G:/somi/JO9sa/records/assistant-training-ui-20261112/REPORT_KO.md>). 조수231 애무 뒤로/취소 href의 이중따옴표를 고치고238 이미지와 상위 메뉴의 체형/기술단계를 조수로 연결했다. 기준3·조건·비용·교육결과 보존. 실제 엔진 수정전 재현→실제HTML명령 이동2경로·이미지/메뉴25사례 및 상태보존, 구조/마커·공식재생/재적용·바이트역검증 통과. WORK/소스/메타67bdc752 일치. 실제GUI/사용자SAV 미검증. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/assistant-training-ui-20261112/REPORT_KO.md>)

### N16 2026-11-12 Codex: 글로리아30일 대기·동시 소문

[조건·기존세이브·검증·복구](<G:/somi/JO9sa/records/gloria-delay30-20261112/REPORT_KO.md>). 사용자 지시로 첫 후임 납품 뒤60→30일, 스쿱스 소문도 후임 납품30일 이후로 맞췄다. 로드시 기존 두 메뉴의 날짜문구만 치환하며 진행/날짜/다른 메뉴 보존. 실제엔진144조건+실제bds메뉴1=145사례·공식재생/재적용·구조/바이트역검증 통과. bds납품43/현재66→73일차(7일 뒤), 개인SAV 쓰기0. WORK/소스/메타babd93b3 일치. 실제GUI 미검증. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/gloria-delay30-20261112/REPORT_KO.md>)

### N17 2026-11-12 Codex: 가임성·쿨라 안내 문구 정정

[문구·범위·검증·사용·복구](<G:/somi/JO9sa/records/fertility-kula-wording-20261112/REPORT_KO.md>). 사용자 지시로 노예/조수·개인실의 가임기/안전일/산란기 표현과 쿨라의 만삭·열흘 보장을 실제 체질/미확인/평상시·임신중기 안내로 맞췄다. 수치·실행 판정·확률·공개시점·아이콘 보존, 29줄7location 문구범위/바이트역검증·구조/마커·공식재생/재적용 통과. WORK/소스/메타5636234a 일치. 전체 엔진/GUI 미실행. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/fertility-kula-wording-20261112/REPORT_KO.md>)

### N18 2026-11-12 Codex: 첨부 인계14문서 누락 점검

[누락·문구차이·완료/보류 구분](<G:/somi/JO9sa/records/handoff-gap-audit-20261112/REPORT_KO.md>). 가임성/쿨라 안내, 반복 구매자 목표, 요구 비교식 잔여를 확인했다. 말투64항목 중36차이(반말7명25항목 포함), 여주인님3곳·잔나 예외4필드 불일치는 결정/수정 대상으로 보고. 기존 승인 펠라게야 대화 배열/표시 호환 누락은 추가 반영하고 엔진15단언 통과. 펠리시티는 사용자 후속 지시로 점검·개발 제외/추후 개발. 다른 새 수정·Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/handoff-gap-audit-20261112/REPORT_KO.md>)

### N19 2026-11-12 Codex: 펠라게야·베네라 가족 설정 반영

[반영·캐시·사용·검증·복구](<G:/somi/JO9sa/records/pelageya-story-20261112/REPORT_KO.md>). 사용자 승인으로 자매/처제/의붓아들 설정과 소개·후일담·2606/2607 가족 JSON을 맞췄다. 알려진 옛 표시문만 정확일치 갱신하고 사용자 편집·수치·조건·보상·내부키를 보존한다. 실제 엔진10단언·구조/왕복·공식재생/재적용·JSON범위 통과. 실제 대화 배열/구세이브 표시 누락 추가 보완15단언, WORK/추적/메타5e442dfc 일치. 실제GUI/사용자SAV로드 미확인. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/pelageya-story-20261112/REPORT_KO.md>)

### N20 2026-11-12 Codex: 춘향 최초 영입 인식3·헌신0/0

[반영·변수·검증·복구](<G:/somi/JO9sa/records/chunhyang-initial-attitude-20261112/REPORT_KO.md>). 사용자 지시로 신규3040 비복제의 인식3/단계0·헌신등급0/단계0, JSON seed_rational3/seed_moral0을 반영했다. 기존 영입 인물과 타 인물/복제의 육성값 보존. 후보/설치 실제 영입 각9단언·공식 재생/재적용·구조/범위·JSON 보존 검사. WORK/추적/메타 QSP 5b714436,JSON 362ec17c 일치. 실제 GUI/SAV 미확인. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/chunhyang-initial-attitude-20261112/REPORT_KO.md>)

### N21 2026-11-12 Codex: 하단 프레임 절반·캣파이트 처분 복구·일섬 무적 호환

[적용·원인·사용·부작용·검증·복구](<G:/somi/JO9sa/records/chunhyang-combat-fixes-20261112/REPORT_KO.md>). 사용자 지시로 대사5화면 하단 프레임18→9px와 글자 여백, 새 일반전 적3종의 처형/석방 whitelist, 시작/주기 일섬의 HP피해·기존 치트배율·HP0 판정을 반영했다. CM/확률/자원/보스 처분 제외 유지. 후보/설치 각각 실제7경로56단언·공식 재생/재적용·구조/경계 및 CSS 전후 브라우저 렌더 확인. WORK/추적/메타 QSP 4354cf39,CSS 78265cf2 일치. 실제 사용자 SAV·게임창 외형 미확인. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/chunhyang-combat-fixes-20261112/REPORT_KO.md>)

### N22 2026-11-12 Codex: 춘향 메뉴 클릭·장면 문구·완성 배경 반영

[원인·적용·사용·검증·복구](<G:/somi/JO9sa/records/chunhyang-menu-links-20261112/REPORT_KO.md>). 사용자 승인으로 7개 메뉴 href 따옴표를 고치고 각 장면의 춘향 말투를 연결했다. 배경 포함 기존 원본을 에게야와 같은 bg/chunhyang.png로 등록하고 선택 화면에795×596으로 표시, 투명 전경 제거·재표시 안내 누적 방지. 조건/전투/금액/처형·석방·기존 에게야와 타NPC 보존. 설치본 실제 HTML→href 실행7경로·표시/리소스·추가16단언 통과. WORK/추적/메타 ee992f66 일치. 실제 사용자 SAV/게임 창 외형은 확인 전. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/chunhyang-menu-links-20261112/REPORT_KO.md>)

### N23 2026-11-12 Codex: 개인실 빈방 배경 누락 수정

[원인·적용·검증·복구](<G:/somi/JO9sa/records/private-room-bg-audit-20261112/REPORT_KO.md>). 사용자 승인으로 jo9_interior 주석의 닫히지 않은 작은따옴표를 수정했다(Kula's shop → Kula shop). WORK·추적 QSP·메타 f3d41973 일치. 등급 초기화 없이 미설정 방은 베이직, 기존 1/2/3등급은 스탠다드/퀄리티/럭셔리를 반환한다. 공식 적용·재적용·해당 함수 이력 재생·구조/경계와 설치본 실제 엔진 4방 24단언 통과. 실제 게임 창 외형·사용자 SAV 불러오기는 미확인. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/private-room-bg-audit-20261112/REPORT_KO.md>)

### N24 2026-11-12 Codex: 춘향 클럽 승계·보스·영입·소유권 구현 완료

[구현·사용·저장·검증·복구](<G:/somi/JO9sa/records/chunhyang-club-20261112/REPORT_KO.md>). 에게야 영입후매물30일→춘향개장, 일반경기인물별6회/적2배, 보스200/300/200/15·시작R/주기일섬/회피·연고3/6·CM정산을구현했다. 춘향승리시클럽소유권도획득, 기존주노예/stock보존·영입대기와주인공소유폐쇄/지배인필요툴팁. 지배인배치/재개장자체는후속. 실제후보/설치각20경로103단언·공식재생/재적용·구조/합성SAV저장·코덱왕복통과. 독립검토2화면회귀수정, 열람표MOB74/특성129갱신. 이전SAV의에게야영입일없으면첫확인일부터30일. WORK/추적/메타376a35f5일치. 실제GUI/사용자SAV로드·장시간승률미검증. Full·음원·커밋푸시없음.

[상세 근거1](<G:/somi/JO9sa/records/chunhyang-club-20261112/REPORT_KO.md>)

### N25 2026-11-12 Codex: 춘향 전체 프로필·승인 배경·산도·최고 챔피언

[반영·동작·사용·검증·복구](<G:/somi/JO9sa/records/chunhyang-profile-20261112/REPORT_KO.md>). 사용자 지정 일반 능력·17일반특성·산도20%·경험없음/관련기술F·숨김양성애자·승인3배경을 반영했다. 최고칭호는 기존 아레나 그랜드 챔피언(arena_level9)을 재사용하며 높은기록/기존학습 보존. 실제 설치 엔진3경로209단언·합성SAV·공식재생/재적용·구조 검사 통과. 열람표129특성/MOB상태 갱신. WORK/추적/메타4dd9c9d8 일치. GUI/기존SAV로드 미검증. 춘향 보스AI/영입은 미구현, Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/chunhyang-profile-20261112/REPORT_KO.md>)

### N26 2026-11-12 Codex: 엘자·춘향 지정 특성 반영

[구현·사용·저장·검증·복구](<G:/somi/JO9sa/records/unique-traits-20261112/REPORT_KO.md>). 엘자 기본미모5·절세미인고정제거·성기사, 춘향 기본미모5·절세미인·광전사. 에게야 역전의용사와 나머지특성/명기 보존. 인물별revision1필드로 기존특성1회교정 후 미래획득/편집 허용. 실제엔진 후보/설치각50단언·합성SAV저장·공식재생/멱등성·구조/마커·타필드보존 통과. WORK/소스/메타2698fcb4일치, 실제GUI/기존SAV로드는미검증. 춘향보스AI/영입은미구현, Full·음원·커밋푸시없음.

[상세 근거1](<G:/somi/JO9sa/records/unique-traits-20261112/REPORT_KO.md>)

### N27 2026-11-12 Codex: 아이템 기획 다음 업데이트 보류·춘향 설정 제안

[아이템 최신 확정 배정·보류 인계](<G:/somi/JO9sa/records/drop-equipment-planning-20261111/NEXT_UPDATE_HANDOFF_KO.md>) · [춘향 배경/능력/특성 제안](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/CHARACTER_PROPOSAL_KO_20261112.md>). 아이템은 다음 업데이트 보류, 신규 찌르기/타격 한손무기·차상위갑옷·투구·장신구는 향후 퀘스트 보상으로 정리. 장신구 랜덤드랍안 대체, 보조4계열 안개 랜덤드랍 유지. D04/일정노트 갱신. 춘향은 기존 확정 보스수치를 유지하고 새 연결 배경·영입후 일반능력·기존8특성·기술명3종을 검토용 제안으로 저장했다. 현재3040JSON에 능력/특성이 없는 것을 확인했고 JSON/QSP/이미지는 변경하지 않았다. 아이템·춘향 기능 모두 새 구현 없음. Full·음원·커밋푸시 없음.



### N28 2026-11-11 Codex: 주인공 장비 설명 교정·상위 드랍 장비 설계

[15종 효과 설명 반영·검증](<G:/somi/JO9sa/records/equipment-descriptions-20261111/REPORT_KO.md>) · [상위 무기/방어구7종 초안](<G:/somi/JO9sa/records/drop-equipment-planning-20261111/DESIGN_DRAFT_KO.md>). 기존 의상/유물15설명만 실제효과로 교정하고 전투정의·다른직렬화필드 보존·공식재생/멱등성·구조/마커 검사. WORK/소스/메타bd99a3ae 일치, 열람표15설명 부분 갱신. 새 장비는 사용자 지정 안개·콜로세움·보스 분산 설계만 진행, 이름/수치/확률 미확정·미구현. 기존 전체 안개/연금술 보류는 유지. 실제GUI는 사용자확인. Full·음원·커밋푸시없음.

[상세 근거1](<G:/somi/JO9sa/records/equipment-descriptions-20261111/REPORT_KO.md>)

### N29 2026-11-11 Codex: MOB 정보 탭·춘향 확정 기획 열람

[사용·구현·검증·복구](<G:/somi/JO9sa/records/game-reference-mobs-20261111/REPORT_KO.md>). 기존 적 전투 특성 탭을 유지하고 MOB 정보 탭에 QSP 적70종+춘향 미구현기획1종을 추가했다. 자원/피해 비교·수동검색·등록/분류필터·정렬·선택상세와 춘향 최신200/300/200/15·연고3/6·R/즉사/회피/CM/클럽규칙을 표시한다. 기존 DB5섹션과 적70종 수치·개인아이디어 보존, 실제브라우저 검색/정렬/상세/빈결과/탭·초안유지 및 기존10검사 통과. WORK 설치HTML/README/snapshot 일치. QSP·음원·Full·커밋푸시 변경없음. 일반공격 부가상태 <br> 키 불일치는 별도 미수정이다.

[상세 근거1](<G:/somi/JO9sa/records/game-reference-mobs-20261111/REPORT_KO.md>)

### N30 2026-11-11 Codex: 하드 전용 기존 적 특수공격·공통 이름과 사용자 표

[게임 구현·검증·복구](<G:/somi/JO9sa/records/hard-enemy-specials-20261111/REPORT_KO.md>) · [열람표·이름·사용자·실제 UI 확인](<G:/somi/JO9sa/records/enemy-special-reference-20261111/REPORT_KO.md>). 기존24종30기술을 게임 중 하드(difficulty_setting=2)에서 적별 기술당 새 전투1회로 연결했다. 안개적응은 시전자에 적용하며 대마법사는 하드에서 기존 AI로 연결했다. 후보/설치본 각각 실제 엔진6흐름·923단언, 저장 배열 보조 네이티브 복원·재저장·공식 재생·멱등성·구조 검사를 통과했다. WORK/추적/메타 해시21f41a52 일치. HTML에16종 공통 이름과 사용하는 적·기술번호 표를 추가하고 기존 DB/개인 기록을 보존했다. 브라우저 수동검색·탭/초안 유지와 기존10검사 통과. 춘향 연고는 쉬움/보통3·하드6으로 기획만 갱신했으며 춘향 전투·물약 AI는 미구현이다. 실제 GUI 기존 SAV 불러오기·전체 전투 플레이는 미검증. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/hard-enemy-specials-20261111/REPORT_KO.md>) · [상세 근거2](<G:/somi/JO9sa/records/enemy-special-reference-20261111/REPORT_KO.md>)

### N31 2026-11-11 Codex: 적 전투 특성 탭과 엘자·포털 가디언 방어 변경

[열람 탭·사용·검증](<G:/somi/JO9sa/records/game-reference-enemies-20261111/REPORT_KO.md>) · [게임 수치 반영](<G:/somi/JO9sa/records/enemy-balance-20261111/REPORT_KO.md>) · [춘향 최신 방어 기획](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/CHUNHYANG_DEFENSE_DRAFT_KO.md>). 기존 DB/개인 아이디어를 보존하고 적70종 탭을 추가했다. 엘자6저항과 포털 가디언 사기피해 차단은 WORK·추적 QSP fef0baed 기준으로 반영했으며, 춘향은 별도 미구현 기획이다. 실제 브라우저·기존10검사·QSP 승인범위 대조를 확인했다. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/game-reference-enemies-20261111/REPORT_KO.md>) · [상세 근거2](<G:/somi/JO9sa/records/enemy-balance-20261111/REPORT_KO.md>)

### N32 2026-11-11 Codex: 캣파이트 춘향 후임 운영 기획 중

[사용자 설정·현재 코드·결정 대기](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/DESIGN_DRAFT_KO.md>). 에게야 영입 후 춘향(chunhyang/3040)이 운영을 이어받고 일반 경기와 춘향 결투 둘 다 강화한다. 춘향 영입은 에게야와 같은 패턴. 사용자 제공 몽룡/문수·산도 배경, 철퇴손/대검·합기·과묵/선한 성격을 보존했다. 현행 누적3승/아레나등급 제한과 중복 영입·보상 경로를 확인했으며, 춘향까지 영입하면 다시 폐쇄, 일반 참가 기본 조건 유지·춘향 단계 캐릭터별6회 도전(결투와 독립), 춘향 도전 시20만스파크 보유만 확인, 승리 차감0, 패배 때만 CM별 즉사/금전 차감으로 확정. 선차감/환급안 철회. 패배 CM≤−10 즉사, −10초과~0은20만,0초과~10은10만,10초과~20은5만,20초과는0차감으로 확정. 기존 판돈의 메뉴 생성 차감도 소스에서 확인해 시작 시 차감 설명을 정정했다. 일반 적2배 강화. 춘향은 시작R<70% 즉사기,70~100%는5~10턴마다 비율에 따른 확률 즉사기,100%초과는 일반 피해로 확정(즉사기도CM 적용·확률40/30/20/10 확정·힘/전투/최대체력/정상사기/최대스태미나5비율 동일평균·전투시작최대값 기준 확정). 주인공 최대 상태는 HERO_MAX_POWER_AUDIT_KO.md에 조사했고 춘향 기준 수치·원고는 미확정. 거대 안개괴물200/300/300/피해20와의 비교는 HERO_VS_FOG_MONSTER_KO.md에 조사. QSP/JSON/PNG 미변경, 게임 미적용.

[적 70종 전투 특성 전체 목록](<G:/somi/JO9sa/records/catfight-successor-planning-20261111/ENEMY_TRAITS_KO.md>)을 추가했다. 상시 플래그5종·저항11속성·일반공격155개·특수공격30개를 현재 WORK a08546af 기준으로 정리했다. 부가상태 키의 HTML 접두사 불일치, 기본 AI의 특수공격 미선택, 대마법사 AI location 누락, 아레나 안개괴물 저항 대상 오기입도 문서에 구분했다. 이번에는 조사·문서만 작성했으며 게임은 수정하지 않았다.



### N33 2026-11-11 Codex: 개인실 버튼을 원래 행동 메뉴에 연결

[사용·구현·검증·복구](<G:/somi/JO9sa/records/private-sex-menu-20261111/REPORT_KO.md>). 사용자 승인으로 개인실1~4에서 원래 메뉴16을 열고 원래 비용·효과를 그대로 사용한다. 기존 bridge로 방 인물의 상태·이력을 유지하며 종료/접기/이탈 시 주 노예 복원과 같은 방 복귀.6location11edit, 원래 행동/결과/초기화/종료/비용 본문 보존. 설치 엔진28흐름·주 노예 유무8연결·상태/행동력36버튼 및 경계 검사, 공식 재생/재적용·독립 정적 검토 통과. WORK/소스/원장 반영. 실제 SAV/GUI·직접 조작 중간 플레이·전체 다인 참여 결과는 미검증. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/private-sex-menu-20261111/REPORT_KO.md>)

### N34 2026-11-11 Codex: 마녀들의 모임 첫 진입 조건

[조건·구현·검증·복구](<G:/somi/JO9sa/records/witch-coven-gate-20261111/REPORT_KO.md>). 사용자 승인으로 귀족 + 베네라·펠라게야 일반 의뢰 완료를 요구한다. 미충족 회색/툴팁, 6021~6024 직접 진입 검사, 기존 방문·후속 진행 보존, 저장된 해당 메뉴만 멱등 갱신. 실제 설치 엔진144상태/576진입 및 캐시 보정·공식 재생/재적용·구조 검사 통과. WORK/소스/원장 반영, 실제 SAV GUI·화면 미확인. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/witch-coven-gate-20261111/REPORT_KO.md>)

### N35 2026-11-11 Codex: 모든 캐릭터 JSON 감지·번호 없는 목록 지원

[사용·원인·검증·복구](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>). 기존 고정 ID만 읽던 목록을 전체 JSON 감지로 바꿨다. 신규3040춘향·번호없는파일·중복숫자파일을 표시하며 파일별 연결/태그/초상테두리를 지원한다. 기존 메모·호환이미지·태그와 검색버튼을 유지한다. 사운드 목록은 자동열기 없이 경로만 제공한다. 운영 JSON/PNG/QSP/개인설정/Full/커밋푸시 변경없음.

[상세 근거1](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>)

### N36 2026-11-11 Codex: 이미지 교체기 선택 일괄 테두리

[사용·검증·복구](<G:/somi/JO9sa/records/workshop-batch-frame-20261111/REPORT_KO.md>). 원본테두리 지원규격/현행경로를복구하고 단일 일괄생성버튼을추가했다. 선택교체대상 또는 새입력없는선택원본만 처리하며 저장은기존백업후교체 사용. 중앙픽셀/원본bytes/투명도/압축마스크, 관련18검사·실물브라우저두모드 통과. 기존새경로기능의원천반영포함. 운영PNG·QSP·체크상태·Full·커밋푸시변경없음.

[상세 근거1](<G:/somi/JO9sa/records/workshop-batch-frame-20261111/REPORT_KO.md>)

### N37 2026-11-11 Codex: 벼룩시장 젖소 코스튬 일반 의상 추가

[사용·효과·검증·복구](<G:/somi/JO9sa/records/cow-costume-20261111/REPORT_KO.md>). 사용자 승인으로 기존 cow그림을 공유하는 일반 의상 cow_costume을 벼룩시장 일상복에25스파크로 추가했다. 독특함+1·일일사육+1·젖소녀교육+2·세련됨−1, 지성/태도감소·착용거부 없음. 고급훈련의 기존 cow_gear 조건 유지. 구캐시 멱등보강·실제 구매/장착·효과27조합 및 설치엔진 이미지선택 검사, 공식재생/재적용·구조검사 통과. 아이템DB 신규행/재추출 연결 포함, 기존 개인 아이디어 보존. 실제GUI·개인SAV 미검증. WORK/소스 반영, Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/cow-costume-20261111/REPORT_KO.md>)

### N38 2026-11-11 Codex: 랠리 캐릭터별 참가·배당 감소 반영

[사용·검증·복구](<G:/somi/JO9sa/records/rally-payout-20261111/REPORT_KO.md>). 사용자 승인표에 따라 첫3회 우승 순이익300, 4~9회275→150, 10회 이상125로 반영했다. 기존 승률·패배손실100·명성을 유지하며 실제 참가금100 선차감, 캐릭터별 누적·개별 식별·중복 정산 방지를 연결했다. 설치 엔진185경로 및 역할/개체 구분 검사, 엔진API 저장·로드, 공식재생/재적용·구조검사 통과. 실제GUI·사용자 SAV는 미검증. WORK/소스/원장 반영, Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/rally-payout-20261111/REPORT_KO.md>)

### N39 2026-11-11 Codex: 하사 완료 보상 VIP 입장·제공 대사 반영

[사용·검증·복구](<G:/somi/JO9sa/records/hassa-vip-20261111/REPORT_KO.md>). 하사 완료는 낮은 홍등가 평판에서도200스파크 이상 보유 시 VIP 입장 자격으로 인정한다. 두 기존 메뉴·기존 자격 경로를 맞췄고120조합 검사 통과. 제공된3문단 완료 원고를 배열/직접 대입2곳에 반영하고 보상 장소·남녀 관계 소개를 정리했다. 구세이브 메뉴/텍스트 캐시 갱신과 반복 로드 검증 통과. WORK/소스/원장 반영, 실제GUI는 사용자 확인 대상. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/hassa-vip-20261111/REPORT_KO.md>)

### N40 2026-11-11 Codex: 사용자 확정 특성별 희망사항 대사 반영

[반영·검증·사용·복구](<G:/somi/JO9sa/records/wish-approved-20261111/REPORT_KO.md>). 사용자 원문6종과 나머지3특성의 공통1문구+😄를1114에 연결했다. 색정광/정액중독·성적 지향 단계를 구분하고 공통 문장 중복을 막았다. 해당 페이지에서 실제 보유 성향만 공개하며 기존14적성 공개와 마법·물약 대사는 유지한다. 성기술 조합288+기존회귀142=430시나리오·공식재생/재적용·구조검사 통과. WORK/소스/원장 반영, 이전 승인대기 원고는 확정본으로 대체. 실제GUI 글꼴/줄바꿈은 사용자 확인, Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/wish-approved-20261111/REPORT_KO.md>)

### N41 2026-11-11 Codex: 희망사항 적성 공개·마법 대사 복구, 성기술 원고 승인 대기

[사용·검증·복구](<G:/somi/JO9sa/records/wish-discovery-20261111/REPORT_KO.md>) · [승인 대기 원고9종](<G:/somi/JO9sa/records/wish-discovery-20261111/DIALOGUE_CANDIDATES.json>). 사용자 승인으로 희망사항14적성은 실제 대사 페이지를 보면 보유 특성을 목록에 공개한다. 기존 special_action과 발견필드를 재사용하며 새 지속변수/특성지급 없음. 마법 적성은 남녀별 기존 마법·물약 대사로 복구했다. 성기술 신규대사는 컨펌 전 미적용. 실제엔진 격리142시나리오·공식재생/재적용·구조검사 통과, 일반EXE 실제화면은 사용자 확인 대상. WORK/소스/원장 반영, Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/wish-discovery-20261111/REPORT_KO.md>)

### N42 2026-11-11 Codex: 슐랴프킨 납품 등급 오판 수정

[원인·수정·검증·복구](<G:/somi/JO9sa/records/shlyapkin-rating-20261111/REPORT_KO.md>). 사용자 승인으로 조수 UI가 남긴 공용 등급을 캐롤라인 납품에 재사용하던 문제를 수정했다. 납품 직전 기존 slave 등급 계산 호출, 원래 능력치·완료조건·보상 유지. 실제 엔진 격리 수정 전 실패·수정 후468조합 통과(등급 호출 대역 사용), 공식 재생/재적용·구조/주석 검사 통과. WORK/소스/원장 반영, 실제 사용자 세이브 납품은 미확인. Full·음원·커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/shlyapkin-rating-20261111/REPORT_KO.md>)

### N43 2026-11-11 노예 초상 자동 테두리

[사용법·구현·검사·복구](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/REPORT_KO.md>). 노예 이미지의 초상3종 카드에 원본/테두리미리보기와 명시적 적용을 추가했다. 150/151×150·바깥5px·중앙얼굴 보존, 알려진프레임유지·불확실경고·공유안내·JSON/PNG/프레임버전 검사를 기존PIC백업/패치/카탈로그저장기에연결했다. WORK/seed카탈로그UI와 도구4모듈 설치. 최종19검사와 실제2574의 버튼3종/미리보기/경고/취소 확인, 취소안내는VM회귀확인. 보호파일14개·프로덕션4모듈 일치, 야즈민8PNG전체디코딩통과. 운영PNG/QSP/JSON변경0. 기존실행기TIME_WAIT/PID0오판은코드수정없이확인후숨김직접시작. Full·음원·커밋푸시없음.

[상세 근거1](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/REPORT_KO.md>)

### N44 2026-11-11 Codex: 거주지·지역 명성 BGM 순차 재생

[규칙·구조·검증·복구](<G:/somi/JO9sa/records/residence-bgm-20261111/REPORT_KO.md>). 사용자 승인으로 귀족/평판 우선 기본곡+거주지/명성4이상 지역곡의 중복 없는 순환을 WORK에 연결했다. 빈민가·백색의 독립 명성 추가는 제외. 방문/상태화면/설정창에서 곡 유지, 기존 집·전투·경주·직접 이벤트·게임오버 우선. 채택 outside/necropolis/redlight MP3는 로컬3개만 연결. QSP2bafb73a→0b08b2c3, 기존6location13edit·19곳+신규1location. JS9검사·네이티브 행렬/실제HTML4곡/게임오버·로드3진단·공식재생/재적용·구조/주석 통과. 기존음원133개 등136파일 해시 보존, 일정 상태 보존/완료 노트 추가. 실제 긴곡 청취·전체플레이는 미확인. 소량 목록/순번/시계 상태 추가, D21 이관도구는 보류 유지. Full/ZIP/커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/residence-bgm-20261111/REPORT_KO.md>)

### N45 2026-11-11 Codex: 도시 설정창의 기존 BGM 유지

[원인·수정·검증·복구](<G:/somi/JO9sa/records/city-settings-bgm-20261111/REPORT_KO.md>). 사용자 승인으로 도시 설정(city_form1000) 진입 때 누락된city.mp3를 강제 선택하던 경로를 수정했다. 직전 곡 유지, 빈/옛city 선택만 기존 귀족·평판·거주지 규칙으로 복구. QSP d566d3e9→2bafb73a, #dynamic1edit. 실제엔진 수정 전 실패 재현→수정 후120조건 통과, 공식재생·재적용·구조·주석검사 통과. 음원133개 포함136보호파일 보존, 청취·사용자GUI세이브확인은 별도. WORK/소스/원장만 반영, 거주지·명성곡 순차재생 기획은 미구현 유지. Full/ZIP/커밋푸시 없음.

[상세 근거1](<G:/somi/JO9sa/records/city-settings-bgm-20261111/REPORT_KO.md>)

### N46 2026-11-11 Codex: 안개 업무 아이템 획득 확률 안내 교정

사용자 승인으로 Claude 인계 3-4의 소지품 획득 안내를 보통 외출당21.75%(빈손 제외75% × 조건부 추첨29%)로 바로잡았다. 기존25% 안내를 대체하며 게임 확률·QSP·보상·난이도 동작은 변경하지 않았다. 3차 이후 변경 내역의 조사 후 처리 기록에 반영했고 엑셀·CSV는 최초 조사 시점의 이력을 유지한다.



## 빌드 준비 중 승인 후속 R02 — 조커 재구매 차단

2026-11-13. 구매 메뉴의 검사 키를 실제 joker 기록과 맞췄다. 기존 저장 메뉴의 알려진 조건만 갱신하고,6244 거래 입구에서 미구매/3000이상/빈칸을 재확인한다. 저장 링크를 다시 눌러도 재결제·중복생성·기존인물 덮어쓰기가 없다. 실제 엔진3그룹106검사·공식 재생/멱등/역검증 통과. 가격/프리셋/기존인물/재산/진행 보존.

[상세 기록](<G:/somi/JO9sa/records/release-r02-joker-20261113/REPORT_KO.md>)

## 빌드 준비 중 승인 후속 R03-1 — 아르테미아 외모5 이상

2026-11-13. 잘못된비교식>4를최저값5대입으로수정하고옛요구캐시의알려진구문만갱신. 정의·실제납품·캐시24검사,공식재생/멱등/역검증통과. 가격/다른조건/진행보존. [상세](<G:/somi/JO9sa/records/release-r03a-artemia-beauty-20261113/REPORT_KO.md>)

## 빌드 준비 중 승인 후속 R03-2 — 아르테미아 기술8종 최저값

2026-11-13. 사용자 승인대로4/5 이상을 대입하고 알려진 옛 저장 콜백만 갱신했다. 정의·실제 납품·저장 콜백120검사, 공식 재생/멱등/역검증 통과. 가격·평가등급8·외모5·다른 요구와 진행 보존. [상세](<G:/somi/JO9sa/records/release-r03b-artemia-skills-20261113/REPORT_KO.md>).

## 빌드 준비 중 승인 후속 R03-3 — 아르테미아 특성 요구

2026-11-13. 사용자 승인대로 내부 최저1 요구를 실제 납품에 연결해 색정광·정액 중독을 모두 허용한다. 발견 상태는 조건으로 추가하지 않았다. 실제 엔진43검사,14사례 가격/평가 보존 및 공식 재생/멱등/역검증 통과. [상세](<G:/somi/JO9sa/records/release-r03c-artemia-trait-20261113/REPORT_KO.md>).

## 빌드 준비 중 승인 후속 R03-4 — 레시 감수성 상한

2026-11-13. 감수성3이하 상한과 알려진 옛 선호 캐시를 연결했다. 실제 엔진30검사·7사례 가격/평가 보존,공식 재생/멱등/역검증 통과. 다른 요구는 별도 검토한다. [상세](<G:/somi/JO9sa/records/release-r03d-leshiy-sensitivity-20261113/REPORT_KO.md>).

## 빌드 준비 중 승인 후속 R03-5 — 레시 체력 최저4

2026-11-13. 다른 고객은 유지하고 레시만 체력4이상 검사 및 알려진 옛 요구 캐시 갱신을 연결했다. 실제 엔진33검사·8사례 가격/평가 보존,공식 재생/멱등/역검증 통과. [상세](<G:/somi/JO9sa/records/release-r03e-leshiy-stamina-20261113/REPORT_KO.md>).

## 빌드 준비 중 승인 후속 R03-6 — 레시 무명 요구

2026-11-13. 기존 unknown=1 요구가 인지도0만 허용하도록 실제 납품에 연결됐다. 실제 엔진31검사·8사례 가격/평가 보존,공식 재생/멱등/역검증 통과. [상세](<G:/somi/JO9sa/records/release-r03f-leshiy-unknown-20261113/REPORT_KO.md>).

## 빌드 준비 중 승인 후속 R03-7 — 레시 감수성 최저1

2026-11-13. 기존 최저1 요구를 연결해 감수성1~3만 허용한다. 실제 엔진35검사·9사례 가격/평가 보존,공식 재생/멱등/역검증 통과. [상세](<G:/somi/JO9sa/records/release-r03g-leshiy-sensitivity-min-20261113/REPORT_KO.md>).

## 빌드 준비 중 승인 후속 R03-8 — 키키모라 최저 외모4

2026-11-13. 기존 >3을 최저4 대입으로 고치고 알려진 옛 콜백만 갱신했다. 실제 엔진30검사·7사례 가격/평가 보존,공식 재생/멱등/역검증 통과. [상세](<G:/somi/JO9sa/records/release-r03h-kikimora-beauty-20261113/REPORT_KO.md>).

## 빌드 준비 중 승인 후속 R03-9 — 키키모라 선호8종

2026-11-13. 승인한 최저4/5와 알려진 옛 선호 갱신을 반영했다. 실제 엔진75검사·18사례 가격/평가 보존 및 공식 재생/멱등/역검증 통과. [상세](<G:/somi/JO9sa/records/release-r03i-kikimora-preferences-20261113/REPORT_KO.md>).

## 빌드 준비 후속 R10-1 — 확정 버전 표시2.4.2

제목·화면11곳 반영. 게임 동작 변경 없음. 문구 범위 검증,실제 화면 미확인. [기록](<G:/somi/JO9sa/records/release-version-display-242-20261113/REPORT_KO.md>).

<!-- NIGHT_REFRESH_20261113:START -->
## 2026-11-13 야간 후속

승인된R02~R03-9 및 기확정버전R10-1의11모드/32편집은 최초감사와 별도다. 원본부터 공식재생/역적용을 확인했다. R02~R03당시 엔진단언527은 이력이며 새전체출고검사로 세지 않는다. 수동JSON/이미지최신후보를 갱신했고 미승인 기능은 미반영이다. [현재 보고](<G:/somi/JO9sa/records/release-night-preflight-20261113/REPORT_KO.md>)
<!-- NIGHT_REFRESH_20261113:END -->

## R04 승인 후속: 반복 복합 의뢰 목표

2026-11-13.9개문의후목표등록/대기표시·단순전공등급및글로리아납품제외·기존특별목표유지. 새배열0,실제엔진105검사. [기록](<G:/somi/JO9sa/records/release-r04-repeat-goals-20261113/REPORT_KO.md>)

## R05 승인 후속 — 일반 반말 제외·인물 속성

말투속성1개(-1/0/1),전역배열0·자동임계값없음. 8명기본과명시켜기/끄기,구캐시/실제화자. 엔진188검사. [기록](<G:/somi/JO9sa/records/release-r05-voice-policy-20261113/REPORT_KO.md>)

## R03-10 승인 후속 — 키키모라 young형

키키모라전용분류검사1개,다른고객규약유지. 엔진72검사·36가격평가보존. [기록](<G:/somi/JO9sa/records/release-r03j-kikimora-young-20261113/REPORT_KO.md>)
