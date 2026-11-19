# JO9 Image Workshop — PIC_TOP_R1 재패키징 및 기준본 검토

작성일: 2026-09-25

## 1. 입력 및 산출물

- 기준 배포본: `JO9_CurrentScreenImageWorkshop_v1.1.2_PATCH_MANAGER.zip`
  - SHA-256: `f3f513ef4712ceb5133e7be4581c18dc6e3cdead491881de7f717fe285b5a0ba`
  - ZIP 항목 수: 24
- 사용자 수정본: `JO9_Place_Workshop_PIC_TOP_v1.zip`
  - SHA-256: `f82376c5525e57f7e9551a811d1db80139b8741347085513021cb1d8764aca89`
  - 내부 파일: `JO9_Place_Workshop_PIC_TOP_v1.html` 1개
- 통합 HTML: `payload/modtools/place/JO9_Place_Workshop.html`
  - SHA-256: `e196e4b403816d7ecb68c793ce2917297263e36c4468ce6caa485c1dbd00214d`
  - 사용자 수정 HTML과 바이트 단위로 동일. 재작성·정리·추가 기능 삽입 없음.
- 재패키징 이름: `JO9_CurrentScreenImageWorkshop_v1.1.2_PATCH_MANAGER_PIC_TOP_R1.zip`

## 2. 확인한 HTML 변경

PIC 폴더 연결 영역이 `workSection` 내부에서 `main` 시작 부분으로 이동했다.
현재 화면 이미지 목록(`screenSection`)보다 먼저 표시된다.
제목은 “JO9의 PIC 폴더 경로를 등록하세요”, 버튼은 “PIC 폴더 등록”으로 바뀌었다.
추가 CSS 블록도 사용자 파일 그대로 보존했다. 사용되지 않는 클래스도 임의 정리하지 않았다.
기존 JavaScript 4개 블록은 모두 동일하며, `connect`와 `folderinfo` ID가 중복되지 않는다.
탭 제목의 v1.0.5 표기도 사용자 수정 HTML에 있던 그대로 유지했다.

## 3. 기존 자동감지 구조 — 실제 첨부 코드 기준

이 도구는 이미 범용 현재화면 이미지 교체기다. 파일명에 Place가 남아 있다고 해서
장소 전용 도구라고 판단하면 안 된다.

- `payload/modtools/JO9_Detect.ps1`, `Invoke-ShowHtml`(305행 이하): 게임의 Show HTML을 호출한다.
- 같은 파일 566–569행: 캡처한 HTML에서 `content/pic/` 이미지 참조를 추출한다.
- 같은 파일 580–601행: 중복을 제거하고 경로·파일명·폴더·용량·해상도 등을 수집한다.
- 같은 파일 620–631행: 자원 목록을 런타임 컨텍스트로 기록한다.
- `payload/modtools/JO9_Server.ps1` 159–182행: `/api/context`, `/api/asset`으로 컨텍스트와 이미지를 제공한다.
- 기존 HTML 310행 이하의 `pollJO9Context`, 253행 이하의 `renderScreenResources`가
  감지 결과를 읽고 현재 화면 목록·선택 목록에 반영한다.
- 필터는 `pic root`, `ui`, `buttons`와 지정 패턴을 기본 숨김으로 하며 “모든 이미지 보기”가 있다.
- 교체는 HTML의 기존 `apply`와 파일 쓰기/백업 루틴을 사용한다.

이 절의 행 번호는 업로드된 **원본 v1.1.2 ZIP 내부 파일** 기준이다.
수정 HTML의 행 번호와 다를 수 있다. 이번 검토는 해당 코드의 정적 확인이며
Windows에서 캡처를 다시 실행한 결과라는 뜻은 아니다.

## 4. SNmod 확장에 필요한 변경 — 이번에는 미구현

사용자는 한 곳의 부동산 상점에만 등장하는 NPC의 기존 구매 완료 장면에
전용 이미지를 연결하고 싶어 한다. 새 성인 장면·대사를 작성하는 작업이 아니라,
기존 이벤트의 이미지 연결을 특정 범위로 제한하는 범용 도구 확장이다.
이 대상은 대화에서 사용자가 설명한 조건이며, 이 ZIP만으로 실제 이벤트 조건을
다시 검증한 것은 아니다.

