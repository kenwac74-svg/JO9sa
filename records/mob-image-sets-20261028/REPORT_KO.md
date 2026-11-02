# MOB 세트 이미지 패치리스트 — 2026-10-28

WORK 적용 완료. 전투 역할·무작위 외형78항목, 초상/전신/패배 묶음. 기본 정의와 colosseum_fight 무작위 변형 및 기존 sprite 예외를 함께 추출했다. 경주 전용 초상은 제외했다.

현재 전신4개, 패배16개가 없다. 제작 필요 목록이며 미완성 그림을 완료로 표시하지 않는다. 기존 제작 시안이 있는 전신4개에는 해당 경로를 안내했다. 사용자 이미지 자체는 이번에 생성하거나 덮어쓰지 않았다.

- 어린 탈옥수: 패배 content/pic/mob/defeated/gladiator_prisoners.png
- 쌍수 투사B: 패배 content/pic/mob/defeated/gladiator_dimaha_2.png
- 쌍수 투사C: 패배 content/pic/mob/defeated/gladiator_dimaha_3.png
- 쌍수 투사D: 패배 content/pic/mob/defeated/gladiator_dimaha_4.png
- 보병 투사A: 패배 content/pic/mob/defeated/gladiator_hoplite_1.png
- 보병 투사B: 패배 content/pic/mob/defeated/gladiator_hoplite_2.png
- 보병 투사D: 패배 content/pic/mob/defeated/gladiator_hoplite_4.png
- 킴메르 투사B: 패배 content/pic/mob/defeated/gladiator_kimerian_2.png
- 킴메르 투사D: 패배 content/pic/mob/defeated/gladiator_kimerian_4.png
- 특급 투사: 패배 content/pic/mob/defeated/gladiator_champion_sepris.png
- 여검투사: 패배 content/pic/mob/defeated/gladiatrix1.png
- 에게야: 전신 content/pic/mob/egeya.png
- 성기사: 전신 content/pic/mob/vatican_paladin.png
- 포탈 가디언: 전신 content/pic/mob/strazhnik.png
- 엘자: 전신 content/pic/mob/erza.png
- 헐벗은 노예 · glad_naked_2: 패배 content/pic/mob/defeated/glad_naked_2.png
- 헐벗은 노예 · glad_naked_3: 패배 content/pic/mob/defeated/glad_naked_3.png
- 여교관 · mistress_morrigan: 패배 content/pic/mob/defeated/mistress_morrigan.png
- 여교관 · glad_mistress_3: 패배 content/pic/mob/defeated/glad_mistress_3.png
- 여전사 · glad_amason_2: 패배 content/pic/mob/defeated/glad_amason_2.png

기존 코드의 패배 경로 누락16개를 보완했다. 누락 이미지에서는 원래 전신으로 되돌린다. 기존 그룹 로스터 합성/탈옥수 예외/전투 판정/보상/처형 선택 로직은 유지한다. 기존78항목의 결과 함수 호출236조건과 공식 엔진9경로 통과. 브라우저 격리 검사에서는 실제 PIC 모듈로 취소·추가·개인 이미지 패치 원장·전신 보존·누락 fallback 확인. 라이브 화면은 live-report.json과 catalog-ogre.png를 참고한다. 모든 실제 전투 및 사용자 세이브 로드 검증은 아니다.

검사 도중 잘못 지정한 캐시 버전2는 실제 버전3으로 수정했고 최종 공식 검사 PASS다. 초기 패치 명세 필드 누락도 제품 반영 전에 수정했다. 초기 브라우저 fixture의 미설치 Chromium/charset 설정 오류는 설치된 Edge와 UTF-8로 교정했다. 실패를 제품 버그나 통과로 기록하지 않는다.

WORK QSP: d6b079a67cc4096861176c4a0f56f07ca0afaf6177c438c00d357193f6cc8534
백업: G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_mob_sets_20261028
배포 폴더·사용자 세이브·게임 CSS/JS 보존. 커밋·푸시·배포 ZIP 없음.
