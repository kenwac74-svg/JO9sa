'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const rec=__dirname,base=path.dirname(rec),tmp='G:/Codex/tmp/jo9-rumor-guild-20261028',input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)),q=s=>"'"+s.replaceAll("'","''")+"'";
const raw=fs.readFileSync(input),hash=c.hash(raw),patch=read(base+'/rumor-patch.json');assert.equal(hash,patch.before_sha256);
function get(d,n){return c.shift(d.lines[d.locations.find(l=>l.name===n).body],5).replace(/\r\n/g,'\n');}
function set(d,n,s){d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);}
const candidate=c.parse(raw);for(const e of patch.edits){const l=candidate.locations.find(l=>l.name===e.location);const body=c.shift(candidate.lines[l.body],5);assert.equal(body.split(e.old).length-1,e.count);candidate.lines[l.body]=c.shift(body.split(e.old).join(e.new),-5);}
assert.equal(c.hash(c.serialize(candidate)),patch.after_sha256);
const priceTables=get(c.parse(raw),'#static_txt').split('\n').filter(s=>/^\s*(common_price|auction_price)\[/.test(s)).join('\n');
const init="usehtml=1\n$onnewloc=''\n$counter=''\nsound_on=0\nsnk_room_target=0\ngs '#static_base'\ngs '#dynamic'\n$onnewloc=''\n$counter=''\nbrand_reputation=5\n"+priceTables+'\n';
const attrs=['stamina','sensitivity','temper','intellect','ego'];const skills=['expression','pet','dressage','cowSK','nurse','service','cook','gladiatrix','alchemy','enchanter','art','music','calisthenics','secretary','petting','oral','penetration','roleplay','orgy','fetishism','xenophily','nipplefuck','lesbiansex'];
function actor(role='slave',grade=4){let s=`killvar '${role}'\nkillvar '${role}_rate'\n${role}_state=1\n${role}_type=2571\n$${role}_name='QA_ACTOR'\n$${role}_psy_status='docile'\n`;
 const fields={id:910001,age:1,brand:2,base_beauty:grade,beauty:grade,fat:2,pride:1,virginity:2,custom:30,moral:3,instinct:2,rational:2,energy:4,obedience:1,jo9_versatile_manual_off:1};for(const k of attrs)fields[k]=grade;for(const k of skills)fields[k]=grade;for(const[k,v]of Object.entries(fields))s+=`${role}[${q(k)}]=${v}\n`;
 s+=`${role}_rate['beauty']=cont_atr_threshold[${grade}]\n${role}_rate['stamina']=cont_atr_threshold[${grade}]\n`;return s;}
let assertions=0;const chk=(cond,label)=>{assertions++;return `if (${cond}) = 0: msg 'FAIL_RUMOR_${label}' & exit\n`;};
fs.mkdirSync(tmp,{recursive:true});const plan=[];
function fixture(d,name,code){set(d,'Start',init+code+`\nmsg 'JO9_QA_RUMOR_${name.replaceAll('-','_')}_COMPLETE'\n`);const file=tmp+'/'+name+'.qsp';fs.writeFileSync(file,c.serialize(d));plan.push({name,file,marker:'JO9_QA_RUMOR_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Independent current dealer quote and candidate rumor behavior'});}
for(const phase of ['baseline','candidate']){
 const d=phase==='baseline'?c.parse(raw):c.parse(c.serialize(candidate));let code="qa_index=0\n";
 for(const diff of [0,1,2])for(const vendor of ['farid','wong'])for(const psy of ['docile','broken'])for(const obed of [0,1])for(const versatile of [0,1]){
  code+=actor()+`difficulty_setting=${diff}\n$slave_psy_status='${psy}'\nslave['obedience']=${obed}\nslave['jo9_versatile']=${versatile}\n`;
  code+=`qa_default=func('jo9_traits_value','dealer_quote','${vendor}')\nqa_quotes[qa_index]=qa_default\nqa_index+=1\n`;
  if(phase==='candidate'){
   code+=`qa_explicit=func('jo9_traits_value','dealer_quote','${vendor}','slave')\n`+chk('qa_default=qa_explicit','dealer_explicit_'+diff+'_'+vendor+'_'+psy+'_'+obed+'_'+versatile);
   code+="copyarr 'jo9_rumor_probe','slave'\ncopyarr '$jo9_rumor_probe','$slave'\ncopyarr 'jo9_rumor_probe_rate','slave_rate'\njo9_rumor_probe_state=slave_state\njo9_rumor_probe_type=slave_type\n$jo9_rumor_probe_psy_status=$slave_psy_status\n";
   code+=`qa_probe=func('jo9_traits_value','dealer_quote','${vendor}','jo9_rumor_probe',rating,slave_base_price,slaveprice)\n`+chk('qa_probe=qa_default','dealer_probe_'+diff+'_'+vendor+'_'+psy+'_'+obed+'_'+versatile);
  }
 }
 code+=`savegame '${phase}-quotes.sav'\n`;fixture(d,phase+'-quotes',code);
}
write(rec+'/prepared.json',{baseline:hash,candidate:patch.after_sha256,assertions,plan});write(tmp+'/plan.json',plan);fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
if(require.main===module && process.argv[2]==='run'){
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine','G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','-Plan',tmp+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:70000});
 const results=read(tmp+'/client-results.json');let compare=null;if(results.every(x=>x.pass)){const a=sc.parse(fs.readFileSync(tmp+'/baseline-quotes.sav')),b=sc.parse(fs.readFileSync(tmp+'/candidate-quotes.sav'));const av=a.vars.find(v=>v.name==='QA_QUOTES'),bv=b.vars.find(v=>v.name==='QA_QUOTES');assert.deepEqual(av.values,bv.values);compare={defaultQuoteCases:av.values.length,equal:true,quotes:av.values.map(x=>Number(x[0]))};}
 write(rec+'/dealer-results.json',{engineExit:run.status,results,assertions,compare,worldUnchanged:c.hash(fs.readFileSync(input))===hash});for(const r of results)fs.copyFileSync(tmp+'/'+r.name+'-stderr.log',rec+'/'+r.name+'.log');console.log(JSON.stringify(read(rec+'/dealer-results.json')));
 assert(results.every(r=>r.pass)&&compare?.equal);
}
module.exports={c,sc,rec,base,tmp,input,raw,hash,patch,candidate,init,actor,chk,fixture,get,set,read,write,plan,get assertions(){return assertions;}};
