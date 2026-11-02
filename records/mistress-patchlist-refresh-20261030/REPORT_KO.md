# 여교관 이미지 패치리스트 정산 — 2026-10-30

이전 용도 분리 작업에서 MOB manifest와 일반 목록 행은 새 주소였지만, 디스크의 정적 작업번호 캐시에 새 MOB 두 행이 없었다. HTTP 서버는 현재 snapshot으로 작업번호를 동적 제공하므로 이 누락을 기존 열린 탭의 옛 경로 표시 원인이라고 단정하지 않는다. 사용자 요청에 따라 정적 목록·재사용 seed의 준비 상태까지 정산했다.

- 초상: content/pic/mob/mistress_ava.png — MB-0282
- 전신: content/pic/mob/mistress_morrigan.png — MB-0283
- 패배: content/pic/mob/defeated/mistress_morrigan.png — MB-0233

WORK와 seed의 세 슬롯 규격·용량을 실제 PNG에 맞추고 완료 상태로 정산했다. seed의 패배 이미지가 0바이트·todo였던 오래된 표시도 갱신했다. 다른 파일의 체크 상태와 기존 작업번호는 유지했다. 카탈로그 작업번호 JS는 현재 D행/영구 ID를 기준으로 재생성했다. 기존 독립 카탈로그의 CATALOG_WORK_CODES/CATALOG_WORK_UNITS와 현재 브리지의 JO9_WORK_CODES/JO9_WORK_UNITS 이름을 모두 제공한다. 새 ID는 부여하지 않는다.

실제 3813 페이지에서 해당 MOB 카드의 3개 경로가 모두 mob이고 characters 주소가 표시되지 않는 것을 확인했다. 실제 HTTP 작업번호와 정적 파일의 번호가 일치하고 세 슬롯 모두 done 상태다. 브라우저 JS 오류0개, 운영 이미지 apply0회, QSP·양쪽 용도의 이미지 해시 보존을 확인했다. 게임 파일·세이브·배포 폴더·ZIP·커밋·푸시는 수정하지 않았다.

update.cjs의 입력은 현재 카탈로그 D행·MOB manifest·영구 작업번호 JSON·상태와 해당 PNG3개이다. 출력은 WORK/seed 카탈로그 HTML, 필요한 상태 파일 및 catalog_work_codes.js이다. --apply 없이는 검사만 한다. --apply는 현재 데이터를 다시 읽어 불일치 시 중단하고, 교체 전에 기존 metadata를 압축 백업한다. 새로운 서버/API/게임 의존성은 없다.

복구 자료는 G:/somi/JO9_work_backups/mistress-patchlist-refresh-20261030이다. 원본 경로·SHA는 installation.json에 기록했다. 이후 사용자 편집을 보존하기 위해 현재 해시를 먼저 비교하고 이번 metadata 변경만 역적용한다. QSP나 이미지 파일을 되돌릴 필요는 없다. 일반 목록 전체의 게임 연결을 다시 검증한 작업은 아니며 이번 세 슬롯의 표시·준비 상태 검증이다.
