// 시뮬레이터 화면들이 함께 쓰는 데이터: 실제 엔진 표본, 과거 경험 공식 계수, 배경 이름, 게임 생성 규칙의 세계·출신·직업 연결
let cache=null;
import {buildCoherentConnections} from './background-connections.mjs';
export async function loadSimData(){
 if(cache)return cache;
 const load=async f=>{const r=await fetch('./data/'+f);if(!r.ok)throw new Error(f+'를 읽지 못했습니다.');return r.json();};
 const [sample,formula,bg,drafts,cats]=await Promise.all(['generated-stock.json','past-history-formula.json','backgrounds.json','background-drafts.json','background-categories.json'].map(load));
 const all=sample.rows.map(r=>Object.fromEntries(sample.keys.map((k,i)=>[k,r[i]])));
 // 랜덤 범위 안의 고유 캐릭터(예: 2339)는 세계·출신·직업이 없고 고정 배경을 쓰므로 공식 대상에서 뺀다
 const rows=all.filter(r=>r.world&&r.family&&r.occupation);
 const labels={};for(const r of [...bg.records,...drafts.records])(labels[r.kind]??={})[r.id]??=r.label;
 const name=(kind,id)=>labels[kind]?.[id]??id;
 // 게임 생성 규칙: 세계 → $<세계>_family, 출신 → $<출신>_occupation. 원숙한 신부는 생성 중 아내로 이름이 바뀐다.
 const RENAME={poor_bride:'poor_wife',noble_bride:'noble_wife',rich_bride:'rich_wife'};
 const worlds=[...new Set(bg.worldPool)];
 const familiesOf=w=>bg.pools[w+'_family']??[];
 const occupationsOf=f=>{const o=bg.pools[f+'_occupation']??[];return [...new Set([...o,...o.filter(x=>RENAME[x]).map(x=>RENAME[x])])];};
 const byName=key=>(a,b)=>name(key,a).localeCompare(name(key,b),'ko');
 // sel의 다른 두 칸과 연결되는 값만 돌려준다
 function options(key,sel){
  const W=sel.world?[sel.world]:worlds;
  if(key==='world')return worlds.filter(w=>(!sel.family||familiesOf(w).includes(sel.family))&&(!sel.occupation||familiesOf(w).some(f=>(!sel.family||f===sel.family)&&occupationsOf(f).includes(sel.occupation)))).sort(byName('world'));
  if(key==='family')return [...new Set(W.flatMap(familiesOf))].filter(f=>!sel.occupation||occupationsOf(f).includes(sel.occupation)).sort(byName('family'));
  const F=sel.family?[sel.family]:[...new Set(W.flatMap(familiesOf))];
  return [...new Set(F.flatMap(occupationsOf))].sort(byName('occupation'));
 }
 // 한 칸을 바꾼 뒤 연결이 끊긴 다른 칸 선택을 비운다
 function prune(sel,changed){for(const key of ['world','family','occupation'])if(key!==changed&&sel[key]&&!options(key,sel).includes(sel[key]))sel[key]='';}
 // 확정 연결표 v2(신규 ID 포함): 캐릭터 시뮬레이터·편집기의 배경 선택에 쓴다. 뽑기 분포는 게임 표본과 맞추려고 위의 옛 생성 목록을 그대로 쓴다
 const V2=buildCoherentConnections({records:[...bg.records,...drafts.records]});
 // 순서: 세계는 시대순(선사 → 고대 → 중세 → 판타지 → 근대 → 현대 → 미래), 출신·직업은 대분류 순서
 const rank={};for(const kind of ['world','family','occupation']){let i=0;for(const g of cats[kind]??[])for(const m of g.members)(rank[kind]??={})[m]??=i++;}
 // 출신·직업은 연결된 세계 중 가장 오래된 시대 순으로 먼저, 같은 시대 안에서는 대분류 순서
 const era={world:rank.world??{},family:{},occupation:{}};
 for(const [w,fs] of Object.entries(V2.worldFamilies))for(const f of fs)era.family[f]=Math.min(era.family[f]??1e4,era.world[w]??1e4);
 for(const [w,js] of Object.entries(V2.worldOccupations))for(const j of js)era.occupation[j]=Math.min(era.occupation[j]??1e4,era.world[w]??1e4);
 const byRank=key=>(a,b)=>(era[key][a]??1e4)-(era[key][b]??1e4)||(rank[key]?.[a]??1e4)-(rank[key]?.[b]??1e4)||name(key,a).localeCompare(name(key,b),'ko');
 const allIds=kind=>[...new Set([...bg.records,...drafts.records].filter(r=>r.kind===kind).map(r=>r.id))];
 function optionsV2(key,sel){
  const worldsV2=allIds('world');
  const famsOf=w=>V2.worldFamilies[w]??[];
  const jobOk=(w,f,j)=>{const r=V2.occupationFamilies[w+':'+j];return !f||!r||r.required===null||r.required.includes(f);};
  const jobsOf=(w,f)=>(V2.worldOccupations[w]??[]).filter(j=>jobOk(w,f,j));
  const W=sel.world?[sel.world]:worldsV2;
  let out;
  if(key==='world')out=worldsV2.filter(w=>(!sel.family||famsOf(w).includes(sel.family))&&(!sel.occupation||jobsOf(w,sel.family).includes(sel.occupation)));
  else if(key==='family')out=[...new Set(W.flatMap(famsOf))].filter(f=>!sel.occupation||W.some(w=>famsOf(w).includes(f)&&jobsOf(w,f).includes(sel.occupation)));
  else out=[...new Set(W.flatMap(w=>jobsOf(w,sel.family)))];
  return out.sort(byRank(key));
 }
 // 위에서 아래로 고른다: 바꾼 칸과 그 위는 그대로 두고, 아래 칸 중 연결이 끊긴 것만 비운다
 function pruneV2(sel,changed){const order=['world','family','occupation'];for(const key of order.slice(order.indexOf(changed)+1)){const up={};for(const k of order.slice(0,order.indexOf(key)))up[k]=sel[k];if(sel[key]&&!optionsV2(key,up).includes(sel[key]))sel[key]='';}}
 cache={sample,formula,rows,uniques:all.length-rows.length,name,options,prune,optionsV2,pruneV2};
 return cache;
}
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 고정 시드 수열(mulberry32)
export function rng(seed){let s=seed>>>0;return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}

// 공식 계수 저장소: 사용자가 바꾼 계수는 이 브라우저(localStorage)에 두고, 기본값은 past-history-formula.json이다.
const FORMULA_KEY='jo9-past-history-formula-v1';
const listeners=new Set();
let edited=null;
export function getFormula(base){
 if(edited)return edited;
 try{const raw=localStorage.getItem(FORMULA_KEY);if(raw){const f=JSON.parse(raw);if(f?.version===base.version){for(const k of Object.keys(base))if(f[k]===undefined)f[k]=structuredClone(base[k]);edited=f;return edited;}}}catch{}
 edited=structuredClone(base);return edited;
}
export function saveFormula(f){edited=f;try{localStorage.setItem(FORMULA_KEY,JSON.stringify(f));}catch{}for(const fn of listeners)fn();}
export function resetFormula(base){edited=structuredClone(base);try{localStorage.removeItem(FORMULA_KEY);}catch{}for(const fn of listeners)fn();}
export function onFormulaChange(fn){listeners.add(fn);}
export function formulaEdited(base){return JSON.stringify(getFormula(base))!==JSON.stringify(base);}
