'use strict';
// Scoped derivative-catalog update. Never writes QSP, images, saves or check/ID state.
const fs=require('fs'),path=require('path'),a=require('assert/strict'),vm=require('vm'),z=require('zlib');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T=__dirname;
const REC=R+'/records/colosseum-survival-cut-20261031/catalog';
const core=require(R+'/tools/text-workshop/core.cjs'),scenes=require(R+'/tools/text-workshop/scenes.cjs'),{build}=require(R+'/tools/scene-image-conditions/analyse.cjs');
const wanted=['coldef3.png'].map(n=>'content/pic/scene/'+n);
const catalogs=[G+'/modtools/catalog/catalog_merge_vs_original.html',R+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html'];
const protectedPaths=[G+'/jack.qsp',...catalogs.flatMap(p=>['catalog_status.js','catalog_work_ids.json'].map(n=>path.join(path.dirname(p),n)))];
const read=p=>fs.readFileSync(p),sha=p=>core.hash(read(p)),j=p=>JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,''));
const norm=p=>p.replaceAll('\\','/').toLowerCase();
const rowRx=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const blockRx=/<!-- JO9_SCENE_CONDITIONS_START -->[\s\S]*?<!-- JO9_SCENE_CONDITIONS_END -->/g;
function scripts(html,file){let n=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(m[1])){new vm.Script(m[2],{filename:file});n++;}return n;}
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);a(!fs.lstatSync(f).isSymbolicLink(),f);if(e.isDirectory())out.push(...walk(f));else if(e.isFile())out.push(f);}return out;}
function data(html){const m=html.match(rowRx);a(m,'catalog D rows');return {m,rows:JSON.parse(m[1])};}
function split(html){const d=data(html);return html.replace(d.m[1],'__JO9_D_ROWS__').replace(blockRx,'__JO9_SCENE_CONDITIONS__');}
function atomic(file,raw){const tmp=file+'.survival-catalog-stage';a(!fs.existsSync(tmp),tmp);fs.writeFileSync(tmp,raw,{flag:'wx'});fs.renameSync(tmp,file);}
function prepare(){
 const preserved=protectedPaths.map(p=>({path:p,sha256:sha(p)}));
 const idBaselines=protectedPaths.filter(p=>p.endsWith('catalog_work_ids.json')).map((p,i)=>{const copy=T+'/ids-before-'+i+'.json';fs.copyFileSync(p,copy);return {path:p,copy};});
 const raw=read(G+'/jack.qsp'),doc=core.parse(raw);a(core.serialize(doc).equals(raw));
 const inputImages=wanted.map(p=>{const raw=read(G+'/'+p);a.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a',p);a.equal(raw.readUInt32BE(16),795,p);a.equal(raw.readUInt32BE(20),596,p);return {path:p,bytes:raw.length,sha256:core.hash(raw),width:795,height:596};});
 const inventory=walk(G+'/content/pic/scene').filter(p=>/\.(png|gif|jpe?g|webp)$/i.test(p)).map(p=>({path:path.relative(G,p).replaceAll('\\','/'),bytes:fs.statSync(p).size,mtimeMs:fs.statSync(p).mtimeMs}));
 const external=[],menuIds={};
 function inspect(x,source,key){if(typeof x==='string'&&/^(?:content[\\/]pic[\\/])?scene[\\/]/i.test(x))external.push({source,path:/^content/i.test(x)?x:'content/pic/'+x,note:'JSON 등록: '+key+' · 실제 소비 경로는 별도 확인이 필요합니다.'});else if(typeof x==='number'&&key)menuIds[key.split('.').at(-1)]=x;else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x))inspect(v,source,key?key+'.'+k:k);}
 for(const f of walk(G+'/json').filter(p=>/\.json$/i.test(p)))inspect(j(f),path.relative(G,f).replaceAll('\\','/'),'');
 for(const f of walk(G+'/css').filter(p=>/\.css$/i.test(p))){const css=read(f).toString('utf8').replace(/\/\*[\s\S]*?\*\//g,'');for(const m of css.matchAll(/url\(['"]?(?:\.\.\/)?((?:content\/pic\/)?scene\/[^)'"\s]+)['"]?\)/gi))external.push({source:path.relative(G,f).replaceAll('\\','/'),path:m[1].startsWith('content/')?m[1]:'content/pic/'+m[1],line:css.slice(0,m.index).split('\n').length,note:'CSS 이미지 참조입니다. 해당 선택자의 화면 표시 조건은 별도 확인이 필요합니다.'});}
 const metadata=build({doc,core,scenes,files:inventory.map(x=>x.path),menuIds,external});metadata.generatedAt=new Date().toISOString();metadata.inventory=inventory;
 for(const p of wanted){const e=metadata.entries[norm(p)];a(e,p);a.equal(e.status,'direct',p+' direct reference');a(e.references.some(r=>r.location==='interaction_city'),p+' interaction_city reference');}
 const ui=read(R+'/tools/scene-image-conditions/catalog-scene-conditions.js').toString('utf8');
 const block='<!-- JO9_SCENE_CONDITIONS_START -->\n<script>window.JO9_SCENE_CONDITIONS='+JSON.stringify(metadata).replaceAll('<','\\u003c')+';</script>\n<script>\n'+ui+'\n</script>\n<!-- JO9_SCENE_CONDITIONS_END -->';
 const outputs=catalogs.map((file,i)=>{const raw=read(file),html=raw.toString('utf8'),{m,rows}=data(html);a.equal((html.match(blockRx)||[]).length,1,'existing conditions block');const known=new Set(rows.map(r=>norm(r[0])));for(const p of wanted)a(!known.has(norm(p)),'Already registered: '+p);const added=inputImages.map(x=>[x.path.replaceAll('/','\\'),'a','new',x.bytes,0,795,596,'']);const nextRows=[...rows,...added];const next=html.replace(m[1],()=>JSON.stringify(nextRows)).replace(blockRx,()=>block);a.deepEqual(data(next).rows.slice(0,rows.length),rows);a.deepEqual(data(next).rows.slice(rows.length),added);a.equal(split(next),split(html),'unrelated HTML changed');const scriptCount=scripts(next,file),candidate=T+'/catalog-'+i+'.html';fs.writeFileSync(candidate,next);return {file,candidate,before:core.hash(raw),after:core.hash(Buffer.from(next)),oldRows:rows.length,newRows:nextRows.length,scriptCount,added:wanted};});
 fs.writeFileSync(T+'/metadata.json',JSON.stringify(metadata,null,2)+'\n');
 const v={id:'COLOSSEUM_SURVIVAL_CUT_CATALOG_20261031',created:new Date().toISOString(),repo:R,game:G,tmp:T,record:REC,qspSha256:doc.hash,inputImages,preserved,idBaselines,catalogs:outputs,metadata:{total:metadata.total,counts:metadata.counts,unresolved:metadata.unresolved.length},newConditions:Object.fromEntries(wanted.map(p=>[p,metadata.entries[norm(p)]]))};
 a.equal(sha(G+'/jack.qsp'),doc.hash);fs.writeFileSync(T+'/generation.json',JSON.stringify(v,null,2)+'\n');console.log(JSON.stringify({prepared:true,qsp:v.qspSha256,rowsAdded:wanted.length,catalogs:outputs.map(x=>({before:x.oldRows,after:x.newRows})),conditions:Object.fromEntries(wanted.map(p=>[p,{status:metadata.entries[norm(p)].status,references:metadata.entries[norm(p)].references.length}]))}));
}
function checkIds(v){return v.idBaselines.map(x=>{const before=j(x.copy),now=j(x.path);for(const [key,val]of Object.entries(before.items))a.deepEqual(now.items[key],val,'Existing work ID changed: '+key);const added=Object.entries(now.items).filter(([k])=>!Object.hasOwn(before.items,k));for(const [key]of added)a(wanted.some(p=>norm(p)===norm(key)),'Unexpected new work ID: '+key);for(const key of Object.keys(now))if(!['items','counters'].includes(key))a.deepEqual(now[key],before[key],key);const categories=new Map();for(const [key,val]of added){a(!Object.values(before.items).includes(val),'Duplicate new work ID');const cat=String(val).split('-')[0];categories.set(cat,(categories.get(cat)||0)+1);}for(const key of new Set([...Object.keys(before.counters||{}),...Object.keys(now.counters||{})]))a.equal(now.counters[key]||0,(before.counters[key]||0)+(categories.get(key)||0),'Unexpected ID counter: '+key);return {path:x.path,existingIds:Object.keys(before.items).length,existingIdsPreserved:true,newIds:added};});}
function apply(){
 const v=j(T+'/generation.json');a(!fs.existsSync(REC),'record exists');
 a.equal(sha(G+'/jack.qsp'),v.qspSha256);checkIds(v);for(const x of v.inputImages)a.equal(sha(G+'/'+x.path),x.sha256,x.path);
 for(const x of v.catalogs){a.equal(sha(x.file),x.before,x.file);a.equal(sha(x.candidate),x.after,x.candidate);scripts(read(x.candidate).toString('utf8'),x.candidate);}
 const backup='G:/somi/JO9_work_backups/colosseum-survival-cut-20261031/catalog';a(!fs.existsSync(backup),'backup exists');fs.mkdirSync(backup,{recursive:true});
 for(const [i,x]of v.catalogs.entries()){const raw=read(x.file),p=backup+'/catalog-'+i+'.html.gz';fs.writeFileSync(p,z.gzipSync(raw,{level:9}),{flag:'wx'});a(z.gunzipSync(read(p)).equals(raw));}
 for(const x of v.catalogs)atomic(x.file,read(x.candidate));
 a.equal(sha(G+'/jack.qsp'),v.qspSha256);const idVerification=checkIds(v);for(const x of v.catalogs)a.equal(sha(x.file),x.after,x.file);for(const x of v.inputImages)a.equal(sha(G+'/'+x.path),x.sha256,x.path);
 fs.mkdirSync(REC,{recursive:true});for(const name of ['generation.json','metadata.json'])fs.copyFileSync(T+'/'+name,REC+'/'+name);fs.copyFileSync(__filename,REC+'/refresh.cjs');
 const result={status:'PASS',id:v.id,qspSha256:v.qspSha256,addedPaths:wanted,catalogs:v.catalogs.map(x=>({path:x.file,oldRows:x.oldRows,newRows:x.newRows,sha256:x.after,inlineScriptsChecked:x.scriptCount})),metadata:v.metadata,protected:v.preserved.map(x=>({...x,after:sha(x.path),unchanged:sha(x.path)===x.sha256})),idVerification,backup,imagesUnchanged:true,qspUnchanged:true,statusAndIdsWritten:false,fullModtoolsChanged:false,guiReplay:false,limits:['Static source conditions, not a full playthrough.','No catalog_status.js or stable work-ID regeneration was performed.']};
 fs.writeFileSync(REC+'/verification.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync(REC+'/REPORT_KO.md','# 콜로세움 생존 후송 컷신 목록 등록\n\nWORK와 portable seed 이미지 목록에 coldef3.png 한 항목을 추가하고 최신 WORK QSP·JSON·CSS·scene 목록으로 등장 조건을 다시 분석했다. 원본 795×596 PNG의 실제 runtime 복사본을 등록했으며 기존 D행과 조건 블록 외 HTML은 보존했다.\n\n두 목록 인라인 JavaScript 문법, 지정1행만 추가됨, 최신 QSP 해시 및 interaction_city 직접 참조, PNG 치수·파일 해시 보존과 기존 안정 ID 보존을 검사했다. 이 하위 작업은 QSP·이미지·세이브·체크 상태·안정 ID를 쓰지 않았고 Full 메타데이터도 수정하지 않았다. 정적 조건 분석 및 HTTP 제공 검사이며 게임 플레이 검사는 포함하지 않는다. 전체 metadata.json 사본은 검증 후 정리하고 이번 경로 조건은 generation.json에 보존한다.\n\n복구본: '+backup+'\n');
 console.log(JSON.stringify({installed:true,rowsAdded:wanted.length,catalogs:2,qspUnchanged:true,statusAndIdsWritten:false,record:REC}));
}
const mode=process.argv[2];if(mode==='prepare')prepare();else if(mode==='apply')apply();else throw Error('Use prepare or apply');
