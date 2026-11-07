# Jack O Nine Tails v2.4 Kor_Full build plan

Goal: 현재 플레이본의 게임과 작동하는 WORKSHOP을 압축 해제만으로 실행하는 ZIP 제작.

Source: C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex. Destination: C:/MOVE/Jack O Nine Tails v2.4 Kor_Full. ZIP: C:/MOVE/Jack O Nine Tails v2.4 Kor_Full.zip.

- [ ] 현재 QSP/실행파일/런처와 리소스 목록 확정. 새로운 QSP 편집이나 전체 mods 재적용 없이 복사 시점의 플레이본 유지.
- [ ] 백업·개인 세이브·Qgen/QSRC 프로젝트·중복 소스 압축·개인 API 키/설정·작업 이력·임시/시안 폴더 제외. 실제 동적 풀/전환컷/원본 B컷은 유지; 미참조 후보 전체를 삭제하지 않음.
- [ ] 원본 B컷 238개의 외부 junction 참조를 배포 안 실제 파일로 구현. 현재 존재/해시 확인, 누락 시 중단.
- [ ] WORKSHOP 전용 파일·Node 실행기·카탈로그 포함. 런처를 상대 경로로 조정하고 개인 PC 의존성과 포트 충돌 제거. AI 키는 이용자가 입력.
- [ ] 새 staging 디렉터리에 선택 파일만 SHA-256 기록하며 복사. 원본 플레이 폴더 변경 금지. 이미 존재하는 비어 있지 않은 출력은 덮어쓰지 않음.
- [ ] QSP 왕복/버전/필수 DLL/CSS/JSON/전환컷, 패키지 WORKSHOP HTTP 렌더링 검증. 실제 게임 실행·플레이는 사용자가 수행.
- [ ] ZIP64 압축 제작 후 빈 최종 폴더로 추출하며 모든 파일 SHA-256/CRC/목록 일치, 링크·작업 폴더·비밀정보 미포함 확인. 빌드 기록과 도구 수정만 GitHub 기록.

사용자 추가 지시로 WORKSHOP 필수 리소스를 포함하며, 과거 배포 문서의 '모딩툴 제외'보다 이 지시를 우선한다. 게임 본체/대용량 이미지 ZIP은 Git에 넣지 않고 실제 경로·수량·크기·검증 해시를 기록한다.
