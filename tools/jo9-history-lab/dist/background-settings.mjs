export const AGE_CODES=[0,1,2];
const kinds=['world','family','occupation'];
const safe=id=>typeof id==='string'&&/^[a-zA-Z0-9_:-]{1,120}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const own=(o,k)=>o&&Object.hasOwn(o,k);
export const textKey=record=>record.kind==='world'?`${record.id}:${record.variant}`:record.id;
export function getAgeRule(config,kind,id){const r=config?.backgroundSettings?.ageRules?.[kind]?.[id];return {required:[...(r?.required??[])],rejected:[...(r?.rejected??[])]};}
export function editedBackgroundText(config,record){const group=config?.backgroundSettings?.texts?.[record.kind],key=textKey(record);return own(group,key)?group[key]:record.text;}
export function worldFamilies(catalogue,config,world){const group=config?.backgroundSettings?.links?.worldFamilies;return [...new Set(own(group,world)?group[world]:(catalogue.pools[world+'_family']??[]))];}
function legacyFamilyOccupations(catalogue,config,world,family){
 const group=config?.backgroundSettings?.links?.occupations,key=`${world}:${family}`;
 if(own(group,key))return [...group[key]];
 const jobs=[...new Set(catalogue.pools[family+'_occupation']??[])];
 for(const id of ['poor_bride','noble_bride','rich_bride'])if(jobs.includes(id))jobs.push(id.replace('_bride','_wife'));
 return jobs;
}
// Keep historical per-family overrides as source data; new editing is world-wide.
export function worldOccupations(catalogue,config,world){
 const links=config?.backgroundSettings?.links;
 if(own(links?.worldOccupations,world))return [...links.worldOccupations[world]];
 const jobs=(catalogue.pools[world+'_family']??[]).flatMap(family=>legacyFamilyOccupations(catalogue,config,world,family));
 for(const[key,values]of Object.entries(links?.occupations??{}))if(key.startsWith(world+':'))jobs.push(...values);
 return [...new Set(jobs)];
}
export function getOccupationFamilyRule(config,world,occupation){
 const rule=config?.backgroundSettings?.links?.occupationFamilies?.[`${world}:${occupation}`];
 return {required:rule?.required==null?null:[...rule.required],rejected:[...(rule?.rejected??[])]};
}
export function occupationFamilyAllows(config,world,occupation,family){
 const rule=getOccupationFamilyRule(config,world,occupation);
 return (rule.required===null||rule.required.includes(family))&&!rule.rejected.includes(family);
}
export function familyOccupations(catalogue,config,world,family){return worldOccupations(catalogue,config,world).filter(job=>occupationFamilyAllows(config,world,job,family));}
export function allowedBackgroundAges(config,item){return AGE_CODES.filter(age=>kinds.every(kind=>{
 const record=item[kind],rule=getAgeRule(config,kind,record?.id??record);
 return (!rule.required.length||rule.required.includes(age))&&!rule.rejected.includes(age)&&!(record?.adultOnly&&age===1);
}));}
export function backgroundAgeAllows(config,item,age){
 if(AGE_CODES.includes(age))return allowedBackgroundAges(config,item).includes(age);
 return kinds.every(kind=>{const record=item[kind],rule=getAgeRule(config,kind,record?.id??record);return !rule.required.length&&!rule.rejected.length&&!record?.adultOnly;});
}
export function validateBackgroundSettings(config){
 const fail=message=>{throw new Error(message||'배경 대사·연결·연령 설정 형식을 확인하세요.');};
 if(config.backgroundSettings===undefined)config.backgroundSettings={};
 const input=config.backgroundSettings;
 const check=(o,keys)=>{if(!object(o)||Object.keys(o).some(k=>!safe(k)||(keys&&!keys.includes(k))))fail();};
 check(input,['ageRules','texts','links','defaultConnectionsVersion']);
 const out={ageRules:{},texts:{},links:{worldFamilies:{},worldOccupations:{},occupations:{},occupationFamilies:{}}};
 if(input.defaultConnectionsVersion!==undefined){if(typeof input.defaultConnectionsVersion!=='string'||!safe(input.defaultConnectionsVersion))fail('기본 연결 버전을 확인하세요.');out.defaultConnectionsVersion=input.defaultConnectionsVersion;}
 for(const field of ['ageRules','texts']){
  const groups=input[field]??{};check(groups,kinds);
  for(const kind of kinds){
   const group=groups[kind]??{};check(group);if(Object.keys(group).length>1000)fail();out[field][kind]={};
   for(const[id,value]of Object.entries(group)){
    if(field==='texts'){if(typeof value!=='string'||!value.trim()||value.length>4000)fail('대사는 빈칸 없이 4,000자 이내로 입력하세요.');out.texts[kind][id]=value;continue;}
    check(value,['required','rejected']);const rule={};
    for(const key of ['required','rejected']){const codes=value[key]??[];if(!Array.isArray(codes)||codes.length>3||codes.some(c=>!AGE_CODES.includes(c))||new Set(codes).size!==codes.length)fail('시드에이지는 0·1·2 중에서 선택하세요.');rule[key]=[...codes].sort();}
    if(rule.required.some(code=>rule.rejected.includes(code)))fail('같은 시드에이지를 필수와 거부에 동시에 지정할 수 없습니다.');
    out.ageRules[kind][id]=rule;
   }
  }
 }
 const links=input.links??{};check(links,['worldFamilies','worldOccupations','occupations','occupationFamilies']);
 for(const key of ['worldFamilies','worldOccupations','occupations']){
  const group=links[key]??{};check(group);if(Object.keys(group).length>2000)fail();
  for(const[id,values]of Object.entries(group)){if(!Array.isArray(values)||values.length>1000||values.some(v=>!safe(v))||new Set(values).size!==values.length)fail('연결 목록의 ID와 중복을 확인하세요.');out.links[key][id]=[...values];}
 }
 const familyRules=links.occupationFamilies??{};check(familyRules);if(Object.keys(familyRules).length>2000)fail();
 for(const[id,value]of Object.entries(familyRules)){
  check(value,['required','rejected']);const rule={required:value.required??null,rejected:value.rejected??[]};
  for(const key of ['required','rejected'])if(rule[key]!==null&&(!Array.isArray(rule[key])||rule[key].length>1000||rule[key].some(v=>!safe(v))||new Set(rule[key]).size!==rule[key].length))fail('직업별 출신 조건의 ID와 중복을 확인하세요.');
  if(rule.rejected===null||rule.required?.some(v=>rule.rejected.includes(v)))fail('같은 출신을 필수와 거부에 동시에 지정할 수 없습니다.');
  out.links.occupationFamilies[id]={required:rule.required===null?null:[...rule.required],rejected:[...rule.rejected]};
 }
 config.backgroundSettings=out;return out;
}
