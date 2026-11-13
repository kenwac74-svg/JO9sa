import {resolveBackgroundModifiers,validateBackgroundModifiers} from './background-modifiers.mjs';
import {validateBackgroundSettings} from './background-settings.mjs';

export const SCHEMA = 'jo9-history-lab/v1';
export const GRADES = ['F','D','C','B','A','S'];
export const STAT_KEYS = ['intimacy','pregnancies','births'];
export const OWNER_COUNT_KEYS = ['pregnancies','births','abortions','children'];
export const COMBAT_KEYS = ['wins','losses','escapes'];
export const COMBAT_TYPES = [
  {id:'pvp',name:'PvP',venues:'아레나 · 캣파이팅'},
  {id:'pve',name:'PvE',venues:'안개경계'},
  {id:'unclassified',name:'미분류',venues:'소속 이후 전적 · 유형 미확인'}
];
export const defaultOwnerCombatGroups=()=>Object.fromEntries(COMBAT_TYPES.map(({id})=>[id,Object.fromEntries(COMBAT_KEYS.map(key=>[key,{mode:'record',value:0}]))]));
export function ownerCombatResult(groups){
  const labels={wins:'승리',losses:'패배',escapes:'도주'};
  const combatGroups=Object.fromEntries(COMBAT_TYPES.map(({id,name})=>[id,Object.fromEntries(COMBAT_KEYS.map(key=>{const input=groups?.[id]?.[key];return [key,{value:input?.value??0,source:input?.mode==='manual'?'manual':'record',unit:'회',trace:{label:`소속 이후 ${name} ${labels[key]}`,rule:'영입 이후 기록만 누적. 과거 이력이나 스킬로 추정하지 않음'}}];}))]));
  const combatTotals=Object.fromEntries(COMBAT_KEYS.map(key=>[key,{value:COMBAT_TYPES.reduce((sum,{id})=>sum+combatGroups[id][key].value,0),source:COMBAT_TYPES.some(({id})=>combatGroups[id][key].source==='manual')?'manual':'record',unit:'회',trace:{label:`소속 이후 ${labels[key]}`,rule:'소속 이후 PvP + PvE + 미분류 합계'}}]));
  return {combatGroups,combatTotals};
}
// Combat records begin after acquisition and are never estimated from skills.
export const DOMAINS = [['intimacy','성적 경험','회']];
export const SKILLS = [
  ['petting','애무','intimacy'],['oral','구강','intimacy'],['penetration','삽입','intimacy'],
  ['vaginal','질 상세','detail'],['oralDetail','구강 상세','detail'],['anal','애널 상세','detail'],
  ['combat','전투','work'],['cook','요리','work'],['alchemy','연금','work'],['nurse','간호','work'],
  ['secretary','서기','work'],['expression','표현','work'],['intellect','지성','work']
];
const base = Object.fromEntries(DOMAINS.map(([id])=>[id,1]));
const profile=(id,name,values={},source='설계용 묶음')=>({id,name,source,scales:{...base,...Object.fromEntries(Object.entries(values).filter(([key])=>key in base))}});
export function defaultConfig(){return {
  version:'0.1 · 조정 초안',
  gradeBases:{
    intimacy:[0,3,15,50,140,320],combat:[0,2,8,25,70,180]
  },
  weights:{intimacy:{petting:.2,oral:.4,penetration:.4}},
  jobs:[
    profile('general','일반·불명'),
    profile('huntress','사냥꾼·전사',{intimacy:.7,combat:1.8},'huntress / heroine'),
    profile('maid','가사 종사자',{intimacy:.8,combat:.2},'maid / valertry'),
    profile('teacher','교사',{intimacy:.7,combat:.2},'teacher'),
    profile('nurse','간호사',{intimacy:.7,combat:.3},'nurse'),
    profile('herbalist','약초사·연금술사',{intimacy:.6,combat:.4},'herbalist / shaman / witch'),
    profile('brothel','성인 접객업',{intimacy:2,combat:.2},'brothel / whore / markitane')
  ],
  backgrounds:[
    profile('ordinary','일반·불명'),profile('sheltered','보호받은 생활',{intimacy:.4,combat:.2}),
    profile('academic','학업·훈련 중심',{intimacy:.6,combat:.7}),
    profile('field','현장 생활',{intimacy:1.1,combat:1.4})
  ],
  backgroundModifiers:{world:{},family:{},occupation:{}},
  backgroundSettings:{ageRules:{world:{},family:{},occupation:{}},texts:{world:{},family:{},occupation:{}},links:{worldFamilies:{},worldOccupations:{},occupations:{},occupationFamilies:{}}},
  rules:{variation:15,sameDefault:5,sameLesbian:80,nonhumanBackground:10,oralAddiction:1.2,analAddiction:1.2,
    nymph:1.15,semen:1.3,winRate:65,escapeRate:10,detailPower:2}
};}
export function defaultCharacter(){return {
  id:'JO9-ADULT-001',name:'가상 캐릭터 01',job:'maid',background:'ordinary',note:'',seedAge:null,
  skills:Object.fromEntries(SKILLS.map(([k])=>[k,['petting','oral','penetration','vaginal','oralDetail','cook'].includes(k)?4:3])),
  flags:{lesbian:false,nonhuman:false,clone:false,noIntimacy:false,noVaginal:false,oralAddiction:false,analAddiction:false},
  desire:'none',scale:1,seed:'20261110',samePct:null,nonhumanPct:null,overrides:{},combatGroups:null,ownerCombatGroups:defaultOwnerCombatGroups(),ownerIncome:{mode:'record',value:0},ownerCounts:Object.fromEntries(OWNER_COUNT_KEYS.map(key=>[key,{mode:'record',value:0}])),raceTags:[],traitValues:{},storySelection:null,storyText:{},noteManualBackup:'',fixedDistribution:null
};}
export function freshState(){return {schema:SCHEMA,config:defaultConfig(),character:defaultCharacter(),snapshots:[]};}
export const clone = x=>JSON.parse(JSON.stringify(x));
export function finite(v,min=0,max=Number.MAX_SAFE_INTEGER){return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
export function seededUnit(value){let h=2166136261;for(const ch of value){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967295;}
export function split(total,weights){
  total=Math.max(0,Math.round(total));
  const clean=weights.map(x=>Math.max(0,Number(x)||0)),sum=clean.reduce((a,b)=>a+b,0);
  if(sum===0)return clean.map(()=>0);
  const raw=clean.map(x=>total*x/sum),out=raw.map(Math.floor);
  let remain=total-out.reduce((a,b)=>a+b,0);
  const order=raw.map((x,i)=>[x-out[i],i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]);
  for(let i=0;i<remain;i++)out[order[i%order.length][1]]++;
  return out;
}
export function estimate(character,config){
  const c=character,r=config.rules,s=c.skills;
  const job=config.jobs.find(x=>x.id===c.job)||config.jobs[0];
  const bg=config.backgrounds.find(x=>x.id===c.background)||config.backgrounds[0];
  const backgroundModifiers=resolveBackgroundModifiers(config,c.storySelection);
  const b=(domain,key)=>config.gradeBases[domain][s[key]];
  const weighted=id=>{
    const entries=Object.entries(config.weights[id]),sum=entries.reduce((a,[k,w])=>a+w,0);
    return sum?entries.reduce((a,[k,w])=>a+b(id,k)*w,0)/sum:0;
  };
  const bases={intimacy:weighted('intimacy')};
  const rows={},warnings=[];
  const rounded=value=>Math.max(0,Math.round(value));
  const row=(auto,override,trace,unit='회')=>{
    const has=override&&['manual','record','fixed_estimate'].includes(override.mode)&&finite(override.value);
    return {value:has?rounded(override.value):rounded(auto),source:has?override.mode:'estimate',auto:rounded(auto),trace,unit};
  };
  const unknown=label=>({value:0,source:'unknown',auto:0,trace:{label,rule:'알려진 기록이 없어 미상으로 보존'},unit:'회'});
  const inferred={};
  for(const [id,label,unit]of DOMAINS){
    const fluctuation=1+(seededUnit(`${c.id}|${c.seed}|${id}`)*2-1)*r.variation/100;
    const trait=id==='intimacy'?(c.desire==='nymph'?r.nymph:c.desire==='semen'?r.semen:1):1;
    const zero=c.flags.clone||(id==='intimacy'&&c.flags.noIntimacy);
    const jobFactor=backgroundModifiers.active?1:job.scales[id];
    const backgroundFactor=backgroundModifiers.active?backgroundModifiers.factors[id]:bg.scales[id];
    const v=zero?0:bases[id]*jobFactor*backgroundFactor*c.scale*trait*fluctuation;
    inferred[id]=row(v,c.overrides?.[id],{label,base:bases[id],job:jobFactor,background:backgroundFactor,scale:c.scale,trait,fluctuation,zero,
      backgroundParts:backgroundModifiers.parts,backgroundFactor,backgroundMode:backgroundModifiers.active?'selection':'coarse'},unit);
  }
  rows.intimacy=inferred.intimacy;
  for(const [id,label,unit]of [['pregnancies','임신','회'],['births','출산','회']]){
    const range=backgroundModifiers.ranges[id];
    const selection=c.storySelection;
    const drawKey=range?JSON.stringify([c.id,c.seed,selection.world,selection.family,selection.occupation,id]):null;
    const auto=range?Math.min(range.max,range.min+Math.floor(seededUnit(drawKey)*(range.max-range.min+1))):0;
    rows[id]=row(auto,c.overrides?.[id],{label,
      rule:range?'직업 → 출신 → 세계 중 처음 지정한 범위에서 고정 시드로 정수 추정. 알려진 지정값 우선':'근거 없이 추정하지 않음. 알려진 값만 지정',
      backgroundParts:backgroundModifiers.parts,backgroundRange:range,rangePriority:['occupation','family','world'],rangeSeed:drawKey},unit);
    if(!range&&rows[id].source==='estimate')rows[id].source='unknown';
  }
  const total=rows.intimacy.value;
  const same=c.samePct===null?(c.flags.lesbian?r.sameLesbian:r.sameDefault):c.samePct;
  const nonhuman=c.nonhumanPct===null?(c.flags.nonhuman?r.nonhumanBackground:0):c.nonhumanPct;
  const clampedNonhuman=Math.max(0,Math.min(100,nonhuman));
  const partnerWeights=[(100-clampedNonhuman)*(100-same)/100,(100-clampedNonhuman)*same/100,clampedNonhuman];
  let partners=split(total,partnerWeights);
  const oral=c.flags.oralAddiction?5:s.oralDetail,anal=c.flags.analAddiction?5:s.anal;
  const actWeights=[c.flags.noVaginal?0:s.vaginal**r.detailPower,oral**r.detailPower*(c.flags.oralAddiction?r.oralAddiction:1),anal**r.detailPower*(c.flags.analAddiction?r.analAddiction:1)];
  let acts=split(total,actWeights),unassigned=total-acts.reduce((a,b)=>a+b,0);
  // Allocate rows, then columns, preserving both marginal totals exactly.
  let matrix=Array.from({length:4},()=>[0,0,0]);
  let remaining=partners.slice();
  [...acts,unassigned].forEach((n,i)=>{
    const allocated=i===3?remaining.slice():split(n,remaining);
    allocated.forEach((v,j)=>{matrix[i][j]=v;remaining[j]-=v;});
  });
  let distributionSource='estimate';
  if(c.fixedDistribution){
    const m=c.fixedDistribution.matrix;
    if(m.flat().reduce((a,b)=>a+b,0)===total){
      matrix=clone(m);partners=[0,1,2].map(j=>matrix.reduce((a,r)=>a+r[j],0));
      const sums=matrix.map(row=>row.reduce((a,b)=>a+b,0));acts=sums.slice(0,3);unassigned=sums[3];distributionSource=c.fixedDistribution.source;
    }else warnings.push('총횟수와 저장한 상세 분포가 달라 상세 분포를 자동으로 재산출했습니다.');
  }
  if(c.flags.clone)warnings.push('기술 주입·클론 예외: 자동 성적 경력은 0입니다. 명시한 가족 범위와 지정 기록은 별도로 적용합니다.');
  if(c.flags.noIntimacy&&total>0)warnings.push('전체 미경험 설정과 직접 지정한 경험 횟수가 충돌합니다. 지정값을 우선 표시했습니다.');
  if(unassigned>0)warnings.push('상세 기술 가중치가 모두 0이어서 유형 미분류로 남겼습니다.');
  return {rows,partners,acts,matrix,unassigned,partnerWeights,actWeights,warnings,distributionSource,backgroundModifiers,
    owner:{...ownerCombatResult(c.ownerCombatGroups),income:Math.round(c.ownerIncome?.value??0),source:c.ownerIncome?.mode==='manual'?'manual':'record',...Object.fromEntries(OWNER_COUNT_KEYS.map(key=>[key,{value:c.ownerCounts?.[key]?.value??0,source:c.ownerCounts?.[key]?.mode==='manual'?'manual':'record'}]))},job:job.name,background:bg.name};
}
export function validateState(data){
  data=clone(data);
  const fail=msg=>{throw new Error(msg);};
  if(!data||data.schema!==SCHEMA)fail('지원하지 않는 파일입니다. 대시보드에서 내보낸 v1 JSON을 선택하세요.');
  const cfg=data.config,c=data.character;
  if(!cfg||!c||!Array.isArray(data.snapshots)||data.snapshots.length>200)fail('설정 또는 보관함 형식이 올바르지 않습니다.');
  validateBackgroundModifiers(cfg);
  validateBackgroundSettings(cfg);
  for(const[id]of DOMAINS){const a=cfg.gradeBases?.[id];if(!Array.isArray(a)||a.length!==6||a.some(x=>!finite(x,0,1e7)))fail('등급 기준표를 확인하세요.');}
  for(const list of [cfg.jobs,cfg.backgrounds]){
    if(!Array.isArray(list)||!list.length||list.length>100)fail('배경·직업 목록이 올바르지 않습니다.');
    const ids=new Set();for(const p of list){if(typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.name!=='string'||p.name.length>100)fail('배경 ID와 이름을 확인하세요.');ids.add(p.id);for(const[id]of DOMAINS)if(!finite(p.scales?.[id],0,20))fail('배경 계수 범위는 0–20입니다.');}
  }
  const rules=defaultConfig().rules;
  for(const[group,weights]of Object.entries(defaultConfig().weights)){
    if(!cfg.weights?.[group]||Object.keys(cfg.weights[group]).length!==Object.keys(weights).length)fail('분야별 기술 가중치를 확인하세요.');
    for(const k of Object.keys(weights))if(!finite(cfg.weights[group][k],0,20))fail('기술 가중치 범위는 0–20입니다.');
  }
  for(const key of Object.keys(rules).filter(key=>!['winRate','escapeRate'].includes(key)))if(!finite(cfg.rules?.[key],0,['variation','sameDefault','sameLesbian','nonhumanBackground','winRate','escapeRate'].includes(key)?100:10))fail('규칙 계수를 확인하세요.');
  const checkC=(x)=>{
    if(!x||typeof x!=='object')fail('캐릭터 형식이 올바르지 않습니다.');
    for(const key of ['raceTags','traitValues','storySelection','storyText','noteManualBackup','fixedDistribution','combatGroups','ownerCombatGroups','ownerIncome','ownerCounts','seedAge'])if(x[key]===undefined)x[key]=clone(defaultCharacter()[key]);
    if(x.seedAge!==null&&![0,1,2].includes(x.seedAge))fail('시드에이지는 미지정 또는 0·1·2입니다.');
    if(!x||typeof x.id!=='string'||!x.id.trim()||x.id.length>100||typeof x.name!=='string'||x.name.length>100||typeof x.note!=='string'||x.note.length>4000||typeof x.seed!=='string'||x.seed.length>100)fail('캐릭터 이름·ID·메모를 확인하세요.');
    if(!cfg.jobs.some(p=>p.id===x.job)||!cfg.backgrounds.some(p=>p.id===x.background))fail('캐릭터의 직업·배경을 찾을 수 없습니다.');
    for(const[k]of SKILLS)if(!Number.isInteger(x.skills?.[k])||!finite(x.skills[k],0,5))fail('기술 등급 범위는 F–S입니다.');
    for(const k of Object.keys(defaultCharacter().flags))if(typeof x.flags?.[k]!=='boolean')fail('배경 태그를 확인하세요.');
    if(!['none','nymph','semen'].includes(x.desire)||!finite(x.scale,0,10))fail('개인 보정값을 확인하세요.');
    for(const k of ['samePct','nonhumanPct'])if(x[k]!==null&&!finite(x[k],0,100))fail('상대 비중 범위는 0–100%입니다.');
    if(!x.overrides||typeof x.overrides!=='object'||Array.isArray(x.overrides))fail('지정값 형식이 올바르지 않습니다.');
    const validInput=o=>o&&typeof o==='object'&&!Array.isArray(o)&&['auto','manual','record','fixed_estimate'].includes(o.mode)&&finite(o.value,0,1e9);
    // Legacy retired fields are opaque preserved data, never active statistics.
    for(const[k,o]of Object.entries(x.overrides))if(STAT_KEYS.includes(k)&&!validInput(o))fail('지정값의 항목 또는 범위를 확인하세요.');
    if(!x.ownerIncome||!['record','manual'].includes(x.ownerIncome.mode)||!finite(x.ownerIncome.value,0,1e9))fail('소속 이후 수익은 기록 또는 직접 지정한 0 이상 수치입니다.');
    if(!x.ownerCounts||typeof x.ownerCounts!=='object'||Array.isArray(x.ownerCounts))fail('소속 이후 가족 기록 형식을 확인하세요.');
    for(const key of OWNER_COUNT_KEYS){if(x.ownerCounts[key]===undefined)x.ownerCounts[key]={mode:'record',value:0};const o=x.ownerCounts[key];if(!o||!['record','manual'].includes(o.mode)||!Number.isSafeInteger(o.value)||!finite(o.value,0,1e9))fail('소속 이후 가족 기록은 0 이상의 정수입니다.');}
    if(!x.ownerCombatGroups||typeof x.ownerCombatGroups!=='object'||Array.isArray(x.ownerCombatGroups))fail('소속 이후 전투 기록 형식을 확인하세요.');
    for(const {id} of COMBAT_TYPES){
      if(x.ownerCombatGroups[id]===undefined)x.ownerCombatGroups[id]={};const group=x.ownerCombatGroups[id];if(!group||typeof group!=='object'||Array.isArray(group))fail('소속 이후 전투 유형을 확인하세요.');
      for(const key of COMBAT_KEYS){if(group[key]===undefined)group[key]={mode:'record',value:0};const input=group[key];if(!input||!['record','manual'].includes(input.mode)||!Number.isSafeInteger(input.value)||!finite(input.value,0,1e9))fail('소속 이후 전투 기록은 기록·직접 지정의 0 이상 정수입니다.');}
    }
    if(!Array.isArray(x.raceTags)||x.raceTags.length>20||x.raceTags.some(v=>typeof v!=='string'||!v.trim()||v.length>80))fail('종족 태그는 80자 이하, 최대 20개입니다.');
    if(!x.traitValues||typeof x.traitValues!=='object'||Array.isArray(x.traitValues)||Object.values(x.traitValues).some(v=>!Number.isFinite(v)))fail('특성 조건값을 확인하세요.');
    if(x.fixedDistribution){const m=x.fixedDistribution.matrix;if(!Array.isArray(m)||m.length!==4||m.some(row=>!Array.isArray(row)||row.length!==3||row.some(v=>!Number.isSafeInteger(v)||v<0))||!['estimate','manual','record'].includes(x.fixedDistribution.source))fail('상세 초기 분포는 4행 3열의 0 이상 정수입니다.');}
  };
  checkC(c);
  const snapshotIds=new Set();
  for(const x of data.snapshots){if(!x||typeof x.id!=='string'||snapshotIds.has(x.id)||typeof x.label!=='string'||!x.character||!x.result?.rows||!x.config||typeof x.savedAt!=='string'||Number.isNaN(Date.parse(x.savedAt)))fail('보관함이 손상되었습니다.');
    snapshotIds.add(x.id);
    // Validate the snapshot against its own frozen coefficients, without recalculating values.
    const checked=validateState({schema:SCHEMA,config:x.config,character:x.character,snapshots:[]});
    x.config=checked.config;x.character=checked.character;
    for(const [key,label]of [['pregnancies','임신']])if(!x.result.rows[key])x.result.rows[key]={value:0,source:'unknown',auto:0,trace:{label,rule:'구버전 스냅샷에 기록 없음'},unit:'회'};
    x.result.owner??={income:0,source:'record'};
    for(const key of OWNER_COUNT_KEYS){x.result.owner[key]??={value:0,source:'record'};const o=x.result.owner[key];if(!Number.isSafeInteger(o.value)||!finite(o.value,0,1e9)||!['record','manual'].includes(o.source))fail('보관함의 소속 이후 가족 기록이 올바르지 않습니다.');}
    for(const key of STAT_KEYS){
      const row=x.result.rows[key];
      if(!row||!finite(row.value)||!['estimate','manual','record','unknown','fixed_estimate'].includes(row.source))fail('보관함의 결과값이 올바르지 않습니다.');
    }
    if(x.result.owner.combatGroups===undefined)x.result.owner.combatGroups=ownerCombatResult(null).combatGroups;
    const savedGroups=x.result.owner.combatGroups;
    for(const {id} of COMBAT_TYPES)for(const key of COMBAT_KEYS){const row=savedGroups?.[id]?.[key];if(!row||!Number.isSafeInteger(row.value)||!finite(row.value,0,1e9)||!['record','manual'].includes(row.source))fail('보관함의 소속 이후 전투 기록을 확인하세요.');}
    const totals=ownerCombatResult(Object.fromEntries(COMBAT_TYPES.map(({id})=>[id,Object.fromEntries(COMBAT_KEYS.map(key=>[key,{value:savedGroups[id][key].value,mode:savedGroups[id][key].source}]))]))).combatTotals;
    if(x.result.owner.combatTotals===undefined)x.result.owner.combatTotals=totals;
    else for(const key of COMBAT_KEYS){const row=x.result.owner.combatTotals[key];if(!row||row.value!==totals[key].value||row.source!==totals[key].source)fail('보관함의 소속 이후 전투 합계가 유형별 기록과 다릅니다.');}
    if(!Array.isArray(x.result.partners)||x.result.partners.length!==3||x.result.partners.some(v=>!finite(v)))fail('보관함의 상대 분류값이 올바르지 않습니다.');
  }
  return clone(data);
}
