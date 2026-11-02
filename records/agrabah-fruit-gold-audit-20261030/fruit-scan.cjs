'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const files={work:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original:'G:/somi/JO9O/game/jack.qsp'};
const all={};for(const [k,p] of Object.entries(files)){const d=c.parse(fs.readFileSync(p));all[k]={hash:d.hash,locations:d.locations.map(l=>({name:l.name,lines:c.shift(d.lines[l.body],5).split(/\r?\n/)}))};}
const hits=[];for(const [version,d] of Object.entries(all))for(const l of d.locations)for(let i=0;i<l.lines.length;i++)if(/과일|아그라바|금화|gold|agrab|ag(r|h)ab|fruits?/i.test(l.lines[i]))hits.push({version,location:l.name,line:i+1,text:l.lines[i].slice(0,500)});
fs.writeFileSync(__dirname+'/fruit-scan.json',JSON.stringify({hashes:Object.fromEntries(Object.entries(all).map(([k,v])=>[k,v.hash])),hits},null,2));
console.log(hits.filter(x=>x.version==='work'&&/과일|gold|fruits?/i.test(x.text)).map(x=>JSON.stringify(x)).slice(0,150).join('\n'));
