'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const catalogSource=fs.readFileSync(path.join(__dirname,'../local-workspace/catalog-seed/catalog_editor.js'),'utf8');
const cutSource=fs.readFileSync(path.join(__dirname,'workshop-cut-editor.js'),'utf8');
const WARG='mob/Warg.png',RIDE='mob/ride_ippolita.png';
const pic=base=>'content/pic/'+base;
function sliceSource(start,end){
 const first=catalogSource.indexOf(start),last=catalogSource.indexOf(end,first);
 assert.ok(first>=0&&last>first,'production source section is available: '+start);
 return catalogSource.slice(first,last);
}
// Run production ordinary input creation and catalog open/close integration too.
// The host below replaces only browser DOM, image decoding/rendering and server I/O.
const ordinaryInputSource=sliceSource('function inputInfo(file,relative){','function selectedTargetOptions()');
const ordinaryAddSource=sliceSource('function sourceKey(name,relative){','async function processPlace(rows)');
const ordinaryRebuildSource=sliceSource('async function rebuild(){','function sourceKey(name,relative){');
const selectionSource=sliceSource("$('screenGroups').addEventListener('change',","$('screenDetail').addEventListener('click',");
const openSource=sliceSource("$('wsclose').onclick=",'// 폴더 선택');
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return{promise,resolve};}
function plan(base){return{base,next:base.replace(/\.png$/,' (2).png'),before:'original-'+base,width:600,height:400,originalCut:false};}
function fileReply(base,readOnly=false){return{data:Buffer.from('fixture-cut-bytes').toString('base64'),name:base.split('/').pop(),lastModified:1700000000000,readOnly};}
function delayedFile(name){
 const started=deferred(),release=deferred(),file=new File(['fixture-'+name],name,{type:'image/png'});
 const read=file.arrayBuffer.bind(file);
 file.arrayBuffer=async()=>{started.resolve();await release.promise;return read();};
 return{file,started:started.promise,resume:release.resolve};
}
function resource(base){return{path:pic(base),file:base.split('/').pop(),folder:'mob',width:600,height:400};}
function element(){
 const listeners=new Map();
 return{open:false,hidden:false,innerHTML:'',textContent:'',scrollTop:0,dataset:{},
  addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);},
  emit(name,event={}){return Promise.all((listeners.get(name)||[]).map(fn=>fn(event)));},
  showModal(){this.open=true;},close(){this.open=false;this.emit('close');},
  before(){},appendChild(){},scrollIntoView(){},querySelectorAll(){return[];},querySelector(){return null;},
 };
}
function harness(){
 const nodes=new Map(),documentListeners=new Map(),requests=[];
 const $=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
 const S={inputs:[],rows:[],root:{},busy:false};
 const ScreenContext={resources:[],status:'ok',hiddenFolders:[],hiddenFilePatterns:[]};
 const SelectedScreenPaths=new Set();
 const window={JO9Workshop:{},JO9PIC:{state:{busy:false}},addEventListener(){},dispatchEvent(){}};
 let info=async base=>plan(base),readFile=async base=>fileReply(base),readFamilies=async()=>({families:[]});
 window.JO9_CUTS={call:async(command,args)=>{
  requests.push({command,args});
  if(command==='info')return info(args.base);
  if(command==='families')return readFamilies(args.paths);
  if(command==='file')return readFile(args.path);
  throw Error('test forbids real file/save API: '+command);
 }};
 const context={S,ScreenContext,SelectedScreenPaths,ScreenDetailPath:'',window,$,
  File,Blob,URL,CustomEvent,atob,crypto:crypto.webcrypto,console,setInterval(){},
  document:{addEventListener(name,fn){if(!documentListeners.has(name))documentListeners.set(name,[]);documentListeners.get(name).push(fn);},createElement:element},
  C:{hash:async data=>crypto.createHash('sha256').update(Buffer.from(data)).digest('hex'),norm:value=>String(value).replaceAll('\\','/').toLowerCase(),baseName:name=>name.replace(/\.[^.]+$/,''),pngInfo:()=>({width:600,height:400}),kind:()=> 'npc'},
  relPicPath:value=>String(value).replaceAll('\\','/').replace(/^.*?content\/pic\//i,''),
  sourceTargets:s=>s.mappedPath?[{path:s.mappedPath.replace(/^content\/pic\//,'')}]:[],
  sourceRows:s=>S.rows.filter(row=>row.inputId===s.id),
  resourceByPath:p=>ScreenContext.resources.find(r=>r.path===p),
  add(){},async selectTarget(row,p){row.target=p;row.options={};},sourceCardHtml(){},targetCardHtml(){},renderScreenResources(){},render(){},
  busy:value=>{S.busy=value;},msg(){},esc:value=>value,nextFaceInput:async()=>{},
  revoke:row=>{row.url=null;row.output=null;row.mode='';},defaults:()=>({fit:'contain',frame:false}),outputCap:()=>1000000,isFaceTarget:()=>false,
 };
 vm.createContext(context);
 vm.runInContext(ordinaryInputSource+'\n'+ordinaryRebuildSource+'\n'+ordinaryAddSource,context,{filename:'catalog-ordinary-input.js'});
 vm.runInContext(cutSource,context,{filename:'workshop-cut-editor.js'});
 vm.runInContext(selectionSource,context,{filename:'catalog-workshop-selection.js'});
 vm.runInContext(openSource,context,{filename:'catalog-workshop-open.js'});
 const emitClick=selector=>{
  const button={dataset:{},closest:value=>value===selector?button:null};
  const event={target:button,preventDefault(){},stopPropagation(){}};
  for(const listener of documentListeners.get('click')||[])listener(event);
 };
 return{S,context,requests,window,$,
  setInfo:fn=>{info=fn;},setFile:fn=>{readFile=fn;},setFamilies:fn=>{readFamilies=fn;},
  open:base=>window.JO9WS.open([resource(base)]),
  begin:base=>window.JO9Workshop.beginCut(pic(base)),edit:base=>window.JO9Workshop.editCut(pic(base)),
  uncheck:base=>$('screenGroups').emit('change',{target:{dataset:{action:'screen-select',path:pic(base)},checked:false}}),
  unselect:base=>{const button={dataset:{path:pic(base)}};return $('screenSelectedList').emit('click',{target:{closest:selector=>selector==='[data-action="screen-unselect"]'?button:null}});},
  drop:(name='input.png')=>window.JO9Workshop.add([new File(['fixture-'+name],name,{type:'image/png'})]),
  cancelMode:()=>emitClick('[data-cut-cancel]'),
  closeButton:()=>$('wsclose').onclick(),
  cancelDialog:()=>{let prevented=false;$('wsdialog').emit('cancel',{preventDefault(){prevented=true;}});if(!prevented)$('wsdialog').close();},
 };
}
function assertOrdinary(input){
 assert.ok(input,'the dropped image is staged');
 assert.ok(!input.cutPlan,'ordinary input must not inherit a prior cut plan');
 assert.ok(!input.editCut,'ordinary input must not inherit an existing-cut replacement');
 assert.equal(input.mappedPath,'','ordinary input keeps the existing manual target-selection behavior');
}
function assertRideCut(input){
 assert.ok(input?.cutPlan,'explicit cut input has a save plan');
 assert.equal(input.cutPlan.base,'mob/ride_ippolita.png');
 assert.equal(input.cutPlan.next,'mob/ride_ippolita (2).png');
 assert.equal(input.mappedPath,'content/pic/mob/ride_ippolita.png');
}
function assertRideContext(h){
 assert.deepEqual([...h.context.SelectedScreenPaths],['content/pic/mob/ride_ippolita.png']);
 assert.equal(h.context.ScreenDetailPath,'content/pic/mob/ride_ippolita.png');
 assert.deepEqual([...h.context.ScreenContext.resources].filter(r=>!r.cutFamily).map(r=>r.path),['content/pic/mob/ride_ippolita.png']);
}

test('ordinary checklist open clears previous Warg cut mode; later explicit cut uses clicked Ride base',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);
 h.open(RIDE);await h.drop('ordinary.png');
 assertOrdinary(h.S.inputs[0]);
 await h.begin(RIDE);await h.drop('ride-cut.png');
 assertRideCut(h.S.inputs.at(-1));assertRideContext(h);
});

test('public cut reset retains already staged cut metadata while future drops become ordinary',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);await h.drop('staged-warg.png');
 const staged=h.S.inputs[0],before={...staged.cutPlan};
 assert.equal(typeof h.window.JO9Workshop.resetCutMode,'function','workshop exposes the ordinary-mode reset used by the catalog');
 h.window.JO9Workshop.resetCutMode();await h.drop('ordinary-after-reset.png');
 assert.equal(h.S.inputs[0],staged);assert.deepEqual({...staged.cutPlan},before);
 assert.equal(staged.mappedPath,'content/pic/mob/Warg.png');assertOrdinary(h.S.inputs[1]);
});

