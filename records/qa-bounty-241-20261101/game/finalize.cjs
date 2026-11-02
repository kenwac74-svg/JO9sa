'use strict';
// Consolidates already completed, root-owned engine runs; never launches an engine.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const out=__dirname,tmp='G:/Codex/tmp/qa-bounty-241-game-20261101',source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const expectedSource='78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d';
assert.equal(c.hash(fs.readFileSync(source)),expectedSource);
const runs=[];
for(const cfg of [
 {name:'bounty-game',world:'native-game.qsp',prepared:'native-prepared.json',cases:'native-cases.json',marker:'JO9_QA_BOUNTY_game_COMPLETE',prefix:'FAIL_BOUNTY_GAME_'},
 {name:'bounty-quests',world:'native-quests.qsp',prepared:'native-quests-prepared.json',cases:'native-quest-cases.json',marker:'JO9_QA_BOUNTY_quests_COMPLETE',prefix:'FAIL_BOUNTY_QUEST_'}
]){
 const prepared=JSON.parse(fs.readFileSync(path.join(out,cfg.prepared),'utf8')),cases=JSON.parse(fs.readFileSync(path.join(out,cfg.cases),'utf8'));
 const world=fs.readFileSync(path.join(tmp,cfg.world)),doc=c.parse(world),start=c.shift(doc.lines[doc.locations.find(l=>l.name==='Start').body],5);
 assert.equal(c.hash(world),prepared.diagnosticHash);assert.equal(prepared.sourceHash,expectedSource);assert.equal(cases.length,prepared.cases);
 const assertionCount=start.split(cfg.prefix).length-1;assert.equal(assertionCount,prepared.assertions);
 const stderr=fs.readFileSync(path.join(tmp,cfg.name+'-stderr.log'),'utf8'),stdout=fs.readFileSync(path.join(tmp,cfg.name+'-stdout.log'),'utf8');
 assert.equal(stderr.split(cfg.marker).length-1,1);assert(!stderr.includes(cfg.prefix));
 assert(!/showMessage\(\), str:\s*"(?!JO9_QA_BOUNTY_(?:game|quests)_COMPLETE)/.test(stderr));
 fs.writeFileSync(path.join(out,cfg.name+'-stderr.log'),stderr);fs.writeFileSync(path.join(out,cfg.name+'-stdout.log'),stdout);
 runs.push({name:cfg.name,pass:true,sourceHash:prepared.sourceHash,diagnosticHash:prepared.diagnosticHash,cases:cases.length,assertions:assertionCount,assertionFailures:0,completionMarker:cfg.marker,completionMarkerObserved:true,engineExecutionOwner:'Root agent, serial invocation of tools/qa/run-client-smoke.ps1 against actual WORK engine.',evidence:[cfg.name+'-stderr.log',cfg.prepared,cfg.cases],families:prepared.families||{actorQuestFailure:prepared.cases},limits:prepared.limits.filter(x=>!/prepar|launch|Root must run/i.test(x))});
}
const last=JSON.parse(fs.readFileSync(path.join(tmp,'client-results.json'),'utf8').replace(/^\uFEFF/,''));assert(last.every(x=>x.pass));fs.writeFileSync(path.join(out,'last-client-results.json'),JSON.stringify(last,null,2));
const staticTests=JSON.parse(fs.readFileSync(path.join(out,'static-test-results.json'),'utf8'));assert(staticTests.pass);
const report={status:'PASS_WITH_EXPLICIT_INTEGRATION_GAPS',source,sourceHash:expectedSource,engine:'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe',native:{runs,cases:runs.reduce((n,x)=>n+x.cases,0),assertions:runs.reduce((n,x)=>n+x.assertions,0),failures:0},static:{checks:staticTests.tests.length,failures:0,evidence:'static-test-results.json'},confirmedFindings:[],unconfirmedCandidates:[],productionWrites:0,privateSavesRead:0,privateSavesWritten:0,fixesApplied:0,humanTCs:'human-play-tests.json',scopeExclusions:['Full is intentionally behind WORK by a latest image feature; no synchronization or production write.','Known deferred difficulty/chariot comment-vs-formula questions are not counted as new regressions.','Champion liberation event1295 retains original prize rules and page structure by approved scope.','Erza +3/-1 hooks are separately approved and are not an unauthorized-writer finding.'],gaps:['Full battle turn processing, battle renderer DOM and actual player mouse interaction were not covered by these two new native runs.','Payout amount and one-page structure were checked against exact current source; these two runs do not newly execute settlement -> result UI -> repeated forward -> return.','Full insolvency asset liquidation, valuation, actor clearing and relocation are not executed by the direct fail_quests contract test.','No personal SAV loading, CRC behavior or all old-save UI caches were tested.','The 8 group PNG files and single-image renderer source passed static/resource checks; this work does not claim a fresh native run of all 8 event return flows.'],cleanup:{diagnosticsOutsideWorkspace:tmp,pendingRootSafeCleanup:true,reproductionScriptsRetained:true}};
fs.writeFileSync(path.join(out,'findings.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(out,'native-final-results.json'),JSON.stringify({sourceHash:expectedSource,...report.native},null,2));
console.log(JSON.stringify({pass:true,cases:report.native.cases,assertions:report.native.assertions,static:report.static.checks,confirmedBugs:0,unconfirmedCandidates:0}));
