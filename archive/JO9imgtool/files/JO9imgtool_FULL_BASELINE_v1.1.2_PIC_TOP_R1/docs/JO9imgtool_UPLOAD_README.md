# JO9imgtool — 전체 기준본 수동 업로드 안내

대상 저장소: `kenwac74-svg/JO9sa`  
대상 브랜치: `JO9imgtool`  
기준 버전: `v1.1.2 Patch Manager + PIC_TOP_R1`  
작성일: 2026-09-25

## 포함 범위

`JO9_CurrentScreenImageWorkshop_v1.1.2_PATCH_MANAGER_PIC_TOP_R1.zip`에 들어 있던 26개 파일을 모두 포함한다.
기준본 파일의 경로·내용·인코딩·줄바꿈은 변경하지 않았다.
HTML/JavaScript, Show HTML 감지기, 로컬 서버, 실행/설치/검증/복구 스크립트,
설정 및 초기 컨텍스트, 기존 검토 문서와 EXE 두 개를 포함한다.

저장소 관리용으로 아래 3개 파일만 추가했다.

- `.gitattributes`: 이후 로컬 Git 작업에서 기준 파일의 줄바꿈 자동변환을 방지한다.
- `docs/JO9imgtool_UPLOAD_README.md`: 이 문서.
- `docs/JO9imgtool_BASELINE_FILES.json`: 원본 ZIP 정보와 기준 26개 파일의 크기·SHA-256 목록.

따라서 ZIP 전체는 29개 파일이다. 변경분만 들어 있는 패키지가 아니다.
소스 구조를 임의로 `src/`로 이동하지 않았으며 기존 `payload/` 구조를 그대로 사용한다.
이 묶음에는 저장소의 기존 `README.md`나 `docs/JO9imgtool_BASELINE.md`를 덮어쓰는 파일이 없다.
이미 존재하는 `.gitattributes`가 있다면 전체 덮어쓰기 대신 규칙을 대조하여 병합한다.

## 업로드

1. ZIP을 압축 해제한다.
2. GitHub 저장소에서 `JO9imgtool` 브랜치를 선택하고 저장소 최상위로 이동한다.
3. `Add file` → `Upload files`를 선택한다.
4. 압축을 푼 폴더 **안의 내용 전체**를 드래그한다. `payload`, `docs`, 루트 파일 및
   `.gitattributes`를 포함한다. ZIP 자체나 압축을 푼 바깥 폴더를 통째로 올리지 않는다.
5. 업로드 목록에서 `payload/modtools/place/JO9_Place_Workshop.html` 등의 경로를 확인한다.
6. 저장 대상이 `JO9imgtool`인지 확인하고 커밋한다. `main`이나 `JO9UIpatch`에는 올리지 않는다.

커밋 메시지 예시:

```text
Import complete image workshop baseline v1.1.2 PIC_TOP_R1
```

GitHub 공식 문서는 파일 또는 폴더의 드래그 업로드를 안내한다.
웹 업로드에서는 `.gitattributes` 규칙이 적용되지 않는다.
이번 파일은 이미 기준본의 실제 바이트로 저장했으므로, 편집기에 붙여넣거나
인코딩을 바꿔 저장하지 말고 압축 해제된 파일을 그대로 업로드한다.
`.gitattributes`는 이후 Git 클론·체크아웃·커밋 시 줄바꿈 보존을 위한 설정이다.

참고:
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://git-scm.com/docs/gitattributes

## 기준본 검증

- 원본 ZIP SHA-256: `bc6ca3f27e38cc8f965cd91113cd2f88c488ed1fb8ae58249e8c7a4bfaa18831`
- 원본 ZIP CRC 검사: 통과.
- 기준 파일 26개: 재출력 후 원본과 바이트 단위 동일.
- `payload/install_manifest.json`의 9개 파일: SHA-256 일치.
- 통합 HTML: 사용자가 제공한 `JO9_Place_Workshop_PIC_TOP_v1.zip`의 HTML과 바이트 단위 동일.
- 출력 ZIP에는 불필요한 상위 폴더와 `.git` 디렉터리가 없다.

이번 검증은 파일 보존 및 설치 목록 일치 확인이다.
기존 QA 문서의 과거 검사 결과를 이번에 다시 실행했다고 해석하면 안 된다.
Windows 설치기·Show HTML 캡처·실제 게임·이미지 교체/복구는 이번 출력 작업에서 실행하지 않았다.

## 포함되지 않는 것

이 자료는 **제공된 이미지편집툴 기준 패키지 전체**이며, 게임 엔진 전체 개발 소스가 아니다.
`payload/jack.exe`와 `payload/original_jack.exe`는 바이너리로 포함된다.
이 두 EXE를 다시 빌드할 원본 소스 및 게임 `jack.qsp`·`.qsrc`는 제공된 기준 패키지에 없다.
이미지·세이브·게임 본체를 추가로 끼워 넣지 않았다.

SNmod 이벤트별 고유 이미지 연결 기능은 아직 구현되지 않았다.
기존 감지·선택·편집·백업·교체 동작과 승인된 PIC_TOP 배치를 유지한 출발점이다.

## 이후 수정 원칙

이미지편집툴 변경은 `JO9imgtool`에서 관리한다.
매니페스트 대상 파일을 수정해 배포할 때는 `payload/install_manifest.json`의 해시도 갱신한다.
이 문서와 해시 목록은 현재 기준본의 기록이므로, 이후 기능 변경 시 새 기준과 검증 기록을 남긴다.
