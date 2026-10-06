'use strict';
// Static bindings, never QSP execution or save-variable evaluation.
const core=require('./core.cjs');
const norm=s=>s.toLowerCase();
function binding(body,e){
  const prefix=body.slice(Math.max(body.lastIndexOf('\n',e.start-1)+1,0),e.start-1);
  const m=prefix.match(/(\$[\w]+)\[\s*(\d+)\s*\]\s*=\s*$/i);
  return m?{array:norm(m[1]),stage:Number(m[2])}:null;
}
function conditions(a,offset){return a.blocks.filter(b=>b.kind==='if'&&offset>=b.start&&offset<b.end).map(b=>b.condition);}
function build(doc,entries,helpers){
  const byLoc=new Map(),memo=new Map(),usageMemo=new Map();
  for(const e of entries){if(!byLoc.has(e.location))byLoc.set(e.location,[]);byLoc.get(e.location).push(e);}
  function data(loc){if(!memo.has(loc.name)){const body=core.shift(doc.lines[loc.body],5);memo.set(loc.name,{body,a:helpers.analyse(loc.name,body),entries:byLoc.get(loc.name)||[]});}return memo.get(loc.name);}
  function usages(array){
    if(usageMemo.has(array))return usageMemo.get(array);
    const found=[];
    for(const loc of doc.locations){const d=data(loc);
      // Parse literal arguments only where a real copyarr command appears outside strings/comments.
      for(const m of helpers.masked(d.body).matchAll(/\bcopyarr\s+/gi)){
        const tail=d.body.slice(m.index,d.body.indexOf('\n',m.index)<0?d.body.length:d.body.indexOf('\n',m.index));
        const args=core.literals(tail);if(norm(args[0]?.text||'')!=='$text'||norm(args[1]?.text||'')!==array)continue;
        const scene=helpers.chooseScene(d.a,{field:'body',start:m.index});
        const id=loc.name+':'+scene.id;
        if(!found.some(x=>x.id===id))found.push({id,location:loc.name,sceneId:scene.id,title:scene.condition,line:scene.line,d,scene});
      }
    }
    // NPC dialogue is copied by the shared result location through a name
    // template ($<<$npc_id>>_pref). Resolve only literal NPC assignments.
    const npcFamily=array.match(/^\$(.+)_(pref|otkaz)$/i);
    if(npcFamily){
      const template='$<<$npc_id>>_'+npcFamily[2];
      const hasTemplate=doc.locations.some(loc=>{const d=data(loc);return [...helpers.masked(d.body).matchAll(/\bcopyarr\s+/gi)].some(m=>{const tail=d.body.slice(m.index,d.body.indexOf('\n',m.index)<0?d.body.length:d.body.indexOf('\n',m.index)),args=core.literals(tail);return norm(args[0]?.text||'')==='$text'&&norm(args[1]?.text||'')===template;});});
      if(hasTemplate)for(const loc of doc.locations){
        if(loc.name.startsWith('#'))continue;
        const d=data(loc);
        for(const e of d.entries){const prefix=d.body.slice(d.body.lastIndexOf('\n',e.start-1)+1,e.start-1);if(!/\$npc_id\s*=\s*$/i.test(prefix)||norm(e.text)!==npcFamily[1])continue;
          const scene=helpers.chooseScene(d.a,e);if(scene.id==='root')continue;
          const code=d.body.slice(scene.start,scene.end);
          if(!/\$interaction_type\s*=\s*['"]byer_invitation['"]/i.test(code))continue;
          const id=loc.name+':'+scene.id;if(!found.some(x=>x.id===id))found.push({id,location:loc.name,sceneId:scene.id,title:scene.condition,line:scene.line,d,scene});
        }
      }
    }
    usageMemo.set(array,found);return found;
  }
  const ref=e=>({...e,hash:doc.hash});
  function extend(base,entry,usageId){
    if(entry.field!=='body')return base;
    const loc=doc.locations[entry.locationIndex],d=data(loc),bind=binding(d.body,entry);
    if(!bind)return {...base,flow:{kind:'source',stages:base.texts.map((e,i)=>({number:i+1,variants:[{entry:e,conditions:conditions(d.a,e.start)}]})),selected:base.ordinal}};
    // $text is reused by every event in the same location. Its assignments
    // belong to the selected event, not to one global dialogue family.
    const direct=bind.array==='$text',scope=helpers.chooseScene(d.a,entry);
    const family=d.entries.filter(e=>e.dialogue&&binding(d.body,e)?.array===bind.array&&(!direct||helpers.chooseScene(d.a,e).id===scope.id));
    const grouped=new Map();for(const e of family){const b=binding(d.body,e);if(!grouped.has(b.stage))grouped.set(b.stage,[]);grouped.get(b.stage).push({entry:ref(e),conditions:conditions(d.a,e.start)});}
    const common=conditions(d.a,family[0]?.start||entry.start).filter(c=>family.every(e=>conditions(d.a,e.start).includes(c)));
    const stages=[...grouped].sort((a,b)=>a[0]-b[0]).map(([number,variants])=>({number,variants:variants.map(v=>({...v,conditions:v.conditions.filter(c=>!common.includes(c)),overrides:variants.length>1&&v.entry.start!==variants[0].entry.start}))}));
    const contexts=direct?[{id:loc.name+':'+scope.id,location:loc.name,sceneId:scope.id,title:scope.condition,line:scope.line,d,scene:scope}]:usages(bind.array),use=contexts.find(u=>u.id===usageId)||contexts[0];
    const stageAt=stages.findIndex(s=>s.number===bind.stage),images=[];
    if(use){
      for(const e of use.d.entries){const b=binding(use.d.body,e);if(!b||b.array!=='$special_image'||b.stage!==bind.stage||e.start<use.scene.start||e.start>=use.scene.end)continue;
        const line=use.d.body.slice(use.d.body.lastIndexOf('\n',e.start)+1,use.d.body.indexOf('\n',e.end)<0?use.d.body.length:use.d.body.indexOf('\n',e.end));
        images.push({path:e.text,note:conditions(use.d.a,e.start).filter(c=>c!==use.scene.condition&&!use.scene.parents.includes(c)).join(' · '),random:/\brand\s*\(|picmax\s*\[/i.test(line)});
      }
      // Retain backdrop metadata, but never another stage's $special_image.
      const backdrop={...use.d.a,body:use.d.body.replace(/^.*\$special_image.*$/gm,row=>' '.repeat(row.length))};
      images.push(...helpers.sceneImages(backdrop,use.scene,helpers.bg));
    }
    const flow={kind:'array',array:bind.array,selected:bind.stage,stages,usage:use?{id:use.id,location:use.location,sceneId:use.sceneId,title:use.title}:null,usages:contexts.map(({id,location,title,line})=>({id,location,title,line})),unresolved:!use};
    const prev=stages[stageAt-1]?.variants[0]?.entry,next=stages[stageAt+1]?.variants[0]?.entry;
    const branches=use?helpers.branches(use.d.a,use.scene,use.location,use.d.entries):[];
    return {...base,flow,images,branches,branchTotal:branches.length,screen:stages.flatMap(s=>s.variants.map(v=>v.entry)),texts:stages.flatMap(s=>s.variants.map(v=>v.entry)),previous:prev||null,next:next||null,ordinal:stageAt+1,total:stages.length};
  }
  return {extend};
}
module.exports={build,binding,conditions};
