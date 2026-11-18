'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const get=n=>{let l=d.locations.find(x=>x.name===n);return c.shift(d.lines[l.body],5);};
function show(n,a,lo,hi){console.log('\n'+n+' '+(lo+1)+'-'+hi);console.log(a.slice(lo,hi).map((s,i)=>({s,i:lo+i+1})).filter(x=>!/^\s*\$(?:text|special_image|sp_text)/i.test(x.s)&&!/^\s*!/.test(x.s)&&x.s.trim()).map(x=>x.i+': '+x.s.slice(0,240)).join('\n'));}
let a=get('interaction_city').split('\n');show('PRISCILLA',a,24340,24562);
let m=[...get('interaction_city').matchAll(/^[ \t]*if[ \t]+interaction_city[ \t]*=[ \t]*(\d+)[^\n]*/gim)];
const blocks=[];for(let i=0;i<m.length;i++){let id=m[i][1];if(!id.startsWith('10203'))continue;let s=get('interaction_city').slice(m[i].index,m[i+1]?.index??undefined);blocks.push({id,body:s});show('FASHION '+id,s.split('\n'),0,s.split('\n').length);}
fs.writeFileSync(__dirname+'/logic.json',JSON.stringify({hash:d.hash,priscilla:a.slice(24340,24562).join('\n'),fashion:blocks},null,2));
for(let n of ['#options','slave_sell_chek','end_day_screen']){let lines=get(n).split('\n');for(let i=0;i<lines.length;i++)if(/Amarida|witch_talk|Varvar_king|\b602[0-9]\b|rebellion/i.test(lines[i])&&!/^\s*\$(?:text|sp_text|.*pref|.*quest)/i.test(lines[i]))console.log(n+':'+(i+1)+' '+lines[i].slice(0,230));}
