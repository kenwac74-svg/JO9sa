# WORK 수동 플레이 재개 지점

**현재 직접 조작·육안 검사는 미실행이다.** Computer Use 커널 초기화가 경로 오류(os error3)로 두 번 실패했다. 자동 Qt DOM 버튼 검사는 통과했으나 수동 플레이와 합산하지 않는다.

검사 대상은 수정한 WORK `05f5726d…`다. 실행 중인 게임은 이전 QSP를 메모리에 유지할 수 있으므로 게임을 새로 시작해 [WORK QSP](<G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp>)를 연다. 동봉 엔진은 [WORK engine/jack.exe](<G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe>)다. 공개 시험 SAV는 Full에 있는 기존 파일을 입력으로 사용할 수 있다. Full QSP를 대상으로 검사한 결과와 구분한다.

| 우선 | 시작 상태 | 남은 실제 확인 |
| --- | --- | --- |
| 1 | 조건이 붙은 B와 A/C 이상이 있는 장면 | 실제 전환 아이콘을 반복 클릭해 A/C에 도달하고 B↔C에 갇히지 않는지 확인. 기존 조건이 없는 장면의 수동 전환도 비교. 임시 시험 조건은 검사 후 기존 값으로 복원. |
| 2 | [TC_03_CATFIGHT_VICTORY.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_03_CATFIGHT_VICTORY.sav>) | 두 결과 선택·상금·복귀 뒤 같은 세션에서 목욕/요리/청소. 이전 그림 잔류·화면 잘림·다음 버튼 입력 확인. |
| 3 | [TC_02_CATFIGHT_INTRO.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_02_CATFIGHT_INTRO.sav>) | 현재 이름 소개, 좌우 행동/무기 UI, 타격 효과, 긴 전투 기록과 실제 클릭 위치. |
| 4 | [TC_06_FOG_GROUP.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_06_FOG_GROUP.sav>) | 적 표시·피격 프레임·승리 뒤 단체 컷 한 장·복귀. |
| 5 | [TC_05_BANKRUPTCY_CHAIN.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_05_BANKRUPTCY_CHAIN.sav>) | 정리 연쇄와 ‘직접 방법을 찾는다’의 실제 화면/날짜 복귀. $50,000의 합성 청구로 최종 엔딩은 예정 결과다. |
| 6 | [TC_01_HOME_TRAITS.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_01_HOME_TRAITS.sav>) | 특성 상세·팝업 레이어·닫기·원래 인물 복귀, 역할별 복장. |

위 1번의 실제 사용 중 조건 장면은 사용자 WORK에 임의로 만들거나 저장하지 않았다. 자동 검사는 소유한 격리 장면에서 수행했다. 전체 8개 핵심/3개 선택 수동 TC와 기존 공개 SAV 7개 연결은 [앞선 인계서](<G:/somi/JO9sa/records/qa-bounty-241-20261101/lead/HUMAN_HANDOFF_KO.md>)를 참조하되, 이번 재검사에서는 실행 대상 QSP를 WORK로 선택한다.

원래 공개 TC와 개인 저장은 덮어쓰지 않는다. 옛 공개 TC를 불러올 때의 정상 버전 업데이트 안내는 진행 오류와 구분해 기록한다. 실패는 시작 SAV·누른 메뉴·기대/실제·재현 횟수·화면을 남긴다.
