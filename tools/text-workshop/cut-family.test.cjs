'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {create}=require('./image-cuts.cjs'),core=require('./core.cjs');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=','base64');
test('family includes numbered cuts, resolves QSP spelling and preserves separate folders',()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'cut-family-')),game=path.join(dir,'game');
 function put(rel){const p=path.join(game,'content/pic',rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,png);}
 ['characters/Sulta.png','characters/Sulta (2).png','characters/Sulta (4).png','characters/sultan.png','characters/sultan (3).png','scene/Sulta.png','scene/Sulta (2).png'].forEach(put);
 const api=create(game,dir,{},dir),family=api.family('content/pic/characters/sULTA.png');
 assert.equal(family.base,'characters/Sulta.png');assert.equal(family.next,'characters/Sulta (5).png');
 assert.deepEqual(family.items.map(x=>x.cutIndex),[1,2,4]);
 assert.deepEqual(family.items.map(x=>x.file),['Sulta.png','Sulta (2).png','Sulta (4).png']);
 assert.equal(api.family('characters/sultan.png').items.length,2);
 assert.equal(api.family('scene/Sulta.png').items.length,2);
 assert.throws(()=>api.family('../characters/Sulta.png'));
 assert.ok(!fs.existsSync(path.join(game,'jack.qsp')),'Listing does not require or modify QSP');
});

test('a preexisting numbered file with different spelling keeps its actual filename',()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'cut-family-spelling-')),game=path.join(dir,'game'),folder=path.join(game,'content/pic/characters');fs.mkdirSync(folder,{recursive:true});
 for(const n of ['lilly.png','Lilly (2).png','lilly_extra.png','lilly_extra (2).png'])fs.writeFileSync(path.join(folder,n),png);
 const family=create(game,dir,{},dir).family('content/pic/characters/Lilly (2).png');
 assert.equal(family.base,'characters/lilly.png');assert.equal(family.next,'characters/lilly (3).png');
 assert.deepEqual(family.items.map(x=>x.file),['lilly.png','Lilly (2).png']);
 assert.equal(family.requested,'content/pic/characters/Lilly (2).png');
});
test('physical JO9O B is shown with dimensions and remains protected by the replacement writer',()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'cut-family-original-')),game=path.join(dir,'game'),source=path.join(dir,'original');
 for(const root of [path.join(game,'content/pic'),source]){fs.mkdirSync(path.join(root,'characters'),{recursive:true});fs.writeFileSync(path.join(root,'characters/Example.png'),png);}
 fs.mkdirSync(path.join(game,'modtools'),{recursive:true});fs.symlinkSync(source,path.join(game,'content/jo9o_original_cuts'),'junction');
 const entry={base:'characters/Example.png',alias:'characters/Example (2).png',source:'content/pic/characters/Example.png',target:'content/jo9o_original_cuts/characters/Example.png',sourceSha:core.hash(png),bytes:png.length,width:1,height:1};
 fs.writeFileSync(path.join(game,'modtools/image-original-cuts.json'),JSON.stringify({version:1,originals:{'characters/example.png':entry},reservations:{'characters/example.png':{base:entry.base,alias:entry.alias,status:'linked'}}}));
 fs.writeFileSync(path.join(game,'content/pic',entry.alias),png);
 const api=create(game,dir,{},dir),family=api.family(entry.base),pic=require('./pic-local.cjs').create(game,dir,{},api);
 assert.equal(family.next,'characters/Example (3).png');assert.equal(family.items[1].readOnly,true);assert.equal(family.items[1].width,1);
 assert.equal(pic.file(entry.alias).readOnly,true);
 assert.throws(()=>pic.apply([{path:entry.alias}]),/예약/);
 assert.equal(core.hash(fs.readFileSync(path.join(source,'characters/Example.png'))),core.hash(png));
 assert.deepEqual(fs.readFileSync(path.join(game,'content/pic',entry.alias)),png);
});
test('editing an existing B backs up its prior pixels and preserves A and QSP',()=>{
 const dir=fs.mkdtempSync(path.join(__dirname,'cut-edit-')),game=path.join(dir,'game'),folder=path.join(game,'content/pic/characters');fs.mkdirSync(folder,{recursive:true});
 const red=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR4nGP8z8Dwn4GBgYEJRIAwAB8XAgICR7MUAAAAAElFTkSuQmCC','base64'),blue=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR4nGNkYPj/n4GBgYEJRIAwAB0ZAgKxZ5H2AAAAAElFTkSuQmCC','base64');
 fs.writeFileSync(path.join(folder,'Example.png'),red);fs.writeFileSync(path.join(folder,'Example (2).png'),red);fs.writeFileSync(path.join(game,'jack.qsp'),'unchanged game');
 const rel='characters/Example (2).png',rows=[['content\\pic\\'+rel.replaceAll('/','\\'),'a','etc',red.length,0,2,2,'']];fs.writeFileSync(path.join(dir,'catalog_merge_vs_original.html'),'var D = '+JSON.stringify(rows)+';\nvar MR = "test";');
 const pic=require('./pic-local.cjs').create(game,dir,{load(){},update(){},meta(){return{};}});
 const result=pic.apply([{path:rel,before:core.hash(red),data:blue.toString('base64'),cap:1024}]);
 assert.deepEqual(fs.readFileSync(path.join(folder,'Example (2).png')),blue);
 assert.deepEqual(fs.readFileSync(path.join(game,'content/pic/__JO9_ImageBackups',result.id,'original',rel)),red);
 assert.deepEqual(fs.readFileSync(path.join(folder,'Example.png')),red);assert.equal(fs.readFileSync(path.join(game,'jack.qsp'),'utf8'),'unchanged game');
 assert.throws(()=>pic.apply([{path:rel,before:core.hash(red),data:red.toString('base64'),cap:1024}]),/바뀌었습니다/);
});
