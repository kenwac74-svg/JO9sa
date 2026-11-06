'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa',original='G:/somi/JO9O/game';
const dims=JSON.parse(fs.readFileSync(__dirname+'/image-validation.json'));assert.equal(dims.verified,807);assert.equal(dims.status,'PASS');
const statusPath=game+'/modtools/catalog/catalog_status.js',status=fs.readFileSync(statusPath),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const dre=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/,reports=[];
for(const filename of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const before=fs.readFileSync(filename,'utf8'),m=before.match(dre);assert.ok(m);
 const rows=JSON.parse(m[1]),by=new Map(rows.map((r,i)=>[r[0].replaceAll('\\','/').toLowerCase(),i]));
 let text=m[1],updated=0,added=0;
 for(const f of dims.files){
  const idx=by.get(f.runtimePath.toLowerCase());
  if(idx!==undefined){
   const old=rows[idx],next=[...old];next[3]=f.bytes;next[5]=f.width;next[6]=f.height;
   if(JSON.stringify(old)!==JSON.stringify(next)){const needle=JSON.stringify(old);assert.equal(text.split(needle).length-1,1);text=text.replace(needle,JSON.stringify(next));updated++;}
  }else{
   const p=original+'/'+f.runtimePath,has=fs.existsSync(p),same=has&&hash(fs.readFileSync(p))===hash(fs.readFileSync(game+'/'+f.runtimePath));
   const row=[f.runtimePath.replaceAll('/','\\'),has?(same?'o':'r'):'a','etc',f.bytes,has?fs.statSync(p).size:0,f.width,f.height,''];
   const end=text.lastIndexOf(']');text=text.slice(0,end)+','+JSON.stringify(row)+text.slice(end);added++;
  }
 }
 const after=before.replace(m[1],()=>text);assert.equal(before.replace(dre,'__ROWS__'),after.replace(dre,'__ROWS__'));
 for(const js of after.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(js[1].trim())new Function(js[1]);
 const tmp=filename+'.release-catalog.tmp';assert.ok(!fs.existsSync(tmp));fs.writeFileSync(tmp,after);fs.renameSync(tmp,filename);
 reports.push({path:filename,updatedExistingMetadata:updated,addedWorkPaths:added,otherHtmlPreserved:true});
}
assert.ok(status.equals(fs.readFileSync(statusPath)));
const report={status:'PASS',catalogs:reports,userTagsPreserved:true,checkedImagePaths:807};
for(const f of [__dirname+'/catalog-refresh.json',repo+'/records/release-patch-20261105/catalog-refresh.json'])fs.writeFileSync(f,JSON.stringify(report,null,2)+'\n');
fs.copyFileSync(__filename,repo+'/records/release-patch-20261105/refresh-catalog.cjs');
fs.copyFileSync(__dirname+'/image-validation.json',repo+'/records/release-patch-20261105/image-validation.json');
console.log(JSON.stringify(report));
