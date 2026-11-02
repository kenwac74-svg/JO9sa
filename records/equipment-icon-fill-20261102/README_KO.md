# 상단 장비 아이콘 보완 및 창녀 복장 이미지 교체 — 2026-11-02

현재 WORK `C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game`에 적용했다.

- 사용자가 지정한 `content/modworkpic/2026-11-02_20-47-51_0bb0865456b6a5df220ecb36ee142eed (1).png`를 `content/pic/scene/item/slut_costume.png`로 바이트 그대로 복사했다. 사용자가 만든 2048×1593 이미지의 구도·해상도를 바꾸지 않았다.
- 상단 소형 아이콘 누락 29개를 `content/pic/ui/legacy_overhaul/clothing bar small/`에 추가했다. 기존에 같은 아이템의 메뉴용 그림이 있는 21개는 그 파일을 재사용했다. 별도 아이콘이 없던 8개는 내장 image_gen으로 새로 그렸다.
- 새로 그린 8개: `slut_dress`, `slut_wig`, `slut_boots`, `underwear_nun`, `wimple_nun`, `rosary_nun`, `heels_nun`, `deprivation_suit`. 생성된 PNG는 원본 그대로 보관하며 게임의 기존 CSS가 26×26으로 표시한다.
- QSP·CSS·JSON 번역·개인 세이브는 수정하지 않았다. 구매/개별 장착/저장 장비 조합의 동작도 변경하지 않았다. 변경 파일은 승인된 이미지 경로 30개뿐이다.

## 검증

- 최신 QSP의 상단 10부위 장착 후보 131행, 고유 아이템 113개를 대조했다. 적용 전 소형 아이콘 누락은 29개였고 적용 후 0개다. 기존 기본 표시 아이콘 12개도 존재했다.
- 적용 파일 30개의 해시가 스테이징과 일치한다. 교체된 세트 이미지는 사용자 원본과 바이트가 일치한다.
- 실제 게임 CSS의 상단 아이콘 규칙을 사용하는 임시 HTTP 미리보기에서 이미지 파일 30개 모두 브라우저 디코딩이 정상이며 소형 아이콘 29개가 모두 26×26으로 표시됐다. 임시 미리보기는 검증 후 종료한다.
- 실제 게임 클라이언트에서 세이브를 열거나 장착 조작을 실행한 검증은 아니다. 게임을 다시 실행하여 집 상단에서 확인할 수 있다.

## 백업과 전달 자료

- 백업: `backups/before-equipment-icon-fill-20261102T120015Z/`. 기존 `slut_costume.png`와 복구 목록 `RESTORE.json`을 보관했다. 추가 아이콘 29개는 적용 전에 없던 파일이다.
- 적용 목록·전후 해시·검증: `manifest.json`.
- 적용 이미지 30개 사본: `files/` 아래에 게임과 같은 상대 경로로 보관했다.
- 신규 그림의 원본 위치: `generated-icons.json`. 제작 프롬프트: `generation-prompts.json`.
- 범위 조사: `coverage-before.json`, `coverage-after.json`; 브라우저 결과: `browser-verification.json`.
- 이번 변경은 커밋·푸시하지 않았다. 번역 작업은 사용자 지시에 따라 중단된 상태이며 다른 담당자의 번역 파일을 수정하지 않았다.
