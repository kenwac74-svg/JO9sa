# 2.4.1 사람이 직접 확인할 항목

자동 검사는 합성 상태의 함수·분기와 파일 구성을 확인했다. 아래 화면 배치·그림·실제 클릭·저장 복원은 아직 사람이 실행하지 않았다. 기존 공개 TC 7개를 그대로 사용하며 새 시험 SAV를 제작하지 않았다.

[Full 폴더](<G:/somi/Jack O Nine Tails v2.4 Kor_Full>)의 [게임 실행.cmd](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/게임 실행.cmd>)로 완전히 새로 실행한다. 각 항목은 원래 TC를 새로 불러오고 원본에 덮어저장하지 않는다. 이전 버전에서 만든 TC의 업데이트 안내는 오류 여부와 구분해 문구를 기록한다. 우선 H02·H03·H04·H07만 하면 약25분, 전체8개는 약42분이다.

|순서|시작점과 동작|확인할 결과|
|---|---|---|
|H01 P1|[게임 실행.cmd](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/게임 실행.cmd>)<br>배포 루트의 게임 실행.cmd로 시작한다. 창 제목과 제작진 감사를 연다.<br>새 게임 첫 화면과 Game → Load 메뉴가 열리는지 확인한다.|2.4.1 표기와 PSP_PSP / zonezizone / 콤콤삼촌 감사 항목을 읽을 수 있다.<br>글자·링크가 잘리거나 진입 직후 진행이 멈추지 않는다.|
|H02 P0|[공개 TC_03_CATFIGHT_VICTORY.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_03_CATFIGHT_VICTORY.sav>)<br>처형 → 오른쪽 엄지 → 결과문·상금 $100·잔액 → 클럽 복귀 순으로 진행한다.<br>같은 세션에서 집으로 가 목욕·주인공 요리·청소를 각각 시작한다.<br>TC를 다시 불러와 살려주기 결과도 비교한다.|처형·생존은 서로 다른 컷이며 상금 $100과 성장 안내가 한 페이지에 나온다.<br>생활 장면에 이전 경기 컷이 남지 않는다. 장면·앞뒤 버튼·하단 문구가 제대로 보인다.<br>반복 넘김으로 보상·승수가 다시 증가하지 않는다.|
|H03 P0|[공개 TC_02_CATFIGHT_INTRO.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_02_CATFIGHT_INTRO.sav>)<br>소개에서 현재 노예 이사벨라의 이름을 읽고 다음으로 전투에 진입한다.<br>행동·무기 기술을 선택해 2~3턴 진행하고 긴 전투 기록을 스크롤한다.<br>전투 소리를 켰다 끄고, 좌우150×150 초상 주변도 본다.|옛 에게야 소개 이름이나 빈 참가자 패널이 없다.<br>좌하단 행동·우하단 무기·기록·타격이 프레임 밖으로 벗어나거나 겹치지 않는다. 로그 끝 글자를 읽을 수 있다.<br>포커스를 바꾸면 사라지는 검은 잔상은 별도 D15로 기록한다.<br>실제 인물 초상·소리가 정상인지 본다. 초상 주변 빈 배경은 CSS content/a.jpg 후보와 구분해 캡처한다.|
|H04 P0|[공개 TC_06_FOG_GROUP.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_06_FOG_GROUP.sav>)<br>준비 안내에서 주인공 또는 조수를 출전시킨다. 적 초상을 바꾸고 공격·피격을 본다.<br>승리 후 결과와 복귀까지 진행한다.|검은 의사와 하인들이 보이고 승리 결과는 단체 패배 그림 한 장이다.<br>개별 패배 그림 겹침·순간적인 다른 프레임·타격 때 틀 이동이 없다. 그림의 절단·부자연스러운 구도는 캡처한다.|
|H05 P1|[공개 TC_01_HOME_TRAITS.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_01_HOME_TRAITS.sav>)<br>노예·조수 정보에서 특성 제목을 눌러 전체보기를 연다.<br>특성·상태·칭호를 각 1개 눌러 하단 설명을 읽는다. 등급 도움말 MSG를 열고 닫은 뒤 전체보기도 닫는다.<br>가능한 역할 복장을 바꾸고 개인실에 갔다 돌아온다.|목록 끝·칭호 열·하단 설명이 가려지지 않는다. MSG가 전체보기 뒤에 갇히지 않는다.<br>닫으면 원래 인물·문구로 돌아온다. 역할에 맞는 복장이 나오고 메뉴가 계속 동작한다.|
|H06 P1|[공개 TC_04_AGRABAH_FRUIT.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_04_AGRABAH_FRUIT.sav>)<br>발삼 상점 환전 화면의 보유 금화를 본 뒤 뒤로 가 작은 과일을 2번 산다.<br>와인 상점에서 소형 와인을 사고 각 아이콘 툴팁을 띄운다.<br>집의 식품 저장고에서 신선한 과일·아그라바 와인 수량과 목록 끝을 본다.|결제 통화·보유 금화·구매 수량이 일치하고 두 특수 재고 행이 잘리지 않는다.<br>연회 주문에는 의뢰·기구매·자금 조건 안내가 있다.|
|H07 P0|[공개 TC_05_BANKRUPTCY_CHAIN.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_05_BANKRUPTCY_CHAIN.sav>)<br>장식 처분 → 빈민가 이주 → 노예 급매 → 조수 급매 순으로 제시 항목을 진행한다.<br>TC를 다시 불러와 직접 방법을 찾는다로 나갔다가 정산 화면에 돌아온다.|처분 내역·시설·인물 상태가 안내와 맞고 중복 수입이 없다.<br>미해결 청구가 사라지지 않고 날짜 진행으로 회피되지 않는다. $50,000 시험 청구의 최종 파산 엔딩은 예정 결과다.|
|H08 P1|[공개 TC_07_EGEYA_EVENT.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_07_EGEYA_EVENT.sav>)<br>도전을 수락하고 전투에서 에게야 전신과 공격 대사를 확인한다.<br>전투 종료 후 다음 화면으로 진행한다.|붉은 배경만 남지 않고 전투 전신이 보인다. 글라디우스와 모순되는 톱니채찍 문구가 없다.<br>빈 화면·진행 중단·잘못된 캐릭터 컷이 없다.|

