'use strict';
// Read-only source navigation. This module never evaluates QSP or save variables.
const core=require('./core.cjs');
const flowModule=require('./flow.cjs');
function masked(source) {
  const spans=core.literals(source,true);const chars=source.split('');
  for(const s of spans)for(let i=s.start-1;i<=s.end;i++)if(chars[i]!=='\n'&&chars[i]!=='\r')chars[i]=' ';
  let comment=false,start=0;for(let i=0;i<chars.length;i++){if(chars[i]==='\n')comment=false;if(chars[i]==='!'&&!chars.slice(start,i).join('').trim())comment=true;if(comment&&chars[i]!=='\n'&&chars[i]!=='\r')chars[i]=' ';if(/[\n&:]/.test(chars[i]))start=i+1;}
  return chars.join('');
}
// <<변수>>를 먼저 지워야 '<img src="a<<$x>>.png">' 같은 태그가 깨지지 않는다.
const clean=s=>s.replace(/<<[\s\S]*?>>/g,' ').replace(/<[^>]*>/g,' ').replace(/&[a-z]+;|&#\d+;/gi,' ').replace(/\s+/g,' ').trim();
function value(s){s=s.trim();if(/^[-+]?\d+$/.test(s))return {known:true,value:s};if((s[0]==="'"||s[0]==='"')&&s.at(-1)===s[0])return {known:true,value:s.slice(1,-1).split(s[0]+s[0]).join(s[0])};return {known:false,value:s};}
function predicate(condition) {
  const m=condition.match(/^\s*(\$?[\wа-яА-Я가-힣]+(?:\[[^\]]+\])?)\s*=\s*(.*?)\s*$/u);
  if(!m)return null;const v=value(m[2]);return v.known?{key:m[1].toLowerCase(),value:v.value}:null;
}
function analyse(location,body) {
  const safe=masked(body),rows=body.split('\n'),safeRows=safe.split('\n'),blocks=[],stack=[];let offset=0;
  for(let line=0;line<rows.length;line++){
    const original=rows[line],m=safeRows[line],head=m.match(/^\s*(if|elseif|else|act|loop|end)\b/i);
    if(head){const kind=head[1].toLowerCase();
      if(kind==='end'){
        const frame=stack.pop();if(frame?.block)frame.block.end=offset;
      }else if(kind==='else'||kind==='elseif'){
        const frame=stack.at(-1);
        if(frame?.kind==='if'){
          frame.block.end=offset;const colon=m.indexOf(':');
          const condition=kind==='else'?'그 외 (else)':original.slice(head[0].length,colon<0?original.length:colon).trim();
          const block={start:offset,end:body.length,line:line+1,condition,predicate:kind==='else'?null:predicate(condition),parents:stack.slice(0,-1).map(f=>f.block.condition),kind:'if'};
          blocks.push(block);frame.block=block;
        }
      }else{
        const colon=m.indexOf(':');
        const condition=kind==='act'?clean(core.literals(original)[0]?.text||'선택지'):original.slice(head[0].length,colon<0?original.length:colon).trim();
        const block={start:offset,end:body.length,line:line+1,condition,predicate:kind==='if'?predicate(condition):null,parents:stack.map(f=>f.block.condition),kind};
        const inline=colon>=0&&m.slice(colon+1).trim();
        if(inline){block.end=offset+original.length;blocks.push(block);}else{blocks.push(block);stack.push({kind,block});}
      }
    }
    offset+=original.length+1;
  }
  const preferred=blocks.filter(b=>b.kind==='if' && b.predicate && (b.predicate.key===location.toLowerCase()||/^\$?args\[0\]$/i.test(b.predicate.key)));
  const routes=preferred.length?preferred:blocks.filter(b=>b.kind==='if' && b.parents.length===0);
  const root={id:'root',start:0,end:body.length,line:1,condition:'전체 위치',parents:[],predicate:null};
  const scenes=[root,...routes.map(b=>({...b,id:String(b.start)})),...blocks.filter(b=>b.kind==='if'&&!routes.includes(b)).map(b=>({...b,id:'condition:'+b.start,type:'condition'}))];
  const lineStarts=[0];for(let i=0;i<body.length;i++)if(body[i]==='\n')lineStarts.push(i+1);
  return {body,safe,blocks,scenes,lineStarts};
}
function lineAt(analysis,offset){let lo=0,hi=analysis.lineStarts.length;while(lo<hi){const mid=(lo+hi)>>>1;if(analysis.lineStarts[mid]<=offset)lo=mid+1;else hi=mid;}return lo;}
function visible(e){return e.dialogue!==undefined?e.dialogue:core.isDialogue(e);}
function inScene(entry,scene){return entry.field==='desc'?scene.id==='desc':entry.start>=scene.start&&entry.start<scene.end;}
function chooseScene(analysis,entry){return analysis.scenes.filter(s=>s.id!=='root'&&s.type!=='condition'&&inScene(entry,s)).sort((a,b)=>(a.end-a.start)-(b.end-b.start))[0]||analysis.scenes[0];}
function splitArgs(source){const safe=masked(source);const out=[];let at=0,depth=0;for(let i=0;i<safe.length;i++){if(safe[i]==='('||safe[i]==='[')depth++;if(safe[i]===')'||safe[i]===']')depth--;if(safe[i]===','&&depth===0){out.push(source.slice(at,i).trim());at=i+1;}}out.push(source.slice(at).trim());return out;}
function assignments(source){const safe=masked(source),found={};const re=/(?:^|[&\n:]|\bthen\s+)\s*(\$?[\wа-яА-Я가-힣]+(?:\[[^\]]+\])?)\s*=(?!=)/gmu;let m;
  while((m=re.exec(safe))){const start=re.lastIndex;let end=start;while(end<safe.length&&!/[&\n]/.test(safe[end]))end++;const v=value(source.slice(start,end));if(v.known)found[m[1].toLowerCase()]=v.value;}
  return found;
}
function calls(source,context) {
  const safe=masked(source),out=[],re=/\b(gt|goto|xgt|gs|gosub|jump)\b/gi;let m;
  while((m=re.exec(safe))){if(!/[ \t]/.test(source[re.lastIndex]||''))continue;let start=re.lastIndex;while(/[ \t]/.test(source[start]||''))start++;let end=start;while(end<safe.length&&!/[&\n]/.test(safe[end]))end++;
    const args=splitArgs(source.slice(start,end)),target=value(args[0]||''),mode=m[1].toLowerCase();
    const current=/^\$?curloc$/i.test(target.value);
    // Only infer contiguous preceding assignments, rather than unrelated arms above.
    const preceding=source.slice(0,m.index).split('\n');const adjacent=[preceding.pop()||''];
    while(preceding.length&&adjacent.length<12){const row=preceding.pop();if(!row.trim())continue;if(!/^\s*\$?[\wа-яА-Я가-힣]+(?:\[[^\]]+\])?\s*=/u.test(row))break;adjacent.unshift(row);}
    const states=assignments(adjacent.join('\n'));
    if(context.scene?.predicate && !/^\$?args\[/i.test(context.scene.predicate.key) && states[context.scene.predicate.key]===undefined)states[context.scene.predicate.key]=context.scene.predicate.value;
    if(args[1]){const v=value(args[1]);if(v.known){states['$args[0]']=v.value;states['args[0]']=v.value;}}
    const resolved=target.known||current;
    out.push({mode,target:current?context.location:target.value,resolved,states,args:args.slice(1),offset:m.index});
  }
  return out;
}
function links(text) {
  const out=[],re=/<a\b[^>]*href\s*=\s*(["'])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(text))){if(/^exec:/i.test(m[2])){const img=m[3].match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);const label=clean(m[3])||(img?'[그림 선택지]':'선택지');out.push({code:m[2].slice(5).replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#(?:39|x27);/gi,"'"),label});}}
  return out;
}
function sceneEntries(entries,scene,mode){return entries.filter(e=>inScene(e,scene)&&(mode==='all'?e.text.trim().length>0:visible(e)));}
// 장면 코드에서 화면에 쓰이는 이미지 경로 후보(배경·장면 이미지·img 태그)를 순서대로 모은다. 존재 확인은 서버가 한다.
// 게임은 배경을 content\pic\bg\<<$bg[$place]>>.png 로 그린다. $bg['장소'] = '파일' 이름표를 qsp 전체에서 모은다.
// 값이 변수 배열이면($interior_study[$study] 등, 세이브 상태로 결정) 그 배열의 첫 값을 예시로 쓴다.
function bgTable(doc){
  const map=new Map(),arrays=new Map();
  for(const loc of doc.locations){const body=core.shift(doc.lines[loc.body],5);
    for(const m of body.matchAll(/\$bg\[\s*(['"])([^'"]+)\1\s*\]\s*=\s*(?:(['"])([^'"]*)\3|(\$[\w]+)\[)/g))if(!map.has(m[2]))map.set(m[2],m[4]!==undefined?{file:m[4]}:{array:m[5]});
    for(const m of body.matchAll(/(\$[\w]+)\[[^\]\n]*\]\s*=\s*(['"])([\w\\\/\-.]+)\2/g))if(!arrays.has(m[1]))arrays.set(m[1],m[3]);
  }
  return place=>{const v=map.get(place);if(!v)return {path:'bg\\'+place,guess:true};if(v.file!==undefined)return {path:'bg\\'+v.file};const ex=arrays.get(v.array);return ex?{path:'bg\\'+ex,example:true}:null;};
}
function imageRefs(src,bg){
  const out=[];
  for(const m of masked(src).matchAll(/\$place\s*=/gi)){const lit=core.literals(src.slice(m.index+m[0].length,m.index+m[0].length+120))[0];if(lit&&/^[\w\-]+$/.test(lit.text)){const r=bg?bg(lit.text):{path:'bg\\'+lit.text};if(r)out.push(r.example?{path:r.path,note:'예시(세이브 상태로 결정)'}:r.path);}}
  if(bg?.npc)for(const m of masked(src).matchAll(/\$npc_id\s*=/gi)){const lit=core.literals(src.slice(m.index+m[0].length,m.index+m[0].length+120))[0];if(lit){const file=bg.npc(lit.text);if(file)out.push({path:'characters\\'+file,note:'공용 화면 · NPC 이미지 이름표'});}}
  for(const l of core.literals(src)){
    const t=l.text.trim();
    for(const m of t.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"'<>]+)["']/gi))out.push(m[1]);
    if(/^[\w\-. ~가-힣]+(?:[\\\/][\w\-. ~가-힣]+)+$/u.test(t)&&/^(?:content[\\\/]pic[\\\/])?(?:bg|scene|characters|girls|mob|master|demo|SNKmod|images?)[\\\/]/i.test(t))out.push(t);
    else if(/\.(png|jpe?g|gif)$/i.test(t)&&!/[\s<>]/.test(t))out.push(t);
    if(out.length>=24)break;
  }
  return out;
}
// 장면 코드가 부르는 그림 후보(배경·장면 이미지·img 태그). 장면 안에 없으면 감싼 상위 블록에서 그 장면 앞에 정한 그림을 이어받는다. 존재 확인은 서버가 한다.
function sceneImages(analysis,scene,bg){
  if(scene.id==='root'||scene.id==='desc')return [];
  let out=imageRefs(analysis.body.slice(scene.start,scene.end),bg);
  const outer=analysis.blocks.filter(b=>b.kind==='if'&&b.start<scene.start&&b.end>=scene.end).sort((a,b)=>b.start-a.start);
  // Only the active ancestor's statements can be inherited. Completed sibling arms are not predecessors.
  for(const b of outer){
    let offset=b.start;const rows=analysis.body.slice(b.start,scene.start).split('\n');
    const active=rows.map(row=>{const here=offset;offset+=row.length+1;return analysis.blocks.some(x=>x.start>b.start&&here>=x.start&&here<x.end&&!(x.start<scene.start&&x.end>=scene.end))?'':row;}).join('\n');
    const refs=imageRefs(active,bg);
    const existingBg=out.some(r=>/^bg[\\/]/i.test(typeof r==='string'?r:r.path));
    const inherit=out.length?refs.filter(r=>!existingBg&&/^bg[\\/]/i.test(typeof r==='string'?r:r.path)):refs;
    out.push(...inherit.map(r=>typeof r==='string'?{path:r,note:'상위 조건에서 정한 그림'}:r));
  }
  const seen=new Set();return out.filter(r=>{const k=(typeof r==='string'?r:r.path).toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
}
function branchList(analysis,scene,location,entries) {
  const start=scene.start,end=scene.end,branches=[];
  function add(call,label,line,conditions,kind,sourceStart){branches.push({...call,label:label||`${call.target}로 ${/^(gs|gosub)$/.test(call.mode)?'호출':'이동'}`,line,conditions,kind,sourceStart});}
  for(const e of entries.filter(e=>inScene(e,scene))){
    for(const link of links(e.text)){
      const actualScene=scene.id==='root'?chooseScene(analysis,e):scene;
      const list=calls(link.code,{location,scene:actualScene});const conditions=analysis.blocks.filter(b=>e.start>=b.start&&e.start<b.end&&b.kind==='if').map(b=>b.condition);
      if(list.length)for(const call of list)add(call,link.label,e.line,conditions,'choice',e.start);
      else branches.push({label:link.label,mode:'dynamic',target:'실행 중 결정',resolved:false,states:{},args:[],line:e.line,conditions,kind:'choice'});
    }
  }
  for(const call of calls(analysis.body.slice(start,end),{location,scene})){
    const absolute=start+call.offset;const containing=analysis.blocks.filter(b=>absolute>=b.start&&absolute<b.end);
    const actual=chooseScene(analysis,{field:'body',start:absolute});if(actual.predicate && !/^\$?args\[/i.test(actual.predicate.key) && call.states[actual.predicate.key]===undefined)call.states[actual.predicate.key]=actual.predicate.value;
    const act=containing.find(b=>b.kind==='act');
    add(call,act?.condition,lineAt(analysis,absolute),containing.filter(b=>b.kind==='if').map(b=>b.condition),act?'choice':'call',absolute);
  }
  for(const arm of analysis.scenes.filter(s=>s.type==='condition'&&s.start>=start&&s.end<=end&&s.start!==start)){
    if(!entries.some(e=>e.field==='body'&&e.start>=arm.start&&e.start<arm.end&&visible(e)))continue;
    branches.push({label:arm.condition,mode:'condition',target:location,resolved:false,states:{},args:[],line:arm.line,conditions:arm.parents,kind:'condition',sourceStart:arm.start,destinations:[{location,sceneId:arm.id,title:arm.condition,line:arm.line}]});
  }
  const unique=new Map();for(const b of branches){const key=JSON.stringify([b.label,b.mode,b.target,b.states,b.line]);if(!unique.has(key))unique.set(key,b);}
  return [...unique.values()];
}
function buildNavigator(doc,allEntries) {
  const analyses=new Map(),locations=new Map(doc.locations.map(l=>[l.name.toLowerCase(),l]));let bgFn=null;const bg=p=>(bgFn||(bgFn=bgTable(doc)))(p);
  const npcImages=new Map(),npcBodies=new Map();for(const e of allEntries){if(e.field!=='body'||!/^#npc_base$/i.test(e.location))continue;if(!npcBodies.has(e.fieldIndex))npcBodies.set(e.fieldIndex,core.shift(doc.lines[e.fieldIndex],5));const body=npcBodies.get(e.fieldIndex),prefix=body.slice(body.lastIndexOf('\n',e.start-1)+1,e.start-1),m=prefix.match(/\$npc_image\[\s*(['"])([^'"]+)\1\s*\]\s*=\s*$/i);if(m&&e.text.trim())npcImages.set(m[2].toLowerCase(),e.text.trim());}bg.npc=id=>npcImages.get(String(id).toLowerCase());
  const byLocation=new Map();for(const e of allEntries){const key=e.location.toLowerCase();if(!byLocation.has(key))byLocation.set(key,[]);byLocation.get(key).push(e);}
  function data(name){const loc=locations.get(name.toLowerCase());if(!loc)throw Error('연결된 위치가 QSP에 없습니다.');if(!analyses.has(loc.index))analyses.set(loc.index,analyse(loc.name,core.shift(doc.lines[loc.body],5)));return {loc,analysis:analyses.get(loc.index),entries:byLocation.get(loc.name.toLowerCase())||[]};}
  function reference(e){return e?{...e,hash:doc.hash}:null;}
  function resolve(branch){
    if(!branch.resolved || branch.mode==='jump')return [];
    const loc=locations.get(branch.target.toLowerCase());if(!loc)return [];
    const d=data(loc.name);const matches=d.analysis.scenes.filter(s=>s.type!=='condition'&&s.predicate&&branch.states[s.predicate.key]===s.predicate.value);
    return (matches.length?matches:[d.analysis.scenes[0]]).map(s=>({location:loc.name,sceneId:s.id,title:s.condition,line:s.line}));
  }
  const flow=flowModule.build(doc,allEntries,{analyse,masked,chooseScene,sceneImages,bg,branches:(a,s,l,e)=>branchList(a,s,l,e).map(b=>({...b,destinations:b.destinations||resolve(b)}))});
  function context(selection,sceneId,mode,usageId){
    if(selection.hash!==doc.hash)throw Error('QSP가 바뀌었습니다. 다시 검색해 주세요.');
    const d=data(selection.location),entry=d.entries.find(e=>e.fieldIndex===selection.fieldIndex&&e.start===selection.start&&e.end===selection.end);
    if(!entry || entry.text!==selection.text)throw Error('선택한 원문 위치가 바뀌었습니다.');
    const scene=entry.field==='desc'?{id:'desc',start:0,end:0,line:1,condition:'위치 설명',parents:[]}:sceneId?d.analysis.scenes.find(s=>s.id===sceneId):chooseScene(d.analysis,entry);
    if(!scene)throw Error('장면 범위를 찾지 못했습니다.');
    const texts=sceneEntries(d.entries,scene,mode);if(!texts.includes(entry))texts.push(entry);texts.sort((a,b)=>a.fieldIndex-b.fieldIndex||a.start-b.start);
    const at=texts.indexOf(entry);const from=Math.max(0,at-15),to=Math.min(texts.length,at+16);
    const branches=scene.id==='desc'?[]:branchList(d.analysis,scene,d.loc.name,d.entries).map(b=>({...b,destinations:b.destinations||resolve(b)}));
    const lines=d.analysis.body.split('\n');const lineStart=Math.max(scene.line-1,entry.line-9),lineEnd=Math.min(lines.length,entry.line+8);
    const result={hash:doc.hash,mode:mode==='all'?'all':'text',location:d.loc.name,scene:{id:scene.id,title:scene.condition,conditions:scene.parents||[],line:scene.line},images:sceneImages(d.analysis,scene,bg),screen:sceneEntries(d.entries,scene,'text').slice(0,60).map(reference),selection:reference(entry),previous:reference(texts[at-1]),next:reference(texts[at+1]),ordinal:at+1,total:texts.length,texts:texts.slice(from,to).map(reference),branches:branches.slice(0,150),branchTotal:branches.length,source:lines.slice(lineStart,lineEnd).map((s,i)=>`${lineStart+i+1}: ${s}`).join('\n')};
    return mode==='all'?result:flow.extend(result,entry,usageId);
  }
  function open(destination,mode){
    const d=data(destination.location),scene=d.analysis.scenes.find(s=>s.id===destination.sceneId);if(!scene)throw Error('이 장면을 찾지 못했습니다.');
    const texts=sceneEntries(d.entries,scene,mode);const entry=texts[0]||(mode==='all'?d.entries.find(e=>inScene(e,scene)):null);
    if(!entry)return {empty:true,hash:doc.hash,mode:mode==='all'?'all':'text',location:d.loc.name,scene:{id:scene.id,title:scene.condition,conditions:scene.parents||[]},images:sceneImages(d.analysis,scene,bg),screen:[],branches:branchList(d.analysis,scene,d.loc.name,d.entries).map(b=>({...b,destinations:b.destinations||resolve(b)})),source:d.analysis.body.slice(scene.start,Math.min(scene.end,scene.start+6000))};
    return context(reference(entry),scene.id,mode);
  }
  let incomingIndex=null;
  function incoming(input){
    if(input.hash!==doc.hash)throw Error('QSP가 바뀌었습니다. 다시 검색해 주세요.');
    const destination=data(input.location),scene=destination.analysis.scenes.find(s=>s.id===input.sceneId);
    if(!scene) return {total:0,items:[]};
    if(!incomingIndex){incomingIndex=new Map();for(const loc of doc.locations){const d=data(loc.name);for(const b of branchList(d.analysis,d.analysis.scenes[0],loc.name,d.entries)){
      if(!b.resolved||b.mode==='jump')continue;const source=chooseScene(d.analysis,{field:'body',start:b.sourceStart});
      const target=b.target.toLowerCase();if(!incomingIndex.has(target))incomingIndex.set(target,[]);
      incomingIndex.get(target).push({...b,source:{location:loc.name,sceneId:source.id,title:source.condition,line:source.line}});
    }}}
    const found=(incomingIndex.get(input.location.toLowerCase())||[]).filter(b=>{
      if(b.source.location===destination.loc.name&&b.source.sceneId===scene.id)return false;
      return !scene.predicate || b.states[scene.predicate.key]===undefined || b.states[scene.predicate.key]===scene.predicate.value;
    });
    found.sort((a,b)=>Number(!!scene.predicate&&a.states[scene.predicate.key]===undefined)-Number(!!scene.predicate&&b.states[scene.predicate.key]===undefined));
    return {total:found.length,items:found.slice(0,80).map(b=>({label:b.label,mode:b.mode,line:b.line,conditions:b.conditions,source:b.source,uncertain:!!scene.predicate && b.states[scene.predicate.key]===undefined}))};
  }
  return {context,open,incoming};
}
module.exports={analyse,masked,predicate,assignments,calls,links,buildNavigator,sceneImages,bgTable};
