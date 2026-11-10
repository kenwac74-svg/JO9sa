'use strict';
// Reproduce the neutral browser fixture exports using the same range/save backend.
const fs=require('node:fs'),assert=require('node:assert/strict');
const base='G:/somi/JO9sa/tools/text-workshop/';
require('./prepare-fixture.cjs');
const core=require(base+'core.cjs'),scenes=require(base+'scenes.cjs'),output=require(base+'range-output.cjs');
const runtime='G:/Codex/tmp/jo9-script-route-20261110/runtime';
const doc=core.parse(fs.readFileSync('G:/Codex/tmp/jo9-script-route-20261110/game/jack.qsp'));
const entries=core.entries(doc),nav=scenes.buildNavigator(doc,entries);
function point(fragment,role='end'){
 const entry=entries.find(e=>e.text.includes(fragment));assert(entry,fragment);
 const ctx=nav.context({...entry,hash:doc.hash},undefined,'text');
 return nav.scriptBoundary({hash:doc.hash,role,point:{location:ctx.flow.usage.location,sceneId:ctx.flow.usage.sceneId,edition:'man',selection:ctx.selection}}).selected;
}
const start=point('여기를 각본의 시작','start'),end=point('여기를 각본의 마무리'),choices={};
for(const fragment of ['선택한 조건 경로 A','선택한 조건 경로 B']){
 const p=point(fragment),e=p.selection;
 choices[p.location.toLowerCase()+':'+p.sceneId+':page:'+p.at]=[e.location.toLowerCase(),e.fieldIndex,e.start,e.end].join(':');
}
const next=point('선택한 후속 장면의 첫 대사'),route=nav.scriptBoundary({hash:doc.hash,role:'end',point:next,fromPoint:end}).routeChoice;assert(route);
for(const [id,last,pages,multi]of [['5ff95723fc5cebf0',end,4,false],['074a8d2d2c7b41b8',point('후속 장면 마무리'),7,true]]){
 const chosen={...choices,...(multi?{[route.id]:route.optionId}:{})};
 const result=nav.scriptRange({hash:doc.hash,start,end:last,choices:chosen,exportId:id});
 assert.equal(result.status,'ready');assert.equal(result.stats.pages,pages);assert.equal(result.stats.scenes,multi?2:1);
 const saved=output.save(runtime,id,result);assert.equal(fs.readFileSync(saved.savedPath,'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n'),result.text);
 console.log(JSON.stringify({pages,scenes:result.stats.scenes,file:saved.savedPath}));
}
