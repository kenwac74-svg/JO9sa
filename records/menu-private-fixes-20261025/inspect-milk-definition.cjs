const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/Codex/tmp/menu-private-fixes-20261025/candidate-final.qsp'));
for(const n of ['#var_base']){const l=d.locations.find(x=>x.name===n),s=c.shift(d.lines[l.body],5).split(/\r?\n/);for(let i=0;i<s.length;i++)if(s[i].includes('_milk_quantity'))console.log(n+':'+(i+1)+': '+s[i]);}
