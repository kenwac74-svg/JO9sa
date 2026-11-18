'use strict';
// 최신 WORK의 장면 원문을 보존하고 마지막 페이지 완료 효과만 추가한다.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(work),doc=core.parse(raw),loc=doc.locations.find(loc=>loc.name==='interaction_city');
assert(core.serialize(doc).equals(raw),'QSP roundtrip changed bytes');
const before=core.shift(doc.lines[loc.body],5);
const old=' ! JO9 MOD END DIALOGUE_IMAGE_601e4237a83d9f2b\r\nEND\r\n! JO9 MOD END PRISCILLA_REWARD_CHOICE_20261116';
const effect=[
' ! JO9 MOD START PRISCILLA_SERVICE_COMPLETION_20261117',
' ! The final page raises the existing daily mood rate to the ecstasy threshold without removing moodlets.',
' $special_action[7] = {',
'  local jo9_priscilla_mood_target = 50',
'  local jo9_priscilla_mood_index = 0',
'  :jo9_priscilla_good_mood',
"  if jo9_priscilla_mood_index < arrsize('$master_good_mood'):",
"   if master_moodlet[$master_good_mood[jo9_priscilla_mood_index]] > 0: jo9_priscilla_mood_target -= 10",
'   jo9_priscilla_mood_index += 1',
"   jump 'jo9_priscilla_good_mood'",
'  end',
'  jo9_priscilla_mood_index = 0',
'  :jo9_priscilla_bad_mood',
"  if jo9_priscilla_mood_index < arrsize('$master_bad_mood'):",
"   if master_moodlet[$master_bad_mood[jo9_priscilla_mood_index]] > 0: jo9_priscilla_mood_target += 15",
'   jo9_priscilla_mood_index += 1',
"   jump 'jo9_priscilla_bad_mood'",
'  end',
'  master_mood_rate = max(master_mood_rate, jo9_priscilla_mood_target)',
"  gs '$moodlets_account'",
'  master_mood_plus = master_mood',
'  priscilla_slv = 1',
' }',
' ! JO9 MOD END PRISCILLA_SERVICE_COMPLETION_20261117',
].join('\r\n');
const next=old.replace('\r\nEND\r\n','\r\n'+effect+'\r\nEND\r\n');
assert.equal(before.split(old).length-1,1,'Completion anchor changed');
doc.lines[loc.body]=core.shift(before.replace(old,()=>next),-5);const output=core.serialize(doc),after=core.parse(output);assert(core.serialize(after).equals(output));
const original=core.parse(raw);for(const item of original.locations){const other=after.locations.find(loc=>loc.name===item.name);assert(other);assert.equal(after.lines[other.desc],original.lines[item.desc]);if(item.name!=='interaction_city')assert.equal(after.lines[other.body],original.lines[item.body]);}
assert.equal(core.shift(after.lines[loc.body],5).replace(next,()=>old),before,'Changes outside final callback');
const scoped=['QSPGAME','','',core.shift('1',-5),core.shift('interaction_city',-5),'',after.lines[loc.body],core.shift('0',-5),''];const scope=Buffer.from(scoped.join('\r\n'),'utf16le');
const endings=require('G:/somi/JO9sa/tools/qa/check-qsp-line-endings.cjs');
const beforeScope=Buffer.from(['QSPGAME','','',core.shift('1',-5),core.shift('interaction_city',-5),'',core.shift(before,-5),core.shift('0',-5),''].join('\r\n'),'utf16le');
const previousEndings=endings.inspect(beforeScope).issues,remainingEndings=endings.inspect(scope).issues;
assert.deepEqual(remainingEndings,previousEndings,'This patch added or altered an existing line-ending issue');
assert(!/(?<!\r)\n|\r(?!\n)/.test(effect),'New callback has malformed line endings');
assert.equal(require('G:/somi/JO9sa/tools/qa/check-qsp-marker-boundaries.cjs').inspectMarkerBoundaries(scope).issues.length,0);
const patch={id:'2026-11-17_priscilla_service_completion',description:'Apply ecstasy mood through existing mood accounting and priscilla_slv=1 on final page of the newly added Priscilla service reward.',status:'APPROVED',before_sha256:core.hash(raw),after_sha256:core.hash(output),edits:[{location:'interaction_city',field:'body',old,new:next,count:1,patchId:'PRISCILLA_SERVICE_COMPLETION_20261117'}]};
fs.mkdirSync(path.join(__dirname,'mods'),{recursive:true});fs.writeFileSync(path.join(__dirname,'mods',patch.id+'.json'),JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'candidate.qsp'),output);
const proof={before:patch.before_sha256,after:patch.after_sha256,bytes:output.length,location:'interaction_city',branch:6028,callbackPage:7,callbackLine:before.slice(0,before.indexOf(old)).split('\r\n').length+1,roundtrip:true,onlyCallbackAdded:true,otherLocationsPreserved:true,addedLineEndingsValid:true,preExistingLineEndingIssuesPreserved:remainingEndings,markerBoundaries:true,newPersistedVariable:'priscilla_slv',otherNewPersistedVariables:0,temporaryCountersLocal:true};
fs.writeFileSync(path.join(__dirname,'prepared.json'),JSON.stringify(proof,null,2)+'\n');process.stdout.write(JSON.stringify(proof)+'\n');
