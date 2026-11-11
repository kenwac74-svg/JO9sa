# 홈컴 인수인계 — 2026-10-13

## 기준과 전달 범위

- 이어갈 브랜치: `codex/modding-tools-transfer-20261009`
- 게임 기능·설정 보완 기준 커밋: `144ca1d51f41e54869d5340cf26a10b980dd9f15`. 이 인수인계와 최신 관리 snapshot을 담는 후속 커밋까지 pull한다.
- 노트북 실제 PLAY: `C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game\jack.qsp`
- 현재 QSP: 248 location, SHA-256 `a9e6e3b77aabe16c8177e519f6d0c56960ef87bcdfee38802242244e8ce026c9`.
- Git 작업 저장소: `C:\Users\Ken Choung\.codex\worktrees\modding-tools-transfer\JO9sa`. 옛 detached `6f86\JO9sa`는 작업용 tmp만 사용했으며 이전 코드로 돌아가지 않는다.
- 사용자가 이미지는 직접 이동한다. 에이전트가 이미지 패킹·복사·Drive 전체 대조를 하지 않는다.
- 최신 QSP 복원본: `backups/JO9_home_checkpoint_20261013.zip`. QSP·현재 CSS 2개·메뉴/인덱스 JSON 3개·프리렌/센세 정의 2개·해시 기록만 포함. 이미지/EXE/세이브/보호키/PC 경로 설정 없음. 정확한 크기와 파일별 해시는 `docs/checkpoints/home_transfer_20261013.json`.
- 체크리스트/작업 번호/진행 이력은 `tools/local-workspace/catalog-seed`. 제공자·모델 설정은 `tools/local-workspace/settings-seed`; API 키는 포함하지 않는다.

## 홈컴에서 이어가는 순서

1. 기존 홈컴 저장소에서 `git status --short`를 먼저 확인한다. 미커밋 변경이나 이 문서보다 새 작업이 있으면 덮어쓰지 말고 차이를 확인한다.
2. `git fetch origin` → `git switch codex/modding-tools-transfer-20261009` → `git pull --ff-only origin codex/modding-tools-transfer-20261009`. 브랜치가 로컬에 없을 때만 `git switch --track origin/codex/modding-tools-transfer-20261009`. 옛 main 또는 다른 브랜치에 강제 reset하지 않는다.
3. 사용자가 홈컴의 실제 PLAY `game` 폴더와 순정 비교용 폴더를 지정한다. 노트북의 C/G 드라이브 경로를 그대로 쓰지 않는다. 순정 폴더는 변경하지 않는다.
4. 게임을 완전히 종료한 상태에서 checkpoint ZIP을 별도 임시 폴더에 풀고, 해시 기록을 확인한다. `game/` 아래 8개 명시 파일을 지정한 PLAY 폴더의 같은 상대 경로로 복사한다. 기존 홈컴 QSP가 더 새 버전이면 먼저 비교한다. PC별 config.xml 및 EXE/DLL은 교체하지 않는다. 이미지·세이브는 사용자가 따로 옮긴다.
5. 복사 후 PLAY `jack.qsp` 해시가 위 값인지 확인한다. 이 완성 QSP에는 과거 패치까지 포함되어 있으므로 vanilla에 모든 `mods`를 처음부터 재적용하거나 qsrc로 재빌드하지 않는다. 과거 전체 모음에는 이미 알려진 충돌이 있어 무작정 전체 재적용하면 안 된다.
6. 홈컴의 `tools/local-workspace/local.config.json` 또는 실행기에 실제 경로를 설정한다. 기존 홈컴 카탈로그가 있다면 최신 seed를 명시적으로 동기화한다. 첫 실행 seed 자동 복사는 기존 체크 상태를 갱신하지 않는다. 아래 명령은 관리 파일만 읽고 이미지 파일을 스캔하거나 복사하지 않는다.

```powershell
python tools/local-workspace/sync-workspace-state.py --source tools/local-workspace/catalog-seed --catalog "<홈컴 카탈로그 폴더>" --game "<홈컴 PLAY game 폴더>" --original "<홈컴 순정 game 폴더>"
```

7. `tools/local-workspace/Open-JO9-Tools.cmd`를 실행한다. 경로를 다시 지정하려면 `Start-JO9-Tools.ps1 -Configure`. 최신 편집기 소스를 실제 PLAY `modtools/text-workshop`에 동기화하는 기존 실행기를 사용한다. 다른 게임을 쓰는 서버를 임의 종료하지 않는다.
8. Codex 내부 브라우저에서 대사편집기 `http://127.0.0.1:3813/`, 이미지 체크리스트 `/catalog`, 이미지워크샵 `http://127.0.0.1:5269/`, Mage, Gamma 도구창을 연다. 외부 로그인·Kindroid/API 보호키는 홈컴에서 직접 확인한다. 노트북 PID·토큰·로그를 가져오지 않는다. 현재 이미지 제공자는 OpenRouter/model `x-ai/grok-4.6`, 대사는 Kindroid이며 캐릭터 ID는 settings-seed에 보존되어 있다. 기존 홈컴 설정은 실행기가 자동 덮어쓰지 않으므로 설정 화면에서 seed와 맞는지 확인하되 API 키는 유지한다.
9. 대사편집기에서 `#nwtx` 검색: 현재 206개가 모두 표시되어야 한다. 일반 검색은 기존 200개 제한 유지, 이 표식만 전체 반환. 결과 본문에서는 HTML 주석 표식이 보이지 않는다.
10. 실제 게임 실행과 화면 확인은 사용자에게 요청한다. 대량 복사·이미지 전체 검증은 사용자가 하며, 이전 JO9WORK의 2,911개 파일을 하나씩 확인하는 작업을 다시 수행하지 않는다.

