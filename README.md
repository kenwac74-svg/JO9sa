# JO9sa — UI 패치

작업 브랜치: `JO9UIpatch`  
기준 갱신일: 2026-09-25 (Asia/Seoul)

## 현재 기준은 FIX6

사용자가 이 채팅에 직접 첨부한 `JO9_UI_v1_9_14_AllInOne_R2_FIX6.zip`을 현재 기준으로 확정했습니다. FIX5는 과거 기준이며, 더 이상 FIX5 파일을 다시 요청하지 않습니다.

- 원본 ZIP: 9,073,868 bytes
- SHA-256: `254dc8c5cce2c9f5442f34b6de0cdbb029893eb544c76635d76b8b2e2fc0bc82`
- 내부 파일: 128개 / PNG: 115개
- 설치 대상 117개와 무결성 목록 119개의 실제 SHA-256 일치 확인
- Windows 설치·복구 및 실제 게임 렌더링 시험은 이번 저장 작업에서 하지 않았습니다.

## GitHub 저장 상태

현재 저장된 것은 작업 기준, 첨부 파일의 검증 기록, ZIP 가져오기 스크립트와 워크플로입니다. **FIX6 원본 ZIP과 내부 128개 파일의 GitHub 업로드는 아직 완료되지 않았습니다.** 문서 저장을 원본 저장으로 취급하지 않습니다.

- [작업 인계](docs/UI_PATCH_HANDOFF.md)
- [FIX6 첨부 확인 및 검증 기록](docs/FIX6_RECEIPT.json)
- [원본 ZIP 업로드 위치와 절차](releases/README.md)
- [원본 ZIP을 변경 없이 가져오는 스크립트](tools/import_fix6.py)

## 원본 저장 절차

`JO9UIpatch` 브랜치의 `releases` 폴더에서 **Add file → Upload files**로 원본 FIX6 ZIP 한 개를 업로드합니다. 새로 압축하거나 이름을 바꾸지 않습니다. 이 브랜치의 해당 ZIP 업로드만 대상으로 하는 GitHub Actions가 설정되어 있습니다.

워크플로가 성공하면 원본 ZIP은 `releases/`에 유지되고, 내부 128개 파일은 `packages/JO9_UI_v1_9_14_AllInOne_R2_FIX6/`에 원래 경로와 바이트 그대로 저장됩니다. `docs/FIX6_REPOSITORY_IMPORT.json`과 후속 커밋을 확인해야 실제 저장 완료입니다. Actions의 원격 실행은 아직 검증하지 않았습니다. 설치기나 게임은 실행하지 않습니다.

## 보존 원칙

`main` 및 다른 브랜치를 변경하거나 병합하지 않습니다. SNmod·이미지편집툴 작업은 별도 채팅 범위이며, UI 이미지 참조 카탈로그 확장 작업은 취소 상태입니다. 별도 버튼 ZIP의 24개 이미지를 FIX6에 임의로 합치지 않습니다. 새로운 UI 설계 결정은 하나씩 사용자 확인을 받습니다.