test('cut cancel retains already staged cut save target while future drops become ordinary',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);await h.drop('staged-warg.png');
 const staged=h.S.inputs[0],before={...staged.cutPlan};
 h.cancelMode();await h.drop('ordinary-after-cancel.png');
 assert.equal(h.S.inputs[0],staged);assert.deepEqual({...staged.cutPlan},before);
 assert.equal(staged.mappedPath,'content/pic/mob/Warg.png');assertOrdinary(h.S.inputs[1]);
});

test('ordinary checklist open prevents a late Warg info reply from restoring the previous cut target',async()=>{
 const h=harness(),pending=deferred();h.open(WARG);h.setInfo(()=>pending.promise);
 const beginning=h.begin(WARG);h.open(RIDE);pending.resolve(plan(WARG));await beginning;
 await h.drop('ordinary-after-late-info.png');
 assertOrdinary(h.S.inputs[0]);assertRideContext(h);
});

test('cut cancel prevents a late Ride info reply from reenabling cut mode',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);
 const pending=deferred();h.setInfo(()=>pending.promise);
 const beginning=h.begin(RIDE);h.cancelMode();pending.resolve(plan(RIDE));await beginning;
 await h.drop('ordinary-after-cancelled-info.png');assertOrdinary(h.S.inputs[0]);
});

