# 2.4.1 배포 소스 스냅샷

- `jack.qsp`는 현재 WORK와 배포 완료본에 사용된 동일 바이트의 QSP다.
- SHA-256: `6cc7066736cae7fc428d58f89fbf659f06ee6feae8c710d810ee67c99467d505`
- 기존 `source/jack_2026-10-01.qsp`는 패치 전 비교 기준으로 보존한다.
- 최신 CSS·JSON·JS와 선별 이미지의 위치·해시는 `assets/runtime-source-2.4.1.json`에 기록한다.
- 과거 `mods/`는 변경 이력이며, 이 완성 QSP에 전부 다시 적용하면 안 된다.
- 전체 이미지팩과 게임 실행기는 Git 스냅샷이 아니다. 배포 파일 원장은 `records/distribution-cleanup-20261102/BUILD_MANIFEST.json`을 참고한다.
- 이번 동기화는 저장소로만 복사했다. WORK·배포 폴더·개인 세이브를 수정하지 않았다.
