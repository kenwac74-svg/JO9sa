# UI 리소스 참조·미사용 감사

2026-10-27, WORK 읽기 전용 조사. 게임/코드/이미지/세이브/배포 폴더의 실제 이동·수정은 0건이다.

기준: QSP `1f43f75af8df075be2e44779744c9ae30ec2a49a91f4f593205baabb00420814`, 설치 엔진 `f75032d79ecb58eeb7b969cd3f774d66b091fca38a360acdabd782e03a46c6e6`.

## 조사 범위와 결과

UI 후보만 해시를 계산했다: `content/pic/ui/**`, `content/pic/buttons/**`, `content/pic/ui overhaul/**`, `content/pic` 바로 아래 그림 파일. 캐릭터·몬스터·장면 이미지 전체 재해시는 하지 않았다.

- 후보 3,299개, 합계 109,420,347바이트.
- KEEP 2,402개: 실행 참조 또는 확인된 동적 공급·현재 보유 세이브 캐시 참조.
- HOLD 887개: 정적 전체 경로 미발견만으로 미사용을 확정할 수 없는 파일.
- MOVE_READY 10개, 357,973바이트: 활성 사본과 완전히 동일한 `ui/jo9_v197` 옛 중복 사본만 제한적으로 검토 완료.

QSP 273개 로케이션의 실행 본문·설명·기본 행동, 실제 CSS/JS/JSON/config/이미지 전환 manifest, 설치 엔진을 포함해 1,139개 입력을 스냅샷으로 기록했다. WORK의 현재 98개 SAV(3,513,311,188바이트)를 전부 해시하고 인코딩된 리소스 경로 주변만 추출해 참조와 대조했다. 세이브의 실제 인물·플레이 상태 원문은 보고서에 보존하지 않는다.

## 동적 공급자와 보호해야 할 예

- `main_menu:47-48`의 `'title' + rand(1,13)` 때문에 title1~title13은 명시적 파일명 검색에서 놓쳐도 전부 KEEP이다.
- `main_screen:352`, `city_screen:158`의 `iif(tentacle_state=1,"craving","satisfied")`는 두 안개 괴물 상태 아이콘을 선택한다. 두 파일 모두 KEEP이다.
- `main_screen`의 의상 표시줄은 `ui overhaul/clothing bar small/<<$slave[...]>>` 형태이며 장비 상태가 파일명을 공급한다. 해석되지 않은 개별 장비 변형은 HOLD로 남겨야 한다.
- `#dynamic:4899-4906`의 크라이오 버튼은 인수에서 셀 번호를 계산해 `ui/crushboss/white_번호.png`, `arousal_번호.png`를 만든다. 단순 전체 경로 미발견만으로 이동하지 않는다.
- `$menu`/`#var_base`/`#item_base` 등에서 정한 아이콘 경로는 함수 인수와 캐시 변수로 전달된다. UI 파일을 ui폴더 안으로 모으더라도 해당 경로 공급자와 구형 세이브 캐시를 같이 처리해야 한다.
- 현재 코드 참조 없이 SAV에서만 확인된 파일도 70개다. 예: `ui/action_clean.png`, `ui/action_cook.png`, `ui/action_heart_a.png`, `ui/action_heart_s.png`, 일부 옛 배경과 crushboss 아이콘. 이를 unused로 삭제하거나 구경로를 제거하면 구형 캐시가 깨질 수 있다.
- classic/old 등의 옛 스킨은 현재 강제 ui_style=2로 덜 쓰인다는 이유만으로 미사용 판정을 하지 않았다. 실행 분기에 경로가 남아 있으면 KEEP이다.

## 엔진 인덱스 영향

공개 고정 소스 `engine-base` commit `9bb0276be5f94f94f911fab0daeb225cc3c559ec`의 `qsp/jack.cpp:50-74`를 직접 읽었다. `getImages()`가 picMax를 만드는 범위는 `girls/normal_scenes`, `girls/reward_scenes`, `girls/sex_scenes`, `girls/torture_scenes`, `scene`의 다섯 루트다. UI 후보의 현재 폴더와 새 `content/pic/ui/...`는 이 범위 밖이다.

설치 엔진 바이너리에서도 다섯 검색 루트 ASCII 문자열이 확인됐다. 공개 소스와 설치 바이너리의 정확한 빌드 동일성까지 증명한 것은 아니므로 기록에 그 한계를 남겼다. UI 하드링크 별칭의 디렉터리 엔트리가 두 개 생기는 것 자체는 이 공개 구현의 picMax 검색에 들어가지 않는다.

## MOVE_READY 열 개의 다섯 근거

대상은 `ui/jo9_v197/{06cfa32964c1,2a81e31d426f,49cdec4e6773,4a0c7f1e9e75,5d095d34b115,728644846d9c,a64f99c80000,b974654aedb1,d5977d72c018,f36145a03cb3}.png`이다.

1. 정적 참조: 현재 실행 QSP·CSS·JS·JSON·config·엔진 입력에 `jo9_v197` 폴더 토큰과 해당 하위 경로가 없다. 활성 CSS는 동일 이름의 `ui/` 루트 사본을 사용한다.
2. 동적 공급자: 현재 동적 UI 폴더는 의상 표시줄·monster_status·crushboss이며 jo9_v197 공급자는 없다. 12자리 이름은 CSS의 고정 경로이고 해당 폴더 이름을 만들어 내는 공급자가 없다.
3. 인덱스: 위 엔진 picMax 다섯 루트 밖이다. A/B컷이나 등록된 interior_change 풀에서도 사용하지 않는다.
4. 외부 입력: 지원 범위를 현재 WORK에 존재하는 98개 SAV로 한정했다. 전체 세이브의 바이트 해시를 다시 대조하고, 대소문자를 구분하지 않는 shifted UTF-16 패턴으로 `jo9_v197`와 열 개 basename을 재검색해 모두 0건임을 확인했다.
5. 보존 목적: `ui/` 루트 활성 사본과 열 파일 각각의 SHA-256이 일치한다. 옛 사본은 삭제하지 않고 WORK 외부에 원래 상대 경로를 유지해 보관한다. catalog ID `UI-0466~UI-0474`, `UI-0476`과 원래 경로·해시를 manifest에 보존한다. catalog DB는 이번 조사에서 수정하지 않았다.

루트에 있는 해시명 열 파일 자체는 현재 CSS가 사용하므로 KEEP이다. 이를 거꾸로 정리하면 안 된다. MOVE_READY 상세와 파일별 다섯 근거는 `ui-move-ready-reviewed.json`에 있다. 실제 외부 보관의 원자적 복사·해시검증·기존 경로 제거·복구 manifest는 부모 작업에서 별도 실행해야 한다.

## 기록과 재현

- `ui-resource-audit.json`: 후보별 판정, 참조 근거, 동일 해시 사본, 동적 공급 조각.
- `ui-resource-snapshot.json`: 실행 입력·98개 SAV·UI 후보만의 파일 크기와 SHA-256.
- `ui-move-ready-reviewed.json`: MOVE_READY 열 파일의 근거, 활성 사본, catalog ID, 엔진 범위 교차 확인.
- 재현 순서: `node ui-resource-audit.cjs` → `node ui-move-ready-reviewed.cjs` → `node ui-resource-refine.cjs`.

정적 경로 감사는 실제 클릭/플레이 성공의 대체 증거가 아니다. 이 보고서의 판정은 위 스냅샷과 현재 지원 세이브 범위에만 적용된다. 리소스/코드가 바뀌면 이동 전 스냅샷 재대조가 필요하다.
