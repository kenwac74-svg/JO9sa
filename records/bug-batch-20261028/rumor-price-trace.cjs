const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const l of d.locations){const body=c.shift(d.lines[l.body],5),lines=body.split(/\r?\n/);
if(['$slave_price','slave_sell','slave_sell_chek','slave_sell_finish','$npc_slave_price','jo9_sale_cap'].includes(l.name)){fs.writeFileSync(__dirname+'/'+l.name.replace(/[^a-z0-9_-]/gi,'_')+'.txt',body);console.log('LOC',l.name);for(let i=0;i<lines.length;i++)if(/price|sell_|payment|sparks|npc_id|stat_importance|demand_rating/.test(lines[i])&&!/^\s*!/.test(lines[i]))console.log((i+1)+': '+lines[i].slice(0,450));}
if(l.name==='#dynamic'){const n=lines.findIndex(s=>/^\$update_slave_price\s*=/.test(s));if(n>=0)fs.writeFileSync(__dirname+'/update-slave-price.txt',lines.slice(n,n+600).map((s,i)=>(n+i+1)+': '+s).join('\n'));}
}
