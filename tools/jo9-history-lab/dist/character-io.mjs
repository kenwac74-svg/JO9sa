import {clone,defaultCharacter,estimate,GRADES,STAT_KEYS,OWNER_COUNT_KEYS,COMBAT_KEYS,COMBAT_TYPES,finite,validateState,SCHEMA} from './engine.mjs';
import {orderCharacterJSON} from './character-fields.mjs';
export const HISTORY_KEY='jo9_initial_history';
export const COUNT_KEYS=STAT_KEYS;
export function applyStandardCase(character){
 const c=clone(character);c.overrides={...Object.fromEntries(Object.entries(c.overrides??{}).filter(([key])=>!STAT_KEYS.includes(key))),births:{mode:'record',value:0}};
 // Preserve existing archived past and current owner records; do not invent combat history.
 c.noteManualBackup=c.note;c.note+='\n\n[통계 표준 케이스]\n전투 기록은 소속 이후 실제 누적값만 사용합니다. 영입 전 출산 0은 명시된 0의 보존을 검사하는 예시입니다. 영입 전 임신 횟수는 미상입니다. 소속 이후 가족 기록은 각각 0에서 시작합니다. 원작의 확정 이력으로 취급하지 않습니다.';return c;
}
export const SKILL_ALIASES={
 petting:['petting'],oral:['oral'],penetration:['penetration'],vaginal:['sub_vaginal','vaginal'],
 oralDetail:['sub_bj','sub_dt','oralDetail'],anal:['sub_anal','anal'],combat:['gladiatrix','combat'],
 cook:['cook'],alchemy:['enchanter','alchemy'],nurse:['nurse'],secretary:['secretary'],expression:['expression'],intellect:['intellect']
};
export const DERIVED={petting:['sub_hj','sub_fj','sub_hug','sub_paizuri'],oral:['sub_kiss','sub_tongue','sub_bj','sub_dt','sub_asslik'],penetration:['sub_vaginal','sub_anal','sub_fisting','anal_stretch']};
const forbidden=new Set(['__proto__','prototype','constructor']);
export function assertSafeJson(value,depth=0){
 if(depth>16)throw new Error('JSON 중첩 깊이는 16단계 이하여야 합니다.');
 if(value&&typeof value==='object')for(const[k,v]of Object.entries(value)){if(forbidden.has(k))throw new Error('지원하지 않는 JSON 키입니다.');assertSafeJson(v,depth+1);}
 if(typeof value==='number'&&!Number.isFinite(value))throw new Error('JSON 숫자에 유효하지 않은 값이 있습니다.');
}
export const toText=s=>String(s??'').replace(/<!--.*?-->/gs,'').replace(/<br\s*\/?>/gi,'\n').replace(/<<\$dynslave_name>>/g,'{이름}').replace(/<[^>]*>/g,'').trim();
export function normalizeRaceTags(value){
 const a=Array.isArray(value)?value:typeof value==='string'?value.split(/[,，\n]/):[];
 const out=[...new Set(a.map(x=>String(x).trim()).filter(Boolean))];
 if(out.length>20||out.some(x=>x.length>80))throw new Error('종족 태그는 최대 20개, 각 80자까지입니다.');return out;
}
export function parseCharacterJSON(data,fileName='character.json',config,traits=[],options={}){
 assertSafeJson(data);
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('캐릭터 JSON은 하나의 객체여야 합니다.');
 if(data.schema==='jo9-history-lab/v1')throw new Error('전체 설정 백업은 상단의 설정 불러오기를 이용하세요.');
 let c=defaultCharacter();const notes=[],mappings={};
 let prefix=[];
 if(data.schema==='jo9-history-result/v1'&&data.character){prefix=['character'];}
 else if(!Object.keys(data).some(k=>k.startsWith('seed_'))){for(const k of ['slave','stock','character'])if(data[k]&&typeof data[k]==='object'&&!Array.isArray(data[k])){prefix=[k];break;}}
 const root=prefix.reduce((o,k)=>o[k],data);
 const wrapper=data.schema==='jo9-history-result/v1';
 let checkedWrapper=null;
 if(wrapper){
  try{checkedWrapper=validateState({schema:SCHEMA,config:data.config,character:data.character,snapshots:data.result?[{id:'imported-result',label:'불러온 결과',savedAt:'2026-11-10T00:00:00.000Z',config:data.config,character:data.character,result:data.result}]:[]});}
  catch(error){throw new Error('결과 JSON의 캐릭터·저장 계수·확정 결과가 올바르지 않습니다: '+error.message);}
 }
 const find=(names)=>{
  for(const container of [[],['stats'],['skills']]){
   const o=container.reduce((a,k)=>a?.[k],root);if(!o||typeof o!=='object')continue;
   for(const k of names.flatMap(k=>['seed_'+k,k]))if(Object.hasOwn(o,k)&&typeof o[k]!=='object')return {value:o[k],path:[...prefix,...container,k]};
  }return null;
 };
 const grade=v=>{if(typeof v==='string'&&GRADES.includes(v.toUpperCase()))return GRADES.indexOf(v.toUpperCase());const n=Number(v);if(!Number.isInteger(n)||n<0||n>5)throw new Error('스킬 등급은 0–5 또는 F/D/C/B/A/S여야 합니다.');return n;};
 const name=find(['name']);c.name=String(name?.value??root.name??'불러온 캐릭터').slice(0,100);mappings.name=name?.path??null;
 const age=find(['age']);if(age&&((typeof age.value==='number'&&[0,1,2].includes(age.value))||(typeof age.value==='string'&&/^[012]$/.test(age.value)))){c.seedAge=Number(age.value);mappings.seedAge=age.path;}
 c.id=String(root.jo9_history_design?.character_id??root.id??fileName.match(/^0*(\d+)/)?.[1]??fileName.replace(/\.json$/i,'')).slice(0,100)||'imported-character';
 for(const[k,aliases]of Object.entries(SKILL_ALIASES)){
  let value=find(aliases);
  if(k==='oralDetail'){
   const candidates=['sub_bj','sub_dt','oralDetail'].map(a=>find([a])).filter(x=>x&&finite(Number(x.value),0,5));
   if(candidates.length)value=candidates.sort((a,b)=>Number(b.value)-Number(a.value))[0];
  }
  if(value&&(typeof value.value==='number'||(typeof value.value==='string'&&(/^-?\d+(?:\.\d+)?$/.test(value.value)||GRADES.includes(value.value.toUpperCase()))))){c.skills[k]=grade(value.value);mappings[k]=value.path;}
  else if(DERIVED[k]){const ds=DERIVED[k].map(x=>find([x]));c.skills[k]=Math.floor(ds.reduce((a,v)=>a+(v?grade(v.value):0),0)/ds.length);mappings[k]=null;notes.push(`${k}: 상세 기술 평균으로 상위 등급 산출`);}
  else {c.skills[k]=0;mappings[k]=null;notes.push(`${k}: 수치 없음 → F (0)`);}
 }
 const traitKeys=[...new Set(traits.map(t=>t.binding?.key).filter(Boolean))];
 for(const key of traitKeys){const f=find([key]);if(f&&typeof f.value==='number')c.traitValues[key]=f.value;}
 c.raceTags=normalizeRaceTags(root.jo9_race_tags??root.race_tags??root.species_tags??root.race??[]);
 c.storyText=Object.fromEntries(['world','family','occupation'].map(k=>[k,toText(root['seed_'+k+'_description']??root[k+'_description']??'')]));
 c.note=Object.entries(c.storyText).filter(([,v])=>v).map(([k,v])=>`[${{world:'세계',family:'출신',occupation:'직업'}[k]}]\n${v}`).join('\n\n').slice(0,4000);
 const design=root.jo9_history_design;
 if(design&&typeof design==='object'){
  if(config.jobs.some(p=>p.id===design.job))c.job=design.job;else c.job=config.jobs[0].id;
  if(config.backgrounds.some(p=>p.id===design.background))c.background=design.background;else c.background=config.backgrounds[0].id;
  if(typeof design.note==='string')c.note=design.note.slice(0,4000);
  if(typeof design.seed==='string')c.seed=design.seed.slice(0,100);
  if(finite(design.scale,0,10))c.scale=design.scale;
  for(const k of ['samePct','nonhumanPct'])if(design[k]===null||finite(design[k],0,100))c[k]=design[k];
  for(const k of Object.keys(c.flags))if(typeof design.flags?.[k]==='boolean')c.flags[k]=design.flags[k];
  if(['none','nymph','semen'].includes(design.desire))c.desire=design.desire;
  if(design.storySelection)c.storySelection=clone(design.storySelection);
  if(design.skills)for(const k of Object.keys(c.skills))if(Number.isInteger(design.skills[k])&&finite(design.skills[k],0,5))c.skills[k]=design.skills[k];
 }else {c.job=config.jobs[0].id;c.background=config.backgrounds[0].id;}
 // Read saved counts directly. A missing value is different from an explicit zero.
 const block=root[HISTORY_KEY]??root.initial_history??null;
 if(block){
  if(typeof block!=='object'||Array.isArray(block))throw new Error('통계 초기값 블록은 객체여야 합니다.');
  const values=block.values??block;
  for(const key of COUNT_KEYS){if(!Object.hasOwn(values,key))continue;const item=values[key];
   if(item===null||item?.source==='unknown')continue;
   const value=typeof item==='object'?item.value:item,source=typeof item==='object'?item.source:'record';
   if(!Number.isSafeInteger(value)||value<0||value>1e9)throw new Error(`${key}: 초기값은 0 이상의 정수여야 합니다.`);
   c.overrides[key]={mode:source==='estimate'?'fixed_estimate':source==='manual'?'manual':'record',value};
  }
  for(const key of ['combat','wins','losses','escapes','abortions','children'])if(Object.hasOwn(values,key))c.overrides[key]=clone(values[key]);
  if(block.distribution){const m=block.distribution.matrix;
   if(!Array.isArray(m)||m.length!==4||m.some(row=>!Array.isArray(row)||row.length!==3||row.some(v=>!Number.isSafeInteger(v)||v<0)))throw new Error('상세 분포는 4행 3열의 0 이상 정수입니다.');
   const sum=m.flat().reduce((a,b)=>a+b,0);
   if(c.overrides.intimacy&&c.overrides.intimacy.value!==sum)throw new Error('상세 분포 합계와 성적 경험 총횟수가 다릅니다.');
   if(!c.overrides.intimacy)c.overrides.intimacy={mode:'record',value:sum};
   c.fixedDistribution={matrix:clone(m),source:['estimate','record','manual'].includes(block.distribution.source)?block.distribution.source:'record'};
  }
  if(block.combat_categories!==undefined)c.combatGroups=clone(block.combat_categories);
 }
 if(!block?.combat_categories&&root.combatGroups&&typeof root.combatGroups==='object')c.combatGroups=clone(root.combatGroups);
 const owner=root.jo9_owner_history?.income??root.ownerIncome;
 if(owner){const value=typeof owner==='object'?owner.value:owner;if(!Number.isSafeInteger(value)||value<0||value>1e9)throw new Error('소속 이후 수익은 0 이상의 정수여야 합니다.');c.ownerIncome={mode:(owner.source??owner.mode)==='manual'?'manual':'record',value};}
 for(const key of OWNER_COUNT_KEYS){const item=root.jo9_owner_history?.[key]??root.ownerCounts?.[key];if(item===undefined)continue;const value=typeof item==='object'?item?.value:item;if(!Number.isSafeInteger(value)||!finite(value,0,1e9))throw new Error('소속 이후 가족 기록은 0 이상의 정수여야 합니다.');c.ownerCounts[key]={value,mode:(item?.source??item?.mode)==='manual'?'manual':'record'};}
 const ownerCombat=root.jo9_owner_history?.combat_categories??root.ownerCombatGroups;
 if(ownerCombat!==undefined){
  if(!ownerCombat||typeof ownerCombat!=='object'||Array.isArray(ownerCombat))throw new Error('소속 이후 전투 분류는 객체여야 합니다.');
  for(const {id} of COMBAT_TYPES){const group=ownerCombat[id];if(group===undefined)continue;if(!group||typeof group!=='object'||Array.isArray(group))throw new Error('소속 이후 전투 유형을 확인하세요.');
   for(const key of COMBAT_KEYS){const item=(group.values??group)[key];if(item===undefined)continue;const value=typeof item==='object'?item?.value:item,mode=typeof item==='object'?(item.source??item.mode??'record'):'record';if(!Number.isSafeInteger(value)||!finite(value,0,1e9)||!['record','manual'].includes(mode))throw new Error('소속 이후 전투 기록은 기록·직접 지정의 0 이상 정수여야 합니다.');c.ownerCombatGroups[id][key]={value,mode};}
  }
 }
 if(wrapper){
  const parsedCounts=c;
  c=clone(checkedWrapper.character);
  if(options.freezeResult===false){
   if(block){const values=block.values??block;for(const key of STAT_KEYS)if(Object.hasOwn(values,key)){if(parsedCounts.overrides[key])c.overrides[key]=clone(parsedCounts.overrides[key]);else delete c.overrides[key];}if(block.distribution)c.fixedDistribution=clone(parsedCounts.fixedDistribution);if(block.combat_categories)c.combatGroups=clone(parsedCounts.combatGroups);}
   if(root.jo9_owner_history){c.ownerIncome=clone(parsedCounts.ownerIncome);c.ownerCounts=clone(parsedCounts.ownerCounts);c.ownerCombatGroups=clone(parsedCounts.ownerCombatGroups);}
  }
  if(options.freezeResult!==false&&data.result){
   const frozen=checkedWrapper.snapshots[0].result;
   for(const key of ['combat','wins','losses','escapes','abortions','children'])if(Object.hasOwn(frozen.rows,key)&&!Object.hasOwn(c.overrides,key))c.overrides[key]=clone(frozen.rows[key]);
   const savedInput=row=>{
    if(!row||row.source==='unknown')return null;
    if(!Number.isSafeInteger(row.value)||!finite(row.value,0,1e9))throw new Error('결과 JSON의 확정 횟수는 0 이상의 정수여야 합니다.');
    return {mode:['estimate','fixed_estimate'].includes(row.source)?'fixed_estimate':row.source,value:row.value};
   };
   for(const key of STAT_KEYS){const input=savedInput(frozen.rows[key]);if(input)c.overrides[key]=input;else delete c.overrides[key];}
   if(frozen.combatGroups!==undefined&&c.combatGroups===null)c.combatGroups=clone(frozen.combatGroups);
   c.ownerCombatGroups=Object.fromEntries(COMBAT_TYPES.map(({id})=>[id,Object.fromEntries(COMBAT_KEYS.map(key=>{const row=frozen.owner.combatGroups[id][key];return [key,{value:row.value,mode:row.source}];}))]));
   if(frozen.rows.intimacy.source==='unknown')throw new Error('결과 JSON의 성적 경험 총횟수가 미상이어서 상세 분포를 복원할 수 없습니다.');
   if(frozen.matrix){if(frozen.matrix.flat().reduce((sum,value)=>sum+value,0)!==frozen.rows.intimacy.value)throw new Error('결과 JSON의 상세 분포와 총횟수가 다릅니다.');c.fixedDistribution={matrix:clone(frozen.matrix),source:frozen.distributionSource??'estimate'};}
   for(const key of OWNER_COUNT_KEYS){const item=frozen.owner?.[key];if(item)c.ownerCounts[key]={value:item.value,mode:item.source};}
   if(frozen.owner?.income!==undefined){const value=frozen.owner.income;if(!Number.isSafeInteger(value)||!finite(value,0,1e9)||!['record','manual'].includes(frozen.owner.source??'record'))throw new Error('결과 JSON의 소속 이후 수익이 올바르지 않습니다.');c.ownerIncome={value,mode:frozen.owner.source??'record'};}
  }
  c=validateState({schema:SCHEMA,config:checkedWrapper.config,character:c,snapshots:[]}).character;
  // Native wrapper fields are complete character data; do not reinterpret its flags through game aliases.
  const requiredProfiles=Object.fromEntries(['jobs','backgrounds'].map(key=>[key,checkedWrapper.config[key].filter(item=>!config[key].some(current=>current.id===item.id)&&(item.id===c.job||item.id===c.background))]));
  return {character:c,requiredProfiles,document:{fileName,original:clone(data),working:clone(data),prefix,mappings,notes,sourceRoot:'JO9 result JSON'}};
 }
 if(!Object.keys(c.traitValues).length){if(c.flags.lesbian)c.traitValues.homosexualism=2;if(c.flags.oralAddiction)c.traitValues.oral_affinity=1;if(c.flags.analAddiction)c.traitValues.anal_affinity=1;}
 applyTraitEffects(c);
 return {character:c,document:{fileName,original:clone(data),working:clone(data),prefix,mappings,notes,sourceRoot:'JO9 character JSON'}};
}
export function getPath(root,path){return path.reduce((o,k)=>o?.[k],root);}
export function setCharacterSeedAge(character,document,value){
 if(value!==null&&![0,1,2].includes(value))throw new Error('시드에이지는 미지정 또는 0·1·2입니다.');
 character.seedAge=value;if(!document)return;
 const prefix=document.prefix??[],raw=document.working,wrapper=raw.schema==='jo9-history-result/v1';
 if(wrapper)setPath(raw,[...prefix,'seedAge'],value);
 const path=document.mappings?.seedAge??[...prefix,'seed_age'];
 // Wrappers own a canonical seedAge; update aliases only when already present.
 if(wrapper&&getPath(raw,path)===undefined)return;
 if(value!==null)setPath(raw,path,value);
 else {const parent=getPath(raw,path.slice(0,-1));if(parent)delete parent[path.at(-1)];}
}
export function setPath(root,path,value){
 let node=root;for(const k of path.slice(0,-1)){if(forbidden.has(String(k)))throw new Error('지원하지 않는 키입니다.');if(node[k]===null||typeof node[k]!=='object')node[k]={};node=node[k];}
 const key=path.at(-1);if(forbidden.has(String(key)))throw new Error('지원하지 않는 키입니다.');node[key]=value;
}
export function applyTraitEffects(c){
 const t=c.traitValues??{};
 if(Object.hasOwn(t,'homosexualism'))c.flags.lesbian=t.homosexualism===2;
 if(Object.hasOwn(t,'oral_affinity'))c.flags.oralAddiction=t.oral_affinity>0;
 if(Object.hasOwn(t,'anal_affinity'))c.flags.analAddiction=t.anal_affinity>0;
 if(Object.hasOwn(t,'nymphomania'))c.desire=t.nymphomania>1?'semen':t.nymphomania===1?'nymph':'none';
}
export function traitMatches(row,values){
 const b=row.binding;if(!b||!Object.hasOwn(values,b.key))return false;
 const v=values[b.key];return b.op==='='?v===b.threshold:b.op==='>'?v>b.threshold:b.op==='<'?v<b.threshold:b.op==='>='?v>=b.threshold:b.op==='<='?v<=b.threshold:b.op==='!'?v!==b.threshold:b.op==='range'?v>=b.min&&v<=b.max:false;
}
export function setTrait(character,row,enabled){
 if(!row.binding)throw new Error('조건값 매핑이 없는 항목입니다. 원본 JSON 필드에서 지정하세요.');
 character.traitValues??={};const b=row.binding;
 let neutral=b.key==='sanity'?5:b.key==='virginity'?2:0;
 if(!enabled&&traitMatches(row,{[b.key]:neutral}))neutral=b.op==='='?b.threshold+1:b.op==='range'?b.max+1:b.op==='>'||b.op==='<'?b.threshold:b.op==='>='?b.threshold-1:b.op==='<='?b.threshold+1:b.threshold;
 if(!enabled&&b.op==='='&&b.threshold===0)delete character.traitValues[b.key];
 else character.traitValues[b.key]=enabled?b.setValue:neutral;
 applyTraitEffects(character);
}
export function exportCharacterJSON(state){
 const c=state.character,doc=state.characterFile,result=estimate(c,state.config);
 const out=clone(doc?.working??{}),prefix=doc?.prefix??[],root=prefix.reduce((o,k)=>o[k],out);
 if(doc?.mappings?.name)setPath(out,doc.mappings.name,c.name);else root.seed_name=c.name;
 if([0,1,2].includes(c.seedAge)){if(doc?.mappings?.seedAge)setPath(out,doc.mappings.seedAge,c.seedAge);else root.seed_age=c.seedAge;}
 for(const[k,aliases]of Object.entries(SKILL_ALIASES)){
  const path=doc?.mappings?.[k];
  if(path){const old=getPath(out,path);if(Number(old)!==c.skills[k]&&!GRADES.includes(String(old).toUpperCase()))setPath(out,path,c.skills[k]);else if(typeof old==='string'&&GRADES.includes(old.toUpperCase()))setPath(out,path,GRADES[c.skills[k]]);}
  else if(!DERIVED[k])root['seed_'+aliases[0]]=c.skills[k];
  else {
   const parts=DERIVED[k].map(key=>Number(root['seed_'+key]??root[key]??0));
   if(Math.floor(parts.reduce((a,b)=>a+b,0)/parts.length)!==c.skills[k])for(const key of DERIVED[k])root['seed_'+key]=c.skills[k];
  }
 }
 for(const[key,value]of Object.entries(c.traitValues??{}))root['seed_'+key]=value;
 root.jo9_race_tags=clone(c.raceTags??[]);
 root.jo9_history_design={...clone(root.jo9_history_design??{}),schema_version:1,character_id:c.id,job:c.job,background:c.background,note:c.note,seed:c.seed,scale:c.scale,samePct:c.samePct,nonhumanPct:c.nonhumanPct,flags:clone(c.flags),desire:c.desire,skills:clone(c.skills),storySelection:c.storySelection??null};
 if(c.storySelection)for(const[k,text]of Object.entries(c.storyText??{}))root['seed_'+k+'_description']=text.replaceAll('\n','<br>');
 if(out.schema==='jo9-history-result/v1'){Object.assign(root,clone(c));out.config=clone(state.config);out.result={...clone(out.result??{}),...clone(result),rows:{...clone(out.result?.rows??{}),...clone(result.rows)},owner:{...clone(out.result?.owner??{}),...clone(result.owner),combatGroups:{...clone(out.result?.owner?.combatGroups??{}),...Object.fromEntries(COMBAT_TYPES.map(({id})=>[id,{...clone(out.result?.owner?.combatGroups?.[id]??{}),...Object.fromEntries(COMBAT_KEYS.map(key=>[key,{...clone(out.result?.owner?.combatGroups?.[id]?.[key]??{}),...clone(result.owner.combatGroups[id][key])}]))}]))},combatTotals:{...clone(out.result?.owner?.combatTotals??{}),...Object.fromEntries(COMBAT_KEYS.map(key=>[key,{...clone(out.result?.owner?.combatTotals?.[key]??{}),...clone(result.owner.combatTotals[key])}]))}}};}
 const packed=row=>({value:row.source==='unknown'?null:row.value,source:row.source==='fixed_estimate'?'estimate':row.source});
 root[HISTORY_KEY]={...clone(root[HISTORY_KEY]??{}),schema_version:1,period:'before_acquisition',values:{...Object.fromEntries(['combat','wins','losses','escapes','abortions','children'].filter(key=>Object.hasOwn(c.overrides,key)).map(key=>[key,clone(c.overrides[key])])),...clone(root[HISTORY_KEY]?.values??{}),...Object.fromEntries(Object.entries(result.rows).map(([k,row])=>[k,packed(row)]))},distribution:{...clone(root[HISTORY_KEY]?.distribution??{}),matrix:clone(result.matrix),source:result.distributionSource??'estimate',rows:['vaginal','oral','anal','unclassified'],columns:['other_human_opposite','other_human_same','nonhuman']}};
 if(!root[HISTORY_KEY].combat_categories&&c.combatGroups!==null)root[HISTORY_KEY].combat_categories=clone(c.combatGroups);
 root.jo9_owner_history={...clone(root.jo9_owner_history??{}),schema_version:1,period:'after_acquisition',combat_categories:{...clone(root.jo9_owner_history?.combat_categories??{}),...Object.fromEntries(COMBAT_TYPES.map(({id})=>[id,{...clone(root.jo9_owner_history?.combat_categories?.[id]??{}),values:{...clone(root.jo9_owner_history?.combat_categories?.[id]?.values??{}),...Object.fromEntries(COMBAT_KEYS.map(key=>[key,{...clone(root.jo9_owner_history?.combat_categories?.[id]?.values?.[key]??{}),...packed(result.owner.combatGroups[id][key])}]))}}]))},income:{...clone(root.jo9_owner_history?.income??{}),value:result.owner.income,source:result.owner.source},...Object.fromEntries(OWNER_COUNT_KEYS.map(key=>[key,{...clone(root.jo9_owner_history?.[key]??{}),...clone(result.owner[key])}]))};
 return orderCharacterJSON(out,doc?.original,prefix);
}
export function primitiveFields(value,path=[],out=[]){
 if(value!==null&&typeof value==='object'){for(const[k,v]of Object.entries(value))primitiveFields(v,[...path,k],out);}
 else out.push({path,key:path.join('.'),value,type:value===null?'null':typeof value});return out;
}
export function normalizeTraitCatalogue(data){
 const rows=Array.isArray(data)?data:data?.rows;if(!Array.isArray(rows)||!rows.length||rows.length>2000)throw new Error('특성 목록은 rows 배열이어야 합니다.');
 const ids=new Set();return rows.map(row=>{
  if(!row||typeof row.id!=='string'||typeof row.name!=='string'||ids.has(row.id+'|'+row.name))throw new Error('특성 ID와 이름을 확인하세요.');ids.add(row.id+'|'+row.name);
  let b=null,m;const id=row.id.trim();
  if((m=id.match(/^(\w+)\s*(>=|<=|=|>|<|!|≥|≤)\s*(-?\d+)$/))){const[,key,raw,value]=m,op=raw==='≥'?'>=':raw==='≤'?'<=':raw,t=Number(value);b={key,op,threshold:t,setValue:op==='>'?t+1:op==='<'?t-1:op==='!'?t+1:t};}
  else if((m=id.match(/^(\w+)\[(\d+)\]$/)))b={key:m[1],op:'=',threshold:Number(m[2]),setValue:Number(m[2])};
  else if((m=id.match(/^(\w+)\s+(\d+)[–-](\d+)$/)))b={key:m[1],op:'range',min:Number(m[2]),max:Number(m[3]),setValue:Number(m[2])};
  return {...clone(row),category:String(row.category??'미분류'),description:String(row.description??''),aliases:Array.isArray(row.aliases)?row.aliases.map(String):[],binding:b};
 });
}

