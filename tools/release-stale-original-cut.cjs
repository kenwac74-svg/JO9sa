'use strict';
// Scoped repair: release a virtual original B only when its archive flag is off.
// Actual A/B files and the read-only original tree are never written.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project='C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa',game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game';
const catalogRoot=project+'/tools/local-workspace/catalog',runtime=project+'/tools/local-workspace/runtime';
const catalog=require(project+'/tools/text-workshop/catalog.cjs').create(catalogRoot),cuts=require(project+'/tools/text-workshop/image-cuts.cjs').create(game,catalogRoot,catalog,runtime);
const core=require('./cut-addition/core.cjs'),base=process.argv[2];
assert.ok(/^(bg|characters|scene|reserve)\/.+\.png$/.test(base)&&!base.includes('..')&&!/ \(\d+\)\.png$/.test(base),'Base PNG path required');
const meta=catalog.meta('content/pic/'+base);assert.ok(meta,'Catalog entry missing');assert.ok(!meta.flags.includes('spare'),'Archive is selected: keep B');
const manifestPath=game+'/modtools/image-original-cuts.json',prior=fs.readFileSync(manifestPath),manifest=JSON.parse(prior),key=base.toLowerCase(),entry=manifest.originals[key]||manifest.reservations[key];assert.ok(entry,'No original B reservation to release');assert.equal(entry.base,base);
assert.ok(!fs.existsSync(game+'/content/pic/'+entry.alias),'A physical B exists: do not release');
const id='release_stale_B_'+new Date().toISOString().replace(/[:.]/g,'-'),backup=runtime+'/original-cut-history/'+id;fs.mkdirSync(backup,{recursive:true});
const qspPath=game+'/jack.qsp',qspBefore=fs.readFileSync(qspPath),htmlPath=catalogRoot+'/catalog_merge_vs_original.html',htmlBefore=fs.readFileSync(htmlPath);
fs.writeFileSync(backup+'/image-original-cuts.before.json',prior);fs.writeFileSync(backup+'/jack.before.qsp',qspBefore);fs.writeFileSync(backup+'/catalog.before.html',htmlBefore);
const aPath=game+'/content/pic/'+base,aHash=core.hash(fs.readFileSync(aPath));
delete manifest.originals[key];delete manifest.reservations[key];
try{
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 const qsp=cuts.refresh(id),html=htmlBefore.toString('utf8'),m=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/),rows=JSON.parse(m[1]);
 const alias='content/pic/'+entry.alias,kept=rows.filter(d=>!(d[0].replaceAll('\\','/')===alias&&d[2]==='orig'));
 fs.writeFileSync(htmlPath,html.replace(m[1],JSON.stringify(kept)));catalog.load();
 assert.equal(core.hash(fs.readFileSync(aPath)),aHash);assert.equal(cuts.info(base).next,base.replace('.png',' (2).png'));
 const before=core.parse(qspBefore),after=core.parse(fs.readFileSync(qspPath)),loc=before.locations.find(l=>l.name==='interior_change');assert.equal(before.lines.length,after.lines.length);for(let i=0;i<before.lines.length;i++)if(i!==loc.body)assert.equal(after.lines[i],before.lines[i]);
 const report={base,released:entry.alias,next:cuts.info(base).next,removedCatalogRows:rows.length-kept.length,archiveSelected:false,physicalB:false,aUnchanged:true,qsp,backup};fs.writeFileSync(backup+'/repair.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){fs.writeFileSync(manifestPath,prior);fs.writeFileSync(qspPath,qspBefore);fs.writeFileSync(htmlPath,htmlBefore);throw e;}
