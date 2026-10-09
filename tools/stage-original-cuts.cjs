'use strict';
const fs=require('node:fs'),path=require('node:path');
const project='C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa',stage=path.join(__dirname,'cut-addition');
const source=path.join(project,'tools/text-workshop');
const replace=(s,old,next)=>{if(s.split(old).length-1!==1)throw Error('Stage anchor missing/repeated: '+old.slice(0,90));return s.replace(old,next);};
let server=fs.readFileSync(path.join(source,'server.cjs'),'utf8').replace(/\r\n/g,'\n');
server=replace(server,"const localPic=require('./pic-local.cjs').create(game,catalogRoot,catalog);\nconst imageCuts=require('./image-cuts.cjs').create(game,catalogRoot,catalog,runtime);",`const imageCuts=require('./image-cuts.cjs').create(game,catalogRoot,catalog,runtime);
const originalCutRegistrar=require('./original-cuts.cjs');
const localPic=require('./pic-local.cjs').create(game,catalogRoot,catalog,imageCuts);
function syncSavedOriginals(paths){
  const registration=originalCutRegistrar.register(game,catalogRoot,originalRoot,runtime,paths);
  if(registration.changed){try{imageCuts.refresh('original_B_'+Date.now());}catch(error){originalCutRegistrar.rollback(registration);throw error;}}
  let warning,added=[];try{added=originalCutRegistrar.exposeCatalog(catalogRoot,catalog,registration.registered,runtime);}catch(error){warning=error.message;}
  if(registration.changed||added.length){localPic.scan(true);cache=null;preview=null;}
  return {linked:registration.registered.length,pending:registration.pending.length,warning,originalCuts:Object.fromEntries(registration.registered.map(e=>[e.base.toLowerCase(),e])),originalReservations:imageCuts.reservations()};
}`);
server=replace(server,"const cfg=JSON.stringify({url:'http://'+host+'/',token});","const cfg=JSON.stringify({url:'http://'+host+'/',token,originalCuts:imageCuts.originals(),originalReservations:imageCuts.reservations()}).replaceAll('<','\\\\u003c');");
server=replace(server,"  const full=path.resolve(root,...p.split('/'));if(!full.startsWith(root+path.sep)","  if(!original){const alias=imageCuts.resolveAlias(p);if(alias)return alias;}\n  const full=path.resolve(root,...p.split('/'));if(!full.startsWith(root+path.sep)");
server=replace(server,"      const input=await body(req,85000000),result=action==='info'?imageCuts.info(input.base):imageCuts.add(input);","      const input=await body(req,85000000);if(action==='info')syncSavedOriginals([String(input.base||'').replace(/ \\((?:[2-9]|[1-9][0-9]+)\\)(\\.png)$/i,'$1')]);const result=action==='info'?imageCuts.info(input.base):imageCuts.add(input);");
server=replace(server,"    if(req.method==='POST'&&url.pathname==='/api/catalog/status'){const input=await body(req,12000000);json(res,200,catalog.update(input.actions));return;}",`    if(req.method==='POST'&&url.pathname==='/api/catalog/status'){
      const input=await body(req,12000000);catalog.update(input.actions);let originalCutSync;
      const marked=input.actions.filter(a=>a.flag==='spare'&&a.checked).map(a=>a.path);
      if(marked.length){try{originalCutSync=syncSavedOriginals(marked);}catch(error){originalCutSync={warning:error.message};}}
      json(res,200,{...catalog.snapshot(),originalCutSync});return;
    }`);
fs.writeFileSync(path.join(stage,'server.cjs'),server);
let local=fs.readFileSync(path.join(source,'pic-local.cjs'),'utf8').replace(/\r\n/g,'\n');
local=replace(local,'function create(game,catalogRoot,catalog){','function create(game,catalogRoot,catalog,originalCuts={}){');
local=replace(local,"walk(root);index=out.sort((a,b)=>a.path.localeCompare(b.path));return index;}","walk(root);for(const entry of Object.values(originalCuts.originals?.()||{}))out.push({path:entry.alias,name:path.basename(entry.alias),originalCut:true,readOnly:true});index=out.sort((a,b)=>a.path.localeCompare(b.path));return index;}");
local=replace(local," function entries(rel){const dir=rel?resolve(rel,true):root;if(!fs.existsSync(dir))return{missing:true};return{entries:fs.readdirSync(dir,{withFileTypes:true}).filter(e=>!e.isSymbolicLink()).map(e=>({name:e.name,kind:e.isDirectory()?'directory':'file'}))};}"," function entries(rel){const dir=rel?resolve(rel,true):root;if(!fs.existsSync(dir))return{missing:true};const entries=fs.readdirSync(dir,{withFileTypes:true}).filter(e=>!e.isSymbolicLink()).map(e=>({name:e.name,kind:e.isDirectory()?'directory':'file'}));for(const entry of Object.values(originalCuts.originals?.()||{}))if(path.posix.dirname(entry.alias)===(rel||'.'))entries.push({name:path.posix.basename(entry.alias),kind:'file',originalCut:true,readOnly:true});return{entries};}");
local=replace(local," function file(rel){const p=resolve(rel,true);"," function file(rel){const alias=originalCuts.resolveAlias?.(rel);if(alias){const b=fs.readFileSync(alias);return{data:b.toString('base64'),name:path.basename(rel),lastModified:fs.statSync(alias).mtimeMs,originalCut:true,readOnly:true};}const p=resolve(rel,true);");
local=replace(local,"const seen=new Set(),prepared=jobs.map(j=>{const full=resolve(j.path);","const seen=new Set(),prepared=jobs.map(j=>{if(originalCuts.resolveAlias?.(j.path)||Object.values(originalCuts.reservations?.()||{}).some(e=>e.alias.toLowerCase()===String(j.path).toLowerCase()))fail('B컷은 JO9O 원본용으로 예약되어 있습니다. 새 그림은 전환 컷 추가로 저장하세요.');const full=resolve(j.path);");
local=replace(local,"for(const p of paths){try{const full=resolve(p),st=fs.statSync(full);","for(const p of paths){try{const full=originalCuts.resolveAlias?.(p)||resolve(p),st=fs.statSync(full);");
fs.writeFileSync(path.join(stage,'pic-local.cjs'),local);
console.log('Staged original-cut bridge, asset alias, future spare registration and read-only virtual B in PIC APIs.');
let workshop=fs.readFileSync(path.join(project,'tools/local-workspace/catalog/catalog_workshop.js'),'utf8').replace(/\r\n/g,'\n');
workshop=replace(workshop,'  function accept(v){baseline=',"  function accept(v){if(v.originalCutSync){Object.assign(config.originalCuts||(config.originalCuts={}),v.originalCutSync.originalCuts||{});Object.assign(config.originalReservations||(config.originalReservations={}),v.originalCutSync.originalReservations||{});}baseline=");
workshop=replace(workshop,"toLocaleTimeString();redraw();}","toLocaleTimeString();redraw();if(v.originalCutSync){var sync=v.originalCutSync;el('save').textContent=sync.warning?'보관 상태 저장됨 · B컷 연결 확인 필요: '+sync.warning:'보관 상태 저장됨 · JO9O B컷 연결 '+sync.linked+'개'+(sync.pending?' · 원본 없는 B컷 예약 '+sync.pending+'개':'');}}");
fs.writeFileSync(path.join(stage,'catalog_workshop.js'),workshop);
