'use strict';
const fs=require('node:fs');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=core.parse(fs.readFileSync('G:/Codex/tmp/jo9-independent-qa-r2-20261105/qsp/jack.qsp'));
const r=JSON.parse(fs.readFileSync(__dirname+'/static-syntax.json','utf8'));
for(const issue of r.issues){const l=d.locations.find(x=>x.name===issue.location),lines=core.shift(d.lines[l.body],5).split('\r\n');console.log('\nLOCATION '+l.name);for(const e of issue.errors){console.log(e.code+' @ '+e.line);console.log(lines.slice(Math.max(0,e.line-7),e.line+3).map((s,i)=>(Math.max(0,e.line-7)+i+1)+': '+s).join('\n'));}}
for(const name of ['jo9_traits_value','interaction_city']){const l=d.locations.find(x=>x.name===name),s=core.shift(d.lines[l.body],5);console.log('\nHARD TRAIT '+name);for(const m of s.matchAll(/! JO9 MOD START HARD_TRAIT_PRICE_20261104[\s\S]*?! JO9 MOD END HARD_TRAIT_PRICE_20261104/g))console.log(m[0]);}
