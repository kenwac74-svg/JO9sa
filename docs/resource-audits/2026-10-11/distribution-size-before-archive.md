# JO9 배포 용량 계산 — 2026-10-11

게임 폴더: `G:/somi/JO9`. 게임 파일은 수정하거나 제거하지 않았다. GB는 10억 바이트이며 압축 수치는 ZIP DEFLATE-6 스트림을 실제 계산한 결과다.

| 구성 | 파일 수 | 파일 합계 GB | ZIP GB | Windows ZIP GiB |
|---|---:|---:|---:|---:|
| all_patches_keep_HOLD | 32,982 | 12.557 | 12.126 | 11.294 |
| all_patches_remaining_candidates_excluded_projection | 32,557 | 12.440 | 12.010 | 11.185 |
| all_patches_all_unprotected_candidates_excluded_UNSAFE_BOUND | 27,999 | 10.332 | 9.908 | 9.228 |
| original_plus_own_keep_HOLD | 19,355 | 7.686 | 7.281 | 6.781 |
| original_plus_own_remaining_candidates_excluded_projection | 18,937 | 7.581 | 7.177 | 6.684 |
| original_plus_own_all_unprotected_candidates_excluded_UNSAFE_BOUND | 17,147 | 7.192 | 6.795 | 6.328 |
| own_patch_only_keep_HOLD | 1,025 | 0.197 | 0.173 | 0.161 |
| own_patch_only_remaining_candidates_excluded_projection | 1,025 | 0.197 | 0.173 | 0.161 |

## 후보와 보호
{
  "protected": {
    "files": 348,
    "bytes": 81701644
  },
  "dynamic-HOLD": {
    "files": 4558,
    "bytes": 2107633826
  },
  "remaining-HOLD": {
    "files": 425,
    "bytes": 117596912
  }
}

MOVE_READY = 0. 미참조 후보가 모두 불필요하다고 확인한 것이 아니다. indpack·엔진 동적 호출 계열은 HOLD로 유지했다. 후보 제외 시나리오는 용량 비교용 가정이며 삭제 목록이 아니다.

원본 B컷 242개, 총 164,483,769바이트를 독립 배포 경로에 포함했다. 원본과 바이트가 같은 재배치 자원 109개도 여성·남성 또는 패치 구분 없이 현재 장면전환 연결을 보존하도록 포함했다.

## 한계
- GB is decimal 1,000,000,000 bytes; Windows GiB is separately listed.
- KEEP-HOLD rows are conservative resource payload sizes. Candidate-excluded rows are conditional projections, not approved deletion manifests.
- Pure variant means original JO9O runtime plus current verified personal output, current QSP/CSS/fonts/menu, original B copies and SHA256-verified relocated original resources.
- Pure resource payload is not a completed tested build; current QSP/engine/custom scripts may need third-party integration cleanup. No play test performed.
- Original files are those currently in JO9O; the original directory contains historical UI changes. This is not a reconstructed clean vendor archive.
- Six personal image record hash mismatches are omitted as unproven current personal output; UI menu has been explicitly included as current user UI definition.
- One existing malformed slave JSON (211.json) cannot be parsed; related dynamic image families remain HOLD.
- Runtime modtools can dynamically load extra QSP/plugin configuration and save files; no per-file deletion safety is claimed.
- No executable, QSP, image, installed tool, config, catalog or original file changed. Only local audit outputs were created.

PASS: sizes and timestamps for 51,146 measured inputs unchanged; QSP and original-B manifest hashes unchanged
