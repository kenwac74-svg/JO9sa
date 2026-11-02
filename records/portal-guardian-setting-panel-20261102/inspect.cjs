'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),d=c.parse(raw);
console.log('BASELINE '+c.hash(raw));
const get=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
for(const n of ['#place_base','#options']){
 const ls=get(n).split('\r\n');
 for(let i=0;i<ls.length;i++)if(/fogs_battle2|edge_of_mists\[6216\]/.test(ls[i]))console.log('\nLOCATION '+n+' LINE '+(i+1)+'\n'+ls.slice(Math.max(0,i-3),Math.min(ls.length,i+8)).join('\r\n'));
}
const city=get('interaction_city'),lines=city.split('\r\n');
for(let i=0;i<lines.length;i++)if(/IF interaction_city = 62172:/.test(lines[i]))console.log('\nINTERACTION '+(i+1)+'\n'+lines.slice(i,i+36).join('\r\n'));
for(const l of d.locations){const ls=get(l.name).split('\r\n');for(let i=0;i<ls.length;i++)if(/strazhnik|бой_со_стражником|бой_с_стражником/.test(ls[i])&&l.name!=='interaction_city'&&l.name!=='#place_base')console.log(l.name+' '+(i+1)+' '+ls.slice(Math.max(0,i-2),Math.min(ls.length,i+5)).join('\r\n'));}
