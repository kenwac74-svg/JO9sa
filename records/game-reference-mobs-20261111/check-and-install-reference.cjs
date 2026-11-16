'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',root=repo+'/tools/game-reference',record=repo+'/records/game-reference-mobs-20261111',target='G:/somi/Jack O Nine Tails v2.4_work/game/modtools/game-reference';
const hash=p=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
const data=p=>JSON.parse(fs.readFileSync(p,'utf8').match(/<script id="reference-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const before=data(record+'/before/jo9-reference.html'),next=data(root+'/jo9-reference.html');
const previousSnapshot=JSON.parse(fs.readFileSync(target+'/snapshot.json'));
assert.equal(hash(root+'/snapshot.json'),hash(target+'/snapshot.json'),'Installed snapshot drifted');
for(const f of ['jo9-reference.html','README.md'])assert.equal(hash(target+'/'+f),previousSnapshot.files.find(e=>e.file===f)?.sha256,'Installed reference drifted: '+f);
for(const key of Object.keys(before))assert.deepEqual(next[key],before[key],'Existing section changed: '+key);
const expected=JSON.parse(fs.readFileSync(record+'/before.json'));for(const p of expected.protected)assert.equal(hash(p.path),p.sha256,'Protected changed: '+p.path);
assert.equal(next.mobs.definedCount,70);assert.equal(next.mobs.rows.length,71);assert.equal(next.mobs.rows.filter(row=>!row.planned).length,70);
assert.equal(next.mobs.hash,next.enemies.hash);
for(const row of next.enemies.rows){const mob=next.mobs.rows.find(m=>!m.planned&&m.id===row.id);assert(mob);for(const [key,value] of Object.entries(row))assert.deepEqual(mob[key],value,'MOB definition drift: '+row.id+':'+key);}
const chun=next.mobs.rows.find(row=>row.planned);assert.equal(chun.id,'chunhyang');assert.match(chun.state,/미구현/);assert.deepEqual(chun.stats,[200,300,200,15]);assert.match(chun.comparison,/힘 5.*전투 기술 6/);assert(chun.rules.some(s=>s.includes('보통 3개')&&s.includes('하드 6개')));assert(chun.rules.some(s=>s.includes('R<70%')));assert(chun.rules.some(s=>s.includes('CM≤−10')));
const snapshotPath=root+'/snapshot.json',snapshot=JSON.parse(fs.readFileSync(snapshotPath));Object.assign(snapshot,{mobDataCreated:new Date().toISOString(),mobSourceQspSha256:next.mobs.hash,definedMobs:70,plannedMobs:1});snapshot.files=fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isFile()&&e.name!=='snapshot.json').sort((a,b)=>a.name.localeCompare(b.name)).map(e=>({file:e.name,sha256:hash(root+'/'+e.name),bytes:fs.statSync(root+'/'+e.name).size}));fs.writeFileSync(snapshotPath,JSON.stringify(snapshot,null,2)+'\n');
for(const f of ['jo9-reference.html','README.md','snapshot.json']){const installed=target+'/'+f;fs.copyFileSync(root+'/'+f,installed);assert.equal(hash(root+'/'+f),hash(installed));}
const result={pass:true,existingDataSectionsPreserved:Object.keys(before),definedMobs:70,plannedMobs:1,plannedStats:chun.stats,sourceQsp:next.mobs.hash,protectedQspAndPersonalIdeasPreserved:true,sourceAndInstalledMatch:true};fs.writeFileSync(record+'/validation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
