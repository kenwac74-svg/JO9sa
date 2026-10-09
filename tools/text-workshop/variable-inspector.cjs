'use strict';
// Source inspection only: this module never evaluates QSP or reads a save.
const core=require('./core.cjs'),scenes=require('./scenes.cjs');
const WORDS=new Set(('if elseif else end then and or not mod local set let act loop while step to for dynamic dyneval gs gosub gt goto xgt jump exit return copyarr killvar killall delact cla clr cls clear close play view msg wait exec true false').split(' '));
const IDENT=/\$?[\p{L}_][\p{L}\p{N}_]*/gu;
const base=name=>name.replace(/\[.*$/s,'').trim().toLowerCase();
const short=code=>code.length>800?code.slice(0,800)+'…':code;
const unique=list=>[...new Map(list.map(x=>[x.toLowerCase(),x])).values()];
function bracketEnd(safe,start){let depth=0;for(let i=start;i<safe.length;i++){if(safe[i]==='[')depth++;else if(safe[i]===']'&&!--depth)return i+1;}return -1;}
function variables(code,safeOverride){
 // Statement slices may start/end inside a multiline literal. Reuse the
 // complete source's mask instead of lexing an incomplete quoted fragment.
 const safe=safeOverride===undefined?scenes.masked(code):safeOverride,found=[];let m;
 IDENT.lastIndex=0;
 while((m=IDENT.exec(safe))){
  if(m.index&&/[\p{L}\p{N}_$]/u.test(safe[m.index-1]))continue;
  const word=m[0];if(WORDS.has(word.toLowerCase()))continue;
  let next=IDENT.lastIndex;while(/[ \t]/.test(safe[next]||''))next++;
  if(safe[next]==='(')continue; // Function names are not state variables.
  if(safe[next]==='['){const end=bracketEnd(safe,next);if(end>0)found.push(code.slice(m.index,end).trim());else found.push(word);}
  else found.push(word);
 }
 return unique(found);
}
function interpolations(text){
 const result=[];
 for(let i=0;i<text.length;i++){
  if(!text.startsWith('<<',i))continue;
  const start=i;let quote='',end=-1;i+=2;
  for(;i<text.length;i++){
   const ch=text[i];
   if(quote){if(ch===quote){if(text[i+1]===quote)i++;else quote='';}continue;}
   if(ch==='"'||ch==="'"){quote=ch;continue;}
   if(text.startsWith('>>',i)){end=i+2;break;}
  }
  if(end<0)break;
  const code=text.slice(start,end);result.push({code,variables:variables(code.slice(2,-2))});i=end-1;
 }
 return [...new Map(result.map(x=>[x.code,x])).values()];
}
function braces(safe){const stack=[],out=[];for(let i=0;i<safe.length;i++){if(safe[i]==='{')stack.push(i);else if(safe[i]==='}'&&stack.length){const start=stack.pop();if(!stack.length)out.push([start,i+1]);}}if(stack.length)out.push([stack[0],safe.length]);return out;}
function statements(body,safe){
 const out=[];let start=0,depth=0;
 for(let i=0;i<safe.length;i++){
  if(/[\[(]/.test(safe[i]))depth++;
  if(/[\])]/.test(safe[i]))depth=Math.max(0,depth-1);
  if(!depth&&/[\n&:]/.test(safe[i])){out.push({start,end:i,code:body.slice(start,i),safe:safe.slice(start,i)});start=i+1;}
 }
 out.push({start,end:body.length,code:body.slice(start),safe:safe.slice(start)});return out;
}
function assignment(statement){
 const m=statement.safe.match(/^\s*(?:(?:local|set|let)\s+)?(\$?[\p{L}_][\p{L}\p{N}_]*)/u);if(!m||WORDS.has(m[1].toLowerCase()))return null;
 let at=m[0].length;while(/[ \t]/.test(statement.safe[at]||''))at++;
 if(statement.safe[at]==='['){at=bracketEnd(statement.safe,at);if(at<0)return null;}
 const lhsEnd=at;while(/[ \t]/.test(statement.safe[at]||''))at++;
 if(!/^(?:\+=|-=|\*=|\/=|=)/.test(statement.safe.slice(at)))return null;
 const nameStart=m[0].length-m[1].length;
 return {name:statement.code.slice(nameStart,lhsEnd).trim(),offset:statement.start+nameStart};
}
function create(doc,allEntries=core.entries(doc)){
 const cache=new Map(),locations=new Map(doc.locations.map(l=>[l.name.toLowerCase(),l]));let definitions=null;
 function data(name){
  const loc=locations.get(String(name).toLowerCase());if(!loc)return null;
  if(cache.has(loc.index))return cache.get(loc.index);
  const body=core.shift(doc.lines[loc.body],5),a=scenes.analyse(loc.name,body),rows=body.split('\n'),delayed=braces(a.safe),records=[];
  const line=offset=>{let lo=0,hi=a.lineStarts.length;while(lo<hi){const mid=(lo+hi)>>>1;if(a.lineStarts[mid]<=offset)lo=mid+1;else hi=mid;}return lo;};
  function add(code,start,end,kind,names,defined=[],extraConditions=[]){const conditions=unique([...a.blocks.filter(b=>b.kind==='if'&&start>=b.start&&start<b.end).map(b=>b.condition),...extraConditions]);records.push({code:short(code.trim()),location:loc.name,line:line(start),kind,names:unique(names),defined,conditions,start,end});}
  for(const block of a.blocks.filter(b=>b.kind==='if')){
   const code=rows[block.line-1]||block.condition;add(code,block.start,block.start+code.length,delayed.some(([s,e])=>block.start>=s&&block.start<e)?'deferred':'condition',block.condition==='그 외 (else)'?[]:variables(block.condition));
  }
  for(const statement of statements(body,a.safe)){
   const assign=assignment(statement),isDelayed=delayed.some(([s,e])=>statement.start<e&&statement.end>s);
   const deferredHolder=assign&&/^\$special_action$/i.test(base(assign.name));
   if(assign)add(statement.code,assign.offset,statement.end,isDelayed||deferredHolder?'deferred':'assignment',variables(statement.code,statement.safe),[assign.name]);
   const isDynamic=/^\s*dynamic\b/i.test(statement.safe);
   if(isDynamic&&!assign)add(statement.code,statement.start,statement.end,'deferred',variables(statement.code,statement.safe));
   if(deferredHolder||isDynamic){
    for(const literal of core.literals(statement.code)){
     const nestedSafe=scenes.masked(literal.text);
     const nested=scenes.analyse(loc.name,literal.text);
     for(const statementInside of statements(literal.text,nestedSafe)){
      const inner=assignment(statementInside);if(inner)add(statement.code,statement.start,statement.end,'deferred',variables(statementInside.code,statementInside.safe),[inner.name],nested.blocks.filter(b=>b.kind==='if'&&statementInside.start>=b.start&&statementInside.start<b.end).map(b=>b.condition));
     }
     for(const block of nested.blocks.filter(b=>b.kind==='if'))add(statement.code,statement.start,statement.end,'deferred',block.condition==='그 외 (else)'?[]:variables(block.condition));
    }
   }
  }
  // EXEC attributes are executable, unlike ordinary quoted dialogue text.
  for(const literal of core.literals(body))for(const link of scenes.links(literal.text)){
   const nestedSafe=scenes.masked(link.code),nested=scenes.analyse(loc.name,link.code);
   for(const statement of statements(link.code,nestedSafe)){
    const assign=assignment(statement);if(assign)add(body.slice(literal.start-1,literal.end+1),literal.start,literal.end,'deferred',variables(statement.code,statement.safe),[assign.name],nested.blocks.filter(b=>b.kind==='if'&&statement.start>=b.start&&statement.start<b.end).map(b=>b.condition));
   }
   for(const block of nested.blocks.filter(b=>b.kind==='if'))add(body.slice(literal.start-1,literal.end+1),literal.start,literal.end,'deferred',block.condition==='그 외 (else)'?[]:variables(block.condition));
  }
  const result={loc,body,a,records,line};cache.set(loc.index,result);return result;
 }
 function index(){
  if(definitions)return definitions;
  definitions=new Map();
  for(const loc of doc.locations)for(const r of data(loc.name).records)for(const name of r.defined){const key=base(name);if(!definitions.has(key))definitions.set(key,[]);definitions.get(key).push({...r,definedName:name});}
  return definitions;
 }
 function inspect(context){
  const selected=context.selection,substitutions=interpolations(selected?.text||''),wanted=new Map(),uses=new Map(),conditions=[],scope=context.flow?.usage||{location:context.location,title:context.scene?.title,sceneId:context.scene?.id};
  function want(name){if(wanted.size<80&&!wanted.has(name.toLowerCase()))wanted.set(name.toLowerCase(),name);}
  for(const s of substitutions)for(const name of s.variables)want(name);
  const ranges=[];
  function range(location,sceneId,entry){
   const d=data(location);if(!d)return;
   const scene=d.a.scenes.find(s=>s.id===sceneId)||(entry&&d.a.scenes.filter(s=>s.type!=='condition'&&s.id!=='root'&&entry.start>=s.start&&entry.start<s.end).sort((x,y)=>(x.end-x.start)-(y.end-y.start))[0])||d.a.scenes[0];
   let start=scene.start,end=scene.end;
   // A root data location may hold thousands of unrelated definitions.
   if(scene.id==='root'&&entry){const row=Math.max(0,entry.line-1);start=d.a.lineStarts[Math.max(0,row-8)]||0;end=d.a.lineStarts[Math.min(d.a.lineStarts.length-1,row+9)]??d.body.length;if(end<=start)end=d.body.length;}
   ranges.push({d,start,end});
   for(const block of d.a.blocks.filter(b=>b.kind==='if'&&((b.start>=start&&b.start<end)||(b.start<start&&b.end>=end)||(entry&&entry.start>=b.start&&entry.start<b.end)))){
    const r=d.records.find(r=>r.kind==='condition'&&r.start===block.start);if(r)conditions.push({code:r.code,location:r.location,line:r.line});
   }
  }
  if(selected?.field==='body')range(selected.location,context.scene?.id,selected);
  if(scope.location&&(!selected||scope.location!==selected.location||scope.sceneId!==context.scene?.id))range(scope.location,scope.sceneId,null);
  const active=[];
  for(const {d,start,end}of ranges)for(const r of d.records)if(r.start>=start&&r.start<end)active.push(r);
  for(const c of conditions){const d=data(c.location);const r=d?.records.find(r=>r.kind==='condition'&&r.line===c.line&&r.code===c.code);if(r)active.push(r);}
  for(const r of active)for(const name of r.names){want(name);const key=name.toLowerCase();if(!uses.has(key))uses.set(key,[]);uses.get(key).push(r);}
  const idx=wanted.size?index():new Map(),publicRecord=r=>({code:r.code,location:r.location,line:r.line,kind:r.kind,conditions:r.conditions||[]});
  const dedupe=records=>[...new Map(records.map(r=>[JSON.stringify([r.code,r.location,r.line,r.kind]),r])).values()];
  const vars=[...wanted].map(([key,name])=>{
   const defs=dedupe((idx.get(base(name))||[]).slice().sort((a,b)=>Number(b.definedName.toLowerCase()===key)-Number(a.definedName.toLowerCase()===key)||Number(b.location===scope.location)-Number(a.location===scope.location)));
   return {name,type:name.startsWith('$')?'string':'number',uses:dedupe(uses.get(key)||[]).slice(0,12).map(publicRecord),definitions:defs.slice(0,12).map(publicRecord),definitionTotal:defs.length};
  });
  return {substitutions,conditions:dedupe(conditions).slice(0,80),variables:vars,scope:{location:scope.location||selected?.location||'',title:scope.title||context.scene?.title||''},notice:'읽기 전용 원문 코드입니다. 설정 후보는 조건에 따라 실행되며, 세이브의 현재값을 뜻하지 않습니다. 지연 실행 코드는 별도로 표시합니다. 최대 80개 변수와 변수별 12개 설정 후보를 표시합니다.'};
 }
 return {inspect};
}
module.exports={create};
