// 초기값 시뮬레이터: 노예 한 명의 세계·출신·직업과 생성 값, 공식 계수를 직접 바꾸며 영입 전 과거 경험 결과를 확인한다
import {pastHistory} from './past-history.mjs';
import {loadSimData,esc as e,rng,getFormula,saveFormula,resetFormula,onFormulaChange,formulaEdited} from './sim-data.mjs';

// 게임 #variative의 단계 이름
const LV={
 base_beauty:['추함','평범함','귀여움','예쁨','아름다움','눈부심','절세의 미모'],
 base_exotic:['평범함','색다름','신비로움','오묘함','이국적임','몽환적임','신화적임','완벽함'],
 style:['촌스러움','무난함','평범함','세련됨','근사함','우아함','아름다움','눈부심','품격있음'],
 temper:['무관심함','차가움','내성적임','수동적임','적극적임','열정적임'],
 pride:['개방적','솔직함','의존적','당당함','건방짐','오만함'],
 sensitivity:['무정함','냉담함','둔감함','민감함','다감함','여림'],
 ego:['우유부단','겁쟁이','소심함','주관적','단호함','완고함'],
 stamina:['죽어감','쇠약함','평범함','건강함','강인함','근육질'],
 fat:['앙상한','모델 체형','날씬한','육감적인','통통한','비만']
};
const ATTR=[['base_beauty','외모(타고난)'],['base_exotic','독특함(기본)'],['style','세련됨'],['temper','성격'],['pride','태도'],['sensitivity','감수성'],['ego','자아'],['stamina','체력'],['fat','체형']];
const TRAITS=[
 ['nymphomania','성욕',[[-2,'석녀'],[-1,'불감증'],[0,'없음'],[1,'색정광'],[2,'정액 중독']]],
 ['homosexualism','동성 성향',[[-1,'동성애 혐오자'],[0,'없음'],[1,'양성애자'],[2,'레즈비언']]],
 ['perversion','성적 기호',[[-1,'순수한 영혼'],[0,'없음'],[2,'이상성욕 선호']]],
 ['anal_affinity','애널',[[-1,'애널섹스 혐오'],[0,'없음'],[1,'애널섹스 중독']]],
 ['oral_affinity','펠라',[[0,'없음'],[1,'펠라 중독']]],
 ['jo9_gag_reflex','구역 반사',[[0,'없음'],[1,'반사적 구역질']]],
 ['jo9_peerless','절세미인',[[0,'없음'],[1,'절세미인']]]
];
const STATE=[['virginity','처녀 여부',[[0,'처녀'],[2,'비처녀']]],['fertility','임신 가능',[[0,'가능'],[-1,'불임']]],['pregnant','영입 시 임신 중',[[0,'아니오'],[1,'예']]],['clone','클론·기술 주입',[[0,'아니오'],[1,'예']]]];
const SKILLS=[['애무',[['sub_hug','포옹'],['sub_hj','손'],['sub_fj','발'],['sub_paizuri','가슴']]],['구강',[['sub_kiss','키스'],['sub_tongue','혀'],['sub_bj','펠라'],['sub_dt','딥스로트'],['sub_asslik','항문 핥기']]],['삽입',[['sub_vaginal','질'],['sub_anal','애널'],['sub_fisting','피스팅'],['anal_stretch','항문 확장']]]];
const TIER={virginForced:'처녀 고정',sexWork:'성인 접객업',married:'유부녀',formerSlave:'노예 출신',nightlife:'유흥·사교',default:'그 밖',sheltered:'보호가 강한 상류·왕가',street:'거리·빈곤·범죄'};
const KEY='jo9-draw-one-v1';

