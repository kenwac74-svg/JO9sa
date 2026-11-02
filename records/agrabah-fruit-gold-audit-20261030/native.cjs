'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/agrabah-fruit-gold-audit-20261030',here=__dirname;
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),world=c.parse(raw),save=game+'/save/JO9_GOLD_AP_CHECK_20261026.sav',saveRaw=fs.readFileSync(save),state=sc.parse(saveRaw),prime=qa.primeState(state);
a.equal(world.hash,'2b81e781d0ab56f10cb77aa340db27ee4dab7d707bafe857853ad600d474417e');a(!fs.existsSync(tmp));
const get=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,b)=>{d.lines[d.locations.find(x=>x.name===n).body]=c.shift(b.replace(/\r?\n/g,'\r\n'),-5);};
const q=s=>"'"+s.replaceAll("'","''")+"'";
fs.mkdirSync(tmp,{recursive:true});for(const n of ['content','css','fonts'])fs.symlinkSync(game+'/'+n,tmp+'/'+n,'junction');fs.cpSync(game+'/json',tmp+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',tmp+'/config.xml');fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const init=['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''",'snk_room_target=0',"gs 'refresh_database'","gs '#dynamic'","$counter=''","$ongload=''","$onnewloc=''",'settimer 0','usehtml=1','nsfw=1','autosave=0','decadesave=0','sound_on=0','is_home=0'];
const plan=[];
function probe(d,name,marker,checkpoint){const file=tmp+'/'+name+'.qsp',bytes=c.serialize(d);qa.inspectWorld(bytes);a(c.serialize(c.parse(bytes)).equals(bytes));fs.writeFileSync(file,bytes);plan.push({name,file,marker,checkpoint});}
{
 const d=c.parse(raw),b=get(d,'interaction_city'),tail="gt 'interaction_result_city'",at=b.lastIndexOf(tail);a(at>=0);set(d,'interaction_city',b.slice(0,at)+'exit'+b.slice(at+tail.length));
 const code=[...init,'slave_type=0','assistant_type=0',"active[$event['Akabur_quest']]=11",'gold=0','sparks=20000','Fruits_minibox=0','Fruits_maxibox=0',
 'interaction_city=302111',"gs 'interaction_city'","if gold ! 25 or sparks ! 19750: msg 'FAIL_AGFRUIT_EXCHANGE_250' & exit",'qa_gold_after_exchange=gold',
 'interaction_city=30212',"gs 'interaction_city'","if gold ! 0 or sparks ! 19750 or Fruits_minibox ! 1: msg 'FAIL_AGFRUIT_MINI_GOLD' & exit",'qa_minibox_gold_bought=1',
 'gold=0','sparks=250','Fruits_minibox=0','interaction_city=30212',"gs 'interaction_city'","if gold ! 0 or sparks ! 0 or Fruits_minibox ! 1: msg 'FAIL_AGFRUIT_MINI_SPARKS' & exit",'qa_minibox_sparks_bought=1',
 'gold=0','sparks=20000','Fruits_maxibox=0'];
 for(let i=0;i<10;i++)code.push('interaction_city=302113',"gs 'interaction_city'");
 code.push("if gold ! 1000 or sparks ! 10000: msg 'FAIL_AGFRUIT_EXCHANGE_10000' & exit",'qa_banquet_gold_before=gold',
 'interaction_city=30213',"gs 'interaction_city'","if gold ! 0 or sparks ! 10000 or Fruits_maxibox ! 1: msg 'FAIL_AGFRUIT_BANQUET_GOLD' & exit",'qa_banquet_gold_bought=1',
 'gold=0','sparks=10000','Fruits_maxibox=0','interaction_city=30213',"gs 'interaction_city'","if gold ! 0 or sparks ! 0 or Fruits_maxibox ! 1: msg 'FAIL_AGFRUIT_BANQUET_SPARKS' & exit",'qa_banquet_sparks_bought=1',
 'gold=0','sparks=5000','interaction_city=302141',"gs 'interaction_city'","if gold ! 85: msg 'FAIL_AGFRUIT_FIRST_JOB' & exit",'qa_first_job_gold=gold','Jasmine_job=0','interaction_city=302142',"gs 'interaction_city'","if gold<120 or gold>145: msg 'FAIL_AGFRUIT_REPEAT_JOB' & exit",'qa_after_repeat=gold',
 "gs 'refresh_database'","$counter=''","$onnewloc=''","if gold ! qa_after_repeat: msg 'FAIL_AGFRUIT_REFRESH_RESET' & exit",'qa_after_refresh=gold',
 "savegame 'transactions.sav'","msg 'JO9_QA_AGFRUIT_transactions_COMPLETE'",'exit');
 set(d,'Start',code.join('\r\n'));probe(d,'transactions','JO9_QA_AGFRUIT_transactions_COMPLETE','Actual original exchange, job, fruit handlers; only final dialogue route changed to EXIT. Actor scenes skipped; SAV state primed.');
}
for(const x of [
 {name:'menu-ready',stage:11,gold:1000,sparks:0,owned:0,mini:true,maxi:true},
 {name:'menu-wrong-stage',stage:12,gold:2000,sparks:20000,owned:0,mini:false,maxi:false},
 {name:'menu-owned',stage:11,gold:2000,sparks:0,owned:1,mini:false,maxi:false},
 {name:'menu-low-gold',stage:11,gold:100,sparks:0,owned:0,mini:true,maxi:false},
 {name:'menu-sparks',stage:11,gold:0,sparks:10000,owned:0,mini:true,maxi:true}
]){
 const d=c.parse(raw),marker='JO9_QA_AGFRUIT_'+x.name.replaceAll('-','_')+'_COMPLETE';
 const js='setTimeout(function(){var anchors=document.querySelectorAll("a"),mini=false,maxi=false,links=[];for(var i=0;i<anchors.length;i++){var href=anchors[i].getAttribute("href")||"";if(href.indexOf("30212")>=0)mini=true;if(href.indexOf("30213")>=0)maxi=true;if(anchors[i].textContent.indexOf("과일")>=0)links.push({text:anchors[i].textContent,href:href});}var ok=mini==='+x.mini+'&&maxi==='+x.maxi+';var state=JSON.stringify({mini:mini,maxi:maxi,links:links});var a=document.createElement("a");a.href="EXEC: $qa_fruit_menu=\'"+state.replace(/\'/g,"\'\'")+"\' & savegame \''+x.name+'.sav\' & msg \''+marker+'\'";if(!ok)a.href="EXEC: msg \'FAIL_AGFRUIT_'+x.name.replaceAll('-','_')+'_MENU\'";document.body.appendChild(a);var ev=document.createEvent("MouseEvents");ev.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(ev);},350);';
 set(d,'shop_general',get(d,'shop_general')+'\r\n*p '+q('<script type="text/javascript">'+js+'</script>'));
 set(d,'Start',[...init,'gold='+x.gold,'sparks='+x.sparks,"active[$event['Akabur_quest']]="+x.stage,'Fruits_minibox='+x.owned,'Fruits_maxibox='+x.owned,"$place='balsam_boutique'","copyarr '$display_options','$balsam_boutique_options'",'sp_txt=3',"gt 'shop_general'"].join('\r\n'));
 probe(d,x.name,marker,'Actual shop_general dynamic fruit menu; stage='+x.stage+', gold='+x.gold+', sparks='+x.sparks+', owned='+x.owned);
}
fs.writeFileSync(tmp+'/plan.json',JSON.stringify(plan,null,2));
fs.writeFileSync(here+'/prepared.json',JSON.stringify({qsp:world.hash,sourceSave:save,saveHash:c.hash(saveRaw),temporaryRoot:tmp,cases:plan,fixtureStage:sc.value(state,'active',sc.value(state,'event','Akabur_quest')[1]),primeAssignments:prime.assignments,limits:['Original SAV variable values are primed into diagnostic worlds, not a full GUI Load of the reporter SAV.','Transaction fixture skips actor-specific employment scenes by setting actor types to zero.','Only diagnostic QSP copies are changed; original WORK and SAV remain untouched.']},null,2));
a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),world.hash);a.equal(c.hash(fs.readFileSync(save)),c.hash(saveRaw));
console.log(JSON.stringify({cases:plan.length,root:tmp,workUnchanged:true,sourceSaveUnchanged:true}));
