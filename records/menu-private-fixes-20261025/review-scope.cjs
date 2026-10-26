'use strict';
// Independent read-only scope checks for the final candidate; writes only its audit JSON.
const fs=require('node:fs'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const baseline='G:/somi/JO9_work_backups/menu-private-fixes-20261025/jack.qsp',candidate='G:/Codex/tmp/menu-private-fixes-20261025/candidate-final.qsp',work='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const beforeHash='38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed',afterHash='8b9cf39fe2327079b0823f6e474c93151538a512fa8738ed5f330749a0940db5';
const beforeRaw=fs.readFileSync(baseline),afterRaw=fs.readFileSync(candidate);assert.equal(c.hash(beforeRaw),beforeHash);assert.equal(c.hash(afterRaw),afterHash);assert.equal(c.hash(fs.readFileSync(work)),beforeHash);
const before=c.parse(beforeRaw),after=c.parse(afterRaw);assert(c.serialize(before).equals(beforeRaw));assert(c.serialize(after).equals(afterRaw));assert.equal(before.locations.length,273);assert.equal(after.locations.length,273);
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const expected=['jo9_buyer_rumors','master_stat','sjm_UI_UIadds','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_menu_screen','jo9_household_worker','menu_form','interaction_result','interaction','end_day_screen','snk_room_bridge'].sort();
const changed=[];for(const l of before.locations){const a=after.locations.find(x=>x.name===l.name);assert(a);assert.equal(after.lines[a.desc],before.lines[l.desc],'Location description changed '+l.name);if(after.lines[a.body]!==before.lines[l.body])changed.push(l.name);}
assert.deepEqual(changed.sort(),expected);
const untouched=['next_day','$newloc','$objsel','interaction_screen','#static_base','#dynamic','#var_base'];for(const n of untouched)assert.equal(get(after,n),get(before,n),'Unrelated core flow changed '+n);
const interaction=get(after,'interaction'),originalInteraction=get(before,'interaction');
for(const role of ['dynslave','assistant','slave']){
 const formula="spawn_semen += semen_gain[max(0, tentacle_size - spawn_milked)] * iif("+role+"['virginity'] = 4, 12 + tentacle_size, 10) / 10";
 assert.equal(interaction.split(formula).length,originalInteraction.split(formula).length,'Reward formula changed '+role);
}
assert.equal((interaction.match(/local jo9_tentacle_before = spawn_semen/g)||[]).length,3);
const calc=get(after,'interaction_result'),guard=calc.indexOf('TENTACLE_QUOTA_RESULT_ENTRY_20261025'),firstOriginal=calc.indexOf('if first_visit[');assert(guard>=0&&guard<firstOriginal);
assert(calc.includes('menu_Milk_A > 0 and interaction = menu_Milk_A'));assert(calc.includes('menu_Milk_S > 0 and interaction = menu_Milk_S'));
const quota=get(after,'jo9_household_worker');assert(quota.includes('pet_tentacle > 0 and tentacle_state ! 2 and spawn_milked <= tentacle_size'));assert(quota.includes('spawn_milked += max(args[1], iif(args[2] > 0, 1, 0))'));
assert(get(before,'interaction').includes("code_defined['interaction_lesson_tentacles'] = 0"),'Original lesson cache refresh missing');
const report=get(after,'end_day_screen');for(const role of ['slave','assistant','room1','room2','room3','room4']){
 const reset=new RegExp('\\b'+role+'_auto_tentacle\\s*=\\s*0\\b').exec(report);assert(reset,'Missing original report flag reset '+role);
 const consume=report.indexOf("gs 'jo9_household_worker', 'tentacle_spent', "+role+"['sub_tentacles'], jo9_tentacle_report['"+role+"_gain']");assert(consume>reset.index,'Consume must follow the original reset '+role);
}
const bridgeBase=get(before,'snk_room_bridge'),bridgeNew=get(after,'snk_room_bridge'),start='! JO9 MOD START MENU_PRIVATE_QUOTA_20261025 | 2026-10-25_menu_private_final\r\n',end='\r\n! JO9 MOD END MENU_PRIVATE_QUOTA_20261025\r\n';
assert(bridgeNew.startsWith(start)&&bridgeNew.endsWith(end));
assert.equal(bridgeNew.slice(start.length,-end.length),bridgeBase.replace('  if menu_form = 134: exit\r\n  if menu_form = 136: exit','  if menu_form = 134: exit\r\n  if menu_form = 135: exit\r\n  if menu_form = 136: exit'),'Generic navigation must differ by only one whitelist line');
const files=['rumor-edits.cjs','layout-edits.cjs','private-edits.cjs','tentacle-edits.cjs','bridge-ui-edits.cjs'];
const helperHashes=files.map(name=>({name,sha256:c.hash(fs.readFileSync(__dirname+'/'+name))}));
const native=[];for(const dir of ['native-inventory-final','native-rumor-final','native-inventory','native-rumor-r2','native-private','native-private-vtwo','native-private-vthree']){
 const p='G:/Codex/tmp/menu-private-fixes-20261025/'+dir+'/client-results.json';if(!fs.existsSync(p)){native.push({dir,available:false});continue;}const rows=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
 const preparedFile='G:/Codex/tmp/menu-private-fixes-20261025/'+dir+'/prepared.json',prepared=fs.existsSync(preparedFile)?JSON.parse(fs.readFileSync(preparedFile,'utf8').replace(/^\uFEFF/,'')):{};
 if(dir.endsWith('-final')){assert.equal(prepared.sourceHash,afterHash);assert(rows.every(x=>x.pass),'Final focused native check failed '+dir);}
 native.push({dir,available:true,sourceHash:prepared.sourceHash,passed:rows.filter(x=>x.pass).length,total:rows.length,cases:rows.map(x=>({name:x.name,pass:x.pass,reason:x.reason}))});
}
const officialFile='G:/Codex/tmp/menu-private-release-20261025/run-8p8YuF/report.json',officialReport=JSON.parse(fs.readFileSync(officialFile,'utf8'));
const smoke=officialReport.checks.find(x=>x.name==='installed-client-smoke');assert.equal(smoke.status,'PASS');assert.equal(smoke.detail.passed,9);assert.equal(smoke.detail.expected,9);assert(officialReport.checks.filter(x=>x.required).every(x=>x.status==='PASS'));assert.equal(officialReport.checks.find(x=>x.name==='inputs-readable').detail.candidate,afterHash);
const official={file:officialFile,sourceHash:afterHash,requiredChecksPass:true,nativeSmokePassed:9,nativeSmokeExpected:9,limits:officialReport.limits};
const result={status:'INDEPENDENT_STATIC_SCOPE_PASS',beforeHash,afterHash,locationCount:273,changedLocations:changed,unchangedCoreLocations:untouched,originalLocationDescriptionsUnchanged:true,originalRewardEquationsUnchanged:true,localBeforeVariables:3,newLocations:0,newPersistentKeys:0,existingModesAdded:['jo9_household_worker:tentacle_ready','jo9_household_worker:tentacle_spent'],genericBridgeOnlyWhitelist135:true,helperHashes,official,nativeEvidenceAtReview:native,limits:['Final-hash official smoke9, rumor5 and inventory2 results were read. Milk-report, bridge state preservation and quota gameplay tests remain separate until their final result files exist and pass.','Direct debug execution of arbitrary cached code is outside the ordinary UI graph; the new calculation-entry guard covers stale interaction_result for four affected actions.','The existing source-level storage cap is unchanged and still runs at $newloc. Positive gain in the new cost formula is the immediate resource/report gain, not a new net-after-cap accounting system.']};
fs.writeFileSync(__dirname+'/INDEPENDENT_REVIEW.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,afterHash,locations:changed.length,coreUnchanged:untouched.length,newLocations:0,newPersistentKeys:0,native:native.map(x=>({dir:x.dir,available:x.available,passed:x.passed,total:x.total}))}));
