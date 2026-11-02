# Grinch 전투 전신 분리 — 2026-10-29

WORK 반영 완료. QSP는 #противники와 jo9_battle_fate의 두 문장만 변경했다. 새 변수·로케이션·세이브 이관은 없다. Full 배포 폴더, ZIP, 커밋·푸시는 변경하지 않았다.

## 입력·출력과 변경

기존 제작 전신 output/battle-mob-review-20261027/images/battle/grinch.png(1448×1086 RGBA)를 비율 유지/Lanczos/투명 여백 방식으로795×596 PNG로 만들었다. 원본은 보존했다.

- 초상: content/pic/mob/Grinch.png,150×150, SHA568cf76877a221172a9bf48d7420e2a0188248e3c74219e3bfbf698c7d5fa700 보존.
- 새 전신: content/pic/mob/grinch_full.png,795×596 RGBA, SHA3146c1e82fcaf94962e232fd182a984003f97cacc5162a55a2ce07c1cf4714c3.
- 패배: content/pic/mob/defeated/grinch.png 유지.

#противники의 $силуэт_моба['grinch']는 새 전신 경로를 반환한다. $аватара_моба['grinch']는 예전 초상 경로를 유지한다. jo9_battle_fate의 sprite 인수에서 그린치 패배컷은 실루엣 경로 대신 $враг[slot]='grinch'로 판단한다. 따라서 옛 저장의150초상 경로/Windows 백슬래시 경로와 새 전신 경로 모두 기존 패배컷으로 연결된다. 그 외 적의 조회·전투 수치·보상은 보존했다.

패치: mods/2026-10-29_grinch_standing_split.json. WORK/mods에도 같은 JSON을 맞췄다. JO9 MOD START/END GRINCH_STANDING_SPLIT_20261029로 변경 범위를 표시한다. 경로 분리 블록을 제거하면 초상150이 다시 전투 전신 대체로 쓰인다. 새 경로 PNG를 빼면 전투 전신이 누락되므로 QSP와 PNG는 함께 유지해야 한다.

## 카탈로그와 이미지 기록

기존 PIC writer에 original-cuts 보호 조회기를 넘겨 새 PNG를 등록했다. 개인 이미지패치 원장1이벤트가 기록됐다. 원본컷 보호 manifest는 바이트 그대로 보존했다. D의 새 경로1행을 추가하고 catalog.load의 기존 ID 발급 절차로 MB-0281 하나만 추가했다. 기존35,787개 ID는 보존했다.

Grinch standing 슬롯은 새 경로/규격/해시/exists=true/shared=false로 변경했으며 초상 슬롯은 기존150파일을 유지한다. 같은 초상·전신 경로가 아니므로 전신 PNG 교체 버튼이 정상 활성화된다. resources/new에 같은 PNG를 맞췄다. seed/풀클라이언트 입력 계획의 최종 갱신은 상위 통합 작업에서 수행한다.

## 검사와 한계

- 실제 설치 엔진10조건 PASS: 새 등록/초상150 유지/새 전신/새 패배/옛 실루엣 캐시/Windows 경로 캐시/기존 데이터 갱신/비관련 고블린·에게야 조회 보존.
- 공식 출고 검사 PASS: QSP 구조·CRLF·마커 경계, JSON 템플릿, 패치 재생·멱등성, 실제 엔진9경로, 입력 보존.
- 라이브3813 카탈로그에서 전신 버튼 활성·150/795 규격·795변환 미리보기와 취소시 무변경 PASS.
- 기존 로드 루트: $ongload→saved_game_loaded=1→$newloc→$addon update/full→refresh_database→#противники. 새 전투 시작도 #противники를 다시 실행한다. 새로운 영구 저장 플래그는 필요하지 않다.
- 실제 사용자 SAV를 게임 UI에서 로드한 첫 프레임/그린치 이벤트 전체 플레이는 클릭 검증하지 않았다. 저장된 HTML은 다시 그려지기 전까지 옛 경로가 보일 수 있다는 한계와 패배 resolver의 구형 캐시 호환 검증을 구분한다.

첫 전용 진단은 검사기 완료마커 형식 오류로 실행 전 거부되었고 marker만 바로잡아 통과했다. 첫 공식 게이트는2.3.2.5의1.sav를 입력하여 버전 갱신 안내가 완료마커 전에 뜨는 두 경로가 중단됐다. 이 실패를 보존하고 현재2.4 대표 JO9_GOLD_AP_CHECK_20261026.sav로 동일 후보를 다시 검사하여9경로 PASS를 확인했다. 제품 QSP를 이 실패에 맞춰 고치거나 메시지를 억제하지 않았다.

현재 QSP SHA256:
5d7c16b17d9aa0c1bb9c818c67521b2693a32a2db068742fbe7072f2dd8343cd

직전 SHA:
ea9a02151917f6ddf416553c0b409862b47efcd877937c515cecd502a5b922b3

## 복구와 자료

직전 QSP gzip 및 카탈로그/상태/ID 백업은 G:/somi/JO9_work_backups/grinch-standing-split-20261029에 있다. 새 전신은 기존 파일을 덮지 않았고, 원본 생성 전신·WORK 전신·추적 전신을 보존한다. 새 파일 제거로 복구할 때는 기록된 SHA와 실제 파일이 같은지 확인하고, 해당 QSP/카탈로그/ID/원장도 일관되게 복구해야 한다. 무조건 파일만 지우거나 ID를 재번호 매기지 않는다.

핵심 자료: patch.json, image-preparation.json, native-report.json, official-report.json, browser-report.json, installation.json, temp-cleanup.json. 격리 시험 복제본과 JSON·QSP는 검증 후 정리하며 원본·세이브·최종 PNG·유일 백업은 보존한다.
