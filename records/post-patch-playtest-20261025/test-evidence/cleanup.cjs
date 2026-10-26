'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const intended='G:/Codex/tmp/jo9-post-patch-playtest-20261025',root=path.resolve(intended),rec='G:/somi/JO9sa/records/post-patch-playtest-20261025',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const files=JSON.parse(fs.readFileSync(rec+'/inputs.json','utf8'));
const originalSaveCount=files.filter(f=>/\.sav$/i.test(f.path)).length;
function verify(){for(const f of files)assert.equal(c.hash(fs.readFileSync(f.path)),f.sha256,'Protected input changed: '+f.path);assert.equal(fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).length,originalSaveCount);}
verify();assert.equal(root.toLowerCase(),path.resolve('G:/Codex/tmp/jo9-post-patch-playtest-20261025').toLowerCase());
if(!fs.existsSync(root)){console.log('Task temporary root already absent;96 protected files unchanged.');process.exit(0);}
assert(!fs.lstatSync(root).isSymbolicLink(),'Root must not be a junction');assert.equal(fs.realpathSync(root).toLowerCase(),root.toLowerCase());
const gameReal=fs.realpathSync(game),links=[];let bytes=0,count=0;
function inside(p){const rel=path.relative(root,p);assert(!rel.startsWith('..')&&!path.isAbsolute(rel),'Outside task: '+p);}
function scan(p){inside(p);const s=fs.lstatSync(p);if(s.isSymbolicLink()){
 const target=fs.realpathSync(p),rel=path.relative(gameReal,target);assert(!rel.startsWith('..')&&!path.isAbsolute(rel),'Unexpected junction target: '+target);links.push({path:p,target});return;
 }if(s.isDirectory())for(const n of fs.readdirSync(p))scan(path.join(p,n));else{count++;bytes+=s.size;}}
scan(root);
for(const l of links){inside(l.path);assert(fs.lstatSync(l.path).isSymbolicLink());assert.equal(fs.realpathSync(l.path),l.target);fs.rmdirSync(l.path);assert(!fs.existsSync(l.path));assert(fs.existsSync(l.target),'Target must remain');}
function noLinks(p){inside(p);assert(!fs.lstatSync(p).isSymbolicLink());if(fs.lstatSync(p).isDirectory())for(const n of fs.readdirSync(p))noLinks(path.join(p,n));}
noLinks(root);fs.rmSync(root,{recursive:true,maxRetries:3,retryDelay:100});assert(!fs.existsSync(root));verify();
const result={status:'CLEANED',root,filesRemoved:count,bytesRemoved:bytes,GiBRemoved:Number((bytes/1073741824).toFixed(3)),junctionsUnlinked:links,originalTargetsPreserved:true,protectedFilesUnchanged:files.length,originalSavesUnchanged:originalSaveCount,preserved:'Canonical report, extracted numeric/HTML/log evidence and reproduction scripts. No product or original-save deletion.'};
fs.writeFileSync(rec+'/cleanup.json',JSON.stringify(result,null,2));fs.writeFileSync(__dirname+'/cleanup.json',JSON.stringify(result,null,2));fs.copyFileSync(__filename,rec+'/test-evidence/cleanup.cjs');fs.copyFileSync(__dirname+'/cleanup.json',rec+'/test-evidence/cleanup.json');
console.log(JSON.stringify({status:result.status,filesRemoved:count,GiBRemoved:result.GiBRemoved,junctionsUnlinked:links.length,protected:96,saves:originalSaveCount}));
