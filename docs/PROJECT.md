# JO9 프로젝트 — 역할과 진행 기준

이 저장소를 쓰는 모든 채팅은 하나의 업무(Jack-o-nine-tails 한국어판 모딩 배포, 2026-10-03부터 **잭오나 2.4** 제작)를 위한 것이다. 채팅을 시작하면 이 문서를 먼저 읽고, 자기 역할만 한다. 채팅끼리 직접 협업하지 않는다. 필요한 정보는 이 문서와 git 기록으로 주고받는다.

- 갱신: 2026-10-11 (커뮤니티 배포 담당·풀팩/간소화 2.4.0 사용자 결정)
- 기존 관리: 카일(PM, JO9UI패치모드). 2026-10-11 사용자가 Codex에 배포 업무 등록을 직접 지시하여 최신 배포 기준을 갱신했다.
- 사용자는 채팅을 이름으로 부른다. 채팅이 사라지거나 새 PC에서 새 채팅을 열면, 아래 "새 채팅으로 이어받기"대로 같은 이름·역할을 이어받는다.

## 최신 배포 담당과 기준 (2026-10-11 사용자 결정)

- 이 프로젝트의 Codex(아스트라)가 커뮤니티 패치 제작을 주요 업무로 맡는다. 첫 배포 빌드 번호는 **2.4.0**이다.
- **풀팩**은 올걸팩·인디패치·기타 외부 리소스와 게임 본체를 포함해 압축 해제만으로 플레이 가능하게 만든다. **간소화 패치**는 SAnk 작업만 포함하며 외부 패치는 사용자가 별도 설치한다. 두 버전 모두 Codex가 빌드한다.
- 상세 포함 기준·이미지 이름 충돌/전환·확정 대기 목록·출시 검증은 [커뮤니티 배포 2.4.0 기준](COMMUNITY_RELEASE_2_4_0.md)을 따른다. 아래의 PM 전용 빌드/사용자 통압축 제작 역할표와 옛 SNKmod 배포 구분은 이 결정과 충돌하는 범위에서 과거 기록이다. 게임 플레이 검증은 사용자에게 부탁한다.

## 2.4 전환 (결정 18, 2026-10-03)
- UI 패치(SNKmod 별도 폴더 + 설치기)를 끝내고 **잭오나 2.4**로 간다. 배포물은 두 가지다.
  - **2.4 패치**: 2.3 원본에서 바뀌거나 추가된 파일만 담은 덮어쓰기 ZIP. 카일이 만든다(QSP·이미지·기록을 한 곳에서 관리).
  - **통압축 빌드**: 2.3 원본 전체 + 2.4 패치를 합친 완성본. 사용자가 로컬에서 관리하고 Google Drive에 직접 올린다. 카일은 만들지 않는다.
- 모딩 작업(대사·분기 등 QSP 내용)은 지금처럼 집컴·노트북이 한다.
- 재배포: 잭오나는 오픈소스이며 출처만 밝히면 된다. 게임 안 개발자 크레딧에 변경 내역과 출처를 적는다.
  - 2.4 작업자: **SAnk**
  - 올걸팩(ai_girl_pack): **smsfbatalovehandle** 님 작업
- 아직 정할 것: SNKmod 폴더 폐지(이미지를 원본 폴더에 새 이름으로), UI 패치·이미지 교체 패치의 2.4 흡수와 종료, 세이브 호환 범위, 버전 표기.

## 역할

| 이름 | 채팅 | 역할 | 하지 않는 것 |
|---|---|---|---|
| **카일** | JO9UI패치모드 (PM) | 총괄. 히스토리·결정 기록, 작업 지시. UI 이미지와 UI 화면 코드. **2.4 패치** 빌드·검증(QSP 포함). 이미지 교체 패치의 관리(일정·기록). | 게임 실행 점검, 통압축 빌드·업로드(사용자가 함) |
| **집컴 / 노트북** | 로컬 VS Code (homecom / notebook) | 같은 역할의 모딩 도구. 장소만 다르다. 사용자가 플레이하며 지시한 대사·분기 등 QSP 내용 수정을 `mods/*.json`으로 기록해 main에 올린다. 사람 이름으로 부르지 않는다. | 빌드·패키징·배포. 서로 대화하기 |
| **애니** | 실시간모딩 | 자문. 모딩 환경(도구·절차·apply_mods 등)에 문제가 생기면 상담하고 개선을 조언한다. | 직접 모딩 작업, QSP 컨펌 |
| **비비** | 이미지 교체 패치 관리 | 원본 경로를 그대로 덮어쓰는 단순 이미지 ZIP 패킹(QSP 변경 없음). | QSP 수정, UI 패치 빌드 |
| **펜디** | 텍스트편집 | 역할 없음(대기). 편집 도구가 필요해지면 그때 재개한다. | — |

### 로컬 도구의 인수인계 (homecom ↔ notebook)
- 장소를 바꿀 때는 git만으로 이어받는다: main을 pull하고 `docs/modding/context-notes.md`를 읽는다.
- 작업을 끝낼 때는 mods와 context-notes를 커밋·푸시한다. 상대 도구에 메시지를 보내지 않는다.

