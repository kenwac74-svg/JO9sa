'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),z=require('zlib');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',record=R+'/records/erza-death-choices-20261101',c=require(R+'/tools/text-workshop/core.cjs'),i=JSON.parse(fs.readFileSync(record+'/installed.json'));
const native='G:/Codex/tmp/erza-death-choices-20261101-native',release='G:/Codex/tmp/erza-death-choices-20261101-release/run-yQbmjY';
for(const folder of ['native-logs','release-logs'])fs.mkdirSync(record+'/'+folder,{recursive:true});
for(const file of fs.readdirSync(native))if(/\.log$|^client-results\.json$/.test(file))fs.copyFileSync(native+'/'+file,record+'/native-logs/'+file);
for(const file of fs.readdirSync(release))if(/\.log$|^report\.md$/.test(file))fs.copyFileSync(release+'/'+file,record+'/release-logs/'+file);
for(const file of fs.readdirSync(release+'/client'))if(/\.log$|^client-results\.json$/.test(file))fs.copyFileSync(release+'/client/'+file,record+'/release-logs/'+file);
fs.copyFileSync(__filename,record+'/cleanup.cjs');
const roots=['G:/Codex/tmp/erza-death-choices-20261101',native,'G:/Codex/tmp/erza-death-choices-20261101-release'].map(p=>path.resolve(p));
const own=path.resolve(__dirname),stats={files:0,bytes:0,links:[],roots};
a(own.endsWith(path.normalize('/output/erza-death-choices-20261101')));
for(const n of fs.readdirSync(own)){const f=path.join(own,n);a(fs.lstatSync(f).isFile());a.equal(c.hash(fs.readFileSync(f)),c.hash(fs.readFileSync(record+'/'+n)),'unarchived artifact '+n);}
function inspect(p){const s=fs.lstatSync(p);if(s.isSymbolicLink()){const t=fs.realpathSync(p);a(t.startsWith(path.resolve(W)+path.sep)||roots.some(r=>t===r||t.startsWith(r+path.sep)),'outside link '+p+' => '+t);stats.links.push({path:p,target:t});return;}if(s.isDirectory())for(const n of fs.readdirSync(p))inspect(path.join(p,n));else{stats.files++;stats.bytes+=s.size;}}
function remove(p){const s=fs.lstatSync(p);if(s.isSymbolicLink()){fs.rmdirSync(p);return;}if(s.isDirectory()){for(const n of fs.readdirSync(p))remove(path.join(p,n));fs.rmdirSync(p);}else fs.unlinkSync(p);}
for(const r of roots){a.equal(path.dirname(r),path.resolve('G:/Codex/tmp'));a(!fs.lstatSync(r).isSymbolicLink());inspect(r);}
const installLog=fs.readFileSync(record+'/install.log','utf8'),m=installLog.match(/G:\\somi\\Jack O Nine Tails v2\.4_work\\game\\jack\.qsp\.bak_\d{8}_\d{6}/);
a(m,'patcher backup not found');const duplicate=path.resolve(m[0]);a.equal(path.dirname(duplicate),path.resolve(W));a.equal(c.hash(fs.readFileSync(duplicate)),i.before);a.equal(c.hash(z.gunzipSync(fs.readFileSync(i.backup+'/before.qsp.gz'))),i.before);stats.files++;stats.bytes+=fs.statSync(duplicate).size;fs.unlinkSync(duplicate);
for(const r of roots)remove(r);remove(own);
a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),i.after);a.equal(c.hash(fs.readFileSync(W+'/'+i.image.target)),i.image.sha256);a.equal(c.hash(fs.readFileSync(i.image.source)),i.image.sha256);
stats.freedMiB=Math.round(stats.bytes/1048576);stats.allTemporaryRootsRemoved=roots.every(r=>!fs.existsSync(r));stats.backupRetained=i.backup;fs.writeFileSync(record+'/cleanup.json',JSON.stringify(stats,null,2)+'\n');console.log(JSON.stringify({removed:stats.files,freedMiB:stats.freedMiB,allTemporaryRootsRemoved:stats.allTemporaryRootsRemoved,backupRetained:i.backup}));
