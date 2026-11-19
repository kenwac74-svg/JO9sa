<!-- Claude가 쓰지 않았거나 다루지 않는 칸·원문·사건의 위치 목록(사용자가 직접 구조를 파악하기 위한 것) -->
# Claude가 다루지 않은 곳 목록 (2026-11-19)

사용자가 따로 지시하지 않아도 어디가 빠져 있고 어떤 원문을 Claude가 손대지 않는지 알 수 있게 모은 목록이다. 위치와 개수만 적고 문장은 옮기지 않는다. 게임에 무엇을 막을지는 이 목록이 정하지 않는다.

## 1. 질문 메뉴: Claude가 쓰지 않은 칸 61개 (`question_fill_table.csv`의 `class = 원문만`)
성적인 내용 후보라 Claude가 쓰지 않았다. 모두 사용자 의뢰로 다른 AI가 채웠고(`USER_CELLS_HANDOFF_*`), 원고 JSON에서 `writer = user`로 표시돼 있다. 지금 빈칸은 없다. 이 역할의 **원래 줄**은 Claude가 고치지 않았다.

| 질문 | 칸 수 | 역할 |
|---|---|---|
| 1112 인상 | 14 | `fact_instinct_5_detail`, `fact_relation_horny_core/detail`, `fact_urge_0~5_core`, `fact_urge_3~5_detail` |
| 1113 요구 | 20 | `fact_urge_0_core`, `native_1113_{exhibitionism,homosexualism,nymphomania,perversion}_need_core/detail`, `native_1113_refuse_horny_core` |
| 1114 희망 | 4 | `native_1114_cowSK_like_core`, `native_1114_enchanter_like_core` |
| 1115 불만 | 8 | `native_1115_{exhibitionism,homosexualism,nymphomania,perversion}_dislike_core` |
| 공용 | 15 | `fact_urge_0~5_core`, `fact_urge_3~5_detail` |

## 2. 질문 메뉴: Claude가 빼 두었으나 다시 볼 칸 6개
- 1117 조수 묻기 `personal_ltol`의 보완 6칸(순한·담백한·도도한·조용한·명랑한·거센). 공주는 원래 줄을 재활용한다.
- 당시 "어린 나이 코드 인물의 대사"라는 이유로 빼었다. 원래 줄은 또래 조수를 평하는 비성적 대사라 그 이유는 과했다. 지금은 원문만 남아 있다. 사용자가 원하면 비성적 대사로 쓸 수 있다.

## 3. 풍부화 사건
| 사건 | 상태 | Claude가 한 것 |
|---|---|---|
| 부끄러운 벌 `shame_punish`, 몸으로 받는 보상 `erotic_reward`, 절정 `climax` | 문장 84블록이 DB와 데이터 파일에 있음(다른 AI 작성) | 문장은 쓰지 않음. 이후 배치·겹침 규칙·의뢰는 하지 않는다. 이미 커밋된 핸드오프 내용은 그대로 남아 있다 |
| 임신 확인 `pregnancy_reveal` | 14블록(다른 AI 작성) | 문장은 쓰지 않음. 보여 줄 화면 찾기(비성적 부분)는 할 수 있다 |
| 따뜻한 보상 `warm_reward` | 쓰지 않음 | 사용자 결정으로 추후 검토 |

## 4. Claude가 고치거나 다시 쓰지 않는 게임 원문
강제 관계 안의 성적 장면 글과, 어린 나이 코드 인물을 아이로 그리는 성적 글이다. 비성적 글은 이 목록에 들지 않는다.

| 위치 | 내용 |
|---|---|
| `#txt_woman` 485~510행 근처 `$praise_erotic[]`, `$praise_erotic_reaction[]` | 성적 보상 장면과 반응 |
| `#txt_woman` 492~502행 `$praise_erotic_no_loli0[]`, `$praise_erotic_no_loli2[]` | 어린 나이 코드 인물 대상 성적 묘사 |
| `interaction_city` 6185~6187행 `$brothel_whore_loli_1[]` | 사창가의 같은 종류 묘사 |
| `interaction` 성행위·성적 수업 상호작용(`orgastic`을 쓰는 블록들)과 그 결과 글 | 성적 장면 전반 |
| `#dynamic` 840행 `$orgasm_description[]` 출력 | 절정 묘사 |
| `interaction`의 `$shame_torture_reaction[]` 등 치욕 처벌 반응 중 성적 내용 | 성적 처벌 |

- `#dynamic` 1634~1639행(주인공이 아이인 경우의 반란 제압 팝업)은 비성적이다. 이 목록에 넣지 않는다.

## 5. 핸드오프에 Claude가 넣었던 판단
`MOD_DEV_HANDOFF_ENRICH_EVENTS_20261119_KO.md` 3장의 나이·동물 거름은 Claude가 스스로 넣은 조건이고 사용자가 정한 것이 아니다. 둘지 뺄지는 사용자와 모드 개발이 정한다.
