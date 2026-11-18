'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const body=n=>{let l=d.locations.find(x=>x.name===n);return c.shift(d.lines[l.body],5);};
let opts=body('#options').split('\n'),shown=new Set();
for(let i=0;i<opts.length;i++)if(/smuggler|smugglers_den/.test(opts[i]))for(let j=Math.max(0,i-5);j<Math.min(opts.length,i+23);j++)if(!shown.has(j)){shown.add(j);console.log((j+1)+': '+opts[j].slice(0,550));}
let city=body('interaction_city'),matches=[...city.matchAll(/^if[ \t]+interaction_city[ \t]*=[ \t]*(\d+)[ \t]*:/gim)],blocks=[];
for(let i=0;i<matches.length;i++){let m=matches[i],s=city.slice(m.index,matches[i+1]?.index??city.length);if(!s.includes("$place = 'smugglers_den'"))continue;
 const lines=s.split('\n').filter(line=>/special_stock|sparks|guild_reputation|brand_rate|snake_amulet|rand\(|stock_to_slave|npc_id|gt |gs |_lose|= 1|killvar/.test(line)&&!/^\s*\$text/.test(line));blocks.push({event:m[1],lines});}
console.log('PURCHASE ROUTES '+JSON.stringify(blocks.filter(b=>Number(b.event)>=6200&&Number(b.event)<6300).map(b=>({...b,lines:b.lines.slice(0,18)}))));
fs.writeFileSync(__dirname+'/actual-menu.json',JSON.stringify({hash:d.hash,optionLines:[...shown].sort((a,b)=>a-b).map(i=>({line:i+1,code:opts[i]})),blocks},null,2));
