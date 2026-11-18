'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const core=require(process.env.JO9_SHARING_CORE||'./appearance-sharing.cjs'),links=require(process.env.JO9_LINK_MODULE||'./character-image-links.cjs');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=','base64');
function fixture(t,ids=[2580,2608]){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-related-json-')),game=path.join(root,'game'),catalog=path.join(root,'catalog');
 fs.mkdirSync(path.join(game,'json/slaves'),{recursive:true});fs.mkdirSync(path.join(game,'content/pic/girls'),{recursive:true});fs.mkdirSync(catalog);
 fs.writeFileSync(path.join(game,'content/pic/girls/base.png'),png);fs.writeFileSync(path.join(game,'content/pic/girls/new.png'),png);
 const file=id=>path.join(game,'json/slaves/'+id+'_test.json');for(const id of ids)fs.writeFileSync(file(id),JSON.stringify({seed_name:'인물 '+id,fullimage:'girls/base',seed_beauty:id}));
 t.after(()=>fs.rmSync(root,{recursive:true}));
 const policy=value=>{fs.mkdirSync(path.join(game,'modtools'),{recursive:true});fs.writeFileSync(path.join(game,'modtools/character-image-sharing.json'),JSON.stringify(value));};
 return {game,catalog,file,policy,api:()=>core.create(game),links:links.create(game,catalog)};
}
function untouched(f,ids){return new Map(ids.map(id=>[id,fs.readFileSync(f.file(id))]));}
function assertUntouched(f,before){for(const [id,bytes]of before)assert.deepEqual(fs.readFileSync(f.file(id)),bytes);assert.equal(fs.existsSync(path.join(f.catalog,'image_work')),false);assert.equal(fs.existsSync(path.join(f.game,'modtools/character-image-sharing-history')),false);}
test('legacy malformed or missing member stops target writes even without a prior read',t=>{
 const f=fixture(t,[2577,2585,2607]),before=untouched(f,[2577,2585]);fs.writeFileSync(f.file(2607),'not JSON');
 assert.throws(()=>f.api().targets(2577),/2607/);assert.throws(()=>f.api().materialize([2585]),/2607/);
 fs.unlinkSync(f.file(2607));assert.throws(()=>f.api().targets(2577),/2607/);assertUntouched(f,before);
});
test('persisted generic group rejects a malformed member before preview or materialization',t=>{
 const f=fixture(t),before=untouched(f,[2580]);f.policy({version:1,groups:[[2580,2608]],families:[]});const descriptor=f.api().describe(2580);fs.writeFileSync(f.file(2608),'[]');
 assert.throws(()=>f.api().targets(2580),/2608/);assert.throws(()=>f.api().preview({...descriptor,peerIds:[]}),/2608/);assert.throws(()=>f.api().materialize([2580]),/2608/);assertUntouched(f,before);
});
test('an unrelated malformed character does not prevent a healthy group write',t=>{
 const f=fixture(t,[2580,2608,3000]);fs.writeFileSync(f.file(3000),'bad unrelated JSON');const descriptor=f.links.read([2580]).characters[0],result=f.links.apply({id:2580,field:'fullmade',path:'girls/new.png',expectedHash:descriptor.jsonSha256});
 assert.deepEqual(result.affectedIds,[2580,2608]);assert.equal(JSON.parse(fs.readFileSync(f.file(2608))).fullmade,'girls/new');assert.equal(fs.readFileSync(f.file(3000),'utf8'),'bad unrelated JSON');
});
test('previously observed implicit group cannot silently drop a malformed peer after rereading',t=>{
 const f=fixture(t),descriptor=f.links.read([2580]).characters[0],before=untouched(f,[2580]);fs.writeFileSync(f.file(2608),'not JSON');
 f.links.read([2580]);assert.throws(()=>f.links.apply({id:2580,field:'fullmade',path:'girls/new.png',expectedHash:descriptor.jsonSha256}),/2608/);assertUntouched(f,before);
});
test('an explicit detach releases the remembered peer and a later unrelated error does not block writes',t=>{
 const f=fixture(t),descriptor=f.links.read([2580]).characters[0];fs.writeFileSync(f.file(2608),'not JSON');f.policy({version:1,groups:[[2580],[2608]],families:[[2580,2608]]});
 const result=f.links.apply({id:2580,field:'fullmade',path:'girls/new.png',expectedHash:descriptor.jsonSha256});assert.deepEqual(result.affectedIds,[2580]);assert.equal(JSON.parse(fs.readFileSync(f.file(2580))).fullmade,'girls/new');
});
test('explicitly detached legacy member remains editable despite another legacy JSON error',t=>{
 const f=fixture(t,[2577,2585,2607]);f.policy({version:1,groups:[[2577],[2585,2607]],families:[[2577,2585,2607]]});fs.writeFileSync(f.file(2607),'not JSON');assert.deepEqual(f.api().targets(2577),[2577]);assert.throws(()=>f.api().targets(2585),/2607/);
});
