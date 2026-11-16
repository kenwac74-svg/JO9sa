# 춘향 최초 영입 인식·헌신 초기값 — 2026-11-12

사용자 지시를 WORK·추적 소스에 반영했다. 새로 생성·영입하는 춘향3040은 인식 등급3, 인식 단계0, 헌신 등급0, 헌신 단계0으로 시작한다. 이미 영입한 인물의 육성값은 덮어쓰지 않는다.

## 구현

debug_info의 표시 매핑을 확인했다. 인식은 rational/rational_rate, 헌신 등급·단계는 moral/moral_rate(실제 배열은 slave/stock과 slave_rate/stock_rate의 같은 키)다. 조정은 jo9_chunhyang_profile(init)의 기존 신규3040·비복제 가드 안에만 추가했다. 기본 생성기의 moral_rate=-10을 춘향 helper에서0으로 덮는다. JSON에도 seed_rational3·seed_moral0을 명시하여 helper 이전 get_stock_seed와 초기 neg_slave 계산에 맞는 인식값을 전달한다.

최초 생성과 실제 영입에만 적용하며, 일반 갱신·이미 영입한 인물·다른 캐릭터·복제의 진행을 초기화하는 코드는 추가하지 않았다. 새 저장 필드나 마이그레이션은 없다. 입력은 현재 인물번호·생성/복제 여부, 출력은 신규 stock의 네 초기값이며 기존 인물 이동 API가 영입된 slave에 전달한다.

mods/2026-11-12_zz_chunhyang_initial_attitude.json의 CHUNHYANG_INITIAL_ATTITUDE_20261112를 참조한다. QSP 변경은 jo9_chunhyang_profile 한 본문, JSON 변경은 seed_rational·seed_moral 두 키뿐이다. WORLD/배경/이미지·전투·다른 프로필 값은 보존했다. WORK의 jack.qsp와 json/slaves/3040_chunhyang.json, 추적 QSP/JSON 및 원장을 맞췄다.

## 검증

후보와 설치본 각각 실제 엔진1경로·9단언 통과. 실제 클럽 acquire→generate_stock→stock_to_slave_nogt에서 인식3/단계0·헌신0/단계0, 기존 열람 stock 보존, 타 인물/복제 가드, 영입 후 육성값의 refresh 및 중복 영입 호출 시 보존을 확인했다. 진단은 현재 JSON의 수치 seed를 주입하고 무관한 가격 평가만 격리했으며 실제 JSON 파일 읽기 UI·사용자 SAV 불러오기는 이번 검증 범위가 아니다.

공식 적용기로 재생·재적용, QSP 왕복·CRLF·마커 경계 및 변경 범위, JSON 기존 키 보존·WORK/추적/원장 일치를 확인했다. 실제 사용자 SAV는 수정하지 않았고 GUI는 사용자 확인 전이다.

QSP SHA-256: 5b714436ea013f1e9b32c9dc24bbb3c834128f95cbcf7b89df82381d2bc0e7d9. JSON SHA-256: 362ec17c05d0e89d7e27a9572ce9b3a03e4d8395b855878c96cc01a52fa6116f.

## 확인·복구

게임을 완전히 재시작하고 영입 전 저장에서 춘향을 새로 영입한 뒤 디버그 정보의 인식 등급3·헌신 등급/단계0을 확인한다. 영입 후 값이 이미 자란 기존 인물은 그대로 유지된다.

baseline.qsp.gz·character.before.json·runtime-source.before.json.gz는 이번 직전 복구 자료다. 제거 시 해당 QSP 본문 추가와 JSON 두 키를 함께 되돌리되 이후 수동 변경을 먼저 비교한다. 선언형 패치·재현 스크립트·엔진 로그·검증 JSON을 남기고 임시 QSP·합성 SAV·중복 .bak은 정리한다. Full·음원·커밋·푸시 변경은 없다.
