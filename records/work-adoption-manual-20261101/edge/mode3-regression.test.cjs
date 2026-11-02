'use strict';
const fs=require('node:fs'),test=require('node:test'),assert=require('node:assert/strict'),R='G:/somi/JO9sa';
const core=require(R+'/tools/text-workshop/core.cjs'),rules=require(R+'/tools/text-workshop/image-cut-condition-rules.cjs');
test('condition save/update and individual/final family removal preserve manual toggle mode3 and legacy registry',()=>{
 const source=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),doc=core.parse(source),loc=doc.locations.find(l=>l.name==='interior_change');
 const old=" $jo9_after = func('interior_change', 'jo9_path', $jo9_visible_top)",fixed=" $jo9_after = func('interior_change', 'jo9_path', $jo9_visible_top, 3)";
 let base=core.shift(doc.lines[loc.body],5);if(base.includes(old)){assert.equal(base.split(old).length-1,1);base=base.replace(old,()=>fixed);}assert.equal(base.split(fixed).length-1,1);
 base=rules.buildBody(base,[]);const registry=s=>s.match(/! JO9 WINDOWS IMAGE SLOT REGISTRY START[\s\S]*?! JO9 WINDOWS IMAGE SLOT REGISTRY END/)[0];
 const one={base:'content/pic/scene/regression.png',path:'content/pic/scene/regression (2).png',morality:null,money:{op:'ge',value:100},rank:null,reputation:null},two={...one,base:'content/pic/characters/regression.png',path:'content/pic/characters/regression (3).png',money:null,rank:0};
 const saved=rules.buildBody(base,[one]),added=rules.buildBody(saved,[one,two]),updated=rules.buildBody(added,[{...one,money:{op:'le',value:200}},two]),removedOne=rules.buildBody(updated,[two]),removedAll=rules.buildBody(removedOne,[]);
 for(const state of[saved,added,updated,removedOne,removedAll]){assert.equal(state.split(fixed).length-1,1);assert.equal(state.includes(old),false);assert.equal(registry(state),registry(base));}
 assert.deepEqual(rules.readRules(removedOne),rules.normalizeRules([two]));assert.equal(removedAll,base);
});
