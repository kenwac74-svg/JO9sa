<!-- history-lab 편집기 완성 작업의 결정과 근거를 이어 적는 기록 -->
# 결정 기록 (2026-11-11~)

## 2026-11-11 시작
- 사용자 결정: 편집기는 "편집기 안에서 완성"(핸드오프 11장 3~5단계)까지 한다. 게임 본체(qsp)는 바꾸지 않는다. 통계의 게임 구현은 다음 업데이트로 미룬 결정을 그대로 둔다.
- 사용자 결정: 대사는 배경 회상 대사와 slave-voice 둘 다 다룬다.
- 사용자 결정: 작업은 `handoff/stats-background-generation-20261112` 브랜치에 이어서 커밋한다.
- 게임 소스는 `assets/runtime/2.4.1/jack.qsp`를 `tools/qsp_dump.py`로 풀어 읽는다(293 location). `source/jack_2026-10-01.qsp`는 오래되어 기준으로 쓰지 않는다.
- 주의: 저장소 `.gitignore`에 `dist/`가 있다. `tools/jo9-history-lab/dist/`에 새 파일을 만들면 `git add -f`가 필요하다. 이미 추적 중인 파일 수정은 상관없다.

## A1 seed_age 매핑
- `#static_base` 132~139행: `CONST_INT['young_age']=0`, `['loli_age']=1`, `['milf_age']=2`.
- 편집기 `background-settings.mjs`의 `adultOnly && age===1` 제외는 loli 코드(1)를 빼는 것이므로 게임과 일치한다. 성인 대상 통계와 연령 필터의 기준이 맞다.

## B 대사 현황
- slave-voice(10-15 설계)는 2.4(10-18)에 통합되어 있다. 2.4.1 qsp에 `$voice_native` 대사와 `$voice_fragment_text` 조각이 있다. 10-15 QSP 대기 목록 4건(경찰관 family_index, 고아 직업값, 야만족 공주 분기, 세이브 보정)도 모두 반영되어 있다.
- 게임의 과거 묻기(1111) 배경 대사는 159항목 × 태도 3(reserved·direct·hesitant) × 말투 3(t1~t3) = 1,431조각 + neutral 21조각(`#txt_man`).
- 편집기의 163개 대사(세계 40·출신 57·직업 66)는 ChatGPT 쪽에서 원문(`#static_txt`)을 기준으로 따로 만든 단일 개정본이다. 게임 조각과 연결되어 있지 않다.
- 그래서 편집기 대사를 게임에 넣으려면 기존 조각 체계와 어떻게 합칠지부터 정해야 한다. 사용자에게 묻는다.

## 백업 브랜치 누락
- 11-07 백업(`claude/cool-hopper-a9o2df`) 때 `.gitignore`(`dist/`, handoff 기록 경로 등)에 걸린 텍스트 9개가 `git add`에서 빠졌다. 내용은 git 기록(`claude/sweet-meitner-72rd73`)에 있다.

## A2 특성 바인딩 (2026-11-11)
- 게임은 캐릭터 JSON의 필드를 엔진이 `seed_<키>[유형]` 배열로 올리고, `get_stock_seed`가 그중 일부만 인물 값으로 옮긴다. 2.4.1에서 읽는 키는 164개이며 `dist/data/game-seed-keys.json`에 저장했다(`docs/export-game-seed-keys.py`로 다시 뽑는다).
- 편집기 특성 128개는 선택하면 `seed_<binding.key>`를 JSON에 쓴다. 이 중 40개(키 19종)는 게임이 읽지 않는다.
  - 생성 뒤 상태값: brand, pregnant, wounds, rehabilitation, arena_level, has_ride_win, deprivation_attitude
  - jo9 확장 특성: jo9_focus·jo9_grudge·jo9_ambition·jo9_slave_nature·jo9_attention·jo9_constitution·jo9_peerless·jo9_combat_trait·jo9_versatile·jo9_learning_trait
  - 계산값·이름 불일치: sanity(ego+temper+pride 계산), activity_sign(게임 저장 키는 jo9_work_ethic, 이것도 seed_로 읽지 않음)
- 결정: 바인딩 자체는 바꾸지 않는다(편집기 통계 계산에 쓰이고, 열람표 갱신으로 덮일 수 있다). 대신 특성 카드에 "게임 미적용" 경고를 띄운다. 게임이 이 키들을 읽게 하는 것은 게임 본체 작업이라 이번 범위 밖이다.
- `snapshot-manifest.json`은 인계 당시 묶음의 해시 기록이다. 이후 편집기 수정으로 해시가 달라지는 것은 정상이며 manifest는 갱신하지 않는다.
