# 최종 통합 전체 생성 검증

최종 사용자 승인 범위 후보 29f4c04892a19afb25c82443a928e5d7895f1a7a24208df670eb3f4032bbbd15를 읽어 Start만 계측한 사본을 실제 FastQSP engine/jack.exe에서 검사했다. 스타일 추가 추첨은 보류된 최종 후보이며, 도둑C/운동선수B 체력 최저 예외는 유지했다. WORK/후보 원본/현재 JSON 원본은 수정하지 않았다.

현재 WORK JSON 1157개를 격리 복사하고 실제 native JSON 상수 로더를 사용했다. 임의 seed 대입이나 생성 helper 대체는 없다. 원본 A와 최종 후보 모두 정상 refresh_database+init_game 초기화를 썼다. 원본23Dohna+춘향1과 비교하여 숫자843필드·이름·활동 계열 승인 정규화·고정인 origin delta 원값 유지를 확인했다.

신규 무작위300인을50개씩6번 생성했다. 실제 native checks 4729개와 독립 SAV 대조가 통과했다. 내부 연령0/1/2는102/96/102, 로마11인이다. 300개의 실제 world/family/occupation/age를 승인 v2 권위표와 독립 대조했다. helper14,429 legal triple과 신규11ID 도달성도 일치했다. 일반 능력0..5와 기존 절세미인 외모6, Roman 이름·nation10/world4, 새 출신 family_index2/3/4, 활동 trait 단일 보유·comfort 호환값을 검사했다.

최종 검사는 엔진을 하나씩 순차 실행했다. 네 번째 batch의 첫 실행은 FAIL 메시지 없이60초timeout이었다. 해당 PID의 UIAutomation은빈배열, Win32에는 숨김FastQSP/Console/IME창만 있었고 오류문구는없었다. 같은 fixture의 재시도는9.45초에 완료됐다. 최초timeout의 정확한 원인은 미확정이며 historicalTimeouts/limits와 캡처를 보존했다. 이를 동시 실행 또는 게임 소스 결함으로 단정하지 않는다. 최종 증거는 성공마커와 SAV를 확보한6회 실행이며 기능 assertion 실패는0개다. 이전942 후보 증거는 historical-942bcadf에 별도로 보존했다.

사용자 실제 세이브/GUI 불러오기·화면 육안은 미확인이다. 재현 핵심은 verify-full-generation.cjs, run-native-with-error.ps1, summarize-full-generation.cjs다. 재생성 가능한 자체 QSP/SAV/JSON 복사본은 검증 후 정리했다.
