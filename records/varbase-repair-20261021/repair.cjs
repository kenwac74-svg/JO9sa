'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(path.join(root,'baseline.qsp')),doc=core.parse(raw),e='\r\n';
assert.equal(core.hash(raw),'873abaac19edb69e75d022c0277e1a9d3dbc036d506e44bd27c4527da372d2a3');assert(core.serialize(doc).equals(raw));
const loc=doc.locations.find(l=>l.name==='#var_base'),before=core.shift(doc.lines[loc.body],5),ls=before.split(e);
const targets=[188,242,1244,1312,1389,1418,1429,1438,1439,1470,1518,1570,1596,1671,1760,2007,2031,2036,2046];
const changes=[];
for(let n=targets.length-1;n>=0;n--){const i=targets[n]-1,line=ls[i],m=/^(\s*if\s+.+?:)[\t ]*(\$.+)$/.exec(line);assert(m,'Expected malformed inline opening at '+targets[n]);
 assert(/^\$(?:slave_wax1_txt\[1\]|two_lolis)\s*=/.test(m[2]),'Unexpected inline assignment');
 const indent=/^\s*/.exec(line)[0],id='VARBASE_STRUCTURE_20261021_'+String(n+1).padStart(2,'0');
 ls.splice(i,1,indent+'! JO9 MOD START '+id, m[1],indent+'\t'+m[2],indent+'! JO9 MOD END '+id);changes.push({originalLine:targets[n],id,conditionPreserved:m[1],assignmentPreserved:true});}
let after=ls.join(e);
function replaceOnce(old,newText){assert.equal(after.split(old).length-1,1,'Expected exact unique old');after=after.replace(old,newText);}
replaceOnce('hum_cnt = 1'+e+'tess_num = hum_cnt'+e+'hum_num = rand(1, hum_cnt)',[
'! JO9 MOD START VARBASE_INDEX_INIT_20261021',
'hum_cnt = 0','tess_num = hum_cnt','hum_num = rand(1, 1)',
'! Keep the existing initial RNG draw; the populated list is selected below.',
'! JO9 MOD END VARBASE_INDEX_INIT_20261021'].join(e));
replaceOnce('if hum_cnt < 1:'+e+'\tif slave',[
'! JO9 MOD START VARBASE_FALLBACK_INDEX_20261021',
'if hum_cnt < 1:','\thum_cnt = 1','\tif slave'].join(e));
replaceOnce('\tend'+e+'\thum_cnt  = 1'+e+'\tflaw_num = rand(1, hum_cnt)','\tend'+e+'\tflaw_num = rand(1, hum_cnt)');
replaceOnce('else '+e+'\tflaw_num = rand(1, hum_cnt)'+e+'end','else '+e+'\tflaw_num = rand(1, hum_cnt)'+e+'end'+e+'! JO9 MOD END VARBASE_FALLBACK_INDEX_20261021');
assert.deepEqual(core.literals(before).map(x=>x.text),core.literals(after).map(x=>x.text),'All pre-existing string literals remain in the same order');
doc.lines[loc.body]=core.shift(after,-5);const candidate=core.serialize(doc);qa.inspectWorld(candidate);
const parsed=core.parse(candidate),baseLines=core.parse(raw).lines;for(let i=0;i<doc.lines.length;i++)if(i!==loc.body)assert.equal(parsed.lines[i],baseLines[i],'Only #var_base body may change');
const patch={id:'VARBASE_STRUCTURE_INDEX_20261021',description:'Restore 19 multiline openings without changing existing conditions or strings; repair dense derived-list indexing and fallback without save migration.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits:[{location:'#var_base',field:'body',old:before,new:after,count:1}]};
fs.mkdirSync(path.join(root,'patches'),{recursive:true});fs.writeFileSync(path.join(root,'patches','2026-10-21_varbase_structure_index.json'),JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(path.join(root,'change-summary.json'),JSON.stringify({before:patch.before_sha256,after:patch.after_sha256,headers:changes.reverse(),allStringLiteralsPreserved:true,allOtherQspFieldsIdentical:true,newLocations:0,newPersistentVariables:0,newFunctions:0,initialRngDrawPreserved:true,fallbackIndexSetBeforeWrite:true},null,2));
console.log(JSON.stringify({patch:patch.id,before:patch.before_sha256,after:patch.after_sha256,headers:targets.length,allStringLiteralsPreserved:true,otherFieldsIdentical:true}));