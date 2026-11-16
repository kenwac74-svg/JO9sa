'use strict';
const fs=require('fs'),assert=require('assert/strict'),cp=require('child_process'),zlib=require('zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',temp='G:/Codex/tmp/jo9-cow-costume-20261111',record=repo+'/records/cow-costume-20261111';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const state=json(temp+'/prepared.json'),hash=p=>c.hash(fs.readFileSync(p));
assert.equal(hash(game+'/jack.qsp'),state.before);assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),state.before);
assert(json(temp+'/native/client-results.json').every(x=>x.pass));
fs.mkdirSync(record,{recursive:true});
const wasm=cp.execFileSync(process.execPath,[__dirname+'/cow-costume.test.cjs',temp+'/candidate.qsp'],{windowsHide:true,maxBuffer:1024*1024});
fs.writeFileSync(record+'/wasm-tests.log',wasm);assert(wasm.toString().includes('PASS old-cache'));
const apply=p=>cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',p,'-ModsDir',temp+'/mods'],{windowsHide:true,maxBuffer:4*1024*1024});
for(const n of ['replay','replay-again']){fs.writeFileSync(record+'/'+n+'.log',apply(temp+'/replay.qsp'));assert.equal(hash(temp+'/replay.qsp'),state.after);}
const backup='G:/somi/JO9_work_backups/cow-costume-20261111-'+state.before.slice(0,12);fs.mkdirSync(backup,{recursive:true});
const raw=fs.readFileSync(game+'/jack.qsp'),gzip=zlib.gzipSync(raw);assert(zlib.gunzipSync(gzip).equals(raw));fs.writeFileSync(backup+'/before.qsp.gz',gzip);
fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
for(const n of ['items.input.json','items.json','jo9-reference.html','snapshot.json'])fs.copyFileSync(repo+'/tools/game-reference/'+n,backup+'/'+n);
fs.copyFileSync(game+'/modtools/game-reference/jo9-reference.html',backup+'/work-reference.html');
assert(!fs.existsSync(repo+'/mods/2026-11-11_cow_costume.json'));
for(const n of ['apply','reapply']){fs.writeFileSync(record+'/'+n+'.log',apply(game+'/jack.qsp'));assert.equal(hash(game+'/jack.qsp'),state.after);}
fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');fs.copyFileSync(temp+'/mods/2026-11-11_cow_costume.json',repo+'/mods/2026-11-11_cow_costume.json');
const row={name:'젖소 코스튬',category:'의상',id:'cow_costume',description:'젖소녀 장비와 같은 외형의 일반 의상. 독특함 +1, 매일 사육 누적 +1, 젖소녀 교육 보너스 +2, 세련됨 -1. 지성·태도 감소 및 착용 거부 없음. 고급 젖소녀 훈련의 기존 장비 조건을 대신하지 않음.',price:'25스파크',acquisition:'홍등가 · 벼룩시장 · 노예를 꾸민다 → 일상복 (상시 판매)',source:'jo9_cow_costume data · #item_base 신규 등록',acquisitionSource:'interaction_city 39934번 · #options 일상복 메뉴',verifiedQspSha256:state.after};
const update={date:'2026-11-11',id:'cow_costume',qspSha256:state.after,scope:'Only the new cow costume row was refreshed; other rows keep their previous source snapshot.'};
function addRow(data){const i=data.rows.findIndex(x=>x.id==='cow_costume');if(i>=0)data.rows[i]=row;else data.rows.push(row);data.latestItemUpdate=update;return data;}
for(const n of ['items.input.json','items.json']){const p=repo+'/tools/game-reference/'+n;write(p,addRow(json(p)));}
for(const p of [repo+'/tools/game-reference/jo9-reference.html',game+'/modtools/game-reference/jo9-reference.html']){
 let html=fs.readFileSync(p,'utf8'),seen=0;html=html.replace(/(<script id="reference-data" type="application\/json">)([^\n]+)(<\/script>)/,(_,a,b,z)=>{const data=JSON.parse(b);addRow(data.items);seen++;return a+JSON.stringify(data).replaceAll('<','\\u003c')+z;});assert.equal(seen,1);fs.writeFileSync(p,html);
}
const snapshotPath=repo+'/tools/game-reference/snapshot.json',snapshot=json(snapshotPath);snapshot.latestItemUpdate=update;snapshot.items=json(repo+'/tools/game-reference/items.json').rows.length;snapshot.itemInputRows=json(repo+'/tools/game-reference/items.input.json').rows.length;
for(const f of snapshot.files||[]){const name=f.file||f.path,p=repo+'/tools/game-reference/'+name;if(['items.input.json','items.json','jo9-reference.html'].includes(name)){f.sha256=hash(p);if('bytes'in f)f.bytes=fs.statSync(p).size;}}
write(snapshotPath,snapshot);
const manifestPath=repo+'/assets/runtime-source-2.4.1.json',manifest=json(manifestPath);manifest.sourceQspSha256=state.after;manifest.snapshotDate='2026-11-11';manifest.latestCowCostume={date:'2026-11-11',mod:'2026-11-11_cow_costume',report:'records/cow-costume-20261111/REPORT_KO.md'};
for(const f of manifest.files){const p=repo+'/'+f.repositoryPath;if(f.repositoryPath==='assets/runtime/2.4.1/jack.qsp'||/^tools\/game-reference\/(items(?:\.input)?\.json|jo9-reference\.html|snapshot\.json)$/.test(f.repositoryPath)){f.sha256=hash(p);f.bytes=fs.statSync(p).size;}}
write(manifestPath,manifest);
for(const n of ['cow-costume-build.cjs','cow-costume.test.cjs','cow-costume-native.cjs','cow-costume-install.cjs','jo9-cow-costume.qsp.txt'])fs.copyFileSync(__dirname+'/'+n,record+'/'+n);
fs.copyFileSync(temp+'/helper.qsp.txt',record+'/helper.qsp.txt');fs.copyFileSync(temp+'/native/client-results.json',record+'/native-results.json');fs.copyFileSync(temp+'/native/costume-stderr.log',record+'/native-costume.log');
fs.copyFileSync(__dirname+'/cow-costume-plan.md',repo+'/docs/superpowers/plans/2026-11-11-cow-costume.md');
const final=c.parse(fs.readFileSync(game+'/jack.qsp')),before=c.parse(raw);
const changed=before.locations.filter(l=>before.lines[l.body]!==final.lines[l.body]).map(l=>l.name);assert.deepEqual(changed.slice().sort(),state.changedLocations.slice().sort());assert.equal(c.shift(before.lines[before.locations.find(l=>l.name==='interaction').body],5),c.shift(final.lines[final.locations.find(l=>l.name==='interaction').body],5));
assert.equal(hash(game+'/jack.qsp'),hash(repo+'/assets/runtime/2.4.1/jack.qsp'));
write(record+'/verification.json',{...state,workModified:true,sourceModified:true,backup,changedLocations:changed,structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),wasmActorStatCases:27,nativePass:true,advancedCowGearRequirementsUnchanged:true,dbNewRowOnly:true,fullTouched:false,soundFilesTouched:false,commit:false,push:false});
console.log('INSTALLED '+state.after);
