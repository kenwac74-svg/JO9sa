# 아마란스 단체 서비스(50 스파크) 페이지별 그림 — 2026-10-12

- 사용자 지정: 첫 대사 scene\VIP\salongroup01.png, 둘째 대사 scene\VIP\salongroup02.png.
- interaction_city = 102025의 남녀 공통 두 분기만 변경했다. 20 스파크 salononeg01/02, 가격·대사·효과·페이지 수는 유지한다.
- interaction_screen_city에서 erosalon + 102025일 때만 남은 service_picture/bg_path를 비운다. 구 저장 장면에서 VIP3를 가리키는 1·2페이지를 새 경로로 옮기며 기존의 다른 사용자 경로는 덮어쓰지 않는다.
- 새 두 파일이 없어 VIP3 사본으로 교체 대상을 준비했다. 각 795×596, 1,006,335 bytes. 현재 시각적으로 동일하며 실제 작품으로 각각 교체해야 서로 다른 화면이 된다.
- 두 카탈로그 행은 미체크로 추가했다. 실제 작품 제작 완료·개인 이미지 패치 원장으로 기록하지 않았다.
- tools/prepare-salon-page-images.cjs의 네 번째 CLI 인자 group으로 단체용 사본/행을 준비할 수 있다. 기존 single 기본 동작은 유지하며 기존 파일은 덮어쓰지 않는다.

## 적용 기록

- 실제 게임: C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game\jack.qsp.
- mod: mods/2026-10-12_zzzzz_salon_group_pages.json.
- 사본 출처·해시: records/salon-pages/2026-10-12_salon_group_templates.json.
- 적용 전 SHA256: 9f3f7a87db01fc3248f06e479a0f18b88f81cd024c231310f2d784cbc178c00f.
- 적용 후 SHA256: 832e13d0015eb96b8aecad918961b8255bad08f893c2f69ed63449a7fcdb17d2.
- QSP 백업: jack.qsp.bak_20261012_203307.
- 이번 JSON만 있는 별도 ModsDir로 DryRun 후 실제 적용했다. 게임 이미지·실제 QSP·세이브는 Git에 넣지 않는다.

## 검증

수정 전 group 검사 세 항목이 실패했다. 후보/실제 적용 후 group 4개, 기존 solo 4개, 서비스 초기화·메뉴 5개 소스 검사가 통과했다. 정확한 치환 범위와 전체 QSP 바이트 보존을 비교했고, interaction_screen_city 정적 구문 검사도 통과했다.

게임 화면은 사용자 확인 사항이다. 완전히 종료 후 재실행하여 단체 서비스(50 스파크)에서 두 대사와 이전/다음 전환을 확인한다. 파일을 각각 다른 작품으로 바꾸어야 화면 차이를 확인할 수 있다. 문신 뒤 방문·예전 장면 세이브 로드에서도 문신 그림이 끼어들지 않는지 확인한다.
