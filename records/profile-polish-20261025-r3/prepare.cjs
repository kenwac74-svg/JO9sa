'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/profile-polish-20261025-r3',backup='G:/somi/JO9_work_backups/profile-polish-20261025-r3';
const raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw);assert.equal(c.hash(raw),'256293ff14b41ac19efd1bfb412f21066b227f86e1b61ea0e523820a86ebcb3a');assert(c.serialize(doc).equals(raw));
assert(!fs.existsSync(task)&&!fs.existsSync(backup));fs.mkdirSync(task,{recursive:true});fs.mkdirSync(backup,{recursive:true});fs.mkdirSync(task+'/mods');
const files=['jack.qsp','content/js/jo9_traits_view.js','css/jo9_traits_view.css'];
const inputs=files.map(p=>({path:game+'/'+p,sha256:c.hash(fs.readFileSync(game+'/'+p))}));
for(const p of files){const dest=backup+'/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(game+'/'+p,dest,fs.constants.COPYFILE_EXCL);}
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,ent.name);if(ent.isDirectory()&&!ent.isSymbolicLink())walk(file);else if(ent.isFile()&&/\.sav$/i.test(file))inputs.push({path:file,sha256:c.hash(fs.readFileSync(file))});}}
walk(game+'/save');for(const p of ['G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp',game+'/config.xml',game+'/FastQSP.ini'])if(fs.existsSync(p))inputs.push({path:p,sha256:c.hash(fs.readFileSync(p))});
fs.writeFileSync(__dirname+'/inputs.json',JSON.stringify(inputs,null,2));fs.writeFileSync(__dirname+'/baseline.json',JSON.stringify({sourceHash:c.hash(raw),backup,task,locations:doc.locations.length,inputs:inputs.length},null,2));
console.log(JSON.stringify({task,backup,protected:inputs.length,sourceHash:c.hash(raw)}));
