# JO9 창관: 실제 QSP 통합 준비 상태 (2026-10-09)

## 진행 결과
- 기존 HTML은 독립 시뮬레이터이며 JO9 엔진에 연결되지 않았다.
- JO9 원본을 읽기 전용으로 조사하는 도구 `tools/brothel_qsp_audit.py`를 추가했다.
- 도구는 QSPGAME UTF-16LE location을 풀어 1) 원본 SHA256 2) location 목록 3) 경제·행동력·캐릭터·저장·홍등가 진입 문자열 후보 4) 관심 location별 출현 건수를 JSON으로 보고한다.
- 게임 QSP를 변경하거나 게임 폴더에 쓰지 않는다.

## 중요한 소스 버전 차이
- 현재 GitHub main의 `source/jack_2026-10-01.qsp`는 문서상 248 locations / SHA 59e1a1af... 이다.
- 직전 사용자가 업로드한 `jack(3).qsp`는 분석 기록상 243 locations / SHA 9f70cc32... 이다.
- 두 파일은 동일 바이너리로 취급하면 안 된다. 패치는 대상 QSP SHA에 맞춰 별도 생성해야 한다.
- 이번 실행 환경에는 직전 업로드 파일의 로컬 바이트가 자동 마운트되지 않았다. 그러므로 최신 실제 QSP 파일의 location/변수 매핑을 재확인했다고 주장하지 않는다.

## 실행
```powershell
python tools/brothel_qsp_audit.py "C:\path\to\game\jack.qsp" --output brothel_qsp_audit.json
```

## 실제 통합 전 필수 고정
1. 소스 SHA 확인 후 `interaction_city` 혹은 `city_menu_form`의 진입 분기 정확히 선정.
2. 주인공 스파크 변수의 직접 대입과 산술 함수를 원본 소스에서 확인.
3. 종업원 인덱스, 외모·체형·상태·Trait 및 행동력 실제 배열 매핑.
4. QSP 저장 파일에서 신규 배열이 정상 직렬화/복구되는지 확인.
5. 기존 엔진에서 화면 버튼 및 새로운 location 추가가 안전한지 검증.
6. 243-loc/248-loc 상호 호환성 검증.

## 다음 구현
변수 매핑과 화면 진입 훅 검증 후, 원본 복사본에 한해 창관 초기화/진입/고객 생성/접객 정산의 최소 location을 추가한다. 독립 HTML의 임시 데이터는 실제 원본의 종업원 데이터로 교체한다. 패치 전후 location 수, 기타 location 동일성, 왕복 검증을 자동 검사한다.

상태: *통합 사전조사 도구 및 절차 준비 완료*. 실제 게임용 QSP 패치/실행검증은 아직 아님.
