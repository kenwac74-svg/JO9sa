# 2.4.1 WORK QSP 스냅샷

- `jack.qsp`는 2026-11-08 현재 WORK의 최신 QSP 스냅샷이다. 기존 배포 ZIP과는 구분하며 이번 작업으로 배포물을 다시 만들지 않았다.
- SHA-256: `60f8bc4064b33bf6fbd8d0722a18fb06bdf8918b8e1ec0097717abb71badfefe`
- 기존 `source/jack_2026-10-01.qsp`와 이미 배포한 ZIP은 비교 기준으로 보존한다.
- 선별 리소스의 위치·해시는 `assets/runtime-source-2.4.1.json`에 기록한다.
- 과거 `mods/`는 변경 이력이며 완성 QSP에 전부 다시 적용하지 않는다.
- 최신 수정: `records/sfx-runtime-fix-20261108/REPORT_KO.md` (채택 전투 효과음5종·몬스터18종 연결; 음원 형식 통일·게임오버 전용 음향·목표 요약 포함).
- Kor_Full은 사용자 수동 패치 설치 대상으로 이번에 수정하지 않았다.

- 신규 인계 시 2.4.1 본편과 최종 r4 이미지는 전달된 리소스에서 설치한다. 런타임 원장의 sourceBundle과 bundlePath로 확인한다. [새 PC 인계](../../../docs/session-handoffs/2026-11-06/NEW_PC_HANDOFF_KO.md).
