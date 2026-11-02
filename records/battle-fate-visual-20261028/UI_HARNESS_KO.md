# 처분 화면 시각 검사 하네스

`fate-ui-native.cjs`는 기존 네이티브 하네스에서 파생한 진단 전용 파일이다. WORK/세이브/후보를 직접 쓰지 않는다. 출력 폴더에 생성하는 QSP의 Start, 결과 renderer 뒤 DOM 계측, helper 호출 횟수와 종료 체크포인트만 추가한다. 실제 선택 href를 바꾸거나 중간 EXEC 계측을 끼우지 않는다.

## 사례와 계약

- 안개 ogre 처형 / 일반 투기장 hoplite_e 살려주기 / 콜로세움 латница의 glad_armored·glad_armored_2·glad_armored_3.
- 각 사례에 독립 pending/final 두 프로세스, 총 10개 fixture. 콜로세움 2·3 변형은 진단 Start에서 기존 실루엣 배열에 해당하는 유효 원본 이미지 경로를 지정해 캐시된 변형 파일명 보존을 검사한다. 게임의 랜덤 선택 확률 검사는 아니다.
- pending 선택지의 computed font는 메시지와 같고 Sandoll 23px, 실행색 빨강, 활성 살려주기 녹색. 비활성 항목은 href 없음과 pointer-events를 확인한다.
- final에는 메시지 span 하나, 선택지 anchor 0개, 계속 문구 없음, 썸업 anchor 1개와 DOM 클릭 가능 여부를 검사한다. 두 번째 row는 빈 요소로 남겨 두는 계약이다.
- 기록·선택지·행 겹침 없음, 선택지 하단이 root/log skin 경계 내인지 검사한다. 기하 숫자를 하드코딩하지 않아 minor frame inset 조정에 대응한다.
- execution child는 fight_bg 직속, 효과 이미지 execution_red.png, 795×596 영역 유지, 상위 배경 레이어가 monster-wrap보다 아래인지 검사한다. 25/125/350/750/1150/1400ms 표본과 20ms visibility 추적, 1500ms에 판정한다. 효과 숨김 허용 시각은 850~1250ms다.
- 투기장/콜로세움 배경 arena.png, 현재 패배 몬스터 defeated/<원본 basename>.png의 실제 로딩을 검사한다. 별도 Node PNG 디코더는 RGBA8 비인터레이스 이미지의 실제 alpha를 풀어 투명·가시 픽셀이 모두 존재하는지 검사한다. DOM 색보정·미술적 자세 적합성의 자동 판단을 의미하지 않는다.

## 검증한 것

2026-10-28: node --check 및 --self-check 통과. 최종 flatten된 browser JavaScript를 모든 fixture 설정으로 vm.Script compile했다. PNG alpha decoder는 리뷰 원천 5장으로 검증했다. 이 파일을 작성한 에이전트는 실제 엔진을 실행하지 않았다.

## 실행

기준 RED(출력 폴더는 새 경로를 사용):

```powershell
node 'C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/battle-fate-visual-20261028/fate-ui-native.cjs' --candidate 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp' --game-dir 'G:/somi/Jack O Nine Tails v2.4_work/game' --state-save 'G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_GOLD_AP_CHECK_20261026.sav' --out 'G:/Codex/tmp/fate-visual-red-ui-20261028' --run
```

후보 GREEN은 candidate/game-dir을 후보 파일과 후보 resource root로 바꾸고 out은 그 후보 root 밖의 새 폴더로 지정한다. 처음 빠른 검증에는 --case fate-ui-arena-spare를 추가하면 된다. --run을 빼면 fixture만 준비한다.

## 한계

썸업의 href/DOM 클릭 가능성까지 검사하며 실제 썸업 이후 보상과 장소복귀 전체는 이 하네스가 실행하지 않는다. 기존 별도 네이티브 논리/출고 검사와 함께 확인해야 한다. pending/final은 별도 프로세스이며 final 시간축은 동일 프로세스 실측이다. 모든 전투·해상도·실제 세이브 UI 로드는 증명하지 않는다.
