# 관계 판정·반복 대사 수정 — 2026-10-22

사용자 승인 후 최신 WORK QSP에 적용했다. 배포본·ZIP·세이브·커밋·푸시는 변경하지 않았다.

## 바뀐 동작

- love=0은 연애 대상 미지정이다. 상대 인물 ID가0인 경우의 0=0을 연애로 보지 않는다. 대사 good2/good3를 함께 고쳐 이전 분기값이 남는 공백을 만들지 않았다.
- 상호연애 +5에는 양쪽 ID가 모두 양수여야 한다. 양수 상대에 대한 정상적인 일방연애는 유지한다. 일일 계산의 연애 생성·종료·기분·질투도 같은 유효 대상 기준을 사용한다. 관계 임계값·보상량·원래 난수 범위는 보존한다.
- 1117_acc_itog_good3_3의 같은 본문9개를 세 핵심(둘만의 시간 / 사랑 고백 / 숨기려 해도 끌리는 마음)과 세 말투로 나눴다. 기존 ID·그룹·심리조건·도입 동작·최근ID회피 선택기는 유지한다. 예시는 editorial/comparison.json.
- 기존 voice_fragment_revision을7에서8로 올렸다. interaction의 세 호출 조건과 #txt_man의 캐시 생략·완료 판정5곳을 함께 갱신한다. 기존 세이브의 파생 대사은행을 다음 관련 대화에서 한 번 다시 읽고 이후 재사용한다. 새 저장키나 캐시버전 필드는 만들지 않았다.

## 입력·결과·호출·의존성

origins_relations는 sa_rel1/2에 따라 노예 또는 조수의 상대관계·love·id를 읽어 대사 그룹과 일시관계 계산을 선택한다. PEER_VALID_MUTUAL_DIALOGUE / PEER_VALID_LOVE_DIALOGUE. relations_fastcalc는 같은 인물 배열로 일일 관계·연애를 계산한다. PEER_VALID_MUTUAL_DAILY / PEER_VALID_LOVE_FORMATION / PEER_VALID_LOVE_BREAKUP. next_day의 기존 기분·질투 경로는 PEER_VALID_LOVE_MOOD_* / PEER_VALID_LOVER_RETURN_* / PEER_VALID_LOVE_JEALOUSY_*다. 새 로케이션·호출 의존성은 없다. 기존 acc_rel, CONST_INT, slave/assistant 배열을 사용한다.

interaction의 기존 세 대화 진입점은 PEER_DIALOGUE_BANK_CALLER_1/2/3을 거쳐 #txt_man의 jo9_voice_fragment_data를 읽는다. PEER_DIALOGUE_BANK_CACHE / PEER_DIALOGUE_BANK_REVISION과 PRIVATE_FEELINGS_DISTINCT_CORES는 함께 유지한다. 수정은 mods/2026-10-22_peer_relation_zero_id_and_variants.json의17개 정확 치환으로 재현한다.

대사9개만 떼면 관계 오판은 남는다. 가드만 떼면0=0 연애 오판이 돌아온다. 버전 판정5곳 중 일부만 제거하면 갱신이 생략되거나 대사은행을 반복 재구축할 수 있다. 캐시 갱신은 대사 정의 배열만 다시 읽고 인물 ID·love·상대 관계·대사 이력을 이관하거나 초기화하지 않는다. 기존0번 관계에 섞인 과거 대상을 추정 복구하지 않는다.

## 검증과 한계

- 기존 분기의0ID 오판을 실제 엔진에서 먼저 RED로 재현한 뒤 최종 후보52개 경계값 PASS. 관계/일일 보정31개 검사도 기준본15PASS·16명시적RED에서 최종31PASS. 생성·종료의 난수식3개만 진단복사본에서 결정값으로 바꿔 분기·호출 여부를 확인했으며 확률분포 검증은 아니다.
- 실제 대사 선택기·실제 관계 cue 제거 블록·실제81개 인덱스 참조로 세 말투에서 각각3개ID 순환과3개 서로 다른 본문을 확인했다. 원본 세 말투는 본문중복RED, 개선본은GREEN. 검사된 대사블록/선택기와 최종 후보의 동일성을 추가 확인했다. 대표 type plain과 세 말투 범위다.
- revision7·9120개 캐시 및 옛9본문으로 시작해 실제 첫 호출에서 새9본문/버전8을 읽고 나머지 두 호출은 재사용한다. 별도 직접 호출의 캐시 생략과 인물ID/love/관계/이력 보존도 PASS. 초기3회 전체 재구축 진단은12초 제한을 넘었으므로 실제1회 갱신 후 재사용 시나리오로 정정했다. 최종6767ms.
- 공식 출고검사: 구조/줄·주석 경계/정확 재생/멱등성/인물JSON등록/실제 엔진9경로 PASS. 실제 WORK가 검사 후보와 SHA256까지 같다. 세이브64개는 시작~완료 해시 불변. GUI 세이브 버튼 로드·모든 조합의 대화 화면과 전수 플레이는 별도다.

## 복구·기록

원본 baaa39836b905e748a6ec8f356494b0260160a364164bc3684812394e4a9dbc9

반영본 a54283107b35e69ad50e23c528a13b499c62e7839aa77dde7ebbdf3b47023214

최소 복구원본: G:/somi/JO9_work_backups/private_feelings_20261022/before.qsp. 자동 생성된 중복 백업·진단QSP·복제JSON·동결 검사세이브는 최종 증거 보관 후 정리한다. 원본/최종 산출물/개인 세이브는 삭제하지 않는다.

## 검사 시간 제한 보완

최초 공식 출고검사는9경로 모두 기본12초 제한으로 FAIL이었다. 같은 홈 진단본이12708ms에 실제 완료하는 것을 별도 측정했다. 저장된 대사은행 약20만 대입문을 재현한 뒤 버전7→8 대사은행을 다시 읽는 진단 비용이 추가된 사례다. 게임 조건·완료 마커를 바꾸지 않았다.

검사기에 선택옵션 --client-timeout-seconds를 추가했다(기본12 유지, 정수1~60만 허용). PowerShell의 경로별 제한과 총 실행 예산을 함께 반영하며 이번 최종 검사는30초/경로를 명시한다. 모든9완료마커·예상치못한 메시지 실패·구조·패치 재생·입력 보존 요구는 유지한다. 검사기12개 회귀 및 PowerShell 구문 검사를 통과했다. 변경은 저장소 tools/qa에만 있고 게임·패치ZIP에 검사기를 넣지 않았다. initial-release-timeout.json은 실패 이력을 그대로 보존한다.
