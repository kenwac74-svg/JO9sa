'use strict';
// Remove verified DB_BG duplicate rows only; never alter image files or QSP.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const folder=__dirname,report=JSON.parse(fs.readFileSync(path.join(folder,'audit.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hash=f=>sha(fs.readFileSync(f));
const stamp=new Date().toISOString();
const normalize=s=>s.replace(/\\/g,'/').toLowerCase();
const rec='G:/somi/JO9sa/records/db-bg-catalog-dedup-20261101';
const edits=[],removedPaths=new Set(),restore=[];
assert.equal(report.source_count,120);assert.equal(report.duplicate_source_count,34);
for(const source of report.entries){assert.equal(hash(source.path),source.sha256);for(const match of source.matches)assert.equal(hash(match.path),source.sha256);}
for(const catalog of report.catalogs){
 const before=fs.readFileSync(catalog.file),text=before.toString('utf8');assert.equal(sha(before),catalog.before_sha256,'Catalog changed since audit');
 const m=text.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);assert(m);const rows=JSON.parse(m[1]);
 const remove=new Set(catalog.removed.map(x=>normalize(x.row[0])));
 for(const item of catalog.removed){
  assert(/^content\/pic\/(?:reserve\/)?bg\/db_bg\//.test(normalize(item.row[0])));
  assert.deepEqual(rows[item.index],item.row);
  for(const variant of item.variants){assert.equal(hash(variant.path),variant.sha256);assert(variant.matches.length);for(const ref of variant.matches)assert.equal(hash(ref.path),variant.sha256);}
  removedPaths.add(normalize(item.row[0]));
 }
 assert.equal(remove.size,catalog.removed.length);
 const kept=rows.filter(row=>!remove.has(normalize(row[0])));assert.equal(rows.length-kept.length,82);
 const after=Buffer.from(text.slice(0,m.index)+text.slice(m.index,m.index+m[0].length).replace(m[1],JSON.stringify(kept))+text.slice(m.index+m[0].length));
 const next=after.toString('utf8'),nm=next.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);assert.deepEqual(JSON.parse(nm[1]),kept);
 assert.equal(text.slice(0,m.index),next.slice(0,nm.index));assert.equal(text.slice(m.index+m[0].length),next.slice(nm.index+nm[0].length));
 edits.push({file:catalog.file,before,after,kind:'catalog',rows_before:rows.length,rows_after:kept.length});
 restore.push({file:catalog.file,before_sha256:sha(before),after_sha256:sha(after),removed:catalog.removed.map(({index,row})=>({index,row}))});
}
// Remove the same entries from the saved BG task queue, preserving other order IDs.
const queue='G:/somi/JO9sa/tools/local-workspace/catalog-seed/image_work/bg_queue.json';
const qb=fs.readFileSync(queue),q=JSON.parse(qb.toString('utf8')),old=q.items;
const qr=old.map((item,index)=>({item,index})).filter(x=>removedPaths.has(normalize(x.item.relative_path)));
q.items=old.filter(item=>!removedPaths.has(normalize(item.relative_path)));
assert.equal(old.length-q.items.length,qr.length);
edits.push({file:queue,before:qb,after:Buffer.from(JSON.stringify(q,null,2)+'\n'),kind:'queue',rows_before:old.length,rows_after:q.items.length});
restore.push({file:queue,before_sha256:sha(qb),removed:qr});
const protectedFiles=[
 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',
 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp',
 ...report.catalogs.flatMap(c=>['catalog_status.js','catalog_work_ids.json','catalog_work_codes.js'].map(n=>path.join(path.dirname(c.file),n)))
];
const protectedHashes=Object.fromEntries(protectedFiles.map(f=>[f,hash(f)]));
const record={created_at:stamp,policy:'Exact SHA256 matches only. DB_BG itself is excluded from reference roots. Image files are retained. Historical IDs and flags retained. No QSP change.',source_count:120,duplicate_source_count:34,unique_source_count:86,removed_catalog_rows:82,queue_removed:qr.length,catalogs:restore,source_evidence:report.entries.filter(x=>x.matches.length),protected_hashes:protectedHashes};
fs.mkdirSync(rec,{recursive:true});assert(!fs.existsSync(path.join(rec,'installed.json')),'Already installed');
fs.writeFileSync(path.join(rec,'exclusions-and-restore.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
fs.copyFileSync(path.join(folder,'audit.json'),path.join(rec,'audit.json'));
fs.copyFileSync(__filename,path.join(rec,'apply.cjs'));
// Guard all files again immediately before making any changes.
for(const e of edits)assert(fs.readFileSync(e.file).equals(e.before),'Concurrent edit: '+e.file);
for(const e of edits){const tmp=e.file+'.db-bg-dedup.tmp';assert(!fs.existsSync(tmp));fs.writeFileSync(tmp,e.after,{flag:'wx'});assert(fs.readFileSync(e.file).equals(e.before));fs.renameSync(tmp,e.file);assert.equal(hash(e.file),sha(e.after));}
for(const [f,h] of Object.entries(protectedHashes))assert.equal(hash(f),h,'Protected file changed');
for(const source of report.entries)assert.equal(hash(source.path),source.sha256,'Original image changed');
const installed={created_at:stamp,source_count:120,duplicate_source_count:34,remaining_unique_sources:86,catalog_rows_removed:82,queue_rows_removed:qr.length,files:edits.map(e=>({file:e.file,kind:e.kind,before_sha256:sha(e.before),after_sha256:sha(e.after),rows_before:e.rows_before,rows_after:e.rows_after})),protected_files_unchanged:true,original_images_unchanged:true};
fs.writeFileSync(path.join(rec,'installed.json'),JSON.stringify(installed,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(folder,'installed.json'),JSON.stringify(installed,null,2)+'\n');
console.log(JSON.stringify(installed,null,2));
