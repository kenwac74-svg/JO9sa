# JO9 신규 이미지 교체 팩 변경 이력

배포 ZIP(`patches/JO9_NewImg_Pack_v<번호>.zip`)의 판별 변경 내용이다. 새 판이 위에 온다.
각 파일의 원본·신규 정보와 검사 내용은 [교체 기록](NEWIMG_REPLACEMENT_LOG.md)과 [원본 카탈로그](NEWIMG_ORIGINAL_CATALOG.json)에 있다.

모든 판에 공통으로 적용된다.

- 설치: ZIP 안의 `pic/`을 게임의 `game/content/` 폴더에 풀어 덮어쓴다.
- 기준 게임: Jack-o-nine-tails 2.3 순정.
- QSP, 실행 파일, 세이브는 바꾸지 않는다. 기존 이미지를 같은 경로에 덮어쓰기만 한다.

## 미배포 (staging 반영, ZIP 미생성)

- 없음. 현재 `staging/pic/` 109개는 v7과 같다.
- 추가 ZIP을 받으면 여기에 작업 단위로 기록한다. 사용자가 ZIP 생성을 지시하거나, 미배포 작업 단위가 5개가 되면 새 판 번호 항목으로 옮긴다.

## v8 (2026-10-04, 집컴 로컬 세션이 IMGMG에서 생성 · 사용자 점검 전)

