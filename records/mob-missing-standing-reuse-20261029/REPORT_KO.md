# 기제작 전신 4종 WORK 등록 — 2026-10-29

에게야(egeya), 엘자(erza), 포탈 가디언(strazhnik), 성기사(vatican_paladin)의 기존 제작 원화를 WORK에 등록했다. 새 그림을 생성한 것이 아니라, 프로젝트 output/battle-mob-review-20261027/images/battle에 남아 있던4장이다. 부모 작업에서 직접 이미지 검수·승인 범위를 확인한 뒤 이 하위 작업을 지시했다.

## 이전 미완료 보고 정정

[직전 MOB 이미지 보고서](../mob-battle-assets-20261029/REPORT_KO.md)와 [풀클라이언트 준비 보고서](../full-client-preparation-20261029/REPORT_KO.md)의 “전신4개 미제작”은 해당 시점의 WORK 경로 누락을 뜻했지만 표현이 부정확했다. 실제 원화4개는 이미 제작되어 있었다. 이번에 누락된 runtime 경로에 등록했으므로 이 기록으로 그 상태를 갱신한다. 미존재 standing 슬롯은0개다. Grinch는 초상150×150을 공유하는 별도 예외이며, 새 전신 경로 연결은 부모 작업에서 따로 처리한다. 개별 패배컷15개의 제작 상태는 이 작업에서 바꾸지 않았다.

## 반영과 검증

- 입력1448×1086 RGBA4장을795×596 PNG로 비율 유지 contain/Lanczos 정규화. crop 없음, 투명 알파0~255 보존. 원본4장은 변경하지 않았다.
- WORK content/pic/mob/{egeya,erza,strazhnik,vatican_paladin}.png 네 경로와 resources/new에 같은 최종 bytes를 추가했다. 기존 파일이 없음을 미리 확인하고 EXCL 생성하여 덮어쓰지 않았다.
- 개인 이미지패치 원장1건(before=null) 등록. 카탈로그 기존 예약 D행4개의 bytes/dims와 완료 상태, embedded MOB standing4개의 exists/sha/bytes/dims/workLabel만 갱신했다. 다른 슬롯·단체 정의·행·플래그, 기존 stable work ID는 보존했다.
- 실제 PNG decode·형식·규격·알파·원본/런타임/추적 해시 대조 PASS. 원장4파일 및 다른 슬롯·단체 보존 독립 비교 PASS.
- QSP는 설치 완료 시점ea9a02151917f6ddf416553c0b409862b47efcd877937c515cecd502a5b922b3로 불변이었다. 이 작업은 QSP·코드·세이브·배포 폴더를 쓰지 않았고, 새 엔진/플레이 검증을 수행했다고 주장하지 않는다. 이후 부모의 별도Grinch QSP 변경과 구분한다.
- ZIP·커밋·푸시 없음. portable seed와 풀클라이언트 최종 입력 목록은 부모 작업에서 갱신한다.

## 보존·복구

원본은 프로젝트 output/battle-mob-review-20261027/images/battle에 그대로 있다. 카탈로그 변경 전 자료는 G:/somi/JO9_work_backups/mob-missing-standing-reuse-20261029에 보존했다. 신규 경로는 설치 전에는 없었으며, 단순 원복을 원하면 현재 after 해시부터 확인해야 한다. 임의의 후속 수동 파일을 삭제하지 않도록 installation.json과 원장·카탈로그를 함께 대조해야 한다.

정규화 임시4개는 WORK와 resources/new 검증 후 정리했다. normalize.py는 원본과 해시·geometry를, install.cjs/installation.json/verification.json은 등록과 검증을 기록한다. 생성 원본·최종 리소스·유일한 복구자료는 삭제하지 않았다.
