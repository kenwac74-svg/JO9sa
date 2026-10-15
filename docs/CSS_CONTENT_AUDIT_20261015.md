# CSS 누적 변경 조사 및 상시 상태 표시 정리 — 2026-10-15

## 적용 결과

- 노예·조수·개인실 1~4·개인실 공통 메뉴의 7개 출력 분기에서 virginity=3 전용 아이콘을 제거했다. 해당 값은 기존 비처녀 아이콘/툴팁으로 표시한다.
- virginity 값, 게임 효과, 신체 상세창의 '부드러운 보지' 표시는 그대로 유지했다.
- 두 설치본 css/base.css의 '크게 늘어난 상태' → '헐렁함' CSS 치환 한 줄만 제거했다. 다른 CSS 변경은 조사만 했으며 이관하지 않았다.
- 플레이본과 배포본의 기존 QSP가 서로 달랐으므로 각각 원본에 패치를 적용했다. 한쪽 파일로 덮어쓰지 않았다.
- QSP 왕복, 수정 대상 외 모든 필드 보존, 설치 후 후보 해시 일치를 확인했다. 실제 게임 재시작·화면 검증은 사용자가 해야 한다. 이미 실행된 QSP는 재시작/재열기 후 확인한다.
- 백업: G:/somi/IMGMG/backups/status-detail-only-20261015-1792059362965

## 조사 범위와 한계

두 설치본의 game/css 아래 CSS 전체(각각 base.css, mainScreen.css)를 조사했다. 보호 원본 G:/somi/JO9O/game/css의 대응 파일과 대조했다. 보호 원본은 현지 보존본이며 공식 배포판과 동일하다는 별도 검증을 뜻하지 않는다. mainScreen.css는 보존본과 동일하다. 두 설치본 base.css는 조사 전 서로 동일했다.

문구 content 선언과 display/visibility 등 숨김 선언을 정적 조사했다. 선언 존재와 최종 화면 활성 여부는 구분한다. 모든 화면의 CSS cascade를 실행해 검증한 보고서는 아니다. QSP 내부 style, 외부 도구 CSS, 퇴역·백업 파일은 이번 조사 범위가 아니다.

## CSS가 소유한 사용자 문구

| 문구 | 선언 위치 (수정 전 줄) | 역할 및 판정 |
|---|---|---|
| 주인공 | base.css:8482, #jo9_master_card:before | 카드 제목을 CSS에서 생성. QSP 소유 문구로 이관 후보 |
| 활성 노예 | base.css:8483, #jo9_slave_card:before | 이전 카드 제목. 뒤의 노예 규칙이 덮어쓰는 누적 흔적 |
| 조수 | base.css:8484, #jo9_assistant_card:before | 카드 제목을 CSS에서 생성. QSP 이관 후보 |
| 행동력 / 상태 | base.css:8532 | 상태창 위 소제목. 뒤 content:none/display:none 규칙으로 숨김. 불필요한 이전 문구 선언 정리 후보 |
| 노예 | base.css:8695, #jo9_slave_card:before | 활성 노예를 덮어쓰는 제목. 개인실에서는 base.css:9878이 빈 content로 다시 덮어씀. 화면별 제목은 QSP에서 결정할 대상 |
| 헐렁함 | base.css:9789 | QSP 툴팁을 다른 말로 치환. 이번에 제거 완료 |

고정 문구 선언은 수정 전 6곳(서로 다른 문구 6개)이다. '헐렁함'처럼 기존 툴팁을 다른 문구로 바꾸는 규칙은 이 조사에서 1곳 확인했다. 단순 빈 content와 !important 문자열은 문구로 세지 않았다.

## 문구 외에 CSS에 누적된 표시/리소스 변경

| 유형 | 확인 내용 | 처리 판단 |
|---|---|---|
| 제목 숨김 | 포트레이트의 기존 가상 제목, 행동력 / 상태 소제목 숨김 | 새 QSP 제목과 중복을 막던 흔적. QSP 제목 출력 정리와 함께 검토 |
| 개인실 이미지 숨김 | #snk_room_menu #center_image_home display:none (기존 base.css:9918) | 기존 배경을 다른 배치와 중복 표시하지 않게 하는 규칙. 제거 전 QSP 출력 경로 확인 필요 |
| 기존 이미지 대신 가상요소 이미지 | #exchange img 숨김, #back_home > a > img 숨김, 시설/축사 포트레이트 숨김 + :before 배경 이미지 | 단순 문구 치환은 아니지만 리소스 선택이 CSS에 들어감. QSP img 경로 이관 검토 후보. 지금 삭제하면 아이콘·시설 그림이 소실될 수 있음 |
| 동작 영역 외형 치환 | 여러 바로가기 링크의 :before 배경, 카드·행동력·시설의 테두리 생성 | 링크 동작은 QSP에 있음. 장식용 빈 content는 유지 가능. 리소스 선택과 장식을 분리해 판단 |
| 아이콘용 글자 숨김 | 상태/바로가기 컨테이너 font-size:0 | 이미지 아이콘 배치를 위한 스타일. 게임 문구 삭제와 동일시하면 안 됨 |
| 툴팁 표시 방식 | hover 전 숨김, hover 시 attr(tooltip-data) 표시, 화살표 제거 | QSP 문구를 그대로 표시하는 원래 CSS 역할. 문구 치환과 구분하여 유지 |
| 버전별 배치 누적 | JO9_APPROVED_UI_STRUCTURE 및 V19x 등 카드 크기·폰트·좌표·시설 배경·테두리·레이어 보정이 연속 선언됨 | 같은 선택자의 뒤 규칙이 앞 규칙을 대체. 후속 정리 때 현재 외형을 보존하며 합칠 대상 |