## 완료한 작업과 남은 확인

### STOCK/관계 문제 — 사용자 실제 엔진 확인 완료

- `get_stock_seed`가 SLAVE를 덮어쓰던 메타데이터 혼용 수정; STOCK에 기록.
- demo/special 생성 흐름과 난수 호출 유지, ID 0끼리 허위 친족 판정 방지, 전용 관계 대사 보존.
- CRLF 누락 후속 복구 포함. 사용자가 진단 1·2·3을 “전부 정상”으로 확인했다.
- 기존 세이브의 잘못된 과거 ID를 소급 복구한 것은 아니다.
- 기록: `records/rm/stock_relations_patch_20261013.json`; mod 2개는 `2026-10-13_stock_metadata_and_origin_relations.json`, `2026-10-13_z_stock_relations_crlf_repair.json`.
- `RM_TEST_*.sav`는 진단용이다. 일반 플레이 세이브로 사용하지 않는다. 과거 크래시가 난 전체화면/CLEAR 진단을 복원하지 않는다.

### RM 설명 보완 — 적용/정적 검사 완료, 게임 화면은 사용자 확인 대기

- 러시아 구역·후타랜드 평판 단계 안내 12개, 마리안나 약국 상품 설명 4페이지/메뉴.
- 프리렌(ID 1926319775)·센세(ID 1395836363) 서로 인식하는 문장.
- 미완료 엘사 훈련 재안내 2페이지, 고블린 의뢰 조건 요약 2페이지.
- 가격·보상·인수 조건·퀘스트 진도·능력치 변경 없음. 이미 번역된 기존 크리스마스/캣파이트 대사는 유지.
- 기록: `records/rm/dialogue_info_20261013.json`; mod `2026-10-13_zz_rm_dialogue_info.json`.

### 우측 참고 정보 폰트 — 적용/정적 검사 완료, 화면 확인 대기

- 동화의 숲 기준 본문 20px, 행간 25px. 본문 바인딩 30개/renderer 17 location에 범위 제한 규칙 적용.
- 제목·좌표·크기·그림 변경 없음. QSP HTML에서만 적용.
- 기록: `records/ui/reference_description_font_20261013.json`; mod `2026-10-13_zzz_reference_description_font_20px.json`.

### 설정 보완 및 #nwtx — 게임 적용/편집기 검색 확인 완료

- 빈 NPC 소개 33개와 부족한 NPC/장소 설명 16개를 기존 설정과 이벤트로 보완.
- 이전 참고 정보 135개와 RM 작성분 22개까지 숨김 `<!-- #nwtx -->` 표시, 총 206개.
- `jo9_reference_info_revision = 2`; 기존 세이브는 다음 화면 이동 때 빈 값 또는 알려진 이전 기본 문장만 갱신한다. 사용자 수정 설명은 보존.
- 아소기 시민 12명은 개별 설정·대사 근거가 확인되지 않아 새 개인사를 지어내지 않았다. 기록의 `not_expanded`와 `sourceEvidence`를 먼저 확인한다.
- 이전 원문이나 단순 서식 변경까지 신규 작성분으로 표시하지 않는다. 이후 보완 문장에도 같은 표식을 사용한다.
- 편집기 `server.cjs` 및 `index.html`: #nwtx 전체 검색과 정확한 개수 안내 적용, 실제 내부 브라우저 206개/본문 표식 비노출 확인.
- 기록: `records/reference-info/2026-10-13_reference_supplements_nwtx.json`; mod `2026-10-13_zzzz_reference_supplements_nwtx.json`.
- 실제 게임 코셰이/데티네츠 소개에서 문장이 나오고 표식이 보이지 않는지는 사용자 확인 필요.

## 다음 작업과 주의사항

