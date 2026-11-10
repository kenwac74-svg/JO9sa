# 2.4.1 WORK QSP 스냅샷

- `jack.qsp`는 2026-11-11 거주지·명성 BGM 순차 재생과 이전 도시 설정·사용자 대사·업무·장부 WAV 연결을 포함한 WORK QSP 스냅샷이다. 기존 배포 ZIP과는 구분하며 이번 작업으로 배포물을 다시 만들지 않았다.
- SHA-256: `0b08b2c36923fbc9495bf9de467b09feef26c5b0afd2ce0b7bdb286a6182ad3e`
- 기존 `source/jack_2026-10-01.qsp`와 이미 배포한 ZIP은 비교 기준으로 보존한다.
- 선별 리소스의 위치·해시는 `assets/runtime-source-2.4.1.json`에 기록한다.
- 과거 `mods/`는 변경 이력이며 완성 QSP에 전부 다시 적용하지 않는다.
- 이전 수정: `records/sfx-runtime-fix-20261108/REPORT_KO.md` (채택 전투 효과음5종·몬스터18종 연결; 음원 형식 통일·게임오버 전용 음향·목표 요약 포함).
- Kor_Full은 사용자 수동 패치 설치 대상으로 이번에 수정하지 않았다.

- 신규 인계 시 2.4.1 본편과 최종 r4 이미지는 전달된 리소스에서 설치한다. 런타임 원장의 sourceBundle과 bundlePath로 확인한다. [새 PC 인계](../../../docs/session-handoffs/2026-11-06/NEW_PC_HANDOFF_KO.md).

- 최신 수정: `records/image-reference-20261109/REPORT_KO.md` (글로리아 선택 분기의 이미지 참조를 scene/others/gloria01.png로 변경; 기존 조건 유지).

- 동기화 기록: `records/catalog-sync-20261109/REPORT_KO.md` (체크 기록 복구, 원본 B컷 48개 추가, 최신 WORK 편집 버전과 소스 통일).

-2026-11-10 안정성 수정: 효과음 문자열 변수·외근 가사 중복·하드 증축 환급을 보완했다. 원본과 비교한4개 location·패치11개 edit만 바뀐다. 검증·설치·복구·미확인은 records/claude-stability-fixes-20261110/REPORT_KO.md를 따른다. 개인실 추가 PNG36개는 assets/additional-resources/2026-11-10_private-room.json의 필수 복원 입력이다.

- 2026-11-10 업무·장부 효과음3종을 PCM WAV로 연결했다. 최신 WORK 대사 보존, 원본 MP3 보존, 음원 Git 제외. records/duty-ledger-wav-20261110/REPORT_KO.md 참고.

- 2026-11-11 도시 설정창 진입 시 기존 음악을 유지하며 빈/옛city 선택은 기존 신분·평판·거주지 규칙으로 복구한다. records/city-settings-bgm-20261111/REPORT_KO.md 참고.

- 2026-11-11 거주지·지역명성 BGM 재생목록: records/residence-bgm-20261111/REPORT_KO.md. 로컬 채택 MP3 3곡과 assets/bgm/residence-playlist-20261111.json의 길이/해시 명세가 필요하다. 음원 Git 제외.
