'use strict';
// Focused source-fragment replay; this is not a replacement for native engine play tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=process.argv[3]||path.resolve(__dirname,'../..');
const core=require(path.join(repo,'tools/text-workshop/core.cjs'));
const syntax=require(path.join(repo,'tools/check-image-cycle-syntax.cjs'));
const raw=fs.readFileSync(process.argv[2]),doc=core.parse(raw);
assert(core.serialize(doc).equals(raw));
const body=name=>{const loc=doc.locations.find(l=>l.name===name);assert(loc,name);return core.shift(doc.lines[loc.body],5);};
// Read the seven seed-array assignments from source, with distinct existing/new IDs.
function metadata(source){
 const state={slave:{world_index:10,nation_index:11,family_index:12,work_index:13,id:111111,relative_id:111112,relative_relations:'KEEP'},stock:{}};
 const seeds={stock_world_index:[1,5],stock_nation_index:[2,6],stock_family_index:[3,7],stock_work_index:[4,8],stock_id:[222222,333333],stock_id_relative:[222223,333334],$stock_relative_relations:['OLD_SEED','NEW_SEED']};
 let count=0;
 for(const m of source.matchAll(/^\s*\$?(slave|stock)\[['"]([^'"]+)['"]\]\s*=\s*(\$?stock_[a-z_]+)\[(slave_type|stock_type)\]\s*$/gm)){
  assert(seeds[m[3]],m[3]);state[m[1]][m[2]]=seeds[m[3]][m[4]==='slave_type'?0:1];count++;
 }
 assert.equal(count,7,'all origin/identity assignments must be exercised');return state;
}
// Small interpreter for the selected straight-line dialogue fragments. It accepts only
// the IF and text-assignment forms actually used here; unknown statements fail closed.
function parts(line){let q='',out=[],start=0;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch===q){if(line[i+1]===q)i++;else q='';}}else if(ch==='"'||ch==="'")q=ch;else if(ch==='&'){out.push(line.slice(start,i));start=i+1;}}out.push(line.slice(start));return out;}
function expr(text,state){
 let result='',q='',i=0;
 while(i<text.length){const ch=text[i];if(ch==='"'||ch==="'"){q=ch;let str='';i++;let closed=false;while(i<text.length){if(text[i]===q){if(text[i+1]===q){str+=q;i+=2;continue;}i++;closed=true;break;}str+=text[i++];}assert(closed,'expression quote');result+=JSON.stringify(str);continue;}
  const match=text.slice(i).match(/^(\$?[a-z_][a-z_0-9]*)(?:\s*\[\s*(['"])(.*?)\2\s*\])?/i);
  if(match){const token=match[1].toLowerCase();if(token==='and')result+=' && ';else if(token==='or')result+=' || ';else if(token==='not')result+=' ! ';else result+='read('+JSON.stringify(token)+(match[3]!==undefined?','+JSON.stringify(match[3]):'')+')';i+=match[0].length;continue;}
  if(ch==='!'&&text[i+1]!=='=')result+=' != ';else if(ch==='='&&!['<','>','!'].includes(text[i-1]))result+=' == ';else result+=ch;i++;
 }
 const read=(name,key)=>key===undefined?(state[name]??(name.startsWith('$')?'':0)):(state[name]?.[key]??(name.startsWith('$')?'':0));
 return Function('read','return ('+result+');')(read);
}
function replay(source,state){
 const stack=[],active=()=>stack.every(Boolean);
 function run(statement){
  statement=statement.trim();if(!statement||statement.startsWith('!'))return;
  if(/^killvar\s/i.test(statement)){delete state[expr(statement.replace(/^killvar\s+/i,''),state)];return;}
  const match=statement.match(/^(\$?[a-z_][a-z_0-9]*)(?:\[(['"]?)(.*?)\2\])?\s*(\+=|=)\s*(.*)$/i);assert(match,'unsupported replay statement: '+statement);
  const name=match[1].toLowerCase(),key=match[3],value=expr(match[5],state);
  if(key!==undefined){state[name]??={};state[name][key]=match[4]==='+='?(state[name][key]??'')+value:value;}else state[name]=match[4]==='+='?(state[name]??'')+value:value;
 }
 for(let line of source.split(/\r?\n/)){
  line=line.trim();if(!line||line.startsWith('!'))continue;
  if(line.toLowerCase()==='end'){assert(stack.length);stack.pop();continue;}
  if(/^if\s/i.test(line)){let q='',colon=-1;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch===q)q='';}else if(ch==='"'||ch==="'")q=ch;else if(ch===':'){colon=i;break;}}assert(colon>0);const condition=line.slice(3,colon),rest=line.slice(colon+1).trim();const yes=active()&&!!expr(condition,state);if(rest){if(yes)for(const part of parts(rest))run(part);}else stack.push(yes);continue;}
  if(active())for(const part of parts(line))run(part);
 }
 assert.equal(stack.length,0);
}
function relation(source,relative,target,text='',options={}){
 const state={sa_rel:1,int_index:2,slave:{obedience:1},slave1:{id:options.sourceId||0,relative_id:relative,isolate:0},slave2:{id:target},$slave1:{relative_relations:text},$text:{}};
 if(options.refusal){state.sa_rel=2;state.slave.obedience=-1;}if(options.isolate)state.slave1.isolate=1;
 const intro=source.slice(source.indexOf('if sa_rel = 1: $text[1]'),source.indexOf('! МИРОВЫЕ ОТНОШЕНИЯ'));
 replay(intro,state);
 // The remaining origin section appends normal description and computes relation scores.
 state.$text[2]+='GENERAL_ORIGIN_DESCRIPTION';
 const suffix=source.slice(source.indexOf('sa_relations4 = sa_relations')+'sa_relations4 = sa_relations'.length,source.indexOf('if sa_rel = 1: $text[3]'));
 replay(suffix,state);return state.$text;
}
const checks=[];let failures=0;
function test(name,fn){try{fn();checks.push({name,passed:true});console.log('PASS '+name);}catch(e){failures++;checks.push({name,passed:false,error:e.message});console.log('FAIL '+name+': '+e.message);}}
test('stock generation preserves existing SLAVE and fills STOCK metadata',()=>{const result=metadata(body('get_stock_seed'));assert.deepEqual(result.slave,{world_index:10,nation_index:11,family_index:12,work_index:13,id:111111,relative_id:111112,relative_relations:'KEEP'});assert.deepEqual(result.stock,{world_index:5,nation_index:6,family_index:7,work_index:8,id:333333,relative_id:333334,relative_relations:'NEW_SEED'});});
for(const loc of ['get_demo_slave','get_special_slave'])test(loc+' retains direct SLAVE metadata initialization',()=>{const result=metadata(body(loc));assert.equal(result.slave.id,222222);assert.equal(result.slave.relative_relations,'OLD_SEED');});
const rel=body('origins_relations');
test('ID 0 does not add a kinship response',()=>assert.deepEqual(relation(rel,0,0,'MARKER'),relation(rel,0,777,'MARKER')));
test('valid relatives keep exactly one response and their dedicated text',()=>{const text=relation(rel,777,777,'RM_REL_MARKER');assert.equal(text[2],'<br>RM_REL_MARKER');assert.equal((text[1].match(/대답한다:/g)||[]).length,1);});
test('missing relation text keeps general dialogue',()=>assert(relation(rel,777,777,'')[2].includes('GENERAL_ORIGIN_DESCRIPTION')));
test('refusal and isolation are not replaced with kinship text',()=>{for(const options of [{refusal:true},{isolate:true}])assert(relation(rel,777,777,'RM_REL_MARKER',options)[2].includes('GENERAL_ORIGIN_DESCRIPTION'));});
test('changed locations pass the engine-derived syntax check',()=>{for(const name of ['get_stock_seed','get_demo_slave','origins_relations']){const result=syntax.checkSyntax(body(name));assert(result.ok,JSON.stringify(result));}});
test('changed location code preserves CRLF statement separators',()=>{for(const name of ['get_stock_seed','get_demo_slave','origins_relations']){const source=body(name),literals=core.literals(source,true);for(const m of source.matchAll(/(?<!\r)\n|\r(?!\n)/g))assert(literals.some(l=>m.index>=l.start&&m.index<l.end),name+' contains a bare line break outside a string/comment at '+m.index);}});
console.log(JSON.stringify({verification:'Source-fragment replay and static syntax; native patched gameplay remains pending',qspSha256:core.hash(raw),checks,failures}));
process.exitCode=failures?1:0;
module.exports={relation};
