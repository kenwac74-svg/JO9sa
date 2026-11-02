'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',D=R+'/records/image-cut-conditions-20261101',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const c=require(R+'/tools/text-workshop/core.cjs');
// Copy reports and small reproduction sources only; no diagnostic QSP/SAV/JSON trees.
for(const name of fs.readdirSync(__dirname)){
 const src=path.join(__dirname,name);if(fs.lstatSync(src).isFile()&&/\.(?:md|cjs|js|json|png|html|log|txt)$/.test(name))fs.copyFileSync(src,D+'/'+name);
}
fs.cpSync(__dirname+'/leak-regression',D+'/leak-regression',{recursive:true});
for(const [src,name] of [
 ['G:/Codex/tmp/image-cut-conditions-release-20261101/run-0joWAN/report.json','release-gate-failed.json'],
 ['G:/Codex/tmp/image-cut-conditions-release-20261101/run-nhopMM/report.json','release-gate.json'],
 ['G:/Codex/tmp/image-cut-conditions-build-v2-20261101/mods/2026-11-01_image_cut_conditions_core.json','patch.json']
])fs.copyFileSync(src,D+'/'+name);
const before=z.gunzipSync(fs.readFileSync(D+'/before.qsp.gz'));a.equal(c.hash(before),'f87363c3050547ae6b7a5387ae9870425fdc4d68cb2e07855e4550df29664168');
const roots=[
 'image-cut-conditions-build-20261101','image-cut-conditions-build-v2-20261101',
 'image-cut-conditions-http-20261101','image-cut-conditions-http-v2-20261101',
 'image-cut-conditions-native-20261101','image-cut-conditions-native-v2-20261101','image-cut-conditions-native-v3-20261101',
 'image-cut-conditions-release-20261101','image-cut-conditions-leak-20261101','image-cut-number-probe-20261101'
];
let files=0,links=0,bytes=0;const removed=[];
function discard(file){
 const st=fs.lstatSync(file);
 if(st.isSymbolicLink()){fs.unlinkSync(file);links++;return;}
 if(st.isDirectory()){for(const name of fs.readdirSync(file))discard(path.join(file,name));fs.rmdirSync(file);return;}
 bytes+=st.size;files++;fs.unlinkSync(file);
}
for(const name of roots){
 const target=path.resolve('G:/Codex/tmp',name),parent=path.resolve('G:/Codex/tmp');
 a.equal(path.dirname(target).toLowerCase(),parent.toLowerCase());a(name.startsWith('image-cut-'));
 if(!fs.existsSync(target))continue;a.equal(fs.realpathSync(target).toLowerCase(),target.toLowerCase(),'Top-level diagnostic root must not be a junction');
 removed.push(target);discard(target);
}
const backup=W+'/jack.qsp.bak_20261101_124919';
if(fs.existsSync(backup)){a.equal(c.hash(fs.readFileSync(backup)),c.hash(before));bytes+=fs.statSync(backup).size;files++;fs.unlinkSync(backup);removed.push(backup);}
const result={files,linksNotFollowed:links,bytesFreed:bytes,removed,compressedRecoveryVerified:true,workSha256:c.hash(fs.readFileSync(W+'/jack.qsp')),fullSha256:c.hash(fs.readFileSync(F+'/jack.qsp'))};
fs.writeFileSync(D+'/cleanup.json',JSON.stringify(result,null,2));fs.writeFileSync(__dirname+'/cleanup.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({files,linksNotFollowed:links,megabytesFreed:Math.round(bytes/1048576),recoveryVerified:true}));
