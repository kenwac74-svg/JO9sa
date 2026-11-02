'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),G='G:/somi/Jack O Nine Tails v2.4_work/game',R='G:/somi/JO9sa';const d=c.parse(fs.readFileSync(G+'/jack.qsp'));
for(const name of ['colosseum_fight','jo9_battle_fate']){const l=d.locations.find(x=>x.name===name),lines=c.shift(d.lines[l.body],5).split('\r\n');console.log(JSON.stringify({name,lines:lines.map((text,i)=>({line:i+1,text})).filter(x=>name==='colosseum_fight'?true:x.line<66)},null,2));}
const p=JSON.parse(fs.readFileSync(R+'/records/full-client-preparation-20261029/full-client-input-plan.json'));console.log(JSON.stringify({summary:p.summary,entries:p.files.filter(x=>/mistress(_morrigan|_ava)\.png/.test(x.path))},null,2));
