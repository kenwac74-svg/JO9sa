import {initialPreview} from './initial-preview.mjs';
// Shared game display rules. Unknown values remain visible without inventing grades.
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rules={values:{},labels:{},palettes:{},skills:[],status:[],psych:{},supportedSeeds:[]},loading;
export function setGamePresentation(value){rules=value;return rules;}
export async function loadGamePresentation(refresh=false){
 if(refresh)loading=null;
 loading??=(async()=>{try{const r=await fetch('/api/game-presentation');if(!r.ok)throw Error('게임 표시 규칙을 읽지 못했습니다.');return setGamePresentation(await r.json());}catch(error){return setGamePresentation({values:{},labels:{},palettes:{},skills:[],status:[],psych:{},supportedSeeds:[],unavailable:error.message});}})();
 const value=await loading;if(value.unavailable)loading=null;return value;
}
export const gameRules=()=>rules;
export const ATTRIBUTES=['beauty','stamina','sensitivity','temper','intellect','ego','pride','exotic','fat','style','fame','mood'];
const alias={base_beauty:'beauty',base_exotic:'exotic'};
const grades=['F','D','C','B','A','S'];
const present=v=>v!==undefined&&v!==null&&v!=='';
export function describeGameValue(key,value){
 key=alias[key]??key.replace(/^seed_/,'');const label=rules.labels[key]??rules.status?.find(s=>s.key===key)?.label??rules.skills.find(g=>g.key===key)?.label??key;
 const sexSkill=rules.skills.some(g=>g.key===key||g.children.includes(key)),defaulted=sexSkill&&!present(value);if(defaulted)value=0;
 if(!present(value))return {key,label,text:'계산 전',color:null,tooltip:`${label} · ${key}\n미설정: 게임 초기값 또는 시뮬레이션 값을 지정하지 않았습니다.`};
 const lookup=key==='mood'&&Number(value)<0?5-Number(value):value;
 const row=rules.values[key]?.[lookup]??(sexSkill&&grades[value]?{text:label+' '+grades[value],cycle:'skill',index:Number(value)}:undefined);let color=row?rules.palettes[row.cycle]?.[row.index]??null:null;
 const status=rules.status?.find(s=>s.key===key.replace(/^rate\./,''));if(status&&!row)color=status.color;
 if(key==='obedience')color=Number(value)>0?'#008000':Number(value)<0?'#cd0000':'#3c8712';
 let grade=row?.text.match(/\s([FDCBAS](?:\+\+)?)$/)?.[1]??(row?.cycle==='skill'?grades[row.index]:null);
 if(key==='psy_status'){const psy=rules.psych?.[value];return {key,label:'정신 상태',text:psy?.text??String(value),color:psy?.color??null,tooltip:`정신 상태 · ${value}`};}
 return {key,label:status?status.label+(key.startsWith('rate.')?' 단계':''):label,text:row?.text??String(value),color,grade,tooltip:`${status?.label??label} · ${key}\n${grade?'등급: '+grade+' · ':''}수치: ${value}${row?'\n게임 표시: '+row.text:''}${defaulted?'\n입력값 없음: 기본값 0(F)':''}`};
}
export function valueBadge(key,value){const d=describeGameValue(key,value);return `<span class="game-value${d.color?' has-color':''}"${d.color?` style="--game-color:${e(d.color)}"`:''} title="${e(d.tooltip)}" tabindex="0">${e(d.text)}</span>`;}
export function attributeCards(c,overrides={}){const initial=initialPreview(c,overrides,rules);return `${rules.unavailable?'<p class="warning">게임 폴더를 연결하면 색상·등급 표시를 불러옵니다.</p>':''}<div class="game-attribute-grid">${ATTRIBUTES.map(k=>{const v=initial.attributes[k],d=describeGameValue(k,v);return `<div class="game-attribute" title="${e(initial.trace[k]??d.tooltip)}"><span>${e(d.label)}</span>${valueBadge(k,v)}</div>`;}).join('')}</div>`;}
export function traitPresentation(row){
 if(row.binding?.key==='jo9_versatile'||/챔피언/.test(row.name))return {color:rules.titleColor??'#5c351d',source:'게임 칭호 색상'};
 const names=[row.name,...(row.aliases??[])].map(v=>String(v).replace(/[\s\[\]]/g,''));
 const found=names.find(n=>rules.traitColors?.[n]);return {color:found?rules.traitColors[found]:'#000000',source:found?'게임 특성 색상':'게임 기본 글자색'};
}
export function traitStyle(row){return `style="--game-color:${e(traitPresentation(row).color)}"`;}
const skillBadge=(key,value)=>{const d=describeGameValue(key,value);return `<span class="game-value${d.color?' has-color':''}" ${d.color?`style="--game-color:${e(d.color)}"`:''} title="${e(d.tooltip)}" tabindex="0">${e(d.grade??d.text)}</span>`;};
export function skillTree(c){return `<div class="game-skill-tree">${rules.skills.map(g=>{
 const average=!present(c[g.key]);
 const value=c._runtimeRequired&&!c._runtime?undefined:average?Math.trunc(g.children.reduce((sum,k)=>sum+Number(present(c[k])?c[k]:0),0)/g.children.length):c[g.key];
 const badge=c._runtimeRequired&&!c._runtime?'<span class="fine-print">계산 전</span>':average?`<span class="game-skill-average" title="세부 기술의 정수 평균입니다. 게임의 연관 기술 보정 전 값입니다.">${skillBadge(g.key,value)}</span>`:skillBadge(g.key,value);
 return `<details data-skill-group="${e(g.key)}"><summary title="${e(g.label)}"><span>${e(g.label)}</span>${badge}</summary><div class="game-skill-children">${g.children.map(k=>`<div><span title="${e(describeGameValue(k,c[k]).label)}">${e(describeGameValue(k,c[k]).label)}</span>${skillBadge(k,c[k])}</div>`).join('')}</div></details>`;
 }).join('')}</div>`;}
