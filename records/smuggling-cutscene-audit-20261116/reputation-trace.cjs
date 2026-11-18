'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),hits=[];
for(const l of d.locations){let lines=c.shift(d.lines[l.body],5).split('\n');for(let i=0;i<lines.length;i++)if(/guild_reputation(?:_rate)?\s*(?:-=|=\s*-)/i.test(lines[i])&&!/^\s*!/.test(lines[i]))hits.push({location:l.name,line:i+1,code:lines[i].slice(0,270),context:lines.slice(Math.max(0,i-5),i+7)});}
fs.writeFileSync(__dirname+'/reputation-trace.json',JSON.stringify(hits,null,2));
console.log(JSON.stringify(hits.map(({context,...r})=>r)));
