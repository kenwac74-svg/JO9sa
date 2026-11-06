'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,local=path.resolve(root,'../girls-checklist-20261104'),repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const record=repo+'/records/girls-2071-split-20261105',plan=JSON.parse(fs.readFileSync(root+'/plan.json')),manifest=JSON.parse(fs.readFileSync(local+'/manifest.json'));
assert.equal(manifest.qspSha,plan.candidate);assert.equal(manifest.errors.length,0);
const rowsById=new Map(manifest.characters.map(x=>[x.id,x]));
for(const [id,stem] of [[2071,'2071_brown_long_milf'],[2324,'2324_blue_short_milf'],[2340,'2340_blond_short_milf']]){
 const row=rowsById.get(id);assert.ok(row&&row.random&&row.portraitComplete);assert.equal(row.refs.fullimage,'girls/full/'+stem+'.png');assert.equal(row.missingRefs.length,0);
 assert.ok(row.assets.every(p=>!p.includes('2071_blond_short')&&!p.includes('2071_blue_short')));
}
assert.equal(rowsById.get(2340).assets.length,4);assert.equal(manifest.compatibilityAliases.length,6);assert.ok(!rowsById.has(2341));
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.split2071.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,p);};
const statusPath=game+'/modtools/catalog/catalog_status.js',status=fs.readFileSync(statusPath);
const block=/<!-- JO9 GIRLS CHECKLIST START 20261104 -->[\s\S]*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->/g;
const payload=fs.readFileSync(local+'/catalog.updated.html','utf8').match(block);assert.equal(payload.length,1);
const catalogs=[];
for(const file of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const html=fs.readFileSync(file,'utf8');assert.equal((html.match(block)||[]).length,1);let next=html.replace(block,()=>payload[0]);assert.equal(next.replace(block,''),html.replace(block,''));
 const match=next.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);assert.ok(match);
 const rows=JSON.parse(match[1]),before=JSON.stringify(rows);
 for(const f of plan.images){const rel='content/pic/'+f.target;assert.ok(!rows.some(r=>r[0].replaceAll('\\','/').toLowerCase()===rel.toLowerCase()));rows.push([rel.replaceAll('/','\\'),'a','etc',f.bytes,0,f.width,f.height,'']);}
 assert.equal(JSON.stringify(rows.slice(0,-4)),before);next=next.replace(match[1],()=>JSON.stringify(rows));
 for(const s of next.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(s[1].trim())new Function(s[1]);
 put(file,next);catalogs.push({path:file,newRows:4,existingRowsAndTagsPreserved:true});
}
put(game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html',fs.readFileSync(local+'/JO9_캐릭터_이미지체크리스트.html'));
for(const f of ['manifest.json','build_inventory.py','build_pages.py','catalog-girls-checklist.js'])put(repo+'/tools/girls-image-checklist/'+f,fs.readFileSync(local+'/'+f));
assert.ok(status.equals(fs.readFileSync(statusPath)));
const runtime=JSON.parse(fs.readFileSync(repo+'/assets/runtime-source-2.4.1.json')),rm=new Map(runtime.files.map(f=>[f.runtimePath,f]));
for(const f of plan.images)for(const rel of [f.old,f.target]){const rp='content/pic/'+rel;assert.equal(c.hash(fs.readFileSync(game+'/'+rp)),f.sha256);assert.equal(c.hash(fs.readFileSync(repo+'/assets/'+rp)),f.sha256);assert.equal(rm.get(rp).sha256,f.sha256);}
for(const [id,hash]of Object.entries(plan.protectedJson))assert.equal(c.hash(fs.readFileSync(game+'/json/slaves/'+id+'.json')),hash);
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),plan.candidate);assert.equal(c.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),plan.candidate);
const ledger=fs.readFileSync(game+'/modtools/catalog/image_work/personal-patch/events.jsonl','utf8').trim().split('\n').map(JSON.parse),event=ledger.find(e=>e.id===plan.id);assert.ok(event&&event.files.length===4);
for(const f of event.files)assert.equal(c.hash(fs.readFileSync(game+'/modtools/catalog/image_work/personal-patch/objects/'+f.after)),f.after);
const verification={activeSets:[2071,2324,2340].map(id=>({id,full:rowsById.get(id).refs.fullimage,assets:rowsById.get(id).assets,missingRefs:rowsById.get(id).missingRefs})),newDefinitions:1,newCanonicalImages:4,existingBlueDefinitionPreserved:true,old2017Unchanged:true,old2071BrownUnchanged:true,compatibilityAddresses:6,checklistErrors:[],userTagsPreserved:true,workTrackedAndIndexHashesMatch:true,personalPatchVerified:true,catalogs,fullTouched:false,visualQA:'Image identity inspected; actual in-game old-save GUI and random encounters await user confirmation.'};
put(root+'/verification.json',JSON.stringify(verification,null,2)+'\n');put(record+'/verification.json',JSON.stringify(verification,null,2)+'\n');put(record+'/refresh.cjs',fs.readFileSync(__filename));fs.unlinkSync(local+'/catalog.updated.html');
console.log(JSON.stringify(verification,null,2));
