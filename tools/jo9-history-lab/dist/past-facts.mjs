// 섹스토크용 과거 사실 생성기: 과거 경험 공식 결과와 생성 값으로 영입 때 한 번 저장할 사실 코드를 정한다
// 같은 노예·같은 시드면 언제나 같은 사실이 나온다(사용자 결정 2026-11-12: 같은 질문에 사실이 바뀌면 안 된다).
import {makeRand,tierOf} from './past-history.mjs';

const SKILL_NAME={sub_hug:'포옹',sub_hj:'손',sub_fj:'발',sub_paizuri:'가슴',sub_kiss:'키스',sub_tongue:'혀',sub_bj:'펠라',sub_dt:'딥스로트',sub_asslik:'항문 핥기',sub_vaginal:'질',sub_anal:'애널',sub_fisting:'피스팅',anal_stretch:'항문 확장'};

// 가중치 표 {코드: 무게}에서 하나 고른다
function pick(rand,table){
 const entries=Object.entries(table),total=entries.reduce((a,[,w])=>a+w,0);
 let r=rand(1,total);
 for(const [k,w]of entries){r-=w;if(r<=0)return k;}
 return entries.at(-1)[0];
}
// 직업 묶음 → 출신 묶음 → default 순으로 표를 고른다
const byTier=(byTierTable,occ,fam)=>byTierTable[occ]??byTierTable[fam]??byTierTable.default;

