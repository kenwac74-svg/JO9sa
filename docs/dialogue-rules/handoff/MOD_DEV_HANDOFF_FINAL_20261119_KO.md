<!-- 대사 작업 결과를 jack.qsp에 넣는 모드 개발 최종 핸드오프의 입구(순서, 파일, 남은 확인 사항) -->
# 모드 개발 최종 핸드오프 (2026-11-19)

- 받는 쪽: 모드 개발(QSP 반영·빌드 담당). 대사 작업 쪽은 QSP를 바꾸지 않았다. 반영·빌드·패키징은 모드 개발이 한다.
- 기준 파일: `assets/runtime/2.4.1/jack.qsp` SHA-256 `8332e1857fa594283eddda448177e3e63dbf554a2f3b241350aa7a9c3291c94f`. 두 상세 핸드오프의 줄 번호는 모두 이 파일 기준이다. 기준 파일이 바뀌면 도구를 다시 돌려 데이터를 새로 뽑고 줄 번호를 다시 확인한다.
- 저장소 규칙: qsp 직접 수정(`.qsrc` 재빌드 없음), 수정 전 왕복 검증과 백업, 확정 수정은 `mods/*.json`(location, old, new, count, 적용 전후 SHA-256)으로 기록. 음원 바이너리는 Git에 올리지 않는다.
- 원고 문장은 모두 사용자가 승인했거나 반영을 지시했다. 문장을 고치지 않는다.

## 1. 순서
| 단계 | 상세 핸드오프 | 넣을 데이터 | 규모 |
|---|---|---|---|
| 1 | `MOD_DEV_HANDOFF_QUESTION_MENU_20261119_KO.md` | `build/question_build_data.json` | 새 조각 530, 태그 빼기 901줄, 반말→공주 1,768줄, 공주 색인 577묶음, 말투 2 대체 색인 1,042묶음. 고르는 코드 4곳(목소리 고정·관계 칸·말투 검사·호칭 빈칸) |
| 2 | `MOD_DEV_HANDOFF_ENRICH_EVENTS_20261119_KO.md` | `build/enrich_build_data.json` | 사건 13개, 블록 252개(무게 3 7사건, 무게 2 6사건) |

2단계는 1단계에서 저장하는 목소리 값 `$slave['jo9_vtype']`을 쓰므로 1단계를 먼저 넣는다.

## 2. 넘기는 파일
| 파일 | SHA-256 | 다시 만드는 도구 |
|---|---|---|
| `handoff/build/question_build_data.json` | `e24ad9fa55bab17568814f9bfea098b1c05a53e0a3cd3ff837a440e5f3883c1a` | `python tools/question_build_data.py` (qsp를 읽음) |
| `handoff/build/enrich_build_data.json` | `ec0e673bd6ebe0de4e1a055696b3bc1664cc3f5d576935fd235cfc57852090d9` | `python tools/enrich_build_data.py` (`db/enrich-db.json`을 읽음) |
| `handoff/build/engine_smoke.cjs` | — | QSP 엔진으로 qsp를 열어 조각을 읽는 확인 스크립트 |
| `question-fill/q*_manuscript.json`·`.html` | — | 질문 메뉴 원고 원본과 사람이 읽는 표 |
| `db/enrich-db.json` | — | 풍부화 원고, 호칭 표·규칙, 몸짓 사전 |

- 두 데이터 파일은 2026-11-19 마지막 커밋 기준으로 도구를 다시 돌려도 같은 값이 나오는 것을 확인했다.

## 3. 모드 개발이 지킬 것과 확인할 것
| # | 내용 | 위치 |
|---|---|---|
| 1 | **한 화면에 사건 블록 하나, 절정 우선**(사용자 확정, 문답 49). 처벌 블록은 절정 판정보다 먼저 정해지므로 대기값에 담았다가 `interaction_result` 끝에서 고른다 | 풍부화 4-1 |
| 2 | 정책 거름: 사용자 작성 4사건은 어린 나이 코드 인물(`CONST_INT['loli_age']`)에게 내지 않는다. 절정은 동물·벌레·촉수 상호작용에서 내지 않는다. 그 상호작용 목록은 키워드로 찾은 후보라 확인이 필요하다 | 풍부화 3장 |
| 3 | 넣을 자리가 **(후보)**인 사건: 임신 확인(보여 줄 화면). 우승(문답 50)·낙인(문답 51)·판매(문답 52)·반란 제압(문답 54)은 확정 | 풍부화 4장 |
| 4 | 인물이 다른 칸으로 교체될 때 `$slave['jo9_vtype']`가 따라가는지 | 질문 메뉴 4-1 |
| 5 | 조각 데이터를 실행 코드(`jo9_vf_extra`)로 넣는 방식은 권고다. 다른 방식이면 세이브 호환을 확인한다 | 질문 메뉴 3장 |

## 4. 이번에 넣지 않는 것
- 원래 대사 수천 줄의 호칭 빈칸화(새 줄만 빈칸을 쓴다).
- 깊이(`$voice_depth_level`) 숨은 식 정리.
- 따뜻한 보상 사건(추후 검토).
- 조수 묻기 `personal_ltol`(어린 나이 코드 인물) 6칸. 원문만 남는다.

## 5. 검사
각 상세 핸드오프의 검사 절을 따른다. 공통은 다음과 같다.
1. 적용 전후 SHA-256, 왕복 동일, old가 정해진 횟수만큼만 나오는지.
2. QSP 엔진(`@qsp/wasm-engine` 2.0.0)으로 실행해 오류 0, 빈칸(`{`) 남지 않음, 원래 글 보존.
3. 게임 실행과 화면 확인은 사용자가 한다.

## 6. 원고가 만들어진 과정 (참고)
| 원고 | 쓴 쪽 | 승인 |
|---|---|---|
| 질문 메뉴 7개 + 공용 줄 | Claude, 성적인 칸은 사용자 의뢰로 다른 AI(`USER_CELLS_HANDOFF_*`) | 질문마다 사용자 승인(문답 34~42) |
| 풍부화 9사건 154블록 | Claude | 검토표로 사용자 승인(문답 31·32) |
| 풍부화 4사건 98블록 | 사용자 의뢰로 다른 AI(`USER_EVENTS_HANDOFF_KO.md`), 닮은 줄 2차례 다시 쓰기(`USER_EVENTS_REDO_HANDOFF_KO.md` 56칸, `USER_EVENTS_REDO2_HANDOFF_KO.md` 9칸) | 사용자 반영 지시. 사건끼리 닮은 칸 0 확인 |

원칙과 결정의 근거는 `docs/dialogue-rules/JO9_TEXT_PRINCIPLES_20261117_KO.md`, `DECISIONS_QA_20261116_KO.md`, `context-notes.md`에 있다.
