# 시루1448 도미나 호환 PNG 임시 복구 — 2026-11-11

사용자 승인: 현재 그림을 옛 경로에 복구하고 나중에 마이그레이션에서 정리한다.

- 현재 WORK content/pic/girls/full/mistress/1448_shiru.png를 content/pic/girls/full/mistress/1448_white_long_young.png에 바이트 복사했다. 795×596, 456,692bytes, SHA-256 2ce40cc4a268eef76d0d60cb1b7774c002c86e0d1be4e8850d871c95d1d2f624.
- 추적 소스의 옛 PNG도 같은 그림으로 맞추고 호환 원장 해당1쌍과 runtime 원장 해당1항목만 갱신했다. 이전 원본/원장은 G:/somi/JO9_work_backups/shiru-domina-alias-20261111-0369e83b에 압축 보존했고 왕복 확인했다. 현재 PNG·인물JSON·QSP·카탈로그/체크상태는 유지했다. 새 그림 제작은0개다.
- D21의 imageCleanupCandidates에 옛/현재 주소와 검증 후 정리 조건을 등록했다. 모든 수정 완료 후 2.4.2 Full 배포 직전 세이브 참조·화면 캐시 이관을 검증한 뒤 옛 PNG와 원장을 함께 정리한다. 다른6쌍의 보존 결정은 이번에 바꾸지 않았다. 현재 마이그레이션 구현·세이브 변환 없음.
- verification.json과 restore.cjs에 고정 입력·변경 전후·보호 파일 해시·범위를 기록했다. 스크립트는 이번 승인 입력용이며 현재 이미 복구된 파일에 재실행하지 않는다.
- 파일 동일성/PNG 치수와 관련 JSON·비대상 보존을 확인했다. 전체 엔진 검사는 AGENTS.md28의 리소스 수정 최소 검사에 따라 생략했다. 실제 화면은 사용자 EXE 재시작 후 옛 세이브 시루 도미나 복장에서 확인한다. Full·음원·커밋·푸시 변경 없음.

최종 확인: Pillow로 현재/호환 PNG2개 전체 디코딩 통과(795×596 RGBA), 쓰기 대상8경로의 출력 해시와 보호9경로 해시 대조 통과.
