# 후작 도나시앵 목표 상세 복귀 수정 — 2026-11-05

사용자 승인 후 WORK와 추적 QSP에 반영하고 r4 패치에 포함했다. r3 대비 게임 데이터 변경은 game/jack.qsp 한 개이다. JSON·PNG·Full·사용자 SAV는 수정하지 않았다. 커밋·푸시 없음.

## 변경

- 위치: $quest_list, DONATIEN_OBJECTIVE_BACK_20261105. 본문 한 곳만 변경, 나머지277로케이션 동일.
- 입력: quest_description_mode=1, choosen_quest=5. 출력: 기존 의뢰 설명 뒤에 목표 목록 복귀 링크를 추가한다.
- 링크 선택 시 quest_description_mode=0으로 바꾸고 현재 master_stat 화면을 다시 그린다. 호출자는 master_stat의 목표 탭이며 $curloc와 기존 $quest_list 표시를 사용한다.
- 저장된 $quest_description[5]나 새 영구 변수를 변경하지 않으므로 이미 받은 의뢰에도 적용된다. 다른 목표나 의뢰 보상·진행 조건은 바꾸지 않는다.
- 이 블록을 제거하면 후작 상세에 복귀 링크가 없는 기존 증상이 다시 생긴다.
- 원본·10/01·수정 전 WORK에 같은 결함이 있었음: audit-results.json 및 재현 스크립트 참조.

## 최소 확인

사용자 요청에 따라 전체 엔진·QA·설치 회귀를 반복하지 않았다. 수정 전 조사에서 관련 코드를 WASM으로 재현했고, 이번 변경은 QSP 바이트 왕복·CRLF/주석 경계·한 위치 변경·정확 패치 적용·WORK/추적/ZIP 해시를 확인했다. 실제 게임 EXE·기존 저장 화면 조작은 사용자 확인 대기다.

직접 확인: 거리에서 주인공 → 목표 → 후작 의뢰 → 뒤로. 이미 의뢰를 받은 기존 세이브에서도 목록으로 복귀하는지 확인한다. 집에서도 동일한 링크가 작동해야 한다.

## 산출물

- 전체 r4: G:\somi\JO9_2.4.1_Patch_20261105_r4\JO9_2.4.1_Patch_20261105_r4.zip
- QSP 전용 수정 ZIP: G:\somi\JO9_2.4.1_Patch_20261105_r4\JO9_2.4.1_Donatien_Goals_Hotfix_20261105_r4.zip
- QSP SHA-256: 6ebda9981bf6bc56de46929474de64157969fd324bba8e8be181e002dad1cc7e
- 전체 r4 SHA-256: a5345600f6957701c1dc4363b4e1e09843ff14c4ca6eb08bceab5171f478fdd3
- QSP 전용 ZIP SHA-256: a844ca236366266ceaf37fb090c39a23308d65770389a9b13e75f7e51ecceee7

기존 r3와 설치 수정2건을 보존했다. QSP 전용 ZIP은 r3를 이미 적용한 게임에 game/jack.qsp만 덮어쓰는 용도이며 JSON 삭제나 설치 CMD 실행은 필요 없다.