- 먼저 사용자에게 위 미확인 화면만 확인받고, 확인되지 않은 것을 완료로 표시하지 않는다.
- RM 후보: Egeya 요구 블록의 `demand['min_exotic'] > 0`는 대입이 아니라 비교다. 별도 시스템 문제 후보로 기록되어 있을 뿐, 이번 대사 보완에서 수정하지 않았다. 실제 흐름과 의도부터 확인한다.
- 코셰이 첫 방문 회색 메뉴: 사용자가 바바야가 의뢰 미완료라고 답했다. 기존 선행 조건을 충족하지 않은 상태로 확인됐으며 출입 조건을 강제로 해제하지 않는다.
- 아마란스 여자 한 명 20스파크 장면: `scene/VIP/salononeg01.png`, `salononeg02.png`. 단체 장면: `salongroup01.png`, `salongroup02.png`. 해당 이미지는 사용자 직접 이동 범위에 포함되는지 확인한다. 원치 않는 service_tattoo_fiend 잔류 문제와 두 페이지 고유 화면 수정 기록은 `records/salon-pages`에 있다.
- Voland는 사용자가 완료했다고 확인한 작업이다. 미완료로 되돌리지 않는다.
- 이미지 파일명 대소문자를 구분하고 Windows 복사 이름 `(2)`, `(3)` 규칙 유지. 보관 선택된 원본은 B컷 연결 규칙, 기존 B컷 편집은 원본이 아닌 해당 numbered 파일을 대상으로 한다.
- .qsrc 재빌드 금지, QSP 왕복 검증·명시적 백업 후 선언형 mods로 수정. 실행 줄 CRLF 검사 필수.
- 사용자 컴퓨터 이동 시 항상 커밋·푸시·원격 ref 확인, 브랜치/커밋 보고. 새 이미지는 Git에 일괄 추가하지 않는다.

## 확인 명령과 복구 지점

```powershell
node tools/qa/test-reference-nwtx.cjs "<PLAY game 폴더>/jack.qsp" .
node tools/qa/test-rm-dialogue-info.cjs "<PLAY game 폴더>/jack.qsp" .
```

- #nwtx 검사 8개 + 기존 STOCK/RM 회귀 15개 통과. QSP byte roundtrip 및 신규 코드 CRLF/구문, 적용본/후보 일치, 같은 mod 재적용 무변경 확인.
- 최신 상태는 이 문서의 최종 QSP checkpoint ZIP. 롤백용은 아래 날짜별 ZIP이며 최신으로 오인하지 않는다.
- STOCK 수정 전: `backups/jack_pre_stock_relations_20261013_000445.zip`, 기록 `docs/checkpoints/stock_relations_before_20261013_000445.json`에 정확한 복구 해시가 기록되어 있다.
- RM 설명 전: `backups/jack_pre_rm_dialogue_20261013_010118.zip`, 기록 `docs/checkpoints/rm_dialogue_before_20261013_010118.json`.
- 폰트 통일 전: `backups/jack_pre_reference_font_20261013_012121.zip`, 기록 `docs/checkpoints/reference_font_before_20261013_012121.json`.
- #nwtx 전: `backups/jack_pre_reference_nwtx_20261013_014317.zip`, 기록 `docs/checkpoints/reference_nwtx_before_20261013_014317.json` (편집기 변경 전 파일도 포함).

## 홈컴에서 새 채팅에 붙여넣을 문장

> JO9sa의 codex/modding-tools-transfer-20261009 최신 커밋을 받아 docs/modding/HOME_HANDOFF_2026-10-13.md부터 읽고 이어가. 이미지는 내가 직접 옮긴다. 최신 QSP는 backups/JO9_home_checkpoint_20261013.zip이고 해시는 문서에 있다. 실제 홈컴 PLAY/순정 경로를 확인한 뒤 QSP·도구·체크리스트 설정만 맞춰라. 이미지 전체 검사와 Drive 대량 복사를 하지 말고 사람이 더 쉽게 하는 일은 먼저 나에게 요청해. 게임 화면 확인은 내가 한다.

## 추가 전달 — 오늘 이미지와 QSP 통합 ZIP

- 사용자 후속 요청으로 10월12일 00:00부터 10월13일 02:56:11(KST)까지의 최종 교체 이미지 49개와 직접 지정한 아마란스 4컷을 포함해 53개를 묶었다. 같은 파일의 중간 수정본은 제외.
- 공유 위치: `G:\내 드라이브\Moding\JO9_오늘작업_이미지_QSP_20261013_025611.zip`
- ZIP 약 15.33MiB. 최신 QSP·CSS·명시 JSON 8개, 작은 대조 카탈로그도 포함. 이번 통합 ZIP을 적용하면 위 이미지 없는 checkpoint ZIP을 다시 적용할 필요 없음. 도구/관리 상태는 Git 최신 seed를 사용한다.
- 원본이 없는 신규 B컷 2개는 카탈로그에서 비교 원본 없음으로 표시. 나머지는 직전 작업본 또는 순정 비교 기준을 표시했다. 다른 이미지팩의 파일은 포함하지 않았다.
- ZIP은 사용자 지정 Drive 폴더로 전달, Git에는 images ZIP 대신 파일별 해시/작업 시각/선별 근거 기록을 남겼다: `records/transfers/2026-10-13_daily_images_qsp.json`.
