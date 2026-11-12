// 핸드오프 9장·7장의 직업별 스킬·특성 결정을 사람이 읽는 형태로 적은 원본. build-occupation-specs.mjs가 이것을 검증해 dist/data/occupation-specs.json으로 만든다
// 규칙 종류: chance(확률 추첨) · grant(확정 부여) · exclude(추첨 대상에서 제외) · forbid(등장 금지) · raise(확률 상승, 수치 미정)
//          group(배척 그룹 추첨) · skillMin(스킬 최저 등급) · skillExclude(해당 스킬 등급 제외) · note(데이터화 불가 메모)
// probability: 숫자(%)는 확정, null은 미정. 미정 수치를 임의로 채우지 않는다(핸드오프 7장 확률 해석).
// mode(chance만): 'add'(기본) = 게임 기본 추첨 확률에 %p를 더함, 'final' = 그 직업 최종 비율. 그룹·단계형 추첨은 최종 비율(사용자 결정 2026-11-12, 원 인계 7장 확률 해석을 대체)
export const SOURCE='docs/JO9_Stats_Background_Generation_Handoff_20261112.md';
export const SKILLS={화술:'expression',음악:'music',미술:'art',무용:'calisthenics',비서:'secretary',간호:'nurse',체력:'stamina',집안일:'service',전투:'gladiatrix'};
export const SPECS=[
 {label:'평민',occupations:['poor_bride'],line:185,rules:[{type:'note',text:'직업 추가 특성 없음'}]},
 {label:'사냥꾼',occupations:['huntress'],line:186,rules:[
  {type:'chance',trait:'촌뜨기',probability:10},{type:'chance',trait:'높은 대사량',probability:10},
  {type:'note',text:'문명생활 밖 직업의 촌뜨기 공통 규칙은 대상 목록이 정해지지 않았다'}]},
 {label:'바이킹의 아내',occupations:['viking_wife'],line:187,rules:[
  {type:'forbid',trait:'처녀',text:'비처녀 100%'},{type:'chance',trait:'물 기호증',probability:40},{type:'chance',trait:'촌뜨기',probability:10}]},
 {label:'수녀',occupations:['nun'],line:188,rules:[
  {type:'chance',trait:'은둔형 외톨이',probability:20},{type:'chance',trait:'동성애 혐오자',probability:20},
  {type:'chance',trait:'순수한 영혼',probability:50},{type:'chance',trait:'노출 기피',probability:70},
  {type:'chance',trait:'처녀',probability:90,mode:'final'},{type:'exclude',trait:'너그러움'}]},
 {label:'살인마',occupations:['serial_killer'],line:189,rules:[
  {type:'chance',trait:'혈액 기호증',probability:50},{type:'grant',trait:'가학성애자'},{type:'chance',trait:'무모함',probability:50},
  {type:'chance',trait:'자유로운 영혼',probability:30},{type:'note',text:'직업 전투 스킬 부여 없음'}]},
 {label:'범죄자 공통',occupations:['thief','thug','brigand','contraband','gang_member','mafia_boss','hacker'],line:190,rules:[
  {type:'chance',trait:'자유로운 영혼',probability:20,text:'사용자 결정 2026-11-12: 경범·폭력·조직 두목 모두 20%. 살인마는 별도 30%'}]},
 {label:'도둑',occupations:['thief'],line:191,rules:[{type:'skillMin',skill:'체력',grade:'C',text:'초기 체력 죽어감(0)·쇠약함(1) 제외'}]},
 {label:'목축업자',occupations:['milker','swiner'],line:192,rules:[
  {type:'skillMin',skill:'간호',grade:'B'},{type:'skillMin',skill:'비서',grade:'B'},
  {type:'note',text:'게임 외양간지기 임명 조건(menu_form 4930): moral >= 3, nurse > 2, secretary > 2. 간호·비서 B는 게임과 일치. moral 3 이상 조건이 추가로 있다'},
  {type:'note',text:'다른 추가 보너스 없음'}]},
 {label:'하녀',occupations:['maid','valertry'],line:193,rules:[
  {type:'note',text:'타고난 하녀 발견 누적 경험치 기준을 절반으로. 성의 하녀(valertry) 포함 여부 확인 필요'}]},
 {label:'여마법사의 제자',occupations:['sorceress'],line:194,rules:[
  {type:'chance',trait:'강한 복종심',probability:20},{type:'skillMin',skill:'집안일',grade:'C',text:'집안일 보너스. 노예근성으로 대체하지 않음'}]},
 {label:'공주계열',occupations:['mprincess','barbarian_princess'],line:195,rules:[
  {type:'chance',trait:'거센 반항심',probability:20},{type:'chance',trait:'벌레 공포증',probability:30},{type:'chance',trait:'품위있는 여자',probability:70},
  {type:'skillExclude',skill:'화술',grades:['F']},{type:'skillExclude',skill:'음악',grades:['F']},{type:'skillExclude',skill:'미술',grades:['F']},{type:'skillExclude',skill:'무용',grades:['F']},
  {type:'skillExclude',skill:'비서',grades:['F'],text:'원 인계의 회계 F 제외를 비서로 대체(사용자 결정 2026-11-12)'}]},
 {label:'직조공',occupations:['weaver'],line:196,rules:[{type:'chance',trait:'끈기',probability:20},{type:'chance',trait:'불감증',probability:10}]},
 {label:'선반공',occupations:['freaser'],line:196,rules:[
  {type:'chance',trait:'끈기',probability:20},{type:'chance',trait:'불감증',probability:10,text:'직조공과 같은 수치(사용자 결정 2026-11-12)'}]},
 {label:'페미니스트',occupations:['sufragist'],line:197,rules:[
  {type:'group',options:[{trait:'레즈비언',probability:30},{trait:'양성애자',probability:30}],none:40},
  {type:'chance',trait:'과대망상',probability:30},{type:'chance',trait:'거센 반항심',probability:20}]},
 {label:'운동선수 공통',occupations:['voleyball','karateka','hymnast'],line:198,rules:[
  {type:'skillMin',skill:'체력',grade:'B'},{type:'chance',trait:'운동광',probability:70}]},
 {label:'경찰관류',occupations:['policewoman','mind_contol','time_plice','jailer'],line:199,rules:[
  {type:'exclude',trait:'끈기'},{type:'skillExclude',skill:'화술',grades:['F'],text:'원 인계 화술 제외 = 화술 F 제외(사용자 결정 2026-11-12)'}]},
 {label:'시공경찰관',occupations:['time_plice'],line:199,rules:[{type:'chance',trait:'건강체질',probability:20}]},
 {label:'미래경찰',occupations:['mind_contol'],line:199,rules:[{type:'exclude',trait:'용감함'},{type:'chance',trait:'옹졸함',probability:20}]},
 {label:'교도관',occupations:['jailer'],line:199,rules:[{type:'chance',trait:'가학성애자',probability:10}]},
 {label:'대학생',occupations:['student'],line:200,rules:[{type:'chance',trait:'천재',probability:5}]},
 {label:'작가',occupations:['writer'],line:200,rules:[
  {type:'chance',trait:'천재',probability:5},{type:'exclude',trait:'끈기'},{type:'chance',trait:'달변가',probability:30},{type:'chance',trait:'야심가',probability:5}]},
 {label:'화가',occupations:['artist'],line:200,rules:[{type:'chance',trait:'야심가',probability:5}]},
 {label:'모델',occupations:['model'],line:201,rules:[
  {type:'exclude',trait:'운동광'},{type:'exclude',trait:'품위있는 여자'},{type:'forbid',trait:'낮은 대사량'},{type:'forbid',trait:'미약한 대사량'},
  {type:'chance',trait:'절세미인',probability:5}]},
 {label:'클러버',occupations:['major'],line:202,rules:[
  {type:'chance',trait:'미련한 소',probability:null},{type:'chance',trait:'이국적인 댄서',probability:null},{type:'chance',trait:'무기력함',probability:null},
  {type:'skillExclude',skill:'무용',grades:['F','D']},{type:'exclude',trait:'무모함'}]},
 {label:'무용가',occupations:['dancer'],line:203,rules:[{type:'grant',trait:'이국적인 댄서'},{type:'exclude',trait:'끈기'}]},
 {label:'우주군 사관생도',occupations:['academy'],line:204,rules:[
  {type:'chance',trait:'야심가',probability:5},{type:'exclude',trait:'용감함'},{type:'chance',trait:'거센 반항심',probability:null},
  {type:'note',text:'비서 제외: 비서 스킬 등급인지 다른 뜻인지 확인 필요'}]},
 {label:'전투로봇 파일럿',occupations:['mech'],line:205,rules:[{type:'grant',trait:'거센 반항심'},{type:'grant',trait:'운동광'},{type:'exclude',trait:'용감함'}]},
 {label:'궤도 정비공',occupations:['installer'],line:206,rules:[{type:'chance',trait:'운동광',probability:20}]},
 {label:'영웅 여전사',occupations:['heroine'],line:148,rules:[
  {type:'tiered',entry:20,first:['타고난 투사','용감함'],second:{probability:20,traits:['역전의 용사','성기사','광전사']},
   text:'20% 진입 → 둘 중 하나 확정 → 진입자 중 20%에 셋 중 하나(전체 4%). 그룹 안 세부 가중치는 미정'}]},
 {label:'소녀·여학생',occupations:['tribal_girl','schoolgirl'],line:94,rules:[
  {type:'note',text:'두 직업의 기본 직업 보너스는 같다. 소녀에 순수한 영혼 추가 지시가 있었으며 두 직업 공통 적용 여부는 확인 필요'}]},
];
