# B 배경 모듈 준비 결과

입력 WORK: a4d1985cba2f3071405fe8e6ac3edd47a1e29c1693dd84e7485b131974665a72. 모듈 단독 예상 결과: b48e279d2ed72d8f43122f1cec53f4be94b7226a44e3eacbc1187490fdead13b. WORK·assets/runtime에는 쓰지 않았다.

221개 정확 치환과 조수 location 하나로 기존 배경 152개를 교체하고 신규 세계1·출신3·직업7개를 추가했다. 원문은 607c7ec6 역사 스냅샷과 현재 WORK가 모두 일치하며 수동 수정 충돌은0이다. 최종 본문은163개다.

세계는 기존18칸 비중에 로마1칸을 추가한다. 선택한 세계에서 해당 연령에 직업 후보가 있는 출신을 균등, 그 출신의 유효 직업을 균등 추첨한다. v2의 출신 허용·거부와 연령 교집합을 고정한 코드 표를 사용한다. 후보가 없으면 생성 중단과 stock_state=0으로 끝나며 금지 조건을 푸는 대체 경로는 없다.

조수 jo9_background_b의 select는 stock.age를 읽고 세계·출신·직업 ID와 설명을 정하며 성공1/실패0을 돌려준다. refresh는 선택 직전 호출하며 정확한 역사 원문과 같은 전역 설명152개만 교체한다. 신규11 슬롯은 비었을 때, 로마 이름24개는 풀 자체가 없을 때 초기화한다. 수동 전역 설명·수동 신규 설명·기존 이름 풀·소유 인물의 복사된 설명은 유지한다. 임시 dynslave_name은 LOCAL로 복원한다.

신규 저장 필드는 instance.jo9_bg_random 하나이며 완전 무작위 신규 배경에만1이다. 기존 $instance_world/family/occupation 역할 변수를 재사용한다. 선택 후보 표는 함수 코드에 있어 추가 전역 후보 배열이나 버전 저장값을 만들지 않는다.

로마는 발전 수준 world_index4, 독립 이름·관계 집단 nation_index10, roman_name 이름 풀을 사용한다. world_index는 관계·허용성·교육 산식의 단계값이어서 새 번호를 만들지 않았다. nation10은 기존1~9 집단과 구분되며 기존 특수 집단9 처리는 보존한다. 새 이름은 중립적인 로마풍 예시이며 실존 인물 고증 명단이라는 주장은 하지 않는다.

출신·직업이 소유하던 초기 수치 변경222줄은 새 무작위 인물에서 실행하지 않으며 고정/프리셋/복제의 기존 처리와 스킬·해부학적 형질·상처·경험 초기화는 보존한다. 중세 기질 하한 조건만 >1로 고쳤다. 기존 성숙 연령의 bride→wife ID 재지정은 새 무작위 경로에서 막아 승인된 최종 선택 ID를 유지한다.

출신 성장·세련됨과 직업 특성 모듈의 연결 지점은 generate_stock의 ! JO9 MOD END B_BACKGROUND_INITIAL_ATTRIBUTES_20261112 뒤, FERTILITY 앞이다. 이 모듈은 해당 성장/특성/활동 효과를 구현하지 않는다. 조수를 제거하면 새 선택 호출이 실패하므로 호출과 신규 데이터/가드 변경을 모듈의 역치환으로 함께 제거해야 한다.

검증: Python 집중 검사7개 통과, 정확 재생·역적용 후 바이트 동일, 수정 location은 #static_txt/generate_stock 두 곳과 추가 조수 하나. 실제 FastQSP에서 새 정적 캐시와 역사 정적 캐시를 각각 로드한 격리 fixture를600회씩 실행했다. 자세한 검사 수와 결과는 BACKGROUND_NATIVE_RESULTS.json. 줄 경계 이상0, QSP 왕복 일치. 실제 개인 세이브를 OPENGAME으로 불러오거나 전체 generate_stock→영입 파이프라인/화면을 검증한 결과는 아니다.

재현: build_background.py와 test_background.py. 기준 WORK 해시가 바뀌면 빌더가 중단한다. 승인된 선언형 변경은 B_BACKGROUND_MODULE.json, 권위 자료와 원문은 BACKGROUND_AUTHORITY_SNAPSHOT.json에 고정했다.
