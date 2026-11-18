'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const [name,lo,hi]of [['interaction_city',23983,24002],['#options',7242,7280],['interaction_city',23642,23691]]){let l=d.locations.find(x=>x.name===name),a=c.shift(d.lines[l.body],5).split('\n');console.log(name+'\n'+a.slice(lo,hi).map((s,i)=>(lo+i+1)+': '+s.slice(0,650)).join('\n'));}
