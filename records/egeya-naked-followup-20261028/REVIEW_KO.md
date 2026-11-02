# 조수 기본 이미지 조회 후보 독립 검토

2026-10-28. 대상은 `2026-10-28_assistant_default_image_lookup.json` 하나다. 검토 결과 현재 승인 범위에서 수정이 필요한 actionable finding은 없다. 제품·G:·기존 세이브에 쓰지 않았고 게임을 실행하지 않았다.

## 독립 검증 결과

- 기준 WORK QSP: `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`.
- JSON의 `display_fullimage` 본문 1편집을 메모리에서 적용한 결과: `f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97`. 명세의 after 해시와 정확히 일치했다.
- old/new 매칭은 각각 정확히 1회다. 직렬화·재해독 후 바이트가 같고, 해당 본문 외 모든 인코딩 필드는 기준과 완전히 같다. 새 로케이션은 없다.
- 역적용 후 기준 QSP 전체 바이트가 완전히 복원된다. 제품 후보 QSP나 임시 사본 파일을 생성하지 않았다.

## 변경 범위와 부작용 검토

후보 `display_fullimage:105`는 `$iif` 조건에 `and $assistant_img_key ! ''`만 추가한다. 조수의 역할키가 비었을 때 resolver 요청키를 `fullimage`로 해석한다. 역할키는 매 조수 호출의 `:59`에서 초기화되므로 이전 호출의 값이 남아 새 분기를 잘못 선택하지 않는다.

그 결과 현재 기본 캐시와 같다고 확인된 경로는 기존 `jo9_seed_role_images:44-58`의 개인팩 alias 규칙을 적용받는다. 현재 에게야의 경우 미보유 sundress/nurse/chainmail/apron 팩에서 fallback할 때 base 대신 `indpack_title`의 현재 알몸 PNG를 쓴다. 캐시 자체를 덮거나 JSON 경로를 변경하지 않는다.

- 조수 mode 1/2/3은 각각 비어 있지 않은 기존 역할키를 그대로 넘긴다. 비조수는 이전과 동일하게 `fullimage`를 넘긴다.
- 기존 `cloth` 선택과 명시 의상팩/기분팩 우선순위, stock title 선택, 출력 HTML과 실내 이미지 연결은 바뀌지 않는다. mode 0에서 보유 메이드 등의 의상팩이 우선되는 기존 규칙도 유지한다.
- 수정문은 읽기 결과 `$def_image_path`만 받는다. 모드·cloth·인물 캐시·능력·영구 발견값·저장값에 새 쓰기를 추가하지 않는다. 새 영구 키·helper·로케이션·로드 이행 코드는 없다.
- 임의 사용자 경로는 현재 ID의 알려진 alias와 같지 않으면 기존 resolver에서 유지된다. 빈 캐시나 팩 전역값이 없는 경우 새 경로를 만들어내지 않는다.
- `girls/full/maid/kirakira` 같은 과거 역할 캐시가 별도 legacy 분기에서 base로 정규화된 뒤 종료되는 동작은 이 후보가 수정하지 않는다. 현재 기본 캐시 문제의 해결과 구별되는 기존 제한이며, 이번 한 줄의 새 회귀로 판단하지 않았다.

## 제공된 native 증거와 검증 한계

직접 엔진을 다시 실행하지 않고 담당자가 생성한 `tests/matrix.cjs`, `tests/preservation.cjs`와 결과 JSON을 읽어 해시·조건·결과를 대조했다.

- `matrix-candidate-results.json`: 후보 해시 일치, native 240행·실제 알몸 버튼 대입문 5건·직접 resolver 5건이 완료됐다. 현재 전역값+현재 캐시+조수 mode 0의 미보유 네 의상팩이 base → 현재 알몸으로 변경됐다. 추가 title-only 진단 5행을 합친 변경은 9행이며, 다른 행의 반환 경로는 같았다.
- `preservation-results.json`: 13개 비교에서 의도한 조수 기본 fallback만 변경됐다. 조수 mode 1/2/3, 비조수 역할, 사용자 경로, 다른 ID, 빈 캐시/전역값, 존재하는 의상팩 우선 사례의 반환 경로는 유지됐다. baseline/candidate 각 5역할의 23묶음 저장 데이터 비교 10건도 동일하다. 검사기는 각 표시 호출 직후 type/mode/cloth/fullimage 불변을 확인하며, 시험용 대입값을 복원한 뒤 나머지 묶음을 비교한다.

위 native 기록은 합성 상태에서 실제 함수와 버튼 대입문을 실행한 경로 검사다. title-only/pre-outfit/legacy 캐시 진단은 사용자 저장 상태의 존재를 증명하지 않는다. 개인 세이브 로드, 전체 GUI 이동, 이미지 픽셀 확인, 전체 게임 회귀 검사는 이 독립 검토 범위 밖이다. 현재 WORK는 검토 종료 시에도 e620 해시였으며 후보 미반영 상태다.
