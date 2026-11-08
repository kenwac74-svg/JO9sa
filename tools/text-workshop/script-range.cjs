'use strict';
// Read-only dialogue range and explicit route selection. No QSP evaluation.
const {plain}=require('./script-export.cjs');
function build(doc,h){
 const key=e=>[e.location.toLowerCase(),e.fieldIndex,e.start,e.end].join(':');
 const sceneKey=p=>p.location.toLowerCase()+':'+p.sceneId;
 const ref=e=>({...e,hash:doc.hash});
 function units(point){
  const {d,scene}=h.sceneOf(point),out=[];
  for(const item of h.collect(d,scene).items){
   if(item.kind==='array'){
    for(const st of h.stagesOf(h.pickEdition(h.arrays().get(item.array)||[],point.edition),null))out.push({variants:st.variants,stage:st.stage});
   }else if(item.kind==='direct'){
    for(const st of h.stagesOf(item.rows,null))out.push({variants:st.variants,stage:st.stage});
   }else if(item.kind==='line'){
    const text=item.entry.text;
    const onlyChoices=/<a\b/i.test(text)&&!text.replace(/<a\b[\s\S]*?<\/a>/gi,'').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,'').trim();
    if(!onlyChoices)out.push({variants:[{entry:item.entry,location:item.entry.location,conditions:item.conditions}]});
   }
   else out.push({dynamic:true,note:item.note});
  }
  return {d,scene,units:out};
 }
 function point(input){
  if(!input?.selection||typeof input.location!=='string'||typeof input.sceneId!=='string')throw Error('시작과 마무리 대사를 지정하세요.');
  const e=h.entries.find(e=>key(e)===key(input.selection));
  if(!e||e.text!==input.selection.text||input.selection.hash!==doc.hash)throw Error('대사 원문이 바뀌었습니다. 다시 선택하세요.');
  if(!h.visible(e))throw Error('화면에 표시되는 대사를 선택하세요.');
  const p={...input,selection:ref(e),edition:/woman/i.test(e.location)?'woman':input.edition==='woman'?'woman':'man'};
  const info=units(p),at=info.units.findIndex(u=>u.variants?.some(v=>key(v.entry)===key(e)));
  if(at<0)throw Error('선택한 대사가 이 장면의 현재 판본에 없습니다. 실제 사용 장면을 선택하세요.');
  return {...p,at};
 }
 function boundary(input){
  if(!['start','end'].includes(input.role))throw Error('시작 또는 마무리를 선택하세요.');
  const selected=point(input.point),list=units(selected).units;
  const indexes=list.flatMap((u,i)=>u.variants?.length?[i]:[]);
  const at=input.role==='end'?indexes.at(-1):indexes[0],unit=list[at];
  const v=unit.variants.find(v=>v.entry.location===selected.selection.location)||unit.variants[0];
  return {selected,proposed:{...selected,selection:ref(v.entry),at},needsConfirmation:selected.at!==at,position:indexes.indexOf(selected.at)+1,total:indexes.length};
 }
 function range(input){
  const start=point(input.start),end=point(input.end),choices=input.choices||{};
  if(start.edition!==end.edition)throw Error('시작과 마무리는 같은 주인공 판본에서 선택하세요.');
  if(sceneKey(start)===sceneKey(end)&&start.at===end.at&&key(start.selection)!==key(end.selection))throw Error('같은 단계의 서로 다른 조건부 대사를 시작과 마무리로 함께 지정할 수 없습니다.');
  const out=['# JO9 선택 구간 각본','# QSP: '+doc.hash,'# 시작: '+plain(start.selection.text).slice(0,100),'# 마무리: '+plain(end.selection.text).slice(0,100)];
  if(input.exportId)out.push('# 각본 ID: '+input.exportId);
  const stats={scenes:0,pages:0,choices:0,dynamic:0},map={},visited=new Set();
  let current=start,first=true,lastFork=null;
  function prompt(id,title,options){return {status:'choice',choice:{id,title,options},stats,hash:doc.hash};}
  for(let hop=0;hop<256;hop++){
   const sk=sceneKey(current);if(visited.has(sk)){if(lastFork)return prompt(lastFork.id,'이 경로는 같은 장면을 반복합니다. 다른 분기를 골라 주세요.',lastFork.options);throw Error('같은 장면을 반복하는 경로입니다. 다른 분기를 선택하세요.');}visited.add(sk);
   const info=units(current),routes=info.d.analysis.scenes.filter(s=>s.id!=='root'&&s.type!=='condition');
   const list=!first&&current.sceneId==='root'&&routes.length?[]:info.units,stop=sceneKey(end)===sk?end.at:null,from=first?start.at:0;
   if(stop!==null&&stop<from)throw Error('마무리 대사가 시작 대사보다 앞에 있습니다.');
   const sid='S'+(++stats.scenes);out.push('','==== ['+sid+'] '+info.scene.condition+' ====');
   for(let i=from;i<list.length;i++){
    const u=list[i];if(u.dynamic){stats.dynamic++;out.push('[실행 중 결정] '+u.note);continue;}
    if(!u.variants.length)continue;
    const id=sk+':page:'+i,endpoint=first&&i===start.at?start.selection:stop===i?end.selection:null;
    let chosen=endpoint?u.variants.find(v=>key(v.entry)===key(endpoint)):null;
    if(!chosen&&u.variants.length===1)chosen=u.variants[0];
    if(!chosen){
     const options=u.variants.map(v=>({id:key(v.entry),label:v.conditions?.join(' → ')||'기본문',preview:plain(v.entry.text).slice(0,220)}));
     const pick=choices[id];chosen=u.variants.find(v=>key(v.entry)===pick);
     if(!chosen)return prompt(id,'조건에 따라 대사가 갈립니다. 포함할 대사를 선택하세요.',options);
     stats.choices++;
    }
    const pid=sid+'-P'+(++stats.pages);out.push('','---- ['+pid+'] ----',plain(chosen.entry.text));map[pid]=ref(chosen.entry);
    if(stop===i)return {status:'ready',text:out.join('\n')+'\n',stats,hash:doc.hash,map};
   }
   first=false;
   // Root dispatchers require a concrete event, never export all their events.
   let options=[];
   const scenes=info.d.analysis.scenes.filter(s=>s.id!=='root'&&s.type!=='condition');
   if(current.sceneId==='root'&&scenes.length){
    options=scenes.map(s=>({id:sk+':scene:'+s.id,label:s.condition,preview:'이 이벤트로 이어가기',destination:{location:info.d.loc.name,sceneId:s.id,edition:start.edition}}));
   }else{
    const seen=new Set();
    for(const b of h.branches(info.d.analysis,info.scene,info.d.loc.name,info.d.entries)){
     if(b.mode==='condition'||b.mode==='jump'||/^#/.test(b.target||''))continue;
     for(const dest of b.destinations||[]){
      if(sceneKey(dest)===sk)continue;
      const dk=sceneKey(dest);
      if(/^(gs|gosub)$/.test(b.mode)){
       let sub;try{sub=units({...dest,edition:start.edition});}catch{continue;}
       if(!sub.units.some(u=>u.variants?.length))continue;
      }
      const label=plain(b.label||'다음 장면').replace(/\n/g,' ');
      const unique=label+'|'+dk;if(seen.has(unique))continue;seen.add(unique);
      options.push({id:String(options.length),label,preview:(b.conditions||[]).join(' → ')||dest.title||'다음 장면',destination:{...dest,edition:start.edition}});
     }
    }
   }
   if(!options.length){
    if(lastFork)return {...prompt(lastFork.id,'이 경로는 지정한 마무리에 닿지 않습니다. 다른 분기를 골라 주세요.',lastFork.options)};
    throw Error('지정한 마무리까지 이어지는 연결을 찾지 못했습니다. 연결된 이벤트의 대사를 선택해 주세요.');
   }
   const id=sk+':route';
   if(options.length>1)lastFork={id,options:options.map(({destination,...o})=>o)};
   let pick=options.length===1?options[0]:options.find(o=>o.id===choices[id]);
   if(!pick)return prompt(id,'다음 선택지·분기를 골라 주세요.',options.map(({destination,...o})=>o));
   if(options.length>1)stats.choices++;
   out.push('▶ 선택: '+pick.label);current=pick.destination;
  }
  throw Error('선택 구간이 너무 길어 중단했습니다. 마무리를 더 가까운 이벤트로 지정해 주세요.');
 }
 return {boundary,range};
}
module.exports={build};
