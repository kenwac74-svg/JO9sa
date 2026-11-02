'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),cp=require('child_process');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T=process.env.JO9_QA_TOGGLE_ROOT||'G:/Codex/tmp/qa-bounty-241-toggle-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs'),rules=require(R+'/tools/text-workshop/image-cut-condition-rules.cjs');
const q=s=>"'"+String(s).replaceAll("'","''")+"'",b='content/pic/scene/qa_toggle.png',cut=n=>b.replace('.png',' ('+n+').png');
const source=fs.readFileSync(W+'/jack.qsp');
if(process.argv[2]==='prepare'){
 a(!fs.existsSync(T));qa.assertOutside(T,[W,R]);fs.mkdirSync(T,{recursive:true});fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 fs.mkdirSync(T+'/content/pic/scene',{recursive:true});for(const name of [b,cut(2),cut(3),cut(4)])fs.writeFileSync(T+'/'+name,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64'));
 const plan=[];
 for(const variant of ['plain','one-rule','two-rules']){
  const doc=c.parse(source),loc=doc.locations.find(x=>x.name==='interior_change');
  const rr=variant==='plain'?[]:[2,...variant==='two-rules'?[3]:[]].map(n=>({base:b,path:cut(n),money:{op:'ge',value:100},morality:null,rank:null,reputation:null}));
  doc.lines[loc.body]=c.shift(rules.buildBody(c.shift(doc.lines[loc.body],5),rr),-5);
  const code=["killall","usehtml=0","$counter=''","$onnewloc=''","$ongload=''","settimer 0","sound_on=0","autosave=0","decadesave=0","sparks=100","snk_room_target=0","qa_checks=0","qa_failures=0","$qa_failed=''",
   '$qa_html=func(\'interior_change\',\'jo9_html\','+q('<div><img src="'+b+'"></div>')+')',"*clr","*p $qa_html",
   '$qa_selected[0]=str(jo9_cut_choice['+q(b)+'])',"$qa_sequence=$qa_selected[0]",'qa_tick=0',':qa_repeat_toggle',"gs 'interior_change','jo9_toggle'",'qa_tick+=1','$qa_selected[qa_tick]=str(jo9_cut_choice['+q(b)+'])',"$qa_sequence+='|'+$qa_selected[qa_tick]",'if qa_tick<4: jump '+q('qa_repeat_toggle')];
  const expected=variant==='plain'?[0,10002,10003,10004,0]:[10002,10003,10004,0,10002];
  for(let i=0;i<expected.length;i++)code.push('qa_checks+=1','if $qa_selected['+i+']!'+q(expected[i])+": qa_failures+=1 & $qa_failed+="+q('toggle-step-'+i+'|'));
  code.push('savegame '+q(variant+'.sav'),'msg '+q('JO9_QA_BOUNTY_'+variant.replaceAll('-','_')+'_COMPLETE'));
  const label=variant.replaceAll('-','_');doc.lines[doc.locations.find(x=>x.name==='Start').body]=c.shift(code.join('\r\n'),-5);const raw=c.serialize(doc);qa.inspectWorld(raw);fs.writeFileSync(T+'/'+label+'.qsp',raw);
  plan.push({name:variant,file:T+'/'+label+'.qsp',marker:'JO9_QA_BOUNTY_'+label+'_COMPLETE',checkpoint:'Original actual jo9_html followed by four original jo9_toggle calls; native QSP selectedIDs, no simulated mode1-only test'});
 }
 fs.writeFileSync(T+'/plan.json',JSON.stringify(plan,null,2));console.log('Owned toggle probes prepared');
}else{
 const p=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',W+'/engine/jack.exe','-Plan',T+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:110000});
 const client=JSON.parse(fs.readFileSync(T+'/client-results.json','utf8').replace(/^\uFEFF/,''));fs.writeFileSync(__dirname+'/toggle-native-runner.log',(p.stdout||'')+(p.stderr||''));a.equal(p.status,0);a(client.every(x=>x.pass));
 const cases=['plain','one-rule','two-rules'].map(name=>{const s=sc.parse(fs.readFileSync(T+'/'+name+'.sav'));return{name,checks:+sc.value(s,'qa_checks')[0],failures:+sc.value(s,'qa_failures')[0],actualSequence:sc.value(s,'qa_sequence')[1],failed:sc.value(s,'qa_failed')[1]};});
 a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),c.hash(source));const result={sourceSha256:c.hash(source),client,cases,confirmedRegression:cases[0].failures===0&&cases.slice(1).every(x=>x.failures>0),workUnchanged:true};
 fs.writeFileSync(__dirname+'/toggle-native-report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
