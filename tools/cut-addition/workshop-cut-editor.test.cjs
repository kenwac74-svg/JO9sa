'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
test('multiple dropped cut images get successive names; dropping a replacement updates the same editor input',async()=>{
 const S={inputs:[],rows:[]},context={S,File,URL,CustomEvent,crypto:crypto.webcrypto,console,setInterval(){},window:{JO9Workshop:{},addEventListener(){},dispatchEvent(){}},document:{addEventListener(){}},C:{hash:async b=>crypto.createHash('sha256').update(Buffer.from(b)).digest('hex')},
 add(){},sourceTargets(){},selectTarget(){},sourceCardHtml(){},targetCardHtml(){},renderScreenResources(){},render(){},inputInfo:()=>({}),relPicPath:p=>p,sourceRows:s=>S.rows.filter(r=>r.inputId===s.id),rebuild:async()=>{S.rows=S.inputs.map(s=>({inputId:s.id,target:s.editCut||s.cutPlan?.next}));},esc:s=>s};
 vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/workshop-cut-editor.js','utf8'),context);
 const stage=vm.runInContext('stageCutFile',context),plan={base:'characters/Sulta.png',next:'characters/Sulta (3).png',before:'hash'};
 await stage(new File(['first'],'one.png'),{plan});await stage(new File(['second'],'two.png'),{plan});
 assert.deepEqual(S.inputs.map(s=>s.cutPlan.next),['characters/Sulta (3).png','characters/Sulta (4).png']);assert.equal(plan.next,'characters/Sulta (3).png');
 const existing=await stage(new File(['old'],'cut.png'),{editCut:'characters/Sulta (2).png'}),id=existing.id;
 const updated=await stage(new File(['replacement'],'new.png'),{editCut:'characters/Sulta (2).png'});
 assert.equal(updated.id,id);assert.equal(S.inputs.length,3);assert.equal(await updated.file.text(),'replacement');
});

function familyContext(requested,items){
 const S={inputs:[{mappedPath:requested}],rows:[]},ScreenContext={resources:[{path:requested}]},SelectedScreenPaths=new Set([requested]);
 const context={S,ScreenContext,SelectedScreenPaths,ScreenDetailPath:requested,console,setInterval(){},window:{JO9Workshop:{},JO9_CUTS:{call:async()=>({families:[{requested,items}]})},addEventListener(){},dispatchEvent(){}},document:{addEventListener(){}},CustomEvent,
 add(){},sourceTargets(){},selectTarget(){},sourceCardHtml(){},targetCardHtml(){},renderScreenResources(){},render(){}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/workshop-cut-editor.js','utf8'),context);
 // These tests exercise refresh identity, without rendering a browser DOM.
 vm.runInContext('renderScreenResources=()=>{}',context);
 return context;
}
for(const number of [2,3])test('opening existing cut '+number+' keeps that file selected and mapped after family refresh',async()=>{
 const base='content/pic/characters/lilly.png',requested=base.replace('.png',' ('+number+').png'),items=[{path:base,cutIndex:1},{path:requested,cutIndex:number}];
 const context=familyContext(requested,items);
 await vm.runInContext('refreshCutFamilies()',context);
 assert.equal(context.S.inputs[0].mappedPath,requested);assert.equal(context.ScreenDetailPath,requested);assert.deepEqual([...context.SelectedScreenPaths],[requested]);
 assert.equal(context.ScreenContext.resources.find(r=>r.path===requested).cutFamily,false);
 assert.ok(context.ScreenContext.resources.some(r=>r.path===base));
});
test('spelling correction preserves the numbered cut suffix',async()=>{
 const requested='content/pic/characters/tsyuansu (2).png',canonical='content/pic/characters/Tsyuansu (2).png';
 const context=familyContext(requested,[{path:'content/pic/characters/Tsyuansu.png',cutIndex:1},{path:canonical,cutIndex:2}]);
 await vm.runInContext('refreshCutFamilies()',context);
 assert.equal(context.S.inputs[0].mappedPath,canonical);assert.deepEqual([...context.SelectedScreenPaths],[canonical]);assert.equal(context.ScreenDetailPath,canonical);
});