정적 추출에서는 원본과 다른 숨김 관련 규칙 29개를 확인했다. 이 숫자는 버그 29개나 모두 삭제할 대상이라는 뜻이 아니다. 아래 부록에는 해당 선언을 그대로 기록한다.

## 테스트

1. 게임을 완전히 다시 열고 hbe를 불러온 뒤 개인실 2 키쿠치요 화면을 재출력한다.
2. 전용 '헐렁함' 툴팁이 사라지고 비처녀 아이콘의 '처녀막 없음'이 표시되는지 확인한다.
3. 신체 상세창의 '부드러운 보지'가 유지되는지 확인한다.
4. 다른 노예/조수 및 개인실에서 처녀·복원 상태의 기존 표시가 유지되는지 확인한다.

## 설치본 해시

```json
{
  "work": {
    "qsp": "G:\\somi\\Jack O Nine Tails v2.4_work\\game\\jack.qsp",
    "before": "9bd9ff1d4e485bf8f6ae7d7037c3380da47d707aa04139ab96f13e77e1da462c",
    "after": "af6170660b4c77bfec9bdc02b00a205e0f5fd376e8f42f32c209fda75491621d",
    "css": "G:\\somi\\Jack O Nine Tails v2.4_work\\game\\css\\base.css",
    "cssBefore": "632adbc9330b7871b4e9d85a4c0b04e49d0ec358dd42717645ba032c10e2cf5e",
    "cssAfter": "22cf0fb078729a1cdaf82d4b7fddc3d532b0361a85d4eebc23029d977e15f482"
  },
  "full": {
    "qsp": "G:\\somi\\Jack O Nine Tails v2.4 Kor_Full\\game\\jack.qsp",
    "before": "467e5c5dc133b217633cf8de4ffe796886e1cf61f12ebd68254e51971be5bee8",
    "after": "b31bd9e745e86bfded473f93f2c06eb70856a71e24de4fd585c7cf6e4b073aea",
    "css": "G:\\somi\\Jack O Nine Tails v2.4 Kor_Full\\game\\css\\base.css",
    "cssBefore": "632adbc9330b7871b4e9d85a4c0b04e49d0ec358dd42717645ba032c10e2cf5e",
    "cssAfter": "22cf0fb078729a1cdaf82d4b7fddc3d532b0361a85d4eebc23029d977e15f482"
  }
}
```

## 부록: 숨김 관련 규칙 (수정 전 정적 추출)

- 줄 약 8457 · `#main_screen:before`

```css
content:none !important; display:none !important;
```

- 줄 약 8511 · `#master_short_ava:before,#slave_short_ava:before,#assistant_short_ava:before`

```css
content:none !important; display:none !important;
```

- 줄 약 8545 · `#slinfo_block,#asinfo_block`

```css
width:28px !important; height:auto !important; white-space:normal !important; color:#000 !important;
    font-size:0 !important; text-align:center !important; overflow:visible !important;
```

- 줄 약 8657 · `#fast_punish_slave,#fast_reward_slave, #fast_clean_slave,#fast_clean_assistant,#fast_clean_master, #fast_cook_slave,#fast_cook_assistant,#fast_cook_master, #fast_tentacle_slave,#fast_tentacle_assistant`

```css
position:absolute !important;
    display:block !important;
    margin:0 !important;
    padding:0 !important;
    font-size:0 !important;
```

- 줄 약 8843 · `#debug_info,#debug_info_assistant, #fast_social,#fast_social_a, #fast_influence,#fast_influence_tutorial,#fast_influence_a, #fast_question,#fast_question_tutorial,#fast_question_a`

```css
position:absolute !important;
    width:28px !important;
    height:28px !important;
    margin:0 !important;
    padding:0 !important;
    font-size:0 !important;
    z-index:8 !important;
```

- 줄 약 8891 · `#slinfo_block,#asinfo_block`

```css
left:1241px !important;
    width:32px !important;
    height:auto !important;
    white-space:normal !important;
    font-size:0 !important;
    line-height:0 !important;
    text-align:center !important;
```

