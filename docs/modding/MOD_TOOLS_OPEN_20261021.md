# 모드툴 열기 — 2026-10-21 사용자 확정

“모드툴 열어” 또는 “모드툴 모두 열어” 요청에는 이미지 폴더 비교 도구도 포함한다.

| 도구 | 실행 / 현재 주소 |
|---|---|
| 대사 편집기 | 통합 실행기, http://127.0.0.1:3813/ |
| 이미지 리스트/체크리스트 | 같은 서버, http://127.0.0.1:3813/catalog |
| 이미지 워크숍/이미지 편집기 | 통합 실행기가 실제 포트를 확인한다. 이번 실행 http://127.0.0.1:5463/ |
| 인물 편집기 | tools/state-editor/Start-StateEditor.ps1 -Targets tools/state-editor/runtime/targets.json -Port 5284, http://127.0.0.1:5284/ |
| 이미지 폴더 비교·선택 | 통합 실행기에 추가했다. 현재 http://127.0.0.1:11332/ |

통합 실행: tools/local-workspace/Open-Modding-Tools.ps1. 서버만 시작할 때는 -NoBrowser를 사용한다. 일반 실행의 브라우저 URL 목록에도 이미지 비교 URL을 추가했다. 기존 외부 작업 사이트 목록은 유지했다. 인물 편집기는 기존 별도 실행 명령을 함께 사용한다.

MOD_TOOLS_IMAGE_REVIEW_20261021 구간은 image-folder-review/Start-Image-Folder-Review.ps1을 -NoOpen으로 호출하고, 현재 catalog의 folder-review 저장 폴더를 전달한다. 기존 launcher.py가 실제 앱 종류·PID·데이터 폴더를 검사해 실행 중인 서버를 재사용한다. 반환 JSON의 app 및 로컬 URL을 다시 확인해 통합 출력·탭 목록에 추가한다. 포트가 변하면 실제 반환 주소를 사용한다.

부작용은 로컬 서버 시작/재사용과 기존 도구의 런타임 기록뿐이다. 등록한 비교 폴더·체크·이미지·QSP·세이브는 이 변경에서 수정하지 않는다. Python 3.12+, Pillow와 기존 비교 도구 실행기가 필요하다. 이 호출을 제거하면 통합 실행에서 비교 도구만 빠지고, 독립 실행기는 그대로 사용할 수 있다.

이번 확인: 통합 실행의 ImageReview 반환 주소11332, 대사3813, 체크리스트3813/catalog, 워크숍7808, 별도 인물5284 서버 시작. 오른쪽 브라우저의 기존 로컬 탭 관찰은 Browser Use 보안 정책으로 거절되어 우회하지 않았다. 실제 탭이 열렸다고 보고하지 않는다. 커밋·푸시는 보류한다.
추가 확인(2026-10-21): 이미지 편집기는 브라우저 연결이 없으면 시작 30초 뒤 서버가 종료되어 예전 포트 링크가 만료된다. 실행기에서 받은 최신 Workshop URL을 곧바로 오른쪽 브라우저의 새 탭으로 열고 유지해야 한다. 이번에는 실제 화면의 ‘현재 화면 이미지 교체기’ 표시까지 확인했다. ‘모드툴 열어’에서 Mage.space(https://www.mage.space/advanced)와 Hugging Face JoyCaption(https://huggingface.co/spaces/fancyfeast/joy-caption-beta-one)도 생략하지 않는다. 서버 시작만으로 모든 탭을 열었다고 보고하지 않는다.
## 2026-10-24 WORKSHOP_MSAA_CAPTURE_20261024

현재 노예 정보/규칙창 감지 실패를 수정했다. MSAA 메뉴/원문 읽기로 캡처하며, 소스와 WORK 도구 v1.1.3에 반영. 문법·컴파일·실제현재창3회·전체흐름2회·브라우저이미지목록확인PASS. 게임 QSP/세이브/이미지/Full/커밋푸시변경없음. [수정·검증 설명](../../records/workshop-capture-fix-20261024/MANUAL_KO.md).
