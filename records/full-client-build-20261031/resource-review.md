# 배포 입력 독립 리소스 감사 — 2026-10-31

검사 대상: `G:/somi/Jack O Nine Tails v2.4_work/game`. 원본 비교: `G:/somi/JO9O/game`. 이 감사는 읽기 전용이며 WORK·Full·원본을 변경하지 않았다.

## 통합/호환 확인

- 추가 이미지팩 27명 설치 원장의 PNG108+JSON27, 총135파일을 현재 SHA-256과 대조해 전부 일치했다. `records/character-pack-work-install-20261029/installation.json` 기준이다.
- `assets/compatibility-aliases/2026-10-28_fullimage.json`의 기본 전신23개는 원본·호환 사본 양쪽 모두 존재하고 승인 원장의 해시와 같았다. 동일 해시 중복 제거 금지.
- WORK `modtools/ui-resource-aliases.json`의2,694개 old/canonical 쌍은 양쪽 존재·해시 일치했다. 옛 저장 경로 보존을 위해 모두 배포 대상이다.
- `tools/mob-image-sets/group-sets.json`의 단체 패배8종은 전부 현재 존재했다.
- egeya/vatican_paladin/strazhnik/erza 전신, egeya 패배, 여교관 mistress의 characters/mob 양쪽 용도 사본 모두 존재했다.
- 2026-10-29 QSP 실제 엔진 무작위 생성2,400회 검증은 기존 기록이며 이번에 재실행한 것은 아니다. 최신 QSP를 배포하고 팩135파일과 JSON을 함께 포함해야 한다.

## 기존 빌드 계획의 갱신 필요

기존 `full-client-input-plan.json`은 QSP 해시가 현재 `ca4e09ef66c4044e415e2c543d008eeaad7a666df54b314dec0f8d5ef8bb412a`로 갱신됐지만 이미지 목록의 해시·크기는 완전히 최신이 아니다. 포함 파일 중 현재 사라진 경로는0, 크기가 바뀐 경로는30개였다(MOB29개와 `scene/flaccid.png`). 따라서 기존 manifest의 SHA를 그대로 납품 증거로 재사용하지 말고, 현재 WORK에서 새로 해시·목록을 생성해야 한다. 새 파일 탐색과 배포 후 파일별 대조도 필요하다.

기존 포함 계획:42,891파일/16,797,755,986 bytes. 이는 낡은 스냅샷 수치이며 새 빌드 최종 수치가 아니다. 과거 제외계획은 도구·개인설정·작업원본·백업·세이브 등을 합쳐9,166,491,588 bytes를 제외했다. 기존 숫자를 실제 삭제/새 용량절감으로 보고하면 안 된다.

## 삭제 예정5개와 실행 참조 충돌

현재 카탈로그 `delete` 표시는5개이며 모두 실제 WORK에 남아 있다. 이 파일들은 현재 QSP의 실행 참조가 있어 경로를 단순 제외하면 공백이 생긴다.

| 파일(scene 하위) | 현재 실행 근거 | JO9O 대체 가능성 |
|---|---|---|
| event_chestbuster.png | interaction_screen64–65행, type=chestbuster, nsfw=0, txt>2, picMax 난수 | JO9O 원본 있음. WORK와 다른 해시이므로 교체본 내용 제외 후 원본 주소 보존 가능 |
| event_chestbuster_2.png | 위 동일2장 후보 풀 | JO9O 원본 있음. WORK와 다른 해시. 같은 번호로 대체하면 풀 개수 유지 |
| service_erotic_massage_domina.png | interaction_city1351/1432행, service_picture 및 picMax | JO9O와 WORK가 이미 바이트 동일. 원본 복사로 내용 제외가 되지는 않음 |
| service_hairstyle_domina.png | interaction_city1339/1385행 | JO9O와 WORK 바이트 동일 |
| service_style_domina.png | interaction_city1343/1399행 | JO9O와 WORK 바이트 동일 |

JO9O5개는 모두795×596 PNG이며 청크 CRC·IDAT zlib 해제 검사 통과. 정확한 동일 경로에 대체하는 것은 기존 picMax 번호 개수를 바꾸지 않는다. 코드 불변/질문 없이 빌드하려면 서비스3종은 필수 참조 예외로 보존하고 나중 결정 목록에 명시하는 것이 정직하다. 이3종을 '삭제 예정 내용 제외 완료'로 보고할 수는 없다. WORK·원본은 그대로 두고 Full의 예외 처리만 기록해야 한다.

`reserve`271파일/241,413,802 bytes도 이름만으로 제외하지 않는다. 현재 QSP `interior_change`965–1725행에 reserve/bg/DB_BG의 기본+B컷이 다수 직접 등록돼 있다. 사용자 저장의 base주소 또는 수동 전환에 쓰일 수 있어 이번 코드 불변 빌드에서는 유지가 안전하다. 기존 B/C컷, UI 별칭, 저장 호환은 미사용으로 간주하지 않는다.

