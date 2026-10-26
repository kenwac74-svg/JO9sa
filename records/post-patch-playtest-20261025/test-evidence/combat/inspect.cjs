'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const spec of process.argv.slice(2)) {
 const [n,anchor,length]=spec.split('|'),l=d.locations.find(x=>x.name===n);
 if(!l){console.log('MISSING '+n);continue;}
 const b=c.shift(d.lines[l.body],5),ix=anchor?b.indexOf(anchor):0;
 console.log('LOCATION '+n+'\n'+b.slice(Math.max(0,ix),length?Math.max(0,ix)+Number(length):undefined));
}
