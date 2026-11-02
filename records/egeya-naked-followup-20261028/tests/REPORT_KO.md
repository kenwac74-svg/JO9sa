# 에게야 알몸 기본 이미지 — 재현·미반영 후보 독립 검사

현재 JSON 값이 정상으로 채워진 합성 성인 상태에서도 제보를 재현했다. 조수의 “알몸” 외형을 선택할 때 실제 입은 옷이 sun_dress/nurse_dress/chainmail_bikini/common_apron이면 새 2579 알몸 이미지 대신 기존 `egeya_blond_long`을 선택한다. 파일 부재가 아니라 다른 기존 그림을 선택하는 경로다. 실제 `cloth='голая'` 대조군은 현재 코드에서도 새 알몸 이미지를 정상 선택한다.

- 현재 WORK/수정 전 SHA: `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`
- 격리 후보 SHA: `f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97`
- 제품 적용 없음. 후보는 `display_fullimage`의 resolver 인자 조건 한 줄과 마커만 변경하며 새 로케이션·영구키가 없다. exact edit 재생과 전체 역적용 바이트 일치를 확인했다.

원인 근거는 수정 전 body 기준 `assistant_stat:191`의 실제 EXEC다. `image_mode=0`과 actor `fullimage=$fullimage[type]`만 설정하고 `cloth`는 유지한다. `display_fullimage:59–81`은 mode0에서 `$assistant_img_key=''`를 유지하고, 104행은 이를 resolver에 전달한다. `jo9_seed_role_images:44–58`의 기본 별칭→title 해석은 requested key가 `fullimage`일 때만 실행한다. 이어서 `display_fullimage:106–109`가 입은 옷의 개인팩 키를 조회하지만 에게야 JSON에는 위 네 복장의 개인팩 키가 없으므로 빈 값이며, 결국 이전 base가 남는다. 행별 원문은 `source-evidence.json`에 보존했다.

| 검사 | 결과 |
| --- | --- |
| RED | 실제 알몸 checkbox EXEC의 두 할당문을 그대로 실행 후 실제 helper 호출. mode0·cloth sun_dress·현재 indpack_naked 정상인데 old base를 반환하여 `FAIL_EGEYA_NAKED_SELECTION_EXPECT_CURRENT_NAKED`. |
| native 행렬 | 버전별240조건 정상 완료. slave/assistant, mode0–3, 다섯 복장, 현재/문서화된 옛 역할 cache, 현재/이전/부분 개인팩 globals 비교. 현재 정상 구성에서는 위 조수mode0 네 복장만 old base. slave와 조수mode1–3는 정상 경로. |
| 알몸 선택 EXEC | 버전별5조건. 수정 전에는 `голая`만 새 naked, 나머지 네 복장은 old base. 후보는 옷을 그대로 유지하면서 다섯 조건 모두 새 naked 선택. |
| A/B 변경 범위 | 240행 중9행만 변경: 현재 globals의4행과 naked global만 비운 부분 상태의5행. 모두 current cache·assistant mode0였다. 나머지 역할·모드·옛 역할 cache는 동일. |
| 보존·경계 | 버전별13조건. 다른 role, mode1–3, 에게야 custom 경로, 다른 type custom/기본 global 없음, actor fullimage 빈 값, 기존 정상 outfit patch 우선 보존. 5역할×2버전=10개 인물 비교에서 각각23묶음 모두 nonempty이며 호출 전후 완전 동일. |

후보는 빈 조수 role key 대신 일반 `fullimage` 조회를 요청하는 인자 한 줄 보완이다. 실제 옷을 강제로 바꾸거나 외형 모드1–3을 재정의하지 않는다. 현재 알몸 버튼이 기본 별칭을 actor에 복사하므로 이 후보로 재현 경로가 해소됐다. 인물23묶음 검사에서 테스트가 의도적으로 설정한 type/mode/fullimage/cloth는 helper가 바꾸지 않았음을 먼저 확인한 뒤 되돌렸고, 그 외 묶음 전체는 SAVEGAME 전후 비교했다.

별도 잔여: 문서화된 `girls/full/maid/kirakira` cache를 `resolve(...,'fullimage')`로 직접 요청하면 현재 resolver61–74행은 기존 egeya base를 반환한다. current default 별칭은 새 title로 해석된다. 이 직접 resolver5조건은 후보 전후 동일하며 이번 한 줄 후보에 포함하지 않았다. `display_fullimage`는 뒤의 indpack 우선 처리로 이 옛 cache를 가릴 수 있어, 직접 소비 경로와 동일하게 취급하면 안 된다. 부분 globals의 관측값도 사용자 세이브의 실제 상태라는 뜻은 아니다.

현재 base PNG와 새 naked PNG는 둘 다 정상795×596 RGBA이나 바이트가 다르다. base125,368바이트/SHA `9721334d792c098d3f3d629e7ca3f77418f040c33139d09ee8778cea92ac4bb3`, 새 naked259,298바이트/SHA `f291b7ff6735663d69179f047fed3a666fdd2bf226082b3a267b8cfab6eff45b`다. 역할 PNG3종을 포함한5파일 정상 디코딩·해시는 `assets.json`에 기록했고 검증 후 원본 불변을 재확인했다.

범위와 한계: 실제 `display_fullimage`, `jo9_seed_role_images`, checkbox의 EXEC 할당문을 native 엔진에서 실행했지만 checkbox의 `gt $curloc` GUI 이동·실제 이미지 픽셀 렌더링은 생략했다. JSON 값을 합성 globals로 등록했으며 실제 데이터베이스 로더/전체 ONGLOAD 순서는 실행하지 않았다. actor는 합성 성인 age2/type2579이며 개인 SAV는 읽거나 변경하지 않았다. 다른팩 custom·빈 global 조건은 합성 경계 조건이고 해당 사용자에게 그런 상태가 있었다는 증거가 아니다. 장기 진행·개인 GUI 재현과 후보 제품 적용은 미수행이다.

조건별 JSON과 원시 native 로그를 보존했다. 조건 수는 중복 합산하지 않았다. 인물 seed/23묶음 초기화·비교 함수는 이전 위탁 테스트 스크립트를 읽기 참조한다. 재실행 시 WORK가 바뀌었다면 `JO9_EGEYA_IMAGE_BASELINE`에 e620 QSP/gzip 백업을 지정한다. G 임시 진단 QSP·계획 JSON·ini12개, 246,483,003바이트를 경계/링크/재파스 확인 후 정리했다. 링크0이며 합성 SAV7개·로그10개는 보존하고 해시를 재확인했다. 세부 정리 목록은 `cleanup.json`을 따른다.