### 이미지 교체 패치 작업 룰 (2026-10-02 확인)
- 받은 이미지는 원본과 대조하고 `newimgadd` 브랜치 staging에 반영한 뒤 교체 기록(`docs/NEWIMG_REPLACEMENT_LOG.md`)을 남긴다.
- 미배포 ZIP이 6개가 되면 다음 버전(v7…)을 패킹해 사용자에게 보낸다. 기록은 `newimgadd` 브랜치에 남긴다.
- PM은 이 기준을 그대로 인정한다. 묶는 시점이나 기록 방식을 바꿀 때만 PM이 이 문서에 적는다.
- 참고: `whore_redlight` 펠라 장면 mod는 변형을 무작위로 고른다. 변형 1은 원래 경로 `scene/whore_redlight/whore_redlight-112.png`·`-113.png`(순정에 있음, 이미지 패치가 덮어쓸 수 있음), 변형 2는 UI 패치 `SNKmod` 폴더의 `-1121`·`-1131`.

## 두 배포물의 경계

| | UI 패치 (JO9 UI_overhaul_SNKmod) | 이미지 교체 패치 |
|---|---|---|
| 내용 | jack.qsp(UI 화면 코드 + mods), UI 이미지, css·json, 설치기 | 이미지 파일만 |
| 이미지 위치 | `content/pic/SNKmod/` 별도 폴더. 원본 파일과 겹치지 않는다 | 원본 경로에 덮어쓴다 |
| 백업·복구 | 설치기가 원본 보관, RESTORE로 복구 | 없음 (단순 ZIP) |
| 담당 | PM이 빌드·배포 | 이미지 교체 패치 관리가 패킹, PM이 관리 |

- QSP를 바꾸는 일은 모두 UI 패치 쪽에서 한다. 이미지 패치는 QSP를 건드리지 않는다.
- 설치 순서: 이미지 패치 등 다른 패치를 먼저, UI 패치를 맨 마지막에.

## 빌드·배포 흐름 (UI 패치)
1. 로컬 도구가 `mods/*.json`을 main에 올린다.
2. PM이 main을 병합해 빌드한다. mods는 파일 이름 순서로, old가 정해진 횟수만큼 정확히 나올 때만 적용한다(아니면 빌드 중단).
3. PM이 `tools/qsp_verify.py`와 검사로 후보를 확인한다.
4. 사용자가 게임에서 점검한다.
5. 사용자 승인 후 PM이 버전을 올려 패키징한다. 내용이 바뀌면 반드시 버전을 올린다.

## 현재 상태
- UI 패치 최신: 0.14 (`releases/JO9 UI_overhaul_SNKmod_0.14.zip`, JO9UIpatch 브랜치 반영). 장비 툴팁·쿠라 개인 패치·mods 5개 포함.
- PM 작업 브랜치: `claude/sweet-meitner-72rd73`. 최종 저장소: `JO9UIpatch`.
- 할 일 목록: `docs/checklist.md`. 결정 기록: `docs/context-notes.md`.

## 새 채팅으로 이어받기 (다른 PC·새 세션)
대화 기록은 채팅에만 남는다. 이어서 일하는 데 필요한 것은 모두 이 저장소에 있다. 새 채팅을 열면 첫 메시지로 아래처럼 보낸다.

- **카일(PM)**: "너는 카일이다. JO9sa 저장소의 `claude/sweet-meitner-72rd73` 브랜치를 받아 `docs/PROJECT.md`, `docs/context-notes.md`, `docs/checklist.md`를 읽고 PM으로 이어서 해."
  - 결정 기록: `docs/context-notes.md` (결정 1~17과 버전별 기록). 할 일: `docs/checklist.md`.
  - 빌드: `python build/build_package.py --qsp reference/FIX6-jack.qsp --release --vanilla-qsp reference/vanilla-jack.qsp --out dist/<버전>` (버전은 `build/build_package.py`의 `RELEASE_VERSION`). mods는 main을 병합한 뒤 빌드가 자동 적용한다.
  - 검사: `tests/test_installer.py`(PowerShell 필요, Windows PowerShell 5.1 또는 pwsh), 개인실·툴팁·쿠라 `tests/*.cjs`(node 필요), `tests/test_private_room.py`.
  - 배포본: `releases/`. 최종 저장소: `JO9UIpatch` 브랜치. 패키징은 사용자 승인 후.
- **집컴 / 노트북**: VS Code에서 main을 열면 `CLAUDE.md`가 이 문서와 `docs/modding/` 문서를 읽게 한다. 새 PC 준비는 `docs/modding/NEW_PC_KR.md`.
- **애니**: "너는 애니다. main을 받아 `docs/PROJECT.md`와 `docs/modding/` 문서를 읽고 모딩 환경 자문만 해."
- **비비**: "너는 비비다. `newimgadd` 브랜치를 받아 `docs/PROJECT.md`와 `docs/NEWIMG_REPLACEMENT_LOG.md`를 읽고 이미지 교체 패치 일을 이어서 해."
- **펜디**: 필요할 때만. "너는 펜디다. main의 `docs/PROJECT.md`와 `docs/text-workshop/`를 읽어."



## 2026-10-15 확정 폴더와 퇴역 정리

플레이는 G:/somi/Jack O Nine Tails v2.4_work, 배포는 G:/somi/Jack O Nine Tails v2.4 Kor_Full. 구 JO9·JO924와 지난 백업·작업 흔적은 JO9_trash/2026-10-15_cleanup에 이동. 필요한 자료 보존 및 도구 경로 갱신 완료. [조사·보존·이동·복구 기록](SOMI_CLEANUP_20261015.md). 이전 문서의 JO9 플레이 경로보다 이 사용자 결정을 우선한다.
