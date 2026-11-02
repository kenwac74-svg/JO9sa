# 조수 안개전투 AP 후보 — 독립 정적 검토

**합의한 AUDIT 최소안과 일치하며, 이번 정적 검토에서 차단할 문제를 발견하지 못했다.** native 게임 실행은 중복하지 않았다. 검토 입력은 stage의 baseline/candidate QSP와 workspace 패치 JSON이며, 검토 시 WORK는 f652였다.

| 항목 | 독립 확인 |
| --- | --- |
| 원본 | `f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97` |
| 후보 | `e830028463ab3ca675e5e931110182883bb773e9a9403a1385d1d968114b9c98` |
| 정확 재생 | 두 edit의 old가 각각1회 일치. baseline에 exact edit 재생한 전체 바이트가 stage candidate와 동일. |
| 역적용·범위 | 두 edit 역적용 후 baseline 전체 바이트와 동일. 275 locations 유지, raw QSP에서 바뀐 필드는 `jo9_fog_relay` body 하나뿐. desc/actions·다른 모든 본문 동일. |
| 상태·비대상 | 신규 location0·신규 jo9_fog 키0. 기존 노예 actor1 분기 전체가 바이트 동일. energy helper·begin/finish/handoff/close/reset 및 전투 종료 본문도 미변경. |

후보의 첫 edit는 기존 생존 actor2 분기 안에 주인공 helper 호출을 넣는다(후보 relay150–155). 바깥 settle55–57의 **active=1·settled=0 검사와 settled=1 선기록**을 통과해야 하며, 추가로 place=edge_patrol·combatant=2·결과=승리·switched=0을 모두 요구한다. helper 호출 지점은 정확히1개다. 사망 clear 분기는 이 호출을 건너뛰므로 기존 사망 우선 처리를 유지한다.

두 번째 edit는 조수 환산의 최종 clamp만 `min(g(S), energy_before−2)`로 바꾼다(후보170). g(S) 구간과 정산 직전 energy_before 저장·부상/사기·성장/명성·파생값 갱신을 그대로 두고, `$assistant_energy_drop` 호출이나 추가 half_action/칼로리/체력 차감을 넣지 않았다. 노예의 최소1과 AP>0 출전 조건도 유지한다.

교대는 기존대로 **settle을 먼저 호출하고 switched=1·combatant=0을 기록**한다. 따라서 switched 조건 하나만으로는 충분하지 않지만 후보에는 결과=승리 조건이 있어 비승리 handoff에서 새 주인공 비용을 청구하지 않는다. 교대 뒤 finish는 combatant0이라 새 settle을 호출하지 않고, 직접 settle을 다시 불러도 이미 settled1이므로 중복되지 않는다. 주인공 기존 지구력 환산/안개 cap/도주 비용도 다른 본문에 그대로 남아 추가 동행 비용과 겹치지 않는다.

비정상·stale 상태의 새 주인공 비용 경계도 확인했다.

- active가1이 아니거나 settled가0이 아니면 기존 guard에서 종료. 반복 finish/settle 및 이미 정산된 중간 저장에 소급 비용 없음.
- actor1, combatant0/1, switched가0이 아닌 값, 비승리 결과, edge_patrol이 아닌 장소 중 하나라도 해당하면 새 주인공 helper 호출 없음.
- actor2/active1/settled0가 잘못 남아 직접 settle에 들어가는 손상 상태 자체를 복구하지는 않는다. 기존처럼 actor2 생존 정산에 들어가면 조수의 새 최소2가 적용된다. 장소 guard는 새 주인공 비용에 붙은 것으로, 기존 stale 정산을 새 상태 복구 기능으로 해석하면 안 된다. 정상 begin/close 경로에서 이런 상태가 생성된다는 새 근거는 없다.

주인공 비용은 AUDIT에서 정리한 **기본 행동1회**다. 공통 `$master_energy_drop` 본문이 바뀌지 않았으므로 반지/easy/반행동/치트/오베레그·과로 보정을 그대로 사용한다. 모든 상태에서 정수 energy가 반드시1 줄어든다는 주장이 아니다.

이 검토는 exact replay/inverse와 코드 경계 검토다. 실제 호출 횟수·부상/보상/적 배열·반행동·비정상 조합의 native 관측은 별도 담당의 실행 근거로 판단해야 한다. 이번 작업은 이 문서만 작성했고 게임·SAV·공통 문서·제품 패치에는 쓰지 않았다.
