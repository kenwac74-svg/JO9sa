# 2026-10-04 설치 기록

- 설리태번 1.16.0에 `JO9 각본·각색가` 캐릭터 설정 저장. Description, 성격, 상황, 첫 메시지, 예시, 캐릭터 노트, 메인 프롬프트 및 후처리 지침을 저장 후 다시 읽어 확인함. 모델 연결 변경이나 실제 응답 테스트는 수행하지 않음.
- 테스트: `node --test test.cjs`의 4개 테스트 통과. 바이트 왕복, 유니코드/행동 데이터 보존, 반복 원문의 한 위치만 수정, 따옴표/줄바꿈, 태그/변수 손상 거부, 외부 변경 거부, 승인 검사, 백업/내보내기/복원을 시험용 파일로 확인함.
- 실제 게임 `jack.qsp`: 17,028,802바이트, Location 248개, 검색 문자열 134,859개. 읽고 그대로 직렬화한 결과가 바이트 동일함.
- 실제 파일 SHA-256: `6d5e7563deb3a155437d2f14e5756d9bdca95ded2a9b76fd7d0615596b06a05b`.
- 실제 게임에서 `로베르투스` 검색 결과 8곳을 브라우저에서 확인하고 본문 하나 선택함. 실제 QSP에 반영한 변경은 없음.
- 게임 설치 위치: `G:\somi\JO9\game\modtools\text-workshop`.
- 소스 보관 위치: 저장소 `tools/text-workshop`. 게임 플레이 검증은 사용자 담당.

## 장면 탐색 추가

- 장면 범위와 앞뒤 대사, HTML 선택지의 상태값 변경, ACT 분기, args 목적지, 동적 목적지 미확정, 주석/문자열 안의 가짜 명령 제외를 시험용 QSP로 확인함.
- 전체 9개 테스트 통과. 저장 API 이후 수정된 대사를 다시 선택할 수 있는 참조, 방문 이력이 없는 장면의 진입 경로, 이동하지 않고 대사만 갈리는 조건 분기까지 확인함.
- 실제 `interaction_city` 13637행의 장면 조건 `interaction_city = 22700`과 부모 조건 `hero_choice < 100`, 연결된 `shop_general` 위치를 읽기만 해서 확인함.
- 사용자 수정 이후 QSP SHA-256: `88f6a7f0a8060e47dfb0475fed4ad1d66442dabdadb931e8c71e744be2f08fa6`. 탐색 기능 작업으로 QSP를 수정하지 않음.

## 보기 모드·게임 화면 미리보기·최적화 (2026-10-04, 집컴 Claude 리뷰)

- 대사/코드 구분(`core.isDialogue`)을 검색·장면 대사 목록·앞뒤 대사·장면 열기에 공통 적용. 실제 qsp 133,291개 중 대사 29,131개. 다음 장면을 열 때 코드 문자열이 첫 대사로 잡히던 문제 해결(대사가 없으면 "대사 없음"으로 표시).
- 보기 선택: 게임에 보이는 대사만 / 코드까지 같이. 게임 화면 미리보기(장면 그림 + 대사 + 선택지). 그림은 `/api/pic`(토큰 필요, `content\pic` 밖 경로 거부)로 제공.
- 내보내기를 최소 구간 mods(old/new/count 1, description·target 포함)로 변경. 같은 문구가 여러 번 있으면 한 번만 나오는 구간까지 넓힘.
- 서버가 요청마다 17 MB qsp를 읽고 해시하던 것을 크기·수정 시각이 바뀔 때만 다시 읽도록 변경(반영 직전 검사는 그대로 파일을 다시 읽음). 상태 요청 5회 78 ms.
- 테스트 12개 통과(추가: 대사/코드 구분, 최소 조각, 보기 모드·장면 이미지, 내보내기 크기). 실제 게임 폴더로 서버를 띄워 검색·장면·이미지(`bg\DosugRedLight.png` 200), 잘못된 토큰 403, 경로 탈출 404 확인. QSP 수정 없음(`88F6A7F0…`).

## 검색↔장면 연결, 표시 오류, 장면 그림 규칙 (2026-10-04 오후, 집컴 Claude)

