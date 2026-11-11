import {SCHEMA,GRADES,DOMAINS,STAT_KEYS,OWNER_COUNT_KEYS,COMBAT_KEYS,COMBAT_TYPES,SKILLS,defaultConfig,defaultCharacter,freshState,clone,estimate,validateState} from './engine.mjs';
import {createWorkbench} from './workbench.mjs';
import {createSimView} from './sim-view.mjs';
import {createOneView} from './one-view.mjs';
import {moveUnclassifiedCombat} from './character-io.mjs';
import {settingsFilename,openSettingsSave} from './settings-save.mjs';
const KEY='jo9-history-lab-v1';
const initialHash=location.hash.slice(1);
const requestedTab=location.hash.slice(1)||'simulator';
let workbench=null;
let state=freshState(),tab='simulator',traceOpen=false,selected=new Set(),storageAvailable=true;
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x).toLocaleString('ko-KR',{maximumFractionDigits:2});
const sourceLabels={estimate:'추정',manual:'직접 지정',record:'확정 기록',unknown:'미상',fixed_estimate:'저장된 추정값'};
const ownerCombatTotal=(result,key)=>result.owner?.combatTotals?.[key]??{value:0,source:'record'};
const labels={intimacy:'성적 경험',wins:'승리',losses:'패배',escapes:'도주',pregnancies:'임신',abortions:'낙태',births:'출산',children:'자녀'};
const comparisonMetrics=[...OWNER_COUNT_KEYS.map(key=>({label:`소속 이후 ${labels[key]}`,read:result=>result.owner?.[key]??{value:0,source:'record'}})),...Object.entries(labels).filter(([key])=>STAT_KEYS.includes(key)&&!COMBAT_KEYS.includes(key)).map(([key,label])=>({label,read:result=>result.rows[key]})),...COMBAT_TYPES.flatMap(type=>COMBAT_KEYS.map(key=>({label:`소속 이후 ${type.name} ${labels[key]}`,read:result=>result.owner?.combatGroups?.[type.id]?.[key]??{value:0,source:'record'}}))),{label:'소속 이후 누적 수익',read:result=>({value:result.owner?.income??0,source:result.owner?.source??'record'})}];
try{const raw=localStorage.getItem(KEY);if(raw)state=validateState(JSON.parse(raw));}catch(e){storageAvailable=false;setTimeout(()=>toast('저장 데이터를 읽지 못했습니다. JSON 백업을 불러오거나 현재 설정을 내보내세요.'),250);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageAvailable=true;$('#saveStatus').textContent='이 브라우저에 저장됨';}catch(e){storageAvailable=false;$('#saveStatus').textContent='자동 저장 불가 · JSON 백업 필요';}$('#archiveCount').textContent=state.snapshots.length;}
let toastTimer;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4200);}
function confirmAction(title,message,action){$('#confirmTitle').textContent=title;$('#confirmText').textContent=message;$('#confirmOk').onclick=()=>{$('#confirmDialog').close();action();};$('#confirmDialog').showModal();}
$('#confirmCancel').onclick=()=>$('#confirmDialog').close();
function download(data,name,type='application/json'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function fileStamp(){return new Date().toISOString().slice(0,10).replaceAll('-','');}
function exportState(){const now=new Date();openSettingsSave({text:JSON.stringify({...state,exportedAt:now.toISOString()},null,2),name:settingsFilename(now),download,toast});}
$('#exportState').onclick=exportState;
$('#importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{
  if(file.size>5*1024*1024)throw new Error('파일 크기는 5MB 이하여야 합니다.');
  const imported=validateState(JSON.parse(await file.text()));
  confirmAction('설정 불러오기','현재 계수, 편집 중인 캐릭터, 비교 보관함을 파일 내용으로 교체합니다. 현재 설정은 먼저 내보내기로 보관할 수 있습니다.',()=>{state=imported;selected.clear();save();renderAll();toast('설정을 불러왔습니다.');});
}catch(error){toast(error.message||'JSON 파일을 읽지 못했습니다.');}e.target.value='';};
const color=['#c8a86e','#9aacc8','#7cb5aa'];
function options(list,id){return list.map(x=>`<option value="${esc(x.id)}" ${x.id===id?'selected':''}>${esc(x.name)}</option>`).join('');}
function field(label,control,small='',full=false){return `<label class="field${full?' full':''}"><span>${label}</span>${control}${small?`<small>${small}</small>`:''}</label>`;}
function input(path,value,opts=''){return `<input data-path="${path}" value="${esc(value)}" ${opts}>`;}
function skillRow(key,name){const g=state.character.skills[key];return `<div class="skill-row"><span>${name}</span><div class="grade-rail" role="group" aria-label="${name} 등급">${GRADES.map((x,i)=>`<button class="grade-button ${g===i?'active':''}" data-skill="${key}" data-grade="${i}" aria-label="${name} ${x}" aria-pressed="${g===i}">${x}</button>`).join('')}</div><span class="grade-output ${g>=4?'high':''}">${GRADES[g]}</span></div>`;}
function flag(name,label){const checked=state.character.flags[name];return `<label class="tag"><input type="checkbox" data-path="character.flags.${name}" ${checked?'checked':''}> ${label}</label>`;}
function renderSimulator(){const c=state.character;
$('#simulator').innerHTML=`
<div class="notice"><span>ⓘ</span><div><strong>영입 전 경력의 초기값을 계산합니다.</strong> 알려진 기록은 추정보다 우선합니다. 아래 기준값과 계수는 조정용 초안이며, 소속 이후 전적·임신·출산·낙태·자녀와 수익을 별도로 기록합니다.</div></div>
<div class="sim-grid"><div class="column">
<article class="card"><div class="card-head"><h2><span class="index">01</span>캐릭터 프로필</h2><button class="text-button" data-action="newCharacter">새 프로필 +</button></div>
<div class="preset-strip"><span>예시 불러오기</span><button class="preset" data-preset="maid">가사 종사자</button><button class="preset" data-preset="veteran">베테랑 전사</button><button class="preset" data-preset="teacher">학업·교사</button><button class="preset" data-preset="clone">기술 주입 클론</button></div>
<div class="card-body"><div class="form-grid">
${field('캐릭터 이름',input('character.name',c.name,'maxlength="100" aria-label="캐릭터 이름"'))}
${field('고정 캐릭터 ID',input('character.id',c.id,'maxlength="100" required aria-label="고정 캐릭터 ID"'),'같은 ID·시드는 같은 난수 보정을 사용합니다.')}
${field('이전 직업',`<select data-path="character.job" aria-label="이전 직업">${options(state.config.jobs,c.job)}</select>`)}
${field('생활 배경',`<select data-path="character.background" aria-label="생활 배경">${options(state.config.backgrounds,c.background)}</select>`)}
${field('배경 메모',`<textarea data-path="character.note" maxlength="4000" placeholder="명시된 경력, 예외 설정, 산출 근거를 남기세요." aria-label="배경 메모">${esc(c.note)}</textarea>`,'자유 문장은 자동 분석하지 않습니다. 아래 태그·계수·직접 지정으로 반영하세요.',true)}
</div><div class="section-label" style="margin-top:18px">배경·예외 태그</div><div class="tag-list">${flag('lesbian','레즈비언')}${flag('nonhuman','이종 접촉 배경')}${flag('clone','기술 주입·클론')}${flag('noIntimacy','전체 성적 미경험')}${flag('noVaginal','질 미경험')}${flag('oralAddiction','펠라 중독')}${flag('analAddiction','애널중독')}</div>
${field('성향 보정',`<select data-path="character.desire" aria-label="성향 보정"><option value="none" ${c.desire==='none'?'selected':''}>없음 · 1.00배</option><option value="nymph" ${c.desire==='nymph'?'selected':''}>색정광 · ${fmt(state.config.rules.nymph)}배</option><option value="semen" ${c.desire==='semen'?'selected':''}>정액중독 · ${fmt(state.config.rules.semen)}배</option></select>`,'초기 경력용 가설 계수입니다. 길거리 업무 수익 배수와 별개입니다.')}
<div class="form-grid compact-fields">${field('개인 경력 보정 ×',input('character.scale',c.scale,'type="number" min="0" max="10" step="0.05" aria-label="개인 경력 보정"'))}${field('고정 난수 시드',input('character.seed',c.seed,'maxlength="100" aria-label="고정 난수 시드"'))}
${field('인간 중 동성 비중 %',input('character.samePct',c.samePct??'','type="number" min="0" max="100" step="1" placeholder="자동" aria-label="인간 중 동성 비중"'),'빈칸: 성향 기본값 적용')}
${field('전체 중 인간 외 비중 %',input('character.nonhumanPct',c.nonhumanPct??'','type="number" min="0" max="100" step="1" placeholder="자동" aria-label="인간 외 비중"'),'빈칸: 접촉 배경이 있을 때만 적용')}
</div></div></article>
<article class="card"><div class="card-head"><h2><span class="index">02</span>스킬 분포</h2><span class="badge muted">F → S</span></div><div class="card-body">
<div class="section-label">경험 규모 · 상위 기술</div>${SKILLS.filter(x=>x[2]==='intimacy').map(([k,n])=>skillRow(k,n)).join('')}
<div class="section-label">경험 유형 · 상세 기술</div><div class="detail-grid">${SKILLS.filter(x=>x[2]==='detail').map(([k,n])=>field(n,`<select data-path="character.skills.${k}" data-number aria-label="${n}">${GRADES.map((g,i)=>`<option value="${i}" ${c.skills[k]===i?'selected':''}>${g}</option>`).join('')}</select>`)).join('')}</div><p class="fine-print">구강 상세는 max(펠라, 딥스로트)를 입력합니다. 상위 기술과 상세 기술은 서로 다른 입력입니다.</p>
<p class="fine-print">성적 경험 기준량은 ‘산출 계수’에서 조정합니다. 전적은 소속 이후 실제 기록만 입력합니다.</p></div></article>
</div><div class="column"><article class="card result-card"><div class="card-head"><h2><span class="index">03</span>초기 경력 미리보기</h2><span class="badge">추정치 포함</span></div><div class="card-body" id="resultBody"></div><button class="expand" data-action="toggleTrace" aria-expanded="${traceOpen}">${traceOpen?'▾':'▸'} 산출 과정 확인</button><div class="card-body" id="traceBody" ${traceOpen?'':'hidden'}></div></article>
<article class="card"><div class="card-head"><h2>과거 경력 값 지정</h2><span class="badge muted">0도 유효한 기록</span></div><div class="table-wrap"><table class="stats-table"><thead><tr><th>항목</th><th class="numeric">결과</th><th>근거</th><th class="numeric">지정값</th></tr></thead><tbody id="overrideRows"></tbody></table></div><div class="coefficient-caption">자동: 산식 사용 · 확정 기록: 기존 데이터·설정에 명시된 값 · 직접 지정: 기획자가 정한 값. 미상은 알려진 0과 구별합니다.</div></article>
<article class="card" id="combatEditor"></article><article class="card"><div class="card-head"><h2>소속 이후 · 누적 기록</h2><span class="badge muted">주인과 생활한 이후</span></div><div class="card-body"><div class="form-grid">${field('누적 수익',input('character.ownerIncome.value',c.ownerIncome.value,'type="number" min="0" max="1000000000" step="1" aria-label="소속 이후 누적 수익"'))}${field('수익 근거',`<select data-path="character.ownerIncome.mode" aria-label="소속 이후 수익 근거"><option value="record" ${c.ownerIncome.mode==='record'?'selected':''}>확정 기록</option><option value="manual" ${c.ownerIncome.mode==='manual'?'selected':''}>직접 지정</option></select>`)}</div><div class="form-grid">${OWNER_COUNT_KEYS.map(key=>{const item=c.ownerCounts[key];return field(labels[key],input(`character.ownerCounts.${key}.value`,item.value,`type="number" min="0" max="1000000000" step="1" aria-label="소속 이후 ${labels[key]}"`))+field(`${labels[key]} 근거`,`<select data-path="character.ownerCounts.${key}.mode" aria-label="소속 이후 ${labels[key]} 근거"><option value="record" ${item.mode==='record'?'selected':''}>확정 기록</option><option value="manual" ${item.mode==='manual'?'selected':''}>직접 지정</option></select>`);}).join('')}</div><p class="fine-print">신규 영입 시 각각 0. 임신·출산·낙태·자녀와 수익은 현재 주인에게 소속된 이후 기록만 누적하며, 과거 이력이나 숙련도로 추정하지 않습니다.</p></div></article></div></div>`;
renderResult();workbench?.renderProfile();}
function renderResult(updateOverrides=true){const result=estimate(state.character,state.config),c=state.character;
const total=result.rows.intimacy.value,unknown=result.rows.intimacy.source==='unknown';
$('#resultBody').innerHTML=`<div class="result-summary"><div class="summary-tile featured"><span class="summary-label">영입 전 성적 경험</span><div class="summary-value">${fmt(total)}<small>회</small></div><div class="summary-foot">${sourceLabels[result.rows.intimacy.source]} · 상대별 분류 합계</div></div><div class="summary-tile"><span class="summary-label">소속 이후 전적</span><div class="combat-summary">${showRow(ownerCombatTotal(result,'wins'))}승 · ${showRow(ownerCombatTotal(result,'losses'))}패 · ${showRow(ownerCombatTotal(result,'escapes'))}도주</div><div class="summary-foot">PvP · PvE · 미분류 합계</div></div><div class="summary-tile"><span class="summary-label">소속 이후 누적 수익</span><div class="summary-value">${fmt(result.owner.income)}<small>스파크</small></div><div class="summary-foot">${sourceLabels[result.owner.source]} · 과거 수익과 분리</div></div></div>
<div class="bar" aria-label="상대별 경험 구성">${result.partners.map((v,i)=>`<span style="width:${total?v/total*100:0}%;background:${color[i]}"></span>`).join('')}</div><div class="bar-legend">${['인간 이성','인간 동성','인간 외'].map((n,i)=>`<span><i style="background:${color[i]}"></i>${n} <b>${fmt(result.partners[i])}</b></span>`).join('')}</div>
<div class="distribution"><table><thead><tr><th>성공 횟수 유형</th><th class="numeric">인간 이성</th><th class="numeric">인간 동성</th><th class="numeric">인간 외</th><th class="numeric">합계</th></tr></thead><tbody>${['질','구강','애널',...(result.unassigned?['미분류']:[])].map((n,i)=>`<tr><td>${n}</td>${result.matrix[i].map(v=>`<td class="numeric">${fmt(v)}</td>`).join('')}<td class="numeric">${fmt(i===3?result.unassigned:result.acts[i])}</td></tr>`).join('')}<tr class="total"><td>합계</td>${result.partners.map(v=>`<td class="numeric">${fmt(v)}</td>`).join('')}<td class="numeric">${fmt(total)}</td></tr></tbody></table></div>
<p class="fine-print">횟수는 성공한 행위 단위의 추정이며 고유 상대 인원수가 아닙니다. 동성·이성은 대상 캐릭터 기준입니다. 분류표는 총횟수를 나눈 추정으로, 총횟수가 확정 기록이어도 세부 비중은 별도 추정입니다.</p>
<p class="fine-print">과거 경력은 소속 이전의 초기값입니다. 소속 이후 전적·임신·출산·낙태·자녀와 수익은 별도로 누적합니다.</p>
<div class="result-toolbar"><button class="button primary" data-action="snapshot">＋ 비교 보관함에 확정</button><button class="button secondary" data-action="exportCharacter">↓ 이 캐릭터 결과</button></div><div class="warning-list">${result.warnings.map(x=>`<div class="warning">${esc(x)}</div>`).join('')}</div>`;
if(updateOverrides)$('#overrideRows').innerHTML=Object.entries(result.rows).filter(([key])=>STAT_KEYS.includes(key)&&!COMBAT_KEYS.includes(key)).map(([id,row])=>{
  const o=c.overrides[id]||{mode:'auto',value:0};return `<tr><td>${labels[id]}<span class="row-kind">${sourceLabels[row.source]}</span></td><td class="numeric"><span class="result-value">${row.source==='unknown'?'—':fmt(row.value)}</span><span class="unit">${row.unit}</span></td><td><select data-override-mode="${id}" aria-label="${labels[id]} 근거"><option value="auto" ${o.mode==='auto'?'selected':''}>자동</option><option value="record" ${o.mode==='record'?'selected':''}>확정 기록</option><option value="manual" ${o.mode==='manual'?'selected':''}>직접 지정</option><option value="fixed_estimate" ${o.mode==='fixed_estimate'?'selected':''}>저장된 추정값</option></select></td><td class="numeric"><input type="number" min="0" max="1000000000" step="1" data-override-value="${id}" value="${o.mode==='auto'?'':o.value}" ${o.mode==='auto'?'disabled placeholder="자동"':''} aria-label="${labels[id]} 지정값"></td></tr>`;
}).join('');
$('#traceBody').innerHTML=`<ul class="trace-list">${Object.entries(result.rows).filter(([key])=>STAT_KEYS.includes(key)).map(([id,row])=>{
  const t=row.trace;return `<li><b>${labels[id]} · ${row.source==='unknown'?'미상':fmt(row.value)+' '+row.unit} <span class="badge ${row.source==='record'?'green':row.source==='manual'?'blue':'muted'}">${sourceLabels[row.source]}</span></b>${t.zero?'<code>배경 예외 → 자동 경력 0</code>':t.base!==undefined?`<code>등급 기준 ${fmt(t.base)} × 직업 ${fmt(t.job)} × 배경 ${fmt(t.background)} × 개인 ${fmt(t.scale)} × 성향 ${fmt(t.trait)} × 고정 난수 ${t.fluctuation.toFixed(3)} = ${fmt(row.auto)}</code>`:`<code>${esc(t.rule)}</code>`}${['record','manual','fixed_estimate'].includes(row.source)?`<div>자동 결과 ${fmt(row.auto)} 대신 ${sourceLabels[row.source]} ${fmt(row.value)} 적용</div>`:''}</li>`;
}).join('')}</ul><p class="fine-print">배경 ${esc(result.background)} / 직업 ${esc(result.job)}. 난수는 캐릭터 ID·시드·통계 항목으로 고정됩니다. 분류에는 별도 난수를 더하지 않습니다.</p>`;
if(updateOverrides)renderCombatEditor(result);
workbench?.renderResultExtras();
}
function seedCombatGroups(){
 state.character.ownerCombatGroups??=clone(defaultCharacter().ownerCombatGroups);
}
function renderCombatEditor(result){
 const holder=$('#combatEditor');if(!holder)return;
 holder.innerHTML=`<div class="card-head"><h2>소속 이후 전적 · PvP / PvE</h2><span class="badge muted">승리 · 패배 · 도주</span></div><div class="card-body"><p class="fine-print">현재 주인을 만난 이후의 실제 전적만 기록합니다. 아레나·캣파이팅은 PvP, 안개경계는 PvE로 분류하며 새 콘텐츠도 해당 상위 분류에 연결합니다. 신규 영입 시 각각 0입니다.</p></div><div class="table-wrap"><table class="combat-table"><thead><tr><th>분류</th>${COMBAT_KEYS.map(key=>`<th>${labels[key]}</th>`).join('')}</tr></thead><tbody>${COMBAT_TYPES.map(type=>`<tr><td><b>${type.name}</b><small>${type.venues}</small></td>${COMBAT_KEYS.map(key=>{const row=result.owner.combatGroups[type.id][key],input=state.character.ownerCombatGroups[type.id][key];return `<td><div class="combat-result">${showRow(row)}<small>${sourceLabels[row.source]}</small></div><select data-combat-mode="${type.id}:${key}" aria-label="소속 이후 ${type.name} ${labels[key]} 근거"><option value="record" ${input.mode==='record'?'selected':''}>확정 기록</option><option value="manual" ${input.mode==='manual'?'selected':''}>직접 지정</option></select><input type="number" min="0" max="1000000000" step="1" data-combat-value="${type.id}:${key}" value="${row.value}" aria-label="소속 이후 ${type.name} ${labels[key]} 지정값"></td>`;}).join('')}</tr>`).join('')}</tbody></table></div><div class="card-body"><div class="memo-actions"><button class="button secondary small" data-combat-move="pvp">미분류 전적을 PvP로 이동</button><button class="button secondary small" data-combat-move="pve">미분류 전적을 PvE로 이동</button></div><p class="fine-print">분류 이동은 합계를 유지합니다. 과거 전적·세계·스킬·배경 계수로 추정하거나 이관하지 않습니다.</p></div>`;
}
document.addEventListener('change',event=>{
 const el=event.target;if(!el.dataset.combatMode&&!el.dataset.combatValue)return;
 const [type,key]=(el.dataset.combatMode??el.dataset.combatValue).split(':');
 if(el.dataset.combatValue&&(el.value===''||!el.checkValidity())){toast('전적은 0 이상의 정수로 입력하세요.');renderResult();return;}
 seedCombatGroups();const input=state.character.ownerCombatGroups[type][key];
 if(el.dataset.combatMode)input.mode=el.value;else input.value=Number(el.value);
 save();renderResult();
});
document.addEventListener('input',event=>{
 const el=event.target;if(!el.dataset.combatValue||el.value===''||!el.checkValidity())return;
 const [type,key]=el.dataset.combatValue.split(':');seedCombatGroups();state.character.ownerCombatGroups[type][key].value=Number(el.value);save();renderResult(false);
});
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-combat-move]');if(!el)return;
 state.character=moveUnclassifiedCombat(state.character,state.config,el.dataset.combatMove);
 save();renderResult();
});
const ruleFields=[
 ['variation','고정 난수 편차 ± %',100,'같은 ID·시드에서는 재추첨하지 않음'],['sameDefault','기본 동성 비중 %',100,'인간 상대 중 동성 비중'],
 ['sameLesbian','레즈비언 동성 비중 %',100,'인간 상대 중 동성 비중'],['nonhumanBackground','접촉 배경의 인간 외 비중 %',100,'전체 중 비중 · 배경 태그가 있을 때'],
 ['oralAddiction','펠라 중독 유형 가중치 ×',10,'구강 상세를 S로 취급한 후 적용'],['analAddiction','애널중독 유형 가중치 ×',10,'애널 상세를 S로 취급한 후 적용'],
 ['nymph','색정광 초기 경력 ×',10,'정액중독과 중첩하지 않음'],['semen','정액중독 초기 경력 ×',10,'길거리 업무 수익 배수와 별도'],
 ['detailPower','상세 기술 가중 지수',10,'등급^지수 · 0이면 모든 허용 유형 동일 비중']
];
function renderCoefficients(){const cfg=state.config;
$('#coefficients').innerHTML=`<div class="toolbar"><p>모든 수치는 제안한 초안입니다. 변경 즉시 미리보기에 반영되며 확정 보관한 과거 결과는 바뀌지 않습니다.</p><button class="button secondary" data-action="resetConfig">기본 계수 복원</button></div><div class="coeff-grid">
<article class="card wide"><div class="card-head"><h2>등급 → 기준 경험량</h2><span class="badge">조정 초안</span></div><div class="table-wrap"><table class="coefficient-table"><thead><tr><th>통계 항목</th>${GRADES.map(g=>`<th>${g}</th>`).join('')}<th>단위</th></tr></thead><tbody>${DOMAINS.map(([id,name,unit])=>`<tr><td>${name}</td>${cfg.gradeBases[id].map((v,i)=>`<td><input data-path="config.gradeBases.${id}.${i}" type="number" min="0" max="10000000" step="1" value="${v}" aria-label="${name} ${GRADES[i]} 기준량"></td>`).join('')}<td>${unit}</td></tr>`).join('')}</tbody></table></div><div class="coefficient-caption">성적 경험은 성공 횟수의 기준입니다. 비단조 등급표도 조정 실험을 위해 허용합니다.</div></article>
<article class="card wide"><div class="card-head"><h2>복수 스킬의 반영 가중치</h2><span class="badge muted">비율로 정규화</span></div><div class="card-body"><div class="coeff-fields">${Object.entries(cfg.weights).filter(([group])=>group==='intimacy').map(([group,weights])=>`<div><div class="section-label">${labels[group]} 기준량</div><div class="coeff-fields">${Object.entries(weights).map(([k,v])=>field(SKILLS.find(x=>x[0]===k)[1],input(`config.weights.${group}.${k}`,v,`type="number" min="0" max="20" step="0.1" aria-label="${labels[group]} ${SKILLS.find(x=>x[0]===k)[1]} 반영 가중치"`))).join('')}</div></div>`).join('')}</div><p class="fine-print">가중치 합계가 1일 필요는 없습니다. 합계로 나눠 계산하며, 모두 0이면 해당 분야 자동 기준량도 0입니다.</p></div></article>
${profileTable('jobs','직업별 계수')}${profileTable('backgrounds','생활 배경별 계수')}
<article class="card wide"><div class="card-head"><h2>분류·성향 계수</h2><span class="badge muted">초기 추정 전용</span></div><div class="card-body"><div class="coeff-fields">${ruleFields.map(([k,n,max,note])=>field(n,input(`config.rules.${k}`,cfg.rules[k],`type="number" min="0" max="${max}" step="${max===100?1:.05}" aria-label="${n}"`),note)).join('')}</div></div></article></div>`;
}
function profileTable(key,title){return `<article class="card wide"><div class="card-head"><h2>${title}</h2><button class="button secondary small" data-add-profile="${key}">＋ 새 항목</button></div><div class="table-wrap"><table class="coefficient-table"><thead><tr><th>이름 / 분류 근거</th>${DOMAINS.map(([id,n])=>`<th>${n} ×</th>`).join('')}<th></th></tr></thead><tbody>${state.config[key].map((p,i)=>`<tr><td><input class="input-name" data-path="config.${key}.${i}.name" value="${esc(p.name)}" maxlength="100" aria-label="${title} ${i+1} 이름"><div class="fine-print">${esc(p.source||'사용자 추가')}</div></td>${DOMAINS.map(([id,n])=>`<td><input type="number" data-path="config.${key}.${i}.scales.${id}" min="0" max="20" step="0.1" value="${p.scales[id]}" aria-label="${esc(p.name)} ${n} 계수"></td>`).join('')}<td>${i?`<button class="remove-profile" data-remove-profile="${key}:${i}" aria-label="${esc(p.name)} 삭제">삭제</button>`:''}</td></tr>`).join('')}</tbody></table></div><div class="coefficient-caption">기본 ‘일반·불명’은 유지합니다. 코드의 직업 ID를 설계용 묶음으로 연결한 안이며, 미등록 직업·고유 인물은 직접 추가하거나 항목별 값을 지정하세요.</div></article>`;}
function snapshot(){
if(state.snapshots.length>=200){toast('보관함은 최대 200개입니다. 전체 설정을 내보낸 뒤 이전 항목을 정리하세요.');return;}
const c=clone(state.character),result=estimate(c,state.config),id=crypto.randomUUID();
state.snapshots.unshift({id,label:c.name||c.id,savedAt:new Date().toISOString(),character:c,config:clone(state.config),result,characterFile:clone(state.characterFile??null)});
selected.add(id);while(selected.size>4)selected.delete(selected.values().next().value);save();toast('계수와 결과를 함께 확정 보관했습니다.');}
function renderArchive(){const snapshots=state.snapshots;
const chosen=snapshots.filter(x=>selected.has(x.id));
$('#archive').innerHTML=`<div class="toolbar"><p>확정 당시의 계수와 결과를 보존합니다. 최대 4개를 골라 나란히 비교하세요.</p><button class="button secondary" data-action="exportArchive">↓ 보관함 CSV</button></div>${!snapshots.length?`<article class="card empty-state"><div class="empty-icon">▤</div><h3>아직 확정한 초기값이 없습니다</h3><p>시뮬레이터에서 계수를 조정하고 ‘비교 보관함에 확정’을 누르세요.</p><button class="button primary" data-go="simulator">시뮬레이터로 이동</button></article>`:`
${chosen.length?`<article class="card archive-comparison"><div class="card-head"><h2>선택한 초기값 비교</h2><span class="badge muted">${chosen.length}개 선택</span></div><div class="table-wrap"><table><thead><tr><th>통계 항목</th>${chosen.map(x=>`<th class="numeric">${esc(x.label)}</th>`).join('')}<th class="numeric">현재 미리보기</th></tr></thead><tbody>${comparisonMetrics.map(metric=>`<tr><td>${metric.label}</td>${chosen.map(x=>`<td class="numeric">${showRow(metric.read(x.result))}</td>`).join('')}<td class="numeric">${showRow(metric.read(estimate(state.character,state.config)))}</td></tr>`).join('')}</tbody></table></div></article>`:''}
<div class="archive-grid">${snapshots.map(x=>`<article class="card snapshot-card"><div style="display:flex;justify-content:space-between;align-items:center"><label class="tag"><input type="checkbox" data-compare="${esc(x.id)}" ${selected.has(x.id)?'checked':''}> 비교 선택</label><span class="badge green">확정 보관</span></div><h3>${esc(x.label)}</h3><div class="snapshot-meta">${esc(x.character.id)} · ${new Date(x.savedAt).toLocaleString('ko-KR')}</div><div class="snapshot-stats"><div><b>${fmt(x.result.rows.intimacy.value)}</b><span>영입 전 성적 경험 · 회</span></div><div><b>${showRow(ownerCombatTotal(x.result,'wins'))}승 · ${showRow(ownerCombatTotal(x.result,'losses'))}패 · ${showRow(ownerCombatTotal(x.result,'escapes'))}도주</b><span>소속 이후 전적</span></div></div><div class="snapshot-actions"><button class="button secondary small" data-load-snapshot="${esc(x.id)}">프로필·계수 불러오기</button><button class="button secondary small" data-export-snapshot="${esc(x.id)}">↓ JSON</button><button class="button danger small" data-delete-snapshot="${esc(x.id)}">삭제</button></div></article>`).join('')}</div>`}`;
}
function showRow(row){return !row||row.source==='unknown'?'—':fmt(row.value);}
function downloadGuide(){const a=document.createElement('a');a.href='./JO9_Character_JSON_Workbench_Handoff_20261110.md';a.download='JO9_Character_JSON_Workbench_Handoff_20261110.md';a.click();}
function renderGuide(){
$('#guide').innerHTML=`<div class="guide-layout"><article class="card"><div class="card-head"><h2>숫자를 만드는 순서</h2><span class="badge">설계 기준</span></div><div class="card-body prose"><h3>1. 알려진 기록부터 보존</h3><p>기존 기록이나 설정에 횟수가 명시되면 <strong>확정 기록</strong>으로 지정합니다. 0도 유효한 기록입니다. 기획상의 목표값은 <strong>직접 지정</strong>으로 구별하세요.</p><h3>2. 스킬은 규모, 배경은 경력 보정</h3><div class="formula">초기값 = 반올림(등급 기준량 × 직업 계수<br>× 생활 배경 계수 × 개인 보정 × 성향<br>× ID·시드로 고정한 난수)</div><p style="margin-top:12px">성적 경험 기준량은 애무 20%·구강 40%·삽입 40%입니다. 원문 배경을 선택하면 성경험은 세계 × 출신 × 직업 배수를 사용합니다. 원문 배경이 없을 때 기존 직업·생활 배경 계수를 사용합니다. 전적은 주인을 만난 이후의 실제 승리·패배·도주만 기록하며 과거 세계·능력치에서 추정하지 않습니다. 과거 임신·출산은 확정값을 우선합니다. 자동값은 직업경력 → 출신 → 세계 순으로 지정된 첫 범위에서 정수를 추첨하고, 같은 ID·시드·배경 조합에서는 유지합니다. 범위도 없으면 미상입니다.</p><h3>3. 총횟수를 상대와 유형으로 배분</h3><p>인간 외 비중을 먼저 나누고, 인간 상대를 동성·이성으로 분류합니다. 상세 유형은 질·구강·애널 기술의 제곱 비율이 기본입니다. 나머지를 배분해 <strong>행·열 합계와 총횟수를 보존</strong>합니다.</p><p>횟수는 고유 상대 인원수가 아닙니다. 레즈비언 특성은 동성 비중에 반영하며 총횟수에 가산하지 않습니다. 상세 유형과 상대의 조합은 독립 분포로 가정한 추정입니다.</p><h3>4. 최초 한 번 확정하고 실제 사건을 누적</h3><p>‘비교 보관함에 확정’은 프로필·계수·결과를 함께 고정합니다. 이후 계수 수정은 미리보기에만 반영합니다. 게임에서는 소속 이전 경력을 초기값으로 보존하고, 소속 이후 전적·임신·출산·낙태·자녀와 수익을 별도 누적하는 구조입니다.</p></div></article>
<div class="column"><article class="card"><div class="card-head"><h2>예외 처리</h2></div><div class="card-body prose"><ul><li><strong>기술 주입·클론:</strong> 성적 경험 자동 경력 0. 임신·가족 경력은 명시된 기록이나 배경 범위가 있으면 적용.</li><li><strong>전체 미경험:</strong> 성적 경험의 자동값 0.</li><li><strong>질 미경험:</strong> 질 분배만 제외. 다른 경험까지 0으로 간주하지 않음.</li><li><strong>과거 임신·출산:</strong> 특별한 이력이 있을 때만 범위나 확정값으로 지정. 그 외에는 미상.</li><li><strong>소속 이후 기록:</strong> 전적·임신·출산·낙태·자녀와 수익은 각각 0에서 시작. 과거 이력과 분리해 누적.</li><li><strong>배경 메모:</strong> 자동 해석하지 않음. 태그·계수·지정값으로 적용.</li><li><strong>기존 보유자:</strong> 과거 주인과의 기록 이관은 별도 설계. 이 화면의 신규 영입 규칙을 일괄 적용하지 않음.</li></ul></div></article>
<article class="card"><div class="card-head"><h2>저장과 내보내기</h2></div><div class="card-body prose"><p>편집값은 <strong>이 브라우저</strong>에 자동 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우기 전 ‘전체 설정 내보내기’로 JSON 백업을 남기세요.</p><p>전체 설정 JSON은 계수·현재 캐릭터·비교 보관함을 포함합니다. 캐릭터 결과 JSON과 CSV는 검토·핸드오프용입니다.</p><button class="button secondary" data-action="downloadGuide">↓ 설계 명세 Markdown</button></div></article>
<article class="card"><div class="card-body source-note"><strong>근거와 가설</strong><br>스킬 F–S, 직업·출신 구조, 클론 기술 주입은 조사한 소스에 근거합니다. 기준 횟수와 모든 추정 계수는 새로 제안한 조정 초안입니다.<br><br>기준 소스 607c7ec6 · 게임 반영 대기<br>길거리 업무의 확정된 성공등급·수익 보정은 이 초기값 추정식과 별도로 유지합니다.</div></article></div></div>`;}
function renderAll(){renderSimulator();renderCoefficients();renderArchive();renderGuide();switchTab(tab);$('#archiveCount').textContent=state.snapshots.length;workbench?.render();}
const tabNames={simulator:['초기값 시뮬레이터','경력 초기값 설계실','스킬과 배경을 조율하고, 캐릭터의 영입 전 경력을 설계하세요.'],coefficients:['산출 계수','초기값 산출 계수','기준 횟수와 배경 계수를 수정하고, 원하는 분포를 찾으세요.'],archive:['비교 보관함','확정 결과 비교','캐릭터별 결과와 계수를 보관하고, 서로 다른 설계를 비교하세요.'],guide:['산출 규칙','산출 규칙과 적용 범위','확정 기록과 추정 이력의 경계를 확인하세요.']};
function switchTab(next){if(!tabNames[next])next='simulator';if(next!==tab)window.scrollTo(0,0);tab=next;for(const el of document.querySelectorAll('.tab-panel'))el.hidden=el.id!==tab;for(const el of document.querySelectorAll('[data-tab]')){el.classList.toggle('active',el.dataset.tab===tab);el.setAttribute('aria-current',el.dataset.tab===tab?'page':'false');}$('#breadcrumb').textContent=tabNames[tab][0];$('#pageTitle').innerHTML=`${tabNames[tab][1]}<span class="draft-badge">조정 초안</span>`;$('#pageSubtitle').textContent=tabNames[tab][2];history.replaceState(null,'',`#${tab}`);}
function setPath(path,value){const pieces=path.split('.');let obj=state;for(let i=0;i<pieces.length-1;i++)obj=obj[pieces[i]];obj[pieces.at(-1)]=value;}
function refreshAfterEdit(element){
workbench?.onProfileChange(element.dataset.path);
save();if(tab==='simulator'){renderResult();}else if(tab==='coefficients'){/* keep edited table and focus stable */}renderArchive();
}
document.addEventListener('change',e=>{
 const el=e.target;
 if(el.dataset.path){let value;
   if(el.type==='checkbox')value=el.checked;
   else if(el.type==='number'||el.hasAttribute('data-number')){
     const optional=['character.samePct','character.nonhumanPct'].includes(el.dataset.path);
     if(el.value===''&&optional)value=null;
     else if(el.value===''||!el.checkValidity()){toast('허용 범위 안의 값을 입력하세요.');renderAll();return;}
     else value=Number(el.value);
   }else{value=el.value;if(el.required&&!value.trim()){toast('고정 캐릭터 ID는 비워둘 수 없습니다.');renderAll();return;}}
   setPath(el.dataset.path,value);refreshAfterEdit(el);
 }
 if(el.dataset.overrideMode){const k=el.dataset.overrideMode,old=state.character.overrides[k],row=estimate(state.character,state.config).rows[k];state.character.overrides[k]={mode:el.value,value:old?.value??row.value};save();renderResult();}
 if(el.dataset.overrideValue){if(!el.checkValidity()||el.value===''){toast('0 이상의 정수 값을 입력하세요.');renderResult();return;}state.character.overrides[el.dataset.overrideValue].value=Number(el.value);save();renderResult();}
 if(el.dataset.compare){if(el.checked){if(selected.size>=4){el.checked=false;toast('비교는 최대 4개까지 가능합니다.');return;}selected.add(el.dataset.compare);}else selected.delete(el.dataset.compare);renderArchive();}
});
// Keep valid numeric drafts live without replacing the focused input.
document.addEventListener('input',e=>{const el=e.target;
 if(el.dataset.path){
  if(['text','textarea'].includes(el.type)&&(!el.required||el.value.trim())){setPath(el.dataset.path,el.value);workbench?.onProfileChange(el.dataset.path);save();if(tab==='simulator')renderResult();}
  else if(el.type==='number'){
   const optional=['character.samePct','character.nonhumanPct'].includes(el.dataset.path);
   if((el.value!==''&&el.checkValidity())||(optional&&el.value==='')){const value=el.value===''?null:Number(el.value);setPath(el.dataset.path,value);save();if(tab==='simulator')renderResult();}
  }
 }
 if(el.dataset.overrideValue&&el.value!==''&&el.checkValidity()){
  state.character.overrides[el.dataset.overrideValue].value=Number(el.value);save();renderResult(false);
 }
});
document.addEventListener('click',e=>{
const el=e.target.closest('button');if(!el)return;
if(el.dataset.tab){if(el.dataset.tab==='simulator')renderSimulator();if(el.dataset.tab==='archive')renderArchive();switchTab(el.dataset.tab);}
if(el.dataset.go){renderSimulator();switchTab(el.dataset.go);}
if(el.dataset.skill){state.character.skills[el.dataset.skill]=Number(el.dataset.grade);workbench?.onProfileChange('character.skills.'+el.dataset.skill);save();renderSimulator();}
if(el.dataset.preset){confirmAction('예시 프로필 불러오기','편집 중인 캐릭터를 예시로 교체합니다. 산출 계수와 보관함은 유지합니다.',()=>{applyPreset(el.dataset.preset);save();renderSimulator();toast('성인 가상 캐릭터 예시를 불러왔습니다.');});}
if(el.dataset.addProfile){const key=el.dataset.addProfile,list=state.config[key];if(list.length>=100){toast('분류는 최대 100개입니다.');return;}list.push({id:`custom-${Date.now()}`,name:'새 분류',source:'사용자 추가',scales:Object.fromEntries(DOMAINS.map(([k])=>[k,1]))});save();renderCoefficients();}
if(el.dataset.removeProfile){const[key,index]=el.dataset.removeProfile.split(':'),i=Number(index);confirmAction('분류 삭제','이 분류를 삭제합니다. 현재 프로필이 사용 중이면 일반·불명으로 돌아갑니다. 확정 보관한 결과는 유지합니다.',()=>{const old=state.config[key][i].id;state.config[key].splice(i,1);const fieldName=key==='jobs'?'job':'background';if(state.character[fieldName]===old)state.character[fieldName]=state.config[key][0].id;save();renderAll();});}
if(el.dataset.loadSnapshot){const x=state.snapshots.find(x=>x.id===el.dataset.loadSnapshot);confirmAction('확정 프로필 불러오기','현재 캐릭터와 산출 계수를 확정 당시 내용으로 교체합니다. 보관함은 유지합니다.',()=>{state.character=clone(x.character);state.config=clone(x.config);state.characterFile=clone(x.characterFile??null);save();renderAll();switchTab('simulator');toast('확정 당시 프로필과 계수를 불러왔습니다.');});}
if(el.dataset.exportSnapshot){const x=state.snapshots.find(x=>x.id===el.dataset.exportSnapshot);download(JSON.stringify({schema:'jo9-history-result/v1',...x},null,2),`JO9_결과_${safeName(x.label)}.json`);}
if(el.dataset.deleteSnapshot){const id=el.dataset.deleteSnapshot;confirmAction('보관 결과 삭제','선택한 확정 결과를 보관함에서 삭제합니다.',()=>{state.snapshots=state.snapshots.filter(x=>x.id!==id);selected.delete(id);save();renderArchive();});}
switch(el.dataset.action){
case'toggleTrace':traceOpen=!traceOpen;$('#traceBody').hidden=!traceOpen;el.setAttribute('aria-expanded',String(traceOpen));el.textContent=`${traceOpen?'▾':'▸'} 산출 과정 확인`;break;
case'newCharacter':confirmAction('새 캐릭터 프로필','현재 편집 중인 프로필을 비우고 새 캐릭터를 만듭니다. 계수와 보관함은 유지합니다.',()=>{state.character=defaultCharacter();state.characterFile=null;state.character.id=`JO9-${crypto.randomUUID().slice(0,8)}`;state.character.job=state.config.jobs[0].id;state.character.background=state.config.backgrounds[0].id;save();renderSimulator();});break;
case'snapshot':snapshot();break;
case'exportCharacter':download(JSON.stringify({schema:'jo9-history-result/v1',exportedAt:new Date().toISOString(),character:state.character,config:state.config,result:estimate(state.character,state.config)},null,2),`JO9_결과_${safeName(state.character.name)}.json`);toast('현재 캐릭터의 프로필·계수·결과를 내보냈습니다.');break;
case'resetConfig':confirmAction('기본 계수 복원','산출 계수와 사용자 추가 분류를 기본 초안으로 복원합니다. 확정 보관한 결과는 유지합니다.',()=>{state.config=defaultConfig();if(!state.config.jobs.some(x=>x.id===state.character.job))state.character.job=state.config.jobs[0].id;if(!state.config.backgrounds.some(x=>x.id===state.character.background))state.character.background=state.config.backgrounds[0].id;save();renderAll();});break;
case'exportArchive':exportCsv();break;
case'downloadGuide':downloadGuide();break;
}
});
function safeName(s){return s.replace(/[^\p{L}\p{N}_-]/gu,'_').slice(0,60)||'캐릭터';}
function applyPreset(id){state.characterFile=null;const c=defaultCharacter();c.id=`JO9-EXAMPLE-${id}`;c.background=state.config.backgrounds[0].id;c.job=state.config.jobs[0].id;
if(id==='maid'){c.name='가사 경력 · 예시';c.job='maid';}
if(id==='veteran'){c.name='베테랑 전사 · 예시';c.job='huntress';c.background='field';for(const[k]of SKILLS)c.skills[k]=2;c.skills.combat=5;c.skills.nurse=3;c.skills.cook=3;}
if(id==='teacher'){c.name='학업·교사 · 예시';c.job='teacher';c.background='academic';for(const[k]of SKILLS)c.skills[k]=1;c.skills.secretary=4;c.skills.expression=4;c.skills.intellect=5;c.skills.cook=3;}
if(id==='clone'){c.name='기술 주입 클론 · 예시';c.flags.clone=true;for(const[k]of SKILLS)c.skills[k]=5;}
if(!state.config.jobs.some(x=>x.id===c.job))c.job=state.config.jobs[0].id;if(!state.config.backgrounds.some(x=>x.id===c.background))c.background=state.config.backgrounds[0].id;state.character=c;}
function exportCsv(){if(!state.snapshots.length){toast('내보낼 보관 결과가 없습니다.');return;}
const cell=x=>'"'+String(x).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+ '"';
const lines=[['캐릭터','ID','확정일',...comparisonMetrics.map(x=>x.label),'인간 이성','인간 동성','인간 외'],...state.snapshots.map(x=>[x.label,x.character.id,x.savedAt,...comparisonMetrics.map(metric=>{const row=metric.read(x.result);return row?.source==='unknown'?'미상':row?.value??'';}),...x.result.partners])];
download('\uFEFF'+lines.map(row=>row.map(cell).join(',')).join('\r\n'),`JO9_초기값비교_${fileStamp()}.csv`,'text/csv;charset=utf-8');}
$('#downloadGuide').onclick=()=>downloadGuide();
tab=location.hash.slice(1)||'simulator';renderAll();if(!storageAvailable)$('#saveStatus').textContent='자동 저장 상태 확인 필요 · JSON 백업 권장';

