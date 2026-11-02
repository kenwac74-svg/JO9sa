# 전투 효과 중 구형 프레임 노출 — 엔진 읽기 전용 조사

## 확인된 엔진 계열

현재 WORK `engine/jack.exe`는 246,784바이트, SHA-256 `f75032d79ecb58eeb7b969cd3f774d66b091fca38a360acdabd782e03a46c6e6`다. 순정 보관본 JO9O는 246,272바이트, `fc70f16821a7827ffeb95a6b77eb55b5bf0bc05e4d761c459eb6e8e29affbecc`다.

두 파일을 직접 대조하면 현재 파일은 기존 `.jpatch`를 512바이트 확장했고, 추가부에 `WORKSHOP`, `1autosave()`, `/../modtools/JO9_Launch.cmd`가 있다. 코드 차이는 두 호출/문자열 지점과 해당 섹션 메타데이터다. 과거 `branch-review-20261011/045.md`의 Image Workshop 바이너리 연결 구조와 일치하는 계열이다.

현재 엔진을 과거의 repaint-fixed 엔진이라고 부를 수 없다. 로컬 과거 재도색 패치 실물은 265,216바이트, SHA-256 `ea8aece6eb0e2dc65e094c2f5a716f686711ca337c1e4061f7342fd17759818a`다.

## 과거 재도색 수정과 현재의 차이

과거 `jo9-v1911/.../TECHNICAL/build_engine.py`와 NOTES는 `QGraphicsView::FullViewportUpdate` 강제를 목적으로 한다. 생성자 RVA `0x20A4`(파일 오프셋 5,284)의 6바이트 CALL을 새 trampoline로 바꾼다. 원래 ECX와 setUpdatesEnabled 인수·복귀를 보존하면서 `setViewportUpdateMode(0)`를 호출하고 원래 함수로 돌아간다. `.jprdata`·`.jprcode`와 Qt import/재배치 데이터를 추가한다.

현재 f750의 이 지점은 순정과 같은 `ff 15 f0 65 42 00` 호출이다. 과거 수정본의 새 상대 CALL이 아니며, `.jprdata`·`.jprcode`도 없고 `setViewportUpdateMode` import도 없다. 따라서 적어도 이 검증된 과거 FullViewportUpdate 수정은 현재 파일에 적용돼 있지 않다.

과거 도구 경로:

- `C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/jo9-v1911/JO9_UI_v1_9_11_RepaintTest/TECHNICAL/build_engine.py`
- 같은 폴더 `NOTES.txt`.
- `.../jo9-v1911/engine.patch.json` — 입력 fc70f, 출력 ea8a로 잠긴 과거 delta.
- `.../jo9-all1914/JO9_UI_v1_9_14_AllInOne/payload/engine/jack.exe` — 과거 수정본 실물.

기존 빌더는 퇴역 경로 `G:/somi/JO9/game/engine/jack.exe`를 입력으로 읽는 역사적 코드다. 이번에는 읽기만 했으며 실행하거나 새 엔진을 만들지 않았다.

## Qt 호환성과 향후 검토 범위

현재 Qt5Widgets.dll은 5.4.2.0이며 SHA-256 `e8e4cf3b718964723395d93663b14cc3f944301a76b7abd843cd73b2a19ecc1d`다. 옛 repaint manifest의 필수 DLL 해시와 같다. 정확한 x86 setter export `?setViewportUpdateMode@QGraphicsView@@QAEXW4ViewportUpdateMode@1@@Z`도 실제 export 테이블에서 확인했다.

현재 바이너리는 기존 hook 바이트·추가 섹션 헤더 공간·파일 끝 정렬·ASLR 등 정적 전제가 남아 있다. 향후 별도 승인 작업에서 f750을 입력으로 새 hash-locked delta를 검토할 근거는 있다. 그러나 옛 fc70f→ea8a delta나 옛 실행 파일을 그대로 덮으면 현재 Workshop 기능을 잃을 수 있다. 기존 custom 엔진 보존 지침에 따라 교체하지 않는다. 정적 전제 확인은 새 패치의 실행 안정성 검증이 아니다.

## 이번 증상과의 관계

공개 engine-base 고정 소스 `9bb0276.../gui/fastqspwindow.cpp`를 읽어 QGraphicsScene/QGraphicsView/QGraphicsWebView 생성(32·33·39행), HTML 갱신(663행), fitInView 배율 조절(858행)을 확인했다. 같은 소스에서 viewport update mode를 지정하는 호출은 찾지 못했다. 소스와 설치 바이너리가 완전히 같은 빌드라고 단정하지 않는다.

'타격 효과 동안만 과거 프레임 전체가 노출됐다가 효과가 끝나면 사라진다'는 제보는 QGraphicsView/WebKit의 일시적인 합성·dirty-region·배경 다시 그리기 문제와 부합한다. 다만 이번에 FullViewportUpdate A/B 실행을 하지 않았으므로 특정 내부 원인이나 엔진 패치의 해결 효과를 확정하지 않는다. DOM 좌표와 버튼 hit-test PASS는 실제 페인트 결과의 증거가 아니다.

이번 범위에서는 운영 엔진을 유지하고 CSS의 animation/opacity/transform 합성 유발 요소를 피한 표시 수명 방식의 실제 픽셀 결과를 확인한다. 전역 엔진 repaint 개선은 별도 검토로 남긴다.

엔진 다운로드·교체·컴파일·패치 파일 생성·게임 프로세스 중단·운영 파일 쓰기는 모두 0건이다. 재현 조회는 같은 폴더 engine-repaint-readonly.cjs, 기계 근거는 engine-repaint-readonly.json이다.
