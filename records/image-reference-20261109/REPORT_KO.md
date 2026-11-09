# 이미지 참조 경로·조건 편집 · 2026-11-09

사용자 지시는 현재 그림의 파일 내용을 덮어쓰는 것이 아니라, 선택한 장면이 참조하는 경로를 다른 기존 파일로 바꾸는 것이다. 새 경로는 scene/others/gloria01.png로 정정됐다.

## 사용

대사를 선택하고 오른쪽 그림 아래 **새 경로 지정**을 누른다. content/pic 안에서 폴더를 이동해 사용자가 미리 넣은 파일을 선택한 뒤 **경로·조건 반영**을 누른다. 적용 버튼이 구문·최신 해시·파일 존재를 검사한 뒤 저장한다. 검사·미리보기 버튼은 저장 없이 확인하는 선택 기능이다.

같은 그림이 여러 분기에 지정돼 있으면 수정할 이미지 지정에서 원본 행·조건으로 한 곳을 고른다. 다른 페이지·다른 분기·같은 그림을 사용하는 다른 이벤트에는 전파하지 않는다. 조건 편집은 기존 체크리스트의 입력·검증·변환 함수를 재사용한다. 성향, 보유금, 계급, 평판을 지정할 수 있으며 조건 불충족 시 사용할 기본 이미지도 파일로 선택한다. 모든 추가 조건을 비우면 선택 경로를 기존 이벤트 조건 아래 그대로 사용한다. 원래 대사·이벤트의 조건을 임의로 바꾸지 않는다.

별도 등록 패널을 제거하고 그림 바로 아래 동작으로 옮겼다. 기존 대사 검색·흐름/분기·각본·수정/추가 초안·이미지 작업 상태·변경 기록·최소 mod 내보내기를 유지한다. 그림 지정이 없는 단계의 별도 이미지 지정은 기존 검증된 페이지 연결 API를 재사용한다.

## 실제 적용

interaction_result_city / rental_sex / 3단계 / 변경 전583행의 첫 이미지 지정만 girls/sex_scenes/oral_general_milf_2.png에서 scene/others/gloria01.png로 변경했다. 바깥 조건 master_excitement >= 0 and jo9_gloria_event = 0 및 is_master_virgin = 1을 유지했다. else 분기의 원래 그림은 유지한다. 추가 성향/보유금 조건은 실제 게임에 설정하지 않았다.

WORK와 assets/runtime/2.4.1/jack.qsp 및 runtime-source-2.4.1.json을 맞췄다. 사용자 PNG를 assets/content/pic/scene/others/gloria01.png에 같은 바이트로 보관했다. 이전/이후 해시·API 복구 기록은 verification.json, 재생 가능한 변경은 mods/2026-11-09_gloria_image_reference.json에 있다. 전체 QSP에서 body 필드 한 개만 변경됐고 최소 조각 재생의 결과 해시가 일치한다.

## 구현과 의존성

flow.cjs가 페이지 이미지의 QSP literal 원문 참조(해시·필드·offset)와 분기를 전달하고 server.cjs의 withImages가 동일 경로 후보의 개별 참조를 보존한다. image-reference.cjs.prepare(doc, selection, path, {source, sceneId, usageId, conditions, fallback})는 선택한 대사/사용 장면의 이미지 지정인지 재검증한 뒤 후보 QSP와 최소 편집 조각·갱신된 선택 위치를 반환한다. 파일 경로는 PIC 내부의 정적인 PNG/JPEG/GIF만 지원한다. 한 줄 복합 명령·동적 이미지 식은 범위를 확인하기 전 수정하지 않는다.

이미지 지정은 IMAGE_REFERENCE_<id> 주석과 base64url 메타데이터로 기록한다. 추가 조건이 있으면 해당 대입문만 if/else로 감싸며, 새 세이브 변수 없이 기존 jo9_cruel_mercy/jo9_cruel_mercy_half, sparks, guild_reputation, brand_reputation을 사용한다. 규칙의 원래 계급·평판은 정확한 단계 일치이며 보유금은 이상/이하, 성향은 양끝 포함 범위다. 조건 불충족 기본 이미지와 선택 경로가 같으면 조건이 의미 없으므로 오류를 표시한다.

/api/dialogue-image/preview의 source를 받은 경우 이 모듈을 호출한다. /api/apply는 기존 transact의 해시 재확인·백업·기록을 재사용한다. 신규 상태 파일·세이브 마이그레이션·파일 덮어쓰기는 없다. UI는 catalog-cut-conditions.js의 fields, rules 모듈의 normalizeCondition/conditionExpression을 재사용하고 기존 전역 B/C컷 규칙과 저장 위치를 섞지 않는다. 모듈 제거 전 flow/server의 require와 UI 호출을 함께 제거해야 한다. 게임 내 변경 복구는 편집실 변경 기록에서 최근 변경부터 되돌린다. 후속 수정이 있다면 백업 전체를 무조건 덮어쓰지 말고 mods의 한 조각을 대조한다.

## 확인

- 관련48검사 통과: 개별 분기와 동일 그림 복수 참조, 원래 조건/다음 페이지/소리/효과 보존, full 슬롯, 이후 대사 offset, 조건 경계·유효값, API 저장/복원/내보내기 재생, 외부 해시·파일 소실 충돌, 늦은 응답, 수정 초안, 기존 탭 동작.
- 실제 WORK 변경 구간과 해당 location의 정적 구문 오류0. 컨테이너 바이트 왕복·필드 밖 보존·CRLF/주석 경계·공식 apply_mods.ps1 DryRun 재생 통과.
- engine/jack.exe 격리 진단에서 조건 일치/보유금/계급/평판/성향 불일치/바깥 분기6경우 완료 표식 확인. native-results.json과 prepare-reference-qa.cjs를 보존한다.
- 실제 브라우저에서 중립795×596 그림으로 파일 선택→조건 설정→반영→새 그림 표시→설치본 재시작 후 조건 재독출을 확인했다. browser-conditions.png는 중립 진단 편집창이다.
- 실행 중인 WORK 편집실3813 서버만 갱신했다. 사용자 탭의 초안을 지우는 강제 새로고침은 하지 않았다. 실제 게임 세이브에서 해당 장면의 최종 표시·배치는 사용자 확인 범위다. 일반 EXE에서 부동산 계약 특별 서비스의 해당3단계 그림과 다음 단계 유지 여부를 확인한다.

Full·배포·커밋푸시·사운드 파일은 이번 범위에 포함하지 않는다. 임시 진단 QSP·브라우저 fixture·중복 stage 사본은 정리하고 API의 유일한 실제 QSP 복구 백업, 작은 도구 원본 gzip, 보고서·검사·재현 스크립트를 유지한다.