export function readSimulation(data={},simulation={}){
 const out={};for(const key of ['mood','arousal','fear','angst','spoil','moral','instinct','custom','rational','sex_sum','obedience'])if(rules.supportedSeeds.includes(key)&&present(data['seed_'+key]))out[key]=data['seed_'+key];
 if(present(data.seed_psy_basic))out.psy_status=data.seed_psy_basic;
 return {...out,...simulation,...Object.fromEntries(Object.entries(out).filter(([key])=>key!=='psy_status'))};
}
const STYLES={mood:'#187700',arousal:'#ad0e7b',fear:'#960018',angst:'#464451',spoil:'#EE1289',moral:'#008080',instinct:'#9e8e00',custom:'#082567',rational:'#B452CD',supermacy:'#e0640b'};
export const STATUS_LABELS={mood:'기분',arousal:'흥분',fear:'두려움',angst:'절망',spoil:'응석',moral:'헌신',instinct:'사육',custom:'습관',rational:'인식',obedience:'현재 복종도',supermacy:'장악력 영향',sex_sum:'성교육계',psy_status:'정신 상태'};
export function statusDashboard(c,s={}){
 const initial=initialPreview(c,s,rules);s=initial.status;
 const num=k=>present(s[k])?e(s[k]):'미설정';
 const pair=k=>`<div class="game-status-pair" style="--game-color:${STYLES[k]}"><b>${STATUS_LABELS[k]}</b><span title="${e(k)} 등급">등급 <strong>${num(k)}</strong></span><span title="${e(k)} 단계 · ${e(k)}_rate">단계 <strong>${num('rate.'+k)}</strong></span></div>`;
 const one=(k,color)=>`<div class="game-status-line" style="--game-color:${color??STYLES[k]??'#222222'}"><span>${STATUS_LABELS[k]}</span><strong title="${e(initial.trace[k]??k)}">${num(k)}</strong></div>`;
 return `<div class="game-status-dashboard"><div class="game-status-name">${c.portrait?`<img src="${e(c.portrait)}" alt="${e(c.name)} 초상">`:''}<b>${e(c.name||'이름 없음')}</b><small>${e(initial.caption)}</small></div><div class="game-status-columns"><section><h3>기분·정신 상태</h3>${pair('mood')}${pair('arousal')}${one('sex_sum')}<div class="game-status-line"><span>정신 상태</span>${valueBadge('psy_status',s.psy_status)}</div></section><section><h3>복종심 요소</h3>${one('obedience',!present(s.obedience)?'#222222':s.obedience>0?'#008000':s.obedience<0?'#cd0000':'#3c8712')}${pair('fear')}${pair('angst')}${pair('spoil')}${one('supermacy')}</section><section><h3>충성심 요소</h3>${pair('moral')}${pair('instinct')}${pair('custom')}${pair('rational')}</section></div><div class="game-status-reserved"><span>추가 지표</span><small>주요 속성 지표를 배치할 공간</small></div></div>`;
}
export function simulationFields(data,simulation,runtime=null){
 const flat=Object.fromEntries(Object.entries(data).filter(([key])=>key.startsWith('seed_')).map(([key,value])=>[key.slice(5),value]));
 const values=initialPreview({...flat,_runtime:runtime},readSimulation(data,simulation),rules).status,ks=Object.keys(STATUS_LABELS).filter(k=>k!=='psy_status');
 const field=(k,label)=>{
  const isSeed=!k.includes('.')&&rules.supportedSeeds.includes(k),value=isSeed?data['seed_'+k]:simulation[k],key=isSeed?'seed_'+k:k;
  return `<label class="st-stat st-game-stat" title="${e(isSeed?'게임 JSON 시작값: '+key:'편집기 시뮬레이션 전용: '+key)}"><span class="st-stat-name">${e(label)}</span><span class="st-stat-controls"><input type="number" step="1" ${isSeed?'data-st-set':'data-st-simulation'}="${e(key)}" data-type="int" data-game-default="${e(values[k]??'')}" value="${e(value??'')}" placeholder="${e(values[k]??'계산 전')}">${isSeed?`<button class="text-button" data-st-unset="${e(key)}" title="게임 초기값 지정 해제">×</button>`:`<button class="text-button" data-sim-unset="${e(k)}" title="시뮬레이션 지정 해제">×</button>`}</span><small data-game-description>${valueBadge(k,value??values[k])}</small><small class="st-stat-description">${present(value)?isSeed?'게임 초기값':'시뮬레이션 값':runtime?'QSP 계산값':'계산 전'}</small></label>`;
 };
 return `<section class="game-simulation-editor"><div class="section-label">관계·상태 지표</div><p class="fine-print">게임이 읽는 초기 등급은 JSON에 저장합니다. 진행 단계·현재 복종도·장악력의 수동 지정값은 편집기 프로필에 보관합니다. 01·02번 실제 초기값 표시는 위에서 선택한 QSP 계산 결과를 사용하며 수동 시험값을 섞지 않습니다.</p><div class="st-grid game-status-editor">${ks.map(k=>field(k,STATUS_LABELS[k]+(!['sex_sum','obedience','supermacy'].includes(k)?' 등급':''))+(STYLES[k]&&k!=='supermacy'?field('rate.'+k,STATUS_LABELS[k]+' 단계'):'')).join('')}<label class="st-stat st-game-stat"><span class="st-stat-name">정신 상태</span><select data-st-simulation="psy_status"><option value="">초기값 사용 / 미설정</option>${Object.entries(rules.psych??{}).map(([k,v])=>`<option value="${e(k)}" ${simulation.psy_status===k?'selected':''}>${e(v.text)}</option>`).join('')}</select>${valueBadge('psy_status',values.psy_status)}</label></div></section>`;
}
export function refreshGameField(input){
 const box=input.closest('.st-game-stat,.st-initial-field');if(!box)return;
 const key=input.dataset.stSet??input.dataset.stInitial??input.dataset.stMasterStat??input.dataset.stSimulation,description=box.querySelector('[data-game-description]');
 if(key&&description){const value=input.value===''?(input.dataset.gameDefault??0):input.value,d=describeGameValue(key,value);description.innerHTML=valueBadge(key,value);box.title=d.tooltip;}
}
// Older trait data lists a retired display name for the same seed.
export function editorTraitRows(rows){
 const danceId='calisthenics_affinity > 0', primaryName='발레리나', retiredName='이국적인 댄서';
 const danceRows=rows.filter(row=>row.id===danceId && [primaryName,retiredName].includes(row.name));
 const primary=danceRows.find(row=>row.name===primaryName)??danceRows[0];
 if(!primary)return rows;
 const aliases=[...new Set(danceRows.flatMap(row=>row.aliases??[]))].filter(name=>name!==primaryName&&name!==retiredName);
 const talent={...primary,name:primaryName,description:'무용술을 더 빨리 배운다.',aliases};
 return rows.filter(row=>row===primary || !danceRows.includes(row)).map(row=>row===primary?talent:row);
}

export function findTraitByName(rows,name){
 return rows.find(row=>row.name===name)??rows.find(row=>row.aliases?.includes(name));
}
