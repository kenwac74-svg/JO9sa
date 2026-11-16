'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const repo='G:/somi/JO9sa',root=repo+'/tools/game-reference',record=repo+'/records/enemy-special-reference-20261111',target='G:/somi/Jack O Nine Tails v2.4_work/game/modtools/game-reference';
const hash=p=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
const readData=p=>JSON.parse(fs.readFileSync(p,'utf8').match(/<script id="reference-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const before=readData(record+'/before/jo9-reference.html'),data=readData(root+'/jo9-reference.html');
for(const key of Object.keys(before).filter(k=>k!=='enemies'))assert.deepEqual(data[key],before[key],key+' reference changed');
const set=data.enemies,specials=set.rows.flatMap(row=>row.supers.map(s=>({performer:row.name,id:row.id,...s})));
assert.equal(set.hash,'21f41a5203fffa565369c81a9fd11f57874f1af99010709ef1af1240e01fdc40');assert.equal(hash('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),set.hash);
assert.equal(set.rows.length,70);assert.equal(specials.length,30);assert.equal(new Set(specials.map(s=>s.name)).size,16);assert(specials.every(s=>s.linkedHard));assert(set.auditCurrent&&set.hardMageFallback);
assert(specials.filter(s=>s.name==='안개적응').every(s=>s.effects.every(e=>e.target==='시전자')));
const rawBefore=JSON.parse(fs.readFileSync(record+'/before/enemy-traits.json')),raw=JSON.parse(fs.readFileSync(repo+'/records/catfight-successor-planning-20261111/enemy-traits.json'));assert.deepEqual(raw.enemies,rawBefore.enemies,'Enemy definitions changed');
const baseline=JSON.parse(fs.readFileSync(record+'/before.json'));for(const p of baseline.protected)assert.equal(hash(p.path),p.sha256,'Personal ideas changed');
const names=require(root+'/enemy-special-names.cjs').SPECIAL_NAMES;for(const s of specials)assert.equal(s.name,names[s.id+':'+s.slot]);
const snapshotPath=root+'/snapshot.json',snapshot=JSON.parse(fs.readFileSync(snapshotPath));Object.assign(snapshot,{enemyDataCreated:new Date().toISOString(),enemySourceQspSha256:set.hash,enemies:70,normalEnemyAttacks:155,specialEnemyAttacks:30,enemySpecialNames:16,hardEnemySpecials:true});snapshot.files=fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isFile()&&e.name!=='snapshot.json').sort((a,b)=>a.name.localeCompare(b.name)).map(e=>({file:e.name,sha256:hash(root+'/'+e.name),bytes:fs.statSync(root+'/'+e.name).size}));fs.writeFileSync(snapshotPath,JSON.stringify(snapshot,null,2)+'\n');
for(const name of ['jo9-reference.html','README.md','snapshot.json']){const dest=target+'/'+name,backup=record+'/before/installed-'+name;if(!fs.existsSync(backup))fs.copyFileSync(dest,backup);fs.copyFileSync(root+'/'+name,dest);assert.equal(hash(dest),hash(root+'/'+name));}
const result={sourceHash:set.hash,otherReferenceSectionsPreserved:true,enemyDefinitionsPreserved:true,personalIdeasPreserved:true,enemies:70,specials:30,commonNames:16,hardLinked:30,hardMageFallback:true,adaptationCasterCorrect:true,sourceAndInstalledMatch:true};fs.writeFileSync(record+'/validation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
