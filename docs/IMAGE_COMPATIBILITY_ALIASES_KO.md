# 의도된 이미지 호환 사본 원장

같은 해시의 PNG라도 게임이 서로 다른 경로를 참조하면 두 파일이 모두 필요하다. 아래 호환 사본은 중복 정리 대상이 아니라 **KEEP**이다. 해시가 같다는 이유로 하나를 삭제하거나 ZIP에서 누락시키지 않는다.

## 2026-10-28 기본 전신 경로 23개

사용자 승인에 따라 기존 JSON의 `fullimage`와 저장된 인물의 옛 기본 주소를 유지하기 위해, 정상 `indpack_title` PNG를 누락된 기본 경로에 바이트 그대로 복사했다. 새 그림은0개이고 호환 파일23개, 추가 용량4,213,447bytes다. 하드링크·심볼릭링크가 아니라 독립 사본이다.

- **기준 원장:** [assets/compatibility-aliases/2026-10-28_fullimage.json](../assets/compatibility-aliases/2026-10-28_fullimage.json)
- **적용·보존·검증 기록:** [records/fullimage-compat-aliases-20261028](../records/fullimage-compat-aliases-20261028/REPORT_KO.md)
- **검사/재적용 도구:** [tools/manage-fullimage-compat-aliases-20261028.cjs](../tools/manage-fullimage-compat-aliases-20261028.cjs)

원장은 인물ID, 참조JSON/필드/기존값, 원본과 호환 상대 경로, SHA-256, 바이트, 치수, 추가 전 부재와 의도된 중복 분류를 기록한다. 같은ID의 기존 root 후보도 당시 해시와 함께 보조 기록했다. 같은 그림의 root 후보가 있는ID는20개, 없는ID는1132/2057/2118의3개다. root 후보 파일24개 중20개는 title과 같고4개는 다르며,1205에는 같은 후보와 다른 후보가 함께 있다. **같은ID·비슷한 파일명만으로 다른 그림을 대신 쓰지 않았다.** 원본은 JSON에 등록된 title이다.

### 미래 이미지 교체 시

사본은 원본 변경을 자동으로 따라가지 않는다. 원본을 교체할 때 이 원장의 관계를 확인하고 호환 사본도 새 그림을 따라야 하는지 판단한다. 필요하면 사본과 원장을 함께 명시적으로 갱신한다. 관련 root 후보는 참고용 스냅샷이며 모두 자동 동기화해야 한다는 뜻은 아니다. 기존 그림의 역할과 실제 참조를 먼저 확인한다.

도구는 source나 호환 사본이 기록된 해시와 다르면 오류를 내며 덮어쓰지 않는다. 원장만 임의로 현재 해시에 맞춰 바꾸거나 이 오류를 이유로 사본을 삭제하지 않는다. 새 그림의 출처·의도·호환 관계를 확인한 뒤 새 변경 기록을 남긴다.

### 중복 정리·경로 변경 시

23개 호환 주소는 현재 JSON의 직접 참조와 기존 저장의 인물 경로를 위한 것이다. JSON만 고쳐도 예전 저장의 경로는 남을 수 있다. 현재/동적/옛 저장의 주소를 모두 안전하게 이관하거나 읽기 호환이 증명되기 전에는 지우지 않는다. QSP·기존 저장·머리 특성 추론을 건드리지 않기 위해 의도적으로 경로를 유지한 작업이다.

### 패치 제작 시

23개 호환 경로를 파일명 단위로 포함한다. 원본과 해시가 같아도 경로는 별도의 필수 런타임 파일이다. '새로운 해시만' 고르는 이미지팩이나 압축 전 중복 제거에서 빠뜨리면 이번 경로 문제를 다시 만들게 된다. 새 그림 수는0, 호환 파일 추가 수는23으로 구분한다. 원장과 개발 보고서를 게임용 JSON 폴더에 넣지는 않는다.

### 검사

저장소 루트에서 다음처럼 확인한다. 결과 파일은 게임 밖에 둔다.

```powershell
node tools/manage-fullimage-compat-aliases-20261028.cjs --game 'G:/somi/Jack O Nine Tails v2.4_work/game' --manifest 'G:/somi/JO9sa/assets/compatibility-aliases/2026-10-28_fullimage.json' --out 'G:/Codex/tmp/fullimage-alias-check.json'
```

기본 모드는 검사만 한다. `--apply`를 추가하면 없어진 사본을 승인 원장 그대로 배타적으로 생성한다. 다른 해시의 기존 파일·변경된 원본·달라진 JSON 참조는 덮어쓰지 않는다. 원본을 바꾸는 유지보수 작업에서 `--apply`로 자동 갱신하려 하지 않는다. 이전 원장의 해시와 맞지 않으면 검토 후 새 원장이 필요하다.

## 앞선 호환 사본 기록

2026-10-26 얼굴/전신 오기 경로15개는 [별도 기록](../records/girls-image-path-fix-20261026/compatibility.json)에 있다. 이번23개 원장으로 덮어쓰거나 숫자를 합쳐 새 그림 개수로 세지 않는다. 이전 도구는 당시 JSON 수정에 특화되어 있으므로 이번23개에 그대로 실행하지 않는다. 이 문서가 모든 UI 별칭·원본 B컷·다른 리소스 별칭을 열거하는 것은 아니다.

## 2026-10-30 여교관 캐릭터·MOB 용도 분리

characters/mistress_morrigan.png 및 mistress_ava.png는 유지하고 같은 파일명의 mob 사본을 추가했다. 새 전투와 MOB 체크리스트는 mob에서 조회한다. 기존 주소는 캐릭터 용도와 옛 세이브 표시를 위해 보존한다. 이 둘은 단순 제거 가능한 중복이 아니라 이후 독립적으로 교체할 수 있는 용도별 리소스다. 자동 동기화를 요구하지 않는다. 현재 해시·추가 용량·용도 관계는 assets/resource-role-copies/2026-10-30_mistress_mob.json, 검증은 records/mistress-mob-role-copy-20261030/REPORT_KO.md에 기록한다. 패치/전체 클라이언트에는 두 용도의 경로를 모두 포함한다.

## 2026-10-31 이사벨라 영입 거래 화면 호환 사본

`girls/full/isabella_black_long.png`는 `2571/2571_full_title.png`와 같은 현재 외형을 담는다. 거래 메뉴의 직접 호출과 기존 세이브에 저장된 HTML 주소를 보존하기 위한 별도 PNG다. 원본 제목 그림을 교체할 때 이 사본도 검토하며, 같은 해시만으로 삭제하지 않는다. 구2323이 사용하는 `_milf` 파일과 별도 역할 그림은 변경하지 않았다. 원장: `assets/resource-role-copies/2026-10-31_isabella_recruitment.json`; 검증: `records/isabella-recruitment-overlay-20261031/verification.json`.

## 2026-11-05 2071 외형 분리

갈색2071·기존 하늘색2324·새 금발2340의 독립 표시를 유지합니다. 옛2071 금발4경로, 하늘색 전신1경로, blue_short라는 이름의 실제 갈색 하녀1경로를 KEEP으로 보존했습니다. 원장 [2026-11-05_2071_split.json](../assets/compatibility-aliases/2026-11-05_2071_split.json)은 같은 바이트 사본과 다른 구도의 같은 인물, 잘못 명명된 복장 관계를 구분합니다. 해시만으로 삭제하거나 자동 교체하지 않습니다. [최종 보고](../records/girls-2071-split-20261105/REPORT_KO.md).
