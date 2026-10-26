'use strict';
// Only creates disposable native-engine probes. Does not edit the input world or saves.
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game';
const opts={};for(let i=2;i<process.argv.length;i+=2)opts[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const input=opts.input||work+'/jack.qsp',out=opts.out;if(!out||fs.existsSync(out))throw Error('Fresh --out required');
let raw=fs.readFileSync(input);const originalHash=c.hash(raw);
if(opts.transformed==='yes'){const d=c.parse(raw),l=d.locations.find(l=>l.name==='#static_txt');const changed=require('./lesson-transform.cjs').transform(c.shift(d.lines[l.body],5));d.lines[l.body]=c.shift(changed.body,-5);raw=c.serialize(d);}
const base=c.parse(raw),prime=qa.primeState(codec.parse(fs.readFileSync(work+'/save/spete_dialogue_test.sav')));
const q=s=>"'"+s.replaceAll("'","''")+"'";
const a=(expr,label)=>['if '+expr+':','else','$qa_errors+='+q(label+'|'),'end'];
const body=n=>c.shift(base.lines[base.locations.find(l=>l.name===n).body],5);
// The rendering statement is copied verbatim from interaction_result, except its target role.
const consumer=body('interaction_result').split(/\r?\n/).find(s=>s.includes('dynamic $replace("$text[i] ='));
if(!consumer)throw Error('Missing real delayed consumer');
const keys=require('./lesson-transform.cjs').targets.map(t=>t.key);
const roles=['slave','assistant','room1','room2','room3','room4'];
const setup=['killall',prime.code,"$onnewloc=''",'snk_room_target=0','nsfw=0','sound_on=0',"$qa_errors=''","$slave_name='QA_CACHE_OLD'","slave['age']=0","gs 'refresh_database'"];
for(let i=0;i<roles.length;i++){const r=roles[i];setup.push('$'+r+'_name='+q('QA_NOW_'+r),r+"['age']="+(i+1),r+"['nipple_piercing']="+(i+1),r+"_state=CONST_INT['slave_exist']",r+"['energy']=5",'$slave_noun2['+(i+1)+']='+q('NOUN_'+r),'$slave_body6_txt['+(i+1)+']='+q('BODY_'+r),'$nipple_piercing_txt['+(i+1)+']='+q('NIPPLE_'+r));}
const plan=[];fs.mkdirSync(out,{recursive:true});fs.cpSync(work+'/json',out+'/json',{recursive:true});fs.copyFileSync(work+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const cases=[...roles.map(role=>({role,render:role})),...roles.filter(r=>r.startsWith('room')).map(role=>({role,render:'slave',bridge:true}))].filter(t=>!opts.only||opts.only.split(',').includes((t.bridge?'bridge-':'')+t.role));
for(const test of cases){const role=test.role;
 const d=c.parse(raw),set=(n,b)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b,-5);};
 const checks=[];
 for(const [i,key]of keys.entries()){
  checks.push('$text[1]='+key,'i=1',consumer.replace("'slave')",q(test.render)+')').replace("'assistant')",q(test.render)+')'));
  checks.push(...a('instr($text[1],'+q('QA_NOW_'+role)+')>0','name_'+role+'_'+i));
  checks.push(...a("instr($text[1],'QA_CACHE_OLD')=0",'cache_'+role+'_'+i));
  if(role!=='slave')checks.push(...a("instr($text[1],'QA_NOW_slave')=0",'no_main_name_'+role+'_'+i));
  if(i===0)checks.push(...a('instr($text[1],'+q('NOUN_'+role)+')>0','age_'+role));
  if(key==='$slave_foreplay_anal[0]')checks.push(...a('instr($text[1],'+q('BODY_'+role)+')>0','body_age_'+role));
  if(key==='$slave_seduction[4]')checks.push(...a('instr($text[1],'+q('NIPPLE_'+role)+')>0','accessory_'+role));
 }
 const label=(test.bridge?'bridge_':'')+role.replace(/\d/g,x=>['zero','one','two','three','four'][Number(x)]);
 const marker='JO9_QA_ARGONLESSON_'+label+'_COMPLETE';
 const name=label.replaceAll('_','-');
 const before=test.bridge?["gs 'snk_room_bridge', 'enter', "+Number(role.slice(-1))+', 1']:[];
 const after=test.bridge?["gs 'snk_room_bridge', 'leave'",...a("$slave_name='QA_NOW_slave' and $"+role+'_name='+q('QA_NOW_'+role),'restored_'+role)]:[];
 set('Start',[...setup,...before,...checks,...after,"if $qa_errors!'': msg 'JO9_QA_ASSERTION_FAILED_' + $qa_errors",'if $qa_errors='+q('')+': msg '+q(marker)].join('\r\n'));
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=path.join(out,name+'.qsp');fs.writeFileSync(file,bytes);plan.push({name,file,marker,checkpoint:keys.length+' actual #static_txt values through original interaction_result delayed consumer for '+role});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(out+'/prepared.json',JSON.stringify({input,originalHash,inputHash:c.hash(raw),transformed:opts.transformed==='yes',keys,roles,consumer,limits:['Rendering statement executed from original interaction_result; complete training rewards and navigation are not re-run.','Values changed after refresh_database prove lookup is not stale.','Diagnostic copies only; no production or save writes.']},null,2));
console.log(JSON.stringify({inputHash:c.hash(raw),out,probes:plan.length}));
