'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),zlib=require('node:zlib'),http=require('node:http');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(repo+'/tools/text-workshop/core.cjs');
const files=[game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html'];
const state=game+'/modtools/catalog/catalog_status.js',qsp=game+'/jack.qsp';
const dataRx=/<script>window\.JO9_ADDITIONAL_PACK=([\s\S]*?);<\/script>/;
const renderRx=/<script>\(function\(\)\{const data=window\.JO9_ADDITIONAL_PACK;[\s\S]*?<\/script>/;
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>core.hash(fs.readFileSync(p));
function dimensions(raw){
 if(raw.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return [raw.readUInt32BE(16),raw.readUInt32BE(20)];
 if(raw[0]===255&&raw[1]===216){let at=2;while(at+4<raw.length){assert.equal(raw[at++],255);while(raw[at]===255)at++;const marker=raw[at++];if(marker===217||marker===218)break;const len=raw.readUInt16BE(at);assert(len>=2&&at+len<=raw.length);if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return [raw.readUInt16BE(at+5),raw.readUInt16BE(at+3)];at+=len;}}
 throw Error('Unreadable image header');
}
function mockRender(script,data){
 class Node{constructor(tag){this.tag=tag;this.children=[];this.style={};this.events={};this.value='';}append(...items){this.children.push(...items);}prepend(...items){this.children.unshift(...items);}replaceChildren(...items){this.children=items;}addEventListener(name,f){this.events[name]=f;}}
 const main=new Node('main');
 vm.runInNewContext(script,{window:{JO9_ADDITIONAL_PACK:data},MR:'@GAME@',url:p=>'WORK_ONLY/'+p,document:{createElement:t=>new Node(t),getElementById:id=>id==='main'?main:null,body:main}});
 const root=main.children[0];root.open=true;root.events.toggle();
 const all=[];function walk(n){all.push(n);for(const c of n.children)walk(c);}walk(root);return all.filter(n=>n.tag==='img');
}
function scriptText(block){return block.replace(/^<script>/,'').replace(/<\/script>$/,'');}
function validateScripts(s){let count=0;for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(m[1])){new vm.Script(m[2]);count++;}return count;}
function invariant(s){return s.replace(dataRx,'__PACK_DATA__').replace(renderRx,'__PACK_RENDER__');}
function httpRead(url){return new Promise((resolve,reject)=>{http.get(url,r=>{const parts=[];r.on('data',x=>parts.push(x));r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body:Buffer.concat(parts)}));}).on('error',reject);});}
async function run(){
 if(process.argv[2]==='install'){
  const catalogText=fs.readFileSync(files[0],'utf8'),source=JSON.parse(catalogText.match(dataRx)[1]);assert.equal(source.files.length,108);
  const pngs=source.files.map(f=>{assert(/^content\/pic\/girls\//.test(f.runtimePath)&&!f.runtimePath.includes('..'));const full=path.resolve(game,f.runtimePath),raw=fs.readFileSync(full);return {path:f.runtimePath,bytes:raw.length,sha256:core.hash(raw),dimensions:dimensions(raw)};});
  const backup='G:/somi/JO9_work_backups/additional-pack-work-preview-20261108_'+Date.now();assert(!fs.existsSync(backup));
  const guard={qsp:hash(qsp),state:hash(state),images:pngs};
  const changes=[];
  for(const [i,p]of files.entries()){
   const raw=fs.readFileSync(p),before=raw.toString('utf8'),oldData=JSON.parse(before.match(dataRx)[1]),oldRender=before.match(renderRx)[0];assert.deepEqual(oldData,source);
   assert(oldRender.includes('img.src=f.preview;'));const beforeImages=mockRender(scriptText(oldRender),oldData);assert.equal(beforeImages.filter(x=>x.src.startsWith('data:')).length,108);
   const live={...oldData,previewSource:'WORK-installed',workPreviewUpdatedAt:new Date().toISOString(),files:oldData.files.map(({preview,...f})=>({...f,workState:{exists:true,...pngs.find(x=>x.path===f.runtimePath),path:undefined}}))};
   const replacement=String.raw`img.src=url(MR+'\\'+f.runtimePath.replace(/\//g,'\\'));img.alt='WORK: '+f.runtimePath;img.onerror=()=>{img.alt='WORK 파일 없음: '+f.runtimePath;};`;
   const newRender=oldRender.replace('img.src=f.preview;',replacement).replace('미리보기는 설치 파일과 해시가 일치하는 팩 이미지입니다.','미리보기는 현재 WORK 설치 파일을 직접 읽습니다. 교체 후 목록을 다시 펼치거나 새로고침하면 갱신됩니다.');
   const after=before.replace(dataRx,()=>'<script>window.JO9_ADDITIONAL_PACK='+JSON.stringify(live)+';</script>').replace(renderRx,()=>newRender);
   assert.equal(invariant(before),invariant(after));const scriptCount=validateScripts(after),newImages=mockRender(scriptText(newRender),live);assert.equal(newImages.length,108);assert(newImages.every(x=>x.src.startsWith('WORK_ONLY/@GAME@\\content\\pic\\girls\\')));
   for(let j=0;j<108;j++)assert(newImages[j].src.endsWith(live.files[j].runtimePath.replaceAll('/','\\')));
   changes.push({p,raw,after,report:{path:p,before:core.hash(raw),after:core.hash(Buffer.from(after)),beforeBytes:raw.length,afterBytes:Buffer.byteLength(after),inlineScripts:scriptCount,embeddedBefore:108,embeddedAfter:0,workUrls:108,otherHtmlUnchanged:true,backup:backup+'/'+i+'.html.gz'}});
  }
  assert.equal(hash(qsp),guard.qsp);assert.equal(hash(state),guard.state);for(const f of pngs)assert.equal(hash(game+'/'+f.path),f.sha256);
  fs.mkdirSync(backup,{recursive:false});for(const c of changes){const zipped=zlib.gzipSync(c.raw);fs.writeFileSync(c.report.backup,zipped,{flag:'wx'});assert(zlib.gunzipSync(fs.readFileSync(c.report.backup)).equals(c.raw));}
  for(const c of changes){assert.equal(hash(c.p),c.report.before);fs.writeFileSync(c.p,c.after);assert.equal(hash(c.p),c.report.after);}
  const changedSinceSnapshot=pngs.filter((x,i)=>x.sha256!==source.files[i].workState.sha256).length;
  const report={backup,guard,changedSinceSnapshot,files:changes.map(c=>c.report),jsonReferencesUnchanged:true};fs.writeFileSync(path.join(__dirname,'installation.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({installed:true,characters:27,pngs:108,changedSinceSnapshot,checks:'scripts, WORK paths, preserved HTML, QSP/state/images',backup}));
 }else if(process.argv[2]==='verify-http'){
  const report=readJson(path.join(__dirname,'installation.json'));const response=await httpRead('http://127.0.0.1:3813/catalog');assert.equal(response.status,200);const html=response.body.toString('utf8'),data=JSON.parse(html.match(dataRx)[1]),cfg=JSON.parse(html.match(/window\.JO9_CATALOG_BRIDGE=(.*?);<\/script>/)[1]);
  assert.equal(data.previewSource,'WORK-installed');assert(!data.files.some(x=>'preview' in x));assert(!html.match(renderRx)[0].includes('img.src=f.preview;'));
  assert(html.includes("var orig=p.indexOf(OR+"));
  let checked=0;for(let i=0;i<data.files.length;i+=6){await Promise.all(data.files.slice(i,i+6).map(async f=>{const u=new URL('/api/catalog-asset',cfg.url);u.searchParams.set('t',cfg.token);u.searchParams.set('original','0');u.searchParams.set('p',f.runtimePath);const r=await httpRead(u);assert.equal(r.status,200,f.runtimePath);assert.equal(r.headers['cache-control'],'no-store');const physical=fs.readFileSync(game+'/'+f.runtimePath);assert(r.body.equals(physical),f.runtimePath);checked++;}));}
  assert.equal(hash(qsp),report.guard.qsp);assert.equal(hash(state),report.guard.state);for(const f of report.guard.images)assert.equal(hash(game+'/'+f.path),f.sha256);
  const verified={httpImages:checked,source:'WORK',allBytesMatchWork:true,cacheControl:'no-store',qspUnchanged:true,statusUnchanged:true,pngsUnchanged:true,otherHtmlUnchanged:true};fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(verified,null,2));console.log(JSON.stringify(verified));
 }else throw Error('install|verify-http');
}
run().catch(e=>{console.error(e.stack);process.exitCode=1;});
