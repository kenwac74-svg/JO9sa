'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const c=require('../text-workshop/core.cjs');
if(!process.env.VOICE_QSP||!process.env.VOICE_BASELINE||!process.env.QSP_WASM_PACKAGE){console.error('VOICE_QSP, VOICE_BASELINE and QSP_WASM_PACKAGE are required; no verification performed.');process.exit(2);}
const root=__dirname,target=process.env.VOICE_QSP,raw=fs.readFileSync(target),d=c.parse(raw),reference=c.parse(fs.readFileSync(process.env.VOICE_BASELINE));
const b=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),q=x=>"'"+x.replaceAll("'","''")+"'",nl=x=>x.replace(/\r\n|\r|\n/g,'\r\n');
const dyn=b('#dynamic'),a=dyn.indexOf('! JO9 MOD START VOICE_STAGE1_HELPERS'),z=dyn.indexOf('! JO9 MOD END VOICE_STAGE1_HELPERS',a),helpers=dyn.slice(a,z);
const ib=b('interaction'),ha=ib.indexOf('  ! 기존 세이브',ib.indexOf('! JO9 MOD START VOICE_COMPOSE_CALL')),hz=ib.indexOf('\r\n }',ha),hook=ib.slice(ha,hz);
assert(ha>0&&hz>ha);
const selector=fs.readFileSync(__dirname+'/fixtures/voice-1112-original-selector.txt','utf8');
const vendor=process.env.QSP_WASM_PACKAGE,{initQspEngine}=require(vendor+'/dist/node/wasm-engine.cjs');
const reps={ice:[0,0,4,4],proud:[2,2,4,4],flame:[4,4,4,4],calm:[0,0,2,2],plain:[2,2,2,2],frank:[4,4,2,2],doll:[0,0,0,0],meek:[2,2,0,0],fragile:[4,4,0,0]};
const statuses=['reluctant','arrogant','hateful','resistant','lachrymose','soft','obedient','frightened','servile','broken','depresive','horny','hysteric','optimistic','docile'];
let count=0;const samples=[];
(async()=>{
 const api=await initQspEngine(vendor+'/dist/qsp-engine.wasm'),errors=[];api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...args)=>{const cb=args.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1);});
 api.openGame(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),true);
 const run=x=>{api.execCode(nl(x));assert.deepEqual(errors,[]);},str=x=>{run('$qa_read='+x);return api.readVariable('$qa_read');},num=x=>{run('qa_number='+x);return api.readVariable('qa_number');};
 run(helpers);run("$slave_name='QA'\ngs '#txt_man','jo9_voice_1112_data'");
 const setup=(type='plain',tone=2,status='servile',obed=54,k=5)=>`killvar 'slave'\nkillvar 'slave_already_done_recent'\n$slave_name='QA'\n$slave_occupation=${q(tone===1?'maid':tone===2?'nurse':'thief')}\n$slave_psy_status=${q(status)}\nslave['id']=101\nslave['temper']=${reps[type][0]}\nslave['sensitivity']=${reps[type][1]}\nslave['ego']=${reps[type][2]}\nslave['pride']=${reps[type][3]}\nslave['obedience']=${obed}\nslave['moral']=${k%6}\nslave['fear']=${(k+2)%6}\nslave['rational']=${k%6}\nslave['instinct']=${k%6}\nslave['custom']=${k%6}\nslave['spoil']=${k%6}\nslave['sex_sum']=1\nslave['arousal']=${k%6}\nslave['stamina']=${k%6}\nslave['intellect']=${(k+1)%6}\nslave['mood']=${k%3-1}\nslave['daily_reward_count']=1\nslave['daily_punishment_count']=0\nrebell[${q(status)}]=0`;
 const pages=()=>Array.from({length:Math.max(0,num("arrsize('$text')")-1)},(_,i)=>str('$text['+(i+1)+']'));
 const plain=x=>x.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ');
 // The reported original utterance must survive intact, not be cut at 110 chars.
 const original=c.shift(reference.lines[reference.locations.find(x=>x.name==='#txt_man').body],5).split('\r\n').map(code=>({location:'#txt_man',code}));
 const utterance=category=>original.find(x=>x.location==='#txt_man'&&x.code.startsWith('$slave_'+category+'_description[5] = ')).code.match(/= '((?:[^']|'')*)'$/)[1].replaceAll("''","'").replace(/^\[<<\$slave_name>>\]<br>&nbsp;/,'').replace(/<\/div>$/,'');
 run(setup());run("$slave_instinct_description[5]="+q('[QA]<br>&nbsp;'+utterance('instinct')+'</div>')+"\n$slave_custom_description[5]="+q('[QA]<br>&nbsp;'+utterance('custom')+'</div>'));run(hook);
 for(const cat of ['instinct','custom']){const exact=utterance(cat);assert(pages().some(p=>plain(p).includes(exact)),'Original '+cat+'[5] must be one complete utterance');count++;}
 assert(dyn.includes('VOICE_FRAGMENTS_1112'),'New fragment composer connected to actual 1112');count++;
 // Sentinel original facts exercise every original threshold and selection gate.
 run(statuses.map(s=>`$slave_relation_description[${q(s)}]='[QA]<br>&nbsp;<font color="pink">FACT_relation_${s}</font></div>'`).join('\n')+'\n'+['obed','urge','fear','ratio','instinct','custom','spoil','moral'].flatMap(s=>Array.from({length:6},(_,i)=>`$slave_${s}_description[${i}]='[QA]<br>&nbsp;<font color="pink">FACT_${s}_${i}</font></div>'`)).join('\n'));
 let k=0;
 for(const type of Object.keys(reps))for(let tone=1;tone<=3;tone++)for(const state of statuses)for(const obed of [-10,0,1,10,11,20,21,30,31,40,41]){
  run(setup(type,tone,state,obed,k));run(`rebell[${q(state)}]=${k%2?4:0}\nslave['sex_sum']=${k%2}\nslave['daily_reward_count']=${k%2}\nslave['daily_punishment_count']=${k%3===0?1:0}\nslave_already_done_recent['1511']=${k%4}\nslave_already_done_recent['1411']=${(k+1)%4}`);
  run("killvar '$text'\n"+selector);const want=pages().flatMap(p=>p.match(/FACT_[a-z_]+(?:\d+)?/g)||[]);
  const keys=['mood','moral','fear','temper','sensitivity','ego','pride','obedience','daily_reward_count','daily_punishment_count'],before=keys.map(x=>num('slave['+q(x)+']'));
  run(hook);const got=pages(),facts=got.flatMap(p=>p.match(/FACT_[a-z_]+(?:\d+)?/g)||[]);assert.deepEqual(facts,want,{type,tone,state,obed,k});
  for(const page of got){assert.equal((page.match(/\[QA\]/g)||[]).length,1);assert.equal((page.match(/<font\b/g)||[]).length,(page.match(/<\/font>/g)||[]).length);}
  assert.deepEqual(keys.map(x=>num('slave['+q(x)+']')),before);assert(str("$slave['jo9_voice_last1_1112']").includes('|'));count++;k++;
 }
 // Legacy cached helper and missing data must be replaced through the real hook.
 run("$voice_impression={}\nvoice_fragment_revision=0\nkillvar '$voice_pick_fragment'\n"+setup());run(hook);assert(str('$voice_impression').includes('VOICE_FRAGMENTS_1112'));assert.equal(num('voice_fragment_revision'),1);assert(pages().length>0);count++;
 // Depth boundaries (twice-value calculation retains halves).
 for(const [kind,moral,pride,fear,ego,temper,sens,want]of [['vulnerable',4,2,4,0,0,0,1],['vulnerable',4,0,0,0,0,0,2],['hostile',0,0,4,4,4,0,0],['hostile',0,0,1,3,3,0,1],['positive',0,4,0,0,0,0,0],['positive',4,0,0,0,0,0,2]]){
  run(`slave['moral']=${moral}\nslave['pride']=${pride}\nslave['fear']=${fear}\nslave['ego']=${ego}\nslave['temper']=${temper}\nslave['sensitivity']=${sens}`);assert.equal(num('dyneval($voice_depth_level,'+q(kind)+')'),want);count++;
 }
 // Typed and contextual candidates each carry independently selected IDs.
 for(const type of Object.keys(reps))for(const state of ['hateful','frightened','servile','docile']){
  run(setup(type,2,state,40,4));run("slave['mood']=3\nslave_already_done_recent['1411']=3\nslave['daily_reward_count']=1");
  const seen=[];for(let i=0;i<6;i++){run(hook);const h=str("$slave['jo9_voice_last1_1112']"),text=pages().map(plain).join(' ');assert(!/1112_[a-z]+_[123]_[012]$/.test(h));if(state==='hateful')assert(!/인정받았다는 사실이 기뻐|감사해요|더 열심히 할게요/.test(text));seen.push(h);count++;}
  // A one-row compatible pool may repeat. Never expose a forbidden feeling
  // merely to satisfy variation: frank/fearful at hint-depth is this case.
  if(type==='frank'&&state==='frightened')assert.equal(new Set(seen).size,1);
  else assert(new Set(seen).size>1||type==='doll',JSON.stringify({type,state,seen,pages:pages()}));
  if(type==='ice'&&state==='hateful'){
   assert(new Set(seen).size>3,'Independent 2x3 fragment pools must produce more than three complete-response variants');
   const eventIds=seen.map(h=>h.match(/\|D=([^|]+)\|/)[1]);for(let i=1;i<eventIds.length;i++)assert(!eventIds.slice(Math.max(0,i-2),i).includes(eventIds[i]),'Avoid the last two event fragments when three compatible rows exist');count++;
  }
  if(samples.length<9)samples.push({type,state,history:seen.slice(0,3),pages:pages()});
 }
 // Declined talk cannot invoke composer or modify the two history strings.
 const rb=b('interaction_result'),talk=rb.slice(rb.indexOf("if $interaction_type = 'talk':"),rb.indexOf('!interaction type - drug'));
 const h1=str("$slave['jo9_voice_last1_1112']"),h2=str("$slave['jo9_voice_last2_1112']");run("killvar '$text'\n$interaction_type='talk'\ninteraction_slave['res']=-1\n$slave_psy_status='docile'\n$refuse_talk['docile']='REFUSED'\n$special_part="+q(hook));run(talk);assert.equal(str('$text[1]'),'REFUSED');assert.equal(str("$slave['jo9_voice_last1_1112']"),h1);assert.equal(str("$slave['jo9_voice_last2_1112']"),h2);count++;
 run(setup('plain',2,'servile',40,4));run(hook);run("$ongload=''\n$onnewloc=''");
 const beforeSave={pages:pages(),one:str("$slave['jo9_voice_last1_1112']"),two:str("$slave['jo9_voice_last2_1112']")},saved=api.saveGame();run(hook);api.loadSave(saved);assert.deepEqual(errors,[]);assert.deepEqual({pages:pages(),one:str("$slave['jo9_voice_last1_1112']"),two:str("$slave['jo9_voice_last2_1112']")},beforeSave);count++;
 const tempNames=[...new Set([...dyn.matchAll(/killvar '([^']+)'/g)].map(x=>x[1]))].filter(x=>/^\$?jo9_v(f|depth)/.test(x));for(const name of tempNames){assert.equal(num('arrsize('+q(name)+')'),0,name+' must be cleaned after the real hook');count++;}
 const result={passed:count,failed:0,hash:c.hash(raw),selectorCases:k,engine:api.version(),samples};if(process.env.VOICE_QA_REPORT)fs.writeFileSync(process.env.VOICE_QA_REPORT,JSON.stringify(result,null,2));console.log(JSON.stringify({passed:count,failed:0,hash:result.hash,selectorCases:k}));
})().catch(e=>{console.error(e);process.exitCode=1;});
