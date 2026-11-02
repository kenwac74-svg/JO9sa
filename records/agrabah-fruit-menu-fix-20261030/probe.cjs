'use strict';
// Diagnostic only. Production currency and purchase handlers are never instrumented.
const fs=require('fs'),a=require('assert/strict');
const H=__dirname,R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/agrabah-fruit-menu-fix-20261030';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs');
const phase=process.argv[2];a(['red','green'].includes(phase));
const get=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,b)=>{d.lines[d.locations.find(x=>x.name===n).body]=c.shift(b.replace(/\r?\n/g,'\r\n'),-5);},q=s=>"'"+s.replaceAll("'","''")+"'";
if(phase==='red'){
 a(!fs.existsSync(T));fs.mkdirSync(T,{recursive:true});
 const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'2b81e781d0ab56f10cb77aa340db27ee4dab7d707bafe857853ad600d474417e');
 fs.writeFileSync(T+'/before.qsp',raw,{flag:'wx'});
 fs.writeFileSync(H+'/protected.json',JSON.stringify({qsp:c.hash(raw),save:c.hash(fs.readFileSync(G+'/save/JO9_GOLD_AP_CHECK_20261026.sav'))},null,2));
 for(const n of ['content','css','fonts'])fs.symlinkSync(G+'/'+n,T+'/'+n,'junction');
 fs.cpSync(G+'/json',T+'/json',{recursive:true});fs.copyFileSync(G+'/config.xml',T+'/config.xml');
 fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
}
const raw=fs.readFileSync(T+'/'+(phase==='red'?'before':'candidate')+'.qsp'),prime=qa.primeState(sc.parse(fs.readFileSync(G+'/save/JO9_GOLD_AP_CHECK_20261026.sav')));
const cases=[
 {name:'wrong-stage',stage:12,gold:2000,sparks:20000,owned:0,enabled:false},
 {name:'before-stage',stage:10,gold:0,sparks:0,owned:0,enabled:false},
 {name:'gold-boundary',stage:11,gold:1000,sparks:0,owned:0,enabled:true},
 {name:'sparks-boundary',stage:11,gold:0,sparks:10000,owned:0,enabled:true},
 {name:'below-both',stage:11,gold:999,sparks:9999,owned:0,enabled:false},
 {name:'already-owned',stage:11,gold:2000,sparks:20000,owned:1,enabled:false}
];
const plan=[];
for(const x of phase==='red'?cases.slice(0,1):cases){
 const name=phase+'-'+x.name,marker='JO9_QA_FRUITMENU_'+name.replaceAll('-','_')+'_COMPLETE',d=c.parse(raw);
 const js='setTimeout(function(){var links=document.querySelectorAll("a"),n=0,enabled=false;for(var i=0;i<links.length;i++){if(links[i].textContent.indexOf("연회용 과일")>=0)n++;if((links[i].getAttribute("href")||"").indexOf("30213")>=0)enabled=true;}var ok=n===1&&enabled==='+x.enabled+';var a=document.createElement("a");a.href="EXEC: msg \'"+(ok?"'+marker+'":"FAIL_FRUITMENU_'+name.replaceAll('-','_')+'_n="+n+"_enabled="+enabled)+"\'";document.body.appendChild(a);var ev=document.createEvent("MouseEvents");ev.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(ev);},350);';
 set(d,'shop_general',get(d,'shop_general')+'\r\n*p '+q('<script type="text/javascript">'+js+'</script>'));
 set(d,'Start',['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''",'snk_room_target=0',"gs 'refresh_database'","gs '#dynamic'","$counter=''","$ongload=''","$onnewloc=''",'settimer 0','usehtml=1','nsfw=1','autosave=0','decadesave=0','sound_on=0','is_home=0','gold='+x.gold,'sparks='+x.sparks,"active[$event['Akabur_quest']]="+x.stage,'Fruits_minibox=0','Fruits_maxibox='+x.owned,"$place='balsam_boutique'","copyarr '$display_options','$balsam_boutique_options'",'sp_txt=3',"gt 'shop_general'"].join('\r\n'));
 const bytes=c.serialize(d);qa.inspectWorld(bytes);a(c.serialize(c.parse(bytes)).equals(bytes));const file=T+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plan.push({name,file,marker,checkpoint:'Actual shop menu must render banquet fruit exactly once; enabled='+x.enabled+'; '+JSON.stringify(x)});
}
fs.writeFileSync(T+'/'+phase+'-plan.json',JSON.stringify(plan,null,2));console.log(JSON.stringify({phase,cases:plan.length,root:T}));