- 헤드리스 Edge로 실제 편집실을 조작해 확인(“조프리” 검색 → 사창가 골목 문구 선택 → 다음 장면).
- 검색 결과 선택 시 장면 칸으로 이동, 결과 강조를 장면 이동과 동기화(`syncResults`). 「대사만」 보기에서 검색 결과도 게임 화면처럼 표시.
- 표시 오류 수정: `<<변수>>`가 `[<>/<>]`로 깨지던 것(태그 제거 정규식이 `<<`의 둘째 `<`를 태그로 봄), 그림만 있는 선택지 라벨이 `>.png">`로 깨지던 것(`clean`이 `<<…>>`를 먼저 지우도록, 그림 선택지는 “[그림 선택지]”).
- 장면 그림 점검: 대사가 있는 장면 3,600개 중 그림이 잡힌 장면 1,030 → **1,240**. “실행 중 번호 결정 때문”이라던 안내는 대부분 사실이 아니었다. 원인은 게임이 배경을 `content\pic\bg\<<$bg[$place]>>.png`(이름표)로 그리는데 도구가 `bg\$place`로 짐작한 것, 상위 조건에서 정한 그림을 따라가지 않은 것.
  - `scenes.bgTable(doc)`: `$bg['장소'] = '파일'` 432개를 모아 배경을 찾는다. 값이 변수 배열(`$interior_study[$study]` 등, 세이브 상태로 결정)이면 그 배열의 첫 값을 **예시**로 쓰고 화면에 “예시(세이브 상태로 결정)”로 표시(100개 장면).
  - 장면 안에 그림이 없으면 감싼 상위 `if` 블록에서 장면 앞에 정한 그림을 이어받음(“상위 조건에서 정한 그림”).
  - 남은 미표시: 그림 지정 없음 2,150(약 1,500은 `#options`·`#var_base`·`generate_stock`·`$cow_price` 등 데이터 location, 나머지는 `interaction`·`main_screen` 등 공용 화면 코드가 그림을 정함 — 미추적), 다른 location 호출 85, 경로 변수 조립 66(실제 실행 중 결정), 파일 없음 59.
- 테스트 12개 통과. 게임 설치본 갱신, QSP 수정 없음(`88F6A7F0…`).


## 분기 UI 및 이미지 체크리스트 연동 (2026-10-04, Codex / 사용자 승인)

