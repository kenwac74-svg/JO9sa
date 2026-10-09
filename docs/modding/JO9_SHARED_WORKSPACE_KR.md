# JO9WORK 공통 작업 폴더

현재 공유 위치: `I:\내 드라이브\Moding\JO9WORK`. 이 폴더를 통째로 복사하면 도구와 개인 작업을 다른 Windows PC에서 이어갈 수 있다. GitHub는 도구 소스와 기록 보관에도 사용하지만, 이 묶음 실행에 Git이나 저장소 복제가 필요하지 않다.

## 다른 PC에서 시작

1. 대용량 플레이 게임과 비교용 순정 게임은 사용자가 별도로 준비한다. 순정 비교 폴더는 항상 읽기 전용으로 취급한다.
2. 복사한 `JO9WORK`의 `Restore-JO9.cmd`를 실행하고 플레이·순정 게임 폴더를 선택한다. 개인 적용 이미지, 최신 대사 QSP, 작업 중 자료, 체크리스트와 변경 이력을 함께 복원한다. 기존 플레이 파일은 먼저 백업한다. QSP 없이 이미지·도구 상태만 복원하려면 PowerShell 스크립트 `Restore-JO9-Work.ps1`를 `-IncludeGameCheckpoint` 없이 실행한다.
3. `Start-JO9.cmd`를 실행한다. 대사 편집실·체크리스트·이미지 워크샵을 실행한다. 일반 실행은 게임 이미지나 QSP를 자동 덮어쓰지 않는다.
4. API 키만 새 PC에서 다시 입력한다. 모델 선택은 복원하지만 Windows 보호 저장된 키는 공유 폴더에 포함하지 않는다.

Codex에 포함된 Node.js와 Python을 먼저 사용한다. 해당 런타임이 없는 PC에서는 Node.js 20 이상과 Python이 필요하다. 경로는 PC별 `%LOCALAPPDATA%\JO9WORK\<workspaceId>\local.config.json`에 저장해 공유 폴더의 설정이 다른 PC 경로로 덮이는 일을 막는다.

## 저장 내용

- `tools`, `docs`, `mods`, `resources/new`: 도구와 개인 패치 소스.
- `catalog`: 체크리스트 목록·고정 작업번호·상태·진행·이력·개인 제작 원장. PC 경로는 치환값으로 보관한다.
- `personal-images/content/pic`: 제작 원장의 해시와 일치하는 현재 채택 개인 이미지.
- `working-images/content/modworkpic`, `working-images/content/pic/reserve/jo9mod`: 작업 중 소스·시안·사용자 보관 자료.
- `game-checkpoint/jack.qsp`: 현재 플레이 QSP. 복원 옵션을 명시했을 때만 플레이 게임에 덮어쓴다.
- `game-metadata`, `records`: 원본 B컷 연결 정보, 적용 기록, 컷 변경·대사 변경 이력과 압축한 이전 QSP.
- `preferences`: 모델과 교체기 설정. API 키 없음.
- `manifest.json`, `versions`: 패키지 파일별 SHA256·용량·종류와 저장 시점. 복원 전 해시를 확인한다.

순정·올걸팩·기타 타인의 대용량 이미지 전체, API 키, PC별 설정은 묶음에 들어가지 않는다. 작업폴더로 가져온 개별 참고 이미지와 작업 자료는 개인 작업을 이어가기 위해 보관한다.

## 자동 갱신

공유 실행기는 자동 저장 프로세스를 하나만 실행한다. 체크리스트·대사/QSP·개인 적용 이미지·작업폴더·도구가 바뀌면 파일이 안정된 뒤 공유 폴더를 갱신한다. 바뀌지 않은 이미지와 백업 ZIP은 다시 복사하지 않는다. 실패하면 이전 성공 상태를 유지하고 로컬 runtime의 `shared-sync.json`에 사유를 기록한다. PC를 끄거나 폴더를 수동 복사하기 직전에는 `Save-JO9.cmd`를 한 번 실행하면 최신 저장 완료를 바로 확인할 수 있다. Google Drive의 클라우드 업로드 완료 여부는 Drive 앱에서 확인한다.

공유 폴더에서 관리 파일을 직접 수정했다면 자동 저장은 임의 덮어쓰기 대신 충돌을 표시한다. 동시에 두 PC에서 같은 작업을 편집하지 말고, PC 이전은 이전 PC의 저장과 Drive 업로드가 끝난 뒤 진행한다.

## 실행 경로 정리

공식 소스는 `G:\somi\JO9sa`, 현재 플레이 실행본은 `G:\somi\JO9\game\modtools`이다. 현재 PC의 실제 체크리스트는 `G:\somi\IMGMG` 한 곳에서 편집하며 공유 폴더는 자동 저장된 이전 묶음이다. 옛 `JO9-tools`·`JO9-작업도구`·이전 패키지 사본은 비교 후 `_modding_archive`로 보존했다. 사본에만 있던 기록 23개는 `records/imports/laptop-20261009`에 통합했다.

편집실은 설정된 네 경로와 실제 프로세스·포트가 일치할 때만 재사용하거나 갱신한다. 이미지 워크샵은 등록된 동적 포트를 재사용한다. 이전 도구가 최신 설치본을 덮어쓰는 경우는 버전 검사로 거부한다.
