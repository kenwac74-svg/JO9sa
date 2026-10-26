# 관계표·인벤토리 교차 검토

원본 인벤토리39축과 현재 신규 기능15축 각각에 연결 행을 만들었다. 신규15축은 모두 관계표에 연결된다. anal_affinity의 양·음 배타를 R19의 동일 키 축 목록에 명시하여 빠진 연결을 보완했다.

관계23개는 의미 있는 상호작용쌍을 검토한 것이며, 모든 특성의 모든 조합에 대한 전수증명이 아니다. 별도 상호작용쌍이 없는 원본 습관축은 relations.json의postGenerationChanges.axes에도 연결된다. 원본표에만 독립적으로 남는 축은 arena_level, has_ride_win, metabolism, selfesteem이다. 이4축은 원본 인벤토리의 효과·출처로 보완되며, 관계가 없다는 이유로 삭제하거나 이름만 보고 충돌을 만들지 않는다.

새 인벤토리 파일은 검토 시점에 아직 없어서 신규 축은 실제 jo9_traits와learning 키에서 직접 추렸다. 이후 합쳐지는 표는 relations-inventory-crosscheck.json의 각 key로 연결하면 된다. 두 표의 명칭은 승인된rename 뒤 바뀌어도 저장 키meekness는 동일하다. 게임·세이브변경 없음.