- 승인받은 「분기 한눈에」 배치를 적용. 현재 단계, 같은 단계의 조건별 대사, 다음 단계 분기, 단계별 전체 목록을 분리한다. 코드 보기는 기존 선택 옵션으로 유지한다.
- `flow.cjs`가 문자열 배열 대입 → `copyarr '$text', '$배열'` → 실제 사용 장면의 같은 인덱스 `$special_image`를 읽기 전용으로 연결한다. 사용 장면이 여러 곳이면 선택할 수 있다. 조건의 참/거짓을 실행하거나 세이브를 평가하지 않는다.
- 실제 `#txt_man` 935/937행은 2단계, 936/938행은 3단계이며 `interaction_city = 2222`에 연결됨. 선택한 2단계 이미지는 `scene\whore\whore_anal-2.png`(브라우저 자연 너비 795 확인). `-1/-2/-3`는 단계 구분이며 랜덤 풀로 합치지 않음. rand/picMax 표기가 있는 직접 경로·숫자 템플릿은 후보 파일 목록을 표시한다. 복잡한 동적 조합/공용 렌더러 전체 및 런타임 세이브 상태의 완전 재현은 지원 범위가 아니다.
- 상위 이미지 상속에서 종료된 형제 분기 이미지를 제외하고, 인물 그림이 있어도 유효한 부모 배경을 보존한다.
- 이미지 패널은 현재 플레이 폴더만 제공. 후보별 작업 코드·상태 체크박스 및 해당 카드로 이동하는 체크리스트 버튼을 추가. 원본 비교는 체크리스트에서만 유지.
- `catalog.cjs`가 `G:\somi\IMGMG\catalog_status.js`를 공통 상태로 사용. 한 플래그 변경 시 다른 플래그/항목을 유지하고 쓰기 전 상태 백업. 완료를 체크하면 카탈로그의 기존 짝 관계에 있는 작은 그림도 완료 처리한다. 자동 완료를 취소할 때는 이 기능이 자동 체크했던 짝만 취소한다.
- 모든 카탈로그 항목 32,286개에 고정 코드 부여. bg → `bg-0001`, ui overhaul → `UO-0001`, characters → CH, scene → SC, ui/buttons → UI, girls → GL, mob → MB, master → MA, 나머지 → ET. 파일별 번호와 큰 그림 연결 작업 번호를 별도로 표시. 경로·코드로 검색 가능.
- 번호 원장 `catalog_work_ids.json`, 오프라인 표시 `catalog_work_codes.js`, 로컬 접속 설정 `catalog_workshop_config.js`는 IMGMG에 보관하며 git에 넣지 않는다. **번호 원장은 다른 PC로 이전할 때 같이 옮기고 삭제하지 않는다.** 재생성 시 기존 번호를 재사용하고 신규 항목만 다음 번호를 받는다.
- 편집실 서버가 켜져 있으면 HTML 카탈로그와 공통 파일로 저장/동기화(약 5초). 서버 없이 연 HTML은 기존 브라우저 저장 방식으로 동작하며, 재연결 시 원래 파일 대비 미저장 변경분을 가져온다. 서버를 다시 실행한 후 이미 열려 있는 파일 카탈로그는 사용자가 한 번 새로고침해야 한다. 편집실의 `/catalog?image=…` 버튼은 연결된 HTTP 카탈로그를 바로 연다. HTA는 코드 표시 및 기존 파일 저장 방식 유지.
- 시험용 QSP/상태 파일로 테스트 16개 통과: 단계별 바인딩, 조건 교체, 실제 사용 장면 선택, 랜덤과 단계 구분, 상위 배경/형제 제외, 번호 유지, 짝 연결, 상태 보존·백업, 토큰/origin/경로 탈출 거부, 기존 대사 반영·복원 보호.
- 브라우저 시험: 시험용 가게 대사로 편집실 체크 → 해당 카탈로그 카드 자동 이동 → 카탈로그 체크 해제 → 편집실 상태 반영을 확인. 실제 편집실은 사용자 추가 승인 후 **3813 서버만** 재시작. 기존 선택 937행 복원, 실제 이미지 로드, `SC-1395` 및 분기 표시 확인. file:// 카탈로그 탭 조작은 브라우저 보안 정책이 차단하여 직접 브라우저 검증하지 못함(파일 배치와 HTTP 연동 화면은 확인).
- 기존 파일 백업: `G:\somi\IMGMG\image_work\tool_backups\dialogue_ui_20261004_151531`. 저장소와 게임 설치본을 동일하게 배치. QSP `88f6a7f0a8060e47dfb0475fed4ad1d66442dabdadb931e8c71e744be2f08fa6` 및 기존 체크 상태 해시 `4693bd63e02aa1091617a2919d32d08dc8bbded5f19d7cac81e756be4f0f95fe` 유지. 게임 실행/플레이 검증은 사용자 담당. 게임 이미지·QSP·런처·다른 서버/ComfyUI 변경 없음.


## Localhost PIC 연결 (2026-10-04, Codex / 사용자 지시)
- `/catalog`는 `catalog_pic.js`에 `catalog_local_pic.js`를 먼저 붙여 로컬 PIC 연결을 자동 등록한다. 폴더 선택·파일 접근 권한 팝업 없이 전체 PNG 인덱스와 기존 크롭/아이콘 화면을 사용한다. file:// 및 기존 게임용 JO9_Place_Workshop.html은 기존 방식 유지.
- 서버 `pic-local.cjs`: PIC 내부만 접근, symlink/경로 탈출·중복 경로·잘못된 PNG 규격·변경된 원본 거부. 반영 전 해시 확인과 원본 백업, 저장 결과·작업 이력·카탈로그 크기/상태 갱신. 기존 파일 복구는 백업 해시와 현재 상태 확인 후 새 백업을 남긴다. 새로 생성했던 파일을 삭제하는 복구는 기존 워크샵에서 수행(로컬 화면에서 안내).
- 저장 후 카탈로그 원장과 progress/history 갱신. 크롬·내장 브라우저 모두 같은 HTTP 주소에서 공통 체크 상태(5초)와 화면 이미지 변경(3초)을 확인한다. 상태 기록 실패 시 이미지 저장 성공 여부와 경고를 분리해 표시한다.
- 실제 QSP·기존 게임용 워크샵의 SHA-256 동일. 자동 시험 8개 통과(시험용 파일만 사용). 실제 교체·화면 확인은 사용자 담당. 백업: `G:\somi\IMGMG\image_work\tool_backups\localhost_pic_20261004_194239`. 사용자 요청에 따라 편집실 3813 서버만 다시 실행.

