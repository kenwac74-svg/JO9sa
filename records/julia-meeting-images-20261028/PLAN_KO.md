# 줄리아 재회 이벤트 NPC 이미지 수정 계획

**Goal:** 조니의 줄리아 재회 이벤트에서 장면에 맞는 줄리아·요한나를 표시하고, 중간 저장을 불러와도 인물을 다시 생성하지 않는다.

**Architecture:** 기존 interaction_city163 action5곳의 NPC ID만 고친다. interaction_screen_city의 기존 action 실행 전에 해당 이벤트의 옛 저장 action과 현재 잘못된 NPC 참조를 교정한다. $ongload의 기존 처리를 마친 뒤 해당 중간 화면만 renderer로 복귀한다. 새 helper·로케이션·영구 변수는 없다.

**Tech Stack:** 현 WORK 컴파일 QSP 직접 파싱, 선언형 mods JSON, apply_mods.ps1, 설치 FastQSP 격리 실행, 공식 release-check.

**Spec:** 사용자 승인 “진행”. 3·15·18페이지는 julia, 16·17페이지는 johanna. action이 없는3~15페이지의 현재 참조도 옛 alyce/kuma일 때만 julia로 교정한다.

## 제약과 검토점

- 기준 WORK: 3fbdb2cca0e3eb2d4a70c2f9b442f2fb39bb756f1aefe6217cf8c10668f1106c.
- WORK와 추적 변경·검증 기록만 갱신. 기존 세이브·배포·PNG·NPC 전역 매핑·CSS·JS·엔진·커밋·푸시 보존.
- 이벤트 중간 저장에서 interaction_city163 생성 분기로 돌아가지 않는다. renderer만 다시 그린다.
- 현재 인물23묶음·텍스트·진행 페이지·획득/보상 상태를 유지한다. 기존 action의 NPC 참조 이외 명령은 유지한다.
- 현재 NPC와 cached action을 교정할 때 알려진 옛 alyce/kuma 참조만 바꾼다. 다른 이벤트와 사용자 지정 다른 NPC는 유지한다.
- renderer의 원래 action 실행 순서를 유지한다.1~2페이지는 원래 action이 결정하며3~15/18은줄리아16~17은요한나다.

## 작업

- [x] 원인과 화자/등장인물 대조.3/15/18줄리아,16/17요한나.
- [x] 실제 엔진에서 action3의 julia 기대가 alyce로 실패하는 RED 확인. 인물 생성은 성인 대리 fixture로 격리.
- [x] 선언형7편집/3로케이션의 최소 후보 작성과 바이트 역적용 검증.
- [x] fresh action·중간상태·표시/로드꼬리GT·비대상·사용자참조·반복실행·인물보존을 실제 엔진에서 검사.105+21조건·인물23묶음 보존PASS. 추가 native-load 합성SAV 불러오기는 파일열기오류/timeout으로 미완료이며별도기록.
- [x] 독립 검토 및 공식 구조/줄·주석 경계/재생/멱등성/실제엔진9경로 검사.
- [x] 최신 WORK 확인 후 자동 백업·동일 후보 적용. f0911bef, 백업jack.qsp.bak_20261028_151051.
- [x] 구현·의존성·호환·복구·검증 한계 및 미수정 목록 상태 기록. root1142파일/845140430bytes, tester18파일/390320664bytes 정리. 백업·합성SAV·로그 보존. 실제native-load 추가검사는미완료로분리.
