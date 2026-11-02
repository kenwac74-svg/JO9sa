# 캐릭터 번역·설정 검토 — 2026-11-02

최신 상태: 아래 최초 검토의 말투 11그룹은 사용자 승인 후 43문구를 적용했다. 이후 루미너스 3002는 사용자 개별 지시에 따라 설명 3개를 비존대로 변경했다. 일반 대화용 비존대 예외는 기록 후 보류하며 다음 대사·말투 작업 및 PC 인수인계 때 상기한다. 추가 3그룹도 담담한 존대 시안 승인 후 21문구를 적용했다. 펠리시티 조사 자료와 15인물 수동 수정란은 CHARACTER_SETTINGS_MANUAL_20261102.txt에 있다. 아래 표는 최초 검토안의 기록이며 최신 반영문은 수동 조정 문서를 참고한다.

작업 폴더: `C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game`. 아래 적용 완료와 컨펌 대기를 구분한다. 실제 게임 화면/기존 세이브를 열어 검증한 결과는 아니다.

## 적용 완료

- JSON 호칭 `여주인님` 52회와 QSP 표시 문구의 해당 호칭을 `주인님`으로 통일했다. 제삼자 직책인 여주인 등은 유지했다. 복수 호칭은 주인님들로 정리하고, 호칭 혼동을 묻던 연결 대사는 새 소유 관계를 묻도록 자연스럽게 정리했다.
- 엘자 2624의 세계·가족·직업 설명 3개를 독립성과 자부심을 유지하는 격식체로 수정했다. 직업 설명 마지막은 사용자가 직접 제시한 생존·협조·굴복 거부 각색이다.
- 수정 전 한국어 17문구에 정확히 일치하는 표시 대응을 추가했다. 저장 파일 자체와 캐릭터 상태를 바꾸지 않는다.
- 고정 이름이 있는 숫자 JSON 25개에 영문명을 붙였다. JSON 41개/QSP 1개를 선별 적용했고, JSON 총수 1,153개와 번호 중복 0개를 확인했다.

엘자의 적용 직업 설명:

> 내 별명은 '요정 여왕 엘자'입니다. 무슨 뜻인지 알겠습니까? 나는 기사라고요. 내 갑옷은 돌보다 단단하고, 온갖 무기를 능숙하게 다룰 줄 압니다. 다른 세계에 와서도 훈련하고 실력을 갈고닦고 싶습니다. 언젠가는 여길 벗어날 방법도 찾아낼 거고! 내 의지는 흔들리지 않을 겁니다. 이곳에서 살아남아 벗어나기 위해 당신을 따르겠지만, 나는 냉철하고 강한 사람이니 절대 굴복하지는 않을 겁니다!

## 최초 말투 검토안 — 이후 승인·반영된 11그룹 / 12파일

아래 제안은 최초 검토 문장이며 현재는 이 방향의 1차 말투 수정이 적용됐다. 신분·태도는 유지하면서 반말을 격식 있는 강경한 말투로 바꾸는 방향이다. 원문 영어에 한국어 존대 규칙이 명시된 것은 아니다. 라나는 권력자의 딸이며 실제 왕족으로 확정하지 않는다.

| 번호·이름 | 근거 | 현재 대표 문장 | 제안 대표 문장 |
|---|---|---|---|
| 2610 바실리사 | 공주라고 명시하며 가문과 신분을 내세움 | 난 공주야! 그게 무슨 뜻인지 알아?! | 나는 공주입니다. 그게 무슨 뜻인지 알겠습니까?! |
| 2620 라나 | 권력자의 딸이며 스스로 공주 대우를 요구. 실제 왕족인지는 확정 불가 | 하지만 먼저 이 한심한 작은 세계의 공주에게 걸맞게 나를 대하는 법부터 배우도록 해! | 하지만 먼저 이 한심한 작은 세계의 공주에게 걸맞게 나를 대하는 법부터 배우셔야겠습니다! |
| 3002 루미너스 | 제국 지배자·뱀파이어 지배자·오래된 마왕이라고 명시 | 이 세계의 마법을 가르쳐 다오! | 이 세계의 마법을 가르쳐 주십시오! |
| 3006 프레이야 | 강력한 여신이라고 자칭하며 경의를 요구하고 자신의 결정권을 주장 | 무엇을 할지는 내가 정한다! | 무엇을 할지는 내가 정하겠습니다! |
| 3010 리아스 | 지옥의 공주·강력한 악마 가문 후계자이며 상대가 자신을 모셔도 된다고 말함 | 난 하고 싶은 건 뭐든 할 거야... | 나는 내가 하고 싶은 일을 하겠습니다... |
| 3021 디아나 | 아마존 공주이며 여왕의 딸. 노예로 굴복하기를 명시적으로 거부 | 아마존은 절대 굴복하지 않아... | 아마존은 절대 굴복하지 않습니다... |
| 3023 이리스 | 제1왕녀·왕위 계승자·기사단장. 가족 구출을 조건으로 협조 의사를 밝힘 | 여동생을 찾는 데 도와준다면 훨씬 협조적으로 대하겠어! | 여동생을 찾는 데 도와주신다면 훨씬 협조적으로 대하겠습니다! |
| 2577·2585 펠라게야 | 높은 신분 근거는 없음. 상대를 강하게 비난하고 호의를 받을 자격부터 요구하는 적대적 상태 | 먼저 그럴 자격부터 얻어. | 먼저 그럴 자격부터 얻으셔야겠습니다. |
| 2579 에게야 | 인생 절반을 투기장에서 보낸 전사이며 다시 노예가 된 책임을 상대에게 돌림. 최상위 강자라고 단정하지 않음 | 그런데 네 덕분에 다시 아무것도 아닌 신세가 됐네... | 그런데 당신 덕분에 다시 아무것도 아닌 신세가 됐군요... |
| 2621 캬루 | 스스로 츤데레라고 명시. 사생활 침범을 거부하고 상호 호의를 조건으로 제시 | 내 사생활을 캐물을 생각도 하지 마! | 내 사생활을 캐물을 생각은 하지 마십시오! |
| 3012 에키드나 | 탐욕의 마녀. 세상 모든 것이 자기 것이어야 한다고 주장하고 방대한 지식을 자부. 왕족 근거는 없음 | 세상 모든 것은 내 것이어야 해. | 세상 모든 것은 내 것이어야 합니다. |