## 2026-10-05 PIC 연결·등록 메시지 수정
- 사용자 승인: 이미지 패치리스트 작업에 한해 필요한 서버 재시작을 일괄 승인. 다른 시스템 수정·롤백 승인으로 확대하지 않음.
- HTTP 카탈로그의 서버 연결 설정을 head 시작에 배치. 비동기 PIC 모듈이 연결 설정보다 먼저 실행해 폴더 선택기로 빠지는 로딩 순서 문제 수정.
- localhost에서 모듈이 없으면 폴더 선택기 대신 안내, 서버 인덱스 응답에 30초 제한 추가. 등록 패널·대기 메시지는 밝은 글자색.
- 3813 서버만 프로세스 확인 후 재시작. 기존 탭은 선택기 대기에 묶여 새 체크리스트 탭을 열었으며 PNG 30,971개 자동 연결·밝은 안내문 확인. 실제 교체 테스트는 사용자 담당.
- 서버 문법 검사와 기존 catalog-pic 테스트 통과. 게임 QSP·이미지·순정·독립 워크샵 수정 없음.
- 백업: G:\somi\IMGMG\image_work\tool_backups\pic_loading_20261005_171416

## 2026-10-05 원본 이미지 작업폴더 복사 버튼
- 원본(JO9O) 이미지 파일명 옆 「작업폴더로 복사」: 순정 파일은 읽기만 하고 game/content/modworkpic에 같은 파일명으로 복사.
- 동일 파일은 중복 복사하지 않음. 다른 내용의 동명 파일은 사용자 확인·현재 해시 재확인·백업 후 덮어쓰기. 목적지 symlink 거부, 서버 토큰/origin/카탈로그 항목·원본 경로 검사 적용.
- original-copy.cjs 저장소·게임 설치본 배치, catalog_workshop.js 저장소·IMGMG 동기화. 3813 서버 재시작은 이미지 리스트에 대한 사용자 일괄 승인 범위.
- 시험용 파일로 복사·중복·충돌·백업·원본 보존 통과. 브라우저에서 bg-0682 russiankvartal_detinec.png의 복사 버튼 확인. 실제 복사 클릭은 사용자 담당.
- 백업: G:\somi\IMGMG\image_work\tool_backups\original_copy_20261005_172536

