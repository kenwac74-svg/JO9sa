'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const get=n=>{let l=d.locations.find(x=>x.name===n);return l?c.shift(d.lines[l.body],5):'';};
function show(n,lo,hi){let a=get(n).split('\n');console.log('\n'+n);console.log(a.slice(lo,hi).map((s,i)=>({s,i:lo+i+1})).filter(x=>!/^\s*\$(text|.*pref)/i.test(x.s)).map(x=>x.i+': '+x.s.slice(0,240)).join('\n'));}
show('interaction_city',24300,24343);show('#options',7290,7325);
let hits=[];
for(let l of d.locations){let a=get(l.name).split('\n');for(let i=0;i<a.length;i++)if((/Amarida|witch_talk|interaction_city = 6025/.test(a[i])&&!/pref|^\s*\$(?:text|sp_text|npc_info|npc_status|npc_name|place_info|jo9_rs)/i.test(a[i]))||(/npc_progress\[\$npc_id\]\s*=/.test(a[i])&&['slave_sell','interaction_result_city'].includes(l.name)))hits.push({loc:l.name,line:i+1,context:a.slice(Math.max(0,i-3),i+5)});}
fs.writeFileSync(__dirname+'/state-trace.json',JSON.stringify(hits,null,2));
for(let h of hits)if(['slave_sell','interaction_result_city','$newloc'].includes(h.loc))console.log(h.loc+':'+h.line+'\n'+h.context.map(s=>s.slice(0,240)).join('\n'));
show('slave_sell_chek',970,1010);
