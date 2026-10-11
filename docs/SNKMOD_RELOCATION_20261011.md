# SNKmod 정규 경로 이전 — 2026-10-11

사용자 요청: 구버전 4개 그림을 추가 컷으로 보존하고 체크리스트에 반영한 뒤, 폐기된 SNKmod 폴더의 자원을 원래 용도에 맞는 위치로 이동한다. 기존 UX·UI 배치·이미지 픽셀·현재 B컷을 유지한다. 플레이 테스트는 사용자가 한다.

## 추가 컷 4개

| 원본 소스 이름 | 게임에 남긴 경로 | 체크리스트 코드 |
|---|---|---|
| bishop_nerilis_1.2.1.png | characters/bishop_nerilis (3).png | CH-0562 |
| Manhunter_1.2.1.png | characters/Manhunter (2).png | CH-0561 |
| kerulis_veil_1.2.1.png | characters/kerulis_veil (3).png | CH-0563 |
| magister_gilmeritus_1.2.1.png | characters/magister_gilmeritus (3).png | CH-0564 |

사용자가 기존 B컷 유지·구버전 C컷 추가를 선택했다. Manhunter는 빈 B컷에 복구했다. 보호된 JO9O 소스에서 내용 그대로 복사했으며 다른 세 명의 원본 B컷 연결·해시를 보존했다. 4개 모두 795×596, 추가 파일 합계 2,135,782 bytes. `interior_change` 등록과 부모-추가 컷 연결을 갱신했다. 새 행은 **아무 상태도 체크하지 않았고** 다른 사용자 확정 상태는 유지했다. 버전 번호가 붙은 옛 파일명은 플레이 PIC에 다시 만들지 않는다.

검증 기록: [추가 컷 해시와 코드](resource-audits/2026-10-11/restored-legacy-cuts/verification.json). 복구 전 메타데이터: `G:/somi/JO9_unused_images/20261011_restore_legacy_cuts`.

## SNKmod 정리 결과

- 대상은 실제 실행본 `G:/somi/JO9/game/content/pic/SNKmod`. JO9O·동기화된 프로젝트 sources·과거 원본/배포 ZIP은 수정하지 않았다.
- 이미지 **194개**, README **1개** 모두 외부에 해시 검증 백업했다. 이미지 내용은 정규 경로의 **165개 고유 파일**로 보존했다. 29개 trash 그림은 다른 활성 이미지와 같은 해시여서 같은 정규 파일로 연결했다. README는 외부에 보관한다.
- **96개 새 목적 파일**을 만들었고, 같은 해시로 이미 존재한 자원은 재사용했다. 기존의 다른 그림을 덮어쓰지 않았다.
- bg → `content/pic/bg/`, characters → `content/pic/characters/`, scene → `content/pic/scene/`, master 초상화 → `content/pic/master/`, UI → `content/pic/ui/`, 버튼 → 기존 `content/pic/buttons/`.
- 기존 버튼과 이름만 같고 내용이 다른 6개는 `content/pic/ui/buttons/`에 보존: heavy_active, heavy_used, milk_drop_large, milk_drop_medium, thumb_down, thumb_up. UI overhaul의 추가 아이콘 4개는 `content/pic/ui/icons/`에 보존했다.
- 파일별 대응·SHA256·bytes는 [정규 경로 맵](resource-audits/2026-10-11/snkmod/path-map.json)에 있다. 기존 2026-10-03의 153개 목록과 무조건 덮어쓰기 가정은 이 현재 실측 결과로 대체한다.
- 이전 SNKmod 파일 195개와 **빈 폴더만** 제거했다. 기존 이미지 110개와 혼동해서 추가 컷을 제거하지 않는다.
- 이전 원본 합계 **21,459,232 bytes**, 새 목적 파일 합계 **16,088,527 bytes**, 중복 정리 순절감 **5,370,705 bytes (약 5.37 MB / 5.12 MiB)**. ZIP 압축 절감량이나 완성 배포판 용량은 아니다. 이번 4개 추가 컷까지 포함한 이미지 파일 합계 순절감은 3,234,923 bytes다.

## 코드와 체크리스트

- 실행 jack.qsp의 8개 기존 location은 자원 경로와 주석만 바꿨다. `$ongload`에는 기존 저장본의 `$bg_path`, `$special_bg`, `$special_image` 캐시에서 옛 경로 접두어를 정규화하는 코드를 추가했다. 다른 location과 action/desc 필드는 바이트 동일하다. `snk_room_*` 내부 식별자는 유지한다.
- QSP 변경은 `mods/2026-10-11_relocate_snkmod_resources.json` 선언형 9개 body edit로 적용했다. QSP에서 다시 qsrc를 빌드하지 않았다. 기존 일회성 구버전 retirement body 패치는 최신 전환 등록과 중복되므로 mods/archive로 이동했고, 정규 전환 패치가 4개 컷을 등록한다.
- `css/base.css`는 URL 경로만 변경했다. 폭·높이·위치·폰트·버튼 디자인·기존 스타일 선언은 그대로다. `css/mainScreen.css`는 바이트 동일. `json/menu_icon.json`은 아이콘 URL만 변경했다. 기존 assets/json 스냅샷은 다른 내용을 보존하며 해당 경로만 정규화했다.
- 체크리스트 옛 SNKmod 행 194개를 정규 경로로 이전/중복 병합했다. 현재 **31,391행**. 고유 이동 행은 ID를 보존하고 기존 정규 행과 합쳐진 옛 ID는 `catalog_path_aliases.json` 194개 대응으로 추적한다. 사용자 체크와 이력은 보존했다. 사용자와 무관한 항목의 상태는 바꾸지 않았다.
- make_catalog.ps1은 순정 원본의 퇴역 SNKmod 파일을 다시 ‘플레이에 없음’ 행으로 노출하지 않는다. 순정 파일은 지우지 않는다. sync_snkmod.ps1은 퇴역 안내 후 종료하며 -Apply도 옛 폴더를 재생성하지 않는다.
- 개인 작업 ledger는 예전 기록을 유지하고 `relocate` 기록을 추가했다. 소유 근거가 있던 장면 **15개**만 새 경로로 이어받는다. 이동만으로 외부 자원 전체를 개인 작업물로 간주하지 않는다. 개인 ZIP과 PC 이동 export 도구도 이 기록을 처리한다.

