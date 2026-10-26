'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/sale-cap-b-20261026/view';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync('G:/Codex/tmp/sale-cap-b-20261026/candidate.qsp');assert.equal(c.hash(raw),'e4110fb537108326d0de680efa4a87d286f9b3a6e5bc0b6073e83d13e1ee97f0');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,b)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b,-5),q=s=>"'"+s.replaceAll("'","''")+"'";
fs.mkdirSync(tmp);for(const n of ['content','css','fonts'])fs.symlinkSync(game+'/'+n,tmp+'/'+n,'junction');fs.cpSync(game+'/json',tmp+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',tmp+'/config.xml');fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const prime=qa.primeState(sc.parse(fs.readFileSync(game+'/save/JO9_GOLD_AP_CHECK_20261026.sav'))),plan=[];
for(const [name,city,type,want]of [['private',911,'slave_sold','개인 거래의 최종 지급액은 최대 $8,000이다.'],['auction',931,'basic','공개경매의 최종 지급액은 최대 $6,000이다.']]){
 const d=c.parse(raw),marker='JO9_QA_CAPVIEW_'+name+'_COMPLETE';
 const check="msg $iif(sparks = 5000 and sell_price = 15000 and sparks_get = 15000, '"+marker+"', 'FAIL_CAP_VIEW_STATE_CHANGED')";
 const js='setTimeout(function(){var e=document.getElementById("text"),ok=e&&e.textContent.indexOf('+JSON.stringify(want)+')>=0;var a=document.createElement("a");a.href="EXEC:"+(ok?'+JSON.stringify(check)+':"msg \'FAIL_CAP_VIEW_TEXT\'");document.body.appendChild(a);var ev=document.createEvent("MouseEvents");ev.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(ev);},300);';
 set(d,'interaction_screen_city',get(d,'interaction_screen_city')+'\r\n*p '+q('<script type="text/javascript">'+js+'</script>'));
 set(d,'Start',['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''","gs 'refresh_database'","$counter=''","$ongload=''","$onnewloc=''",'settimer 0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0','usehtml=1','nsfw=1','snk_room_target=0','is_home=0','sparks=5000','sell_price=15000','sparks_get=15000',"$place='balsam_boutique'",'interaction_city='+city,'$interaction_type='+q(type),'txt=1',"killvar '$special_image'","killvar '$special_action'","$text[1]='이전 견적 $15000'","gt 'interaction_screen_city'"].join('\r\n'));
 const file=tmp+'/'+name+'.qsp';const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.writeFileSync(file,bytes);plan.push({name,file,marker,checkpoint:'Render-only legacy quote cap note; cached quote and currency remain unchanged.'});
}
fs.writeFileSync(tmp+'/plan.json',JSON.stringify(plan,null,2));console.log(tmp+'/plan.json');
