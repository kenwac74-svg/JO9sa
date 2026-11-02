# 2.4.1 설명문 출처·흡수표

공개 파일: `JO9_2.4.1_업데이트안내.html`. 이 문서는 편집·검토용이며 공개 HTML에 포함하지 않는다.

## 버전 구분

2.4.0은 최초 2.4 배포에 더해 1차 r3, 2차 최종 r4, 3차 r1의 확정 누적 내용을 2.3 대비로 정리했다. 현재 표시 명칭과 최종 반영 규칙을 사용했다. 2.4.1은 이후 전투 연출·결과·이미지·진행의 변경을 소개한다.

아그라바 특수 재고는 사용자의 최종 지시에 따라 주요 업데이트·홍보 이미지에서 제외하고 `그외 변경`의 개발 중 항목으로 옮겼다.

## 2.4.0 원문

- `G:/somi/JO9sa/docs/release/2026-10-19/CHANGELOG_KO.md`: 2.3 → 최초 2.4의 전 범위.
- `G:/somi/JO9sa/records/first-patch-r3-20261020/CHANGELOG_KO.md`: 개인실 한도·공용업무·교육·대사·전투 특성 후속.
- `G:/somi/JO9sa/docs/release/2026-10-19/first-patch-manual-r2/CHANGELOG_KO.md`: 앞선 r2의 원고·출발·설명 정정.
- `G:/somi/JO9sa/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md`: 인물 등록, 대화·화자·장비 툴팁, 개인실·그림·명칭 정비의 확정 적용 부분.
- `G:/somi/JO9sa/docs/THIRD_PATCH_RELEASE_NOTES_20261026_KO.md`, `THIRD_PATCH_RELEASE_20261026_r1.md`: 자금 위기·판매 평가·소문·행동력·체질·특성 통합·에센스·전체보기·발견 알림·개인 명성·금화 표시와 누적 버그 수정.
- `G:/somi/JO9sa/records/third-patch-prebuild-20261026/INTERNAL_CHANGELOG_20261026_KO.md`: 효과·생산 보완 및 최종 명칭 대조.

### 누적 원문 흡수

| 원문 범위 | 공개 원고 위치 |
|---|---|
| 최초 2.4 동료 선출전·교대·패배 | 누적 ‘전투와 동료 출전’ |
| 신규 특성·체질·전투 성향·희귀 가치 | 누적 ‘특성과 육성’, ‘거래와 경영’ |
| 대사 조합·인상 페이지·인물 평가 | 누적 ‘대화와 관계’ |
| 장소·NPC·평판·상품·의뢰 설명 | 누적 ‘세계와 안내’ |
| 개인실·식단·크라이오·공용업무 | 누적 ‘개인실과 보관’, 누적 생활·교육 버그 |
| 등급·임신·괴물 아이콘·장비·편집기·미술 교사 | 누적 ‘화면과 그림’, 누적 표시 버그 |
| 원본·추가 컷·선택 유지·UI 감상·연속 장면 | 누적 ‘화면과 그림’ |
| 가격·누락 결제·구매 확인·암시장 | 누적 생활·상점 버그와 ‘거래와 경영’ |
| 생성·친족·고유 인물·첫 만남·재구매·단계 역행·로드 | 누적 ‘인물·이벤트·기존 진행’ 버그 |
| 1차 r3의 교육·후속·복귀·구 진입점·고용 파트너 | 누적 ‘교육·활동·전투 진행’ 버그 |
| 1차 r3의 주거별 한도·일반 이사 유지·공용업무 | 누적 ‘개인실과 보관’ |
| 2차의 인물 번호 충돌·등록·출신·대사·이미지 | 누적 인물 버그·대화·세계·그림 |
| 3차의 신규 항목 전부 | 누적 전투·특성·거래·개인실·화면의 7분야 |
| 3차의 버그 항목 전부 | 누적 버그 4분야와 해당 기능의 업데이트 설명 |

독립 검토에서 최초 누적 원문을 54개 개념 항목으로 분해해 대조했고, 버그 항목을 별도 절로 이동하고 중복을 합쳐 업데이트 48항목과 누적 버그 20항목에 반영했다. 정확한 수치·확률·고유 조건, 당시 계획과 보류·폐기된 기능은 공개하지 않았다.

