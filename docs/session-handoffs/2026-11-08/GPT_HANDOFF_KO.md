# 2026-11-08 인계 · Claude 세션 → GPT

이 문서는 2026-11-07~08 Claude 로컬 모딩 세션의 결과를 다음 작업자(GPT/Codex)에게 넘기기 위한 것이다. 작업 규칙은 저장소 [AGENTS.md](../../../AGENTS.md)와 [CLAUDE.md](../../../CLAUDE.md)를 그대로 따른다. 아래의 사용자 확정 사항은 다시 묻지 않는다.

## 1. 현재 기준

- WORK 게임 폴더: `G:\somi\Jack O Nine Tails v2.4_work` (`local.config.json`의 `GameRoot`)
- 현재 WORK `game/jack.qsp` SHA-256: `d4a403b3490f13da7ad4e73e279f8aa138094fcee436e28e902bab30f5676452`
- 이번 세션 시작 시 해시: `46e972bf98bc74cd79176312683e398bf7ae639bc7edeecadfcb6efd9a8f54b9` (11/7 00:00 수정본)
- 이번 세션의 QSP 변경은 아래 3개 mods 뿐이며, 순서대로 해시가 이어진다.

| 순서 | mods | 적용 전 → 적용 후 |
|---|---|---|
| 1 | [2026-11-08_dumak_reward_decay](../../../mods/2026-11-08_dumak_reward_decay.json) | `46e972bf…` → `0bfd80d1…` |
| 2 | [2026-11-08_special_client_journal](../../../mods/2026-11-08_special_client_journal.json) | `0bfd80d1…` → `3de06871…` |
| 3 | [2026-11-08_static_offer_arrays](../../../mods/2026-11-08_static_offer_arrays.json) | `3de06871…` → `d4a403b3…` |

- WORK `CHANGELOG_KO.md`의 `[버그 수정]`에 위 세 변경을 사용자용 문장으로 적었다. Full·배포 ZIP·r4 패키지는 바꾸지 않았다. 다음 정식 패치는 [누적 패치 원칙](../../PACKAGING_POLICY_20261019.md)대로 이 세 mods를 포함해야 한다.
- 게임 내 실제 플레이 확인은 아직 하지 않았다. 사용자가 몰아서 직접 테스트하기로 했다(아래 6절).

## 2. 게임(QSP) 변경

### 2-1. 두막 반복 거래 감액 (DUMAK_REWARD_DECAY_20261108)

- 문제: `interaction_city` 9020~9023. 두막 의뢰는 납품 후 `active[$quest[16]] = 0`으로 돌아가 메뉴 조건 `< 2`가 영원히 참이었다. 정신쇠약 등 시장 최저가(20스파크 근처) 노예를 사서 두막에게 100~300스파크에 파는 차익이 무한 반복됐다.
- 사용자 확정: 회차마다 10% 감액, 하한 20스파크, 영구 누적.
- 구현: 지급식 `dReward` 계산 직후 `master['slaveSoldDumak']`(기존 판매 통계, 기존 세이브 포함) 회수만큼 `×9/10` 정수 내림, 최대 30회, 하한 20. 대사의 금액 표시도 감액값을 따른다.
- 예: 첫 지급 166 → 149 → 134 → 120 → 108 … / 300 → 270 → 243 → 218 → 196 …

### 2-2. 특별 고객 목록 통일 (SPECIAL_CLIENT_JOURNAL_20261108)

사용자 요구: 복합조건(등급만이 아닌 여러 조건) 노예 납품 의뢰는 모두 'Sp. 정말 특별한 고객들' 하위 목록에서 같은 형식으로 보인다. 목록에는 `빈민가 주거구역의 연금술사 두막`처럼 **지역(소속)의 직함 이름**만, 누르면 노파 야기슈나처럼 **그 NPC의 의뢰 대사**가 나온다.

