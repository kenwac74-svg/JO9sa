'use strict';
// User-approved use of the existing editor filter and encoder; no new image generation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const repo='G:/somi/JO9sa',record=repo+'/records/edward-sepia-fix-20261021',tmp='G:/Codex/tmp/edward-sepia-fix-20261021';
const work='G:/somi/Jack O Nine Tails v2.4_work/game',full='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const rel='master/master_edward_sepia.png',target=work+'/content/pic/'+rel,source=work+'/content/pic/master/master_edward.png';
const originalHash='73323a81cf6d46e4b5b4ff470425dafcd28e47ed2377018c7b38aa14ba20cf78';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function protectedState(){return Object.fromEntries([source,work+'/jack.qsp',full+'/jack.qsp',full+'/content/pic/'+rel].map(p=>[p,hash(fs.readFileSync(p))]));}
function assertProtected(pin){for(const [p,h]of Object.entries(pin))assert.equal(hash(fs.readFileSync(p)),h,p);}
async function render(){
 assert.equal(hash(fs.readFileSync(target)),originalHash);assert.equal(hash(fs.readFileSync(source)),originalHash);
 assert(!fs.existsSync(tmp));assert(!fs.existsSync(record));fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(record,{recursive:true});
 fs.copyFileSync(__filename,record+'/fix.cjs');
 const editorPath='G:/somi/IMGMG/catalog_editor.js',editor=fs.readFileSync(editorPath,'utf8').replace(/^\uFEFF/,'');
 const start=editor.indexOf('window.JO9Core=(()=>{');assert(start>=0);const end=editor.indexOf('\n})();',start);assert(end>start);
 const coreSource=editor.slice(start,end+'\n})();'.length),match=editor.match(/^const WORKER_SOURCE=(.*);\r?$/m);assert(match);
 const workerSource=JSON.parse(match[1]);assert(coreSource.includes('sepia(${options.sepia?0.8:0})'));
 const pin=protectedState();const context=await chromium.launchPersistentContext(tmp+'/browser-profile',{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-first-run','--no-default-browser-check','--disable-background-networking']});
 try{
  const page=await context.newPage();await page.goto('about:blank');await page.evaluate(coreSource);
  const result=await page.evaluate(async({encoded,workerSource})=>{
   const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),file=new Blob([bytes],{type:'image/png'});
   const meta={width:150,height:150,path:'master/master_edward_sepia.png',bytes:bytes.buffer};
   const options={fit:'cover',frame:false,gray:false,sepia:true,zoom:1,x:0,y:0,brightness:1};
   const unfiltered=await JO9Core.raster(file,meta,{...options,sepia:false}),filtered=await JO9Core.raster(file,meta,options);
   const a=new Uint8Array(unfiltered.rgba),b=new Uint8Array(filtered.rgba);let changed=0,maxOpaqueError=0,alphaDifferences=0;
   for(let i=0;i<a.length;i+=4){
    if(a[i+3]!==b[i+3])alphaDifferences++;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++;
    if(a[i+3]===255){const expected=[.5144*a[i]+.6152*a[i+1]+.1512*a[i+2],.2792*a[i]+.7488*a[i+1]+.1344*a[i+2],.2176*a[i]+.4272*a[i+1]+.3048*a[i+2]];for(let j=0;j<3;j++)maxOpaqueError=Math.max(maxOpaqueError,Math.abs(b[i+j]-Math.min(255,Math.max(0,Math.round(expected[j])))));}
   }
   const encoder=new Worker(URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'})));
   let output;try{output=await new Promise((resolve,reject)=>{encoder.onmessage=e=>e.data.error?reject(Error(e.data.error)):resolve(e.data);encoder.onerror=e=>reject(Error(e.message));encoder.postMessage({id:1,rgba:filtered.rgba,mask:filtered.mask,width:150,height:150,cap:160*1024,adaptive:true});});}finally{encoder.terminate();}
   const png=new Uint8Array(output.bytes);let str='';for(let i=0;i<png.length;i+=32768)str+=String.fromCharCode(...png.subarray(i,i+32768));
   const decoded=await JO9Core.raster(new Blob([png],{type:'image/png'}),meta,{...options,sepia:false});
   const saved=new Uint8Array(decoded.rgba);let encodedPixelDifferences=0;for(let i=0;i<b.length;i++)if(b[i]!==saved[i])encodedPixelDifferences++;
   return{base64:btoa(str),width:150,height:150,filter:'grayscale(0) sepia(0.8) brightness(1)',changedPixels:changed,alphaDifferences,maxOpaqueError,encodedPixelDifferences,encoderMode:output.mode,options};
  },{encoded:fs.readFileSync(source).toString('base64'),workerSource});
  assert.equal(result.width,150);assert.equal(result.height,150);assert.equal(result.alphaDifferences,0);assert(result.changedPixels>20000);assert(result.maxOpaqueError<=2);assert.equal(result.encodedPixelDifferences,0);
  const output=Buffer.from(result.base64,'base64');assert(output.length<=160*1024);assert.notEqual(hash(output),originalHash);
  fs.writeFileSync(tmp+'/master_edward_sepia.png',output,{flag:'wx'});delete result.base64;
  assertProtected(pin);assert.equal(hash(fs.readFileSync(target)),originalHash);
  const report={status:'RENDERED_NOT_APPLIED',userApprovedExistingFilter:true,source:source,target,originalSHA256:originalHash,afterSHA256:hash(output),bytes:output.length,editorPath,editorSHA256:hash(fs.readFileSync(editorPath)),coreSourceSHA256:hash(Buffer.from(coreSource)),workerSourceSHA256:hash(Buffer.from(workerSource)),protected:pin,...result};
  write(record+'/RENDER_RESULT.json',report);console.log(JSON.stringify({...report,protected:undefined}));
 }finally{await context.close();}
}
async function apply(){
 const report=read(record+'/RENDER_RESULT.json');assertProtected(report.protected);assert.equal(hash(fs.readFileSync(target)),report.originalSHA256);
 const candidate=fs.readFileSync(tmp+'/master_edward_sepia.png');assert.equal(hash(candidate),report.afterSHA256);
 const state=read(work+'/modtools/text-workshop/runtime/server.json');assert.equal(path.normalize(state.target),path.normalize(work+'/jack.qsp'));
 const config=fs.readFileSync('G:/somi/IMGMG/catalog_workshop_config.js','utf8').replace(/^\uFEFF/,'').match(/window\.JO9_CATALOG_BRIDGE=(\{.*\});/);assert(config);
 const bridge=JSON.parse(config[1]);assert.equal(bridge.url,state.url);assert(/^http:\/\/127\.0\.0\.1:\d+\/$/.test(bridge.url));
 const response=await fetch(bridge.url+'api/catalog/pic/apply',{method:'POST',headers:{'X-JO9-Token':bridge.token,'Origin':bridge.url.replace(/\/$/,''),'Content-Type':'application/json'},body:JSON.stringify({jobs:[{path:rel,before:report.originalSHA256,data:candidate.toString('base64'),cap:160*1024}]})});
 const result=await response.json();assert(response.ok,result.error||'Local PIC apply failed');assert.equal(result.status,'applied');assert.equal(result.files.length,1);assert.equal(result.files[0].path,rel);assert(!result.patchWarning);assert(!result.catalogWarning);
 assert.equal(hash(fs.readFileSync(target)),report.afterSHA256);assertProtected(report.protected);
 const backup=work+'/content/pic/__JO9_ImageBackups/'+result.id+'/original/'+rel;assert.equal(hash(fs.readFileSync(backup)),report.originalSHA256);
 const final={...report,status:'WORK_FIXED',existingEditorRecord:result,backup,FullUpdated:false,patchZIPUpdated:false,QSPUnchanged:true,normalPortraitUnchanged:true,catalogUpdated:true,personalPatchRecorded:true,commit:false,push:false};
 write(record+'/FINAL_RESULT.json',final);
 const note='\n\n## 주인공 에드워드 세피아 이미지 수정 (EDWARD_SEPIA_FIX_20261021)\n\n- 기존 2.4 기준부터 master_edward.png와 master_edward_sepia.png가 동일한 컬러 파일이었던 것을 확인.\n- 사용자 승인에 따라 기존 이미지 편집기의 sepia(0.8) 필터와 PNG 인코더를 그대로 사용해 WORK의 master/master_edward_sepia.png 1개만 수정. 150×150·얼굴/테두리 위치·알파 보존, 기존 컬러 초상화와 QSP 불변.\n- 기존 로컬 PIC 저장 API로 원본 백업·이미지 체크리스트·개인 이미지 패치 이력 기록 완료. Full 및 배포 ZIP 미반영이며 다음 이미지팩 갱신 대상.\n- [결과](../records/edward-sepia-fix-20261021/FINAL_RESULT.json). 커밋·푸시 보류 유지.\n';
 for(const p of [repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',repo+'/docs/SESSION_HANDOFF_INDEX.md']){const raw=fs.readFileSync(p),text=raw.toString('utf8');assert(!text.includes('EDWARD_SEPIA_FIX_20261021'));fs.writeFileSync(p,text.trimEnd()+note);}
 const st=fs.lstatSync(tmp);assert(!st.isSymbolicLink());assert.equal(fs.realpathSync(tmp).toLowerCase(),path.resolve(tmp).toLowerCase());
 let files=0,bytes=0;function check(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name),s=fs.lstatSync(p);assert(!s.isSymbolicLink());assert(fs.realpathSync(p).toLowerCase().startsWith(fs.realpathSync(tmp).toLowerCase()+path.sep));if(e.isDirectory())check(p);else{files++;bytes+=s.size;}}}check(tmp);
 fs.rmSync(tmp,{recursive:true});assert(!fs.existsSync(tmp));write(record+'/cleanup.json',{removed:tmp,files,bytes,scopeVerified:true,originalBackupRetained:true});
 console.log(JSON.stringify({status:final.status,changedRuntime:rel,sha256:report.afterSHA256,bytes:report.bytes,width:150,height:150,catalogUpdated:true,personalPatchRecorded:true,FullUpdated:false,patchZIPUpdated:false,QSPUnchanged:true,temporaryBytesFreed:bytes}));
}
assert(['render','apply'].includes(process.argv[2]));(process.argv[2]==='render'?render():apply()).catch(e=>{console.error(e.stack);process.exitCode=1;});