export function moveUnclassifiedCombat(character,config,target){
 if(!['pvp','pve'].includes(target))throw new Error('이동할 전투 분류를 확인하세요.');
 const c=validateState({schema:SCHEMA,config,character,snapshots:[]}).character,result=estimate(c,config);
 for(const key of COMBAT_KEYS){const from=result.owner.combatGroups.unclassified[key],to=result.owner.combatGroups[target][key];if(from.value===0)continue;const value=from.value+to.value;if(value>1e9)throw new Error('이동 후 전투 기록은 10억 이하여야 합니다.');c.ownerCombatGroups[target][key]={mode:'manual',value};c.ownerCombatGroups.unclassified[key]={mode:'record',value:0};}
 return c;
}
export function preserveRawEditCharacter(parsed,old,path,prefix=[],wrapper=false){
 if(!path)return parsed;
 const relative=path.slice(prefix.length),field=relative[0];
 if(wrapper&&field in defaultCharacter()){
  const kept=clone(old);setPath(kept,relative,clone(getPath(parsed,relative)));return kept;
 }
 const history=path.some(key=>[HISTORY_KEY,'initial_history'].includes(key));
 if(!history){parsed.overrides=clone(old.overrides);parsed.fixedDistribution=clone(old.fixedDistribution);}
 if(!history&&!path.includes('combatGroups'))parsed.combatGroups=clone(old.combatGroups);
 if(!path.some(key=>['jo9_owner_history','ownerIncome'].includes(key)))parsed.ownerIncome=clone(old.ownerIncome);
 if(!path.some(key=>['jo9_owner_history','ownerCombatGroups'].includes(key)))parsed.ownerCombatGroups=clone(old.ownerCombatGroups);
 if(!path.some(key=>['jo9_owner_history','ownerCounts'].includes(key)))parsed.ownerCounts=clone(old.ownerCounts);
 if(!path.some(key=>['jo9_race_tags','race_tags','race','species_tags'].includes(key)))parsed.raceTags=clone(old.raceTags);
 if(!path.includes('seed_name')&&!path.includes('name'))parsed.name=old.name;
 if(!path.includes('jo9_history_design'))for(const key of ['job','background','scale','seed','samePct','nonhumanPct'])parsed[key]=old[key];
 if(!path.includes('jo9_history_design')&&!path.some(key=>key.endsWith('_description'))){parsed.note=old.note;parsed.storyText=clone(old.storyText);parsed.storySelection=clone(old.storySelection);}
 return parsed;
}
