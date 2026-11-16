# 개인실 버튼의 원래 메뉴 연결 — 2026-11-11

사용자는 “개인실 버튼 → 원래 행동 선택 메뉴 → 해당 개인실 복귀” 방식과 원래 메뉴의 행동력 소모·비용·효과 사용을 승인했다. 현재 WORK를 기준으로 개인실1~4에 적용했다.

## 사용자 동작

개인실의 기존 `섹스한다` 버튼은 해당 방의 인물을 대상으로 원래 선택 메뉴(`menu_sex`, 현재16)를 연다. 행동 구현과 비용·결과는 기존 코드를 사용한다. 종료·접기·이탈 시 기존 대상 연결을 풀고 해당 개인실로 돌아간다. 원래 주 노예의 소유 데이터는 복원하며, 행동으로 생긴 변화·이력은 개인실 인물에게 저장한다.

버튼의 기본 조건은 방 인물이 행동 가능한 상태(`slave_exist`)이고 행동력이 −4보다 높은 경우다. 원래 메뉴 안의 추가 조건과 비용은 원래 코드가 판단한다. 별도의 개인실 무료 처리나 비용 보정은 추가하지 않았다. 낡은 `room_sex` 콜백도 같은 메뉴로 연결한다. 기존1027~1030 처리 본문은 삭제하거나 수정하지 않았다.

새 지속변수·세이브 필드·로케이션은 없다. 원래 메뉴를 실행하는 동안 기존 bridge의 임시 대상 교환이 유지되므로, 중간 상태만 따로 지우거나 복제하면 안 된다.

## 원인과 변경

원래 `menu_form`에는 개인실 대상이 연결된 경우 원래 메뉴 대신 `snk_room_bridge:room_sex`를 실행하는 별도 우회가 있었다. `room_sex`는 대상 교환을 먼저 해제하고 방별1027~1030으로 보냈다. 원래 선택 메뉴16은 bridge의 허용 목록에도 빠져 있어 버튼만 바꾸면 곧바로 개인실로 되돌아갔다. 실제 엔진의 수정 전 진단에서 이 복귀를 재현했다.

| 위치 | 변경과 안정적인 패치 참조 |
|---|---|
| `slave_private_room1~4` | `PRIVATE_ROOM_ORIGINAL_MENU_<방번호>_20261111`: 기존 버튼을 `enter(방번호, menu_sex)` → `menu_form`에 연결한다. 대상 상태와 행동력 부족 시 비활성 표시한다. |
| `menu_form` | `PRIVATE_ROOM_SHARED_MENU_20261111`, `PRIVATE_ROOM_SHARED_DISABLED_20261111`: 임시 연결된 대상도 일반 대상과 같은 원래 버튼·비활성 버튼을 사용한다. 원래 선택 메뉴 본문은 보존한다. |
| `snk_room_bridge` | `PRIVATE_ROOM_LEGACY_MENU_20261111`: 옛 콜백에서 대상 교환을 유지하고 원래 메뉴로 보낸다. |
| `snk_room_bridge` | `PRIVATE_ROOM_MENU_ENTRY_ENERGY_20261111`, `PRIVATE_ROOM_MENU_GUARD_ENERGY_20261111`, `PRIVATE_ROOM_MENU_GUARD_ALLOW_20261111`: 메뉴16을 허용하고 진입·저장된 링크의 행동력 경계를 검사한다. 기존 `leave`와 복귀 구조는 유지한다. |

이 연결은 기존 `$swap_slave_instances` 및 `$slave_vars` 목록을 사용한다. 인물 속성·이름·소지품·변화율·행동/세션 이력은 이 목록에 따라 이동한다. 원래 종료의 `menu_form=0`은 기존 guard에서 연결 해제와 방 복귀로 처리한다. 조수가 함께 참여하는 항목과 외부 참가 항목은 원래 메뉴 조건 그대로 제공한다.

변경은6개 로케이션·11edit다. `interaction`, `interaction_result`, `sex_initiate`, `sex_end`, `sex_addup`, `#dynamic`, `#sex_options`, `#sex_texts`의 본문은 작업 직전과 동일하다. 원래 비용·효과를 새로 작성하거나 수치로 복제하지 않았다.

11/10 인계의 “개인실 행동은 행동력을 차감하지 않는다”는 문구와 달리, 당시 실제 방별 행동에도 `half_action` 및 `$master_energy_drop` 호출이 있었다. 이번 연결의 비용 기준은 그 문구가 아니라 사용자가 새로 확정한 “원래 메뉴의 비용·효과 그대로”다.

## 검증과 한계

