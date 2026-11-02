# 전투 글꼴 기준 확인

운영 파일 수정 없음. 기준 수치와 부모 후보 CSS만 독립 대조했다.

- 첨부의 큰 속성값: **경기천년제목 Medium,20px**. base.css #barn_stat_bar:3702와 #interaction_stat_bar:1626은 line-height111%(CSS상22.2px)다. choice_screen:78/black_market_interface:80이 해당 wrapper를 쓴다. 작은 항목명만12px이며 값 앵커는20px 상속이다. #left_column:1392도20px다.
- 원래 전투 기록: **Sandoll 미생,23px,line-height normal**. 첫 시험판 전 백업 CSS #fight_txt:3194가23px이며 Start:23/start_refresh:26의 $FNAME에서 family를 상속한다.
- v01 첫 시험판은 진행20px/27px, 결과18px/23px였다. 최근 확대판은 경기천년 계열22px(진행line28/결과line25)이었다. 첫 시험판20/18과 원본23은 구분해야 한다.
- 원본 복구는 Sandoll 미생23px 명시가 필요하다. 현재 root가 경기천년 계열이어서 inherit만 쓰면 원본이 아니다.
- 사용자가 제시한 크기 기준은 큰 값20px이며 작은 라벨12px가 아니다. 이름26px는 유지한다. 참고 줄높이111%를 클릭 영역·행 높이 전체에 강제하는 것은 별개 사안이다.

## 후보 독립 확인

결론: **PASS**. CSS fa13249826e1a58f6f8cfd9fcddccc1296d5eab68ce4adf0e58422fa62a149cf.

BATTLE_FONT_LAYOUT 블록과 결과 전용4규칙을 제외한 CSS 바이트는 동일하다. 좌측 결과 아이콘은43/540, 우측은1085/540으로 옮기며 크기는유지한다. 결과 로그는258/646/763/150, 제목left258/width763으로바뀐다. 이외색상·효과층·일반화면규칙은 동일하다. 새 font 블록은 이름26, 기타UI20, 기록Sandoll23/normal이다. 뒤 결과 로그규칙은top/height만바꿔23/normal을재덮지않는다. QSP·JS해시도동일하다. 저장 파일 생성은취소된사용자범위이며이작업에서세이브를만들지않았다.


최종 정렬 후보 독립 검토: a6e5032d8ec55f17662b5bd64a00dbe065030a6f4fe808ddb63df10801760e2f. 이전 검토 후보 fa13249826e1a58f6f8cfd9fcddccc1296d5eab68ce4adf0e58422fa62a149cf에서 결과 로그의 가운데 정렬을 왼쪽 정렬로 바꾸고 전투 로그 글꼴 블록에 왼쪽 정렬을 명시한 두 선언만 달라졌다. 두 변경을 역적용한 파일의 SHA-256이 이전 후보와 일치한다. 글꼴·크기·색상·줄바꿈 방식·레이어·QSP·JS의 추가 변경은 없다. 이전 레이아웃 검증의 대상은 fa 후보이며 최종 정렬·색상 검증은 a6 후보를 대상으로 부모 에이전트가 별도 수행한다.
