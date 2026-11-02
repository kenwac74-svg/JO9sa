# 갈라테야 복장 3종 추가

사용자 제공 PNG 세 장을 WORK에 등록했다. 알몸은 현재 `content/pic/characters/galateya.png`를 그대로 사용한다. 배포 동기화와 ZIP 제작은 사용자 보류 지시를 유지한다.

## 그림과 구도

하녀 `galateya_made.png`, 비서 `galateya_sec.png`, 도미나 `galateya_dom.png` 원본은 `content/modworkpic`에 그대로 둔다. 새 게임용 그림은 `content/pic/girls/full/2583/2583_full_maid.png`, `2583_full_secr.png`, `2583_full_dom.png`다. 모두 795×596 RGBA다.

원본 얼굴·신체·의상·포즈를 다시 그리지 않았다. 기존 알몸 컷과 원본들에서 두 홍채 중심을 읽어 눈 사이 거리로 균일 배율을 산정하고, 눈 중심을 가로로 맞췄다. 얼굴을 가로/세로로 따로 늘리지 않는다. 머리카락과 머리장식이 프레임 위에서 잘리지 않도록 위쪽 여백을 확보했다. 이 때문에 비서의 눈 높이는 기준보다 약 12px, 도미나는 약 5px 아래에 남는다. 하단은 공통 화면 경계에 맞춰 자른다. 기존 알몸 컷과 옛 `girls/full/galateya_purple_long.png`, 얼굴 그림들은 수정하지 않는다.

`prepare-assets.cjs`와 `assets-prepared.json`에 입력 해시, 원본 크기, 배율·이동·잘라낸 영역 및 최종 해시를 남겼다. 투명 알파를 유지한 축소/확대이며, 배경 분리나 단색 치환은 하지 않았다. `framing-final.jpg`에서 네 복장을 같은 배경과 같은 표시 크기로 비교할 수 있다.

## 기존 복장 조회 사용

`json/slaves/2583_galateya.json` 하나에 다음 등록만 추가한다.

| 표시 | image_mode | 메뉴 존재 등록 | 표시용 등록 |
|---|---:|---|---|
| 알몸 | 0 | 기존 기본 외형 | indpack_title / indpack_naked → characters/galateya |
| 하녀 | 2 | fullmade | indpack_maid → girls/full/2583/2583_full_maid |
| 비서 그림 | 3 | fullsecretary | indpack_secr → girls/full/2583/2583_full_secr |
| 도미나 | 1 | fullmistress | indpack_dom → girls/full/2583/2583_full_dom |

`indpack_info`에는 타입2583과 고유 pack_uid를 등록한다. 기존 120개 JSON 값과 원문을 유지하며, 이전 기본 경로 `fullimage`도 보존한다. 원래 JSON의 중복 키나 공백을 이번 작업에서 정리하지 않는다.

기존 QSP의 `assistant_stat`, `display_fullimage`, `jo9_seed_role_images`가 등록을 사용한다. QSP·새 영구 변수·세이브 변환은 추가하지 않는다. 현행 UI는 성숙 연령 외의 `fullsecretary` 슬롯을 **교복**으로 표시하므로, 갈라테야에서는 그 선택이 이번 비서 그림에 연결된다. 표시 문구를 바꾸려고 연령이나 공통 UI를 수정하지 않는다.

JSON 등록을 다시 읽도록 게임을 완전히 종료한 뒤 재실행해서 확인한다. 기존 실제 세이브의 UI 불러오기는 별도 사용자 플레이 확인 범위다.

## 기록과 제거 영향

PNG 세 장과 JSON은 WORK 및 `resources/new`/`assets/json/slaves`의 추적 소스에 맞췄다. 개인 이미지 패치 원장에는 `GALATEYA_OUTFITS_20261101:replace` 한 건으로 세 PNG를 기록한다. 카탈로그는 운영본과 portable seed에 새 세 행과 안정 ID를 추가하며 기존 체크·추가 컷 조건·다른 그림의 수동 편집을 유지한다.

그림만 지우면 해당 복장을 선택할 때 이미지가 빠진다. 되돌릴 때는 `recovery/2583_galateya.before.json.gz`의 기존 JSON과 함께 등록을 복구해야 한다. 새 PNG는 원래 존재하지 않았으므로 제거할 경우 이번 설치 명세의 정확한 세 경로만 대상으로 확인한다. 원본·기본 그림·세이브·배포 폴더는 제거 대상이 아니다.

## 검증 범위

`assets-installed.json`은 파일·등록 보존과 WORK 반영 결과다. `catalog-*` 보고서는 목록과 실제 HTTP PNG 제공을 검증한다. `native-*-report.json`은 별도 엔진에서 JSON 첫 로드, 복장 경로와 PNG 로딩을 검증하며, 전체 게임 출고 합격이나 모든 세이브 호환의 증명으로 사용하지 않는다. 기존에 발견된 크레딧 줄바꿈 문제와 배포 출고 검사는 이번 작업과 구분하여 보류한다.
