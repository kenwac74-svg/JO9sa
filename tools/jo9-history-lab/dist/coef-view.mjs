// 산식 계수: 과거 경험 공식의 계수를 편집하는 탭(세계·출신·직업 대분류 범위 → 소분류 값, 연령, 특성 키워드 가중치, 그 밖 계수)
import {loadSimData,esc as e,getFormula,saveFormula,resetFormula,onFormulaChange,formulaEdited} from './sim-data.mjs';
import {tierOf,categoryFactor} from './past-history.mjs';

const KIND_NAME={world:'세계',family:'출신',occupation:'직업'};
const LV_FAT=['앙상한','모델 체형','날씬한','육감적인','통통한','비만'];

export async function createCoefView(api){
 const D=await loadSimData();
 const TRAITS=await fetch('./data/traits.json').then(r=>r.json());
 const traitRows=TRAITS.rows.filter(r=>r.binding&&!r.binding.key.includes('['));
 const F=()=>getFormula(D.formula);
 const id='coef';
 api.tabNames[id]=['산식 계수','산식 계수','과거 경험 공식의 계수를 고칩니다. 바꾼 값은 이 브라우저에 저장되고 캐릭터 시뮬레이터·뽑기 분포에 바로 적용됩니다.'];
 document.querySelector('.sidebar nav [data-tab="character"]')?.insertAdjacentHTML('afterend',`<button data-tab="${id}" class="nav-button"><span>≋</span>산식 계수</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin',`<section id="${id}" class="tab-panel" hidden></section>`);
 const root=document.getElementById(id);
 let open={};
 // fn이 false를 돌려주면 저장하지 않는다(잘못된 입력)
 const edit=fn=>{const f=structuredClone(F());if(fn(f)===false){render();return;}saveFormula(f);};
 const num=(attrs,value,extra='')=>`<input type="number" ${attrs} value="${e(value??'')}" ${extra}>`;

 // 그 밖 계수: [묶음, 경로, 이름, 단위]
 function otherRows(f){
  const rows=[];
  f.gradeBase.forEach((_,i)=>rows.push(['기준량',['gradeBase',i],'기술 등급 '+'FDCBAS'[i]+' 기준 횟수','회']));
  for(const [k,n]of [['petting','애무'],['oral','구강'],['penetration','삽입']])rows.push(['기준량',['skillWeights',k],n+' 가중치','']);
  rows.push(['기준량',['variationPct'],'변동 폭','±%'],['기준량',['nonVirginMinimum',0],'비처녀 최소 경험 하한','회'],['기준량',['nonVirginMinimum',1],'비처녀 최소 경험 상한','회']);
  for(const [k,a]of Object.entries(f.attributes.linear))rows.push(['기본 속성',['attributes','linear',k,'per'],a.name+' 단계당','%']);
  for(const v of Object.keys(f.attributes.table.fat.values))rows.push(['기본 속성',['attributes','table','fat','values',v],'체형 '+LV_FAT[v],'%']);
  rows.push(['기본 속성',['attributes','min'],'속성 계수 최소','/100'],['기본 속성',['attributes','max'],'속성 계수 최대','/100']);
  f.traits.acts.rules.forEach((r,i)=>{for(const act of ['vaginal','oral','anal'])if(r[act]!==undefined)rows.push(['질·구강·애널 배분',['traits','acts','rules',i,act],`${r.name} · ${{vaginal:'질',oral:'구강',anal:'애널'}[act]}`,'/100']);});
  for(const [k,l]of [['default','그 밖'],['2','레즈비언'],['1','양성애자'],['-1','동성애 혐오자']])rows.push(['상대 배분',['traits','partners','samePct',k],l+' 동성 비율','%']);
  rows.push(['유부녀',['marriage','years','0',0],'연령 0 결혼 최소','년'],['유부녀',['marriage','years','0',1],'연령 0 결혼 최대','년'],['유부녀',['marriage','years','2',0],'연령 2 결혼 최소','년'],['유부녀',['marriage','years','2',1],'연령 2 결혼 최대','년']);
  for(const [k,l]of [['traditional','전통 세계'],['industrial','산업 세계'],['modern','현대·미래 세계']])rows.push(['유부녀',['marriage','pregnancyPerYearPct',k,'pct'],l+' 해마다 임신','%']);
  rows.push(['유부녀',['marriage','birthPerPregnancyPct'],'임신마다 출산','%']);
  return rows;
 }
 const getPath=(o,p)=>p.reduce((x,k)=>x?.[k],o);
 const setPath=(o,p,v)=>{const last=p.at(-1),parent=p.slice(0,-1).reduce((x,k)=>x[k],o);parent[last]=v;};

 function categoryHtml(f,kind){
  const C=f.categories?.[kind];if(!C)return '';
  return Object.entries(C.groups).map(([gid,g])=>{
   const key=kind+':'+gid;
   return `<details class="cf-group" ${open[key]?'open':''} data-cf-open="${key}"><summary><b>${e(g.label)}</b> <span class="cf-range">범위 ${num(`data-cf-range="${kind}:${gid}:min"`,g.min,'step="1" min="0" max="1000"')} ~ ${num(`data-cf-range="${kind}:${gid}:max"`,g.max,'step="1" min="0" max="1000"')} /100</span><small>${g.members.length}개</small></summary>
    <table class="cf-table"><tbody>${g.members.map(m=>{
     const t=tierOf(f,kind,m),fixed=kind==='occupation'&&t.factor===0,own=C.items?.[m];
     const eff=fixed?0:categoryFactor(f,kind,m,t.factor).factor;
     return `<tr><td>${e(D.name(kind,m))} <small>${e(m)}</small></td><td>${fixed?'<span class="badge muted">처녀 고정 0</span>':num(`data-cf-item="${kind}:${m}"`,own,`step="1" min="${g.min}" max="${g.max}" placeholder="${eff}"`)}</td><td class="fine-print">${fixed?'규칙':own!==undefined?'직접 지정':'기본 '+t.factor+(eff!==t.factor?` → 범위 맞춤 ${eff}`:'')}</td></tr>`;}).join('')}</tbody></table></details>`;
  }).join('');
 }
 // 다시 그릴 때 입력 중이던 칸(추가용 입력)의 값과 초점을 지킨다
 function render(){
  const keep=['cfAgeNew','cfAgeW','cfTwName','cfTwF'].map(i=>[i,root.querySelector('#'+i)?.value]),focus=document.activeElement?.id;
  draw();
  for(const [i,v]of keep){const el=root.querySelector('#'+i);if(el&&v)el.value=v;}
  if(focus&&root.querySelector('#'+focus))root.querySelector('#'+focus).focus();
 }
 function draw(){
  const f=F(),others=otherRows(f),groups=[...new Set(others.map(r=>r[0]))];
  const libido=f.traits.libido.rules;
  root.innerHTML=`<div class="notice neutral"><span>≋</span><div>대분류에 범위를 정하면, 소분류 값은 그 범위 안에서만 정할 수 있습니다. 소분류 값을 비워 두면 기존 묶음 계수를 범위 안으로 맞춘 값을 씁니다. 모든 계수는 /100(100 = 영향 없음)입니다.</div></div>
  <div class="cf-head">${formulaEdited(D.formula)?'<span class="badge">기본값에서 바뀜</span>':'<span class="badge green">승인된 기본값</span>'}<button class="button secondary" data-cf-act="reset">기본값 복원</button><button class="button secondary" data-cf-act="export">↓ 계수 JSON</button></div>
  <div class="cf-grid">
  ${['world','family','occupation'].map(k=>`<article class="card"><div class="card-head"><h2>${KIND_NAME[k]} 계수</h2><span class="badge muted">대분류 범위 → 소분류 값</span></div><div class="card-body">${categoryHtml(f,k)}</div></article>`).join('')}
  <article class="card"><div class="card-head"><h2>연령(seed_age) 가중치</h2></div><div class="card-body">
   <table class="cf-table"><thead><tr><th>seed_age</th><th>가중치 /100</th><th></th></tr></thead><tbody>${Object.entries(f.ageFactor).sort((a,b)=>a[0]-b[0]).map(([age,v])=>`<tr><td>${e(age)}${f.excludedAges.includes(Number(age))?' <span class="badge muted">통계 제외</span>':''}</td><td>${num(`data-cf-age="${e(age)}"`,v,'step="1" min="0" max="1000"')}</td><td><button class="text-button" data-cf-act="age-del" data-age="${e(age)}">삭제</button></td></tr>`).join('')}</tbody></table>
   <div class="cf-add">${num('id="cfAgeNew"','','step="1" min="0" max="9" placeholder="seed_age 정수"')}${num('id="cfAgeW"','','step="1" min="0" max="1000" placeholder="가중치"')}<button class="button secondary" data-cf-act="age-add">추가</button></div>
   <p class="fine-print">'통계 제외' 연령(공식 데이터 excludedAges: ${e(f.excludedAges.join(', ') || '없음')})은 이 편집기가 과거 경험을 자동 계산하지 않습니다. 넣은 가중치는 공식 데이터에 저장됩니다. [클로드 정책 거부] 기록: docs/claude-refusals/REFUSAL_LOG_KO.md</p></div></article>
  <article class="card"><div class="card-head"><h2>특성 가중치(성경험 총횟수)</h2></div><div class="card-body">
   <div class="section-label">성욕 특성(하나만 적용)</div><table class="cf-table"><tbody>${libido.map((r,i)=>`<tr><td>${e(r.name)}</td><td>${num(`data-cf-libido="${i}"`,r.factor,'step="1" min="0" max="1000"')}</td></tr>`).join('')}</tbody></table>
   <div class="section-label">키워드 특성(맞는 것을 모두 곱함)</div><table class="cf-table"><tbody>${(f.traitWeights??[]).map((w,i)=>`<tr><td>${e(w.name)}</td><td>${num(`data-cf-tw="${i}"`,w.factor,'step="1" min="0" max="1000"')}</td><td><button class="text-button" data-cf-act="tw-del" data-i="${i}">삭제</button></td></tr>`).join('')||'<tr><td class="fine-print">없음</td></tr>'}</tbody></table>
   <div class="cf-add"><input id="cfTwName" list="cfTraitDict" placeholder="특성 이름(예: 겁쟁이)">${num('id="cfTwF"','','step="1" min="0" max="1000" placeholder="가중치 /100"')}<button class="button secondary" data-cf-act="tw-add">추가</button></div>
   <datalist id="cfTraitDict">${traitRows.map(r=>`<option value="${e(r.name)}"></option>`).join('')}</datalist>
   <p class="fine-print">특성 열람표의 이름과 정확히 맞아야 추가됩니다. 질·구강·애널 배분 가중치는 아래 "그 밖 계수"와 특성 편집 탭에서 고칩니다.</p></div></article>
  <article class="card cf-wide"><div class="card-head"><h2>그 밖 계수</h2></div><div class="card-body">${groups.map(g=>`<details class="cf-group" ${open['o:'+g]?'open':''} data-cf-open="o:${e(g)}"><summary><b>${e(g)}</b></summary><table class="cf-table"><tbody>${others.map((r,i)=>r[0]===g?`<tr><td>${e(r[2])}</td><td>${num(`data-cf-other="${i}"`,getPath(f,r[1]),'step="1"')}</td><td class="fine-print">${e(r[3])}</td></tr>`:'').join('')}</tbody></table></details>`).join('')}</div></article>
  </div>`;
  root._others=others;
 }
 root.addEventListener('toggle',ev=>{const k=ev.target.dataset?.cfOpen;if(k)open[k]=ev.target.open;},true);
 root.addEventListener('change',ev=>{
  // 추가용 입력칸(id만 있는 칸)은 버튼을 누를 때 읽는다
  if(!Object.keys(ev.target.dataset).some(k=>k.startsWith('cf')))return;
  const t=ev.target,v=t.value===''?undefined:Math.trunc(Number(t.value));
  if(t.value!==''&&!Number.isFinite(Number(t.value))){render();return;}
  if(t.dataset.cfRange){const [kind,gid,side]=t.dataset.cfRange.split(':');edit(f=>{const g=f.categories[kind].groups[gid];if(v===undefined)return;g[side]=v;if(g.min>g.max){api.toast('범위 최솟값이 최댓값보다 큽니다.');g[side==='min'?'max':'min']=v;}
   // 범위를 벗어난 소분류 값은 범위 안으로 맞춘다
   for(const m of g.members){const x=f.categories[kind].items[m];if(x!==undefined)f.categories[kind].items[m]=Math.max(g.min,Math.min(g.max,x));}});return;}
  if(t.dataset.cfItem){const [kind,m]=t.dataset.cfItem.split(':');edit(f=>{const C=f.categories[kind],g=Object.values(C.groups).find(x=>x.members.includes(m));
   if(v===undefined){delete C.items[m];return;}
   if(g&&(v<g.min||v>g.max)){api.toast(`대분류 "${g.label}" 범위 ${g.min}~${g.max} 안의 값만 넣을 수 있습니다.`);return false;}C.items[m]=v;});return;}
  if(t.dataset.cfAge){if(v===undefined)return;edit(f=>{f.ageFactor[t.dataset.cfAge]=v;});return;}
  if(t.dataset.cfLibido){if(v===undefined)return;edit(f=>{f.traits.libido.rules[Number(t.dataset.cfLibido)].factor=v;});return;}
  if(t.dataset.cfTw){if(v===undefined)return;edit(f=>{f.traitWeights[Number(t.dataset.cfTw)].factor=v;});return;}
  if(t.dataset.cfOther){if(v===undefined)return;edit(f=>setPath(f,root._others[Number(t.dataset.cfOther)][1],v));return;}
 });
 root.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-cf-act]');if(!b)return;const a=b.dataset.cfAct;
  if(a==='reset')api.confirmAction('기본값 복원','바꾼 계수를 모두 승인된 기본값으로 되돌립니다.',()=>resetFormula(D.formula));
  if(a==='export'){const blob=new Blob([JSON.stringify(F(),null,1)],{type:'application/json'}),u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download='past-history-formula.json';l.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  if(a==='age-add'){const age=root.querySelector('#cfAgeNew').value,w=root.querySelector('#cfAgeW').value;if(age===''||w===''||!Number.isInteger(Number(age))){api.toast('seed_age 정수와 가중치를 넣으세요.');return;}edit(f=>{f.ageFactor[String(Number(age))]=Math.trunc(Number(w));});}
  if(a==='age-del')edit(f=>{delete f.ageFactor[b.dataset.age];});
  if(a==='tw-add'){const name=root.querySelector('#cfTwName').value.trim(),w=root.querySelector('#cfTwF').value,row=traitRows.find(r=>r.name===name);
   if(!row){api.toast(`"${name}"와 맞는 특성이 없어 추가하지 않았습니다.`);return;}if(w===''){api.toast('가중치를 넣으세요.');return;}
   const bnd=row.binding;edit(f=>{(f.traitWeights??=[]).push({name:row.name,key:bnd.key,op:bnd.op,value:bnd.threshold,min:bnd.min,max:bnd.max,factor:Math.trunc(Number(w))});});}
  if(a==='tw-del')edit(f=>{f.traitWeights.splice(Number(b.dataset.i),1);});
 });
 onFormulaChange(render);
 render();
 return {render};
}
