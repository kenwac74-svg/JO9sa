# 아레나 전투·패배 재작화 WORK 반영

2026-10-30. 사용자 “work 적용하고 리스트 갱신” 승인으로 검토한 22종 43 PNG를 같은 경로에 반영했다. 전투22장·패배21장이다. 쌍수 투사E 패배는 검토 단계의 생성 차단으로 기존 PNG를 유지했다.

## 반영 위치

- WORK: `G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/mob/` 및 `defeated/`의 지정43파일
- 추적 소스: `G:/somi/JO9sa/resources/new/`의 같은 상대 경로43파일
- WORK 이미지 체크리스트의 D행43개와 MOB 슬롯43개: 크기·바이트·SHA-256·완료표시·재작화 기록 갱신
- 개인 이미지 패치 원장과 이미지 작업 이력:43파일 이벤트 각1건 추가
- 포터블 seed: 해당43행/슬롯/완료표시만 갱신. 기존부터 WORK와 다른 나머지 행과 ID는 각각 보존
- 풀클라이언트 준비 입력 명세:43파일 해시와 용량, 포함 파일 총용량만 갱신. 풀클라이언트 ZIP은 만들지 않음

현재 Mage Edit 프롬프트, 등장 장소/단체 구성, 초상78개, 보류컷, 안정ID, QSP와 세이브는 변경하지 않았다. 배포 폴더 동기화·커밋·푸시는 하지 않았다.

## 입력·출력과 재현

입력은 `output/arena-combat-redraw-20261030/review-manifest.json`의 승인된795×596 불투명 PNG43개다. `prepare_adoption.py`는 검토본 해시와 현재WORK 기준해시가 모두 같은지 검사하고 승인 입력 manifest를 만든다. 파일명/로케이션/저장 변수를 추가하지 않는다.

`adopt_work.cjs`는 인자 없이 실행하면 읽기 전용 사전 검사만 한다. 명시적인 `--apply`에서 원본과 메타데이터를 백업하고, 승인 PNG와 지정 목록 필드만 갱신한다. 기존 백업 경로가 있으면 덮어쓰지 않고 중단한다. 필요한 모듈은 저장소의 `tools/text-workshop/catalog.cjs`와 `personal-patch.cjs`다. 전체 catalog.update()를 호출하지 않으므로 관계없는 초상/상태를 자동 변경하지 않는다.

출력은 `records/arena-combat-redraw-adopted-20261030/installation.json`이다.43개 원본/최종 해시와 경로, 추적 사본, 백업 위치, 체크리스트 갱신 요약이 포함된다. 검토ZIP/HTML/명세는 당시 검토 스냅샷으로 보존하고, 별도의 `WORK_ADOPTION.json`으로 채택 사실을 기록한다.

## 복구

`G:/somi/JO9_work_backups/arena-combat-redraw-adopted-20261030/`에 교체 직전 PNG와 메타데이터 gzip을 보관했다. 추적본이 WORK 원본과 같은 해시면 한 복구본을 재사용한다. 원본을 되돌릴 때는 installation.json의 각beforePath/추적beforePath를 따라야 한다. 사용자가 이후 수정한 메타데이터를 덮지 않도록 HTML전체 복원 대신 해당43행/슬롯 필드와 개별 이력 이벤트를 대조한다. PNG만 복구하면 게임 그림은 돌아오지만 목록 해시·패치 원장·준비 명세는 따로 맞춰야 한다.

## 검증

`independent-verification.json`은 승인43파일·추적43사본·복구본·795×596/불투명·목록43행/슬롯·두 상태 파일·기존 ID·초상·보류컷·QSP·이력·seed·준비 명세를 독립 대조한다. `live-verification.json`은 현재 로컬 서버에서43 PNG를 직접 받아 최종 해시와43슬롯을 확인한다. 적용/HTTP검사 스크립트의 Node 문법 검사도 수행했다.

이 작업은 이미지 교체와 목록 갱신이다. QSP는 해시가 같으며 새 빌드·전투 분기 수정·실제 게임 플레이 검사를 수행했다고 주장하지 않는다.
