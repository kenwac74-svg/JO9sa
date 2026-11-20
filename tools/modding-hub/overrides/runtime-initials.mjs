// Shared editor/simulator initial state. One draw remains fixed until explicitly regenerated.
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='jo9-runtime-context-v1';let settings={master:1,difficulty:1,obedience:0,cm:0,routes:{}};
try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
const records=new Map(),listeners=new Set();let revision=0;
export const subscribeRuntime=fn=>(listeners.add(fn),()=>listeners.delete(fn));
export const runtimeMasterId=()=>Number(settings.master);
const emit=()=>listeners.forEach(fn=>fn());
const identity=actor=>JSON.stringify([actor?.id??'',actor?.data??{}]);
async function call(body){const r=await fetch('/api/runtime-initials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||'초기값 계산 실패');return d;}
const routeKey=actor=>String(actor?.id??0);
function context(actor,record){const chosen=settings.routes[routeKey(actor)];return {...settings,routes:undefined,route:record.meta?.routes.some(r=>r.id===chosen)?chosen:record.meta?.defaultRoute??'regular'};}
export function runtimeRecord(actor){return records.get(identity(actor));}
export function runtimeValues(actor){const r=runtimeRecord(actor);return r?.stamp===revision&&!r.busy&&!r.error?r.result:null;}
export function ensureRuntime(actor,reroll=false){
 if(!actor||actor.id===null||actor.id===''||!Number.isInteger(Number(actor.id))||String(actor.id).startsWith('master:'))return;
 const key=identity(actor);let record=records.get(key);
 if(!record){record={actor,stamp:-1,meta:null,result:null};records.set(key,record);if(records.size>24)records.delete(records.keys().next().value);}
 if(record.busy||(!reroll&&record.stamp===revision))return;
 record.busy=true;record.error='';const version=revision;const seq=(record.seq??0)+1;record.seq=seq;
 queueMicrotask(emit);
 queueMicrotask(async()=>{try{
  record.meta=await call({action:'meta',characterId:Number(actor.id)});
  const result=await call({action:'calculate',characterId:Number(actor.id),...(actor.data?{data:actor.data}:{}),context:context(actor,record),acquisitionToken:reroll||record.result?.sourceRevision!==record.meta.sourceRevision?undefined:record.result?.acquisitionToken});
  if(record.seq===seq){record.result=result;record.stamp=version;}
 }catch(error){if(record.seq===seq){record.error=error.message;record.stamp=version;}}
 finally{if(record.seq===seq)record.busy=false;emit();if(version!==revision)ensureRuntime(actor);}});
 return record;
}
export function runtimeControls(actor){
 if(!actor||actor.id===null||actor.id==='')return '<p class="fine-print">캐릭터를 선택하거나 랜덤 생성을 누르세요.</p>';
 if(String(actor.id).startsWith('master:'))return '<p class="fine-print">마스터의 고유 초기값은 마스터 편집에서 확인합니다.</p>';
 const r=runtimeRecord(actor),ctx=context(actor,r||{}),opt=(v,t,current)=>`<option value="${e(v)}" ${String(v)===String(current)?'selected':''}>${e(t)}</option>`;
 const masters=r?.meta?.masters??[{id:1,name:'밀로드'}];
 const routes=r?.meta?.routes??[];
 const selected=routes.find(x=>x.id===ctx.route);
 const appearance=r?.meta?.appearanceRules;
 const appearanceHint=appearance?[...appearance.mode.values.map(row=>`${appearance.mode.code} ${row.value} = ${row.label}`),...appearance.classes.map(row=>`seed_age ${row.value} = ${row.label} (${row.code})`)].join('\n'):'';
 const state=r?.busy?'실제 QSP 초기값 계산 중…':r?.error?'계산 실패: '+r.error:r?.result?'영입 결과 고정 · 난이도 변경 시 자동 재계산':'초기값 계산 준비 중…';
 return `<div class="runtime-initials"><div class="runtime-initial-controls"><label>주인공<select data-runtime-context="master">${masters.map(m=>opt(m.id,m.name,ctx.master)).join('')}</select></label><label title="game_difficulty. 게임 진행 난이도입니다.">게임 난이도<select data-runtime-context="difficulty">${[[0,'쉬움'],[1,'보통'],[2,'하드']].map(([v,t])=>opt(v,t,ctx.difficulty)).join('')}</select></label><label title="difficulty_setting. 게임 난이도와 별도로 적용되는 복종·행동력 보정입니다.">복종 난이도<select data-runtime-context="obedience">${[[1,'쉬움'],[0,'보통'],[2,'어려움']].map(([v,t])=>opt(v,t,ctx.obedience)).join('')}</select></label><label class="runtime-route">영입 경로<select data-runtime-context="route">${routes.map(x=>`<option value="${e(x.id)}" ${x.id===ctx.route?'selected':''} ${x.valid?'':'disabled'} title="${e(x.requirements||'')}">${e(x.label)}</option>`).join('')}</select></label><label title="영입 시점의 Cruel/Mercy. 시작값은 0입니다.">CM<input type="number" step="1" data-runtime-context="cm" value="${e(ctx.cm)}"></label><button class="button secondary" data-runtime-reroll ${r?.busy?'disabled':''}>다시 생성</button></div><p class="fine-print ${r?.error?'warning':''}" role="status">${e(state)}</p>${selected?.requirements?`<p class="fine-print">경로 전제: ${e(selected.requirements)} · 해당 영입 직전 조건을 갖춘 미리보기</p>`:''}${r?.result?`<small class="fine-print" title="${e(JSON.stringify(r.result.compatibility))}">현재 WORK QSP + JSON · ${e(r.result.role)} · 엔진 ${e(r.result.engine)} · ${e(r.result.qspHash.slice(0,12))}</small>`:''}${appearance?` <small class="fine-print" title="${e(appearanceHint)}"> · ${e(appearance.mode.code)} ${e(appearance.mode.defaultValue??'미확인')}</small>`:''}</div>`;
}
export function bindRuntimeControls(root,actor){
 root.querySelectorAll('[data-runtime-context]').forEach(input=>input.addEventListener('change',()=>{
  const key=input.dataset.runtimeContext;if(key==='route')settings.routes={...settings.routes,[routeKey(actor)]:input.value};else settings[key]=Number(input.value);
  try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}revision++;emit();ensureRuntime(actor);
 }));
 root.querySelector('[data-runtime-reroll]')?.addEventListener('click',()=>{ensureRuntime(actor,true);emit();});
 ensureRuntime(actor);
}
