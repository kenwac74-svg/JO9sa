# UI 이미지 경로 통합 계획 — 아직 운영 파일 변경 없음
2026-10-27. 대상은 G:/somi/Jack O Nine Tails v2.4_work/game이다. 원본 이미지·기존 세이브·배포 폴더·CSS·JS·QSP·Git은 이 계획에서 수정하지 않았다.

## 수량과 범위
기존 content/pic/ui: 606개, 34,290,139바이트.
ui 밖에서 명백한 인터페이스 자산으로 뽑은 경로: 2,681개, 57,252,711바이트(약54.60MiB).

| 원래 위치 | 파일 | 바이트 | 제안 대상 |
|---|---:|---:|---|
| content/pic/buttons 전체 | 177 | 1,677,571 | content/pic/ui/buttons/legacy/ 아래 원래 하위 구조 |
| content/pic/ui overhaul 전체 | 2,417 | 31,966,763 | content/pic/ui/legacy_overhaul/ 아래 원래 하위 구조 |
| content/pic 루트의 프레임·패널·상태·시설·아이콘·placeholder | 78 | 22,173,045 | ui/frames, panels, status, facilities, icons, placeholders의 legacy 하위 |
| content/pic/bg 안의 빈 페이지·스크롤·debug닫기 자산 | 9 | 1,435,332 | ui/panels/bg_legacy 또는 ui/buttons/debug_legacy 아래 원래 하위 구조 |

통합 후 새 정식 UI 경로는 기존606+신규2681=3,287개다. 호환 별칭은 별도로 세어야 한다.
pic/girls·characters·master·mob·scene·demo·reserve·이미지 백업·modworkpic·원본컷 연결은 UI로 일괄 편입하지 않았다. 일반 배경은 bg에 둔다. pic 루트의 title14개와 용도를 이름만으로 확정하지 못한7개, 총21개는 reviewNotMapped로 남겼다.
여기서 UI 역할 분류와 미사용 판정은 별개다. 현재 고정 실행 참조 발견2,181개는 KEEP, 미발견500개는 HOLD이며 미사용 확정이 아니다. 이 맵에서 MOVE_READY는0이다.

## 충돌
- 제안한 최종 목적지의 대소문자 무시 경로 충돌: 0.
- 이름만 합치면 basename 충돌145그룹. 이 중130그룹은 SHA256가 다른 파일이고15그룹만 동일 내용이다.
- 기존 ui 안의 파일과 이름이 겹치는 것은50그룹이다. 같은 basename만 보고 덮어쓰거나 제거하지 않는다.
- buttons를 그냥 ui/buttons로 합치면 heavy_active, heavy_used, milk_drop_large, milk_drop_medium, thumb_down, thumb_up 6개가 실제 다른 내용과 충돌한다. legacy 하위로 분리해 회피했다.
- bg/page_blank.png와 bg/slave_psychology/page_blank.png도 서로 다른 원경로다. 목적지에 원래 하위 폴더를 보존한다.

## 기존 세이브 호환
읽기만 한 두 표본에서 구 UI 경로를 포함한 변수는 다음과 같다.
- save/1.sav: 2,637개 변수.
- save/JO9_GOLD_AP_CHECK_20261026.sav: 2,636개 변수.
대부분 MENU_ITEM 계열 캐시가 포함된다. 현재 페이지를 한 번 다시 그리는 것만으로 모든 저장된 메뉴/코드 경로가 새 경로로 바뀐다고 볼 수 없다. 세이브 파일 자체는 수정하지 않았다.

첫 통합은 새 ui 경로를 정식 관리 경로로 만들되, 옛 경로를 호환 별칭으로 유지하는 안이 단순하다.
G:는 .NET DriveInfo로 NTFS인 것을 확인했다. 같은 볼륨에서는 oldSource와 newCanonical을 하드링크로 연결해 파일 바이트를 공유할 수 있다. 안전한 순서는 원본을 먼저 지우거나 옮기지 않고 fs.linkSync(oldSource,newCanonical)로 새 이름을 만들고, 두 경로의 SHA256와 dev/ino를 대조하는 것이다. 최종 파일 상태는 정식 경로로 이동한 뒤 옛 경로에 하드링크를 둔 것과 같다. NTFS 자체에는 어느 이름이 정식인지 구별이 없으므로 manifest가 그 역할을 맡는다.

