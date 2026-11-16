'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const vendor='G:/Codex/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/legacy-engine-probe/package';
const {initQspEngine}=require(vendor+'/dist/node/wasm-engine.cjs');
const input=process.argv[2]||path.join(__dirname,'candidate.qsp'),raw=fs.readFileSync(input),doc=c.parse(raw),base=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');
const body=n=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const results=[],nativeCommands=[];
const q=s=>"'"+s.replaceAll("'","''")+"'";
function nativeAssert(expression){nativeCommands.push(`if (${expression}) = 0: msg 'FAIL_ACTIVITY_${nativeCommands.length}' & exit`);}
(async()=>{
 const api=await initQspEngine(vendor+'/dist/qsp-engine.wasm'),errors=[];
 api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu','view','open_game','save_game','sleep','show_window','refresh','system_cmd'])api.on(ev,(...args)=>{const cb=args.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
 // The available legacy WASM engine predates the runtime's FOR extension.
 // Translate control syntax in memory only, preserving loop bounds and step.
 for(const l of doc.locations){const s=c.shift(doc.lines[l.body],5).replace(/^(\s*)for (\w+)\s*=\s*(.*?)\s+to\s+(.*?)(?:\s+step\s+(\d+))?:/gim,(_,sp,v,lo,hi,step)=>`${sp}loop ${v} = ${lo} while ${v} <= ${hi} step ${v} += ${step||1}:`);doc.lines[l.body]=c.shift(s,-5);}
 const native=c.serialize(doc);api.openGame(native.buffer.slice(native.byteOffset,native.byteOffset+native.byteLength),true);
 const run=s=>{nativeCommands.push(s);const n=errors.length;api.execCode(s.replace(/\r?\n/g,'\r\n'));if(errors.length>n)throw Error(s.slice(0,240)+'\n'+JSON.stringify(errors.slice(n)));};
 const num=e=>{run('qa_n='+e);const v=api.readVariable('qa_n');nativeAssert('qa_n = '+v);return v;};
 const str=e=>{run('$qa_s='+e);const v=api.readVariable('$qa_s');nativeAssert('$qa_s = '+q(v));return v;};
 const actor=(stage,role='slave')=>run(`killvar '${role}'\nkillvar '${role}_rate'\n${role}_state=1\n${role}['jo9_focus']=${Math.abs(stage)===1?stage:0}\n${role}['jo9_work_ethic']=${Math.abs(stage)===2?stage/2:0}\n${role}['passion_comfort']=${Math.abs(stage)===2?-stage/2:0}\nday=5\nCONST_INT['no_slave']=0\ninteraction=850`);
 const stage=(role='slave')=>num(`func('jo9_traits','activity_stage','${role}')`);
 const checkCanonical=(expected,role='slave')=>{a.equal(stage(role),expected);a.equal(num(`${role}['jo9_focus']`),Math.abs(expected)===1?expected:0);a.equal(num(`${role}['jo9_work_ethic']`),Math.abs(expected)===2?expected/2:0);a.equal(num(`${role}['passion_comfort']`),Math.abs(expected)===2?-expected/2:0);};
 const combine=(s,t)=>s>0||t>0?Math.max(0,s,t):Math.min(0,s,t);
 // 25 legacy stage-pairs, including both assignment orders; never auto-promote a lower trait.
 for(const s of [-2,-1,0,1,2])for(const t of [-2,-1,0,1,2]){
  actor(s);if(Math.abs(t)===1)run(`slave['jo9_focus']=${t}`);if(Math.abs(t)===2)run(`slave['jo9_work_ethic']=${t/2}\nslave['passion_comfort']=${-t/2}`);
  // The physical fields cannot store two values on one axis; simulate two legacy axes only.
  const f=num("slave['jo9_focus']"),w=num("slave['jo9_work_ethic']"),expected=w>0?2:f>0?1:w<0?-2:f<0?-1:0;
  run("gs 'jo9_traits','activity_repair','slave'");checkCanonical(expected);run("gs 'jo9_traits','activity_repair','slave'");checkCanonical(expected);
 }
 results.push({name:'legacy-25-and-idempotence',cases:25,status:'PASS'});
 // Exhaust all legacy sign combinations, including contradictory compatibility values.
 for(const f of [-1,0,1])for(const w of [-1,0,1])for(const p of [-1,0,1]){
  actor(0);run(`slave['jo9_focus']=${f}\nslave['jo9_work_ethic']=${w}\nslave['passion_comfort']=${p}\nslave['service']=4\nslave['jo9_dohna_preset_rev']=1`);
  const expected=w>0||p<0?2:f>0?1:w<0||p>0?-2:f<0?-1:0;
  run("gs 'jo9_traits','activity_repair','slave'");checkCanonical(expected);a.equal(num("slave['service']"),4);a.equal(num("slave['jo9_dohna_preset_rev']"),1);
 }
 results.push({name:'legacy-three-fields',cases:27,status:'PASS'});
 for(const w of [-1,0,1])for(const p of [-1,0,1])for(const cow of [0,1]){
  actor(0,'stock');run(`stock['jo9_work_ethic']=${w}\nstock['passion_comfort']=${p}\nstock['cowSK_affinity']=${cow}`);
  const sign=w>0||p<0?1:w<0||p>0?-1:0,expected=sign===1&&cow&&w!==1?0:sign*2;
  run("gs 'jo9_traits','activity_generate','stock'");a.equal(stage('stock'),expected,'generation '+w+','+p+','+cow);checkCanonical(expected,'stock');a.equal(num("stock['cowSK_affinity']"),cow);
 }
 results.push({name:'common-upper-generation-legacy-odds-compatibility',cases:18,status:'PASS'});
 for(const s of [-2,-1,0,1,2])for(const t of [-2,-1,0,1,2]){
  actor(s);if(t!==0)run(`qa_grant=func('jo9_activity_stage','grant','slave',${t})`);
  a.equal(stage(),combine(s,t),'grant '+s+' -> '+t);checkCanonical(combine(s,t));
 }
 results.push({name:'grant-order-upper-positive-priority',cases:25,status:'PASS'});
 // Existing helper integration: fixed-profile raw values fold without touching skills or migration revision.
 for(const role of ['slave','assistant','room1','room2','room3','room4','stock','snk_parked_slave']){
  actor(0,role);run(`${role}['jo9_focus']=1\n${role}['jo9_work_ethic']=1\n${role}['service']=5\n${role}['jo9_dohna_preset_rev']=1\ngs 'jo9_traits','activity_repair','${role}'`);checkCanonical(2,role);a.equal(num(`${role}['service']`),5);a.equal(num(`${role}['jo9_dohna_preset_rev']`),1);
 }
 results.push({name:'fixed-profile-and-role-preservation',cases:8,status:'PASS'});
 const activity=(subject,fixed=0,role='slave')=>run(`gs 'jo9_traits_personality','activity','${role}','${subject}',${fixed}`);
 const finish=()=>run("gs 'jo9_traits_personality','finish','slave'");
 for(const s of [-2,-1,0,1,2]){
  actor(s);activity('work:service');a.equal(num("slave_rate['mood']"),0,'first activity mood '+s);a.equal(num("func('jo9_traits_personality','xp','slave','service',100)"),100);finish();
  activity('work:service');a.equal(num("slave['jo9_focus_active']"),Math.sign(s));a.equal(num("func('jo9_traits_personality','xp','slave','service',100)"),100+Math.sign(s)*10);a.equal(num("func('jo9_traits_personality','performance','slave','service',100)"),s<0?90:100);
  a.equal(num("slave_rate['mood']"),s===2?4:s===1?2:s===-2?-2:0,'second same mood '+s);finish();
  activity('lesson:cook');a.equal(num("slave['jo9_focus_active']"),0);a.equal(num("func('jo9_traits_personality','xp','slave','cook',100)"),100);
  a.equal(num("slave_rate['mood']"),s===2?6:s===1?2:s===-2?-4:0,'alternate mood '+s);finish();
  run("slave_rate['mood']=0\nday+=1");activity('work:service');a.equal(num("slave_rate['mood']"),0,'new day first different activity '+s);
  if(Math.abs(s)===2)a.equal(num("slave['jo9_activity_count']"),1);finish();activity('work:service');a.equal(num("slave_rate['mood']"),s===2?4:s===1?2:s===-2?-2:0);finish();
 }
 results.push({name:'repeat-alternate-daily-reset-stage-effects',cases:5,status:'PASS'});
 for(const s of [-2,-1,1,2]){
  actor(s);activity('work:service',1);finish();activity('work:service',1);a.equal(num("slave['jo9_focus_active']"),0);a.equal(num("func('jo9_traits_personality','xp','slave','service',100)"),100);a.equal(num("func('jo9_traits_personality','performance','slave','service',100)"),100);a.equal(num("slave_rate['mood']"),Math.abs(s)===2?Math.sign(s)*2:0);finish();
 }
 results.push({name:'fixed-rule-repeat-exclusion',cases:4,status:'PASS'});
 // Fractional XP uses the pre-existing signed credit; no duplicated upper/lower +10%.
 for(const s of [-2,-1,1,2]){
  actor(s);activity('lesson:service');finish();activity('lesson:service');let total=0;for(let i=0;i<10;i++)total+=num("func('jo9_traits_personality','xp','slave','service',1)");a.equal(total,s>0?11:9);a.equal(num("slave['jo9_focus_xp_credit']"),0);
 }
 results.push({name:'fractional-xp-once',cases:4,status:'PASS'});
 const massage=body('interaction').split('\r\n').filter(l=>l.includes("func('jo9_traits', 'activity_value', 'slave', 'passion_comfort')")&&l.includes('interaction_reward_potence')).join('\r\n');a(massage);
 const restBody=body('interaction_result'),start=restBody.indexOf("\tif $slave_psy_status = 'broken':",restBody.indexOf("if $interaction_type = 'rest':")),end=restBody.indexOf("\tif slave_already_done_today",start),rest=restBody.slice(start,end);a(rest);
 for(const s of [-2,-1,0,1,2])for(const psy of ['obedient','broken']){
  actor(s);run(`interaction_reward_potence=20\n$slave_psy_status='${psy}'\nfree_time=3\n${massage}`);a.equal(num('interaction_reward_potence'),s===2?10:s===-2?40:20);
  run(`interaction_reward_potence=20\n${rest}`);a.equal(num('interaction_reward_potence'),s===2?10:s===-2?40:20);
 }
 results.push({name:'original-rest-massage-multipliers',cases:10,status:'PASS'});
 for(const s of [-2,-1,1,2]){
  actor(s);run("spell_revelio=1");const text=str("$func('jo9_traits','list','slave')"),names=['끈기','워커홀릭','산만함','무기력함'];a.equal(names.filter(n=>text.includes('>'+n+'</a>')).length,1,text);a(text.includes('>'+({1:'끈기',2:'워커홀릭','-1':'산만함','-2':'무기력함'})[s]+'</a>'));
 }
 results.push({name:'single-trait-ui-list',cases:4,status:'PASS'});
 actor(0);run("gs 'jo9_traits','edit','slave','jo9_focus',1");checkCanonical(1);run("gs 'jo9_traits','edit','slave','jo9_work_ethic',1");checkCanonical(2);run("gs 'jo9_traits','edit','slave','jo9_focus',-1");checkCanonical(2);run("gs 'jo9_traits','edit','slave','jo9_work_ethic',1");checkCanonical(0);
 results.push({name:'generic-editor-toggle-priority',cases:1,status:'PASS'});
 // Execute the real once-owned migration and compare every literal actor field to the original.
 const baselineDoc=c.parse(base);
 for(const l of baselineDoc.locations){const s=c.shift(baselineDoc.lines[l.body],5).replace(/^(\s*)for (\w+)\s*=\s*(.*?)\s+to\s+(.*?)(?:\s+step\s+(\d+))?:/gim,(_,sp,v,lo,hi,step)=>`${sp}loop ${v} = ${lo} while ${v} <= ${hi} step ${v} += ${step||1}:`);baselineDoc.lines[l.body]=c.shift(s,-5);}
 const baseline=await initQspEngine(vendor+'/dist/qsp-engine.wasm'),be=[];baseline.on('error',e=>be.push(e));baseline.on('msg',(...args)=>{const cb=args.find(x=>typeof x==='function');if(cb)cb(-1);});
 const br=c.serialize(baselineDoc);baseline.openGame(br.buffer.slice(br.byteOffset,br.byteOffset+br.byteLength),true);
 const brun=s=>{baseline.execCode(s.replace(/\r?\n/g,'\r\n'));a.deepEqual(be,[]);};
 const keys=[...new Set([...body('jo9_dohna_migrate').matchAll(/j9dmactor\['([^']+)'\]/g)].map(m=>m[1]))].filter(k=>!['jo9_focus','jo9_work_ethic','passion_comfort'].includes(k));
 for(let id=8877;id<=8899;id++){
  const setup=`killvar 'slave'\nkillvar 'slave_rate'\nCONST_INT['no_slave']=0\nslave_state=1\nslave_type=${id}\nslave['service']=3\nslave['cook']=4\nslave['jo9_dohna_preset_rev']=0\ngs 'jo9_dohna_migrate','slave'`;
  brun(setup);run(setup);
  for(const key of keys){const value=api.readVariableByKey('slave',key);a.equal(value,baseline.readVariableByKey('slave',key),'fixed '+id+' '+key);nativeAssert("slave["+q(key)+"] = "+value);}
  const f=baseline.readVariableByKey('slave','jo9_focus'),w=baseline.readVariableByKey('slave','jo9_work_ethic'),p=baseline.readVariableByKey('slave','passion_comfort');checkCanonical(w>0||p<0?2:f>0?1:w<0||p>0?-2:f<0?-1:0);
  run("slave['service']=2\ngs 'jo9_dohna_migrate','slave'");a.equal(num("slave['service']"),2,'once-owned migration repeat '+id);
 }
 results.push({name:'real-dohna-once-owned-migrations-unrelated-fields',cases:23,status:'PASS'});
 const chunSetup="killvar 'stock'\nkillvar 'stock_rate'\nstock_type=3040\ngs 'jo9_chunhyang_profile','init'";
 brun(chunSetup);run(chunSetup);run("gs 'jo9_traits','activity_repair','stock'");
 const chunKeys=[...new Set([...body('jo9_chunhyang_profile').matchAll(/stock\['([^']+)'\]/g)].map(m=>m[1]))].filter(k=>!['jo9_focus','jo9_work_ethic','passion_comfort'].includes(k));
 for(const key of chunKeys){const value=api.readVariableByKey('stock',key);a.equal(value,baseline.readVariableByKey('stock',key),'Chunhyang '+key);nativeAssert("stock["+q(key)+"] = "+value);}checkCanonical(2,'stock');
 results.push({name:'real-chunhyang-fixed-profile-unrelated-fields',cases:1,status:'PASS'});
 a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),c.hash(base));
 const result={status:'PASS',engine:'QSP WASM',worldHash:c.hash(raw),cases:results.reduce((n,r)=>n+r.cases,0),results,workUnchanged:true,limits:['FOR extension was translated to equivalent LOOP syntax in memory for the available legacy WASM engine.','Focused native helper/consumer tests; full GUI save loading and visible rendering are separate.','Fixed daily-duty custom activity_sign effects are unchanged.','Legacy repetition subject persists across dates as before; daily upper-tier count resets.']};
 fs.writeFileSync(path.join(__dirname,'native-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 // Re-run the same proven input/assertion sequence in the installed FastQSP client.
 // The fixture contains the original, unconverted candidate locations.
 const fixture=c.parse(raw),nativeStart=fixture.locations.find(l=>l.name==='Start'),marker='JO9_QA_ACTIVITY_stages_COMPLETE';
 fixture.lines[nativeStart.body]=c.shift(['killall','settimer 0',"$counter=''","$ongload=''","$onnewloc=''","gs '#static_base'","gs '#dynamic'",...nativeCommands,'msg '+q(marker),'exit'].join('\r\n').replace(/\r?\n/g,'\r\n'),-5);
 fs.writeFileSync(path.join(__dirname,'native-activity.qsp'),c.serialize(fixture));
 fs.writeFileSync(path.join(__dirname,'native-plan.json'),JSON.stringify([{name:'native-activity',file:path.join(__dirname,'native-activity.qsp'),marker,checkpoint:'Unconverted installed FastQSP; same helper inputs and expected native values, including 23 real migrations.'}],null,2));
 fs.writeFileSync(path.join(__dirname,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 console.log(JSON.stringify({nativeAssertions:nativeCommands.filter(s=>s.startsWith('if (')).length,fixture:path.join(__dirname,'native-activity.qsp')}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
