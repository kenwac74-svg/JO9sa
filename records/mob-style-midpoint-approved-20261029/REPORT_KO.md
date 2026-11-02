# 승인된 중간 화풍 두 장 반영 — 2026-10-29

사용자 “나머지는 승인한다”에 따라 v3 대표시안 중 안개숲 전투 배경과 검은 의사 무리 패배컷 두 장만 WORK에 적용했다. 고블린·식인종·미치광이·와그의 새 수정시안은 이 작업에서 적용하지 않았다.

두 PNG는795×596을 유지한다. 기존 파일 두 장은 G:/somi/JO9_work_backups/mob-style-midpoint-approved-20261029/original에 보존했다. WORK/resources/new/개인 이미지패치 원장에 같은 최종 해시를 기록했다. 카탈로그 D의 두 행 bytes/dims와 검은 의사 단체 패배 슬롯의 해시·bytes·workLabel만 갱신했다. 기존 체크 플래그·다른 MOB 슬롯·다른 단체 정의는 독립 비교로 보존 확인했다. canonical group-sets.json도 최종 embedded 정의와 일치한다.

PIL 실제 PNG decode, 형식·크기·최종/백업 해시·카탈로그 비교 PASS. QSP는ea9a02151917f6ddf416553c0b409862b47efcd877937c515cecd502a5b922b3로 불변이다. QSP나 코드 변경이 없어 새 문법/엔진 실행 검사는 하지 않았으며 전체 플레이 검증으로 표현하지 않는다. 기존 세이브·배포 폴더는 쓰지 않았고 ZIP·커밋·푸시는 하지 않았다. portable seed export는 부모 작업에서 최종 카탈로그를 기준으로 진행한다.

재현·복구 근거: install.cjs, installation.json, verification.json. 복구 시 현재 파일이 installation의after 해시와 일치하는지 먼저 확인하고, original의before bytes와 카탈로그/원장의 일관성을 함께 복구해야 한다. PNG만 과거 것으로 바꾸면 원장과 hash 표시가 달라진다.
