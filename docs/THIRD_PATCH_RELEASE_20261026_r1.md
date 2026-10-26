# 2.4 3차 누적 패치 r1 배포 기록

상태: READY_FOR_DISTRIBUTION. 출력: G:/somi/JO9_2.4_ThirdPatch_20261026_r1.

- 승인된 랠리 거절 우선 처리, 범위 밖 기술값의 최고 구간 분류, 정확한 이미지 JSON 두 필드와 기존 URL 호환 PNG 두 개를 포함한다.
- 본체 9 / 인디 6,830 / 개인 148, 합계 6,987개 런타임이다. 개인팩은 PNG 147개와 에게야 JSON 1개다.
- 이미지는 총 6,946경로다. 2차 이후 추가 29경로 중 이번 2경로는 호환 사본이며 새 그림 제작량이 아니다. 기존 카탈로그 코드·체크·진행·원장은 보존하고 이미지 배포 메타데이터 이력만 추가했다.
- 인디팩은 기존과 바이트 동일하여 재다운로드가 필요 없다. 새 개인팩 r1 → 새 본체 r1 순서로 적용한다. 처음 설치할 때는 인디팩을 먼저 적용한다.
- QSP eafdc1a2ffcc3f5806735617c2eec88c79449c9aca0ce1dabee6e78d835a2574. 문법 경계·구조·정확 패치 재생·멱등성, 수정 분기 native 6그룹, 최종 ZIP 조합의 실제 엔진 9경로 PASS. ZIP 전체 CRC와 런타임 SHA, 독립 패키지 감사 PASS.
- 기존 3차 ZIP과 Full, WORK/Full 세이브 167+18개를 보존했다. Full 동기화·커밋·푸시는 하지 않았다.
- GUI 화면·모든 세이브 불러오기·전체 플레이의 검증을 뜻하지 않는다. 기존 보류 기획과 검은 잔상 조사는 이번에 추가하지 않았다.

설치는 출력 폴더의 README_3RD_KO.txt, 플레이어 변경 내역은 CHANGELOG_KO.md를 기준으로 한다. 플레이어 노트는 두 분류의 최종 결과만 포함한다.

근거: records/third-patch-build-20261026-r1/FINAL_RESULT.json, release-validation.json, independent-review.json, PATCH_IMAGE_MANIFEST.json 및 records/third-patch-approved-followups-20261026/.
