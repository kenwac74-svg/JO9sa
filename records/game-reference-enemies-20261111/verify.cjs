'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root='G:/somi/JO9sa/tools/game-reference',record='G:/somi/JO9sa/records/game-reference-enemies-20261111',target='G:/somi/Jack O Nine Tails v2.4_work/game/modtools/game-reference';
const before=JSON.parse(fs.readFileSync(path.join(record,'before.json')));
const readData=file=>JSON.parse(fs.readFileSync(file,'utf8').match(/<script id="reference-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const old=readData(path.join(before.backup,'jo9-reference.html')),data=readData(path.join(root,'jo9-reference.html'));
for(const key of Object.keys(old))assert.deepEqual(data[key],old[key],'Existing reference section changed: '+key);
const audit=JSON.parse(fs.readFileSync('G:/somi/JO9sa/records/catfight-successor-planning-20261111/enemy-traits.json'));
const enemies=data.enemies;
assert.equal(enemies.hash,audit.qspSha256);assert.equal(enemies.rows.length,70);assert.equal(enemies.auditCurrent,true);
assert.equal(enemies.rows.reduce((n,e)=>n+e.attacks.length,0),155);assert.equal(enemies.rows.reduce((n,e)=>n+e.supers.length,0),30);
for(const e of enemies.rows){const original=audit.enemies.find(o=>o.id===e.id);assert(original,e.id);assert.deepEqual(e.stats,['базовое_здоровье','базовая_выносливость','базовый_дух','базовый_вред'].map(k=>original.fields[k]));assert.deepEqual(e.flagKeys,Object.entries(original.fields).filter(([k,v])=>['хрупкий','тонкое_тело','бессмертный','безустали','бесстрашный'].includes(k)&&v===1).map(([k])=>k));}
assert.equal(enemies.rows.find(e=>e.id==='исчадие_арены').resistanceDefined,false);
assert(enemies.rows.find(e=>e.id==='крысолюд').warnings.some(s=>s.includes('ё')));
assert(enemies.rows.find(e=>e.id==='безумный_архимаг').aiMissing);
assert(enemies.rows.find(e=>e.id==='vatican_paladin').resistance.includes('참격 -10'));
const hash=p=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
for(const p of before.protected){
 if(path.basename(p.path)==='jack.qsp'&&hash(p.path)!==p.hash)assert.equal(hash(p.path),process.argv[2],'An explicitly verified approved QSP hash is required');
 else assert.equal(hash(p.path),p.hash,'Protected file changed: '+p.path);
}
const snapshotPath=path.join(root,'snapshot.json'),snapshot=JSON.parse(fs.readFileSync(snapshotPath));
snapshot.enemyDataCreated=new Date().toISOString();snapshot.enemySourceQspSha256=enemies.hash;snapshot.enemies=enemies.rows.length;snapshot.normalEnemyAttacks=155;snapshot.specialEnemyAttacks=30;
snapshot.files=fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isFile()&&e.name!=='snapshot.json').sort((a,b)=>a.name.localeCompare(b.name)).map(e=>({file:e.name,sha256:hash(path.join(root,e.name)),bytes:fs.statSync(path.join(root,e.name)).size}));
fs.writeFileSync(snapshotPath,JSON.stringify(snapshot,null,2)+'\n');
assert(fs.statSync(target).isDirectory());
const installed=[];
for(const name of ['jo9-reference.html','README.md','snapshot.json']){
 const dest=path.join(target,name),backup=path.join(before.backup,'installed-'+name);
 if(!fs.existsSync(backup)&&fs.existsSync(dest))fs.copyFileSync(dest,backup);
 fs.copyFileSync(path.join(root,name),dest);assert.equal(hash(dest),hash(path.join(root,name)));installed.push(name);
}
const result={existingReferencePreserved:before.baseCounts,enemies:70,normalAttacks:155,specialAttacks:30,sourceHash:enemies.hash,personalIdeaFilesPreserved:true,approvedQspChange:process.argv[2]||null,installed};
fs.writeFileSync(path.join(record,'validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
