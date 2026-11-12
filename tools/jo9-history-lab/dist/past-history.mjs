// 랜덤 노예의 세계·출신·직업과 생성 직후 게임 값으로 영입 전 과거 경험 초기값을 만드는 공식(QSP 이식용 정수 연산)
import {seededUnit,split} from './engine.mjs';

const SUB={petting:['sub_hj','sub_fj','sub_hug','sub_paizuri'],oral:['sub_kiss','sub_tongue','sub_bj','sub_dt','sub_asslik'],penetration:['sub_vaginal','sub_anal','sub_fisting','anal_stretch']};
const clampGrade=v=>Math.max(0,Math.min(5,Math.trunc(Number(v)||0)));
// QSP의 정수 나눗셈과 같게 0 쪽으로 버린다.
const idiv=(a,b)=>Math.trunc(a/b);

export function ruleMatches(stock,r){const v=Number(stock[r.key]??0);return r.op==='>'?v>r.value:r.op==='<'?v<r.value:v===r.value;}
// 성욕 계열 특성은 하나만 적용한다(nymphomania 값 하나에 대응).
export function libidoFactor(stock,formula){const r=formula.traits?.libido.rules.find(x=>ruleMatches(stock,x));return {name:r?.name??'없음',factor:r?.factor??100};}

export function attributeFactor(stock,formula){
 const A=formula.attributes;if(!A)return {factor:100,parts:[]};
 let f=100;const parts=[];
 const raw=key=>stock[key]!==undefined&&stock[key]!==null&&Number.isFinite(Number(stock[key]))?Math.trunc(Number(stock[key])):null;
 // 상처·흉터·성형이 섞인 현재값 대신 기본값(base_*)을 쓴다. 기본값이 없으면 현재값.
 const num=key=>{const src=A.source?.[key];if(!src)return raw(key);let v=raw(src.use);if(v===null)return raw(key);
  for(const [k,add]of Object.entries(src.plus??{}))if(raw(k)===1)v+=add;return src.cap===undefined?v:Math.min(src.cap,v);};
 for(const [key,{name,base,per}]of Object.entries(A.linear)){const v=num(key);if(v===null)continue;const d=per*(v-base);f+=d;if(d)parts.push(`${name}${d>0?'+':''}${d}`);}
 for(const [key,{name,values}]of Object.entries(A.table)){const v=num(key);if(v===null)continue;const d=values[String(v)]??0;f+=d;if(d)parts.push(`${name}${d>0?'+':''}${d}`);}
 return {factor:Math.max(A.min,Math.min(A.max,f)),parts};
}

const ACT_SKILLS={vaginal:['sub_vaginal'],oral:['sub_bj','sub_dt','sub_tongue'],anal:['sub_anal','anal_stretch']};
export function actWeights(stock,formula){
 const w={},applied=[];
 for(const [act,keys]of Object.entries(ACT_SKILLS)){const g=Math.max(...keys.map(k=>clampGrade(stock[k])));w[act]=g*g*100;}
 for(const r of formula.traits?.acts.rules??[])if(ruleMatches(stock,r)){
  for(const act of ['vaginal','oral','anal'])if(r[act]!==undefined)w[act]=idiv(w[act]*r[act],100);
  applied.push(r.name);
 }
 if(stock.virginity<2){w.vaginal=0;applied.push('처녀: 질 0');}
 // 기술이 모두 0이면(비처녀 최소 경험 등) 비처녀는 질, 처녀는 구강으로 둔다.
 if(w.vaginal+w.oral+w.anal===0){if(stock.virginity>1)w.vaginal=1;else w.oral=1;applied.push('기술 0: 기본 배정');}
 return {weights:w,applied};
}

export function tierOf(formula,kind,id){
 for(const [name,tier]of Object.entries(formula[kind]))if(name!=='default'&&tier.ids?.includes(id))return {name,factor:tier.factor};
 return {name:'default',factor:formula[kind].default.factor};
}

// 같은 입력이면 같은 결과. 게임에서는 rand(min,max)로 바꾼다.
// 시드 문자열은 해시로 한 번만 정수로 바꾸고, 수열은 mulberry32로 뽑는다(연속 문자열 해시는 서로 상관이 생긴다).
export function makeRand(seed){
 let s=Math.floor(seededUnit(seed)*4294967295)>>>0;
 const next=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 return (min,max)=>min+Math.floor(next()*(max-min+1));
}

// 랜덤 노예는 seed_sub_* 없이 0에서 시작해 직업·연령 보너스로 일부 기술만 오른다. 평균을 쓰면 거의 0이 되므로 묶음별 최고 기술을 쓴다.
export function skillGrades(stock){
 return Object.fromEntries(Object.entries(SUB).map(([k,keys])=>[k,Math.max(...keys.map(key=>clampGrade(stock[key])))]));
}

/**
 * stock: 생성이 끝난 게임 인물 값 { world, family, occupation, age, virginity, fertility, pregnant, clone, sub_* ... }
 * 반환: 성적 경험 총횟수, 임신·출산, 계산 과정. null은 미상(추정하지 않음).
 */