이미 존대인 엘사·자스민·알베도·샤크티·시노부·입실론·위즈·요르하·마유미·힐다·알렉시아·검의 처녀는 현재 태도를 유지한다. 신분만 보고 오만함을 추가하지 않았다. 펠라게야 2607의 순종 상태는 2577/2585의 적대적 상태와 별개다.

추가 말투 판단 대상이었던 프리렌 2623, 마르셀리나 2580/2608, 베네라 2584는 담담한 존대 시안을 제시한 뒤 사용자 승인에 따라 21문구를 적용했다.

## 도나도나 출신 — 23명 전원 수동 번역·설정·컨펌 필요

21명은 `dohna_tag`, 조커 8885와 사나 8897은 쿨라 상점 메뉴/생성 코드로 소속을 확인했다. 조커는 나유타 멤버 메뉴에서 이벤트 6244 → `special_stock=8885`, 사나는 히토카리 의뢰 메뉴에서 이벤트 6255 → `special_stock=8897`로 연결된다. 근거: #options 4185/4335, interaction_city 12002/12209, json/menu_item.json 2285/2296.

이 그룹은 설명이 자리표시자이거나 필드가 없다. 임의로 설정을 추가하지 않았다. 수동 원고 또는 설정 지침을 받은 뒤 번역·컨펌하여 적용한다.

