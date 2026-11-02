'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const doc=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const locs=doc.locations.map(l=>({name:l.name,body:c.shift(doc.lines[l.body],5)}));
for(const loc of locs){
 const lines=loc.body.split(/\r?\n/),indices=[];
 for(let i=0;i<lines.length;i++)if(/stock_to_slave_nogt|stack_to_slave_nogt/.test(lines[i]))indices.push(i);
 if(loc.name==='stock_to_slave_nogt'){
  fs.writeFileSync(__dirname+'/stock_to_slave_nogt.txt',loc.body);
  console.log('TRANSFER\n'+lines.map((s,i)=>(i+1)+': '+s).join('\n'));
 }else if(indices.length){
  console.log('CALLERS',loc.name);
  for(const i of indices)console.log(lines.slice(Math.max(0,i-9),i+9).map((s,n)=>(Math.max(0,i-9)+n+1)+': '+s).join('\n'));
 }
}
