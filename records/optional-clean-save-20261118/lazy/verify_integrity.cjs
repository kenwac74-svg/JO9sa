'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const moduleSource=require('./lazy_patch.cjs');
const endings=require('G:/somi/JO9sa/tools/qa/check-qsp-line-endings.cjs').inspect;
const markers=require('G:/somi/JO9sa/tools/qa/check-qsp-marker-boundaries.cjs').inspectMarkerBoundaries;
const input=fs.readFileSync(process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');
const built=moduleSource.buildPatch(input),replay=core.parse(input);
for(const edit of built.edits){const location=replay.locations.find(item=>item.name===edit.location),body=core.shift(replay.lines[location.body],5);assert.equal(body.split(edit.old).length-1,edit.count);replay.lines[location.body]=core.shift(body.replace(edit.old,edit.new),-5);}
assert(core.serialize(replay).equals(built.candidate));
const beforeEndings=endings(input),afterEndings=endings(built.candidate),beforeMarkers=markers(input),afterMarkers=markers(built.candidate);
assert.deepEqual(afterEndings.issues,beforeEndings.issues,'no new line-ending issues');
assert.deepEqual(afterMarkers.issues,beforeMarkers.issues,'no new marker issues');
const changed=new Set(built.inventory.changedLocations);assert(!afterEndings.issues.some(issue=>changed.has(issue.location)));
const report={status:'PASS_SCOPED',baselineSha256:core.hash(input),candidateSha256:core.hash(built.candidate),patchReplay:true,locations:afterEndings.locations,editCount:built.edits.length,changedLocations:[...changed],newLineEndingIssues:0,changedLocationLineEndingIssues:0,inheritedLineEndingIssues:beforeEndings.issues,markerBoundaryIssues:afterMarkers.issues.length,limitation:'The baseline has ten pre-existing lone-LF findings in two untouched locations. This module preserves them byte-for-byte and does not claim global line-ending cleanliness.'};
fs.writeFileSync(path.join(__dirname,'integrity.json'),JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({status:report.status,editCount:report.editCount,newLineEndingIssues:0,inheritedLineEndingIssues:beforeEndings.issues.length,markerBoundaryIssues:report.markerBoundaryIssues,patchReplay:true})+'\n');
