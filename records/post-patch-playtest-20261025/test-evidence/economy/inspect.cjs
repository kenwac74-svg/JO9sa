const fs=require('node:fs');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');
const d=c.parse(raw);
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
if(process.argv[2]==='names')console.log(d.locations.map(x=>x.name).join('\n'));
else for(const n of process.argv.slice(2)){
 const b=body(n);fs.writeFileSync(__dirname+'/'+n.replaceAll('$','DOLLAR').replaceAll('#','HASH')+'.txt',b);
 console.log(n,b.length);
}
