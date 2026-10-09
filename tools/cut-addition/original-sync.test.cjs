'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {register,exposeCatalog}=require('./original-cuts.cjs');
const root=fs.mkdtempSync(path.join(__dirname,'sync-test-')),game=path.join(root,'game'),catalog=path.join(root,'catalog'),original=path.join(root,'original'),runtime=path.join(root,'runtime');
for(const d of [game+'/modtools',game+'/content/pic/bg',catalog,original+'/content/pic/bg',runtime])fs.mkdirSync(d,{recursive:true});
const a='bg/Release.png',b='bg/Physical.png',c='bg/Keep.png',rel=p=>'content\\pic\\'+p.replaceAll('/','\\');
const bytes=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(bytes);bytes.writeUInt32BE(795,16);bytes.writeUInt32BE(596,20);
for(const p of [a,b,c]){fs.writeFileSync(game+'/content/pic/'+p,bytes);fs.writeFileSync(original+'/content/pic/'+p,bytes);}
fs.writeFileSync(game+'/content/pic/bg/Physical (2).png',bytes);
fs.writeFileSync(game+'/content/pic/bg/Release (3).png',bytes);
// An existing original-source junction is shared by all original cuts.
fs.symlinkSync(original+'/content/pic',game+'/content/jo9o_original_cuts','junction');
const entries=Object.fromEntries([a,b,c].map(base=>[base.toLowerCase(),{base,alias:base.replace('.png',' (2).png'),bytes:24,width:795,height:596}]));
fs.writeFileSync(game+'/modtools/image-original-cuts.json',JSON.stringify({version:1,sourceRoot:original,originals:entries,reservations:entries}));
const rows=[a,b,c].flatMap(p=>[[rel(p),'r','etc',24,24,795,596,''],[rel(p.replace('.png',' (2).png')),'a','orig',24,0,795,596,rel(p)]]);
fs.writeFileSync(catalog+'/catalog_merge_vs_original.html','var D='+JSON.stringify(rows)+';\nvar MR="x";');
fs.writeFileSync(catalog+'/catalog_status.js','window.CATALOG_STATUS='+JSON.stringify({items:{[rel(b)]:['spare'],[rel(c)]:['spare']}})+';');
const hashes=Object.fromEntries([a,b,c,'bg/Physical (2).png','bg/Release (3).png'].map(p=>[p,fs.readFileSync(game+'/content/pic/'+p).toString('hex')]));
const result=register(game,catalog,original,runtime,undefined,true);
assert.equal(result.released.length,2);assert.equal(result.pending.length,1);assert.equal(result.registered.length,1);
const manifest=JSON.parse(fs.readFileSync(game+'/modtools/image-original-cuts.json'));
assert.deepEqual(Object.keys(manifest.originals),[c.toLowerCase()]);assert.deepEqual(Object.keys(manifest.reservations),[c.toLowerCase()]);
exposeCatalog(catalog,{load(){},update(){}},result.registered,runtime,result.released);
const updated=require('./original-cuts.cjs').readRows(catalog);
assert.ok(!updated.some(d=>d[0]===rel('bg/Release (2).png')));
assert.equal(updated.find(d=>d[0]===rel('bg/Physical (2).png'))[2],'etc');
for(const [p,data] of Object.entries(hashes))assert.equal(fs.readFileSync(game+'/content/pic/'+p).toString('hex'),data);
assert.equal(register(game,catalog,original,runtime,undefined,true).changed,false);
console.log('PASS: stale reservations released; selected original retained; physical B/C preserved; repeat sync unchanged.');
