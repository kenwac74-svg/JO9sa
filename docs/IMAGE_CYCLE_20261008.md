# 이미지 전환 버튼 (2026-10-08)

사용자 요청: 집 방 전환 아이콘을 큰 이미지 오른쪽 위에 작게 표시하고 툴팁을 `이미지 전환`으로 한다. A→B→C→…→A로 순환하며 이미지별 선택을 다음 방문과 세이브에도 유지한다. 겹친 이미지 중 마지막에 출력된 최상위 이미지에만 적용한다. 이전에 선택한 배경 컷은 캐릭터가 덮여도 보존한다.

## 적용

- 현재 플레이 게임의 `jack.qsp`를 직접 패치했다. QSRC 재빌드는 하지 않았다.
- `mods/2026-10-08_persistent_image_cycle.json`: 37 location의 184개 큰 이미지 출력 문자열을 공통 함수로 감쌌고, 기존 `interior_change` 앞에 이미지 전환 분기를 추가했다. 원래 집 방 전환 본문은 유지했다.
- 첨부 `content/modworkpic/Tsyuansu (2).png`를 그대로 `content/pic/characters/Tsyuansu_2.png`로 복사했다. SHA-256 `3D040C1BC587F4287C28476DA5AEB4C3E5423248BF22BC70CA22B116A8A49668`. A컷 `Tsyuansu.png`는 보존했다.
- 아이콘은 기존 `content/pic/ui/approved_main_v1/tool_room.png`, 표시 크기는 26×26, 버튼 영역은 28×28이다.
- 선택값은 `jo9_cut_choice[정규화한 기본 이미지 경로]`에 저장한다. 이미지 경로별로 별도 선택을 가진다. 새 게임/변수가 없는 기존 세이브는 0번(A)이다.
- 화면 마지막 이미지의 이전 버튼만 제거한다. 배경 자체와 배경 선택은 유지한다. 문자만 출력하는 bg 컨테이너는 레이어를 바꾸지 않는다.
- 클릭은 현재 `$maintxt`의 마지막 해당 이미지 src 속성만 바꾸고 `*clr`, `*p`, `refint`로 갱신한다. `gt`, 장면 재호출, 시간/재화 변경은 없다. 기존 액션은 지우지 않는다.
- 등록된 고정 컷 그룹: Tsyuansu(A/B), Sabrina(A/B), stasis_bank(A/B/C). 랜덤 장면과 `-1/-2` 단계 파일을 고정 변형 그룹으로 합치지 않았다.

## C·D 추가와 등록

기본 파일 `이름.png`, 추가 컷 `이름_2.png`, `이름_3.png`, `이름_4.png`처럼 연속 번호를 사용한다. 파일을 추가한 뒤 고정 컷 목록을 다시 생성해야 한다. 게임 실행 중 디스크를 계속 스캔하는 기능은 아니다. `tools/prepare-image-cycle.cjs`는 bg/characters의 연속 번호를 검사해 등록 변경 후보와 mods 기록을 만든다. 신규 컷 등록은 원본 게임과 기존 상태를 검증하고 별도 패치로 적용해야 한다. 게임에 파일만 넣어도 자동 등록되는 것으로 설명하지 않는다.

## 검증과 한계

- 원본 QSP 읽기/쓰기 바이트 왕복 일치.
- 선언형 패치 치환 횟수 검증, QSP 구조 및 변경 블록 균형 검사 통과.
- 실제 적용 전 해시 `9970DEBA8A7CDBB57F3900E7DD1857638CDF09AD09B5428A7E4BFDBCB97F8F97`, 최종 해시 `DA8FCD789A007D4DADB6EAE8A8F2996042AE548E085071E076A827AB5277DD17`.
- 적용 전 백업: `jack.qsp.bak_20261008_060023`. 내부 문자열 검색 호환 보완 전 백업: `jack.qsp.bak_20261008_060117`.
- 코드상의 레이어 규칙은 bg/large_image 출력 순서이다. 별도의 CSS z-index를 가진 특수 화면이나 이 경로를 거치지 않는 출력까지 자동 지원한다고 주장하지 않는다.
- 실제 Qt 플레이어의 버튼 클릭, 다음 방문, 저장/불러오기는 사용자가 확인해야 한다. 게임은 자동 실행/조작하지 않았다. QSP를 다시 로드한 다음 주안수 화면에서 테스트한다.
- 순정 비교 게임은 변경하지 않았다. 10월 7일 worksink 백업은 이번 QSP 변경 이전 백업이다.

근거 문서: QSP 공식 Functions의 `$MAINTXT`, `$REPLACE`, `$STRFIND`, Statements의 `*CLR`, `REFINT`를 확인했다. https://dev.qsp.org/docs/language/qsp-keywords/qsp-keywords-functions/ 와 https://dev.qsp.org/docs/language/qsp-keywords/qsp-keywords-statements/
