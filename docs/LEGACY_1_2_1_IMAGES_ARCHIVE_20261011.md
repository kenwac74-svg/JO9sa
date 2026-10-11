# 1.2.1 구버전 이미지 외부 보관 — 2026-10-11

사용자가 파일명에 `1.2.1`이 들어간 이미지를 구버전 잔여 미사용 소스로 확정하고 전부 JO9 밖으로 이동 및 이미지 패치리스트 제외를 지시했다. 이 판정은 자동 정적 분석의 미참조 인증과 구분한다. 일반적인 미체크/HOLD 이미지나 다른 전환 리소스에는 적용하지 않는다.

- 실제 이동: 110개, **44,085,562바이트 (44.09 MB / 42.04 MiB)**. 캐릭터 109개, UI `page_blank_1.2.1.png` 1개.
- 보관: `G:/somi/JO9_unused_images/20261011_legacy_1_2_1/files/` 아래 원래 JO9 상대 경로 유지.
- 현재 카탈로그: 31,597 → 31,483개. 실제 파일 110개와 가상 B컷 4개를 제외했다. 카탈로그 seed에서도 해당 114개를 제외했다.
- `make_catalog.ps1` 저장소/설치본 양쪽에서 이름에 `1.2.1`을 포함한 파일을 플레이/원본 인덱스 모두에서 제외한다. 재생성 시 순정 측의 구버전 파일이 “플레이에 없음”으로 되살아나는 것을 막는다.
- 체크 상태와 작업 ID는 삭제하거나 재번호 부여하지 않았다. 카탈로그의 다른 행, HTML/JS, 앞선 미체크 폴더 보기 변경을 보존했다.

## 가상 B컷 처리

다음 별칭의 `originals`/`reservations` 각 4개만 manifest에서 해제했다. JO9O의 실제 원본 및 junction은 건드리지 않았다.

- `characters/bishop_nerilis_1.2.1 (2).png`
- `characters/Manhunter_1.2.1 (2).png`
- `characters/kerulis_veil_1.2.1 (2).png`
- `characters/magister_gilmeritus_1.2.1 (2).png`

QSP에서 구버전 파일명이 있는 실행 경로는 `interior_change`의 자동 등록 4개 그룹이었다. 다른 location의 `1.2.1`은 제작진 설명과 주석이었다. `mods/2026-10-11_retire_legacy_1_2_1_image_cycle.json`을 만들고 `tools/apply_mods.ps1`로 해당 4개 그룹만 제거했다. 이후 빌드에도 반영되도록 기존 이미지 전환 mod의 같은 4개 그룹을 제거했다.

## 검증과 복구

- 모든 이미지 복사 → SHA256 일치 확인 → 원래 파일 제거 순서로 처리했다. 외부 110개 해시 일치 및 플레이 PIC의 해당 파일 0개를 확인했다.
- 버전 번호 없는 현재 이미지 110개와 JO9O B컷 실제 원본 4개의 해시를 전후 대조해 동일함을 확인했다.
- QSP 247 location 왕복 검증, 따옴표/END 검사 통과. 바뀐 필드는 `interior_change.body` 하나이며 기존 4개 전환 등록 삭제만 반영됐다.
- 적용 전 QSP: `6c450e2199733202907d9c594ddbc3deb77b2d7241b85fed90ab61ccdafe2afb`.
- 적용 후 QSP: `5741733dc95106d367ce0edcaffe3ef55622135762497ff92069600c267a4bd5`.
- 브라우저 전체 검색에서 `1.2.1` 0건 확인. 미체크 보기 회귀 검사 통과.
- 게임 플레이 검증은 사용자가 한다. 실행/전투/지역 방문을 자동 플레이로 확인했다고 보고하지 않는다.
- 계획/해시: [plan.json](resource-audits/2026-10-11/legacy-1.2.1/plan.json), [verification.json](resource-audits/2026-10-11/legacy-1.2.1/verification.json). 외부 폴더의 `journal.json`, `metadata/` 백업, `mods/`, `RESTORE.ps1`을 보존했다.
- 복구: 게임을 종료한 뒤 외부 `RESTORE.ps1` 실행. 현재 이미지·metadata가 기록된 전후 해시와 다르면 중단하고 나중 작업을 덮어쓰지 않는다. 이미지/metadata/기존 전환 mod를 복구하고 새 은퇴 mod는 해시 확인 후 저장소에서 제거한다. 보관 이미지 및 은퇴 mod의 외부 사본은 남긴다.

이전 32개 보관과 합계 142개 **79,852,942바이트 (79.85 MB)**가 플레이 폴더 밖에 있다. 이는 파일 합계 절감량이며 ZIP 압축 절감량은 아니다. 외부 보관 및 metadata/감사 자료를 출시 팩에 포함하지 않는다.
