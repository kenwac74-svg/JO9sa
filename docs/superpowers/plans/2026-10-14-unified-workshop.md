# SHOW HTML 기반 통합 WORKSHOP 구현 계획

사용자 승인: 2026-10-14 `제작해봐 ... IMAGE WORKSHOP 대신 WORKSHOP ... 2.4.0.0`.

목표: 기존 QSP 저장 동작을 유지하며 이미지와 대사가 동일한 실제 SHOW HTML 스냅샷을 사용하고 탭 전환 시 편집 상태를 보존한다.

- [x] 1. 수정 직전 실제 QSP/engine 메뉴/도구 파일 ZIP 및 해시 기록. 현재 PLAY bf7bc5e8을 기준으로 하며 이전 전달 QSP를 덮어쓰지 않는다.
- [x] 2. SHOW HTML의 표시 대사·참고정보·리소스를 읽기 전용으로 파싱. QSP 변수 치환/같은 그림의 다른 이벤트/여러 배열 사용처를 테스트로 검증. 다중 후보는 자동 확정하지 않는다.
- [x] 3. 대사 서버에 /workshop 화면과 공통 감지 API 추가. 이미지 iframe은 해당 게임의 등록된 로컬 서버 한 곳만 허용. 기존 편집 인증 토큰/백업/승인 규칙 유지.
- [x] 4. 기존 대사 페이지에 상태 보존 탭과 감지 상태/후보 UI. 자동 따라가기와 작성 중 원문/추가 대사 보호. iframe을 교체하거나 페이지를 재로드하지 않는다.
- [x] 5. 감지기가 raw SHOW HTML을 원자 저장하고 통합 WORKSHOP을 열거나 기존 창을 갱신. 기존 이미지 서버 및 공식 workspace launcher 사용. 감지기 실제 게임 입력 자동 실행은 하지 않는다.
- [x] 6. 기존 engine menu 문자열을 같은 크기에서 WORKSHOP으로 변경하는 해시 고정 데이터 패치. QSP의 실제 표시/설정 버전만 2.4.0.0으로 변경. EXE 길이/코드 오프셋 유지, 본문/액션/구문/CRLF 보존 확인.
- [x] 7. 후보본/HTTP/브라우저로 탭·감지 연결·초안 보존 검증, 실제 파일 배포. 사용자가 게임 종료했다고 확인했다. 게임 메뉴/SHOW HTML 실제 입력은 사용자 확인 사항으로 남긴다.
- [x] 8. 최종 독립 검토, 기록/복구/인수인계와 커밋/푸시/원격 확인.

파일: text-workshop/live-scene.cjs(파싱/대조), unified-workshop.js(탭/공통 감지), server.cjs(정적 화면/API/보안), index.html(기존 편집기 연결), image-workshop/JO9_Detect.ps1(HTML 저장/런처), tools/patch-workshop-menu.py(해시 고정 menu 데이터), mods/2026-10-14_workshop_build_2_4_0_0.json(현재 QSP 버전), QA/records/docs.

검증 경계: 저장/수정 API는 브라우저 테스트에서 호출하지 않고 실제 게임/이미지는 변경하지 않는다. QSP 변경은 명시 버전 문자열뿐. 게임 native 화면·메뉴는 사용자에게 확인 요청.

증거 및 판정 기록: docs/UNIFIED_WORKSHOP_20261014.md, records/workshop/2026-10-14-unified-workshop.json. Git 원격 확인은 최종 커밋 뒤 수행한다.
