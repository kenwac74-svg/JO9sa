import {clone,estimate,validateState,SCHEMA} from './engine.mjs';
import {parseCharacterJSON,exportCharacterJSON,primitiveFields,setPath,getPath,setTrait,traitMatches,normalizeRaceTags,applyTraitEffects,SKILL_ALIASES,DERIVED,normalizeTraitCatalogue,applyStandardCase,preserveRawEditCharacter,setCharacterSeedAge} from './character-io.mjs';
import {buildBackgroundCases,findBackgrounds,backgroundCategories,autoBackground,useBackground,JOB_MAP} from './backgrounds.mjs';
import {BACKGROUND_KINDS,PAST_RANGE_KEYS as RANGE_KEYS,getModifier,resolveBackgroundModifiers,validateBackgroundModifiers} from './background-modifiers.mjs';
import {orderCharacterJSON,describeCharacterField} from './character-fields.mjs';
import {AGE_CODES,textKey,getAgeRule,editedBackgroundText,worldFamilies,worldOccupations,getOccupationFamilyRule,allowedBackgroundAges,backgroundAgeAllows,validateBackgroundSettings} from './background-settings.mjs';
import {applyBackgroundDefaults,backgroundConnectionDefault} from './background-defaults.mjs';
import {applyCoherentConnections} from './background-connections.mjs';
const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x).toLocaleString('ko-KR');
const multiplier=x=>Number(x).toLocaleString('ko-KR',{maximumFractionDigits:8});
export async function createWorkbench(api){
 const [traitsData,bgData,sample,draftData]=await Promise.all(['traits.json','backgrounds.json','isabella-source.json','background-drafts.json'].map(async f=>{const r=await fetch('./data/'+f);if(!r.ok)throw new Error(f+' 데이터를 읽지 못했습니다.');return r.json();}));
 bgData.records.push(...draftData.records);
 const gameSeedKeys=await fetch('./data/game-seed-keys.json').then(r=>r.ok?r.json():null).then(d=>new Set(d?.keys??[])).catch(()=>new Set());
 let traits=normalizeTraitCatalogue(api.getState().traitCatalogue??traitsData);
 const allCases=()=>buildBackgroundCases(bgData,state().config);
 const savedBrowser=api.getState().backgroundBrowser??{};
 let browserStateRef=api.getState().backgroundBrowser;
 let traitQuery='',traitCategory='',traitPage=0,traitSelectedOnly=false,bgQuery=String(savedBrowser.query??'').slice(0,200),bgWorld=String(savedBrowser.world??''),bgFamily=String(savedBrowser.family??''),bgOccupation=String(savedBrowser.occupation??''),bgJob=Boolean(savedBrowser.profile),bgPage=Number.isSafeInteger(savedBrowser.page)?Math.max(0,savedBrowser.page):0,jsonQuery='',jsonPage=0,rawDraft='';
 const bgKindNames={world:'세계',family:'출신',occupation:'직업경력'},rangeNames={pregnancies:'임신',abortions:'낙태',births:'출산',children:'자녀'};
 const state=()=>api.getState(),c=()=>state().character,$=s=>document.querySelector(s);
 const syncConnectionDefaults=()=>{if(applyBackgroundDefaults(state().config,bgData))api.save();};
 syncConnectionDefaults();
 let editWorld='earth_rome:1',editFamily='',editOccupation='courtesan',agePreview='all',editorOpen=false,familyConditionsOpen=false;
 const records=kind=>bgData.records.filter(r=>r.kind===kind);
 const editorRecord=kind=>kind==='world'?records(kind).find(r=>textKey(r)===editWorld):records(kind).find(r=>r.id===(kind==='family'?editFamily:editOccupation));
 const go=id=>{if(id==='simulator')api.renderSimulator();render();api.switchTab(id);};
 const button=(text,action,cls='secondary')=>`<button class="button ${cls}" data-work-action="${action}">${text}</button>`;
 for(const[id,label,icon]of [['character-json','캐릭터 JSON','{ }'],['backgrounds','배경 설정 목록','▧'],['traits','특성 선택','✧']]){
  api.tabNames[id]=[label,label,id==='character-json'?'원본 캐릭터 데이터와 편집값을 확인하고 통계 초기값을 저장하세요.':id==='backgrounds'?'세계·출신·직업 명칭과 회상 대사를 검색하고 배경 메모에 불러오세요.':'특성 열람표 128개를 검색해 캐릭터에 추가하거나 삭제하세요.'];
  $('.sidebar nav').insertAdjacentHTML('beforeend',`<button data-tab="${id}" class="nav-button"><span>${icon}</span>${label}</button>`);
  document.querySelector('main footer').insertAdjacentHTML('beforebegin',`<section id="${id}" class="tab-panel" hidden></section>`);
 }
 document.body.insertAdjacentHTML('beforeend','<input type="file" id="characterImport" accept=".json,application/json" hidden><input type="file" id="traitCatalogImport" accept=".json,application/json" hidden>');
 function candidateConfig(parsed){const config=clone(state().config);for(const key of ['jobs','backgrounds'])for(const item of parsed.requiredProfiles?.[key]??[])if(!config[key].some(current=>current.id===item.id))config[key].push(clone(item));return config;}
 function validateCandidate(character,config=state().config){validateState({schema:SCHEMA,config,character:clone(character),snapshots:[]});}
 function loadJSON(data,fileName,standard=false){
  const parsed=parseCharacterJSON(data,fileName,state().config,traits);
  if(standard){
   parsed.character=applyStandardCase(parsed.character);
   parsed.document.sampleCase='isabella-standard-v1';
  }
  const config=candidateConfig(parsed);validateCandidate(parsed.character,config);state().config=config;state().character=parsed.character;state().characterFile=parsed.document;jsonPage=0;rawDraft='';api.save();api.renderAll();render();
  api.toast(standard?'이사벨라 원본과 검증용 표준 초기값을 불러왔습니다.':'캐릭터 JSON을 불러왔습니다. 원본 필드는 보존됩니다.');
 }
 $('#characterImport').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('파일은 5MB 이하여야 합니다.');const data=JSON.parse((await file.text()).replace(/^\uFEFF/,''));parseCharacterJSON(data,file.name,state().config,traits);api.confirmAction('캐릭터 JSON 불러오기','현재 편집 중인 캐릭터를 선택한 파일로 교체합니다. 계수와 보관함은 유지합니다.',()=>{loadJSON(data,file.name);go('character-json');});}catch(error){api.toast(error.message);}event.target.value='';};
 $('#traitCatalogImport').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('파일은 5MB 이하여야 합니다.');const data=JSON.parse((await file.text()).replace(/^\uFEFF/,'')),rows=normalizeTraitCatalogue(data);traits=rows;state().traitCatalogue={rows};traitPage=0;traitCategory='';api.save();render();api.toast(`열람표 ${rows.length}개를 연결했습니다. 캐릭터의 기존 조건값은 유지합니다.`);}catch(error){api.toast(error.message);}event.target.value='';};
 function rootPath(field){return [...(state().characterFile?.prefix??[]),field];}
 function syncTraitRaw(row,enabled){
  setTrait(c(),row,enabled);if(state().characterFile){const value=c().traitValues[row.binding.key];if(value===undefined)delete getPath(state().characterFile.working,state().characterFile.prefix??[])[`seed_${row.binding.key}`];else setPath(state().characterFile.working,rootPath('seed_'+row.binding.key),value);}
 }
 function selectedTraits(){return traits.filter(t=>traitMatches(t,c().traitValues??{}));}
 function renderProfile(){
  const holder=$('#simulator .column:first-child');if(!holder)return;
  const first=holder.querySelector('.card');first.querySelector('.json-profile-toolbar')?.remove();
  first.querySelector('.preset-strip').insertAdjacentHTML('beforebegin',`<div class="json-profile-toolbar"><div><span class="badge blue">캐릭터 JSON</span><span class="source-filename">${e(state().characterFile?.fileName??'파일 미선택')}</span></div><div class="toolbar-buttons">${button('↑ 캐릭터 불러오기','import-character')}${button('이사벨라 표준 케이스','sample-standard')}${button('JSON 값 편집 →','go-json')}</div></div>`);
  first.querySelector('.race-editor')?.remove();
  first.querySelector('.form-grid').insertAdjacentHTML('beforeend',`<div class="field full race-editor"><span>종족 · 자유 입력 태그</span><div class="race-tags">${(c().raceTags??[]).map((tag,i)=>`<span class="race-chip">${e(tag)}<button data-race-remove="${i}" aria-label="${e(tag)} 종족 태그 삭제">×</button></span>`).join('')}<input id="raceTagInput" aria-label="종족 태그 입력" placeholder="자유롭게 입력 후 Enter · 쉼표로 여러 개 추가" maxlength="400"></div><small>종족 목록과 숫자 코드는 없습니다. 입력한 태그를 그대로 JSON에 저장합니다.</small></div>`);
  first.querySelector('.seed-age-editor')?.remove();
  first.querySelector('.form-grid').insertAdjacentHTML('beforeend',`<label class="field seed-age-editor"><span>시드에이지 · seed_age</span><select id="characterSeedAge" aria-label="캐릭터 시드에이지"><option value="" ${c().seedAge===null?'selected':''}>미지정</option>${AGE_CODES.map(code=>`<option value="${code}" ${c().seedAge===code?'selected':''}>${code} · ${['young','loli','milf'][code]}</option>`).join('')}</select><small>원본 연령 유형 코드입니다. 배경 선택 조건에 사용합니다.</small></label>`);
  const memo=first.querySelector('[data-path="character.note"]');memo.parentElement.querySelector('small').textContent='직업·생활 배경을 바꾸면 어울리는 게임 원문을 자동으로 불러옵니다. 직접 편집도 가능합니다.';
  first.querySelector('.memo-actions')?.remove();memo.parentElement.insertAdjacentHTML('beforeend',`<div class="memo-actions">${button('배경 검색·이동','go-backgrounds')}${button('선택 조건으로 불러오기','auto-background')}${button('이전 메모 복원','restore-memo')}</div>`);
  first.querySelector('.selected-traits-panel')?.remove();
  first.querySelector('.tag-list').insertAdjacentHTML('afterend',`<div class="selected-traits-panel"><div class="section-label">선택 특성 ${selectedTraits().length}개</div><div class="tag-list">${selectedTraits().slice(0,12).map(row=>`<button class="tag" data-trait-remove="${e(row.id)}" title="${e(row.description)}">${e(row.name)} ×</button>`).join('')||'<span class="fine-print">선택된 특성이 없습니다.</span>'}</div>${button('열람표에서 특성 추가·삭제 →','go-traits')}</div>`);
  for(const name of ['lesbian','oralAddiction','analAddiction'])first.querySelector(`[data-path="character.flags.${name}"]`).closest('label').hidden=true;
  const desire=first.querySelector('[data-path="character.desire"]');desire.disabled=true;desire.parentElement.querySelector('small').textContent='색정광·정액중독 선택에 따라 자동 반영됩니다. 확정 초기값은 유지합니다.';
 }
 function renderResultExtras(){
  const holder=$('#resultBody');if(!holder)return;holder.querySelector('.distribution-editor')?.remove();holder.querySelector('.applied-background-modifiers')?.remove();
  const result=estimate(c(),state().config);
  if(result.backgroundModifiers.active)holder.insertAdjacentHTML('beforeend',`<div class="applied-background-modifiers"><span>적용 중인 원문 배경 보정</span><b>성경험 ×${multiplier(result.backgroundModifiers.factors.intimacy)}</b><small>${result.backgroundModifiers.parts.map(part=>`${bgKindNames[part.kind]} ${e(part.id)}`).join(' / ')}</small></div>`);
  holder.insertAdjacentHTML('beforeend',`<details class="distribution-editor"><summary>상세 초기값 직접 지정 <span class="badge muted">${result.distributionSource==='record'?'확정 기록':result.distributionSource==='manual'?'직접 지정':'추정'}</span></summary><div class="table-wrap"><table><thead><tr><th>유형</th><th>인간 이성</th><th>인간 동성</th><th>인간 외</th></tr></thead><tbody>${['질','구강','애널','미분류'].map((label,i)=>`<tr><td>${label}</td>${result.matrix[i].map((v,j)=>`<td><input type="number" min="0" max="1000000000" step="1" value="${v}" data-history-cell="${i}:${j}" aria-label="${label} ${['인간 이성','인간 동성','인간 외'][j]} 초기값"></td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="fine-print">수정한 셀과 총횟수를 함께 저장합니다. 고정된 초기값은 스킬·특성 변경으로 덮어쓰지 않습니다.</p>${button('분포 자동 계산으로 돌리기','release-distribution')}</details>`);
 }
 function renderJSON(){
  const doc=state().characterFile,raw=orderCharacterJSON(doc?.working??{},doc?.original,doc?.prefix??[]),all=primitiveFields(raw).map(f=>({...f,info:describeCharacterField(f.path,f.value,traits)})),q=jsonQuery.toLocaleLowerCase(),fields=all.filter(x=>[x.key,String(x.value),x.info.label,x.info.description,x.info.hint].join(' ').toLocaleLowerCase().includes(q));
  const pageCount=Math.max(1,Math.ceil(fields.length/20));jsonPage=Math.min(jsonPage,pageCount-1);
  $('#character-json').innerHTML=`<div class="toolbar"><p>원본 필드는 보존하며, 수정본에는 종족 태그와 통계 초기값 블록을 함께 저장합니다.</p>${button('↑ 캐릭터 JSON','import-character')}${button('이사벨라 원본','sample-original')}${button('표준 케이스 불러오기','sample-standard')}${button('↓ 초기값 포함 캐릭터 JSON','export-source','primary')}</div>
  <div class="notice neutral"><span>ⓘ</span><div><strong>${e(c().name)}</strong> · ${e(doc?.fileName??'새 캐릭터')} · 원본 ${all.length}개 값<br>유니크 초기값은 <code>jo9_initial_history</code>, 종족 태그는 <code>jo9_race_tags</code>로 저장합니다. 게임이 이 신규 블록을 읽는 부분은 별도 연결 대상입니다.</div></div>
  <div class="json-summary-grid"><article class="card"><div class="card-head"><h2>연결된 스킬</h2></div><div class="card-body"><div class="linked-skills">${Object.entries(c().skills).map(([k,v])=>`<span><code>${k}</code><b>${['F','D','C','B','A','S'][v]}</b></span>`).join('')}</div><div class="memo-actions">${button('스킬·초기값 조정 →','go-simulator')}${button('표준 결과로 확정 보관','save-standard')}</div></div></article><article class="card"><div class="card-head"><h2>초기값 우선순위</h2></div><div class="card-body prose"><p>JSON에 지정한 <strong>0을 포함한 초기값</strong>을 먼저 사용합니다. 값이 없으면 자동 추정하고, 미상은 null로 보존합니다.</p><p>추정으로 만든 초기값도 내보낸 뒤 다시 불러오면 당시 수치로 고정됩니다. 원본 배경·외형 경로 등 다른 필드는 함께 보존합니다.</p></div></article></div>
  <article class="card"><div class="card-head"><h2>원본 → 편집값</h2><input id="jsonFieldSearch" type="search" value="${e(jsonQuery)}" placeholder="필드명·해설·값 검색" aria-label="JSON 필드 검색"></div><div class="json-order-note">보내준 기본 JSON 순서로 표시합니다. 나머지 필드는 불러온 원본 순서, 새 필드는 그 뒤에 표시합니다. 해설은 편집 화면의 주석이며, 내보내는 JSON은 유효한 형식을 유지합니다.</div><div class="table-wrap"><table class="raw-fields"><thead><tr><th>필드</th><th>해설</th><th>원본 값</th><th>편집값</th></tr></thead><tbody>${fields.slice(jsonPage*20,jsonPage*20+20).map(field=>{
   const old=getPath(doc?.original,field.path),path=e(encodeURIComponent(JSON.stringify(field.path)));
   return `<tr><td><code>${e(field.key)}</code><span class="row-kind">${field.type}</span></td><td class="field-explanation"><strong>${e(field.info.label)}</strong><p>${e(field.info.description)}</p>${field.info.hint?`<small>${e(field.info.hint)}</small>`:''}${!field.info.confirmed?'<span class="field-unconfirmed">용도 확인 필요</span>':''}</td><td class="original-value">${e(old===undefined?'미지정':old===null?'null':String(old))}</td><td>${field.type==='boolean'?`<select data-json-value="${path}" data-type="boolean" aria-label="${e(field.key)} 편집값"><option value="true" ${field.value?'selected':''}>true</option><option value="false" ${!field.value?'selected':''}>false</option></select>`:field.type==='number'?`<input type="number" step="any" data-json-value="${path}" data-type="number" value="${field.value}" aria-label="${e(field.key)} 편집값">`:`<textarea data-json-value="${path}" data-type="${field.type}" aria-label="${e(field.key)} 편집값">${e(field.value??'null')}</textarea>`}</td></tr>`;
  }).join('')||'<tr><td colspan="4">표시할 원본 필드가 없습니다. 캐릭터 JSON을 불러오거나 새 JSON 편집기를 사용하세요.</td></tr>'}</tbody></table></div><div class="pager">${button('← 이전','json-prev')}<span>${jsonPage+1} / ${pageCount} · ${fields.length}개 값</span>${button('다음 →','json-next')}</div></article>
  <article class="card raw-json-card"><div class="card-head"><h2>JSON 전체 편집·필드 추가</h2>${button('전체 편집 내용 반영','apply-raw-json')}</div><div class="card-body"><textarea id="rawJsonEditor" spellcheck="false" aria-label="캐릭터 JSON 전체 편집">${e(rawDraft||JSON.stringify(raw,null,2))}</textarea><div class="memo-actions">${button('현재 초기값 블록까지 편집기에 채우기','fill-composed-json')}${button('원본으로 되돌리기','restore-source')}</div><p class="fine-print">잘못된 형식은 반영하지 않습니다. 다운로드는 로컬 원본 파일을 덮어쓰지 않습니다.</p></div></article>`;
 }
 function bgFilters(){return {world:bgWorld,family:bgFamily,occupation:bgOccupation};}
 function rememberBackground(){state().backgroundBrowser={...bgFilters(),query:bgQuery,profile:bgJob,page:bgPage};browserStateRef=state().backgroundBrowser;api.save();}
 function syncBackgroundBrowser(){if(state().backgroundBrowser===browserStateRef)return;browserStateRef=state().backgroundBrowser;const saved=browserStateRef??{};bgQuery=String(saved.query??'').slice(0,200);bgWorld=String(saved.world??'');bgFamily=String(saved.family??'');bgOccupation=String(saved.occupation??'');bgJob=Boolean(saved.profile);bgPage=Number.isSafeInteger(saved.page)?Math.max(0,saved.page):0;}
 function previewCases(){const rows=allCases();return agePreview==='all'?rows:rows.filter(item=>backgroundAgeAllows(state().config,item,agePreview==='character'?c().seedAge:Number(agePreview)));}
 function bgRows(){return findBackgrounds(previewCases(),{query:bgQuery,...bgFilters(),...(bgJob?{job:c().job,background:c().background}:{})});}
 function browserData(){const rows=bgRows();bgPage=Math.max(0,Math.min(bgPage,rows.length-1));return {rows,item:rows[bgPage]};}
 function modifierSummary(item){
  if(!item)return '<p>조건에 맞는 조합이 없습니다. 고정 조건을 풀거나 검색어를 바꿔보세요.</p>';
  const selection={world:item.world.id,variant:item.world.variant,family:item.family.id,occupation:item.occupation.id},resolved=resolveBackgroundModifiers(state().config,selection);
  return `<div class="modifier-products">${[['intimacy','성경험']].map(([key,label])=>`<div><span>${label} 최종 배수</span><strong>× ${multiplier(resolved.factors[key])}</strong><small>${resolved.parts.map(part=>`${bgKindNames[part.kind]} ${multiplier(part[key])}`).join(' × ')}</small></div>`).join('')}</div><div class="resolved-ranges">${RANGE_KEYS.map(key=>{const range=resolved.ranges[key];return `<span><b>${rangeNames[key]}</b> ${range?`${n(range.min)} ~ ${n(range.max)} <small>${bgKindNames[range.kind]} 기준</small>`:'미지정 · 미상'}</span>`;}).join('')}</div><p class="fine-print">범위는 직업경력 → 출신 → 세계 순으로, 지정된 첫 범위를 사용합니다. 0~0도 지정된 범위입니다. 특별한 과거 임신·출산 이력만 지정합니다. 알려진 기록과 저장된 초기값을 우선하며, 범위 추정은 같은 ID·시드에서 유지됩니다.</p>`;
 }
 function modifierControls(kind,record){
  const mod=getModifier(state().config,kind,record.id),attrs=`data-bg-kind="${kind}" data-bg-id="${e(record.id)}"`;
  return `<aside class="story-modifiers"><div class="section-label">성경험 보정 배수</div>${[['intimacy','성경험']].map(([key,label])=>`<label class="modifier-field"><span>${label} ×</span><input type="number" min="0" max="20" step="any" value="${mod[key]}" ${attrs} data-bg-factor="${key}" aria-label="${bgKindNames[kind]} ${label} 배수"></label>`).join('')}<p class="fine-print">기본 1 · 같은 ${bgKindNames[kind]} ID에 공통 적용</p></aside><aside class="story-ranges"><div class="section-label">과거 임신·출산 범위</div>${RANGE_KEYS.map(key=>{const range=mod.ranges[key];return `<div class="range-row"><label class="range-enable"><input type="checkbox" ${attrs} data-bg-range-toggle="${key}" ${range?'checked':''} aria-label="${bgKindNames[kind]} ${rangeNames[key]} 범위 사용">${rangeNames[key]}</label><div class="range-inputs"><input type="number" min="0" max="1000000000" step="1" value="${range?.min??''}" ${range?'':'disabled'} ${attrs} data-bg-range="${key}" data-bound="min" aria-label="${bgKindNames[kind]} ${rangeNames[key]} 최솟값"><span>~</span><input type="number" min="0" max="1000000000" step="1" value="${range?.max??''}" ${range?'':'disabled'} ${attrs} data-bg-range="${key}" data-bound="max" aria-label="${bgKindNames[kind]} ${rangeNames[key]} 최댓값"></div></div>`;}).join('')}<small class="fine-print">특별한 과거 이력만 지정 · 미지정은 미상</small></aside>`;
 }
 function ageControls(kind,record){
  const rule=getAgeRule(state().config,kind,record.id);
  return ['required','rejected'].map(key=>`<aside class="story-age"><div class="section-label">시드에이지 ${key==='required'?'필수':'거부'}</div><div class="age-checks">${AGE_CODES.map(code=>`<label><input type="checkbox" data-bg-age="${key}" data-age-code="${code}" data-bg-kind="${kind}" data-bg-id="${e(record.id)}" ${rule[key].includes(code)?'checked':''} aria-label="${bgKindNames[kind]} 시드에이지 ${key==='required'?'필수':'거부'} ${code}">${code}</label>`).join('')}</div><small>${key==='required'?'미선택: 제한 없음 / 여러 개: 그중 하나':'선택한 코드 제외'}</small>${key==='rejected'&&record.adultOnly?'<small>성인 경력 원고 · 코드 1 제외</small>':''}</aside>`).join('');
 }
 function settingsUpdate(update,refresh=true){
  const next=clone(state().config);validateBackgroundSettings(next);update(next.backgroundSettings);validateBackgroundSettings(next);state().config=next;api.save();if(refresh){renderBackgrounds();api.renderResult();}
 }
 function occupationFamilyControls(world,occupation){
  const rule=getOccupationFamilyRule(state().config,world.id,occupation.id),key=`${world.id}:${occupation.id}`;
  const legacy=Object.entries(state().config.backgroundSettings?.links?.occupations??{}).filter(([id])=>id.startsWith(world.id+':'));
  return `<details class="occupation-family-conditions" ${familyConditionsOpen?'open':''}><summary><strong>${e(occupation.label)} · 출신 조건 (선택)</strong></summary><p class="fine-print">기본은 모든 출신 허용입니다. 특정 출신이 필요한 직업만 제한하세요. 현재 편집 중인 출신 선택과는 별개로 적용합니다.</p><label class="tag"><input type="checkbox" data-job-family-mode="${e(key)}" ${rule.required!==null?'checked':''} aria-label="이 직업의 출신 필수 조건 사용">지정한 출신만 허용</label><div class="family-condition-head"><span>출신</span><span>필수 후보</span><span>거부</span></div><div class="family-condition-list">${records('family').map(r=>`<div><span>${e(r.label)} <code>${e(r.id)}</code></span>${['required','rejected'].map(kind=>`<label><input type="checkbox" data-job-family-rule="${kind}" data-rule-key="${e(key)}" data-family-id="${e(r.id)}" ${kind==='required'&&rule.required===null?'disabled':''} ${(rule[kind]??[]).includes(r.id)?'checked':''} aria-label="직업 출신 ${kind==='required'?'필수':'거부'} ${e(r.label)}">${kind==='required'?'허용':'거부'}</label>`).join('')}</div>`).join('')}</div><p class="fine-print">필수 후보는 선택한 출신 중 하나를 허용합니다. 필수 조건을 켜고 아무것도 선택하지 않으면 가능한 출신이 없습니다. 거부는 체크한 출신을 제외합니다.</p><button class="button secondary" data-work-action="background-links-reset" data-link-group="occupationFamilies">이 직업의 출신 조건 초기화</button></details>${legacy.length?`<details class="legacy-background-links"><summary>이전 출신별 직업 설정 ${legacy.length}개 보관</summary><p class="fine-print">이전 목록은 시대 직업의 기본 목록을 만드는 데 합쳐 사용합니다. 출신별 제한으로 자동 적용하지 않습니다. 직접 지정한 시대 직업 목록이 우선합니다.</p>${legacy.map(([id,jobs])=>`<p><code>${e(id)}</code> · ${e(jobs.join(', ')||'빈 목록')}</p>`).join('')}</details>`:''}`;
 }
 function renderBackgroundEditor(){
  const world=editorRecord('world'),family=editorRecord('family'),occupation=editorRecord('occupation');
  const families=worldFamilies(bgData,state().config,world.id),jobs=worldOccupations(bgData,state().config,world.id);
  const choice=(kind,selected)=>`<label class="field"><span>편집할 ${bgKindNames[kind]}</span><select data-bg-editor-select="${kind}" aria-label="편집할 ${bgKindNames[kind]}">${kind==='family'?`<option value="" ${!selected?'selected':''}>출신 선택 안 함</option>`:''}${records(kind).map(r=>{const key=kind==='world'?textKey(r):r.id;return `<option value="${e(key)}" ${key===selected?'selected':''}>${r.draft?'[추가] ':''}${e(r.label)} · ${e(key)}</option>`;}).join('')}</select></label>`;
  return `<details class="card background-editor" id="backgroundContentEditor" ${editorOpen?'open':''}><summary><strong>대사·연결·연령 조건 편집</strong><span class="badge">추가 설정 11개</span></summary><div class="card-body"><p class="fine-print">검수 연결은 세계의 기술·제도와 직업별 출신 조건을 함께 사용합니다. 기존 설정을 바꾸려면 위의 검수 연결 적용을 누르세요. 이후에는 아래에서 개별 조정할 수 있습니다. 아래에서 모든 연결·대사·조건을 조정하면 자동 저장되며 전체 설정 JSON에 포함됩니다.</p><div class="background-filter-grid">${choice('world',editWorld)}${choice('family',editFamily)}${choice('occupation',editOccupation)}</div></div><div class="background-column-head"><span>대사 · 직접 편집</span><span>성경험 배수</span><span>과거 임신·출산 범위</span><span>시드에이지 필수</span><span>시드에이지 거부</span></div>${[world,family,occupation].filter(Boolean).map(record=>{const kind=record.kind;return `<section class="story-browser-row"><div class="story-original"><div class="section-label">${bgKindNames[kind]} · ${e(record.label)} ${record.draft?'<span class="badge">추가 설정</span>':''}</div><textarea data-bg-text="${kind}" data-text-key="${e(textKey(record))}" aria-label="${bgKindNames[kind]} 대사 편집" maxlength="4000">${e(editedBackgroundText(state().config,record))}</textarea><div class="memo-actions"><button class="button secondary" data-work-action="background-text-reset" data-bg-kind="${kind}" data-text-key="${e(textKey(record))}">기본 대사로 복원</button>${record.suggestedAgeRule?`<button class="button secondary" data-work-action="background-age-suggest" data-bg-kind="${kind}" data-bg-id="${e(record.id)}">초안 연령 조건 적용</button>`:''}</div><details class="original-reference"><summary>기본 대사 보기</summary><p>${e(record.text)}</p></details></div>${modifierControls(kind,record)}${ageControls(kind,record)}</section>`;}).join('')}<div class="card-body"><div class="background-link-panels"><details open><summary><strong>${e(world.label)} → 출신 연결</strong> · ${families.length}개</summary><div class="link-list">${records('family').map(r=>`<label><input type="checkbox" data-bg-link="family" data-link-id="${e(r.id)}" ${families.includes(r.id)?'checked':''} aria-label="출신 연결 ${e(r.label)}">${r.draft?'[추가] ':''}${e(r.label)} <code>${e(r.id)}</code></label>`).join('')}</div><button class="button secondary" data-work-action="background-links-reset" data-link-group="worldFamilies">이 세계의 기본 출신 연결 복원</button></details><details open><summary><strong>${e(world.label)} → 이 시대의 직업 연결</strong> · ${jobs.length}개</summary><p class="fine-print">이 시대에 공통으로 적용합니다. 출신을 선택하거나 연결하지 않아도 직업 목록을 저장할 수 있습니다.</p><div class="link-list">${records('occupation').map(r=>`<label><input type="checkbox" data-bg-link="occupation" data-link-id="${e(r.id)}" ${jobs.includes(r.id)?'checked':''} aria-label="직업 연결 ${e(r.label)}">${r.draft?'[추가] ':''}${e(r.label)} <code>${e(r.id)}</code></label>`).join('')}</div><button class="button secondary" data-work-action="background-links-reset" data-link-group="worldOccupations">이 시대의 기본 직업 목록 복원</button></details></div>${occupationFamilyControls(world,occupation)}<p class="fine-print">필수 0·1을 체크하면 0 또는 1을 허용합니다. 세계·출신·직업의 허용 연령은 모두 만족해야 하며, 같은 항목의 필수·거부 중복은 저장하지 않습니다. 연령 조건은 세계의 문장 변형끼리 공유하고, 대사는 변형별로 수정합니다.</p></div></details>`;
 }
 function captureBackgroundView(){
  // Replacing the background subtree must keep the editor's scroll and keyboard position.
  const root=$('#backgrounds');if(root.hidden)return ()=>{};
  const x=window.scrollX,y=window.scrollY,active=root.contains(document.activeElement)?document.activeElement:null;
  const selector=active?[...active.attributes].filter(a=>a.name==='id'||a.name==='aria-label'||a.name.startsWith('data-')).map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join(''):'';
  const inEditor=Boolean(active?.closest('#backgroundContentEditor')),rect=active?.getBoundingClientRect(),anchored=rect&&rect.top>=0&&rect.bottom<=window.innerHeight;
  const lists=[...root.querySelectorAll('.link-list,.family-condition-list')].map(el=>({top:el.scrollTop,left:el.scrollLeft}));
  const panels=[...root.querySelectorAll('.background-link-panels>details')].map(el=>el.open);
  return ()=>{
   root.querySelectorAll('.background-link-panels>details').forEach((el,i)=>{if(i<panels.length)el.open=panels[i];});
   root.querySelectorAll('.link-list,.family-condition-list').forEach((el,i)=>{if(lists[i]){el.scrollTop=lists[i].top;el.scrollLeft=lists[i].left;}});
   const scope=inEditor?root.querySelector('#backgroundContentEditor'):root,next=selector?scope?.querySelector(selector):null;
   next?.focus({preventScroll:true});
   const top=anchored&&next?window.scrollY+next.getBoundingClientRect().top-rect.top:y;
   window.scrollTo({left:x,top,behavior:'instant'});
  };
 }
 function renderBackgrounds(){
  const restoreView=captureBackgroundView();
  const {rows,item}=browserData(),filters=bgFilters(),cases=allCases(),categories=backgroundCategories(previewCases(),filters);
  $('#backgrounds').innerHTML=`<div class="notice neutral"><span>▧</span><div>세계 <strong>${categories.world.length}종</strong>·출신 <strong>${categories.family.length}종</strong>·직업경력 <strong>${categories.occupation.length}종</strong>을 각각 고정할 수 있습니다. 현재 시대·출신·직업 연결로 만든 ${n(cases.length)}개 조합을 탐색하세요. 명칭과 기본 대사는 2026.11.12 회상형 개정본입니다. 기존에 저장한 대사가 우선하며, 전체 개정 대사는 제공된 설정 JSON을 불러오면 적용됩니다. 연결은 아래 편집기에서 조정하세요. 같은 세계의 문장 변형은 보정·연령 조건을 공유합니다.</div></div>
  <div class="background-searchbar"><input id="backgroundSearch" type="search" maxlength="200" value="${e(bgQuery)}" placeholder="세계·출신·직업·본문 검색" aria-label="배경 설정 검색">${button('대사·연결 편집','background-open-editor','primary')}${button('검수 연결 적용','background-apply-connections')}${button('전체 조합 보정 CSV','background-export-csv')}<select id="backgroundAgePreview" aria-label="배경 연령 미리보기"><option value="all" ${agePreview==='all'?'selected':''}>모든 연령 · 검수</option><option value="character" ${agePreview==='character'?'selected':''}>현재 캐릭터 연령</option>${AGE_CODES.map(code=>`<option value="${code}" ${agePreview===String(code)?'selected':''}>seed_age ${code}</option>`).join('')}</select></div>
  <div class="background-filter-grid">${BACKGROUND_KINDS.map(kind=>`<label class="field"><span>${bgKindNames[kind]} ${filters[kind]?'· 고정 중':''}</span><select data-bg-filter="${kind}" aria-label="배경 ${bgKindNames[kind]} 필터"><option value="">모든 ${bgKindNames[kind]}</option>${categories[kind].map(row=>`<option value="${e(row.id)}" ${filters[kind]===row.id?'selected':''} ${row.count===0&&filters[kind]!==row.id?'disabled':''}>${e(row.label)} · ${e(row.id)} (${n(row.count)})</option>`).join('')}</select></label>`).join('')}</div>
  <div class="toolbar"><label class="tag"><input id="backgroundUseProfile" type="checkbox" ${bgJob?'checked':''}> 현재 직업·생활 배경에 맞추기</label>${button('조건 초기화·전체 보기','background-all')}<span class="fine-print">선택한 항목은 고정됩니다. 한 개 또는 두 개만 고정해도 됩니다.</span></div>
  <article class="card"><div class="card-head"><h2>${item?e(item.title):'검색 결과 없음'}</h2><span class="badge muted">${rows.length?bgPage+1:0} / ${n(rows.length)}</span></div><div class="background-column-head"><span>대사 · 직접 편집 / 고정 조건</span><span>성경험 배수</span><span>과거 임신·출산 범위</span><span>시드에이지 필수</span><span>시드에이지 거부</span></div><div class="story-browser-rows">${item?BACKGROUND_KINDS.map(kind=>`<section class="story-browser-row"><div class="story-original"><div class="story-row-title"><div class="section-label">${bgKindNames[kind]} · ${e(item[kind].id)} <span class="source-line">${e(item[kind].source)}</span></div><label class="pin-toggle"><input type="checkbox" data-bg-pin="${kind}" data-bg-id="${e(item[kind].id)}" ${filters[kind]===item[kind].id?'checked':''} aria-label="현재 ${bgKindNames[kind]} 고정">고정</label></div><textarea class="story-inline-text" data-bg-text="${kind}" data-text-key="${e(textKey(item[kind]))}" aria-label="현재 ${bgKindNames[kind]} 대사 직접 편집" maxlength="4000" required>${e(item[kind].text)}</textarea><small class="fine-print">입력하면 자동 저장 · 같은 항목의 모든 조합에 적용 · {이름}은 이름 자리표시자</small></div>${modifierControls(kind,item[kind])}${ageControls(kind,item[kind])}</section>`).join(''):'<p class="empty-state">검색어 또는 고정 조건을 바꿔보세요. 다른 조건을 자동으로 해제하지 않습니다.</p>'}</div>
  <div class="background-modifier-summary" id="bgModifierSummary">${modifierSummary(item)}<p class="fine-print">조합 허용 seed_age: ${item?(allowedBackgroundAges(state().config,item).join(' · ')||'없음 · 조건 충돌'):'—'} / 현재 캐릭터: ${c().seedAge??'미지정'}</p></div><div class="pager">${button('⇤ 처음','background-first')}${button('← 이전','background-prev')}<label class="page-jump">번호<input type="number" id="backgroundJump" min="1" max="${Math.max(1,rows.length)}" value="${rows.length?bgPage+1:1}" aria-label="배경 번호로 이동"></label>${button('다음 →','background-next')}${button('마지막 ⇥','background-last')}</div><div class="card-body" style="padding-top:0"><div class="memo-actions">${button('무작위 선택','background-random')}${button('이 배경을 메모에 불러오기','background-use','primary')}${button('이 조합 대사 편집','background-edit-current')}${button('메모·초기값으로 돌아가기','go-simulator')}</div><p class="fine-print">배경을 불러오면 선택한 세계·출신·직업의 배수와 범위를 초기값 산출에 사용합니다. 원문 배경의 세 배수는 기존 큰 직업·생활 배경 배수와 중복 적용하지 않습니다. 초기값을 재추첨하려면 캐릭터 시드를 바꾸고 해당 항목을 자동으로 설정하세요.</p></div></article>
  <article class="card" style="margin-top:18px"><div class="card-head"><h2>선택 캐릭터의 현재 배경 메모</h2></div><div class="card-body"><textarea id="backgroundMemo" aria-label="배경 메모 직접 편집">${e(c().note)}</textarea>${button('편집한 메모 저장','save-background-memo')}</div></article>${renderBackgroundEditor()}`;
  restoreView();return {rows,item};
 }
 function updateModifier(kind,id,update){
  const next=clone(state().config);next.backgroundModifiers??={world:{},family:{},occupation:{}};next.backgroundModifiers[kind]??={};
  const mod=clone(getModifier(next,kind,id));update(mod);next.backgroundModifiers[kind][id]=mod;validateBackgroundModifiers(next);state().config=next;api.save();api.renderResult();const current=browserData();if($('#bgModifierSummary'))$('#bgModifierSummary').innerHTML=modifierSummary(current.item);
 }
 function exportBackgroundCSV(){
  const cell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
  const header=['조합ID','세계ID','세계','세계원문변형','출신ID','출신','직업ID','직업경력','성경험배수',...BACKGROUND_KINDS.flatMap(kind=>[bgKindNames[kind]+'연령필수',bgKindNames[kind]+'연령거부']),'조합허용연령','세계대사','출신대사','직업대사',...RANGE_KEYS.flatMap(key=>[rangeNames[key]+'최소',rangeNames[key]+'최대',rangeNames[key]+'범위출처'])];
  const values=allCases().map(item=>{const resolved=resolveBackgroundModifiers(state().config,{world:item.world.id,family:item.family.id,occupation:item.occupation.id});return [item.id,item.world.id,item.world.label,item.world.variant,item.family.id,item.family.label,item.occupation.id,item.occupation.label,resolved.factors.intimacy,...BACKGROUND_KINDS.flatMap(kind=>{const rule=getAgeRule(state().config,kind,item[kind].id);return [rule.required.join('|'),rule.rejected.join('|')];}),allowedBackgroundAges(state().config,item).join('|'),item.world.text,item.family.text,item.occupation.text,...RANGE_KEYS.flatMap(key=>{const range=resolved.ranges[key];return range?[range.min,range.max,`${range.kind}:${range.id}`]:['','','미상'];})];});
  api.download('\ufeff'+[header,...values].map(row=>row.map(cell).join(',')).join('\r\n'),'JO9_Background_Combination_Modifiers.csv','text/csv;charset=utf-8');
 }
 function renderTraits(){
  const q=traitQuery.toLocaleLowerCase();const rows=traits.filter(t=>(!traitCategory||t.category===traitCategory)&&(!traitSelectedOnly||traitMatches(t,c().traitValues??{}))&&[t.name,t.id,t.description,...(t.aliases??[])].join(' ').toLocaleLowerCase().includes(q));
  const max=Math.max(1,Math.ceil(rows.length/12));traitPage=Math.min(traitPage,max-1);
  $('#traits').innerHTML=`<div class="notice neutral"><span>✧</span><div><strong>특성·아이템 열람표의 특성 ${traits.length}개</strong>를 같은 이름·내부 조건값으로 연결했습니다. 선택 변경은 캐릭터 JSON과 관련 계산에 반영됩니다. 지정한 통계 초기값은 유지합니다.</div></div><div class="toolbar"><p>열람표 데이터를 갱신하려면 해당 도구의 traits.json을 불러오세요.</p>${button('↑ 열람표 JSON 갱신','import-trait-catalogue')}</div>
  <div class="toolbar trait-toolbar"><input id="traitSearch" type="search" value="${e(traitQuery)}" placeholder="특성명·설명·내부 ID 검색" aria-label="특성 검색"><select id="traitCategory" aria-label="특성 분류"><option value="">모든 분류</option>${[...new Set(traits.map(t=>t.category))].map(k=>`<option value="${e(k)}" ${k===traitCategory?'selected':''}>${e(k)}</option>`).join('')}</select><label class="tag"><input id="selectedTraitsOnly" type="checkbox" ${traitSelectedOnly?'checked':''}> 선택 특성만</label>${button('프로필로 돌아가기','go-simulator')}</div>
  <div class="selected-traits-bar"><strong>선택 ${selectedTraits().length}개</strong>${selectedTraits().map(t=>`<button class="race-chip" data-trait-remove="${e(t.id)}">${e(t.name)} ×</button>`).join('')}</div>
  <div class="trait-card-grid">${rows.slice(traitPage*12,traitPage*12+12).map(t=>`<article class="card trait-card ${traitMatches(t,c().traitValues??{})?'chosen':''}"><div class="trait-card-head"><h3>${e(t.name)}</h3><label class="tag"><input type="checkbox" data-trait-id="${e(t.id)}" ${traitMatches(t,c().traitValues??{})?'checked':''} ${t.binding?'':'disabled'} aria-label="${e(t.name)} 선택"> 선택</label></div><span class="badge muted">${e(t.category)}</span><code class="trait-code">${e(t.id)}</code><p>${e(t.description)}</p><div class="trait-effect">${effectLabel(t)}</div>${gameSeedNote(t)}</article>`).join('')||'<div class="empty-state">검색 결과가 없습니다.</div>'}</div><div class="pager">${button('← 이전','traits-prev')}<span>${traitPage+1} / ${max} · ${rows.length}개</span>${button('다음 →','traits-next')}</div>`;
 }
 function gameSeedNote(t){const key=t.binding?.key;return key&&gameSeedKeys.size&&!gameSeedKeys.has(key)?`<div class="warning">게임 미적용: 2.4.1 get_stock_seed가 seed_${e(key)}를 읽지 않아 캐릭터 JSON에 써도 게임 인물에는 반영되지 않습니다.</div>`:'';}
 function effectLabel(t){const key=t.binding?.key;
  return key==='homosexualism'?'자동 반영: 인간 동성 비중':key==='oral_affinity'?'자동 반영: 구강 상세 S 상당 보정':key==='anal_affinity'?'자동 반영: 애널 상세 S 상당 보정':key==='nymphomania'?'자동 반영: 초기 경력 성향 계수':'JSON 조건값에 반영 · 초기 통계 전용 계수는 미지정';
 }
 function render(){syncConnectionDefaults();syncBackgroundBrowser();renderProfile();renderResultExtras();renderJSON();renderBackgrounds();renderTraits();}
 function syncProfileView(){api.renderResult();renderProfile();renderJSON();renderTraits();}
 function onProfileChange(path){
  const doc=state().characterFile;
  if(doc){
   if(path==='character.name')setPath(doc.working,doc.mappings.name??rootPath('seed_name'),c().name);
   if(path.startsWith('character.skills.')){const key=path.split('.').at(-1),target=doc.mappings[key];if(target)setPath(doc.working,target,c().skills[key]);}
  }
  if(['character.job','character.background'].includes(path)){
   const found=autoBackground(c(),allCases(),state().config);if(found.selected){useBackground(c(),found.selected);if(doc)for(const[k,text]of Object.entries(c().storyText))setPath(doc.working,rootPath('seed_'+k+'_description'),text.replaceAll('\n','<br>'));const memo=$('[data-path="character.note"]');if(memo)memo.value=c().note;api.toast(found.relaxed?'직업에 맞는 게임 배경 원문을 불러왔습니다.':'직업·생활 배경에 맞는 게임 원문을 불러왔습니다.');}
  }
 }
 document.addEventListener('keydown',event=>{if(event.target.id==='raceTagInput'&&event.key==='Enter'){event.preventDefault();try{c().raceTags=normalizeRaceTags([...(c().raceTags??[]),...event.target.value.split(/[,，]/)]);api.save();renderProfile();$('#raceTagInput')?.focus();}catch(error){api.toast(error.message);}}});
 document.addEventListener('input',event=>{
  const id=event.target.id;
  if(event.target.dataset.bgText){const el=event.target;el.setCustomValidity('');if(!el.value.trim()){el.setCustomValidity('대사는 비워둘 수 없습니다.');return;}try{settingsUpdate(settings=>{settings.texts[el.dataset.bgText][el.dataset.textKey]=el.value;},false);}catch(error){el.setCustomValidity(error.message);}return;}
  if(id==='traitSearch'){traitQuery=event.target.value;traitPage=0;refreshSearch('traitSearch',renderTraits);}
  if(id==='backgroundSearch'){bgQuery=event.target.value;bgPage=0;refreshSearch('backgroundSearch',renderBackgrounds);rememberBackground();}
  if(id==='jsonFieldSearch'){jsonQuery=event.target.value;jsonPage=0;refreshSearch('jsonFieldSearch',renderJSON);}
  if(id==='rawJsonEditor')rawDraft=event.target.value;
  const el=event.target;
  if(el.dataset.bgFactor)el.setCustomValidity('');
  if(el.dataset.bgFactor&&el.value!==''&&el.checkValidity()){
   try{updateModifier(el.dataset.bgKind,el.dataset.bgId,mod=>{mod[el.dataset.bgFactor]=Number(el.value);});el.setCustomValidity('');}catch(error){el.setCustomValidity(error.message);}
  }
  if(el.dataset.bgRange){
   const pair=el.closest('.range-inputs'),minInput=pair.querySelector('[data-bound="min"]'),maxInput=pair.querySelector('[data-bound="max"]');minInput.setCustomValidity('');maxInput.setCustomValidity('');
   const min=Number(minInput.value),max=Number(maxInput.value);
   if(minInput.value!==''&&maxInput.value!==''&&minInput.checkValidity()&&maxInput.checkValidity()){
    if(min>max){el.setCustomValidity('최솟값은 최댓값 이하여야 합니다.');}
    else try{updateModifier(el.dataset.bgKind,el.dataset.bgId,mod=>{mod.ranges[el.dataset.bgRange]={min,max};});}catch(error){el.setCustomValidity(error.message);}
   }
  }
  if(el.dataset.jsonValue)el.setCustomValidity('');
  if(el.dataset.jsonValue&&el.dataset.type==='number'&&el.value!==''&&Number.isFinite(Number(el.value))){
   try{const path=JSON.parse(decodeURIComponent(el.dataset.jsonValue)),candidate=clone(state().characterFile.working);setPath(candidate,path,Number(el.value));applyRawEdit(candidate,path,false);}catch(error){el.setCustomValidity(error.message);}
  }else if(el.dataset.jsonValue&&el.dataset.type==='string'){
   try{const path=JSON.parse(decodeURIComponent(el.dataset.jsonValue)),candidate=clone(state().characterFile.working);setPath(candidate,path,el.value);applyRawEdit(candidate,path,false);}catch(error){el.setCustomValidity(error.message);}
  }
 });
 function refreshSearch(id,fn){const old=$('#'+id),pos=old.selectionStart;fn();const next=$('#'+id);next.focus();if(next.type!=='number')next.setSelectionRange(pos,pos);}
 document.addEventListener('toggle',event=>{if(event.target.id==='backgroundContentEditor'&&event.target.isConnected)editorOpen=event.target.open;if(event.target.classList?.contains('occupation-family-conditions')&&event.target.isConnected)familyConditionsOpen=event.target.open;},true);
 document.addEventListener('change',event=>{const el=event.target;try{
  if(el.dataset.bgText){if(!el.checkValidity())api.toast(el.validationMessage);else renderBackgrounds();return;}
  if(el.id==='characterSeedAge'){setCharacterSeedAge(c(),state().characterFile,el.value===''?null:Number(el.value));api.save();renderBackgrounds();return;}
  if(el.id==='backgroundAgePreview'){agePreview=el.value;bgPage=0;renderBackgrounds();return;}
  if(el.dataset.bgEditorSelect){if(el.dataset.bgEditorSelect==='world')editWorld=el.value;if(el.dataset.bgEditorSelect==='family')editFamily=el.value;if(el.dataset.bgEditorSelect==='occupation')editOccupation=el.value;editorOpen=true;renderBackgrounds();return;}
  if(el.dataset.bgAge){const kind=el.dataset.bgKind,id=el.dataset.bgId,key=el.dataset.bgAge,code=Number(el.dataset.ageCode);settingsUpdate(settings=>{const rule=getAgeRule(state().config,kind,id);rule[key]=el.checked?[...new Set([...rule[key],code])]:rule[key].filter(v=>v!==code);settings.ageRules[kind][id]=rule;});return;}
  if(el.dataset.bgLink){const world=editorRecord('world').id,id=el.dataset.linkId;settingsUpdate(settings=>{const group=el.dataset.bgLink==='family'?'worldFamilies':'worldOccupations',current=group==='worldFamilies'?worldFamilies(bgData,state().config,world):worldOccupations(bgData,state().config,world);settings.links[group][world]=el.checked?[...new Set([...current,id])]:current.filter(v=>v!==id);});return;}
  if(el.dataset.jobFamilyMode){settingsUpdate(settings=>{const rule=getOccupationFamilyRule(state().config,editorRecord('world').id,editorRecord('occupation').id);rule.required=el.checked?[]:null;settings.links.occupationFamilies[el.dataset.jobFamilyMode]=rule;});return;}
  if(el.dataset.jobFamilyRule){settingsUpdate(settings=>{const rule=getOccupationFamilyRule(state().config,editorRecord('world').id,editorRecord('occupation').id),kind=el.dataset.jobFamilyRule,id=el.dataset.familyId;rule[kind]=el.checked?[...new Set([...(rule[kind]??[]),id])]:(rule[kind]??[]).filter(v=>v!==id);settings.links.occupationFamilies[el.dataset.ruleKey]=rule;});return;}

  if(el.dataset.traitId){const row=traits.find(t=>t.id===el.dataset.traitId);syncTraitRaw(row,el.checked);api.save();syncProfileView();}
  if(el.id==='traitCategory'){traitCategory=el.value;traitPage=0;renderTraits();}
  if(el.id==='selectedTraitsOnly'){traitSelectedOnly=el.checked;traitPage=0;renderTraits();}
  if(el.dataset.bgFilter){const kind=el.dataset.bgFilter;if(kind==='world')bgWorld=el.value;if(kind==='family')bgFamily=el.value;if(kind==='occupation')bgOccupation=el.value;bgJob=false;bgPage=0;renderBackgrounds();rememberBackground();}
  if(el.dataset.bgPin){const value=el.checked?el.dataset.bgId:'';if(el.dataset.bgPin==='world')bgWorld=value;if(el.dataset.bgPin==='family')bgFamily=value;if(el.dataset.bgPin==='occupation')bgOccupation=value;bgJob=false;bgPage=0;renderBackgrounds();rememberBackground();}
  if(el.id==='backgroundUseProfile'){bgJob=el.checked;bgPage=0;renderBackgrounds();rememberBackground();}
  if(el.id==='backgroundJump'){bgPage=Math.max(0,Number(el.value)-1);renderBackgrounds();rememberBackground();}
  if(el.dataset.bgRangeToggle){updateModifier(el.dataset.bgKind,el.dataset.bgId,mod=>{mod.ranges[el.dataset.bgRangeToggle]=el.checked?{min:0,max:0}:null;});renderBackgrounds();}
  if(el.dataset.bgFactor||el.dataset.bgRange){if(el.value===''||!el.checkValidity())api.toast(el.validationMessage||'유효한 범위와 배수를 입력하세요.');}
  if(el.dataset.historyCell){if(!el.checkValidity()||el.value==='')throw new Error('상세 초기값은 0 이상 정수로 입력하세요.');const[i,j]=el.dataset.historyCell.split(':').map(Number),matrix=estimate(c(),state().config).matrix;matrix[i][j]=Number(el.value);c().fixedDistribution={matrix,source:'manual'};c().overrides.intimacy={mode:'manual',value:matrix.flat().reduce((a,b)=>a+b,0)};api.save();api.renderResult();}
  if(el.dataset.jsonValue){const path=JSON.parse(decodeURIComponent(el.dataset.jsonValue)),value=el.dataset.type==='number'?Number(el.value):el.dataset.type==='boolean'?el.value==='true':el.dataset.type==='null'&&el.value==='null'?null:el.value;if(el.dataset.type==='number'&&(el.value===''||!Number.isFinite(value)))throw new Error('유효한 숫자를 입력하세요.');
   const candidate=clone(state().characterFile.working);setPath(candidate,path,value);applyRawEdit(candidate,path);}
 }catch(error){api.toast(error.message);render();}});
 function applyRawEdit(candidate,path=null,refresh=true){
  const doc=state().characterFile,parsed=parseCharacterJSON(candidate,doc?.fileName??'character.json',state().config,traits,{freezeResult:!path||path[0]!=='character'}),old=c();
  if(path&&!path.includes('jo9_history_design')){
   const key=path.at(-1).replace(/^seed_/,''),affected=new Set(Object.entries(SKILL_ALIASES).filter(([k,a])=>a.includes(key)).map(([k])=>k));
   for(const[k,parts]of Object.entries(DERIVED))if(parts.includes(key))affected.add(k);
   if(affected.size){const live=clone(candidate),r=getPath(live,doc?.prefix??[]);if(r.jo9_history_design)delete r.jo9_history_design.skills;const reread=parseCharacterJSON(live,doc?.fileName??'character.json',state().config,traits);for(const k of affected)parsed.character.skills[k]=reread.character.skills[k];}
  }
  parsed.character=preserveRawEditCharacter(parsed.character,old,path,doc?.prefix??[],candidate.schema==='jo9-history-result/v1');
  const config=candidateConfig(parsed);validateCandidate(parsed.character,config);state().config=config;parsed.document.original=clone(doc?.original??candidate);state().character=parsed.character;state().characterFile=parsed.document;rawDraft='';api.save();api.renderSimulator();
  if(refresh){render();api.toast('JSON 편집값을 반영했습니다.');}
  else document.querySelectorAll('.linked-skills>span').forEach(el=>{const key=el.querySelector('code').textContent;el.querySelector('b').textContent=['F','D','C','B','A','S'][c().skills[key]];});
 }
 document.addEventListener('click',event=>{const el=event.target.closest('button');if(!el)return;try{
  if(el.dataset.tab&&['traits','backgrounds','character-json'].includes(el.dataset.tab))render();
  if(el.dataset.raceRemove!==undefined){c().raceTags.splice(Number(el.dataset.raceRemove),1);api.save();renderProfile();}
  if(el.dataset.traitRemove){const row=traits.find(t=>t.id===el.dataset.traitRemove);syncTraitRaw(row,false);api.save();syncProfileView();}
  const action=el.dataset.workAction;if(!action)return;
  if(action.startsWith('go-')){go(action.slice(3)==='json'?'character-json':action.slice(3));return;}
  switch(action){
   case'background-apply-connections':{const next=clone(state().config);applyCoherentConnections(next,bgData);validateBackgroundSettings(next);state().config=next;bgPage=0;api.save();renderBackgrounds();api.renderResult();api.toast('검수된 세계·출신·직업 연결을 적용했습니다. 대사·수치·연령 조건은 유지합니다.');break;}
   case'background-edit-current':{const {item}=browserData();if(item){editWorld=textKey(item.world);editFamily=item.family.id;editOccupation=item.occupation.id;editorOpen=true;renderBackgrounds();$('#backgroundContentEditor').scrollIntoView({block:'start',behavior:'smooth'});}break;}
   case'background-open-editor':editorOpen=true;renderBackgrounds();$('#backgroundContentEditor').scrollIntoView({block:'start',behavior:'smooth'});break;
   case'background-text-reset':api.confirmAction('기본 대사 복원','이 항목의 수정 대사를 개정된 기본 대사로 되돌립니다. 연결과 연령 조건은 유지합니다.',()=>settingsUpdate(settings=>{delete settings.texts[el.dataset.bgKind][el.dataset.textKey];}));break;
   case'background-age-suggest':{const record=records(el.dataset.bgKind).find(r=>r.id===el.dataset.bgId);if(record?.suggestedAgeRule)settingsUpdate(settings=>{settings.ageRules[record.kind][record.id]=clone(record.suggestedAgeRule);});break;}
   case'background-links-reset':api.confirmAction('기본 연결 복원','현재 목록 또는 출신 조건만 기본 연결로 복원합니다. 다른 항목의 조정값은 유지합니다.',()=>settingsUpdate(settings=>{const world=editorRecord('world').id,key=el.dataset.linkGroup==='occupationFamilies'?`${world}:${editorRecord('occupation').id}`:world;const value=backgroundConnectionDefault(state().config,bgData,el.dataset.linkGroup,key);if(value===undefined)delete settings.links[el.dataset.linkGroup][key];else settings.links[el.dataset.linkGroup][key]=value;}));break;

   case'import-character':$('#characterImport').click();break;
   case'import-trait-catalogue':$('#traitCatalogImport').click();break;
   case'sample-original':case'sample-standard':api.confirmAction('이사벨라 샘플 불러오기','현재 편집 캐릭터를 교체합니다. 원본 능력치·배경은 실제 JSON에서 읽으며, 표준 케이스의 통계 수치는 검증용 가정입니다.',()=>{loadJSON(sample,'2571_isabella.json',action==='sample-standard');});break;
   case'export-source':api.download(JSON.stringify(exportCharacterJSON(state()),null,2),state().characterFile?.fileName??`JO9_${c().id}.json`);api.toast('기존 필드·종족 태그·통계 초기값을 캐릭터 JSON으로 내보냈습니다.');break;
   case'save-standard':api.snapshot();if(state().snapshots[0])state().snapshots[0].characterFile=clone(state().characterFile??null);api.save();render();break;
   case'apply-raw-json':applyRawEdit(JSON.parse($('#rawJsonEditor').value));break;
   case'fill-composed-json':rawDraft=JSON.stringify(exportCharacterJSON(state()),null,2);renderJSON();break;
   case'restore-source':if(state().characterFile)api.confirmAction('원본 캐릭터 복원','불러왔던 최초 JSON의 값으로 돌아갑니다. 현재 편집값은 먼저 내보낼 수 있습니다.',()=>loadJSON(state().characterFile.original,state().characterFile.fileName));break;
   case'json-prev':jsonPage=Math.max(0,jsonPage-1);renderJSON();break;case'json-next':jsonPage++;renderJSON();break;
   case'traits-prev':traitPage=Math.max(0,traitPage-1);renderTraits();break;case'traits-next':traitPage++;renderTraits();break;
   case'auto-background':{const found=autoBackground(c(),allCases(),state().config);if(found.selected){useBackground(c(),found.selected);api.save();api.renderSimulator();render();api.toast('선택 조건에 맞는 배경을 불러왔습니다.');}else api.toast('현재 연령 조건에 맞는 배경이 없습니다. 조건이나 seed_age를 확인하세요.');break;}
   case'restore-memo':if(c().noteManualBackup){const current=c().note;c().note=c().noteManualBackup;c().noteManualBackup=current;api.save();api.renderSimulator();render();}else api.toast('복원할 이전 메모가 없습니다.');break;
   case'background-all':bgJob=false;bgQuery='';bgWorld='';bgFamily='';bgOccupation='';bgPage=0;renderBackgrounds();rememberBackground();break;
   case'background-first':bgPage=0;renderBackgrounds();rememberBackground();break;case'background-prev':bgPage=Math.max(0,bgPage-1);renderBackgrounds();rememberBackground();break;
   case'background-next':bgPage++;renderBackgrounds();rememberBackground();break;case'background-last':bgPage=Number.MAX_SAFE_INTEGER;renderBackgrounds();rememberBackground();break;
   case'background-random':{const data=renderBackgrounds();bgPage=Math.floor(Math.random()*data.rows.length);renderBackgrounds();rememberBackground();break;}
   case'background-export-csv':exportBackgroundCSV();break;
   case'background-use':{const data=renderBackgrounds();if(data.item){if(!backgroundAgeAllows(state().config,data.item,c().seedAge))throw new Error('현재 캐릭터의 seed_age가 이 조합의 조건과 맞지 않거나 미지정입니다. 프로필에서 확인하세요.');const mapped=Object.entries(JOB_MAP).find(([,ids])=>ids.includes(data.item.occupation.id));if(mapped&&state().config.jobs.some(p=>p.id===mapped[0]))c().job=mapped[0];useBackground(c(),data.item);api.save();api.renderSimulator();render();api.toast('선택한 배경과 연결 가능한 직업 분류를 반영했습니다.');}break;}
   case'save-background-memo':c().noteManualBackup=c().note;c().note=$('#backgroundMemo').value.slice(0,4000);api.save();api.renderSimulator();render();api.toast('배경 메모를 저장했습니다.');break;
   case'release-distribution':c().fixedDistribution=null;api.save();api.renderResult();break;
  }
 }catch(error){api.toast(error.message||'입력값을 확인하세요.');}});
 return {render,renderProfile,renderResultExtras,onProfileChange,traits,get cases(){return allCases();},loadJSON};
}
