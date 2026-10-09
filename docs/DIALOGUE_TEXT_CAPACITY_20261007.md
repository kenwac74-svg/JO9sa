# 대사 출력 영역 수용량 측정 (2026-10-07)

실제 플레이 파일의 config.xml (1280×800), css/base.css와 game/fonts를 이용한 내부 Chromium 측정이다. QSP의 렌더러가 일반 대사를 #text에 출력하는 것도 읽기 전용으로 확인했다. Qt5 WebKit 게임 엔진에서의 실행 검증은 하지 않았다.

높이는 CSS 박스 높이와 화면 하단(800px) 중 먼저 닿는 경계를 사용하고 패딩·테두리를 뺐다. 일반 #text는 top 615px + margin-top 6px이므로 179px가 보인다. 개인실은 border-box 740×185에서 좌우 패딩 83px, 상하 패딩 34px을 제외한 657×151px다.

연속 한글은 '가' 반복, 한국어 표본은 공백·문장부호가 포함된 중립적인 4문장을 반복해 이진 탐색으로 계산했다. 표본 글자 수는 모든 문장에 적용되는 보장값이 아니다. 단어 경계, 변수 치환, 굵은 글씨, br, 문단과 이모지에 따라 수용량이 달라진다. 글꼴 이름이 파일 이름과 일치하지 않거나 CSS가 글꼴을 상속하는 영역은 Chromium 대체 글꼴을 사용한 참고값이다(#center_text_compact, #center_text_compact_blue_title, #bg_blue_script_right2 등). 일반 #text와 개인실의 경기천년제목 Medium은 실제 파일을 로드했다.

일반 대사 지침: 기존 최대 6줄을 제거. 자동 줄바꿈 7줄 예산에 한국어 본문 약 370~390자(공백 포함)를 활용한다. 화자 전용 줄/명시 줄바꿈은 한 줄당 약 50~57자만큼 본문 분량을 줄인다. 다른 영역은 원문/맥락에서 확실히 식별할 수 있을 때만 그 영역의 측정치를 참고한다.

| CSS 영역 | 유효 폭×높이 px | 글자 px | 행간 px | 줄 | 연속 한글 | 한국어 표본 |
|---|---:|---:|---:|---:|---:|---:|
| title_scroll_text | 710×580 | 24 | 25 | 23 | 1104 | 1410 |
| title_scroll_text_left | 350×580 | 25 | 26 | 22 | 506 | 639 |
| title_scroll_text_right | 330×280 | 45 | 46 | 6 | 72 | 88 |
| title_scroll_text_rightmid | 280×280 | 16 | 16 | 17 | 476 | 612 |
| title_scroll_text_rightlow | 300×280 | 25 | 26 | 10 | 190 | 247 |
| text | 740×179 | 18 | 23.40625 | 7 | 322 | 403 |
| bg_blue_script | 770×575 | 18 | 23.40625 | 24 | 1152 | 1429 |
| bg_blue_script_right | 650×600 | 18 | 23.40625 | 25 | 1000 | 1255 |
| bg_blue_script_add | 350×345 | 18 | 23.40625 | 14 | 294 | 377 |
| side_panel_text | 385×543 | 20 | 25 | 21 | 420 | 529 |
| center_text | 745×585 | 16 | 16 | 36 | 2736 | 3496 |
| center_text_compact_blue_title | 255×100 | 31 | 45 | 2 | 16 | 21 |
| center_text_compact_blue_original | 745×585 | 18 | 19.796875 | 29 | 1334 | 1685 |
| center_text_compact_blue | 625×550 | 18 | 22.5 | 24 | 936 | 1162 |
| center_text_compact_auspex | 625×550 | 18 | 22.5 | 24 | 936 | 1162 |
| center_text_compact | 745×585 | 16 | 24 | 24 | 1200 | 1472 |
| center_text_column_1 | 400×585 | 27 | 28 | 20 | 480 | 612 |
| center_text_column_2 | 300×585 | 27 | 28 | 20 | 360 | 460 |
| center_text_column_4 | 580×585 | 30 | 31 | 18 | 558 | 719 |
| bottom_text_1 | 300×185 | 22 | 23 | 8 | 176 | 224 |
| upper_text | 525×170 | 19 | 25.65625 | 6 | 186 | 230 |
| lower_text | 225×170 | 19 | 25.65625 | 6 | 78 | 97 |
| left_text | 325×470 | 26 | 28.59375 | 16 | 320 | 412 |
| left_text_teach | 330×500 | 26 | 27 | 18 | 360 | 470 |
| middle_text | 260×500 | 26 | 28.59375 | 17 | 272 | 354 |
| right_text | 250×470 | 26 | 28.59375 | 16 | 240 | 314 |
| title_scroll_text_left_1 | 255×400 | 25 | 27.5 | 14 | 224 | 294 |
| title_scroll_text_left_2 | 255×400 | 25 | 27.5 | 14 | 224 | 294 |
| title_scroll_text_left_3 | 275×485 | 25 | 25.25 | 19 | 342 | 428 |
| title_scroll_text_points | 175×50 | 28 | 29 | 1 | 10 | 12 |
| title_scroll_text_point_name | 65×225 | 25 | 26.25 | 8 | 32 | 39 |
| bg_blue_script_right2 | 515×575 | 22 | 28.59375 | 20 | 500 | 613 |
| snk_private_room #text | 657×151 | 18 | 22.5 | 6 | 246 | 305 |
