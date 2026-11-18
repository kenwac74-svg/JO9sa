'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const get=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
for(const [n,lo,hi]of [['interaction_city',23918,24048],['city_menu_form',716,746],['city_menu_form',1135,1164]]){console.log('\n'+n);console.log(get(n).split('\n').slice(lo,hi).map((s,i)=>(lo+i+1)+': '+s.slice(0,360)).join('\n'));}
let hits=[];for(let l of d.locations){let a=get(l.name).split('\n');for(let i=0;i<a.length;i++)if(/portal_guardian|witch_talk|active\[\$quest\[17\]\]|go_home|game_end/.test(a[i])&&!/^\s*\$(?:text|.*description|.*info|.*name)/i.test(a[i]))hits.push({location:l.name,line:i+1,text:a[i].slice(0,300)});}
fs.writeFileSync(__dirname+'/endings.json',JSON.stringify(hits,null,2));console.log('END REFS',JSON.stringify(hits.slice(0,35)));