기존 Show HTML 감지는 그대로 출발점으로 쓸 수 있다. 다만 다음은 추가 구현이 필요하다.

1. 감지 정규식은 현재 `content/pic/`만 대상으로 하므로 `content/pic_SNmod/` 지원이 없다.
2. 서버의 `Safe-Asset-Path`(92–103행)도 `content/pic/` 안으로 제한한다.
   SNmod 루트 지원 시 경로 탈출 방지는 유지해야 한다.
3. 브라우저 `connect()`는 `pic` 폴더 핸들을 연결한다. 별도 형제 폴더 `pic_SNmod`에
   쓰는 권한/저장 경로는 현재 루틴으로 확보되지 않는다.
4. 현재 컨텍스트에 이미지 파일 정보는 있지만 이벤트 ID·분기·장면 슬롯은 없다.
   `place`도 감지기에서 빈 문자열로 기록한다. 이미지 경로만으로 이벤트를 확정하면 안 된다.
5. 이 배포 패키지에는 `jack.qsp`나 `.qsrc`가 없다. 실행 데이터의 이벤트 한정 연결 변경,
   원본/신규 이미지 공존, 복구·실패 처리와 실제 이벤트 재진입 검증은 별도 단계다.

따라서 사용자가 이미지 경로를 수동으로 찾는 절차로 되돌아가지 않는다.
이미 구현된 감지·선택·편집 흐름을 유지한 채, 최종 적용 단계에
“원본 교체”와 “선택 이벤트 전용 이미지 추가”를 분리하는 것이 확장 방향이다.
기존 덮어쓰기와 신규 경로 저장을 혼동하지 않는다.

## 5. 재패키징 변경 목록

기존 24개 파일 중 19개는 바이트 단위로 동일하다. 아래 5개만 변경했다.

- `JANE_QA_REPORT.txt`
- `README_FIRST.txt`
- `payload/install_manifest.json`
- `payload/modtools/VERSION.txt`
- `payload/modtools/place/JO9_Place_Workshop.html`

변경 목적은 HTML 반영, VERSION 구분, 설치 해시 갱신, 읽기 안내 보완,
기존 QA 문서의 역사적 범위 표시다. 기존 JANE_QA_REPORT를 새 검증 결과로 재사용하지 않았다.
추가 문서는 이 검토기록과 `REPACKAGE_QA_REPORT.txt`다.
설치/복구 스크립트, 엔진, 감지/서버/실행 스크립트, 설정/필터, 컨텍스트 초깃값은 동일하다.

## 6. 검증 결과와 제한

- 설치 목록 9개 원본 파일 SHA-256 확인 및 새 manifest 일치.
- 패키지 HTML JavaScript 4개 문법 검사 통과; 원본과 블록별 동일.
- PIC 패널 선행 배치 및 연결 요소 ID 중복 없음.
- 오프라인 Chromium UI 검사 13개 통과, JavaScript 오류 0개.
- 모의 컨텍스트 렌더링, 숨김 필터 전환, 체크 선택, 기존 폴더 연결 핸들러 동작 확인.

브라우저의 HTTP 탐색은 관리자 정책으로 차단되어, 정책을 변경하지 않고
`set_content`와 메모리 내 모의 컨텍스트로 UI를 검사했다.
실제 로컬 서버 통신, Windows Show HTML 캡처, 실제 폴더 쓰기/교체/복구,
Windows 설치기 실행, 게임 내 이벤트 재진입은 검증하지 않았다.
모의 폴더는 빈 폴더로, 이 시험이 실제 게임 이미지의 변환/교체 성공을 뜻하지 않는다.
원본 설치 패키지의 기존 엔진/스크립트 동작을 새로 인증한 것도 아니다.

## 7. 사용 방법

저장 후 게임과 기존 워크샵 창을 닫고 ZIP 내용을 게임 최상위 폴더에 푼다.
`JO9_PATCH_MANAGER.cmd`와 `payload`가 `Jack-o-nine-tails.exe` 옆에 있어야 한다.
패치 관리자의 `1. 패치 설치 / 업데이트`를 선택하고 확인 후 `YES`를 입력한다.
순정 복구를 먼저 실행하지 않는다. 설치기의 기존 호환성 경고/확인 절차는 유지했다.

이번 패키지는 **승인된 PIC_TOP HTML을 반영한 기준본**이며 SNmod 구현본이 아니다.