export function pastHistory(stock,formula,seed='0'){
 const rand=makeRand(`${seed}|${stock.world}|${stock.family}|${stock.occupation}`);
 const trace=[];
 const result={intimacy:0,pregnancies:null,births:null,excluded:false,trace};
 if(formula.excludedAges.includes(stock.age)){result.excluded=true;result.intimacy=null;trace.push('연령 코드 1은 통계 대상이 아니다');return result;}
 const occ=tierOf(formula,'occupation',stock.occupation),fam=tierOf(formula,'family',stock.family),wld=tierOf(formula,'world',stock.world);
 const grades=skillGrades(stock),w=formula.skillWeights,wsum=w.petting+w.oral+w.penetration;
 const base=idiv(formula.gradeBase[grades.petting]*w.petting+formula.gradeBase[grades.oral]*w.oral+formula.gradeBase[grades.penetration]*w.penetration,wsum);
 trace.push(`기술 등급 애무 ${grades.petting}·구강 ${grades.oral}·삽입 ${grades.penetration} → 기준량 ${base}`);
 if(stock.clone){trace.push('클론·기술 주입: 성경험 0');}
 else if(occ.factor===0){
  trace.push(`처녀 고정 배경(${stock.occupation}): 성경험 0`);
  if(stock.virginity>1)trace.push('처녀 고정 배경이지만 생성 값이 비처녀다(generate_stock 1226행 등). 생성 값을 따른다');
 }
 else{
  const lib=libidoFactor(stock,formula),attr=attributeFactor(stock,formula),age=formula.ageFactor[String(stock.age)]??100,vary=rand(100-formula.variationPct,100+formula.variationPct);
  // 곱셈 순서를 고정하고 단계마다 100으로 나눠 QSP 정수 범위를 넘지 않게 한다.
  let v=base*occ.factor;v=idiv(v*fam.factor,100);v=idiv(v*wld.factor,100);v=idiv(v*age,100);v=idiv(v*lib.factor,100);v=idiv(v*attr.factor,100);v=idiv(v*vary,100);v=idiv(v,100);
  result.intimacy=Math.max(0,v);
  trace.push(`× 직업 ${occ.name} ${occ.factor} × 출신 ${fam.name} ${fam.factor} × 세계 ${wld.factor} × 연령 ${age} × 성욕 ${lib.name} ${lib.factor} × 속성 ${attr.factor}${attr.parts.length?'('+attr.parts.join(' ')+')':''} × 변동 ${vary} (각 /100) = ${result.intimacy}`);
 }
 // 비처녀인데 계산 결과가 0이면 생성 값을 따라 최소 경험을 준다(사용자 결정 2026-11-11).
 if(!stock.clone&&stock.virginity>1&&result.intimacy<1){
  const [min,max]=formula.nonVirginMinimum;
  result.intimacy=rand(min,max);
  trace.push(`비처녀 최소 경험: rand(${min},${max}) = ${result.intimacy}`);
 }
 if(result.intimacy>0){
  const {weights,applied}=actWeights(stock,formula);
  const [vaginal,oral,anal]=split(result.intimacy,[weights.vaginal,weights.oral,weights.anal]);
  result.acts={vaginal,oral,anal};
  const P=formula.traits?.partners,same=P?(P.samePct[String(stock.homosexualism??0)]??P.samePct.default):0,non=P?.nonhumanPct??0;
  const [opposite,sameSex,nonhuman]=split(result.intimacy,[(100-non)*(100-same),(100-non)*same,non*100]);
  result.partners={opposite,sameSex,nonhuman};
  trace.push(`행위 가중치 질 ${weights.vaginal}·구강 ${weights.oral}·애널 ${weights.anal}${applied.length?' ('+applied.join(', ')+')':''} → 질 ${vaginal}·구강 ${oral}·애널 ${anal}`);
  trace.push(`상대 동성 ${same}%·인간 외 ${non}% → 이성 ${opposite}·동성 ${sameSex}·인간 외 ${nonhuman}`);
 }else if(result.intimacy===0){result.acts={vaginal:0,oral:0,anal:0};result.partners={opposite:0,sameSex:0,nonhuman:0};}
 if(occ.name==='married'){
  if(stock.fertility<0){result.pregnancies=0;result.births=0;trace.push('불임·미성숙: 임신·출산 0');}
  else if(stock.virginity<2){result.pregnancies=0;result.births=0;trace.push('유부녀지만 처녀(원숙한 신부가 이름만 아내로 바뀐 경우 등): 임신·출산 0');}
  else{
   const [ymin,ymax]=formula.marriage.years[String(stock.age)]??formula.marriage.years['0'];
   const years=rand(ymin,ymax);
   const culture=Object.entries(formula.marriage.pregnancyPerYearPct).find(([,c])=>c.ids.includes(stock.world));
   const pct=culture?culture[1].pct:formula.marriage.pregnancyPerYearPct.modern.pct;
   let pregnancies=0,births=0;
   for(let y=0;y<years;y++)if(rand(1,100)<=pct)pregnancies++;
   for(let p=0;p<pregnancies;p++)if(rand(1,100)<=formula.marriage.birthPerPregnancyPct)births++;
   result.pregnancies=pregnancies;result.births=births;
   trace.push(`결혼 ${years}년 × 해마다 ${pct}%(${culture?.[0]??'modern'}) → 임신 ${pregnancies}, 임신마다 ${formula.marriage.birthPerPregnancyPct}% → 출산 ${births}`);
  }
 }
 if(stock.pregnant>0){
  // 영입 시점에 이미 임신 중이면 그 임신은 경험에 넣고 출산에는 넣지 않는다.
  result.pregnancies=(result.pregnancies??0)+1;if(result.births===null)result.births=0;
  trace.push('영입 시 임신 중: 임신 +1');
 }
 return result;
}
