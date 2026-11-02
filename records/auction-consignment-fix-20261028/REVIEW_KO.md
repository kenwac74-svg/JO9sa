# 잡파 위탁 보관 수정 — 독립 코드 검토

검토 대상은 `2026-10-28_farid_consignment_storage.json`과 실제 생성 본문 `helper-built.qspsrc`다. `helper.qspsrc`는 패널 생성용 템플릿이므로 실제 실행 본문과 구분했다.

- 기준 SHA-256: `efdff96228e6cd77b59808c22b3391947e1682918480aea55c89b0a0bb3adebb`
- 검토한 최종 SHA-256: `972d1b7a8719c9b44e6aca4bfaf5a6f73908240762ce65061a7d298d0aa82679`
- 변경 범위: 기존 5개 location의 편집 12개와 전용 helper location 1개.

## 이전 후보의 발견 사항과 수정 확인

이전 `fb0e4090…` 후보에서 **[P2] 위탁 안내 2페이지가 비워진 공용 stock의 속성을 표시하는 회귀**를 발견했다. deposit이 stock을 지우지만 기존 `interaction_screen_city`의 `drop_to_farid / txt=2` 분기는 여전히 `$stock_traits`, stock 속성 및 stock 가격을 읽었다. 인물 그림만 보관 역할로 연결되어 그림과 속성 정보가 불일치했다.

`972d1b7a…`에서는 해당 위탁 화면만 전용 `panel` 모드로 연결한다. 보관 인물의 23개 변수 묶음을 임시 viewprobe에 순수 복사하고 기존 표시 규칙을 평가한 뒤 정리한다. 다음을 확인했다.

- 보관 원본과 공용 stock에 표시용 repair·가격 계산을 실행하지 않는다.
- 일반 사냥의 기존 `first_point` 경로는 유지한다.
- 왕관 가격 계산 전에 `is_stock=1`을 설정하여 원래 stock 등급 규칙을 유지한다.
- 공통 문법표 `$stock_boobs2_txt`는 probe 이름으로 바꾸지 않는다.
- 표시 문자열을 완성하고 tooltip의 probe 참조를 보관 역할로 바꾼 뒤, probe 23묶음과 별도 features 문자열을 정리한다.

## 검토 결론과 한계

**검토 범위에서 남은 actionable finding은 없다.** 실패 분기의 화면 이동과 interaction_type 초기화, 일말 정산 연결, 구 세이브의 청구권 보존, 반복 위탁 시 최신 인물만 회수 가능한 구조, 임시 역할 정리와 코드 스코프를 읽어 확인했다.

패치 12개를 메모리에서 재생한 결과가 위 최종 SHA-256과 일치했고, `helper-built.qspsrc`는 실제 패치 helper 본문과 일치했다. 이는 독립 정적 코드 검토 결과다. **본 검토자는 실제 엔진의 패널 표시·UI 클릭 흐름을 검증하지 않았으며**, 별도 native UI 검사나 root의 공식 검증 결과를 이 검토에서 수행한 검사로 취급하지 않는다.

이 검토 과정에서 G: 원본·WORK·제품·세이브를 변경하지 않았다. 본 문서 저장 외 재검사 확대나 추가 구현은 하지 않았다.
