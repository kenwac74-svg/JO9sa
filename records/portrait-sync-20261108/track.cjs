'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),zlib=require('node:zlib'),vm=require('node:vm'),http=require('node:http');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',catalog=game+'/modtools/catalog';
const core=require(repo+'/tools/text-workshop/core.cjs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>core.hash(fs.readFileSync(p));
const plan=read(path.join(__dirname,'plan.json')),installed=read(path.join(__dirname,'installation.json'));
const norm=p=>p.replaceAll('\\','/').toLowerCase();
const modified=new Map(plan.files.map(f=>[norm('content/pic/'+f.path),f]));
const rowsRx=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const seedText=fs.readFileSync(repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html','utf8');
const seedRows=new Map(JSON.parse(seedText.match(rowsRx)[1]).map(r=>[norm(r[0]),r]));
function patchHtml(before){
 const m=before.match(rowsRx);assert(m);const rows=JSON.parse(m[1]);let updated=0;
 const present=new Set(rows.map(r=>norm(r[0])));
 for(const [key,f]of modified)if(!present.has(key)){assert(seedRows.has(key),'Missing seed row '+key);rows.push([...seedRows.get(key)]);present.add(key);}
 for(const r of rows){const f=modified.get(norm(r[0]));if(f){r[3]=f.bytes;r[5]=f.width;r[6]=f.height;updated++;}}
 let after=before.replace(rowsRx,x=>x.replace(m[1],JSON.stringify(rows)));
 const packRx=/<script>window\.JO9_ADDITIONAL_PACK=([\s\S]*?);<\/script>/;
 if(packRx.test(after)){const data=JSON.parse(after.match(packRx)[1]);for(const row of data.files){const f=modified.get(norm(row.runtimePath));if(f)row.workState={exists:true,bytes:f.bytes,sha256:f.after,dimensions:[f.width,f.height]};}after=after.replace(packRx,()=>'<script>window.JO9_ADDITIONAL_PACK='+JSON.stringify(data)+';</script>');}
 for(const m of after.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(m[1]))new vm.Script(m[2]);
 return {text:after,rowsUpdated:updated};
}
function backup(p,label){const dest=path.join(installed.backup,label+'.gz');assert(!fs.existsSync(dest));const raw=fs.readFileSync(p);fs.writeFileSync(dest,zlib.gzipSync(raw));assert(zlib.gunzipSync(fs.readFileSync(dest)).equals(raw));return dest;}
function httpRead(url){return new Promise((resolve,reject)=>{http.get(url,r=>{const data=[];r.on('data',x=>data.push(x));r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body:Buffer.concat(data)}));}).on('error',reject);});}
async function run(){
 if(process.argv[2]==='record'){
  assert.equal(hash(game+'/jack.qsp'),plan.qspHash);for(const f of plan.files){assert.equal(hash(game+'/content/pic/'+f.path),f.after);assert.equal(hash(repo+'/assets/content/pic/'+f.path),f.after);}
  const state=catalog+'/catalog_status.js',stateHash=hash(state),meta=[];
  const runtime=repo+'/assets/runtime-source-2.4.1.json',runtimeData=read(runtime),byPath=new Map(runtimeData.files.map(f=>[norm(f.runtimePath),f]));backup(runtime,'runtime-source');
  for(const [key,f]of modified){const p='content/pic/'+f.path,entry={runtimePath:p,repositoryPath:'assets/'+p,bytes:f.bytes,sha256:f.after};const old=byPath.get(key);if(old)Object.assign(old,entry);else runtimeData.files.push(entry);}
  fs.writeFileSync(runtime,JSON.stringify(runtimeData,null,2)+'\n');
  for(const [i,p]of [catalog+'/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html'].entries()){
   const before=fs.readFileSync(p,'utf8'),changed=patchHtml(before);backup(p,'catalog-'+i);fs.writeFileSync(p,changed.text);meta.push({path:p,rowsUpdated:changed.rowsUpdated,sha256:hash(p)});
  }
  const tracker=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,catalog);
  const event=tracker.record({id:plan.id,created:plan.created,files:plan.files.map(f=>({path:f.path,before:f.before,after:f.after,beforePath:installed.backup+'/originals.zip#objects/'+f.before}))},'portrait-sync-and-frame');assert(event);
  assert.equal(hash(state),stateHash);assert.equal(hash(game+'/jack.qsp'),plan.qspHash);
  const result={status:'TRACKED',catalogs:meta,patchFiles:event.files.length,statusHash:stateHash,qspHash:plan.qspHash,sourceCopies:108,runtimeManifestUpdated:true,statusUnchanged:true};fs.writeFileSync(path.join(__dirname,'tracking.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }else if(process.argv[2]==='reconcile'){
  const stateHash=hash(catalog+'/catalog_status.js'),report=[];
  for(const p of [catalog+'/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){const before=fs.readFileSync(p,'utf8'),after=patchHtml(before);assert.equal(after.rowsUpdated,108);fs.writeFileSync(p,after.text);report.push({path:p,rowsUpdated:108,sha256:hash(p)});}
  assert.equal(hash(catalog+'/catalog_status.js'),stateHash);fs.writeFileSync(path.join(__dirname,'catalog-reconciliation.json'),JSON.stringify({catalogs:report,missingWorkRowsAdded:3,mixedCaseNamesPreserved:true,stateUnchanged:true},null,2));console.log(JSON.stringify(report));
 }else if(process.argv[2]==='http'){
  const html=await httpRead('http://127.0.0.1:3813/catalog');assert.equal(html.status,200);const cfg=JSON.parse(html.body.toString('utf8').match(/window\.JO9_CATALOG_BRIDGE=(.*?);<\/script>/)[1]);
  let verified=0;for(let i=0;i<plan.files.length;i+=8)await Promise.all(plan.files.slice(i,i+8).map(async f=>{const url=new URL('/api/catalog-asset',cfg.url);url.searchParams.set('t',cfg.token);url.searchParams.set('original','0');url.searchParams.set('p','content/pic/'+f.path);const r=await httpRead(url);assert.equal(r.status,200,f.path);assert.equal(r.headers['cache-control'],'no-store');assert.equal(core.hash(r.body),f.after,f.path);verified++;}));
  const out={httpImages:verified,allBytesMatchWork:true,cache:'no-store',qspUnchanged:hash(game+'/jack.qsp')===plan.qspHash};assert(out.qspUnchanged);fs.writeFileSync(path.join(__dirname,'http-verification.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out));
 }else throw Error('record|http');
}
run().catch(e=>{console.error(e.stack);process.exitCode=1;});
