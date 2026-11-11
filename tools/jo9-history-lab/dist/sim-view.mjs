// 노예 뽑기 시뮬레이터 화면: 실제 게임 엔진으로 뽑은 랜덤 노예 표본에서 N명을 뽑아 과거 경험 공식 결과를 집계한다
import {pastHistory,tierOf} from './past-history.mjs';

const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const AGE={0:'젊음',2:'원숙'};
const LIBIDO={2:'정액 중독',1:'색정광',0:'',[-1]:'불감증',[-2]:'석녀'};

// 고정 시드 수열(mulberry32). 같은 시드면 같은 노예를 뽑는다.
function rng(seed){let s=seed>>>0;return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';
const avg=(a)=>a.length?(a.reduce((x,y)=>x+y,0)/a.length):0;

export async function createSimView(api){
 const load=async f=>{const r=await fetch('./data/'+f);if(!r.ok)throw new Error(f+'를 읽지 못했습니다.');return r.json();};
 const [sample,formula,bg,drafts]=await Promise.all(['generated-stock.json','past-history-formula.json','backgrounds.json','background-drafts.json'].map(load));
 const all=sample.rows.map(r=>Object.fromEntries(sample.keys.map((k,i)=>[k,r[i]])));
 // 랜덤 범위 안의 고유 캐릭터(예: 2339)는 세계·출신·직업이 없고 고정 배경을 쓰므로 공식 대상에서 뺀다
 const rows=all.filter(r=>r.world&&r.family&&r.occupation),uniques=all.length-rows.length;
 const labels={};for(const r of [...bg.records,...drafts.records])(labels[r.kind]??={})[r.id]??=r.label;
 const name=(kind,id)=>labels[kind]?.[id]??id;
 const opts=key=>[...new Set(rows.map(r=>r[key]))].sort((a,b)=>name(key,a).localeCompare(name(key,b),'ko'));
 const st={count:1000,seed:1,world:'',family:'',occupation:'',age:'',group:'tier',detail:null};
 const id='slave-sim';
 api.tabNames[id]=['노예 뽑기 시뮬레이터','노예 뽑기 시뮬레이터','실제 게임 엔진으로 뽑은 랜덤 노예 표본에서 N명을 뽑아 과거 경험 공식의 결과를 확인하세요.'];
 document.querySelector('.sidebar nav').insertAdjacentHTML('beforeend',`<button data-tab="${id}" class="nav-button"><span>⚄</span>노예 뽑기 시뮬레이터</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin',`<section id="${id}" class="tab-panel" hidden></section>`);
 const root=document.getElementById(id);

 function draw(){
  const pool=rows.filter(r=>(!st.world||r.world===st.world)&&(!st.family||r.family===st.family)&&(!st.occupation||r.occupation===st.occupation)&&(st.age===''||String(r.age)===st.age));
  const rand=rng(st.seed*2654435761);
  const picked=[];
  if(pool.length)for(let i=0;i<st.count;i++){const s=pool[Math.floor(rand()*pool.length)];picked.push({stock:s,result:pastHistory(s,formula,`sim${st.seed}|${i}|${s.type}`)});}
  return {pool,picked};
 }
 function groupKey(p){
  if(st.group==='tier')return tierOf(formula,'occupation',p.stock.occupation).name;
  if(st.group==='occupation')return name('occupation',p.stock.occupation);
  if(st.group==='family')return name('family',p.stock.family);
  if(st.group==='world')return name('world',p.stock.world);
  return AGE[p.stock.age]??String(p.stock.age);
 }
 const TIER={virginForced:'처녀 고정',sexWork:'성인 접객업',married:'유부녀',formerSlave:'노예 출신',nightlife:'유흥·사교',default:'그 밖'};
 function histogram(values){
  const edges=[0,1,10,30,60,100,200,400,Infinity],bins=edges.slice(0,-1).map((a,i)=>({a,b:edges[i+1],n:0}));
  for(const v of values){const b=bins.find(x=>v>=x.a&&v<x.b);if(b)b.n++;}
  const max=Math.max(1,...bins.map(b=>b.n));
  return `<div class="sim-hist">${bins.map(b=>`<div class="sim-bar"><span class="sim-bar-fill" style="height:${Math.round(b.n/max*100)}%"></span><b>${b.n}</b><small>${b.a===0&&b.b===1?'0':b.b===Infinity?b.a+'+':b.a+'–'+(b.b-1)}</small></div>`).join('')}</div>`;
 }
 function render(){
  const {pool,picked}=draw(),res=picked.map(p=>p.result),valid=res.filter(r=>!r.excluded),xs=valid.map(r=>r.intimacy);
  const virgins=picked.filter(p=>p.stock.virginity<2).length,zero=xs.filter(x=>x===0).length;
  const acts=valid.reduce((a,r)=>{if(r.acts){a.v+=r.acts.vaginal;a.o+=r.acts.oral;a.a+=r.acts.anal;}return a;},{v:0,o:0,a:0}),actSum=acts.v+acts.o+acts.a;
  const preg=valid.filter(r=>r.pregnancies!==null);
  const groups=new Map();for(const p of picked){const k=groupKey(p);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
  const sel=(key,label,list,all)=>`<label class="field"><span>${label}</span><select data-sim="${key}"><option value="">${all}</option>${list.map(v=>`<option value="${e(v)}" ${String(st[key])===String(v)?'selected':''}>${e(key==='age'?AGE[v]:name(key,v))}</option>`).join('')}</select></label>`;
  root.innerHTML=`<div class="notice neutral"><span>⚄</span><div><strong>실제 게임 엔진 표본 ${rows.length.toLocaleString('ko-KR')}명</strong>에서 뽑습니다. 최신 jack.qsp의 generate_stock과 영입 처리(stock_to_slave_nogt)까지 QSP WASM 엔진으로 실행한, 모든 특성 추첨이 끝난 랜덤 노예(연령 코드 1 제외)입니다.${uniques?` 랜덤 범위에서 뽑힌 고유 캐릭터 ${uniques}명은 고정 배경이라 뺐습니다.`:''} 공식은 계수 ${e(formula.version)}을 씁니다.</div></div>
  <article class="card"><div class="card-body sim-controls">
   <label class="field"><span>뽑을 수</span><select data-sim="count">${[100,1000,5000,10000].map(n=>`<option ${st.count===n?'selected':''}>${n}</option>`).join('')}</select></label>
   ${sel('world','세계',opts('world'),'모든 세계')}${sel('family','출신',opts('family'),'모든 출신')}${sel('occupation','직업',opts('occupation'),'모든 직업')}${sel('age','연령',['0','2'],'모든 연령')}
   <div class="sim-actions"><button class="button primary" data-sim-action="reroll">⚄ 다시 뽑기</button><span class="muted-text">시드 ${st.seed} · 조건에 맞는 표본 ${pool.length.toLocaleString('ko-KR')}명</span></div>
  </div></article>
  ${pool.length?`<div class="result-summary sim-summary">
   <div class="summary-tile featured"><span class="summary-label">성경험 중앙값</span><span class="summary-value">${median(xs)}<small>회</small></span><div class="summary-foot">평균 ${avg(xs).toFixed(1)} · 최대 ${Math.max(0,...xs)}</div></div>
   <div class="summary-tile"><span class="summary-label">처녀 · 경험 0</span><span class="summary-value">${pct(virgins,picked.length)}</span><div class="summary-foot">경험 0 ${pct(zero,valid.length)}</div></div>
   <div class="summary-tile"><span class="summary-label">질 · 구강 · 애널</span><span class="summary-value sim-small">${pct(acts.v,actSum)} · ${pct(acts.o,actSum)} · ${pct(acts.a,actSum)}</span><div class="summary-foot">전체 경험 횟수 대비</div></div>
   <div class="summary-tile"><span class="summary-label">임신 · 출산 기록</span><span class="summary-value sim-small">${pct(preg.length,valid.length)}</span><div class="summary-foot">기록 있는 노예 평균 임신 ${avg(preg.map(r=>r.pregnancies)).toFixed(2)} · 출산 ${avg(preg.map(r=>r.births)).toFixed(2)}</div></div>
  </div>
  <article class="card"><div class="card-head"><h2>성경험 분포 <small>${picked.length.toLocaleString('ko-KR')}명</small></h2></div><div class="card-body">${histogram(xs)}</div></article>
  <article class="card"><div class="card-head"><h2>묶음별 결과</h2><select data-sim="group" aria-label="묶음 기준">${[['tier','직업 묶음'],['occupation','직업'],['family','출신'],['world','세계'],['age','연령']].map(([v,l])=>`<option value="${v}" ${st.group===v?'selected':''}>${l}</option>`).join('')}</select></div>
   <div class="table-wrap"><table><thead><tr><th>${st.group==='tier'?'직업 묶음':'구분'}</th><th class="numeric">인원</th><th class="numeric">처녀</th><th class="numeric">성경험 중앙값</th><th class="numeric">평균</th><th class="numeric">질·구강·애널</th><th class="numeric">임신/출산 평균</th></tr></thead><tbody>
   ${[...groups].sort((a,b)=>b[1].length-a[1].length).map(([k,list])=>{const r=list.map(p=>p.result),x=r.map(v=>v.intimacy??0),a=r.reduce((s,v)=>{if(v.acts){s[0]+=v.acts.vaginal;s[1]+=v.acts.oral;s[2]+=v.acts.anal;}return s;},[0,0,0]),t=a[0]+a[1]+a[2],pr=r.filter(v=>v.pregnancies!==null);
    return `<tr><td>${e(st.group==='tier'?TIER[k]??k:k)}</td><td class="numeric">${list.length}</td><td class="numeric">${pct(list.filter(p=>p.stock.virginity<2).length,list.length)}</td><td class="numeric">${median(x)}</td><td class="numeric">${avg(x).toFixed(1)}</td><td class="numeric">${pct(a[0],t)} · ${pct(a[1],t)} · ${pct(a[2],t)}</td><td class="numeric">${pr.length?avg(pr.map(v=>v.pregnancies)).toFixed(2)+' / '+avg(pr.map(v=>v.births)).toFixed(2):'—'}</td></tr>`;}).join('')}
   </tbody></table></div></article>
  <article class="card"><div class="card-head"><h2>뽑힌 노예 <small>앞 30명 · 행을 누르면 산출 과정</small></h2></div><div class="table-wrap"><table class="sim-list"><thead><tr><th>#</th><th>세계 · 출신 · 직업</th><th>연령</th><th>처녀</th><th>외모</th><th>성욕</th><th class="numeric">성경험</th><th class="numeric">질/구강/애널</th><th class="numeric">임신/출산</th></tr></thead><tbody>
   ${picked.slice(0,30).map((p,i)=>{const s=p.stock,r=p.result;return `<tr data-sim-row="${i}" class="${st.detail===i?'chosen':''}"><td>${i+1}</td><td>${e(name('world',s.world))} · ${e(name('family',s.family))} · ${e(name('occupation',s.occupation))}</td><td>${AGE[s.age]??s.age}</td><td>${s.virginity<2?'처녀':''}</td><td>${s.base_beauty??s.beauty}</td><td>${e(LIBIDO[s.nymphomania]??'')}</td><td class="numeric">${r.intimacy??'제외'}</td><td class="numeric">${r.acts?`${r.acts.vaginal}/${r.acts.oral}/${r.acts.anal}`:'—'}</td><td class="numeric">${r.pregnancies===null?'미상':`${r.pregnancies}/${r.births}`}</td></tr>${st.detail===i?`<tr class="sim-trace"><td></td><td colspan="8"><ol>${r.trace.map(t=>`<li>${e(t)}</li>`).join('')}</ol></td></tr>`:''}`;}).join('')}
   </tbody></table></div></article>`:'<div class="empty-state"><h3>조건에 맞는 표본이 없습니다</h3><p>세계·출신·직업 조합을 넓혀 보세요. 게임에서 연결되지 않는 조합일 수 있습니다.</p></div>'}`;
 }
 root.addEventListener('change',ev=>{const k=ev.target.dataset.sim;if(!k)return;st[k]=k==='count'?Number(ev.target.value):ev.target.value;st.detail=null;render();});
 root.addEventListener('click',ev=>{
  if(ev.target.closest('[data-sim-action="reroll"]')){st.seed++;st.detail=null;render();return;}
  const row=ev.target.closest('[data-sim-row]');if(row){const i=Number(row.dataset.simRow);st.detail=st.detail===i?null:i;render();}
 });
 render();
 return {render};
}
