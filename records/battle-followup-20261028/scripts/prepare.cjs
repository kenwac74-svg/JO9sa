'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa',tmp='G:/Codex/tmp/battle-followup-20261028';
a(!fs.existsSync(tmp));fs.mkdirSync(tmp,{recursive:true});
const hashes={};
for(const f of ['jack.qsp','css/base.css','content/js/jo9_battle_log.js','save/1.sav','save/JO9_GOLD_AP_CHECK_20261026.sav']){hashes[f]=c.hash(fs.readFileSync(work+'/'+f));if(!f.startsWith('save/')){fs.mkdirSync(path.dirname(tmp+'/before/'+f),{recursive:true});fs.copyFileSync(work+'/'+f,tmp+'/before/'+f);}}
const art=path.resolve(__dirname,'../output/battle-mob-review-20261027');
const audit=JSON.parse(fs.readFileSync(__dirname+'/fog-groups-inventory.json','utf8'));
const assets=audit.fogMissingStanding.map(id=>({source:art+'/images/battle/'+id+'.png',destination:'content/pic/mob/'+id+'.png',id}));
for(const id of ['pierce','slash','impact','whip'])assets.push({source:__dirname+'/fx/'+id+'.svg',destination:'content/pic/ui/jo9_battle_test_v01/fx/'+id+'.svg'});
for(const x of assets){a(!fs.existsSync(work+'/'+x.destination),'Preserve existing asset '+x.destination);x.sha256=c.hash(fs.readFileSync(x.source));x.bytes=fs.statSync(x.source).size;}
const tracked=['assets/css-2.4/base.css','assets/content/js/jo9_battle_log.js','assets/content/js/jo9_traits_view.js','assets/json/menu_icon.json','assets/json/slave_index.json','docs/SESSION_HANDOFF_INDEX.md'];
const report={work,repo,tmp,art,hashes,assets,tracked:Object.fromEntries(tracked.map(f=>[f,c.hash(fs.readFileSync(repo+'/'+f))]))};
fs.writeFileSync(__dirname+'/inputs.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({hashes,assets:assets.length,bytes:assets.reduce((n,x)=>n+x.bytes,0)},null,2));
