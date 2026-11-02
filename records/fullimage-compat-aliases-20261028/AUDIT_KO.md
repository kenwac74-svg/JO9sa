# 기본 전신 호환사본 23개 — 독립 읽기 전용 감사

기준 WORK SHA-256: `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`.

현재 WORK JSON과 이전 `bug-batch-20261028/portraits/missing-fullimage-audit.json`을 다시 대조했다. **기본 fullimage 누락 23건과 각 indpack_title 경로가 기존 목록과 정확히 일치한다. 승인된 바이트 복사 계획에서 경로 충돌은 찾지 못했다.**

## 대상과 원본 확인

- 기본 경로: 23개 모두 현재 PNG 미존재.
- 대응 title: 23개 모두 PNG 서명과 청크 CRC 및 IEND 경계 정상, 규격 795×596.
- 대소문자를 무시한 추가 대상 경로: 23개 모두 고유.
- 다른 slaves JSON이 같은 대상 fullimage 경로를 사용하는 경우: 0개.
- title 누락·비PNG·기존 대상 파일 충돌: 0개.
- 저장소 `resources/new/content/pic/` 및 `staging/pic/`의 같은 대상 경로에 기존 파일이 있는 경우도 0개였다.
- 추가 PNG 총량: 4,213,447바이트, 약 4.018MiB. 새 그림 제작이나 재인코딩 없이 원본 title 바이트를 복사하는 범위다.

대상 JSON 번호는 1015, 1039, 1063, 1064, 1065, 1086, 1110, 1132, 1156, 1172, 1190, 1205, 1224, 1237, 1258, 2057, 2076, 2095, 2118, 2134, 2154, 2171, 2181이다.

각 사본의 원본은 해당 JSON의 `indpack_title + '.png'`, 추가 경로는 같은 JSON의 `fullimage + '.png'`이며 두 값 앞에 `content/pic/`을 붙인다. 파일명을 추정하거나 같은 ID의 다른 root 후보를 고르지 않는다. 예를 들어1064는 정상 title을 `girls/full/1064_blue_long_young.png` 호환 주소로 복사하는 범위다.

`fullmade`, `fullsecretary`, `fullmistress`, 다른 indpack 의상 경로는 이 승인 범위에 포함되지 않는다. 기본 title을 의상 파일의 대용으로 넣지 않는다. QSP·JSON·인물 캐시·머리 특성 추론 문자열·SAV를 변경할 필요가 없다.

현재 안개/대회 코드에는 title resolver 우회가 이미 존재한다. 이번 작업은 확정된 기본 파일 경로 불일치를 보완하는 것이며, 제보 당시의 화면 증상 전체를 현재 엔진에서 재현했다는 뜻은 아니다.

## 기존 도구와 기록 선례

가장 직접적인 선례:

- `G:/somi/JO9sa/tools/add-girls-path-compatibility-20261026.py`
- `G:/somi/JO9sa/records/girls-image-path-fix-20261026/compatibility.json`

이전 작업은15개의 기존 주소에 바이트 동일 PNG 별칭을 추가하고 JSON 필드·source·compatibility 경로·SHA-256·기존 존재 여부를 기록했다. 도구는 배타적 생성(`xb`), 다른 내용의 기존 이미지 덮어쓰기 거부, 복사 후 해시 검증 패턴을 사용한다.

**그 도구를 이번23개 작업에 그대로 실행하지 않는다.** 당시 JSON 수정 기록과 대상15개가 하드코딩되어 있고, 기본 실행도 이전 compatibility.json을 쓴다. 이번 작업에서는 안전 패턴과 기록 형식만 참고하고 과거15개 기록을 보존한다.

저장소 내 관련 위치:

- `docs/modding/GIRLS_DECISIONS_AND_BACKLOG_20261026.md:7`: 캐릭터 ID별 경로를 유지하며 승인된 재사용의 원본/사본 SHA-256을 기록하는 원칙.
- `resources/new/content/pic/girls/full/`: 기존 신규/추가 PNG 자료의 경로 관례. 이번 파일을 저장소에 보존할 차례가 승인되면 같은 runtime 상대경로를 사용할 수 있다.
- `assets/runtime-source-20261026.json`: runtimePath·repositoryPath·bytes·sha256의 출처 대조 형식 선례. 날짜가 붙은 기존 스냅샷이므로 이번 기록을 대신하거나 과거 값을 덮어쓰는 용도로 사용하지 않는다.

이번 작업의 원본/추가 관계는 우선 현재 작업 폴더의 별도 manifest와 설명서에 기록하는 것이 적절하다. 이후 저장소 기록이 승인되면 `records/fullimage-compat-aliases-20261028/` 같은 새 작업별 위치에 보관하고, 과거 compatibility.json과 구분한다. 이번 독립 감사에서는 저장소 파일을 쓰지 않았다.

## manifest와 유지보수 설명에 필요한 항목

각 항목에 다음을 명시하도록 권고한다.

1. 해당 JSON 파일·ID·필드 `fullimage`, 현재 기본 별칭 문자열.
2. 원본 title runtime 상대경로와 추가 alias runtime 상대경로.
3. 원본과 사본의 SHA-256·바이트 수·PNG 규격, 생성 직전 대상 미존재 여부.
4. 용도: 기존 기본 이미지 주소를 유지하기 위한 resource compatibility alias이며, 추가 시점에 원본과 바이트 동일한 의도적 중복이라는 사실.
5. QSP/JSON/SAV/원본 PNG 무변경, 의상 경로 제외, 새 artwork 및 이미지 변환 없음.
6. 복사 전후 원본 해시 보존과 사본 해시 일치, 실제 추가 경로 수23 및 허용 범위 밖 파일 무변경 결과.

향후 변경·삭제 주의도 함께 기록해야 한다.

- 일반 파일 복사본은 이후 title 변경을 자동으로 따라가지 않는다. title 또는 alias를 새 그림으로 바꿀 때 원본/추가 관계와 현재 해시를 다시 확인한다.
- 이후 사용자가 alias 이미지를 직접 수정했으면 과거 manifest의 해시를 이유로 자동 덮어쓰지 않는다. 새 작업에서 달라진 파일을 확인하고 갱신 범위를 결정한다.
- 동일 해시라는 사실만으로 alias를 중복 정리 대상으로 삭제하지 않는다. 현재 JSON의 기본 주소와 기존 인물/세이브의 저장 문자열이 의존할 수 있다.
- 삭제·이름 변경 전에는 해당 주소의 JSON/QSP/동적 참조와 사용하는 구 세이브의 호환 필요를 확인한다. 원본 title이나 다른 이름의 유일한 이미지 자료를 함께 이동·삭제하지 않는다.
- 이전15개 호환사본과 이번23개는 별도의 승인·출처 기록이며, 서로의 목록이나 해시를 합쳐 덮어쓰지 않는다.

## 감사 범위와 한계

파일·JSON·현재 QSP 해시·PNG 무결성·기존 기록/도구를 읽기 전용으로 검사했다. 엔진·실제 화면·세이브 실행은 하지 않았다. 제품·G:·원본·기존 SAV는 쓰지 않았고 이 감사 문서만 저장했다. root가 작성할 실제 manifest와 복사 결과는 후속 독립 검토 대상이다.