- 줄 약 8937 · `#fast_sex_S,#fast_sex_A,#fast_wash_master,#fast_clean_master,#fast_cook_master, #fast_punish_slave,#fast_reward_slave,#fast_wash_slave,#fast_slave_milking, #fast_clean_slave,#fast_cook_slave,#fast_tentacle_slave, #fast_assistant_milking,#fast_clean_assistant,#fast_cook_assistant,#fast_tentacle_assistant`

```css
position:absolute !important;
    width:32px !important;
    height:32px !important;
    margin:0 !important;
    padding:0 !important;
    font-size:0 !important;
    box-sizing:border-box !important;
```

- 줄 약 8998 · `#master_short_stat:before,#slave_short_stat:before,#assistant_short_stat:before`

```css
content:none !important;
    display:none !important;
```

- 줄 약 9156 · `#exchange img`

```css
width:32px !important;
    height:32px !important;
    visibility:hidden !important;
```

- 줄 약 9183 · `#exchange img`

```css
width:42px !important;
    height:64px !important;
    visibility:hidden !important;
```

- 줄 약 9388 · `.jo9_v16_actions`

```css
position:absolute !important; left:1025px !important; width:248px !important; height:32px !important;
    font-size:0 !important; line-height:0 !important; white-space:nowrap !important; z-index:4 !important;
```

- 줄 약 9627 · `#master_short_stat:before,#slave_short_stat:before,#assistant_short_stat:before`

```css
content:none !important;display:none !important;
```

- 줄 약 9628 · `#master_short_stat > a:before,#slave_short_stat > a:before,#assistant_short_stat > a:before`

```css
content:none !important;display:none !important;
```

- 줄 약 9637 · `#active_spell > br`

```css
display:none !important;
```

- 줄 약 9642 · `.jo9_ap > a`

```css
position:relative !important;display:block !important;box-sizing:border-box !important;width:155px !important;height:16px !important;padding:2px 3px !important;background:#1f2216 !important;border:3px solid #685436 !important;-webkit-border-image:url("content/pic/ui/5d095d34b115.png") 20 stretch !important;border-image-source:url("content/pic/ui/5d095d34b115.png") !important;border-image-slice: 20 !important;border-image-width:3px !important;border-image-repeat:stretch !important;border-width:1px !important;border-image-width:2px !important;font-size:0 !important;line-height:0 !important;text-decoration:none !important;
```

- 줄 약 9653 · `.jo9_ap > a:before`

```css
content:none !important;display:none !important;
```

- 줄 약 9664 · `#back_home > a > img`

```css
visibility:hidden !important;
```

- 줄 약 9665 · `#back_home > a:before`

```css
content:none !important;display:none !important;
```

- 줄 약 9670 · `[tooltip-data]:before`

```css
content:none !important;display:none !important;
```

- 줄 약 9691 · `.jo9_extra`

```css
position:absolute!important;left:1181px!important;width:48px!important;height:16px!important;z-index:5!important;font-size:0!important;line-height:0!important;white-space:nowrap!important
```

- 줄 약 9696 · `.jo9_extra_icon:before`

```css
content:none!important;display:none!important
```

- 줄 약 9730 · `[tooltip-data]:not(:hover):after`

```css
content:none!important;display:none!important;visibility:hidden!important;opacity:0!important;border:0!important;padding:0!important;box-shadow:none!important;outline:0!important
```

- 줄 약 9743 · `#cage > a > img,#barn > a > img`

```css
visibility:hidden!important
```

- 줄 약 9762 · `#barn_cow>a>img,#barn_harpy>a>img,#barn_pig>a>img`

```css
visibility:hidden!important
```

- 줄 약 9781 · `#upper_equipment:not(#jo9_h_a):not(#jo9_h_b):not(#jo9_h_c):not(#jo9_h_d):not(#jo9_h_e)`

```css
display:-webkit-flex!important;display:flex!important;-webkit-align-items:center!important;align-items:center!important;height:26px!important;line-height:0!important;font-size:0!important;
```

- 줄 약 9782 · `#upper_equipment>div:not(#jo9_h_a):not(#jo9_h_b):not(#jo9_h_c):not(#jo9_h_d):not(#jo9_h_e),#upper_equipment>a:not(#jo9_h_a):not(#jo9_h_b):not(#jo9_h_c):not(#jo9_h_d):not(#jo9_h_e)`

```css
position:relative!important;display:block!important;width:26px!important;height:26px!important;margin:0!important;padding:0!important;font-size:0!important;line-height:0!important;-webkit-flex:0 0 26px!important;flex:0 0 26px!important;
```

- 줄 약 9785 · `#upper_equipment [tooltip-data]:not(#jo9_h_a):not(#jo9_h_b):not(#jo9_h_c):not(#jo9_h_d):not(#jo9_h_e):after`

```css
display:none!important;content:none!important;
```

- 줄 약 9787 · `#upper_equipment [tooltip-data]:not(#jo9_h_a):not(#jo9_h_b):not(#jo9_h_c):not(#jo9_h_d):not(#jo9_h_e):before`

```css
display:none!important;
```

- 줄 약 9917 · `#snk_room_menu #center_image_home`

```css
display:none!important
```
