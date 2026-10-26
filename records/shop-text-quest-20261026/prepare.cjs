'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/shop-text-quest-20261026',backup='G:/somi/JO9_work_backups/shop-text-quest-20261026';
const expected='8b9cf39fe2327079b0823f6e474c93151538a512fa8738ed5f330749a0940db5';
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expected);assert(!fs.existsSync(backup));
fs.mkdirSync(backup,{recursive:true});fs.mkdirSync(task,{recursive:true});
const changing=['jack.qsp','css/base.css','content/js/jo9_word_wrap.js','json/menu_icon.json'];
for(const rel of changing){const to=backup+'/'+rel;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(game+'/'+rel,to,fs.constants.COPYFILE_EXCL);assert(fs.readFileSync(game+'/'+rel).equals(fs.readFileSync(to)));}
const files=new Set(changing.map(rel=>game+'/'+rel));
function inventory(dir){for(const n of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,n.name);if(n.isSymbolicLink())continue;if(n.isDirectory())inventory(p);else if(n.isFile())files.add(p);}}
for(const rel of ['save','css','content/js'])inventory(game+'/'+rel);
for(const p of [game+'/config.xml',game+'/FastQSP.ini',game+'/engine/jack.exe','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/JO9O/game/jack.qsp','G:/somi/JO9sa/source/jack_2026-10-01.qsp'])if(fs.existsSync(p))files.add(p);
const inputs=[...files].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));
fs.writeFileSync(__dirname+'/inputs.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(__dirname+'/baseline.json',JSON.stringify({game,task,backup,qsp:expected,changing,protectedInputs:inputs.length,existingSaves:inputs.filter(x=>/\.sav$/i.test(x.path)).length},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({task,backup,qsp:expected,protectedInputs:inputs.length,existingSaves:inputs.filter(x=>/\.sav$/i.test(x.path)).length}));
