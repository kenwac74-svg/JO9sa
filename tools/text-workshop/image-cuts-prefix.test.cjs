'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const core=require('./core.cjs'),{create}=require('./image-cuts.cjs');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=','base64');
const prefix="if snk_room_target > 0 and $curloc = 'interior_change': gs 'snk_room_bridge', 'guard', 'interior_change'\r\n";
const marker='! JO9 image-cycle: saved choices are keyed by original image path.\r\n';
const handler=marker+"if $args[0] = 'jo9_path':\r\n local $jo9_base, $jo9_path, jo9_count, jo9_selected\r\n $jo9_base = $args[1]\r\n $jo9_path = $args[1]\r\n jo9_count = 1\r\n jo9_selected = jo9_cut_choice[$jo9_base]\r\n if jo9_selected < 0: jo9_selected = 0\r\n \r\n if jo9_selected >= jo9_count:\r\n  jo9_cut_choice[$jo9_base] = 0\r\n  $jo9_path = $args[1]\r\n end\r\n $result = $jo9_path\r\n exit\r\nend\r\n!Move to a different room in your apartment\r\n*pl 'Preserve room UI'";
function fixture(t,body){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-cut-prefix-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const game=path.join(dir,'game'),runtime=path.join(dir,'runtime'),pic=path.join(game,'content/pic/characters');fs.mkdirSync(pic,{recursive:true});fs.writeFileSync(path.join(pic,'Example.png'),png);
 // Keep the canonical-mod writer inside this fixture too, never the real repo.
 const tools=path.join(dir,'project/tools/text-workshop'),mods=path.join(dir,'project/mods');fs.mkdirSync(tools,{recursive:true});fs.mkdirSync(mods,{recursive:true});
 for(const name of ['image-cuts.cjs','core.cjs','check-image-cycle-syntax.cjs','apply_mods.ps1'])fs.copyFileSync(path.join(__dirname,name),path.join(tools,name));
 const canonical=path.join(mods,'2026-10-08_persistent_image_cycle.json');fs.writeFileSync(canonical,JSON.stringify({edits:[{location:'interior_change',old:'!Move to a different room in your apartment',new:'initial'}]}));
 const raw=Buffer.from(['QSPGAME','header','',core.shift('2',-5),core.shift('interior_change',-5),'',core.shift(body,-5),core.shift('0',-5),core.shift('untouched',-5),core.shift('Keep description',-5),core.shift("*pl 'Keep dialogue'",-5),core.shift('0',-5),''].join('\r\n'),'utf16le');
 fs.writeFileSync(path.join(game,'jack.qsp'),raw);fs.writeFileSync(path.join(dir,'catalog_merge_vs_original.html'),'var D = [["content\\\\pic\\\\characters\\\\Example.png","a","etc",'+png.length+',0,1,1,""]];\nvar MR = "test";');
 return{dir,game,runtime,raw,canonical,file:path.join(game,'jack.qsp'),api:require(path.join(tools,'image-cuts.cjs')).create(game,dir,{load(){},update(){}},runtime)};
}
test('installed image-cycle registry is accepted after the private-room guard without a write',t=>{
 for(const head of ['',prefix]){const f=fixture(t,head+handler);assert.deepEqual(f.api.refresh('no_change'),{unchanged:true});assert.deepEqual(fs.readFileSync(f.file),f.raw);}
});
test('missing or incomplete cycle block refuses registry refresh without a write',t=>{
 for(const body of [prefix+"*pl 'No patch'",prefix+handler.replace(' if jo9_selected >= jo9_count:', ' if unrelated >= jo9_count:')]){const f=fixture(t,body);assert.throws(()=>f.api.refresh('invalid'));assert.deepEqual(fs.readFileSync(f.file),f.raw);}
});
test('adding a cut updates only the registry, preserves the guard and other locations, and backs up QSP',t=>{
 const f=fixture(t,prefix+handler),plan=f.api.info('characters/Example.png');
 const saved=f.api.add({base:plan.base,before:plan.before,next:plan.next,data:png.toString('base64')});
 assert.equal(saved.path,'characters/Example (2).png');assert.deepEqual(fs.readFileSync(path.join(f.game,'content/pic',saved.path)),png);
 const before=core.parse(f.raw),after=core.parse(fs.readFileSync(f.file)),loc=after.locations.find(l=>l.name==='interior_change'),body=core.shift(after.lines[loc.body],5);
 assert.ok(body.startsWith(prefix+marker));assert.ok(body.includes('content/pic/characters/Example (2).png'));assert.ok(body.endsWith("*pl 'Preserve room UI'"));
 const untouched=before.locations.find(l=>l.name==='untouched');assert.equal(after.lines[untouched.body],before.lines[untouched.body]);assert.equal(after.lines[untouched.desc],before.lines[untouched.desc]);
 assert.ok(fs.readdirSync(f.game).some(n=>n.startsWith('jack.qsp.bak_')));assert.deepEqual(core.serialize(after),fs.readFileSync(f.file));
 const exported=JSON.parse(fs.readFileSync(f.canonical,'utf8')).edits[0].new;assert.ok(exported.startsWith(marker));assert.ok(!exported.includes('snk_room_bridge'),'Separate room guard is not copied into the canonical cycle mod');
 assert.deepEqual(f.api.refresh('repeat'),{unchanged:true});
});
