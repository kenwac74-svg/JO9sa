'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const base=path.resolve(__dirname,'..'),tmp='G:/Codex/tmp/jo9-post-patch-playtest-20261025',read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const milk=read(tmp+'/milk-native/result.json'),roles=read(tmp+'/roles-native/result.json'),assets=read(tmp+'/assets-native/result.json'),occupied=read(tmp+'/occupied-native/result.json');
const officialDir=fs.readdirSync(tmp+'/official').find(n=>fs.existsSync(tmp+'/official/'+n+'/report.json')),official=read(tmp+'/official/'+officialDir+'/report.json');
assert.equal(milk.details.length,7);assert(milk.details.every(x=>x.black===1&&x.text===1&&x.top===1&&x.width>0&&x.height>0));
assert.equal(assets.ending.day,0);assert.equal(assets.ending.money,19366);assert.equal(occupied.values.day,102);assert.equal(occupied.values.bill,50000);
const expectedDeath=sc.value(sc.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/save/auto_day_end.sav')),'death')[1],actualDeath=sc.value(sc.parse(fs.readFileSync(tmp+'/assets-native/asset-start.sav')),'death')[1];assert.equal(expectedDeath,actualDeath);
const files=['root-kit.cjs','root-milk.cjs','root-roles.cjs','root-assets.cjs','root-occupied.cjs','official-check.cjs'];
const findings=[
 {id:'ROOT_CALLBACK_REPLACEMENT',severity:'none_found',detail:'The reviewed original sale, role-checkbox, asset disposal, manual-return and next-day callbacks remain product code. Replaced debug_info/item_buy bodies are reached by newly appended diagnostic telemetry anchors, not by those product callbacks.'},
 {id:'MILK_ASSERTION_SCOPE',severity:'report_boundary',detail:'Completion markers assert actual stock/money transaction. Geometry/color/text hit values are captured rather than asserted in the fixture, but independent review confirms all7 captured records black/text/top=1 with positive56x40 bounds. Do not imply sale-link physical hit testing: domClick after code reselects the sale link after its initial generic-anchor hit test.'},
 {id:'EGEYA_CACHE_SCOPE',severity:'report_boundary',detail:'Original rendered DOM has no Kirakira src and2 loaded images, while raw assistant.fullimage remains girls/full/maid/kirakira in the snapshot. The supported claim is correct render resolution and unsupported appearance controls hidden, not saved-cache normalization.'},
 {id:'ASSET_PAGE_SCOPE',severity:'report_boundary',detail:'Captured asset chain visits source pages0..13 and ends at day0 with19366. Avoid claiming that15 distinct pages were all visited. Other manual/occupied paths are separately covered.'},
 {id:'ASSET_DEATH_FIXTURE',severity:'verified',detail:'Diagnostic restored DEATH macro is byte-for-byte equal as a string to original auto_day_end.sav DEATH; no ending outcome assignment is injected.',sha256:c.hash(Buffer.from(expectedDeath)),characters:expectedDeath.length},
 {id:'QUEST_SIGNATURE_SCOPE',severity:'report_boundary',detail:'The inspected asset result.json has no questUnchanged field. The optional script filter checks variable names containing QUEST/FAME/etc, not fame indices inside SLAVE_RATE/ASSISTANT_RATE. It cannot support universal quest and personal-fame preservation.'},
 {id:'OCCUPIED_BARRIER',severity:'verified',detail:'Original next-page/manual/home-day-end choices execute before the appended assertion. Current unpaid bill50000, day102, room4/cryo IDs and states, and0money remain protected.'},
 {id:'OFFICIAL_CHECK_SCOPE',severity:'report_boundary',detail:'Release checker PASS: structure/registry/patch replay/idempotence/input hashes and9installed smoke paths. distribution-byte-match is SKIP. Smoke paths supplement gameplay tests; they are not exhaustive playthroughs.'}
];
const coverage=[
 ['F01','ROOT_GUI_WITH_GAP','Root source portrait visual check; in-game portrait toggle remains explicitly unverified.'],
 ['F02','NATIVE_PASS','combat/report.json FOG_AP_ONCE; both roles real combat and settlement.'],
 ['F03','NATIVE_PASS','combat/report.json Grinch real choice/weapon/attack/victory/quest10385.'],
 ['F04','NATIVE_PASS_LIMITED','root roles native assistant profile checkbox/render tests; raw cache normalization not claimed.'],
 ['F05','GAP','traits/language report disabled-choices GAP; other language cases PASS.'],
 ['F06','NATIVE_PASS_AND_ROOT_GUI','root milk7prices real transactions and actualDOM readability; root separate GUI save/load.'],
 ['F07','NATIVE_PASS','traits/relations2cases.'],
 ['F08','NATIVE_PASS_LIMITED','traits/acquisition2cases; representative generation/acquisition, not full random population.'],
 ['F09','ROOT_GUI_PASS','Root physical Ctrl+L original06 -> current Isabella full image/warning -> physical original forward -> native main/background restored. gui-evidence/06-isabella-loaded.jpg and06-isabella-forward.jpg independently inspected; root-evidence/gui-ledger.json records the operation.'],
 ['F10','NATIVE_PASS_LIMITED','root assets ending/occupied/manual paths and separate GUI360/basic; page and quest/fame scope bounded above.'],
 ['F11','NATIVE_PASS','production14cases actual original success/report routes; text amounts/bonuses and hashes.'],
 ['F12','NATIVE_PASS','production10manual5sizes*2roles +4automatic including zeroAP growth-delayed report.'],
 ['F13','NATIVE_PASS_VISUAL_BOUNDARY','combat4changed native entry/image URLs loaded; Qt canvasSecurityError, root visual evidence separate.'],
 ['F14','NATIVE_PASS','economy daily production/genius cases; per-case report governs detailed scope.'],
 ['F15','NATIVE_PASS','traits/versatile3 +economy/versatile1.'],
 ['F16','NATIVE_PASS','traits language/overview strong-obedience description paths.'],
 ['F17','NATIVE_PASS','economy essence2 original purchase/use paths.'],
 ['F18','NATIVE_PASS_LIMITED','combat representative weak/high/boss tiers, witness20/21 and80cap; not all15tier combinations fought.'],
 ['F19','NATIVE_PASS','production10actual Fer_Tentacle image/link callbacks59/45 andAP5to4.'],
 ['F20','NATIVE_PASS_WITH_PREEXISTING_DEFECT','Connected wins0to3, blocked and loss counts; original result-return missing goto_loc independently reproduced and present in shippedr4.'],
 ['F21','NATIVE_PASS','economy daily-ap-map current replacement report resolves old daily base gap.'],
 ['F22','NATIVE_PASS_WITH_DIAGNOSTIC_DRIVER_LIMIT','Original interaction half/whole2cases PASS. Fresh original AP0/AP1 tutor link->lesson->forward->main2cases PASS. Old larger training driver times out even with full resources; exact stall cause unresolved and not reproduced as product defect. See combat/overwork-isolation.json.'],
 ['F23','NATIVE_PASS','economy clinic6 +combat constitution4 actualbattle HP65to78/stamina80to96.'],
 ['F24','NATIVE_PASS','economy dealers6 original sale flows.'],
 ['F25','NATIVE_FAIL_AND_BLOCKED_DOWNSTREAM','economy report3original rumor anchors truncate toexec:gt; paid results/multiple matches/delivery discount downstream not reached.'],
 ['F26','NATIVE_PASS_LIMITED','combat6rally original entry/result awards plus catfight fame. Rally result-forward return not played; catfight return defect separate.'],
 ['F27','NATIVE_PASS','combat danger16actualnativeDOM pre-choice displays and3original role links.'],
 ['F28','NATIVE_PASS','traits overview-base4 +overflow1 original profile/overview/description/close routes.'],
 ['F29','NATIVE_PASS','traits merge3 representative reconciliation cases.'],
 ['F30','PRIOR_CURRENT_BUILD_NATIVE_EVIDENCE','Current a70 collar daily4/menu-load4 is existing completed evidence in canonical collar-runtime records; official checker is supplementary only.'],
 ['F31','NATIVE_PASS','traits misc nanoparticle explanation case; original prose preserved.'],
 ['F32','ROOT_GUI_WITH_HELP_GAP','traits master-question GAP remains unless separate root CUA evidence closes it.']
].map(([id,status,evidence])=>({id,status,evidence}));
assert.equal(coverage.length,32);assert.equal(new Set(coverage.map(x=>x.id)).size,32);
const report={date:'2026-10-25',reviewer:'/root/playtest_combat',status:'REVIEWED_WITH_BOUNDARIES',reviewedScripts:files.map(n=>({file:base+'/'+n,sha256:c.hash(fs.readFileSync(base+'/'+n))})),findings,coverage,official:{verdict:official.verdict,distributionByteMatch:official.checks.find(x=>x.name==='distribution-byte-match').status,smoke:official.client.probes.length},limits:['Review is read-only; no product edits or fixture reruns.','Root CUA observations are represented only where communicated; EVIDENCE_NOT_LOCATED is not a claim that the feature is broken.','Do not collapse FAIL/GAP or limited flow boundaries into all32featuresfullyPASS.']};
fs.writeFileSync(base+'/independent-review.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,coverage:coverage.length,findings:findings.length,report:base+'/independent-review.json'}));
