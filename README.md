# JO9sa — UI 패치 (SNKmod 분리형)

상태 기록일: 2026-09-25 (Asia/Seoul)

## 현재 상태

| 구분 | 상태 |
|---|---|
| FIX6 원본 ZIP | `baseline/`에 저장 (SHA-256 `254dc8c5…bc82`) |
| SNKmod R1 패키지 | `releases/JO9_UI_v1_9_14_SNKmod_R1.zip` 빌드 완료 |
| 가짜 게임 폴더 시험 | `tests/test_installer.py` 30/30 통과 (Linux, PowerShell 7) |
| Windows 실행·인게임 표시 | **미검증** |

## 구조

- UI 이미지: `game/SNKmod/content/pic/`에 넣고, jack.qsp·base.css의 참조를 SNKmod로 돌린다. 원본 이미지는 건드리지 않는다.
- 이미지 외 파일(jack.qsp, css/base.css, 조건부 engine/jack.exe): 원본 경로에 덮어쓰고, 설치 전 원본을 보관해 복구한다.
- QSP를 고치는 다른 모드와는 호환되지 않는다. 이미지 교체 모드만 호환성을 점검한다.

## 문서

- [작업 결정과 근거](docs/context-notes.md) · [체크리스트](docs/checklist.md)
- [FIX6 이미지 참조 맵](docs/FIX6_REFERENCE_MAP.md) · [수용 테스트 결과](docs/ACCEPTANCE_RESULTS.md)
- [이전 인계 기록](docs/UI_PATCH_HANDOFF.md)

## 빌드와 시험

```
python build/build_package.py --qsp <FIX6 설치 상태 jack.qsp>
python tests/test_installer.py --qsp <같은 jack.qsp> --pwsh <pwsh 경로>
```
