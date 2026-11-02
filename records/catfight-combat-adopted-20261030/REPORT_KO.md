# 캣파이트 전투·패배 6컷 WORK 반영

작업 ID: CATFIGHT_COMBAT_ADOPTION_20261030 / catfight-combat-adopted-20261030

사용자 승인: “6컷 WORK 적용·원본 이동”. 대상은 일반 캣파이트 상대 gladiatrix1·2·3의 전투·패배 그림이다. 에게야의 별도 이벤트 전투는 이번 변경 대상이 아니다.

## 반영 내용

승인된 지하 격투장 배경을 사용하는 795×596 불투명 PNG 6개를 WORK와 resources/new에 동일 경로로 반영했다. 기존 전투 3장·패배 2장을 교체하고 없던 gladiatrix1 패배 1장을 추가했다. 무기는 1번 카타나, 2번 검과 방패, 3번 불타는 마법검과 방패로 현재 설정과 맞췄다.

현재 QSP의 jo9_battle_fate가 세 상대의 전투·패배 경로를 이미 연결하므로 QSP 변경은 없다. 초상, 저장값, 등장 조건, 스탯, 개인 사용자 작업은 유지했다.

WORK 카탈로그와 저장소의 portable seed는 각각 자신의 기존 데이터를 기준으로 대상 6행·6슬롯·표시만 갱신했다. 이미지 번호, 비대상 데이터, Mage Edit 프롬프트, 초상 표시, 사용자 플래그와 autoDone을 보존했다. 전체 MOB의 missingDefeat는 12에서 11로 줄었다.

개인 이미지 패치 이력과 일반 이력에 이번 6경로를 각 한 번만 기록했다. 풀 클라이언트 준비용 입력 명세의 기존 5파일 해시를 갱신하고 1파일을 추가했다. 준비 명세는 42,882개에서 42,883개로 늘었으며 ZIP은 만들지 않았다. 배포 폴더 동기화나 커밋·푸시는 수행하지 않았다.

## 원본 보관

원본 보관 폴더: G:/somi/JO9resource/mob_body/catfight_originals_20261030

앞서 보관한 14개에 WORK에만 남아 있던 gladiatrix1 전투 원본을 추가로 이동했다. 해당 파일은 원본을 보관 폴더로 Move-Item한 뒤 검증된 새 파일을 같은 실행 경로로 옮기는 방식으로 교체했다. 원본 바이트·해시를 유지하며 추가 중복 백업은 만들지 않았다. 기존 2·3번의 원본 4장은 이미 보관된 동일 해시 사본을 복구 경로로 사용한다.

옛 14개·23경로 MOVE_JOURNAL은 역사 기록으로 보존하고, 첫 상대의 실제 WORK 원본 이동은 RUNTIME_GLADIATRIX1_MOVE_20261030.json에 별도로 기록했다. 누적 보관 원본은 고유 PNG 15개이며 이 중 고해상도는 6개다. WORK로 연결되는 정션 별칭은 건드리지 않았다.

## 입력·출력과 의존 관계

- 입력: 이전 검토 폴더의 review-manifest.json과 6개 gameReadyPath, 현재 WORK 원본 해시, runtime-original-swap.json, 아카이브 원본 해시.
- 출력: WORK의 content/pic/mob/gladiatrix1·2·3.png 및 content/pic/mob/defeated/gladiatrix1·2·3.png, 동일한 resources/new 추적본, 대상 카탈로그 정보, 개인 이미지 패치 이력, 준비용 입력 명세, 설치 기록.
- 반환: 설치기는 PREFLIGHT_PASS 또는 INSTALLED 요약을 출력하고 installation.json에 경로별 이전·이후 해시와 복구 경로를 기록한다. 같은 설치 ID의 중복 실행은 차단한다.
- 의존성: tools/text-workshop/catalog.cjs의 atomic/parseStatus와 personal-patch.cjs의 record를 재사용한다. 이미지 변경과 카탈로그·패치 이력을 분리해 적용하면 화면과 명세가 어긋날 수 있으므로 이번 기록 전체를 한 작업으로 관리한다.
- 철회 자료: 원본 5장의 beforePath 및 이번 작업 직전 메타데이터 gzip 10개를 설치 기록에 연결했다. 신규 패배 1장은 이전 파일이 없었음을 before:null로 기록했다. 원본과 카탈로그·이력의 시점을 함께 확인해야 한다.

## 검증

최종 검증 결과는 installation.json의 verification, independent-verification.json, live-verification.json, original-archive-final-verification.json을 참조한다. PNG 디코딩·규격·불투명도·해시, WORK와 추적본 일치, 카탈로그/seed/플래그/ID 보존, 원본 복구 가능성, 이력의 중복 여부와 로컬 서버 응답을 확인한다.

설치 약 59초 뒤 로컬 도구의 별도 localhost_image_replace 이벤트가 세프리스 패배 그림을 신규 등록했다. 두 이력의 같은 이벤트 ID, PNG 해시·용량과 해당 카탈로그 행·표시 변화가 일치하므로 이번 설치의 부작용과 구분하고 보존했다. 최초 엄격 비교에서 검출된 차이는 preliminary-independent-verification.json에 남기고, 독립 검증에서 이 특정 동시 변경만 별도 증거로 대조했다. 이번 설치의 6컷 이력은 각 장부에 여전히 한 건이어야 한다. 입력 명세는 이번 승인 범위 6장만 갱신했으며, 계속 편집 중인 다른 그림까지 포함한 최종 전체 빌드 스캔은 별도 작업이다.

QSP는 이전과 같은 해시를 유지한다. 이번 작업은 이미지와 개발용 명세 변경이므로 QSP를 재컴파일하지 않았다. 실제 게임에서 전투를 진행하는 수동 플레이 검증은 이번 반영 검사에 포함하지 않는다.

검토 ZIP과 HTML은 반영 전의 검토 스냅샷으로 보존하고, 이후 반영 사실은 검토 폴더의 WORK_ADOPTION.json에 별도로 연결한다.
