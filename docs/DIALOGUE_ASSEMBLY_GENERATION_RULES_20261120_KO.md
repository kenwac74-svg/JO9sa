# JO9 대사 조립·생성 규칙

2026-11-20 WORK 기준. 일반 대화 1111–1118과 통합 모딩툴의 미리보기 규칙을 설명한다. 11월 13일 당시의 R05a 자동 존칭 전환은 현행 규칙에서 사용하지 않는다. 기존 조각의 상세한 선정·배치 규칙은 당시 원장에 남아 있다. [기존 조립 원장](SLAVE_DIALOGUE_ASSEMBLY_RULES_CURRENT_20261112_KO.md)

## 게임의 대사 조립

1. **화자와 말투를 정한다.** 일반 캐릭터는 격식 존댓말 또는 일반 존댓말을 쓴다. 직업이 공주(mprincess) 또는 야만족 공주(barbarian_princess)인 일반 캐릭터, 지정 유니크 9명(루미너스·바실리사·라나·리아스·다이아나·이리스·캬루·에키드나·시루), jo9_plain_tone이 양수인 화자는 반말을 쓴다. 공주 출신의 직업 보정은 별도다. 왕가 출신 평민의 출신만으로 말투가 바뀌지는 않는다. [게임 말투 개편](../mods/2026-11-20_character_dialogue_reform.json)
2. **답변 여부와 주제를 고른다.** 기존 대화 판정이 거절이면 거절 대사를 사용한다. 과거는 세계·출신·직업 배경을 읽고 외형 분류에 따른 페이지 규칙을 적용한다. 인상은 관계와 최근 사건, 요구와 불만은 특성·상태·복종 조건, 희망사항은 적성 등 기존 후보, 기분은 활성 감정 효과와 사건을 반영한다. 조수·노예에 대한 질문은 실제 화자와 상대의 관계 기록을 읽는다. [기존 조립 원장](SLAVE_DIALOGUE_ASSEMBLY_RULES_CURRENT_20261112_KO.md)
3. **관계 상태로 어조를 정한다.** 게임에서 반말 화자에게 예의 강요가 적용되면 거친 말투가 우선한다. 그 외에는 겁먹음, 슬퍼함, 기존 우울·무너짐 대사를 차례로 검사하고, 적대 상태와 헌신 등급으로 거침·부드러움·평소를 선택한다. 관계 상태가 바뀌어도 반말 화자의 기본 높임 등급은 유지된다. 반말의 주인공 호칭은 ‘마스터’다. [게임 말투 개편](../mods/2026-11-20_character_dialogue_reform.json) · [호칭 보정](../mods/2026-11-20_plain_speech_wording.json)
4. **조건에 맞는 조각을 조립한다.** WORK의 #dynamic과 #txt_man은 역할·성격·관계·말투·표현 깊이에 맞는 조각을 읽는다. jo9_character_dialogue는 인상·희망사항·과거의 지정 원고를 담당한다. 수업 대사는 당일 수업이 있었을 때 연결하고, 희망사항 원고는 기존 후보에서 같은 수업 주제가 선택된 경우 사용한다. 예의 강요 도입부는 첫 답변에 한 번 붙인다. [게임 말투 개편](../mods/2026-11-20_character_dialogue_reform.json)

## 시뮬레이터에서 확인

- **캐릭터 시뮬레이터 → 질문하기**에서 화자·관계 상태·예의 강요를 고른다. 화면의 ‘현재 WORK’는 원본 비교용이다. 실제 세이브의 사건·관계 이력까지 모두 재현하지는 않는다. 무작위 캐릭터의 과거에는 엔진이 고른 배경 원문을 사용한다. 활성 기분 효과가 없을 때의 상태별 추가 문장은 ‘상태별 기분 시안’으로 표시한다. [미리보기 선택](../tools/modding-hub/overrides/general-dialogue.mjs) · [초기값 조회](../tools/modding-hub/runtime-initials.cjs)
- 일반·야만족 공주의 과거는 인용문과 제삼자 높임을 살려 반말로 표시한다. 편집기 말투 시안은 루미너스·펠리시티의 강반말, 캬루·시루의 친반말, 야즈민의 단호한 존댓말, 올가의 담담한 존댓말을 구분한다. 줄리아는 조니의 여동생이며 영입은 조니 전용이다. 편집기에서는 조니에게 친반말, 다른 인물에게 존댓말을 시연한다. [편집기 말투](../tools/modding-hub/overrides/speech-reform.mjs) · [줄리아 시안](../tools/modding-hub/overrides/general-dialogue.mjs)
- 이번 성경험 질문지·답변 생성 변경은 편집기용이다. 질문 순서·개수·공개 등급은 JSON에서 읽고 기존 거절 조건과 경험 데이터를 사용한다. 유니크는 수동으로 입력하거나 선택한 고정 답변만 읽는다. [질문지](../tools/modding-hub/data/sex-talk-questionnaire.json) · [시뮬레이터](../tools/modding-hub/overrides/character-view.mjs)

## 다른 PC에서 이어서 작업

- 저장소를 받은 뒤 그 PC의 편집기와 WORK 경로를 연결한다. 실행 설정은 통합 모딩툴 안내를 참고한다. [통합 모딩툴 실행 안내](../tools/modding-hub/README_KO.md)
- QSP 변경 선언은 적용 전 해시가 일치하는 WORK를 기준으로 한다. 아래 순서는 변경 기록의 해시 연결 순서다. 기준 파일이 다르면 이 다섯 선언을 한꺼번에 적용하기 전에 해당 PC의 WORK와 대조한다. 최종 WORK의 SHA-256은 418fe9c60d97fcdb422e620d3de747cac2a9090496d80e7eb6fa2e8e20aebddb다.

| 순서 | 대사 패치 | 적용 전 → 후 |
| --- | --- | --- |
| 1 | [캐릭터 대화 개편](../mods/2026-11-20_character_dialogue_reform.json) | 887f7e57… → 42777849… |
| 2 | [반말 어휘·호칭](../mods/2026-11-20_plain_speech_wording.json) | 42777849… → c381… |
| 3 | [반말 문구 보정](../mods/2026-11-20_z_plain_speech_wording_followup.json) | c381… → 3734… |
| 4 | [반말 1인칭 보정](../mods/2026-11-20_zz_plain_speech_self.json) | 3734… → 5b60992f… |
| 5 | [행동지문·구세이브 호환](../mods/2026-11-20_dialogue_qa_backstep_cue.json) | 5b60992f… → 418fe9c6… |

편집기 회귀 테스트 21개와 브라우저 미리보기를 확인했다. 최종 행동지문 수정은 격리 QSP 엔진에서 새 원고·구세이브 캐시·사용자 편집 원고를 확인했다. 네이티브 게임 EXE 전체 플레이는 검증하지 않았다. [존칭 회귀 테스트](../tools/modding-hub/tests/ordinary-register.test.mjs) · [주제·기분 회귀 테스트](../tools/modding-hub/tests/topic-preview.test.mjs)