test('racing explicit cut requests keep the latest clicked base when replies arrive in reverse order',async()=>{
 const h=harness(),warg=deferred(),ride=deferred();h.open(WARG);
 h.setInfo(base=>base===WARG?warg.promise:ride.promise);
 const first=h.begin(WARG),latest=h.begin(RIDE);
 ride.resolve(plan(RIDE));await latest;warg.resolve(plan(WARG));await first;
 await h.drop('latest-ride.png');assertRideCut(h.S.inputs[0]);assertRideContext(h);
});

test('explicit Ride cut switches current screen and selection from an already open Warg workshop',async()=>{
 const h=harness();h.open(WARG);assert.equal(h.$('wsdialog').open,true);
 await h.begin(RIDE);await h.drop('clicked-ride.png');
 assertRideCut(h.S.inputs[0]);assertRideContext(h);
});

for(const close of ['closeButton','cancelDialog'])test(close+' cancels pending cut preparation before ordinary reopen',async()=>{
 const h=harness(),pending=deferred();h.open(WARG);h.setInfo(()=>pending.promise);
 const beginning=h.begin(WARG);h[close]();
 pending.resolve(plan(WARG));await beginning;
 assert.equal(h.$('wsdialog').open,false,'late cut preparation must not reopen a closed workshop');
 h.open(RIDE);await h.drop('ordinary-after-close.png');
 assertOrdinary(h.S.inputs[0]);assertRideContext(h);
});


test('editable existing cut stages its exact target and reset preserves that staged edit',async()=>{
 const h=harness();h.open('mob/Warg (2).png');await h.edit('mob/Warg (2).png');
 assert.equal(h.S.inputs.length,1);
 const staged=h.S.inputs[0];
 assert.equal(staged.editCut,'mob/Warg (2).png');assert.equal(staged.cutPlan,null);
 assert.equal(staged.mappedPath,'content/pic/mob/Warg (2).png');
 assert.equal(await staged.file.text(),'fixture-cut-bytes');
 h.window.JO9Workshop.resetCutMode();await h.drop('ordinary-after-existing-edit.png');
 assert.equal(h.S.inputs[0],staged);assert.equal(staged.editCut,'mob/Warg (2).png');
 assertOrdinary(h.S.inputs[1]);
});

