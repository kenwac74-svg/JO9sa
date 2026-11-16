// Nonsexual initial stats and occupational talents only. Numerical translation into JO9 is a balancing choice, not a canonical stat table.
const row=(type,reason,values)=>({type,reason,values:Object.fromEntries(Object.entries(values).map(([k,v])=>['seed_'+k,v]))});
module.exports=[
row(8877,'의료 B·간호 적성과 동료를 돌보던 경력은 이미 일치하므로 유지.',{}),
row(8878,'쿠마 보조·사람 관리와 대인 눈치를 화술 B·화술 적성으로 표현.',{expression:3,expression_affinity:1}),
row(8879,'자유와 자극을 좇는 활동형. 천재 연구자와 구분하고 신체 활동·사교를 보완.',{intellect:3,temper:5,ego:3,pride:3,calisthenics:2,expression:2,psy_basic:'optimistic'}),
row(8880,'용병 자금과 인원 운용 경험을 사무·화술 B로 반영. 기존 지성·전투·적성은 유지.',{secretary:3,expression:3}),
row(8881,'저격수의 전투 A와 기존 지성은 유지.',{}),
row(8882,'해킹·신호 분석은 로마의 마법 숙련으로 보지 않는다. 기존 사무 기술로 정보 처리 B·높은 적성을 표현.',{secretary:3,secretary_affinity:3,temper:4,pride:1,psy_basic:'optimistic'}),
row(8883,'실험·저격 훈련은 전투 A로, 생소한 일에 순서대로 지시가 필요한 성격을 내성적·소심·솔직으로 반영. 지성은 유지.',{gladiatrix:4,gladiatrix_affinity:1,temper:2,ego:2,pride:1}),
row(8884,'회장 비서·상점 운영자: 비서 A·화술 A. 전문적인 업무 능력과 협상 적성을 반영.',{secretary:4,expression:4,secretary_affinity:3,expression_affinity:1,temper:4,ego:4,pride:3}),
row(8885,'전투 S의 특수 인재 성격은 보존. 임시 운영 경험은 비서 B, 치료 지원은 의료 A로 분리해 만능 S 복제를 완화.',{secretary:3,nurse:4,nurse_affinity:1,gladiatrix_affinity:1}),
row(8886,'A+ 외모를 4로 번역. 밝고 정의감 강한 우등생: 건강함·적극적·단호함·솔직함, 기초 사무·화술.',{beauty:4,stamina:3,sensitivity:4,temper:4,ego:4,pride:1,service:1,secretary:1,expression:2,psy_basic:'optimistic'}),
row(8887,'칼·잠입·정보 중개 경력: 전투 A·화술 A·비서 B. 재추첨되는 태도0을 당당함으로 지정.',{gladiatrix:4,secretary:3,expression:4,expression_affinity:1,pride:3}),
row(8888,'A+ 외모4. 명문가 수재: 지성5·냉담·차가움·단호함, 비서 C와 적성. 무정함/무관심함0의 재추첨을 방지.',{beauty:4,intellect:5,sensitivity:1,temper:1,ego:4,pride:3,secretary:2,secretary_affinity:1}),
row(8889,'전투 A·근육질·학문과 예법 관련 기술이 이미 있어 유지.',{}),
row(8890,'A 외모4. 인정받고 싶은 허세와 내성적인 면을 구분. 화술 C·취미 미술 D, 실제 마법은 부여하지 않음.',{beauty:4,sensitivity:4,temper:2,ego:3,pride:4,intellect:3,expression:2,art:1}),
row(8891,'A 외모4. 근육질·진압반장: 체력5·전투 A·전투 적성, 적극적·완고함. 사무와 현장 지휘의 화술 C.',{beauty:4,stamina:5,sensitivity:3,temper:4,ego:5,pride:3,intellect:3,gladiatrix:4,gladiatrix_affinity:1,secretary:2,expression:2}),
row(8892,'원작 S 외모5 유지. 아이돌: 음악 A·무용 A·화술 B, 음악/무용 적성. 무대 밖 높은 자존심을 태도로 표현.',{stamina:3,sensitivity:3,temper:4,ego:4,pride:5,intellect:3,music:4,calisthenics:4,expression:3,music_affinity:1,calisthenics_affinity:1}),
row(8893,'원작 B 외모3. 말로 상대를 움직이려는 자신감과 미숙함: 적극적·단호함·건방짐·화술 C.',{beauty:3,sensitivity:3,temper:4,ego:4,pride:4,intellect:3,expression:2,expression_affinity:1,psy_basic:'optimistic'}),
row(8894,'A 외모4. 치어리더: 체력4·무용 B·화술 B·운동/무용 적성. 열정적이고 솔직한 낙천성.',{beauty:4,stamina:4,sensitivity:4,temper:5,ego:3,pride:1,intellect:3,calisthenics:3,expression:3,sport_affinity:1,calisthenics_affinity:1,psy_basic:'optimistic'}),
row(8895,'B 외모3. 운동부·위원장: 체력4·운동 적성·무용 C, 적극적·단호함·솔직함, 기초 사무와 화술.',{beauty:3,stamina:4,sensitivity:3,temper:4,ego:4,pride:1,intellect:3,calisthenics:2,sport_affinity:1,secretary:1,expression:2}),
row(8896,'A+ 외모4. 부드럽지만 심지가 강한 대학생·행사 홍보 아르바이트: 건강함·다감함·단호함, 화술 B와 적성·기초 생활 기술.',{beauty:4,stamina:3,sensitivity:4,temper:3,ego:4,pride:1,service:2,cook:1,secretary:1,expression:3,expression_affinity:1}),
row(8897,'B 외모3. 성실하지만 학업·운동에서 두각을 보이지 않는 학생: 평범한 지성2·소심함·의존적, 기초 기술 D. 숙련은 육성으로 남김.',{beauty:3,pride:2,intellect:2,service:1,secretary:1}),
row(8898,'B+ 외모3. 공장 일을 돕던 주부: 건강함·다감함·주관적·솔직함, 집안일 B·요리 B·사무 C.',{beauty:3,stamina:3,sensitivity:4,temper:3,ego:3,pride:1,intellect:3,service:3,cook:3,secretary:2}),
row(8899,'B 외모3. 전문 직업이 없는 인물: 직접적인 지시를 따르는 솔직함·기초 집안일 D. 기존 총명함은 근거가 부족해 평범함2로 설정.',{beauty:3,pride:1,intellect:2,service:1})
];
