'use strict';
// Read-only release gate. Only disposable copies are instrumented or patched.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process'),{randomBytes}=require('node:crypto');
const core=require('../text-workshop/core.cjs'),{inspect}=require('./check-qsp-line-endings.cjs');
const {inspectMarkerBoundaries}=require('./check-qsp-marker-boundaries.cjs');
// JO9 MOD START SEED_NAMESPACE_GUARD_IMPORT_20261020
const {assertRegistry}=require('./check-slave-template-ids.cjs');
// JO9 MOD END SEED_NAMESPACE_GUARD_IMPORT_20261020
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function inspectWorld(raw){
 const doc=core.parse(raw);
 if(!core.serialize(doc).equals(raw))throw Error('QSP byte roundtrip failed');
 const names=new Set();
 for(const l of doc.locations){const key=l.name.toUpperCase();if(!key||names.has(key))throw Error('Empty or duplicate location: '+l.name);names.add(key);}
 const markerCheck=inspectMarkerBoundaries(raw);
 if(markerCheck.issues.length){const e=Error('Invalid marker boundary: '+markerCheck.issues.length);e.issues=markerCheck.issues;throw e;}
 const r=inspect(raw);
 if(r.issues.length){const e=Error('Invalid line endings: '+r.issues.length);e.issues=r.issues;throw e;}
 // Location action bodies are scripts too; the older standalone checker only checks main bodies.
 for(const l of doc.locations){const start=l.body-2,n=Number(core.shift(doc.lines[start+3],5));for(let i=0;i<n;i++){
  const body=core.shift(doc.lines[start+6+i*3],5);
  if(/\r(?!\n)|(?<!\r)\n/.test(body))throw Error('Invalid line ending in action '+i+' of '+l.name);
 }}
 return{sha256:r.sha256,bytes:raw.length,locations:r.locations,roundtrip:true,lineEndingIssues:0};
}
function verdict(checks,profile){
 if(checks.some(c=>c.status==='FAIL'))return 'FAIL';
 if(checks.some(c=>c.required&&c.status!=='PASS'))return 'INCOMPLETE';
 return profile==='static'?'STATIC_PASS':'PASS';
}
function validatePatchSet(patches,before,after){
 if(!patches.length)throw Error('Empty patch directory');
 for(const p of patches){
  if(!p.id)throw Error('Missing patch id');
  for(const e of p.edits||[]){
   if(typeof e.old!=='string'||!e.old.length)throw Error('Empty or invalid old in '+p.id);
   if(typeof e.new!=='string'||!['body','desc'].includes(e.field)||!e.location||!Number.isSafeInteger(e.count)||e.count<1)throw Error('Invalid edit in '+p.id);
  }
  for(const l of p.add_locations||[])if(!l.name||typeof l.body!=='string'||(l.actions||[]).length)throw Error('Invalid added location in '+p.id);
  if(!(p.edits||[]).length&&!(p.add_locations||[]).length)throw Error('Empty patch '+p.id);
 }
 if(!/^[a-f\d]{64}$/i.test(patches[0].before_sha256||'')||patches[0].before_sha256.toLowerCase()!==before)throw Error('Pinned baseline hash does not match');
 const last=patches.at(-1);
 if(!/^[a-f\d]{64}$/i.test(last.after_sha256||'')||last.after_sha256.toLowerCase()!==after)throw Error('Pinned candidate hash does not match');
}
function primeState(doc){
 const lines=[];
 for(const v of doc.vars){
  if(['ARGS','RESULT','COUNTER','ONGLOAD','ONNEWLOC'].includes(v.name)||!/^[_\p{L}][_\p{L}\p{N}]*$/u.test(v.name))continue;
  const aliases=new Map(v.idx.map(([i,key])=>[i,key]));
  for(let i=0;i<v.values.length;i++){
   const [n,t]=v.values[i],key=aliases.has(i)?aliases.get(i):i;
   if(typeof key==='string'&&/[\r\n\0]/.test(key))continue;
   const ref=v.name+'['+(typeof key==='string'?quote(key):key)+']';
   if(n!=='0'&&/^-?\d+$/.test(n))lines.push(ref+'='+n);
   if(t&&t.length<600&&!/[\r\n\0]/.test(t)&&!t.includes('<<'))lines.push('$'+ref+'='+quote(t));
  }
 }
 lines.push('autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0');
 return{code:lines.join('\r\n'),assignments:lines.length};
}
function buildSmoke(raw,prime,revision,token){
 if(!Number.isSafeInteger(revision)||revision<1)throw Error('Explicit positive cache revision required');
 if(!/^[A-Z0-9]+$/.test(token))throw Error('Unsafe marker token');
 const names=['home','newgame','editor-slave','editor-assistant','cache','daily','city-weapons','city-beauty','battle-entry'];
 return names.map(name=>{
  const d=core.parse(raw),loc=n=>{const l=d.locations.find(l=>l.name===n);if(!l)throw Error('Missing smoke location '+n);return l;};
  const required=['Start','main_screen','end_day_screen','menu_form','refresh_database','init_game','start_game','next_day','$newloc'];required.forEach(loc);
  const marker='JO9_QA_'+token+'_'+name.replaceAll('-','_')+'_COMPLETE';
  let setup=prime+"\r\ngs 'refresh_database'\r\nis_home=1\r\ncity_district=-1\r\nmenu_form=0\r\n";
  let call="gs 'menu_form'",checkpoint='main_screen',assertion='';
  if(name==='newgame')call="gs 'init_game'\r\n$estate='slum_house'\r\n$master_name='QA'\r\ngs 'start_game'";
  if(name.startsWith('editor-'))setup+="menu_form=2107\r\n$jo9_trait_editor_role="+quote(name.slice(7))+'\r\n';
  if(name==='cache'){
   setup+='jo9_traits_revision='+(revision-1)+"\r\ncode_defined['interaction_result_make_slave_do']=1\r\ncode_defined['interaction_result_self_sex_lesson']=1\r\n$interaction_result_make_slave_do='QA stale template'\r\n";
   assertion='jo9_traits_revision='+revision+" and code_defined['interaction_result_make_slave_do']=0 and code_defined['interaction_result_self_sex_lesson']=0";
  }
  if(name==='daily'){setup+='day=3\r\ndecadecount=3\r\n';call="gs 'next_day'";checkpoint='end_day_screen';}
  if(name==='city-weapons'||name==='city-beauty'){
   const city=name==='city-weapons'?{id:111,npc:'менхантер',place:'shop_wpn'}:{id:11631,npc:'estelindel',place:'beauty_shop'};
   setup+="is_home=0\r\ncity_district=1\r\nnpc_progress['Hassa']=0\r\ninteraction_city="+city.id+'\r\n';
   call="gt 'interaction_city'";checkpoint='interaction_screen_city';
   assertion='$npc_id='+quote(city.npc)+' and $place='+quote(city.place);
  }
  if(name==='battle-entry'){
   setup+='get_weapon=1\r\ncombatant=0\r\nmemcf=0\r\nколичество_врагов=0\r\n';
   call="gt 'начать_бой'";checkpoint='боевое_меню';
   // Check the menu initialization dispatch; this is not a combat-balance test.
   d.lines[loc(checkpoint).body]='';
   d.lines[loc('боевой_интерфейс').body]=core.shift("msg 'JO9_QA_BATTLE_MENU_WAS_SKIPPED'",-5);
  }
  const check=assertion?'if '+assertion+':\r\n msg '+quote(marker)+"\r\nelse\r\n msg 'JO9_QA_ASSERTION_FAILED'\r\nend":'msg '+quote(marker);
  d.lines[loc('Start').body]=core.shift(setup+call,-5);
  const end=loc(checkpoint);d.lines[end.body]=core.shift(core.shift(d.lines[end.body],5)+'\r\n'+check,-5);
  return{name,marker,checkpoint,raw:core.serialize(d)};
 });
}
function realPath(p){
 const abs=path.resolve(p);if(fs.existsSync(abs))return fs.realpathSync(abs);
 const parent=path.dirname(abs);return parent===abs?abs:path.join(realPath(parent),path.basename(abs));
}
function assertOutside(output,protectedDirs){
 const out=realPath(output).toLowerCase();
 for(const p of protectedDirs){const dir=realPath(p).toLowerCase(),rel=path.relative(dir,out);if(!rel||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))throw Error('Output must be outside protected input directories: '+p);}
}
function clientRunnerTiming(option,probeCount){
 const timeoutSeconds=option===undefined?12:Number(option);
 if(!Number.isSafeInteger(timeoutSeconds)||timeoutSeconds<1||timeoutSeconds>60)throw Error('Client timeout must be an integer from 1 to 60 seconds');
 if(!Number.isSafeInteger(probeCount)||probeCount<1)throw Error('Positive probe count required');
 return{timeoutSeconds,runnerTimeoutMs:(timeoutSeconds*probeCount+12)*1000};
}
function powershell(args,log,timeoutMs=120000){
 const r=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass',...args],{encoding:'utf8',windowsHide:true,timeout:timeoutMs,maxBuffer:4*1024*1024});
 fs.writeFileSync(log,(r.stdout||'')+(r.stderr||''));
 if(r.error||r.status!==0)throw Error('PowerShell check failed; see '+path.basename(log)+(r.error?' ('+r.error.message+')':''));
}
function parseArgs(argv){
 const allowed=['candidate','baseline','mods-dir','engine','game-dir','state-save','mirror','out','profile','cache-revision','client-timeout-seconds'],o={profile:'release'};
 for(let i=0;i<argv.length;i+=2){const k=argv[i]?.replace(/^--/,'');if(!argv[i]?.startsWith('--')||!allowed.includes(k)||!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Unknown or missing option: '+argv[i]);o[k]=argv[i+1];}
 if(!o.candidate)throw Error('--candidate is required');
 if(!['static','release'].includes(o.profile))throw Error('profile must be static or release');
 clientRunnerTiming(o['client-timeout-seconds'],9);return o;
}
function run(o){
 const protectedDirs=[path.dirname(path.resolve(o.candidate)),o.baseline&&path.dirname(path.resolve(o.baseline)),o['game-dir'],o.mirror&&path.dirname(path.resolve(o.mirror)),o['state-save']&&path.dirname(path.resolve(o['state-save']))].filter(Boolean);
 const parent=path.resolve(o.out||path.join(os.tmpdir(),'jo9-qa'));assertOutside(parent,protectedDirs);
 fs.mkdirSync(parent,{recursive:true});const output=fs.mkdtempSync(path.join(parent,'run-'));
 const report={schema:1,createdAt:new Date().toISOString(),profile:o.profile,checks:[],limits:[
  'No GUI clicks or visual layout verification.',
  'Save data is used only to prime representative state. GUI save-file loading, CRC compatibility and full saved script restoration are NOT tested.',
  'Start is replaced only in diagnostic copies. Smoke covers lifecycle calls, not the character-selection UI or every gameplay branch.',
  'No complete QSP syntax checker: dynamic code and all game logic are not statically proved.'
  ,'Battle smoke instruments the menu dispatch only; full combat outcomes and balance are not tested.'
 ]};
 const tracked=[...new Set(['candidate','baseline','mirror','state-save'].map(k=>o[k]).filter(Boolean).map(p=>path.resolve(p)))];
 const hashes=new Map();let raw;
 const check=(name,required,fn)=>{try{const detail=fn();report.checks.push({name,required,status:'PASS',detail});console.log('PASS '+name);return true;}catch(e){report.checks.push({name,required,status:'FAIL',error:e.message,...(e.issues?{issues:e.issues}:{})});console.log('FAIL '+name+': '+e.message);return false;}};
 const skip=(name,why)=>report.checks.push({name,required:o.profile==='release',status:'SKIP',reason:why});
 try{
  check('inputs-readable',true,()=>{for(const p of tracked)hashes.set(p,core.hash(fs.readFileSync(p)));raw=fs.readFileSync(o.candidate);return{candidate:hashes.get(path.resolve(o.candidate))};});
  const statics=check('world-structure-and-line-endings',true,()=>inspectWorld(raw));
 // JO9 MOD START SEED_NAMESPACE_RELEASE_GATE_20261020
 if(o['game-dir'])check('slave-template-registry',true,()=>{
   const registry=assertRegistry(path.join(o['game-dir'],'json','slaves'));
   return{files:registry.files,numericIds:registry.numericIds,collisions:0,invalidJson:0,embeddedIdMismatches:0};
  });
 else report.checks.push({name:'slave-template-registry',required:o.profile==='release',status:'SKIP',reason:'--game-dir is required to verify JSON character IDs and syntax'});
 // JO9 MOD END SEED_NAMESPACE_RELEASE_GATE_20261020
  if(o.mirror)check('distribution-byte-match',true,()=>{if(!fs.readFileSync(o.mirror).equals(raw))throw Error('Mirror differs from candidate');return{sha256:core.hash(raw)};});
  else report.checks.push({name:'distribution-byte-match',required:false,status:'SKIP',reason:'No mirror specified; this run does not verify the distribution copy'});
  if(o.baseline&&o['mods-dir']&&statics){
   check('patch-replay-and-idempotence',true,()=>{
    const files=fs.readdirSync(o['mods-dir']).filter(n=>n.endsWith('.json')).sort();
    const patchDir=path.join(output,'patches');fs.mkdirSync(patchDir);
    const patches=files.map(n=>{const b=fs.readFileSync(path.join(o['mods-dir'],n));fs.writeFileSync(path.join(patchDir,n),b);return JSON.parse(b.toString('utf8').replace(/^\uFEFF/,''));});
    validatePatchSet(patches,core.hash(fs.readFileSync(o.baseline)),core.hash(raw));
    const replay=path.join(output,'replay.qsp');fs.copyFileSync(o.baseline,replay);
    const args=['-File',path.resolve(__dirname,'../apply_mods.ps1'),'-Qsp',replay,'-ModsDir',patchDir];
    powershell(args,path.join(output,'patch-replay.log'));
    if(!fs.readFileSync(replay).equals(raw))throw Error('Exact patch replay differs from candidate');
    powershell(args,path.join(output,'patch-reapply.log'));
    if(!fs.readFileSync(replay).equals(raw))throw Error('Patch reapplication changed candidate');
    return{patches:patches.map(p=>p.id),byteExact:true,idempotent:true};
   });
  }else skip('patch-replay-and-idempotence',statics?'Explicit --baseline and selected --mods-dir required':'Static inspection failed');
  const inputs=['engine','game-dir','state-save','cache-revision'];
  if(o.profile==='static')report.checks.push({name:'installed-client-smoke',required:false,status:'SKIP',reason:'Static profile explicitly requested'});
  else if(inputs.every(k=>o[k])&&!report.checks.some(c=>c.status==='FAIL')){
   check('installed-client-smoke',true,()=>{
    if(process.platform!=='win32')throw Error('Installed client runner requires Windows');
    const codec=require('./save-codec.cjs'),saveRaw=fs.readFileSync(o['state-save']),save=codec.parse(saveRaw);
    if(!codec.serialize(save).equals(saveRaw))throw Error('Save byte roundtrip failed');
    for(const role of ['slave','assistant'])if(codec.value(save,role+'_state')[0]!=='1')throw Error('Representative save must have both slave and assistant present');
    const prime=primeState(save),probes=buildSmoke(raw,prime.code,Number(o['cache-revision']),randomBytes(10).toString('hex').toUpperCase());
    const game=path.join(output,'client');fs.mkdirSync(game);
    fs.cpSync(path.join(o['game-dir'],'json'),path.join(game,'json'),{recursive:true});
    fs.copyFileSync(path.join(o['game-dir'],'config.xml'),path.join(game,'config.xml'));
    fs.writeFileSync(path.join(game,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
    const plan=probes.map(p=>{inspectWorld(p.raw);const file=path.join(game,p.name+'.qsp');fs.writeFileSync(file,p.raw);return{name:p.name,file,marker:p.marker,checkpoint:p.checkpoint};});
    const planFile=path.join(game,'plan.json');fs.writeFileSync(planFile,JSON.stringify(plan,null,2));
    const timing=clientRunnerTiming(o['client-timeout-seconds'],plan.length);
    let runnerError;try{powershell(['-File',path.join(__dirname,'run-client-smoke.ps1'),'-Engine',path.resolve(o.engine),'-Plan',planFile,'-TimeoutSeconds',String(timing.timeoutSeconds)],path.join(output,'client-runner.log'),timing.runnerTimeoutMs);}catch(e){runnerError=e;}
    const resultFile=path.join(game,'client-results.json');
    const results=fs.existsSync(resultFile)?JSON.parse(fs.readFileSync(resultFile,'utf8').replace(/^\uFEFF/,'')):[];
    report.client={timeoutSeconds:timing.timeoutSeconds,runnerTimeoutMs:timing.runnerTimeoutMs,engineSha256:core.hash(fs.readFileSync(o.engine)),stateAssignments:prime.assignments,probes:results};
    if(runnerError)throw runnerError;
    if(results.length!==9||results.some(p=>!p.pass))throw Error('All nine installed-client completion markers are required');
    return{passed:results.length,expected:9};
   });
  }else skip('installed-client-smoke',inputs.some(k=>!o[k])?'Required client inputs missing: '+inputs.filter(k=>!o[k]).join(', '):'A preceding check failed');
 }finally{
  check('input-hashes-unchanged',true,()=>{for(const [p,h]of hashes)if(core.hash(fs.readFileSync(p))!==h)throw Error('Input changed during validation: '+p);return{files:hashes.size};});
 }
 return finish();
 function finish(){
  report.verdict=verdict(report.checks,o.profile);report.output=output;
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  const md='# QSP validation: '+report.verdict+'\n\n'+report.checks.map(c=>'- '+c.status+' — '+c.name+(c.error?': '+c.error:c.reason?': '+c.reason:'')).join('\n')+'\n\n## Limits\n\n'+report.limits.map(t=>'- '+t).join('\n')+'\n';
  fs.writeFileSync(path.join(output,'report.md'),md);console.log(report.verdict+' '+path.join(output,'report.json'));
  return{report,exitCode:report.verdict==='PASS'||report.verdict==='STATIC_PASS'?0:report.verdict==='INCOMPLETE'?2:1};
 }
}
if(require.main===module){try{process.exitCode=run(parseArgs(process.argv.slice(2))).exitCode;}catch(e){console.error(e.message);process.exitCode=2;}}
module.exports={inspectWorld,verdict,validatePatchSet,primeState,buildSmoke,assertOutside,parseArgs,clientRunnerTiming,run};
