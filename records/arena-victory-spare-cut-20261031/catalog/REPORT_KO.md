# 콜로세움 승리 후 상대 생존 컷신 목록 등록

WORK와 portable seed 이미지 목록에 arena_victory_spare.png 한 항목을 추가하고 최신 WORK QSP·JSON·CSS·scene 목록으로 등장 조건을 다시 분석했다. 원본 795×596 PNG의 실제 runtime 복사본을 등록했으며 기존 D행과 조건 블록 외 HTML은 보존했다.

두 목록 인라인 JavaScript 문법, 지정1행만 추가됨, 최신 QSP 해시 및 interaction_city 직접 참조, PNG 치수·파일 해시 보존과 기존 안정 ID 보존을 검사했다. 이 하위 작업은 QSP·이미지·세이브·체크 상태·안정 ID를 쓰지 않았고 Full 메타데이터도 수정하지 않았다. 정적 조건 분석 및 HTTP 제공 검사이며 게임 플레이 검사는 포함하지 않는다. 전체 metadata.json 사본은 검증 후 정리하고 이번 경로 조건은 generation.json에 보존한다.

복구본: G:/somi/JO9_work_backups/arena-victory-spare-cut-20261031/catalog

## 로컬 HTTP 제공 검사

현재3813 서버의 `/catalog` 응답200과최신 목록행수·최신 QSP 해시를 확인했다. 실제 목록이 사용하는 `/api/catalog-asset`을 통해 새 PNG1개 모두200·795×596·runtime 원본 해시 일치를 확인했다. 기존 안정ID는 보존되었으며 검사 작업은 체크 상태·ID 파일을 쓰지 않았다. 일반 `/content/pic` 주소는 이 서버의 공개 이미지 경로가 아니므로 검사에는 실제 카탈로그 API를 사용했다. 상세는 `http-verification.json`에 남겼다.

처형 컷신의 기존 D행은 그대로 유지했다. 최신 QSP에서도 2페이지 별칭 복사 할당을 직접 확인하여, 처형·살려줌 두 경로 모두 일반 승리 1·2페이지와 챔피언 승리 첫 페이지 안내를 보존했다. 두 PNG의 HTTP 200 응답 및 runtime 해시 일치도 재검사했다. 상세: alias-condition-preservation.json.
