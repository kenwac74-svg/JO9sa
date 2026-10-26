# 랠리AP·상태설명 수리

입력은현재slave존재/energy/half_action/보유금이며참가메뉴만유효행동력3이상일때활성화한다. 실제소비3은유지한다. #options RALLY_AP_GATE_20261026과$ongload RALLY_AP_STATUS_CACHE_20261026이신규/기존옵션캐시를함께처리한다. 장면이erosalon일때만현재display_options를정정하고다른장소메뉴는보존한다. 새변수·위치는없다.

#static_txt와#txt_woman의상표없음/정신분열/신경쇠약3설명을같은제목/힌트형식으로맞추며게임의복종·정신·회복계산은변경하지않는다. $ongload에서세설명변수만현재문구로갱신한다. 정의만제거하면새화면과로드캐시가불일치하므로두원천과로드블록을함께처리한다.

검사:원본2AP활성RED,후보메뉴3모드각18조건(남녀,반칸,자금,부재)/정의6문구·옛설명캐시/에게야요구비교식관찰,공식구조·개행·주석·정확재생/재적용·엔진9경로PASS. 메뉴helper는진단관측stub이며전체GUI플레이나개인세이브로드검사는아니다.

복구본before.qsp.gz/patch.json과runtime.cjs를보존한다. 정리후node runtime.cjs reproduce→probes로격리진단을복원한다. 엔진은tools/qa/run-client-smoke.ps1,필수출고는release-check.cjs를이용하며출력은입력과분리한G:/Codex/tmp/third-followups-release-20261026에둔다. WORK QSP만변경했으며보호세이브/JSON/Full/설정/원본은해시보존. 미승인제안·연고경계·고객요구치는변경하지않았다.
