# 누락 개별 패배컷 재감사 — 읽기 전용

현재 runtime 누락15개 중10개는 **이미 제작된 대안 시안이 있으나 WORK에 미등록**이다. base images/defeated와 최초 manifest만 보고15개 모두 미제작이라고 한 표현은 정정해야 한다. 자동 설치하지 않았다.

기제작10개는 alternatives/20261028_defeat_pose_review/images의 같은 basename PNG이다. 실제 PNG decode 및 기록된 생성 원본/technicalQA 해시가 일치한다. 대부분 generated 플래그 필드 자체가 없으며(거짓이 아님), placeholder 플래그도 없다. 시안 상태는 review_only_not_adopted다. 정확한 개별 생성시각 필드는 없어 파일 수정시각을 별도로 기록했다.

| runtime basename | 재감사 상태 |
|---|---|
| gladiator_prisoners.png | NO_CANDIDATE_GROUP_NAME_MAPS_TO_PRISONER_E_HISTORY |
| gladiator_dimaha_3.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| gladiator_dimaha_4.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| gladiator_hoplite_1.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| gladiator_hoplite_2.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| gladiator_hoplite_4.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| gladiator_kimerian_2.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| gladiator_kimerian_4.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| gladiator_champion_sepris.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| gladiatrix1.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |
| glad_naked_2.png | EXCLUDED_IN_REVIEW_HISTORY |
| glad_naked_3.png | held_portrait_input_blocked |
| mistress_morrigan.png | NO_EXACT_CANDIDATE_NO_HELD_ENTRY_MATCH |
| glad_mistress_3.png | held_portrait_input_blocked |
| glad_amason_2.png | CREATED_REVIEW_CANDIDATE_NOT_INSTALLED |

## 시각 검토 필요

존재하는10종 모두 채택 전 얼굴·복장·장비와 현재 승인 화풍을 확인해야 한다. 이전 VISUAL_QA_KO.md는 hoplite4 검끝, champion_sepris 우측검손잡이 여백, kimerian2 원본 밖 뺨표식, kimerian2/4 옆골반 피부표현, dimaha3 상단 희미한알파, dimaha3 출력1447×1087을 짚고 있다. 이 감사에서는 그림을 새로 시각 검수하거나 설치하지 않았다.

없는5개는 서로 사유가 다르다: glad_mistress3/naked3는 당시 입력차단 보류, naked2는 당시 원본연령 참조보류, gladiator_prisoners는 runtime fugituive_e와 old prisoner_e 명칭대응 확인이 필요하며 대안기록은 제외상태, mistress_morrigan은 기존보류15명부와도 이름이 달라 별도 사용/매핑 근거 확인이 필요하다. 단체prisoners_group.png와 개별 슬롯은 자동 동치로 처리하지 않는다.

세부 파일 경로·SHA·규격·알파·수정시각·recordedQA는 missing-defeat-readonly-audit.json 참고. runtime/QSP/카탈로그/이미지 쓰기 없음.
