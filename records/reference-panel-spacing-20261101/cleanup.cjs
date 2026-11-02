'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),a=require('assert/strict');
const repo='G:/somi/JO9sa',record=repo+'/records/reference-panel-spacing-20261101';
const c=require(repo+'/tools/text-workshop/core.cjs'),i=JSON.parse(fs.readFileSync(record+'/installed.json'));
const native='G:/Codex/tmp/reference-panel-layout-20261101-native',release='G:/Codex/tmp/reference-panel-layout-20261101-release/run-BMKsCC';
fs.mkdirSync(record+'/native-logs',{recursive:true});fs.mkdirSync(record+'/release-logs',{recursive:true});
for(const name of fs.readdirSync(native))if(/\.log$|^client-results\.json$/.test(name))fs.copyFileSync(native+'/'+name,record+'/native-logs/'+name);
for(const name of fs.readdirSync(release))if(/\.log$|^report\.md$/.test(name))fs.copyFileSync(release+'/'+name,record+'/release-logs/'+name);
for(const name of fs.readdirSync(release+'/client'))if(/\.log$|^client-results\.json$/.test(name))fs.copyFileSync(release+'/client/'+name,record+'/release-logs/'+name);
fs.copyFileSync(__filename,record+'/cleanup.cjs');
const roots=['G:/Codex/tmp/reference-panel-layout-20261101',native,'G:/Codex/tmp/reference-panel-layout-20261101-release'].map(p=>path.resolve(p));
const workspace=path.resolve(__dirname);
a(workspace.endsWith(path.normalize('/output/reference-panel-layout-20261101')),'unexpected workspace');
for(const name of fs.readdirSync(workspace)){
 const f=path.join(workspace,name);a(fs.lstatSync(f).isFile(),'unexpected workspace subdir');
 a.equal(c.hash(fs.readFileSync(f)),c.hash(fs.readFileSync(record+'/'+name)),'unarchived workspace artifact '+name);
}
const stats={bytes:0,files:0,links:[],roots};
function inspect(p){
 const st=fs.lstatSync(p);
 if(st.isSymbolicLink()){
  const target=fs.realpathSync(p);
  a(target.startsWith(path.resolve('G:/somi/Jack O Nine Tails v2.4_work/game')+path.sep)||roots.some(r=>target===r||target.startsWith(r+path.sep)),'unexpected link '+p+' -> '+target);
  stats.links.push({path:p,target});return;
 }
 if(st.isDirectory())for(const name of fs.readdirSync(p))inspect(path.join(p,name));
 else {stats.bytes+=st.size;stats.files++;}
}
for(const r of roots){a(path.dirname(r)===path.resolve('G:/Codex/tmp'),'outside tmp');a(!fs.lstatSync(r).isSymbolicLink(),'root is link');inspect(r);}
function remove(p){
 const st=fs.lstatSync(p);
 if(st.isSymbolicLink()){fs.rmdirSync(p);return;}
 if(st.isDirectory()){for(const n of fs.readdirSync(p))remove(path.join(p,n));fs.rmdirSync(p);}
 else fs.unlinkSync(p);
}
const duplicate='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261101_035120';
a.equal(c.hash(z.gunzipSync(fs.readFileSync(i.backup+'/before.qsp.gz'))),i.before);
a.equal(c.hash(z.gunzipSync(fs.readFileSync(i.backup+'/base.css.gz'))),i.baseCssBefore);
a.equal(c.hash(fs.readFileSync(duplicate)),i.before);
stats.bytes+=fs.statSync(duplicate).size;stats.files++;fs.unlinkSync(duplicate);
for(const r of roots)remove(r);
remove(workspace);
stats.freedMiB=Math.round(stats.bytes/1048576);stats.externalBackupRetained=i.backup;stats.allTemporaryRootsRemoved=roots.every(r=>!fs.existsSync(r));
fs.writeFileSync(record+'/cleanup.json',JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify({removed:stats.files,freedMiB:stats.freedMiB,linksRemovedWithoutFollowing:stats.links.length,allTemporaryRootsRemoved:stats.allTemporaryRootsRemoved,backupRetained:i.backup}));
