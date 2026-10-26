'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process'),path=require('node:path');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-trait-merger-20261025',rec=repo+'/records/trait-merger-20261025',src=__dirname;
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const mode=process.argv[2]||'focus',out=tmp+'/native-'+mode,raw=fs.readFileSync(tmp+(mode==='red'?'/before.qsp':'/candidate.qsp'));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const protectedStart=read(rec+'/inputs.json').map(f=>({path:f.path,sha256:c.hash(fs.readFileSync(f.path))}));
const prime=qa.primeState(sc.parse(fs.readFileSync(game+'/save/JO9_TEST_20261023_01_HOME.sav'))).code;
fs.mkdirSync(out,{recursive:true});fs.cpSync(game+'/json',out+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const inspection=c.parse(raw),ctx={get:name=>{const l=inspection.locations.find(x=>x.name===name);assert(l);return c.shift(inspection.lines[l.body],5);}};
const groups=mode==='red'?[{name:'red',tests:[{name:'attention union missing before patch',body:"stock['abuse_attitude']=0\nstock['passion_fame']=1\nqa_checks+=1\nif func('jo9_traits','attention_has','stock')!1: msg 'FAIL_MERGER_RED_ATTENTION_EXPECTED' & exit"}]}]:['attention','activity','exclusions'].map(name=>({name,tests:(name==='activity'?require('./activity/tests.cjs'):require('./'+name+'/implement.cjs')).testCases(ctx)}));
if(mode!=='red'){
 const check=(condition,label)=>"qa_checks+=1\nif ("+condition+")=0: msg 'FAIL_MERGER_COMPAT_"+label+"' & exit\n";
 const tests=[];
 for(const role of ['slave','assistant','stock','room1','room2','room3','room4','prisoner','cow','dynslave']){
  let body="killvar '"+role+"'\n"+role+"_state=1\n"+role+"['qa_preserved']=731\n"+role+"['courage']=2\n";
  for(const key of ['darkness_attitude','blood_attitude','fire_attitude','water_attitude','vermin_attitude','deprivation_attitude'])body+=role+"['"+key+"']=-1\n";
  body+=role+"['jo9_slave_nature']=1\n"+role+"['meekness']=-5\n"+role+"['defiant']=1\n"+role+"['expression_affinity']=3\n"+role+"['jo9_voice_trait']=1\n"+role+"['jo9_work_ethic']=-1\n"+role+"['passion_comfort']=-1\n"+role+"['jo9_attention']=1\n"+role+"['passion_fame']=-1\n"+role+"['abuse_attitude']=2\n"+role+"['cowSK_affinity']=2\n"+role+"['sport_affinity']=1\ngs 'jo9_traits','repair','"+role+"'\n";
  const conds=[...['darkness_attitude','blood_attitude','fire_attitude','water_attitude','vermin_attitude','deprivation_attitude','meekness','defiant','jo9_voice_trait','passion_fame'].map(k=>role+"['"+k+"']=0"),role+"['jo9_work_ethic']=1",role+"['passion_comfort']=-1",role+"['abuse_attitude']=2",role+"['cowSK_affinity']=2",role+"['sport_affinity']=1",role+"['qa_preserved']=731"];
  body+=check(conds.join(' and '),role+'_positive_wins');body+="gs 'jo9_traits','repair','"+role+"'\n"+check(conds.join(' and '),role+'_idempotent');tests.push({name:'positive repair '+role,body});
 }
 groups.push({name:'compatibility',tests});
}
const plan=[];for(const group of groups){
 const d=c.parse(raw),loc=d.locations.find(l=>l.name==='Start'),marker='JO9_QA_MERGER_'+group.name.toUpperCase()+'_COMPLETE';
 let setup="usehtml=1\n"+prime+"\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n$onnewloc=''\n$counter=''\nsound_on=0\nsnk_room_target=0\nis_home=1\ncity_district=-1\nslave_stat_screen=0\nassistant_stat_screen=0\nqa_checks=0\n";
 for(const test of group.tests){assert.equal(typeof test.body,'string',group.name+' '+test.name+' body');setup+='\n! CASE '+test.name+'\n'+test.body+'\n';}
 setup+="\nmsg '"+marker+"'\n";
 d.lines[loc.body]=c.shift(cr(setup),-5);const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+group.name+'.qsp';fs.writeFileSync(file,bytes);plan.push({name:group.name,file,marker,checkpoint:'Approved merger/exclusion actual helpers, effects and compatibility fixtures: '+group.tests.length+' cases'});
}
write(out+'/plan.json',plan);
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','60'],{encoding:'utf8',windowsHide:true,timeout:plan.length*62000+15000,maxBuffer:1024*1024});
const results=fs.existsSync(out+'/client-results.json')?read(out+'/client-results.json'):[];let assertionCount=0;for(const p of plan)for(const suffix of ['stderr','stdout']){const f=out+'/'+p.name+'-'+suffix+'.log';if(fs.existsSync(f)){fs.copyFileSync(f,rec+'/evidence/'+mode+'-'+p.name+'-'+suffix+'.log');const match=fs.readFileSync(f,'utf8').match(/CHECKS=(\d+)/);if(match)assertionCount+=Number(match[1]);}}
for(const f of protectedStart)assert.equal(c.hash(fs.readFileSync(f.path)),f.sha256,'Protected file changed during test '+f.path);
const redExpected=mode==='red'&&results.length===1&&!results[0].pass&&fs.readFileSync(out+'/red-stderr.log','utf8').includes('FAIL_MERGER_RED_ATTENTION_EXPECTED');
const report={status:mode==='red'?(redExpected?'EXPECTED_FAIL':'FAIL'):(run.status===0&&results.length===plan.length&&results.every(x=>x.pass)?'PASS':'FAIL'),candidate:c.hash(raw),results,testCases:groups.reduce((n,g)=>n+g.tests.length,0),staticFailureGates:groups.reduce((n,g)=>n+g.tests.reduce((sum,t)=>sum+(t.body.match(/FAIL_MERGER_/g)||[]).length,0),0),protectedFiles:read(rec+'/inputs.json').length,limits:['Installed native QSP execution of primed representative state; no original save file overwritten.','Full GUI save-load and every full-game dynamic branch are not covered.']};write(rec+'/'+mode+'-results.json',report);console.log(JSON.stringify(report));assert(mode==='red'?redExpected:report.status==='PASS');
