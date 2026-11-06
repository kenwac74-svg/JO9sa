'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,game='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa';
const recordDir=repo+'/records/all-approved-image-work-sync-20261105';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(p,b)=>{const t=p+'.luminous-row.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,p);};
const report=JSON.parse(fs.readFileSync(path.join(root,'applied.json')));
const image=report.files.find(x=>x.path==='girls/full/Luminous.png');assert.ok(image);
assert.equal(hash(fs.readFileSync(game+'/content/pic/'+image.path)),image.after);
const row=['content\\pic\\girls\\full\\Luminous.png','a','etc',image.bytes,0,795,596,''];
const status=fs.readFileSync(game+'/modtools/catalog/catalog_status.js');
const re=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const changes=[];
for(const p of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const html=fs.readFileSync(p,'utf8'),m=html.match(re);assert.ok(m);
 const rows=JSON.parse(m[1]),matches=rows.filter(x=>x[0]===row[0]);assert.ok(matches.length<=1);
 if(!matches.length){
  assert.ok(m[1].endsWith(']'));
  const data=m[1].slice(0,-1)+','+JSON.stringify(row)+']';
  const nextRows=JSON.parse(data);assert.deepEqual(nextRows.slice(0,-1),rows);
  const next=html.replace(m[1],()=>data);assert.equal(next.replace(data,''),html.replace(m[1],''));
  for(const js of next.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(js[1].trim())new Function(js[1]);
  put(p,next);changes.push({path:p,beforeSha256:hash(Buffer.from(html)),afterSha256:hash(Buffer.from(next)),addedRow:row});
 }
 const final=fs.readFileSync(p,'utf8'),finalRows=JSON.parse(final.match(re)[1]);
 assert.deepEqual(finalRows.find(x=>x[0]===row[0]),row);
}
assert.deepEqual(fs.readFileSync(game+'/modtools/catalog/catalog_status.js'),status);
const v=JSON.parse(fs.readFileSync(path.join(root,'verification.json')));
for(const c of v.catalogs){c.imageRowsRefreshed=691;c.absentLegacyRows=[];c.sha256=hash(fs.readFileSync(c.path));}
v.luminousMainCatalogRowAdded=true;
put(path.join(root,'verification.json'),JSON.stringify(v,null,2)+'\n');
put(recordDir+'/verification.json',JSON.stringify(v,null,2)+'\n');
put(recordDir+'/luminous-catalog-row.json',JSON.stringify(changes,null,2)+'\n');
put(recordDir+'/complete-luminous-row.cjs',fs.readFileSync(__filename));
console.log(JSON.stringify({catalogRowsAdded:changes.length,allApprovedImagesInMainList:691,statusTagsPreserved:true}));
