# 변경 로직 안내

입력: generate_stock의 기존 meta_type(1/2/3), 기존 범위 변수, json/slaves 새 정의728개.
출력: jo9_mob_pool이 기존 범위 또는 신규 연속범위의 ID 하나를 반환한다. args[1]은 재현 검사에 쓰는 선택 슬롯이며 일반 실행은 생략하고 난수를 쓴다. 잘못된 분류/슬롯은0. 함수는 local 변수만 쓰며 인물 상태를 바꾸지 않는다.
호출: generate_stock의3개 선택식. 기존 special_stock 분기는 그대로라 고유 인물 영입은 변경하지 않는다. 기존 중복·제외 재추첨도 바깥에서 유지한다.
분류: jo9_plain_voice ordinary에4000~4727을 추가해 일반 모브로 인식한다.
의존: 엔진JSON파일명 숫자접두사 로더와 기존 fullimage/seed_ava/fullmade/fullsecretary/fullmistress/get_stock_seed. 원래 번호의 전용팩 정보는 새 캐릭터에 복제하지 않는다.
제거시: QSP에서 새 선택범위를 먼저 해제해야 하며, 이미 생성된 새번호 노예가 있는 세이브를 위해 JSON을 임의 삭제하지 않는다. 이미지파일명은 바꾸지 않았으므로 기존주소 그대로다.
백업: baseline.qsp.gz는 적용직전QSP의 gzip이며 재압축해제 바이트왕복을 검증했다. 현행QSP에 이후 변경이 있으면 전체 덮어쓰기 복원 금지, 선언형 패치의 해당 부분만 대조한다.
중복 이미지복원: py -3.14 C:/Users/User/.codex/skills/jo9-prune-images/scripts/archive_images.py restore --journal K:/doing/JO9_trash/mob-duplicates-20261114/game/content/pic/girls/full/journal.json
검증 한계/사용자확인: REPORT_KO.md 참조.
