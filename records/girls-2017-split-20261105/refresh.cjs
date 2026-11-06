'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,local=path.resolve(root,'../girls-checklist-20261104');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',record=repo+'/records/girls-2017-split-20261105';
const plan=JSON.parse(fs.readFileSync(root+'/plan.json')),manifest=JSON.parse(fs.readFileSync(local+'/manifest.json'));
assert.equal(manifest.qspSha,plan.candidate);assert.equal(manifest.errors.length,0);
const old=manifest.characters.find(c=>c.id===2017),next=manifest.characters.find(c=>c.id===2340);
assert.ok(old&&next);assert.equal(next.json,'json/slaves/2340.json');assert.equal(next.random,true);
assert.deepEqual(next.assets.slice().sort(),plan.images.map(f=>f.target).sort());
assert.ok(old.assets.every(p=>!p.includes('2017_black_long_milf')));
assert.equal(next.missingRefs.length,0);assert.equal(manifest.compatibilityAliases.length,4);
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.split2340.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,p);};
const block=/<!-- JO9 GIRLS CHECKLIST START 20261104 -->[\s\S]*?<!-- JO9 GIRLS CHECKLIST END 20261104 -->/g;
const payload=fs.readFileSync(local+'/catalog.updated.html','utf8').match(block);assert.equal(payload.length,1);
const status=fs.readFileSync(game+'/modtools/catalog/catalog_status.js');
const catalogs=[];
for(const file of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const html=fs.readFileSync(file,'utf8');assert.equal((html.match(block)||[]).length,1);
 let updated=html.replace(block,()=>payload[0]);assert.equal(updated.replace(block,''),html.replace(block,''));
 const dre=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/,match=updated.match(dre);assert.ok(match);
 const rows=JSON.parse(match[1]),before=JSON.stringify(rows),added=[];
 for(const f of plan.images){const rel='content/pic/'+f.target;assert.ok(!rows.some(r=>r[0].replaceAll('\\','/').toLowerCase()===rel.toLowerCase()));const row=[rel.replaceAll('/','\\'),'a','etc',f.bytes,0,f.width,f.height,''];rows.push(row);added.push(row[0]);}
 assert.equal(JSON.stringify(rows.slice(0,-4)),before);
 updated=updated.replace(match[1],()=>JSON.stringify(rows));
 for(const s of updated.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(s[1].trim())new Function(s[1]);
 put(file,updated);catalogs.push({file,addedRows:added,existingRowsAndTagsPreserved:true});
}
put(game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html',fs.readFileSync(local+'/JO9_캐릭터_이미지체크리스트.html'));
for(const name of ['manifest.json','build_inventory.py','build_pages.py','catalog-girls-checklist.js'])put(repo+'/tools/girls-image-checklist/'+name,fs.readFileSync(local+'/'+name));
assert.ok(status.equals(fs.readFileSync(game+'/modtools/catalog/catalog_status.js')));
const runtime=JSON.parse(fs.readFileSync(repo+'/assets/runtime-source-2.4.1.json')),map=new Map(runtime.files.map(f=>[f.runtimePath,f]));
for(const f of plan.images)for(const rel of [f.old,f.target]){
 const rp='content/pic/'+rel;assert.equal(c.hash(fs.readFileSync(game+'/'+rp)),f.sha256);assert.equal(c.hash(fs.readFileSync(repo+'/assets/'+rp)),f.sha256);assert.equal(map.get(rp).sha256,f.sha256);
}
assert.equal(c.hash(fs.readFileSync(game+'/json/slaves/2017.json')),plan.old2017JsonSha256);
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),plan.candidate);assert.equal(c.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),plan.candidate);
const result={newId:2340,oldId:2017,newAssets:next.assets,oldActiveAssets:old.assets,oldCompatibilityPaths:manifest.compatibilityAliases.length,newCharacterRandom:true,newJsonReferencesAllExist:true,old2017JsonUnchanged:true,sourceAndWorkHashesMatch:true,userTagsPreserved:true,checklistErrors:manifest.errors,catalogs,fullTouched:false};
put(root+'/verification.json',JSON.stringify(result,null,2)+'\n');put(record+'/verification.json',JSON.stringify(result,null,2)+'\n');put(record+'/refresh.cjs',fs.readFileSync(__filename));
fs.unlinkSync(local+'/catalog.updated.html');
console.log(JSON.stringify(result,null,2));
