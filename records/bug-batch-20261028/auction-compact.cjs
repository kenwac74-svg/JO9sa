'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const locs=d.locations.map(l=>({name:l.name,body:c.shift(d.lines[l.body],5)}));
for(const loc of locs){
 const lines=loc.body.split(/\r?\n/);const hits=[];
 for(let i=0;i<lines.length;i++)if(/auction|slave_to_stack|stack_to_stock|stock_to_stack|return_auction/.test(lines[i])&&!/^\s*!/.test(lines[i]))hits.push({line:i+1,text:lines[i].slice(0,440)});
 if(hits.length){console.log('LOC',loc.name,'HITS',hits.length);console.log(JSON.stringify(hits.slice(0,65)));}
}
for(const name of ['jo9_rumor_scan','jo9_rumor_match','dealer_economy','jo9_dealer_economy','$slave_price']){
 const loc=locs.find(l=>l.name===name);if(loc){fs.writeFileSync(__dirname+'/'+name.replace(/[^a-z0-9_-]/gi,'_')+'.txt',loc.body);if(name==='jo9_rumor_scan')console.log('SCAN\n'+loc.body);}
}