- 실제 설치된 WORK `engine/jack.exe`에서 수정 전 메뉴16의 대상 연결 해제·방 복귀를 실패 표식으로 재현했다(`native-before.json`, `before-guard-stderr.log`).
- 네 방 × 원래 주 노예 존재/부재의8연결 및 복원, 연결 중 행동력 −4/−3 경계가 통과했다. 네 방 × 상태3종 × 행동력3종의36버튼 활성/비활성 조건도 통과했다(`native-after.json`).
- 원래 bridge로 인물 전체 데이터·세션 이력을 교환하고, 대상의 변경만 방에 반영하며, 주 노예·임시 보관 슬롯·콜백을 복원하는 검사를 통과했다.
- 28개 흐름 사례를 통과했다: 네 방의 실제 버튼에서 추출한 콜백과 원래 메뉴 링크, 접기/이탈 복귀, 일반 대상과 개인실 대상의 같은 행동 비용 비교, 원래 직접 조작 초기화와 종료 정산 연결. 비교한 비용은 주인공 행동력/반행동, 스파크, 대상 행동력/반행동/열량이다.
- 직접 조작의 중간 플레이는 대신 합성 종료 상태를 넣었다. 세션 이력과 정산의 대상 복원을 확인한 것으로, 전체 미니게임 플레이를 뜻하지 않는다. 다인 참여 항목은 원래 링크 제공을 확인했으며 모든 결과를 실행하지 않았다.
- 진단에서는 최종 renderer, `main_layout`, `$newloc`의 화면 후처리를 격리했다. 행동·결과·초기화·종료·교환의 실제 코드는 유지했으며, 상세 계측 경계는 `integration-instrumentation.json`, `integration-lifecycle-instrumentation.json`에 있다. `interaction`에는 옛 UI 경로 검출용 접두 검사만 붙였다.
- 원래 행동의 무작위 효과는 유지하되 정확한 비용 대조 대상에서 제외했다. 실제 개인 SAV·물리적 클릭·레이아웃·그림 외형은 미검증이다.
- 독립 정적 검토에서 차단할 문제가 없었다. 구조296로케이션·바이트 왕복·CRLF·주석 경계, 공식 재생·재적용, WORK/소스/원장 해시 일치를 확인했다. 실제 로그의 실패 표식 부재와 각 진단의 단일 완료 신호도 대조했다.

전체 배포 검사를 이번에 다시 실행한 것은 아니다. Full·개인 세이브·이미지·음원·커밋/푸시는 수정하지 않았다. 체크 상태·일정·메뉴 정의 JSON·춘향 JSON의 해시는 보존했다. 이미지 체크리스트의 오래된 QSP 분석 표시는 별도 동기화하지 않았다.

## 일반 EXE에서 확인

게임을 완전히 다시 실행한 뒤 기존 세이브를 불러온다.

1. 개인실1~4에서 기존 버튼을 눌러 원래 행동 선택 메뉴가 열리고 대상 이름이 방 인물인지 확인한다.
2. 행동을 한 번 마치고 같은 개인실로 돌아오는지, 주 노예와 방 인물이 뒤바뀌지 않았는지 확인한다.
3. 다시 메뉴를 열어 접거나 뒤로 이동했을 때 대상과 화면이 정상인지 확인한다.

실행 중인 게임 메모리에 이미 올라간 이전 QSP는 자동으로 바뀌지 않는다.

## 파일·복구·재현

- 변경 선언: `mods/2026-11-11_private_room_original_menu.json`
- 실행 계획: `docs/superpowers/plans/2026-11-11-private-room-original-menu.md`
- WORK/소스 QSP 해시: `ab34a14466348807883fb06ab65e43ad507f892cf148696f38b3aebcac7b216d` → `a08546afd58aff978c1b29b54ca00dcaf53654981ac8c05d1e7a357e4deceb53`
- 작업 직전 복구본: `G:/somi/JO9_work_backups/private-sex-menu-20261111-ab34a1446634/before.qsp.gz`와 `runtime-source-before.json`. 압축 해제 후 원본 해시 일치를 확인했다.
- 재현 코드: 이 폴더의 `guard.cjs`, `native.cjs`, `task.cjs`. Node, Windows PowerShell, 기존 코덱/검사기/적용기, 설치 엔진에 의존한다. 고정 경로는 각 파일 상단에 있다.

```powershell
node records/private-sex-menu-20261111/guard.cjs 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp' 'G:/Codex/tmp/jo9-private-sex-menu-20261111/guard-recheck'
node records/private-sex-menu-20261111/native.cjs 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp' 'G:/Codex/tmp/jo9-private-sex-menu-20261111/integration-recheck'
& tools/qa/run-client-smoke.ps1 -Engine 'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe' -Plan 'G:/Codex/tmp/jo9-private-sex-menu-20261111/integration-recheck/plan.json' -TimeoutSeconds 30
```

진단은 새 임시 폴더를 사용한다. `task.cjs`의 최초 준비/설치 모드는 작업 이력 보존용이며 반복 적용 명령이 아니다. 복구할 때 이후 수정이 없다면 압축 백업과 원장 백업을 함께 되돌릴 수 있다. 이후 수정이 추가됐다면 전체 옛 QSP를 덮지 말고 이번 모드의11edit만 역방향으로 제거해 다시 검사한다. 버튼·메뉴·가드 중 일부만 되돌리면 UI와 진입 동작이 어긋날 수 있으므로 함께 관리한다.

재생성 가능한 시험 QSP·복제 설정·중복 백업은 검증 후 정리하고 압축 복구본·핵심 기록·재현 코드만 보존한다.
