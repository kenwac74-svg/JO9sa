// Approved WORK-to-source image sync. No QSP, JSON, checklist-state or game-image writes.
// Default: read-only plan. --apply: backup, update only six sources and catalog size/comparison rows.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const repo = 'G:/somi/JO9sa';
const work = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const original = 'G:/somi/JO9O/game';
const recordDir = repo + '/records/work-image-source-sync-20261110';
const catalog = work + '/modtools/catalog';
const manifestPath = repo + '/assets/runtime-source-2.4.1.json';
const htmlPaths = [catalog + '/catalog_merge_vs_original.html', repo + '/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html'];
const expectedStatus = 'aaa356168fb228a1c71a194a8992a5484c044b657c8c57073089e0373cfb6e77';
const targets = [
  ['ui/legacy_overhaul/broker.png', 'resources/new/content/pic/ui/legacy_overhaul/broker.png', 'acd698b3917e896c3d7dc14bab81ae71928ba4db6d50166c47593c5a198e69d1'],
  ['girls/full/felicity_blond_long_young.png', 'assets/content/pic/girls/full/felicity_blond_long_young.png', 'ac0b1317fb0b073b40771c8708ec052544ac1676d38a69cf60538a53bdec51c2'],
  ['girls/face/wilhelmine.png', 'assets/content/pic/girls/face/wilhelmine.png', '372c1b36263aaccda8a7fd9fb9930311dadcae3681ed2b41d8e26499895d536c'],
  ['girls/face/wilhelmine_gray.png', 'assets/content/pic/girls/face/wilhelmine_gray.png', '057bfef9932e810a127a431c7fb0fd892fdf705f07b6a1b0d4fa916619826842'],
  ['girls/face/wilhelmine_sepia.png', 'assets/content/pic/girls/face/wilhelmine_sepia.png', 'b6cea4f16e26be62dba0d982856ace4bd0b67fb441119985b69db4489aed8347'],
  ['girls/full/mistress/1448_shiru.png', 'assets/content/pic/girls/full/mistress/1448_shiru.png', '2ce40cc4a268eef76d0d60cb1b7774c002c86e0d1be4e8850d871c95d1d2f624'],
].map(([image, repositoryPath, sha256]) => ({runtimePath:'content/pic/' + image, repositoryPath, sha256}));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const read = p => fs.readFileSync(p);
const fingerprint = p => fs.existsSync(p) ? {bytes:fs.statSync(p).size, sha256:hash(read(p))} : null;
const clone = x => JSON.parse(JSON.stringify(x));
const normalize = p => p.replaceAll('\\', '/');
const dPattern = /var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
function replaceOne(text, before, after) {
  const i = text.indexOf(before);
  assert(i >= 0 && text.indexOf(before, i + before.length) < 0, 'Expected one exact metadata block');
  return text.slice(0,i) + after + text.slice(i+before.length);
}
function replaceEntry(text, before, after) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const render = value => JSON.stringify(value,null,2).split('\n').map(line=>'    '+line).join(eol);
  return replaceOne(text,render(before),render(after));
}
function assertFingerprint(p, expected) {
  assert.deepEqual(fingerprint(p),expected,'Input changed: '+p);
}
function writeChecked(p, before, after) {
  assertFingerprint(p,before);
  fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,after);
}
const protectedPaths = [
  work+'/jack.qsp', repo+'/assets/runtime/2.4.1/jack.qsp',
  catalog+'/catalog_status.js', catalog+'/catalog_work_ids.json',
  catalog+'/JO9_캐릭터_이미지체크리스트.html', catalog+'/patch-schedule.json',
  ...['1448_Shiru.json','2572_felicity.json','2573_wilhelmine.json'].map(p=>work+'/json/slaves/'+p),
  ...['2026-10-28_fullimage.json','2026-11-08_shiru-paths.json'].map(p=>repo+'/assets/compatibility-aliases/'+p),
  ...targets.flatMap(t=>[work+'/'+t.runtimePath,original+'/'+t.runtimePath]),
];
if(process.argv.includes('--verify')) {
  const audit = JSON.parse(fs.readFileSync(recordDir+'/audit.json','utf8'));
  for(const [p,expected] of Object.entries(audit.protected)) assertFingerprint(p,expected);
  for(const item of audit.mutations) assertFingerprint(item.path,item.after);
  const manifest = JSON.parse(read(manifestPath));
  for(const t of targets) {
    const b = read(work+'/'+t.runtimePath), s = read(repo+'/'+t.repositoryPath);
    assert(b.equals(s),'Source differs: '+t.runtimePath);
    const m = manifest.files.find(e=>e.runtimePath===t.runtimePath);
    assert.equal(m.sha256,hash(b)); assert.equal(m.bytes,b.length); assert.equal(m.repositoryPath,t.repositoryPath);
  }
  console.log(JSON.stringify({verified:true,sources:6,protectedPaths:protectedPaths.length,mutations:audit.mutations.length}));
  process.exit(0);
}
assert.equal(hash(read(catalog+'/catalog_status.js')),expectedStatus,'Latest checklist save changed; recheck before applying');
const protectedBefore = Object.fromEntries(protectedPaths.map(p=>[p,fingerprint(p)]));
const oldManifestText = read(manifestPath).toString('utf8');
const oldManifest = JSON.parse(oldManifestText);
let manifestText = oldManifestText;
const sourcePlans = [];
const entries = [];
for(const t of targets) {
  const bytes = read(work+'/'+t.runtimePath);
  assert.equal(hash(bytes),t.sha256,'WORK image changed since pre-update report: '+t.runtimePath);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const old = oldManifest.files.filter(e=>e.runtimePath===t.runtimePath);
  assert.equal(old.length,1);
  const current = {runtimePath:t.runtimePath,repositoryPath:t.repositoryPath,bytes:bytes.length,sha256:t.sha256};
  for(const [k,v] of Object.entries(old[0])) if(!['runtimePath','repositoryPath','bytes','sha256','sourceBundle','bundlePath'].includes(k)) current[k]=v;
  manifestText = replaceEntry(manifestText,old[0],current);
  sourcePlans.push({path:repo+'/'+t.repositoryPath,before:fingerprint(repo+'/'+t.repositoryPath),data:bytes});
  const orig = fingerprint(original+'/'+t.runtimePath);
  entries.push({...t,bytes:bytes.length,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),original:orig,beforeManifest:old[0],afterManifest:current});
}
const newManifest = JSON.parse(manifestText);
const untouchedManifest = clone(newManifest);
for(const t of entries) untouchedManifest.files[untouchedManifest.files.findIndex(e=>e.runtimePath===t.runtimePath)]=t.beforeManifest;
assert.deepEqual(untouchedManifest,oldManifest);
const htmlPlans = htmlPaths.map(p=>{
  const text = read(p).toString('utf8'), match = dPattern.exec(text);
  assert(match,'Missing catalog data: '+p);
  const rows = JSON.parse(match[1]); let data = match[1];
  const changes = [];
  for(const t of entries) {
    const hits = rows.filter(row=>normalize(row[0])===t.runtimePath); assert.equal(hits.length,1);
    const before = hits[0], after = [...before];
    after[1] = !t.original ? 'a' : t.original.sha256===t.sha256 ? 'o' : 'r';
    after[3]=t.bytes; after[5]=t.width; after[6]=t.height;
    if(JSON.stringify(before)!==JSON.stringify(after)) {
      data=replaceOne(data,JSON.stringify(before),JSON.stringify(after));
      changes.push({runtimePath:t.runtimePath,before,after});
    }
  }
  const afterText=text.slice(0,match.index)+match[0].replace(match[1],()=>data)+text.slice(match.index+match[0].length);
  const afterRows=JSON.parse(dPattern.exec(afterText)[1]);
  for(let i=0;i<rows.length;i++) if(!targets.some(t=>t.runtimePath===normalize(rows[i][0]))) assert.deepEqual(afterRows[i],rows[i]);
  assert.equal(afterText.replace(data,'<DATA>'),text.replace(match[1],'<DATA>'),'Non-data HTML changed');
  return {path:p,before:fingerprint(p),data:Buffer.from(afterText),changes,rowCount:rows.length};
});
const textPlans=[{path:manifestPath,before:fingerprint(manifestPath),data:Buffer.from(manifestText)},...htmlPlans];
const plans=[...sourcePlans,...textPlans];
console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'plan',images:entries.map(({runtimePath,bytes,width,height,sha256,original})=>({runtimePath,bytes,width,height,sha256,originalMatches:original?.sha256===sha256})),catalogs:htmlPlans.map(p=>({path:p.path,changedRows:p.changes.length,rowCount:p.rowCount})),protectedPaths:protectedPaths.length}));
if(!process.argv.includes('--apply')) process.exit(0);
const stamp = new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const backupDir = 'G:/somi/JO9_work_backups/work-image-source-sync-20261110/'+stamp;
fs.mkdirSync(backupDir,{recursive:true}); fs.mkdirSync(recordDir,{recursive:true});
const backupIndex=[];
for(let i=0;i<plans.length;i++) {
  const p=plans[i]; assertFingerprint(p.path,p.before);
  if(p.before) {
    const backupFile=backupDir+'/'+String(i).padStart(2,'0')+'-'+path.basename(p.path)+'.gz';
    fs.writeFileSync(backupFile,zlib.gzipSync(read(p.path)));
    assert(zlib.gunzipSync(read(backupFile)).equals(read(p.path)),'Backup roundtrip failed');
    backupIndex.push({path:p.path,before:p.before,backupFile});
  } else backupIndex.push({path:p.path,before:null,backupFile:null});
}
for(const [p,expected] of Object.entries(protectedBefore)) assertFingerprint(p,expected);
let written=[];
try {
  for(const p of plans){writeChecked(p.path,p.before,p.data);written.push(p);}
  for(const p of plans) assert.equal(hash(read(p.path)),hash(p.data));
  for(const [p,expected] of Object.entries(protectedBefore)) assertFingerprint(p,expected);
} catch(error) {
  // Only undo files still byte-identical to this run's own writes.
  for(const p of written.reverse()) if(fs.existsSync(p.path)&&hash(read(p.path))===hash(p.data)) {
    const b=backupIndex.find(e=>e.path===p.path);
    if(b.backupFile) fs.writeFileSync(p.path,zlib.gunzipSync(read(b.backupFile))); else fs.unlinkSync(p.path);
  }
  throw error;
}
const status=JSON.parse(/window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$/.exec(read(catalog+'/catalog_status.js').toString('utf8'))[1]);
const audit={schema:1,id:'WORK_IMAGE_SOURCE_SYNC_20261110',appliedAt:new Date().toISOString(),authority:'Current WORK; latest checklist inspected before update',checklistSavedAt:status.savedAt,backupDir,backupIndex,entries,catalogs:htmlPlans.map(({path,changes,rowCount})=>({path,changes,rowCount})),protected:protectedBefore,mutations:plans.map(p=>({path:p.path,before:p.before,after:fingerprint(p.path)})),checks:{nonTargetManifestPreserved:true,nonTargetCatalogRowsPreserved:true,nonDataHtmlPreserved:true,checklistStateAndConnectionsPreserved:true,workImagesPreserved:true,backupRoundtrip:true}};
fs.writeFileSync(backupDir+'/index.json',JSON.stringify(backupIndex,null,2)+'\n');
fs.writeFileSync(recordDir+'/audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({applied:true,sources:6,manifestEntries:6,catalogChangedRows:htmlPlans.map(p=>p.changes.length),backupDir,audit:recordDir+'/audit.json'}));