- 파일: `JO9_NewImg_Pack_v8.zip`, 249개, 55,062,280 bytes, SHA-256 `b079baf3e72ac0a7aad46a4cfda20e3f9489172d3868acc75a51d4c285a078f7`
- 저장소에는 올리지 않았다(50 MB 초과). 원본은 사용자 PC `G:\somi\IMGMG\imagepack\`. 만든 도구는 main `tools/imgmg/make_imagepack.ps1`.
- **구조 변경**: 최상위가 `pic/`에서 `game/content/pic/`으로 바뀌었다. ZIP의 `game` 폴더를 게임 폴더(Jack-o-nine-tails.exe 있는 곳)에 풀어 덮어쓴다. `game/JO9_NewImg_Pack_v8_catalog.html`(첨부 비교 카탈로그)와 `README.txt` 포함.
- 사용자 방침(2026-10-04): 이미지 교체 팩은 2.4 등 버전업과 무관하게 수시 배포한다. **사용자 작업물만** 담고 올걸팩·원본 이미지는 넣지 않는다. 모든 작업물은 원본과 같은 폴더 위치에 둔다. 따라서 "원본에 있는 경로만 교체, 새 파일 추가 없음" 정책은 v8부터 바뀌어, 원본에 없는 새 이름 파일(2.4·UI 패치에서 쓰임)도 들어간다.
- 추가 140개 (v7의 109개는 그대로)
  - 원본 자리 대체본 4개: `pic/scene/whore_redlight/whore_redlight-121.png`·`122`(길거리 창녀 t002·t003), `212`·`213`(개인 영업녀 p002·p003). QSP 없이도 새 장면 그림이 보이게 하려는 것.
  - UI 패치용으로 그린 이미지 136개를 SNKmod 단계 없이 원본과 같은 폴더에: 원본 경로 덮어쓰기(`buttons`, `bg/slave_psychology`, `bg/trophy`, `ui overhaul` 등)와 새 파일(`ui/…`, `master/master_kura*`, `characters/master_robertus_rufus`, 홍등가 p/r/s/t/u 시퀀스 등). trash와 trash 중복 59개는 제외.
- 비교: `compare/JO9_NewImg_Compare_v8.html`(웹 게시용, 썸네일 320px). 카드마다 원본 2.3 · 올걸팩(있을 때) · 이 팩. 목록 70개, 아이콘·포트레이트·중복·QSP 전용 179개는 생략.
- 확인할 것: UI 버튼·배경 덮어쓰기를 순정/올걸팩 환경에서 본 화면(사용자 점검), 전송 방법(30 MiB 초과).
## v7 (2026-10-02)

- 파일: `JO9_NewImg_Pack_v7.zip`, 109개, 31,768,716 bytes, SHA-256 `0050c2dc31e8bfe92935ec17021469bbe3671f9c259abc265c42d768e69ae7db`
- 사용자 지시로 생성(미배포 작업 단위 3개 시점).
- 전달: 30 MiB 전송 한도 때문에 `part1of2`(60개)와 `part2of2`(49개) 두 조각으로 보냈다. 둘 다 `game/content/`에 풀면 v7 전체와 같다.
- 추가 3개 (작업 단위 3개)
  - 홍등가 사창가골목: `pic/bg/Dosugredlight.png`, `pic/scene/whore_redlight/whore_redlight-112.png`, `pic/scene/whore_redlight/whore_redlight-113.png`
- 변경·삭제: 없음. v6의 106개는 그대로다.

## v6 (2026-10-01)

- 파일: `JO9_NewImg_Pack_v6.zip`, 106개, 30,176,069 bytes, SHA-256 `f89dc06e32dac0a102e986b249f7109c8197af7df9d69f6abf7ccbffbfaf0b46`
- 추가 1개
  - 홍등가 메인: `pic/bg/RedLight.png`
- 변경·삭제: 없음. v5의 105개는 그대로다.

## v5 (2026-10-01)

- 파일: `JO9_NewImg_Pack_v5.zip`, 105개, 29,643,477 bytes, SHA-256 `a20651a6ba97edaa5b786de01315a5f97eacc270f8ff032b84350f703749f9b5`
- 추가 5개
  - 홍등가 카페-신들의 선물: `pic/bg/kafe.png`, `pic/characters/anes.png`, `pic/ui overhaul/kafe.png`, `pic/ui overhaul/kafe_gray.png`, `pic/ui overhaul/anes.png`
- 변경·삭제: 없음. v4의 100개는 그대로다.

## v4 (2026-09-30)

- 파일: `JO9_NewImg_Pack_v4.zip`, 100개, 28,770,801 bytes, SHA-256 `f66996fa49d8409109ebac9464b2b2bac89b378160c704cc063b1c810ac5ef51`
- 추가 2개
  - 홍등가 벼룩시장: `pic/bg/baraholka.png`, `pic/ui overhaul/baraholka.png`
- 변경·삭제: 없음. v3의 98개는 그대로다.

## v3 (2026-09-30)

- 파일: `JO9_NewImg_Pack_v3.zip`, 98개, 28,526,934 bytes, SHA-256 `8dac6b18c9a72011f67a09a14e280bac607cdf6cf1913118dad88e338af1bb47`
- 추가 7개
  - 황소구역 흡혈귀 사냥꾼: `pic/bg/vampire_hunter.png`, `pic/characters/vampire_hunter.png`, `pic/ui overhaul/vampire_hunter.png`, `pic/ui overhaul/vampire_hunter_gray.png`
  - 동부구역 아그라바 관문: `pic/characters/maslab.png`, `pic/ui overhaul/maslab.png`, `pic/ui overhaul/maslab_gray.png`
- 변경·삭제: 없음. v2의 91개는 그대로다.

## v2 (2026-09-28)

- 파일: `JO9_NewImg_Pack_v2.zip`, 91개, 27,162,074 bytes, SHA-256 `2f1582775b56575da02fa49e5107aa964df28e182c6c245c716a3822af0a5dcc`
- 추가 34개
  - 동부구역 아그라바 관문 18개 (`bg` 5, `characters` 2, `ui overhaul` 11)
  - 동부구역 아마란스 살롱 5개 (`bg` 1, `characters` 1, `ui overhaul` 3)
  - 동부구역 패션하우스 8개 (`bg` 1, `characters` 2, `ui overhaul` 5)
  - 백색도시 부동산 사무소 3개 (`characters` 1, `ui overhaul` 2)
- 변경·삭제: 없음. v1의 57개는 그대로다.

## v1 (2026-09-26)

- 파일: `JO9_NewImg_Pack_v1.zip`, 57개, 21,843,887 bytes, SHA-256 `da9b70fe4264d33570ffe7cefae0d66baf3f10db95cdf954692e6b45b099c037`
- 첫 판 57개
  - 타이틀 12개 (`title1`–`title9`, `title11`–`title13`. `title.png`, `title10.png`는 원본과 같아 제외)
  - 데모(시작 선택) 3개
  - 동부구역 캣파이터 클럽 16개
  - 백색도시 콜로세움 26개