## 2.4.1 주요 근거

모두 `G:/somi/JO9sa/records/` 아래의 적용 기록이다.

- `battle-ui-test-v01-20261027/MANUAL_KO.md`, `battle-followup-20261028/MANUAL_KO.md`, `battle-fate-choice-20261028/MANUAL_KO.md`: 전투 배치·피해 유형 효과·결과 선택.
- `mob-battle-assets-20261029/REPORT_KO.md`, `arena-combat-redraw-adopted-20261030/REPORT_KO.md`, `catfight-combat-adopted-20261030/REPORT_KO.md`, `quest-combat-adopted-20261030/REPORT_KO.md`: 전투·패배 이미지.
- `catfight-fate-20261030/MANUAL_KO.md`, `colosseum-sparring-fate-20261031/MANUAL_KO.md`, `colosseum-prize-single-page-20261101/MANUAL_KO.md`, `catfight-prize-page-20261031/MANUAL_KO.md`: 경기 결과·대련·상금 한 화면.
- `isabella-tavern-adoption-20261101/REPORT_KO.md`, `isabella-recruitment-overlay-20261031/REPORT_KO.md`, `egeya-gladius-20261029/REPORT_KO.md`: 인물 외형·거래 화면·무기 문구.
- `group-defeat-single-cut-20261101/MANUAL_KO.md`, `catfight-image-leak-20261101/REPORT_KO.md`, `mob-weapon-message-fix-20261030/REPORT_KO.md`, `special-weapon-icons-20261031/MANUAL_KO.md`, `spawn-stage-image-fix-20261030/REPORT_KO.md`, `catfight-current-name-20261031/MANUAL_KO.md`: 전투 표시·결과 잔류·현재 인물.
- `auction-consignment-fix-20261028/REPORT_KO.md`, `revelio-new-traits-20261028/REPORT_KO.md`, `room2-ego-growth-20261101/REPORT_KO.md`, `bug-batch-20261028/REPORT_KO.md`: 위탁 반환·특성 표시·개인실 성장·인물 연결.
- `fog-meat-accounting-fix-20261030/REPORT_KO.md`, `agrabah-fruit-menu-fix-20261030/REPORT_KO.md`, `reference-panel-spacing-20261101/REPORT_KO.md`, `wong-guild-dialogue-fix-20261030/MANUAL_KO.md`: 회계·비활성 메뉴 안내·정보창·일일 안내.
- `agrabah-special-food-20261030/REPORT_KO.md`: 사용자 지시로 개발 중 항목에 분류한 과일·와인 소형 구매·특수 재고.
- 10/28 제보 수정·소문 후속·카오틱 에센스 대상 범위의 승인/적용 기록: 구매자 추천과 특성 관리 후속의 근거.

## 제작환경 및 범위

편집 도구의 변경은 `image-cut-conditions-20261101`, `work-adoption-manual-20261101`, `cut-condition-extremes-20261101`, `db-bg-catalog-dedup-20261101` 기록으로 확인했다. 게임 동봉 기능이라고 설명하지 않았다.

문서만 제작했다. Full 동기화·배포 ZIP·커밋·푸시는 하지 않았다. 미해결 제보를 고쳤다고 쓰거나 모든 플레이·세이브 호환이 검증됐다고 주장하지 않았다. 설치기·CMD 필수 안내도 넣지 않았다.

## 그림과 용량

현재 WORK의 도시 배경·오우거 전투·캣파이트 일러스트를 축소·WebP 압축해 HTML 내부에 내장했다. 원본 파일은 바꾸지 않았다. 원본 경로·SHA와 실제 내장 크기는 `build-report.json`에 기록했다.

## 최종 검수

`verification.json`은 실제 오프라인 file://의 별도 headless Edge 검사 결과다. 원고와 콘텐츠 범위는 독립 검토를 받았고, PC와 390/360px 모바일·그림·목차·전체 펼치기·키보드 조작·외부 요청 없음·원본 보존을 확인했다. 저장된 미리보기는 별도로 육안 확인했다.
