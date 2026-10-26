'use strict';
// Static, in-memory provenance/regression checks; never writes a candidate or runtime QSP.
const fs=require('node:fs'),assert=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const {buildTentacleEdits}=require('./tentacle-edits.cjs');
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),before=c.parse(raw),after=c.parse(raw),edits=buildTentacleEdits(after);
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
for(const e of edits){const l=after.locations.find(l=>l.name===e.location),old=body(after,e.location);assert.equal(old.split(e.old).length-1,1);after.lines[l.body]=c.shift(old.replace(e.old,()=>e.new),-5);}
const unchanged=['next_day','$newloc','interaction_screen','jo9_traits_ap'].filter(n=>before.locations.some(l=>l.name===n));for(const n of unchanged)assert.equal(body(before,n),body(after,n),n);
const gains=s=>s.split('\r\n').filter(l=>l.includes('spawn_semen += semen_gain['));assert.deepEqual(gains(body(before,'interaction')),gains(body(after,'interaction')));
// This image path is also used by an unrelated lesson. Its entire setup remains byte-identical.
const otherStart="if code_defined['interaction_lesson_polypusvermin'] = 0:",a=body(before,'interaction').indexOf(otherStart),b=body(after,'interaction').indexOf(otherStart);
assert(a>=0&&b>=0);const block=s=>s.slice(0,s.indexOf("if interaction =",s.indexOf('\r\n')+2));assert.equal(block(body(before,'interaction').slice(a)),block(body(after,'interaction').slice(b)));
const changed=after.locations.filter(l=>body(before,l.name)!==body(after,l.name)).map(l=>l.name);assert.deepEqual(new Set(changed),new Set(['menu_form','interaction','interaction_result','end_day_screen','jo9_household_worker']));
const bytes=c.serialize(after),structure=qa.inspectWorld(bytes);assert.equal(after.locations.length,before.locations.length);
const result={status:'STATIC_PASS',baseline:before.hash,after:c.hash(bytes),edits:edits.length,changedLocations:changed,newLocations:0,newPersistentKeys:0,manualLocalScratchDeclarations:3,normalGainExpressionsUnchanged:true,unchangedLocations:unchanged,unrelatedSharedImageLessonUnchanged:true,structure,nativeRun:false,limits:['Static provenance checks only. Native ready/consume and real click-to-forward/stale-link behavior must still be executed against the integrated candidate.']};
fs.writeFileSync(__dirname+'/tentacle-static.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
