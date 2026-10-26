'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-post-patch-playtest-20261025/overwork-audit';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs'),raw=fs.readFileSync(game+'/jack.qsp'),product=c.parse(raw),fixture=fs.readFileSync('G:/Codex/tmp/jo9-post-patch-playtest-20261025/economy/training/training-muscular-overwork.qsp');
const action=process.argv.includes('--action');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5),q=s=>"'"+s.replaceAll("'","''")+"'";
fs.mkdirSync(tmp,{recursive:true});for(const rel of ['content','json','css','fonts'])if(!fs.existsSync(tmp+'/'+rel))fs.symlinkSync(game+'/'+rel,tmp+'/'+rel,'junction');fs.copyFileSync(game+'/config.xml',tmp+'/config.xml');fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plans=[];
for(const [name,energy]of [['zero',0],['one',1]]){
 const d=c.parse(fixture),start=body(d,'Start');a.equal(start.split("slave['energy']=0").length,2);set(d,'Start',start.replace("slave['energy']=0",`slave['energy']=${energy}`));
 const marker='JO9_QA_OVERAUDIT_'+name+'_COMPLETE';
 const js=`(function(){setTimeout(function(){var as=document.getElementsByTagName('a'),matches=0,active=0;for(var i=0;i<as.length;i++){if((as[i].textContent||'').indexOf('애완녀 조련')>=0){matches++;if((as[i].getAttribute('href')||'').toLowerCase().indexOf('exec:')===0)active++}}var a=document.createElement('a');a.href="EXEC: qa_dom_matches="+matches+" & qa_dom_active="+active+" & savegame '${name}-dom.sav' & msg '${marker}'";document.body.appendChild(a);var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)},300)}());`;
 const clickJs=(forward=false)=>`(function(){setTimeout(function(){var as=document.getElementsByTagName('a'),a=null;for(var i=0;i<as.length;i++){if(${forward?"/forward_button[.]png/.test(as[i].innerHTML)":"(as[i].textContent||'').indexOf('애완녀 조련')>=0"}){a=as[i];break}}if(!a)return;a.scrollIntoView(false);var r=(a.querySelector('img')||a).getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(r.width<=0||r.height<=0||!a.contains(hit))return;var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)},250)}());`;
 let tail=`\nqa_original_main_completed=1\nsavegame '${name}-after-main.sav'\n*p `+q('<script type="text/javascript">'+js+'</script>');
 if(action){
  set(d,'interaction','qa_clean_actions+=1\n'+body(product,'interaction'));
  set(d,'interaction_screen',body(product,'interaction_screen')+'\n*p '+q('<script type="text/javascript">'+clickJs(true)+'</script>'));
  tail=`\nqa_original_main_completed+=1\nif qa_clean_actions=0:\nsavegame '${name}-after-main.sav'\n*p `+q('<script type="text/javascript">'+clickJs(false)+'</script>')+`\nelse\nif qa_clean_actions!1 or slave['energy']!${energy-1}: msg 'FAIL_OVERAUDIT_ACTION' & exit\nsavegame '${name}-dom.sav'\nmsg '${marker}'\nend`;
 }
 set(d,'main_screen',`savegame '${name}-before-main.sav'\n`+body(product,'main_screen')+tail);
 const file=tmp+'/'+name+'.qsp';fs.writeFileSync(file,c.serialize(d));plans.push({name,file,marker,checkpoint:'Original current main_screen complete -> native DOM selector observation atAP'+energy});
}
fs.writeFileSync(tmp+'/plan.json',JSON.stringify(plans,null,2));const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',tmp+'/plan.json','-TimeoutSeconds','25'],{encoding:'utf8',windowsHide:true,timeout:60000});
const cases=plans.map(p=>{const snapshots={};for(const stage of ['before-main','after-main','dom']){const file=tmp+'/'+p.name+'-'+stage+'.sav';if(fs.existsSync(file)){const s=sc.parse(fs.readFileSync(file));snapshots[stage]={energy:+sc.value(s,'slave','energy')[0],stamina:+sc.value(s,'slave','stamina')[0],menu:+sc.value(s,'menu_form')[0],mainCompleted:+sc.value(s,'qa_original_main_completed')[0],domMatches:+sc.value(s,'qa_dom_matches')[0],domActive:+sc.value(s,'qa_dom_active')[0]};}}return{name:p.name,snapshots};});
const result=JSON.parse(fs.readFileSync(tmp+'/client-results.json','utf8').replace(/^\uFEFF/,''));
const report={candidate:c.hash(raw),exit:r.status,result,cases,scope:'Original main_screen body and GT targets retained. Existing failed fixture state reused, AP is the single changed actor field. Full resource junctions supplied; previous partial-resource environment differs and is recorded as a confounder.'};
fs.writeFileSync(__dirname+(action?'/overwork-menu-action.json':'/overwork-menu-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
