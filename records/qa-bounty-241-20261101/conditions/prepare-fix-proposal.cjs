'use strict';
// Prepare an unapplied one-line QSP edit. No production file is opened for writing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R='G:/somi/JO9sa',source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const core=require(R+'/tools/text-workshop/core.cjs'),rules=require(R+'/tools/text-workshop/image-cut-condition-rules.cjs'),syntax=require(R+'/tools/text-workshop/check-image-cycle-syntax.cjs');
const expected='78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d',raw=fs.readFileSync(source);
assert.equal(core.hash(raw),expected,'Refresh proposal source if WORK changes.');
const protectedReport=JSON.parse(fs.readFileSync(path.join(__dirname,'adversarial-report.json')));
for(const file of protectedReport.protected)assert.equal(core.hash(fs.readFileSync(file.path)),file.sha256);
const doc=core.parse(raw);assert.deepEqual(core.serialize(doc),raw);
const locs=doc.locations.filter(l=>l.name==='interior_change');assert.equal(locs.length,1);const loc=locs[0],body=core.shift(doc.lines[loc.body],5);
const old=" $jo9_after = func('interior_change', 'jo9_path', $jo9_visible_top)",next=" $jo9_after = func('interior_change', 'jo9_path', $jo9_visible_top, 3)";
assert.equal(body.split(old).length-1,1);assert.equal(body.split(next).length-1,0);
const toggleAt=body.indexOf("if $args[0] = 'jo9_toggle':"),oldAt=body.indexOf(old);assert(oldAt>toggleAt);assert(oldAt<body.indexOf('! JO9 MOD END WINDOWS_IMAGE_SLOTS_TOGGLE',toggleAt));
const fixed=body.replace(old,next),pathSection=body.slice(body.indexOf("if $args[0] = 'jo9_path':"),body.indexOf('! JO9 MOD END WINDOWS_IMAGE_SLOTS_PATH'));
const allModeLines=pathSection.split(/\r?\n/).filter(l=>l.includes('args[2]'));
assert.deepEqual(allModeLines,[" if args[2] = 2:","  if args[2] = 1: jo9_selected_at = (jo9_selected_at + 1) mod jo9_active_count"]);
const testRules=[{base:'content/pic/scene/qa_toggle.png',path:'content/pic/scene/qa_toggle (2).png',morality:null,money:{op:'ge',value:100},rank:null,reputation:null},{base:'content/pic/scene/qa_toggle.png',path:'content/pic/scene/qa_toggle (3).png',morality:null,money:{op:'ge',value:100},rank:null,reputation:null}];
const originalConfigured=rules.buildBody(body,testRules),fixedConfigured=rules.buildBody(fixed,testRules);
assert.equal(fixedConfigured,originalConfigured.replace(old,next),'Every generated condition byte must stay identical.');
assert.equal(rules.buildBody(fixedConfigured,[]),fixed);
const configuredPath=fixedConfigured.slice(fixedConfigured.indexOf("if $args[0] = 'jo9_path':"),fixedConfigured.indexOf('! JO9 MOD END WINDOWS_IMAGE_SLOTS_PATH'));
assert.deepEqual(configuredPath.split(/\r?\n/).filter(l=>l.includes('args[2]')),[" if args[2] = 2:"," if args[2] = 0 and jo9_ic_auto_at >= 0: jo9_selected_at = jo9_ic_auto_at","  if args[2] = 1: jo9_selected_at = (jo9_selected_at + 1) mod jo9_active_count"]);
assert.equal(syntax.checkSyntax(fixed).ok,true);assert.equal(syntax.checkSyntax(fixedConfigured).ok,true);
doc.lines[loc.body]=core.shift(fixed,-5);const after=core.serialize(doc);assert.deepEqual(core.serialize(core.parse(after)),after);
const beforeDoc=core.parse(raw);assert.deepEqual(doc.lines.filter((_,i)=>i!==loc.body),beforeDoc.lines.filter((_,i)=>i!==loc.body));
const proposal={
 id:'2026-11-01_image_cut_conditions_manual_toggle_mode3_proposal',status:'proposal-only-not-applied',priority:'P2',description:'수동 이미지 전환의 현재 선택 검증에서 자동 조건 컷 우선 선택을 생략하도록 mode3 지정',target:'game/jack.qsp',source,sourceSha256:expected,before_sha256:expected,after_sha256:core.hash(after),
 edits:[{location:'interior_change',field:'body',old,new:next,count:1}],
 scope:{changedLocations:1,changedCalls:1,newVariables:0,newLocations:0,saveMigration:false,productionWrites:false,candidateQspWritten:false},
 contract:{
 mode0:'Fresh rendering still selects the lowest matching configured cut; unchanged.',
 mode1:'Cycles among all existing eligible active paths with original IDs; unchanged.',
 mode2:'Returns the saved already-rendered path even if the candidate was removed or became ineligible; called before validation and unchanged.',
 mode3:'Existing jo9_path fallthrough when mode is neither 0, 1 nor 2: discovers and filters candidates, keeps the current eligible selection, otherwise normalizes to A or first surviving path, updates choice and image count, and does not automatically prefer a configured cut or advance.',
 whySafe:'The full current jo9_path has only mode2 early return and mode1 increment. Generated conditions add only a mode0 preference. Thus mode3 uses the same candidate and fallback logic while bypassing precisely that preference. With no configured rules, mode0 and mode3 run identical branches.'
 },
 rootCause:'Real jo9_toggle first invokes jo9_path to normalize selection. Its implicit mode0 now forces B, so a previous C differs from normalized B and the following mode1 advance is skipped. Explicit mode3 avoids the automatic preference during this manual validation step.',
 expectedNativeChecks:[
  {case:'No rules, A/B/C/D exist',expected:'0 -> 10002 -> 10003 -> 10004 -> 0, unchanged legacy cycle.'},
  {case:'One matching B rule',expected:'Initial auto B -> manual C -> D -> A -> B.'},
  {case:'Matching B and C rules',expected:'Initial auto B -> manual C -> D -> A -> B; lowest matching rule still wins only fresh mode0 rendering.'},
  {case:'Current B becomes ineligible before click; A/C/D survive',expected:'mode2 identifies rendered B; mode3 falls back to A, saved-ID difference skips mode1, and HTML changes B to A. Next click advances to C.'},
  {case:'Current C remains eligible but B becomes eligible',expected:'Manual click advances from C to D; a fresh mode0 render still auto-selects B.'},
  {case:'Current selected file is removed',expected:'mode2 identifies the old rendered path; mode3 uses unchanged A/first-survivor fallback and HTML replacement can find the old path.'},
  {case:'A absent but another eligible file survives',expected:'Unchanged first-surviving-path fallback and its existing selection ID.'},
  {case:'Registered legacy candidate uses compact ID 1 rather than 10002',expected:'Original registered IDs remain intact through validation, cycling and mode2 lookup.'},
  {case:'Clean overlay currently active',expected:'Original jo9_toggle overlay removal/rebuild and last matching attribute replacement remain unchanged.'}
 ],
 verification:{staticSyntaxBase:true,staticSyntaxWithTwoRules:true,qspRoundTrip:true,onlyOneBodyChanged:true,generatedConditionBlocksUnchanged:true,ruleRemovalPreservesFixedBase:true,engineRunByThisProposal:false,productionHashesUnchanged:true},
 limits:['Static checks do not establish engine correctness; root must run the original jo9_html/jo9_toggle pipeline against an isolated candidate before claiming the fix passes.','If zero active paths remain, this proposal retains the existing base-path return behavior; it does not add a new fallback contract.']
};
fs.writeFileSync(path.join(__dirname,'fix-proposal.json'),JSON.stringify(proposal,null,2)+'\n');
assert.equal(core.hash(fs.readFileSync(source)),expected);for(const file of protectedReport.protected)assert.equal(core.hash(fs.readFileSync(file.path)),file.sha256);
console.log(JSON.stringify({status:proposal.status,before:expected,after:proposal.after_sha256,edits:proposal.edits,verification:proposal.verification},null,2));
