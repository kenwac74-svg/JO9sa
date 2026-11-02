# 여교관 캐릭터·MOB 리소스 용도 분리 — 2026-10-30

사용자 첨부 화면의 대상은 `variant:mistress_morrigan`이다. 처음 언급된 `variant:glad_mistress_2`는 별개 변형이고 이미 MOB 경로였으므로 변경하지 않았다. 사용자 후속 확정에 따라 파일 삭제/이동이 아닌 **MOB 전용 복사본**으로 분리했다.

## 최종 경로

| 용도 | 초상 | 전신 | 패배 |
|---|---|---|---|
| MOB | content/pic/mob/mistress_ava.png | content/pic/mob/mistress_morrigan.png | content/pic/mob/defeated/mistress_morrigan.png |
| 캐릭터·옛 세이브 | content/pic/characters/mistress_ava.png | content/pic/characters/mistress_morrigan.png | 기존 연결 유지 |

초상·전신을 바이트 그대로 복사했으며 기존 패배 컷은 그대로다. 준비 시점의 최신 초상은 61,156바이트이며 사용자 수동 저장본을 보존했다. MOB 사본 추가 용량은 총 952,655바이트이다. 두 용도의 경로는 이후 독립 교체할 수 있고 자동 연동하지 않는다. 같은 해시만으로 어느 한쪽을 삭제하면 안 된다. 관계 원장은 assets/resource-role-copies/2026-10-30_mistress_mob.json과 docs/IMAGE_COMPATIBILITY_ALIASES_KO.md에 기록했다.

## 코드·체크리스트

- `colosseum_fight`에서 해당 기본형(g=1)의 초상·전신 주소만 MOB로 변경했다. 선택 조건·난수·계산식·다른 두 변형은 그대로다.
- `jo9_battle_fate`는 새 MOB 전신 경로와 기존 characters 주소가 모두 동일한 기존 패배 컷으로 연결되도록 했다. 기존 세이브 문자열을 일괄 교체하지 않는다.
- 패치 ID: MISTRESS_MOB_ROLE_COPY_20261030, MISTRESS_MOB_DEFEAT_COMPAT_20261030. mods/2026-10-30_mistress_mob_role_copy.json에 적용 전후 해시와 정확한 2개 edit를 기록했다. 새 변수·로케이션·세이브 이관은 없다.
- WORK/seed의 MOB manifest, 일반 이미지 목록, 상태, background-contexts, Mage 프롬프트의 슬롯 경로를 맞췄다. characters 항목은 남기고 MOB용 항목 2개를 추가했다. 프레임 분류와 얼굴 선택 기능은 유지한다.
- resources/new에 MOB 사본을 등록하고 WORK/seed 개인 이미지 패치 원장에 `copy-mob-role`로 추가했다. `relocate`가 아니므로 이전 characters 소유/출력 항목을 제거하지 않는다. 과거 원장은 다시 쓰지 않았다.
- 전체 클라이언트 준비 명세에 두 용도의 경로와 최신 QSP를 포함했다. ZIP 제작이나 배포 폴더 동기화는 하지 않았다.

## 검증

수정 전 격리 엔진에서 MOB 주소를 기대하는 검사가 실패함을 확인했다. 수정 후 실제 colosseum_fight의 4단계×3변형=12개 선택 조합과 4개 패배 sprite 연결을 한 진단 실행에서 검사했다. 진단 사본에서만 무작위 선택값을 고정하고 마지막 화면 이동을 EXIT로 바꿨다. 기존 함수 본문을 실행했으며 실제 전투 승패·수치 플레이를 대신하는 검사는 아니다.

정식 출고 검사의 구조·왕복·줄/주석 경계·정확한 패치 재생·멱등성과 실제 엔진 9경로가 PASS이다. 독립 검토에서 변경 필드가 colosseum_fight/jo9_battle_fate 두 본문뿐이고 275개 로케이션이 유지됨을 확인했다. 최종 WORK 해시는 `f18fcee393330747f693f0388ef5c0364b926a34e64ea25b659e68ca9b6aa652`이다.

실제 3813 카탈로그를 새로 열어 해당 카드의 3개 슬롯이 전부 MOB 주소이고 characters 문자열이 남지 않음을 확인했다. 세 PNG는 실제 API에서 HTTP200·파일 해시·150×150/795×596 규격이 일치한다. 원본 characters 두 개·기존 확인용 SAV 해시 보존, 개인 패치 양쪽 원장, 준비 명세 파일 수·용량·해시를 대조했다. 운영 이미지 apply 요청은0회다. 이번 실제 파일 복사는 설치 스크립트에서 승인 범위의 두 PNG만 수행했다.

## 유지보수 설명

colosseum_fight 입력은 기존 전투 단계와 난수 g이며 출력은 기존 몬스터의 초상/전신 배열에 넣는 경로이다. jo9_battle_fate의 기존 sprite 입력은 적 슬롯·패배 여부이고 출력은 기존 패배 이미지 경로다. 새 MOB PNG 두 개에 의존하며 캐릭터 파일을 다른 그림으로 바꿔도 전투 그림은 자동 변경되지 않는다. MOB 파일을 지우면 새 전투 그림이 사라질 수 있다. characters 파일을 지우면 캐릭터 사용 또는 옛 세이브가 영향을 받을 수 있으므로 보존한다.

롤백할 때 현재 해시와 이후 사용자 작업을 먼저 확인한다. 해당 mod edit를 역적용하고 카탈로그·개인 패치·입력 목록을 함께 정산해야 한다. 예전 QSP/HTML 전체를 무조건 덮어쓰지 않는다. 이번 작업 직전 QSP와 변경 metadata 복구 자료는 G:/somi/JO9_work_backups/mistress-mob-role-copy-20261030에 보관한다. 원본 PNG는 characters에 그대로 있으므로 별도 중복 백업을 만들지 않았다.

현재 제보자의 SAV를 실제 GUI Load한 결과나 모든 캠페인 분기를 검증한 것은 아니다. 실제 설치 엔진의 격리 경로 확인·현재 파일 검증과 구분한다. 세이브·배포 폴더·ZIP·커밋·푸시는 변경하지 않았다. 재생성 가능한 진단 QSP/JSON/PNG 사본은 검증 후 정리하고 보고서·패치·재현 스크립트와 유일한 복구 자료만 보존한다.
