'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const get=n=>{let l=d.locations.find(x=>x.name===n);return c.shift(d.lines[l.body],5);};
for(let l of d.locations){let a=get(l.name).split('\n');for(let i=0;i<a.length;i++)if((/witch_talk|interaction_city\s*=\s*6025|^\s*revolution\s*=\s*1/.test(a[i])&&!/^\s*\$(?:text|.*pref)/i.test(a[i])))console.log(l.name+':'+(i+1)+' '+a.slice(Math.max(0,i-2),i+3).map(s=>s.slice(0,180)).join(' | '));}
let a=get('interaction_result_city').split('\n');console.log('COMPLEX SALE');console.log(a.slice(204,276).filter(s=>!/^\s*!/.test(s)).map(s=>s.slice(0,220)).join('\n'));
let b=get('#npc_base').split('\n');console.log('AMARIDA TERMS');console.log(b.map((s,i)=>({s,i})).filter(x=>/\['Amarida'\]/i.test(x.s)&&!/pref|buy_quote|npc_info/.test(x.s)).map(x=>(x.i+1)+':'+x.s.slice(0,230)).join('\n'));
