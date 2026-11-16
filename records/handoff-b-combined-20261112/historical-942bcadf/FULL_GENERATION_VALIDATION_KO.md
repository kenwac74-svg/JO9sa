# 통합 전체 생성 검증

후보 942bcadfa8f138fcbae9b3b492715f22324f0418b61c272307f6ea37f24de9cf를 읽어 Start만 진단용으로 바꾼 격리 사본에서 실행했다. WORK 및 후보 원본은 수정하지 않았다. 실제 engine/jack.exe와 현재 WORK JSON 1157개를 복사한 외부 상수 로더를 사용했다. 시드 대입·생성 helper 대체·임의 확률/후보 재정의는 하지 않았다.

정상 refresh_database+init_game 초기화로 기준 A 고정24인을 만들고, 통합 후보에서 동일23Dohna+춘향을 비교했다. 숫자843필드·이름·활동 계열 승인 정규화·고정인 origin delta 원값 유지가 일치했다. 새 무작위 배경300인을 50개씩6회 실행했고 native checks 4732개가 통과했다. 내부 연령0/1/2 표본은102/97/101, 로마 표본12개다. 기존 프리셋 설명을 가진 풀 표본1개는 새 무작위300에 포함하지 않았다. 각 표본의 실제 world/family/occupation/age를 진단 SAV에서 읽어 승인 v2 연결표와 독립 대조했다. source helper 전체14,429 legal triple 및 신규11ID 도달성도 일치했다.

일반 능력은0..5를 검사하되 기존 절세미인에 따른 외모6은 보존한 상태로 검사했다. Roman 이름 목록·nation10/world4, 새 출신 family_index2/3/4, 활동 trait 한 개 및 comfort 호환값도 native에서 검사했다.

첫 두50표본 진단은 timeout 이력이 있다. FAIL 메시지는 없었고 해당 spawned PID의 UIAutomation에는 접근 가능한 창이 없었다. 후속 재실행은 모두 성공했지만 이전 timeout의 정확한 원인을 확정하지 않았으므로 native-integration.json의 historicalTimeouts/limits에 남겼다. 300개 한 번 실행도 runner60초 제한 내 완료하지 않아 최종 증거는6개 bounded run으로 구성했다. 이를 게임 결함 또는 단순속도 문제로 단정하지 않는다. 실제 사용자 SAV/GUI 불러오기와 화면 육안은 미확인이다.

재현 핵심은 verify-full-generation.cjs(기준 생성/후보50표본 fixture), run-native-with-error.ps1(자체 spawned PID에 한정한 실패 텍스트 캡처), summarize-full-generation.cjs(실제 SAV의 독립 대조)다. baseline과 candidate 입력 해시는 prepared JSON에 남겼다. root의 최종 채택 및 추가 스타일 결정 이후 후보 해시가 바뀌면 이 결과의 적용 범위를 구분해야 한다.

원본·사용자 세이브·설정은 보존했고 재생성 가능한 진단 QSP/SAV/JSON 복사본과 자체 junction은 검증 후 정리했다.
