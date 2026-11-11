export const BACKGROUND_KINDS = ['world','family','occupation'];
export const RANGE_KEYS = ['pregnancies','abortions','births','children'];
export const PAST_RANGE_KEYS = ['pregnancies','births'];
const forbidden = new Set(['__proto__','prototype','constructor']);
const own = (object,key)=>object!=null&&Object.hasOwn(object,key);
const emptyRanges = ()=>Object.fromEntries(RANGE_KEYS.map(key=>[key,null]));
const isObject = value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);

// No seeded helper imports here: the engine owns sampling and imports this module.
export function getModifier(config,kind,id){
  const group=BACKGROUND_KINDS.includes(kind)&&own(config?.backgroundModifiers,kind)?config.backgroundModifiers[kind]:null;
  const item=typeof id==='string'&&!forbidden.has(id)&&own(group,id)?group[id]:null;
  return {intimacy:item?.intimacy??1,combat:item?.combat??1,
    ranges:Object.fromEntries(RANGE_KEYS.map(key=>[key,item?.ranges?.[key]?{min:item.ranges[key].min,max:item.ranges[key].max}:null]))};
}

export function resolveBackgroundModifiers(config,selection){
  const active=BACKGROUND_KINDS.every(kind=>typeof selection?.[kind]==='string'&&selection[kind].trim().length>0);
  if(!active)return {active:false,parts:[],factors:{intimacy:1,combat:1},ranges:emptyRanges()};
  const parts=BACKGROUND_KINDS.map(kind=>({kind,id:selection[kind],...getModifier(config,kind,selection[kind])}));
  const factors=parts.reduce((product,part)=>({intimacy:product.intimacy*part.intimacy,combat:product.combat*part.combat}),{intimacy:1,combat:1});
  const ranges=Object.fromEntries(RANGE_KEYS.map(key=>{
    const selected=parts.slice().reverse().find(part=>part.ranges[key]!==null);
    return [key,selected?{...selected.ranges[key],kind:selected.kind,id:selected.id}:null];
  }));
  return {active:true,parts,factors,ranges};
}

export function validateBackgroundModifiers(config){
  const fail=()=>{throw new Error('배경별 보정 형식을 확인하세요. 배수는 0–20, 범위는 0–1,000,000,000의 정수이며 최소 ≤ 최대입니다.');};
  if(!isObject(config))fail();
  if(config.backgroundModifiers===undefined)config.backgroundModifiers={world:{},family:{},occupation:{}};
  const input=config.backgroundModifiers;
  const checkObject=value=>{if(!isObject(value)||Object.keys(value).some(key=>forbidden.has(key)))fail();};
  checkObject(input);
  if(Object.keys(input).some(kind=>!BACKGROUND_KINDS.includes(kind)))fail();
  const normalized={};
  for(const kind of BACKGROUND_KINDS){
    const group=input[kind]===undefined?{}:input[kind];checkObject(group);
    normalized[kind]={};
    for(const [id,item]of Object.entries(group)){
      if(!id.trim())fail();checkObject(item);
      if(Object.keys(item).some(key=>!['intimacy','combat','ranges'].includes(key)))fail();
      const record={intimacy:item.intimacy===undefined?1:item.intimacy,combat:item.combat===undefined?1:item.combat,ranges:emptyRanges()};
      for(const key of ['intimacy','combat'])if(typeof record[key]!=='number'||!Number.isFinite(record[key])||record[key]<0||record[key]>20)fail();
      const ranges=item.ranges===undefined?{}:item.ranges;checkObject(ranges);
      if(Object.keys(ranges).some(key=>!RANGE_KEYS.includes(key)))fail();
      for(const key of RANGE_KEYS){
        const range=ranges[key];
        if(range===undefined||range===null)continue;
        checkObject(range);
        if(Object.keys(range).some(key=>!['min','max'].includes(key)))fail();
        if(!Number.isSafeInteger(range.min)||!Number.isSafeInteger(range.max)||range.min<0||range.max>1e9||range.min>range.max)fail();
        record.ranges[key]={min:range.min,max:range.max};
      }
      normalized[kind][id]=record;
    }
  }
  config.backgroundModifiers=normalized;
  return normalized;
}
