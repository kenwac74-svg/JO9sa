'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',root='G:/Codex/tmp/jo9-private-feelings-fix-20261022';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',source=game+'/jack.qsp';
const expected='baaa39836b905e748a6ec8f356494b0260160a364164bc3684812394e4a9dbc9';
const id='2026-10-22_peer_relation_zero_id_and_variants';
const body=(doc,n)=>core.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const crlf=s=>s.replace(/\r?\n/g,'\r\n');
const count=(s,x)=>s.split(x).length-1;
function replace(s,a,b){if(count(s,a)!==1)throw Error('Nonunique replacement: '+a.slice(0,100));return s.replace(a,b);}
function slice(s,a,b){const at=s.indexOf(a),end=s.indexOf(b,at);if(at<0||end<0)throw Error('Missing boundaries: '+a);return s.slice(at,end).trimEnd();}
const wrap=(key,s)=>`! JO9 MOD START ${key} | ${id}\r\n${s}\r\n! JO9 MOD END ${key}`;
function manifest(dir){const result={};for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('Unexpected link '+e.name);const p=path.join(dir,e.name);if(e.isDirectory()){for(const[k,v]of Object.entries(manifest(p)))result[e.name+'/'+k]=v;}else result[e.name]={bytes:fs.statSync(p).size,sha256:core.hash(fs.readFileSync(p))};}return result;}
function prepare(){
 fs.mkdirSync(root,{recursive:true});
 const raw=fs.readFileSync(source);if(core.hash(raw)!==expected)throw Error('WORK changed before baseline snapshot');
 if(fs.existsSync(root+'/before.qsp')){if(core.hash(fs.readFileSync(root+'/before.qsp'))!==expected)throw Error('Conflicting snapshot');}
 else fs.writeFileSync(root+'/before.qsp',raw);
 const state='G:/Codex/tmp/jo9-private-feelings-state-20261022';fs.mkdirSync(state,{recursive:true});
 fs.copyFileSync(game+'/save/auto_day.sav',state+'/state.sav');
 const v={sourceSha256:expected,fullSha256:core.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp')),frozenSaveSha256:core.hash(fs.readFileSync(state+'/state.sav')),saveInventory:manifest(game+'/save')};
 fs.writeFileSync(root+'/before.json',JSON.stringify(v,null,2));console.log(JSON.stringify({sourceSha256:expected,saves:Object.keys(v.saveInventory).length,frozenSaveSha256:v.frozenSaveSha256}));
}
function build(){
 const raw=fs.readFileSync(root+'/before.qsp'),doc=core.parse(raw);qa.inspectWorld(raw);if(core.hash(raw)!==expected||core.hash(fs.readFileSync(source))!==expected)throw Error('Stale baseline');
 const edits=[];
 function add(loc,old,newText){const s=body(doc,loc);if(count(s,old)!==1)throw Error('Bad edit '+loc);edits.push({location:loc,field:'body',old,new:newText,count:1});doc.lines[doc.locations.find(l=>l.name===loc).body]=core.shift(s.replace(old,newText),-5);}
 const mutual="if slave1['love'] = slave2['id'] and slave2['love'] = slave1['id']: sa_relations += 5";
 const validMutual="if slave1['id'] > 0 and slave2['id'] > 0 and slave1['love'] = slave2['id'] and slave2['love'] = slave1['id']: sa_relations += 5";
 add('origins_relations',mutual,wrap('PEER_VALID_MUTUAL_DIALOGUE',validMutual));
 let old=slice(body(doc,'origins_relations'),'if sa_relations < 0 and slave1["other_rel"] >= acc_rel[\'good2\']:', '!msg');
 let val=replace(old,'and slave1["love"] ! slave2["id"]:', 'and (slave2["id"] <= 0 or slave1["love"] ! slave2["id"]):');
 val=replace(val,'or  slave1["love"] = slave2["id"]:', 'or (slave2["id"] > 0 and slave1["love"] = slave2["id"]):');
 add('origins_relations',old,wrap('PEER_VALID_LOVE_DIALOGUE',val));
 add('relations_fastcalc',mutual,wrap('PEER_VALID_MUTUAL_DAILY',validMutual));
 old=slice(body(doc,'relations_fastcalc'),'if slave1[\'other_rel\'] > acc_rel["good3"] and slave2[\'other_rel\'] > acc_rel["good3"]:', '! Конец любви');
 val=replace(old,"if slave1['other_rel'] >", "if slave2['id'] > 0 and slave1['other_rel'] >");
 val=replace(val,'if slave2["love"] ! slave1["id"]:', 'if slave1["id"] <= 0 or slave2["love"] ! slave1["id"]:');
 add('relations_fastcalc',old,wrap('PEER_VALID_LOVE_FORMATION',val));
 old=slice(body(doc,'relations_fastcalc'),'if slave1["love"] = slave2["id"]:', 'if slave1["love"] ! slave2["id"]');
 val=replace(old,'if slave1["love"] = slave2["id"]:', 'if slave2["id"] > 0 and slave1["love"] = slave2["id"]:');
 val=replace(val,'if slave2["love"] ! slave1["id"] and no_love_chance > 95:', 'if (slave1["id"] <= 0 or slave2["love"] ! slave1["id"]) and no_love_chance > 95:');
 add('relations_fastcalc',old,wrap('PEER_VALID_LOVE_BREAKUP',val));
 for(const [actor,peer]of [['slave','assistant'],['assistant','slave']]){
  const s=body(doc,'next_day');
  const at=s.indexOf(`\tif ${actor}['<<${peer}["id"]>>'] >= acc_rel['good4']:`),end=s.indexOf('\r\n\tend',at)+'\r\n\tend'.length;
  if(at<0||end<6)throw Error('Daily flag boundary');old=s.slice(at,end);
  val=`\t${actor}['pos_sa_love'] = 0\r\n\tif ${peer}['id'] > 0 and ${actor}['<<${peer}["id"]>>'] >= acc_rel['good4'] and ${actor}['love'] = ${peer}['id']: ${actor}['pos_sa_love'] = 1`;
  add('next_day',old,wrap('PEER_VALID_LOVE_MOOD_'+actor.toUpperCase(),val));
  old=`if ${peer}_state = CONST_INT['slave_exist'] and ${actor}["love"] = ${peer}["id"]: `;
  val=`if ${peer}_state = CONST_INT['slave_exist'] and ${peer}["id"] > 0 and ${actor}["love"] = ${peer}["id"]: `;
  add('next_day',old,wrap('PEER_VALID_LOVER_RETURN_'+actor.toUpperCase(),val));
  old=`\tif ${actor}['love'] = ${peer}['id']: `;
  val=`\tif ${peer}['id'] > 0 and ${actor}['love'] = ${peer}['id']: `;
  add('next_day',old,wrap('PEER_VALID_LOVE_JEALOUSY_'+actor.toUpperCase(),val));
 }
 for(const e of JSON.parse(fs.readFileSync(root+'/editorial/edits.json','utf8')))add(e.location,crlf(e.old),crlf(e.new));
 const gates=body(doc,'interaction').split('\r\n');
 const gateLines=gates.map((s,i)=>[s,i]).filter(([s])=>s.includes('if voice_fragment_revision ! 7:'));
 if(gateLines.length!==3)throw Error('Unexpected cached-bank caller count');
 for(const [[line,i],index]of gateLines.map((v,i)=>[v,i])){
  const context=gates.slice(i-1,i+2).join('\r\n');
  add('interaction',context,context.replace(line,wrap('PEER_DIALOGUE_BANK_CALLER_'+(index+1),line.replace('voice_fragment_revision ! 7','voice_fragment_revision ! 8'))));
 }
 old="if voice_fragment_revision=7 and arrsize('$voice_fragment_ids')=9120: exit";
 add('#txt_man',old,wrap('PEER_DIALOGUE_BANK_CACHE',old.replace('revision=7','revision=8')));
 add('#txt_man','voice_fragment_revision=7',wrap('PEER_DIALOGUE_BANK_REVISION','voice_fragment_revision=8'));
 const candidate=core.serialize(doc),inspection=qa.inspectWorld(candidate);fs.writeFileSync(root+'/candidate.qsp',candidate);
 fs.mkdirSync(root+'/mods',{recursive:true});const mod={id,before_sha256:expected,after_sha256:core.hash(candidate),edits};fs.writeFileSync(root+'/mods/'+id+'.json',JSON.stringify(mod,null,2));
 const result={id,beforeSha256:expected,afterSha256:core.hash(candidate),bytes:candidate.length,editCount:edits.length,changedLocations:[...new Set(edits.map(e=>e.location))],inspection};fs.writeFileSync(root+'/build.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
function selector(input,label){
 const raw=fs.readFileSync(input),doc=core.parse(raw),s=body(doc,'origins_relations');
 const block=slice(s,'if sa_relations < 0 and slave1["other_rel"] >= acc_rel[\'good2\']:', '!msg').replace(/\r\n! JO9 MOD END PEER_VALID_LOVE_DIALOGUE$/,'');
 if(!block.trimEnd().endsWith('end'))throw Error('Unexpected selector boundary');
 const setup=['killall',"acc_rel['bad3']=-80","acc_rel['bad2']=-40","acc_rel['bad1']=-20","acc_rel['good1']=20","acc_rel['good2']=40","acc_rel['good3']=80",'sa_relations=0','int_index=3',"$voice_native={$result=$args[0]}"];
 const cases=[];
 for(const rel of [-100,-80,-40,-20,0,20,21,40,41,70,80,81,100])for(const target of[0,123])for(const love of[0,123]){
  const romance=target>0&&love===target;
  const want=rel<-80?'bad3':rel<-40?'bad2':rel<-20?'bad1':rel<=20?'indiff':rel<=40?'good1':!romance?'good2':'good3';
  cases.push({rel,target,love,want});
  setup.push(`slave1['other_rel']=${rel}`,`slave2['id']=${target}`,`slave1['love']=${love}`,"$i_rel='RESET'","$text[6]=''","gs 'actual_branch'",`if $i_rel ! '${want}' or instr($text[6],'1117_acc_itog_${want}_3')=0: msg 'JO9_QA_ASSERT_rel_${rel}_target_${target}_love_${love}_want_${want}' & exit`);
 }
 const marker='JO9_QA_PEERFIX_selector_matrix_COMPLETE';setup.push(`msg '${marker}'`);
 const dir=root+'/selector-'+label;fs.mkdirSync(dir,{recursive:true});
 const locs=[['Start',setup.join('\r\n')],['actual_branch',block]],lines=doc.lines.slice(0,4);lines[3]=core.shift(String(locs.length),-5);for(const[n,b]of locs)lines.push(core.shift(n,-5),'',core.shift(b,-5),core.shift('0',-5));lines.push('');const fixture=core.serialize({lines});qa.inspectWorld(fixture);fs.writeFileSync(dir+'/selector-matrix.qsp',fixture);
 const plan=[{name:'selector-matrix',file:dir+'/selector-matrix.qsp',marker,checkpoint:'52 relationship boundary/zero/positive/one-way cases from exact production selector'}];fs.writeFileSync(dir+'/plan.json',JSON.stringify(plan,null,2));
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json'],{encoding:'utf8',windowsHide:true,timeout:60000});
 const results=JSON.parse(fs.readFileSync(dir+'/client-results.json','utf8').replace(/^\uFEFF/,''));const log=fs.readFileSync(dir+'/selector-matrix-stderr.log','utf8');
 const assertion=log.match(/JO9_QA_ASSERT_[^"\r\n]+/);const result={sourceSha256:core.hash(raw),caseCount:cases.length,results,assertion:assertion?.[0]||null};fs.writeFileSync(dir+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(label==='baseline'){if(results[0].pass||!assertion)throw Error('Baseline must fail by relationship assertion');}
 else if(!results[0].pass)throw Error('Candidate selector failed');
}
function cacheTest(input,label){
 const raw=fs.readFileSync(input),doc=core.parse(raw),fixed=core.parse(fs.readFileSync(root+'/candidate.qsp'));
 const text=body(doc,'#txt_man'),gates=body(doc,'interaction').split('\r\n').filter(s=>/if voice_fragment_revision ! \d+:/.test(s));if(gates.length!==3)throw Error('Three real caller gates required');
 const fragment=JSON.parse(fs.readFileSync(root+'/editorial/edits.json','utf8'))[0];
 const oldText=crlf(fragment.old).split('\r\n').filter(s=>s.startsWith('$voice_fragment_text['));
 const expectedText=crlf(fragment.new).split('\r\n').filter(s=>s.startsWith('$voice_fragment_text['));if(oldText.length!==9||expectedText.length!==9)throw Error('Nine text lines required');
 const marker='JO9_QA_PEERCACHE_existing_bank_COMPLETE';
 const code=['killall','settimer 0','autosave=0','decadesave=0',"$counter=''","$onnewloc=''","slave['id']=123","slave['love']=456","slave['456']=70","$slave['jo9_voice_last1_native_1117_acc_itog_good3_3']='KEEP_HISTORY'",'qa_actor_id=123'];
 for(const [gate,i]of gates.map((s,i)=>[s,i])){
  if(i===0)code.push('voice_fragment_revision=7',"$voice_fragment_ids[9119]='QA_STALE_BANK'",...oldText);
  code.push(gate);
  code.push(`if voice_fragment_revision ! 8: msg 'JO9_QA_ASSERT_cache_gate_${i+1}' & exit`);
  for(const line of expectedText){const at=line.indexOf('=');code.push(`if ${line.slice(0,at)} ! ${line.slice(at+1)}: msg 'JO9_QA_ASSERT_cached_text_${i+1}' & exit`);}
 }
 code.push("$voice_fragment_text['qa_cache_skip_sentinel']='KEEP'","gs '#txt_man','jo9_voice_fragment_data'","if $voice_fragment_text['qa_cache_skip_sentinel'] ! 'KEEP': msg 'JO9_QA_ASSERT_revision8_rebuilt' & exit","if slave['id'] ! 123 or slave['love'] ! 456 or slave['456'] ! 70 or $slave['jo9_voice_last1_native_1117_acc_itog_good3_3'] ! 'KEEP_HISTORY': msg 'JO9_QA_ASSERT_actor_history_changed' & exit",`msg '${marker}'`);
 const lines=doc.lines.slice(0,4),locs=[['Start',code.join('\r\n')],['#txt_man',text]];lines[3]=core.shift(String(locs.length),-5);for(const[n,b]of locs)lines.push(core.shift(n,-5),'',core.shift(b,-5),core.shift('0',-5));lines.push('');const fixture=core.serialize({lines});qa.inspectWorld(fixture);
 const dir=root+'/cache-'+label;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/existing-bank.qsp',fixture);fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'existing-bank',file:dir+'/existing-bank.qsp',marker,checkpoint:'Existing revision7/9120 bank refreshes through all3 actual caller gates;9 newtexts;revision8 skips rebuild;actor history preserved'}],null,2));
 cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json'],{encoding:'utf8',windowsHide:true,timeout:60000});
 const results=JSON.parse(fs.readFileSync(dir+'/client-results.json','utf8').replace(/^\uFEFF/,'')),log=fs.readFileSync(dir+'/existing-bank-stderr.log','utf8'),assertion=log.match(/JO9_QA_ASSERT_[^"\r\n]+/);
 const result={sourceSha256:core.hash(raw),fixtureBytes:fixture.length,actualCallerCount:3,newTextCount:9,results,assertion:assertion?.[0]||null};fs.writeFileSync(dir+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(label==='baseline'){if(results[0].pass||!assertion)throw Error('Expected cache baseline assertion');}else if(!results[0].pass)throw Error('Candidate cache refresh failed');
}
const mode=process.argv[2];if(mode==='prepare')prepare();else if(mode==='build')build();else if(mode==='selector')selector(process.argv[3],process.argv[4]);else if(mode==='cache')cacheTest(process.argv[3],process.argv[4]);else throw Error('Unknown mode');
