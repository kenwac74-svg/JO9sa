# UI 리소스 정리와 전투 글꼴·행간 교정

2026-10-27. 적용 대상은 `G:/somi/Jack O Nine Tails v2.4_work/game`과 저장소의 추적 소스다. 배포 폴더·기존 ZIP·원본 세이브·엔진·설정은 변경하지 않는다. 커밋·푸시는 하지 않는다. 최종 설치 상태와 SHA-256은 `installation.json`이 기준이다.

## 전투 화면

- 전투 시험판 안에서 기본 글꼴인 경기천년제목 Medium을 사용한다. 없으면 맑은 고딕 계열로 대체한다.
- 행동 24px, 무기 기술명 21px/보조 효과 17px, 전투 기록 22px로 조정한다. 이름·능력치·상태·승패 제목도 해당 공간에 맞춰 확대한다.
- 여러 줄 QSP 문자열의 공백이 그대로 보존되어 행동 사이가 벌어지던 문제는 전투 root의 `white-space:normal`로 제한해서 교정한다.
- 전투 기록 조립 시 겹쳐진 BR만 정리한다. 문장 사이의 실제 글자·색상·정상 줄바꿈은 유지한다. CSS `br+br`로 모든 문장 구분을 없애지 않는다.
- 스크롤바는 표시하지 않는다. 보통 기록은 기존 하단에 모두 표시하며, 긴 기록만 같은 글씨 크기로 이전·다음 페이지에 나눠 모든 내용을 보존한다. 이는 선택 질문에 답이 없는 동안 추천안으로 택한 표시 방식이며, 사용자에게 페이지 방식 승인으로 기록하지 않는다.
- 결과 화면의 원래 검/방패와 엄지 아이콘, 원래 EXEC 명령은 유지한다.

## 호출·의존성·부작용

- `mods/2026-10-27_ui_resource_paths.json`, 식별자 `UI_RESOURCE_PATHS_20261027`: 81개 실행 본문의 이미지 경로 치환을 기록한다. 조건·수치·비문자열 실행 코드는 보존한다.
- `mods/2026-10-27_zz_battle_font_layout.json`, 식별자 `BATTLE_FONT_LAYOUT_20261027`: `боевой_интерфейс`, `конец_боя` 끝에서 `content/js/jo9_battle_log.js?v=20261027`을 읽는다. 새 QSP 로케이션·변수·저장 키는 없다.
- CSS `BATTLE_FONT_LAYOUT_20261027`, `BATTLE_LOG_PAGING_20261027`은 `.jo9-battle-v01` 내부만 대상으로 한다. 다른 화면의 글꼴·행간은 바꾸지 않는다.
- JS 입력은 현재 전투 root의 `#fight_txt` DOM이다. 반환값은 없고 표시용 DOM과 `window.JO9BattleLog` 점검 API를 만든다. 페이지 이동은 QSP 명령이나 전투 진행을 호출하지 않는다. 문자열을 보존하고 한 화면에 들어가는지 측정해서 페이지를 만든다. 저장 파일에 페이지 번호를 쓰지 않는다.
- JS만 제거하면 긴 기록의 페이지 기능이 없어지며, 숨김 영역에서 글자가 잘릴 수 있다. QSP 훅·JS·해당 CSS를 함께 복구해야 한다. 이미지 경로 패치는 별도지만 되돌릴 때 두 패치의 앞뒤 해시 순서를 지킨다.

## UI 이미지 관리