## 2026-10-05 Grok 이미지 프롬프트 작업창
- localhost 카탈로그 하단 분할창: 작업폴더 복사 성공 후 참조 이미지 준비. 사용자 명령 전송 시에만 OpenRouter Grok 호출. 전제 조건/추가 지시/응답 복사/새 대화 지원.
- Grok 이미지 입력+텍스트 출력 모델만 선택. 키는 runtime/grok-settings.json에 Windows DPAPI로 보호 저장, 브라우저 응답/소스/기록에는 키 없음. API 오류는 키를 포함한 원문을 전달하지 않음.
- 기존 토큰/origin 및 카탈로그 경로 검사 유지. 이미지가 modworkpic에 원본과 동일하게 복사된 경우만 전송 허용. 대화는 서버 메모리에서 최대 12개 이미지, 최근 4턴.
- 모의 API 시험: 명령 전에는 호출 없음, 참조 이미지 전달, 후속 대화/초기화, 잘못된 모델·오류·키 삭제, DPAPI 재로딩 통과. 실제 유료 모델 응답은 사용자 키 입력 후 확인 필요.
- 백업: G:\somi\IMGMG\image_work\tool_backups\grok_prompt_20261005
- OpenRouter 공개 모델 목록 연결 확인(200). Windows 신뢰 저장소 사용, TLS 검증 유지. 대화 요청에 맞지 않는 batch 모델은 제외.
- Grok 기본 추출 지침 변경: 판타지 일러스트/게임 CG/회화적 음영, 인간 둥근 귀 양성 + pointed/elf/elven/elongated ears 음성. 원본 화풍은 추출하지 않고 인물·의상·소품·비례·구도만 참고. 사용자 명시 비인간 종족 요청만 귀 지침 예외. 서버 문법 확인 후 3813 재시작.
- 빈 명령/공백 전송 시 기본 SDXL 긍정·부정 추출 명령 발송. 기존 화풍·인간 귀·원본 디테일 유지 지침 포함, 원본 화풍 추출 금지. 빈칸/추가 지시 계약 시험 포함 총 4개 통과. 폴더 사이드바 너비 및 Grok 높이 드래그 조절·각각 접기·localStorage 크기 기억·화면 크기 제한 적용. UI 문법 확인, 드래그/접기 시각 확인은 사용자 담당.
- 사용자 정책 변경: Grok 기본 요청은 이미지에서 SDXL 프롬프트 추출만. 귀 강조·화풍 강제·원본 디테일 유지 등 추가 고정 조건 모두 제거, 상황별 조건은 사용자 수동 입력. 전송 데이터 시험 4개 통과. 상단 파일명·작업번호 실시간 검색과 전체/현재 폴더 범위 추가, 기존 비교/상태 필터 유지. 서버 재시작으로 이전 강제 지침이 포함된 메모리 대화 초기화.
- Sabrina 검색 0건 원인 확인: 브라우저에 작업필요 상태 필터가 남아 있음. 전체 검색에서 검색어 변경·검색 버튼·Enter 시 상태/비교/출처 필터 자동 해제, 작은 이미지 포함. 검색 후 사용자가 필터를 추가해 좁히는 동작은 유지. JS 문법 통과, 정적 파일 변경이라 서버 재시작 없음.
## 편집실 검색 복구 · OpenRouter 각색창 (2026-10-05)
- 다중행 문자열을 포함한 주석의 범위를 끝까지 읽도록 스캐너 수정. 장면 분석도 같은 주석 범위를 제외. 실제 QSP #npc_base / $Sabrina_pref[1] / 7215행의 "혹시 그 전설적인" 1건 검색 확인.
- 검색 결과가 없으면 이전 장면/선택을 지움. 새 검색 선택 시 이전 장면 usageId를 재사용하지 않음.
- 설리태번 링크 제거. 접기/높이 조절 가능한 OpenRouter 창 추가. 선택 원문+최신 플레이 이미지 준비 → 수동 전송 → 응답 확인 → 수정문으로 옮기기 → 기존 미리보기/승인/백업. 이미지 없는 장면은 대사만 전송. 장면 변경 중 도착한 응답은 옮기지 않음.
- 기존 Grok 모듈 재사용, 편집실 모델 선택은 dialogue-ai-settings.json으로 분리. 기존 보호 저장 API 키 재사용 가능. OpenRouter 공개 목록에서 image 입력/text 출력 모델만 제공하며 image 출력 모델 제외. 사용 가능 여부는 전송 전 다시 검사. 기존 이미지 패치 SDXL 기본 지침 유지; 각색창은 별도 한국어 각색 지침.
- 자동 시험 22개 통과. 기존 integration 테스트 fixture를 실제와 같은 head/body 문서로 수정(기존 실패를 원본 서버에서도 재현). JS 문법 검사 통과. 유료 API 요청 및 게임 수정 없음.
- QSP 왕복 바이트 동일. SHA-256 37227162e9a745f5ed2f46e665f09d65405df54afae31f4aa90b60c89810988c 유지.
- 저장소와 설치본 배치 완료. 백업 G:\somi\IMGMG\image_work\tool_backups\dialogue_search_openrouter_20261005. 서버 재시작 승인 및 사용자 UI 점검 대기. 순정 폴더/SillyTavern 설정 변경 없음.


- 사용자 상시 승인(2026-10-05): 대사 편집실과 이미지 체크리스트 서버 재시작은 별도 확인 없이 수행. 이 승인은 다른 시스템/ComfyUI/롤백에는 적용하지 않음. 편집실 3813 서버만 재시작하여 새 기능 활성화.

## 공용 text 배열의 이벤트 범위 (2026-10-05)
- 사용자가 연 interaction_city 23091행에서 144단계/785분기 오표시 확인. flow.cjs가 같은 location 전체의 text 배열을 합산하던 원인 수정. 직접 text 배열은 선택한 이벤트 조건 범위만 묶고 해당 장면의 단계별 그림/배경/이동을 연결.
- 실제 interaction_city = 10131 확인: 7단계, 각 1개 대사, 1단계 bg\Xmas_palace. 다른 이벤트 제외 회귀/분기/이미지/기존 연동 11개 시험 통과. QSP 수정 없음. 백업: G:\somi\IMGMG\image_work\tool_backups\dialogue_flow_scope_20261005.


