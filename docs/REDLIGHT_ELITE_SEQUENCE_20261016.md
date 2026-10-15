# 홍등가 엘리트 여자 CG 3장 — 2026-10-16

사용자 지시: 수정된 거리의 여자들 분기와 같은 3장 구성을 엘리트 여자(22705)에 적용한다. 원래 배경 전용 첫 페이지와 CG 두 장인 구성을, 첫 페이지부터 CG 세 장을 표시하는 구성으로 바꾼다. 기존 BG와 그 위의 표시 레이어 구조는 유지한다.

| 기존 페이지 | CG 연결 |
|---|---|
| 1 | scene/whore_redlight/whore_redlight-e001.png |
| 2 | scene/whore_redlight/whore_redlight-e002.png |
| 3(마지막) | scene/whore_redlight/whore_redlight-e003.gif |

interaction_city의 22705 분기에서 $special_image[1]을 추가하고 [2]/[3]의 파일 경로만 변경했다. $special_bg의 기존 whore_redlight-311 값, BG·캐릭터 레이어/CSS/렌더러, 대사·선택지·비용(10)·능력 효과는 그대로다. 새 페이지나 랜덤 분기를 만들지 않는다. 세 이미지 모두 795×596이고 마지막 GIF는 7프레임 원본을 그대로 사용한다.

플레이 원본 이미지를 배포 폴더와 저장소 assets/content/pic/scene/whore_redlight에도 보관했다. 이미지 변환·재생성·기존 게임 이미지 삭제는 하지 않았다. 두 QSP는 서로 덮어쓰지 않고 공식 적용기로 각각 패치했다.

한 이미지 경로 패치를 역치환하면 두 대상 각각 수정 직전 QSP 전체 바이트가 복원된다. 따라서 BG·렌더러·기존 다른 분기 불변을 확인했다. 왕복/문자열 경계/세 페이지 경로 및 두 게임·저장소 이미지 해시 일치 확인 완료. 게임 실행·화면 및 GIF 실제 재생 확인은 사용자 담당이다.

백업: G:/somi/IMGMG/backups/redlight-elite-20261016-1792088204806. [해시·파일별 검증](qa/2026-10-16_redlight-elite-sequence.json). 패치: mods/2026-10-16_redlight_elite_e_sequence.json.
