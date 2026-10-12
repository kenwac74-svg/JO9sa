'use strict';
const fs=require('node:fs'); const path=require('node:path'); const http=require('node:http'); const crypto=require('node:crypto');
const core=require('./core.cjs');
const addition=require('./addition.cjs');
const scenes=require('./scenes.cjs');
const catalogModule=require('./catalog.cjs');
const {spawn}=require('node:child_process');
const arg=n=>{const i=process.argv.indexOf(n);return i<0 ? undefined : process.argv[i+1];};
const game=path.resolve(arg('--game-dir') || 'G:/somi/JO9/game');
const target=path.join(game,'jack.qsp');
const catalogRoot=path.resolve(arg('--catalog-dir')||path.join(game,'..','..','IMGMG'));
const originalRoot=path.resolve(arg('--original-dir')||path.join(game,'..','..','JO9O','game'));
const catalog=catalogModule.create(catalogRoot);
const runtime=path.resolve(arg('--runtime') || path.join(__dirname,'runtime'));
fs.mkdirSync(runtime,{recursive:true});
const backups=path.join(runtime,'backups');fs.mkdirSync(backups,{recursive:true});
const grok=require('./grok-prompt.cjs').create(runtime);
const dialogueAI=require('./grok-prompt.cjs').create(runtime,{kind:'dialogue'});
let catalogSelection={id:0,path:''};
const token=crypto.randomBytes(24).toString('hex'); let cache,cacheEntries,navigator,preview; let busy=false;
// 17 MB QSP를 요청마다 읽고 해시하지 않도록, 크기·수정 시각이 같으면 메모리의 결과를 쓴다(반영 직전 검사는 transact가 파일을 다시 읽어 한다).
let cacheRaw=null,cacheStat='',variableInspector=null;
function current() {
  const st=fs.statSync(target),stamp=st.size+':'+st.mtimeMs;
  if(cache && cacheStat===stamp) return {raw:cacheRaw,doc:cache};
  const raw=fs.readFileSync(target);const digest=core.hash(raw);
  if(!cache || cache.hash!==digest){cache=core.parse(raw);cacheEntries=core.entries(cache);variableInspector=null;navigator=scenes.buildNavigator(cache,cacheEntries);}
  cacheRaw=raw;cacheStat=stamp;return {raw,doc:cache};
}
const pic=path.join(game,'content','pic');
const isWorkshopOrigin=require('./workshop-origin.cjs').create(game);
const imageCuts=require('./image-cuts.cjs').create(game,catalogRoot,catalog,runtime);
const originalCutRegistrar=require('./original-cuts.cjs');
const localPic=require('./pic-local.cjs').create(game,catalogRoot,catalog,imageCuts);
function syncSavedOriginals(paths,reconcile=false){
  const registration=originalCutRegistrar.register(game,catalogRoot,originalRoot,runtime,paths,reconcile);
  const priorManifest=registration.prior?JSON.parse(registration.prior):{};
  if(registration.changed){const before=fs.readFileSync(target),persistent=path.resolve(__dirname,'../../mods/2026-10-08_persistent_image_cycle.json'),priorMod=fs.existsSync(persistent)?fs.readFileSync(persistent):null;try{imageCuts.refresh('original_B_'+Date.now());}catch(error){originalCutRegistrar.rollback(registration);if(!fs.readFileSync(target).equals(before))catalogModule.atomic(target,before);if(priorMod)catalogModule.atomic(persistent,priorMod);throw error;}}
  let warning,added=[];try{added=originalCutRegistrar.exposeCatalog(catalogRoot,catalog,registration.registered,runtime,registration.released||[]);}catch(error){warning=error.message;}
  if(registration.changed||added.length||(registration.released||[]).length){localPic.scan(true);cache=null;preview=null;}
  return {linked:registration.registered.filter(e=>!priorManifest.originals?.[e.base.toLowerCase()]).length,released:(registration.released||[]).length,details:registration.pending,pending:registration.pending.length,warning,originalCuts:Object.fromEntries(registration.registered.map(e=>[e.base.toLowerCase(),e])),originalReservations:imageCuts.reservations()};
}
const cutToken=crypto.randomBytes(24).toString('hex');
// 장면 이미지 후보를 실제 파일로 확인한다(확장자가 없으면 png·jpg·gif 순으로).
function resolvePic(p) {
  let rel=String(p).replace(/\//g,'\\').replace(/^\\+/,'').replace(/^content\\pic\\/i,'');
  if(!rel||rel.includes('..'))return null;
  for(const cand of /\.(png|jpe?g|gif)$/i.test(rel)?[rel]:[rel+'.png',rel+'.jpg',rel+'.gif']){
    const full=path.join(pic,cand);if(full.startsWith(pic+path.sep)&&fs.existsSync(full)&&fs.statSync(full).isFile()&&fs.realpathSync(full).startsWith(fs.realpathSync(pic)+path.sep))return {rel:cand,full};
  }
  return null;
}
// Exclude thumbnails even when they sit outside portrait/icon folders.
const imageSizeMemo=new Map();
function smallImage(full){
  const st=fs.statSync(full),stamp=st.size+':'+st.mtimeMs,cached=imageSizeMemo.get(full);if(cached?.stamp===stamp)return cached.small;
  const header=Buffer.alloc(Math.min(st.size,65536)),fd=fs.openSync(full,'r');try{fs.readSync(fd,header,0,header.length,0);}finally{fs.closeSync(fd);}let w=0,h=0;
  if(header.length>=24&&header.subarray(0,8).toString('hex')==='89504e470d0a1a0a'){w=header.readUInt32BE(16);h=header.readUInt32BE(20);}
  else if(header.length>=10&&/^GIF8/.test(header.toString('ascii',0,4))){w=header.readUInt16LE(6);h=header.readUInt16LE(8);}
  else if(header.length>4&&header[0]===255&&header[1]===216){let at=2;while(at+4<header.length){if(header[at++]!==255)break;const marker=header[at++];if(marker===216||marker===217)continue;const len=header.readUInt16BE(at);if(len<2||at+len>header.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&len>=7){h=header.readUInt16BE(at+3);w=header.readUInt16BE(at+5);break;}at+=len;}}
  const small=!!(w&&h&&w<400&&h<400);imageSizeMemo.set(full,{stamp,small});return small;
}
function withImages(c) {
  const seen=new Set(),images=[],unresolved=[];
  for(const item of c.images||[]){const im=typeof item==='string'?{path:item}:item,note=im.note||'';
    let candidates=[im.path];
    if(im.path.includes('<<')){
      const rel=im.path.replace(/^content[\\/]pic[\\/]/i,'').replace(/\\/g,'/');
      const dir=path.posix.dirname(rel),file=path.posix.basename(rel);
      if(!dir.includes('<<')&&!dir.includes('..')){
        const pattern=file.split(/<<[\s\S]*?>>/).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join(im.random?'(?:[0-9]+)':'[^/]*');
        const re=new RegExp('^'+pattern+'$','i'),folder=path.join(pic,...dir.split('/'));
        candidates=fs.existsSync(folder)?fs.readdirSync(folder).filter(n=>re.test(n)).map(n=>dir+'/'+n):[];
      }else candidates=[];
    }else if(im.random){
      const r=resolvePic(im.path);if(r){const stem=path.basename(r.full,path.extname(r.full)),folder=path.dirname(r.full);const re=new RegExp('^'+stem.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:_[2-9][0-9]*|_[1-9][0-9]+)?'+path.extname(r.full).replace('.','\\.')+'$','i');candidates=fs.readdirSync(folder).filter(n=>re.test(n)).map(n=>path.join(path.dirname(r.rel),n));}
    }
    let count=0;
    for(const p of candidates){if(/(?:^|[\\/])(?:ui(?: overhaul)?|buttons?|portraits?|icons?|avatars?)(?:[\\/]|$)|(?:_ava|_portrait|_icon)\.(?:png|jpe?g|gif|webp)$/i.test(String(p)))continue;const r=resolvePic(p);if(r&&!smallImage(r.full)&&!seen.has(r.rel.toLowerCase())){seen.add(r.rel.toLowerCase());count++;images.push({path:r.rel,note:note+(im.random?' · 랜덤 후보':im.path.includes('<<')?' · 상태에 따른 후보':''),random:!!im.random,url:'/api/pic?t='+token+'&p='+encodeURIComponent(r.rel)+'&v='+fs.statSync(r.full).mtimeMs,work:catalog.meta('content\\pic\\'+r.rel)});}}
    if(!count&&!candidates.some(p=>seen.has(String(p).toLowerCase())))unresolved.push({path:im.path,note});
  }
  return {...c,images,imageCandidates:(c.images||[]).length,unresolvedImages:unresolved};
}
function catalogAsset(rel,original){
  const root=original?originalRoot:game;
  const p=String(rel).replace(/\\/g,'/');if(!/^content\/pic\//i.test(p)||p.split('/').some(x=>x==='..'||x==='.')||! /\.(png|jpe?g|gif|webp|bmp)$/i.test(p))return null;
  if(!original){const alias=imageCuts.resolveAlias(p);if(alias)return alias;}
  const full=path.resolve(root,...p.split('/'));if(!full.startsWith(root+path.sep)||!fs.existsSync(full)||!fs.statSync(full).isFile())return null;
  let cursor=root;for(const part of p.split('/')){if(!fs.readdirSync(cursor).includes(part))return null;cursor=path.join(cursor,part);}
  const actual=fs.realpathSync(full),realRoot=fs.realpathSync(root);return actual.startsWith(realRoot+path.sep)?actual:null;
}

function history() {return fs.readdirSync(backups).filter(n=>/^\d.*\.json$/.test(n)).sort().reverse().map(n=>JSON.parse(fs.readFileSync(path.join(backups,n),'utf8')));}
function transact(before,after,details) {
  if(busy) throw Error('다른 반영 작업이 진행 중입니다.'); busy=true;
  const id=new Date().toISOString().replace(/[:.]/g,'-')+'_'+crypto.randomBytes(3).toString('hex');
  const tmp=path.join(game,`.jack-text-${id}.tmp`);
  const backup=path.join(backups,id+'.qsp');const record=path.join(backups,id+'.json');
  const meta={id,date:new Date().toISOString(),before:core.hash(before),after:core.hash(after),target,...details,status:'prepared'};
  try {
    if(core.hash(fs.readFileSync(target))!==meta.before) throw Error('반영 직전 QSP가 바뀌었습니다. 다시 검색해 주세요.');
    fs.writeFileSync(backup,before,{flag:'wx'});
    if(!fs.readFileSync(backup).equals(before)) throw Error('백업 검사가 실패했습니다.');
    fs.writeFileSync(record,JSON.stringify(meta,null,2),{flag:'wx'});
    fs.writeFileSync(tmp,after,{flag:'wx'});
    if(!fs.readFileSync(tmp).equals(after)) throw Error('임시 파일 검사가 실패했습니다.');
    if(core.hash(fs.readFileSync(target))!==meta.before) throw Error('다른 프로그램이 QSP를 수정했습니다. 반영을 중단했습니다.');
    fs.renameSync(tmp,target);
    if(core.hash(fs.readFileSync(target))!==meta.after) throw Error('저장 후 검사 실패: 백업을 확인하세요.');
    meta.status='applied';fs.writeFileSync(record,JSON.stringify(meta,null,2));cache=null;preview=null;return meta;
  } catch(e) {
    meta.status='failed';meta.error=e.message;
    if(fs.existsSync(record))fs.writeFileSync(record,JSON.stringify(meta,null,2));throw e;
  } finally {if(fs.existsSync(tmp))fs.unlinkSync(tmp);busy=false;}
}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req,limit=3000000){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>limit)throw Error('입력 크기가 너무 큽니다.');}return JSON.parse(text);}
const server=http.createServer(async(req,res)=>{
  try {
    const host=`127.0.0.1:${server.address().port}`;
    if(req.headers.host!==host){json(res,403,{error:'허용되지 않은 접속 주소입니다.'});return;}
    const url=new URL(req.url,'http://'+host);
    if(req.method==='GET' && url.pathname==='/'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});
      res.end(fs.readFileSync(path.join(__dirname,'index.html'),'utf8').replace('__SESSION_TOKEN__',token));return;
    }
    if(req.method==='GET'&&['/dialogue-ai.js','/editing-tools.js','/variable-inspector.js'].includes(url.pathname)){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(__dirname,url.pathname.slice(1)),'utf8'));return;}
    const catalogRoute=url.pathname.startsWith('/api/catalog/');
    if(catalogRoute&&req.headers.origin==='null'){
      res.setHeader('Access-Control-Allow-Origin','null');res.setHeader('Vary','Origin');
      if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, POST');res.setHeader('Access-Control-Allow-Headers','X-JO9-Token, Content-Type');res.setHeader('Access-Control-Allow-Private-Network','true');res.writeHead(204);res.end();return;}
    }
    if(req.method==='GET'&&url.pathname==='/catalog'){
      if(!catalog.load()){json(res,404,{error:'체크리스트를 찾지 못했습니다.'});return;}
      let html=fs.readFileSync(path.join(catalogRoot,'catalog_merge_vs_original.html'),'utf8');
      const cfg=JSON.stringify({url:'http://'+host+'/',token,originalCuts:imageCuts.originals(),originalReservations:imageCuts.reservations()}).replaceAll('<','\\u003c');
      html=html.replace(/<script src="catalog_workshop_config.js"><\/script>/,'');
      // Initialize the bridge before any asynchronously loaded PIC modules.
      html=html.replace(/<head(?:\s[^>]*)?>/i,head=>head+'<script>window.JO9_CATALOG_BRIDGE='+cfg+';</script>');
      // file:// cannot be displayed inside HTTP pages. Serve only allowlisted catalog images.
      html=html.replace("function url(p){", "function url(p){if(p.indexOf(MR+'\\\\')===0||p.indexOf(OR+'\\\\')===0){var orig=p.indexOf(OR+'\\\\')===0;return '/api/catalog-asset?t='+"+JSON.stringify(token)+"+'&original='+(orig?'1':'0')+'&p='+encodeURIComponent(p.substring((orig?OR:MR).length+1));}");
      html=html.replace(/<\/body>/i,'<script src="catalog_grok.js"></script><script src="catalog_cuts.js"></script></body>');
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);return;
    }
    const catalogFiles=['catalog_cuts.js','catalog_status.js','catalog_work_codes.js','catalog_workshop.js','catalog_editor.js','catalog_pic.js','catalog_local_pic.js','catalog_grok.js'];
    if(req.method==='GET'&&catalogFiles.includes(url.pathname.slice(1))){
      const file=url.pathname.slice(1);let text;
      if(file==='catalog_status.js')text='window.CATALOG_STATUS='+JSON.stringify(catalog.state())+';';
      else if(file==='catalog_work_codes.js')text='window.JO9_WORK_CODES='+JSON.stringify(catalog.snapshot().codes||{})+';window.JO9_WORK_UNITS='+JSON.stringify(catalog.snapshot().unitCodes||{})+';';
      else {const full=path.join(catalogRoot,file);if(!fs.existsSync(full)){res.writeHead(404);res.end();return;}text=fs.readFileSync(full,'utf8');if(file==='catalog_pic.js')text=fs.readFileSync(path.join(catalogRoot,'catalog_local_pic.js'),'utf8')+'\n'+text;}
      res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(text);return;
    }
    if(req.method==='GET'&&url.pathname==='/api/catalog-asset'){
      if(url.searchParams.get('t')!==token){json(res,403,{error:'편집기를 다시 열어 주세요.'});return;}
      const full=catalogAsset(url.searchParams.get('p')||'',url.searchParams.get('original')==='1');if(!full){json(res,404,{error:'이미지를 찾지 못했습니다.'});return;}
      const types={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.bmp':'image/bmp'};
      res.writeHead(200,{'Content-Type':types[path.extname(full).toLowerCase()],'Cache-Control':'no-store'});fs.createReadStream(full).pipe(res);return;
    }
    if(req.method==='GET' && url.pathname==='/api/pic'){
      if(url.searchParams.get('t')!==token){json(res,403,{error:'편집기를 다시 열어 주세요.'});return;}
      const r=resolvePic(url.searchParams.get('p')||'');if(!r){json(res,404,{error:'이미지를 찾지 못했습니다.'});return;}
      const ext=path.extname(r.full).toLowerCase();res.writeHead(200,{'Content-Type':ext==='.gif'?'image/gif':ext==='.png'?'image/png':'image/jpeg','Cache-Control':'no-store'});fs.createReadStream(r.full).pipe(res);return;
    }
    // A loopback workshop may request UI navigation only, without receiving the editing token.
    if(req.method==='POST'&&url.pathname==='/api/catalog/selection'){
      const origin=req.headers.origin;
      if(!await isWorkshopOrigin(origin)){json(res,403,{error:'이미지워크샵에서만 선택할 수 있습니다.'});return;}
      res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
      const input=await body(req,4096);
      const selected=require('./catalog-selection.cjs').select(game,catalog,input.path);
      if(!selected){
        json(res,404,{error:'체크리스트에 없는 이미지입니다.'});return;
      }
      catalogSelection={id:catalogSelection.id+1,path:selected};
      json(res,200,{ok:true});return;
    }

    // A scoped workshop token grants only cut info/add; it never grants dialogue editing.
    if(url.pathname.startsWith('/api/catalog/cuts/')){
      const origin=req.headers.origin,workshop=await isWorkshopOrigin(origin);
      if(workshop){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
      if(req.method==='OPTIONS'&&workshop){res.setHeader('Access-Control-Allow-Methods','GET, POST');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-JO9-Cut-Token');res.writeHead(204);res.end();return;}
      const action=url.pathname.slice('/api/catalog/cuts/'.length);
      if(req.method==='GET'&&action==='session'&&workshop){json(res,200,{token:cutToken});return;}
      const authorized=(req.headers['x-jo9-token']===token&&(!origin||origin==='http://'+host||origin==='null'))||(workshop&&req.headers['x-jo9-cut-token']===cutToken);
      if(!authorized){json(res,403,{error:'편집실을 다시 열어 주세요.'});return;}
      if(req.method!=='POST'||!['info','add','families','file','replace'].includes(action)){json(res,400,{error:'잘못된 추가 컷 요청입니다.'});return;}
      const input=await body(req,85000000);let result;
      if(action==='families'){
        if(!Array.isArray(input.paths)||input.paths.length>200)throw Error('현재 화면 이미지 목록을 확인하세요.');
        result={families:input.paths.map(p=>{try{return imageCuts.family(p);}catch(e){return{requested:p,error:e.message,items:[]};}})};
      }else if(action==='file'||action==='replace'){
        const rel=String(input.path||'').replaceAll('\\','/').replace(/^content\/pic\//,'');
        if(!/^(bg|characters|scene|reserve)\/.+\.png$/i.test(rel))throw Error('편집할 이미지 경로를 확인하세요.');
        if(action==='file')result=localPic.file(rel);
        else{if(!/ \(([2-9]|[1-9][0-9]+)\)\.png$/i.test(rel))throw Error('기존 전환 컷만 이 경로로 저장할 수 있습니다.');result=localPic.apply([{path:rel,before:input.before,data:input.data,cap:input.cap}]);}
      }else{
        result=action==='info'?imageCuts.info(input.base):imageCuts.add(input);
      }
      if(action==='add'){localPic.scan(true);cache=null;preview=null;}
      json(res,200,result);return;
    }

    if(req.headers['x-jo9-token']!==token) {json(res,403,{error:'편집기를 다시 열어 주세요.'});return;}
    if(req.headers.origin && req.headers.origin!=='http://'+host && !(catalogRoute&&req.headers.origin==='null')){json(res,403,{error:'다른 사이트에서는 사용할 수 없습니다.'});return;}
    if(url.pathname.startsWith('/api/catalog/pic/')){
      const action=url.pathname.slice('/api/catalog/pic/'.length);let result;
      if(req.method==='GET'&&action==='index')result={index:localPic.scan(url.searchParams.get('rescan')==='1')};
      else if(req.method==='POST'){const input=await body(req,170000000);if(action==='entries')result=localPic.entries(input.path||'');else if(action==='file')result=localPic.file(input.path);else if(action==='apply')result=localPic.apply(input.jobs);else if(action==='revisions')result=localPic.revisions(input.paths);else if(action==='restore')result=localPic.restore(input.id);}
      if(result===undefined){json(res,400,{error:'잘못된 PIC 요청입니다.'});return;}json(res,200,result);return;
    }
    if(req.method==='GET'&&url.pathname==='/api/catalog/selection'){json(res,200,catalogSelection);return;}
    if(req.method==='GET'&&url.pathname==='/api/catalog/state'){
      if(url.searchParams.get('brief')==='1'){json(res,200,{available:catalog.load(),...catalog.state()});return;}
      if(url.searchParams.has('since')&&Number(url.searchParams.get('since'))===Number(catalog.state().savedAt||0)){json(res,200,{unchanged:true,available:catalog.load()});return;}
      json(res,200,catalog.snapshot());return;
    }
    if(url.pathname.startsWith('/api/dialogue-ai/')){
      const action=url.pathname.slice('/api/dialogue-ai/'.length);
      if(req.method==='GET'&&action==='settings'){json(res,200,dialogueAI.state());return;}
      if(req.method==='GET'&&action==='models'){json(res,200,{models:await dialogueAI.models(true)});return;}
      if(req.method==='POST'&&action==='settings'){json(res,200,dialogueAI.settings(await body(req,4096)));return;}
      if(req.method==='POST'&&action==='chat'){
        const input=await body(req,24000);current();
        const c=withImages(navigator.context(input.selection,input.sceneId,'text',input.usageId));
        if(!c.selection||c.selection.dialogue===false)throw Error('게임 대사를 선택하세요.');
        const image=input.imagePath?c.images.find(im=>im.path===input.imagePath):null;
        if(input.imagePath&&!image)throw Error('이 장면의 이미지 후보를 선택하세요.');
        const resolved=image?resolvePic(image.path):null;
        if(image&&!resolved)throw Error('장면 이미지를 찾지 못했습니다.');
        const reference='위치: '+c.location+' / '+c.selection.line+'행\n장면: '+c.scene.title+'\n조건: '+(c.scene.conditions||[]).join(' → ')+'\n선택한 원문:\n'+c.selection.text;
        json(res,200,await dialogueAI.chat(resolved?.full||null,c.selection.fieldIndex+':'+c.selection.start,{message:input.message,reset:input.reset,reference}));return;
      }
      json(res,404,{error:'잘못된 각색 요청입니다.'});return;
    }
    if(url.pathname.startsWith('/api/catalog/grok/')){
      const action=url.pathname.slice('/api/catalog/grok/'.length);
      if(req.method==='GET'&&action==='settings'){json(res,200,grok.state());return;}
      if(req.method==='GET'&&action==='models'){json(res,200,{models:await grok.models(true)});return;}
      if(req.method==='POST'&&action==='settings'){json(res,200,grok.settings(await body(req,4096)));return;}
      if(req.method==='POST'&&action==='chat'){
        const input=await body(req,24000);
        const member=typeof input.path==='string'&&(catalog.meta(input.path)||catalog.meta(input.path.replace(/^content[\\/]pic[\\/]/i,'content/pic/reserve/')));
        if(!member)throw Error('체크리스트에 없는 이미지입니다.');
        const source=catalogAsset(input.path,input.original!==false);if(!source)throw Error('선택한 이미지를 찾지 못했습니다.');
        const workFolder=path.join(game,'content','modworkpic'),work=path.join(workFolder,path.basename(source));
        if(!fs.existsSync(work)||fs.lstatSync(work).isSymbolicLink()||!fs.realpathSync(work).startsWith(fs.realpathSync(workFolder)+path.sep)||!fs.readFileSync(work).equals(fs.readFileSync(source)))throw Error('작업폴더로 복사 버튼으로 이미지를 먼저 연결하세요.');
        json(res,200,await grok.chat(source,(input.original===false?'current:':'original:')+input.path,input));return;
      }
      json(res,404,{error:'잘못된 Grok 요청입니다.'});return;
    }
    if(req.method==='POST'&&url.pathname==='/api/catalog/copy-original'){
      const input=await body(req,4096);
      const member=typeof input.path==='string'&&(catalog.meta(input.path)||catalog.meta(input.path.replace(/^content[\\/]pic[\\/]/i,'content/pic/reserve/')));
      if(!member){json(res,400,{error:'체크리스트에 없는 이미지입니다.'});return;}
      const source=catalogAsset(input.path,input.original!==false);
      if(!source){json(res,404,{error:'선택한 이미지를 찾지 못했습니다.'});return;}
      json(res,200,require('./original-copy.cjs').copyOriginal(source,game,catalogRoot,input.replaceHash));return;
    }
    if(req.method==='POST'&&url.pathname==='/api/catalog/open-folder'){
      const input=await body(req,4096);
      const member=typeof input.path==='string'&&(catalog.meta(input.path)||(input.original===true&&catalog.meta(input.path.replace(/^content[\\/]pic[\\/]/i,'content/pic/reserve/'))));
      if(!member){json(res,400,{error:'체크리스트에 없는 이미지입니다. 새로고침 후 다시 선택하세요.'});return;}
      const full=catalogAsset(input.path,input.original===true);
      if(!full){json(res,404,{error:'이미지 파일을 찾지 못했습니다.'});return;}
      if(process.platform!=='win32'){json(res,400,{error:'Windows 탐색기에서만 열 수 있습니다.'});return;}
      await new Promise((resolve,reject)=>{const child=spawn('explorer.exe',['/select,',full],{shell:false,detached:true,stdio:'ignore'});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
      json(res,200,{ok:true});return;
    }
    if(req.method==='POST'&&url.pathname==='/api/catalog/original-sync'){
      if(busy)throw Error('다른 저장 작업이 끝난 뒤 다시 눌러 주세요.');busy=true;
      try{const result=syncSavedOriginals(undefined,true);json(res,200,{...catalog.snapshot(),sync:result,rows:originalCutRegistrar.readRows(catalogRoot),originalCuts:imageCuts.originals(),originalReservations:imageCuts.reservations()});}finally{busy=false;}return;
    }
    if(req.method==='POST'&&url.pathname==='/api/catalog/status'){
      const input=await body(req,12000000);catalog.update(input.actions);let originalCutSync;
      json(res,200,{...catalog.snapshot(),originalCutSync});return;
    }
    if(req.method==='GET' && url.pathname==='/api/state'){
      const {doc}=current();json(res,200,{target,hash:doc.hash,locations:doc.locations.length,backups});return;
    }
    if(req.method==='GET' && url.pathname==='/api/search'){
      const query=(url.searchParams.get('q')||'').trim(),loc=(url.searchParams.get('location')||'').trim(),all=url.searchParams.get('mode')==='all';
      if(query.length<2 && !loc)throw Error('원문 일부를 두 글자 이상 입력하거나 위치 이름을 넣어 주세요.');
      const {doc}=current();const found=cacheEntries.filter(e=>(all||e.dialogue) && (!query || e.text.includes(query)) && (!loc || e.location.includes(loc)));
      json(res,200,{hash:doc.hash,total:found.length,results:(query==='#nwtx'?found:found.slice(0,200)).map(e=>({...e,hash:doc.hash}))});return;
    }
    if(req.method==='GET' && url.pathname==='/api/history'){json(res,200,history().map(({id,date,location,field,status,before,after,kind})=>({id,date,location,field,status,before,after,kind})));return;}
    if(req.method==='POST' && url.pathname==='/api/variables'){
      const input=await body(req);const {doc}=current();
      const c=navigator.context(input.selection,input.sceneId,input.mode,input.usageId);
      variableInspector ||= require('./variable-inspector.cjs').create(doc,cacheEntries);
      json(res,200,variableInspector.inspect(c));return;
    }
    if(req.method==='POST' && url.pathname==='/api/context'){
      const input=await body(req);current();json(res,200,withImages(navigator.context(input.selection,input.sceneId,input.mode,input.usageId)));return;
    }
    if(req.method==='POST' && url.pathname==='/api/scene'){
      const input=await body(req);const {doc}=current();if(input.hash!==doc.hash)throw Error('QSP가 바뀌었습니다. 다시 검색해 주세요.');json(res,200,withImages(navigator.open(input.destination,input.mode)));return;
    }
    if(req.method==='POST' && url.pathname==='/api/incoming'){
      const input=await body(req);current();json(res,200,navigator.incoming(input));return;
    }
    if(req.method==='GET' && url.pathname==='/api/export'){
      const id=url.searchParams.get('id');if(!/^[\dTZ_-]+[a-f0-9]{6}$/.test(id||''))throw Error('잘못된 기록 번호입니다.');
      const m=history().find(e=>e.id===id);if(!m || !m.mod || m.status!=='applied')throw Error('내보낼 수정 기록이 없습니다.');json(res,200,m.mod);return;
    }
    if(req.method==='POST' && url.pathname==='/api/preview'){
      const input=await body(req);const {doc}=current();const p=input.operation==='add'?addition.prepare(doc,input.selection,input.addition,input.additionMode):core.prepare(doc,input.selection,input.replacement);
      preview={...p,before:doc.hash,id:crypto.randomBytes(24).toString('hex')};
      json(res,200,{id:preview.id,location:p.entry.location,field:p.entry.field,line:p.entry.line,old:p.entry.text,new:p.replacement,after:p.after,operation:p.operation||'edit',page:p.page,adjustments:p.adjustments||[]});return;
    }
    if(req.method==='POST' && url.pathname==='/api/apply'){
      const input=await body(req);if(!preview || input.id!==preview.id || input.approved!==true)throw Error('미리보기와 수정문 승인이 필요합니다.');
      const p=preview,{raw,doc}=current();if(doc.hash!==p.before)throw Error('미리보기 이후 QSP가 변경되었습니다. 다시 검색해 주세요.');
      if(doc.locations.filter(l=>l.name===p.entry.location).length!==1)throw Error('동일한 이름의 위치가 중복되어 반영할 수 없습니다.');
      // mods용 기록은 location 전체가 아니라 바뀐 문구와 최소 맥락만 담는다(apply_mods.ps1 형식).
      const stamp=new Date().toISOString();
      const mod={description:`대사 편집실: ${p.entry.location} ${p.entry.field==='desc'?'설명':'본문 '+p.entry.line+'행'} ${p.operation==='page'?'다음 페이지 추가':p.operation==='paragraph'?'문단 추가':'문구 수정'}`,id:stamp.slice(0,10)+'_text_'+stamp.slice(11,19).replace(/:/g,''),target:'game\\jack.qsp',before_sha256:p.before.toUpperCase(),after_sha256:p.after.toUpperCase(),edits:[{location:p.entry.location,field:p.entry.field,old:p.piece.old,new:p.piece.new,count:1}]};
      const m=transact(raw,p.raw,{kind:'edit',location:p.entry.location,field:p.entry.field,line:p.entry.line,mod});current();
      const updated=cacheEntries.find(e=>e.fieldIndex===p.entry.fieldIndex&&e.start===(p.selectionStart??p.entry.start));
      json(res,200,{...m,selection:updated?{...updated,hash:cache.hash}:null});return;
    }
    if(req.method==='POST' && url.pathname==='/api/restore'){
      const input=await body(req),m=history().find(e=>e.id===input.id);
      if(!m || m.status!=='applied')throw Error('복원할 기록을 찾지 못했습니다.');
      const {raw,doc}=current();if(doc.hash!==m.after)throw Error('이 기록 이후 다른 변경이 있습니다. 최근 변경부터 되돌려 주세요.');
      const old=fs.readFileSync(path.join(backups,m.id+'.qsp'));if(core.hash(old)!==m.before)throw Error('백업 내용이 기록과 다릅니다.');core.parse(old);
      json(res,200,transact(raw,old,{kind:'restore',location:m.location,field:m.field,restores:m.id}));return;
    }
    json(res,404,{error:'요청을 찾지 못했습니다.'});
  }catch(e){json(res,400,{error:e.message});}
});
current();
server.listen(Number(arg('--port')||0),'127.0.0.1',()=>{
  const state={url:`http://127.0.0.1:${server.address().port}/`,pid:process.pid,target};
  fs.writeFileSync(path.join(runtime,'server.json'),JSON.stringify(state,null,2));
  if(catalog.load()){
    catalogModule.atomic(path.join(catalogRoot,'catalog_workshop_config.js'),'window.JO9_CATALOG_BRIDGE='+JSON.stringify({url:state.url,token})+';\n');
    catalogModule.atomic(path.join(catalogRoot,'catalog_work_codes.js'),'window.JO9_WORK_CODES='+JSON.stringify(catalog.snapshot().codes)+';window.JO9_WORK_UNITS='+JSON.stringify(catalog.snapshot().unitCodes)+';\n');
  }
  console.log(JSON.stringify(state));
});
