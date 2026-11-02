# 전투 후속 UI 진단

진단 파일만 작성했다. 제품·WORK·세이브 변경은 없다.

## fate-ui-native.cjs

기존5개 단일 적 설정과 검은 의사+조수3명(총4명) 결과를 검사한다. 각 설정은 pending/final을 별도 엔진 프로세스로 실행한다. 최종 선택은 실제 생산 href를 수정하지 않고 클릭한다. pending에서 중간 EXEC 계측을 보내지 않는다.

- 선택지는 기록과 같은 Sandoll23px, 빨강/녹색. 선택지 top719. 기록과 겹침·컨테이너 밖 이탈 없음.
- 각 행의 테두리4방향0px, 배경alpha0/image none 확인. focus는 실제 focus() 후 computed style을 읽는다. hover는 해당 anchor에 실제로 매칭되는 :hover 규칙만 동일 specificity의 임시 class selector로 바꾸어 **같은 stylesheet의 원래 규칙 바로 뒤**에 삽입하고 computed style을 읽는다. 뒤쪽 CSS 우선순위를 보존하며, 클래스/규칙을 원래대로 돌린 다음 실제 선택 href를 누른다. 실제 마우스 hover 입력을 보냈다는 의미는 아니다.
- 구형 Qt.matches가 해석하지 못하는 무관한 selector는 건너뛴다. 매칭이 확인된 규칙을 CSSOM에 삽입하지 못하면 실패로 기록한다.
- 최종 결과는 span1개/anchor0개, 계속 없음, 원래 썸업 단독 클릭 가능.
- execution은 FX layer 직속,795×596, opacity0.3, 몬스터 레이어 위이며25/125/350/750/1150/1400ms에 계속 visible. 위치·UI 프레임 불변.
- 그룹은 `.jo9-battle-defeated-group.jo9-group-count-4` 아래 direct img4개, slot1~4, medic/minion/minion/minion defeated 경로와 실제 로드 및 전체 이미지 bounding box의 stage 내부 포함 확인. 정산은 의사1·조수3 합계4회로 검증한다.

## followup-scene-ui-native.cjs

별도4fixture:

1. interaction_city1296 주인공 결과 전체 경로.
2. interaction_city1297 노예 결과 전체 경로.
3. interaction_city1298 조수 결과 전체 경로.
4. 실제 전투 중 black medic의 content/pic/mob/medic.png 표시(4적 전투 상태에서 현재 적 의사).

후속 컷신은 원래 결과 계산·$newloc·interaction_result_city·interaction_screen_city를 실행한다. .jo9-colosseum-end와 해당 img의 실제795×596, 원래 역할별 문구 및 복귀/초기화, phase3/choice 보존을 확인한다. 의사 전신은 원래 전투 renderer를 실행하여 실제 로드와stage내범위를 확인한다.

## 실행 기록

- `ui-red-v1`: WORK-a6e32 기준 대표 콜로세움 처형 설정이 실패했다. top724와 1px border 및 반투명 버튼 배경을 실제로 관찰했다. 구형 selector 계측 오류도 함께 기록됐다.
- `ui-green-v1`: 첫 하네스의 구형 selector 계측 오류로 실패. 실패 기록을 유지하며 성공으로 재분류하지 않는다.
- `ui-green-v2-probe`: 계측 수정 후 대표 콜로세움 처형 pending/final 두 fixture 엔진 PASS. 선택 전후 기하 변화 없음.
- `scenes-green-v1`: 후보2f93a1 기준 위 별도4fixture 엔진 PASS. 기존768×576 장면도795×596으로 출력됨. 각 역할 caption과phase3보존확인. 전투중의사medic.png로드확인. 입력 파일 hash 불변.
- `ui-green-v2`: 계측 수정 후 후보2f93a1의 전체6설정·12fixture 엔진 PASS. 모든 pending/final 기하 변화 없음, 처형 지속 반투명 효과, 살려주기 무효과, 그룹 의사1+조수3 이미지 및 정산4회 확인. 모든 활성 링크의 normal/focus/hover 동등계측에서 outline0도 별도 검증했다. 입력 파일 hash 불변. 상세 결과는 G:/Codex/tmp/battle-followup-qa-20261028/ui-green-v2/fate-ui-native-results.json, 두 최종 보고서의 요약은 같은 workspace의 qa-summary.json에 있다.

모든 QA 출력은 G:/Codex/tmp/battle-followup-qa-20261028 아래 있다. 제품 해상도1280×800의 대표 표본이다. 모든 해상도·세이브UI로드·게임 전체 전투를 증명하지 않는다. 썸업 이후 전체 보상/이동은 별도 기존 논리·출고 검사가 담당한다.
