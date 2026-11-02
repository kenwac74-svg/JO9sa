'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const d=c.parse(fs.readFileSync(process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(const l of d.locations){const a=c.shift(d.lines[l.body],5).split('\r\n');for(let i=0;i<a.length;i++)if(/\$death\s*=/.test(a[i]))console.log(JSON.stringify({loc:l.name,line:i+1,text:a.slice(i,i+17)}));}
const s=sc.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_GOLD_AP_CHECK_20261026.sav'));
console.log(JSON.stringify(s.variables?.filter?.(x=>String(x.name).toLowerCase().includes('death'))||'inspect schema'));
for(const n of ['refresh_database']){const l=d.locations.find(z=>z.name===n);console.log(n+'\n'+c.shift(d.lines[l.body],5))}
console.log(Object.keys(s));
const l=d.locations.find(z=>z.name==='end_day_screen'),a=c.shift(d.lines[l.body],5).split('\r\n');let ix=a.findIndex(z=>z.includes('parasite_slave_warned_before = 1:'));console.log(a.slice(ix-3,ix+45).map((z,i)=>(ix-2+i)+':'+z).join('\n'));
