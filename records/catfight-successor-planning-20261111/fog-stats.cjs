'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
console.log(JSON.stringify({sha256:d.hash,locations:d.locations.length}));
const l=d.locations.find(l=>l.name==='#противники'),lines=c.shift(d.lines[l.body],5).split(/\r?\n/);
const ids=['исчадие_молодь','исчадие','чудовщиное_исчадие','исчадие_арены'];
const result={qspSha256:d.hash,location:'#противники',monsters:[]};
for(const id of ids){const tag="['"+id+"']",values={},sources={};for(let i=0;i<lines.length;i++){const s=lines[i].trim();if(!s.includes(tag)||s.startsWith('!'))continue;const at=s.indexOf(tag),key=s.slice(0,at),value=s.slice(at+tag.length).match(/^\s*=\s*([+-]?\d+)\s*$/);if(value){values[key]=Number(value[1]);sources[key]=i+1;}}result.monsters.push({id,values,sources});}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.monsters.map(m=>({id:m.id,hp:m.values['базовое_здоровье'],stamina:m.values['базовая_выносливость'],morale:m.values['базовый_дух'],damage:m.values['базовый_вред']}))));