가능할 때만 아래3개를 더 확인한다. 같은 공개 TC를 사용하며 개인 SAV는 열지 않는다.

|추가|준비·실행|기대 결과|
|---|---|---|
|O01 깨끗한 PC·이동 실행|개발 도구·추가 팩이 없는 Windows 환경에 Full 전체 점검 사본을 공백·한글 경로로 복사한다. 네트워크를 끄고 CMD로 실행해 [공개 TC_01_HOME_TRAITS.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_01_HOME_TRAITS.sav>) 정보, [공개 TC_02_CATFIGHT_INTRO.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_02_CATFIGHT_INTRO.sav>) 전투, [공개 TC_04_AGRABAH_FRUIT.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_04_AGRABAH_FRUIT.sav>) 상품을 연다. 소리 켜기·도시/전투 전환도 본다.|2.4.1·한글·인물·UI·소리가 동작하며 제작자 G드라이브·모드툴·외부 코덱을 요구하지 않는다. 현재 감사 PC의 DLL 존재 검사로 이 항목을 대신하지 않는다.|
|O02 DPI·클릭 위치|Windows 배율100%와 실제 사용 배율에서 [공개 TC_01_HOME_TRAITS.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_01_HOME_TRAITS.sav>) 특성/장문 설명과 [공개 TC_02_CATFIGHT_INTRO.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_02_CATFIGHT_INTRO.sav>) 전투를 열고 닫는다.|글자·스크롤·하단/우측 버튼이 잘리지 않고 보이는 위치를 누르면 정확히 반응한다.|
|O03 별도 QA 저장/재로드|쓰기 가능한 별도 점검 사본에서 [공개 TC_03_CATFIGHT_VICTORY.sav](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save/TC_03_CATFIGHT_VICTORY.sav>) 선택 대기를 새 QA_TEST_PENDING 슬롯에 저장한다. 재시작·로드 후 한 번 완료하고 새 QA_TEST_DONE 슬롯에 저장·재로드한다. 이후 TC01→TC02→TC06→TC01도 같은 세션으로 연다.|대기는 한 번 완료 가능, 완료 화면은 상금·승수·성향을 추가 정산하지 않는다. 저장 위치·CRC/로드·이전 인물/배경 잔류를 확인한다. 원본 공개 TC와 개인 슬롯은 덮어쓰지 않는다.|

실패는 **H/O ID, 세이브 이름, 누른 메뉴, 기대/실제, 재현 횟수, 캡처**로 남긴다. 이식성 문제에는 Windows 버전·설치 경로·배율도 적는다.

## 아직 준비되지 않은 상태

G01~G09의9묶음은 그대로 미준비다: 콜로세움·연습/패배, 위탁, 엘자, 방2성장, 기간 결산/웡 항의, 상한 경계 판매, 캣파이트 패배/관람, 인코딩/줄리아, WORK 조건 컷 전용 상태. 이 항목을 공개 TC7개로 확인했다고 표시하지 않는다. 정확한 트리거는 [TC_PLAN.md](<C:\Users\User\.codex\.chatgpt-projects\g-p-6aad063c991081918e27b6675f290be7\output\qa-bounty-241-20261101\lead/TC_PLAN.md>)와 execution-map.json에 있다.

WORK 전용 조건 컷의 수동 전환 결함은 자동 native로 확인했다. 현재 생산본은 미수정이다. Full에는 이 기능을 동기화하지 않았으므로 위8항목으로 수정 후보의 채택/완료를 판정하지 않는다.

워크숍·Show HTML, 마법낙인 재현, 포커스 검은 잔상, 장기 임신 제보는 보류/미해결 상태를 유지한다. 전차 경주용 공개 상태는 이번 점검에 없으므로 초상 주변 후보의 경주 분기를 완료로 세지 않는다.
