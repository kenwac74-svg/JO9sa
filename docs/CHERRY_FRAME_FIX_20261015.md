# 체리 아이콘 원본 테두리 복구와 test2 확인

사용자가 새 황금색·검은색 체리의 배경·테두리가 기존 상태 아이콘과 다르다고 보고했다. 두 색상 모두 수정했다. 현재 화면에서 효과가 보인다는 사용자 확인은 아래 저장 데이터와 구분해 기록한다.

## 변경

- 이전 두 아이콘은 각각 1254×1254 투명 PNG(약 1.1MB)였고 원본 프레임이 없었다. 현재 원본 `content/pic/ui/Vir_Ocr.png`는 28×30 RGBA다.
- 원본 빨간 체리의 배경·테두리·줄기·투명도를 그대로 복사하고 열매 168픽셀의 RGB만 색상 편집 결과로 교체했다. 두 새 PNG도 28×30이다. 해당 168픽셀 바깥의 모든 픽셀과 전체 alpha가 원본과 바이트 단위로 같다.
- 플레이·배포 각각 `content/pic/ui/`와 `content/pic/ui/jon-UIadds/`의 `Vir_black.png`, `Vir_golden.png`를 교체했다. 저장소 `assets/status-cherries/`에도 같은 파일을 반영했다.
- QSP의 해당 아이콘 14개 img 태그만 `width:30px;height:30px` → `width:28px;height:30px`로 수정했다. `sjm_UI_UIadds`, `slave_private_room1~4`, `snk_room_menu_screen` 총 6개 location이다. 상태값·분기·조건·기술·발견 확률·대사·CSS는 변경하지 않았다.

기존 자산과 QSP는 `docs/evidence/meiki-20261015/cherry-frame-installed.json`에 기록된 외부 백업에 보존했다. 선언형 패치 `mods/2026-10-15_zzzzz_cherry_frame_size.json`를 공식 `tools/apply_mods.ps1`로 적용했다. 양쪽 QSP의 바이트 왕복·예상 해시·모든 비대상 줄 보존, CSS 해시 보존을 확인했다. 수정 아이콘의 실제 클라이언트 화면 재확인은 사용자 대기다.

## test2.sav에서 확인한 결과

원본 `G:/somi/Jack O Nine Tails v2.4_work/game/save/test2.sav`는 읽기만 했고 해시 보존을 확인했다. 이사벨라는 기존 연령 값 2인 성인이다.

| 변수 | 저장 값 | 의미 |
|---|---|---|
| virginity | 4 | 새 특성 상태 |
| jo9_meiki_known / checked | 1 / 1 | 발견 이력과 최초 판정 완료 |
| jo9_meiki_prev | 4 | 최근 상태 일치 |
| jo9_meiki_initialized | 2 | 발견 시 기술 1회 부여 완료 |
| sub_vaginal | 5 | S+ |
| sub_threesome / sub_dp / sub_tp / sub_gangbang / sub_bukkake | 모두 3 | B+ 5개 |

따라서 이 저장 파일에는 발견·상태 표시·초기 기술 부여 결과가 들어 있다. 한 파일만으로 발견이 정확히 5%로 작동했는지, 전환 전후 경로 전체, 교육 XP +1이나 만족도 +1까지 검증된 것으로 확대하지 않는다. 다른 역할의 상태·기술은 변경하지 않았다.

## 이미지 제작 기록

기본 내장 image_gen 편집을 사용했다. 참조는 기존 `Vir_Ocr.png`, 출력은 검은색/황금색 2타일 이미지다. 핵심 프롬프트: 원본 빨간 체리의 동일한 실루엣·배치·초록 줄기·어두운 배경·고금색 프레임을 유지하고, 열매만 왼쪽 검은색·오른쪽 황금색으로 변경하며 글자나 추가 장식 없이 작은 픽셀 아이콘으로 편집. 최종 파일은 이 편집 결과의 색상을 원본 열매 마스크에 넣고 배경/테두리/줄기/alpha를 원본 픽셀로 고정해 만들었다. 생성 도구가 그린 프레임을 그대로 채택하지 않았다.

비교 미리보기는 `assets/status-cherries/comparison.png`이며 왼쪽부터 기존 빨간색·검은색·황금색이다.
