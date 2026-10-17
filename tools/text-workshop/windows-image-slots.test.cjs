'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const core=require('./core.cjs'),registrar=require('./original-cuts.cjs');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=','base64');
const different=Buffer.from(png);different[different.length-12]^=1;
const prefix="if snk_room_target > 0: gs 'snk_room_bridge', 'guard', 'interior_change'\r\n";
function windowsHandler(){return prefix+[
 '! JO9 image-cycle: saved choices are keyed by original image path.',
 "if $args[0] = 'jo9_path':",
 ' local $jo9_base, $jo9_path, jo9_count, jo9_selected',
 ' local $jo9_candidates, jo9_candidate_ids',
 ' $jo9_base = $args[1]',
 ' $jo9_path = $args[1]',
 ' jo9_count = 1',
 ' jo9_selected = jo9_cut_choice[$jo9_base]',
 ' ! JO9 WINDOWS IMAGE SLOT REGISTRY START',
 " if $jo9_base = 'content/pic/characters/example.png':",
 '  jo9_count = 3',
 "  $jo9_candidates[0] = 'content/pic/characters/Example.png'",
 '  jo9_candidate_ids[0] = 0',
 "  $jo9_candidates[1] = 'content/pic/characters/Example (2).png'",
 '  jo9_candidate_ids[1] = 1',
 "  $jo9_candidates[2] = 'content/pic/characters/Example (7).png'",
 '  jo9_candidate_ids[2] = 2',
 ' end',
 ' ! JO9 WINDOWS IMAGE SLOT REGISTRY END',
 ' ! Preserve the runtime resolver below the registry.',
 ' $result = $jo9_path',
 ' exit',
 'end',
 '!Move to a different room in your apartment',
 "*pl 'Keep room UI'",
 ].join('\r\n');}
