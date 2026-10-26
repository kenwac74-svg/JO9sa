# #var_base 분기 구조·목록 인덱스 수리

2026-10-21 사용자 승인 범위 두 건만 Work에 적용했다. 새 번역문·조건값 변경·포상 동작·리소스 변경은 포함하지 않았다. 커밋·푸시와 Full/ZIP 동기화는 보류다.

## 변경과 근거

패치: VARBASE_STRUCTURE_INDEX_20261021.
기준 QSP 873abaac19edb69e75d022c0277e1a9d3dbc036d506e44bd27c4527da372d2a3 → 적용 1e911ced3798826e8cd1f35ed1e4115e9fd6450a9fdecaeb231b5f6885c1abb4.

262개 로케이션 중 #var_base 본문만 바뀌었다. 모든 기존 조건식과 문자열 리터럴 순서를 보존했고 나머지 직렬화 필드는 같다. 새 함수·로케이션·저장 변수·배열 키·저장 변환이 없다.

1. 19개 한 줄 if의 기존 RHS를 첫 들여쓰기 줄로 옮겨 다중행 블록으로 복구했다. 범위는 VARBASE_STRUCTURE_20261021_01~19 표식이다. 원고의 추가 조건식·배열 치환은 채택하지 않았다. 초기 단순 if/end 계산만으로는 문법 오류를 단정할 수 없었다. 실제 엔진은 원래 코드도 끝까지 실행하지만 거짓 조건 다음의 본문이 실행됐다. 수정 전 실제 진입 표식이 FULL_FALSE_ON_BODY_1에서 실패했고 후보는 해당 검사를 통과했다. 따라서 ‘19개 구문 오류’가 아니라 ‘19개 분기 구조 수리’라고 설명한다.
2. VARBASE_INDEX_INIT_20261021: hum_cnt를0부터 만들고 tess_num도 그 값을 받는다. 초기 난수 호출은 기존 실효 범위와 같은 rand(1,1)로 남겨 해당 호출의 수와 범위를 보존했다. 전체 난수 흐름이 이전의 잘못된 분기와 동일하다는 보장은 아니다.
3. VARBASE_FALLBACK_INDEX_20261021: 기본 항목을 쓰기 전에 hum_cnt=1로 맞춘다. 초기값만0으로 바꾸면 0번에 쓰고1번을 선택하는 새 오류가 생기므로 기존 늦은 대입을 앞쪽으로 이동했다. flaw_num은 text2/4가 채워진 앞 구간에서 선택하고, hum_num은 최종 전체 목록에서 선택하는 기존 위치를 유지했다. 오래된 배열 뒤쪽 값은 선택 범위 밖이므로 배열 전체를 지우지 않았다. hum_sign의 기존 값도 유지했다.

## 입력·출력·부작용·호출

입력은 기존 slave/assistant 및 공통 설정·문구 배열·상태다. 출력은 기존 동적 설명 조각과 hum_cnt/hum_num/flaw_num/tess_num, hum_text1~8/hum_sign 등 기존 파생 값이다. 원래 #var_base는 slave['ero_rwd_cnt']도 재계산하며 그 기존 동작을 유지한다. 그 외 인물 육성 수치 변경을 추가하지 않았다.

주요 호출은 refresh_database:35, interaction:20, choice_screen:7 및 #static_base의 기존 교환/비우기 경로다. 기존 저장 로드의 $ongload → $newloc → $addon(update,full) → refresh_database 경로에서 직접 다시 실행된다. 새 revision 값이나 저장 마이그레이션이 필요하지 않다.

소비자는 #static_txt:924/926의 flaw_num 및 후속 수업 템플릿의 hum_num이다. 따라서 인덱스 초기화와 기본항목 대입 순서는 한 묶음으로 유지해야 한다. 초기값만 되돌리거나 flaw_num 선택을 맨 끝으로 옮기지 않는다. 조건문 수리만 분리할 수 있지만 최신 #var_base 수동 수정이 있다면 전체 본문을 옛것으로 덮지 말고 차이 부분을 다시 병합해야 한다.

## 검증

