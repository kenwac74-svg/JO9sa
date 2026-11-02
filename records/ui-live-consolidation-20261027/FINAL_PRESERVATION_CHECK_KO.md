# 최종 보존 점검

판정: PASS. 운영·이미지·원본 세이브·배포 폴더 쓰기 0건. 보고서와 조회 스크립트만 기록했다.

- 원본 SAV 98개 중 98개가 최초 스냅샷과 크기·전체 SHA-256이 같다. 해시 중 크기/mtime가 바뀐 파일도 없어야 PASS다.
- 보호된 이미지 인덱스 하위 트리 5곳 중 5곳이 스냅샷과 일치했다. 이미지 19163개의 상대 경로·크기·정수 나노초 mtime를 비교했다.
  - content/pic/girls/normal_scenes: PASS, 스냅샷 2952 / 현재 2952, 추가 0, 누락 0, 메타데이터 변경 0.
  - content/pic/girls/reward_scenes: PASS, 스냅샷 3 / 현재 3, 추가 0, 누락 0, 메타데이터 변경 0.
  - content/pic/girls/sex_scenes: PASS, 스냅샷 13835 / 현재 13835, 추가 0, 누락 0, 메타데이터 변경 0.
  - content/pic/girls/torture_scenes: PASS, 스냅샷 1262 / 현재 1262, 추가 0, 누락 0, 메타데이터 변경 0.
  - content/pic/scene: PASS, 스냅샷 1111 / 현재 1111, 추가 0, 누락 0, 메타데이터 변경 0.

prune-snapshot의 images는 지정된 이미지 확장자만 기록한다. 비이미지 파일 전체의 보존이나 이미지 바이트 동일성을 추가로 증명했다고 말하지 않는다. 이미지 전체 재해시는 수행하지 않았다. 링크/정션을 따라가거나 원본·배포 폴더를 수정하지 않았다. 실제 UI 클릭 검증과 별개의 보존 검사다.

재현: `py -3.14 final-preservation-check.py`. 기계 판정은 같은 폴더 `final-preservation-check.json`.
