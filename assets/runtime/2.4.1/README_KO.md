# 2.4.1 WORK QSP 스냅샷

- `jack.qsp`는 현재 WORK와 차기 배포 패치 r4에 쓰는 동일 바이트의 QSP다.
- SHA-256: `6ebda9981bf6bc56de46929474de64157969fd324bba8e8be181e002dad1cc7e`
- 기존 `source/jack_2026-10-01.qsp`와 이미 배포한 ZIP은 비교 기준으로 보존한다.
- 선별 리소스의 위치·해시는 `assets/runtime-source-2.4.1.json`에 기록한다.
- 과거 `mods/`는 변경 이력이며 완성 QSP에 전부 다시 적용하지 않는다.
- 최신 수정: `records/donatien-goals-fix-20261105/REPORT_KO.md`.
- Kor_Full은 사용자 수동 패치 설치 대상으로 이번에 수정하지 않았다.

- 신규 인계 시 2.4.1 본편과 최종 r4 이미지는 전달된 리소스에서 설치한다. 런타임 원장의 sourceBundle과 bundlePath로 확인한다. [새 PC 인계](../../../docs/session-handoffs/2026-11-06/NEW_PC_HANDOFF_KO.md).
