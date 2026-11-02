'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',record=repo+'/records/mob-background-contexts-20261029';
const data=JSON.parse(fs.readFileSync(repo+'/tools/mob-image-sets/background-contexts.json'));
const before=JSON.parse(fs.readFileSync(record+'/before-mob-manifest.json'));
const html=fs.readFileSync(work+'/modtools/catalog/catalog_merge_vs_original.html','utf8');
const rx=/window\.JO9_MOB_SETS\s*=\s*(\{.*?\});\s*<\/script>/s,m=JSON.parse(html.match(rx)[1]);
const raw=fs.readFileSync(work+'/jack.qsp'),d=c.parse(raw),bodies=new Map(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5).split(/\r?\n/)]));
assert.equal(c.hash(raw),data.source.sha256);assert.equal(data.entries.length,78);assert.equal(data.groups.length,8);
let evidenceCount=0;for(const row of [...data.entries,...data.groups])for(const ctx of row.appearanceContexts)for(const e of ctx.evidence){assert.equal(bodies.get(e.location)?.[e.line-1],e.text,e.location+':'+e.line);evidenceCount++;}
for(const r of [...data.entries,...data.groups])assert(r.appearanceContexts.length&&r.appearanceContexts.every(x=>x.status==='verified-static-qsp'));
for(const list of ['entries','groups'])for(const entry of m[list]){const old=before[list].find(x=>x.key===entry.key),copy=structuredClone(entry);delete copy.appearanceContexts;delete copy.backgroundNotes;assert.deepEqual(copy,old);assert.deepEqual(entry.appearanceContexts,data[list].find(x=>x.key===entry.key).appearanceContexts);}
const paths=[...new Set([...data.entries,...data.groups].flatMap(x=>x.appearanceContexts.flatMap(y=>[y.battleBackground,y.resultBackground,y.sceneBackground].flat().filter(Boolean))))];for(const p of paths)assert(fs.existsSync(work+'/'+p),p);
assert.equal(data.sharedAssets.filter(x=>x.needsContextSplit).length,1);assert.equal(data.sharedAssets.find(x=>x.needsContextSplit).path,'content/pic/mob/spawn_ava.png');
assert(data.entries.find(x=>x.key==='kimerian_e').backgroundNotes.some(t=>t.includes('배경 불일치')));
const js=fs.readFileSync(repo+'/tools/mob-image-sets/catalog-mob-sets.js','utf8'),start=html.indexOf('/* JO9 MOD START MOB_SET_CATALOG_20261028'),end='/* JO9 MOD END MOB_SET_CATALOG_20261028 */',finish=html.indexOf(end,start)+end.length;
assert.equal(html.slice(start,finish).replace(/\r\n/g,'\n').trim(),js.replace(/\r\n/g,'\n').trim());
(async()=>{const response=await fetch('http://127.0.0.1:3813/catalog'),served=await response.text();assert.equal(response.status,200);assert.deepEqual(JSON.parse(served.match(rx)[1]),m);assert(served.includes('function appendBackgroundInfo(card,item)'));
 const report={status:'PASS',checkedAt:'2026-10-29',sourceQspSha256:c.hash(raw),sourceQspUnchanged:true,entries:78,groups:8,evidenceLinesCompared:evidenceCount,allEvidenceMatches:true,backgroundPaths:paths.length,allBackgroundPathsExist:true,existingSlotAndWorkMetadataPreserved:true,sourceAndInlineConsumerMatch:true,servedCatalogMatches:true,browserCheck:{appearanceRows:86,details:86,kimerianBackgroundMismatchVisible:true,spawnSharedPortraitNoteVisible:true,searchRestored:true},scope:'Checklist metadata/display/docs only; no runtime QSP/image/SAV changes; static QSP audit, no game playtest.'};
 fs.writeFileSync(record+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));})();
