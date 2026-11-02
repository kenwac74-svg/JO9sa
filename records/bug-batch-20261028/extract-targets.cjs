const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const loc of d.locations){const body=c.shift(d.lines[loc.body],5);if(['jo9_traits_value','jo9_sale_cap','slave_auction_sell','stock_to_slave_nogt','выход_из_боя'].includes(loc.name))fs.writeFileSync(__dirname+'/'+loc.name.replace(/[^a-z0-9_-]/gi,'_')+'.txt',body);
if(loc.name==='interaction_city'){const lines=body.split(/\r?\n/);fs.writeFileSync(__dirname+'/auction-city.txt',lines.slice(12670,12980).map((s,i)=>(i+12671)+': '+s).join('\n'));}
if(loc.name==='#options'){const lines=body.split(/\r?\n/);for(let i=0;i<lines.length;i++)if(/stock_to_slave/.test(lines[i]))console.log('OPTIONS',i+1,lines.slice(Math.max(0,i-12),i+8).join('\n'));}
}
