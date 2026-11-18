'use strict';
// Read-only scalar page assembly. Never executes a choice or evaluates save data.
const core=require('./core.cjs'),imageReference=require('./image-reference.cjs');
const ident='\\$?[\\wа-яА-Я가-힣]+';
function scalar(body,e){const prefix=body.slice(body.lastIndexOf('\n',e.start-1)+1,e.start-1),m=prefix.match(/(\$[\w]+)\s*=\s*$/);return m?.[1].toLowerCase();}
function build(doc,entries,h){
 const models=new Map(),byLoc=new Map();for(const e of entries){if(!byLoc.has(e.location))byLoc.set(e.location,[]);byLoc.get(e.location).push(e);}
 const ref=e=>({...e,hash:doc.hash});
 function model(location){
  if(models.has(location))return models.get(location);models.set(location,null);
  const loc=doc.locations.find(l=>l.name===location);if(!loc)return null;
  const body=core.shift(doc.lines[loc.body],5);
  if(!/^\s*\$text\s*=\s*[^\r\n]*\+\s*\$\w+/m.test(body)||(body.match(/\$text\s*=(?!=)/g)||[]).length>40)return null;
  const a=h.analyse(location,body),es=(byLoc.get(location)||[]).filter(e=>e.field==='body');
  const aliases=new Map();for(const m of h.masked(body).matchAll(new RegExp('^\\s*('+ident+')\\s*=\\s*('+ident+')\\s*\\r?$','gmu'))){const key=m[1].toLowerCase(),value=m[2].toLowerCase();if(aliases.has(key)&&aliases.get(key)!==value)aliases.set(key,null);else if(!aliases.has(key))aliases.set(key,value);}
  // Mask the whole location so quoted continuation lines cannot become code.
  // Ignore literal-internal newlines only when locating the end of an output.
  const statementChars=a.safe.split('');
  for(const literal of core.literals(body,true))for(let i=literal.start-1;i<=literal.end;i++)if(/[\r\n]/.test(statementChars[i]||''))statementChars[i]=' ';
  const statementSafe=statementChars.join(''),outputs=[];
  for(const m of statementSafe.matchAll(/\$text\s*=(?!=)/gi)){
   const outputStart=m.index,rhs=outputStart+m[0].length,stop=statementSafe.slice(rhs).search(/[&\r\n]/),outputEnd=stop<0?body.length:rhs+stop;
   const owner=a.blocks.filter(b=>b.kind==='if'&&b.start<=outputStart&&b.end>outputStart).sort((x,y)=>y.start-x.start)[0];
   if(owner){const scope=a.scenes.find(s=>s.start===owner.start&&s.id!=='root'),refs=[...statementSafe.slice(rhs,outputEnd).matchAll(/\$\w+/g)];
    const scopedRef=e=>({...ref(e),conditions:a.blocks.filter(b=>b.kind==='if'&&b.start>owner.start&&e.start>=b.start&&e.start<b.end).map(b=>b.condition)});
    const parts=refs.flatMap(token=>{const key=token[0].toLowerCase(),family=es.filter(e=>scalar(body,e)===key&&e.start>=owner.start&&e.end<outputStart);const first=family.find(e=>h.links(e.text).length)||family[0],base={key,position:rhs+token.index,entry:first?scopedRef(first):null,alternatives:family.filter(e=>e!==first).map(scopedRef),choice:!!first&&h.links(first.text).length>0};
     const appended=es.filter(e=>e.start>=owner.start&&e.end<outputStart&&e.text.includes('data-jo9-choice=')&&body.slice(body.lastIndexOf('\n',e.start-1)+1,e.start-1).match(/(\$[\w]+)\s*\+=\s*$/)?.[1].toLowerCase()===key);
     return [base,...appended.map((e,i)=>({key:key+':choice:'+e.start,position:base.position+(i+1)/(appended.length+1),entry:scopedRef(e),alternatives:[],choice:true,addedChoice:true}))];});
    const direct=es.filter(e=>e.start>=rhs&&e.end<outputEnd&&e.dialogue);parts.push(...direct.map(e=>({position:e.start,entry:ref(e),alternatives:[],choice:h.links(e.text).length>0})));
    // A literal $text result can itself receive choices after its assignment.
    const nextWrite=statementSafe.slice(outputEnd,owner.end).search(/\$text\s*=(?!=)/i),appendEnd=nextWrite<0?owner.end:outputEnd+nextWrite;
    if(direct.length)for(const e of es.filter(e=>e.start>outputEnd&&e.end<appendEnd&&e.text.includes('data-jo9-choice=')&&/\$text\s*\+=\s*$/i.test(body.slice(body.lastIndexOf('\n',e.start-1)+1,e.start-1))))parts.push({position:e.start,entry:scopedRef(e),alternatives:[],choice:true,addedChoice:true});
    parts.sort((a,b)=>a.position-b.position);
    outputs.push({offset:outputStart,owner,scope,parts,direct});
   }
  }
  const menus=outputs.filter(o=>o.parts.filter(p=>p.choice&&!p.addedChoice).length>=2);
  // Ambiguous or unrelated scalar writes retain the existing source navigator.
  if(menus.length!==1||outputs.some(o=>!o.scope)||outputs.length>40)return null;
  const menu=menus[0],outer=a.blocks.find(b=>b.predicate&&/^\$?args\[0\]$/i.test(b.predicate.key)&&b.start<=menu.offset&&b.end>menu.offset);
  if(!outer)return null;
  const pages=outputs.filter(o=>o===menu||o.parts.some(p=>p.entry)).map((o,i)=>({number:i+1,sceneId:o.scope.id,title:o===menu?'선택지 페이지':'결과 페이지',parts:o.parts,variants:o.parts.flatMap(p=>[p.entry,...p.alternatives]).filter(Boolean).map(entry=>({entry,conditions:entry.conditions||[]})),scope:o.scope,owner:o.owner,menu:o===menu,images:h.sceneImages(a,o.scope,h.bg)}));
  if(pages.length<2||pages.some(p=>!p.variants.length))return null;
  const menuPage=pages.find(p=>p.menu);
  // Scalar pages use the branch-local $bg_path stem; expose the exact source
  // instead of presenting it as an unbound/new array-image slot.
  for(const p of pages){
   const explicit=es.filter(e=>e.start>=p.scope.start&&e.end<p.scope.end&&scalar(body,e)==='$bg_path');
   const editable=[],claimed=new Set();
   for(const e of explicit){
    const lineEnd=body.indexOf('\n',e.end),suffix=body.slice(e.end+1,lineEnd<0?body.length:lineEnd);
    if(suffix.trim())continue;
    try{imageReference.imagePath(e.text+'.png');}catch{continue;}
    claimed.add(e.text.replaceAll('\\','/').toLowerCase());
    const reference=imageReference.describe(body,e);if(reference?.role==='fallback')continue;
    const conditions=a.blocks.filter(b=>b.kind==='if'&&e.start>=b.start&&e.start<b.end).map(b=>b.condition).filter(c=>!reference?.meta.conditions||c!==imageReference.conditionExpression(reference.meta.conditions));
    editable.push({path:e.text,source:ref(e),reference:reference?{fallback:reference.meta.fallback+'.png',conditions:reference.meta.conditions}:null,note:conditions.join(' · ')});
   }
   if(editable.length)p.images=[...editable,...p.images.filter(im=>!claimed.has((typeof im==='string'?im:im.path).replaceAll('\\','/').toLowerCase()))];
  }
  function destination(branch){
   if(!branch.resolved||branch.target.toLowerCase()!==location.toLowerCase()||!['gt','goto','xgt'].includes(branch.mode))return branch.destinations||[];
   const states={...branch.states};for(let n=0;n<aliases.size;n++)for(const [key,value]of aliases)if(value&&states[value]!==undefined&&states[key]===undefined)states[key]=states[value];
   const results=pages.filter(p=>!p.menu),matches=results.filter(p=>p.owner.predicate&&states[p.owner.predicate.key]===p.owner.predicate.value);
   if(!matches.length){for(const p of results.filter(p=>/^\s*else\b/i.test(body.slice(p.owner.start,body.indexOf('\n',p.owner.start))))){
    // An invisible or unsupported arm still blocks an else. Inspect the
    // complete contiguous if/elseif chain, rather than visible result pages.
    const prior=[];let cursor=p.owner.start,complete=false;
    for(let n=0;n<a.blocks.length;n++){
     const arm=a.blocks.filter(x=>x.kind==='if'&&x.end===cursor&&x.start<cursor&&JSON.stringify(x.parents)===JSON.stringify(p.owner.parents)).sort((x,y)=>y.start-x.start)[0];
     if(!arm)break;prior.unshift(arm);cursor=arm.start;
     if(/^\s*if\b/i.test(body.slice(arm.start,body.indexOf('\n',arm.start)))){complete=true;break;}
    }
    if(complete&&prior.length&&prior.every(x=>x.predicate&&states[x.predicate.key]!==undefined&&states[x.predicate.key]!==x.predicate.value))matches.push(p);
   }}
   if(matches.length!==1)return branch.destinations||[];
   const p=matches[0];return [{location,sceneId:p.sceneId,title:p.title,line:p.scope.line,staticChoice:true}];
  }
  for(const p of pages){
   const allowed=new Set(p.parts.flatMap(x=>[x.entry,...x.alternatives]).filter(e=>e&&h.links(e.text).length).map(e=>e.start));
   p.branches=h.branches(a,p.scope,location,es).filter(b=>b.kind==='choice'&&allowed.has(b.sourceStart)).map(b=>({...b,destinations:destination(b)}));
  }
  for(const [i,part]of menuPage.parts.filter(p=>p.choice).entries())for(const entry of [part.entry,...part.alternatives]){
   const branch=menuPage.branches.find(b=>b.sourceStart===entry.start),p=pages.find(p=>p.sceneId===branch?.destinations[0]?.sceneId);
   if(p&&(entry===part.entry||p.title==='결과 페이지'))p.title=(i+1)+'번 '+(entry===part.entry?'선택 결과':'조건 선택 결과');
  }
  const result={pages,menu:menuPage};models.set(location,result);return result;
 }
 function extend(base,entry){
  if(entry.field!=='body')return null;const m=model(entry.location);if(!m)return null;
  const page=m.pages.find(p=>p.variants.some(v=>v.entry.start===entry.start&&v.entry.fieldIndex===entry.fieldIndex));if(!page)return null;
  const stages=m.pages.map(({scope,owner,branches,...p})=>p),primary=page.parts.map(p=>p.entry).filter(Boolean);
  const usage={id:entry.location+':'+page.sceneId,location:entry.location,sceneId:page.sceneId,title:page.title};
  return {...base,scene:{id:page.sceneId,title:page.title,conditions:page.scope.parents||[],line:page.scope.line},flow:{kind:'pages',selected:page.number,stages,menu:m.menu.number,usage,usages:[usage]},images:page.images,screen:primary,texts:page.variants.map(v=>v.entry),branches:page.branches,branchTotal:page.branches.length,previous:page.menu?null:m.menu.variants[0].entry,next:null,ordinal:page.number,total:stages.length};
 }
 return {extend};
}
module.exports={build};