## 단계 탐색 UI (2026-10-05)
- 모든 단계 버튼 상시 나열 제거. 이전 / 현재 단계·전체 수 / 다음으로 대체. 가운데 펼침에서 단계 번호·대사 검색, 대사 요약과 분기 수 표시, 30개씩 추가 노출. 현재/다음 단계 분기 유지. 전체 흐름은 사용자가 펼칠 때 생성.
- UI JS 문법 검사 통과. 게임 QSP/서버 설정 변경 없음. HTML은 요청마다 읽으므로 새로고침으로 적용. 백업: G:\somi\IMGMG\image_work\tool_backups\dialogue_stage_picker_20261005. 실제 UI 조작 점검은 사용자 담당.


## NPC 공용 화면 이미지 연결 (2026-10-05)
- 사브리나 누락 원인: 공용 interaction_result_city가 NPC ID로 구성한 pref/otkaz 배열 이름을 copyarr하므로 정적 문자열 비교에서 연결되지 않음. 실제 byer_invitation 장면의 NPC ID 리터럴과 공용 템플릿을 연결. 공용 화면의 npc_image 이름표로 캐릭터 리소스 추가.
- 사브리나: interaction_city = 1011, 13단계, bg\Xmas_palace 및 characters\Sabrina 함께 확인. 배경/인물은 큰 미리보기로 동시에 표시하며 폴더 출처 표시. UI/buttons/portrait/icon/avatar 경로와 가로세로 모두 400px 미만 그림 제외(PNG/GIF/JPEG 헤더 크기 확인). 후보 클릭은 작업 상태와 각색 참조 대상 선택 용도.
- NPC 템플릿/배경+캐릭터 회귀 및 기존 통합 시험 6개 통과, UI/서버 문법 통과. 게임 QSP 수정 없음. 백업: G:\somi\IMGMG\image_work\tool_backups\dialogue_npc_images_20261005.


## 2026-10-05 OpenRouter 모델 검색·연결 수정
- 이미지 패치·대사 편집실 각각 모델 검색(이름/ID), 이미지 지원 표시, 자동 목록 로딩. Grok/비전 전용 제한 해제, 텍스트 출력 모델 393개 실 API 조회 확인.
- 서버 재시작 후 보호 저장 키 복원 확인. 대사 편집실은 공용 키만 재사용하고 모델은 이미지 패치 설정에서 상속하지 않음. 별도 저장 파일로 개별 모델 선택 유지.
- 전체 모델 응답이 262144바이트 부근에서 잘리던 문제: limit=50/offset 페이지 조회로 수정. 양쪽 로컬 API HTTP 200, 목록 393개(텍스트 전용 165개) 확인. 실제 유료 생성 호출은 하지 않음.
- 텍스트 전용 모델 선택 시 이미지 데이터는 보내지 않고 응답에 이미지 미전송 안내. 게임 대사/파일 반영은 기존 승인 절차 유지.
- 이미지 프롬프트 기본 시스템 지침: 원본 화풍/작가/렌더링/매체를 추출하거나 모방하지 않으며 내용·의상·사물·구도만 추출. 목표 화풍은 사용자가 직접 지정한 경우에만 포함.
- 회귀 시험 9개 통과(페이지 분할, 모델 분리/복원, 키 보호, 이미지 미전송, 기본/추가 명령 보존). 화면 확인과 실제 생성 테스트는 사용자 담당.
- 저장소·설치본 및 IMGMG catalog_grok.js 동기화, 승인된 3813 서버만 재시작. 기존 열린 탭은 새 토큰을 받도록 새로고침 필요. QSP/이미지/순정/독립 워크샵 변경 없음.
- 백업: G:\somi\IMGMG\image_work\tool_backups\openrouter_model_search_20261005_225746 (서버/대사 UI/모듈). 기존 카탈로그 JS 이전본은 grok_minimal_search_20261005/catalog_grok.js에도 보관되어 있음.

## 2026-10-06 Kindroid 대사 편집실 옵션
- 사용자 최종 지시: Kindroid는 대사 편집실만 지원. 이미지 카탈로그 UI는 변경하지 않음.
- 캐릭터 ID 직접 입력, 서비스별 Windows DPAPI 키 보관 및 OpenRouter 모델 유지. Kindroid text/plain 응답 지원, 텍스트 원문만 전송. 새 대화는 원격 기억 초기화 없음.
- 회귀/서비스 전환/키 보호/오류 노출 시험 9개 통과. 실 API 요청은 키 입력 후 사용자 점검.
- 백업: G:/somi/IMGMG/image_work/tool_backups/kindroid_dialogue_20261006_003153


