'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const c=require('../text-workshop/core.cjs');
const world=process.env.VOICE_QSP,vendor=process.env.QSP_WASM_PACKAGE;
if(!world||!vendor){console.error('VOICE_QSP and QSP_WASM_PACKAGE are required; no verification performed.');process.exit(2);}
const {initQspEngine}=require(vendor+'/dist/node/wasm-engine.cjs');
const raw=fs.readFileSync(world),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const block=(s,n)=>{const a=s.indexOf('! JO9 MOD START '+n),z=s.indexOf('! JO9 MOD END '+n,a);assert(a>=0&&z>a,'Missing '+n);return s.slice(a,z+('! JO9 MOD END '+n).length);};
const helpers=block(body('#dynamic'),'VOICE_STAGE1_HELPERS'),hook=block(body('interaction'),'VOICE_STAGE1_1112');
const q=s=>"'"+s.replaceAll("'","''")+"'";
let cases=0;
(async()=>{
 const api=await initQspEngine(vendor+'/dist/qsp-engine.wasm'),errors=[];api.on('error',e=>errors.push(e));
 for(const e of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(e,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(e==='input'?'':e==='is_play'?false:e==='version'?'5.7.0':-1);});
 api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
 function run(s){api.execCode(s.replace(/\r\n|\r|\n/g,'\r\n'));assert.deepEqual(errors,[]);}
 function str(s){run('$qa_result='+s);return api.readVariable('$qa_result');}
 function num(s){run('qa_number='+s);return api.readVariable('qa_number');}
 run(helpers);assert.notEqual(str('$voice_pick_recent'),'','Shared selector must exist');cases++;
 // Isolate the selector with synthetic candidates before testing authored text.
 function select(slot='qa',actor='slave'){return str("$dyneval($replace($voice_pick_recent,'dyn'+'slave',"+q(actor)+'),' + q(slot)+')');}
 function pool(values){run("killvar '$jo9_voice_candidates'\nkillvar '$jo9_voice_candidate_ids'\n"+values.map((x,i)=>`$jo9_voice_candidates[${i}]=${q(x)}\n$jo9_voice_candidate_ids[${i}]=${q('candidate_'+i)}`).join('\n'));}
 run("killvar 'slave'\nkillvar 'assistant'\nslave['id']=101\nassistant['id']=202\nday=22\ninteraction=1112");pool(['one','two','three']);
 const recent=[];for(let i=0;i<12;i++){const got=select();assert(!recent.slice(-2).includes(got),'Recent two must be excluded');recent.push(got);cases++;}
 const s1=str("$slave['jo9_voice_last1_qa']"),s2=str("$slave['jo9_voice_last2_qa']");
 select('other');assert.equal(str("$slave['jo9_voice_last1_qa']"),s1);assert.equal(str("$slave['jo9_voice_last2_qa']"),s2);cases++;
 select('qa','assistant');assert.equal(str("$slave['jo9_voice_last1_qa']"),s1);cases++;
 pool(['one','two']);let previous='';for(let i=0;i<6;i++){const got=select();assert.notEqual(got,previous);previous=got;cases++;}
 pool(['only']);assert.equal(select(),'only');assert.equal(select(),'only');cases++;
 const saved=str("$slave['jo9_voice_last1_qa']");pool([]);assert.equal(select(),'');assert.equal(str("$slave['jo9_voice_last1_qa']"),saved);cases++;
 pool(['','valid','']);assert.equal(select(),'valid');cases++;
 run("$slave['jo9_voice_last1_qa']='unknown-id'\n$slave['jo9_voice_last2_qa']='removed-id'");pool(['one','two','three']);assert(['one','two','three'].includes(select()));cases++;
 // Save/load the real engine state; this checks persisted IDs, not the game's GUI load action.
 run("$ongload=''\n$onnewloc=''");const savedState=api.saveGame();assert(savedState);
 const nextAfterSave=select();api.loadSave(savedState);assert.deepEqual(errors,[]);assert.equal(select(),nextAfterSave);cases++;
 const sizeBefore=num("arrsize('slave')");for(let i=0;i<40;i++)select();assert.equal(num("arrsize('slave')"),sizeBefore);cases++;
 run("$slave_relation_description['plain']='sentinel'\ngs '#txt_man','jo9_voice_1112_data'");
 assert.equal(num("arrsize('$voice_1112')"),108);assert.equal(num("arrsize('$voice_1112_variant')"),216);assert.equal(str("$slave_relation_description['plain']"),'sentinel');cases++;
 const firstPatch=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../mods/2026-10-17_zzzzzzz_slave_voice_stage1.json'),'utf8').replace(/^\uFEFF/,''));
 const data=firstPatch.edits.find(e=>e.location==='#txt_man'&&e.new.includes('VOICE_STAGE1_DATA |')).new;
 const original=Object.fromEntries([...data.matchAll(/\$voice_1112\['([^']+)'\] = '((?:[^']|'')*)'/g)].map(m=>[m[1],m[2].replaceAll("''","'")]));assert.equal(Object.keys(original).length,108);
 for(const [key,text]of Object.entries(original)){assert.equal(str('$voice_1112['+q(key)+']'),text);const alternatives=[text,...[1,2].map(i=>str('$voice_1112_variant['+q(key+'_'+i)+']'))];assert.equal(new Set(alternatives).size,3,key);assert(alternatives.every(Boolean));cases++;}
 const reps={ice:[0,0,4,4],proud:[2,2,4,4],flame:[4,4,4,4],calm:[0,0,2,2],plain:[2,2,2,2],frank:[4,4,2,2],doll:[0,0,0,0],meek:[2,2,0,0],fragile:[4,4,0,0]};
 const topics=[{r:0,p:0,dr:0,dp:0,keys:[]},{r:3,p:0,dr:0,dp:0,keys:['A']},{r:0,p:3,dr:0,dp:0,keys:['B']},{r:0,p:0,dr:0,dp:1,keys:['C']},{r:0,p:0,dr:1,dp:0,keys:['D']},{r:3,p:0,dr:0,dp:1,keys:['A','C']},{r:0,p:3,dr:1,dp:0,keys:['B','D']},{r:3,p:3,dr:1,dp:1,keys:['C']},{r:0,p:0,dr:2,dp:1,keys:['D']},{r:2,p:2,dr:0,dp:0,keys:[]}];
 for(const [type,stats]of Object.entries(reps))for(const [tone,job]of [[1,'maid'],[2,'nurse'],[3,'thief']])for(const item of topics){
  run(`killvar 'slave'\nkillvar 'slave_already_done_recent'\nslave['id']=101\nslave['temper']=${stats[0]}\nslave['sensitivity']=${stats[1]}\nslave['ego']=${stats[2]}\nslave['pride']=${stats[3]}\n$slave_occupation=${q(job)}\nslave['daily_reward_count']=${item.dr}\nslave['daily_punishment_count']=${item.dp}\nslave_already_done_recent['1511']=${item.r}\nslave_already_done_recent['1411']=${item.p}`);
  const profile=type+'_'+tone;
  const expected=[0,1,2].map(v=>item.keys.map(t=>v?str('$voice_1112_variant['+q(t+'_'+profile+'_'+v)+']'):original[t+'_'+profile]).join(' '));
  const heard=[];for(let i=0;i<5;i++){
   const out=str('$dyneval($voice_impression)');assert(expected.includes(out),JSON.stringify({type,tone,item,out}));
   if(item.keys.length){assert(!heard.slice(-2).includes(out));heard.push(out);}else assert.equal(str("$slave['jo9_voice_last1_1112']"),'');cases++;
  }
 }
 // Old saves may contain the first-stage helper and base text but lack the new helper/variants.
 run("killvar '$voice_pick_recent'\nkillvar '$voice_1112_variant'\nkillvar '$text'\n$text[1]='original'\nslave['daily_reward_count']=1\nslave['daily_punishment_count']=0\n$slave_name='검사'\n$slave_relation_description['plain']='old-save-sentinel'");run(hook);
 assert.notEqual(str('$voice_pick_recent'),'');assert.equal(num("arrsize('$voice_1112_variant')"),216);assert.equal(str('$text[1]'),'original');assert.match(str('$text[2]'),/^\[검사\]<br>&nbsp;/);assert.equal(str("$slave_relation_description['plain']"),'old-save-sentinel');cases++;
 // Denied talk never calls the hook and never advances the sentence history.
 const before=str("$slave['jo9_voice_last1_1112']")+'|'+str("$slave['jo9_voice_last2_1112']"),rb=body('interaction_result');
 const talk=rb.slice(rb.indexOf("if $interaction_type = 'talk':"),rb.indexOf('!interaction type - drug'));
 run("killvar '$text'\n$interaction_type='talk'\ninteraction_slave['res']=-1\n$slave_psy_status='plain'\n$refuse_talk['plain']='refused'\n$special_part="+q(hook));run(talk);
 assert.equal(str('$text[1]'),'refused');assert.equal(str("$slave['jo9_voice_last1_1112']")+'|'+str("$slave['jo9_voice_last2_1112']"),before);cases++;
 // Existing object-instance exchange must move both history values without a new list variable.
 run("gs '#static_base'\nslave['id']=101\nassistant['id']=202\n$slave['jo9_voice_last1_1112']='slave-history'\n$slave['jo9_voice_last2_1112']='slave-older'\n$assistant['jo9_voice_last1_1112']='assistant-history'\n$assistant['jo9_voice_last2_1112']='assistant-older'\ndynamic $swap_slave_instances, 'slave', 'assistant'");
 assert.equal(str("$slave['jo9_voice_last1_1112']"),'assistant-history');assert.equal(str("$assistant['jo9_voice_last1_1112']"),'slave-history');assert.equal(str("$assistant['jo9_voice_last2_1112']"),'slave-older');cases++;
 // Temporary arrays must not become growing persisted narration history.
 run(helpers);run("slave['daily_reward_count']=1\nslave['daily_punishment_count']=0");str('$dyneval($voice_impression)');
 assert.equal(num("arrsize('$jo9_voice_candidates')"),0);assert.equal(num("arrsize('$jo9_voice_candidate_ids')"),0);cases++;
 for(const name of [...new Set([...helpers.matchAll(/killvar '([^']+)'/g)].map(m=>m[1]))].filter(n=>/^\$?jo9_(voice|vpick)_/.test(n))){assert.equal(num('arrsize('+q(name)+')'),0,name);cases++;}
 if(process.env.VOICE_QA_REPORT)fs.writeFileSync(process.env.VOICE_QA_REPORT,JSON.stringify({passed:cases,failed:0,engine:api.version(),candidateHash:c.hash(raw),profiles:27,topicCases:10,baseRows:108,addedRows:216},null,2));console.log(JSON.stringify({passed:cases,engine:api.version(),candidateHash:c.hash(raw)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
