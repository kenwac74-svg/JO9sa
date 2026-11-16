'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const zlib = require('node:zlib');
const repo = 'G:/somi/JO9sa';
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const temp = 'G:/Codex/tmp/jo9-rally-payout-20261111';
const record = repo + '/records/rally-payout-20261111';
const core = require(repo + '/tools/text-workshop/core.cjs');
const qa = require(repo + '/tools/qa/release-check.cjs');
const id = '2026-11-11_rally_entry_payout';
const marker = 'RALLY_ENTRY_PAYOUT_20261111';
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const hash = file => core.hash(fs.readFileSync(file));
const quote = value => "'" + value.replaceAll("'", "''") + "'";
const crlf = value => value.replace(/\r?\n/g, '\r\n');
fs.mkdirSync(temp, {recursive: true});
fs.mkdirSync(record, {recursive: true});
const raw = fs.readFileSync(game + '/jack.qsp');
const world = core.parse(raw);
function body(doc, name) {
 const location = doc.locations.find(item => item.name === name);
 return location ? core.shift(doc.lines[location.body], 5) : '';
}
function actionBlocks(text, scene) {
 const pattern = new RegExp('^\\tIF interaction_city = ' + scene + ':\\r\\n[\\s\\S]*?^\\tEND', 'gm');
 return [...text.matchAll(pattern)].map(match => match[0]);
}