## 2026-10-06 대사 표기 검사 완화
- 정상 변수·치환문·HTML 추가/삭제/순서 변경 허용. 원문 보호 표기와 완전 일치 조건 제거.
- 치환문 닫힘/빈 식/괄호, 태그 > 및 속성 따옴표 검사. HTML은 다른 문자열과 이어지는 조각이므로 태그 쌍 강제하지 않음. 완전한 QSP 계산식 실행 검사는 아님.
- QSP 구조·따옴표 이스케이프·수정 범위·동시 변경·백업/복원 검사 유지. 일반 대사 fixture 회귀/서버 시험 6개 통과. 실제 게임 대사 반영 없음.
- 백업: G:/somi/IMGMG/image_work/tool_backups/dialogue_markup_20261006_005023


## 2026-10-06 표시용 치환문 복사·복원
- 표시용 변수 span에 원래 QSP 치환문 보관. 대사 영역 복사 시 원래 코드로 클립보드 전달, 수정창 붙여넣기 시 확인된 표시 이름 복원.
- 미리보기/반영 준비에서도 QSP 전체의 치환문 대응표로 복원. 숫자 변수/문자열 변수 구분 유지, 충돌은 선택 원문을 우선하고 모호하면 오류로 알림. 일반 괄호 문구와 기존 치환문 유지.
- 일반 fixture 복원 4개 및 기존 반영·백업·복원 6개, 총 10개 통과. UI 문법 통과. 실제 게임 대사/QSP 변경 없음.
- 백업: G:/somi/IMGMG/image_work/tool_backups/dialogue_token_restore_20261006_022702


## 2026-10-06 대사 편집창 서식·PNG 이모지·기록 탐색
- 원문 찾기 → 선택 대사 수정 → 3. 장면 흐름 순서로 이동. 검색 결과 선택 시 수정창으로 이동.
- 선택 영역 볼드/이탤릭/밑줄/색상/줄바꿈 태그 삽입. PNG 12종을 ui/dialogue_emoji에 배치, 20px 게임용 img 태그 클릭 삽입 또는 텍스트창 네이티브 드롭 위치에 삽입. 기존 승인/미리보기/변수 복원 유지.
- 변경 기록 기본 접힘, 한 페이지 최대 10개, 이전/다음 화살표 및 페이지/전체 수 표시.
- 서식·페이지 경계·PNG 실제 파일·DOM 순서 4개, 기존 저장·복원·변수 복원 10개, 총 14개 통과. UI/서버 문법 검사 통과. 드래그 실제 조작과 게임 렌더링은 사용자 확인.
- QSP/순정 폴더/독립 이미지 워크샵 변경 없음. 백업: G:/somi/IMGMG/image_work/tool_backups/dialogue_editor_controls_20261006_025008


## 2026-10-06 PNG 이모지 30종·대사창 크기 정렬
- 총 30종: 기존 12종을 진한 색·테두리·여백 축소로 교체, 감정/낮밤/음악/꽃/방패/열쇠/잠금/사슬/책/계약서/물약/거래/시간 추가.
- 신규 태그 24px, vertical-align -5px. 플레이 base.css에 dialogue_emoji 경로 한정 규칙 추가해 기존 20px 태그도 같은 크기로 표시. QSP 수정 없음.
- 30종 파일/표시 크기/페이지/서식 회귀 5개 통과. PNG 연락판 시각 확인. 최종 게임 정렬은 사용자 확인.
- 백업: G:/somi/IMGMG/image_work/tool_backups/dialogue_emoji30_20261006_031052


## 2026-10-06 PNG 이모지 100종·4페이지
- 감정·상태 / 생활·거래 / 전투·마법 / 지역·인터페이스 4개 분류, 각 25종. 번호 1~4 버튼, 현재 분류명, 아이콘 이름 표시. 기존 30종 파일명 유지.
- 신규 삽입은 19px 및 vertical-align -4px. 기존 PNG 태그도 플레이 base.css의 경로 한정 규칙으로 19px에 맞춤(이전 24px의 약 80%).
- PNG 100종 존재/치수, 분류별 25개 및 중복 없음, 서식/기록 페이지/배치 회귀 6개 통과. JS 문법 통과, PNG 연락판 시각 확인. 실제 드래그 및 게임 렌더링은 사용자 확인.
- QSP와 순정 폴더 변경 없음. 백업: G:/somi/IMGMG/image_work/tool_backups/dialogue_emoji100_20261006_032529


