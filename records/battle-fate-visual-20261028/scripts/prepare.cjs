'use strict';
const fs=require('node:fs'),path=require('node:path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),a=require('node:assert/strict');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa',tmp='G:/Codex/tmp/battle-fate-visual-20261028';
const art=path.resolve(__dirname,'../output/battle-mob-review-20261027');
a(!fs.existsSync(tmp),'Use a new task directory, never replace recovery snapshots');
fs.mkdirSync(tmp,{recursive:true});
const files=['jack.qsp','css/base.css','content/js/jo9_battle_log.js','save/1.sav','save/JO9_GOLD_AP_CHECK_20261026.sav'];
const hashes={};
for(const f of files){const p=work+'/'+f;hashes[f]=c.hash(fs.readFileSync(p));if(!f.startsWith('save/')){const dst=tmp+'/before/'+f;fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(p,dst);}}
const mf=JSON.parse(fs.readFileSync(art+'/manifest.json','utf8'));
const assets=mf.entries.filter(x=>x.kind==='defeated').map(x=>({source:art+'/'+x.file,destination:'content/pic/mob/defeated/'+x.id+'.png',id:x.id,sha256:c.hash(fs.readFileSync(art+'/'+x.file))}));
assets.push({source:work+'/content/modworkpic/fbf2c8f0-b83d-4bda-b93a-2aefb1b94750_795x596.png',destination:'content/pic/ui/jo9_battle_test_v01/arena.png'});
assets.push({source:work+'/content/pic/ui/grimdark/bg/fight.png',destination:'content/pic/ui/jo9_battle_test_v01/execution_red.png'});
for(const x of assets){a(!fs.existsSync(work+'/'+x.destination),'Unexpected existing resource '+x.destination);x.sha256=c.hash(fs.readFileSync(x.source));x.bytes=fs.statSync(x.source).size;}
const tracked=['assets/css-2.4/base.css','assets/content/js/jo9_battle_log.js','assets/content/js/jo9_traits_view.js','assets/json/menu_icon.json','assets/json/slave_index.json','docs/SESSION_HANDOFF_INDEX.md'];
const input={work,repo,tmp,art,hashes,tracked:Object.fromEntries(tracked.map(f=>[f,c.hash(fs.readFileSync(repo+'/'+f))])),assets};
fs.writeFileSync(__dirname+'/inputs.json',JSON.stringify(input,null,2)+'\n');
console.log(JSON.stringify({tmp,hashes,assetCount:assets.length,assetMiB:assets.reduce((v,x)=>v+x.bytes,0)/1048576},null,2));
