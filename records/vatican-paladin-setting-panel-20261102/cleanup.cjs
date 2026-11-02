'use strict';
// Remove only this task's regenerable diagnostics. Never traverse a junction.
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const roots=['G:/Codex/tmp/vatican-paladin-scene-fix-20261102-native','G:/Codex/tmp/vatican-paladin-scene-fix-20261102-native-release-text-only'];
const report={removed:[],junctionsUnlinked:0,filesRemoved:0,directoriesRemoved:0};
function remove(p,root){const abs=path.resolve(p),rel=path.relative(root,abs);a(!rel.startsWith('..')&&!path.isAbsolute(rel));const s=fs.lstatSync(abs);if(s.isSymbolicLink()){fs.rmdirSync(abs);report.junctionsUnlinked++;return;}if(s.isDirectory()){a.equal(fs.realpathSync(abs).toLowerCase(),abs.toLowerCase(),'No external directory target');for(const n of fs.readdirSync(abs))remove(path.join(abs,n),root);fs.rmdirSync(abs);report.directoriesRemoved++;}else{fs.unlinkSync(abs);report.filesRemoved++;}}
for(const p of roots){const abs=path.resolve(p);a.equal(path.dirname(abs).toLowerCase(),path.resolve('G:/Codex/tmp').toLowerCase());a(/^vatican-paladin-scene-fix-20261102-native(?:-release-text-only)?$/.test(path.basename(abs)));if(fs.existsSync(abs)){a(!fs.lstatSync(abs).isSymbolicLink());a.equal(fs.realpathSync(abs).toLowerCase(),abs.toLowerCase());remove(abs,abs);report.removed.push(abs);}a(!fs.existsSync(abs));}
if(process.argv.includes('--installed')){
 const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),zlib=require('zlib'),p=JSON.parse(fs.readFileSync(__dirname+'/prepared.json')),base=zlib.gunzipSync(fs.readFileSync(__dirname+'/before.qsp.gz'));
 a.equal(c.hash(base),p.before);a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),p.after,'Only clean candidate after root has installed matching bytes');report.rawQspRemoved=[];
 for(const folder of [__dirname,__dirname+'/superseded-image-scope']){
  const file=folder+'/candidate.qsp',patch=JSON.parse(fs.readFileSync(folder+'/patch.json')),d=c.parse(base);a.equal(c.hash(base),patch.before_sha256);
  for(const e of patch.edits){const l=d.locations.find(x=>x.name===e.location),body=c.shift(d.lines[l.body],5);a.equal(body.split(e.old).length-1,e.count);d.lines[l.body]=c.shift(body.split(e.old).join(e.new),-5);}
  a.equal(c.hash(c.serialize(d)),patch.after_sha256,'Retained backup plus patch reconstructs exact raw QSP');
  if(fs.existsSync(file)){a.equal(c.hash(fs.readFileSync(file)),patch.after_sha256,'Do not remove altered raw candidate');fs.unlinkSync(file);report.rawQspRemoved.push(file);}
 }
 report.candidatesReconstructableFromRetainedBackupAndPatches=true;
}
report.pass=true;fs.writeFileSync(__dirname+'/cleanup-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