function makeProbes(bytes, stage) {
 const doc = core.parse(bytes);
 const interaction = body(doc, 'interaction_city');
 const fame = body(doc, 'jo9_contest_fame');
 let helper = body(doc, 'jo9_rally') || 'result = 0';
 helper = helper.replace('rand(1, rally_bound)', 'qa_roll');
 const scenes = [102102, 102103, 102113, 102114, 102115, 102116, 102117, 102118, 102119, 102120, 102121, 102122, 102123, 102124];
 const groups = [[], []];
 for (const scene of scenes) {
  const blocks = actionBlocks(interaction, scene);
  assert.equal(blocks.length, 2, 'gender action count ' + scene);
  for (let gender = 0; gender < 2; gender++) {
   let script = blocks[gender].replace(/RAND\(1,\s*[34]\)/g, 'qa_roll');
   script = script.replaceAll("gt 'interaction_city'", "gs 'QA_dispatch' & exit");
   script = script.replaceAll("gt 'shop_general'", "gs 'QA_return' & exit");
   groups[gender].push(script);
  }
 }
 const dispatch = 'if qa_gender = 0:\r\n' + groups[0].join('\r\n') + '\r\nelse\r\n' + groups[1].join('\r\n') + '\r\nend';
 const start = crlf(`
CONST_INT['slave_exist']=1
$inseminate={qa_inseminations+=1}
$slave_name='QA'
$qa_rounds[0]=1 & $qa_rounds[1]=3 & $qa_rounds[2]=4 & $qa_rounds[3]=9 & $qa_rounds[4]=10 & $qa_rounds[5]=11 & $qa_rounds[6]=100
qa_profit[1]=300 & qa_profit[3]=300 & qa_profit[4]=275 & qa_profit[9]=150 & qa_profit[10]=125 & qa_profit[11]=125 & qa_profit[100]=125
qa_cases=0 & qa_failed=0
for qa_gender=0 to 1 step 1:
 for qa_round_index=0 to 6 step 1:
  for qa_route=0 to 3 step 1:
   qa_bound=iif(qa_route=1,4,3)
   for qa_roll=1 to qa_bound step 1:
    killvar 'slave' & killvar 'slave_rate' & killvar 'jo9_rally_match'
    qa_round=val($qa_rounds[qa_round_index])
    slave_state=1 & slave_type=2613 & slave['id']=1
    slave['jo9_rally_entries']=qa_round-1
    slave['energy']=3 & slave['half_action']=0 & slave['obedience']=3
    slave['oral']=iif(qa_route=0 or qa_route=2,3,0)
    slave['xenophily']=iif(qa_route=0 or qa_route=3,3,0)
    sparks=1000
    interaction_city=102102
    gs 'QA_dispatch'
    qa_win=0
    if qa_route=0 and qa_roll!2: qa_win=1
    if qa_route>0 and qa_roll=2: qa_win=1
    qa_expected_cash=iif(qa_win=1,1000+qa_profit[qa_round],900)
    if sparks!qa_expected_cash: qa_failed+=1
    if slave['jo9_rally_entries']!qa_round: qa_failed+=1
    if slave['energy']!0: qa_failed+=1
    qa_saved_cash=sparks & qa_saved_fame=slave_rate['fame']
    qa_saved_outcome=interaction_city
    gs 'QA_dispatch'
    if sparks!qa_saved_cash or slave['energy']!0 or slave_rate['fame']!qa_saved_fame: qa_failed+=1
    interaction_city=102113+qa_route
    gs 'QA_dispatch'
    if sparks!qa_saved_cash or slave['jo9_rally_entries']!qa_round or slave['energy']!0 or slave_rate['fame']!qa_saved_fame: qa_failed+=1
    qa_cases+=1
   end
  end
 end
end
! Refusal retains its old fee, counts no entry, and cannot charge twice.
killvar 'slave' & killvar 'jo9_rally_match'
slave_state=1 & slave_type=2613 & slave['id']=1 & slave['energy']=3 & slave['obedience']=2
sparks=1000 & qa_gender=0 & qa_roll=1 & interaction_city=102102
gs 'QA_dispatch'
if sparks!900 or slave['jo9_rally_entries']!0: qa_failed+=1
interaction_city=102103
gs 'QA_dispatch'
if sparks!900: qa_failed+=1
qa_cases+=1
! Missing funds or actions do not start a race.
for qa_ineligible=0 to 1 step 1:
 killvar 'slave' & killvar 'jo9_rally_match'
 slave_state=1 & slave['energy']=iif(qa_ineligible=0,3,2) & slave['obedience']=3
 sparks=iif(qa_ineligible=0,99,1000)
 qa_saved_cash=sparks & interaction_city=102102
 gs 'QA_dispatch'
 if sparks!qa_saved_cash or slave['jo9_rally_entries']!0: qa_failed+=1
 qa_cases+=1
end
if qa_cases!185: msg 'FAIL rally case count '+qa_cases & exit
if qa_failed>0: msg 'FAIL rally route checks '+qa_failed & exit
msg 'JO9_QA_RALLY_route_matrix_COMPLETE'
exit`.trim());
 const dir = temp + '/' + stage;
 fs.mkdirSync(dir, {recursive: true});
 fs.copyFileSync(game + '/config.xml', dir + '/config.xml');
 fs.writeFileSync(dir + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const locations = [['Start', start], ['QA_dispatch', dispatch], ['QA_return', 'qa_returns+=1'], ['jo9_rally', helper], ['jo9_contest_fame', fame]];
 const plan = [];
 for(let gender=0;gender<2;gender++)for(let roundIndex=0;roundIndex<7;roundIndex++){
  const extra=gender===0&&roundIndex===0;
  let bounded=start.replace('for qa_gender=0 to 1 step 1:',`for qa_gender=${gender} to ${gender} step 1:`)
   .replace('for qa_round_index=0 to 6 step 1:',`for qa_round_index=${roundIndex} to ${roundIndex} step 1:`);
  const extraStart=bounded.indexOf('! Refusal retains');
  const countStart=bounded.indexOf('if qa_cases!185:');
  if(!extra)bounded=bounded.slice(0,extraStart)+bounded.slice(countStart);
  bounded=bounded.replace('if qa_cases!185:',`if qa_cases!${extra?16:13}:`);
  const name='routes-'+String.fromCharCode(97+gender*7+roundIndex);
  writeFixture(dir+'/'+name+'.qsp',[[locations[0][0],bounded],...locations.slice(1)]);
  plan.push({name,file:dir+'/'+name+'.qsp',marker:'JO9_QA_RALLY_route_matrix_COMPLETE',checkpoint:`actual gender${gender}, round index${roundIndex}, all13 random outcomes, duplicate result/draw${extra?', refusal and funds/actions':''}`});
 }
 if (stage === 'after') {
  const stateTest = crlf(`
CONST_INT['slave_exist']=1
slave_state=1 & slave_type=2613 & $slave_name='QA'
slave['id']=1 & slave['energy']=3 & slave['obedience']=3 & slave['jo9_rally_entries']=9
sparks=1000 & qa_roll=1 & qa_fail=0
gs 'jo9_rally','prepare'
gs 'jo9_rally','draw',102113
qa_serial=slave['jo9_rally_serial']
if sparks!900 or slave['jo9_rally_entries']!10 or jo9_rally_match['profit']!125: qa_fail+=1
! A copied role carries the individual character record.
copyarr 'assistant','slave'
killvar 'slave'
slave['id']=1 & slave['energy']=3 & slave['obedience']=3
gs 'jo9_rally','pay',102118
if sparks!900 or result!0: qa_fail+=1
copyarr 'slave','assistant'
gs 'jo9_rally','pay',102118
if sparks!1125 or slave['jo9_rally_entries']!10: qa_fail+=1
! Another instance with the same template and name receives its own serial and count.
killvar 'slave'
slave['id']=1 & slave['energy']=3 & slave['obedience']=3
gs 'jo9_rally','prepare'
if slave['jo9_rally_serial']=qa_serial: qa_fail+=1
gs 'jo9_rally','draw',102113
gs 'jo9_rally','pay',102118
if sparks!1425 or slave['jo9_rally_entries']!1 or assistant['jo9_rally_entries']!10: qa_fail+=1
! A pending match remains payable even when its reserved fee used the last funds.
killvar 'slave' & killvar 'jo9_rally_match'
slave['energy']=3 & slave['obedience']=3 & slave['jo9_rally_entries']=9
sparks=100
gs 'jo9_rally','prepare'
gs 'jo9_rally','draw',102113
qa_saved_outcome=result
gs 'jo9_rally','prepare'
if result!qa_saved_outcome or sparks!0 or slave['jo9_rally_entries']!10: qa_fail+=1
gs 'jo9_rally','pay',qa_saved_outcome
if sparks!225: qa_fail+=1
gs 'jo9_rally','pay',qa_saved_outcome
if sparks!225 or result!0: qa_fail+=1
! Old pre-draw state initializes the new record at its first updated race.
killvar 'slave' & killvar 'jo9_rally_match'
slave['energy']=3 & slave['obedience']=3 & sparks=1000
gs 'jo9_rally','draw',102113
gs 'jo9_rally','pay',102118
if sparks!1300 or slave['jo9_rally_entries']!1: qa_fail+=1
if qa_fail>0: msg 'FAIL rally identity/state checks '+qa_fail & exit
msg 'JO9_QA_RALLY_identity_state_COMPLETE'
exit`.trim());
  writeFixture(dir+'/state.qsp', [['Start',stateTest],['jo9_rally',helper]]);
  plan.push({name:'state',file:dir+'/state.qsp',marker:'JO9_QA_RALLY_identity_state_COMPLETE',checkpoint:'role copy, same template/name isolation, locked round and fee, repeated payout, pending zero cash, legacy pre-draw'});
  const savePath = 'pending.sav';
  const saveStart = crlf(`
CONST_INT['slave_exist']=1
slave_state=1 & slave_type=2613 & $slave_name='QA'
slave['energy']=3 & slave['obedience']=3 & slave['jo9_rally_entries']=9
sparks=1000 & qa_roll=1
gs 'jo9_rally','prepare'
gs 'jo9_rally','draw',102113
$ongload='Loaded'
savegame ${quote(savePath)}
sparks=0 & slave['jo9_rally_entries']=0 & jo9_rally_match['profit']=999
opengame ${quote(savePath)}
exit`.trim());
  const loadScript = crlf(`
if sparks!900 or slave['jo9_rally_entries']!10 or jo9_rally_match['profit']!125 or jo9_rally_match['phase']!1: msg 'FAIL saved pending state' & exit
gs 'jo9_rally','pay',102118
if sparks!1125 or slave['jo9_rally_entries']!10: msg 'FAIL saved payout' & exit
gs 'jo9_rally','pay',102118
if sparks!1125 or result!0: msg 'FAIL duplicate saved payout' & exit
msg 'JO9_QA_RALLY_save_load_COMPLETE'
exit`.trim());
  writeFixture(dir+'/save.qsp',[['Start',saveStart],['Loaded',loadScript],['jo9_rally',helper]]);
  // Save/load is checked through the engine API; client SAVEGAME waits for a host callback.
 }
 writeJson(dir+'/plan.json', plan);
 console.log(dir+'/plan.json');
}

function writeFixture(file, locations) {
 locations=locations.map(([name,script])=>[name,['Start','Loaded'].includes(name)?script.replace(/gs 'jo9_rally',([^\r\n]+)/g,"result = func('jo9_rally',$1)"):script]);
 const lines=['QSPGAME','','',core.shift(String(locations.length),-5)];
 for (const [name, script] of locations) lines.push(core.shift(name,-5),'',core.shift(script,-5),core.shift('0',-5));
 lines.push('');
 fs.writeFileSync(file, core.serialize({lines}));
}

const mode=process.argv[2];
if(mode==='verify') makeProbes(raw,'after');
if(mode==='before') makeProbes(raw,'before');
if(mode==='prepare') {
 assert(core.serialize(world).equals(raw));
 assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),world.hash);
 assert(!world.locations.some(l=>l.name==='jo9_rally'));
 assert(readJson(temp+'/before/client-results.json').some(v=>!v.pass));
 let interaction=body(world,'interaction_city');
 const originalInteraction=interaction;
 const edits=[];
 function replaceAll(location, oldText, newText, count) {
  const current=body(world,location);
  assert.equal(current.split(oldText).length-1,count,location+' count mismatch');
  const target=world.locations.find(l=>l.name===location);
  world.lines[target.body]=core.shift(current.split(oldText).join(newText),-5);
  edits.push({location,field:'body',old:oldText,new:newText,count,patchId:marker});
 }
 for(const scene of [102102,102103,102113,102114,102115,102116,102117,102118,102119,102120,102121,102122,102123,102124]) {
  const blocks=actionBlocks(originalInteraction,scene);
  assert.equal(blocks.length,2);
  for(const oldBlock of new Set(blocks)) {
   const count=blocks.filter(b=>b===oldBlock).length;
   let next=oldBlock;
   if(scene===102102) {
    const header=next.split('\r\n')[0];
    next=next.replace(header,header+"\r\n! JO9 MOD START RALLY_REQUEST_20261111\r\n local rally_response = func('jo9_rally', 'prepare')\r\n if rally_response = 0: gt 'shop_general'\r\n if rally_response > 1: interaction_city = rally_response & gt 'interaction_city'\r\n! JO9 MOD END RALLY_REQUEST_20261111");
   } else if(scene>=102113 && scene<=102116) {
    const start=next.search(/^[ \t]*a = RAND/m);
    const end=next.lastIndexOf("gt 'interaction_city'");
    assert(start>=0&&end>start);
    next=next.slice(0,start)+"\r\n! JO9 MOD START RALLY_DRAW_20261111\r\n local rally_response = func('jo9_rally', 'draw', interaction_city)\r\n if rally_response = 0: gt 'shop_general'\r\n interaction_city = rally_response\r\n gt 'interaction_city'\r\n! JO9 MOD END RALLY_DRAW_20261111"+next.slice(end+"gt 'interaction_city'".length);
   } else {
    const header=next.split('\r\n')[0];
    const action=scene===102103?'refuse':'pay';
    const call=action==='pay'?"func('jo9_rally', 'pay', interaction_city)":"func('jo9_rally', 'refuse')";
    let guard="\r\n! JO9 MOD START RALLY_RESULT_20261111\r\n if "+call+" = 0: gt 'shop_general'\r\n";
    if(action==='pay') guard+=" gs 'jo9_contest_fame', 'settle', interaction_city\r\n";
    guard+='! JO9 MOD END RALLY_RESULT_20261111';
    next=next.replace(header,header+guard);
    assert.equal((next.match(/^\s*sparks [+-]= (?:100|300)\r?$/gm)||[]).length,1);
    next=next.replace(/^\s*sparks [+-]= (?:100|300)\r?$/m,'');
    next=next.split('\r\n').map(line=>{
     if(!line.includes('$text[')||!line.includes('$300'))return line;
     const outer=line.match(/=\s*(['"])/)[1];
     const key=outer==="'"?'"profit"':"'profit'";
     return line.replaceAll('$300','$<<jo9_rally_match['+key+']>>');
    }).join('\r\n');
   }
   replaceAll('interaction_city',oldBlock,next,count);
  }
 }
 interaction=body(world,'interaction_city');
 for(const oldBlock of new Set(actionBlocks(interaction,102100))) {
  const lines=oldBlock.split('\r\n');
  let adjusted=0;
  const next=lines.map(line=>{
   const at=line.indexOf('참가비는 $100다.');
   if(at<0)return line;
   const outer=line.match(/=\s*(['"])/)[1];
   const tail=line.lastIndexOf(outer);
   adjusted++;
   return line.slice(0,at)+'참가비는 $100다. 같은 캐릭터의 첫 세 경기에서는 우승 순이익이 $300이고, 이후 참가할수록 배당이 내려가 열 번째부터는 $125가 된다. 패배하면 참가비 $100을 잃는다.'+line.slice(tail);
  }).join('\r\n');
  assert.equal(adjusted,1);
  replaceAll('interaction_city',oldBlock,next,actionBlocks(interaction,102100).filter(b=>b===oldBlock).length);
 }
 const oldMenu=" FUNC('$menu', 'interaction_city', $menu_item_spermrally, 102102, '정액 랠리')";
 const newMenu=" FUNC('$menu', 'interaction_city', $menu_item_spermrally, 102102, '정액 랠리 (' + str(func('jo9_rally', 'quote_round')) + '회차 · 우승 순이익 $' + str(func('jo9_rally', 'quote')) + ')')";
 replaceAll('#options',oldMenu,newMenu,1);
 const loadBody=body(world,'$ongload');
 const firstLine=loadBody.split('\r\n')[0];
 const cache="! JO9 MOD START RALLY_MENU_LOAD_20261111\r\n$erosalon_options[4] = replace($erosalon_options[4], "+quote(oldMenu)+', '+quote(newMenu)+")\r\n$display_options[4] = replace($display_options[4], "+quote(oldMenu)+', '+quote(newMenu)+")\r\n! JO9 MOD END RALLY_MENU_LOAD_20261111\r\n";
 replaceAll('$ongload',firstLine,cache+firstLine,1);
 const helper=crlf(fs.readFileSync(__dirname+'/jo9-rally.qsp.txt','utf8'));
 world.lines.splice(world.lines.length-1,0,core.shift('jo9_rally',-5),'',core.shift(helper,-5),core.shift('0',-5));
 world.lines[3]=core.shift(String(world.locations.length+1),-5);
 const candidate=core.serialize(world);
 qa.inspectWorld(candidate);
 const backup='G:/somi/JO9_work_backups/rally-payout-20261111-'+core.hash(raw).slice(0,12);
 fs.mkdirSync(backup,{recursive:true});
 const gzip=zlib.gzipSync(raw);
 assert(zlib.gunzipSync(gzip).equals(raw));
 fs.writeFileSync(backup+'/before.qsp.gz',gzip);
 fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 const mod={id,status:'APPROVED',description:'Per-character rally entries and declining net win payout with reserved entry fee, locked result and once-only settlement. Preserve four probabilities, prior fame gains and refusal cost.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),add_locations:[{name:'jo9_rally',desc:'',body:helper,actions:[]}],edits};
 fs.mkdirSync(temp+'/mods',{recursive:true});
 writeJson(temp+'/mods/'+id+'.json',mod);
 writeJson(repo+'/mods/'+id+'.json',mod);
 fs.writeFileSync(temp+'/candidate.qsp',candidate);
 fs.writeFileSync(temp+'/replay.qsp',raw);
 writeJson(record+'/prepared.json',{before:mod.before_sha256,after:mod.after_sha256,backup,edits:edits.length});
 makeProbes(candidate,'after');
}
if(mode==='install') {
 const state=readJson(record+'/prepared.json');
 assert(readJson(temp+'/after/client-results.json').every(r=>r.pass));
 assert(fs.readFileSync(record+'/save-load.log','utf8').includes('PASS engine API save/load'));
 assert.equal(core.hash(raw),state.before);
 assert.equal(hash(temp+'/replay.qsp'),state.after);
 assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),state.before);
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',temp+'/mods'];
 for(const operation of ['apply','reapply']) {
  const output=cp.execFileSync('powershell.exe',args,{windowsHide:true,maxBuffer:4*1024*1024});
  fs.writeFileSync(record+'/'+operation+'.log',new TextDecoder('euc-kr').decode(output));
  assert.equal(hash(game+'/jack.qsp'),state.after);
 }
 fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const manifestPath=repo+'/assets/runtime-source-2.4.1.json';
 const manifest=readJson(manifestPath);
 assert.equal(manifest.sourceQspSha256,state.before);
 manifest.sourceQspSha256=state.after;
 manifest.snapshotDate='2026-11-11';
 for(const file of manifest.files)if(file.repositoryPath==='assets/runtime/2.4.1/jack.qsp') {
  file.sha256=state.after;
  file.bytes=fs.statSync(game+'/jack.qsp').size;
 }
 manifest.latestRallyPayout={date:'2026-11-11',mod:id,report:'records/rally-payout-20261111/REPORT_KO.md'};
 writeJson(manifestPath,manifest);
 const final=core.parse(fs.readFileSync(game+'/jack.qsp'));
 const previous=core.parse(zlib.gunzipSync(fs.readFileSync(state.backup+'/before.qsp.gz')));
 const changed=previous.locations.filter(l=>previous.lines[l.body]!==final.lines[l.body]).map(l=>l.name);
 assert.deepEqual(changed,['interaction_city','#options','$ongload'].sort((a,b)=>previous.locations.findIndex(l=>l.name===a)-previous.locations.findIndex(l=>l.name===b)));
 writeJson(record+'/verification.json',{...state,changedLocations:changed,addedLocations:['jo9_rally'],structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),routeCases:185,identityAndRoleCopy:true,actualSaveLoad:true,workSourceMatch:true,fullTouched:false,commit:false,push:false});
 for(const stage of ['before','after']) {
  fs.copyFileSync(temp+'/'+stage+'/client-results.json',record+'/native-'+stage+'.json');
  const logs=readJson(temp+'/'+stage+'/plan.json').map(item=>item.name);
  for(const name of logs)fs.copyFileSync(temp+'/'+stage+'/'+name+'-stderr.log',record+'/native-'+stage+'-'+name+'.log');
 }
 console.log('Rally payout installed and source aligned.');
}
