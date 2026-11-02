'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',record=R+'/records/erza-editor-choice-fix-20261101',c=require(R+'/tools/text-workshop/core.cjs'),installed=JSON.parse(fs.readFileSync(record+'/installed.json'));
const native='G:/Codex/tmp/erza-editor-choice-fix-20261101-native',release='G:/Codex/tmp/erza-editor-choice-fix-20261101-release/run-SqYoxw',own=path.resolve(__dirname);
a(own.endsWith(path.normalize('/output/erza-editor-choice-fix-20261101')));
for(const n of fs.readdirSync(own)){a(fs.lstatSync(own+'/'+n).isFile(),'unexpected workspace directory');fs.copyFileSync(own+'/'+n,record+'/'+n);a.equal(c.hash(fs.readFileSync(own+'/'+n)),c.hash(fs.readFileSync(record+'/'+n)));}
for(const n of ['native-logs','release-logs'])fs.mkdirSync(record+'/'+n,{recursive:true});
for(const n of fs.readdirSync(native))if(/\.log$|^client-results\.json$/.test(n))fs.copyFileSync(native+'/'+n,record+'/native-logs/'+n);
for(const n of fs.readdirSync(release))if(/\.log$|^report\.md$/.test(n))fs.copyFileSync(release+'/'+n,record+'/release-logs/'+n);
for(const n of fs.readdirSync(release+'/client'))if(/\.log$|^client-results\.json$/.test(n))fs.copyFileSync(release+'/client/'+n,record+'/release-logs/'+n);
const roots=['G:/Codex/tmp/erza-editor-choice-fix-20261101',native,'G:/Codex/tmp/erza-editor-choice-fix-20261101-release'].map(p=>path.resolve(p)),stats={files:0,bytes:0,links:[],roots};
function inspect(p){const s=fs.lstatSync(p);if(s.isSymbolicLink()){const t=fs.realpathSync(p);a(t.startsWith(path.resolve(W)+path.sep)||roots.some(r=>t===r||t.startsWith(r+path.sep)),'outside link '+p);stats.links.push({path:p,target:t});return;}if(s.isDirectory())for(const n of fs.readdirSync(p))inspect(path.join(p,n));else{stats.files++;stats.bytes+=s.size;}}
function remove(p){const s=fs.lstatSync(p);if(s.isSymbolicLink()){fs.rmdirSync(p);return;}if(s.isDirectory()){for(const n of fs.readdirSync(p))remove(path.join(p,n));fs.rmdirSync(p);}else fs.unlinkSync(p);}
for(const r of roots){a.equal(path.dirname(r),path.resolve('G:/Codex/tmp'));a(!fs.lstatSync(r).isSymbolicLink());inspect(r);}
const m=fs.readFileSync(record+'/install.log','utf8').match(/G:\\somi\\Jack O Nine Tails v2\.4_work\\game\\jack\.qsp\.bak_\d{8}_\d{6}/);a(m);const duplicate=path.resolve(m[0]);a.equal(path.dirname(duplicate),path.resolve(W));a.equal(c.hash(fs.readFileSync(duplicate)),installed.before);a.equal(c.hash(z.gunzipSync(fs.readFileSync(installed.backup+'/before.qsp.gz'))),installed.before);stats.files++;stats.bytes+=fs.statSync(duplicate).size;fs.unlinkSync(duplicate);
for(const r of roots)remove(r);remove(own);
a.equal(c.hash(fs.readFileSync(W+'/jack.qsp')),installed.after);for(const p of installed.protectedHashes)a.equal(c.hash(fs.readFileSync(p.path)),p.sha256);
a.equal(JSON.parse(fs.readFileSync(record+'/live-api-report.json')).hash,installed.after);a.equal(JSON.parse(fs.readFileSync(record+'/live-api-report.json')).pass,true);
stats.freedMiB=Math.round(stats.bytes/1048576);stats.allTemporaryRootsRemoved=roots.every(r=>!fs.existsSync(r));stats.backupRetained=installed.backup;fs.writeFileSync(record+'/cleanup.json',JSON.stringify(stats,null,2)+'\n');console.log(JSON.stringify({removed:stats.files,freedMiB:stats.freedMiB,allTemporaryRootsRemoved:stats.allTemporaryRootsRemoved,workSha:installed.after,liveApiPass:true}));