// 정규분포 표본(Box-Muller). 정수 난수만 써서 QSP로 옮길 수 있게 한다.
function normal(rand,mean,sd){
 const u=rand(1,1000000)/1000001,v=rand(1,1000000)/1000001;
 return mean+sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

/**
 * stock: 생성 값, result: pastHistory 결과, formula: 과거 경험 공식, facts: past-facts.json,
 * acq: 영입 정보 {route:'patrol'|'other', scene:'611xx'(안개 경계 순찰 장면 번호)}
 * 반환: {fields, blocked:{필드:코드}, trace} 또는 대상 아님이면 null
 */
export function pastFacts(stock,result,formula,facts,seed='0',acq={}){
 if(!result||result.excluded)return null;
 const rand=makeRand(`${seed}|facts|${stock.world}|${stock.family}|${stock.occupation}`);
 const occ=tierOf(formula,'occupation',stock.occupation).name,fam=tierOf(formula,'family',stock.family).name;
 const n=result.intimacy??0,acts=result.acts??{vaginal:0,oral:0,anal:0},trace=[],blocked={},f={};

 // 이종 경험: 처녀 여부와 관계없이 영입 경로·이전 주인으로 정한다(이터널 로마 안의 일)
 const X=facts.xeno;
 const sc=acq.route==='patrol'?X.patrolScenes[acq.scene]:null;
 if(sc){f.xeno=sc.kind;if(X.blocked?.[sc.kind])blocked.xeno=X.blocked[sc.kind];trace.push(`이종 경험: 안개 경계 순찰 장면 ${acq.scene}(${sc.label})에서 구해 영입 → ${X.labels[sc.kind]}${blocked.xeno?` [${blocked.xeno}, 표시 불가]`:''}`);}
 else if(occ===X.prevMasterTier&&rand(1,100)<=X.prevMasterPct){f.xeno='prev_master';trace.push(`이종 경험: 노예 출신 ${X.prevMasterPct}% → 이전 주인의 촉수 착정`);}
 else f.xeno='none';

 // 자기가 살던 세상의 동물 경험(B2): 와그(이터널 로마의 괴물)와 따로 둔다. 비율은 사용자가 정한다(기본 0)
 const HA=X.homeAnimal,hp=HA?.pctByWorld?.[stock.world]??0;
 f.home_animal=(n>0&&hp>0&&rand(1,100)<=hp)?1:0;
 if(f.home_animal){blocked.home_animal=HA.code;trace.push(`살던 세상의 동물 경험: ${hp}% → 있음 [${HA.code}, 표시 불가]`);}
 // 페티시: 앞 주제와 연결되지 않는 성향만
 f.fetish=facts.fetish.candidates.filter(c=>Number(stock[c.key]??0)===c.value).map(c=>c.key);

 if(n<=0){
  Object.assign(f,{first_band:'none',partners:0,max_night:0,group:'none',max_day_people:0,orgasm:'never',squirt:0,finish:'none',swallow:0,signature:'',never:'',want:''});
  trace.push('성경험 0: 첫 경험·기록 관련 사실 없음');
  return {fields:f,blocked,trace,occ,fam};
 }

 // 첫 경험 시기: 나이 숫자는 저장하지 않는다. teen은 내부 코드 B1(화면 표시 불가)
 const B=facts.firstBand,mean=B.meanAge[stock.world]??B.meanAge.modern,age=normal(rand,mean,B.sd);
 f.first_band=age<B.adultAge?'teen':'adult';
 if(f.first_band==='teen')blocked.first_band='B1';
 trace.push(`첫 경험 시기: 세계 평균 ${mean}세, 표준편차 ${B.sd} → ${f.first_band==='teen'?'청소년기(B1, 표시 불가)':'성인 이후'}`);
 f.first_who=pick(rand,byTier(facts.firstWho.byTier,occ,fam));
 f.first_how=pick(rand,byTier(facts.firstHow.byTier,occ,fam));
 f.first_where=pick(rand,byTier(facts.firstWhere.byTier,occ,fam));
 trace.push(`첫 상대 ${facts.firstWho.labels[f.first_who]} · ${facts.firstHow.labels[f.first_how]} · ${facts.firstWhere.labels[f.first_where]}`);

 // 상대 수: 총횟수 ÷ 한 명당 횟수, ±변동, 최소 1, 총횟수 이하
 const P=facts.partnerCount,per=P.timesPerPartner[occ]??P.timesPerPartner.default,vary=rand(100-P.variationPct,100+P.variationPct);
 f.partners=Math.max(1,Math.min(n,Math.round(n/per*vary/100)));
 trace.push(`상대 수: ${n} ÷ ${per} × ${vary}% = ${f.partners}명`);

 const lib=Number(stock.nymphomania??0);
 const [b0,b1]=facts.maxNight.base;
 f.max_night=Math.max(1,Math.min(n,rand(b0,b1)+(facts.maxNight.libidoBonus[String(lib)]??0)));

 // 다인 경험: 상대가 둘 이상일 때만
 const G=facts.group,gp=G.pctByTier[occ]??G.pctByTier.default;
 if(f.partners>=2&&rand(1,100)<=gp){
  const same=Number(stock.homosexualism??0)>0;
  f.group=f.partners>=4&&rand(1,100)<=40?'many':same&&rand(1,100)<=60?'ffm':'mmf';
  const [d0,d1]=G.maxDayPeopleByTier[occ]??G.maxDayPeopleByTier.default;
  f.max_day_people=Math.min(f.partners,rand(d0,d1));
 }else{f.group='none';f.max_day_people=Math.min(f.partners,1);}
 trace.push(`하룻밤 최다 ${f.max_night}회 · 다인 ${G.labels[f.group]} · 하루 최다 상대 ${f.max_day_people}명`);

 // 오르가즘·분출: 성욕 특성과 감수성
 const sens=Number(stock.sensitivity??0);
 f.orgasm=lib<=-1?'never':lib>=1?'always':sens>=4?'often':'sometimes';
 f.squirt=lib>=0&&sens>=3&&rand(1,100)<=20+sens*10?1:0;

 // 피니시·삼킴: 행위 배분과 정액 중독(nymphomania 2)
 const fin=lib===2?{mouth:3,inside:2,face:1}:{inside:Math.max(1,acts.vaginal),mouth:Math.max(0,acts.oral),anal:Math.max(0,acts.anal),face:Math.ceil(n/10),chest:Math.ceil(n/20)};
 f.finish=pick(rand,fin);
 f.swallow=lib===2||(acts.oral*2>=n&&rand(1,100)<=60)?1:0;

 // 18번 기술: 가장 높은 성 기술(같으면 앞쪽)
 let best='',bv=0;for(const k of Object.keys(SKILL_NAME)){const v=Number(stock[k]??0);if(v>bv){best=k;bv=v;}}
 f.signature=best;

 // 절대 싫은 것: 혐오 특성 → 가장 적게 한 행위 / 해 보고 싶은 것: 숨은 성향 → 안 해 본 행위
 f.never=Number(stock.anal_affinity??0)<0?'anal':Number(stock.perversion??0)<0?'perversion':['anal','oral','vaginal'].sort((a,b)=>acts[a]-acts[b])[0];
 const hidden=['anal_affinity','oral_affinity','masochism','exhibitionism','perversion','homosexualism'].find(k=>Number(stock[k]??0)>0&&!Number(stock[k+'_revealed']??0));
 f.want=hidden??(acts.anal===0&&f.never!=='anal'?'anal':f.group==='none'?'group':'');
 trace.push(`오르가즘 ${facts.orgasm.labels[f.orgasm]}${f.squirt?'·분출':''} · 피니시 ${facts.finish.labels[f.finish]}${f.swallow?'·삼킴':''} · 18번 ${SKILL_NAME[f.signature]??'없음'} · 싫은 것 ${f.never} · 해 보고 싶은 것 ${f.want||'없음'}`);
 return {fields:f,blocked,trace,occ,fam};
}

// 게임 저장용 한 줄(키=값;…). 빈 값은 뺀다.
export function packFacts(fields){
 return Object.entries(fields).filter(([,v])=>v!==''&&!(Array.isArray(v)&&!v.length)).map(([k,v])=>`${k}=${Array.isArray(v)?v.join(','):v}`).join(';');
}
export {SKILL_NAME};
