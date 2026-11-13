// 특성 편집: 모든 특성을 열람하고, 필로우토크 변수(총횟수·질·구강·애널 가중치)와 특성 자체 값·설명을 고치며, 형질 변경 요청은 AI용 메모로 남긴다
import {loadSimData,esc as e,getFormula,saveFormula,onFormulaChange} from './sim-data.mjs';

const KEY='jo9-trait-edits-v1';
const OPS={'=':'=','>':'>','<':'<','>=':'≥','range':'범위'};

export async function createTraitEditor(api){
 const D=await loadSimData();
 const TRAITS=await fetch('./data/traits.json').then(r=>r.json());
 const rows=TRAITS.rows;
 const F=()=>getFormula(D.formula);
 let edits={};try{edits=JSON.parse(localStorage.getItem(KEY)||'{}')??{};}catch{}
 const saveEdits=()=>{try{localStorage.setItem(KEY,JSON.stringify(edits));}catch{}};
 let q='',cat='',sel=rows[0]?.id;
 const id='trait-edit';
 api.tabNames[id]=['특성 편집','특성 편집','모든 특성을 열람하고 필로우토크 변수와 특성 값을 고칩니다. 형질 자체를 바꾸려면 메모에 적어 두면 AI가 읽고 처리합니다.'];
 document.querySelector('.sidebar nav [data-tab="coef"]')?.insertAdjacentHTML('afterend',`<button data-tab="${id}" class="nav-button"><span>✧</span>특성 편집</button>`);
 document.querySelector('main footer').insertAdjacentHTML('beforebegin',`<section id="${id}" class="tab-panel" hidden></section>`);
 const root=document.getElementById(id);
 const cats=[...new Set(rows.map(r=>r.category))];
 const bindText=b=>!b?'게임 키 없음(JSON으로 지정 불가)':b.op==='range'?`${b.key} ${b.min}~${b.max}`:`${b.key} ${OPS[b.op]??b.op} ${b.threshold}`;
 // 공식에서 이 특성에 걸린 항목 찾기(이름으로)
 const libidoOf=(f,name)=>f.traits.libido.rules.findIndex(r=>r.name===name);
 const actsOf=(f,name)=>f.traits.acts.rules.findIndex(r=>r.name===name);
 const twOf=(f,name)=>(f.traitWeights??[]).findIndex(r=>r.name===name);
 const ruleFrom=row=>{const b=row.binding;return {name:row.name,key:b.key,op:b.op,value:b.threshold,min:b.min,max:b.max};};

 function detail(row){
  const f=F(),ed=edits[row.id]??{},b=row.binding;
  const li=libidoOf(f,row.name),ai=actsOf(f,row.name),ti=twOf(f,row.name);
  const countVal=li>=0?f.traits.libido.rules[li].factor:ti>=0?f.traitWeights[ti].factor:'';
  const act=ai>=0?f.traits.acts.rules[ai]:{};
  const n=(attr,v,ph='100')=>`<input type="number" ${attr} value="${e(v??'')}" placeholder="${ph}" step="1" min="0" max="1000" ${b?'':'disabled'}>`;
  return `<article class="card"><div class="card-head"><h2>${e(row.name)}</h2><span class="badge muted">${e(row.category)}</span></div><div class="card-body">
   <table class="cv-info"><tbody>
    <tr><td>게임 키</td><td><code>${e(bindText(b))}</code></td></tr>
    <tr><td>얻는 방법</td><td>${e(row.acquisition??'')}</td></tr>
    ${row.price?`<tr><td>가격</td><td>${e(row.price)}</td></tr>`:''}
   </tbody></table>
   <div class="section-label">필로우토크 변수 <span class="fine-print">(/100, 빈칸 = 영향 없음. 산식 계수와 같은 값)</span></div>
   ${b?`<div class="cv-form">
    <label>성경험 총횟수${n('data-te-count',countVal)}${li>=0?'<small>성욕 특성(하나만 적용)</small>':''}</label>
    <label>질 가중치${n('data-te-act="vaginal"',act.vaginal)}</label>
    <label>구강 가중치${n('data-te-act="oral"',act.oral)}</label>
    <label>애널 가중치${n('data-te-act="anal"',act.anal)}</label>
   </div>`:'<p class="fine-print">게임 키가 없는 특성은 필로우토크 변수를 걸 수 없습니다.</p>'}
   <div class="section-label">특성 값 조정 <span class="fine-print">(이 브라우저에 저장, 아래 내보내기로 게임 작업에 넘김)</span></div>
   <label class="field full"><span>설명</span><textarea data-te-desc rows="4">${e(ed.description??row.description??'')}</textarea></label>
   ${b&&b.op!=='range'?`<div class="cv-form"><label>판정 기준값${`<input type="number" data-te-threshold value="${e(ed.threshold??b.threshold)}" step="1">`}</label><label>부여 값${`<input type="number" data-te-set value="${e(ed.setValue??b.setValue)}" step="1">`}</label></div>`:''}
   <label class="field full"><span>형질 변경 메모 (AI가 읽고 처리)</span><textarea data-te-memo rows="4" placeholder="예: 이 특성을 2단계로 나누고, 2단계는 애널 경험 50회 이상일 때 발현">${e(ed.memo??'')}</textarea></label>
   ${Object.keys(ed).length?`<button class="button secondary" data-te-act="clear">이 특성 수정·메모 지우기</button>`:''}
  </div></article>`;
 }
 function render(){
  const ql=q.trim().toLowerCase();
  const list=rows.filter(r=>(!cat||r.category===cat)&&(!ql||[r.name,r.description,r.binding?.key].join(' ').toLowerCase().includes(ql)));
  const row=rows.find(r=>r.id===sel)??list[0];
  const f=F(),marks=r=>[libidoOf(f,r.name)>=0||twOf(f,r.name)>=0?'횟수':'',actsOf(f,r.name)>=0?'배분':'',edits[r.id]?.memo?'메모':'',edits[r.id]&&Object.keys(edits[r.id]).some(k=>k!=='memo')?'수정':''].filter(Boolean);
  const nEdit=Object.keys(edits).length;
  root.innerHTML=`<div class="te-head"><input id="teQ" placeholder="특성 이름·설명·게임 키 검색" value="${e(q)}"><select id="teCat"><option value="">모든 분류</option>${cats.map(c=>`<option ${c===cat?'selected':''}>${e(c)}</option>`).join('')}</select>
   <button class="button secondary" data-te-act="export" ${nEdit?'':'disabled'}>↓ 수정·메모 내보내기 (${nEdit})</button></div>
   <div class="te-grid"><div class="te-list">${list.map(r=>`<button class="te-item ${r===row?'on':''}" data-te-sel="${e(r.id)}"><span>${e(r.name)}</span><small>${e(r.category)}</small>${marks(r).map(m=>`<i>${m}</i>`).join('')}</button>`).join('')||'<p class="fine-print">맞는 특성이 없습니다.</p>'}</div>
   <div class="te-detail">${row?detail(row):''}</div></div>`;
 }
 const cur=()=>rows.find(r=>r.id===sel);
 const editFormula=fn=>{const f=structuredClone(F());fn(f);saveFormula(f);};
 root.addEventListener('input',ev=>{if(ev.target.id==='teQ'){q=ev.target.value;const pos=ev.target.selectionStart;render();const i=root.querySelector('#teQ');i.focus();i.setSelectionRange(pos,pos);}});
 root.addEventListener('change',ev=>{
  const t=ev.target,row=cur();if(t.id==='teCat'){cat=t.value;render();return;}
  if(!row)return;
  const v=t.value===''?undefined:Math.trunc(Number(t.value));
  if(t.dataset.teCount!==undefined){editFormula(f=>{const li=libidoOf(f,row.name),ti=twOf(f,row.name);
   if(li>=0){if(v!==undefined)f.traits.libido.rules[li].factor=v;return;}
   if(v===undefined){if(ti>=0)f.traitWeights.splice(ti,1);return;}
   if(ti>=0)f.traitWeights[ti].factor=v;else (f.traitWeights??=[]).push({...ruleFrom(row),factor:v});});}
  else if(t.dataset.teAct){const act=t.dataset.teAct;editFormula(f=>{let ai=actsOf(f,row.name);
   if(ai<0){if(v===undefined)return;f.traits.acts.rules.push(ruleFrom(row));ai=f.traits.acts.rules.length-1;}
   const r=f.traits.acts.rules[ai];if(v===undefined)delete r[act];else r[act]=v;
   if(!['vaginal','oral','anal'].some(k=>r[k]!==undefined))f.traits.acts.rules.splice(ai,1);});}
  else{
   const ed=edits[row.id]??={};
   if(t.dataset.teDesc!==undefined){if(t.value===row.description)delete ed.description;else ed.description=t.value;}
   if(t.dataset.teThreshold!==undefined){if(v===undefined||v===row.binding.threshold)delete ed.threshold;else ed.threshold=v;}
   if(t.dataset.teSet!==undefined){if(v===undefined||v===row.binding.setValue)delete ed.setValue;else ed.setValue=v;}
   if(t.dataset.teMemo!==undefined){if(t.value.trim())ed.memo=t.value;else delete ed.memo;}
   if(!Object.keys(ed).length)delete edits[row.id];
   saveEdits();setTimeout(render,0);
  }
 });
 root.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.teSel){sel=b.dataset.teSel;render();return;}
  const a=b.dataset.teAct;
  if(a==='clear'){delete edits[cur().id];saveEdits();render();}
  if(a==='export'){
   // AI가 읽을 수 있게 원본 값과 수정 값·메모를 함께 내보낸다
   const out={schema:'jo9-trait-edit-requests/v1',note:'특성 편집 탭에서 사용자가 남긴 특성 수정과 형질 변경 메모. 원본(original)과 요청(edit)을 함께 적는다. AI는 memo를 읽고 게임 데이터·코드 변경을 처리한다.',exportedAt:new Date().toISOString(),
    traits:Object.entries(edits).map(([tid,ed])=>{const r=rows.find(x=>x.id===tid);return {id:tid,name:r?.name,category:r?.category,binding:r?.binding??null,original:{description:r?.description,threshold:r?.binding?.threshold,setValue:r?.binding?.setValue},edit:ed};})};
   const blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'}),u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download='JO9_trait_edit_requests.json';l.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
  }
 });
 onFormulaChange(()=>{if(!root.hidden)render();});
 render();
 return {render};
}
