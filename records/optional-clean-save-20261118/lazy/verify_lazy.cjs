'use strict';
// Focused isolated engine checks. No game, source or save file is written.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input=process.argv.slice(2).find(arg=>!arg.startsWith('--'))||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const candidate=process.argv.includes('--candidate');
let raw=fs.readFileSync(input),patchModule;
if(candidate){patchModule=require('./lazy_patch.cjs');raw=patchModule.buildPatch(raw).candidate;}
const doc=core.parse(raw),body=name=>core.shift(doc.lines[doc.locations.find(l=>l.name===name).body],5);
const txt=body('#txt_man'),data=txt.slice(txt.indexOf(':jo9_voice_fragment_data'));
const dyn=body('#dynamic'),pickerStart=dyn.indexOf('$voice_pick_fragment = {'),pickerEnd=dyn.indexOf('\r\n! JO9 MOD END R05_VOICE_VOICE_PICK_FRAGMENT_20261113',pickerStart);
assert(pickerStart>=0&&pickerEnd>pickerStart);
const pickerAssignment=dyn.slice(pickerStart,pickerEnd);
const q=s=>"'"+s.replaceAll("'","''")+"'",crlf=s=>s.replace(/\r\n|\r|\n/g,'\r\n');
function world(locations){
 const lines=['QSPGAME','','',core.shift(String(locations.length),-5)];
 for(const [name,code]of locations)lines.push(core.shift(name,-5),'',core.shift(code,-5),core.shift('0',-5));
 lines.push('');return Buffer.from(lines.join('\r\n'),'utf16le');
}
const compatible=s=>s.replace(/^(\s*)for\s+([\w$]+)\s*=\s*(.*?)\s+to\s+(.*?)(?:\s+step\s+(-?\d+))?:/gim,(_,sp,v,lo,hi,step)=>`${sp}loop ${v} = ${lo} while ${v} ${(step||'1').startsWith('-')?'>=':'<='} ${hi} step ${v} += ${step||1}:`);
const isolated=world([['Start',''],['#txt_man',data],['jo9_plain_voice',compatible(body('jo9_plain_voice'))]]);
const vendor=process.env.JO9_RUNTIME_VENDOR||'G:/somi/JO9sa/tools/modding-hub/vendor/qsp';
const {initQspEngine}=require(path.join(vendor,'wasm-engine.cjs'));
const emit=process.stdout.write.bind(process.stdout);console.log=()=>{};
(async()=>{
 const api=await initQspEngine(path.join(vendor,'qsp-engine.wasm')),errors=[];
 api.on('error',e=>errors.push(e));
 for(const event of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(event,(...args)=>{const cb=args.find(x=>typeof x==='function');if(cb)cb(event==='input'?'':event==='is_play'?false:event==='version'?'5.7.0':-1);});
 api.openGame(isolated.buffer.slice(isolated.byteOffset,isolated.byteOffset+isolated.byteLength),true);
 const run=code=>{api.execCode(crlf(code));assert.deepEqual(errors,[],'isolated QSP execution must not error');};
 const num=expr=>{run('qa_number='+expr);return api.readVariable('qa_number');};
 const str=expr=>{run('$qa_string='+expr);return api.readVariable('$qa_string');};
 const checks=[];
 const check=(name,fn)=>{const start=Date.now();fn();checks.push({name,status:'PASS',elapsedMs:Date.now()-start});};
 check('ordinary database refresh keeps small tables while leaving heavy bank absent',()=>{
  run("slave['id']=101\nslave['mood']=3\n$slave['jo9_voice_last1_1112']='history-sentinel'\n$text[1]='selected-page-sentinel'\n$special_part='pending-callback-sentinel'\n$voice_fact_emotion['stale']='old'\n$voice_flow_original['stale']='old'\n$voice_flow_override['stale']='old'\ngs '#txt_man'");
  assert.equal(num("arrsize('$voice_fragment_ids')"),0,'default refresh must not eagerly build immutable bank');
  assert.equal(num('voice_fragment_revision'),0);
  assert.equal(num("arrsize('$voice_fact_emotion')"),63);
  assert.equal(num("arrsize('$voice_flow_original')"),17);
  assert.equal(num("arrsize('$voice_flow_override')"),17);
  assert.equal(str("$voice_fact_emotion['stale']"),'');
  assert.equal(str("$voice_flow_original['stale']"),'');
  assert.equal(str("$voice_flow_override['stale']"),'');
  assert.equal(num("slave['id']"),101);assert.equal(num("slave['mood']"),3);
  assert.equal(str("$slave['jo9_voice_last1_1112']"),'history-sentinel');
  assert.equal(str('$text[1]'),'selected-page-sentinel');
  assert.equal(str('$special_part'),'pending-callback-sentinel');
 });
 check('central picker rebuilds once and retains its arguments and selected pages',()=>{
  run(pickerAssignment);
  run("$jo9_vf_type='plain'\njo9_vf_tone=1\n$jo9_vf_mode='servile'\njo9_vf_actor_type=999\njo9_vf_actor_plain=-1\n$qa_picked=$dyneval($voice_pick_fragment,'qa_no_authored_pool','fallback-sentinel',0,'native',1112)");
  assert.equal(num('voice_fragment_revision'),8);
  assert.equal(num("arrsize('$voice_fragment_ids')"),9120);
  assert.equal(str('$qa_picked'),'fallback-sentinel','GS must preserve picker arguments');
  assert.equal(str('$text[1]'),'selected-page-sentinel');
  assert.equal(str('$special_part'),'pending-callback-sentinel');
  assert.equal(str("$slave['jo9_voice_last1_1112']"),'history-sentinel');
 });
 check('ordinary refresh does not invalidate an existing loaded bank',()=>{
  const index=str('$voice_fragment_ids[0]'),before=str('$voice_fragment_text['+q(index)+']');
  run("$voice_fragment_text["+q(index)+"]='bank-lifecycle-sentinel'\ngs '#txt_man'");
  assert.equal(num('voice_fragment_revision'),8);
  assert.equal(str('$voice_fragment_text['+q(index)+']'),'bank-lifecycle-sentinel');
  run("gs '#txt_man','jo9_voice_fragment_data'");
  assert.equal(str('$voice_fragment_text['+q(index)+']'),'bank-lifecycle-sentinel','dedicated call keeps valid bank');
  run('voice_fragment_revision=0\ngs '+q('#txt_man')+','+q('jo9_voice_fragment_data'));
  assert.equal(str('$voice_fragment_text['+q(index)+']'),before,'invalidated bank deterministically regenerates');
 });
 check('missing IDs rebuild even when stale revision says current',()=>{
  run("killvar '$voice_fragment_ids'\nvoice_fragment_revision=8\n$qa_picked=$dyneval($voice_pick_fragment,'qa_no_authored_pool','second-fallback',0,'native',1112)");
  assert.equal(num("arrsize('$voice_fragment_ids')"),9120);
  assert.equal(str('$qa_picked'),'second-fallback');
 });
 if(candidate)check('exact plural orphan cleanup preserves singular master-vars definition',()=>{
  const source=body('#static_base'),start=source.indexOf('! JO9 MOD START JO9_SAVE_VOICE_LAZY_20261118_ORPHAN'),end=source.indexOf('! JO9 MOD END JO9_SAVE_VOICE_LAZY_20261118_ORPHAN',start);
  assert(start>=0&&end>start);
  run("$masters_vars[0]='old-one'\n$masters_vars[1]='old-two'\n$master_vars[0]='singular-sentinel'\n"+source.slice(start,end));
  assert.equal(num("arrsize('$masters_vars')"),0);
  assert.equal(str('$master_vars[0]'),'singular-sentinel');
 });
 if(candidate)check('all untouched source values and locations remain byte-identical',()=>{
  const source=fs.readFileSync(input),original=core.parse(source),before=new Map(original.locations.map(l=>[l.name,core.shift(original.lines[l.body],5)]));
  const allowed=new Set(['#txt_man','#dynamic','#static_base']);
  for(const location of doc.locations){if(!allowed.has(location.name))assert.equal(body(location.name),before.get(location.name));assert.equal(doc.lines[location.desc],original.lines[location.desc]);}
  // Authored data rows are unchanged; additions contain identifiers/labels only.
  const assignments=s=>s.split('\r\n').filter(line=>/^\s*\$?(?:voice_fragment_\w+|voice_fact_emotion|voice_flow_original|voice_flow_override)\[/.test(line));
  assert.deepEqual(assignments(txt),assignments(before.get('#txt_man')));
  assert(core.serialize(core.parse(raw)).equals(raw));
  assert(!/(?<!\r)\n|\r(?!\n)/.test(txt));
  const changedIndices=new Set(doc.locations.filter(l=>allowed.has(l.name)).map(l=>l.body));
  assert.equal(doc.lines.length,original.lines.length);
  for(let i=0;i<doc.lines.length;i++)if(!changedIndices.has(i))assert.equal(doc.lines[i],original.lines[i],'untouched QSP field '+i);
 });
 const report={status:'PASS',candidate,inputHash:core.hash(fs.readFileSync(input)),candidateHash:core.hash(raw),engine:api.version(),checks,limitations:['Executes extracted real data-entry region and real picker in a three-location isolated WASM world. Full game native integration belongs to root. No GUI or on-save integration was tested here.']};
 fs.writeFileSync(path.join(__dirname,candidate?'green.json':'baseline-unexpected-pass.json'),JSON.stringify(report,null,2)+'\n');
 emit(JSON.stringify({status:report.status,candidate,checks:checks.length,engine:report.engine})+'\n');
})().catch(error=>{const report={status:'FAIL',candidate,expectedBaselineFailure:!candidate,message:error.message};fs.writeFileSync(path.join(__dirname,candidate?'green-failure.json':'red.json'),JSON.stringify(report,null,2)+'\n');emit(JSON.stringify(report)+'\n');process.exitCode=1;});
