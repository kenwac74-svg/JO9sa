'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const {eligible,collectRules,escape}=require('./catalog-cut-conditions.js');
const base='content/pic/scene/example.png';
const row=extra=>({path:'content/pic/scene/example (2).png',file:'example (2).png',enabled:true,moralityEnabled:false,moneyEnabled:false,rank:'',reputation:'',...extra});
test('only requested folders support every existing image format and nested paths',()=>{
 for(const format of ['png','jpg','jpeg','gif','webp','bmp'])for(const folder of ['bg','characters','scene'])a.equal(eligible('content\\pic\\'+folder+'\\nested\\a.'+format),true);
 for(const name of ['mob/a.png','reserve/bg/a.png','ui/a.png','characters/a.txt'])a.equal(eligible(name),false);
 a.equal(escape('a<"&\''),'a&lt;&quot;&amp;&#39;');
});
test('disabled and entirely unspecified rows do not produce rules',()=>{
 a.deepEqual(collectRules(base,[row({enabled:false,moralityEnabled:true,moralityMin:-10,moralityMax:10}),row({})]),[]);
});
test('zero rank/reputation and all four condition kinds survive serialization',()=>{
 a.deepEqual(collectRules(base,[row({moralityEnabled:true,moralityMin:'-2.5',moralityMax:'0',moneyEnabled:true,moneyValue:'0',moneyOp:'le',rank:'0',reputation:'5'})]),[{base,path:'content/pic/scene/example (2).png',morality:{min:-2.5,max:0},money:{op:'le',value:0},rank:0,reputation:5}]);
});
test('invalid ranges and money are rejected without sending partially built rules',()=>{
 for(const [min,max]of [[2,1],[-10.5,2],[0,10.5],[0.25,1]])a.throws(()=>collectRules(base,[row({moralityEnabled:true,moralityMin:min,moralityMax:max})]),/범위/);
 for(const n of ['', '-1','1.5','1e3','2147483648','9007199254740992'])a.throws(()=>collectRules(base,[row({moneyEnabled:true,moneyValue:n,moneyOp:'ge'})]),/정수/);
 a.throws(()=>collectRules(base,[row({rank:'6'})]),/계급/);
});