window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(next!==tab){if(next==='simulator')renderSimulator();switchTab(next);}});

try{workbench=await createWorkbench({getState:()=>state,save,renderAll,renderSimulator,renderResult,tabNames,switchTab,toast,confirmAction,download,snapshot});tab=requestedTab;renderAll();}catch(error){toast('캐릭터 편집 데이터를 읽지 못했습니다: '+error.message);}
try{
 // 새 초기값 시뮬레이터(세계·출신·직업 기반 공식)를 맨 앞에 두고, 예전 시뮬레이터·계수 탭은 '이전 산식'으로 남긴다
 tabNames.simulator[0]=tabNames.simulator[1]='이전 산식 (v0.11)';tabNames.coefficients[0]='이전 산식 계수';
 const oldSim=document.querySelector('[data-tab="simulator"]'),oldCoef=document.querySelector('[data-tab="coefficients"]');
 if(oldSim){oldSim.lastChild.textContent=' 이전 산식 (v0.11)';oldSim.querySelector('span').textContent='◇';}if(oldCoef)oldCoef.lastChild.textContent=' 이전 산식 계수';
 await createOneView({tabNames,toast});await createSimView({tabNames});
 // 해시 없이 열면 새 초기값 시뮬레이터부터 보여 준다(앱이 시작 중 해시를 #simulator로 바꾸므로 처음 해시를 쓴다)
 if(!initialHash)switchTab('draw-one');else if(initialHash==='draw-one'||initialHash==='slave-sim')switchTab(initialHash);
}catch(error){toast('초기값 시뮬레이터 데이터를 읽지 못했습니다: '+error.message);}