export async function createOneView(api){
 const D=await loadSimData();
 const F=()=>getFormula(D.formula);
 let st=null;try{st=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 if(!st?.stock)st={stock:{...D.rows[0]},seed:'1',draws:0};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st));}catch{}};
 const id='draw-one';
 api.tabNames[id]=['초기값 시뮬레이터','초기값 시뮬레이터','세계·출신·직업과 생성 값, 공식 계수를 바꾸며 노예 한 명의 영입 전 과거 경험을 확인하세요.'];
 document.querySelector('.sidebar nav').insertAdjacentHTML('afterbegin',`<button data-tab="${id}" class="nav-button"><span>◈</span>초기값 시뮬레이터</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin',`<section id="${id}" class="tab-panel" hidden></section>`);
 const root=document.getElementById(id);
 const s=()=>st.stock;
 const select=(key,list,value,attrs='')=>`<select data-one="${key}" ${attrs}>${list.map(([v,l,dis])=>`<option value="${e(v)}" ${String(value)===String(v)?'selected':''} ${dis?'disabled':''}>${e(l)}</option>`).join('')}</select>`;
 const field=(label,html,cls='')=>`<label class="field ${cls}"><span>${label}</span>${html}</label>`;

 // 공식 계수 편집 목록: [경로, 이름, 단위]
 function coefRows(f){
  const rows=[];
  for(const [k,t]of Object.entries(f.occupation))if(k!=='virginForced')rows.push(['직업',['occupation',k,'factor'],TIER[k]??k,'/100']);
  for(const [k]of Object.entries(f.family))rows.push(['출신',['family',k,'factor'],TIER[k]??k,'/100']);
  rows.push(['세계',['world','default','factor'],'모든 세계','/100']);
  rows.push(['연령',['ageFactor','0'],'연령 코드 0','/100'],['연령',['ageFactor','2'],'연령 코드 2','/100']);
  f.gradeBase.forEach((_,i)=>rows.push(['기준량',['gradeBase',i],'등급 '+'FDCBAS'[i],'회']));
  for(const k of ['petting','oral','penetration'])rows.push(['기준량',['skillWeights',k],{petting:'애무 가중치',oral:'구강 가중치',penetration:'삽입 가중치'}[k],'']);
  rows.push(['기준량',['variationPct'],'변동 폭','±%'],['기준량',['nonVirginMinimum',0],'비처녀 최소 경험 하한','회'],['기준량',['nonVirginMinimum',1],'비처녀 최소 경험 상한','회']);
  f.traits.libido.rules.forEach((r,i)=>rows.push(['성욕 특성',['traits','libido','rules',i,'factor'],r.name,'/100']));
  for(const [k,a]of Object.entries(f.attributes.linear))rows.push(['기본 속성',['attributes','linear',k,'per'],a.name+' 단계당','%']);
  for(const v of Object.keys(f.attributes.table.fat.values))rows.push(['기본 속성',['attributes','table','fat','values',v],'체형 '+LV.fat[v],'%']);
  rows.push(['기본 속성',['attributes','min'],'속성 계수 최소','/100'],['기본 속성',['attributes','max'],'속성 계수 최대','/100']);
  f.traits.acts.rules.forEach((r,i)=>{for(const act of ['vaginal','oral','anal'])if(r[act]!==undefined)rows.push(['행위 배분',['traits','acts','rules',i,act],`${r.name} · ${{vaginal:'질',oral:'구강',anal:'애널'}[act]}`,'/100']);});
  for(const [k,l]of [['default','그 밖'],['2','레즈비언'],['1','양성애자'],['-1','동성애 혐오자']])rows.push(['상대 배분',['traits','partners','samePct',k],l+' 동성 비율','%']);
  rows.push(['유부녀',['marriage','years','0',0],'연령 0 결혼 최소','년'],['유부녀',['marriage','years','0',1],'연령 0 결혼 최대','년'],['유부녀',['marriage','years','2',0],'연령 2 결혼 최소','년'],['유부녀',['marriage','years','2',1],'연령 2 결혼 최대','년']);
  for(const [k,l]of [['traditional','전통 세계'],['industrial','산업 세계'],['modern','현대·미래 세계']])rows.push(['유부녀',['marriage','pregnancyPerYearPct',k,'pct'],l+' 해마다 임신','%']);
  rows.push(['유부녀',['marriage','birthPerPregnancyPct'],'임신마다 출산','%']);
  return rows;
 }
 const getPath=(o,p)=>p.reduce((x,k)=>x?.[k],o);
 const setPath=(o,p,v)=>{const last=p.at(-1),parent=p.slice(0,-1).reduce((x,k)=>x[k],o);parent[last]=v;};

 function render(){
  const f=F(),x=s(),sel={world:x.world,family:x.family,occupation:x.occupation};
  const ready=x.world&&x.family&&x.occupation&&x.age!==1;
  const r=ready?pastHistory(x,f,'one|'+st.seed):null;
  const opt=key=>[['','선택하세요'],...D.options(key,sel).map(v=>[v,D.name(key,v)])];
  const pool=D.rows.filter(row=>(!x.world||row.world===x.world)&&(!x.family||row.family===x.family)&&(!x.occupation||row.occupation===x.occupation)&&String(row.age)===String(x.age));
  const coef=coefRows(f),groups=[...new Set(coef.map(c=>c[0]))];
  root.innerHTML=`<div class="one-grid"><div class="column">
  <article class="card"><div class="card-head"><h2><span class="index">01</span>배경</h2><span class="badge muted">게임 생성 규칙의 연결 조합만</span></div><div class="card-body"><div class="form-grid">
   ${field('세계',select('world',opt('world'),x.world))}${field('출신',select('family',opt('family'),x.family))}
   ${field('직업',select('occupation',opt('occupation'),x.occupation))}${field('연령 코드',select('age',[[0,'0'],[1,'1 (통계 제외)',true],[2,'2']],x.age))}
  </div><div class="one-actions"><button class="button primary" data-one-action="draw">⚄ 한 명 뽑기</button><button class="button secondary" data-one-action="clear">배경 비우기</button><span class="muted-text">현재 조건에 맞는 실제 엔진 표본 ${pool.length.toLocaleString('ko-KR')}명 중에서 뽑아 아래 생성 값을 모두 채웁니다.${st.drawn?` 마지막 뽑기: 표본 유형 ${e(st.drawn)}`:''}</span></div></div></article>
  <article class="card"><div class="card-head"><h2><span class="index">02</span>생성 값</h2><small class="muted-text">영입 처리까지 끝난 값 기준</small></div><div class="card-body">
   <div class="section-label">상태</div><div class="form-grid">${STATE.map(([k,l,o])=>field(l,select(k,o,x[k]??0))).join('')}</div>
   <div class="section-label">성 기술 (0~5, 묶음별 최고 등급을 씁니다)</div><div class="one-skills">${SKILLS.map(([g,list])=>`<div><b>${g}</b>${list.map(([k,l])=>field(l,select(k,[0,1,2,3,4,5].map(v=>[v,String(v)]),Math.min(5,x[k]??0)))).join('')}</div>`).join('')}</div>
   <div class="section-label">성향 특성</div><div class="form-grid">${TRAITS.map(([k,l,o])=>field(l,select(k,o,x[k]??0))).join('')}</div>
   <div class="section-label">기본 속성</div><div class="form-grid">${ATTR.map(([k,l])=>field(l,select(k,LV[k].map((n,i)=>[i,`${i} · ${n}`]),x[k]??(k==='base_beauty'?x.beauty:k==='base_exotic'?x.exotic:0)??0))).join('')}</div>
  </div></article></div>
  <div class="column"><article class="card"><div class="card-head"><h2><span class="index">03</span>영입 전 과거 경험</h2>${field('시드','<input data-one="seed" value="'+e(st.seed)+'" maxlength="40">','one-seed')}</div><div class="card-body">
   ${!ready?'<div class="empty-state"><h3>세계·출신·직업을 고르세요</h3><p>연결된 조합만 고를 수 있습니다. "한 명 뽑기"로 바로 채울 수도 있습니다.</p></div>':`
   <div class="result-summary">
    <div class="summary-tile featured"><span class="summary-label">성경험 총횟수</span><span class="summary-value">${r.intimacy}<small>회</small></span></div>
    <div class="summary-tile"><span class="summary-label">질 · 구강 · 애널</span><span class="summary-value sim-small">${r.acts?`${r.acts.vaginal} · ${r.acts.oral} · ${r.acts.anal}`:'—'}</span><div class="summary-foot">이성 ${r.partners?.opposite??0} · 동성 ${r.partners?.sameSex??0} · 인간 외 ${r.partners?.nonhuman??0}</div></div>
    <div class="summary-tile"><span class="summary-label">임신 · 출산</span><span class="summary-value sim-small">${r.pregnancies===null?'미상':`${r.pregnancies} · ${r.births}`}</span><div class="summary-foot">${r.pregnancies===null?'유부녀·영입 시 임신 중이 아니면 추정하지 않음':'회'}</div></div>
   </div>
   <div class="section-label">산출 과정</div><ol class="one-trace">${r.trace.map(t=>`<li>${e(t)}</li>`).join('')}</ol>`}
  </div></article>
  <article class="card"><div class="card-head"><h2><span class="index">04</span>공식 계수</h2><div class="header-actions">${formulaEdited(D.formula)?'<span class="badge">기본값에서 바뀜</span>':'<span class="badge green">승인된 기본값</span>'}<button class="button secondary small" data-one-action="reset-formula">기본값으로</button><button class="button secondary small" data-one-action="export-formula">계수 JSON</button></div></div>
   <div class="card-body"><p class="muted-text">바꾼 계수는 이 브라우저에 저장되고 "뽑기 분포" 탭에도 적용됩니다. 직업·출신 묶음에 어떤 ID가 들어가는지는 계수 JSON에서 확인합니다.</p>
   ${groups.map(g=>`<details class="one-coef" ${st.open?.[g]?'open':''} data-one-group="${e(g)}"><summary>${e(g)}</summary><table><tbody>${coef.map((c,i)=>c[0]===g?`<tr><td>${e(c[2])}</td><td class="numeric"><input type="number" data-one-coef="${i}" value="${e(getPath(f,c[1]))}"></td><td class="unit">${e(c[3])}</td></tr>`:'').join('')}</tbody></table></details>`).join('')}
  </div></article></div></div>`;
  root._coef=coef;
 }
 root.addEventListener('change',ev=>{
  const t=ev.target;
  if(t.dataset.one){
   const k=t.dataset.one;
   if(k==='seed')st.seed=t.value.slice(0,40);
   else if(['world','family','occupation'].includes(k)){s()[k]=t.value;const sel={world:s().world,family:s().family,occupation:s().occupation};D.prune(sel,k);Object.assign(s(),sel);st.drawn=null;}
   else s()[k]=Number(t.value);
   save();render();return;
  }
  if(t.dataset.oneCoef!==undefined){
   const v=Number(t.value);if(!Number.isFinite(v)){render();return;}
   const f=structuredClone(F());setPath(f,root._coef[Number(t.dataset.oneCoef)][1],v);saveFormula(f);
  }
 });
 root.addEventListener('toggle',ev=>{const g=ev.target.dataset?.oneGroup;if(g){(st.open??={})[g]=ev.target.open;save();}},true);
 root.addEventListener('click',ev=>{
  const a=ev.target.closest('[data-one-action]')?.dataset.oneAction;if(!a)return;
  if(a==='draw'){
   const x=s(),pool=D.rows.filter(row=>(!x.world||row.world===x.world)&&(!x.family||row.family===x.family)&&(!x.occupation||row.occupation===x.occupation)&&String(row.age)===String(x.age));
   if(!pool.length){api.toast?.('현재 조건에 맞는 표본이 없습니다. 배경을 비우거나 연령을 바꿔 보세요.');return;}
   st.draws=(st.draws??0)+1;const pick=pool[Math.floor(rng(Date.now()^st.draws)()*pool.length)];
   st.stock={...pick};st.drawn=String(pick.type);st.seed=String(st.draws);
  }
  if(a==='clear'){Object.assign(s(),{world:'',family:'',occupation:''});st.drawn=null;}
  if(a==='reset-formula'){resetFormula(D.formula);return;}
  if(a==='export-formula'){const blob=new Blob([JSON.stringify(F(),null,1)],{type:'application/json'});const u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download='past-history-formula.json';l.click();setTimeout(()=>URL.revokeObjectURL(u),1000);return;}
  save();render();
 });
 onFormulaChange(render);
 render();
 return {render};
}
