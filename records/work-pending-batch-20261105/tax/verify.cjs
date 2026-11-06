'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {inspectMarkerBoundaries}=require('G:/somi/JO9sa/tools/qa/check-qsp-marker-boundaries.cjs');
const patch=JSON.parse(fs.readFileSync(path.join(__dirname,'sale-tax.patch.json'),'utf8'));
const baseline=fs.readFileSync(process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');
const candidate=fs.readFileSync(path.join(__dirname,'candidate.qsp'));
assert.equal(core.hash(baseline),patch.before_sha256);assert.equal(core.hash(candidate),patch.after_sha256);
function replay(raw,reverse=false,idempotent=false){
 const d=core.parse(raw);
 for(const e of reverse?[...patch.edits].reverse():patch.edits){
  const l=d.locations.find(l=>l.name===e.location),text=core.shift(d.lines[l.body],5),from=reverse?e.new:e.old,to=reverse?e.old:e.new;
  if(idempotent&&text.split(to).length-1===e.count)continue;
  assert.equal(text.split(from).length-1,e.count,e.location);d.lines[l.body]=core.shift(text.split(from).join(to),-5);
 }
 return core.serialize(d);
}
assert.ok(replay(baseline).equals(candidate),'forward replay');assert.ok(replay(candidate,true).equals(baseline),'reverse replay');assert.ok(replay(candidate,false,true).equals(candidate),'idempotence');
const before=core.parse(baseline),after=core.parse(candidate);assert.ok(core.serialize(after).equals(candidate));assert.equal(after.locations.length,before.locations.length);
const names=after.locations.map(l=>l.name);assert.equal(new Set(names).size,names.length);
const changed=after.locations.filter((l,i)=>after.lines[l.body]!==before.lines[before.locations[i].body]).map(l=>l.name);
assert.deepEqual(new Set(changed),new Set(patch.edits.map(e=>e.location)));
const newlineIssues=[];
for(const l of after.locations){const code=core.shift(after.lines[l.body],5);if(/(^|[^\r])\n|\r(?!\n)/.test(code))newlineIssues.push(l.name);}
assert.deepEqual(newlineIssues,[]);
const marker=inspectMarkerBoundaries(candidate);assert.deepEqual(marker.issues,[]);
for(const name of ['jo9_liquidation_sale','jo9_liquidation','jo9_meiki_sale']){
 const a=before.locations.find(l=>l.name===name),b=after.locations.find(l=>l.name===name);assert.equal(before.lines[a.body],after.lines[b.body],name+' preserved');
}
const hardBlocks=text=>[...text.matchAll(/! JO9 MOD START HARD_TRAIT_PRICE_20261104\r\n([\s\S]*?)! JO9 MOD END HARD_TRAIT_PRICE_20261104/g)].map(m=>m[0]);
for(const name of ['jo9_traits_value','interaction_city']){
 const a=before.locations.find(l=>l.name===name),b=after.locations.find(l=>l.name===name);assert.deepEqual(hardBlocks(core.shift(before.lines[a.body],5)),hardBlocks(core.shift(after.lines[b.body],5)),name+' hard trait blocks preserved');
}
const report={verdict:'STATIC_PASS',before_sha256:core.hash(baseline),after_sha256:core.hash(candidate),location_count:names.length,changed_locations:changed,forward_replay:true,reverse_replay:true,idempotence:true,roundtrip:true,line_endings:true,marker_boundaries:true,preserved:['jo9_liquidation_sale','jo9_liquidation','jo9_meiki_sale','all HARD_TRAIT_PRICE_20261104 blocks'],limitations:['This report does not claim native engine execution or rendered appearance.']};
fs.writeFileSync(path.join(__dirname,'static-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
