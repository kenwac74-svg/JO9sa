'use strict';
// Export the user's saved editor changes without rewriting any dialogue.
const fs=require('node:fs'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',tmp='G:/Codex/tmp/dialogue-editor-sync-20261021';
const rec=repo+'/records/dialogue-editor-sync-20261021';
const core=require(repo+'/tools/text-workshop/core.cjs');
const qa=require(repo+'/tools/qa/release-check.cjs');
const beforeRaw=fs.readFileSync(tmp+'/inputs/baseline.qsp');
const afterRaw=fs.readFileSync(tmp+'/candidate/jack.qsp');
const before=core.parse(beforeRaw),after=core.parse(afterRaw);
assert(core.serialize(before).equals(beforeRaw));assert(core.serialize(after).equals(afterRaw));
assert.equal(before.hash,'698513ebb8e0383f0fc2a6eb9b7bdc433a944e516a6f44ad9353689fdda4c000');
assert.equal(after.hash,'c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d');
const historyRoot='G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/runtime/backups';
const journal=fs.readdirSync(historyRoot).filter(n=>/^2026-10-21.*\.json$/.test(n)).sort().map(n=>({file:n,...JSON.parse(fs.readFileSync(historyRoot+'/'+n,'utf8').replace(/^\uFEFF/,''))}));
assert.equal(journal.length,15);let chain=before.hash;
const replay=core.parse(beforeRaw),edits=[],evidence=[];
function apply(doc,e){const l=doc.locations.find(l=>l.name===e.location);assert(l);const idx=l[e.field];const text=core.shift(doc.lines[idx],5);assert.equal(text.split(e.old).length-1,e.count);doc.lines[idx]=core.shift(text.replace(e.old,e.new),-5);}
for(const m of journal){
 assert.equal(m.status,'applied');assert.equal(m.before,chain);
 assert.equal(m.mod.before_sha256.toLowerCase(),m.before);assert.equal(m.mod.after_sha256.toLowerCase(),m.after);
 const saved=fs.readFileSync(historyRoot+'/'+m.file.replace(/\.json$/,'.qsp'));assert.equal(core.hash(saved),chain);
 for(const e of m.mod.edits){assert.equal(e.count,1);apply(replay,e);if(e.location!=='#simple_npc')edits.push(e);}
 chain=core.hash(core.serialize(replay));assert.equal(chain,m.after);
 evidence.push({file:m.file,before:m.before,after:m.after,location:m.location,sourceSHA256:core.hash(fs.readFileSync(historyRoot+'/'+m.file))});
}
assert.equal(chain,after.hash);assert(core.serialize(replay).equals(afterRaw));assert.equal(edits.length,13);
const netReplay=core.parse(beforeRaw);for(const e of edits)apply(netReplay,e);assert(core.serialize(netReplay).equals(afterRaw));
const skeleton=s=>{let out='',at=0;for(const t of core.literals(s)){out+=s.slice(at,t.start)+'<literal>';at=t.end;}return out+s.slice(at);};
const inventory=[],changedFields=[];
assert.equal(before.lines.length,after.lines.length);assert.deepEqual(before.locations,after.locations);
for(let i=0;i<before.lines.length;i++){
 if(before.lines[i]===after.lines[i])continue;
 const loc=before.locations.find(l=>l.body===i);assert(loc);assert(['#npc_base','interaction_city'].includes(loc.name));
 const a=core.shift(before.lines[i],5),b=core.shift(after.lines[i],5);assert.equal(skeleton(a),skeleton(b));
 const la=core.literals(a),lb=core.literals(b);assert.equal(la.length,lb.length);changedFields.push(loc.name);
 for(let n=0;n<la.length;n++){
  if(la[n].text===lb[n].text)continue;
  assert.equal(la[n].quote,lb[n].quote);assert.deepEqual(core.protectedParts(la[n].text),core.protectedParts(lb[n].text));
  assert(core.isDialogue({field:'body',text:lb[n].text}));core.validateMarkup(lb[n].text);
  inventory.push({location:loc.name,line:lb[n].line,literalIndex:n,oldCharacters:la[n].text.length,newCharacters:lb[n].text.length});
 }
}
assert.equal(inventory.length,13);
const mod={id:'2026-10-21_user_dialogue_editor_sync',description:'Exact export of 13 net user-authored dialogue editor changes; 15 journal records, 2 mutually reversed edits omitted. No authored text or functional changes.',before_sha256:before.hash,after_sha256:after.hash,edits};
for(const p of [tmp+'/mods/'+mod.id+'.json',repo+'/mods/'+mod.id+'.json']){assert(!fs.existsSync(p));fs.writeFileSync(p,JSON.stringify(mod,null,2)+'\n');}
const result={before:before.hash,after:after.hash,journalRecords:15,netStrings:13,reversedRecords:2,changedLocations:changedFields,inventory,journal:evidence,structurePreserved:true,executableCodePreserved:true,protectedTokensPreserved:true,inspection:qa.inspectWorld(afterRaw),newLocations:0,newStateKeys:0,WorkAlreadyApplied:true};
fs.writeFileSync(rec+'/BUILD_RESULT.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,journal:undefined}));
