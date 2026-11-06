# 누적 패치 확인 — 2026-11-06

사용자 원칙: 모든 정식 패치는 이전 1차부터 최신까지 누적 병합한다.

현재 대상: JO9_2.4.1_Patch_20261105_r4.zip. 설치 기준: 2026-11-02 배포 2.4.1 본편.

- 11월 5일 최초 추가 패치의 런타임 942경로를 r4 PATCH_MANIFEST.json과 비교: 누락 0. QSP 1개만 후속 도나시앵 복귀 수정으로 변경되었고, 나머지 941경로 해시 동일.
- r4 전체 런타임 1,967파일: QSP 1, PNG 808, 전체 JSON 1,158. 엘사 전신 추가 포함.
- 역사적 10월 20일 알파 1차 r3는 QSP/CSS 2파일이며 이미지·JSON은 없었다. 현재 QSP에 당시 수정 대상 54개 location과 추가 helper/호환 location 3개가 모두 남아 있다. 후속 교체 5표식은 dealer_economy, colosseum_prize_single_page, champion_liberation_result로 추적된다. CSS는 11월 2일 2.4.1 본편과 현재 WORK가 동일하므로 본편이 공급한다.
- 최신 QSP SHA-256: 6ebda9981bf6bc56de46929474de64157969fd324bba8e8be181e002dad1cc7e.
- r4 ZIP SHA-256: 97bea1265012a50823f3a635d7fe16054c56984ddc6d3e528892a2f4c113f74c.

확인 범위는 목록·매니페스트 해시 대조 및 1차 변경 계보이다. 이번 확인으로 ZIP/QSP/이미지/JSON/Full/세이브는 변경하지 않았으며 엔진·EXE 플레이 검사는 반복하지 않았다.

근거: records/release-patch-20261105/package-files.json, records/first-patch-r3-20261020/artifact.json, records/distribution-cleanup-20261102/BUILD_MANIFEST.json, r4 ZIP PATCH_MANIFEST.json, 현재 WORK QSP/CSS.