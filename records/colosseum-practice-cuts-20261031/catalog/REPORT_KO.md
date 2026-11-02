# 콜로세움 연습 승패 컷신 목록 등록

WORK와 portable seed 이미지 목록에 practice_master_win.png·practice_master_loss.png·practice_slave_win.png·practice_slave_loss.png 네 항목을 추가하고 최신 WORK QSP·JSON·CSS·scene 목록으로 등장 조건을 다시 분석했다. 주인공 승패는1296, 노예는1297, 조수는1298의 기존 승패 분기에 연결된다. 기존 D행과 조건 블록 외의 HTML은 보존했다.

두 목록의 모든 인라인 JavaScript 문법 검사, 지정4행만 추가됨, 최신 QSP 해시와 네 조건의 interaction_city 직접 연결, 795×596 PNG 치수, QSP·이미지 해시 보존과 기존 안정 ID 보존을 확인했다. 사용자 체크 상태·안정 ID 파일은 쓰지 않았다. Full의 파일이나 메타데이터는 수정하지 않았다. 정적 재현 조건이며 실제 GUI 플레이 검사는 이 하위 작업에 포함하지 않았다.

복구본: G:/somi/JO9_work_backups/colosseum-practice-cuts-20261031/catalog

## 로컬 HTTP 제공 검사

현재3813 서버의 `/catalog` 응답200과31,615행·최신 QSP 해시를 확인했다. 실제 목록이 사용하는 `/api/catalog-asset`을 통해 새 PNG4개 모두200·795×596·runtime 원본 해시 일치를 확인했다. 기존 안정ID는 보존되었으며 검사 작업은 체크 상태·ID 파일을 쓰지 않았다. 일반 `/content/pic` 주소는 이 서버의 공개 이미지 경로가 아니므로 검사에는 실제 카탈로그 API를 사용했다. 상세는 `http-verification.json`에 남겼다.

## 중복 진단자료 정리

전체 scene 분석 metadata.json 사본은 재생성 가능하므로 검증 후 제거했다. 이번4개 경로의 상세 조건·QSP 해시는 generation.json에 남아 있고, 전체 조건은 이미 두 카탈로그 HTML에 포함되어 있다. 생성·적용 스크립트와 검증·HTTP 결과·복구본은 보존했다. 회수 용량은 cleanup.json에 기록했다.
