'use strict';
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/reward22-resume-20261116',D=__dirname;
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(W+'/jack.qsp');a.equal(c.hash(raw),'70f22afc1f71eac6a75696dda69bb968e1b63a0b7839d5493b6e0851b6aca662');
const source=fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp');a.equal(c.hash(source),'9d0d63f3841e02b92fac14030d1d98f38021aa5db5ead899cdd853b569528d80');
const redPath=fs.existsSync(D+'/red-results.json')?D+'/red-results.json':T+'/client-results.json';
const red=JSON.parse(fs.readFileSync(redPath,'utf8').replace(/^\uFEFF/,''));a.equal(red.length,3);a(red.every(r=>!r.pass&&r.reason==='Unexpected message before completion'));
for(const [name,label]of [['selection','FAIL_FIELD_2_1_ero_rwd1_txt'],['costs','FAIL_DISCOUNT_3_0_0_0'],['routes','FAIL_ROUTE_1']])a(fs.readFileSync(T+'/red-'+name+'-stderr.log','utf8').includes(label));
fs.writeFileSync(D+'/red-results.json',JSON.stringify(red,null,2)+'\n');
const proposal=JSON.parse(fs.readFileSync(R+'/records/reward22-restoration-proposal-20261114/COMPLETE_PROPOSED_PATCH.json','utf8'));
const doc=c.parse(raw),edits=proposal.edits.map(e=>({...e,new:e.new.replaceAll('REWARD22_ADULT_COMPLETE_PROPOSAL_20261114','REWARD22_ADULT_COMPLETE_RESTORE_20261116'),patchId:'REWARD22_ADULT_COMPLETE_RESTORE_20261116'}));
for(const e of edits){const l=doc.locations.find(l=>l.name===e.location),b=c.shift(doc.lines[l.body],5);a.equal(b.split(e.old).length,2);doc.lines[l.body]=c.shift(b.replace(e.old,()=>e.new),-5);}
const formattingLoc=doc.locations.find(l=>l.name==='jo9_slave_death'),formattingOld=c.shift(doc.lines[formattingLoc.body],5),formattingNew=formattingOld.replace(/(?<!\r)\n/g,'\r\n');
a.equal([...formattingOld.matchAll(/(?<!\r)\n/g)].length,2);
let lo=0,hiOld=formattingOld.length,hiNew=formattingNew.length;
while(formattingOld[lo]===formattingNew[lo]&&lo<Math.min(hiOld,hiNew))lo++;
while(hiOld>lo&&hiNew>lo&&formattingOld[hiOld-1]===formattingNew[hiNew-1]){hiOld--;hiNew--;}
edits.push({location:formattingLoc.name,field:'body',...c.minimalEdit(formattingOld,formattingNew,lo,hiOld,hiNew),count:1,patchId:'EXISTING_LINE_ENDINGS_20261116'});
doc.lines[formattingLoc.body]=c.shift(formattingNew,-5);
const after=c.serialize(doc);a(c.serialize(c.parse(after)).equals(after));
const beforeDoc=c.parse(raw),changes=doc.locations.filter(l=>doc.lines[l.body]!==beforeDoc.lines[l.body]).map(l=>l.name);a.deepEqual(changes,['interaction','#var_base','jo9_slave_death'].sort((x,y)=>doc.locations.findIndex(l=>l.name===x)-doc.locations.findIndex(l=>l.name===y)));
const inverse=c.parse(after);for(const e of [...edits].reverse()){const l=inverse.locations.find(l=>l.name===e.location),b=c.shift(inverse.lines[l.body],5);a.equal(b.split(e.new).length,2);inverse.lines[l.body]=c.shift(b.replace(e.new,()=>e.old),-5);}a(c.serialize(inverse).equals(raw));
const issues=bytes=>{try{qa.inspectWorld(bytes);return [];}catch(e){if(!Array.isArray(e.issues))throw e;return e.issues;}};
const previousIssues=issues(raw),newIssues=issues(after);a.equal(newIssues.length,0);a.equal(previousIssues.length,2);a(previousIssues.every(i=>i.location==='jo9_slave_death'&&i.kind==='loneLF'));
for(const e of edits)a(!/(?<!\r)\n/.test(e.new));
const hum=JSON.parse(fs.readFileSync(R+'/mods/20261114_humiliation_psy_keys_text.json','utf8'));for(const e of hum.edits)a(c.shift(doc.lines[doc.locations.find(l=>l.name===e.location).body],5).includes(e.new));
const resources=JSON.parse(fs.readFileSync(R+'/records/reward22-restoration-proposal-20261114/resource-and-flags-audit.json','utf8'));let files=0;
for(const r of resources.resources)if(!r.noImageByDesign)for(const age of ['young','milf'])for(const f of r.ages[age].files){a(fs.existsSync(W+'/content/pic/'+r.dir+f));files++;}
const patch={id:'2026-11-16_reward22_adult_complete_restore',status:'APPROVED',approval:'User resumed halted 2.2 restoration; prior adult scope and 2.2.3 action-cost rule approvals retained. WORK/source only; existing Patch2 ZIP not rebuilt.',before_sha256:c.hash(raw),after_sha256:c.hash(after),edits};
const green=JSON.parse(fs.readFileSync(T+'/client-results.json','utf8').replace(/^\uFEFF/,''));a.equal(green.length,4);a(green.every(r=>r.pass));
const testedRaw=fs.readFileSync(T+'/candidate.qsp');a.equal(c.hash(testedRaw),'46abe05224b9fb19b1644e9e48185c33ccb3bb70eaf745c7b70b98dd5a930b68');
const tested=c.parse(testedRaw);for(const name of ['#var_base','interaction','#dynamic']){const l=doc.locations.find(l=>l.name===name),p=tested.locations.find(l=>l.name===name);a.equal(doc.lines[l.body],tested.lines[p.body]);}
fs.writeFileSync(D+'/green-results.json',JSON.stringify(green,null,2)+'\n');
fs.writeFileSync(T+'/candidate.qsp',after);fs.writeFileSync(D+'/patch.json',JSON.stringify(patch,null,2)+'\n');
const result={before:c.hash(raw),after:c.hash(after),sourceBefore:c.hash(source),source22Sha256:JSON.parse(fs.readFileSync(R+'/records/trait-dialogue-comparison-20261114/comparison.json','utf8')).source22Sha256,changedLocations:changes,semanticChanges:['#var_base','interaction'],formattingOnlyLocation:'jo9_slave_death',lineEndingsNormalized:2,locations:doc.locations.length,variants:18,restoredTextFields:72,existingImagePathsChecked:files,newLocations:0,newSaveFields:0,inverseByteMatch:true,unrelatedBytesPreserved:true,humiliationFixPreserved:true,preexistingLineEndingIssuesFixed:previousIssues,nativeGreenFixtures:4,nativeAssertions:662,testedCandidateBeforeFormatting:c.hash(testedRaw),testedCodeIdenticalAfterFormatting:true,productionUnchanged:true};
fs.writeFileSync(D+'/prepared.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