test('readonly existing cut stages a writable new cut while preserving the clicked family base',async()=>{
 const h=harness();h.open('mob/Warg (2).png');
 h.context.ScreenContext.resources[0].base=WARG;
 h.setFile(base=>fileReply(base,true));
 h.setInfo(async()=>({...plan(WARG),next:'mob/Warg (3).png',originalCut:true}));
 await h.edit('mob/Warg (2).png');
 assert.equal(h.S.inputs.length,1);
 const staged=h.S.inputs[0];
 assert.equal(staged.editCut,null);assert.equal(staged.cutPlan.base,'mob/Warg.png');
 assert.equal(staged.cutPlan.next,'mob/Warg (3).png');
 assert.equal(await staged.file.text(),'fixture-cut-bytes');
});

test('a delayed editable-cut read cannot stage the previous cut after ordinary checklist open',async()=>{
 const h=harness(),pending=deferred();h.open(WARG);h.setFile(()=>pending.promise);
 const editing=h.edit('mob/Warg (2).png');
 h.open(RIDE);pending.resolve(fileReply('mob/Warg (2).png'));await editing;
 assert.equal(h.S.inputs.length,0,'ordinary checklist open invalidates the in-flight existing-cut read');
 await h.drop('ordinary-after-old-cut-read.png');assertOrdinary(h.S.inputs[0]);assertRideContext(h);
});

test('canceling readonly-cut preparation prevents its delayed nested info from staging old bytes',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);
 const pending=deferred(),requested=deferred();
 h.context.ScreenContext.resources.push({...resource('mob/Warg (2).png'),base:WARG,readOnly:true});
 h.setFile(base=>fileReply(base,true));
 h.setInfo(()=>{requested.resolve();return pending.promise;});
 const editing=h.edit('mob/Warg (2).png');await requested.promise;
 h.cancelMode();pending.resolve(plan(WARG));await editing;
 assert.equal(h.S.inputs.length,0,'canceled readonly preparation must not stage into any later draft');
 await h.drop('ordinary-after-readonly-cancel.png');assertOrdinary(h.S.inputs[0]);
 h.setInfo(async base=>plan(base));await h.begin(RIDE);await h.drop('explicit-ride-after-readonly-cancel.png');
 assertRideCut(h.S.inputs.at(-1));assertRideContext(h);
});

test('ordinary checklist open during a suspended drop preserves the active inputs and session',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);await h.drop('existing-staged.png');
 const staged=h.S.inputs[0],pending=delayedFile('suspended.png');
 const dropping=h.window.JO9Workshop.add([pending.file]);await pending.started;
 assert.equal(h.S.busy,true);h.open(RIDE);
 assert.equal(h.S.inputs[0],staged,'busy open cannot erase already staged work');
 assert.equal(h.context.ScreenDetailPath,'content/pic/mob/Warg.png');
 assert.deepEqual([...h.context.SelectedScreenPaths],['content/pic/mob/Warg.png']);
 pending.resume();await dropping;
 assert.equal(h.S.inputs.length,2);assert.equal(h.S.inputs[1].cutPlan.next,'mob/Warg (3).png');
 await h.drop('after-busy.png');
 assert.equal(h.S.inputs[2].cutPlan.next,'mob/Warg (4).png','ignored busy open must also preserve future-drop mode');
});

test('a multi-image drop retains its captured cut target across awaits while reset affects later drops',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);
 const first=delayedFile('first-batch.png'),second=new File(['second'],'second-batch.png',{type:'image/png'});
 const dropping=h.window.JO9Workshop.add([first.file,second]);await first.started;
 h.window.JO9Workshop.resetCutMode();first.resume();await dropping;
 assert.deepEqual([...h.S.inputs].map(s=>s.cutPlan?.next),['mob/Warg (2).png','mob/Warg (3).png']);
 assert.deepEqual([...h.S.inputs].map(s=>s.cutPlan?.base),['mob/Warg.png','mob/Warg.png']);
 await h.drop('ordinary-after-batch.png');assertOrdinary(h.S.inputs[2]);
});