- 외부에 흩어진 UI 2,681개, 57,252,711바이트의 정식 관리 경로를 `content/pic/ui` 하위에 만들었다. 충돌하는 같은 이름은 원래 하위 구조를 보존해 덮어쓰지 않았다.
- `buttons/legacy`, `legacy_overhaul`, `frames/legacy`, `panels/legacy`, `status/legacy` 등의 범주로 정리했다. 이미지 픽셀은 바꾸지 않았다.
- 현재 QSP·base.css·traits JS·menu_icon JSON의 확인된 경로 공급자는 새 경로를 사용한다. 기존 세이브가 옛 UI 경로를 캐시에 담고 있으므로 옛 파일 경로도 호환 별칭으로 유지한다. 추적 소스는 `resources/new/content/pic/ui`에 있다.
- NTFS 하드링크로 옛 경로·새 경로·추적 소스가 같은 데이터를 가리킨다. 추가 이미지 데이터 용량은 없지만, 향후 ZIP은 여러 경로를 각각 파일로 저장할 수 있다. ZIP 절감량으로 표현하지 않는다. 교체 도구는 파일에 직접 덮어쓰기보다 새 파일로 교체하는 방식이 안전하다.
- `modtools/ui-resource-aliases.json`과 `canonical-link-journal.json`에 호환 경로·해시를 남겼다. 옛 경로를 일괄 삭제하면 기존 세이브의 캐시가 깨질 수 있다.
- 미사용 확정은 `ui/jo9_v197`의 중복 10개, 357,973바이트만이다. `G:/somi/JO9_unused_images/ui-live-consolidation-20261027`로 외부 보관했고, 현행 CSS가 사용하는 UI 루트의 동일 사본은 유지했다. 미확정 887개는 그대로 둔다.

## 검증과 한계

- 공식 `release-check.cjs`: 구조·줄 경계·레지스트리·패치 재생/재적용·실제 설치 엔진 9경로 검사는 `official-report.json`을 확인한다. 전체 QSP 분기의 완전한 문법 증명은 아니다.
- 전투 표시 검사는 `battle-font-native-results.json`이 기준이다. 단일/다중 적, 긴 기술 목록, 승리/패배 및 결과 클릭 경로를 진단 사본의 실제 QtWebKit에서 검사한다. 각 페이지의 글자 보존·넘침·글꼴·이전/다음 이동을 검사하며 단순히 overflow:hidden으로 잘림을 가리는 것을 통과로 보지 않는다.
- 이미지 경로만 바뀌었는지 별도 독립 검토했다. 기존 SAV 해시·이미지 인덱스 폴더 보존은 `final-preservation-check.json`이 기준이다.
- 실제 Windows 화면의 연속 수동 클릭 조사는 완료하지 못했다. 기존 창·독립 시험 창 모두 활성화 실패/바탕화면만 반환했고, 사용자는 모바일이므로 PC 복원을 요청하지 않는다. 엔진 내부 DOM 검사와 실제 데스크톱 플레이 검증은 구분한다.
- 공통 좌표 감사는 `../ui-position-rules-audit-20261027/UI_POSITION_RULES_AUDIT_KO.md`에 있다. 확인된 프로필 CSS의 전역 테두리 영향과 화면 초기화 중복은 별도 정리 대상으로 남겼다. 이번 전투 글꼴 수정에 전체 UI 좌표 개편을 섞지 않았다.

## 복구·재현

- 원래 QSP/CSS/traits JS/menu_icon JSON 백업: `G:/somi/JO9_work_backups/ui_resources_20261027082318`.
- 복구할 때는 위 파일 4개를 같은 상대 경로의 WORK와 해당 추적 소스에 되돌린다. 새 pager JS는 원래 QSP에서 호출되지 않으므로 남아도 동작에 관여하지 않는다. 이후 변경이 있으면 파일을 통째로 덮지 말고 해당 변경 블록만 대조한다.
- 새 UI 정식 경로·옛 호환 별칭을 그대로 남겨도 원래 코드와 호환된다. 불필요 사본 10개는 외부 journal로 복구 가능하다. 작업 로컬 `scripts/archive_images_manifest_compat.py restore --journal <외부 journal.json>`을 사용하며, 실행 전 원래 경로 충돌을 검사한다.
- `scripts/prepare-migration.cjs` → `scripts/compose-font.cjs` → 공식 출고 검사 및 `scripts/battle-font-native.cjs` → `scripts/install-final.cjs`가 재현 순서다. baseline 해시가 다르면 자동으로 중단하며 현재 WORK를 읽어 새 후보를 만들어야 한다.
