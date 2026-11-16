# 개인실·BGM 제보 조사 — 2026-11-14

범위: 현재 WORK dc95823ecd264e8ec32b4350d7008ba6a4f9014f71ed311b9a91c283fd9e240a. 게임파일 수정 없음.

1. 업무 글: 현행 label은 비용·조건을 제거한 짧은 항목명이다. 제보 게임이 이 버전인지 불명. 우측 상태표시 태그가 절대배치되어 라벨과 충돌할 수 있으며 실제 제보 화면은 미재현.
2. 툴팁: jo9_room_duty panel 행에는 white-space:nowrap이 있으나 base.css 9970의 #snk_private_room [tooltip-data]:after가 normal!important로 덮어쓴다. nowrap을 원인으로 단정하지 않는다. 최종 스타일은 폭220px,14px/1.5,위쪽 bottom:calc(100% + 6px) 고정. 긴 도움말은 높이가 커져 화면 위를 벗어날 수 있다. tooltip-data의 <br>는 CSS attr 텍스트이므로 HTML줄바꿈으로 해석되지 않는다. 화면 안 위치/폭 제한과 실제 줄바꿈으로 수정 권고.
3. 외근 무기: gear루프0~1에서 right_wpn/left_wpn만 검사. back_wpn 플람베르그+갑옷으로 can=0, 오른손 글라디우스 추가시1을 실제 엔진에서 재현. back_wpn을 검사에 추가하면 입장조건뿐 아니라 같은 gear함수로 산정하는 무기등급/수확에도 반영된다. 기존 등급표에 플람베르그4가 이미 정의되어 있다.
4. 집안일 내근: 단순 중복 메뉴는 아니다. daily가 duty_ok를 정하고 worker가 노예·조수의 개별 요리/청소 규칙보다 먼저 개인실 담당을 반환한다. 일반규칙과 결과작업은 같지만 우선순위가 다르다. 내근 설정시 cook/clean둘 다 켜며 한명만 가능, 잡일·요리A필요, 수행일칼로리2소모와기분비용이 있다. 일반규칙은 기존우선순위/수행조건. 내근 삭제·추가보상은 밸런스 결정이므로 변경하지 않는다.
5. 도시음악: 예전에 승인한 거주지곡유지+지역명성추가 재생 설계다. 현행 jo9_residence_bgm city는 귀족신분1또는평판5이상일때 city_honor.mp3 우선, 그외 황소주거 taurus_house는 palace.mp3. 백색주거 white_house는 vatican.mp3. 실제엔진에서 황소/비귀족=palace와귀족=honor 확인. 따라서 이동해도같은음악은 설계동작이며, 제보의 '백색궁전곡'이 실제vatican인지곡이름인지는 확인하지 못했다. 2.4.0과다른것만으로버그확정하지 않는다.
6. 옛세이브 안개전투 무음: jo9_audio_formats가 ongload에서 music배열WAV경로와 fogs_options[2]/display_options[2]의 fight_master.wav를MP3로교체한다. 역슬래시옛 music['fight']경로의MP3보정은 실제엔진PASS, MP3파일존재. 단 실제제보SAV 미확인. #options fogs_options[2] 진입은 fight_master.mp3를 sound_volume으로 재생하고 residence controller에 event_sound=1을넘긴다. 즉 해당진입음악은 효과음0이면무음이된다. 일반전투음악은 music_volume 경로도있어 전투모든구간원인이라고단정하지않는다. 해당BGM의음량을 music_volume/event_sound=0으로 통일하고,재현SAV의캐시/음량상태를 추가확인하는수정권고. 빠른전환시음악무음이라는원본주석도있어엔진문제가능성을분리한다.

검사:격리FastQSP단일probe PASS(외근2조건/BGM2조건/옛경로1조건/담당자우선순위1조건). 화면/실제청음/개인SAV불러오기는미검증. 게임·소스·음원·Full·ZIP·커밋푸시 변경 없음.
