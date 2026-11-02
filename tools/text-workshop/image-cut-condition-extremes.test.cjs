'use strict';
const test=require('node:test'),a=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const R='G:/somi/JO9sa/tools/text-workshop',rules=require(R+'/image-cut-condition-rules.cjs'),ui=require(R+'/catalog-cut-conditions.js'),core=require(R+'/core.cjs');
const base='content/pic/scene/example.png';
const rule=morality=>({base,path:'content/pic/scene/example (2).png',morality,money:null,rank:null,reputation:null});
const row=morality=>({path:'content/pic/scene/example (2).png',file:'example (2).png',enabled:true,moralityEnabled:true,moralityMin:String(morality.min),moralityMax:String(morality.max),moneyEnabled:false,rank:'',reputation:''});
test('two extreme choices extend the existing 41 options without a huge range',()=>{
 a.deepEqual(rules.OPTIONS.moralityExtremes,[-9999,9999]);
 a.equal(rules.OPTIONS.moralityMin,-10);a.equal(rules.OPTIONS.moralityMax,10);a.equal(rules.OPTIONS.moralityStep,.5);
 const values=ui.moralityChoices(rules.OPTIONS);a.equal(values.length,43);a.equal(new Set(values).size,43);
 a.equal(values[0],-9999);a.equal(values.at(-1),9999);a.equal(values[1],-10);a.equal(values.at(-2),10);
});
test('extreme and mixed bounds serialize identically in UI and backend',()=>{
 for(const morality of [{min:-9999,max:-4},{min:4,max:9999},{min:-9999,max:9999},{min:-9999,max:-9999},{min:9999,max:9999}]){
  a.deepEqual(rules.normalizeRules([rule(morality)]),[rule(morality)]);
  a.deepEqual(ui.collectRules(base,[row(morality)]),[rule(morality)]);
 }
 for(const morality of [{min:-10000,max:0},{min:0,max:10000},{min:-9998.5,max:0},{min:0,max:11},{min:9999,max:-9999},{min:.25,max:1}]){
  a.throws(()=>rules.normalizeRules([rule(morality)]));a.throws(()=>ui.collectRules(base,[row(morality)]));
 }
});
test('isolated API save and readback compile both extremes without changing the real game',t=>{
 const W='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original=fs.readFileSync(W),doc=core.parse(original),loc=doc.locations.find(l=>l.name==='interior_change');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-cut-extremes-')),game=path.join(root,'game'),pic=path.join(game,'content/pic/scene');
 t.after(()=>{a(root.startsWith(path.resolve(os.tmpdir())+path.sep));a(path.basename(root).startsWith('jo9-cut-extremes-'));fs.rmSync(root,{recursive:true,force:true});});
 fs.mkdirSync(pic,{recursive:true});for(const name of ['Example.png','Example (2).png'])fs.writeFileSync(path.join(pic,name),'owned fixture');
 const raw=Buffer.from(['QSPGAME','','',core.shift('2',-5),core.shift('interior_change',-5),'',doc.lines[loc.body],core.shift('0',-5),core.shift('sentinel',-5),'',core.shift("$manual='preserve'",-5),core.shift('0',-5),''].join('\r\n'),'utf16le');
 const file=path.join(game,'jack.qsp');fs.writeFileSync(file,raw);let commits=0;
 const api=require(R+'/image-cut-conditions.cjs').create(game,(before,after)=>{a(fs.readFileSync(file).equals(before));fs.writeFileSync(file,after);commits++;return{id:'extreme-fixture',after:core.hash(after)};});
 let info=api.info({path:base});a.deepEqual(info.options.moralityExtremes,[-9999,9999]);
 const target=rule({min:-9999,max:9999});api.save({base,before:info.qspHash,rules:[target]});info=api.info({path:base});a.deepEqual(info.rules,[target]);
 const saved=core.parse(fs.readFileSync(file)),body=core.shift(saved.lines[saved.locations.find(l=>l.name==='interior_change').body],5);
 a(body.includes('>= -19998'));a(body.includes('<= 19998'));a.equal(saved.lines[saved.locations.find(l=>l.name==='sentinel').body],core.shift("$manual='preserve'",-5));
 const before=commits;api.save({base,before:info.qspHash,rules:[target]});a.equal(commits,before);
 a(fs.readFileSync(W).equals(original));
});
