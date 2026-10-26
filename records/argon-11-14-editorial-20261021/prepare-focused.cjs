'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),codec=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync(root+'/candidate.qsp'),selection=JSON.parse(fs.readFileSync(root+'/selection.json','utf8')),state=codec.parse(fs.readFileSync(root+'/inputs/state.sav'));
const prime=qa.primeState(state).code,dir=root+'/focused';fs.mkdirSync(dir,{recursive:true});
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
fs.cpSync(game+'/json',dir+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');
fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const token='ARGON1114EDIT',plan=[],quote=s=>"'"+s.replaceAll("'","''")+"'";
const safety="killall\r\nusehtml=1\r\nsettimer 0\r\n"+prime+"\r\ngs 'refresh_database'\r\n$onnewloc=''\r\n$ongload=''\r\nautosave=0\r\ndecadesave=0\r\nautosave_day=0\r\nautosave_decade=0\r\nsound_on=0\r\n";
function fixture(name,code,checkpoint,inputRaw=raw){
 const d=core.parse(inputRaw),start=d.locations.find(l=>l.name==='Start'),marker='JO9_QA_'+token+'_'+name.replaceAll('-','_')+'_COMPLETE';
 d.lines[start.body]=core.shift(safety+code+'\r\nmsg '+quote(marker),-5);
 const out=core.serialize(d);qa.inspectWorld(out);const file=dir+'/'+name+'.qsp';fs.writeFileSync(file,out);plan.push({name,file,marker,checkpoint});
}
let assignments=[],count=0;
for(const e of selection.items){
 const a=core.literals(e.old),b=core.literals(e.new);
 for(let i=0;i<a.length;i++){
  if(a[i].text===b[i].text)continue;
  const lead=e.new.slice(0,b[i].start-1),match=lead.match(/(?:^|\r\n)[ \t]*(\$[^=\r\n]+?)\s*=\s*$/);
  const ref='$jo9_qa_selected_literal',literal=e.new.slice(b[i].start-1,b[i].end+1);
  assignments.push(ref+' = '+literal,'if '+ref+' ! '+literal+': msg '+quote('JO9_QA_ARGON_LITERAL_FAIL_'+(++count))+' & exit');
 }
}
fixture('selected-literals',assignments.join('\r\n'),'Every selected literal assigned and immediately read in the installed engine');
const varCases=JSON.parse(fs.readFileSync(root+'/fragments/var-native.json','utf8').replace(/^\uFEFF/,'')).cases;
for(const c of varCases){
 let code=c.setup+'\r\n'+c.call;
 for(const a of c.assertions)code+='\r\nif ('+a+')=0: msg '+quote('JO9_QA_ARGON_VAR_FAIL_'+c.name)+' & exit';
 fixture(c.name,code,'Actual #var_base '+c.name);
}
const baseRaw=fs.readFileSync(root+'/inputs/baseline.qsp');for(const c of varCases){let code=c.setup+'\r\n'+c.call;for(const a of c.baselineAssertions||[])code+='\r\nif ('+a+')=0: msg '+quote('JO9_QA_ARGON_BASE_FAIL_'+c.name)+' & exit';fixture('baseline-'+c.name,code,'Original baseline numeric state and selection invariants',baseRaw);}
fs.writeFileSync(dir+'/plan.json',JSON.stringify(plan,null,2));
fs.writeFileSync(root+'/focused-prepared.json',JSON.stringify({candidateSha256:core.hash(raw),literalAssignments:count,probes:plan.map(x=>({name:x.name,checkpoint:x.checkpoint})),limits:['Selected-literal probe validates assignment and interpolation syntax in isolated state, not every live NPC consumer.','Var probes call actual #var_base. Official release gate covers two actual city conversation routes.','No actual game save UI or full Qt layout validation.']},null,2)+'\n');
console.log(JSON.stringify({literalAssignments:count,probes:plan.length}));