## Supplied fantasy emoji replacement 2026-10-06
- Replaced generated art with all 255 PNGs from fantasy_emojis.zip. Eight icon-only categories; 25 items per page; 19px game display retained.
- Five existing QSP image names use copies of supplied PNGs to preserve inserted references. No QSP changes.
- PNG validity, uniqueness, category pagination, aliases and editor regression checks passed (5 tests).
- Backup: G:\somi\IMGMG\image_work\tool_backups\dialogue_supplied_emoji_20261006_034352


## Retained JO9 concepts with supplied emoji style 2026-10-06
- Restored all original 100 concept entries, using supplied artwork and matching Microsoft Fluent 3D supplements. Four dedicated armor/mace/staff/treasure-chest PNGs generated with built-in imagegen; prompts and mappings in emoji manifest.
- All supplied 255 icons remain available; 292 distinct entries total. Four original themed groups, icon-only tabs/buttons, up to 25/page; 19px game size retained.
- Five editing regression tests passed; PNG dimensions/signatures and pagination coverage verified. No QSP edits.
- Backup: G:\somi\IMGMG\image_work\tool_backups\dialogue_concept_style_20261006_040551


## 2026-10-06 삭제 예정 태그
- 체크리스트/HTA/생성기와 편집실 공유 상태에 delete(삭제 예정) 추가. 기존 필터·일괄 체크 지원, 상태 파일에 저장. 실제 이미지 삭제 없음.
- 태그 추가/재로드/해제와 다른 상태·파일 유지 테스트 통과.
- Backup: G:\somi\IMGMG\image_work\tool_backups\catalog_delete_tag_20261006_055826


## 삭제 예정 의미 정정 2026-10-06
- 완료된 이미지의 최종 플레이 적용본은 보존하고, 불필요한 구버전·원본·시안·중복 보관본 정리 대상으로 표시. 순정 JO9O는 항상 수정·삭제 금지.
- 태그 설명과 생성기만 수정. 체크 상태, 실제 이미지 및 QSP 변경 없음. 즉시/일괄 삭제는 실행하지 않음.



## 2026-10-09 읽기 전용 변수 코드 확인
- 사용자 결정: 변수 편집 UI 대신 확인만 제공. 기본 접힘에서 치환 코드·장면 조건·변수 설정 후보와 위치·행을 표시, 현재 세이브값으로 단정하지 않음.
- 공용 배열의 실제 사용 장면, 조건별 대입, 지연 실행, 주석 제외, 출력 상한 및 인증/오래된 선택 검사. 전체 회귀 54개 통과, 조회 전후 fixture 및 실제 QSP 바이트 보존.
- 저장소와 설치본 동기화, 사용자 상시 승인으로 3813 서버만 재시작. 내장 브라우저에서 확인. 게임·이미지·순정·키 변경 없음.
- 상세: `docs/DIALOGUE_VARIABLE_INSPECTION_20261009.md`. 백업: `G:/somi/IMGMG/image_work/tool_backups/variable_inspector_20261009_164704`.

## 2026-10-11 이미지 체크리스트 미체크 전체 보기

- `catalog_workshop.js`에 독립 파일 단위 미체크 검토 모드를 추가했다. 작은 포트레이트·미적용 시안·체크한 부모의 미체크 자식을 포함하며, 보기를 열어도 상태를 저장하지 않는다.
- 일괄 적용은 이 목록의 파일에만 적용한다. 일반 보기 복귀 시 이전 폴더·검색·상태 필터를 복원한다. 공유 상태 갱신 시 체크한 파일은 목록에서 사라진다.
- 모듈 원본은 `tools/imgmg/catalog-review-module.js`, 테스트는 `node tools/imgmg/test-review.cjs`. 배포된 `catalog_workshop.js` 끝의 같은 모듈과 함께 갱신한다. 생성기는 기존처럼 `catalog_workshop.js`를 복사한다.
- 전용 주소: `/catalog?review=unchecked`. 소스·IMGMG·로컬 작업/seed에 동일 모듈을 적용한다. 서버 API 변경이나 재시작이 필요하지 않다.