- 등록부: `slave_sell_chek`의 `special_goal_list`/`special_goal_status`/`special_goal_detail`.
- 기존 85개 이름표를 새 형식으로 바꿨다. 원작 `$quest_description[5]` 머리말의 "이름 / 장소" 표기(새하얀 궁전, 중앙행정 첨탑, 불의 성채, 큰까마귀 탑 등)와 각 NPC 메뉴가 속한 `$xxx_options` 묶음(러시아 구역·동부 구역·흑림·후타랜드 등)을 근거로 지었다. 지명·직함은 사용자 검토 대상이다.
- 새로 등록한 11개: Sp. 퀘스트 6·7·8·9·13·14·15·16·17(아라무스, 부셴, 가르시드, 발리오스, 그라쿠스, 가이우스, 바르바르 왕, 두막, 인형술사), Pat. 12 스펙터 경(복합조건 납품), 파멜라의 엘사 의뢰(`npc_progress['elsa'] = 2`). 장면 번호는 각 의뢰 제안 장면(15311~15361, 1541, 1551, 9021, 79101, 30032).
- 상세: 직접 써 넣은 요약 25개를 걷어내고 96개 전부 의뢰 대사 배열을 보여 준다. 상세 제목 = 이름표. 의뢰를 볼 때 저장된 `$jo9_goal_descriptions`/`$quest_description[5]`은 대사 매핑이 없을 때만 대신 쓴다. 파멜라는 대사가 장면 안 `$text[1..3]`라서 그대로 `$jo9_goal_pamela_offer`로 옮겼다.
- `$quest_list` 최상위 목록에서 `Sp.` 퀘스트와 12번을 뺐다(특별 고객 목록에서만 표시).
- 검사: 96개 모두 남성판 대사집에 정의된 배열에 연결, 번호·이름표 중복 없음, 저장소 QA(`check-qsp-line-endings`, `check-qsp-marker-boundaries`) 통과.
- 등록하지 않은 것: 항구 방문(10410)·에로살롱 대회(102102)·사파리(8992)처럼 반복 이벤트나 대회는 의뢰가 아니라서 제외했다.
- 아라무스(아레나 챔피언)·부셴(경주 챔피언)·발리오스·인형술사처럼 조건이 하나뿐인 Sp. 의뢰도 같은 목록의 일관성을 위해 함께 등록했다.

### 2-3. 남성판 의뢰 대사 복구 (STATIC_OFFER_ARRAYS_20261108)

- `#static_txt`의 `$garsid_quest`·`$wujen_quest`·`$aramus_quest` 20줄이 `$garsid_quest[1]<br> = '…'`처럼 대입문 사이에 `<br>`이 끼어 값이 들어가지 않았다. 원본 한국어판(JO9O)부터 있던 손상이다. `<br>`만 제거했다. 대사 내용은 그대로.

## 3. 도구 변경

### 3-1. 대사 편집실: 흐름 전체 각본 출력·각색본 일괄 반영

- 위치: [tools/text-workshop](../../../tools/text-workshop) — `script-export.cjs`(각본 생성, `/api/script`), `script-import.cjs`(각색본 해석·게임 형식 복원, `/api/script/preview`, 반영은 기존 `/api/apply`), `script-export.js`(화면), `script-export.test.cjs`. 사용법은 [README](../../../tools/text-workshop/README.md)의 "흐름 전체 각본 출력"·"각색본 일괄 반영".
- 목적: 컷 단위 번역으로 끊긴 흐름을 AI에게 장면 전체로 각색받는다. 장면→페이지(`[S1-P3]`)→조건부 대체문(`S1-P3-V1`)→장면 문구(`S1-L2`)→선택지·다음 장면을 각본으로 출력하고, 돌려받은 각색본을 번호로 원래 대사에 짝지어 미리보기·승인·백업·mods 기록·되돌리기와 함께 한 번에 저장한다.
- 남성/여성 판본(`#txt_man`/`#txt_woman`, `#npc_base`/`#npc_base_woman`) 선택, 같은 판본 안에서는 마지막 무조건 대입을 기본문으로 쓴다.
- 검증: 현재 QSP 대사 48,428개 전부에서 원문→각본→원문 왕복 100%. 사본 qsp로 출력→각색→빠진 페이지·없는 번호 차단→미리보기→일부 제외→반영→되돌리기(원본 바이트 일치)까지 확인. 실제 WORK qsp에 각색본을 반영한 적은 아직 없다.
- 한계: 정적 분석이라 허브(상점·메뉴)를 거쳐 이어지는 이벤트 간 연결은 펼치지 않는다. 메뉴 UI 문자열 43개는 편집 시 반영이 막힌다(오류로 차단, 잘못 저장하지 않음).

### 3-2. 모드툴 구성 (사용자 확정 2026-11-08)

