# 아마란스 여자 하나(20 스파크) — 페이지별 그림, 2026-10-12

- 사용자 지정: 첫 대사 salononeg01, 둘째 대사 salononeg02. 단체 서비스(50 스파크)는 대상이 아니다.
- 실제 플레이: C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game.
- interaction_city = 102024의 두 주인공 분기에 각각 scene\VIP\salononeg01.png, scene\VIP\salononeg02.png를 연결했다. 대사·2페이지 수·가격·효과·진행 조건은 유지한다.
- 두 이미지가 없어 현재 VIP3.png를 바이트 그대로 복사해 독립된 교체 파일을 준비했다. 둘 다 795×596, 1,006,335 bytes다. 현재 그림 자체는 동일하며 각각 파일을 교체하면 해당 대사 페이지만 바뀐다.
- 원래 VIP3와 단체 서비스의 그림은 변경하지 않았다. 새 이미지를 생성하거나 그린 작업이 아니다. 사본을 개인 제작 완료로 기록하지 않는다.
- 현재 카탈로그에 두 파일의 미체크 행을 추가했다. 준비 도구는 기존 파일을 덮어쓰지 않으며 재실행 때 파일·행을 추가하지 않는다.

## 잔류 그림과 저장 장면

앞선 패치가 interaction_city 진입에서 service_picture를 비웠다. 기존 서비스 장면을 저장했다가 interaction_screen_city에서 다시 출력하는 경로는 이 진입 코드를 다시 거치지 않을 수 있다. 해당 렌더러는 special_image를 그린 뒤 남은 bg_path를 최상위에 그린다.

이번에는 장소 erosalon 및 interaction_city = 102024일 때만 렌더 직전에 service_picture와 bg_path를 비운다. 구 저장 장면의 special_image[1/2]가 기존 VIP3인 경우만 새 두 경로로 옮긴다. 이미 다른 사용자 그림으로 지정된 경로는 보존한다. 다른 장소와 50 스파크 분기에는 이 guard를 적용하지 않는다.

## 기록·적용

- mods/2026-10-12_zzzz_salon_single_pages.json: QSP 최소 치환 3회, 2 locations.
- tools/prepare-salon-page-images.cjs: 없는 두 페이지 이미지 사본과 카탈로그 행만 준비.
- records/salon-pages/2026-10-12_salon_single_templates.json: 사본 출처·해시·크기 기록.
- 적용 전 SHA256: f40df3fd5e2481ce8590fcdf30f07e7fc607cd693cf8dd312d067223ebbc9462.
- 적용 후 SHA256: 9f3f7a87db01fc3248f06e479a0f18b88f81cd024c231310f2d784cbc178c00f.
- 백업: jack.qsp.bak_20261012_195928.
- 적용에는 이번 mod만 넣은 별도 ModsDir를 사용했다. 기존 전체 mods를 다시 적용하지 않는다.
- 새 PC에서 실제 두 교체 그림을 복원해야 한다. 준비 도구는 실제 작품 복원을 대신하지 않고, 파일이 없을 때 VIP3 사본만 만든다. 이미지 및 실제 게임/세이브는 Git에 넣지 않았다.

## 검증 및 사용자 확인

수정 전 test_salon_pages의 페이지 분리·저장 장면 guard·파일 존재 검사가 실패했다. 수정 후보와 실제 적용본은 5개 검사 통과. 기존 test_salon_menu도 새 20 스파크 경로를 반영하여 6개 통과했다. 정확한 QSP 바이트 변경 범위, 이전 서비스 초기화, 페이지 경로, 50 스파크/VIP3 및 메뉴 투명화 유지 검사다. interaction_screen_city의 CRLF·따옴표·블록 정적 검사 통과, 사본 준비 도구 재실행에서 생성 0·카탈로그 추가 0 확인.

실제 엔진 플레이 확인은 사용자 담당이다. 게임을 완전히 종료·재실행한 뒤:

1. 문신 서비스 뒤 살롱 → 여자 하나(20 스파크): 문신 그림이 끼어들지 않는지 확인.
2. salononeg01/02를 각기 다른 그림으로 교체하고 다음/이전 화살표로 각각 대응하는지 확인.
3. 예전 살롱 저장 장면 로드 때도 이전 서비스 그림이 없는지 확인.
4. 단체 서비스(50 스파크)는 기존 VIP3를 유지하는지 확인.