- 실제 설치 FastQSP에서 수정 전 두 실패를 재현한 뒤 같은 검사를 후보에 실행했다.
- 19개 거짓 조건의 본문 미진입, 첫 블록의 참 조건 진입, 두 음향 설정을 확인했다.
- 목록12상태: 선행 후보0/1/다수, 후반 후보만 존재, 다수→소수→없음 전환, 기존 빈 첫 칸에 오래된 값을 넣은 경우, 심리 상태5종의 기본문 분기. 인물 배열 전체와 돈·날짜·자동저장 설정의 불변을 검사했다.
- 관련 검사 도구35개 회귀 테스트 통과.
- 공식 출고 검사 PASS: 구조·줄바꿈·인물JSON 등록·정확 패치 재생·재적용·입력 보존·설치 FastQSP 기본9경로. 배포 mirror는 지정하지 않았다.
- 별도 네이티브5.7 API에서 기존 슬롯1의 실제 읽기→#var_base→복사본 저장→재읽기 통과. 인물값265/256개를 비교했고 #var_base 주위 비교에서는 기존 파생 ero_rwd_cnt 하나만 제외했다. 저장·재읽기에서는 전체 값을 비교했다.

## 검증 한계와 실패 기록

보조 DLL은 다른 큰 자동 저장을 #var_base 실행 전에 오류105로 거부했다. 그 파일에 대한 실제 로드 호환성을 확인했다고 보고하지 않는다. 오래된 DLL과 현재 FastQSP의 기능 차이를 이번 QSP 회귀로 단정하지 않는다.

FastQSP 진단 코드의 OPENGAME 명령을 이용한 자동 로드 시도는 기존 파일을 일반 게임 파일처럼 처리해 완료하지 못했다. 절대·상대 경로 시도 결과를 남겼다. 최종 PASS에 포함하지 않았다. 실제 FastQSP 저장 선택 UI와 엄격 CRC 모드는 미검증이다. 별도 DLL은 진단용 $ongload 본문을 비워 원래 UI 갱신 경로를 생략하고 DEBUG=1로 CRC 비교를 우회했다. 설치 FastQSP도 현재 ignoreCRC=true지만 이것이 엄격 CRC 인증을 뜻하지 않는다.

원본 세이브에 쓰는 명령은 실행하지 않았다. 작업 중 라이브 자동저장이 갱신되어, 이후 검사는 고정 복사본으로 분리했다. 57개 원본의 전후 해시와 바뀐 자동저장 이름은 RESULT.json에 별도로 기록했다. 변경된 파일을 임의로 예전 상태로 되돌리지 않았다.

## 복구·재현·보관

복구본: G:/somi/JO9_work_backups/varbase-repair-20261021/baseline-873abaac.qsp.zip. 압축 안 QSP의 원본 SHA를 검증했다. 고정 세이브도 같은 폴더의 diagnostic-state-2b460775.sav.zip에 보관하고 저장소·배포에는 포함하지 않는다.

재현 시 이 두 압축을 G:/Codex/tmp/varbase-repair-20261021에 baseline.qsp/state.sav로 풀고 이 기록의 .cjs/.ps1 스크립트를 복사해 사용한다. repair.cjs는 고정 기준 해시를 확인하고 selected patch를 만든다. build-tests.cjs는 --qsp FILE --out DIR --state-save FILE을 받으며 실제 실행은 tools/qa/run-client-smoke.ps1이 맡는다. 입력과 다른 새 출력 폴더를 사용한다. 보조 DLL의 SHA와 절대 경로는 save-dll-report.json에 있다.

보조 API 원형 참고: https://aleksversus.github.io/howdo_faq/docs/informarch/extrqsp/console_player/ (qsp.h 원문), 이전 CRC 검사 참고: https://gitlab.com/Sonnix1/Qqsp/blob/master/qsp/game.c. 실제 결과는 여기 보관한 실행 증거를 우선한다.

검사 QSP·JSON 복제·재생 사본·진단 저장은 재현 가능하므로 정리한다. 최종 패치 JSON, 이 설명서, 해시 명세·결과와 재현 스크립트 및 최소 압축 복구 자료를 보존한다.