function fixture(t,{original=true,physical=true,body=windowsHandler()}={}){
 const sourceMod=path.resolve(__dirname,'../../mods/2026-10-08_persistent_image_cycle.json'),sourceBefore=core.hash(fs.readFileSync(sourceMod));t.after(()=>assert.equal(core.hash(fs.readFileSync(sourceMod)),sourceBefore,'A fixture must never rewrite repository source'));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-windows-slots-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 // JO9 MOD START WINDOWS_IMAGE_SLOTS_20261018_TEST_ISOLATION: canonical export belongs to this temporary project.
 const tools=path.join(dir,'project/tools/text-workshop'),mods=path.join(dir,'project/mods');fs.mkdirSync(tools,{recursive:true});fs.mkdirSync(mods,{recursive:true});
 for(const name of ['image-cuts.cjs','core.cjs','check-image-cycle-syntax.cjs','apply_mods.ps1'])fs.copyFileSync(path.join(__dirname,name),path.join(tools,name));
 const canonical=path.join(mods,'2026-10-08_persistent_image_cycle.json');fs.writeFileSync(canonical,JSON.stringify({edits:[{location:'interior_change',old:'!Move to a different room in your apartment',new:'initial'}]}));
 const {create}=require(path.join(tools,'image-cuts.cjs'));
 // JO9 MOD END WINDOWS_IMAGE_SLOTS_20261018_TEST_ISOLATION
 const game=path.join(dir,'game'),catalog=path.join(dir,'catalog'),runtime=path.join(dir,'runtime'),sourceRoot=path.join(dir,'original'),folder=path.join(game,'content/pic/characters');
 fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(path.join(game,'modtools'),{recursive:true});fs.mkdirSync(path.join(sourceRoot,'content/pic/characters'),{recursive:true});fs.mkdirSync(catalog,{recursive:true});
 fs.writeFileSync(path.join(folder,'Example.png'),png);if(physical)fs.writeFileSync(path.join(folder,'Example (2).png'),png);
 if(original)fs.writeFileSync(path.join(sourceRoot,'content/pic/characters/Example.png'),png);
 fs.symlinkSync(path.join(sourceRoot,'content/pic'),path.join(game,'content/jo9o_original_cuts'),'junction');
 const entry={base:'characters/Example.png',alias:'characters/Example (2).png',source:'content/pic/characters/Example.png',target:'content/jo9o_original_cuts/characters/Example.png',sourceSha:core.hash(png),bytes:png.length,width:1,height:1};
 const manifest=path.join(game,'modtools/image-original-cuts.json');fs.writeFileSync(manifest,JSON.stringify({version:1,originals:original?{'characters/example.png':entry}:{},reservations:{'characters/example.png':{base:entry.base,alias:entry.alias,status:original?'linked':'missing-original'}}}));
 const rows=[['content\\pic\\characters\\Example.png','a','etc',png.length,0,1,1,'']];fs.writeFileSync(path.join(catalog,'catalog_merge_vs_original.html'),'var D = '+JSON.stringify(rows)+';\nvar MR = "test";');fs.writeFileSync(path.join(catalog,'catalog_status.js'),'window.CATALOG_STATUS = '+JSON.stringify({items:{[rows[0][0]]:['spare']}})+';');
 const raw=Buffer.from(['QSPGAME','header','',core.shift('2',-5),core.shift('interior_change',-5),'',core.shift(body,-5),core.shift('0',-5),core.shift('untouched',-5),core.shift('Keep description',-5),core.shift("*pl 'Keep dialogue'",-5),core.shift('0',-5),''].join('\r\n'),'utf16le');fs.writeFileSync(path.join(game,'jack.qsp'),raw);
 const catalogApi={load(){},update(){},meta(){return{};}};return{dir,game,catalog,runtime,folder,sourceRoot,entry,manifest,raw,canonical,catalogApi,api:create(game,catalog,catalogApi,runtime)};
}
function readBody(f){const doc=core.parse(fs.readFileSync(path.join(f.game,'jack.qsp'))),loc=doc.locations.find(l=>l.name==='interior_change');return core.shift(doc.lines[loc.body],5);}
test('matched physical original B is listed once, reads physical bytes, and chooses next3',t=>{
 const f=fixture(t),plan=f.api.info('characters/Example (2).png'),family=f.api.family(f.entry.alias);
 assert.equal(plan.next,'characters/Example (3).png');assert.deepEqual(plan.cuts,['characters/Example.png','characters/Example (2).png']);assert.equal(family.items.length,2);assert.equal(family.items[1].originalCut,true);assert.equal(family.items[1].readOnly,true);assert.equal(f.api.resolveAlias(f.entry.alias),path.join(f.folder,'Example (2).png'));
});
test('a later manual B edit aborts even after manifest cache was populated',t=>{
 const f=fixture(t);f.api.family(f.entry.base);fs.writeFileSync(path.join(f.folder,'Example (2).png'),different);assert.throws(()=>f.api.family(f.entry.base),/충돌|다릅니다/);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Example (2).png')),different);
});
test('missing-original metadata does not reserve an invisible B or fake an original',t=>{
 const f=fixture(t,{original:false,physical:false});assert.equal(f.api.info(f.entry.base).next,'characters/Example (2).png');assert.deepEqual(f.api.family(f.entry.base).items.map(x=>x.file),['Example.png']);assert.equal(f.api.resolveAlias(f.entry.alias),null);
 fs.writeFileSync(path.join(f.folder,'Example (2).png'),different);const family=f.api.family(f.entry.base);assert.equal(family.next,'characters/Example (3).png');assert.equal(family.items[1].readOnly,false);
});
test('linked metadata without a physical B does not serve a hidden original alias',t=>{
 const f=fixture(t,{physical:false});assert.equal(f.api.resolveAlias(f.entry.alias),null);assert.equal(f.api.family(f.entry.base).items.length,1);assert.throws(()=>f.api.info(f.entry.base),/복구/);
});
test('PIC listing deduplicates physical original B and protects its writer',t=>{
 const f=fixture(t),pic=require('./pic-local.cjs').create(f.game,f.catalog,f.catalogApi,f.api),rows=pic.scan().filter(x=>x.path===f.entry.alias),entries=pic.entries('characters').entries.filter(x=>x.name==='Example (2).png');assert.equal(rows.length,1);assert.equal(rows[0].readOnly,true);assert.equal(entries.length,1);assert.equal(entries[0].readOnly,true);assert.throws(()=>pic.apply([{path:f.entry.alias}]),/예약/);
});
test('PIC writer accepts an ordinary user B when original is missing',t=>{
 const f=fixture(t,{original:false}),pic=require('./pic-local.cjs').create(f.game,f.catalog,f.catalogApi,f.api);const result=pic.apply([{path:f.entry.alias,before:core.hash(png),data:different.toString('base64'),cap:1024}]);assert.equal(result.status,'applied');assert.deepEqual(fs.readFileSync(path.join(f.folder,'Example (2).png')),different);
});
test('PIC writer preserves a linked B slot even when legacy metadata has no reservation entry',t=>{
 const f=fixture(t,{physical:false}),doc=JSON.parse(fs.readFileSync(f.manifest,'utf8'));doc.reservations={};fs.writeFileSync(f.manifest,JSON.stringify(doc));const pic=require('./pic-local.cjs').create(f.game,f.catalog,f.catalogApi,f.api);assert.throws(()=>pic.apply([{path:f.entry.alias,before:null,data:different.toString('base64'),cap:1024,createMissing:true,width:1,height:1}]),/예약/);assert.ok(!fs.existsSync(path.join(f.folder,'Example (2).png')));
});
test('registry refresh preserves legacy missing entries and runtime while auto3 stays unregistered',t=>{
 const f=fixture(t);fs.writeFileSync(path.join(f.folder,'Example (3).png'),png);assert.deepEqual(f.api.refresh('auto3'),{unchanged:true});assert.deepEqual(fs.readFileSync(path.join(f.game,'jack.qsp')),f.raw);
});
test('Workshop add3 preserves Windows runtime and add5 appends stable10005 without replacing legacy IDs',t=>{
 const f=fixture(t);const before=f.api.info(f.entry.base),added=f.api.add({base:before.base,before:before.before,next:before.next,data:png.toString('base64')});assert.equal(added.path,'characters/Example (3).png');assert.deepEqual(fs.readFileSync(path.join(f.game,'jack.qsp')),f.raw);
 fs.writeFileSync(path.join(f.folder,'Example (4).png'),png);const plan=f.api.info(f.entry.alias),saved=f.api.add({base:plan.base,before:plan.before,next:plan.next,data:png.toString('base64')});assert.equal(saved.path,'characters/Example (5).png');const body=readBody(f);assert.ok(body.startsWith(prefix));assert.ok(body.endsWith("*pl 'Keep room UI'"));assert.match(body,/jo9_candidate_ids\[1\] = 1/);assert.match(body,/jo9_candidate_ids\[2\] = 2/);assert.match(body,/jo9_candidate_ids\[3\] = 10005/);assert.match(body,/Example \(7\)\.png/);assert.ok(!body.includes('$jo9_candidates[4]'));assert.ok(!body.includes('$jo9_path = \'content/pic/characters/Example (5).png\''));assert.deepEqual(f.api.refresh('repeat'),{unchanged:true});assert.match(JSON.parse(fs.readFileSync(f.canonical,'utf8')).edits[0].new,/jo9_candidate_ids\[3\] = 10005/);
});
test('malformed Windows registry refuses refresh without changing QSP or a cut',t=>{
 const f=fixture(t,{body:windowsHandler().replace('jo9_candidate_ids[1] = 1','jo9_candidate_ids[1] = 0')}),before=fs.readFileSync(path.join(f.game,'jack.qsp'));assert.throws(()=>f.api.refresh('bad'),/등록|ID/);assert.deepEqual(fs.readFileSync(path.join(f.game,'jack.qsp')),before);
});
test('registrar keeps matched physical original during reconcile and does not release catalog protection',t=>{
 const f=fixture(t),before=fs.readFileSync(f.manifest),record=registrar.register(f.game,f.catalog,f.sourceRoot,f.runtime,undefined,true);assert.equal(record.registered.length,1);assert.equal(record.released.length,0);assert.deepEqual(JSON.parse(fs.readFileSync(f.manifest,'utf8')).originals['characters/example.png'],f.entry);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Example (2).png')),png);assert.ok(before.length>0);
});
test('registrar rejects a changed original B during reconcile without modifying metadata',t=>{
 const f=fixture(t);fs.writeFileSync(path.join(f.folder,'Example (2).png'),different);const before=fs.readFileSync(f.manifest);assert.throws(()=>registrar.register(f.game,f.catalog,f.sourceRoot,f.runtime,undefined,true),/기존 B|충돌|다릅니다/);assert.deepEqual(fs.readFileSync(f.manifest),before);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Example (2).png')),different);
});
test('new original registration makes a physical B and rollback removes only that new copy',t=>{
 const f=fixture(t,{physical:false}),record=registrar.register(f.game,f.catalog,f.sourceRoot,f.runtime,undefined,true);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Example (2).png')),png);registrar.rollback(record);assert.ok(!fs.existsSync(path.join(f.folder,'Example (2).png')));
});
