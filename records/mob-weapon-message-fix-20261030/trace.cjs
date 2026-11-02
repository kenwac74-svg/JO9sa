'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync('G:/Codex/tmp/mob-weapon-message-fix-20261030/candidate.qsp'));
for(const name of ['рассчет_вреда','искусственный_идиот']){const l=d.locations.find(x=>x.name===name),lines=c.shift(d.lines[l.body],5).split('\r\n');console.log(JSON.stringify({name,lines:lines.map((text,i)=>({line:i+1,text})).filter(x=>name==='рассчет_вреда'?true:x.line>=27&&x.line<=91)},null,2));}