## 검증과 한계

QSP 적용 전·후 왕복 직렬화 동일, location 247개 유지, 변경 범위 9 body 한정, 재적용 DryRun 무변경 통과. 194개 목적 이미지와 195개 외부 백업 해시 검사 통과. 실행 QSP·CSS·menu_icon의 직접 SNKmod 참조 없음. 전환 목록·세 캐릭터의 기존 B컷·추가 4개 컷·미체크 상태 확인. 브라우저 체크리스트에서도 Manhunter 추가 컷과 SNKmod 없는 폴더 목록을 확인했다. 개인 패치 기존 3개 테스트, export 기존 11개 테스트, 이동 소유권/시각 cutoff 회귀 1개 테스트 통과.

전체 과거 mods를 현재 QSP에 재적용하는 별도 검사는 **기존** `2026-10-01_robertus_rufus_art_tutor`의 `#txt_man.body` old/new 불일치로 중단했다. 해당 필드는 이번 전후 바이트 동일하다. 이번 migration mod 단독 재적용은 통과했지만 전체 역사 패치 재조정과 새 PC 전체 재빌드가 완료됐다고 말하지 않는다. 기존 `interaction`/`interaction_city` 정적 검사 경고도 그대로이며 이번 변경으로 추가되지 않았다.

사용자 확인 대기: 게임을 완전히 재시작 → 기존 세이브 로드 → 개인실/2층 메뉴와 역할·상태 아이콘 → 전투창 표시 → 로베르투스/쿠라 관련 화면 → 대상 4명 컷 전환. 화면·실행·저장/로드 호환은 실제 플레이 결과 전까지 통과로 표기하지 않는다.

## 외부 보관과 복구

보관: `G:/somi/JO9_unused_images/20261011_snkmod_relocation`. resources에는 옛 상대 경로 그대로 195개를 보관하고 metadata에는 수정 전 QSP/CSS/JSON/체크리스트/ID/도구를 보관했다. plan.json, journal.json, verification.json, final-check.json, apply.log가 있다.

`RESTORE.ps1 -Check`는 쓰지 않고 복구 가능 여부만 검사한다. `RESTORE.ps1`은 해시와 경로를 검사하고 자원과 메타데이터를 이전 상태로 되돌린다. 이후 사용자 변경이 발견되면 덮어쓰지 않고 중단한다. 기존 정규 자원은 제거하지 않고 이번에 새로 만든 목적 파일만 정리한다. 외부 백업은 복구 후에도 유지한다.

12:35 이후 별도 Elisey 이미지 교체가 카탈로그·상태·개인 작업 ledger에 기록된 것을 확인했다. `RESTORE.ps1 -Check`는 이 후속 변경 때문에 예상대로 중단했으며 아무 파일도 바꾸지 않았다. 최신 체크리스트와 해당 작업은 유지했다. 지금 전체 메타데이터를 과거 스냅샷으로 강제 덮어쓰면 안 된다. 실제 복구가 필요하면 journal의 SNKmod 대응만 선택적으로 되돌리고 이후 작업을 병합해야 한다.

## 2.4.0 배포 안내에 넣을 문구

> 2.4.0부터 구형 UI 패치의 SNKmod 리소스를 배경·캐릭터·장면·UI 등 정규 폴더로 통합했습니다. 새 풀팩에는 SNKmod 폴더가 없습니다. 기존 설치에 간소화 패치를 적용하는 경우, **새 jack.qsp·CSS·JSON 및 정규 경로 리소스를 모두 설치한 다음** game/content/pic/SNKmod에 남은 구버전 폴더는 백업 후 삭제해도 됩니다. 구버전 게임에 먼저 이 폴더만 삭제하면 이미지가 누락됩니다. 다른 패치가 별도로 사용하는 파일은 해당 패치의 안내도 확인하세요.

빌드 담당자는 풀팩·간소화 모두 옛 SNKmod 경로, __JO9_ImageBackups, _JO9_SNKmod_STATE, QSP .bak, 외부 보관/모딩툴/개인설정이 ZIP에 다시 섞이지 않게 검사한다. 간소화 버전의 필수 UI 의존 파일은 확인된 작업/출처로 선별하며, 이 작업만으로 아직 두 배포 ZIP을 생성·승인하지 않는다.

상세 자동 검증: [적용 결과](resource-audits/2026-10-11/snkmod/verification.json), [최종 범위 검사](resource-audits/2026-10-11/snkmod/final-check.json).
