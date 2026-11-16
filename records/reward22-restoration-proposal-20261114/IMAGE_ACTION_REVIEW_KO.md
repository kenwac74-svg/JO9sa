# 성인 범위 이미지·동작 대조 결과

WORK 미반영. 사용자 선택: 성인 범위에서 이미지·동작도 함께 대조. 앞선문구전용안은대체검토안이며이번전체복원도자동승인으로간주하지않는다.

|항목|원래 이미지 키|현행에서 사용할 폴더|young/milf 공용장수|
|---|---|---|---|
|1. 색정광·단체 선호|gangbang|girls/sex_scenes/|4/3|
|2. 색정광·구강 선호|bj|girls/sex_scenes/|2/2|
|3. 색정광·동시 삽입 선호|gangbang|girls/sex_scenes/|4/3|
|4. 색정광·주먹 사용 선호|fisting|girls/sex_scenes/|4/1|
|5. 색정광·개 관련 선호|dog|girls/sex_scenes/|4/5|
|6. 색정광·말 관련 선호|horse|girls/sex_scenes/|3/2|
|7. 피학 성향|bdsm|girls/sex_scenes/|2/2|
|8. 가학 성향·죄수 있음|clamps|girls/torture_scenes/torture_instruments/|10/10|
|9. 노출 성향·역할놀이|masturbation|girls/sex_scenes/|5/4|
|10. 이상성욕·개 관련 선호|dog|girls/sex_scenes/|4/5|
|11. 이상성욕·말 관련 선호|horse|girls/sex_scenes/|3/2|
|12. 이상성욕·배설 관련 선호|oralfetish|girls/sex_scenes/|8/1|
|13. 동성애 성향·조수 있음|lesbo|girls/sex_scenes/|3/3|
|14. 모욕 선호|none|none|원래 이미지 없음|
|15. 해충 관련 선호|verminpit|girls/torture_scenes/torture_units_application/|1/1|
|16. 구속 선호|bdsm|girls/sex_scenes/|2/2|
|17. 수치 플레이·노출 성향|exhibit|girls/sex_scenes/|1/2|
|18. 높은 사육·헌신 조건|seduce|girls/sex_scenes/|1/2|

## 확인된 차이
-이미지키14종중none1종제외13종모두성인공용파일존재.가학clamps와해충verminpit는원래상위폴더아닌현행하위폴더로연결해야한다.파일이동/새그림제작불필요.공용풀번호누락없음.
-현행18항목모두easy_for_master=1과special_action[2]의bj장면덮어쓰기다.원문동작은13종이다.원문플래그를되살리면수치심/통증/혐오/모욕/해충/구속/동성성향등의기존수용·반응판정을사용한다.
-행동력:현행은전부easy_for_master=1.원문복원시3번동시삽입/4번주먹/15번해충은기본소모,7번피학과16번구속은주인공기술에따라할인여부가달라진다.새공식이나수치추가가아닌원문플래그복원이지만현행보다소모가늘수있다.
-lesbo선택은$ero_rwd_img(배열)대신$erotic_rwd_img(선택된값)를검사해야조수와의합성장면루트를탄다.수정안은승인된성인범위에만제한한다.

## 준비한 전체복원안
-남주18종의4문구/이미지키/이미지폴더/소리/추가동작을첨부2.2.3과일치시킨다.현재후보조건·무작위·보상기본수치는유지한다.
-주대상은young/milf로제한하고,죄수관련8번과조수관련13번은보조대상도같은성인범위여야복원자료를사용한다.여주및그외경로는기존유지.새저장필드없음.
-1번중복설명은첫단체설명만복원하고잘못덮어쓰는죄수설명은제외한다.위의2폴더는현행경로로수정한다.
-COMPLETE_PROPOSED_PATCH.json에검토가능한2개변경을기록했다.아직게임반영/엔진실행검사전이다.원래조건·문구외효과까지복원하므로이번대조후사용자결정이필요하다.

비교표의동작코드파서가special_action[2]같은중첩대입앞부분을놓치던표시문제도바로잡았다.게임코드는바꾸지않았다.
