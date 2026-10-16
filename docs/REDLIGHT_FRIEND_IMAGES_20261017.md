# 개인 영업 여자와 친구: 이미지 연결

요청한 선택지 `개인 영업 여자와 친구 (5$)`는 `interaction_city=22704`로 들어간다.

기존 3페이지 진행에 다음 이미지를 연결한다.

| 페이지 | 파일 |
|---|---|
| 1 | `scene/whore_redlight/whore_redlight-f001.png` |
| 2 | `scene/whore_redlight/whore_redlight-f002.png` |
| 3 | `scene/whore_redlight/whore_redlight-f003.png` |

첫 배경 `$special_bg`도 f001을 사용하며, `$special_image[1..3]`을 각각 지정한다. 세 이미지는 무작위 후보가 아니라 페이지 순서에 대응한다. 파일은 이미 플레이폴더에 있으므로 이미지 복사·교체는 하지 않는다.

수정 로케이션은 `interaction_city` 하나, 표식은 `REDLIGHT_FRIEND_F_SEQUENCE`다. 선언형 기록은 `mods/2026-10-17_zzzzz_redlight_friend_f_sequence.json`이다. 비용 5, 품질 3, 상호작용 유형과 기존 대사 배열 `$Redlight_whore_d`, 주변 선택지는 그대로다. 새 함수·변수·로케이션은 추가하지 않는다.

이 구간은 장면 진입 시 배경과 페이지 이미지 배열을 지정하며 반환값은 없다. 기존 `$special_bg`/`$special_image` 출력 기능에 의존한다. 표식 구간만 제거하면 이 선택지의 이미지 지정이 사라지므로 원래 이미지로 복원하려면 패치를 역적용한다.

플레이 QSP에만 적용한다. 적용 전에 최신 파일 해시를 확인하고 백업하며 배포본과 보호 원본은 변경하지 않는다. 왕복·정확한 역적용·표준 패치 재생과 이미지 파일 존재·PNG 헤더를 확인한다. QSP 엔진에서 해당 분기의 경로 및 비용·대사 배열 유지도 검사한다. 실제 게임 클라이언트 실행·페이지 넘김은 사용자 확인 범위다. 적용 해시와 백업은 같은 작업 폴더의 installed.json에 기록한다.
