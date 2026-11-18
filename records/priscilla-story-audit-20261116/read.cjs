'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const get=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const city=get('interaction_city'),start=city.indexOf('IF interaction_city = 6025:'),end=city.indexOf('IF interaction_city = 1010:',start),scene=city.slice(start,end);
fs.writeFileSync(__dirname+'/scene.txt',scene);
console.log('REWARD SCENE\n'+scene.split('\n').map((line,i)=>(i+1)+': '+line.slice(0,1050)).join('\n'));
const hits=[];for(const l of d.locations){let lines=get(l.name).split('\n');for(let i=0;i<lines.length;i++)if(/witch_talk|\b6025\b|npc_progress\[['"]witch['"]|active\[\$quest\[(?:14|15)\]\]/i.test(lines[i])&&!/^\s*\$(?:text|.*pref|.*info|.*description)/i.test(lines[i]))hits.push({location:l.name,line:i+1,code:lines[i].slice(0,400)});}
fs.writeFileSync(__dirname+'/references.json',JSON.stringify({hash:d.hash,hits},null,2));
console.log('REFERENCES\n'+JSON.stringify(hits));
