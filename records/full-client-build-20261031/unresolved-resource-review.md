# 미해결 scene 참조 26건 재점검

기존 metadata의 26건은 16종 경로다. 현재 QSP에서도 주석이 아닌 실제 문자열 26건을 확인했다. 이 중 2건은 빈 아이템/샘플 아이템 정의이고, 나머지는 직접 이미지 슬롯 또는 난수 분기다. JO9O 동일 상대경로도 모두 없으므로 원본 파일 복원만으로 해결되지 않는다.

- 사용자 공급 예정 coldef1/2/3: 3경로·3참조. root의 별도 임시 호환 사본 처리 범위다.
- 명확한 용도별 경로 호환: pope(6참조)→characters/pope.png, portal(4참조)→bg/fogs_portal.png, vatican_paladin→bg/vatican_paladin.png, strazhnik→bg/strazhnik.png. 후보 모두 현재 WORK에 795×596 PNG로 존재한다. 해당 이벤트는 각각 교황 대면6218/6219, 포털6220, 성기사 준비6215, 가디언 준비6216이다.
- slaughter_work2(2참조): 115441/61134의 목을 베고 돈을 받는 1페이지 장면. 별도 가공 과정은 start→end→result 순으로 이미지를 사용한다. 기존 start 컷이 설명 시점상 가장 가까운 fallback이나 잃어버린 원본과 같은 그림이라는 증거는 아니다.
- blindfold_5~8(4참조): 여주인공 sex_interaction=21이 명시적으로 RAND(1,8)을 사용하지만 실제 원본/WORK는 blindfold, _2, _3, _4만 있다. Full-only 1~4 반복 사본으로 슬롯 공백은 없앨 수 있으나 신규 다양성이 아니라 호환 fallback으로 기록해야 한다.
- Jasmine23.png.(2참조), Raja1.png.(1참조): interaction_city=30117의 이미지100/101/102에 끝 점이 남아 있다. 정상 jasmine23.png/raja1.png는 두 게임에 모두 있고 exact trailing-dot 경로 existsSync는 false다. Windows/Qt가 자동 보정한다고 단정하지 않는다. 파일만으로 보완하려면 끝 점 경로의 생성/렌더링을 별도로 검증해야 하며 코드 수정은 이번 조사에서 하지 않았다.
- item_(1), weapons/one_handed/sample(1): 빈 item key와 SAMPLE 장비 정의다. 정상 장면의 직접 표시가 아니라 정의이므로 배포 필수 이미지로 임의 생성하지 않는다. 샘플이 실제로 선택되는 일반 경로는 확인하지 못했다.

추가로 최신 캣파이트 catfdef1/catdef2는 이전 metadata 이후 추가된 2경로라 26건에 포함되지 않는다. root가 사용자 공급 전 호환 이미지로 별도 처리한다.

검증 한계: QSP 문자열/이벤트 조건/현재 파일·치수/JO9O 비교를 수행했고 전체 퀘스트를 실행하지는 않았다. 입력 파일은 수정하지 않았다. 상세 현재 줄번호와 정확한 경로는 JSON에 있다.
