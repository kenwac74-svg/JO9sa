# 개인 편집 장비·보관함 문구 복원 (2026-10-15)

사용자 지시: 이모티콘뿐 아니라 식품 동면고 → 식품 저장고 등 직접 고친 항목명도 복원한다.

원천은 I:/내 드라이브/Moding/JO9WORK/records/dialogue-mods의 2026-10-05 편집 JSON이다. 해당 기록이 현재 mods에 반영되지 않았으며, 10월 11일 보관 QSP부터 이미 이 수정이 빠져 있었다. 정확히 어느 덮어쓰기에서 사라졌는지는 확정하지 못했다.

## 복원 범위

- master_stat: 연구실·가구 및 용품·식품 저장고·착용 중 장비·착용 가능 장비의 문구 및 아이콘.
- slave_stat: 착용 중 장비 및 두 조건 분기의 착용 가능 장비 아이콘·문구.
- assistant_stat: 착용 중 장비 및 장비 선택 분기 아이콘·문구. 비버튼 분기는 19:19:10 최종 편집 내용 그대로 복원.
- 이후 정리된 ui/jon-UIadds 이미지 경로를 보존했다. 폐지된 SNKmod 경로를 되살리지 않았다.
- 최근 사용자가 플레이본에 수정한 대사를 보존했다. 두 QSP 전체를 서로 복사하지 않았다.

선언형 기록: mods/2026-10-15_restore_personal_equipment_emoji.json 및 mods/2026-10-15_z_restore_personal_equipment_text.json. 두 번째 모드는 첫 번째 이후에 적용한다.

## 적용·검증

플레이 G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp:

- 전: 9c84e2ba35a2a238321ce9c3d8906f972a2d3b3d823d10b1909da5f8bf48d376
- 후: c33dcbbb25d2799c8158403d3b431164e8a64a149695646c454f60a8913bb88c

풀팩 G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp:

- 전: a0807556e9d3c1c9d9c208cdfa702af6c1319223302468e223ad8baab91c803e
- 후: 83d2e9d5eca567460fa36c67d52506d270e53efb15b060d62ceba37d07f6163b

원본 백업: G:/somi/IMGMG/backups/equipment-emoji-restore-20261015/{work,full}/jack.qsp.before. 추가 복원 직전은 jack.qsp.before-followup.

두 대상 모두 공식 apply_mods.ps1 적용, 248개 location 왕복 검증 통과. 최종 파일의 모든 QSP 필드를 최초 백업과 대조하여 master_stat/slave_stat/assistant_stat 본문에서 선언된 치환만 발생했음을 확인했다. 식품 동면고가 master_stat에서 사라지고 식품 저장고가 존재한다. 관련 5종 이미지가 두 대상에 존재한다. 기존 초기 테두리·메뉴 정렬·알림 로딩 회귀 검사도 첫 복원 단계에서 통과했다.

실제 게임 화면은 사용자 확인 대기. 게임을 다시 실행하고 장비·보관함, 조수·노예 장비 화면을 다시 열어 확인한다.

## 별도 텍스트 대조의 한계

39개 원천 JSON을 두 현재 QSP에 읽기 전용 대조했다. 대형 마이그레이션 기록과 최종 수정 전 중간 편집이 섞여 있어 new 문자열 불일치만으로 누락을 단정하지 않는다. 다른 대사 수정까지 모두 복원했다는 뜻은 아니다. 일부 별도 대사는 추가 검토 대상으로 남아 있다. 미성년 성적 묘사 편집은 복원 대상에서 제외한다.

## 2026-10-15 현재 이모지팩 연결 완료

사용자 지시로 게임용 PNG 전체를 현재 편집기 이모지팩에 맞췄다. 저장소 tools/text-workshop/assets/dialogue-emoji와 두 설치본 편집기 assets의 PNG 355개가 모두 일치함을 먼저 확인했다. 이후 플레이·풀팩 content/pic/ui/dialogue_emoji의 PNG 각각 355개를 교체하고 SHA-256 전수 대조 통과. 기존 파일명과 QSP 참조는 유지하며 QSP 해시도 작업 전후 동일하다. CSS 및 문구는 변경하지 않았다.

외부 원본 백업·파일별 전후 해시: G:/somi/IMGMG/backups/current-emoji-pack-2026-10-15T03-18-29-937Z/sync-manifest.json. 화면 확인은 사용자 재실행 후 장비·보관함 및 편집기 삽입 아이콘을 비교한다.


## 2026-10-16 후속 — 사용자 동기화 실패 보고

게임과 편집기 소스 자산이 355개 전부 달랐다. 현재 게임 새 팩을 보존하고 편집기 세 곳을 맞췄다. 선택창의 실제 HTTP 응답은 게임 파일 355개와 일치하므로 소스 자산 불일치만으로 화면 문제의 원인을 확정하지 않는다. 10번은 파일 보정 완료·기준 팩/실제 화면 확인 대기다. [현재 검증과 한계](EMOJI_SYNC_20261016.md).
