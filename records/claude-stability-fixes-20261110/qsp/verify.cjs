'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../../..'),core=require(path.join(root,'tools/text-workshop/core.cjs'));
const baseline=path.resolve(process.argv[2]),candidate=path.resolve(process.argv[3]||path.join(root,'assets/runtime/2.4.1/jack.qsp'));
const oldRaw=fs.readFileSync(baseline),newRaw=fs.readFileSync(candidate),a=core.parse(oldRaw),b=core.parse(newRaw);
assert.equal(a.hash,'8332e1857fa594283eddda448177e3e63dbf554a2f3b241350aa7a9c3291c94f');
assert.equal(b.hash,'8aadee2edbc0b2b7b3455f3c062a42efc8ba6d72317f4429eef23873dc084a26');
assert(oldRaw.equals(Buffer.from(a.lines.join('\r\n'),'utf16le')),'baseline byte roundtrip');
assert(newRaw.equals(Buffer.from(b.lines.join('\r\n'),'utf16le')),'candidate byte roundtrip');
assert.equal(a.locations.length,b.locations.length);
const changes=[];
for(let i=0;i<a.locations.length;i++){
 const x=a.locations[i],y=b.locations[i];assert.equal(x.name,y.name);
 assert.equal(a.lines[x.desc],b.lines[y.desc]);
 if(a.lines[x.body]!==b.lines[y.body])changes.push(x.name);
}
assert.deepEqual(changes.sort(),['jo9_duty_text','jo9_household_worker','jo9_liquidation_assets','jo9_room_duty']);
const expected=core.parse(oldRaw);
let edits=0;
for(const name of ['2026-11-10_stability_01_duty_sound','2026-11-10_stability_02_external_duty_chores','2026-11-10_stability_03_room_refunds']){
 const mod=JSON.parse(fs.readFileSync(path.join(root,'mods',name+'.json'),'utf8'));
 assert.equal(core.parse(Buffer.from(expected.lines.join('\r\n'),'utf16le')).hash,mod.before_sha256);
 for(const e of mod.edits){
  const l=expected.locations.find(l=>l.name===e.location),text=core.shift(expected.lines[l.body],5);
  assert.equal(text.split(e.old).length-1,e.count);assert.equal(e.count,1);
  expected.lines[l.body]=core.shift(text.replace(e.old,e.new),-5);edits++;
 }
 assert.equal(core.parse(Buffer.from(expected.lines.join('\r\n'),'utf16le')).hash,mod.after_sha256);
}
assert.equal(edits,11);assert(newRaw.equals(Buffer.from(expected.lines.join('\r\n'),'utf16le')),'exact all-byte mod replay');
const get=(d,name)=>core.shift(d.lines[d.locations.find(l=>l.name===name).body],5);
const play="play 'content/snd/'+$jo9_rd_snd+'.mp3', sound_volume";
assert.equal(get(a,'jo9_duty_text').split(play).length-1,1);
assert.equal(get(b,'jo9_duty_text').split(play).length-1,1);
const interior="jo9_ls_amount = iif(jo9_room_tier[jo9_ls_ri] = 1, 1000, iif(jo9_room_tier[jo9_ls_ri] = 2, 2500, iif(jo9_room_tier[jo9_ls_ri] >= 3, 5000, 0))) * iif(difficulty_setting = 2, 150, 100) / 100";
assert(get(a,'jo9_liquidation_assets').includes(interior));assert(get(b,'jo9_liquidation_assets').includes(interior));
const results={baseline_sha256:a.hash,candidate_sha256:b.hash,locations:a.locations.length,changed_locations:changes,edits,byte_roundtrip:true,exact_replay:true,play_call_unchanged:true,interior_multiplier_unchanged:true};
fs.writeFileSync(path.join(__dirname,'scope-results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
