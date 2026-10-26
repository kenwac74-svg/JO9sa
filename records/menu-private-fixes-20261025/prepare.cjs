'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/menu-private-fixes-20261025',backup='G:/somi/JO9_work_backups/menu-private-fixes-20261025';
const raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw);assert(c.serialize(doc).equals(raw));assert.equal(doc.hash,'38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed');
assert(!fs.existsSync(task)&&!fs.existsSync(backup));fs.mkdirSync(task,{recursive:true});fs.mkdirSync(task+'/mods');fs.mkdirSync(backup,{recursive:true});fs.copyFileSync(game+'/jack.qsp',backup+'/jack.qsp',fs.constants.COPYFILE_EXCL);
const inputs=[];function add(file){inputs.push({path:file,sha256:c.hash(fs.readFileSync(file))});}add(game+'/jack.qsp');
function walk(dir,accept){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()&&!e.isSymbolicLink())walk(p,accept);else if(e.isFile()&&accept(p))add(p);}}
walk(game+'/save',p=>/\.sav$/i.test(p));walk(game+'/css',()=>true);walk(game+'/content/js',()=>true);
for(const p of [game+'/config.xml',game+'/FastQSP.ini',game+'/engine/jack.exe','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'])add(p);
fs.writeFileSync(__dirname+'/inputs.json',JSON.stringify(inputs,null,2));fs.writeFileSync(__dirname+'/baseline.json',JSON.stringify({sourceHash:doc.hash,backup,task,locations:doc.locations.length,inputs:inputs.length},null,2));console.log(JSON.stringify({sourceHash:doc.hash,task,backup,protected:inputs.length}));