- 인물 상태 편집기는 "모드툴 열어"에서 제외한다.
- 사운드 청취 목록을 포함한다: [tools/sound-audition](../../../tools/sound-audition) `build.cjs` → `청취_목록.html`. 전투 효과음·몬스터 등장음은 Pixabay 원본 페이지 링크(다운로드 없음), 지역 BGM 12곡은 WORK `content/snd` 원본 WAV를 페이지에서 재생. 이전 PC의 `output/jo9-sound-preview-20261106` MP3 34개는 이 PC에 없다.
- 아이템 리스트는 이 PC에서 파일을 찾지 못해 보류했다.
- `Open-Modding-Tools.ps1`: 출력에 `SoundAudition` 추가, 일반 실행 때 함께 연다.
- `Start-JO9-Tools.ps1`: 이 PC는 대기 소켓을 `FinWait1`·원격 `0.0.0.0:0`으로 보고한다. 포트 소유 검사가 이를 대기 소켓으로 인정하도록 고쳤다(그 전에는 정상 서버도 "editor port does not belong" 오류).
- 문서: [MOD_TOOLS_OPEN_20261021.md](../../modding/MOD_TOOLS_OPEN_20261021.md)에 11/8 결정 기록.

### 3-3. 이미지 체크리스트 씬 조건 재분석

- `tools/scene-image-conditions/generate.cjs`로 QSP `46e972bf…` 기준 재분석해 WORK와 seed 체크리스트에 반영했다. 기존 `install.cjs`는 10/30 백업 경로가 고정이라 쓰지 않고 같은 검사로 직접 설치, 백업은 `G:\somi\JO9_work_backups\scene-image-conditions-20261108\`.
- 이후 QSP가 세 번 바뀌어 체크리스트에 다시 "재분석 필요"가 뜬다. 필요하면 같은 생성기로 재실행한다(설치 스크립트 백업 경로 고정 문제는 그대로).

## 4. 백업 위치

- WORK `game/` 아래 `jack.qsp.bak_20261108_012727`(두막 전), `jack.qsp.bak_20261108_013148`(특별 고객 전), `jack.qsp.bak_20261108_014922`(최종 적용 직전), `jack.qsp.bak_20261108_superseded_sp_group`(폐기한 1차 Sp. 묶음안 적용본).
- 편집실 코드 교체 전: `G:\somi\JO9_work_backups\text-workshop-script-export-20261108\`, `…\text-workshop-script-import-20261108\`.

## 5. 알려진 문제·남은 일

- `tools/apply_mods.ps1`를 `mods/` 전체에 돌리면 무관한 예전 기록 `2026-10-01_robertus_rufus_art_tutor`에서 "old 0번, new 0번"으로 중단한다. 이번 세션은 해당 mods 파일만 담은 임시 폴더(`-ModsDir`)로 적용했다. 전체 적용 경로 정리가 필요하다.
- 저장소에 커밋하지 않은 채 남긴 것: `assets/content/pic/girls/`(168MB)·`scene/item/`·`ui/legacy_overhaul/` 이미지 폴더, `records/` 아래 11/5 작업의 `*.before`·jpg·`recovery/`·txt. 이번 세션 작업이 아니고 저장소에 올릴지 사용자 판단이 필요하다.
- `tools/scene-image-conditions/generation.json`은 임시 경로가 들어간 생성 산출물이라 커밋하지 않았다.
- 원본 데이터 이상(수정하지 않음): `$npc_name['taurus_king']`이 '몰라루 주교'로 되어 있다(원작 표기는 국왕 아르보리우스). 이름표에는 원작 표기를 썼다.

## 6. 사용자 몰아서 테스트할 항목

1. 두막에게 노예를 연속 판매 — 두 번째 지급액이 첫 번째의 약 90%인지.
2. 퀘스트 목록 최상위에 Sp. 줄이 '정말 특별한 고객들' 하나만 남는지. 스펙터 경도 최상위에서 빠지는지.
3. 특별 고객 목록 — 두막·가르시드·인형술사 등이 짧은 이름표로, 누르면 의뢰 대사가 나오는지. 남성판 가르시드·부셴·아라무스 대사가 한국어로 나오는지. 레이디 카리나·바이커처럼 예전 요약이 나오던 항목도 대사로 나오는지.
4. 대사 편집실 각본 출력·각색본 반영을 짧은 씬 하나로 시험하고, 반영 후 게임에서 줄바꿈·색 강조가 유지되는지.
5. 사운드 청취 목록에서 BGM 재생.

이름표 지명·직함은 Claude가 지은 것이라 사용자가 고칠 수 있다. `mods/2026-11-08_special_client_journal.json`을 직접 고치기보다 같은 생성 방식으로 새 mods를 추가하거나, 대사 편집실로 해당 문자열만 수정한다.
