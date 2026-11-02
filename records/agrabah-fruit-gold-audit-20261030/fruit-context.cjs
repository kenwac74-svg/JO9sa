'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
let ev=[];
for(const [v,p] of [['work','G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'],['original','G:/somi/JO9O/game/jack.qsp']]){
const d=c.parse(fs.readFileSync(p));for(const l of d.locations){const ls=c.shift(d.lines[l.body],5).split(/\r?\n/);
for(let i=0;i<ls.length;i++){
const s=ls[i];
if(/^\s*\$event\[['"]Akabur_quest['"]\]\s*=/.test(s)||((/\$place\s*=\s*['"]balsam_boutique/.test(s)||/interaction_city\s*=\s*3021[123]/.test(s)||/if.*sp_txt\s*=\s*3/i.test(s))&&l.name==='#options'))ev.push({version:v,loc:l.name,line:i+1,text:s});
if(v==='work'&&l.name==='interaction_city'&&i>=26818&&i<=26924&&!/^\s*\$text/.test(s))ev.push({version:v,loc:l.name,line:i+1,text:s});
}}
}
fs.writeFileSync(__dirname+'/fruit-context.json',JSON.stringify(ev,null,2));console.log(ev.map(x=>JSON.stringify(x)).join('\n'));
