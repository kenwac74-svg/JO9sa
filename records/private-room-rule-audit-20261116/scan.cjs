const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),d=c.parse(raw),terms=process.argv.slice(2),re=new RegExp(terms.length?terms.join('|'):'소변기|육변기|urinal|toilet','i');
let count=0;
for(const loc of d.locations){const b=c.shift(d.lines[loc.body],5),lines=b.split(/\r?\n/);for(let i=0;i<lines.length;i++)if(re.test(lines[i])){console.log(loc.name+':'+(i+1)+' '+lines[i].slice(0,250));count++;}}
console.log('Matches: '+count+'; SHA256: '+c.hash(raw));
