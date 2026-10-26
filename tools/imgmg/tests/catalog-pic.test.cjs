const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=[],byId=new Map();
const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function register(n){nodes.push(n);if(n.id&&!byId.has(n.id))byId.set(n.id,n);return n;}
function descendant(n,root){for(let p=n.parent;p;p=p.parent)if(p===root)return true;return false;}
function node(id='',parent=null){return {
 id,parent,value:'',checked:false,disabled:false,open:false,style:{},dataset:{},
 classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},
 insertAdjacentHTML(position,html){parse(html,this)},
 insertAdjacentElement(position,n){n.parent=this.parent;register(n)},
 before(n){n.parent=this.parent;register(n)},
 after(n){n.parent=this.parent;register(n)},
 querySelector(selector){const m=/^\[id=(".*")\]$/.exec(selector);return m?nodes.find(n=>n.id===JSON.parse(m[1])&&descendant(n,this))||null:null},
 querySelectorAll(){return[]},showModal(){this.open=true},close(){this.open=false},
 getContext(){return {clearRect(){},fillRect(){},drawImage(){}}},getBoundingClientRect(){return {width:100,height:100}}
};}
function parse(html,parent){
 const stack=[parent];
 for(const m of html.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)){
  const tag=m[1].toLowerCase();
  if(m[0][1]==='/'){if(stack.length>1)stack.pop();continue;}
  const id=/\bid="([^"]+)"/.exec(m[0]);
  const n=register(node(id?id[1]:'',stack.at(-1)));
  if(!voidTags.has(tag)&&!m[0].endsWith('/>'))stack.push(n);
 }
}
const body=node();
const appended=[];body.appendChild=n=>{appended.push(n);return n};
// The host has overlapping IDs. Tool lookups must stay in the dialog.
for(const id of ['src','q','sub','frame','message','save'])register(node(id,body));
for(const id of ['catalogPicConnect','catalogPicChoose','catalogPicRescan','catalogPicStatus'])register(node(id,body));
const document={addEventListener(){},body,head:{appendChild(){}},getElementById:id=>byId.get(id)||null,createElement:()=>node(),querySelectorAll(){return[]}};
class Worker {addEventListener(){}postMessage(){}}
const scenario=process.argv[4]||'hang';let pickerCalls=0,enumerations=0,persisted;
const file=name=>({kind:'file',name});
function dir(name,children){return {name,kind:'directory',requestPermission:async()=>scenario==='denied'?'denied':'granted',queryPermission:async()=>scenario==='denied'?'prompt':'granted',async getDirectoryHandle(n){const pair=children.find(x=>x[0]===n&&x[1].kind==='directory');if(pair)return pair[1];throw Object.assign(Error('Not found'),{name:'NotFoundError'})},async *entries(){enumerations++;yield*children}}}
const bg=dir('bg',[['apteka.png',file('apteka.png')],['preview.jpg',file('preview.jpg')]]);
const root=dir(scenario==='bad-folder'?'wrong':'pic',[
 ['bg',bg],['characters',dir('characters',[['iris.png',file('iris.png')]])],['ui overhaul',dir('ui overhaul',[['apteka.png',file('apteka.png')]])],
 ['__JO9_ImageBackups',dir('__JO9_ImageBackups',[['old.png',file('old.png')]])],['root.png',file('root.png')]
]);
const expected=['bg/apteka.png','characters/iris.png','root.png','ui overhaul/apteka.png'];
const legacy={root,index:expected.map(path=>({path,name:path.split('/').pop(),handle:file('unused')}))};
const indexedDB={open(){
 if(scenario==='hang')return{};
 const req={};
 queueMicrotask(()=>{
  if(scenario==='blocked'){req.onblocked?.();return;}
  req.result={close(){},transaction(){const tx={abort(){},objectStore(){return {
   get(){const r={};queueMicrotask(()=>{r.result=(scenario==='cached'||scenario==='denied')?legacy:null;r.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return r},
   put(value){persisted=value;const r={};queueMicrotask(()=>{r.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return r}
  }}};return tx}};req.onsuccess?.();
 });return req;
}};
const sandbox={document,Worker,Blob,URL,TextEncoder,TextDecoder,Uint8Array,Uint8ClampedArray,ArrayBuffer,DataView,Set,Map,Promise,console,location:{protocol:'file:'},navigator:{},crypto:require('node:crypto').webcrypto,setTimeout:(fn,ms,...args)=>setTimeout(fn,ms>=5000?80:ms,...args),clearTimeout,setInterval(){},addEventListener(){},dispatchEvent(){return true;},CustomEvent:class {constructor(type,options={}){this.type=type;this.detail=options.detail;}},indexedDB,showDirectoryPicker(){pickerCalls++;return Promise.resolve(root)}};
sandbox.window=sandbox;sandbox.self=sandbox;
async function waitFor(fn){for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,2))}assert.fail('fixture operation did not complete')}
(async()=>{
 vm.createContext(sandbox);
 sandbox.MR='G:\\somi\\JO9\\game';
 vm.runInContext(fs.readFileSync(require('node:path').join(require('node:path').dirname(process.argv[2]||require('node:path').join(__dirname,'../../local-workspace/catalog-seed/catalog_editor.js')),'catalog_pic.js'),'utf8'),sandbox);
 if(scenario==='cached')await waitFor(()=>sandbox.JO9PIC.state.ready);
 if(scenario==='denied')await waitFor(()=>nodes.find(n=>n.id==='catalogPicConnect').textContent==='저장된 PIC 연결');
 vm.runInContext(fs.readFileSync(process.argv[2]||require('node:path').join(__dirname,'../../local-workspace/catalog-seed/catalog_editor.js'),'utf8'),sandbox);
 assert.equal(typeof sandbox.JO9WS.open,'function');
 await waitFor(()=>!sandbox.JO9WS.state.busy);
 const host=fs.readFileSync(process.argv[3]||require('node:path').join(__dirname,'../../local-workspace/catalog-seed/catalog_merge_vs_original.html'),'utf8');
 const scripts=Array.from(host.matchAll(/<script>([\s\S]*?)<\/script>/g),m=>m[1]);
 for(const script of scripts)new vm.Script(script);
 const loader=scripts.find(s=>s.includes('function loadEditor()'));assert.ok(loader);
 sandbox.el=id=>document.getElementById(id);sandbox.render=()=>{};
 vm.runInContext(loader,sandbox);
 assert.match(appended[0].src,/^catalog_pic\.js\?v=/);
 appended[0].onload();assert.match(appended[1].src,/^catalog_editor\.js\?v=/);
 appended[1].onload();assert.equal(sandbox.EDIT,true,'enable replacement buttons only after shared PIC and tool initialization');
 const click=host.match(/function wsOpen\(i\)\{[\s\S]*?\}\s*(?=var R=)/);
 assert.ok(click,'catalog replacement click handler exists');
 sandbox.R=[['content\\pic\\bg\\apteka.png','r','m',100,80,795,596]];
 sandbox.MR='G:\\somi\\JO9\\game';
 vm.runInContext(click[0]+';wsOpen(0);',sandbox);
 await new Promise(r=>setTimeout(r,5));
 const dialog=document.getElementById('wsdialog');
 assert.equal(dialog.open,true);
 const crop=dialog.querySelector('[id="smallcropdialog"]');
 assert.ok(crop,'dynamic crop dialog belongs to the replacement tool');
 assert.equal(typeof dialog.querySelector('[id="connect"]').onclick,'function');
 assert.equal(typeof crop.querySelector('[id="smallcropclose"]').onclick,'function');
 assert.equal(sandbox.JO9WS.state.inputs.length,0);
 assert.equal(document.getElementById('message').textContent,undefined,'host message remains untouched');
 const operation=document.getElementById('catalogPicConnect').onclick();
 if(scenario!=='cached'&&scenario!=='denied')assert.equal(pickerCalls,1,'picker opens within the click, without awaiting IndexedDB');
 await operation;
 if(scenario==='denied'||scenario==='bad-folder'){
  assert.equal(sandbox.JO9PIC.state.ready,false);assert.equal(sandbox.JO9PIC.state.busy,false);
  assert.equal(sandbox.JO9PIC.state.error,true);assert.match(document.getElementById('catalogPicStatus').textContent,/권한이 거부|pic 폴더/);
 }else{
  await waitFor(()=>sandbox.JO9WS.state.root===root&&!sandbox.JO9WS.state.busy);
  assert.equal(sandbox.JO9PIC.state.ready,true);
  assert.deepEqual(Array.from(sandbox.JO9PIC.state.index,x=>x.path),expected,'whole PIC scan, including unrelated folders, excluding backups/JPG');
  assert.equal(sandbox.JO9WS.state.index,sandbox.JO9PIC.state.index,'replacement tool inherits the same index');
  assert.equal(sandbox.JO9WS.state.root,sandbox.JO9PIC.state.root,'replacement tool inherits the same directory handle');
  assert.equal(document.getElementById('catalogPicConnect').disabled,false);
  assert.match(dialog.querySelector('[id="folderinfo"]').textContent,/PIC 연결 완료/);
  if(scenario==='cached'){assert.equal(pickerCalls,0);assert.equal(enumerations,0,'cached index reused without another scan')}
  if(scenario==='hang'){
   await new Promise(r=>setTimeout(r,90));assert.equal(sandbox.JO9PIC.state.ready,true);assert.match(document.getElementById('catalogPicStatus').textContent,/이번 창에서 기억/);
  }
  if(persisted)assert.ok(persisted.index.every(item=>!('handle' in item)),'cache stores one root handle and lightweight paths');
 }
 dialog.querySelector('[id="wsclose"]').onclick();assert.equal(dialog.open,false);
 console.log(scenario+': 체크리스트 PIC 등록 / 전체 목록 공유 / 창 열기·닫기 확인');
})().catch(e=>{console.error(e);process.exitCode=1});