## 사용자가 공급할 예정인 결과컷5개

현재 WORK에는 다음5개가 모두 없다: `scene/catfdef1.png`, `catdef2.png`, `coldef1.png`, `coldef2.png`, `coldef3.png`. QSP에는 이미 호출이 있다. 새 그림을 자동 제작하지 않는다.

- 캣파이트2개: 직전 코드의 실제 공통 결과컷 `scene/arena_end.png`는 존재(768×576,1,249,413 bytes). 사용자 파일이 오기 전 Full에만 경로별 임시 호환 사본을 두는 근거로 적합하다. `arena_end (2).png`도 존재(795×596)하나 수동 전환용 B컷이므로 임의로 이것을 기본 대체로 선택하는 것보다 실제 직전 기본컷이 근거가 확실하다.
- 콜로세움3개: 분리 전 공통 패배컷 `scene/kikudef.png`가 존재(795×596,964,651 bytes). Full의 임시 경로 사본을 위해 기존 공통 그림을 재사용할 수 있다.
- 이 사본들은 완성된 처형·생존·사망 전용 신규 그림이 아니다. 최종 배포 보고서와 사용자 교체 목록에5경로를 남겨야 한다. WORK/코드/사용자 원본은 바꾸지 않는다.

## 추가 유의점

옛 scene 분석의 미해결26참조에는 slaughter_work2, pope, portal, scene/vatican_paladin/strazhnik, blindfold5–8, 동적 item prefix 및 오기 문장부호 후보가 있다. 일부는 주석·정의부·동적 후보라 현재 실행 누락으로 모두 단정하지 않는다. 최종 배포 리소스 검사는 현재 컴파일 QSP/CSS/JSON과 동적 풀·호환 원장을 함께 사용해야 하며, 단순 파일명 grep만으로 누락을 해결하거나 파일을 제외해서는 안 된다.

권장 납품 증거: 새 manifest의 경로·파일 크기·SHA, Full 단독 실행·현재 QSP와 배포 QSP 대조, 포함된135팩/23호환/2,694 UI별칭/8단체컷 재확인, 제외목록과 참조충돌 예외·임시5사본의 출처 기록. ZIP은 이 감사에서 생성하지 않았다.

## Full 구성 후 독립 인수검토

기본 복사 및 호환9개 추가 뒤 `Kor_Full/BUILD_MANIFEST.json`, 빌드 스크립트, README/ARTWORK_PENDING/FOLLOW_UP를 읽고 실제 Full을 대조했다. 배포본은 변경하지 않았다.

- Full/WORK/QSP manifest 해시가 모두 `ca4e09ef66c4044e415e2c543d008eeaad7a666df54b314dec0f8d5ef8bb412a`로 같았다.
- Full의 추가팩135, 기본전신23개 양쪽, UI별칭2,694쌍, 단체8종을 실제 존재/파일해시로 독립 검증했다. 팩135와 호환23은 승인 원장까지 대조했다. 전부 PASS.
- 삭제 예정 chestbuster2개는 Full=JO9O이고 WORK 교체본과 다른 해시다. 서비스3개는 Full=WORK=JO9O이고 필수예외 결정 기록과 일치한다.
- 결과컷5개는 임시 공통컷 사본으로 manifest 등록돼 있고 각 Full 파일이 등록 해시와 같았다. 대응하는5 WORK 경로에는 여전히 파일이 없어 원본 WORK를 바꾸지 않았음을 확인했다.
- 보완된9경로(pope/portal/vatican_paladin/strazhnik/slaughter_work2/blindfold5–8)는 실제 Full 파일, 선택된 기존 소스, 기록된SHA 및 manifest가 모두 일치했다. 이9개 경로는 WORK에 추가되지 않았다. blindfold5의 원본은 존재하는 `blindfold.png`다.
- 최신 manifest42,914개 런타임 경로의 파일 존재 누락0. 해당 시점 실제 파일42,921개였으며 manifest 밖7개는 생성 문서5개와 깨끗한 엔진 기본 INI2개뿐이었다. TC 세이브 추가 전 검사라 SAV0은 정상이다. 테스트 세이브가 추가되면 별도 검증/manifest가 필요하다.
- 개인 SAV, modtools/modworkpic, 이미지 백업, 중첩 ZIP/7z/rar, 로그/편집원본, 외부링크 혼입은0개였다. 텍스트1174파일에서 흔한 API/서비스키 형식도 발견0개. 이는 알려진 패턴 검사이며 모든 가능한 비밀정보가 없다는 형식적 증명은 아니다. `secretary` 비서복장 폴더는 키/비밀 설정이 아닌 정상 게임 이미지로 판단했다.
- Full의 통합 구성/제외 예외/임시 그림 문서 표기는 실제 구성과 일치한다. 처음부터 미사용을 전수 증명한 것은 아니며, 보수적인 호환 경로 유지·개발 자료 제외 기준으로 검사했다. 실행/세이브 TC의 실제 결과는 루트 담당의 별도 검증 범위다.