| 번호·이름 | 실제 JSON 파일 | 현재 설명 상태 |
|---|---|---|
| 8877 메디코 | [8877_medico.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8877_medico.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8878 포르노 | [8878_porno.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8878_porno.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8879 키라키라 | [8879_kirakira.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8879_kirakira.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8880 츠이나 | [8880_tsuina.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8880_tsuina.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8881 야미 | [8881_yammy.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8881_yammy.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8882 안테나 | [8882_antenna.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8882_antenna.json>) | 필드 없음 / 필드 없음 / 필드 없음 |
| 8883 아리스 | [8883_alyce.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8883_alyce.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8884 미스트레스 | [8884_mist.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8884_mist.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8885 조커 | [8885_joker.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8885_joker.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8886 이누이 | [8886_Inui.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8886_Inui.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8887 시온 | [8887_zion.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8887_zion.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8888 린 | [8888_rin.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8888_rin.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8889 키쿠치요 | [8889_kikuchiyo.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8889_kikuchiyo.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8890 리리에 | [8890_Ririe.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8890_Ririe.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8891 쿄카 | [8891_Kyoka.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8891_Kyoka.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8892 노에루 | [8892_Noelle.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8892_Noelle.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8893 미루키 | [8893_Miruki.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8893_Miruki.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8894 타마키 | [8894_Tamaki.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8894_Tamaki.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8895 치하루 | [8895_Chiharu.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8895_Chiharu.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8896 후미 | [8896_Fumi.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8896_Fumi.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8897 사나 | [8897_Sana.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8897_Sana.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8898 나나미 | [8898_Nanami.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8898_Nanami.json>) | 자리표시자 / 자리표시자 / 자리표시자 |
| 8899 슈코 | [8899_Shuko.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/8899_Shuko.json>) | 자리표시자 / 자리표시자 / 자리표시자 |

## 그 밖의 수동 번역·설정·컨펌 필요 — 7명

| 번호·이름 | 부족하거나 확인할 내용 |
|---|---|
| 1448 시루 | 사용자 지정 이름·외형이 고정된 일반 무작위 프리셋. 전용 획득/일반 생성 제외는 미구현. 세 배경 설명 필드 모두 없음. 유니크 스폰으로 분류하지 않음. |
| 2572 펠리시티 | 세계 설명은 공주라는 신분만 제시하고 가족 설명은 아버지의 지위만 제시; 직업 설명 없음. |
| 2573 빌헬미네 | 세계·가족 설명은 있으나 직업 설명 없음. |
| 2576 줄리아 | 세 설명이 주인공과 함께 성장했다는 전제와 짧은 관계 언급에 의존. 독립적인 세계·직업 설정이 충분한지는 사람 검토 필요. |
| 2619 밀린티나 | 세계·가족 설명은 있으나 직업 설명 없음. |
| 2620 라나 | 세계·가족 설명은 있으나 직업 설명 없음. |
| 8900 셀레스틴 | 세계 설명이 2571_isabella.json과 완전히 같음. 다른 두 설명은 쿠로이누 출신 설정을 사용하여 차용된 세계 서술의 적합성 컨펌 필요. |

시루는 전용 유니크 획득과 별개의 이름 있는 일반 생성 템플릿이다. 줄리아의 짧은 서술이나 셀레스틴/이사벨라의 같은 문구가 반드시 오류라고 확정한 것은 아니다. 설정 의도 확인이 필요하다는 뜻이다. 이 7명도 자동으로 새 배경을 쓰지 않았다.

## 파일명 변경 완료 — 25개

| 이전 파일명 | 현재 파일명 |
|---|---|
| `1448.json` | [1448_Shiru.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/1448_Shiru.json>) |
| `3003.json` | [3003_Albedo.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3003_Albedo.json>) |
| `3004.json` | [3004_Alpha.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3004_Alpha.json>) |
| `3005.json` | [3005_Fern.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3005_Fern.json>) |
| `3006.json` | [3006_Freya.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3006_Freya.json>) |
| `3007.json` | [3007_Hibiki.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3007_Hibiki.json>) |
| `3008.json` | [3008_Miku.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3008_Miku.json>) |
| `3009.json` | [3009_Misaki.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3009_Misaki.json>) |
| `3010.json` | [3010_Rias.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3010_Rias.json>) |
| `3011.json` | [3011_Sadako.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3011_Sadako.json>) |
| `3012.json` | [3012_Echidna.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3012_Echidna.json>) |
| `3013.json` | [3013_Shaakti.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3013_Shaakti.json>) |
| `3014.json` | [3014_Shinobu.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3014_Shinobu.json>) |
| `3015.json` | [3015_Sayaka.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3015_Sayaka.json>) |
| `3016.json` | [3016_Epsilon.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3016_Epsilon.json>) |
| `3017.json` | [3017_Wiz.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3017_Wiz.json>) |
| `3018.json` | [3018_Yorha.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3018_Yorha.json>) |
| `3019.json` | [3019_Raphtalia.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3019_Raphtalia.json>) |
| `3020.json` | [3020_Mayumi.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3020_Mayumi.json>) |
| `3021.json` | [3021_Diana.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3021_Diana.json>) |
| `3022.json` | [3022_Hilda.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3022_Hilda.json>) |
| `3023.json` | [3023_Iris.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3023_Iris.json>) |
| `3024.json` | [3024_Alexia.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3024_Alexia.json>) |
| `3025.json` | [3025_Akira.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3025_Akira.json>) |
| `3026.json` | [3026_Sword_Maiden.json](<C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/json/slaves/3026_Sword_Maiden.json>) |

원문 영문명이 확인된 24개는 그 표기를 사용했고 시루는 Shiru로 옮겼다. 영문명 표기는 캐릭터의 생성 조건이나 이미지 경로를 바꾸지 않는다. 이전 스크립트 `apply-approved-girls-followup-20261026.py`의 3011.json 참조는 역사적 적용 기록이므로 자동 재실행하지 않는다. 현재 소스에는 3011_Sadako.json으로 기록한다.

## 검증·백업·전달 범위

백업: `C:\Users\Ken Choung\.codex\worktrees\6f86\JO9sa\backups\before-json-tone-20261102175549_KST`. 수정한 모든 파일의 적용 전 백업 해시와 적용 후 42개 파일 해시를 확인했다. JSON 문법/비대상 필드·바이트 보존과 번호 중복, QSP 왕복·CRLF·따옴표 경계·표시 문자열 외 코드 보존·패치 재생/재적용 검사를 통과했다. 사용자 저위험 수정 검사 지침에 따라 전체 엔진 검사는 반복하지 않았다.

이 작업은 별도 커밋·푸시하지 않았다. 기록 `records/translations/json-tone-20261102/manifest.json`은 이전 ca6ca6b의 대응 파일을 대체하는 새 수정본을 가리킨다. 파일명 변경 후에는 이전 전달 도구로 옛 숫자 파일을 다시 복사하지 않는다. 다음 인수인계에서 이 이름 변경 목록을 함께 적용해야 한다.

일반 EXE를 다시 실행한 뒤 엘자의 과거 대사, 여성 주인공의 호칭, 미쿠 등 이름 변경 캐릭터 표시를 확인한다. 개인 세이브·이미지는 변경하지 않았다.