for(const mode of ['new cut','existing cut'])for(const unselect of ['uncheck','unselect'])test(unselect+' preserves staged '+mode+' and converted output while ordinary mapped inputs unmap',async()=>{
 const h=harness(),base=mode==='new cut'?WARG:'mob/Warg (2).png';h.open(base);
 const enter=()=>mode==='new cut'?h.begin(WARG):h.edit(base);
 await enter();if(mode==='new cut')await h.drop('staged-cut.png');
 const staged=h.S.inputs[0];h.window.JO9Workshop.resetCutMode();await h.drop('ordinary-mapped.png');
 const ordinary=h.S.inputs[1];ordinary.mappedPath=pic(base);await h.window.JO9Workshop.rebuild();
 await enter();
 const row=h.S.rows.find(r=>r.inputId===staged.id),output=Uint8Array.from([137,80,78,71]);
 assert.ok(row,'the cut is materialized as a saveable result row');row.output=output;
 await h[unselect](base);
 assert.equal(staged.mappedPath,pic(base),'unselecting screen context cannot discard a staged cut target');
 assert.equal(ordinary.mappedPath,'','ordinary mapped work still follows explicit unselection');
 assert.equal(h.S.rows.find(r=>r.inputId===staged.id),row,'rebuild retains the staged result row');
 assert.equal(row.output,output,'previously converted cut output remains ready to save');
 assert.ok(!h.S.rows.some(r=>r.inputId===ordinary.id));
 await h.drop('ordinary-after-unselect.png');assertOrdinary(h.S.inputs.at(-1));
});


test('dropping during explicit Ride target lookup accepts no image until the correct plan is ready',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);
 const pending=deferred();h.setInfo(()=>pending.promise);const preparing=h.begin(RIDE);
 await h.drop('too-early.png');
 assert.equal(h.S.inputs.length,0,'a new cut lookup cannot accept images using the previous Warg plan');
 pending.resolve(plan(RIDE));await preparing;await h.drop('ready-ride.png');
 assertRideCut(h.S.inputs[0]);assertRideContext(h);
});

test('failed explicit Ride lookup leaves future drops ordinary instead of restoring Warg cut mode',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);
 h.setInfo(async()=>{throw Error('controlled lookup failure');});await h.begin(RIDE);
 await h.drop('ordinary-after-failed-lookup.png');assertOrdinary(h.S.inputs[0]);
});

for(const operation of ['info','file'])test('a late cut '+operation+' reply cannot alter an operation that became busy',async()=>{
 const h=harness(),pending=deferred();h.open(RIDE);
 if(operation==='info')h.setInfo(()=>pending.promise);else h.setFile(()=>pending.promise);
 const preparing=operation==='info'?h.begin(WARG):h.edit('mob/Warg (2).png');
 h.S.busy=true;
 pending.resolve(operation==='info'?plan(WARG):fileReply('mob/Warg (2).png'));await preparing;
 assert.equal(h.S.inputs.length,0,'late preparation must not stage during a different busy operation');
 assert.equal(h.S.busy,true,'late preparation cannot release another operation busy state');assertRideContext(h);
 h.S.busy=false;await h.drop('ordinary-after-busy-'+operation+'.png');assertOrdinary(h.S.inputs[0]);
});

test('a late readonly-family preview read cannot replace a newly opened ordinary screen context',async()=>{
 const h=harness();h.open(WARG);await h.begin(WARG);
 const pending=deferred(),reading=deferred();
 h.setFamilies(async()=>({families:[{requested:pic(WARG),items:[{path:pic(WARG),cutIndex:1},{path:'content/pic/mob/Warg (2).png',cutIndex:2,readOnly:true}]}]}));
 h.setFile(()=>{reading.resolve();return pending.promise;});
 const refreshing=h.window.JO9Workshop.refreshCuts();await reading.promise;
 h.open(RIDE);pending.resolve(fileReply('mob/Warg (2).png',true));await refreshing;
 assertRideContext(h);await h.drop('ordinary-after-late-family.png');assertOrdinary(h.S.inputs[0]);
});
