# SNKmod 분리 이전 원본 경로 의존 검사

2026-09-28. 사용자가 독립 설치형 누적 패키지임을 재확인한 뒤 검사 범위를 기존 이미지 목록이 아닌 실제 참조로 확장했다. 게임/패키지는 수정하지 않았다.

## 이전 결론 정정

FIX6 115개와 R3 140개가 모두 0.1에 있다는 검사는 과거 패키지 목록의 연속성만 보장한다. 그 목록 바깥에서 원본 경로의 이미지를 교체해 쓰던 자산까지 포함됐다는 증거가 아니다. 따라서 이전의 '리소스 누락이 아니다'라는 결론은 철회한다. QSP가 설치 결과와 달라진 문제는 별개로 여전히 확인된 사실이다.

## 검사 방법

배포 ZIP의 qsp-patches.json에 있는 248개 본문과 payload/css/base.css, payload/json/menu_icon.json에서 정적인 content/pic 이미지 경로를 추출했다. SNKmod 밖의 ui/, ui overhaul/, buttons/ 및 CSS 참조를 집계했다. 각 경로의 G:/somi/JO9/game 및 G:/somi/JO9O/game 파일을 비교했다. 결과 목록은 legacy_resource_refs.json에 저장했다.

## 결과

- 원본 경로에 남은 UI/CSS 정적 참조: 대소문자 표기 기준 2,157개. ui overhaul 2,082개, ui 34개, buttons 37개, 기타 CSS 4개.
- 이 중 ui overhaul 147개는 작업용 JO9와 비교용 JO9O 파일의 내용이 다르다.
- 해당 147개는 모두 배포 ui_map의 Originals에 없고, 작업용 파일의 SHA256도 배포 Images 143개 중 어느 것과도 일치하지 않는다. 즉 해당 작업용 이미지 바이트는 현재 배포 패키지에 없다.
- 예: Balsam.png, Rose.png, a ring with a gem.png, agraba.png, fashion_house.png, erosalon.png와 여러 gray 변형. 모두 JSON 참조가 남아 있다.
- CSS도 menu_button.png, money_counter.png, msg_bg.png, padding.png, ui overhaul/bar.png, UI overhaul/bar2.png, ui/jon-UIadds/sjm_bg.png, sjm_bg2.png 등을 원본 경로에서 읽는다.
- QSP에도 buttons/home_button.png, buttons/back_button.png, ui/grimdark/bg/page_blank.png, ui/jon-UIadds/Arouse0~5.png 등의 원본 경로 참조가 남아 있다.
- JSON의 정적 UI 참조 12개는 두 게임 폴더 모두에서 파일이 발견되지 않았다. 목록에는 agraba_gray.png, agraba_poor2.png, agraba_poor2_gray.png, cum_gray.png, elisabet_gray.png, farm_shop.png, futaland_tower_gray.png, kamasutra.png, left hand_gray.png, over the shoulder_gray.png, right hand_gray.png, sabrina_2_gray.png가 있다.

## 원인

build/build_package.py는 FIX6 manifest Files와 resource_rules.json의 extra에 등록된 파일로 target 목록을 만든다. resolve()는 이 목록에 있는 경로만 SNKmod로 바꾼다. 목록에 없는 원본 UI 경로는 그대로 둔다. 최종 검증도 SNKmod 참조의 파일 존재와 기존 target 경로의 미치환 여부만 확인한다. 따라서 처음부터 target에 등록되지 않은 교체 이미지나 원본 UI 의존은 검사를 통과한다.

## 범위와 남은 확인

2,157개가 모두 현재 화면에서 실행되는 것은 아니다. JSON의 미사용 항목, 다른 테마, 중복 표기가 포함될 수 있다. 147개 변경본이 언제 누구에 의해 승인됐는지는 파일 비교만으로 확정하지 않는다. 사용자 설명과 일치하는 배포 누락 후보이자 원본 경로 의존은 확인됐지만, 각각의 최종 채택본은 기존 기록/원본 이미지와 대조해야 한다.

동적 경로, iif 문자열, 변수 조립 경로, CSS 외부 자산까지 모두 평가한 완전한 의존성 검사는 아직 아니다. 12개 미발견 참조도 실제 해당 메뉴에서 사용되는지 확인해야 한다.

## 독립 설치형 수용 조건

사용 모드 리소스 전체를 명시적인 소스 목록에 등록하고 패키지에 포함한다. 해당 모드 UI 참조를 content/pic/SNKmod 아래로 통일한다. 설치 대상이 없어도 생성하고 있으면 백업/변경 알림 및 Y/N 정책에 따라 패키지 내용으로 교체한다. 이전 패치 설치 여부나 원본 경로의 교체 이미지 존재를 전제로 하지 않는다. 검사에는 패키지 외 UI 자산 참조를 실패 조건으로 추가하고, 실제 런처 실행 후 QSP 유지 검사도 별도로 수행한다.
