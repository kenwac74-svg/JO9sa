'use strict';
// JO9 MOD START FEMALE_TEXT_WORK_SCOPE_20261118
// Editor work scope only. The game document and all prose remain intact.
const guards=require('./work-scope-guards.cjs');
const OWNED=new Set(['hero_customization_woman','#npc_base_woman','$illness_risk_woman','$pregnancy_female','#sex_options_woman','#sex_texts_woman','sex_screen_woman','sex_interaction_woman','sex_interaction_result_woman','female_pregant_end2','female_pregant_end','#txt_woman','#txt_2_woman']);
const ALIASES=new Set(['$woman_dosug_options','$black_bazar_woman_options','$scroll_heroes_woman','$scroll_heroes_woman_back','$female_virginity','$female_vaginal_modification','$female_boobs_modification','$female_age_name','$female_boobs','$female_anal_description','$pregnant_female_taken','$female_chestbuster']);
const MASTER=new Set(['$master_base_name','$hero_description','$hero_difficulty','$master_version_stats','$clear_ava_path','$sepia_ava_path']);
// Partial inbound ownership audit: these are review candidates, never a proof
// of female ownership. Use scene predicates, not stale line/character offsets.
const REVIEW_CITY=new Set([10420,10421,10422,10423,10424,10425,104251,10426,10427,10428,10429,10430,10431,10432,10433,10434,104341,104342,104343,10435,104351,104352,104353,634,6340,6332,6333,6334,6335,63351,63352]);
const cache=new WeakMap(),GENERAL=Object.freeze({category:'general',reasons:[]});
const key=e=>`${e.fieldIndex}:${e.start}:${e.end}`;
const include=options=>options?.includeFemale===true;
function positive(tree,predicate){
 if(tree.kind==='unknown')return predicate(tree.expression);
 if(tree.kind==='and')return tree.children.some(t=>positive(t,predicate));
 if(tree.kind==='or')return tree.children.length>0&&tree.children.every(t=>positive(t,predicate));
 return false;
}
const femaleState=expression=>/^female\s*\[\s*['"](?:pregnant|parasite)['"]\s*\]\s*>\s*0\s*$/i.test(expression)||/^female_(?:abortion|insidous_abortion)\s*=\s*1\s*$/i.test(expression);
const reviewScene=expression=>{const m=/^interaction_city\s*=\s*(\d+)\s*$/i.exec(expression);return Boolean(m&&REVIEW_CITY.has(Number(m[1])));};
function prefix(body,entry,core){const text=body.slice(body.lastIndexOf('\n',entry.start-1)+1,entry.start-1),chars=text.split('');for(const e of core.literals(text,true))for(let i=Math.max(0,e.start-1);i<=e.end;i++)chars[i]=' ';return chars.join('').trim().replace(/\s+/g,' ');}
function definitions(body,core,femaleIds){
 const chars=body.split(''),logical=body.split('');
 for(const e of core.literals(body,true))for(let i=Math.max(0,e.start-1);i<=e.end;i++){logical[i]=' ';if(chars[i]!=='\n'&&chars[i]!=='\r')chars[i]=' ';}
 const masked=chars.join(''),logicalSource=logical.join(''),out=[];
 const assignment=/(\$[\p{L}_][\p{L}\p{N}_]*)(?:\[[ \t]*(\d+)[ \t]*\])?[ \t]*=[ \t]*/gu;
 for(const m of masked.matchAll(assignment)){
  const name=m[1].toLowerCase(),index=m[2]===undefined?null:Number(m[2]);
  if(!ALIASES.has(name)&&!(MASTER.has(name)&&femaleIds.includes(index)))continue;
  let end=m.index+m[0].length,uncertain=false;
  if(masked[end]==='{'){let depth=1;for(end++;end<masked.length&&depth;end++){if(masked[end]==='{')depth++;else if(masked[end]==='}')depth--;}uncertain=depth!==0;}
  else{const nl=logicalSource.indexOf('\n',end),amp=logicalSource.indexOf('&',end);end=Math.min(nl<0?body.length:nl,amp<0?body.length:amp);}
  out.push({start:m.index,end,name,index,uncertain});
 }
 return out;
}
function annotate(doc,entries){
 let memo=cache.get(doc);
 if(!memo||memo.hash!==doc.hash||memo.lines.length!==doc.lines.length||memo.lines.some((line,i)=>line!==doc.lines[i])){
  const core=require('./core.cjs'),by=new Map(),protection=new Map(),master=doc.locations.find(l=>l.name.toLowerCase()==='#masters_base');
  const masterBody=master?core.shift(doc.lines[master.body],5):'';
  const ids=[...new Set([...masterBody.matchAll(/\$master_base_name\[\s*(\d+)\s*\]\s*=/gi)].map(m=>Number(m[1])))];
  const maleIds=ids.filter(n=>n>0&&n<=100),femaleIds=ids.filter(n=>n>100);
  const model={maleIds:maleIds.length?maleIds:Array.from({length:18},(_,i)=>i+1),femaleIds:femaleIds.length?femaleIds:Array.from({length:24},(_,i)=>i+101)};
  const byField=new Map();for(const e of entries){if(!byField.has(e.fieldIndex))byField.set(e.fieldIndex,[]);byField.get(e.fieldIndex).push(e);}
  for(const loc of doc.locations){
   if(OWNED.has(loc.name.toLowerCase())){for(const f of [loc.desc,loc.body]){const source=core.shift(doc.lines[f],5);for(const e of byField.get(f)||[]){by.set(key(e),{category:'female',reasons:['female-owned-location']});protection.set(key(e),prefix(source,e,core));}}continue;}
   const body=core.shift(doc.lines[loc.body],5),source=byField.get(loc.body)||[];
   if(!/hero_choice|female\s*\[|female_(?:abortion|insidous_abortion)|\$master_|\$hero_|\$clear_ava_path|\$sepia_ava_path|\$woman_dosug_options|\$black_bazar_woman_options|\$scroll_heroes_woman|\$female_|\$pregnant_female_taken|interaction_city/i.test(body))continue;
   const spans=definitions(body,core,model.femaleIds),annotated=guards.annotate(body,source,model);
   for(const e of annotated.annotations){
    const reasons=[],trees=e.conditions.map(c=>guards.expressionTree(c.expression)),owner=spans.find(d=>e.start>d.start&&e.end<d.end);
    if(e.guardClassification.femaleOnly)reasons.push('female-only-effective-guard');
    if(owner&&!owner.uncertain)reasons.push(ALIASES.has(owner.name)?'female-owned-definition':'female-master-index');
    if(!e.uncertainties.length&&trees.some(t=>positive(t,femaleState)))reasons.push('positive-female-player-state');
    if(reasons.length){by.set(key(e),{category:'female',reasons});protection.set(key(e),[prefix(body,e,core),e.conditions.map(c=>c.expression)]);continue;}
    const review=[];
    if(/\bhero_choice\b/i.test(e.text))review.push('embedded-hero-condition');
    if(e.conditions.some(c=>/\bhero_choice\b/i.test(c.expression))&&e.guardClassification.classification!=='proven-male-only')review.push('shared-or-unresolved-hero-guard');
    if(trees.some(t=>positive(t,femaleState)))review.push('uncertain-female-state-scope');
    if(loc.name.toLowerCase()==='interaction_city'&&trees.some(t=>positive(t,reviewScene)))review.push('partial-scene-ownership-audit');
    if(owner?.uncertain)review.push('unclosed-owned-definition');
    if(review.length){by.set(key(e),{category:'review',reasons:review});protection.set(key(e),[prefix(body,e,core),e.conditions.map(c=>c.expression)]);}
   }
  }
  memo={hash:doc.hash,lines:doc.lines.slice(),by,protection,model};cache.set(doc,memo);
 }
 return entries.map(e=>({...e,workScope:memo.by.get(key(e))||GENERAL}));
}
function allowed(entry,options={}){return include(options)||entry?.workScope?.category!=='female'&&(!options.automatic||entry?.workScope?.category!=='review');}
function filter(entries,options={}){return entries.filter(e=>allowed(e,options));}
function summary(entries,options={}){return {includeFemale:include(options),excludedFemale:include(options)?0:entries.filter(e=>e.workScope?.category==='female').length,excludedReview:include(options)||!options.automatic?0:entries.filter(e=>e.workScope?.category==='review').length};}
function assertEntry(entry,options={}){if(!allowed(entry,{...options,automatic:true}))throw Error('여주인공 전용 또는 확인이 필요한 혼합 원문은 기본 작업 대상에서 제외됩니다. ‘여주인공 전용 제외’ 체크를 해제한 뒤 다시 선택하세요.');}
function assertSelection(doc,selection,options={}){if(selection?.hash!==doc.hash)throw Error('검색 이후 QSP가 변경되었습니다. 다시 검색해 주세요.');const core=require('./core.cjs'),entry=core.entries(doc).find(e=>e.fieldIndex===selection.fieldIndex&&e.start===selection.start&&e.end===selection.end&&e.text===selection.text);if(!entry)throw Error('선택한 원문 위치가 달라졌습니다. 다시 검색해 주세요.');assertEntry(entry,options);return entry;}
// Page insertion/choice/image editing can touch related strings. Compare the
// protected literal sequence in each changed field, including original guard
// context. This permits ordinary offset shifts without silently changing an
// excluded branch or its condition. All failures occur before the transaction.
function assertPrepared(doc,prepared,options={}){
 if(include(options))return;
 const core=require('./core.cjs'),next=core.parse(prepared.raw),oldEntries=core.entries(doc),newEntries=core.entries(next);
 const signature=(document,e)=>[e.quote,e.text,e.workScope.category,e.workScope.reasons,cache.get(document)?.protection.get(key(e))];
 for(let field=0;field<doc.lines.length;field++)if(doc.lines[field]!==next.lines[field]){
  const a=oldEntries.filter(e=>e.fieldIndex===field&&!allowed(e,{automatic:true})).map(e=>signature(doc,e)),b=newEntries.filter(e=>e.fieldIndex===field&&!allowed(e,{automatic:true})).map(e=>signature(next,e));
  if(JSON.stringify(a)!==JSON.stringify(b))throw Error('변경 범위에 기본 작업 대상에서 제외한 여주인공 전용 또는 확인 필요 원문이 포함됩니다. ‘여주인공 전용 제외’ 체크를 해제한 뒤 다시 미리보기를 만드세요.');
 }
}
module.exports={annotate,allowed,filter,summary,assertEntry,assertSelection,assertPrepared,include};
// JO9 MOD END FEMALE_TEXT_WORK_SCOPE_20261118
