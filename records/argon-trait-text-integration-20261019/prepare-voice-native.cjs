'use strict';
// Disposable native probes. Keeps production QSP and saves read-only.
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const opts={};for(let i=2;i<process.argv.length;i+=2)opts[process.argv[i].slice(2)]=process.argv[i+1];
const work='G:/somi/Jack O Nine Tails v2.4_work/game',input=opts.input||work+'/jack.qsp',out=opts.out;
if(!out||fs.existsSync(out))throw Error('Fresh --out required');
let raw=fs.readFileSync(input);const originalHash=c.hash(raw),base=c.parse(raw),prime=qa.primeState(codec.parse(fs.readFileSync(work+'/save/spete_dialogue_test.sav')));
if(opts.transformed==='yes'){const m=require('./voice-transform.cjs');for(const name of m.locations){const l=base.locations.find(x=>x.name===name);const r=m.transform(name,c.shift(base.lines[l.body],5));base.lines[l.body]=c.shift(r.body,-5);}raw=c.serialize(base);}
const q=s=>"'"+s.replaceAll("'","''")+"'",a=(expr,label)=>['if '+expr+':','else','qa_failed=1',"msg 'JO9_QA_ASSERTION_FAILED_"+label+"'",'exit','end'];
const roles=['slave','assistant','room1','room2','room3','room4'];
const baseSetup=['killall',prime.code,"$onnewloc=''",'snk_room_target=0','nsfw=0','sound_on=0',"gs 'refresh_database'",'sparks=100000','master_energy=5','master_artdirector=5','master_domination=5','master_cha=5','master_str=5','exam_in_progress=0','qa_case=0','qa_failed=0'];
for(const [i,r]of roles.entries())baseSetup.push('special_stock=1069',"gs 'generate_stock'","dynamic $swap_slave_instances, 'stock', "+q(r),r+"_state=CONST_INT['slave_exist']",'$'+r+'_name='+q('QA_'+r),r+"['energy']=5",r+"['obedience']=5",r+"['expression']=2",r+"['pride']=0",r+"['moral']=5",r+"['intellect']=3",r+"['jo9_voice_trait']=0");
const tests=[
 {name:'main-voice',role:'slave',states:[1,2],ids:[1111,1112,1113,1114,1115,1116,1117,1231,4131,1731,5610,854],blocked:true},
 {name:'assistant-voice',role:'assistant',states:[1,2],ids:[1118,1126,1138,5015,4131,854],blocked:true},
 {name:'normal-voice',role:'slave',states:[0],ids:[1111,1112,1113,1114,1115,1116,1117,1118,1126,1138,1231,4131,1731,5610,5015,854],blocked:false},
 {name:'orders-remain',role:'slave',states:[1,2],ids:[1121,1122,1123,1124,941,942,943,841,842,843],blocked:false},
 {name:'orders-assistant',role:'assistant',states:[1,2],ids:[841,842,843],blocked:false},
 ...['room1','room2','room3','room4'].map((r,i)=>({name:'bridge-'+['one','two','three','four'][i],role:r,bridge:i+1,states:[1,2],ids:[1112,1731],blocked:true})),
];
const plan=[];fs.mkdirSync(out,{recursive:true});fs.cpSync(work+'/json',out+'/json',{recursive:true});fs.copyFileSync(work+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
for(const test of tests.filter(t=>!opts.only||opts.only.split(',').includes(t.name))){
 const d=c.parse(raw),set=(n,b)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b,-5);};
 const cases=test.states.flatMap(state=>test.ids.map(id=>({state,id}))),driver=[];
 driver.push('if qa_returned=1:');
 driver.push(...a('$qa_reached='+q(test.blocked?'screen':'result'),test.name.replaceAll('-','_')+'_route'));
 if(test.blocked){driver.push(...a("instr($text[1],'말을 할 수 없어')>0",test.name.replaceAll('-','_')+'_notice'));driver.push(...a("sparks=qa_before_sparks and slave['energy']=qa_before_slave_energy and assistant['energy']=qa_before_assistant_energy and master_energy=qa_before_master_energy",test.name.replaceAll('-','_')+'_no_cost'));driver.push(...a("slave_rate['expression']=qa_before_slave_expression and assistant_rate['expression']=qa_before_assistant_expression",test.name.replaceAll('-','_')+'_no_xp'));}
 if(!test.blocked){driver.push("if (interaction=941 and slave['jo9_voice_trait']>0) or (interaction=841 and assistant['jo9_voice_trait']>0):",'dynamic "$text[1] = \'<<$text[1]>>\'"',...a("instr($text[1],'고개를 끄덕인다')>0 and instr($text[1],'말한다')=0",test.name.replaceAll('-','_')+'_nod'),'end');}
 driver.push('qa_case+=1','end','qa_returned=0');
 for(const [i,t]of cases.entries()){
  driver.push('if qa_case='+i+':',"slave['jo9_voice_trait']=0","assistant['jo9_voice_trait']=0");
  if(test.bridge)driver.push("gs 'snk_room_bridge', 'leave'");
  driver.push(test.role+"['jo9_voice_trait']="+t.state);
  if(test.bridge)driver.push("gs 'snk_room_bridge', 'enter', "+test.bridge+', 1');
  driver.push('interaction='+t.id,'qa_before_sparks=sparks',"qa_before_slave_energy=slave['energy']","qa_before_assistant_energy=assistant['energy']",'qa_before_master_energy=master_energy',"qa_before_slave_expression=slave_rate['expression']","qa_before_assistant_expression=assistant_rate['expression']","gt 'interaction'",'end');
 }
 const marker='JO9_QA_ARGONVOICE_'+test.name.replaceAll('-','_')+'_COMPLETE';driver.push('if qa_failed=0: msg '+q(marker));
 set('Start',[...baseSetup,'qa_returned=0',"gt 'demo_estate'"].join('\r\n'));
 set('demo_estate',driver.join('\r\n'));
 set('interaction_result',"$qa_reached='result'\r\nqa_returned=1\r\ngt 'demo_estate'");
 set('interaction_screen',"$qa_reached='screen'\r\nqa_returned=1\r\ngt 'demo_estate'");
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=path.join(out,test.name+'.qsp');fs.writeFileSync(file,bytes);plan.push({name:test.name,file,marker,checkpoint:cases.length+' actual interaction entries for '+test.name,assertedCases:cases});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(out+'/prepared.json',JSON.stringify({input,originalHash,inputHash:c.hash(raw),transformed:opts.transformed==='yes',probes:plan.length,limits:['Actual interaction setup and speech-dependent branch guard are executed; result/screen are intercepted to observe route and prohibit rewards.','Orders are verified to reach ordinary processing, not to rerun all existing side effects.','Private-room bridge is the real engine implementation.','No normal save loading or production writes.']},null,2));console.log(JSON.stringify({out,probes:plan.length,inputHash:c.hash(raw)}));
