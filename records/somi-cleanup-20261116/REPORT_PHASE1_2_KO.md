# G:/somi 정리 기록 — 2026-11-16 최종

**1·2차 이동 완료: 45,361파일·51,160,739,257바이트(47.647GiB)**. 1차 34파일·33,998,824,673바이트, 2차 45,327파일·17,161,914,584바이트다. 전체 원본 부재·K 목적지 크기·기존 SHA-256 검증/이동 저널 증거를 대조했다. G 여유 공간은 118,139,269,120바이트에서 169,355,882,496바이트로 **51,216,613,376바이트(47.699GiB) 증가**했다(최종 실측; 동시 디스크 사용량의 영향 포함).

2차는 구 배포 사본 3개와 저장소 밖 옛 백업 73개다. 중단 전 3,569파일의 저널을 대조해 재사용했고 나머지 이동을 완료했다. 이미 검증된 대용량 파일은 재해시하지 않았으며, 이번 최종 검사는 이동 저널의 SHA-256 증거와 파일 메타데이터를 확인했다.

| G에 유지하는 대상 | 위치·근거 |
|---|---|
| 최신 Full·체크섬 | `G:/somi/JO9_2.4.2_Release_20261115/JO9_2.4.2_Kor_Full_20261115.zip` 및 같은 이름의 `.sha256` |
| 최신 누적 패치 | `G:/somi/JO9_2.4.2_Patch2_20261116_Cumulative` |
| 현재 게임·세이브·소스 | `G:/somi/Jack O Nine Tails v2.4_work/game`의 현재 `jack.qsp`, `save`, 설정·수동 원고; `G:/somi/JO9sa`, `G:/somi/JO9O`, `G:/somi/IMGMG` |
| 종류별 최신 복구본 | WORK의 `game/jack.qsp.bak_20261116_trycap`; `G:/somi/JO9_work_backups/private-sex-menu-20261111-ab34a1446634`; `G:/somi/JO9_release_sync_backups/20261019_pregnancy_1792418688138`; `G:/somi/JO9sa/records/bgm-namespace-20261116/before.qsp.gz`, `G:/somi/JO9sa/records/fog-audio-null-crash-20261116/snapshot.before.qsp.gz`; 최신 카탈로그 백업은 `backups.json`의 `latest_keep_by_kind`에 명시 |
| 편집 이력·원그림·활성 도구 | WORK의 `game/modtools/text-workshop/runtime/backups` 15쌍과 원그림·Venice OPFS; `G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab` |
| 기존 보관소·연결 | `G:/somi/Codex_Archive_Stage_20261020` 21.357GiB와 이를 가리키는 C 드라이브 연결 74개 유지. `G:/somi/JO9_cleanup_history_20261020`, `G:/somi/JO9_unused_images` 합계 439,852,399바이트도 이번 축소 범위에서 보존 |

이동 경로는 아래와 같다. **항상 `G:/somi/` 뒤 상대경로를 `files/` 아래 그대로 보존**한다. 개별 파일의 정확한 범위는 각 보관 폴더의 `move-plan.json`과 저널을 따른다.

| 구분 | 원래 경로 → K 보관 경로 |
|---|---|
| 1차 구 ZIP·체크섬, WORK 루트 옛 QSP 백업 | `G:/somi/<상대경로>` → `K:/doing/JO9_trash/2026-11-16_043910_somi_cleanup/files/<상대경로>` |
| 2차 구 배포 사본 3개 | `G:/somi/JO9_2.4.1_Patch_20261105_2차/game`, `G:/somi/JO9_2.4.2_Full_20261113/JO9_2.4.2_Kor_Full`, `G:/somi/JO9_2.4.2_Hotfix_20261114/game` → `K:/doing/JO9_trash/2026-11-16_044758_somi_cleanup/files/` 아래 같은 상대경로 |
| 2차 저장소 밖 옛 백업 73개 | `G:/somi/<상대경로>` → `K:/doing/JO9_trash/2026-11-16_044758_somi_cleanup/files/<상대경로>` |

구 Full 사본은 **43,283파일 전부 경로·크기·CRC32가 r2 ZIP과 일치**했다. 복구용 r2 ZIP은 1차 K 보관소에 있으며 이동 저널의 SHA-256 `0a74ca04f17efb8d7c64025d223327d7ff04c06a844640a6764515c2df3aba39`와 일치한다. 재생성 가능한 대형 진단 복사본은 만들지 않았다.

복원은 완료 저널의 상대경로·크기·SHA-256을 대조한 뒤 `보관소/files/<상대경로>`를 `G:/somi/<상대경로>`로 되돌린다. **G에 같은 경로가 있으면 중단하고 비교하며, 덮어쓰지 않는다.** 과거 `G:/somi/JO9sa/records/hotfix-cumulative-20261115/package.py`는 이동 대상 구 Full 폴더를 `BASE`로 사용하므로, 재실행 전에 보존 r2 ZIP을 별도 복원하거나 `BASE`를 명시적으로 재지정해야 한다.

최종 보호 확인: 비승인 records 96파일·447,455,493바이트, 기존 보관소 2개·439,852,399바이트, 최신 Full/Patch2·복구본·WORK QSP/세이브와 stage 연결 74개를 보존했다. 작업 중단으로 생긴 임시 조각 1개는 완성본 해시를 다시 확인한 뒤 정리했으며, 남은 임시 조각은 0개다. 잘린 마지막 저널 행 예외 0건도 같은 파일에 명시했다.

보관 권고: 최종 보고서·검증 JSON·두 배치 계획/원장·재현 스크립트를 남기고, 재생성 가능한 중복 진단 JSON·시험 복사본은 검토 후 정리할 수 있다. K의 복구 파일·중단 조각, 원그림·원고·세이브는 이 스크립트가 삭제하지 않는다.

자동 승인 검토는 최초 약 52GB 전체 이동안을 **records 안 유일 복구 자료의 손실 위험**으로 거부했다. 이에 범위를 줄여 승인된 1·2차만 처리한다. `G:/somi/JO9sa/records`의 과거 복구본 등 **96파일·447,455,493바이트는 별도 사용자 승인 질문이 미응답이므로 모두 보존**했다.
