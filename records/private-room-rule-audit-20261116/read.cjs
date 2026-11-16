const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const [name,start='1',end='100']=process.argv.slice(2),loc=d.locations.find(l=>l.name===name);
if(!loc){console.log(d.locations.filter(l=>/stat|mood|private|next_day|rooms/.test(l.name)).map(l=>l.name).join('\n'));process.exit(0);}
const lines=c.shift(d.lines[loc.body],5).split(/\r?\n/);
for(let i=Number(start)-1;i<Math.min(lines.length,Number(end));i++)console.log(name+':'+(i+1)+' '+lines[i].slice(0,230));