제약:
- 하드링크는 같은 볼륨에만 가능하다. 디렉터리 링크와 구분한다.
- 일반 복사·ZIP·압축 해제는 두 이름을 독립 파일로 만들 수 있다. WORK의 파일 바이트 공유와 배포 압축 크기는 별개다.
- 편집기가 원자적 교체로 저장하면 한쪽 링크가 끊어질 수 있다. 영구 자동 동기화로 간주하지 말고 빌드 전 별칭 쌍의 해시를 검사한다.
- 옛 경로를 지금 제거하는 페이지/캐시 일괄 갱신안은 모든 저장 캐시 공급자 검증이 필요해 첫 작업으로 권하지 않는다.
- 검증된 미사용 파일을 외부 보관한다면 같은 파일의 새 canonical 링크를 동시에 남겨서는 실제 공간을 줄일 수 없다. 미사용 확정 목록은 통합 트랜잭션에서 먼저 분리해야 한다.
- 이번 통합 자체를 용량 절감으로 보고하지 않는다.

## 엔진 디렉터리 인덱스
공개 engine-base 고정 커밋 9bb0276be5f94f94f911fab0daeb225cc3c559ec의 qsp/jack.cpp getImages():50–74는 girls의 normal_scenes/reward_scenes/sex_scenes/torture_scenes 및 scene, 다섯 루트만 순회한다. 이 계획의 UI 출발지와 목적지는 그 밖이다. 이 공개 구현에서는 UI 경로의 하드링크 추가가 picMax에 영향을 주지 않는다.
설치 바이너리가 해당 소스와 완전히 같은 빌드라는 보증은 없으므로, 실적용 전후 native 이미지 인덱스 스냅샷을 비교하는 것이 좋다. 소스 이름만으로 전체 UI를 HOLD시키거나 반대로 모든 인덱스 안전을 보증하지 않는다.

## Git·패치·도구 영향
- 정식 자산 추적 위치는 resources/new/<새 상대 경로>와 명시적인 old→canonical 별칭 manifest로 정리한다. 이미 추적된 옛 자산의 출처와 변경 이력은 보존한다.
- CSS/JS 파일 자체는 현재 css/ 및 content/js 위치를 유지한다.
- 코드 안 경로를 갱신할 때는 현재 WORK를 기준으로 새 mods/*.json을 만들고 정확 재생·재적용 검사를 한다. 과거 패치 JSON의 old/new 경로 문자열을 소급해서 고치지 않는다.
- 상태 편집기·대사편집기·이미지 카탈로그가 같은 내용을 두 경로로 인벤토리할 수 있다. 정식 경로와 호환 별칭을 manifest로 구별하고, 카탈로그 DB를 근거 없이 일괄 수정하지 않는다.
- ZIP에는 어느 옛 별칭을 넣고 어느 경로가 선행 기본팩에서 제공되는지 명시해야 한다. 새 설치본과 덮어쓰기 패치의 조건이 다르다. 설치기/링크 생성 스크립트를 이 계획에서 자동 추가하지 않는다.
- 기능 리팩터링·화면 좌표 변경·새 UI 생성은 이 경로 정리와 별개다.

## 재현과 실제 적용 전 조건
scripts/ui-asset-map.cjs가 읽기 전용 인벤토리·해시·참조·충돌 맵을 다시 만든다. 이어 scripts/compatibility-plan.cjs가 두 세이브의 경로 캐시를 다시 읽고 호환 계획을 보강한다. 최신 입력이 달라지면 새 결과로 갱신한다.
실제 통합을 담당하는 부모는 파일별 현재 SHA256, 목적지 미존재, 목적지의 실제 절대 경로가 WORK 안인지, 원본컷·백업 정션에 걸리지 않는지 확인한 뒤 실행해야 한다. 이 작업자가 실행한 이동·삭제·하드링크 생성은0이다.
